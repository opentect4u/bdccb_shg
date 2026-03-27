const { db_Select, saveRecord, deleteRecord } = require("../../model/pgcommon");
const express = require("express"),
ccb_recovRouter = express.Router();

const ccb_tran_id = async () => {
    const timestamp = new Date().getTime();
    // const random = Math.floor(Math.random() * 1000000);
    const newPayId = `${timestamp}`;
    return(newPayId);
};

// FETCH GROUP DETAILS BASED ON CCB A/C NO
ccb_recovRouter.post("/fetch_grp_dt", async (req, res) => {
  try{
  const {tenant_id,branch_id,ccb_loan_acc_no} = req.body;
  console.log(req.body,'fetch_grp');

  var select = "a.group_code,b.group_name,a.loan_id",
  table_name = "bdccb.td_loan a JOIN bdccb.md_group b ON a.group_code = b.group_code AND a.branch_id = b.branch_code",
  whr = `a.tenant_id = '${tenant_id}' AND a.branch_id = '${branch_id}' AND a.loan_acc_no = '${ccb_loan_acc_no}'`,
  order = null;
  var fetch_gp_data = await db_Select(select,table_name,whr,order);
  
  if(fetch_gp_data.suc == 1 && fetch_gp_data.msg.length > 0){
    return res.send({
      success: true,
      msg: "Fetch group data based on CCB A/C No",
      data: fetch_gp_data.msg
    })
  }
  }catch(error){
    console.log(error);
    return res.send({
      success:false,
      msg:"Error occurred while fetch group name via ccb loan a/c no",
      error: []
    });
  }
})

// FETCH LOAN DETAILS BASED ON CCB LOAN ACC NO
ccb_recovRouter.post("/fetch_loan_dtls_based_ccbacc_no", async (req, res) => {
  try{
   const {ccb_acc_no,branch_id,tenant_id,ccb_loan_id} = req.body;
  //  console.log(req.body);

  var select1 = "COUNT(*) AS cnt",
   table1 = "bdccb.td_loan_member_trans",
   whr1 = `loan_acc_no = '${ccb_acc_no}' AND ccb_loan_id = '${ccb_loan_id}' AND tenant_id = '${tenant_id}' AND branch_id = '${branch_id}'AND approval_status = 'U'`,
   order1 = null;
   var fetch_unapprove_data = await db_Select(select1,table1,whr1,order1);
   console.log(fetch_unapprove_data);
   
   let unapprove_count = Number(fetch_unapprove_data.msg[0].cnt || 0);

   if (unapprove_count > 0) {
   return res.send({
    success: true,
    msg: "Unapproved transactions are pending for this loan account no",
    data: [],
   });
   }
 
   var select = "a.group_code,a.period,a.curr_roi,a.penal_roi,TO_CHAR(a.disb_dt, 'YYYY-MM-DD') AS disb_dt,a.disb_amt,SUM(a.curr_prn + a.curr_intt) AS loan_outstanding",
   table_name = "bdccb.td_loan a",
   whr = `a.loan_id = '${ccb_loan_id}' AND a.tenant_id = '${tenant_id}' AND a.branch_id = '${branch_id}' AND a.loan_acc_no = '${ccb_acc_no}'  GROUP BY a.group_code,a.period,a.curr_roi,a.penal_roi,a.disb_dt,a.disb_amt`,
   order = null;
   var fetch_ccb_loan_dtls = await db_Select(select,table_name,whr,order);

   if(fetch_ccb_loan_dtls.suc === 1 && fetch_ccb_loan_dtls.msg.length > 0){
     /* -------- Fetch Member recovery Details -------- */
     var select_mem_recov = "a.loan_id,a.branch_shg_id,b.member_code,c.member_name,a.ccb_loan_id,COALESCE(SUM(a.cr_amt),0) AS cr_amt,(COALESCE(b.prn_amt,0)) AS mem_outstanding",
     table_name_mem_recov = "bdccb.td_loan_member_trans_temp a LEFT JOIN bdccb.td_loan_member b ON a.loan_id = b.loan_id AND a.tenant_id = b.tenant_id AND a.ccb_loan_id = b.ccb_loan_id LEFT JOIN bdccb.md_member c ON b.member_code = c.member_code AND b.group_code = c.group_code",
     whr_mem_recov = `a.loan_acc_no = '${ccb_acc_no}' AND a.tenant_id = '${tenant_id}' AND a.branch_id = '${branch_id}' AND a.ccb_loan_id = '${ccb_loan_id}' AND a.approval_status = 'U' GROUP BY a.loan_id,a.branch_shg_id,b.member_code,c.member_name,a.ccb_loan_id,b.prn_amt`,
     order_mem_recov = null;
     var fetch_ccb_member_dtls = await db_Select(select_mem_recov, table_name_mem_recov, whr_mem_recov, order_mem_recov);

     // attach member list under data
     fetch_ccb_loan_dtls.msg[0].member_list = fetch_ccb_member_dtls.suc === 1 && fetch_ccb_member_dtls.msg.length > 0 ? fetch_ccb_member_dtls.msg : [];

     return res.send({
        success: true,
        msg: "Fetch CCB Level loan details",
        data: fetch_ccb_loan_dtls.msg,
     });
   }else {
    return res.send({
    success: true,
    msg: "CCB Level loan details not found",
    data: [],
  });
   }
  }catch (error) {
    console.error("Error in while fetch ccb level loan dtls:", error);
    return res.send({
    success: false,
    msg: "Internal server error",
    errorCode: "SERVER_ERROR"
    });
    }
});

