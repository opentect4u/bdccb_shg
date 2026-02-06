const { db_Select, saveRecord } = require('../../model/pgcommon');
const express = require('express'),
loanRouter = express.Router();


const loanCode = async (branch_code) => {
 
  const select = `COALESCE(MAX(SUBSTR(loan_id::TEXT, 4)::INTEGER), 0) + 1 AS loan_code`;
 
  const table = "bdccb.td_loan";
  const res = await db_Select(select, table, null, null);
 
  const loan_no = res.msg[0].loan_code;
 
  const loan_code = `${branch_code}${String(loan_no).padStart(4, "0")}`;
 
  return loan_code;
};

const transaction_id = async () => {
    const timestamp = new Date().getTime();
    const newPayId = `${timestamp}`;
    return(newPayId);
};

const balance_id = async () => {
    const timestamp = new Date().getTime();
    const balID = `${timestamp}`;
    return(balID);
};

const periodic = [
  {
    id: "Monthly",
    name: "month",
    div_period: 1,
    tot_period: 12,
  },
  {
    id: "Weekly",
    name: "week",
    div_period: 1,
    tot_period: 48,
  }
];

const interest_cal_amt = async (principal, time, rate, period_mode) => {
  try {
    const period = periodic.filter((p) => p.id == period_mode);

    const periodValue = period[0].tot_period;
    const interest = ((principal * rate) / 100 / periodValue) * time;

    // console.log(interest);
    return Math.round(interest);
  } catch (error) {
    console.error(error.message);
    throw error;
  }
};

function addMonthsSafe(date, months) {
  let d = new Date(date);
  let day = d.getDate();

  d.setMonth(d.getMonth() + months);

  // If overflow (Jan 31 → Feb 28)
  if (d.getDate() < day) {
    d.setDate(0); // last day of previous month
  }

  return d;
}

const genDate = (trans_date, period, mode) => {
  return new Promise((resolve, reject) => {
   
    var emiStartDate = "",
    emiEndDate = "";
    
    var dayList = {
      1: "Sunday",
      2: "Monday",
      3: "Tuesday",
      4: "Wednesday",
      5: "Thursday",
      6: "Friday",
      7: "Saturday",
    };

  var dayRevarseList = {
  Sunday: 1,
  Monday: 2,
  Tuesday: 3,
  Wednesday: 4,
  Thursday: 5,
  Friday: 6,
  Saturday: 7,
};

    switch (mode) {
      // case "Monthly":
      //   var modendDt = new Date(trans_date);

      //   // extract EMI day from transaction date
      //  const emiDate = modendDt.getDate(); 

      //   var modDt = new Date(modendDt.setMonth(modendDt.getMonth() + 1 + Number(period)));
      //   // console.log(modDt,'mod');
        
      //   emiEndDate = new Date(modDt.getFullYear(), modDt.getMonth(), emiDate);
      //   // console.log(emiEndDate,'end');
        

      //    // Start Date = next month same date
      //   var modStDt = new Date(trans_date);
      //   modStDt.setMonth(modStDt.getMonth() + 1);
      //   emiStartDate = new Date(modStDt.getFullYear(),modStDt.getMonth(),emiDate);
      //   console.log(emiStartDate,'emiStartDate');
        
      //   break;

        case "Monthly":
        let disbr = new Date(trans_date);

         // Start EMI next month safely
          emiStartDate = addMonthsSafe(disbr, 1);

          // End EMI after N months safely
          emiEndDate = addMonthsSafe(emiStartDate, Number(period));
          break;

      case "Weekly":
      //   var modendDt = new Date(trans_date);

      //  let selDay = getBankDay(trans_date); 

      //   var emiEndDate = new Date(
      //     modendDt.setDate(modendDt.getDate() + period * 7)
      //   );
        
      //   for (
      //     let i = emiEndDate.getDate();          
      //     i <
      //     new Date(
      //       emiEndDate.getFullYear(),
      //       emiEndDate.getMonth(),
      //       0
      //     ).getDate();
      //     i++
          
      //   ) {
      //     var selectedMon = dayList[selDay];
      //     if (selectedMon == (new Date(emiEndDate), "dddd")) {
      //       break;
      //     }
      //     emiEndDate.setDate(emiEndDate.getDate() + 1);          
      //   }

      //   var modStDt = new Date(trans_date); 
        
      //   var selDayNum = dayRevarseList[(new Date(modStDt), "dddd")];
        
      //   emiStartDate = new Date(
      //     modStDt.setDate(modStDt.getDate() + (7 - selDayNum))
      //   );
      //   // console.log(emiStartDate);
        
      //   for (
      //     let i = emiStartDate.getDate();
      //     i <
      //     new Date(
      //       emiStartDate.getFullYear(),
      //       emiStartDate.getMonth(),
      //       0
      //     ).getDate();
      //     i++
      //   ) {
      //     var selectedMon = dayList[selDay];
      //     // console.log(selectedMon,'selectedMon2');
          
      //     if (selectedMon == (new Date(emiStartDate), "dddd")) {
      //       break;
      //     }
      //     emiStartDate.setDate(emiStartDate.getDate() + 1);
      //   }
      //   break;
      let disb = new Date(trans_date);

        // Start EMI next week same weekday
        emiStartDate = new Date(disb);
        emiStartDate.setDate(disb.getDate() + 7);

        // End EMI after N weeks
        emiEndDate = new Date(emiStartDate);
        emiEndDate.setDate(emiStartDate.getDate() + (Number(period) * 7));

        break;
      default:
        emiStartDate = new Date();
        emiEndDate = new Date();
        break;
    }

    resolve({ emtStart: emiStartDate, emiEnd: emiEndDate });
  });
};



