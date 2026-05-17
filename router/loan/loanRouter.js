const { db_Select, saveRecord, deleteRecord } = require("../../model/pgcommon");
const express = require("express"),
  loanRouter = express.Router();

// const loanCode = async (branch_code) => {
//   const select = `COALESCE(MAX(SUBSTR(ccb_loan_id::TEXT, 4)::INTEGER), 0) + 1 AS loan_code`;

//   const table = "bdccb.td_loan_member";
//   const res = await db_Select(select, table, null, null);

//   const loan_no = res.msg[0].loan_code;

//   const loan_code = `${branch_code}${String(loan_no).padStart(4, "0")}`;

//   return loan_code;
// };

// const loanCode = async (branch_code) => {
//   const select = `COALESCE(MAX(SUBSTR(loan_id::TEXT, LENGTH('${branch_code}') + 1)::INTEGER), 0) + 1 AS loan_code`;
//   const table = "bdccb.td_loan";
//   const whr = `branch_id = '${branch_code}'`;
//   const res = await db_Select(select, table, whr, null);

//   const loan_no = res.msg[0].loan_code;

//   const loan_code = `${branch_code}${String(loan_no).padStart(4, "0")}`;

//   return loan_code;
// };

// const loanCodes = async (branch_code) => {
//   const select = `COALESCE(MAX(SUBSTR(ccb_loan_id::TEXT, LENGTH('${branch_code}') + 1)::INTEGER), 0) + 1 AS loan_codes`;
//   const table = "bdccb.td_loan_member";
//   const whr = `branch_id = '${branch_code}'`;
//   const res = await db_Select(select, table, whr, null);

//   const loan_nos = res.msg[0].loan_codes;

//   const loan_codes = `${branch_code}${String(loan_nos).padStart(4, "0")}`;

//   return loan_codes;
// };

const loanCode = async (branch_code) => {
  const select = `
    COALESCE(
      GREATEST(
        COALESCE(
          (SELECT MAX(SUBSTR(loan_id::TEXT, LENGTH('${branch_code}') + 1)::INTEGER)
           FROM bdccb.td_loan
           WHERE branch_id='${branch_code}'), 0
        ),
        COALESCE(
          (SELECT MAX(SUBSTR(ccb_loan_id::TEXT, LENGTH('${branch_code}') + 1)::INTEGER)
           FROM bdccb.td_loan_member
           WHERE branch_id='${branch_code}'), 0
        )
      ), 0
    ) + 1 AS loan_code
  `;

  const res = await db_Select(select, "bdccb.td_loan", null, null);

  // const loan_no = res.msg[0].loan_code;

   let loan_no = 1;

  if (res && res.suc === 1 && res.msg && res.msg.length > 0) {
    loan_no = res.msg[0].loan_code || 1;
  }

  const loan_code = `${branch_code}${String(loan_no).padStart(4, "0")}`;

  return loan_code;
};

const loanCodes = async (branch_code) => {
  const select = `
    COALESCE(
      GREATEST(
        COALESCE(
          (SELECT MAX(SUBSTR(ccb_loan_id::TEXT, LENGTH('${branch_code}') + 1)::INTEGER)
           FROM bdccb.td_loan_member
           WHERE branch_id='${branch_code}'), 0
        ),
        COALESCE(
          (SELECT MAX(SUBSTR(loan_id::TEXT, LENGTH('${branch_code}') + 1)::INTEGER)
           FROM bdccb.td_loan
           WHERE branch_id='${branch_code}'), 0
        )
      ), 0
    ) + 1 AS loan_codes
  `;

  const res = await db_Select(select, "bdccb.td_loan_member", null, null);

  // const loan_no = res.msg[0].loan_codes;

   let loan_no = 1;

  if (res && res.suc === 1 && res.msg && res.msg.length > 0) {
    loan_no = res.msg[0].loan_codes || 1;
  }

  const loan_codes = `${branch_code}${String(loan_no).padStart(4, "0")}`;

  return loan_codes;
};

// const memberLoanCode = async (member_id) => {

//   const select = `COALESCE(MAX(SUBSTRING(loan_id::TEXT FROM LENGTH('${member_id}') + 1)::INTEGER),0) + 1 AS next_seq`;
//   const table = "bdccb.td_loan_member";
//   const where = `member_code = '${member_id}'`;
//   const res = await db_Select(select, table, where, null);
//   const seq_no = res.msg[0].next_seq;
//   const loan_member_id = `${member_id}${seq_no}`;
//   return loan_member_id;
// };

const transaction_id = async () => {
  const timestamp = new Date().getTime();
  const newPayId = `${timestamp}`;
  return newPayId;
};

const transactions_id = async () => {
  const timestamp = new Date().getTime();
  const random = Math.floor(Math.random() * 1000);
  return `${timestamp}${random}`;
};

const member_transaction_id = async () => {
    const timestamp = new Date().getTime();
    const newPayId = `${timestamp}`;
    return(newPayId);
};

const balance_id = async () => {
  const timestamp = new Date().getTime();
  const balID = `${timestamp}`;
  return balID;
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
  },
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
        emiEndDate.setDate(emiStartDate.getDate() + Number(period) * 7);

        break;
      default:
        emiStartDate = new Date();
        emiEndDate = new Date();
        break;
    }

    resolve({
      emtStart: emiStartDate,
      emiEnd: emiEndDate,
    });
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
  try {
    const { loan_to, branch_code, tenant_id, branch_shg_id } = req.body;
    // console.log(req.body,'pacs/shg');

    let select = "";
    let table_name = "";
    let whr = "";
    let order = null;

    if (loan_to == "P") {
      select = "a.branch_id,a.branch_name,a.branch_jurisdiction_id";
      table_name = "public.md_branch a";
      whr = `a.tenant_id = '${tenant_id}' AND a.branch_status = 'O' AND a.branch_type = 'P' AND (a.branch_name ILIKE '%${branch_shg_id}%' OR a.branch_id::text ILIKE '%${branch_shg_id}%') AND a.branch_jurisdiction_id = '${branch_code}'`;
      order = null;
    } else {
      // var select_1 = "direct_indirect_flag",
      // table_name_1 = "bdccb.md_group",
      // whr_1 = `group_name ILIKE '%${branch_shg_id}%' OR group_code::text ILIKE '%${branch_shg_id}%'`,
      // order_1 = null;
      // let fetch_data = await db_Select(select_1,table_name_1,whr_1,order_1);

      // const flag = fetch_data.msg[0].direct_indirect_flag

      select = "a.group_code,a.pacs_id,a.branch_code,a.group_name";
      table_name = "bdccb.md_group a";
      // whr = flag == 'I' ? `a.pacs_id = '${branch_code}' AND a.open_close_flag = 'O' AND a.delete_flag = 'N' AND (a.group_name ILIKE '%${branch_shg_id}%' OR a.group_code::text ILIKE '%${branch_shg_id}%')` : `a.branch_code = '${branch_code}' AND a.open_close_flag = 'O' AND a.delete_flag = 'N' AND (a.group_name ILIKE '%${branch_shg_id}%' OR a.group_code::text ILIKE '%${branch_shg_id}%')`;
       whr = `a.open_close_flag = 'O' AND a.delete_flag = 'N' AND (a.group_name ILIKE '%${branch_shg_id}%' OR a.group_code::text ILIKE '%${branch_shg_id}%') AND ( 
          (a.direct_indirect_flag = 'D' AND a.branch_code = '${branch_code}') 
       OR (a.direct_indirect_flag = 'I' AND a.pacs_id = '${branch_code}'))`;
      order = null;
    }
    let fetch_details = await db_Select(select, table_name, whr, order);

    if (fetch_details.suc === 1 && fetch_details.msg.length > 0) {
      return res.send({
        success: true,
        msg: loan_to == "P" ? "PACS List" : "SHG List",
        data: fetch_details.msg,
      });
    } else {
      return res.send({
        success: true,
        msg: loan_to == "P" ? "No PACS data found" : "No SHG data found",
        data: [],
      });
    }
  } catch (error) {
    console.error("Error in while fetch pacs/shg details:", error);
    return res.send({
      success: false,
      msg: "Internal server error",
      errorCode: "SERVER_ERROR",
    });
  }
});

// FETCH DEMO SOCIETY DATA
loanRouter.post("/fetch_demo_pacs", async (req, res) => {
  try{
    var select = "branch_id,branch_name",
    table_name = "public.md_branch",
    whr = `branch_status = 'C' AND block_id = '0' AND branch_id = branch_jurisdiction_id`,
    order = null;
    var fetch_demo_pacs_data = await db_Select(select,table_name,whr,order);

    if(fetch_demo_pacs_data.suc === 1 && fetch_demo_pacs_data.msg.length > 0){
     return res.send({
      success : true,
      msg: "Fetch Demo Pcas data",
      data: fetch_demo_pacs_data.msg
     })
    }else{
      return res.send({
      success : true,
      msg: "Failed to fetch Demo Pcas data",
      data: []
      })
    }
  }catch (error) {
 console.error("Error in while fetch demo pacs details:", error);
 return res.send({
   success: false,
   msg: "Internal server error",
   errorCode: "SERVER_ERROR",
 });
  }
});

// FETCH SHG DATA WHILE DISBURSE DIRECT LOAN
loanRouter.post("/fetch_shg_data", async (req, res) => {
try{
 const {branch_code} = req.body;

 var select = "group_code,branch_code,group_name",
 table_name = "bdccb.md_group",
 whr = `branch_code = '${branch_code}'`,
 order = null;
 var fetch_dhg_data_direct_loan = await db_Select(select,table_name,whr,order);

 if(fetch_dhg_data_direct_loan.suc === 1 && fetch_dhg_data_direct_loan.msg.length > 0){
   return res.send({
      success: true,
      msg: "Fetch shg data",
      data: fetch_dhg_data_direct_loan.msg
   })
 }else{
    return res.send({
      success: true,
      msg: "Failed to fetch shg data",
      data: []
   })
 }
}catch (error) {
 console.error("Error in while fetch shg details:", error);
 return res.send({
   success: false,
   msg: "Internal server error",
   errorCode: "SERVER_ERROR",
 });
}
});

// FETCH GROUP NAME BASED ON GROUP S/B AC NO
loanRouter.post("/fetch_gp_based_ac_no", async (req, res) => {
  try{
 const {branch_code,sb_ac_no} = req.body;
 
 var select = "a.group_code,a.branch_code,a.group_name,a.sb_ac_no,b.balance AS grp_balance",
 table_name = "bdccb.md_group a LEFT JOIN bdccb.td_deposit b ON a.group_code = b.shg_id AND a.sb_ac_no = b.acc_no",
 whr = `a.branch_code = '${branch_code}' AND a.sb_ac_no = '${sb_ac_no}'`,
 order = null;
 var fetch_gp_data = await db_Select(select,table_name,whr,order);

 if(fetch_gp_data.suc === 1 && fetch_gp_data.msg.length > 0){
   return res.send({
      success: true,
      msg: "Fetch group data",
      data: fetch_gp_data.msg
   })
 }else{
    return res.send({
      success: true,
      msg: "Failed to fetch group data",
      data: []
   })
 }
 }catch (error) {
 console.error("Error in while fetch group details:", error);
 return res.send({
   success: false,
   msg: "Internal server error",
   errorCode: "SERVER_ERROR",
 });
}
});

// FETCH MEMBER DETAILS BASED ON SHG
loanRouter.post("/fetch_member_name", async (req, res) => {
try{
 const {group_code, branch_code, tenant_id} = req.body;
//  console.log(req.body,'member name');

//  var select = "member_code member_id,member_name,member_account_no sb_acc_no",
 var select = "member_code member_id,member_name",
 table_name = "bdccb.md_member",
 whr = `group_code = '${group_code}' AND tenant_id = '${tenant_id}' AND delete_flag = 'N' AND approval_status = 'A'`,
 order = null;
 var fetch_shg_member = await db_Select(select,table_name,whr,order);
 
 if (fetch_shg_member.suc === 1 && fetch_shg_member.msg.length > 0) {
      return res.send({
        success: true,
        msg: "Member list",
        data: fetch_shg_member.msg,
      });
 } else {
      return res.send({
        success: true,
        msg: "Member data not found",
        data: [],
      });
    }
}catch (error) {
 console.error("Error in while fetch member details:", error);
 return res.send({
   success: false,
   msg: "Internal server error",
   errorCode: "SERVER_ERROR",
 });
  }
});

// FETCH GROUP NAME BASED ON GROUP S/B AC NO IN SOCIETY
loanRouter.post("/fetch_gp_based_ac_no_soc", async (req, res) => {
  try{
 const {branch_code,sb_ac_no} = req.body;
 
 var select = "a.group_code,a.branch_code,a.group_name,a.sb_ac_no",
 table_name = "bdccb.md_group a",
 whr = `a.pacs_id = '${branch_code}' AND a.sb_ac_no = '${sb_ac_no}'`,
 order = null;
 var fetch_gp_data_soc = await db_Select(select,table_name,whr,order);

 if(fetch_gp_data_soc.suc === 1 && fetch_gp_data_soc.msg.length > 0){
   return res.send({
      success: true,
      msg: "Fetch group data",
      data: fetch_gp_data_soc.msg
   })
 }else{
    return res.send({
      success: true,
      msg: "Failed to fetch group data",
      data: []
   })
 }
 }catch (error) {
 console.error("Error in while fetch group details in society:", error);
 return res.send({
   success: false,
   msg: "Internal server error",
   errorCode: "SERVER_ERROR",
 });
}
});

// SAVE DISBURSEMENT (BRANCH -> PACS)

// loanRouter.post("/save_disbursement", async (req, res) => {
//   try {
//     const {tenant_id,branch_id,loan_acc_no,loan_to,branch_shg_id,period,curr_roi,penal_roi,disb_dt,disb_amt,tot_grp,
//     sanction_no,sanction_dt,members,created_by,ip_address,loan_id,tran_id} = req.body;
//     console.log(req.body,'data');

//     let datetime = new Date().toISOString().slice(0, 19).replace("T", " ");

//     // let loan_code = await loanCode(branch_id);
//     // let intt_cal_amt = await interest_cal_amt(disb_amt,period,curr_roi,pay_mode);

//     var pay_mode = "Monthly";

//     let counter = 1;

//     let instl_date = await genDate(disb_dt, period, pay_mode);
//     const startDate = instl_date.emtStart;
//     const endDate = instl_date.emiEnd;

//     let isEdit = members.some(m => Number(m.loan_id) > 0);

//     let total_disb_amt = 0;

//     for (const mem of members) {
//       total_disb_amt += Number(mem.disburse_amt || 0);
//     }

//         loan_code = await loanCode(branch_id);


//       // ========================================================
//       // ✅ INSERT GROUP LEVEL (ONLY FOR DIRECT LOAN)
//       // ========================================================
//       if (loan_to == 'S') {


//         // -------- td_loan --------
//         const table = "bdccb.td_loan";

//         const columns = [
//           "loan_id","tenant_id","branch_id","loan_acc_no","loan_to","branch_shg_id",
//           "period","curr_roi","penal_roi","disb_dt","disb_amt","pay_mode",
//           "rep_start_dt","rep_end_dt","curr_prn","curr_intt","ovd_prn","ovd_intt",
//           "tot_grp","sanction_no","sanction_dt","created_by","created_dt","ip_address","group_code"
//         ];

//         const values = [
//           loan_code,tenant_id,branch_id,loan_acc_no || null,loan_to,branch_shg_id,
//           period,curr_roi,penal_roi,disb_dt,group_total,pay_mode,
//           startDate,endDate,group_total,0,0,0,
//           tot_grp,sanction_no,sanction_dt,
//           created_by,datetime,ip_address,group_code
//         ];

//         let result = await saveRecord(table, columns, values, [], [], 0);

//         if (!result || result.suc !== 1) {
//           return res.send({ success:false, msg:"Loan save failed", data:[] });
//         }

//         // -------- td_loan_transactions --------
//         let trans_id = await transaction_id();

//         const table_trn = "bdccb.td_loan_transactions";

//         const columns_trn = [
//           "trans_dt","trans_id","tenant_id","loan_to","branch_shg_id","loan_id",
//           "loan_ac_no","trans_type","dr_amt","cr_amt",
//           "curr_prn_recov","curr_intt_recov","ovd_prn_recov","ovd_intt_recov",
//           "curr_prn","curr_intt","ovd_prn","ovd_intt",
//           "approval_status","created_by","created_dt","ip_address"
//         ];

//         const values_trn = [
//           disb_dt,trans_id,tenant_id,loan_to,branch_shg_id,
//           loan_code,loan_acc_no || null,"D",group_total,0,
//           0,0,0,0,
//           group_total,0,0,0,
//           "U",created_by,datetime,ip_address
//         ];

//         let trans_result = await saveRecord(table_trn, columns_trn, values_trn, [], [], 0);

//         if (!trans_result || trans_result.suc !== 1) {
//           return res.send({ success:false, msg:"Loan transaction failed", data:[] });
//         }
//       }

//     for (const mem of members) {  
//     let mem_trans_id = await member_transaction_id();

//      // Generate 2-digit sequence (01, 02, 03...)
//     // let seq = String(counter).padStart(2, "0");

//     //  let loanMemberId = `${mem.member_id}${seq}`;

//     //  counter++;