// SUBMIT RECOVERY IN CCB LEVEL
ccb_recovRouter.post("/submit_ccb_recovery", async (req, res) => {
  try{
  const {ccb_loan_id,tenant_id,branch_id,branch_shg_id,loan_acc_no,loan_to,loan_outstanding,prn_amt,intt_amt,ccb_recov,created_by,ip_address} = req.body;
  console.log(req.body,'ccb_recov');
  

  let datetime = new Date().toISOString().slice(0, 19).replace("T", " ");
  let date = new Date().toISOString().slice(0, 10);

  for (const dt of ccb_recov) { 
    let ccb_trans_id = await ccb_tran_id();

    const table2 = "bdccb.td_loan_member_trans";
    const columns2 = ["trans_date","trans_id","loan_id","ccb_loan_id","tenant_id","branch_id","loan_to","branch_shg_id","loan_acc_no","trans_type","dr_amt","cr_amt","curr_prn_recov","curr_intt_recov","ovd_prn_recov","ovd_intt_recov","curr_prn","curr_intt","ovd_prn","ovd_intt","approval_status","created_by","created_dt","ip_address"];
    const values2 = [date,ccb_trans_id,dt.loan_id,ccb_loan_id,tenant_id,branch_id,loan_to,branch_shg_id,loan_acc_no,'I',Number(dt.calculated_interest),0,0,0,0,0,Number(dt.curr_prn + dt.calculated_interest),0,0,0,'U',created_by,datetime,ip_address];
    const whereColumns2 = [];
    const whereValues2 = [];
    const flag2 = 0;
    const ccb_trans_result = await saveRecord(table2,columns2,values2,whereColumns2,whereValues2,flag2);
    // console.log(ccb_trans_result,'ccb_trans_result');


    if (!ccb_trans_result || ccb_trans_result.suc !== 1) {
    return res.send({
      success: false,
      msg: "Failed to insert loan Interest row in ccb recovery time",
      data: []
      });
    }

    if (Number(dt.amount) > 0) {

    let ccb_trans_ids = await ccb_tran_id();

    let updated_prn = Number(dt.curr_prn) + Number(dt.calculated_interest);
    let current_prn = updated_prn - Number(dt.prn_recov + dt.intt_recov);
    let current_intt_prn = Number(dt.calculated_interest) - Number(dt.intt_recov);

    const table3 = "bdccb.td_loan_member_trans";
    const columns3 = ["trans_date","trans_id","loan_id","ccb_loan_id","tenant_id","branch_id","loan_to","branch_shg_id","loan_acc_no","trans_type","dr_amt","cr_amt","curr_prn_recov","curr_intt_recov","ovd_prn_recov","ovd_intt_recov","curr_prn","curr_intt","ovd_prn","ovd_intt","approval_status","created_by","created_dt","ip_address"];
    const values3 = [date,ccb_trans_ids,dt.loan_id,ccb_loan_id,tenant_id,branch_id,loan_to,branch_shg_id,loan_acc_no,'R',0,Number(dt.amount),Number(dt.prn_recov + dt.intt_recov),0,0,0,current_prn,0,0,0,'U',created_by,datetime,ip_address];
    const whereColumns3 = [];
    const whereValues3 = [];
    const flag3 = 0;
    const ccb_trans_result3 = await saveRecord(table3,columns3,values3,whereColumns3,whereValues3,flag3);
    // console.log(ccb_trans_result3,'ccb_trans_result3');


    if (!ccb_trans_result3 || ccb_trans_result3.suc !== 1) {
    return res.send({
      success: false,
      msg: "Failed to insert loan Recovery row in ccb recovery time",
      data: []
      });
    }
}

  //   let current_prn_amt = Number(dt.curr_prn) - Number(dt.prn_recov);
  //   let current_intt_amt = Number(dt.calculated_interest) - Number(dt.intt_recov);

  //   const table4 = "bdccb.td_loan_member";
  //   const columns4 = ["prn_amt","intt_amt","modified_by","modified_at","ip_address"];
  //   const values4 = [current_prn_amt,current_intt_amt,created_by,datetime,ip_address];
  //   const whereColumns4 = ["loan_id","ccb_loan_id","tenant_id","loan_acc_no"];
  //   const whereValues4 = [dt.loan_id,ccb_loan_id,tenant_id,loan_acc_no];
  //   const flag4 = 1;
  //   const ccb_trans_result4 = await saveRecord(table4,columns4,values4,whereColumns4,whereValues4,flag4);
  // console.log(ccb_trans_result4,'ccb_trans_result4');


  //   if (!ccb_trans_result4 || ccb_trans_result4.suc !== 1) {
  //   return res.send({
  //     success: false,
  //     msg: "Failed to update loan details",
  //     data: []
  //     });
  //   }
  }

    let soc_td_trans_ids = await ccb_tran_id();

    // let tot_curr_prn_amt = ccb_recov.reduce((sum, item) => sum + Number(item.curr_prn), 0);
    let tot_curr_prn_amt = ccb_recov.reduce((sum, item) => sum + Number(item.curr_prn), 0);
    let tot_cal_intt_amt = ccb_recov.reduce((sum, item) => sum + Number(item.calculated_interest), 0);
    // let tot_coll_recov_amt = ccb_recov.reduce((sum, item) => sum + Number(item.amount), 0);
    // let tot_curr_prn_recov = ccb_recov.reduce((sum, item) => sum + Number(item.prn_recov), 0);
    // let tot_curr_intt_recov = ccb_recov.reduce((sum, item) => sum + Number(item.intt_recov), 0);
    let updated_total_prn = Number(loan_outstanding) + Number(intt_amt);
    let tot_current_prn = updated_total_prn - Number(prn_amt + intt_amt);
    let tot_current_intt = Number(intt_amt) - Number(intt_amt);
    let tot_coll_recov_amt = Number(prn_amt) + Number(intt_amt);

    const table5 = "bdccb.td_loan_transactions";
    const columns5 = ["trans_dt","trans_id","tenant_id","loan_to","branch_shg_id","loan_id","loan_ac_no","trans_type","dr_amt","cr_amt","curr_prn_recov","curr_intt_recov","ovd_prn_recov","ovd_intt_recov","curr_prn","curr_intt","ovd_prn","ovd_intt","approval_status","created_by","created_dt","ip_address"];
    const values5 = [date,soc_td_trans_ids,tenant_id,loan_to,branch_shg_id,ccb_loan_id,loan_acc_no,'I',intt_amt,0,0,0,0,0,updated_total_prn,0,0,0,'U',created_by,datetime,ip_address];
    const whereColumns5 = [];
    const whereValues5 = [];
    const flag5 = 0;
    const ccb_insertLoans = await saveRecord(table5,columns5,values5,whereColumns5,whereValues5,flag5);
    // console.log(ccb_insertLoans,'ccb_insertLoans')

   if (!ccb_insertLoans || ccb_insertLoans.suc !== 1) {
    return res.send({
    success: true,
    msg:"Failed to update transaction table"
  });
  }

    let ccb_td_tran_ids = await ccb_tran_id();

    const table7 = "bdccb.td_loan_transactions";
    const columns7 = ["trans_dt","trans_id","tenant_id","loan_to","branch_shg_id","loan_id","loan_ac_no","trans_type","dr_amt","cr_amt","curr_prn_recov","curr_intt_recov","ovd_prn_recov","ovd_intt_recov","curr_prn","curr_intt","ovd_prn","ovd_intt","approval_status","created_by","created_dt","ip_address"];
    const values7 = [date,ccb_td_tran_ids,tenant_id,loan_to,branch_shg_id,ccb_loan_id,loan_acc_no,'R',0,tot_coll_recov_amt,tot_coll_recov_amt,0,0,0,tot_current_prn,0,0,0,'U',created_by,datetime,ip_address];
    const whereColumns7 = [];
    const whereValues7 = [];
    const flag7 = 0;
    const ccb_trans_result7 = await saveRecord(table7,columns7,values7,whereColumns7,whereValues7,flag7);
    // console.log(ccb_trans_result7,'ccb_trans_result7')


    if (!ccb_trans_result7 || ccb_trans_result7.suc !== 1) {
    return res.send({
      success: false,
      msg: "Failed to insert loan Recovery row in society recovery time",
      data: []
      });
    }

  //  const table6 = "bdccb.td_loan";
  //  const columns6 = ["curr_prn","curr_intt","modified_by","modified_dt","ip_address"];
  //  const values6 = [tot_current_prn,tot_current_intt,created_by,datetime,ip_address];
  //  const whereColumns6 = ["loan_id","tenant_id","loan_acc_no"];
  //  const whereValues6 = [ccb_loan_id,tenant_id,loan_acc_no];
  //  const flag6 = 1;
  //  const ccb_updateLoan = await saveRecord(table6,columns6,values6,whereColumns6,whereValues6,flag6);
  //   console.log(ccb_updateLoan,'ccb_updateLoan')


  //  if (!ccb_updateLoan || ccb_updateLoan.suc !== 1) {
  //   return res.send({
  //   success: true,
  //   msg:"Failed to update td_loan table"
  // });
  // }
   return res.send({
    success: true,
    msg: "CCB Recovery done successfully" 
    });
  }catch(error){
     console.error("Error in while submit CCB recovery:", error);
    return res.send({
    success: false,
    msg: "Internal server error",
    errorCode: "SERVER_ERROR"
    });
  }
});

// AFTER SUBMIT FETCH CCB DETAILS JUST FOR VIEW
ccb_recovRouter.post("/fetch_ccb_dtls", async (req, res) => {
  try{
  const { tenant_id, branch_id, from_dt, to_dt, approval_status } = req.body;

  var select = "a.loan_id,a.group_code,b.group_name,a.disb_amt,TO_CHAR(c.trans_dt, 'YYYY-MM-DD') AS trans_dt,c.trans_id AS transaction_id,(COALESCE(c.cr_amt,0)) AS credit_amount,c.approval_status",
  table_name = `bdccb.td_loan a LEFT JOIN bdccb.md_group b ON a.group_code = b.group_code LEFT JOIN bdccb.td_loan_transactions c ON a.loan_id = c.loan_id`,
  whr = `a.tenant_id = '${tenant_id}' AND a.branch_id = '${branch_id}' AND c.trans_type = 'R' AND c.approval_status = '${approval_status}' AND a.branch_shg_id = '111'`;
  if (from_dt && to_dt) {
      whr += ` AND c.trans_dt::date BETWEEN '${from_dt}' AND '${to_dt}'`;
  }
  order = `c.trans_id desc,c.trans_dt desc`;
  var fetch_ccb_recovery_data1 = await db_Select(select, table_name, whr, order);

  if (fetch_ccb_recovery_data1.suc === 1 && fetch_ccb_recovery_data1.msg.length > 0) {
  return res.send({
  success: true,
  msg: "Fetch CCB recovery details",
  data: fetch_ccb_recovery_data1.msg,
  });
  }else {
  return res.send({
  success: true,
  msg: "No CCB Recovery details found",
  data: [],
  });
  }
  }catch(error){
    console.error("Error in while fetch ccb recov dtls:", error);
    return res.send({
      success: false,
      msg: "Internal server error",
      errorCode: "SERVER_ERROR",
    });
  }
});