// FETCH PACS / SHG DETAILS BASED ON FLAG LOAN TO
// loanRouter.post("/fetch_pacs_shg_details", async (req, res) => {
//  try{
//   const {loan_to, branch_code, tenant_id, branch_shg_id} = req.body;
//   console.log(req.body,'pacs/shg');

//    let select = "";
//    let table_name = "";
//    let whr = "";
//    let order = null;
  
//   if(loan_to == 'P'){
//    select = "a.branch_id,a.branch_name";
//    table_name = "public.md_branch a LEFT JOIN bdccb.td_loan b ON a.branch_id = b.branch_shg_id AND b.loan_to = 'P'";
//    whr = `a.branch_id = '${branch_code}' AND a.tenant_id = '${tenant_id}' AND a.branch_status = 'O' AND a.branch_type = 'P' AND (a.branch_name ILIKE '%${branch_shg_id}%' OR a.branch_id::text ILIKE '%${branch_shg_id}%') AND b.branch_shg_id IS NULL`;
//    order = null;
//   }else{
//    select = "a.group_code,a.branch_code,a.group_name";
//    table_name = "bdccb.md_group a LEFT JOIN bdccb.td_loan b ON a.group_code = b.branch_shg_id AND b.loan_to = 'S'";
//    whr = `a.branch_code = '${branch_code}' AND a.open_close_flag = 'O' AND a.delete_flag = 'N' AND (a.group_name ILIKE '%${branch_shg_id}%' OR a.group_code::text ILIKE '%${branch_shg_id}%') AND b.branch_shg_id IS NULL`;
//    order = null;
//   }
//   let fetch_details = await db_Select(select,table_name,whr,order);

//   if (fetch_details.suc === 1 && fetch_details.msg.length > 0) {
//       return res.send({
//       success: true,
//       msg: loan_to == 'P' ? "PACS List" : "SHG List",
//       data: fetch_details.msg
//     });
//   } else if (fetch_details.suc === 1 && fetch_details.msg.length === 0){
//        return res.send({
//        success: true,
//        msg: `Loan already disbursed. Please select another ${loan_to == 'P' ? "PACS" : "SHG"}`,
//        data: []
//   });
//   }else{
//       return res.send({
//       success: true,
//       msg: loan_to == 'P' ? "Failed to fetch PACS data" : "Failed to fetch SHG data",
//       data: []
//       });
//   }
//  }catch(error){
//    console.error("Error in while fetch pacs/shg details:", error);
//    return res.send({
//    success: false,
//    msg: "Internal server error",
//    errorCode: "SERVER_ERROR"
//      });
//  }
// });

