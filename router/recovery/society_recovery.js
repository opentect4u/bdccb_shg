const { db_Select, saveRecord, deleteRecord } = require("../../model/pgcommon");
const express = require("express"),
society_recovRouter = express.Router();

const members_trans_id = async () => {
    const timestamp = new Date().getTime();
    // const random = Math.floor(Math.random() * 1000000);
    const newPayId = `${timestamp}`;
    return(newPayId);
};
  
  // FETCH LOAN DETAILS BASED ON SOCIETY LOAN ACC NO
society_recovRouter.post("/fetch_loan_dtls_based_socacc_no", async (req, res) => {
  try{
   const {society_acc_no,branch_id,tenant_id,loan_to,ccb_loan_id} = req.body;
   console.log(req.body);

   var select1 = " COUNT(*) AS cnt",
   table1 = "bdccb.td_loan_member a LEFT JOIN bdccb.td_loan_member_trans b ON a.loan_id = b.loan_id AND a.ccb_loan_id = b.ccb_loan_id",
   whr1 = `a.society_acc_no = '${society_acc_no}' AND a.tenant_id = '${tenant_id}' ${loan_to == 'S' ? `AND a.branch_id = '${branch_id}'`  : `AND a.branch_shg_id = '${branch_id}'`} AND b.approval_status = 'U'`,
   order1 = null;
   var fetch_unapprove_data = await db_Select(select1,table1,whr1,order1);
  //  console.log(fetch_unapprove_data);
   
   let unapprove_count = Number(fetch_unapprove_data.msg[0].cnt || 0);

   if (unapprove_count > 0) {
   return res.send({
    success: true,
    msg: "Unapproved transactions are pending for this loan account no",
    data: [],
   });
   }
 
   var select = "a.group_code,b.group_name,a.period,a.curr_roi,a.penal_roi,TO_CHAR(a.disb_dt, 'YYYY-MM-DD') AS disb_dt,SUM(a.disb_amt) AS disb_amt,SUM(a.prn_amt + a.intt_amt) AS loan_outstanding",
   table_name = "bdccb.td_loan_member a LEFT JOIN bdccb.md_group b ON a.group_code = b.group_code",
   whr = loan_to == 'S' ? `a.loan_acc_no = '${society_acc_no}' AND a.tenant_id = '${tenant_id}' AND a.branch_id = '${branch_id}'` : `a.society_acc_no = '${society_acc_no}' AND a.tenant_id = '${tenant_id}' AND a.branch_shg_id = '${branch_id}' GROUP BY a.group_code,b.group_name,a.period,a.curr_roi,a.penal_roi,a.disb_dt`,
   order = null;
   var fetch_soc_loan_dtls = await db_Select(select,table_name,whr,order);

   if(fetch_soc_loan_dtls.suc === 1 && fetch_soc_loan_dtls.msg.length > 0){
     /* -------- Fetch Member recovery Details -------- */
     var select_mem_recov = "a.loan_id,b.member_code,c.member_name,a.ccb_loan_id,COALESCE(SUM(a.cr_amt),0) AS cr_amt,(COALESCE(b.prn_amt,0)) AS mem_outstanding",
     table_name_mem_recov = "bdccb.td_loan_member_trans_temp a LEFT JOIN bdccb.td_loan_member b ON a.loan_id = b.loan_id AND a.tenant_id = b.tenant_id AND a.ccb_loan_id = b.ccb_loan_id LEFT JOIN bdccb.md_member c ON b.member_code = c.member_code AND b.group_code = c.group_code",
     whr_mem_recov = loan_to == 'S' ? `a.loan_acc_no = '${society_acc_no}' AND a.tenant_id = '${tenant_id}' AND a.branch_id = '${branch_id}' AND a.ccb_loan_id = '${ccb_loan_id}' AND a.approval_status = 'U' GROUP BY a.loan_id,b.member_code,c.member_name,a.ccb_loan_id,b.prn_amt` : `a.loan_acc_no = '${society_acc_no}' AND a.tenant_id = '${tenant_id}' AND a.branch_shg_id = '${branch_id}' AND a.ccb_loan_id = '${ccb_loan_id}' AND a.approval_status = 'U' GROUP BY a.loan_id,b.member_code,c.member_name,a.ccb_loan_id,b.prn_amt`,
     order_mem_recov = null;
     var fetch_member_dtls = await db_Select(select_mem_recov, table_name_mem_recov, whr_mem_recov, order_mem_recov);

     // attach member list under data
     fetch_soc_loan_dtls.msg[0].member_list = fetch_member_dtls.suc === 1 && fetch_member_dtls.msg.length > 0 ? fetch_member_dtls.msg : [];

     return res.send({
        success: true,
        msg: "Fetch loan details",
        data: fetch_soc_loan_dtls.msg,
     });
   }else {
    return res.send({
    success: true,
    msg: "loan details not found",
    data: [],
  });
   }
  
  }catch (error) {
    console.error("Error in while fetch loan dtls:", error);
    return res.send({
    success: false,
    msg: "Internal server error",
    errorCode: "SERVER_ERROR"
    });
    }
});