// AFTER SUBMIT FETCH MEMBER LOAN DETAILS 
// FETCH CCB RECOVERY MEMBER DETAILS
// ccb_recovRouter.post("/fetch_ccb_mem_dtls", async (req, res) => {
//   try{
//   const { tenant_id,branch_id,group_code,trans_dt,transaction_id, approval_status } = req.body;

//   var select = "a.loan_id,a.group_code,c.group_name,a.loan_acc_no,a.period,a.curr_roi,a.penal_roi,TO_CHAR(a.disb_dt, 'YYYY-MM-DD') AS disb_dt,a.disb_amt,(a.curr_prn + a.curr_intt) AS loan_outstanding,b.curr_prn_recov AS principal_amount,b.curr_intt_recov AS interest_amount",
//   table_name = "bdccb.td_loan a LEFT JOIN bdccb.td_loan_transactions b ON a.loan_id = b.loan_id JOIN bdccb.md_group C ON a.group_code = c.group_code",
//   whr = `a.tenant_id = '${tenant_id}' AND a.branch_id = '${branch_id}' AND a.group_code = '${group_code}' AND b.trans_dt = '${trans_dt}' AND b.trans_id = '${transaction_id}' AND b.approval_status = '${approval_status}' GROUP BY a.loan_id,a.group_code,c.group_name,a.loan_acc_no,a.period,a.curr_roi,a.penal_roi,a.disb_dt,a.disb_amt,b.curr_prn_recov,b.curr_intt_recov`,
//   order = null;
//   var fetch_ccb_loan_dtls1 = await db_Select(select,table_name,whr,order);

//   if(fetch_ccb_loan_dtls1.suc === 1 && fetch_ccb_loan_dtls1.msg.length > 0){
//      /* -------- Fetch CCB Member recovery + interest Details -------- */

//   var select_member = `a.loan_id,
// a.member_code,
// b.member_name,
// TO_CHAR(d.trans_date, 'YYYY-MM-DD') AS trans_date,
// d.trans_id AS trans_id,
// d.trans_type,(COALESCE(d.cr_amt,0)) AS credit_amount,

// CASE 
//   WHEN d.trans_type = 'R' THEN COALESCE(d.curr_prn_recov,0)
//   ELSE 0
// END AS principal_recovery,

// CASE 
//   WHEN d.trans_type = 'R' THEN COALESCE(d.curr_intt_recov,0)
//   ELSE 0
// END AS interest_recovery,

// CASE 
//   WHEN d.trans_type = 'R' THEN COALESCE((d.curr_prn + d.curr_intt),0) 
//   ELSE 0
//   END AS loan_outstanding,

// CASE 
//   WHEN d.trans_type = 'I' THEN COALESCE(d.dr_amt,0)
//   WHEN d.trans_type = 'R' THEN COALESCE(d.curr_intt_recov,0)
//   ELSE 0
// END AS calculated_interest`;
//      table_member = `bdccb.td_loan_member a 
// LEFT JOIN bdccb.md_member b 
//   ON a.member_code = b.member_code 
//   AND a.group_code = b.group_code

// LEFT JOIN bdccb.td_loan_member_trans d 
//   ON a.loan_id = d.loan_id 
//   AND a.ccb_loan_id = d.ccb_loan_id
//   AND DATE(d.trans_date) = '${trans_dt}'
//   AND d.approval_status = '${approval_status}'`;
//    whr_member = `a.tenant_id = '${tenant_id}' AND a.branch_id = '${branch_id}' AND a.group_code = '${group_code}'  AND d.trans_type IN ('R','I')`;
//    order_member = null ;
//    var fetch_member_dtls_trans1 = await db_Select(select_member,table_member,whr_member,order_member);


//    // attach member list under data
//    fetch_ccb_loan_dtls1.msg[0].member_list = fetch_member_dtls_trans1.suc === 1 && fetch_member_dtls_trans1.msg.length > 0 ? fetch_member_dtls_trans1.msg : [];
//    return res.send({
//         success: true,
//         msg: "Fetch CCB member details",
//         data: fetch_ccb_loan_dtls1.msg
//      });
//   }else{
//     return res.send({
//     success: true,
//     msg: "CCB member loan details not found",
//     data: []
//   });
//   }   
//   }catch(error){
//     console.error("Error in while fetch ccb member  recov dtls:", error);
//     return res.send({
//       success: false,
//       msg: "Internal server error",
//       errorCode: "SERVER_ERROR",
//     });
//   }
// });

ccb_recovRouter.post("/fetch_ccb_mem_dtls", async (req, res) => {
  try{
  const { tenant_id,branch_id,group_code,trans_dt,transaction_id, approval_status } = req.body;

  var select = "a.loan_id,a.group_code,d.group_name,a.loan_acc_no,a.period,a.curr_roi,a.penal_roi,TO_CHAR(a.disb_dt, 'YYYY-MM-DD') AS disb_dt,a.disb_amt,(a.curr_prn + a.curr_intt) AS loan_outstanding,COALESCE(r.curr_prn_recov,0) - COALESCE(i.dr_amt,0) AS principal_amount,COALESCE(i.dr_amt,0) AS interest_amount",

  table_name = `bdccb.td_loan a LEFT JOIN bdccb.td_loan_transactions r ON a.loan_id = r.loan_id AND r.trans_type = 'R' AND r.trans_dt = '${trans_dt}' AND r.trans_id = '${transaction_id}' AND r.approval_status = '${approval_status}' LEFT JOIN (
      SELECT DISTINCT ON (loan_id) loan_id, dr_amt
      FROM bdccb.td_loan_transactions
      WHERE trans_type = 'I'
      AND trans_dt = '${trans_dt}'
      AND approval_status = '${approval_status}'
      ORDER BY loan_id, trans_id DESC   -- latest I row
    ) i ON a.loan_id = i.loan_id 
     LEFT JOIN (
      SELECT ccb_loan_id, MAX(society_acc_no) AS society_acc_no
      FROM bdccb.td_loan_member
      GROUP BY ccb_loan_id
    ) c ON a.loan_id = c.ccb_loan_id 
     JOIN bdccb.md_group d ON a.group_code = d.group_code`,

  whr = `a.tenant_id = '${tenant_id}' AND a.branch_id = '${branch_id}' AND a.group_code = '${group_code}'`,
  order = null;
  var fetch_ccb_loan_dtls1 = await db_Select(select,table_name,whr,order);

  if(fetch_ccb_loan_dtls1.suc === 1 && fetch_ccb_loan_dtls1.msg.length > 0){
     /* -------- Fetch CCB Member recovery + interest Details -------- */

  var select_member = `a.loan_id,
a.member_code,
b.member_name,
TO_CHAR(d.trans_date, 'YYYY-MM-DD') AS trans_date,
d.trans_id AS trans_id,
d.trans_type,(COALESCE(d.cr_amt,0)) AS credit_amount,

COALESCE(d.curr_prn_recov,0) - COALESCE(i.dr_amt,0) AS principal_recovery,

COALESCE(i.dr_amt,0) AS interest_recovery,

CASE 
  WHEN d.trans_type = 'R' THEN COALESCE((d.curr_prn + d.curr_intt),0) 
  ELSE 0
  END AS loan_outstanding,

CASE 
  WHEN d.trans_type = 'I' THEN COALESCE(d.dr_amt,0)
  WHEN d.trans_type = 'R' THEN COALESCE(d.curr_intt_recov,0)
  ELSE 0
END AS calculated_interest`;

     table_member = `bdccb.td_loan_member a 
LEFT JOIN bdccb.md_member b 
  ON a.member_code = b.member_code 
  AND a.group_code = b.group_code

LEFT JOIN bdccb.td_loan_member_trans d 
  ON a.loan_id = d.loan_id 
  AND a.ccb_loan_id = d.ccb_loan_id
  AND d.trans_type IN ('R','I')
  AND DATE(d.trans_date) = '${trans_dt}'
  AND d.approval_status = '${approval_status}'
  LEFT JOIN (
  SELECT DISTINCT ON (loan_id, ccb_loan_id)
    loan_id,
    ccb_loan_id,
    dr_amt
  FROM bdccb.td_loan_member_trans
  WHERE trans_type = 'I'
  AND DATE(trans_date) = '${trans_dt}'
  AND approval_status = '${approval_status}'
  ORDER BY loan_id, ccb_loan_id, trans_id DESC
) i
 ON a.loan_id = i.loan_id 
AND a.ccb_loan_id = i.ccb_loan_id`;
   whr_member = `a.tenant_id = '${tenant_id}' AND a.branch_id = '${branch_id}' AND a.group_code = '${group_code}'`;
   order_member = null ;
   var fetch_member_dtls_trans1 = await db_Select(select_member,table_member,whr_member,order_member);


   // attach member list under data
   fetch_ccb_loan_dtls1.msg[0].member_list = fetch_member_dtls_trans1.suc === 1 && fetch_member_dtls_trans1.msg.length > 0 ? fetch_member_dtls_trans1.msg : [];
   return res.send({
        success: true,
        msg: "Fetch CCB member details",
        data: fetch_ccb_loan_dtls1.msg
     });
  }else{
    return res.send({
    success: true,
    msg: "CCB member loan details not found",
    data: []
  });
  }   
  }catch(error){
    console.error("Error in while fetch ccb member  recov dtls:", error);
    return res.send({
      success: false,
      msg: "Internal server error",
      errorCode: "SERVER_ERROR",
    });
  }
});

