const { db_Select, saveRecord } = require('../../model/pgcommon');
const express = require('express'),
groupRouter = express.Router();
 
 
// create group code
// const groupCode = async (branch_code) => {
//   const select = `
//     COALESCE(
//       MAX(
//         CAST(group_code AS INTEGER)
//       ),
//       0
//     ) + 1 AS group_no
//   `;
 
//   const table_name = "bdccb.md_group";
//   const res_dt = await db_Select(select, table_name, null, null);
 
//   const group_no = res_dt.msg[0].group_no;
 
//   // const group_code = `${branch_code}${String(group_no).padStart(2, "0")}`;
//   const group_code = `${branch_code}${String(group_no)}`;
//   // console.log(group_code,'grrr');
 
//   return group_code;
// };
 
const groupCode = async (branch_code) => {
 
  const select = `
    COALESCE(MAX(SUBSTR(group_code::TEXT, 4)::INTEGER), 0) + 1 AS group_no
  `;
 
  const table = "bdccb.md_group";
  const res = await db_Select(select, table, null, null);
 
  const group_no = res.msg[0].group_no;
 
  const group_code = `${branch_code}${String(group_no).padStart(4, "0")}`;
 
  return group_code;
};
 
 
// fetch group details
groupRouter.post("/fetch_group_details", async (req, res) => {
 try{
  var data = req.body;
 
  // search group list //
  var select = "a.group_code,a.group_name,b.branch_name",
  table_name = "bdccb.md_group a LEFT JOIN public.md_branch b ON a.branch_code = b.branch_id",
  // whr = `a.branch_code = '${data.branch_code}' AND (a.group_name ILIKE '%${data.group_name}%' OR a.group_code::text ILIKE '%${data.group_name}%')`,
  whr = `a.branch_code = '${data.branch_code}' AND a.delete_flag = 'N'
  ${data.group_name && data.group_name.trim() !== "" 
  ? `AND (a.group_name ILIKE '%${data.group_name}%' 
  OR a.group_code::text ILIKE '%${data.group_name}%')`
  : ""}`
   order = null;
   var search_group_web = await db_Select(select,table_name,whr,order);
 
   if (search_group_web.suc !== 1 || search_group_web.msg.length === 0) {
      return res.send({
        success: true,
        msg: "No group found",
        data: []
      });
    }

    // =====================================================
    // IF ONLY BRANCH CODE PROVIDED RETURN GROUP LIST
    // =====================================================
    if (!data.group_name || data.group_name.trim() === "") {
      return res.send({
        success: true,
        msg: "Group List",
        data: search_group_web.msg
      });
    }
 
    // Fetch full group details //
 
   var select = "a.group_code,a.branch_code,b.branch_name,a.group_name,a.phone1,a.sahayika_id,d.sahayika_name,a.group_addr,a.dist_id,e.dist_name,a.block_id,f.block_name,a.ps_id,g.ps_name,a.po_id,h.post_name,a.gp_id,i.gp_name,a.village_id,j.vill_name,a.pin_no,a.sb_ac_no,a.open_close_flag,a.grp_open_dt,a.grp_close_dt,a.delete_flag",
  table_name = "bdccb.md_group a LEFT JOIN public.md_branch b ON a.branch_code = b.branch_id LEFT JOIN bdccb.md_sahayika d ON a.sahayika_id = d.sahayika_id LEFT JOIN public.md_district e ON a.dist_id = e.dist_code LEFT JOIN public.md_block f ON a.block_id = f.block_id LEFT JOIN public.md_police_station g ON a.ps_id = g.ps_id LEFT JOIN public.md_postoffice h ON a.po_id = h.po_id LEFT JOIN public.md_gp i ON a.gp_id = i.gp_id LEFT JOIN public.md_village j ON a.village_id = j.vill_id",
  whr = `a.group_code = '${search_group_web.msg[0].group_code}' AND a.branch_code = '${data.branch_code}' AND a.delete_flag = 'N'`,
  order = null;
  var fetch_group_data = await db_Select(select,table_name,whr,order);
 
    if (fetch_group_data.suc !== 1 || fetch_group_data.msg.length === 0) {
      return res.send({
        success: true,
        msg: "Failed to fetch group data",
        data: []
      });
    }

    // FETCH GROUP MEMBERS //  
    var select = "member_code,member_name,group_code,approval_status,gp_leader_flag",
    table_name = "bdccb.md_member",
    whr = `group_code = '${search_group_web.msg[0].group_code}' AND approval_status NOT IN ('R') AND delete_flag = 'N'`,
    order = null;
    var grp_mem_dt = await db_Select(select,table_name,whr,order);
    fetch_group_data.msg[0]['memb_dt'] = grp_mem_dt.suc > 0 ? (grp_mem_dt.msg.length > 0 ? grp_mem_dt.msg : []) : [];
 
  if (fetch_group_data.suc === 1 && fetch_group_data.msg.length > 0) {
      return res.send({
        success: true,
        msg: "Group List",
        data: fetch_group_data.msg
    });
    } else {
      return res.send({
        success: true,
        msg: "Failed to fetch group data",
        data: []
      });
    }
 }catch(error){
   console.log("Error fetching group data:", error);
   return res.send({
    success: false,
    msg: "Internal server error",
    errorCode: "SERVER_ERROR"
   });
 }
});
 