// CALCULATE INTEREST AMOUNT ON SOCIETY LEVEL
society_recovRouter.post("/calculate_prn_intt_amt", async (req, res) => {
  try{
  const {curr_prn,prn_amt,intt_amt,memb_loan,created_by,ip_address} = req.body;  

  let currPrincipal = Number(curr_prn);
  let totalInterest = Number(intt_amt);
  console.log(currPrincipal,totalInterest);
  

  let result = [];

  for(let mem of memb_loan){
     let mem_outstanding = Number(mem.mem_outstanding);

     // uniform interest calculation
    //  let calc_interest = Math.round((totalInterest * mem_outstanding) / currPrincipal);
    //  let calc_interest = Math.round((totalInterest / currPrincipal) * mem_outstanding);
    let ratio = Number((totalInterest / currPrincipal).toFixed(3));
    console.log(ratio,'ratio');
    
    let calc_interest = Math.round(ratio * mem_outstanding);
    console.log(calc_interest,'calc_interest');
    
    
    result.push({
      loan_id: mem.loan_id,
      member_name: mem.member_name,
      mem_amount: mem.mem_amount,
      mem_outstanding: mem_outstanding,
      // calculated_interest: Number(calc_interest.toFixed(2)),
      calculated_interest: calc_interest,
    });
  }
  return res.send({
        success:true,
        msg:"Calculation done",
        data:result
  })
  }catch (error) {
    console.error("Error in while calculate principal and interest amount:", error);
    return res.send({
    success: false,
    msg: "Internal server error",
    errorCode: "SERVER_ERROR"
    });
    }
});

// CALCULATE PRINCIPAL AND INTEREST RECOVERY
society_recovRouter.post("/calculate_prn_intt_recov", async (req, res) =>{
 try{
  const { memb_loan_amt } = req.body;  
//   console.log(req.body,'lo');
  

  let result = [];

  for(let memb of memb_loan_amt){
     let mem_amount = Number(memb.mem_amount);
     let calculated_interest = Number(memb.calculated_interest);

     let prn_recov = 0;
     let intt_recov = 0;
     let remaining_interest = 0;

     if ((mem_amount - calculated_interest) > 0 && mem_amount >= calculated_interest) {
     // Case 1
        intt_recov = calculated_interest;
        prn_recov = mem_amount - calculated_interest;
     } else if (mem_amount < calculated_interest) {
     // Case 2
        intt_recov = mem_amount;
        prn_recov = 0;
        remaining_interest = calculated_interest - mem_amount;
     }

    result.push({
      loan_id: memb.loan_id,
      member_name: memb.member_name,
      mem_amount: memb.mem_amount,
      mem_outstanding: memb.mem_outstanding,
      calculated_interest: memb.calculated_interest,
      prn_recov: Math.round(prn_recov),
      intt_recov: Math.round(intt_recov),
      remaining_interest: Math.round(remaining_interest)
    });
  }
  return res.send({
        success:true,
        msg:"Recovery Calculation done",
        data:result
  })
  }catch (error) {
    console.error("Error in while calculate principal and interest recovery:", error);
    return res.send({
    success: false,
    msg: "Internal server error",
    errorCode: "SERVER_ERROR"
    });
    }
});