// FETCH CCB RECOVERY DETAILS
ccb_recovRouter.post("/fetch_ccb_recov_dtls", async (req, res) => {
  try{
  const { tenant_id, branch_id, from_dt, to_dt, approval_status } = req.body;

  var select = "a.loan_id,a.group_code,b.group_name,a.disb_amt,TO_CHAR(c.trans_dt, 'YYYY-MM-DD') AS trans_dt,c.trans_id AS transaction_id,(COALESCE(c.cr_amt,0)) AS credit_amount,c.approval_status",
  table_name = `bdccb.td_loan a LEFT JOIN bdccb.md_group b ON a.group_code = b.group_code LEFT JOIN bdccb.td_loan_transactions c ON a.loan_id = c.loan_id`,
  whr = `a.tenant_id = '${tenant_id}' AND a.branch_id = '${branch_id}' AND c.trans_type = 'R' AND c.trans_dt::date BETWEEN '${from_dt}' AND '${to_dt}' AND c.approval_status = '${approval_status}'`,
  order = `c.trans_id desc,c.trans_dt desc`;
  var fetch_ccb_recovery_data = await db_Select(select, table_name, whr, order);

  if (fetch_ccb_recovery_data.suc === 1 && fetch_ccb_recovery_data.msg.length > 0) {
  return res.send({
  success: true,
  msg: "Fetch CCB recovery details",
  data: fetch_ccb_recovery_data.msg,
  });
  }else {
  return res.send({
  success: true,
  msg: "No CCB Recovery details found",
  data: [],
  });
  }
  }catch(error){
    console.error("Error in while fetch ccb recov dtls:", error);
    return res.send({
      success: false,
      msg: "Internal server error",
      errorCode: "SERVER_ERROR",
    });
  }
});

// FETCH CCB RECOVERY MEMBER DETAILS
ccb_recovRouter.post("/fetch_ccb_mem_recov_dtls", async (req, res) => {
  try{
  const { tenant_id,branch_id,group_code,trans_dt,transaction_id,approval_status } = req.body;

  var select = "a.loan_id,a.group_code,d.group_name,a.loan_acc_no,a.period,a.curr_roi,a.penal_roi,TO_CHAR(a.disb_dt, 'YYYY-MM-DD') AS disb_dt,a.disb_amt,(a.curr_prn + a.curr_intt) AS loan_outstanding,COALESCE(r.curr_prn_recov,0) - COALESCE(i.dr_amt,0) AS principal_amount,COALESCE(i.dr_amt,0) AS interest_amount",

  table_name = `bdccb.td_loan a LEFT JOIN bdccb.td_loan_transactions r ON a.loan_id = r.loan_id AND r.trans_type = 'R' AND r.trans_dt = '${trans_dt}' AND r.trans_id = '${transaction_id}' AND r.approval_status = '${approval_status}' LEFT JOIN (
      SELECT DISTINCT ON (loan_id) loan_id, dr_amt
      FROM bdccb.td_loan_transactions
      WHERE trans_type = 'I'
      AND trans_dt = '${trans_dt}'
      AND approval_status = '${approval_status}'
      ORDER BY loan_id, trans_id DESC   -- latest I row
    ) i ON a.loan_id = i.loan_id 
     LEFT JOIN (
      SELECT ccb_loan_id, MAX(society_acc_no) AS society_acc_no
      FROM bdccb.td_loan_member
      GROUP BY ccb_loan_id
    ) c ON a.loan_id = c.ccb_loan_id 
     JOIN bdccb.md_group d ON a.group_code = d.group_code`,
  whr = `a.tenant_id = '${tenant_id}' AND a.branch_id = '${branch_id}' AND a.group_code = '${group_code}'`,
  order = null;
  var fetch_ccb_loan_dtls = await db_Select(select,table_name,whr,order);

  if(fetch_ccb_loan_dtls.suc === 1 && fetch_ccb_loan_dtls.msg.length > 0){
     /* -------- Fetch CCB Member recovery + interest Details -------- */
  //    var select_member = "a.loan_id,a.member_code,b.member_name,TO_CHAR(d.trans_date, 'YYYY-MM-DD') AS trans_date,d.trans_id AS trans_id,(COALESCE(d.cr_amt,0)) AS credit_amount,COALESCE(SUM(i.curr_prn + i.curr_intt),0) AS loan_outstanding,(COALESCE(i.dr_amt,0)) AS calculated_interest,(COALESCE(d.curr_prn_recov,0)) AS principal_recovery,(COALESCE(d.curr_intt_recov,0)) AS interest_recovery";
  //    table_member = `bdccb.td_loan_member a LEFT JOIN bdccb.md_member b ON a.member_code = b.member_code AND a.group_code = b.group_code 
  //    /* Recovery row */
  //  LEFT JOIN bdccb.td_loan_member_trans d ON a.loan_id = d.loan_id AND a.ccb_loan_id = d.ccb_loan_id AND d.trans_date = '${trans_dt}' AND d.trans_type = 'R' AND d.approval_status = '${approval_status}'
   
  //  /* Interest row */
  //  LEFT JOIN bdccb.td_loan_member_trans i ON a.loan_id = i.loan_id AND a.ccb_loan_id = i.ccb_loan_id AND i.trans_date = '${trans_dt}' AND i.trans_type = 'I' AND i.approval_status = '${approval_status}'`;
  //  whr_member = `a.tenant_id = '${tenant_id}' AND a.branch_id = '${branch_id}' AND a.group_code = '${group_code}' GROUP BY a.loan_id,a.member_code,b.member_name,d.trans_date,d.trans_id,d.cr_amt,i.dr_amt,d.curr_prn_recov,d.curr_intt_recov`;
  //  order_member = null ;

  var select_member = `a.loan_id,
a.member_code,
b.member_name,
TO_CHAR(d.trans_date, 'YYYY-MM-DD') AS trans_date,
d.trans_id AS trans_id,
d.trans_type,(COALESCE(d.cr_amt,0)) AS credit_amount,

COALESCE(d.curr_prn_recov,0) - COALESCE(i.dr_amt,0) AS principal_recovery,

COALESCE(i.dr_amt,0) AS interest_recovery,

CASE 
  WHEN d.trans_type = 'R' THEN COALESCE((d.curr_prn + d.curr_intt),0) 
  ELSE 0
  END AS loan_outstanding,

CASE 
  WHEN d.trans_type = 'I' THEN COALESCE(d.dr_amt,0)
  WHEN d.trans_type = 'R' THEN COALESCE(d.curr_intt_recov,0)
  ELSE 0
END AS calculated_interest`;
     table_member = `bdccb.td_loan_member a 
LEFT JOIN bdccb.md_member b 
  ON a.member_code = b.member_code 
  AND a.group_code = b.group_code

LEFT JOIN bdccb.td_loan_member_trans d 
  ON a.loan_id = d.loan_id 
  AND a.ccb_loan_id = d.ccb_loan_id
  AND d.trans_type IN ('R','I')
  AND DATE(d.trans_date) = '${trans_dt}'
  AND d.approval_status = '${approval_status}'
  LEFT JOIN (
  SELECT DISTINCT ON (loan_id, ccb_loan_id)
    loan_id,
    ccb_loan_id,
    dr_amt
  FROM bdccb.td_loan_member_trans
  WHERE trans_type = 'I'
  AND DATE(trans_date) = '${trans_dt}'
  AND approval_status = '${approval_status}'
  ORDER BY loan_id, ccb_loan_id, trans_id DESC
) i
 ON a.loan_id = i.loan_id 
AND a.ccb_loan_id = i.ccb_loan_id`;

   whr_member = `a.tenant_id = '${tenant_id}' AND a.branch_id = '${branch_id}' AND a.group_code = '${group_code}'`;
   order_member = null ;
   var fetch_member_dtls_trans = await db_Select(select_member,table_member,whr_member,order_member);


   // attach member list under data
   fetch_ccb_loan_dtls.msg[0].member_list = fetch_member_dtls_trans.suc === 1 && fetch_member_dtls_trans.msg.length > 0 ? fetch_member_dtls_trans.msg : [];
   return res.send({
        success: true,
        msg: "Fetch CCB member details",
        data: fetch_ccb_loan_dtls.msg
     });
  }else{
    return res.send({
    success: true,
    msg: "CCB member loan details not found",
    data: []
  });
  }   
  }catch(error){
    console.error("Error in while fetch ccb member  recov dtls:", error);
    return res.send({
      success: false,
      msg: "Internal server error",
      errorCode: "SERVER_ERROR",
    });
  }
});

