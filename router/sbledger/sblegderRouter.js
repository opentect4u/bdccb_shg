const express = require("express"),
sbledgerRouter = express.Router();

const { db_Select, saveRecord, deleteRecord } = require("../../model/pgcommon");

// FETCH GROUP DETAILS
sbledgerRouter.post("/search_sb_shg_grp_view", async (req, res) => {
    try{
    const {tenant_id,branch_code,group_name_view,branch_type} = req.body;

    let branchCondition = '';
    let branchConditions = '';

    if (branch_type === 'B') {
    branchCondition = `a.branch_code = '${branch_code}'`;
    } else if (branch_type === 'H') {
    branchCondition = `a.branch_code IN (select branch_id from public.md_branch where branch_status = 'O' AND branch_type IN ('P', 'B'))`;
    } else if (branch_type === 'P'){
    branchCondition = `a.pacs_id = '${branch_code}'`;
    }

    if(branch_type === 'B'){
    branchConditions = `a.branch_code = '${branch_code}'`;
    }else if (branch_type === 'H') {
    branchConditions = `a.branch_code IN (select branch_id from public.md_branch where branch_status = 'O' AND branch_type IN ('P', 'B'))`;
    }else if (branch_type === 'P'){
    branchConditions = `a.pacs_id = '${branch_code}'`;
    }

    var select = "a.group_code,a.group_name,a.sb_ac_no",
    table_name = "bdccb.md_group a",
    whr = `${branchCondition} AND (a.group_code::TEXT ILIKE '%${group_name_view}%' OR a.sb_ac_no::TEXT ILIKE '%${group_name_view}%' OR a.group_name::TEXT ILIKE '%${group_name_view}%')`,
    order = null;
    var shg_search_grp_views = await db_Select(select, table_name, whr, order);

    if (shg_search_grp_views.suc !== 1 || shg_search_grp_views.msg.length === 0) {
    return res.send({
    success: true,
    msg: "No data found",
    data: []
     });
    }

    let groupCode = shg_search_grp_views.msg[0].group_code;
    let groupAccNo = shg_search_grp_views.msg[0].sb_ac_no;

    // fetch group details based on above details
    var select1 = "a.group_code,a.branch_code,c.branch_name,a.group_name,a.phone1,a.sahayika_id,d.sahayika_name,a.group_addr,a.dist_id,e.dist_name,a.block_id,f.block_name,a.ps_id,g.ps_name,a.po_id,h.post_name,a.gp_id,i.gp_name,a.village_id,j.vill_name,a.pin_no,a.open_close_flag,a.grp_open_dt,a.grp_close_dt,a.delete_flag,a.direct_indirect_flag,a.pacs_id,k.branch_name AS pacs_name",
    table_name1 = "bdccb.md_group a LEFT JOIN public.md_branch c ON a.branch_code = c.branch_id LEFT JOIN bdccb.md_sahayika d ON a.sahayika_id = d.sahayika_id LEFT JOIN public.md_district e ON a.dist_id = e.dist_code LEFT JOIN public.md_block f ON a.block_id = f.block_id LEFT JOIN public.md_police_station g ON a.ps_id = g.ps_id LEFT JOIN public.md_postoffice h ON a.po_id = h.po_id LEFT JOIN public.md_gp i ON a.gp_id = i.gp_id LEFT JOIN public.md_village j ON a.village_id = j.vill_id LEFT JOIN public.md_branch k ON a.pacs_id = k.branch_id",
    whr1 = `a.group_code = '${groupCode}' AND ${branchConditions} AND a.delete_flag = 'N' AND a.sb_ac_no = '${groupAccNo}'`,
    order1 = null;
    var shg_search_grp_view_dtls1 = await db_Select(select1, table_name1, whr1, order1);

  let shg_grpData1 = (shg_search_grp_view_dtls1.suc === 1 && Array.isArray(shg_search_grp_view_dtls1.msg))
  ? shg_search_grp_view_dtls1.msg
  : [];

   let finalData = (shg_search_grp_views.msg || []).map(item => {
      return {...item,
      group_details: shg_grpData1
    };
    });

   return res.send({
    success: true,
    msg: "Fetch shg group details",
    data: finalData
   }) 
  }catch(error){
    console.log(error);
    return res.send({
      success:false,
      msg:"Error occurred while fetch shg group view details in savings view",
      error: []
    });
  }
});