//     //  Get last loan_id for this member from DB
//       let lastLoan = await db_Select(
//       "MAX(loan_id) as max_id",
//       "bdccb.td_loan_member",
//       `member_code='${mem.member_id}'`,
//       null
//       );

//       let nextSeq = 1;

//       if (lastLoan.suc === 1 && lastLoan.msg[0].max_id) {
//       let lastId = lastLoan.msg[0].max_id.toString();

//       // extract last 2 digits
//       let lastSeq = parseInt(lastId.slice(-2));

//       nextSeq = lastSeq + 1;
//       }

//       let seq = String(nextSeq).padStart(2, "0");
//       let loanMemberId = `${mem.member_id}${seq}`;
  
//     total_disb_amt += Number(mem.disburse_amt || 0);
  
//     // insert member loan row //
  
//     const table1 = "bdccb.td_loan_member";
//     const columns1 = mem.mem_loan_id > 0 ? ["loan_acc_no","period","curr_roi","penal_roi","disb_dt","disb_amt","rep_start_dt","rep_end_dt","tot_grp","sanction_no","sanction_dt","modified_by","modified_at","ip_address","society_roi","society_penal_roi"] : ["loan_id","ccb_loan_id","tenant_id","branch_id","loan_acc_no","loan_to","branch_shg_id","group_code","member_code","period","curr_roi","penal_roi","disb_dt","disb_amt","period_mode","rep_start_dt","rep_end_dt","prn_amt","ovd_prn_amt","intt_amt","ovd_intt_amt","tot_grp","sanction_no","sanction_dt","created_by","created_at","ip_address","society_roi","society_penal_roi"];
  
//     const values1 = mem.mem_loan_id > 0 ? [loan_acc_no,period,curr_roi,penal_roi,disb_dt,mem.disburse_amt,startDate,endDate,tot_grp,sanction_no,sanction_dt,created_by,datetime,ip_address,loan_to == 'P' ? curr_roi : '0',loan_to == 'P' ? penal_roi : '0'] : [loanMemberId,loan_code,tenant_id,branch_id,loan_acc_no,loan_to,branch_shg_id,mem.group_code,mem.member_id,period,curr_roi,penal_roi,disb_dt,mem.disburse_amt,pay_mode,startDate,endDate,loan_to == 'P' ? 0 : mem.disburse_amt,0,0,0,tot_grp,sanction_no,sanction_dt,created_by,datetime,ip_address,loan_to == 'P' ? curr_roi : '0',loan_to == 'P' ? penal_roi : '0'];
//     const whereColumns1 = mem.mem_loan_id > 0 ? ["loan_id","tenant_id","group_code","member_code"] : [];
//     const whereValues1 = mem.mem_loan_id > 0 ? [mem.mem_loan_id,tenant_id,mem.group_code,mem.member_id] : [];
//     const flag1 = mem.mem_loan_id > 0 ? 1 : 0;
//     const result_shg_disburse = await saveRecord(table1, columns1, values1,whereColumns1,whereValues1,flag1);
//     console.log(result_shg_disburse,'result_shg_disburse');
    
  
//     if (!result_shg_disburse || result_shg_disburse.suc !== 1) {
//        return res.send({
//        success: false,
//        msg: mem.mem_loan_id > 0 ? "Failed to edit loan in loan member table" : "Failed to save loan in loan member table",
//        data: []
//        });
//      }
  
//     // insert member loan transaction row //
  
//       const table2 = "bdccb.td_loan_member_trans";
//       const columns2 = mem.mem_loan_id > 0 ? ["trans_date","loan_acc_no","dr_amt","modified_by","modified_dt","ip_address"] : ["trans_date","trans_id","loan_id","ccb_loan_id","tenant_id","branch_id","loan_to","branch_shg_id","loan_acc_no","trans_type","dr_amt","cr_amt","curr_prn_recov","curr_intt_recov","ovd_prn_recov","ovd_intt_recov","curr_prn","curr_intt","ovd_prn","ovd_intt","approval_status","created_by","created_dt","ip_address"];

//       const values2 = mem.mem_loan_id > 0 ? [disb_dt,loan_acc_no,mem.disburse_amt,created_by,datetime,ip_address] : [disb_dt,mem_trans_id,loanMemberId,loan_code,tenant_id,branch_id,loan_to,branch_shg_id,loan_acc_no,'D',mem.disburse_amt,0,0,0,0,0,loan_to == 'P' ? 0 : mem.disburse_amt,0,0,0,loan_to == 'P' ? 'U' : 'A',created_by,datetime,ip_address];
//       const whereColumns2 = mem.mem_loan_id > 0 ? ["loan_id","tenant_id"] : [];
//       const whereValues2 = mem.mem_loan_id > 0 ? [mem.mem_loan_id,tenant_id] : [];
//       const flag2 = mem.mem_loan_id > 0 ? 1 : 0;
//       const member_trans_result = await saveRecord(table2,columns2,values2,whereColumns2,whereValues2,flag2);
//     console.log(member_trans_result,'member_trans_result');

      
//       if (!member_trans_result || member_trans_result.suc !== 1) {
//       return res.send({
//             success: false,
//             msg: member_trans_result.msg || (mem.mem_loan_id > 0 ? "Failed to edit loan in member transaction table" : "Failed to save loan in member transaction table"),
//             data: []
//           });
//       }
//     }
//     return res.send({
//       success: true,
//       msg: loan_id > 0 ? "Disbursement edit Done Successfully"  : "Disbursement Done Successfully",
//     });
//   } catch (error) {
//     console.error("Error in while save disbursement:", error);
//     return res.send({
//       success: false,
//       msg: "Internal server error",
//       errorCode: "SERVER_ERROR",
//     });
//   }
// });

// loanRouter.post("/save_disbursement", async (req, res) => {
//   try {
//     const {tenant_id,branch_id,loan_acc_no,loan_to,branch_shg_id,period,curr_roi,penal_roi,disb_dt,disb_amt,tot_grp,
//     sanction_no,sanction_dt,members,created_by,ip_address,loan_id,tran_id} = req.body;
//     console.log(req.body,'data');

//     let datetime = new Date().toISOString().slice(0, 19).replace("T", " ");

//     // let loan_code = await loanCode(branch_id);
//     // let intt_cal_amt = await interest_cal_amt(disb_amt,period,curr_roi,pay_mode);

//     var pay_mode = "Monthly";

//     let counter = 1;

//     let instl_date = await genDate(disb_dt, period, pay_mode);
//     const startDate = instl_date.emtStart;
//     const endDate = instl_date.emiEnd;

//     let isEdit = members.some(m => Number(m.loan_id) > 0);

//     let total_disb_amt = 0;

//     // for (const mem of members) {
//     //   total_disb_amt += Number(mem.disburse_amt || 0);
//     // }

//     let groupMap = {};

//     for (const mem of members) {
//    if (!groupMap[mem.group_code]) {
//     groupMap[mem.group_code] = {
//       total: 0,
//       members: []
//     };
//     }

//   groupMap[mem.group_code].total += Number(mem.disburse_amt || 0);
//   groupMap[mem.group_code].members.push(mem);
// }


// for (const group_code in groupMap) {

//   let groupData = groupMap[group_code];
//   let total_disb_amt = groupData.total;

//   let loan_code = await loanCode(branch_id);
//   let trans_id = await transaction_id();

//   // ================== td_loan ==================
//   var table = "bdccb.td_loan";

//   var columns = ["loan_id","tenant_id","branch_id","loan_acc_no","loan_to","branch_shg_id","period","curr_roi","penal_roi","disb_dt","disb_amt","pay_mode","rep_start_dt","rep_end_dt","curr_prn","curr_intt","ovd_prn","ovd_intt","tot_grp","sanction_no","sanction_dt","created_by","created_dt","ip_address","group_code"];

//   var values = [
//     loan_code, tenant_id, branch_id, loan_acc_no || null, loan_to, branch_shg_id,
//     period, curr_roi, penal_roi, disb_dt, total_disb_amt, pay_mode,
//     startDate, endDate, total_disb_amt, 0, 0, 0,
//     tot_grp, sanction_no, sanction_dt, created_by, datetime, ip_address, group_code
//   ];

//   let result = await saveRecord(table, columns, values, [], [], 0);

//   if (!result || result.suc !== 1) {
//     return res.send({
//       success: false,
//       msg: "Loan save failed for group " + group_code
//     });
//   }

//   // ================== td_loan_transactions ==================
//   var table_trn = "bdccb.td_loan_transactions";

//   var columns_trn = [
//     "trans_dt","trans_id","tenant_id","loan_to","branch_shg_id","loan_id","loan_ac_no",
//     "trans_type","dr_amt","cr_amt","curr_prn_recov","curr_intt_recov",
//     "ovd_prn_recov","ovd_intt_recov","curr_prn","curr_intt","ovd_prn","ovd_intt",
//     "approval_status","created_by","created_dt","ip_address"
//   ];

//   var values_trn = [
//     disb_dt, trans_id, tenant_id, loan_to, branch_shg_id, loan_code, loan_acc_no || null,
//     "D", total_disb_amt, 0,
//     0,0,0,0,
//     total_disb_amt,0,0,0,
//     "A", created_by, datetime, ip_address
//   ];

//   let trans_result = await saveRecord(table_trn, columns_trn, values_trn, [], [], 0);

//   if (!trans_result || trans_result.suc !== 1) {
//     return res.send({
//       success: false,
//       msg: "Transaction save failed for group " + group_code
//     });
//   }

//   // 👉 store loan_code for member use
//   groupMap[group_code].loan_code = loan_code;
// }

//     for (const group_code in groupMap) {

//   let groupData = groupMap[group_code];
//   let loan_code = groupData.loan_code;

//   for (const mem of groupData.members) {

//     let mem_trans_id = await member_transaction_id();

//     // ✅ loanMemberId logic (same as yours)
//     let lastLoan = await db_Select(
//       "MAX(loan_id) as max_id",
//       "bdccb.td_loan_member",
//       `member_code='${mem.member_id}'`,
//       null
//     );

//     let nextSeq = 1;

//     if (lastLoan.suc === 1 && lastLoan.msg[0].max_id) {
//       let lastId = lastLoan.msg[0].max_id.toString();
//       let lastSeq = parseInt(lastId.slice(-2));
//       nextSeq = lastSeq + 1;
//     }

//     let seq = String(nextSeq).padStart(2, "0");
//     let loanMemberId = `${mem.member_id}${seq}`;

//     // ================== td_loan_member ==================
//     const table1 = "bdccb.td_loan_member";

//     const columns1 = [
//       "loan_id","ccb_loan_id","tenant_id","branch_id","loan_acc_no","loan_to",
//       "branch_shg_id","group_code","member_code","period","curr_roi","penal_roi",
//       "disb_dt","disb_amt","period_mode","rep_start_dt","rep_end_dt",
//       "prn_amt","ovd_prn_amt","intt_amt","ovd_intt_amt",
//       "tot_grp","sanction_no","sanction_dt","created_by","created_at","ip_address",
//       "society_roi","society_penal_roi"
//     ];

//     const values1 = [
//       loanMemberId, loan_code, tenant_id, branch_id, loan_acc_no, loan_to,
//       branch_shg_id, mem.group_code, mem.member_id,
//       period, curr_roi, penal_roi, disb_dt, mem.disburse_amt,
//       pay_mode, startDate, endDate,
//       loan_to == 'P' ? 0 : mem.disburse_amt,
//       0,0,0,
//       tot_grp, sanction_no, sanction_dt,
//       created_by, datetime, ip_address,
//       loan_to == 'P' ? curr_roi : '0',
//       loan_to == 'P' ? penal_roi : '0'
//     ];

//     await saveRecord(table1, columns1, values1, [], [], 0);

//     // ================== td_loan_member_trans ==================
//     const table2 = "bdccb.td_loan_member_trans";

//     const columns2 = [
//       "trans_date","trans_id","loan_id","ccb_loan_id","tenant_id","branch_id",
//       "loan_to","branch_shg_id","loan_acc_no","trans_type",
//       "dr_amt","cr_amt","curr_prn_recov","curr_intt_recov",
//       "ovd_prn_recov","ovd_intt_recov",
//       "curr_prn","curr_intt","ovd_prn","ovd_intt",
//       "approval_status","created_by","created_dt","ip_address"
//     ];

//     const values2 = [
//       disb_dt, mem_trans_id, loanMemberId, loan_code, tenant_id, branch_id,
//       loan_to, branch_shg_id, loan_acc_no,
//       'D', mem.disburse_amt, 0,
//       0,0,0,0,
//       loan_to == 'P' ? 0 : mem.disburse_amt,
//       0,0,0,
//       loan_to == 'P' ? 'U' : 'A',
//       created_by, datetime, ip_address
//     ];

//     await saveRecord(table2, columns2, values2, [], [], 0);
//   }
// }
//     return res.send({
//       success: true,
//       msg: loan_id > 0 ? "Disbursement edit Done Successfully"  : "Disbursement Done Successfully",
//     });
//   } catch (error) {
//     console.error("Error in while save disbursement:", error);
//     return res.send({
//       success: false,
//       msg: "Internal server error",
//       errorCode: "SERVER_ERROR",
//     });
//   }
// });