// SUBMIT RECOVERY IN SOCIETY LEVEL
society_recovRouter.post("/submit_society_recovery", async (req, res) => {
  try{
  const {ccb_loan_id,tenant_id,branch_id,loan_acc_no,loan_to,loan_outstanding,prn_amt,intt_amt,society_recov,created_by,ip_address} = req.body;

  let datetime = new Date().toISOString().slice(0, 19).replace("T", " ");
  let date = new Date().toISOString().slice(0, 10);

  for (const dt of society_recov) { 
    let soc_trans_id = await members_trans_id();

    const table2 = "bdccb.td_loan_member_trans";
    const columns2 = ["trans_date","trans_id","loan_id","ccb_loan_id","tenant_id","branch_id","loan_to","branch_shg_id","loan_acc_no","trans_type","dr_amt","cr_amt","curr_prn_recov","curr_intt_recov","ovd_prn_recov","ovd_intt_recov","curr_prn","curr_intt","ovd_prn","ovd_intt","approval_status","created_by","created_dt","ip_address"];
    const values2 = [date,soc_trans_id,dt.loan_id,ccb_loan_id,tenant_id,branch_id,loan_to,branch_id,loan_acc_no,'I',Number(dt.calculated_interest),0,0,0,0,0,Number(dt.curr_prn),Number(dt.calculated_interest),0,0,'U',created_by,datetime,ip_address];
    const whereColumns2 = [];
    const whereValues2 = [];
    const flag2 = 0;
    const soc_trans_result = await saveRecord(table2,columns2,values2,whereColumns2,whereValues2,flag2);

    if (!soc_trans_result || soc_trans_result.suc !== 1) {
    return res.send({
      success: false,
      msg: "Failed to insert loan Interest row in society recovery time",
      data: []
      });
    }

    if (Number(dt.amount) > 0) {

    let soc_trans_ids = await members_trans_id();

    let current_prn = Number(dt.curr_prn) - Number(dt.prn_recov);
    let current_intt_prn = Number(dt.calculated_interest) - Number(dt.intt_recov);

    const table3 = "bdccb.td_loan_member_trans";
    const columns3 = ["trans_date","trans_id","loan_id","ccb_loan_id","tenant_id","branch_id","loan_to","branch_shg_id","loan_acc_no","trans_type","dr_amt","cr_amt","curr_prn_recov","curr_intt_recov","ovd_prn_recov","ovd_intt_recov","curr_prn","curr_intt","ovd_prn","ovd_intt","approval_status","created_by","created_dt","ip_address"];
    const values3 = [date,soc_trans_ids,dt.loan_id,ccb_loan_id,tenant_id,branch_id,loan_to,branch_id,loan_acc_no,'R',0,Number(dt.amount),Number(dt.prn_recov),Number(dt.intt_recov),0,0,current_prn,current_intt_prn,0,0,'U',created_by,datetime,ip_address];
    const whereColumns3 = [];
    const whereValues3 = [];
    const flag3 = 0;
    const soc_trans_result3 = await saveRecord(table3,columns3,values3,whereColumns3,whereValues3,flag3);

    if (!soc_trans_result3 || soc_trans_result3.suc !== 1) {
    return res.send({
      success: false,
      msg: "Failed to insert loan Recovery row in society recovery time",
      data: []
      });
    }
}

    // let current_prn_amt = Number(dt.curr_prn) - Number(dt.prn_recov);
    // let current_intt_amt = Number(dt.calculated_interest) - Number(dt.intt_recov);

    // const table4 = "bdccb.td_loan_member";
    // const columns4 = ["prn_amt","intt_amt","modified_by","modified_at","ip_address"];
    // const values4 = [current_prn_amt,current_intt_amt,created_by,datetime,ip_address];
    // const whereColumns4 = ["loan_id","ccb_loan_id","tenant_id"];
    // const whereValues4 = [dt.loan_id,ccb_loan_id,tenant_id];
    // const flag4 = 1;
    // const soc_trans_result4 = await saveRecord(table4,columns4,values4,whereColumns4,whereValues4,flag4);

    // if (!soc_trans_result4 || soc_trans_result4.suc !== 1) {
    // return res.send({
    //   success: false,
    //   msg: "Failed to update loan details",
    //   data: []
    //   });
    // }

  }

  let soc_td_trans_ids = await members_trans_id();

    let tot_curr_prn_amt = society_recov.reduce((sum, item) => sum + Number(item.curr_prn), 0);
    let tot_cal_intt_amt = society_recov.reduce((sum, item) => sum + Number(item.calculated_interest), 0);
    // let tot_coll_recov_amt = society_recov.reduce((sum, item) => sum + Number(item.amount), 0);
    let tot_curr_prn_recov = society_recov.reduce((sum, item) => sum + Number(item.prn_recov), 0);
    let tot_curr_intt_recov = society_recov.reduce((sum, item) => sum + Number(item.intt_recov), 0);
    let tot_current_prn = Number(tot_curr_prn_amt) - Number(prn_amt);
    let tot_current_intt = Number(intt_amt) - Number(intt_amt);
    let tot_coll_recov_amt = Number(prn_amt) + Number(intt_amt);

    const table5 = "bdccb.td_loan_transactions";
    const columns5 = ["trans_dt","trans_id","tenant_id","loan_to","branch_shg_id","loan_id","loan_ac_no","trans_type","dr_amt","cr_amt","curr_prn_recov","curr_intt_recov","ovd_prn_recov","ovd_intt_recov","curr_prn","curr_intt","ovd_prn","ovd_intt","approval_status","created_by","created_dt","ip_address"];
    const values5 = [date,soc_td_trans_ids,tenant_id,loan_to,branch_id,ccb_loan_id,loan_acc_no,'I',intt_amt,0,0,0,0,0,Number(loan_outstanding),intt_amt,0,0,'U',created_by,datetime,ip_address];
    const whereColumns5 = [];
    const whereValues5 = [];
    const flag5 = 0;
    const insertLoans = await saveRecord(table5,columns5,values5,whereColumns5,whereValues5,flag5);

   if (!insertLoans || insertLoans.suc !== 1) {
    return res.send({
    success: true,
    msg:"Failed to update transaction table"
  });
  }

    let soc_td_tran_ids = await members_trans_id();

    const table7 = "bdccb.td_loan_transactions";
    const columns7 = ["trans_dt","trans_id","tenant_id","loan_to","branch_shg_id","loan_id","loan_ac_no","trans_type","dr_amt","cr_amt","curr_prn_recov","curr_intt_recov","ovd_prn_recov","ovd_intt_recov","curr_prn","curr_intt","ovd_prn","ovd_intt","approval_status","created_by","created_dt","ip_address"];
    const values7 = [date,soc_td_tran_ids,tenant_id,loan_to,branch_id,ccb_loan_id,loan_acc_no,'R',0,tot_coll_recov_amt,prn_amt,intt_amt,0,0,tot_current_prn,tot_current_intt,0,0,'U',created_by,datetime,ip_address];
    const whereColumns7 = [];
    const whereValues7 = [];
    const flag7 = 0;
    const soc_trans_result7 = await saveRecord(table7,columns7,values7,whereColumns7,whereValues7,flag7);

    if (!soc_trans_result7 || soc_trans_result7.suc !== 1) {
    return res.send({
      success: false,
      msg: "Failed to insert loan Recovery row in society recovery time",
      data: []
      });
    }

  //  const select = "COALESCE(SUM(prn_amt),0) as total_prn, COALESCE(SUM(intt_amt),0) as total_intt";
  //  const table = "bdccb.td_loan_member";
  //  const where = `ccb_loan_id='${ccb_loan_id}' AND tenant_id='${tenant_id}'`;
  //  const order = null;  
  //  const loanSum = await db_Select(select, table, where, order);
  //  console.log("loanSum result:", loanSum);

    //  let total_curr_prn = 0;
    // let total_curr_intt = 0;

//    if (loanSum && loanSum.msg && loanSum.msg.length > 0) {
//   total_curr_prn = Number(loanSum.msg[0].total_prn) || 0;
//   total_curr_intt = Number(loanSum.msg[0].total_intt) || 0;
// }
    // console.log(total_curr_prn,total_curr_intt);

  //  const table6 = "bdccb.td_loan";
  //  const columns6 = ["curr_prn","curr_intt","modified_by","modified_dt","ip_address"];
  //  const values6 = [total_curr_prn,total_curr_intt,created_by,datetime,ip_address];
  //  const whereColumns6 = ["loan_id","tenant_id"];
  //  const whereValues6 = [ccb_loan_id,tenant_id];
  //  const flag6 = 1;
  //  const updateLoan = await saveRecord(table6,columns6,values6,whereColumns6,whereValues6,flag6);

  //  if (!updateLoan || updateLoan.suc !== 1) {
  //   return res.send({
  //   success: true,
  //   msg:"Failed to update td_loan table"
  // });
  // }
   return res.send({
    success: true,
    msg: "Recovery done successfully" 
    });
  }catch(error){
     console.error("Error in while submit society recovery:", error);
    return res.send({
    success: false,
    msg: "Internal server error",
    errorCode: "SERVER_ERROR"
    });
  }
});