// FETCH MEMBER NAME ON THIS GROUP
sbledgerRouter.post("/fetch_sb_ledger_mem_details", async (req, res) => {
  try{
  const { group_code } = req.body;

  var select = "member_code,member_name,gp_leader_flag,asst_gp_leader_flag,member_account_no,ifsc,aadhar_no,gurdian_name,phone_no,gender,religion,caste,address",
  table_name = "bdccb.md_member",
  whr = `group_code = '${group_code}'`,
  order = null;
  var fetch_memb = await db_Select(select,table_name,whr,order);

  if(fetch_memb.suc === 1 && fetch_memb.msg.length > 0){
    return res.send({
    success: true,
    msg: "Fetch member details",
    data: fetch_memb.msg
    })
  }else{
    return res.send({
    success: true,
    msg: "Unable to fetch member details",
    data: []
    })
  }
  }catch(error){
    console.log(error);
    return res.send({
      success:false,
      msg:"Error occurred while fetch member details",
      error: []
    });
  }
});

// FETCH GROUP SAVINGS DETAILS
sbledgerRouter.post("/fetch_grp_sb_details", async (req, res) => {
    try{
    const {branch_type,tenant_id,branch_code,shg_id,acc_no} = req.body;

    let branchCondition = '';

    if (branch_type === 'B') {
    branchCondition = `a.branch_id = '${branch_code}'`;
    } else if (branch_type === 'H') {
    branchCondition = `a.branch_id IN (select branch_id from public.md_branch where branch_status = 'O' AND branch_type IN ('P', 'B'))`;
    } else if (branch_type === 'P'){
    branchCondition = `b.pacs_id = '${branch_code}'`;
    }
    
    var select = "a.shg_id,a.acc_no,TO_CHAR(a.acc_opening_dt, 'YYYY-MM-DD') AS acc_opening_dt,a.balance",
    table_name = "bdccb.td_deposit a LEFT JOIN bdccb.md_group b ON a.shg_id = b.group_code",
    whr = `a.tenant_id = '${tenant_id}' AND ${branchCondition} AND a.shg_id = '${shg_id}'`,
    order = null;
    var fetch_gp_sb_dtls = await db_Select(select,table_name,whr,order);

    if (fetch_gp_sb_dtls.suc !== 1 || fetch_gp_sb_dtls.msg.length === 0) {
    return res.send({
    success: true,
    msg: "No data found",
    data: []
     });
     }

    // FETCH GROUP SAVINGS TRANSACTION DETAILS BASED ON GROUP 
    var select1 = `a.acc_no,TO_CHAR(a.trans_dt, 'YYYY-MM-DD') AS trans_dt,a.trans_no,
    CASE
    WHEN a.dep_with_flag = 'D' THEN 'Deposit'
    WHEN a.dep_with_flag = 'W' THEN 'Withdrawal'
    ELSE ''
    END AS dep_with_flag,COALESCE(a.dr_amt,0) AS dr_amt,COALESCE(a.cr_amt,0) AS cr_amt,COALESCE(a.balance,0) AS balance,a.remarks,a.approval_flag,a.approved_by,TO_CHAR(a.approved_at, 'YYYY-MM-DD') AS approved_at`,
    table_name1 = "bdccb.td_deposit_trans a LEFT JOIN bdccb.md_group b ON a.shg_id = b.group_code",
    whr1 = `a.tenant_id = '${tenant_id}' AND ${branchCondition} AND a.shg_id = '${shg_id}'`,
    order1 = `a.trans_dt,a.trans_no`;
    var fetch_gp_sb_dtls_trans = await db_Select(select1,table_name1,whr1,order1);

    let sb_transData = (fetch_gp_sb_dtls_trans.suc === 1 && Array.isArray(fetch_gp_sb_dtls_trans.msg))
    ? fetch_gp_sb_dtls_trans.msg
    : [];

    let finalData_trans = (fetch_gp_sb_dtls.msg || []).map(item => {
      return {...item,
      trans_details: sb_transData
    };
    });

    return res.send({
    success: true,
    msg: "Fetch group saving details with transaction",
    data: finalData_trans
    });
    }catch(error){
    console.log(error);
    return res.send({
      success:false,
      msg:"Error occurred while fetch group savings transaction details",
      error: []
    });
  }
});