loanRouter.post("/save_disbursement", async (req, res) => {
  try {
    const {tenant_id,branch_id,loan_acc_no,loan_to,branch_shg_id,period,curr_roi,penal_roi,disb_dt,disb_amt,tot_grp,
    sanction_no,sanction_dt,members,created_by,ip_address,loan_id,tran_id} = req.body;
    console.log(req.body,'data');

    let datetime = new Date().toISOString().slice(0, 19).replace("T", " ");
    var pay_mode = "Monthly";

    // let loan_code = await loanCode(branch_id);
    // let intt_cal_amt = await interest_cal_amt(disb_amt,period,curr_roi,pay_mode);


    // let counter = 1;

    let instl_date = await genDate(disb_dt, period, pay_mode);
    const startDate = instl_date.emtStart;
    const endDate = instl_date.emiEnd;

    // let isEdit = members.some(m => Number(m.loan_id) > 0);

    // let total_disb_amt = 0;

    // for (const mem of members) {
    //   total_disb_amt += Number(mem.disburse_amt || 0);
    // }

    // ================= GROUP MAP =================
    let groupMap = {};

    for (const mem of members) {
   if (!groupMap[mem.group_code]) {
    groupMap[mem.group_code] = {
      total: 0,
      members: []
    };
    }

  groupMap[mem.group_code].total += Number(mem.disburse_amt || 0);
  groupMap[mem.group_code].members.push(mem);
}

 // =========================================================
    // CASE 1: loan_to = 'S' → GROUP LEVEL INSERT
    // =========================================================

 if (loan_to === 'S') {
for (const group_code in groupMap) {

  let groupData = groupMap[group_code];
  let total_disb_amt = groupData.total;

  let loan_code = await loanCode(branch_id);
  let trans_id = await transaction_id();
  let transacs_id = await transactions_id();

  groupMap[group_code].loan_code = loan_code;

  // ================== td_loan ==================
  var table = "bdccb.td_loan";

  var columns = ["loan_id","tenant_id","branch_id","loan_acc_no","loan_to","branch_shg_id","period","curr_roi","penal_roi","disb_dt","disb_amt","pay_mode","rep_start_dt","rep_end_dt","curr_prn","curr_intt","ovd_prn","ovd_intt","tot_grp","sanction_no","sanction_dt","created_by","created_dt","ip_address","group_code","fund_type"];

  var values = [
    loan_code, tenant_id, branch_id, loan_acc_no || null, loan_to, branch_shg_id,
    period, curr_roi, penal_roi, disb_dt, total_disb_amt, pay_mode,
    startDate, endDate, 0, 0, 0, 0,
    tot_grp, sanction_no, sanction_dt, created_by, datetime, ip_address, group_code, 'B'
  ];

  let result = await saveRecord(table, columns, values, [], [], 0);

  if (!result || result.suc !== 1) {
    return res.send({
      success: false,
      msg: "Loan save failed for group " + group_code
    });
  }

  // ================== td_loan_transactions ==================
  var table_trn = "bdccb.td_loan_transactions";

  var columns_trn = [
    "trans_dt","trans_id","tenant_id","loan_to","branch_shg_id","loan_id","loan_ac_no",
    "trans_type","dr_amt","cr_amt","curr_prn_recov","curr_intt_recov",
    "ovd_prn_recov","ovd_intt_recov","curr_prn","curr_intt","ovd_prn","ovd_intt",
    "approval_status","created_by","created_dt","ip_address"
  ];

  var values_trn = [
    disb_dt, trans_id, tenant_id, loan_to, branch_shg_id, loan_code, loan_acc_no || null,
    "D", total_disb_amt, 0,
    0,0,0,0,
    0,0,0,0,
    "U", created_by, datetime, ip_address
  ];
  let trans_result = await saveRecord(table_trn, columns_trn, values_trn, [], [], 0);

  if (!trans_result || trans_result.suc !== 1) {
    return res.send({
      success: false,
      msg: "Transaction save failed for group " + group_code
    });
  }

  // ================== td_loan_ccb ==================
  var table = "bdccb.td_loan_ccb";

  var columns = ["loan_id","tenant_id","branch_id","loan_acc_no","loan_to","branch_shg_id","period","curr_roi","penal_roi","disb_dt","disb_amt","pay_mode","rep_start_dt","rep_end_dt","curr_prn","curr_intt","ovd_prn","ovd_intt","tot_grp","sanction_no","sanction_dt","created_by","created_dt","ip_address","group_code","fund_type"];

  var values = [
    loan_code, tenant_id, branch_id, loan_acc_no || null, loan_to, branch_shg_id,
    period, curr_roi, penal_roi, disb_dt, total_disb_amt, pay_mode,
    startDate, endDate, 0, 0, 0, 0,
    tot_grp, sanction_no, sanction_dt, created_by, datetime, ip_address, group_code, 'B'
  ];

  let result_ccb = await saveRecord(table, columns, values, [], [], 0);

  if (!result_ccb || result_ccb.suc !== 1) {
    return res.send({
      success: false,
      msg: "Loan save failed for group " + group_code
    });
  }

  // ================== td_loan_ccb_trans ==================
  var table_trn = "bdccb.td_loan_ccb_trans";

  var columns_trn = [
    "trans_dt","trans_id","tenant_id","loan_to","branch_shg_id","loan_id","loan_ac_no",
    "trans_type","dr_amt","cr_amt","curr_prn_recov","curr_intt_recov",
    "ovd_prn_recov","ovd_intt_recov","curr_prn","curr_intt","ovd_prn","ovd_intt",
    "approval_status","created_by","created_dt","ip_address"
  ];

  var values_trn = [
    disb_dt, transacs_id, tenant_id, loan_to, branch_shg_id, loan_code, loan_acc_no || null,
    "D", total_disb_amt, 0,
    0,0,0,0,
    0,0,0,0,
    "U", created_by, datetime, ip_address
  ];
  let trans_result_ccb = await saveRecord(table_trn, columns_trn, values_trn, [], [], 0);

  if (!trans_result_ccb || trans_result_ccb.suc !== 1) {
    return res.send({
      success: false,
      msg: "Transaction save failed for group " + group_code
    });
  }
}
}

// =========================================================
    // CASE 2: loan_to = 'P' → MEMBER LEVEL ONLY
    // =========================================================
    // if (loan_to === 'P' || loan_to === 'S') {
    if (loan_to === 'S') {
    for (const group_code in groupMap) {

  let groupData = groupMap[group_code];

  let loan_codes = null;

    if (loan_to === 'P') {
          loan_codes = await loanCodes(branch_id);
        }
  // let loan_codes = loan_to === 'P' ? await loanCodes(branch_id) : null;
    // let loan_code = groupData.loan_code || await loanCode(branch_id);
    let loan_code = groupData.loan_code || null;
    
  // let loan_code = groupData.loan_code;


  for (const mem of groupData.members) {

    let mem_trans_id = await member_transaction_id();
  // let loan_codes = await loanCodes(branch_id);


    // ✅ loanMemberId logic (same as yours)
    let lastLoan = await db_Select(
      "MAX(loan_id) as max_id",
      "bdccb.td_loan_member",
      `member_code='${mem.member_id}'`,
      null
    );

    let nextSeq = 1;

    if (lastLoan.suc === 1 && lastLoan.msg[0].max_id) {
      let lastId = lastLoan.msg[0].max_id.toString();
      let lastSeq = parseInt(lastId.slice(-2));
      nextSeq = lastSeq + 1;
    }

    let seq = String(nextSeq).padStart(2, "0");
    let loanMemberId = `${mem.member_id}${seq}`;

    let final_ccb_id = loan_to === 'P' ? loan_codes : loan_code;

    // ================== td_loan_member ==================
    const table1 = "bdccb.td_loan_member";

    const columns1 = mem.mem_loan_id > 0 ? [
      "period","curr_roi","penal_roi",
      "disb_dt","disb_amt","rep_start_dt","rep_end_dt",
      "tot_grp","sanction_no","sanction_dt","modified_by","modified_at","ip_address",
      "society_roi","society_penal_roi"
    ] : [
      "loan_id","ccb_loan_id","tenant_id","branch_id","loan_acc_no","loan_to",
      "branch_shg_id","group_code","member_code","period","curr_roi","penal_roi",
      "disb_dt","disb_amt","period_mode","rep_start_dt","rep_end_dt",
      "prn_amt","ovd_prn_amt","intt_amt","ovd_intt_amt",
      "tot_grp","sanction_no","sanction_dt","created_by","created_at","ip_address",
      "society_roi","society_penal_roi","fund_type"
    ];

    const values1 = mem.mem_loan_id > 0 ? [
      period, curr_roi, penal_roi, disb_dt, mem.disburse_amt,
      startDate, endDate,tot_grp, sanction_no, sanction_dt,created_by, datetime, ip_address,
      loan_to == 'P' ? curr_roi : '0',
      loan_to == 'P' ? penal_roi : '0'
    ] : [
      loanMemberId, final_ccb_id, tenant_id, branch_id, loan_acc_no, loan_to,
      branch_shg_id, mem.group_code, mem.member_id,
      period, curr_roi, penal_roi, disb_dt, mem.disburse_amt,
      pay_mode, startDate, endDate,
      0,0,0,0,tot_grp, sanction_no, sanction_dt,created_by, datetime, ip_address,
      loan_to == 'P' ? curr_roi : '0',
      loan_to == 'P' ? penal_roi : '0', 'B'
    ];
    
    const whereColumns1 = mem.mem_loan_id > 0 ? ["loan_id","ccb_loan_id","tenant_id","group_code","member_code"] : [];
    const whereValues1 = mem.mem_loan_id > 0 ? [mem.mem_loan_id,loan_id,tenant_id,mem.group_code, mem.member_id] : [];
    const flag1 = mem.mem_loan_id > 0 ? 1 : 0;
    await saveRecord(table1, columns1, values1, whereColumns1, whereValues1, flag1);

    // ================== td_loan_member_trans ==================
    const table2 = "bdccb.td_loan_member_trans";

    const columns2 = mem.mem_loan_id > 0 ? [
      "trans_date","dr_amt","modified_by","modified_dt","ip_address"
    ] : [
      "trans_date","trans_id","loan_id","ccb_loan_id","tenant_id","branch_id",
      "loan_to","branch_shg_id","loan_acc_no","trans_type",
      "dr_amt","cr_amt","curr_prn_recov","curr_intt_recov",
      "ovd_prn_recov","ovd_intt_recov",
      "curr_prn","curr_intt","ovd_prn","ovd_intt",
      "approval_status","created_by","created_dt","ip_address"
    ];

    const values2 = mem.mem_loan_id > 0 ? [
      disb_dt, mem.disburse_amt,created_by, datetime, ip_address
    ] : [
      disb_dt, mem_trans_id, loanMemberId, final_ccb_id, tenant_id, branch_id,
      loan_to, branch_shg_id, loan_acc_no,
      'D', mem.disburse_amt, 0,
      0,0,0,0,0,0,0,0,'U',created_by, datetime, ip_address
    ];
    const whereColumns2 = mem.mem_loan_id > 0 ? ["loan_id","ccb_loan_id","tenant_id"] : [];
    const whereValues2 = mem.mem_loan_id > 0 ? [mem.mem_loan_id,loan_id,tenant_id] : [];
    const flag2 = mem.mem_loan_id > 0 ? 1 : 0;
await saveRecord(table2, columns2, values2, whereColumns2, whereValues2, flag2);
  }
}
    }
    return res.send({
      success: true,
      msg: loan_id > 0 ? "Disbursement edit Done Successfully"  : "Disbursement Done Successfully",
    });
  } catch (error) {
    console.error("Error in while save disbursement:", error);
    return res.send({
      success: false,
      msg: "Internal server error",
      errorCode: "SERVER_ERROR",
    });
  }
});

// SAVE DISBURSEMENT SOCIETY
loanRouter.post("/save_society_disbursement", async (req, res) => {
  try {
    const {tenant_id,branch_id,loan_acc_no,loan_to,branch_shg_id,period,curr_roi,penal_roi,disb_dt,disb_amt,tot_grp,sanction_no,sanction_dt,groups,created_by,ip_address,loan_id,tran_id} = req.body;
    console.log(req.body,'data_soc');

    let datetime = new Date().toISOString().slice(0, 19).replace("T", " ");
    var pay_mode = "Monthly";

    let instl_date = await genDate(disb_dt, period, pay_mode);
    const startDate = instl_date.emtStart;
    const endDate = instl_date.emiEnd;
    const isEdit = groups.some(x => x.loan_id > 0);

    for (const group of groups) {

    let loan_code = isEdit ? group.loan_id : await loanCode(branch_id);
    let trans_id = await transaction_id();
    let transacs_id = await transactions_id();


    group.loan_code = loan_code;

    // ================== td_loan ==================
    var table = "bdccb.td_loan";

    var columns = isEdit ? ["period","curr_roi","penal_roi","disb_dt","disb_amt","rep_start_dt","rep_end_dt","tot_grp","sanction_no","sanction_dt","modified_by","modified_dt","ip_address"] : ["loan_id","tenant_id","branch_id","loan_acc_no","loan_to","branch_shg_id","period","curr_roi","penal_roi","disb_dt","disb_amt","pay_mode","rep_start_dt","rep_end_dt","curr_prn","curr_intt","ovd_prn","ovd_intt","tot_grp","sanction_no","sanction_dt","created_by","created_dt","ip_address","group_code","fund_type"];

  var values = isEdit ? [period, curr_roi, penal_roi, disb_dt, group.disb_amt, startDate, endDate, tot_grp, sanction_no, sanction_dt, created_by, datetime, ip_address] : [
    loan_code, tenant_id, branch_id, loan_acc_no || null, loan_to, branch_shg_id,
    period, curr_roi, penal_roi, disb_dt, group.disb_amt, pay_mode, startDate, endDate, 0, 0, 0, 0,
    tot_grp, sanction_no, sanction_dt, created_by, datetime, ip_address, group.group_code, 'B'
  ];

  var whereColumns = isEdit ? ["loan_id","tenant_id","branch_id","branch_shg_id","group_code"] : [];

  var whereValues = isEdit ? [group.loan_id,tenant_id,branch_id,branch_shg_id,group.group_code] : [];

  var flag = isEdit ? 1 : 0;

  let result = await saveRecord(table, columns, values, whereColumns, whereValues, flag);

  if (!result || result.suc !== 1) {
    return res.send({
      success: false,
      msg: isEdit ? "Loan edit failed for society level" + group.group_code : "Loan save failed for society level" + group.group_code
    });
  }

  // ================== td_loan_transactions ==================
  var table_trn = "bdccb.td_loan_transactions";

  var columns_trn = isEdit ? ["dr_amt","modified_by","modified_dt","ip_address"] : [
    "trans_dt","trans_id","tenant_id","loan_to","branch_shg_id","loan_id","loan_ac_no",
    "trans_type","dr_amt","cr_amt","curr_prn_recov","curr_intt_recov",
    "ovd_prn_recov","ovd_intt_recov","curr_prn","curr_intt","ovd_prn","ovd_intt",
    "approval_status","created_by","created_dt","ip_address"
  ];

  var values_trn = isEdit ? [group.disb_amt, created_by, datetime, ip_address] : [
    disb_dt, trans_id, tenant_id, loan_to, branch_shg_id, loan_code, loan_acc_no || null,
    "D", group.disb_amt, 0, 0, 0, 0, 0, 0, 0, 0, 0, "U", created_by, datetime, ip_address];
  
  var where_trn = isEdit ? ["tenant_id","branch_shg_id","loan_id"] : [];  

  var wherevalues_trn = isEdit ? [tenant_id,branch_shg_id,group.loan_id] : [];  

  var flag_trn = isEdit ? 1 : 0;  

  let trans_result = await saveRecord(table_trn, columns_trn, values_trn, where_trn, wherevalues_trn, flag_trn);

  if (!trans_result || trans_result.suc !== 1) {
    return res.send({
      success: false,
      msg: isEdit ? "Transaction edit failed in society level" + group.group_code : "Transaction save failed in society level" + group.group_code
    });
  }

  // ================== td_loan_ccb ==================
  var table = "bdccb.td_loan_ccb";

  var columns = isEdit ? ["period","curr_roi","penal_roi","disb_dt","disb_amt","rep_start_dt","rep_end_dt","tot_grp","sanction_no","sanction_dt","modified_by","modified_dt","ip_address"] : ["loan_id","tenant_id","branch_id","loan_acc_no","loan_to","branch_shg_id","period","curr_roi","penal_roi","disb_dt","disb_amt","pay_mode","rep_start_dt","rep_end_dt","curr_prn","curr_intt","ovd_prn","ovd_intt","tot_grp","sanction_no","sanction_dt","created_by","created_dt","ip_address","group_code","fund_type"];

  var values = isEdit ? [period, curr_roi, penal_roi, disb_dt, group.disb_amt, startDate, endDate, tot_grp, sanction_no, sanction_dt, created_by, datetime, ip_address] : [
    loan_code, tenant_id, branch_id, loan_acc_no || null, loan_to, branch_shg_id,
    period, curr_roi, penal_roi, disb_dt, group.disb_amt, pay_mode, startDate, endDate, 0, 0, 0, 0,
    tot_grp, sanction_no, sanction_dt, created_by, datetime, ip_address, group.group_code, 'B'
  ];

  var whereColumns = isEdit ? ["loan_id","tenant_id","branch_id","branch_shg_id","group_code"] : [];

  var whereValues = isEdit ? [group.loan_id,tenant_id,branch_id,branch_shg_id,group.group_code] : [];

  var flag = isEdit ? 1 : 0;

  let result_ccb = await saveRecord(table, columns, values, whereColumns, whereValues, flag);

  if (!result_ccb || result_ccb.suc !== 1) {
    return res.send({
      success: false,
      msg: isEdit ? "Loan edit failed while disburse branch to soc" + group.group_code : "Loan save failed while disburse branch to soc" + group.group_code
    });
  }

  // ================== td_loan_ccb_trans ==================
  var table_trn = "bdccb.td_loan_ccb_trans";

  var columns_trn = isEdit ? ["dr_amt","modified_by","modified_dt","ip_address"
  ] : [
    "trans_dt","trans_id","tenant_id","loan_to","branch_shg_id","loan_id","loan_ac_no",
    "trans_type","dr_amt","cr_amt","curr_prn_recov","curr_intt_recov",
    "ovd_prn_recov","ovd_intt_recov","curr_prn","curr_intt","ovd_prn","ovd_intt",
    "approval_status","created_by","created_dt","ip_address"
  ];

  var values_trn = isEdit ? [group.disb_amt, created_by, datetime, ip_address] : [
    disb_dt, transacs_id, tenant_id, loan_to, branch_shg_id, loan_code, loan_acc_no || null,
    "D", group.disb_amt, 0, 0, 0, 0, 0, 0, 0, 0, 0, "U", created_by, datetime, ip_address];

  var where_trn = isEdit ? ["tenant_id","branch_shg_id","loan_id"] : [];  

  var wherevalues_trn = isEdit ? [tenant_id,branch_shg_id,group.loan_id] : [];  

  var flag_trn = isEdit ? 1 : 0;  

  let trans_result_ccb = await saveRecord(table_trn, columns_trn, values_trn, where_trn, wherevalues_trn, flag_trn);

  if (!trans_result_ccb || trans_result_ccb.suc !== 1) {
    return res.send({
      success: false,
      msg: isEdit ? "Transaction edit failed while disburse branch to society" + group.group_code : "Transaction save failed while disburse branch to society" + group.group_code
    });
  }
}

    return res.send({
      success: true,
      msg: isEdit ? "Disbursement edit Done Successfully"  : "Disbursement Done Successfully",
    });
  } catch (error) {
    console.error("Error in while save disbursement:", error);
    return res.send({
      success: false,
      msg: "Internal server error",
      errorCode: "SERVER_ERROR",
    });
  }
});

// fetch societu disbursement
// loanRouter.post("/fetch_society_disbursement_dtls", async (req, res) => {
//   try {

//     const { branch_id, approval_status, loan_to, from_dt, to_dt} = req.body;

//     /* ---------------- MAIN LOAN DETAILS ---------------- */

//     let select = `a.loan_id,a.tenant_id,a.branch_id,a.loan_acc_no,a.loan_to,a.branch_shg_id,c.branch_name AS loan_to_name,a.period,a.curr_roi,a.penal_roi,TO_CHAR(a.disb_dt,'YYYY-MM-DD') AS disb_dt,SUM(a.disb_amt) OVER(PARTITION BY a.loan_id) AS disb_amt,a.period,TO_CHAR(a.rep_start_dt, 'YYYY-MM-DD') AS rep_start_dt,TO_CHAR(a.rep_end_dt, 'YYYY-MM-DD') AS rep_end_dt,a.sanction_no,TO_CHAR(a.sanction_dt, 'YYYY-MM-DD') AS sanction_dt,a.curr_prn,a.curr_intt,a.ovd_prn,a.ovd_intt,a.tot_grp,b.trans_type,b.approval_status,a.created_by,a.created_dt,b.approved_by approved_id,e.user_name approved_by,b.approved_dt,a.ip_address`;

//     let table_name = `bdccb.td_loan a LEFT JOIN bdccb.td_loan_transactions b ON a.tenant_id = b.tenant_id
//       AND a.loan_id = b.loan_id AND a.branch_shg_id = b.branch_shg_id LEFT JOIN public.md_branch c ON a.branch_shg_id = c.branch_id LEFT JOIN bdccb.md_user e ON b.approved_by = e.user_id`;

