const { db_Select, saveRecord } = require('../../model/pgcommon');
const express = require('express');
const bcrypt = require("bcrypt");
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

const memberCode = async (branch_id) => {

  const select = `
    COALESCE(MAX(SUBSTR(member_code::TEXT, 4)::INTEGER), 0) + 1 AS member_no
  `;

  const table = "bdccb.md_member";
  const res = await db_Select(select, table, null, null);

  const member_no = res.msg[0].member_no;

  const member_code = `${branch_id}${String(member_no).padStart(4, "0")}`;

  return member_code;
};
 
 
// fetch group details along with member
// groupRouter.post("/fetch_group_details", async (req, res) => {
//  try{
//   var data = req.body;
 
//   // search group list //
//   var select = "a.group_code,a.group_name,b.branch_name,a.direct_indirect_flag",
//   table_name = "bdccb.md_group a LEFT JOIN public.md_branch b ON a.branch_code = b.branch_id",
//   // whr = `a.branch_code = '${data.branch_code}' AND (a.group_name ILIKE '%${data.group_name}%' OR a.group_code::text ILIKE '%${data.group_name}%')`,
//   whr = `a.branch_code = '${data.branch_code}' AND a.delete_flag = 'N'
//   ${data.group_name && data.group_name.trim() !== "" 
//   ? `AND (a.group_name ILIKE '%${data.group_name}%' 
//   OR a.group_code::text ILIKE '%${data.group_name}%')`
//   : ""}`
//    order = null;
//    var search_group_web = await db_Select(select,table_name,whr,order);
 
//    if (search_group_web.suc !== 1 || search_group_web.msg.length === 0) {
//       return res.send({
//         success: true,
//         msg: "No group found",
//         data: []
//       });
//     }

//     // =====================================================
//     // IF ONLY BRANCH CODE PROVIDED RETURN GROUP LIST
//     // =====================================================
//     if (!data.group_name || data.group_name.trim() === "") {
//       return res.send({
//         success: true,
//         msg: "Group List",
//         data: search_group_web.msg
//       });
//     }
 
//     // Fetch full group details //

//     let groupCodes = search_group_web.msg
//   .map(g => `'${g.group_code}'`)
//   .join(",");
 
//    var select = "a.group_code,a.branch_code,b.branch_name,a.group_name,a.phone1,a.sahayika_id,d.sahayika_name,a.group_addr,a.dist_id,e.dist_name,a.block_id,f.block_name,a.ps_id,g.ps_name,a.po_id,h.post_name,a.gp_id,i.gp_name,a.village_id,j.vill_name,a.pin_no,a.open_close_flag,a.grp_open_dt,a.grp_close_dt,a.delete_flag",
//   table_name = "bdccb.md_group a LEFT JOIN public.md_branch b ON a.branch_code = b.branch_id LEFT JOIN bdccb.md_sahayika d ON a.sahayika_id = d.sahayika_id LEFT JOIN public.md_district e ON a.dist_id = e.dist_code LEFT JOIN public.md_block f ON a.block_id = f.block_id LEFT JOIN public.md_police_station g ON a.ps_id = g.ps_id LEFT JOIN public.md_postoffice h ON a.po_id = h.po_id LEFT JOIN public.md_gp i ON a.gp_id = i.gp_id LEFT JOIN public.md_village j ON a.village_id = j.vill_id",
//   whr = `a.group_code IN (${groupCodes}) AND a.branch_code = '${data.branch_code}' AND a.delete_flag = 'N'`,
//   order = null;
//   var fetch_group_data = await db_Select(select,table_name,whr,order);
 
//     if (fetch_group_data.suc !== 1 || fetch_group_data.msg.length === 0) {
//       return res.send({
//         success: true,
//         msg: "Failed to fetch group data",
//         data: []
//       });
//     }

//     // FETCH GROUP MEMBERS //  
//     var select = "member_code member_id,group_code,member_name,address,aadhar_no,gp_leader_flag,asst_gp_leader_flag,member_account_no as sb_acc_no",
//     table_name = "bdccb.md_member",
//     whr = `group_code IN (${groupCodes}) AND approval_status NOT IN ('R') AND delete_flag = 'N'`,
//     order = null;
//     var grp_mem_dt = await db_Select(select,table_name,whr,order);
//     // fetch_group_data.msg[0]['memb_dt'] = grp_mem_dt.suc > 0 ? (grp_mem_dt.msg.length > 0 ? grp_mem_dt.msg : []) : [];