// FETCH SOCIETY RECOVERY DETAILS
society_recovRouter.post("/fetch_society_dtls", async (req, res) => {
try{
const { tenant_id, branch_id, from_dt, to_dt, approval_status} = req.body;

var select = "a.loan_id,a.group_code,b.group_name,a.disb_amt,TO_CHAR(c.trans_dt, 'YYYY-MM-DD') AS trans_dt,c.trans_id AS transaction_id,(COALESCE(c.cr_amt,0)) AS credit_amount,c.approval_status",
table_name = `bdccb.td_loan a LEFT JOIN bdccb.md_group b ON a.group_code = b.group_code LEFT JOIN bdccb.td_loan_transactions c ON a.loan_id = c.loan_id`,
whr = `a.tenant_id = '${tenant_id}' AND a.branch_shg_id = '${branch_id}' AND c.trans_type = 'R' AND c.approval_status = '${approval_status}'`;
 if (from_dt && to_dt) {
      whr += ` AND c.trans_dt::date BETWEEN '${from_dt}' AND '${to_dt}'`;
  }
order = `c.trans_id desc,c.trans_dt desc`;
var fetch_society_recovery_data1= await db_Select(select, table_name, whr, order);

if (fetch_society_recovery_data1.suc === 1 && fetch_society_recovery_data1.msg.length > 0) {
return res.send({
  success: true,
  msg: "Fetch society recovery details",
  data: fetch_society_recovery_data1.msg,
  });
}else {
return res.send({
  success: true,
  msg: "No Recovery details found",
  data: [],
});
}
}catch (error) {
    console.error("Error in while fetch society recov dtls:", error);
    return res.send({
      success: false,
      msg: "Internal server error",
      errorCode: "SERVER_ERROR",
    });
  }
});