loanRouter.post("/fetch_pacs_shg_details", async (req, res) => {
 try{
  const {loan_to, branch_code, tenant_id, branch_shg_id} = req.body;
  // console.log(req.body,'pacs/shg');

   let select = "";
   let table_name = "";
   let whr = "";
   let order = null;
  
  if(loan_to == 'P'){
   select = "a.branch_id,a.branch_name";
   table_name = "public.md_branch a";
   whr = `a.tenant_id = '${tenant_id}' AND a.branch_status = 'O' AND a.branch_type = 'P' AND (a.branch_name ILIKE '%${branch_shg_id}%' OR a.branch_id::text ILIKE '%${branch_shg_id}%')`;
   order = null;
  }else{
   select = "a.group_code,a.branch_code,a.group_name";
   table_name = "bdccb.md_group a";
   whr = `a.branch_code = '${branch_code}' AND a.open_close_flag = 'O' AND a.delete_flag = 'N' AND (a.group_name ILIKE '%${branch_shg_id}%' OR a.group_code::text ILIKE '%${branch_shg_id}%')`;
   order = null;
  }
  let fetch_details = await db_Select(select,table_name,whr,order);

  if (fetch_details.suc === 1 && fetch_details.msg.length > 0) {
      return res.send({
      success: true,
      msg: loan_to == 'P' ? "PACS List" : "SHG List",
      data: fetch_details.msg
    });
  }else{
      return res.send({
      success: true,
      msg: loan_to == 'P' ? "No PACS data found" : "No SHG data found",
      data: []
      });
  }
 }catch(error){
   console.error("Error in while fetch pacs/shg details:", error);
   return res.send({
   success: false,
   msg: "Internal server error",
   errorCode: "SERVER_ERROR"
     });
 }
});

