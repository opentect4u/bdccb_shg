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
    const values2 = [date,ccb_trans_id,dt.loan_id,ccb_loan_id,tenant_id,branch_id,loan_to,branch_shg_id,loan_acc_no,'I',Number(dt.calculated_interest),0,0,0,0,0,Number(dt.curr_prn),Number(dt.calculated_interest),0,0,'U',created_by,datetime,ip_address];
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

    let current_prn = Number(dt.curr_prn) - Number(dt.prn_recov);
    let current_intt_prn = Number(dt.calculated_interest) - Number(dt.intt_recov);

    const table3 = "bdccb.td_loan_member_trans";
    const columns3 = ["trans_date","trans_id","loan_id","ccb_loan_id","tenant_id","branch_id","loan_to","branch_shg_id","loan_acc_no","trans_type","dr_amt","cr_amt","curr_prn_recov","curr_intt_recov","ovd_prn_recov","ovd_intt_recov","curr_prn","curr_intt","ovd_prn","ovd_intt","approval_status","created_by","created_dt","ip_address"];
    const values3 = [date,ccb_trans_ids,dt.loan_id,ccb_loan_id,tenant_id,branch_id,loan_to,branch_shg_id,loan_acc_no,'R',0,Number(dt.amount),Number(dt.prn_recov),Number(dt.intt_recov),0,0,current_prn,current_intt_prn,0,0,'U',created_by,datetime,ip_address];
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

    let tot_curr_prn_amt = ccb_recov.reduce((sum, item) => sum + Number(item.curr_prn), 0);
    let tot_cal_intt_amt = ccb_recov.reduce((sum, item) => sum + Number(item.calculated_interest), 0);
    // let tot_coll_recov_amt = ccb_recov.reduce((sum, item) => sum + Number(item.amount), 0);
    // let tot_curr_prn_recov = ccb_recov.reduce((sum, item) => sum + Number(item.prn_recov), 0);
    // let tot_curr_intt_recov = ccb_recov.reduce((sum, item) => sum + Number(item.intt_recov), 0);
    let tot_current_prn = Number(tot_curr_prn_amt) - Number(prn_amt);
    let tot_current_intt = Number(tot_cal_intt_amt) - Number(intt_amt);
    let tot_coll_recov_amt = Number(prn_amt) + Number(intt_amt);

    const table5 = "bdccb.td_loan_transactions";
    const columns5 = ["trans_dt","trans_id","tenant_id","loan_to","branch_shg_id","loan_id","loan_ac_no","trans_type","dr_amt","cr_amt","curr_prn_recov","curr_intt_recov","ovd_prn_recov","ovd_intt_recov","curr_prn","curr_intt","ovd_prn","ovd_intt","approval_status","created_by","created_dt","ip_address"];
    const values5 = [date,soc_td_trans_ids,tenant_id,loan_to,branch_shg_id,ccb_loan_id,loan_acc_no,'I',tot_cal_intt_amt,0,0,0,0,0,Number(loan_outstanding),tot_cal_intt_amt,0,0,'U',created_by,datetime,ip_address];
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
    const values7 = [date,ccb_td_tran_ids,tenant_id,loan_to,branch_shg_id,ccb_loan_id,loan_acc_no,'R',0,tot_coll_recov_amt,prn_amt,intt_amt,0,0,tot_current_prn,tot_current_intt,0,0,'U',created_by,datetime,ip_address];
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

// FETCH CCB RECOVERY DETAILS

module.exports = {ccb_recovRouter}