// AFTER SUBMIT FETCH MEMBER LOAN DETAILS 
society_recovRouter.post("/fetch_soc_mem_dtls", async (req, res) => {
  try{
  const { tenant_id,branch_id,group_code,trans_dt,transaction_id,approval_status } = req.body;

  var select = "a.loan_id,a.group_code,d.group_name,a.loan_acc_no,c.society_acc_no,a.period,a.curr_roi,a.penal_roi,TO_CHAR(a.disb_dt, 'YYYY-MM-DD') AS disb_dt,a.disb_amt,SUM(a.curr_prn + a.curr_intt) AS loan_outstanding,b.curr_prn_recov AS principal_amount,b.curr_intt_recov AS interest_amount",
  table_name = "bdccb.td_loan a LEFT JOIN bdccb.td_loan_transactions b ON a.loan_id = b.loan_id LEFT JOIN bdccb.td_loan_member c ON a.loan_id = c.ccb_loan_id JOIN bdccb.md_group d ON a.group_code = d.group_code",
  whr = `a.tenant_id = '${tenant_id}' AND a.branch_shg_id = '${branch_id}' AND a.group_code = '${group_code}' AND b.trans_dt = '${trans_dt}' AND b.trans_id = '${transaction_id}' AND b.approval_status = '${approval_status}' GROUP BY a.loan_id,a.group_code,d.group_name,a.loan_acc_no,c.society_acc_no,a.period,a.curr_roi,a.penal_roi,a.disb_dt,a.disb_amt,b.curr_prn_recov,b.curr_intt_recov`,
  order = null;
  var fetch_society_loan_dtls1 = await db_Select(select,table_name,whr,order);

  if(fetch_society_loan_dtls1.suc === 1 && fetch_society_loan_dtls1.msg.length > 0){
     /* -------- Fetch Society Member recovery Details -------- */
     
   var select_member = `a.loan_id,a.member_code,b.member_name,
   TO_CHAR(d.trans_date, 'YYYY-MM-DD') AS trans_date,
   d.trans_id AS trans_id,
   d.trans_type,(COALESCE(d.cr_amt,0)) AS credit_amount,

   CASE 
   WHEN d.trans_type = 'R' THEN COALESCE(d.curr_prn_recov,0)
   ELSE 0
   END AS principal_recovery,
   
   CASE 
   WHEN d.trans_type = 'R' THEN COALESCE(d.curr_intt_recov,0)
   ELSE 0
   END AS interest_recovery,
   
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
   AND DATE(d.trans_date) = '${trans_dt}'
   AND d.approval_status = '${approval_status}'`;
   whr_member = `a.tenant_id = '${tenant_id}' AND a.branch_shg_id = '${branch_id}' AND a.group_code = '${group_code}' AND d.trans_type IN ('R','I')`;
   order_member = null ;
   var fetch_member_dtls_trans1 = await db_Select(select_member,table_member,whr_member,order_member);

   // attach member list under data
   fetch_society_loan_dtls1.msg[0].member_list = fetch_member_dtls_trans1.suc === 1 && fetch_member_dtls_trans1.msg.length > 0 ? fetch_member_dtls_trans1.msg : [];
   return res.send({
        success: true,
        msg: "Fetch society member details",
        data: fetch_society_loan_dtls1.msg
     });
   }else {
    return res.send({
    success: true,
    msg: "Society member loan details not found",
    data: []
  });
   }
  }catch (error) {
    console.error("Error in while fetch society member recovery details:", error);
    return res.send({
      success: false,
      msg: "Internal server error",
      errorCode: "SERVER_ERROR",
    });
  }
});

// FETCH SOCIETY RECOVERY DETAILS
society_recovRouter.post("/fetch_society_recov_dtls", async (req, res) => {
try{
const { tenant_id, branch_id, from_dt, to_dt, approval_status} = req.body;

var select = "a.loan_id,a.group_code,b.group_name,a.disb_amt,TO_CHAR(c.trans_dt, 'YYYY-MM-DD') AS trans_dt,c.trans_id AS transaction_id,(COALESCE(c.cr_amt,0)) AS credit_amount,c.approval_status",
table_name = `bdccb.td_loan a LEFT JOIN bdccb.md_group b ON a.group_code = b.group_code LEFT JOIN bdccb.td_loan_transactions c ON a.loan_id = c.loan_id`,
whr = `a.tenant_id = '${tenant_id}' AND a.branch_shg_id = '${branch_id}' AND c.trans_type = 'R' AND c.approval_status = '${approval_status}'`;
 if (from_dt && to_dt) {
      whr += ` AND c.trans_dt::date BETWEEN '${from_dt}' AND '${to_dt}'`;
  }
order = `c.trans_id desc,c.trans_dt desc`;
var fetch_society_recovery_data = await db_Select(select, table_name, whr, order);

if (fetch_society_recovery_data.suc === 1 && fetch_society_recovery_data.msg.length > 0) {
return res.send({
  success: true,
  msg: "Fetch society recovery details",
  data: fetch_society_recovery_data.msg,
  });
}else {
return res.send({
  success: true,
  msg: "No Recovery details found",
  data: [],
});
}
}catch (error) {
    console.error("Error in while fetch society recov dtls:", error);
    return res.send({
      success: false,
      msg: "Internal server error",
      errorCode: "SERVER_ERROR",
    });
  }
});