// ACCEPT CCB RECOVERY
ccb_recovRouter.post("/accept_ccb_recovery", async (req, res) => {
  try{
  const { loan_id,tenant_id,trans_dt,transaction_id,group_code,accept_ccb_recovery,created_by,ip_address } = req.body;
  console.log(req.body,'accept_ccb');
  
  let datetime = new Date().toISOString().slice(0, 19).replace("T", " ");

  if (!accept_ccb_recovery || accept_ccb_recovery.length === 0) {
      return res.send({ success : false, msg: 'No data received' });
  }
   
  for(let dt of accept_ccb_recovery){
  // Update td_loan_member_trans_temp table
    let table = "bdccb.td_loan_member_trans_temp";
    let columns = ["approval_status","approved_by","approved_dt","ip_address"];
    let values = ['A',created_by,datetime,ip_address];
    // let whereColumns = ["loan_id","ccb_loan_id","tenant_id","cr_amt"];
    let whereColumns = ["loan_id","ccb_loan_id","tenant_id",];
    let whereValues = [dt.loan_id,loan_id,tenant_id];
    // let whereValues = [dt.loan_id,loan_id,tenant_id,dt.credit_amount];
    let flag = 1; // update flag
    const update_td_loan_member_trans_temp_ccb = await saveRecord(table,columns,values,whereColumns,whereValues,flag);  

    if (!update_td_loan_member_trans_temp_ccb || update_td_loan_member_trans_temp_ccb.suc !== 1) {
    return res.send({
    success: true,
    msg:"Failed to update status in CCB level"
    });
    }


   // Fetch Interest trans_id
    // var select_int = "trans_id",
    // table_name_int = "bdccb.td_loan_member_trans",
    // whr_int = `loan_id = '${dt.loan_id}' 
    //        AND ccb_loan_id = '${loan_id}'
    //        AND trans_date = '${dt.trans_date}'
    //        AND trans_type = 'I'
    //        AND tenant_id = '${tenant_id}'`;
    // const interest_row_trans = await db_Select(select_int,table_name_int,whr_int);

    // let interest_tran_id = null;

    // if(interest_row_trans.msg && interest_row_trans.msg.length > 0){
    //   interest_tran_id = interest_row_trans.msg[0].trans_id;
    // }

  // Update td_loan_transactions table interest row
    // if(interest_tran_id){
    let table3 = "bdccb.td_loan_member_trans";
    let columns3 = ["approval_status","approved_by","approved_dt","ip_address"];
    let values3 = ['A',created_by,datetime,ip_address];
    let whereColumns3 = ["trans_date","trans_id","loan_id","ccb_loan_id","tenant_id","trans_type"];
    let whereValues3 = [dt.trans_date,dt.trans_id,dt.loan_id,loan_id,tenant_id,dt.trans_type];
    let flag3 = 1; // update flag
    const update_td_loan_member_trans_interest_ccb = await saveRecord(table3,columns3,values3,whereColumns3,whereValues3,flag3);

    if (!update_td_loan_member_trans_interest_ccb || update_td_loan_member_trans_interest_ccb.suc !== 1) {
    return res.send({
    success: true,
    msg:"Failed to update interest row status in CCB transaction level"
    });
    }
  // }  

  // Update td_loan_member_trans table recovery row
    // let table1 = "bdccb.td_loan_member_trans";
    // let columns1 = ["approval_status","approved_by","approved_dt","ip_address"];
    // let values1 = ['A',created_by,datetime,ip_address];
    // let whereColumns1 = ["trans_date","trans_id","loan_id","ccb_loan_id","tenant_id","trans_type"];
    // let whereValues1 = [dt.trans_date,dt.trans_id,dt.loan_id,loan_id,tenant_id,dt.trans_type];
    // let flag1 = 1; // update flag
    // const update_td_loan_member_trans_ccb = await saveRecord(table1,columns1,values1,whereColumns1,whereValues1,flag1);

    // if (!update_td_loan_member_trans_ccb || update_td_loan_member_trans_ccb.suc !== 1) {
    // return res.send({
    // success: true,
    // msg:"Failed to update recovery row status in CCB transaction level"
    // });
    // }

    // FETCH CURRENT PRINCIPAL AND INTEREST FROM TD_LOAN_MEMBER_TRANS TABLE
    var select1 = "(COALESCE(a.curr_prn,0)) AS curr_prn,(COALESCE(a.curr_intt,0)) AS curr_intt",
    table_name1 = "bdccb.td_loan_member_trans a",
    // whr1 = `a.loan_id = '${dt.loan_id}' AND a.ccb_loan_id = '${loan_id}' AND a.trans_date = '${dt.trans_date}' AND a.trans_id = '${dt.trans_id}'`,
    whr1 = `a.loan_id = '${dt.loan_id}' AND a.ccb_loan_id = '${loan_id}'`,
    // order1 = "a.trans_date DESC, a.trans_id DESC LIMIT 1";
    order1 = `CASE WHEN a.trans_type = 'R' THEN 1 ELSE 2 END, a.trans_date DESC,a.trans_id DESC LIMIT 1`;
    var fetch_current_data_ccb = await db_Select(select1,table_name1,whr1,order1);
    console.log(fetch_current_data_ccb,'1');
   
    let current_curr_prn = 0;
    let current_curr_intt = 0;

   if(fetch_current_data_ccb.msg && fetch_current_data_ccb.msg.length > 0){
    current_curr_prn =  fetch_current_data_ccb.msg[0].curr_prn ;
    current_curr_intt = fetch_current_data_ccb.msg[0].curr_intt ;
    console.log(current_curr_intt,current_curr_prn,'2');
   }
    
  // Update td_loan_member table
    let table2 = "bdccb.td_loan_member";
    let columns2 = ["prn_amt","intt_amt","modified_by","modified_at","ip_address"];
    let values2 = [current_curr_prn,current_curr_intt,created_by,datetime,ip_address];
    let whereColumns2 = ["loan_id","ccb_loan_id","tenant_id","group_code"];
    let whereValues2 = [dt.loan_id,loan_id,tenant_id,group_code];
    let flag2 = 1; // update flag
    const update_td_loan_member_ccb = await saveRecord(table2,columns2,values2,whereColumns2,whereValues2,flag2); 
    
    if (!update_td_loan_member_ccb || update_td_loan_member_ccb.suc !== 1) {
    return res.send({
    success: true,
    msg:"Failed to update ccb level data"
    });
    }
    
  }

  // Fetch Interest trans_id
    var select_int = "trans_id",
    table_name_int = "bdccb.td_loan_transactions",
    whr_int = `loan_id = '${loan_id}' 
           AND trans_dt = '${trans_dt}'
           AND trans_type = 'I'
           AND tenant_id = '${tenant_id}'`;
    const interest_row_ccb = await db_Select(select_int,table_name_int,whr_int);

    let interest_trans_id = null;

    if(interest_row_ccb.msg && interest_row_ccb.msg.length > 0){
      interest_trans_id = interest_row_ccb.msg[0].trans_id;
    }

  // Update td_loan_transactions table interest row
    if(interest_trans_id){
    let table3 = "bdccb.td_loan_transactions";
    let columns3 = ["approval_status","approved_by","approved_dt","ip_address"];
    let values3 = ['A',created_by,datetime,ip_address];
    let whereColumns3 = ["trans_dt","trans_id","loan_id","tenant_id","trans_type"];
    let whereValues3 = [trans_dt,interest_trans_id,loan_id,tenant_id,'I'];
    let flag3 = 1; // update flag
    const update_td_loan_transactions_interest_ccb = await saveRecord(table3,columns3,values3,whereColumns3,whereValues3,flag3);

    if (!update_td_loan_transactions_interest_ccb || update_td_loan_transactions_interest_ccb.suc !== 1) {
    return res.send({
    success: true,
    msg:"Failed to update interest row status in main transaction table"
    });
    }
  }

  // Update td_loan_transactions table recovery row
    let table4 = "bdccb.td_loan_transactions";
    let columns4 = ["approval_status","approved_by","approved_dt","ip_address"];
    let values4 = ['A',created_by,datetime,ip_address];
    let whereColumns4 = ["trans_dt","trans_id","loan_id","tenant_id","trans_type"];
    let whereValues4 = [trans_dt,transaction_id,loan_id,tenant_id,'R'];
    let flag4 = 1; // update flag
    const update_td_loan_transactions_ccb = await saveRecord(table4,columns4,values4,whereColumns4,whereValues4,flag4);

    if (!update_td_loan_transactions_ccb || update_td_loan_transactions_ccb.suc !== 1) {
    return res.send({
    success: true,
    msg:"Failed to update recovery row status in main transaction table"
    });
    }

    // FETCH CURRENT PRINCIPAL AND INTEREST FROM TD_LOAN_TRANSCATIONS TABLE
    var select1 = "(COALESCE(a.curr_prn,0)) AS td_curr_prn,(COALESCE(a.curr_intt,0)) AS td_curr_intt",
    table_name1 = "bdccb.td_loan_transactions a",
    whr1 = `a.loan_id = '${loan_id}' AND a.trans_dt = '${trans_dt}' AND a.trans_id = '${transaction_id}'`,
    order1 = "a.trans_dt DESC, a.trans_id DESC LIMIT 1";
    var fetch_current_data_ccb = await db_Select(select1,table_name1,whr1,order1);
    // console.log(fetch_current_data,'1');
   
    let current_curr_prn = 0;
    let current_curr_intt = 0;

   if(fetch_current_data_ccb.msg && fetch_current_data_ccb.msg.length > 0){
    current_curr_prn =  fetch_current_data_ccb.msg[0].td_curr_prn ;
    current_curr_intt = fetch_current_data_ccb.msg[0].td_curr_intt ;
    // console.log(current_curr_intt,current_curr_prn,'2');
   }

  // Update td_loan table
    let table5 = "bdccb.td_loan";
    let columns5 = ["curr_prn","curr_intt","modified_by","modified_dt","ip_address"];
    let values5 = [current_curr_prn,current_curr_intt,created_by,datetime,ip_address];
    let whereColumns5 = ["loan_id","tenant_id","group_code"];
    let whereValues5 = [loan_id,tenant_id,group_code];
    let flag5 = 1; // update flag
    const update_td_loan_ccb = await saveRecord(table5,columns5,values5,whereColumns5,whereValues5,flag5); 
    
    if (!update_td_loan_ccb || update_td_loan_ccb.suc !== 1) {
    return res.send({
    success: true,
    msg:"Failed to update balance in main table"
    });
    }
   return res.send({
    success: true,
    msg: "CCB Recovery accepted successfully" 
    });
  }catch(error){
    console.log(error);
    return res.send({
      success:false,
      msg:"Error occurred while accept CCB recovery",
      error: []
    })
  }
});