//     let whr = `a.branch_id = '${branch_id}' AND b.approval_status = '${approval_status}' AND a.loan_to = '${loan_to}' AND b.trans_type = 'D' AND a.fund_type = 'B'`;
//     if (from_dt && to_dt) {
//          whr += `AND b.trans_dt::date BETWEEN '${from_dt}' AND '${to_dt}'`;
//       }

//     let order = `a.loan_id,b.trans_id DESC`;

//     let loan_dtls = await db_Select(select,table_name,whr,order);

//     if (!(loan_dtls.suc === 1 && loan_dtls.msg.length > 0)) {
//       return res.send({
//         success: true,
//         msg: "No data found"
//       });
//     }

//     /* ---------------- FINAL RESPONSE ARRAY ---------------- */

//     let response = [];

//     for (const loan of loan_dtls.msg) {

//       /* ---------------- GROUP DETAILS ---------------- */

//       let grp_select = `
//         DISTINCT ON (a.group_code)

//         c.sb_ac_no AS grp_sb_acc_no,
//         a.group_code,
//         c.group_name,
//         a.disb_amt
//       `;

//       let grp_table = `
//         bdccb.td_loan a

//         LEFT JOIN bdccb.md_group c
//         ON a.group_code = c.group_code
//       `;

//       let grp_whr = `
//         a.loan_id = '${loan.loan_id}'
//         AND a.loan_acc_no = '${loan.loan_acc_no}'
//       `;

//       let grp_order = `
//         a.group_code
//       `;

//       let grp_dtls = await db_Select(
//         grp_select,
//         grp_table,
//         grp_whr,
//         grp_order
//       );

//       response.push({

//         loan_id       : loan.loan_id || 0,
//         tenant_id     : loan.tenant_id || "",
//         branch_id     : loan.branch_id || "",
//         loan_acc_no   : loan.loan_acc_no || "",
//         loan_to       : loan.loan_to || "",
//         branch_shg_id : loan.branch_shg_id || "",
//         loan_to_name : loan.loan_to_name || "",
//         period        : loan.period || "",
//         curr_roi      : loan.curr_roi || "",
//         penal_roi     : loan.penal_roi || "",
//         disb_dt       : loan.disb_dt || "",
//         disb_amt      : loan.disb_amt || 0,
//         tot_grp       : loan.tot_grp || 0,
//         sanction_no   : loan.sanction_no || "",
//         sanction_dt   : loan.sanction_dt || "",
//         created_by    : loan.created_by || "",
//         ip_address    : loan.ip_address || "",

//         approval_status : loan.approval_status || "",

//         approved_by : loan.approval_status === 'A'
//           ? loan.approved_by || ""
//           : "",

//         approved_dt : loan.approval_status === 'A'
//           ? loan.approved_dt || ""
//           : "",

//         groups : grp_dtls.suc === 1
//         ? grp_dtls.msg.map(g => ({

//             grp_sb_acc_no : g.grp_sb_acc_no || "",
//             group_code    : g.group_code || "",
//             group_anme    : g.group_namr || "",
//             disb_amt      : g.disb_amt || 0

//           }))
//         : []

//       });

//     }

//     /* ---------------- RETURN RESPONSE ---------------- */

//     return res.send({
//       success: true,
//       msg: "Fetch Society Disbursement Details",
//       data: response
//     });

//   } catch (error) {

//     console.error(error);

//     return res.send({
//       success: false,
//       msg: "Internal Server Error"
//     });

//   }
// });

loanRouter.post("/fetch_society_disbursement_dtls", async (req, res) => {

  try {

    const {
      branch_id,
      approval_status,
      loan_to,
      from_dt,
      to_dt,
      branch_type
    } = req.body;

    /* ---------------- MAIN LOAN DETAILS ---------------- */

    let select = `
      a.loan_id,
      b.trans_id,
      a.tenant_id,
      a.branch_id,
      a.loan_acc_no,
      a.loan_to,
      a.branch_shg_id,

      c.branch_name AS loan_to_name,

      a.period,
      a.curr_roi,
      a.penal_roi,

      TO_CHAR(a.disb_dt,'YYYY-MM-DD') AS disb_dt,

      a.disb_amt,

      TO_CHAR(a.rep_start_dt,'YYYY-MM-DD') AS rep_start_dt,
      TO_CHAR(a.rep_end_dt,'YYYY-MM-DD') AS rep_end_dt,

      a.sanction_no,
      TO_CHAR(a.sanction_dt,'YYYY-MM-DD') AS sanction_dt,

      a.curr_prn,
      a.curr_intt,
      a.ovd_prn,
      a.ovd_intt,

      a.tot_grp,

      b.trans_type,
      b.approval_status,

      a.created_by,
      a.created_dt,

      b.approved_by AS approved_id,
      e.user_name AS approved_by,

      TO_CHAR(b.approved_dt,'YYYY-MM-DD') AS approved_dt,

      a.ip_address
    `;

    let table_name = `
      bdccb.td_loan a

      LEFT JOIN bdccb.td_loan_transactions b
      ON a.tenant_id = b.tenant_id
      AND a.loan_id = b.loan_id
      AND a.branch_shg_id = b.branch_shg_id

      LEFT JOIN public.md_branch c
      ON a.branch_shg_id = c.branch_id

      LEFT JOIN bdccb.md_user e
      ON b.approved_by = e.user_id
    `;

    let whr = `b.approval_status = '${approval_status}'
      AND a.loan_to = '${loan_to}'
      AND b.trans_type = 'D'
      AND a.fund_type = 'B'
    `;

    if (branch_type === 'H') {

    whr += `
    AND a.branch_shg_id = '${branch_id}'
    `;

    } else {

    whr += `
    AND a.branch_id = '${branch_id}'
    `;

    }

    if (from_dt && to_dt) {

      whr += `
        AND b.trans_dt::date
        BETWEEN '${from_dt}'
        AND '${to_dt}'
      `;

    }

    let order = `
      a.loan_acc_no,
      a.loan_id
    `;

    let loan_dtls = await db_Select(
      select,
      table_name,
      whr,
      order
    );

    if (!(loan_dtls.suc === 1 && loan_dtls.msg.length > 0)) {

      return res.send({
        success: true,
        msg: "No data found",
        data: []
      });

    }

    /* ---------------- GROUPED RESPONSE ---------------- */

    let response = {};

    for (const loan of loan_dtls.msg) {

      /* ---------- CREATE MAIN OBJECT ---------- */

      if (!response[loan.loan_acc_no]) {

        response[loan.loan_acc_no] = {

          tenant_id     : loan.tenant_id || "",
          branch_id     : loan.branch_id || "",
          loan_acc_no   : loan.loan_acc_no || "",
          loan_to       : loan.loan_to || "",
          branch_shg_id : loan.branch_shg_id || "",
          loan_to_name  : loan.loan_to_name || "",

          period        : loan.period || "",
          curr_roi      : loan.curr_roi || "",
          penal_roi     : loan.penal_roi || "",

          disb_dt       : loan.disb_dt || "",

          disb_amt      : 0,

          tot_grp       : loan.tot_grp || 0,

          sanction_no   : loan.sanction_no || "",
          sanction_dt   : loan.sanction_dt || "",

          created_by    : loan.created_by || "",

          ip_address    : loan.ip_address || "",

          approval_status : loan.approval_status || "",

          approved_by : loan.approval_status === 'A'
            ? loan.approved_by || ""
            : "",

          approved_dt : loan.approval_status === 'A'
            ? loan.approved_dt || ""
            : "",

          groups : []

        };

      }

      /* ---------- GROUP DETAILS ---------- */

      let grp_select = `
        c.sb_ac_no AS grp_sb_acc_no,
        a.group_code,
        c.group_name,
        a.disb_amt
      `;

      let grp_table = `
        bdccb.td_loan a

        LEFT JOIN bdccb.md_group c
        ON a.group_code = c.group_code
      `;

      let grp_whr = `
        a.loan_id = '${loan.loan_id}'
      `;

      let grp_order = `
        a.group_code
      `;

      let grp_dtls = await db_Select(
        grp_select,
        grp_table,
        grp_whr,
        grp_order
      );

      /* ---------- TOTAL DISBURSE AMOUNT ---------- */

      response[loan.loan_acc_no].disb_amt =
        Number(response[loan.loan_acc_no].disb_amt)
        + Number(loan.disb_amt || 0);

      /* ---------- PUSH GROUPS ---------- */

      if (grp_dtls.suc === 1) {

        grp_dtls.msg.forEach(g => {

          response[loan.loan_acc_no].groups.push({

            loan_id       : loan.loan_id || 0,

            grp_sb_acc_no : g.grp_sb_acc_no || "",

            group_code    : g.group_code || "",

            group_name    : g.group_name || "",

            disb_amt      : g.disb_amt || 0

          });

        });

      }

    }

    /* ---------------- FINAL RESPONSE ---------------- */

    return res.send({

      success: true,

      msg: "Fetch Society Disbursement Details",

      data: Object.values(response)

    });

  } catch (error) {

    console.error(error);

    return res.send({

      success: false,

      msg: "Internal Server Error"

    });

  }

});

// FETCH PACS DETAILS FOR APPROVE
// loanRouter.post("/fetch_disburse_dtls", async (req, res) => {
// try{
// const { branch_id, tenant_id, from_dt, to_dt, approval_status } = req.body;
// // console.log(req.body);

// var select = "a.group_code,b.group_name,COUNT(DISTINCT a.member_code) AS tot_member, COALESCE(SUM(a.disb_amt),0) AS tot_outstanding,c.approval_status,a.ccb_loan_id",
// table_name = "bdccb.td_loan_member a LEFT JOIN bdccb.md_group b ON a.group_code = b.group_code LEFT JOIN bdccb.td_loan_member_trans c ON a.loan_id = c.loan_id AND a.ccb_loan_id = c.ccb_loan_id",
// whr = `a.branch_shg_id = '${branch_id}' AND a.tenant_id = '${tenant_id}' AND c.trans_type = 'D' AND c.approval_status = '${approval_status}' AND a.fund_type = 'B'`;
// if (from_dt && to_dt) {
//   whr += `AND c.trans_date::date BETWEEN '${from_dt}' AND '${to_dt}'`;
// }
// whr += `GROUP BY a.group_code,b.group_name,c.approval_status,a.ccb_loan_id`;
// order = null;
// var fetch_data = await db_Select(select, table_name, whr, order);

// if (fetch_data.suc === 1 && fetch_data.msg.length > 0) {
//   return res.send({
//     success: true,
//     msg: "Fetch unapprove disbursement details",
//     data: fetch_data.msg,
//   });
// } else {
//   return res.send({
//     success: true,
//     msg: "No unapprove disbursement details found",
//     data: [],
//   });
// }
// }catch (error) {
//     console.error("Error in while fetch unapprove disbursement details:", error);
//     return res.send({
//       success: false,
//       msg: "Internal server error",
//       errorCode: "SERVER_ERROR",
//     });
//   }
// });

loanRouter.post("/fetch_disburse_dtls", async (req, res) => {
try{
const { branch_id, tenant_id, from_dt, to_dt, approval_status } = req.body;
// console.log(req.body);

var select = "a.group_code,b.group_name,a.loan_acc_no,COALESCE(a.disb_amt,0) AS tot_outstanding,c.approval_status,a.loan_id AS ccb_loan_id,c.trans_id,d.trans_id AS transaction_id",
table_name = "bdccb.td_loan a LEFT JOIN bdccb.md_group b ON a.group_code = b.group_code LEFT JOIN bdccb.td_loan_transactions c ON a.loan_id = c.loan_id LEFT JOIN bdccb.td_loan_ccb_trans ON a.loan_id = b.loan_id",
whr = `a.branch_shg_id = '${branch_id}' AND a.tenant_id = '${tenant_id}' AND c.trans_type = 'D' AND c.approval_status = '${approval_status}' AND a.fund_type = 'B'`;
if (from_dt && to_dt) {
  whr += ` AND c.trans_dt::date BETWEEN '${from_dt}' AND '${to_dt}'`;
}
// whr += `GROUP BY a.group_code,b.group_name,c.approval_status,a.loan_id`;
order = null;
var fetch_data = await db_Select(select, table_name, whr, order);

if (fetch_data.suc === 1 && fetch_data.msg.length > 0) {
  return res.send({
    success: true,
    msg: "Fetch unapprove disbursement details",
    data: fetch_data.msg,
  });
} else {
  return res.send({
    success: true,
    msg: "No unapprove disbursement details found",
    data: [],
  });
}
}catch (error) {
    console.error("Error in while fetch unapprove disbursement details:", error);
    return res.send({
      success: false,
      msg: "Internal server error",
      errorCode: "SERVER_ERROR",
    });
  }
});

// loanRouter.post("/fetch_disburse_dtls", async (req, res) => {
// try{
// const { branch_id, tenant_id } = req.body;
// // console.log(req.body);

// var select = "a.group_code,b.group_name,COUNT(DISTINCT a.member_code) AS tot_member, COALESCE(SUM(a.disb_amt),0) AS tot_outstanding,c.approval_status,STRING_AGG(DISTINCT a.ccb_loan_id::text, ',') AS ccb_loan_id",
// table_name = `bdccb.td_loan_member a LEFT JOIN bdccb.md_group b ON a.group_code = b.group_code LEFT JOIN (
//     SELECT DISTINCT ON (loan_id, ccb_loan_id)
//            loan_id, ccb_loan_id, approval_status, trans_type
//     FROM bdccb.td_loan_member_trans
//     WHERE trans_type = 'D'
//     ORDER BY loan_id, ccb_loan_id, trans_id DESC
// ) c 
//  ON a.loan_id = c.loan_id 
// AND a.ccb_loan_id = c.ccb_loan_id`,
// whr = `a.branch_shg_id = '${branch_id}' AND a.tenant_id = '${tenant_id}'
//       GROUP BY a.group_code,b.group_name,c.approval_status`,
// order = null;
// var fetch_data = await db_Select(select, table_name, whr, order);

// if (fetch_data.suc === 1 && fetch_data.msg.length > 0) {
//   return res.send({
//     success: true,
//     msg: "Fetch unapprove disbursement details",
//     data: fetch_data.msg,
//   });
// } else {
//   return res.send({
//     success: true,
//     msg: "No unapprove disbursement details found",
//     data: [],
//   });
// }
// }catch (error) {
//     console.error("Error in while fetch unapprove disbursement details:", error);
//     return res.send({
//       success: false,
//       msg: "Internal server error",
//       errorCode: "SERVER_ERROR",
//     });
//   }
// });

// FETCH UNAPPROVE DISBURSEMENT GROUP DETAILS WITH MEMBER
loanRouter.post("/fetch_unapprove_disburse", async (req, res) => {
  try {
    const {group_code,branch_code,tenant_id, approval_status, loan_to, ccb_loan_id} = req.body;
    // console.log(req.body,'ju');
    

    var select = "a.ccb_loan_id loan_id,a.tenant_id,a.branch_id,a.loan_acc_no,d.group_name,a.group_code,a.loan_to,a.branch_shg_id,c.branch_name AS pacs_name,a.period,a.curr_roi,a.penal_roi,TO_CHAR(a.disb_dt, 'YYYY-MM-DD') AS disb_dt,SUM(a.disb_amt) disb_amt,a.period_mode,TO_CHAR(a.rep_start_dt, 'YYYY-MM-DD') AS rep_start_dt,TO_CHAR(a.rep_end_dt, 'YYYY-MM-DD') AS rep_end_dt,a.sanction_no,a.society_acc_no,TO_CHAR(a.sanction_dt, 'YYYY-MM-DD') AS sanction_dt,b.trans_type,b.approval_status,b.reject_remarks",
    table_name = "bdccb.td_loan_member a LEFT JOIN bdccb.td_loan_member_trans b ON a.tenant_id = b.tenant_id AND a.loan_id = b.loan_id AND a.ccb_loan_id = b.ccb_loan_id LEFT JOIN public.md_branch c ON a.branch_shg_id = c.branch_id LEFT JOIN bdccb.md_group d ON a.group_code = d.group_code",
    whr = `a.tenant_id = '${tenant_id}' AND a.ccb_loan_id = '${ccb_loan_id}' AND a.branch_shg_id = '${branch_code}' AND a.group_code = '${group_code}' AND b.approval_status = '${approval_status}' AND a.loan_to = '${loan_to}' AND b.trans_type = 'D' GROUP BY a.ccb_loan_id,a.tenant_id,a.branch_id,a.loan_acc_no,d.group_name,a.group_code,a.loan_to,a.branch_shg_id,c.branch_name,a.period,a.curr_roi,a.penal_roi,a.disb_dt,a.period_mode,a.rep_start_dt,a.rep_end_dt,a.sanction_no,a.sanction_dt,a.society_acc_no,b.trans_type,b.approval_status,b.reject_remarks`,
    order = null;
    var loan_disb_dtls = await db_Select(select, table_name, whr, order);

    if (!(loan_disb_dtls.suc === 1 && loan_disb_dtls.msg.length > 0)) {
      return res.send({
        success: true,
        msg: `Unable to fetch ${approval_status == "A" ? "Approved" : approval_status == "U" ? "Unapproved" : "Rejected"} disbursed loan details`,
        data: [],
      });
    }

   // * ---------------- MEMBER QUERY LOOP ---------------- //

   let finalData_mem = [];

   for (let loan of loan_disb_dtls.msg) {
    let mem_select = "DISTINCT ON (a.member_code) a.loan_id AS mem_loan_id,b.trans_id AS tran_id,a.group_code,c.group_name,a.member_code AS member_id,d.member_name,a.disb_amt AS disburse_amt,c.pacs_id,d.member_account_no AS sb_acc_no",
      mem_table = "bdccb.td_loan_member a LEFT JOIN bdccb.td_loan_member_trans b ON a.loan_id = b.loan_id AND a.ccb_loan_id = b.ccb_loan_id AND a.tenant_id = b.tenant_id LEFT JOIN bdccb.md_group c ON a.group_code = c.group_code LEFT JOIN bdccb.md_member d ON a.group_code = d.group_code AND a.member_code = d.member_code",
      mem_whr = `a.tenant_id = '${loan.tenant_id}' AND a.ccb_loan_id = '${loan.loan_id}' AND a.group_code = '${group_code}'`;
      let member_dtls = await db_Select(mem_select,mem_table,mem_whr,null);

      loan.members = member_dtls.suc === 1 ? member_dtls.msg : [];

      finalData_mem.push(loan);
    }
     return res.send({
      success: true,
      msg: `Fetch ${approval_status == "A" ? "Approved" : approval_status == "U" ? "Unapproved" : "Rejected"} disbursed Loan Details`,
      data: finalData_mem,
    });
  } catch (error) {
    console.error("Error in while fetch disbursement details:", error);
    return res.send({
      success: false,
      msg: "Internal server error",
      errorCode: "SERVER_ERROR",
    });
  }
});

