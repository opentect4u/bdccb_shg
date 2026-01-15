const { db_Select, saveRecord } = require('../../model/pgcommon');
const express = require('express'),
groupRouter = express.Router();


// create group code
const groupCode = async (branch_code) => {
  const select = `
    COALESCE(
      MAX(
        CAST(SUBSTRING(group_code FROM 4) AS INTEGER)
      ),
      0
    ) + 1 AS next_no
  `;

  const table_name = "bdccb.md_group";
  const whr = `branch_code = '${branch_code}'`;

  const res_dt = await db_Select(select, table_name, whr, null);

  const nextNo = res_dt.msg[0].next_no;

  return `${branch_code}${nextNo}`;
};




// fetch group details
groupRouter.post("/fetch_group_details", async (req, res) => {
 try{
  var data = req.body;

  var select = "a.group_code,a.group_name,b.branch_name",
  table_name = "md_group a LEFT JOIN md_branch b ON a.branch_code = b.branch_id",
  whr = `a.branch_code = '${data.branch_code}' AND (a.group_name like '%${data.group_name}%' OR a.group_code like '%${data.group_name}%')`,
   order = null;
   var search_group_web = await db_Select(select,table_name,whr,order);

   if (search_group_web.suc !== 1 || search_group_web.msg.length === 0) {
      return res.send({
        success: false,
        msg: "No group found"
      });
    }

   var select = "a.group_code,a.branch_code,b.branch_name,a.group_name,a.gp_leader_id,c.member_name group_leader_name,a.phone1,a.sahayika_id,d.sahayika_name,a.group_addr,a.dist_id,e.dist_name,a.block_id,f.block_name,a.ps_id,g.ps_name,a.po_id,h.post_name,a.gp_id,i.gp_name,a.village_id,j.vill_name,a.pin_no,a.sb_ac_no,a.open_close_flag,a.grp_open_dt,a.grp_close_dt,a.delete_flag",
  table_name = "md_group a LEFT JOIN md_branch b ON a.branch_code = b.branch_id LEFT JOIN md_member c ON a.group_leader_id = c.member_code LEFT JOIN md_sahayika d ON a.sahayika_id = d.sahayika_id LEFT JOIN md_district e ON a.dist_id = e.dist_code LEFT JOIN md_block f ON a.block_id = f.block_id LEFT JOIN md_police_station g ON a.ps_id = g.ps_id LEFT JOIN md_postoffice h ON a.po_id = h.po_id LEFT JOIN md_gp i ON a.gp_id = i.gp_id LEFT JOIN md_village j ON a.village_id = j.vill_id",
  whr = `a.group_code = '${data.group_code}' AND a.branch_code = '${data.branch_code}'`,
  order = null;
  var fetch_group_data = await db_Select(select,table_name,whr,order);
 
  if (fetch_group_data.suc === 1 && fetch_group_data.msg.length > 0) {
      return res.send({
        success: true,
        msg: "Group List",
        data: fetch_group_data.msg
    });
    } else {
      return res.send({
        success: false,
        msg: "Failed to fetch group data"
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
      const { branch_code,group_name,gp_leader_id,phone1,sahayika_id,group_addr,dist_id,block_id,ps_id,po_id,gp_id,village_id,pin_no,sb_ac_no,created_by,ip_address } = req.body;
      console.log(req.body,'data');
      
      let datetime = new Date().toISOString().slice(0, 19).replace('T', ' ');
      let group_code = await groupCode(branch_code);

      const table = "bdccb.md_group";
      const columns = ["group_code","branch_code","group_name","gp_leader_id","phone1","sahayika_id","group_addr","dist_id","block_id","ps_id","po_id","gp_id","village_id","pin_no","sb_ac_no","open_close_flag","grp_open_dt","delete_flag","created_by","created_at","ip_address"];
      const values = [group_code,branch_code,group_name,gp_leader_id,phone1,sahayika_id,group_addr,dist_id,block_id,ps_id,po_id,gp_id,village_id,pin_no,sb_ac_no,'O',datetime,'N',created_by,datetime,ip_address];
      const whereColumns = group_code > 0 ? ["group_code"] : [];
      const whereValues = group_code > 0 ? [group_code] : [];
      const flag = group_code > 0 ? 1 : 0;
      const result = await saveRecord(table, columns, values,whereColumns,whereValues,flag);
      return res.send({
        success: true,
        msg: "Record Inserted Successfully",
        data: result.lastId
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