// REJECT CCB RECOVERY
ccb_recovRouter.post("/reject_ccb_recov", async (req, res) => {
  try{
   const {loan_id,tenant_id,trans_dt,transaction_id,group_code,reject_ccb_recovery,created_by,ip_address,reject_remarks} = req.body;
   console.log(req.body,'reject_ccb');

   let datetime = new Date().toISOString().slice(0,19).replace("T"," ");

   for(let row of reject_ccb_recovery){

    //  if (row.trans_date && row.trans_id) {
    let select_fetch = "*";
    let table_fetch = "bdccb.td_loan_member_trans";
    let whr_fetch = `loan_id = '${row.loan_id}' AND ccb_loan_id = '${loan_id}' AND trans_date = '${row.trans_date}'
                 AND trans_id = '${row.trans_id}' AND tenant_id = '${tenant_id}' AND trans_type = '${row.trans_type}'`;

    let data = await db_Select(select_fetch, table_fetch, whr_fetch, null);

     if(!data.msg.length){
        continue;
      }

    let r = data.msg[0];

    // PREPARE COLUMNS AND VALUES
    // let columns = Object.keys(r);
    // let values = Object.values(r);
    let columns = Object.keys(r).filter(c => 
  !["rejected_by","rejected_dt","rejected_ip_address","reject_remarks"].includes(c)
);

let values = columns.map(c => r[c]);

     // add reject fields
      columns.push("rejected_by","rejected_dt","rejected_ip_address","reject_remarks");
      values.push(created_by, datetime, ip_address, reject_remarks);

    // Insert into td_loan_member_trans_temp table
   let table = "bdccb.td_loan_member_trans_reject";
   let whereColumns = null;
   let whereValues = null;
   let flag = 0;
   await saveRecord(table, columns, values, whereColumns, whereValues, flag);

   // FETCH INTEREST ROW (I) FULL DATA

  //  let int_data = await db_Select(
  //       "*",
  //       "bdccb.td_loan_member_trans",
  //       `loan_id = '${row.loan_id}'
  //        AND ccb_loan_id = '${loan_id}'
  //        AND trans_date = '${row.trans_date}'
  //        AND trans_type = 'I'
  //        AND tenant_id = '${tenant_id}'`,
  //       null
  //     );

  //     let interest_tran_id = null;

  //     if (int_data.msg && int_data.msg.length > 0) {
  //       let r_int = int_data.msg[0];
  //       interest_tran_id = r_int.trans_id;

  //  // INSERT INTEREST ROW INTO REJECT TABLE
  //    let int_columns = Object.keys(r_int).filter(c =>
  //         !["rejected_by", "rejected_dt", "rejected_ip_address", "reject_remarks"].includes(c)
  //       );

  //       let int_values = int_columns.map(c => r_int[c]);

  //       int_columns.push("rejected_by", "rejected_dt", "rejected_ip_address", "reject_remarks");
  //       int_values.push(created_by, datetime, ip_address, reject_remarks);

  //       await saveRecord(
  //         "bdccb.td_loan_member_trans_reject",
  //         int_columns,
  //         int_values,
  //         null,
  //         null,
  //         0
  //       );
  //     }     

    // delete td_loan_member_trans table interest row
    // if (interest_tran_id) {
  const delete_record_interest_ccb = await deleteRecord("bdccb.td_loan_member_trans",["trans_date", "trans_id", "loan_id","ccb_loan_id","trans_type"],[row.trans_date, row.trans_id, row.loan_id, loan_id, row.trans_type]);
    // }
  //  console.log(delete_record_interest,'delete');

   // Delete from td_loan_member_trans table recovery row
  //  const delete_record_ccb = await deleteRecord("bdccb.td_loan_member_trans",["trans_date", "trans_id", "loan_id", "ccb_loan_id","trans_type"],[row.trans_date, row.trans_id, row.loan_id, loan_id, 'R']);
  // }
  //  console.log(delete_record,'dedede');
  //  else{
  //    console.log("No recovery, deleting only interest:", row.loan_id);
  //    let int_data = await db_Select(
  //         "*",
  //         "bdccb.td_loan_member_trans",
  //         `loan_id = '${row.loan_id}'
  //          AND ccb_loan_id = '${loan_id}'
  //          AND trans_type = 'I'
  //          AND tenant_id = '${tenant_id}'`,
  //         "trans_date DESC, trans_id DESC LIMIT 1"
  //       );

  //       if (int_data.msg && int_data.msg.length > 0) {
  //         let r_int = int_data.msg[0];

  //         let interest_tran_id = r_int.trans_id;
  //         let interest_date = r_int.trans_date;

  //         let int_columns = Object.keys(r_int).filter(c =>
  //           !["rejected_by", "rejected_dt", "rejected_ip_address", "reject_remarks"].includes(c)
  //         );

  //         let int_values = int_columns.map(c => r_int[c] ?? null);

  //         int_columns.push("rejected_by", "rejected_dt", "rejected_ip_address", "reject_remarks");
  //         int_values.push(created_by, datetime, ip_address, reject_remarks);

  //         await saveRecord("bdccb.td_loan_member_trans_reject", int_columns, int_values, null, null, 0);

  //         await deleteRecord(
  //           "bdccb.td_loan_member_trans",
  //           ["trans_date", "trans_id", "loan_id", "ccb_loan_id", "trans_type"],
  //           [interest_date, interest_tran_id, row.loan_id, loan_id, "I"]
  //         );
  //       }
  //  }

   // FETCH CURRENT DATA FROM td_loan_member_trans table
   var select = "(COALESCE(a.curr_prn,0)) AS curr_prn,(COALESCE(a.curr_intt,0)) AS curr_intt",
   table_name = "bdccb.td_loan_member_trans a",
   whr = `a.loan_id = '${row.loan_id}' AND a.ccb_loan_id = '${loan_id}'`,
   order = "a.trans_date DESC, a.trans_id DESC LIMIT 1";
   var fetch_current_data_ccb = await db_Select(select,table_name,whr,order);

  //  console.log(fetch_current_data,'curr');
   

   let curr_prn = 0;
   let curr_intt = 0;

   if(fetch_current_data_ccb.msg && fetch_current_data_ccb.msg.length > 0){
   curr_prn =   fetch_current_data_ccb.msg[0].curr_prn;
   curr_intt =  fetch_current_data_ccb.msg[0].curr_intt;
  //  console.log(curr_intt,curr_prn,'hyhyhy');
   }

  //  tenant_id = fetch_current_data.msg[0].tenant_id;

    // Update td_loan_member loan balance
    let table2 = "bdccb.td_loan_member";
    let columns2 = ["prn_amt","intt_amt","modified_by","modified_at","ip_address"];
    let values2 = [Number(curr_prn), Number(curr_intt),created_by,datetime,ip_address];
    let whereColumns2 = ["loan_id","ccb_loan_id","tenant_id","group_code"];
    let whereValues2 = [row.loan_id,loan_id,tenant_id,group_code];
    let flag2 = 1; // update flag
    const update_td_loan_ccb = await saveRecord(table2, columns2, values2, whereColumns2, whereValues2, flag2);
    // console.log(update_td_loan,'ki');
    // console.log(whereValues2,'whereValues2');
    
   }

   // FETCH INTEREST ROW TRANS_ID 
    let select_t = "trans_id";
    let table_t = "bdccb.td_loan_transactions";
    let whr_t = `loan_id = '${loan_id}'
                 AND trans_type = 'I'
                AND trans_id < '${transaction_id}'
           `;
    let order_t = "trans_id DESC LIMIT 1";
    let interest_row_ccb = await db_Select(select_t, table_t, whr_t, order_t);
    // console.log(interest_row,'kiyt');
    

    // if(interest_row.msg.length > 0){
   let interest_trans_id = interest_row_ccb.msg[0].trans_id || null;
  //  let tenant = interest_row.msg[0].tenant_id || 0;
  //  console.log(interest_trans_id,'po');
   
// }

    // delete from td_loan_transactions table recovery row
     await deleteRecord(
      "bdccb.td_loan_transactions",
      ["trans_dt", "trans_id", "loan_id", "tenant_id", "trans_type"],
      [trans_dt, transaction_id, loan_id, tenant_id, "R"]);

        // delete from td_loan_transactions table interest row
        if(interest_trans_id){
     await deleteRecord(
      "bdccb.td_loan_transactions",
      ["trans_dt", "trans_id", "loan_id", "tenant_id", "trans_type"],
      [trans_dt, interest_trans_id, loan_id, tenant_id, "I"]);
     }

      // FETCH CURRENT PRINCIPAL AND INTEREST FROM TD_LOAN_TRANSCATIONS TABLE
  var select1 = "(COALESCE(a.curr_prn,0)) AS td_curr_prn,(COALESCE(a.curr_intt,0)) AS td_curr_intt",
   table_name1 = "bdccb.td_loan_transactions a",
   whr1 = `a.loan_id = '${loan_id}'
   AND a.trans_type != 'I'`,
   order1 = "a.trans_dt DESC, a.trans_id DESC LIMIT 1";
   var fetch_current_data1_ccb = await db_Select(select1,table_name1,whr1,order1);
  //  console.log(fetch_current_data1,'hyfr');
   

   let current_curr_prn = 0;
   let current_curr_intt = 0;

   if(fetch_current_data1_ccb.msg && fetch_current_data1_ccb.msg.length > 0){
    current_curr_prn =  fetch_current_data1_ccb.msg[0].td_curr_prn ;
    current_curr_intt = fetch_current_data1_ccb.msg[0].td_curr_intt ;
    // console.log(current_curr_intt,current_curr_prn,'kiujh');
    
   }

    // Update td_loan loan balance
    let table3 = "bdccb.td_loan";
    let columns3 = ["curr_prn","curr_intt","modified_by","modified_dt","ip_address"];
    let values3 = [Number(current_curr_prn), Number(current_curr_intt),created_by,datetime,ip_address];
    let whereColumns3 = ["loan_id","group_code"];
    let whereValues3 = [loan_id,group_code];
    let flag3 = 1; // update flag
    await saveRecord(table3, columns3, values3, whereColumns3, whereValues3, flag3);
    // console.log(whereValues3,'whereValues3');

    return res.send({
      success: true,
      msg: "CCB recovery rejected successfully"
   });
   }catch(error){
    console.log(error);
    return res.send({
      success:false,
      msg:"Error occurred while rejecting CCB recovery",
      error: []
    });
  }
});

