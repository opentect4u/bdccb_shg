const { db_Select, saveRecord, deleteRecord } = require('../../model/pgcommon');
const express = require('express'),
loanMemberRouter = express.Router();

// const loanCode = async (branch_code) => {
 
//   const select = `COALESCE(MAX(SUBSTR(loan_id::TEXT, 5)::INTEGER), 0) + 1 AS loan_code`;
 
//   const table = "bdccb.td_loan_member";
//   const res = await db_Select(select, table, null, null);
 
//   const loan_no = res.msg[0].loan_code;
 
//   const loan_code = `${branch_code}${String(loan_no).padStart(5, "0")}`;
 
//   return loan_code;
// };

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

const member_transaction_id = async () => {
    const timestamp = new Date().getTime();
    const newPayId = `${timestamp}`;
    return(newPayId);
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

        case "Monthly":
        let disbr = new Date(trans_date);

         // Start EMI next month safely
          emiStartDate = addMonthsSafe(disbr, 1);

          // End EMI after N months safely
          emiEndDate = addMonthsSafe(emiStartDate, Number(period));
          break;

      case "Weekly":
      
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

const generateBalanceId = async () => {
      const timestamp = new Date().getTime();
      const balID = `${timestamp}`;
      return(balID);
  };

// const getbalance = async (tenant_id,group_code) => {
//     const select = `COALESCE(NULLIF(balance, 'NaN'::numeric), 0) AS next_balance`;
//     const table_name = "bdccb.td_loan_balance";
//     const whr = `tenant_id = '${tenant_id}' AND pacs_shg_id = '${group_code}' AND loan_to = 'S' ORDER BY balance_id DESC LIMIT 1`;
//     const res_dt = await db_Select(select, table_name, whr, null);

//     let lastBalance = 0;

//     if (res_dt.msg.length > 0 && res_dt.msg[0].next_balance !== null) {
//         lastBalance = parseFloat(res_dt.msg[0].next_balance);
//     }

//     const next_balance = lastBalance;
//     return next_balance; // INTEGER
// };  


loanMemberRouter.post("/save_shg_member_disbursement", async (req, res) => {
 try{
  const { group_code,tenant_id,branch_id,period,curr_roi,penal_roi,disb_dt,members,created_by,ip_address} = req.body;
  console.log(req.body,'shg_save_member');

  let datetime = new Date().toISOString().slice(0, 19).replace('T', ' ');
  let date = new Date().toISOString().slice(0, 10);

  var period_mode = "Monthly";

  let instl_date = await genDate(disb_dt,period,period_mode);

  const startDate = instl_date.emtStart;
  const endDate = instl_date.emiEnd;  

  let total_disb_amt = 0;
  // let old_total_disb_amt = 0;

  // var balance_id = await generateBalanceId();

   let inserted_members = [];
   let inserted_loans = [];

  // member validation
  if (!members || members.length === 0) {
        return res.send({
          success: true,
          msg: "No members provided",
        });
      }

  //  let isEdit = members.some(m => Number(m.member_id) > 0);

  // Block edit if recovery started
    // if (isEdit && recovery_flag === "Y") {
    //   return res.send({
    //     success: false,
    //     msg: "Recovery already started. Disbursement edit not allowed.",
    //   });
    // }    

  // if (isEdit) {

  //   const selectOld = `
  //     SELECT COALESCE(SUM(disb_amt),0) AS old_amt
  //     FROM bdccb.td_loan_member
  //     WHERE group_code = $1
  //       AND tenant_id = $2
  //       AND branch_id = $3`;

  //   const oldData = await db_Select(
  //     selectOld,
  //     [group_code,tenant_id,branch_id]
  //   );

  //   old_total_disb_amt = Number(oldData[0]?.old_amt || 0);
  // }

      // loop start //
  for (const mem of members) {  

  let member_code = await memberCode(branch_id); 
  let mem_trans_id = await member_transaction_id();

  total_disb_amt += Number(mem.disb_amt || 0);

  // insert member row //

  const table = "bdccb.md_member";

  const columns = mem.member_id > 0 ? ["member_name","gp_leader_flag","modified_by","modified_at","ip_address"] : ["member_code","branch_id","group_code","member_name","tenant_id","delete_flag","approval_status","created_by","created_at","ip_address","gp_leader_flag"];

  const values = mem.member_id > 0 ? [mem.member_name.toUpperCase() || null,mem.gp_leader_flag,created_by,datetime,ip_address] : [member_code,branch_id,group_code,mem.member_name.toUpperCase() || null,tenant_id,'N','A',created_by,datetime,ip_address,mem.gp_leader_flag];

  const whereColumns = mem.member_id > 0 ? ["member_code","branch_id","group_code","tenant_id"] : [];

  const whereValues = mem.member_id > 0 ? [mem.member_id,branch_id,group_code,tenant_id] : [];

  const flag = mem.member_id > 0 ? 1 : 0;

  const result_member = await saveRecord(table, columns, values,whereColumns,whereValues,flag);  

  if (!result_member || result_member.suc !== 1) {
        return res.send({
          success: true,
          msg: mem.member_id > 0 ? "Failed to edit member" : "Failed to save member",
          data: []
        });
   }

    inserted_members.push(mem.member_id || member_code);

  // insert member loan row //

  const table1 = "bdccb.td_loan_member";

  const columns1 = mem.member_id > 0 ? ["period","curr_roi","penal_roi","disb_dt","disb_amt","prn_amt","rep_start_dt","rep_end_dt","modified_by","modified_at","ip_address"] : ["loan_id","branch_id","tenant_id","group_code","member_code","period","curr_roi","penal_roi","disb_dt","disb_amt","prn_amt","ovd_prn_amt","intt_amt","ovd_intt_amt","period_mode","rep_start_dt","rep_end_dt","created_by","created_at","ip_address"];

  const values1 = mem.member_id > 0 ? [period,curr_roi,penal_roi,disb_dt,mem.disb_amt,mem.disb_amt,startDate,endDate,created_by,datetime,ip_address] : [member_code,branch_id,tenant_id,group_code,member_code,period,curr_roi,penal_roi,disb_dt,mem.disb_amt,mem.disb_amt,0,0,0,period_mode,startDate,endDate,created_by,datetime,ip_address];

  const whereColumns1 = mem.member_id > 0 ? ["loan_id","branch_id","tenant_id","group_code","member_code"] : [];

  const whereValues1 = mem.member_id > 0 ? [mem.member_id,branch_id,tenant_id,group_code,mem.member_id] : [];

  const flag1 = mem.member_id > 0 ? 1 : 0;

  const result_shg_disburse = await saveRecord(table1, columns1, values1,whereColumns1,whereValues1,flag1);

  if (!result_shg_disburse || result_shg_disburse.suc !== 1) {

    // Rollback member
    await deleteRecord(
      "bdccb.md_member",
      ["member_code"],
      [member_code]
    );

     return res.send({
     success: true,
     msg: mem.member_id > 0 ? "SHG Member Loan edit failed" : "SHG Member Loan save failed",
     data: []
     });
   }

   inserted_loans.push(mem.member_id || member_code);

  // insert member loan transaction row //

    const table2 = "bdccb.td_loan_member_trans";

    const columns2 = mem.member_id > 0 ? ["trans_dt","dr_amt","curr_prn","modified_by","modified_dt","ip_address"] : ["loan_id","trans_dt","trans_id","tenant_id","branch_id","trans_type","dr_amt","cr_amt","curr_prn_recov","curr_intt_recov","ovd_prn_recov","ovd_intt_recov","curr_prn","curr_intt","ovd_prn","ovd_intt","approval_status","created_by","created_dt","ip_address"];

    const values2 = mem.member_id > 0 ? [disb_dt,mem.disb_amt,mem.disb_amt,created_by,datetime,ip_address] : [member_code,disb_dt,mem_trans_id,tenant_id,branch_id,'D',mem.disb_amt,0,0,0,0,0,mem.disb_amt,0,0,0,'A',created_by,datetime,ip_address];

    const whereColumns2 = mem.member_id > 0 ? ["loan_id","tenant_id","branch_id"] : [];

    const whereValues2 = mem.member_id > 0 ? [mem.member_id,tenant_id,branch_id] : [];

    const flag2 = mem.member_id > 0 ? 1 : 0;

    const member_trans_result = await saveRecord(table2,columns2,values2,whereColumns2,whereValues2,flag2);
    
    if (!member_trans_result || member_trans_result.suc !== 1) {

        // Rollback loan
    await deleteRecord(
      "bdccb.td_loan_member",
      ["loan_id"],
      [member_code]
    );

    // Rollback member
    await deleteRecord(
      "bdccb.md_member",
      ["member_code"],
      [member_code]
    );

    return res.send({
          success: true,
          msg: member_trans_result.msg || mem.member_id > 0 ? "Failed to edit loan in member transaction table" : "Failed to save loan in member transaction table",
          data: []
        });
    }
   }

  //  let diff_amt = 0;

// if (isEdit) {
//   diff_amt = Number(total_disb_amt) - Number(old_total_disb_amt);
// }

  //  let prev_balance = await getbalance(tenant_id,group_code);

  // let new_balance = 0;

// if (isEdit) {
//   new_balance = Number(prev_balance) - Number(diff_amt);
// } else {
//   new_balance = Number(prev_balance) - Number(total_disb_amt);
// }
   
// New balance
// let new_balance = Number(prev_balance) - Number(total_disb_amt);
// fetch maximum balance id

  // insert balance row //
//   const table3 = "bdccb.td_loan_balance";

//   const columns3 = isEdit ? ["debit_amt","balance"] : ["balance_date","balance_id","tenant_id","loan_to","pacs_shg_id","debit_amt","cr_amt","balance"];

//   const values3 =  isEdit ? [total_disb_amt,new_balance] : [date,balance_id,tenant_id,"S",group_code,total_disb_amt,0,new_balance];

//   const whereColumns3 =  isEdit ? ["tenant_id","loan_to","pacs_shg_id"] : [];

//   const whereValues3 =  isEdit ? [tenant_id,"S",group_code] : [];
//   const flag3 =  isEdit ? 1 : 0;

//   const loan_balance = await saveRecord(table3,columns3,values3,whereColumns3,whereValues3,flag3);

//   if (!loan_balance || loan_balance.suc !== 1) {
//      for (const loan_id of inserted_loans) {
//           await deleteRecord(
//             "bdccb.td_loan_member_trans",
//             ["loan_id"],
//             [loan_id]
//           );
        
//           await deleteRecord(
//             "bdccb.td_loan_member",
//             ["loan_id"],
//             [loan_id]
//           );
//     }

//         for (const member_code of inserted_members) {
//           await deleteRecord(
//             "bdccb.md_member",
//             ["member_code"],
//             [member_code]
//           );
//         }

//   return res.send({
//     success: true,
//     msg: "Failed to update SHG balance",
//   });
// }
    return res.send({
        success: true,
        msg: isEdit ? "SHG Member Disbursement edit Done Successfully" : "SHG Member Disbursement Done Successfully",
    });
 }catch(error){
   console.error("Error in while save shg member disbursement:", error);
        return res.send({
        success: false,
        msg: "Internal server error",
        errorCode: "SERVER_ERROR"
     });
 }
});

module.exports = {loanMemberRouter}