// FETCH SOCIETY RECOVERY MEMBER DETAILS
society_recovRouter.post("/fetch_soc_mem_recov_dtls", async (req, res) => {
  try{
  const { tenant_id,branch_id,group_code,trans_dt,transaction_id,approval_status } = req.body;

  var select = "a.loan_id,a.group_code,d.group_name,a.loan_acc_no,c.society_acc_no,a.period,a.curr_roi,a.penal_roi,TO_CHAR(a.disb_dt, 'YYYY-MM-DD') AS disb_dt,a.disb_amt,SUM(a.curr_prn + a.curr_intt) AS loan_outstanding,b.curr_prn_recov AS principal_amount,b.curr_intt_recov AS interest_amount",
  table_name = "bdccb.td_loan a LEFT JOIN bdccb.td_loan_transactions b ON a.loan_id = b.loan_id LEFT JOIN bdccb.td_loan_member c ON a.loan_id = c.ccb_loan_id JOIN bdccb.md_group d ON a.group_code = d.group_code",
  whr = `a.tenant_id = '${tenant_id}' AND a.branch_shg_id = '${branch_id}' AND a.group_code = '${group_code}' AND b.trans_dt = '${trans_dt}' AND b.trans_id = '${transaction_id}' AND b.approval_status = '${approval_status}' GROUP BY a.loan_id,a.group_code,d.group_name,a.loan_acc_no,c.society_acc_no,a.period,a.curr_roi,a.penal_roi,a.disb_dt,a.disb_amt,b.curr_prn_recov,b.curr_intt_recov`,
  order = null;
  var fetch_society_loan_dtls = await db_Select(select,table_name,whr,order);

  if(fetch_society_loan_dtls.suc === 1 && fetch_society_loan_dtls.msg.length > 0){
     /* -------- Fetch Society Member recovery Details -------- */
   var select_member = `a.loan_id,a.member_code,b.member_name,
   TO_CHAR(d.trans_date, 'YYYY-MM-DD') AS trans_date,
   d.trans_id AS trans_id,
   d.trans_type,(COALESCE(d.cr_amt,0)) AS credit_amount,

   CASE 
   WHEN d.trans_type = 'R' THEN COALESCE(d.curr_prn_recov,0)
   ELSE 0
   END AS principal_recovery,
   
   CASE 
   WHEN d.trans_type = 'R' THEN COALESCE(d.curr_intt_recov,0)
   ELSE 0
   END AS interest_recovery,
   
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
   AND DATE(d.trans_date) = '${trans_dt}'
   AND d.approval_status = '${approval_status}'`;
   whr_member = `a.tenant_id = '${tenant_id}' AND a.branch_shg_id = '${branch_id}' AND a.group_code = '${group_code}' AND d.trans_type IN ('R','I')`;
   order_member = null ;
   var fetch_member_dtls_trans = await db_Select(select_member,table_member,whr_member,order_member);

   // attach member list under data
   fetch_society_loan_dtls.msg[0].member_list = fetch_member_dtls_trans.suc === 1 && fetch_member_dtls_trans.msg.length > 0 ? fetch_member_dtls_trans.msg : [];
   return res.send({
        success: true,
        msg: "Fetch society member details",
        data: fetch_society_loan_dtls.msg
     });
   }else {
    return res.send({
    success: true,
    msg: "Society member loan details not found",
    data: []
  });
   }
  }catch (error) {
    console.error("Error in while fetch society member recovery details:", error);
    return res.send({
      success: false,
      msg: "Internal server error",
      errorCode: "SERVER_ERROR",
    });
  }
});