// fetch details for view loan via society acc_no/group_code/group_name
ccb_recovRouter.post("/search_shg_grp_view", async (req, res) => {
 try{
   const { tenant_id,branch_code,group_name_view} = req.body;
  //  console.log(req.body,'p');
   
   var select = "a.group_code,b.group_name,a.loan_acc_no",
   table_name = "bdccb.td_loan_member a LEFT JOIN bdccb.md_group b ON a.group_code = b.group_code",
   whr = `a.tenant_id = '${tenant_id}' AND a.branch_id = '${branch_code}' AND (a.group_code::TEXT ILIKE '%${group_name_view}%' OR a.loan_acc_no::TEXT ILIKE '%${group_name_view}%' OR b.group_name::TEXT ILIKE '%${group_name_view}%') GROUP BY a.group_code,b.group_name,a.loan_acc_no`,
   order = null;
   var shg_search_grp_view = await db_Select(select, table_name, whr, order);

   if (shg_search_grp_view.suc !== 1 || shg_search_grp_view.msg.length === 0) {
    return res.send({
    success: true,
    msg: "No data found",
    data: []
     });
    }

   let groupCode = shg_search_grp_view.msg[0].group_code;
   let loanAccNo = shg_search_grp_view.msg[0].loan_acc_no;

   // fetch group details based on above details
   var select1 = "a.group_code,a.branch_code,c.branch_name,a.group_name,a.phone1,a.sahayika_id,d.sahayika_name,a.group_addr,a.dist_id,e.dist_name,a.block_id,f.block_name,a.ps_id,g.ps_name,a.po_id,h.post_name,a.gp_id,i.gp_name,a.village_id,j.vill_name,a.pin_no,a.open_close_flag,a.grp_open_dt,a.grp_close_dt,a.delete_flag,a.direct_indirect_flag,a.pacs_id,k.branch_name AS pacs_name",
   table_name1 = "bdccb.md_group a LEFT JOIN bdccb.td_loan_member b ON a.group_code = b.group_code LEFT JOIN public.md_branch c ON a.branch_code = c.branch_id LEFT JOIN bdccb.md_sahayika d ON a.sahayika_id = d.sahayika_id LEFT JOIN public.md_district e ON a.dist_id = e.dist_code LEFT JOIN public.md_block f ON a.block_id = f.block_id LEFT JOIN public.md_police_station g ON a.ps_id = g.ps_id LEFT JOIN public.md_postoffice h ON a.po_id = h.po_id LEFT JOIN public.md_gp i ON a.gp_id = i.gp_id LEFT JOIN public.md_village j ON a.village_id = j.vill_id LEFT JOIN public.md_branch k ON a.pacs_id = k.branch_id",
   whr1 = `a.group_code = '${groupCode}' AND a.branch_code = '${branch_code}' AND a.delete_flag = 'N' AND b.loan_acc_no = '${loanAccNo}' GROUP BY a.group_code,a.branch_code,c.branch_name,a.group_name,a.phone1,a.sahayika_id,d.sahayika_name,a.group_addr,a.dist_id,e.dist_name,a.block_id,f.block_name,a.ps_id,g.ps_name,a.po_id,h.post_name,a.gp_id,i.gp_name,a.village_id,j.vill_name,a.pin_no,a.open_close_flag,a.grp_open_dt,a.grp_close_dt,a.delete_flag,a.direct_indirect_flag,a.pacs_id,k.branch_name`,
   order1 = null;
   var shg_search_grp_view_dtls = await db_Select(select1, table_name1, whr1, order1);

  let shg_grpData = (shg_search_grp_view_dtls.suc === 1 && Array.isArray(shg_search_grp_view_dtls.msg))
  ? shg_search_grp_view_dtls.msg
  : [];

   let finalData = (shg_search_grp_view.msg || []).map(item => {
      return {...item,
      group_details: shg_grpData
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
      msg:"Error occurred while fetch shg group view details",
      error: []
    });
  }
});

// FETCH SOCIETY LOAN DETAILS
ccb_recovRouter.post("/fetch_ccb_loan_dtls", async (req, res) => {
  try{
  const { tenant_id,branch_code,group_code,loan_acc_no } = req.body;

  var select = "a.loan_id,a.loan_acc_no,a.branch_shg_id,a.period,a.curr_roi,a.penal_roi,TO_CHAR(a.disb_dt, 'YYYY-MM-DD') AS disb_dt,a.disb_amt,a.pay_mode,TO_CHAR(a.rep_start_dt, 'YYYY-MM-DD') AS rep_start_dt,TO_CHAR(a.rep_end_dt, 'YYYY-MM-DD') AS rep_end_dt,(a.curr_prn + a.curr_intt) AS cuurent_loan_outstanding",
  table_name = "bdccb.td_loan a",
  whr = `a.tenant_id = '${tenant_id}' AND a.branch_id = '${branch_code}' AND a.group_code = '${group_code}' AND EXISTS ( SELECT 1 
    FROM bdccb.td_loan_member b
    WHERE b.group_code = a.group_code
    AND b.loan_acc_no = '${loan_acc_no}'
  )`,
  order = null;
  var fetch_ccb_loan_dtls = await db_Select(select,table_name,whr,order);

  if (fetch_ccb_loan_dtls.suc !== 1 || fetch_ccb_loan_dtls.msg.length === 0) {
    return res.send({
    success: true,
    msg: "No data found",
    data: []
     });
  }

   let loanCode = fetch_ccb_loan_dtls.msg[0].loan_id;
   let branch_shg_id = fetch_ccb_loan_dtls.msg[0].branch_shg_id;

  // FETCH LOAN TRANSACTION DETAILS BASED ON GROUP 
  var select1 = "TO_CHAR(a.trans_dt, 'YYYY-MM-DD') AS trans_dt,a.trans_id,a.loan_id,a.loan_ac_no,a.trans_type,COALESCE(a.dr_amt,0) AS dr_amt,COALESCE(a.cr_amt,0) AS cr_amt,COALESCE(a.curr_prn + a.curr_intt,0) AS outstanding,a.approval_status,a.approved_by,TO_CHAR(a.approved_dt, 'YYYY-MM-DD') AS approved_dt",
  table_name1 = "bdccb.td_loan_transactions a",
  whr1 = `a.tenant_id = '${tenant_id}' AND a.branch_shg_id = '${branch_shg_id}' AND a.loan_id = '${loanCode}'`,
  order1 = `a.loan_id, a.trans_id`;
  var fetch_ccb_loan_dtls_trans = await db_Select(select1,table_name1,whr1,order1);

  let ccb_transData = (fetch_ccb_loan_dtls_trans.suc === 1 && Array.isArray(fetch_ccb_loan_dtls_trans.msg))
  ? fetch_ccb_loan_dtls_trans.msg
  : [];

  let finalData_trans = (fetch_ccb_loan_dtls.msg || []).map(item => {
      return {...item,
      trans_details: ccb_transData
    };
    });

  return res.send({
    success: true,
    msg: "Fetch shg loan details with transaction",
    data: finalData_trans
  });
  }catch(error){
    console.log(error);
    return res.send({
      success:false,
      msg:"Error occurred while fetch shg loan transaction details",
      error: []
    });
  }
});

// FETCH INDIVITUAL MEMBER DETAILS
ccb_recovRouter.post("/fetch_indivitual_shg_member", async (req, res) => {
  try{
  const { loan_id,tenant_id,branch_code,group_code,loan_acc_no } = req.body;

  var select = "b.member_name,a.loan_id,a.ccb_loan_id,a.member_code,COALESCE(a.prn_amt + a.intt_amt,0) AS member_outstanding",
  table_name = "bdccb.td_loan_member a LEFT JOIN bdccb.md_member b ON a.tenant_id = b.tenant_id AND a.member_code = b.member_code AND a.group_code = b.group_code",
  whr = `a.ccb_loan_id = '${loan_id}' AND a.tenant_id = '${tenant_id}' AND a.branch_id = '${branch_code}' AND a.group_code = '${group_code}' AND a.loan_acc_no = '${loan_acc_no}'`,
  order = `a.loan_id`;
  var fetch_shg_member = await db_Select(select,table_name,whr,order);

  if (fetch_shg_member.suc !== 1 || fetch_shg_member.msg.length === 0) {
    return res.send({
    success: true,
    msg: "No data found",
    data: []
     });
  }

  return res.send({
    success: true,
    msg: "Shg Member details",
    data: fetch_shg_member.msg
  })
  }catch(error){
    console.log(error);
    return res.send({
      success:false,
      msg:"Error occurred while fetch shg indivitual membe",
      error: []
    });
  }
});

// FETCH INDIVITUAL MEMBER DETAILS WITH MEMBER TRANSACTIONS
ccb_recovRouter.post("/fetch_indivitual_shg_member_loan", async (req, res) => {
  try{
  const { ccb_loan_id,tenant_id,loan_id } = req.body;

  var select1 = "TO_CHAR(a.trans_date, 'YYYY-MM-DD') AS trans_date,a.trans_id,a.loan_id,a.ccb_loan_id,a.loan_acc_no,a.trans_type,COALESCE(a.dr_amt,0) AS dr_amt,COALESCE(a.cr_amt,0) AS cr_amt,COALESCE(a.curr_prn + a.curr_intt,0) AS outstanding,a.approval_status,a.approved_by,TO_CHAR(a.approved_dt, 'YYYY-MM-DD') AS approved_dt",
  table_name1 = "bdccb.td_loan_member_trans a",
  whr1 = `a.loan_id = '${loan_id}' AND a.ccb_loan_id = '${ccb_loan_id}' AND a.tenant_id = '${tenant_id}'`,
  order1 = `a.loan_id,a.trans_id`;
  var fetch_shg_member_transaction = await db_Select(select1,table_name1,whr1,order1);

  if(fetch_shg_member_transaction.suc === 1 && fetch_shg_member_transaction.msg.length > 0){
     return res.send({
    success: true,
    msg: "Shg Member loan transaction details",
    data: fetch_shg_member_transaction.msg
  })
  }else{
     return res.send({
    success: true,
    msg: "Shg Member loan transaction details not found",
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

module.exports = {ccb_recovRouter}