// FETCH SHG DETAILS FOR APPROVE
loanRouter.post("/fetch_shg_disburse_dtls", async (req, res) => {
try{
const { branch_id, tenant_id, approval_status } = req.body;

var select = "a.group_code,b.group_name,COUNT(DISTINCT a.member_code) AS tot_member, COALESCE(SUM(a.disb_amt),0) AS tot_outstanding,c.approval_status,a.ccb_loan_id",
table_name = "bdccb.td_loan_member a LEFT JOIN bdccb.md_group b ON a.group_code = b.group_code LEFT JOIN bdccb.td_loan_member_trans c ON a.loan_id = c.loan_id AND a.ccb_loan_id = c.ccb_loan_id",
whr = `a.branch_id = '${branch_id}' AND a.tenant_id = '${tenant_id}' AND a.loan_to = 'S' AND c.approval_status = '${approval_status}'
      GROUP BY a.group_code,b.group_name,c.approval_status,a.ccb_loan_id`,
order = null;
var fetch_data_shg = await db_Select(select, table_name, whr, order);

if (fetch_data_shg.suc === 1 && fetch_data_shg.msg.length > 0) {
  return res.send({
    success: true,
    msg: "Fetch unapprove shg disbursement details",
    data: fetch_data_shg.msg,
  });
} else {
  return res.send({
    success: true,
    msg: "No unapprove shg disbursement details found",
    data: [],
  });
}
}catch (error) {
    console.error("Error in while fetch shg unapprove disbursement details:", error);
    return res.send({
      success: false,
      msg: "Internal server error",
      errorCode: "SERVER_ERROR",
    });
  }
});

// FETCH UNAPPROVE DISBURSEMENT shg GROUP DETAILS WITH MEMBER
loanRouter.post("/fetch_shg_unapprove_disburse", async (req, res) => {
  try {
    const {group_code,branch_code,tenant_id, approval_status, loan_to, ccb_loan_id} = req.body;

    var select = "a.ccb_loan_id loan_id,a.tenant_id,a.branch_id,a.loan_acc_no,a.loan_to,a.branch_shg_id,c.branch_name AS pacs_name,a.period,a.curr_roi,a.penal_roi,TO_CHAR(a.disb_dt, 'YYYY-MM-DD') AS disb_dt,SUM(a.disb_amt) disb_amt,a.period_mode,a.sanction_no,a.society_acc_no,TO_CHAR(a.sanction_dt, 'YYYY-MM-DD') AS sanction_dt,b.trans_type,b.approval_status,b.reject_remarks",
    table_name = "bdccb.td_loan_member a LEFT JOIN bdccb.td_loan_member_trans b ON a.tenant_id = b.tenant_id AND a.loan_id = b.loan_id AND a.ccb_loan_id = b.ccb_loan_id LEFT JOIN public.md_branch c ON a.branch_shg_id = c.branch_id",
    whr = `a.tenant_id = '${tenant_id}' AND a.ccb_loan_id = '${ccb_loan_id}' AND a.branch_id = '${branch_code}' AND a.group_code = '${group_code}' AND b.approval_status = '${approval_status}' AND a.loan_to = '${loan_to}' AND b.trans_type = 'D' GROUP BY a.ccb_loan_id,a.tenant_id,a.branch_id,a.loan_acc_no,a.loan_to,a.branch_shg_id,c.branch_name,a.period,a.curr_roi,a.penal_roi,a.disb_dt,a.period_mode,a.sanction_no,a.sanction_dt,a.society_acc_no,b.trans_type,b.approval_status,b.reject_remarks`,
    order = null;
    var loan_shg_disb_dtls = await db_Select(select, table_name, whr, order);

    if (!(loan_shg_disb_dtls.suc === 1 && loan_shg_disb_dtls.msg.length > 0)) {
      return res.send({
        success: true,
        msg: `Unable to fetch ${approval_status == "A" ? "Approved" : approval_status == "U" ? "Unapproved" : "Rejected"} disbursed loan details`,
        data: [],
      });
    }

   // * ---------------- MEMBER QUERY LOOP ---------------- //

   let finalData_mem = [];

   for (let loan of loan_shg_disb_dtls.msg) {
    let mem_select = "a.loan_id AS mem_loan_id,b.trans_id AS tran_id,a.group_code,c.group_name,a.member_code AS member_id,d.member_name,a.disb_amt AS disburse_amt,c.pacs_id,d.member_account_no AS sb_acc_no",
      mem_table = "bdccb.td_loan_member a LEFT JOIN bdccb.td_loan_member_trans b ON a.loan_id = b.loan_id AND a.ccb_loan_id = b.ccb_loan_id AND a.tenant_id = b.tenant_id LEFT JOIN bdccb.md_group c ON a.group_code = c.group_code LEFT JOIN bdccb.md_member d ON a.group_code = d.group_code AND a.member_code = d.member_code",
      mem_whr = `a.tenant_id = '${loan.tenant_id}' AND a.ccb_loan_id = '${loan.loan_id}' AND a.group_code = '${group_code}'`;
      let shg_member_dtls = await db_Select(mem_select,mem_table,mem_whr,null);

      loan.members = shg_member_dtls.suc === 1 ? shg_member_dtls.msg : [];

      finalData_mem.push(loan);
    }
     return res.send({
      success: true,
      msg: `Fetch ${approval_status == "A" ? "Approved" : approval_status == "U" ? "Unapproved" : "Rejected"} disbursed Loan Details`,
      data: finalData_mem,
    });
  } catch (error) {
    console.error("Error in while fetch disbursement details:", error);
    return res.send({
      success: false,
      msg: "Internal server error",
      errorCode: "SERVER_ERROR",
    });
  }
});

// ACCEPT SHG DISBURSEMENT
loanRouter.post("/accept_shg_disbursement", async (req, res) => {
  try{
  const {loan_id,trans_id,group_code,member_disburse,created_by,ip_address} = req.body;
  console.log(req.body,'req.body');

   if (!member_disburse || member_disburse.length === 0) {
      return res.send({
        success: true,
        msg: "No member disbursement data"
      });
    }
  

  let loan_ids = Array.isArray(loan_id) ? loan_id : loan_id.split(',').map(x => x.trim());
  let trans_ids = Array.isArray(trans_id) ? trans_id : trans_id.split(',').map(x => x.trim());
  let group_codes = Array.isArray(group_code) ? group_code : group_code.split(',').map(x => x.trim());

  if (
  loan_ids.length !== trans_ids.length ||
  loan_ids.length !== group_codes.length
) {
  return res.send({
    success: false,
    msg: "Loan/Trans/Group mismatch"
  });
}

  let datetime = new Date().toISOString().slice(0, 19).replace("T", " ");

   let memberIds = member_disburse.map(m => m.member_id).join(",");

   let loanMapRes = await db_Select(
      "member_code, ccb_loan_id",
      "bdccb.td_loan_member",
      `member_code IN (${memberIds})`
    );
    console.log(loanMapRes);
    
       if (loanMapRes.suc !== 1) {
      return res.send({
        success: false,
        msg: "Error fetching member mapping"
      });
    }

     let memberToLoanMap = {};
    loanMapRes.msg.forEach(row => {
      memberToLoanMap[row.member_code] = row.ccb_loan_id;
      console.log(row.ccb_loan_id);
      
    });
   
   for (let memb of member_disburse) {

          const mem_table_trans = "bdccb.td_loan_member_trans";
          const mem_columns_trans = ["curr_prn","approval_status","approved_by","approved_dt","modified_by","modified_dt","ip_address"];
          const mem_values_trans = [memb.disb_amt,"A",created_by, datetime,created_by, datetime,ip_address];
          const mem_whereColumns_trans = ["loan_id","trans_id"];
          const mem_whereValues_trans = [memb.loan_id,memb.trans_id];
          const mem_flag_trans = 1;
          await saveRecord(mem_table_trans,mem_columns_trans,mem_values_trans,mem_whereColumns_trans,mem_whereValues_trans,mem_flag_trans);

          const mem_table = "bdccb.td_loan_member";
          const mem_columns = ["prn_amt","modified_by","modified_at","ip_address"];
          const mem_values = [memb.disb_amt,created_by, datetime,ip_address];
          const mem_whereColumns = ["loan_id","member_code"];
          const mem_whereValues = [memb.loan_id,memb.member_id];
          const mem_flag = 1;
          await saveRecord(mem_table,mem_columns,mem_values,mem_whereColumns,mem_whereValues,mem_flag);  
    }

     let loanWiseTotal = {};

    for (let memb of member_disburse) {

      let shgLoanId = memberToLoanMap[memb.member_id];

      if (!shgLoanId) continue;

      if (!loanWiseTotal[shgLoanId]) {
        loanWiseTotal[shgLoanId] = 0;
      }

      loanWiseTotal[shgLoanId] += Number(memb.disb_amt || 0);
    }

    for (let i = 0; i < loan_ids.length; i++) {
      // let total = loanWiseTotal[loan_ids[i]] || 0;
      // let loanId = String(loan_ids[i]);
      // let transId = trans_ids[i];
      // let groupCode = group_codes[i];

      let loanId = loan_ids[i];
      let transId = trans_ids[i];
      let groupCode = group_codes[i];


      let total = loanWiseTotal[loanId] || 0;
      console.log("Loan:", loanId, "Total:", total);

          const mem_table_tran = "bdccb.td_loan_transactions";
          const mem_columns_tran = ["curr_prn","approval_status","approved_by","approved_dt","modified_by","modified_dt","ip_address"];
          const mem_values_tran = [total ,"A",created_by, datetime,created_by, datetime,ip_address];
          const mem_whereColumns_tran = ["loan_id","trans_id"];
          const mem_whereValues_tran = [loanId, transId];
          const mem_flag_tran = 1;
          await saveRecord(mem_table_tran,mem_columns_tran,mem_values_tran,mem_whereColumns_tran,mem_whereValues_tran,mem_flag_tran);

          const mem_tables = "bdccb.td_loan";
          const mem_columnss = ["curr_prn","modified_by","modified_dt","ip_address"];
          const mem_valuess = [total ,created_by, datetime,ip_address];
          const mem_whereColumnss = ["loan_id","group_code"];
          const mem_whereValuess = [loanId, groupCode];
          const mem_flags = 1;
          await saveRecord(mem_tables,mem_columnss,mem_valuess,mem_whereColumnss,mem_whereValuess,mem_flags); 

          const mem_table_trans = "bdccb.td_loan_ccb_trans";
          const mem_columns_trans = ["curr_prn","approval_status","approved_by","approved_dt","modified_by","modified_dt","ip_address"];
          const mem_values_trans = [total ,"A",created_by, datetime,created_by, datetime,ip_address];
          const mem_whereColumns_trans = ["loan_id"];
          const mem_whereValues_trans = [loanId];
          const mem_flag_trans = 1;
          await saveRecord(mem_table_trans,mem_columns_trans,mem_values_trans,mem_whereColumns_trans,mem_whereValues_trans,mem_flag_trans);

          const mem_tables1 = "bdccb.td_loan_ccb";
          const mem_columnss1 = ["curr_prn","modified_by","modified_dt","ip_address"];
          const mem_valuess1 = [total ,created_by, datetime,ip_address];
          const mem_whereColumnss1 = ["loan_id","group_code"];
          const mem_whereValuess1 = [loanId, groupCode];
          const mem_flags1 = 1;
          await saveRecord(mem_tables1,mem_columnss1,mem_valuess1,mem_whereColumnss1,mem_whereValuess1,mem_flags1); 
    }
    return res.send({
      success: true,
      msg: "SHG Disbursement Accepted Successfully"
    });
  }catch(error){
    console.error("Error in while accept shg disbursement:", error);
    return res.send({
      success: false,
      msg: "Internal server error",
      errorCode: "SERVER_ERROR",
    });
  }
});

// REJECT DISBURSEMENT
// loanRouter.post("/reject_pacs_disbursement", async (req, res) => {
//   try{
//    const { ccb_loan_id,created_by,ip_address,reject_remarks,member_dt } = req.body;
//    let datetime = new Date().toISOString().slice(0, 19).replace('T', ' ');
   
//   if (member_dt && member_dt.length > 0) {
//     // Loop & update each member
//     for (let mem of member_dt) {
       
//       const mem_table_trans = "bdccb.td_loan_member_trans";
//       const mem_columns_trans = ["approval_status","rejected_by","rejected_dt","rejected_ip_address","reject_remarks"];
//       const mem_values_trans = ["R",created_by, datetime,ip_address,reject_remarks];
//       const mem_whereColumns_trans = ["loan_id","ccb_loan_id","trans_id"];
//       const mem_whereValues_trans = [mem.loan_id,ccb_loan_id,mem.trans_id];
//       const mem_flag_trans = 1;
//       await saveRecord(mem_table_trans,mem_columns_trans,mem_values_trans,mem_whereColumns_trans,mem_whereValues_trans,mem_flag_trans);
//       }
//   return res.send({
//   success: true,
//   msg: "Disbursement rejected Successfully",
//   });
//   }else{
//    return res.send({
//    success: true,
//    msg: "Member details not found for reject",
//    data: []
//    })
//   }
//   } catch (error) {
//     console.error("Error in while reject pacs disbursement:", error);
//     return res.send({
//     success: false,
//     msg: "Internal server error",
//     errorCode: "SERVER_ERROR"
//     });
//     }
// });

loanRouter.post("/reject_pacs_disbursement", async (req, res) => {
  try{
   const { loan_id, trans_id, group_code, member_reject, created_by, ip_address, reject_remarks } = req.body;
  //  console.log(req.body,'delete');
   

     if (!member_reject || member_reject.length === 0) {
      return res.send({
        success: true,
        msg: "No member data found"
      });
    }
  
    let loan_ids = Array.isArray(loan_id) ? loan_id : loan_id.split(',').map(x => x.trim());
  let trans_ids = Array.isArray(trans_id) ? trans_id : trans_id.split(',').map(x => x.trim());
  let group_codes = Array.isArray(group_code) ? group_code : group_code.split(',').map(x => x.trim());

   let datetime = new Date().toISOString().slice(0, 19).replace('T', ' ');
   
  if (member_reject && member_reject.length > 0) {
    // Loop & update each member
    for (let mem of member_reject) {
 
        // delete from member trans
      await deleteRecord(
        "bdccb.td_loan_member_trans",
        ["loan_id","trans_id","trans_type"],
        [mem.loan_id, mem.trans_id,'D']
      );

      // delete from member
      await deleteRecord(
        "bdccb.td_loan_member",
        ["loan_id","member_code"],
        [mem.loan_id, mem.member_id]
      );
    }
  for (let i = 0; i < loan_ids.length; i++) {

      // delete from loan transactions
      await deleteRecord(
        "bdccb.td_loan_transactions",
        ["loan_id","trans_id","trans_type"],
        [loan_ids[i], trans_ids[i],'D']
      );

      // delete from loan
      await deleteRecord(
        "bdccb.td_loan",
        ["loan_id","group_code"],
        [loan_ids[i], group_codes[i]]
      );
    }

    return res.send({
      success: true,
      msg: "Disbursement Rejected Successfully"
    });
  }else{
   return res.send({
   success: true,
   msg: "Member details not found for reject",
   data: []
   })
  }
  } catch (error) {
    console.error("Error in while reject pacs disbursement:", error);
    return res.send({
    success: false,
    msg: "Internal server error",
    errorCode: "SERVER_ERROR"
    });
    }
});

// REJECT DISBURSEMENT this is not used
// loanRouter.post("/reject_disbursement", async (req, res) => {
//   try{
//   const {group_code, trans_id, loan_id, loan_acc_no, created_by, ip_address, reject_remarks} = req.body;
//   let datetime = new Date().toISOString().slice(0, 19).replace('T', ' ');

