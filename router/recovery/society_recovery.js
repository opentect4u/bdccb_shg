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
   const {society_acc_no,branch_id,tenant_id,loan_to} = req.body;
  //  console.log(req.body);

   var select = "a.group_code,b.group_name,a.period,a.curr_roi,a.penal_roi,TO_CHAR(a.disb_dt, 'YYYY-MM-DD') AS disb_dt,a.disb_amt,SUM(a.curr_prn + a.curr_intt) AS loan_outstanding",
   table_name = "bdccb.td_loan a LEFT JOIN bdccb.md_group b ON a.group_code = b.group_code",
   whr = loan_to == 'S' ? `a.loan_acc_no = '${society_acc_no}' AND a.tenant_id = '${tenant_id}' AND a.branch_id = '${branch_id}'` : `a.loan_acc_no = '${society_acc_no}' AND a.tenant_id = '${tenant_id}' AND a.branch_shg_id = '${branch_id}' GROUP BY a.group_code,b.group_name,a.period,a.curr_roi,a.penal_roi,a.disb_dt,a.disb_amt`,
   order = null;
   var fetch_soc_loan_dtls = await db_Select(select,table_name,whr,order);

   if(fetch_soc_loan_dtls.suc === 1 && fetch_soc_loan_dtls.msg.length > 0){
     /* -------- Fetch Member recovery Details -------- */
     var select_mem_recov = "a.loan_id,b.member_code,c.member_name,a.ccb_loan_id,COALESCE(a.cr_amt,0) AS cr_amt,(COALESCE(b.prn_amt,0)) AS mem_outstanding",
     table_name_mem_recov = "bdccb.td_loan_member_trans_temp a LEFT JOIN bdccb.td_loan_member b ON a.loan_id = b.loan_id AND a.tenant_id = b.tenant_id AND a.ccb_loan_id = b.ccb_loan_id LEFT JOIN bdccb.md_member c ON b.member_code = c.member_code AND b.group_code = c.group_code",
     whr_mem_recov = loan_to == 'S' ? `a.loan_acc_no = '${society_acc_no}' AND a.tenant_id = '${tenant_id}' AND a.branch_id = '${branch_id}' AND a.approval_status = 'U'` : `a.loan_acc_no = '${society_acc_no}' AND a.tenant_id = '${tenant_id}' AND a.branch_shg_id = '${branch_id}' AND a.approval_status = 'U'`,
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

  let result = [];

  for(let mem of memb_loan){
     let mem_outstanding = Number(mem.mem_outstanding);

     // uniform interest calculation
     let calc_interest = (totalInterest * mem_outstanding) / currPrincipal;
    
    result.push({
      loan_id: mem.loan_id,
      member_name: mem.member_name,
      mem_amount: mem.mem_amount,
      mem_outstanding: mem_outstanding,
      calculated_interest: Number(calc_interest.toFixed(2)),
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
      prn_recov: prn_recov,
      intt_recov: intt_recov,
      remaining_interest: remaining_interest
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
  const {ccb_loan_id,tenant_id,branch_id,loan_acc_no,loan_to,society_recov,created_by,ip_address} = req.body;

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

    let current_prn_amt = Number(dt.curr_prn) - Number(dt.prn_recov);
    let current_intt_amt = Number(dt.calculated_interest) - Number(dt.intt_recov);

    const table4 = "bdccb.td_loan_member";
    const columns4 = ["prn_amt","intt_amt","modified_by","modified_at","ip_address"];
    const values4 = [current_prn_amt,current_intt_amt,created_by,datetime,ip_address];
    const whereColumns4 = ["loan_id","ccb_loan_id","tenant_id"];
    const whereValues4 = [dt.loan_id,ccb_loan_id,tenant_id];
    const flag4 = 1;
    const soc_trans_result4 = await saveRecord(table4,columns4,values4,whereColumns4,whereValues4,flag4);

    if (!soc_trans_result4 || soc_trans_result4.suc !== 1) {
    return res.send({
      success: false,
      msg: "Failed to update loan details",
      data: []
      });
    }

   const select = "SUM(prn_amt) as total_prn,SUM(intt_amt) as total_intt";
   const table = "bdccb.td_loan_member";
   const where = `ccb_loan_id='${ccb_loan_id}' AND tenant_id='${tenant_id}'`;
   const order = null;  
   const loanSum = await db_Select(select, table, where, order);

   let total_curr_prn = loanSum[0].total_prn || 0;
   let total_curr_intt = loanSum[0].total_intt || 0;

   const table5 = "bdccb.td_loan_transactions";
   const columns5 = ["curr_prn","curr_intt","modified_by","modified_dt","ip_address"];
   const values5 = [total_curr_prn,total_curr_intt,created_by,datetime,ip_address];
   const whereColumns5 = ["loan_id","tenant_id"];
   const whereValues5 = [ccb_loan_id,tenant_id];
   const flag5 = 1;
   const updateLoans = await saveRecord(table5,columns5,values5,whereColumns5,whereValues5,flag5);

   if (!updateLoans || updateLoans.suc !== 1) {
    return res.send({
    success: true,
    msg:"Failed to update transaction table"
  });
  }

   const table6 = "bdccb.td_loan";
   const columns6 = ["curr_prn","curr_intt","modified_by","modified_dt","ip_address"];
   const values6 = [total_curr_prn,total_curr_intt,created_by,datetime,ip_address];
   const whereColumns6 = ["loan_id","tenant_id"];
   const whereValues6 = [ccb_loan_id,tenant_id];
   const flag6 = 1;
   const updateLoan = await saveRecord(table6,columns6,values6,whereColumns6,whereValues6,flag6);

   if (!updateLoan || updateLoan.suc !== 1) {
    return res.send({
    success: true,
    msg:"Failed to update td_loan table"
  });
  }
}
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

module.exports = {society_recovRouter}