// SAVE DISBURSEMENT (BRANCH -> PACS -> SHG / BRNCH -> SHG)
loanRouter.post("/save_disbursement", async (req, res) => {
    try{
     const { tenant_id,branch_id,loan_acc_no,loan_to,branch_shg_id,period,curr_roi,penal_roi,disb_dt,disb_amt,created_by,ip_address,loan_id,tran_id,} = req.body;
    //  console.log(req.body,'data');

    let datetime = new Date().toISOString().slice(0, 19).replace('T', ' ');

    let loan_code = await loanCode(branch_id);
    // let intt_cal_amt = await interest_cal_amt(disb_amt,period,curr_roi,pay_mode);

    var pay_mode = "Monthly";

    let instl_date = await genDate(disb_dt,period,pay_mode);
    const startDate = instl_date.emtStart;
    const endDate = instl_date.emiEnd;

    var table = "bdccb.td_loan";
    var columns = loan_id > 0 ? ["loan_acc_no","loan_to","branch_shg_id","period","curr_roi","penal_roi","disb_dt","disb_amt","rep_start_dt","rep_end_dt","curr_prn","modified_by","modified_dt","ip_address"] : ["loan_id","tenant_id","branch_id","loan_acc_no","loan_to","branch_shg_id","period","curr_roi","penal_roi","disb_dt","disb_amt","pay_mode","rep_start_dt","rep_end_dt","curr_prn","curr_intt","ovd_prn","ovd_intt","created_by","created_dt","ip_address"];
    var values = loan_id > 0 ? [loan_acc_no || null,loan_to,branch_shg_id,period,curr_roi,penal_roi,disb_dt,disb_amt,startDate,endDate,disb_amt,created_by,datetime,ip_address] : [loan_code,tenant_id,branch_id,loan_acc_no || null,loan_to,branch_shg_id,period,curr_roi,penal_roi,disb_dt,disb_amt,pay_mode,startDate,endDate,disb_amt,0,0,0,created_by,datetime,ip_address];
    var whereColumns = loan_id > 0 ? ["loan_id","tenant_id","branch_id"] : [];
    var whereValues = loan_id > 0 ? [loan_id,tenant_id,branch_id] : [];
    var flag = loan_id > 0 ? 1 : 0;
    var result = await saveRecord(table, columns, values,whereColumns,whereValues,flag);

     if (!result || result.suc !== 1) {
      return res.send({
        success: true,
        msg: loan_id > 0 ? "Loan edit failed" : "Loan save failed",
        data: []
      });
    }

      let trans_id = await transaction_id();
      
      var table = "bdccb.td_loan_transactions";
      var columns = loan_id > 0 ? ["trans_dt","loan_to","branch_shg_id","loan_ac_no","dr_amt","curr_prn","modified_by","modified_dt","ip_address"] : ["trans_dt","trans_id","tenant_id","loan_to","branch_shg_id","loan_id","loan_ac_no","trans_type","dr_amt","cr_amt","curr_prn_recov","curr_intt_recov","ovd_prn_recov","ovd_intt_recov","curr_prn","curr_intt","ovd_prn","ovd_intt","approval_status","created_by","created_dt","ip_address"];
      var values = loan_id > 0 ? [disb_dt,loan_to,branch_shg_id,loan_acc_no || null,disb_amt,disb_amt,created_by,datetime,ip_address] : [disb_dt,trans_id,tenant_id,loan_to,branch_shg_id,loan_code,loan_acc_no || null,'D',disb_amt,0,0,0,0,0,disb_amt,0,0,0,'U',created_by,datetime,ip_address];
      var whereColumns = loan_id > 0 ? ["trans_id","tenant_id","loan_id"] : [];
      var whereValues = loan_id > 0 ? [tran_id,tenant_id,loan_id] : [];
      var flag = loan_id > 0 ? 1 : 0;
      var trans_result = await saveRecord(table,columns,values,whereColumns,whereValues,flag);
    

     if (!trans_result || trans_result.suc !== 1) {
        return res.send({
          success: true,
          msg: trans_result.msg || loan_id > 0 ? "Failed to edit loan in transaction table" : "Failed to save loan in transaction table",
          data: []
        });
      }
      return res.send({
        success: true,
        msg: loan_id > 0 ? "Disbursement edit Done Successfully" : "Disbursement Done Successfully",
      });
      
    }catch(error){
     console.error("Error in while save disbursement:", error);
        return res.send({
        success: false,
        msg: "Internal server error",
        errorCode: "SERVER_ERROR"
     });
    }
});

// FETCH PACS DETAILS FOR APPROVE
loanRouter.post("/fetch_disburse_dtls", async (req, res) => {
 try{
  const {branch_id, tenant_id, loan_to, approval_status} = req.body;
  // console.log(req.body,'fetch');
  
  var select = "a.loan_id,a.tenant_id,a.branch_id,a.loan_acc_no,a.loan_to,a.branch_shg_id,a.period,a.curr_roi,a.penal_roi,a.disb_dt,a.disb_amt,a.pay_mode,a.rep_start_dt,a.rep_end_dt,a.curr_prn,a.curr_intt,a.ovd_prn,a.ovd_intt,a.created_by,a.created_dt,a.ip_address,b.trans_dt,b.trans_id,b.trans_type,CASE WHEN a.loan_to = 'P' THEN c.branch_name ELSE d.group_name END AS branch_name",
  table_name = "bdccb.td_loan a LEFT JOIN bdccb.td_loan_transactions b ON a.loan_id = b.loan_id AND a.tenant_id = b.tenant_id AND a.branch_shg_id = b.branch_shg_id LEFT JOIN public.md_branch c ON a.branch_shg_id = c.branch_id LEFT JOIN bdccb.md_group d ON a.branch_shg_id = d.group_code",
  whr = `a.branch_shg_id = '${branch_id}' AND a.tenant_id = '${tenant_id}' AND a.loan_to = '${loan_to}' AND b.approval_status = '${approval_status}'`,
  order = null;
  var fetch_data = await db_Select(select,table_name,whr,order);

  if(fetch_data.suc === 1 && fetch_data.msg.length > 0){
   return res.send({
    success: true,
    msg: "Fetch unapprove disbursement details",
    data: fetch_data.msg
   });
  }else{
    return res.send({
    success: true,
    msg: "No unapprove disbursement details found",
    data: []
   });
  }

 }catch(error){
  console.error("Error in while fetch disbursement details:", error);
  return res.send({
  success: false,
  msg: "Internal server error",
  errorCode: "SERVER_ERROR"
  });
 }
});