// save / edit group
groupRouter.post("/save_group", async (req, res) => {
    try {
      const { group_code,branch_code,group_name,phone1,sahayika_id,group_addr,dist_id,block_id,ps_id,po_id,gp_id,village_id,pin_no,sb_ac_no,created_by,ip_address } = req.body;
      // console.log(req.body,'datagrp');
     
      let datetime = new Date().toISOString().slice(0, 19).replace('T', ' ');
 
      let grp_code = await groupCode(branch_code);

      const distId = dist_id === "" ? null : dist_id;
      const blockId = block_id === "" ? null : block_id;
      const psId = ps_id === "" ? null : ps_id;
      const poId = po_id === "" ? null : po_id;
      const gpId = gp_id === "" ? null : gp_id;
      const villageId = village_id === "" ? null : village_id;
      const sahayikaId = sahayika_id === "" ? null : sahayika_id;
      const phone = phone1 ? phone1.toString() : null;
      const pin = pin_no ? pin_no.toString() : null;
 
      const table = "bdccb.md_group";
      const columns = group_code > 0 ? ["branch_code","group_name","phone1","sahayika_id","group_addr","dist_id","block_id","ps_id","po_id","gp_id","village_id","pin_no","sb_ac_no","modified_by","modified_at","ip_address"] : ["group_code","branch_code","group_name","phone1","sahayika_id","group_addr","dist_id","block_id","ps_id","po_id","gp_id","village_id","pin_no","sb_ac_no","open_close_flag","grp_open_dt","delete_flag","created_by","created_at","ip_address"];
      const values = group_code > 0 ? [branch_code,group_name || null,phone,sahayikaId,group_addr,distId,blockId,psId,poId,gpId,villageId,pin,sb_ac_no || null,created_by,datetime,ip_address] : [grp_code,branch_code,group_name,phone,sahayikaId,group_addr,distId,blockId,psId,poId,gpId,villageId,pin,sb_ac_no || null,'O',datetime,'N',created_by,datetime,ip_address];
      const whereColumns = group_code > 0 ? ["group_code"] : [];
      const whereValues = group_code > 0 ? [group_code] : [];
      const flag = group_code > 0 ? 1 : 0;
      const result = await saveRecord(table, columns, values,whereColumns,whereValues,flag);

      if (result.suc !== 1) {
      return res.send({
        success: true,
        msg: result.msg || "Failed to save group",
        data : []
      });
    }

      return res.send({
        success: true,
        msg: group_code > 0 ? "Record Updated Successfully" : "Record Inserted Successfully",
        // data: result.lastId
      });
      } catch (error) {
        console.error("Error in while save group:", error);
        return res.send({
        success: false,
        msg: "Internal server error",
        errorCode: "SERVER_ERROR"
       });
      }
});
 
 
module.exports = {groupRouter}