// fetch indivitual member details
sbledgerRouter.post("/fetch_indivitual_sb_member", async (req, res) => {
    try{
    const {tenant_id,shg_id} = req.body;

    var select = "a.member_id,b.member_name,a.acc_no AS mem_acc_no,TO_CHAR(a.acc_opening_dt, 'YYYY-MM-DD') AS acc_opening_dt,COALESCE(a.balance,0) AS member_balance",
    table_name = "bdccb.td_sb a LEFT JOIN bdccb.md_member b ON a.tenant_id = b.tenant_id AND a.member_id = b.member_code AND a.shg_id = b.group_code",
    whr = `a.tenant_id = '${tenant_id}' AND a.shg_id = '${shg_id}'`,
    order = `a.member_id`;
    var fetch_sb_member = await db_Select(select,table_name,whr,order);

    if (fetch_sb_member.suc !== 1 || fetch_sb_member.msg.length === 0) {
    return res.send({
    success: true,
    msg: "No data found",
    data: []
     });
    }
    return res.send({
    success: true,
    msg: "Fetch member savings balance",
    data: fetch_sb_member.msg
    });
    }catch(error){
    console.log(error);
    return res.send({
    success:false,
    msg:"Error occurred while fetch indivitual member savings details",
    error: []
    });
    }
});

// FETCH INDIVITUAL MEMBER DETAILS WITH MEMBER SAVINGS TRANSACTIONS
sbledgerRouter.post("/fetch_indivitual_member_sb_trans", async (req, res) => {
  try{
  const { member_id,tenant_id,shg_id } = req.body;

  var select1 = `TO_CHAR(a.trans_dt, 'YYYY-MM-DD') AS trans_dt,a.trans_no,a.acc_no AS mem_sb_acc_no,
    CASE
    WHEN a.dep_with_flag = 'D' THEN 'Deposit'
    WHEN a.dep_with_flag = 'W' THEN 'Withdrawal'
    ELSE ''
    END AS dep_with_flag,COALESCE(a.dr_amt,0) AS dr_amt,COALESCE(a.cr_amt,0) AS cr_amt,COALESCE(a.balance,0) AS member_balance,a.remarks,a.approval_flag,a.approved_by,TO_CHAR(a.approved_at, 'YYYY-MM-DD') AS approved_at`,
  table_name1 = "bdccb.td_sb_trans a",
  whr1 = `a.tenant_id = '${tenant_id}' AND a.shg_id = '${shg_id}' AND a.member_id = '${member_id}'`,
  order1 = `a.member_id,a.trans_dt,a.trans_no`;
  var fetch_sb_member_transaction = await db_Select(select1,table_name1,whr1,order1);

  if(fetch_sb_member_transaction.suc === 1 && fetch_sb_member_transaction.msg.length > 0){
     return res.send({
    success: true,
    msg: "Member savings transaction details",
    data: fetch_sb_member_transaction.msg
  })
  }else{
     return res.send({
    success: true,
    msg: "Member savings transaction details not found",
    data: []
  })
  }
  }catch(error){
    console.log(error);
    return res.send({
      success:false,
      msg:"Error occurred while fetch indivitual shg member loan details",
      error: []
    });
  }
});

module.exports = {sbledgerRouter}