//   /* ================= GET CURRENT PRINCIPAL (CCB LEVEL) ================= */
//   const get_prn = await db_Select(
//       "curr_prn",
//       "bdccb.td_loan_transactions",
//       `trans_id = '${trans_id}' AND loan_id = '${loan_id}'`
//     );

//     if (!get_prn || get_prn.suc !== 1 || get_prn.msg.length === 0) {
//       return res.send({ success: false, msg: "Loan transaction not found" });
//     }

//     let old_curr_prn = Number(get_prn.msg[0].curr_prn);

//    /* ================= GET MEMBER LOAN IDS USING ccb_loan_id ================= */

//    const member_loans  = await db_Select(
//       "loan_id",
//       "bdccb.td_loan_member",
//       `ccb_loan_id = '${loan_id}' AND group_code = '${group_code}'`
//     );

//    if (!member_loans || member_loans.msg.length === 0) {
//       return res.send({ success: false, msg: "No member loan found" });
//     }

//     let total_reject_amt = 0;

//     // ========== PROCESS EACH MEMBER LOAN ========== //
//      for (let mem of member_loans.msg) {
//       let member_loan_id = mem.loan_id;

//        // Get member transaction data
//       const member_trans = await db_Select(
//         "*",
//         "bdccb.td_loan_member_trans",
//         `loan_id = '${member_loan_id}'`
//       );

//        for (let row of member_trans.msg) {
//          total_reject_amt += Number(row.dr_amt);

//           // Insert into reject table
//          const cleanRow = Object.fromEntries(
//           Object.entries(row).filter(([key]) => isNaN(key))
//           );

//           const rejectRow = {
//           ...cleanRow,
//           rejected_by: created_by,
//           rejected_dt: datetime,
//           reject_ip: ip_address,
//           reject_remarks: reject_remarks
//           };

//         await saveRecord(
//           "bdccb.td_loan_member_trans_reject",
//           Object.keys(rejectRow),
//           Object.values(rejectRow)
//         );
//       }
//        // Delete from member trans
//       await deleteRecord(
//         "bdccb.td_loan_member_trans",
//         ["loan_id"],
//         [member_loan_id]
//       );

//       // Delete from member
//       await deleteRecord(
//         "bdccb.td_loan_member",
//         ["loan_id","group_code"],
//         [member_loan_id,group_code]
//       );
//      }

//     // ================= CALCULATE NEW PRINCIPAL ================= //
//      let new_curr_prn = old_curr_prn - total_reject_amt;

//     if (new_curr_prn < 0) new_curr_prn = 0;
    
//     // ========== UPDATE CCB TABLES ============ //
//       await saveRecord(
//       "bdccb.td_loan_transactions",
//       ["dr_amt","curr_prn", "modified_by", "modified_dt", "ip_address"],
//       [new_curr_prn,new_curr_prn, created_by, datetime,ip_address],
//       ["trans_id", "loan_id"],
//       [trans_id, loan_id],
//       1
//     );
    
//      await saveRecord(
//       "bdccb.td_loan",
//       ["disb_amt","curr_prn", "modified_by", "modified_dt", "ip_address"],
//       [new_curr_prn,new_curr_prn, created_by, datetime, ip_address],
//       ["loan_id", "loan_acc_no"],
//       [loan_id, loan_acc_no],
//       1
//     );

//        return res.send({
//       success: true,
//       msg: "Disbursement rejected successfully",
//     });

//   }catch (error) {
//     console.error("Error in while reject disbursement:", error);
//     return res.send({
//       success: false,
//       msg: "Internal server error",
//       errorCode: "SERVER_ERROR",
//     });
//   }
// });

// FETCH TRANSACTION DETAILS
// loanRouter.post("/fetch_trans_dtls", async (req, res) => {
//   try{
//    const {loan_id, tenant_id, branch_code} = req.body;

//    var select = "a.loan_id,a.trans_id,b.disb_amt,TO_CHAR(a.trans_dt, 'YYYY-MM-DD') AS trans_dt,a.trans_type,a.dr_amt,a.cr_amt,a.curr_prn,CASE WHEN a.approval_status = 'A' THEN 'Approved' ELSE 'Unapproved' END AS approval_status",
//    table_name = "bdccb.td_loan_member_trans a LEFT JOIN bdccb.td_loan_member b ON a.loan_id = b.loan_id",
//    whr = `a.loan_id = '${loan_id}' AND a.tenant_id = '${tenant_id}' AND a.branch_id = '${branch_code}' AND a.trans_type = 'D'`,
//    order = null;
//    var fetch_trans_dtls = await db_Select(select,table_name,whr,order);

//    if(fetch_trans_dtls.suc > 0 && fetch_trans_dtls.msg.length > 0){
//     return res.send({
//     success: true,
//     msg: "Fetch unapprove group disbursement details",
//     data: fetch_trans_dtls.msg,
//     });
//    }else{
//     return res.send({
//     success: true,
//     msg: "No unapproved transaction details are available for this member",
//     data: [],
//     });
//    }
//   }catch (error) {
//     console.error("Error in while fetch transaction details:", error);
//     return res.send({
//       success: false,
//       msg: "Internal server error",
//       errorCode: "SERVER_ERROR",
//     });
//   }
// });

//FETCH MAXIMUM BALANCE ON A PARTICULAR BRANCH //
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

// if (loan_to === "S") {
      //   const first = show_loan_dtls.msg[0];

      //   const response = 
      //   [
      //     {
      //     tenant_id: first.tenant_id,
      //     branch_id: first.branch_id,
      //     loan_to: first.loan_to,
      //     period: first.period,
      //     curr_roi: first.curr_roi,
      //     penal_roi: first.penal_roi,
      //     disb_dt: first.disb_dt,
      //     created_by: first.created_by,
      //     ip_address: first.ip_address,

      //     loanee_dtls: show_loan_dtls.msg.map((row) => ({
      //       loan_acc_no: row.loan_acc_no,
      //       branch_shg_id: row.branch_shg_id,
      //       group_name: row.loan_to_name,
      //       tot_memb: row.tot_memb,
      //       disb_amt: row.disb_amt,
      //       loan_id: row.loan_id,
      //       tran_id: row.trans_id,
      //     })),
      //   },
      // ];

      //   return res.send({
      //     success: true,
      //     msg: `Fetch ${approval_status == "A" ? "Approved" : "Unapproved"} disbursed Loan Details`,
      //     data: response,
      //   });
      // }

// loanRouter.post("/show_loan_status", async (req, res) => {
//   try {
//     const { branch_id, approval_status, loan_to } = req.body;
//     //  console.log(req.body,'show');

//     var select =
//         loan_to == "P"
//           ? `DISTINCT a.ccb_loan_id loan_id,a.tenant_id,a.branch_id,a.loan_acc_no,a.loan_to,a.branch_shg_id,c.branch_name AS loan_to_name,a.period,a.curr_roi,a.penal_roi,TO_CHAR(a.disb_dt, 'YYYY-MM-DD') AS disb_dt,SUM(a.disb_amt) disb_amt,a.period_mode,TO_CHAR(a.rep_start_dt, 'YYYY-MM-DD') AS rep_start_dt,TO_CHAR(a.rep_end_dt, 'YYYY-MM-DD') AS rep_end_dt,a.sanction_no,TO_CHAR(a.sanction_dt, 'YYYY-MM-DD') AS sanction_dt,a.prn_amt,a.intt_amt,a.ovd_prn_amt,a.ovd_intt_amt,a.tot_grp,b.trans_type,b.approval_status,a.created_by,a.created_at,b.approved_by approved_id,e.user_name approved_by,b.approved_dt,a.ip_address`
//           : `a.ccb_loan_id loan_id,TO_CHAR(b.trans_date, 'YYYY-MM-DD') AS trans_dt,b.trans_id AS tran_id,a.tenant_id,a.branch_id,a.loan_acc_no,a.loan_to,a.branch_shg_id,d.group_name AS loan_to_name,a.period,a.curr_roi,a.penal_roi,TO_CHAR(a.disb_dt, 'YYYY-MM-DD') AS disb_dt,a.disb_amt,a.period_mode,TO_CHAR(a.rep_start_dt, 'YYYY-MM-DD') AS rep_start_dt,TO_CHAR(a.rep_end_dt, 'YYYY-MM-DD') AS rep_end_dt,a.sanction_no,TO_CHAR(a.sanction_dt, 'YYYY-MM-DD') AS sanction_dt,a.prn_amt,a.intt_amt,a.ovd_prn_amt,a.ovd_intt_amt,a.tot_grp,a.tot_memb,b.trans_type,b.approval_status,a.created_by,a.created_at,b.approved_by approved_id,e.user_name approved_by,b.approved_dt,a.ip_address`,
//       table_name =
//         "bdccb.td_loan_member a LEFT JOIN bdccb.td_loan_member_trans b ON a.tenant_id = b.tenant_id AND a.loan_id = b.loan_id LEFT JOIN public.md_branch c ON a.branch_id = c.branch_id LEFT JOIN bdccb.md_group d ON a.branch_shg_id = d.group_code LEFT JOIN bdccb.md_user e ON b.approved_by = e.user_id",
//       whr = `a.branch_id = '${branch_id}' AND b.approval_status = '${approval_status}' AND a.loan_to = '${loan_to}' AND b.trans_type = 'D' GROUP BY a.ccb_loan_id,a.tenant_id,a.branch_id,a.loan_acc_no,a.loan_to,a.branch_shg_id,c.branch_name,a.period,a.curr_roi,a.penal_roi,a.disb_dt,a.period_mode,a.rep_start_dt,a.rep_end_dt,a.sanction_no,a.sanction_dt,a.prn_amt,a.intt_amt,a.ovd_prn_amt,a.ovd_intt_amt,a.tot_grp,b.trans_type,b.approval_status,a.created_by,a.created_at,b.approved_by,e.user_name,b.approved_dt,a.ip_address`,
//       order = `a.ccb_loan_id`;
//     var show_loan_dtls = await db_Select(select, table_name, whr, order);

//     if (!(show_loan_dtls.suc === 1 && show_loan_dtls.msg.length > 0)) {
//       return res.send({
//         success: true,
//         msg: `Unable to fetch ${approval_status == "A" ? "Approved" : "Unapproved"} disbursed loan details`,
//         data: [],
//       });
//     }

//       /* ---------------- MEMBER QUERY LOOP ---------------- */

//        let finalData = [];

//         for (let loan of show_loan_dtls.msg) {
//       // Member select
//       let mem_select = "a.loan_id AS mem_loan_id,b.trans_id AS tran_id,a.group_code,c.group_name,a.member_code AS member_id,d.member_name,a.disb_amt AS disburse_amt,d.member_account_no AS sb_acc_no",
//       mem_table = "bdccb.td_loan_member a LEFT JOIN bdccb.td_loan_member_trans b ON a.loan_id = b.loan_id AND a.ccb_loan_id = b.ccb_loan_id AND a.tenant_id = b.tenant_id AND a.branch_id = b.branch_id LEFT JOIN bdccb.md_group c ON a.group_code = c.group_code LEFT JOIN bdccb.md_member d ON a.group_code = d.group_code AND a.member_code = d.member_code",
//       mem_whr = `a.tenant_id = '${loan.tenant_id}' AND a.ccb_loan_id = '${loan.loan_id}'`;
//       let member_dtls = await db_Select(mem_select,mem_table,mem_whr,null);

//       loan.members = member_dtls.suc === 1 ? member_dtls.msg : [];

//       finalData.push(loan);
//     }

//      return res.send({
//       success: true,
//       msg: `Fetch ${approval_status == "A" ? "Approved" : "Unapproved"} disbursed Loan Details`,
//       data: finalData,
//     });

//     // if (show_loan_dtls.suc === 1 && show_loan_dtls.msg.length > 0) {
//     //   return res.send({
//     //     success: true,
//     //     msg: `Fetch ${approval_status == "A" ? "Approved" : "Unapproved"} disbursed Loan Details`,
//     //     data: show_loan_dtls.msg,
//     //   });
//     // } else {
//     //   return res.send({
//     //     success: true,
//     //     msg: `Unable to fetch ${approval_status == "A" ? "Approved" : "Unapproved"} disbursed loan details`,
//     //     data: [],
//     //   });
//     // }
//   } catch (error) {
//     console.error("Error in while fetch loan status:", error);
//     return res.send({
//       success: false,
//       msg: "Internal server error",
//       errorCode: "SERVER_ERROR",
//     });
//   }
// });

// loanRouter.post("/show_loan_status", async (req, res) => {
//   try {
//     const { branch_id, approval_status, loan_to, from_dt, to_dt } = req.body;
//     //  console.log(req.body,'show');

//     var select =
//         loan_to == "P"
//           ? `DISTINCT ON (a.ccb_loan_id, a.group_code)
// a.ccb_loan_id loan_id,a.tenant_id,a.branch_id,a.loan_acc_no,f.group_name, a.group_code,a.loan_to,a.branch_shg_id,c.branch_name AS loan_to_name,a.period,a.curr_roi,a.penal_roi,TO_CHAR(a.disb_dt, 'YYYY-MM-DD') AS disb_dt,SUM(a.disb_amt) OVER (PARTITION BY a.ccb_loan_id, a.group_code) AS disb_amt,a.period_mode,TO_CHAR(a.rep_start_dt, 'YYYY-MM-DD') AS rep_start_dt,TO_CHAR(a.rep_end_dt, 'YYYY-MM-DD') AS rep_end_dt,a.sanction_no,TO_CHAR(a.sanction_dt, 'YYYY-MM-DD') AS sanction_dt,a.prn_amt,a.intt_amt,a.ovd_prn_amt,a.ovd_intt_amt,a.tot_grp,b.trans_type,b.approval_status,a.created_by,a.created_at,b.approved_by approved_id,e.user_name approved_by,b.approved_dt,a.ip_address,b.reject_remarks` : 
// `DISTINCT ON (a.loan_acc_no)
// STRING_AGG(a.loan_id::text, ', ') OVER (PARTITION BY a.loan_acc_no) AS loan_id,a.tenant_id,a.branch_id,a.loan_acc_no,grp.group_name,STRING_AGG(a.group_code::text, ', ') OVER (PARTITION BY a.loan_acc_no) AS group_code,a.loan_to,a.branch_shg_id,c.branch_name AS loan_to_name,a.period,a.curr_roi,a.penal_roi,TO_CHAR(a.disb_dt, 'YYYY-MM-DD') AS disb_dt,SUM(a.disb_amt) OVER (PARTITION BY a.loan_acc_no) AS disb_amt,a.pay_mode,TO_CHAR(a.rep_start_dt, 'YYYY-MM-DD') AS rep_start_dt,TO_CHAR(a.rep_end_dt, 'YYYY-MM-DD') AS rep_end_dt,a.sanction_no,TO_CHAR(a.sanction_dt, 'YYYY-MM-DD') AS sanction_dt,a.curr_prn prn_amt,a.curr_intt intt_amt,a.ovd_prn ovd_prn_amt,a.ovd_intt ovd_intt_amt,a.tot_grp,b.trans_type,b.approval_status,a.created_by AS created_id,e.user_name created_by,a.created_dt AS created_date,a.ip_address,STRING_AGG(b.trans_id::text, ', ') OVER (PARTITION BY a.loan_acc_no) AS trans_id`,
// table_name = loan_to == "P"
//           ?
//         `bdccb.td_loan_member a LEFT JOIN bdccb.td_loan_member_trans b ON a.tenant_id = b.tenant_id AND a.ccb_loan_id = b.ccb_loan_id AND a.branch_id = b.branch_id AND a.loan_id = b.loan_id LEFT JOIN public.md_branch c ON a.branch_shg_id = c.branch_id LEFT JOIN bdccb.md_user e ON b.approved_by = e.user_id LEFT JOIN bdccb.md_group f ON a.group_code = f.group_code` : 
//         `bdccb.td_loan a 
//            LEFT JOIN (
//               SELECT loan_acc_no,
//                      STRING_AGG(DISTINCT f.group_name, ', ') AS group_name
//               FROM bdccb.td_loan tl
//               LEFT JOIN bdccb.md_group f ON tl.group_code = f.group_code
//               GROUP BY loan_acc_no
//            ) grp ON a.loan_acc_no = grp.loan_acc_no
//            LEFT JOIN bdccb.td_loan_transactions b 
//            ON a.tenant_id = b.tenant_id 
//            AND a.loan_id = b.loan_id 
//            AND a.branch_shg_id = b.branch_shg_id 
//            LEFT JOIN public.md_branch c ON a.branch_shg_id = c.branch_id 
//            LEFT JOIN bdccb.md_user e ON a.created_by = e.user_id`,
//       whr = `a.branch_id = '${branch_id}' AND b.approval_status = '${approval_status}' AND a.loan_to = '${loan_to}' AND b.trans_type = 'D'`;
//       if (from_dt && to_dt) {
//          whr += ` AND b.trans_dt::date BETWEEN '${from_dt}' AND '${to_dt}'`;
//       }
//       order = loan_to == "P" ? `a.ccb_loan_id, a.group_code,a.disb_dt DESC` : `a.loan_acc_no, a.disb_dt DESC`;
//     var show_loan_dtls = await db_Select(select, table_name, whr, order);

//     if (!(show_loan_dtls.suc === 1 && show_loan_dtls.msg.length > 0)) {
//       return res.send({
//         success: true,
//         msg: `Unable to fetch ${approval_status == "A" ? "Approved" : "Unapproved"} disbursed loan details`,
//         data: [],
//       });
//     }