// ACCEPT SOCIETY RECOVERY
society_recovRouter.post("/accept_society_recovery", async (req, res) => {
  try{
  const { loan_id,tenant_id,trans_dt,transaction_id,group_code,accept_recovery,created_by,ip_address } = req.body;
  console.log(req.body,'accept');
  
  let datetime = new Date().toISOString().slice(0, 19).replace("T", " ");

  if (!accept_recovery || accept_recovery.length === 0) {
      return res.send({ success : false, msg: 'No data received' });
  }
   
  for(let dt of accept_recovery){
  // Update td_loan_member_trans_temp table
    let table = "bdccb.td_loan_member_trans_temp";
    let columns = ["approval_status","approved_by","approved_dt","ip_address"];
    let values = ['A',created_by,datetime,ip_address];
    let whereColumns = ["loan_id","ccb_loan_id","tenant_id"];
    let whereValues = [dt.loan_id,loan_id,tenant_id];
    let flag = 1; // update flag
    const update_td_loan_member_trans_temp = await saveRecord(table,columns,values,whereColumns,whereValues,flag);  

    if (!update_td_loan_member_trans_temp || update_td_loan_member_trans_temp.suc !== 1) {
    return res.send({
    success: true,
    msg:"Failed to update status in shg level"
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
    const update_td_loan_member_trans_interest = await saveRecord(table3,columns3,values3,whereColumns3,whereValues3,flag3);

    if (!update_td_loan_member_trans_interest || update_td_loan_member_trans_interest.suc !== 1) {
    return res.send({
    success: true,
    msg:"Failed to update interest row status in shg transaction level"
    });
    }
  // }  

  // Update td_loan_member_trans table recovery row
    // let table1 = "bdccb.td_loan_member_trans";
    // let columns1 = ["approval_status","approved_by","approved_dt","ip_address"];
    // let values1 = ['A',created_by,datetime,ip_address];
    // let whereColumns1 = ["trans_date","trans_id","loan_id","ccb_loan_id","tenant_id","trans_type"];
    // let whereValues1 = [dt.trans_date,dt.trans_id,dt.loan_id,loan_id,tenant_id,'R'];
    // let flag1 = 1; // update flag
    // const update_td_loan_member_trans = await saveRecord(table1,columns1,values1,whereColumns1,whereValues1,flag1);

    // if (!update_td_loan_member_trans || update_td_loan_member_trans.suc !== 1) {
    // return res.send({
    // success: true,
    // msg:"Failed to update recovery row status in shg transaction level"
    // });
    // }

    // FETCH CURRENT PRINCIPAL AND INTEREST FROM TD_LOAN_MEMBER_TRANS TABLE
    var select1 = "(COALESCE(a.curr_prn,0)) AS curr_prn,(COALESCE(a.curr_intt,0)) AS curr_intt",
    table_name1 = "bdccb.td_loan_member_trans a",
    whr1 = `a.loan_id = '${dt.loan_id}' AND a.ccb_loan_id = '${loan_id}'`,
    order1 = `CASE WHEN a.trans_type = 'R' THEN 1 ELSE 2 END, a.trans_date DESC,a.trans_id DESC LIMIT 1`;
    var fetch_current_data = await db_Select(select1,table_name1,whr1,order1);
    // console.log(fetch_current_data,'1');
   
    let current_curr_prn = 0;
    let current_curr_intt = 0;

   if(fetch_current_data.msg && fetch_current_data.msg.length > 0){
    current_curr_prn =  fetch_current_data.msg[0].curr_prn ;
    current_curr_intt = fetch_current_data.msg[0].curr_intt ;
    // console.log(current_curr_intt,current_curr_prn,'2');
   }
    
  // Update td_loan_member table
    let table2 = "bdccb.td_loan_member";
    let columns2 = ["prn_amt","intt_amt","modified_by","modified_at","ip_address"];
    let values2 = [current_curr_prn,current_curr_intt,created_by,datetime,ip_address];
    let whereColumns2 = ["loan_id","ccb_loan_id","tenant_id","group_code"];
    let whereValues2 = [dt.loan_id,loan_id,tenant_id,group_code];
    let flag2 = 1; // update flag
    const update_td_loan_member = await saveRecord(table2,columns2,values2,whereColumns2,whereValues2,flag2); 
    
    if (!update_td_loan_member || update_td_loan_member.suc !== 1) {
    return res.send({
    success: true,
    msg:"Failed to update shg level data"
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
    const interest_row = await db_Select(select_int,table_name_int,whr_int);

    let interest_trans_id = null;

    if(interest_row.msg && interest_row.msg.length > 0){
      interest_trans_id = interest_row.msg[0].trans_id;
    }

  // Update td_loan_transactions table interest row
    if(interest_trans_id){
    let table3 = "bdccb.td_loan_transactions";
    let columns3 = ["approval_status","approved_by","approved_dt","ip_address"];
    let values3 = ['A',created_by,datetime,ip_address];
    let whereColumns3 = ["trans_dt","trans_id","loan_id","tenant_id","trans_type"];
    let whereValues3 = [trans_dt,interest_trans_id,loan_id,tenant_id,'I'];
    let flag3 = 1; // update flag
    const update_td_loan_transactions_interest = await saveRecord(table3,columns3,values3,whereColumns3,whereValues3,flag3);

    if (!update_td_loan_transactions_interest || update_td_loan_transactions_interest.suc !== 1) {
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
    const update_td_loan_transactions = await saveRecord(table4,columns4,values4,whereColumns4,whereValues4,flag4);

    if (!update_td_loan_transactions || update_td_loan_transactions.suc !== 1) {
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
    var fetch_current_data = await db_Select(select1,table_name1,whr1,order1);
    // console.log(fetch_current_data,'1');
   
    let current_curr_prn = 0;
    let current_curr_intt = 0;

   if(fetch_current_data.msg && fetch_current_data.msg.length > 0){
    current_curr_prn =  fetch_current_data.msg[0].td_curr_prn ;
    current_curr_intt = fetch_current_data.msg[0].td_curr_intt ;
    // console.log(current_curr_intt,current_curr_prn,'2');
   }

  // Update td_loan table
    let table5 = "bdccb.td_loan";
    let columns5 = ["curr_prn","curr_intt","modified_by","modified_dt","ip_address"];
    let values5 = [current_curr_prn,current_curr_intt,created_by,datetime,ip_address];
    let whereColumns5 = ["loan_id","tenant_id","group_code"];
    let whereValues5 = [loan_id,tenant_id,group_code];
    let flag5 = 1; // update flag
    const update_td_loan = await saveRecord(table5,columns5,values5,whereColumns5,whereValues5,flag5); 
    
    if (!update_td_loan || update_td_loan.suc !== 1) {
    return res.send({
    success: true,
    msg:"Failed to update balance in main table"
    });
    }
   return res.send({
    success: true,
    msg: "Recovery accepted successfully" 
    });
  }catch(error){
    console.log(error);
    return res.send({
      success:false,
      msg:"Error occurred while accept society recovery",
      error: []
    })
  }
});

// CHECK DATE AND ID BEFORE REJECT
// society_recovRouter.post("/check_date_id_before_reject", async (req, res) => {
//   try{
//    const { reject_data } = req.body;

//     if (!reject_data || reject_data.length === 0) {
//       return res.send({ success : false, msg: 'No data received' });
//     }

//     for(let dt of reject_data){
//         const trans_dt = new Date(dt.trans_dt).toISOString().slice(0,10);
//         const trans_id = dt.trans_id;
//         const loan_id = dt.loan_id;

//     var select = "COUNT(*) tot_data",
//     table_name = "bdccb.td_loan_transactions",
//     whr = `trans_dt = '${trans_dt}'
//            AND trans_id > ${trans_id}
//            AND loan_id = ${loan_id}`
//     order = null;
//     var fetch_loans_data = await db_Select(select,table_name,whr,order);
//     console.log(fetch_loans_data,'fetch_loans');

//     // If any record found, return message "no delete"
//     if (fetch_loans_data.suc > 0 && fetch_loans_data.msg.length > 0 && Number(fetch_loans_data.msg[0].tot_data) > 0) {
//       return res.send({ 
//         success: true, 
//         msg: 'Delete not possible' 
//       });
//     }
//   }
//   return res.send({ 
//     success: true, 
//     msg: 'Now delete' 
//   });
//   }catch(error){
//     console.error("Error in while check date and id before reject:", error);
//     return res.send({
//       success: false,
//       msg: "Internal server error",
//       errorCode: "SERVER_ERROR",
//     });
//   }
// })


// REJECT SOCIETY RECOVERY
society_recovRouter.post("/reject_society_recov", async (req, res) => {
  try{
   const {loan_id,tenant_id,trans_dt,transaction_id,group_code,reject_recovery,created_by,ip_address,reject_remarks} = req.body;
   console.log(req.body,'reject');

   let datetime = new Date().toISOString().slice(0,19).replace("T"," ");

   for(let row of reject_recovery){

    let select_fetch = "*";
    let table_fetch = "bdccb.td_loan_member_trans";
    let whr_fetch = `loan_id = '${row.loan_id}' AND ccb_loan_id = '${loan_id}' AND trans_date = '${row.trans_date}' AND trans_id = '${row.trans_id}' AND tenant_id = '${tenant_id}' AND trans_type = '${row.trans_type}'`;

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

   // INSERT INTEREST ROW INTO REJECT TABLE
    //  let int_columns = Object.keys(r_int).filter(c =>
    //       !["rejected_by", "rejected_dt", "rejected_ip_address", "reject_remarks"].includes(c)
    //     );

    //     let int_values = int_columns.map(c => r_int[c]);

    //     int_columns.push("rejected_by", "rejected_dt", "rejected_ip_address", "reject_remarks");
    //     int_values.push(created_by, datetime, ip_address, reject_remarks);

    //     await saveRecord(
    //       "bdccb.td_loan_member_trans_reject",
    //       int_columns,
    //       int_values,
    //       null,
    //       null,
    //       0
    //     );
    //   }     

    // delete td_loan_member_trans table interest row
  const delete_record_interest = await deleteRecord("bdccb.td_loan_member_trans",["trans_date", "trans_id", "loan_id","ccb_loan_id","trans_type"],[row.trans_date, row.trans_id, row.loan_id, loan_id, row.trans_type]);
  //  console.log(delete_record_interest,'delete');

   // Delete from td_loan_member_trans table recovery row
  //  const delete_record = await deleteRecord("bdccb.td_loan_member_trans",["trans_date", "trans_id", "loan_id", "ccb_loan_id","trans_type"],[row.trans_date, row.trans_id, row.loan_id, loan_id, 'R']);
  //  console.log(delete_record,'dedede');
   

   // FETCH CURRENT DATA FROM td_loan_member_trans table
   var select = "(COALESCE(a.curr_prn,0)) AS curr_prn,(COALESCE(a.curr_intt,0)) AS curr_intt",
   table_name = "bdccb.td_loan_member_trans a",
   whr = `a.loan_id = '${row.loan_id}' AND a.ccb_loan_id = '${loan_id}'`,
   order = "a.trans_date DESC, a.trans_id DESC LIMIT 1";
   var fetch_current_data = await db_Select(select,table_name,whr,order);

  //  console.log(fetch_current_data,'curr');
   

   let curr_prn = 0;
   let curr_intt = 0;

   if(fetch_current_data.msg && fetch_current_data.msg.length > 0){
   curr_prn =   fetch_current_data.msg[0].curr_prn;
   curr_intt =  fetch_current_data.msg[0].curr_intt;
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
    const update_td_loan = await saveRecord(table2, columns2, values2, whereColumns2, whereValues2, flag2);
    // console.log(update_td_loan,'ki');
    // console.log(whereValues2,'whereValues2');
    
   }

   // FETCH INTEREST ROW TRANS_ID 
    let select_t = "trans_id";
    let table_t = "bdccb.td_loan_transactions";
    let whr_t = `loan_id = '${loan_id}'
                 AND trans_type = 'I'
                 AND trans_id < '${transaction_id}'`;
    let order_t = "trans_id DESC LIMIT 1";
    let interest_row = await db_Select(select_t, table_t, whr_t, order_t);
    // console.log(interest_row,'kiyt');
    

    // if(interest_row.msg.length > 0){
   let interest_trans_id = interest_row.msg[0].trans_id || null;
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
   whr1 = `a.loan_id = '${loan_id}' AND a.trans_type != 'I'`,
   order1 = "a.trans_dt DESC, a.trans_id DESC LIMIT 1";
   var fetch_current_data1 = await db_Select(select1,table_name1,whr1,order1);
  //  console.log(fetch_current_data1,'hyfr');
   

   let current_curr_prn = 0;
   let current_curr_intt = 0;

   if(fetch_current_data1.msg && fetch_current_data1.msg.length > 0){
    current_curr_prn =  fetch_current_data1.msg[0].td_curr_prn ;
    current_curr_intt = fetch_current_data1.msg[0].td_curr_intt ;
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
      msg: "Society recovery rejected successfully"
   });
   }catch(error){
    console.log(error);
    return res.send({
      success:false,
      msg:"Error occurred while rejecting society recovery",
      error: []
    });
  }
});

module.exports = {society_recovRouter}