// FETCH MAXIMUM BALANCE ON A PARTICULAR BRANCH //
// loanRouter.post("/fetch_max_balance", async (req, res) => {
//   try{
//    const {loan_to, pacs_shg_id} = req.body;
//   //  console.log(req.body,'test');

//    if (!pacs_shg_id || !loan_to) {
//       return res.json({
//         success: false,
//         message: "loan_to and pacs_shg_id are required"
//       });
//     }

//     const table_name = "bdccb.td_loan_balance";

//       // MAX BALANCE DATE //
//       let select1 = "TO_CHAR(MAX(balance_date), 'YYYY-MM-DD') AS balance_date";
//       let whr1 = `loan_to='${loan_to}' AND pacs_shg_id='${pacs_shg_id}'`;

//     let maxDateRes = await db_Select(select1, table_name, whr1, null);

//      if (maxDateRes.suc !== 1 || maxDateRes.msg.length === 0 || !maxDateRes.msg[0].balance_date) {
//       return res.send({
//         success: true,
//         msg: "No balance date found",
//         data: []
//       });
//     }

//     const balance_date = maxDateRes.msg[0].balance_date;
//     // console.log(balance_date,'balance_date');

//       // MAX BALANCE ID //
//     let select2 = "MAX(balance_id) AS balance_id";
//     let whr2 = `loan_to='${loan_to}' AND pacs_shg_id='${pacs_shg_id}' AND balance_date='${balance_date}'`;

//     let maxIdRes = await db_Select(select2, table_name, whr2, null);

//      if (maxIdRes.suc !== 1 || maxIdRes.msg.length === 0 || !maxIdRes.msg[0].balance_id) {
//       return res.send({
//         success: true,
//         msg: "No balance id found",
//         data: []
//       });
//     }

//     const balance_id = maxIdRes.msg[0].balance_id;
//     // console.log(balance_id,'balance_id');
    

//      // FETCH BALANCE AMOUNT//
//      let select3 = "balance AS max_balance";
//      let whr3 = `loan_to='${loan_to}' AND pacs_shg_id='${pacs_shg_id}' AND balance_date='${balance_date}'
//       AND balance_id='${balance_id}'`;
//     var fetch_max_balance = await db_Select(select3,table_name,whr3,null);

//    if(fetch_max_balance.suc === 1 && fetch_max_balance.msg.length > 0){
//    return res.send({
//     success: true,
//     msg: "Fetch balance",
//     data: fetch_max_balance.msg
//    });
//   }else{
//     return res.send({
//     success: true,
//     msg: "No balance found",
//     data: []
//    });
//   }
//   }catch(error){
//   console.error("Error in while fetch maximum balance on a particular pacs:", error);
//   return res.send({
//   success: false,
//   msg: "Internal server error",
//   errorCode: "SERVER_ERROR"
//   });
//   }
// });