//       /* ---------------- MEMBER QUERY LOOP ---------------- */

//        let finalData = [];

//         for (let loan of show_loan_dtls.msg) {
//           console.log(loan,'loan');
          
//       // Member select
//       let mem_select = "DISTINCT ON (a.member_code, a.group_code)a.loan_id AS mem_loan_id,b.trans_id AS tran_id,a.group_code,c.group_name,a.member_code AS member_id,d.member_name,a.disb_amt AS disburse_amt,c.pacs_id,d.member_account_no AS sb_acc_no",
//       mem_table = "bdccb.td_loan_member a LEFT JOIN bdccb.td_loan_member_trans b ON a.loan_id = b.loan_id AND a.ccb_loan_id = b.ccb_loan_id AND a.tenant_id = b.tenant_id AND a.branch_id = b.branch_id LEFT JOIN bdccb.md_group c ON a.group_code = c.group_code LEFT JOIN bdccb.md_member d ON a.group_code = d.group_code AND a.member_code = d.member_code",
//       mem_whr = loan.loan_to == 'P' ? `a.tenant_id = '${loan.tenant_id}' AND a.ccb_loan_id = '${loan.loan_id}' AND a.group_code = '${loan.group_code}'` : `a.tenant_id = '${loan.tenant_id}' AND a.loan_acc_no = '${loan.loan_acc_no}'`;
//       mem_order = `a.member_code,a.group_code,b.trans_id desc`
//       let member_dtls = await db_Select(mem_select,mem_table,mem_whr,mem_order);
//       console.log(member_dtls);
      

//       loan.members = member_dtls.suc === 1 ? member_dtls.msg : [];

//       finalData.push(loan);
//     }

//      return res.send({
//       success: true,
//       msg: `Fetch ${approval_status == "A" ? "Approved" : "Unapproved"} disbursed Loan Details`,
//       data: finalData,
//     });
//   } catch (error) {
//     console.error("Error in while fetch loan status:", error);
//     return res.send({
//       success: false,
//       msg: "Internal server error",
//       errorCode: "SERVER_ERROR",
//     });
//   }
// });

//comment off 16.05.2026//
// loanRouter.post("/show_loan_status", async (req, res) => {
//   try {
//     const { branch_id, approval_status, loan_to, from_dt, to_dt, branch_type } = req.body;
//     //  console.log(req.body,'show');

// if(branch_type == 'B'){
//     var select =
//         loan_to == "P"
//           ? `DISTINCT ON (a.ccb_loan_id, a.group_code)
// a.ccb_loan_id loan_id,a.tenant_id,a.branch_id,a.loan_acc_no,f.group_name, a.group_code,a.loan_to,a.branch_shg_id,c.branch_name AS loan_to_name,a.period,a.curr_roi,a.penal_roi,TO_CHAR(a.disb_dt, 'YYYY-MM-DD') AS disb_dt,SUM(a.disb_amt) OVER (PARTITION BY a.ccb_loan_id, a.group_code) AS disb_amt,a.period_mode,TO_CHAR(a.rep_start_dt, 'YYYY-MM-DD') AS rep_start_dt,TO_CHAR(a.rep_end_dt, 'YYYY-MM-DD') AS rep_end_dt,a.sanction_no,TO_CHAR(a.sanction_dt, 'YYYY-MM-DD') AS sanction_dt,a.prn_amt,a.intt_amt,a.ovd_prn_amt,a.ovd_intt_amt,a.tot_grp,b.trans_type,b.approval_status,a.created_by,a.created_at,b.approved_by approved_id,e.user_name approved_by,b.approved_dt,a.ip_address,b.reject_remarks` : 
// `DISTINCT ON (a.group_code)
//            a.loan_id,a.tenant_id,a.branch_id,a.loan_acc_no,grp.group_name,a.group_code,a.loan_to,a.branch_shg_id,c.branch_name AS loan_to_name,a.period,a.curr_roi,a.penal_roi,TO_CHAR(a.disb_dt, 'YYYY-MM-DD') AS disb_dt,SUM(a.disb_amt) OVER (PARTITION BY a.group_code) AS disb_amt,a.pay_mode,TO_CHAR(a.rep_start_dt, 'YYYY-MM-DD') AS rep_start_dt,TO_CHAR(a.rep_end_dt, 'YYYY-MM-DD') AS rep_end_dt,a.sanction_no,TO_CHAR(a.sanction_dt, 'YYYY-MM-DD') AS sanction_dt,a.curr_prn prn_amt,a.curr_intt intt_amt,a.ovd_prn ovd_prn_amt,a.ovd_intt ovd_intt_amt,a.tot_grp,b.trans_type,b.approval_status,a.created_by AS created_id,e.user_name created_by,a.created_dt AS created_date,a.ip_address,STRING_AGG(b.trans_id::text, ', ') OVER (PARTITION BY a.group_code) AS trans_id`,
// table_name = loan_to == "P"
//           ?
//         `bdccb.td_loan_member a LEFT JOIN bdccb.td_loan_member_trans b ON a.tenant_id = b.tenant_id AND a.ccb_loan_id = b.ccb_loan_id AND a.branch_id = b.branch_id AND a.loan_id = b.loan_id LEFT JOIN public.md_branch c ON a.branch_shg_id = c.branch_id LEFT JOIN bdccb.md_user e ON b.approved_by = e.user_id LEFT JOIN bdccb.md_group f ON a.group_code = f.group_code` : 
//         `bdccb.td_loan a 
//            LEFT JOIN (
//               SELECT tl.group_code,
//                      STRING_AGG(DISTINCT f.group_name, ', ') AS group_name
//               FROM bdccb.td_loan tl
//               LEFT JOIN bdccb.md_group f ON tl.group_code = f.group_code
//               GROUP BY tl.group_code
//            ) grp ON a.group_code = grp.group_code
//            LEFT JOIN bdccb.td_loan_transactions b 
//            ON a.tenant_id = b.tenant_id 
//            AND a.loan_id = b.loan_id 
//            AND a.branch_shg_id = b.branch_shg_id 
//            LEFT JOIN public.md_branch c ON a.branch_shg_id = c.branch_id 
//            LEFT JOIN bdccb.md_user e ON a.created_by = e.user_id`,
//       whr = `a.branch_id = '${branch_id}' AND b.approval_status = '${approval_status}' AND a.loan_to = '${loan_to}' AND b.trans_type = 'D' AND a.fund_type = 'B'`;
//       if (from_dt && to_dt) {
//          whr += loan_to == "P" ? `AND b.trans_date::date BETWEEN '${from_dt}' AND '${to_dt}'` : `AND b.trans_dt::date BETWEEN '${from_dt}' AND '${to_dt}'`;
//       }
//       order = loan_to == "P" ? `a.ccb_loan_id, a.group_code,a.disb_dt DESC` : `a.group_code, a.disb_dt DESC`;
//     }else{

//       let branchCheck = await db_Select(
//   "branch_id, branch_type",
//   "public.md_branch",
//   `branch_id = '${branch_id}'`,
//   null
// );

// let branch_condition = '';

// if (branchCheck.suc === 1 && branchCheck.msg.length > 0) {
//   let type = branchCheck.msg[0].branch_type;

//   if (type === 'B') {
//     branch_condition = `a.branch_id = '${branch_id}'`;
//   } else if (type === 'P') {
//     branch_condition = `a.branch_shg_id = '${branch_id}'`;
//   } else {
//     return res.send({
//       success: false,
//       msg: "Invalid branch type"
//     });
//   }
// } else {
//   return res.send({
//     success: false,
//     msg: "Branch not found"
//   });
// }

//       var select =
//         loan_to == "P"
//           ? `DISTINCT ON (a.ccb_loan_id, a.group_code)
// a.ccb_loan_id loan_id,a.tenant_id,a.branch_id,a.loan_acc_no,f.group_name, a.group_code,a.loan_to,a.branch_shg_id,c.branch_name AS loan_to_name,a.period,a.curr_roi,a.penal_roi,TO_CHAR(a.disb_dt, 'YYYY-MM-DD') AS disb_dt,SUM(a.disb_amt) OVER (PARTITION BY a.ccb_loan_id, a.group_code) AS disb_amt,a.period_mode,TO_CHAR(a.rep_start_dt, 'YYYY-MM-DD') AS rep_start_dt,TO_CHAR(a.rep_end_dt, 'YYYY-MM-DD') AS rep_end_dt,a.sanction_no,TO_CHAR(a.sanction_dt, 'YYYY-MM-DD') AS sanction_dt,a.prn_amt,a.intt_amt,a.ovd_prn_amt,a.ovd_intt_amt,a.tot_grp,b.trans_type,b.approval_status,a.created_by,a.created_at,b.approved_by approved_id,e.user_name approved_by,b.approved_dt,a.ip_address,b.reject_remarks` : 
// `DISTINCT ON (a.group_code)
//            a.loan_id,a.tenant_id,a.branch_id,a.loan_acc_no,grp.group_name,a.group_code,a.loan_to,a.branch_shg_id,c.branch_name AS loan_to_name,a.period,a.curr_roi,a.penal_roi,TO_CHAR(a.disb_dt, 'YYYY-MM-DD') AS disb_dt,SUM(a.disb_amt) OVER (PARTITION BY a.group_code) AS disb_amt,a.pay_mode,TO_CHAR(a.rep_start_dt, 'YYYY-MM-DD') AS rep_start_dt,TO_CHAR(a.rep_end_dt, 'YYYY-MM-DD') AS rep_end_dt,a.sanction_no,TO_CHAR(a.sanction_dt, 'YYYY-MM-DD') AS sanction_dt,a.curr_prn prn_amt,a.curr_intt intt_amt,a.ovd_prn ovd_prn_amt,a.ovd_intt ovd_intt_amt,a.tot_grp,b.trans_type,b.approval_status,a.created_by AS created_id,e.user_name created_by,a.created_dt AS created_date,a.ip_address,STRING_AGG(b.trans_id::text, ', ') OVER (PARTITION BY a.group_code) AS trans_id`,
// table_name = loan_to == "P"
//           ?
//         `bdccb.td_loan_member a LEFT JOIN bdccb.td_loan_member_trans b ON a.tenant_id = b.tenant_id AND a.ccb_loan_id = b.ccb_loan_id AND a.branch_id = b.branch_id AND a.loan_id = b.loan_id LEFT JOIN public.md_branch c ON a.branch_shg_id = c.branch_id LEFT JOIN bdccb.md_user e ON b.approved_by = e.user_id LEFT JOIN bdccb.md_group f ON a.group_code = f.group_code` : 
//         `bdccb.td_loan a 
//            LEFT JOIN (
//               SELECT tl.group_code,
//                      STRING_AGG(DISTINCT f.group_name, ', ') AS group_name
//               FROM bdccb.td_loan tl
//               LEFT JOIN bdccb.md_group f ON tl.group_code = f.group_code
//               GROUP BY tl.group_code
//            ) grp ON a.group_code = grp.group_code
//            LEFT JOIN bdccb.td_loan_transactions b 
//            ON a.tenant_id = b.tenant_id 
//            AND a.loan_id = b.loan_id 
//            AND a.branch_shg_id = b.branch_shg_id 
//            LEFT JOIN public.md_branch c ON a.branch_shg_id = c.branch_id 
//            LEFT JOIN bdccb.md_user e ON a.created_by = e.user_id`,
//       whr = `${branch_condition} AND b.approval_status = '${approval_status}' AND a.loan_to = '${loan_to}' AND b.trans_type = 'D' AND a.fund_type = 'B'`;
//       if (from_dt && to_dt) {
//          whr += loan_to == "P" ? `AND b.trans_date::date BETWEEN '${from_dt}' AND '${to_dt}'` : `AND b.trans_dt::date BETWEEN '${from_dt}' AND '${to_dt}'`;
//       }
//       order = loan_to == "P" ? `a.ccb_loan_id, a.group_code,a.disb_dt DESC` : `a.group_code, a.disb_dt DESC`;
//     }      
//     var show_loan_dtls = await db_Select(select, table_name, whr, order);

//     if (!(show_loan_dtls.suc === 1 && show_loan_dtls.msg.length > 0)) {
//       return res.send({
//         success: true,
//         msg: `Unable to fetch ${approval_status == "A" ? "Approved" : "Unapproved"} disbursed loan details`,
//         data: [],
//       });
//     }

//       /* ---------------- MEMBER QUERY LOOP ---------------- */

//        let finalData = [];

//         for (let loan of show_loan_dtls.msg) {
//           // console.log(loan,'loan');
          
//       // Member select
//       let mem_select = "DISTINCT ON (a.member_code, a.group_code)a.loan_id AS mem_loan_id,b.trans_id AS tran_id,a.group_code,c.group_name,a.member_code AS member_id,d.member_name,a.disb_amt AS disburse_amt,c.pacs_id,c.sb_ac_no AS sb_acc_no,COALESCE(e.balance,0) AS grp_balance",
//       mem_table = "bdccb.td_loan_member a LEFT JOIN bdccb.td_loan_member_trans b ON a.loan_id = b.loan_id AND a.ccb_loan_id = b.ccb_loan_id AND a.tenant_id = b.tenant_id AND a.branch_id = b.branch_id LEFT JOIN bdccb.md_group c ON a.group_code = c.group_code LEFT JOIN bdccb.md_member d ON a.group_code = d.group_code AND a.member_code = d.member_code LEFT JOIN bdccb.td_deposit e ON a.group_code = e.shg_id",
//       mem_whr = loan.loan_to == 'P' ? `a.tenant_id = '${loan.tenant_id}' AND a.ccb_loan_id = '${loan.loan_id}' AND a.group_code = '${loan.group_code}'` : `a.tenant_id = '${loan.tenant_id}' AND a.ccb_loan_id = '${loan.loan_id}' AND a.group_code = '${loan.group_code}'`;
//       mem_order = `a.member_code,a.group_code,b.trans_id desc`
//       let member_dtls = await db_Select(mem_select,mem_table,mem_whr,mem_order);
//       // console.log(member_dtls);
      

//       loan.members = member_dtls.suc === 1 ? member_dtls.msg : [];

//       finalData.push(loan);
//     }

//      return res.send({
//       success: true,
//       msg: `Fetch ${approval_status == "A" ? "Approved" : "Unapproved"} disbursed Loan Details`,
//       data: finalData,
//     });
//   } catch (error) {
//     console.error("Error in while fetch loan status:", error);
//     return res.send({
//       success: false,
//       msg: "Internal server error",
//       errorCode: "SERVER_ERROR",
//     });
//   }
// });