//     // =====================================================
//     // MAP MEMBERS → RESPECTIVE GROUP
//     // =====================================================

//     fetch_group_data.msg.forEach((group) => {
//       group["memb_dt"] =
//         grp_mem_dt.suc === 1
//           ? grp_mem_dt.msg.filter(
//               (m) => m.group_code === group.group_code
//             )
//           : [];
//     });
 
//   if (fetch_group_data.suc === 1 && fetch_group_data.msg.length > 0) {
//       return res.send({
//         success: true,
//         msg: "Group List",
//         data: fetch_group_data.msg
//     });
//     } else {
//       return res.send({
//         success: true,
//         msg: "Failed to fetch group data",
//         data: []
//       });
//     }
//  }catch(error){
//    console.log("Error fetching group data:", error);
//    return res.send({
//     success: false,
//     msg: "Internal server error",
//     errorCode: "SERVER_ERROR"
//    });
//  }
// });


// fetch group details along with member
groupRouter.post("/fetch_group_details", async (req, res) => {
 try{
  var data = req.body;
 
  // search group list //
  var select = "a.group_code,a.group_name,a.direct_indirect_flag",
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

    let groupCodes = search_group_web.msg
  .map(g => `'${g.group_code}'`)
  .join(",");
 
   var select = "a.group_code,a.branch_code,b.branch_name,a.group_name,a.phone1,a.sahayika_id,d.sahayika_name,a.group_addr,a.dist_id,e.dist_name,a.block_id,f.block_name,a.ps_id,g.ps_name,a.po_id,h.post_name,a.gp_id,i.gp_name,a.village_id,j.vill_name,a.pin_no,a.open_close_flag,a.grp_open_dt,a.grp_close_dt,a.delete_flag,a.direct_indirect_flag,a.pacs_id,k.branch_name AS pacs_name",
  table_name = "bdccb.md_group a LEFT JOIN public.md_branch b ON a.branch_code = b.branch_id LEFT JOIN bdccb.md_sahayika d ON a.sahayika_id = d.sahayika_id LEFT JOIN public.md_district e ON a.dist_id = e.dist_code LEFT JOIN public.md_block f ON a.block_id = f.block_id LEFT JOIN public.md_police_station g ON a.ps_id = g.ps_id LEFT JOIN public.md_postoffice h ON a.po_id = h.po_id LEFT JOIN public.md_gp i ON a.gp_id = i.gp_id LEFT JOIN public.md_village j ON a.village_id = j.vill_id LEFT JOIN public.md_branch k ON a.pacs_id = k.branch_id",
  whr = `a.group_code IN (${groupCodes}) AND a.branch_code = '${data.branch_code}' AND a.delete_flag = 'N'`,
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
    var select = "member_code member_id,group_code,member_name,address,aadhar_no,gp_leader_flag,asst_gp_leader_flag,member_account_no as sb_acc_no",
    table_name = "bdccb.md_member",
    whr = `group_code IN (${groupCodes}) AND approval_status NOT IN ('R') AND delete_flag = 'N'`,
    order = null;
    var grp_mem_dt = await db_Select(select,table_name,whr,order);
    // fetch_group_data.msg[0]['memb_dt'] = grp_mem_dt.suc > 0 ? (grp_mem_dt.msg.length > 0 ? grp_mem_dt.msg : []) : [];

    // =====================================================
    // MAP MEMBERS → RESPECTIVE GROUP
    // =====================================================

    fetch_group_data.msg.forEach((group) => {
      group["memb_dt"] =
        grp_mem_dt.suc === 1
          ? grp_mem_dt.msg.filter(
              (m) => m.group_code === group.group_code
            )
          : [];
    });
 
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

// fetch group details in society level
groupRouter.post("/fetch_pacs_group_details", async (req, res) => {
 try{
  var data = req.body;
 
  // search group list //
  var select = "a.group_code,a.group_name,b.branch_name,a.direct_indirect_flag",
  table_name = "bdccb.md_group a LEFT JOIN public.md_branch b ON a.pacs_id = b.branch_id",
  whr = `a.pacs_id = '${data.branch_code}' AND a.delete_flag = 'N'
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

    let groupCodes = search_group_web.msg
  .map(g => `'${g.group_code}'`)
  .join(",");
 
   var select = "a.group_code,a.branch_code,b.branch_name,a.group_name,a.phone1,a.sahayika_id,d.sahayika_name,a.group_addr,a.dist_id,e.dist_name,a.block_id,f.block_name,a.ps_id,g.ps_name,a.po_id,h.post_name,a.gp_id,i.gp_name,a.village_id,j.vill_name,a.pin_no,a.open_close_flag,a.grp_open_dt,a.grp_close_dt,a.delete_flag,a.direct_indirect_flag,a.pacs_id,k.branch_name AS pacs_name",
  table_name = "bdccb.md_group a LEFT JOIN public.md_branch b ON a.branch_code = b.branch_id LEFT JOIN bdccb.md_sahayika d ON a.sahayika_id = d.sahayika_id LEFT JOIN public.md_district e ON a.dist_id = e.dist_code LEFT JOIN public.md_block f ON a.block_id = f.block_id LEFT JOIN public.md_police_station g ON a.ps_id = g.ps_id LEFT JOIN public.md_postoffice h ON a.po_id = h.po_id LEFT JOIN public.md_gp i ON a.gp_id = i.gp_id LEFT JOIN public.md_village j ON a.village_id = j.vill_id LEFT JOIN public.md_branch k ON a.pacs_id = k.branch_id",
  whr = `a.group_code IN (${groupCodes}) AND a.pacs_id = '${data.branch_code}' AND a.delete_flag = 'N'`,
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
    var select = "member_code member_id,group_code,member_name,address,aadhar_no,gp_leader_flag,asst_gp_leader_flag,member_account_no as sb_acc_no",
    table_name = "bdccb.md_member",
    whr = `group_code IN (${groupCodes}) AND approval_status NOT IN ('R') AND delete_flag = 'N'`,
    order = null;
    var grp_mem_dt = await db_Select(select,table_name,whr,order);
    // fetch_group_data.msg[0]['memb_dt'] = grp_mem_dt.suc > 0 ? (grp_mem_dt.msg.length > 0 ? grp_mem_dt.msg : []) : [];

    // =====================================================
    // MAP MEMBERS → RESPECTIVE GROUP
    // =====================================================

    fetch_group_data.msg.forEach((group) => {
      group["memb_dt"] =
        grp_mem_dt.suc === 1
          ? grp_mem_dt.msg.filter(
              (m) => m.group_code === group.group_code
            )
          : [];
    });
 
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

function validationError(res, msg) {
             return res.send({
                    success: false,
                    msg: msg,
                });
  }
groupRouter.get("/checkaddhar", async (req, res) => {
        const {aadhar_no } = req.query;
        if(!aadhar_no || aadhar_no.trim() === "" || aadhar_no.length !== 12){
            return  validationError(res, "Addhar number is required And must be 12 digits");
        }
        try {
            var whr = `aadhar_no='${aadhar_no}'`;
            var res_dt = await db_Select("*", "bdccb.md_member", whr, null);
            if(res_dt.msg.length > 0){
                return res.send({
                    success: true,
                    msg: "Member Already Exists",
                    user_status: 1
                });
            }else{
                return res.send({
                    success: true,
                    msg: "Member Available",
                    user_status: 0
                });
            }
        } catch (error) {
            console.error("Error in /checkuser route:", error);
            return res.send({
            success: false,
            msg: "Internal server error",
            errorCode: "SERVER_ERROR"
            });
        }
                    
  });

  groupRouter.get("/checacc_no", async (req, res) => {
        const {account_no } = req.query;
       
        if(!account_no || account_no.trim() === "" || account_no.length <= 2){
           return validationError(res, "Account number is required And must be greater than 2 digits");
        }
        try {
            var whr = `member_account_no='${account_no}'`;
            var res_dt = await db_Select("*", "bdccb.md_member", whr, null);
            
            if(res_dt.msg.length > 0){
               console.log('inside logic -------------------');
                return res.send({
                    success: true,
                    msg: "Account Already Exists",
                    user_status: 1
                });
            }else{
                return res.send({
                    success: true,
                    msg: "Account Available",
                    user_status: 0
                });
            }
        } catch (error) {
            console.error("Error in /checkuser route:", error);
            return res.send({
            success: false,
            msg: "Internal server error",
            errorCode: "SERVER_ERROR"
            });
        }
                    
  });

  // FETCH BRANCH NAME IN GROUP SECTION(DIRECT/INDIRECT LOAN)
  groupRouter.post("/fetch_branch_name", async (req, res) => {
    try{
     const {tenant_id, dist_id, branch_code} = req.body;

     var select = "tenant_id,branch_id,branch_name",
     table_name = "public.md_branch",
     whr = `tenant_id = '${tenant_id}' AND branch_id = '${branch_code}' AND branch_type = 'B' AND branch_status = 'O'`,
     order = `branch_id`;
     var fetch_brn_name = await db_Select(select,table_name,whr,order);

     if(fetch_brn_name.suc === 1 && fetch_brn_name.msg.length > 0){
        return res.send({
        success: true,
        msg: "Branch List",
        data: fetch_brn_name.msg
        });
     }else{
        return res.send({
        success: true,
        msg: "Failed to fetch branch List",
        data: []
        });
     }
    }catch(error){
      console.error("Error while fetch branch name", error);
      return res.send({
      success: false,
      msg: "Internal server error",
      errorCode: "SERVER_ERROR"
      });
    }
  });

  // FETCH PACS NAME BASED ON BRANCH
  groupRouter.post("/fetch_society_name", async (req, res) => {
    try{
     const {tenant_id, branch_id} = req.body;
    //  console.log(req.body);
     
     var select = "branch_id,branch_name",
     table_name = "public.md_branch",
     whr = `tenant_id = '${tenant_id}' AND branch_type = 'P' AND branch_status = 'O'
     AND branch_jurisdiction_id = '${branch_id}'`,
     order = null;
     var fetch_pacs_name = await db_Select(select,table_name,whr,order);

     if(fetch_pacs_name.suc === 1 && fetch_pacs_name.msg.length > 0){
        return res.send({
        success: true,
        msg: "Society List",
        data: fetch_pacs_name.msg
        });
     }else {
      return res.send({
        success: true,
        msg: "Failed to fetch society List",
        data: []
      });
     }
    }catch(error){
      console.error("Error while fetch pacs name based on branch", error);
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
      const { group_code,tenant_id,branch_code,group_name,phone1,sahayika_id,group_addr,dist_id,block_id,ps_id,po_id,gp_id,village_id,pin_no,members,created_by,ip_address,direct_indirect_flag,pacs_id } = req.body;
      console.log(req.body,'datagrp');
     
      let datetime = new Date().toISOString().slice(0, 19).replace('T', ' ');

      // member validation
      if (!members || members.length === 0) {
        return res.send({
          success: true,
          msg: "No members provided",
        });
      }
 
      let grp_code = group_code > 0 ? group_code : await groupCode(branch_code);

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
      const columns = group_code > 0 ? ["branch_code","group_name","phone1","sahayika_id","group_addr","dist_id","block_id","ps_id","po_id","gp_id","village_id","pin_no","modified_by","modified_at","ip_address","direct_indirect_flag","pacs_id"] : ["group_code","branch_code","group_name","phone1","sahayika_id","group_addr","dist_id","block_id","ps_id","po_id","gp_id","village_id","pin_no","open_close_flag","grp_open_dt","delete_flag","created_by","created_at","ip_address","direct_indirect_flag","pacs_id"];
      const values = group_code > 0 ? [branch_code,group_name || null,phone,sahayikaId,group_addr.replace(/'/g, "''"),distId,blockId,psId,poId,gpId,villageId,pin,created_by,datetime,ip_address,direct_indirect_flag,pacs_id] : [grp_code,branch_code,group_name,phone,sahayikaId,group_addr ? group_addr.replace(/'/g, "''") : null,distId,blockId,psId,poId,gpId,villageId,pin,'O',datetime,'N',created_by,datetime,ip_address,direct_indirect_flag,pacs_id];
      const whereColumns = group_code > 0 ? ["group_code"] : [];
      const whereValues = group_code > 0 ? [group_code] : [];
      const flag = group_code > 0 ? 1 : 0;
      const result = await saveRecord(table, columns, values,whereColumns,whereValues,flag);

      

      if (result.suc !== 1) {
      return res.send({
        success: true,
        msg: result.msg || (group_code > 0 ? "Failed to edit group" : "Failed to save group"),
        data : []
      });
    }

    for(const memb of members){

     let member_code = await memberCode(branch_code); 

     const table1 = "bdccb.md_member";
     const columns1 = memb.member_id > 0 ? ["branch_id","member_name","address","aadhar_no","modified_by","modified_at","ip_address","gp_leader_flag","asst_gp_leader_flag","member_account_no"] : ["member_code","branch_id","group_code","member_name","tenant_id","address","aadhar_no","delete_flag","approval_status","created_by","created_at","ip_address","gp_leader_flag","asst_gp_leader_flag","member_account_no"];
     const values1 = memb.member_id > 0 ? [direct_indirect_flag == 'I' ? pacs_id : branch_code,memb.member_name.toUpperCase() || null,memb.address.replace(/'/g, "''") || null,memb.aadhar_no || null,created_by,datetime,ip_address,memb.gp_leader_flag,memb.asst_gp_leader_flag,memb.sb_acc_no || null] : [member_code,direct_indirect_flag == 'I' ? pacs_id : branch_code,grp_code,memb.member_name.toUpperCase() || null,tenant_id,memb.address.replace(/'/g, "''") || null,memb.aadhar_no || null,'N','A',created_by,datetime,ip_address,memb.gp_leader_flag,memb.asst_gp_leader_flag,memb.sb_acc_no || null];
     const whereColumns1 = memb.member_id > 0 ? ["member_code","branch_id","group_code","tenant_id"] : [];
     const whereValues1 = memb.member_id > 0 ? [memb.member_id,branch_code,group_code,tenant_id] : [];
     const flag1 = memb.member_id > 0 ? 1 : 0;
       
     const result_member = await saveRecord(table1, columns1, values1,whereColumns1,whereValues1,flag1);  
       
  if (!result_member || result_member.suc !== 1) {
        return res.send({
          success: true,
          msg: memb.member_id > 0 ? "Failed to edit member" : "Failed to save member",
          data: []
        });
   }

   
      var acc_opening_dt = new Date().toISOString().slice(0, 10);
      var balance = 0;
      console.log('member id ', memb.sb_acc_no);
      const table2 = "bdccb.td_deposit";
      const columns2 = ["tenant_id","shg_id","branch_id","acc_no","acc_opening_dt","balance","created_by","created_at","created_ip"];
      const values2 = [tenant_id,grp_code,branch_code,memb.sb_acc_no,acc_opening_dt,balance,created_by,datetime,ip_address];
      const whereColumns2 = [];
      const whereValues2 = [];
      const flag2 = 0;
      const results = await saveRecord(table2, columns2, values2,whereColumns2,whereValues2,flag2);

      if(!results || results.suc !== 1){
        return res.send({
            success: true,
            msg: "Failed to save deposit details",
            data: []
          });
      }

      const table_trans = "bdccb.td_deposit_trans";
      const columns_trans = ["sb_id","tenant_id","branch_id","acc_no","trans_dt","dep_with_flag","dr_amt","cr_amt","balance","remarks","created_by","created_at","created_ip"];
      const values_trans = [results.lastId,tenant_id,branch_code,memb.sb_acc_no,datetime,'D',0,balance,balance,'Opening ACC',created_by,datetime,ip_address];
      const whereColumns_trans = [];
      const whereValues_trans = [];
      const flag_trans = 0;
      const result_trans = await saveRecord(table_trans,columns_trans,values_trans,whereColumns_trans,whereValues_trans,flag_trans);
    
    
      if(!result_trans || result_trans.suc !== 1){
        return res.send({
            success: true,
            msg: "Failed to save transaction details",
            data: []
          });
      }
    }

       //code for creating user of shg using leader mobile number and default password
      if(phone && phone.length == 10){
        const hashedDefaultPassword = await bcrypt.hash('bdccb1234', 10);
        const columns3 = group_code > 0 ? ["user_id","phone_mobile","modified_by","modified_at","modified_ip"] :["user_id","tenant_id","brn_code","user_type","user_name","phone_mobile","active_flag","password","created_by","created_at","ip_address","shg_id"];
        const values3 = group_code > 0 ? [phone,phone,created_by,datetime,ip_address] :[phone, tenant_id, branch_code, 'S',group_name, phone, 'Y', hashedDefaultPassword, created_by, datetime, ip_address,grp_code];
        const whereColumns3 = group_code > 0 ? ["shg_id"] : [];
        const whereValues3 = group_code > 0 ? [grp_code] : [];
        const flag3 = group_code > 0 ? 1 : 0;
        const result_user = await saveRecord("bdccb.md_user", columns3, values3,whereColumns3,whereValues3,flag3);
        console.log("User creation result:", result_user);
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