loanRouter.post("/show_loan_status", async (req, res) => {
  try{
   const {branch_id,approval_status} = req.body;
  //  console.log(req.body,'show');

   var select = "a.loan_id,b.trans_dt,b.trans_id,a.tenant_id,a.branch_id,a.loan_acc_no,a.loan_to,a.branch_shg_id,CASE WHEN a.loan_to = 'P' THEN c.branch_name ELSE d.group_name END AS loan_to_name,a.period,a.curr_roi,a.penal_roi,a.disb_dt,a.disb_amt,a.pay_mode,a.rep_start_dt,a.rep_end_dt,a.curr_prn,a.curr_intt,a.ovd_prn,a.ovd_intt,b.trans_type,b.approval_status,a.created_by,a.created_dt,b.approved_by approved_id,e.user_name approved_by,b.approved_dt,a.ip_address",
   table_name = "bdccb.td_loan a LEFT JOIN bdccb.td_loan_transactions b ON a.tenant_id = b.tenant_id AND a.loan_id = b.loan_id LEFT JOIN public.md_branch c ON a.branch_id = c.branch_id LEFT JOIN bdccb.md_group d ON a.branch_shg_id = d.group_code LEFT JOIN bdccb.md_user e ON b.approved_by::INTEGER = e.user_id",
   whr = `a.branch_id = '${branch_id}' AND b.approval_status = '${approval_status}'`,
   order = `b.trans_id,b.trans_dt`;
   var show_loan_dtls = await db_Select(select,table_name,whr,order);

   if(show_loan_dtls.suc === 1 && show_loan_dtls.msg.length > 0){
   return res.send({
    success: true,
    msg: `Fetch ${approval_status == 'A' ? 'Approved' : 'Unapproved'} disbursed Loan Details`,
    data: show_loan_dtls.msg
   });
  }else{
    return res.send({
    success: true,
    msg: `Unable to fetch ${approval_status == 'A' ? 'Approved' : 'Unapproved'} disbursed loan details`,
    data: []
   });
  }
  }catch(error){
  console.error("Error in while fetch loan status:", error);
  return res.send({
  success: false,
  msg: "Internal server error",
  errorCode: "SERVER_ERROR"
  });
  }
});

// APPROVE LOAN FROM PACS LEVEL ***** this i snot used *****
// loanRouter.post("/approve_loan_pacs_level", async (req, res) => {
// try{
//  const {tenant_id,loan_to,pacs_shg_id,debit_amt,cr_amt,approved_by} = req.body;
// //  console.log(req.body,'accept_pacs');

//  let datetime = new Date().toISOString().slice(0, 19).replace('T', ' ');
//  let date = new Date().toISOString().slice(0, 10);

//   // Generate balance id
//  let balance = await balance_id();

//  // Calculate balance
//  var balance_amt = (cr_amt || 0) - (debit_amt || 0);

//  // INSERT INTO BALANCE TABLE
//  const table = "bdccb.td_loan_balance";
//  const columns = ["balance_date","balance_id","tenant_id","loan_to","pacs_shg_id","debit_amt","cr_amt","balance"];
//  const values = [date,balance,tenant_id,loan_to,pacs_shg_id,debit_amt,cr_amt,balance_amt];
//  const whereColumns = [];
//  const whereValues = [];
//  const flag = 0;
//  const balance_data = await saveRecord(table, columns, values, whereColumns, whereValues, flag);

//  // IF BALANCE INSERT SUCCESS 
//  if(balance_data.suc === 1){
//   const table1 = "bdccb.td_loan_transactions";
//   const columns1 = ["approval_status","approved_by","approved_dt"];
//   const values1 = ["A",approved_by,datetime];
//   const whereColumns1 = ["trans_id","loan_id"];
//   const whereValues1 = [trans_id,loan_id];
//   const flag1 = 1;
//   const trans_update = await saveRecord(table1,columns1,values1,whereColumns1,whereValues1,flag1);
  
//   // IF TRANSACTION UPDATE SUCCESS
//   if(trans_update.suc === 1){
//     return res.send({
//       success: true,
//           msg: "Loan approved & balance inserted"
//         });
//   }else {
//      return res.send({
//       success: true,
//       msg: "Balance inserted but transaction update failed"
//       });
//   }
//  }else{
//   return res.send({
//         success: true,
//         msg: "Balance insert failed"
//   });
//  }
// }catch(error){
//   console.error("Error in while approve loan from pacs level:", error);
//   return res.send({
//   success: false,
//   msg: "Internal server error",
//   errorCode: "SERVER_ERROR"
//   });
// }
// });

module.exports = {loanRouter}