loanRouter.post("/show_loan_status", async (req, res) => {
  try {
    const { branch_id, approval_status, loan_to, from_dt, to_dt, branch_type } = req.body;
    //  console.log(req.body,'show');

if(branch_type == 'B'){
    var select =
        loan_to == "P"
          ? `DISTINCT ON (a.loan_acc_no)
a.loan_id,a.tenant_id,a.branch_id,a.loan_acc_no,a.loan_to,a.branch_shg_id,c.branch_name AS loan_to_name,a.period,a.curr_roi,a.penal_roi,TO_CHAR(a.disb_dt, 'YYYY-MM-DD') AS disb_dt,SUM(a.disb_amt) OVER (PARTITION BY a.loan_acc_no) AS disb_amt,a.period_mode,TO_CHAR(a.rep_start_dt, 'YYYY-MM-DD') AS rep_start_dt,TO_CHAR(a.rep_end_dt, 'YYYY-MM-DD') AS rep_end_dt,a.sanction_no,TO_CHAR(a.sanction_dt, 'YYYY-MM-DD') AS sanction_dt,a.prn_amt,a.intt_amt,a.ovd_prn_amt,a.ovd_intt_amt,a.tot_grp,b.trans_type,b.approval_status,a.created_by,a.created_at,b.approved_by approved_id,e.user_name approved_by,b.approved_dt,a.ip_address,b.reject_remarks` : 
`DISTINCT ON (a.group_code)
           a.loan_id,a.tenant_id,a.branch_id,a.loan_acc_no,grp.group_name,a.group_code,a.loan_to,a.branch_shg_id,c.branch_name AS loan_to_name,a.period,a.curr_roi,a.penal_roi,TO_CHAR(a.disb_dt, 'YYYY-MM-DD') AS disb_dt,SUM(a.disb_amt) OVER (PARTITION BY a.group_code) AS disb_amt,a.pay_mode,TO_CHAR(a.rep_start_dt, 'YYYY-MM-DD') AS rep_start_dt,TO_CHAR(a.rep_end_dt, 'YYYY-MM-DD') AS rep_end_dt,a.sanction_no,TO_CHAR(a.sanction_dt, 'YYYY-MM-DD') AS sanction_dt,a.curr_prn prn_amt,a.curr_intt intt_amt,a.ovd_prn ovd_prn_amt,a.ovd_intt ovd_intt_amt,a.tot_grp,b.trans_type,b.approval_status,a.created_by AS created_id,e.user_name created_by,a.created_dt AS created_date,a.ip_address,STRING_AGG(b.trans_id::text, ', ') OVER (PARTITION BY a.group_code) AS trans_id`,
table_name = loan_to == "P"
          ?
        `bdccb.td_loan a LEFT JOIN bdccb.td_loan_transactions b ON a.tenant_id = b.tenant_id AND a.loan_id = b.loan_id AND a.branch_shg_id = b.branch_shg_id LEFT JOIN public.md_branch c ON a.branch_shg_id = c.branch_id LEFT JOIN bdccb.md_user e ON b.approved_by = e.user_id` : 
        `bdccb.td_loan a 
           LEFT JOIN (
              SELECT tl.group_code,
                     STRING_AGG(DISTINCT f.group_name, ', ') AS group_name
              FROM bdccb.td_loan tl
              LEFT JOIN bdccb.md_group f ON tl.group_code = f.group_code
              GROUP BY tl.group_code
           ) grp ON a.group_code = grp.group_code
           LEFT JOIN bdccb.td_loan_transactions b 
           ON a.tenant_id = b.tenant_id 
           AND a.loan_id = b.loan_id 
           AND a.branch_shg_id = b.branch_shg_id 
           LEFT JOIN public.md_branch c ON a.branch_shg_id = c.branch_id 
           LEFT JOIN bdccb.md_user e ON a.created_by = e.user_id`,
      whr = `a.branch_id = '${branch_id}' AND b.approval_status = '${approval_status}' AND a.loan_to = '${loan_to}' AND b.trans_type = 'D' AND a.fund_type = 'B'`;
      if (from_dt && to_dt) {
         whr += loan_to == "P" ? `AND b.trans_date::date BETWEEN '${from_dt}' AND '${to_dt}'` : `AND b.trans_dt::date BETWEEN '${from_dt}' AND '${to_dt}'`;
      }
      order = loan_to == "P" ? `a.loan_id, a.group_code,a.disb_dt DESC` : `a.group_code, a.disb_dt DESC`;
    }else{

      let branchCheck = await db_Select(
  "branch_id, branch_type",
  "public.md_branch",
  `branch_id = '${branch_id}'`,
  null
);

let branch_condition = '';

if (branchCheck.suc === 1 && branchCheck.msg.length > 0) {
  let type = branchCheck.msg[0].branch_type;

  if (type === 'B') {
    branch_condition = `a.branch_id = '${branch_id}'`;
  } else if (type === 'P') {
    branch_condition = `a.branch_shg_id = '${branch_id}'`;
  } else {
    return res.send({
      success: false,
      msg: "Invalid branch type"
    });
  }
} else {
  return res.send({
    success: false,
    msg: "Branch not found"
  });
}

      var select =
        loan_to == "P"
          ? `DISTINCT ON (a.ccb_loan_id, a.group_code)
a.ccb_loan_id loan_id,a.tenant_id,a.branch_id,a.loan_acc_no,f.group_name, a.group_code,a.loan_to,a.branch_shg_id,c.branch_name AS loan_to_name,a.period,a.curr_roi,a.penal_roi,TO_CHAR(a.disb_dt, 'YYYY-MM-DD') AS disb_dt,SUM(a.disb_amt) OVER (PARTITION BY a.ccb_loan_id, a.group_code) AS disb_amt,a.period_mode,TO_CHAR(a.rep_start_dt, 'YYYY-MM-DD') AS rep_start_dt,TO_CHAR(a.rep_end_dt, 'YYYY-MM-DD') AS rep_end_dt,a.sanction_no,TO_CHAR(a.sanction_dt, 'YYYY-MM-DD') AS sanction_dt,a.prn_amt,a.intt_amt,a.ovd_prn_amt,a.ovd_intt_amt,a.tot_grp,b.trans_type,b.approval_status,a.created_by,a.created_at,b.approved_by approved_id,e.user_name approved_by,b.approved_dt,a.ip_address,b.reject_remarks` : 
`DISTINCT ON (a.group_code)
           a.loan_id,a.tenant_id,a.branch_id,a.loan_acc_no,grp.group_name,a.group_code,a.loan_to,a.branch_shg_id,c.branch_name AS loan_to_name,a.period,a.curr_roi,a.penal_roi,TO_CHAR(a.disb_dt, 'YYYY-MM-DD') AS disb_dt,SUM(a.disb_amt) OVER (PARTITION BY a.group_code) AS disb_amt,a.pay_mode,TO_CHAR(a.rep_start_dt, 'YYYY-MM-DD') AS rep_start_dt,TO_CHAR(a.rep_end_dt, 'YYYY-MM-DD') AS rep_end_dt,a.sanction_no,TO_CHAR(a.sanction_dt, 'YYYY-MM-DD') AS sanction_dt,a.curr_prn prn_amt,a.curr_intt intt_amt,a.ovd_prn ovd_prn_amt,a.ovd_intt ovd_intt_amt,a.tot_grp,b.trans_type,b.approval_status,a.created_by AS created_id,e.user_name created_by,a.created_dt AS created_date,a.ip_address,STRING_AGG(b.trans_id::text, ', ') OVER (PARTITION BY a.group_code) AS trans_id`,
table_name = loan_to == "P"
          ?
        `bdccb.td_loan_member a LEFT JOIN bdccb.td_loan_member_trans b ON a.tenant_id = b.tenant_id AND a.ccb_loan_id = b.ccb_loan_id AND a.branch_id = b.branch_id AND a.loan_id = b.loan_id LEFT JOIN public.md_branch c ON a.branch_shg_id = c.branch_id LEFT JOIN bdccb.md_user e ON b.approved_by = e.user_id LEFT JOIN bdccb.md_group f ON a.group_code = f.group_code` : 
        `bdccb.td_loan a 
           LEFT JOIN (
              SELECT tl.group_code,
                     STRING_AGG(DISTINCT f.group_name, ', ') AS group_name
              FROM bdccb.td_loan tl
              LEFT JOIN bdccb.md_group f ON tl.group_code = f.group_code
              GROUP BY tl.group_code
           ) grp ON a.group_code = grp.group_code
           LEFT JOIN bdccb.td_loan_transactions b 
           ON a.tenant_id = b.tenant_id 
           AND a.loan_id = b.loan_id 
           AND a.branch_shg_id = b.branch_shg_id 
           LEFT JOIN public.md_branch c ON a.branch_shg_id = c.branch_id 
           LEFT JOIN bdccb.md_user e ON a.created_by = e.user_id`,
      whr = `${branch_condition} AND b.approval_status = '${approval_status}' AND a.loan_to = '${loan_to}' AND b.trans_type = 'D' AND a.fund_type = 'B'`;
      if (from_dt && to_dt) {
         whr += loan_to == "P" ? `AND b.trans_date::date BETWEEN '${from_dt}' AND '${to_dt}'` : `AND b.trans_dt::date BETWEEN '${from_dt}' AND '${to_dt}'`;
      }
      order = loan_to == "P" ? `a.ccb_loan_id, a.group_code,a.disb_dt DESC` : `a.group_code, a.disb_dt DESC`;
    }      
    var show_loan_dtls = await db_Select(select, table_name, whr, order);

    if (!(show_loan_dtls.suc === 1 && show_loan_dtls.msg.length > 0)) {
      return res.send({
        success: true,
        msg: `Unable to fetch ${approval_status == "A" ? "Approved" : "Unapproved"} disbursed loan details`,
        data: [],
      });
    }

      /* ---------------- MEMBER QUERY LOOP ---------------- */

       let finalData = [];

        for (let loan of show_loan_dtls.msg) {
          // console.log(loan,'loan');
          
      // Member select
      let mem_select = "DISTINCT ON (a.member_code, a.group_code)a.loan_id AS mem_loan_id,b.trans_id AS tran_id,a.group_code,c.group_name,a.member_code AS member_id,d.member_name,a.disb_amt AS disburse_amt,c.pacs_id,c.sb_ac_no AS sb_acc_no,COALESCE(e.balance,0) AS grp_balance",
      mem_table = "bdccb.td_loan_member a LEFT JOIN bdccb.td_loan_member_trans b ON a.loan_id = b.loan_id AND a.ccb_loan_id = b.ccb_loan_id AND a.tenant_id = b.tenant_id AND a.branch_id = b.branch_id LEFT JOIN bdccb.md_group c ON a.group_code = c.group_code LEFT JOIN bdccb.md_member d ON a.group_code = d.group_code AND a.member_code = d.member_code LEFT JOIN bdccb.td_deposit e ON a.group_code = e.shg_id",
      mem_whr = `a.tenant_id = '${loan.tenant_id}' AND a.ccb_loan_id = '${loan.loan_id}' AND a.group_code = '${loan.group_code}'`;
      mem_order = `a.member_code,a.group_code,b.trans_id desc`
      let member_dtls = await db_Select(mem_select,mem_table,mem_whr,mem_order);
      // console.log(member_dtls);
      

      loan.members = member_dtls.suc === 1 ? member_dtls.msg : [];

      finalData.push(loan);
    }

     return res.send({
      success: true,
      msg: `Fetch ${approval_status == "A" ? "Approved" : "Unapproved"} disbursed Loan Details`,
      data: finalData,
    });
  } catch (error) {
    console.error("Error in while fetch loan status:", error);
    return res.send({
      success: false,
      msg: "Internal server error",
      errorCode: "SERVER_ERROR",
    });
  }
});

// FETCH GROUP MEMBER DETAILS
loanRouter.post("/fetch_group_member_dtls", async (req, res) => {
  try{
   const {branch_shg_id,tenant_id,loan_id} = req.body;
  //  console.log(req.body,'tetete');

   var select = "a.loan_id mem_loan_id,a.group_code,c.group_name,a.member_code member_id,d.member_name,b.trans_id transaction_id",
   table_name = "bdccb.td_loan_member a LEFT JOIN bdccb.td_loan_member_trans b ON a.loan_id = b.loan_id AND a.tenant_id = b.tenant_id and a.branch_id = b.branch_id LEFT JOIN bdccb.md_group c ON a.group_code = c.group_code LEFT JOIN bdccb.md_member d ON a.group_code = d.group_code AND a.member_code = d.member_code",
   whr = `a.branch_id = '${branch_shg_id}' AND a.tenant_id = '${tenant_id}' AND a.ccb_loan_id = '${loan_id}'`,
   order = null;
   var fetch_group_mem = await db_Select(select,table_name,whr,order);
   if (fetch_group_mem.suc === 1 && fetch_group_mem.msg.length > 0) {
    return res.send({
        success: true,
        msg: "fetch group with member details",
        data: fetch_group_mem.msg,
      });
    } else {
      return res.send({
        success: true,
        msg: "Unable to fetch group with member details",
        data: [],
      });
   }
  }catch(error){
    console.error("Error in while fetch group member details:", error);
    return res.send({
      success: false,
      msg: "Internal server error",
      errorCode: "SERVER_ERROR",
    });
  }
})

// FETCH TOTAL MEMBER IN PARTICULAR SHG
loanRouter.post("/fetch_tot_memb", async (req, res) => {
  try {
    const { group_code, tenant_id } = req.body;
    // console.log(req.body, "ftech_memb");

    var select = "COALESCE(COUNT(*),0) AS tot_memb",
      table_name = "bdccb.md_member",
      whr = `group_code = '${group_code}' AND tenant_id = '${tenant_id}'`,
      order = null;
    var fetch_member = await db_Select(select, table_name, whr, order);

    if (fetch_member.suc > 0 && fetch_member.msg.length > 0) {
      return res.send({
        success: true,
        msg: "fetch member details",
        data: fetch_member.msg,
      });
    } else {
      return res.send({
        success: true,
        msg: "Unable to fetch total no of member in particular shg",
        data: [],
      });
    }
  } catch (error) {
    console.error("Error in while fetch member details particular shg:", error);
    return res.send({
      success: false,
      msg: "Internal server error",
      errorCode: "SERVER_ERROR",
    });
  }
});

// SAVE DISBURSEMENT (BRANCH -> SHG / PACS -> SHG)
loanRouter.post("/save_disburse_brn_pacs_shg", async (req, res) => {
  try {
    const {
      tenant_id,
      branch_id,
      loan_to,
      period,
      curr_roi,
      penal_roi,
      disb_dt,
      loanee_dtls,
      created_by,
      ip_address,
    } = req.body;
    // console.log(req.body, "data shg");

    let datetime = new Date().toISOString().slice(0, 19).replace("T", " ");

    let isEdit = loanee_dtls.some((m) => Number(m.loan_id) > 0);

    for (let dt of loanee_dtls) {
      var pay_mode = "Monthly";

      let instl_date = await genDate(disb_dt, period, pay_mode);
      const startDate = instl_date.emtStart;
      const endDate = instl_date.emiEnd;

      let loan_code = await loanCode(branch_id);

      var table = "bdccb.td_loan";
      var columns =
        dt.loan_id > 0
          ? [
              "loan_acc_no",
              "loan_to",
              "branch_shg_id",
              "period",
              "curr_roi",
              "penal_roi",
              "disb_dt",
              "disb_amt",
              "rep_start_dt",
              "rep_end_dt",
              "curr_prn",
              "tot_memb",
              "modified_by",
              "modified_dt",
              "ip_address",
            ]
          : [
              "loan_id",
              "tenant_id",
              "branch_id",
              "loan_acc_no",
              "loan_to",
              "branch_shg_id",
              "period",
              "curr_roi",
              "penal_roi",
              "disb_dt",
              "disb_amt",
              "pay_mode",
              "rep_start_dt",
              "rep_end_dt",
              "curr_prn",
              "curr_intt",
              "ovd_prn",
              "ovd_intt",
              "tot_memb",
              "created_by",
              "created_dt",
              "ip_address",
            ];
      var values =
        dt.loan_id > 0
          ? [
              dt.loan_acc_no || null,
              loan_to,
              dt.branch_shg_id,
              period,
              curr_roi,
              penal_roi,
              disb_dt,
              dt.disb_amt,
              startDate,
              endDate,
              dt.disb_amt,
              dt.tot_memb,
              created_by,
              datetime,
              ip_address,
            ]
          : [
              loan_code,
              tenant_id,
              branch_id,
              dt.loan_acc_no || null,
              loan_to,
              dt.branch_shg_id,
              period,
              curr_roi,
              penal_roi,
              disb_dt,
              dt.disb_amt,
              pay_mode,
              startDate,
              endDate,
              dt.disb_amt,
              0,
              0,
              0,
              dt.tot_memb,
              created_by,
              datetime,
              ip_address,
            ];
      var whereColumns =
        dt.loan_id > 0 ? ["loan_id", "tenant_id", "branch_id"] : [];
      var whereValues =
        dt.loan_id > 0 ? [dt.loan_id, tenant_id, branch_id] : [];
      var flag = dt.loan_id > 0 ? 1 : 0;
      var result_shg = await saveRecord(
        table,
        columns,
        values,
        whereColumns,
        whereValues,
        flag,
      );

      if (!result_shg || result_shg.suc !== 1) {
        return res.send({
          success: true,
          msg: dt.loan_id > 0 ? "Loan edit failed" : "Loan save failed",
          data: [],
        });
      }

      let trans_id = await transaction_id();

      var table = "bdccb.td_loan_transactions";
      var columns =
        dt.loan_id > 0
          ? [
              "trans_dt",
              "loan_to",
              "branch_shg_id",
              "loan_ac_no",
              "dr_amt",
              "curr_prn",
              "modified_by",
              "modified_dt",
              "ip_address",
            ]
          : [
              "trans_dt",
              "trans_id",
              "tenant_id",
              "loan_to",
              "branch_shg_id",
              "loan_id",
              "loan_ac_no",
              "trans_type",
              "dr_amt",
              "cr_amt",
              "curr_prn_recov",
              "curr_intt_recov",
              "ovd_prn_recov",
              "ovd_intt_recov",
              "curr_prn",
              "curr_intt",
              "ovd_prn",
              "ovd_intt",
              "approval_status",
              "created_by",
              "created_dt",
              "ip_address",
            ];
      var values =
        dt.loan_id > 0
          ? [
              disb_dt,
              loan_to,
              dt.branch_shg_id,
              dt.loan_acc_no || null,
              dt.disb_amt,
              dt.disb_amt,
              created_by,
              datetime,
              ip_address,
            ]
          : [
              disb_dt,
              trans_id,
              tenant_id,
              loan_to,
              dt.branch_shg_id,
              loan_code,
              dt.loan_acc_no || null,
              "D",
              dt.disb_amt,
              0,
              0,
              0,
              0,
              0,
              dt.disb_amt,
              0,
              0,
              0,
              "U",
              created_by,
              datetime,
              ip_address,
            ];
      var whereColumns =
        dt.loan_id > 0 ? ["trans_id", "tenant_id", "loan_id"] : [];
      var whereValues =
        dt.loan_id > 0 ? [dt.tran_id, tenant_id, dt.loan_id] : [];
      var flag = dt.loan_id > 0 ? 1 : 0;
      var trans_result = await saveRecord(
        table,
        columns,
        values,
        whereColumns,
        whereValues,
        flag,
      );

      if (!trans_result || trans_result.suc !== 1) {
        return res.send({
          success: true,
          msg:
            trans_result.msg || dt.loan_id > 0
              ? "Failed to edit loan in transaction table"
              : "Failed to save loan in transaction table",
          data: [],
        });
      }
    }
    return res.send({
      success: true,
      msg: isEdit
        ? "Disbursement edit Done Successfully"
        : "Disbursement Done Successfully",
    });
  } catch (error) {
    console.error(
      "Error in while save disbursement from Branch/Pacs to SHG:",
      error,
    );
    return res.send({
      success: false,
      msg: "Internal server error",
      errorCode: "SERVER_ERROR",
    });
  }
});

module.exports = {
  loanRouter,
};
