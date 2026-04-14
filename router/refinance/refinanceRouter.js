const { db_Select, saveRecord, deleteRecord } = require("../../model/pgcommon");
const express = require("express"),
refinanceRouter = express.Router();

// const ref_loanCodes = async (branch_code) => {
//   const select = `COALESCE(
//       MAX(SUBSTRING(ccb_loan_id::TEXT FROM LENGTH('${branch_code}') + 1)::INTEGER),
//       0
//     ) + 1 AS loan_codes`;
//   const res = await db_Select(select, "bdccb.td_loan_member", `branch_id='${branch_code}'`, null);
//   let loan_no = 1;

//   if (res && res.suc === 1 && res.msg && res.msg.length > 0) {
//     loan_no = res.msg[0].loan_codes || 1;
//   }
//   const loan_codes = `${branch_code}${String(loan_no).padStart(4, "0")}`;
//   return loan_codes;
// };

const ref_member_transaction_id = async () => {
    const timestamp = new Date().getTime();
    const newPayId = `${timestamp}`;
    return(newPayId);
};

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

const ref_loanCodes = async (branch_code) => {
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
}

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

//FETCH UNAPPROVE/APPROVE/REJECT RE-FINANCE DISBURSEMENT DATA
refinanceRouter.post("/show_unapprove_refinance", async (req, res) => {
  try {
    const { branch_shg_id, approval_status, from_dt, to_dt } = req.body;
    console.log(req.body,'refinance');

    var select1 = "branch_jurisdiction_id",
    table_name1 = "public.md_branch",
    whr1 = `branch_id = '${branch_shg_id}'`,
    order1 = null;
    var fetch_branch_dt = await db_Select(select1,table_name1,whr1,order1)

    let branch_id = fetch_branch_dt.msg[0].branch_jurisdiction_id;

    var select =`DISTINCT ON (a.ccb_loan_id, a.group_code)
    a.ccb_loan_id loan_id,a.tenant_id,a.branch_id,a.loan_acc_no,f.group_name, a.group_code,a.loan_to,a.branch_shg_id,c.branch_name AS loan_to_name,a.period,a.curr_roi,a.penal_roi,TO_CHAR(a.disb_dt, 'YYYY-MM-DD') AS disb_dt,SUM(a.disb_amt) OVER (PARTITION BY a.ccb_loan_id, a.group_code) AS disb_amt,a.period_mode,TO_CHAR(a.rep_start_dt, 'YYYY-MM-DD') AS rep_start_dt,TO_CHAR(a.rep_end_dt, 'YYYY-MM-DD') AS rep_end_dt,a.sanction_no,TO_CHAR(a.sanction_dt, 'YYYY-MM-DD') AS sanction_dt,a.prn_amt,a.intt_amt,a.ovd_prn_amt,a.ovd_intt_amt,a.tot_grp,b.trans_type,b.approval_status,a.created_by,a.created_at,b.approved_by approved_id,e.user_name approved_by,b.approved_dt,a.ip_address,b.reject_remarks`,
    table_name = `bdccb.td_loan_member a LEFT JOIN bdccb.td_loan_member_trans b ON a.tenant_id = b.tenant_id AND a.ccb_loan_id = b.ccb_loan_id AND a.branch_id = b.branch_id AND a.loan_id = b.loan_id LEFT JOIN public.md_branch c ON a.branch_shg_id = c.branch_id LEFT JOIN bdccb.md_user e ON b.approved_by = e.user_id LEFT JOIN bdccb.md_group f ON a.group_code = f.group_code`,
    whr = `a.branch_id = '${branch_id}' AND a.branch_shg_id = '${branch_shg_id}' AND b.approval_status = '${approval_status}' AND b.trans_type = 'D' AND a.fund_type = 'O'`;
    if (from_dt && to_dt) {
         whr += ` AND b.trans_date::date BETWEEN '${from_dt}' AND '${to_dt}'`;
    }
    order = `a.ccb_loan_id, a.group_code,a.disb_dt DESC`;
    var show_unapprove_data = await db_Select(select, table_name, whr, order);

    if (!(show_unapprove_data.suc === 1 && show_unapprove_data.msg.length > 0)) {
      return res.send({
        success: true,
        msg: `Unable to fetch ${approval_status == "A" ? "Approved" : "Unapproved"} refinance disbursed loan details`,
        data: [],
      });
    }

      /* ---------------- MEMBER QUERY LOOP ---------------- */

       let finalData = [];

        for (let loan of show_unapprove_data.msg) {
          // console.log(loan,'loan');
          
      // Member select
      let mem_select = "DISTINCT ON (a.member_code, a.group_code)a.loan_id AS mem_loan_id,b.trans_id AS tran_id,a.group_code,c.group_name,a.member_code AS member_id,d.member_name,a.disb_amt AS disburse_amt,c.pacs_id,d.member_account_no AS sb_acc_no,b.trans_id",
      mem_table = "bdccb.td_loan_member a LEFT JOIN bdccb.td_loan_member_trans b ON a.loan_id = b.loan_id AND a.ccb_loan_id = b.ccb_loan_id AND a.tenant_id = b.tenant_id AND a.branch_id = b.branch_id LEFT JOIN bdccb.md_group c ON a.group_code = c.group_code LEFT JOIN bdccb.md_member d ON a.group_code = d.group_code AND a.member_code = d.member_code",
      mem_whr = `a.tenant_id = '${loan.tenant_id}' AND a.ccb_loan_id = '${loan.loan_id}' AND a.group_code = '${loan.group_code}' AND a.fund_type = 'O'`;
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

// SAVE RE-FINANCE DATA
refinanceRouter.post("/save_refinance_disburse", async (req, res) => {
    try{
    const {tenant_id,loan_acc_no,loan_to,branch_shg_id,period,curr_roi,penal_roi,disb_dt,tot_grp,sanction_no,sanction_dt,members_refinance,created_by,ip_address,loan_id} = req.body;
    console.log(req.body,'re-finnance');
    

    let datetime = new Date().toISOString().slice(0, 19).replace("T", " ");
    var pay_mode = "Monthly";

    let instl_date = await genDate(disb_dt, period, pay_mode);
    const startDate = instl_date.emtStart;
    const endDate = instl_date.emiEnd;

    var select = "branch_jurisdiction_id",
    table_name = "public.md_branch",
    whr = `branch_id = '${branch_shg_id}'`,
    order = null;
    var fetch_brn_nm = await db_Select(select,table_name,whr,order);

    branch_id = fetch_brn_nm.msg[0].branch_jurisdiction_id;
    console.log(branch_id,'branch_id');

    let ref_loan_codes = await ref_loanCodes(branch_id);

    for(let mem of members_refinance){

    let mem_trans_id = await ref_member_transaction_id();

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

    // ================== td_loan_member ==================
    const table1 = "bdccb.td_loan_member";
    const columns1 = mem.mem_loan_id > 0 ? ["period","curr_roi","penal_roi","disb_dt","disb_amt","rep_start_dt","rep_end_dt","tot_grp","sanction_no","sanction_dt","modified_by","modified_at","ip_address","society_roi","society_penal_roi"] : ["loan_id","ccb_loan_id","tenant_id","branch_id","loan_acc_no","loan_to",
    "branch_shg_id","group_code","member_code","period","curr_roi","penal_roi","disb_dt","disb_amt","period_mode","rep_start_dt","rep_end_dt","prn_amt","ovd_prn_amt","intt_amt","ovd_intt_amt","tot_grp","sanction_no","sanction_dt","created_by","created_at","ip_address","society_roi","society_penal_roi","fund_type"];
    const values1 = mem.mem_loan_id > 0 ? [period, curr_roi, penal_roi, disb_dt, mem.disburse_amt,
    startDate, endDate,tot_grp, sanction_no, sanction_dt,created_by, datetime, ip_address,loan_to == 'P' ? curr_roi : '0',loan_to == 'P' ? penal_roi : '0'] : [loanMemberId, ref_loan_codes, tenant_id, branch_id, loan_acc_no, loan_to,branch_shg_id, mem.group_code, mem.member_id,period, curr_roi, penal_roi, disb_dt, mem.disburse_amt,pay_mode, startDate, endDate,0,0,0,0,tot_grp, sanction_no, sanction_dt,created_by, datetime, ip_address,loan_to == 'P' ? curr_roi : '0',loan_to == 'P' ? penal_roi : '0', 'O'];
    const whereColumns1 = mem.mem_loan_id > 0 ? ["loan_id","ccb_loan_id","tenant_id","group_code","member_code"] : [];
    const whereValues1 = mem.mem_loan_id > 0 ? [mem.mem_loan_id,loan_id,tenant_id,mem.group_code, mem.member_id] : [];
    const flag1 = mem.mem_loan_id > 0 ? 1 : 0;
    await saveRecord(table1, columns1, values1, whereColumns1, whereValues1, flag1);

    // ================== td_loan_member_trans ==================
    const table2 = "bdccb.td_loan_member_trans";
    const columns2 = mem.mem_loan_id > 0 ? ["trans_date","dr_amt","modified_by","modified_dt","ip_address"] : [
    "trans_date","trans_id","loan_id","ccb_loan_id","tenant_id","branch_id","loan_to","branch_shg_id","loan_acc_no","trans_type","dr_amt","cr_amt","curr_prn_recov","curr_intt_recov","ovd_prn_recov","ovd_intt_recov","curr_prn","curr_intt","ovd_prn","ovd_intt","approval_status","created_by","created_dt","ip_address"];
    const values2 = mem.mem_loan_id > 0 ? [disb_dt, mem.disburse_amt,created_by, datetime, ip_address
    ] : [disb_dt, mem_trans_id, loanMemberId, ref_loan_codes, tenant_id, branch_id,loan_to, branch_shg_id, loan_acc_no,'D', mem.disburse_amt, 0,0,0,0,0,0,0,0,0,'U',created_by, datetime, ip_address];
    const whereColumns2 = mem.mem_loan_id > 0 ? ["loan_id","ccb_loan_id","tenant_id"] : [];
    const whereValues2 = mem.mem_loan_id > 0 ? [mem.mem_loan_id,loan_id,tenant_id] : [];
    const flag2 = mem.mem_loan_id > 0 ? 1 : 0;
    await saveRecord(table2, columns2, values2, whereColumns2, whereValues2, flag2);
    }
    return res.send({
    success: true,
    msg: loan_id > 0 ? "Re-finance Disbursement edit Done Successfully"  : "Re-finance Disbursement Done Successfully",
    });
    }catch (error) {
    console.error("Error in while save refinance disbursement:", error);
    return res.send({
      success: false,
      msg: "Internal server error",
      errorCode: "SERVER_ERROR",
    });
  }
});

// APPROVE RE-FINANCE DISBURSEMENT
refinanceRouter.post("/approve_refinance_disburse", async (req, res) => {
    try{
    const {society_acc_no,loan_acc_no,group_code,member_ids,created_by,ip_address} = req.body;
    console.log(req.body,'approve re-finnance');

    let datetime = new Date().toISOString().slice(0, 19).replace('T', ' ');

    let total_disb_amt = 0;

    if (member_ids && member_ids.length > 0) {
          total_disb_amt = member_ids.reduce((sum, mem) => {
          return sum + parseFloat(mem.disb_amt || 0);
    }, 0);
    }

    let transac_id = await transaction_id();

    let transacs_id = await transactions_id();

    // fetch data from td_loan_member
    var select = "a.ccb_loan_id AS loan_id,a.tenant_id,a.branch_id,a.loan_to,a.branch_shg_id,a.group_code,a.period,a.curr_roi,a.penal_roi,TO_CHAR(a.disb_dt, 'YYYY-MM-DD') AS disb_dt,SUM(a.disb_amt) AS disb_amt,a.period_mode,TO_CHAR(a.rep_start_dt, 'YYYY-MM-DD') AS rep_start_dt,TO_CHAR(a.rep_end_dt, 'YYYY-MM-DD') AS rep_end_dt,a.sanction_no,TO_CHAR(a.sanction_dt, 'YYYY-MM-DD') AS sanction_dt,a.fund_type",
    table_name = "bdccb.td_loan_member a",
    whr = `group_code = '${group_code}' GROUP BY a.ccb_loan_id,a.tenant_id,a.branch_id,a.loan_to,a.branch_shg_id,a.group_code,a.period,a.curr_roi,a.penal_roi,a.disb_dt,a.period_mode,a.rep_start_dt,a.rep_end_dt,a.sanction_no,a.sanction_dt,a.fund_type`,
    order = null;
    var fetch_data = await db_Select(select,table_name,whr,order);

    if(!(fetch_data.suc === 1 && fetch_data.msg.length > 0)){
            return res.send({
            success: true,
            msg:"Re-finance Loan data not found in"
          });
    }

    const loan_data = fetch_data.msg[0];

    var table_td = "bdccb.td_loan";
    var columns_td = ["loan_id","tenant_id","branch_id","loan_acc_no","loan_to","branch_shg_id","period","curr_roi","penal_roi","disb_dt","disb_amt","pay_mode","rep_start_dt","rep_end_dt","curr_prn","curr_intt","ovd_prn","ovd_intt","tot_grp","sanction_no","sanction_dt","created_by","created_dt","ip_address","group_code","fund_type"];
    var values_td = [loan_data.loan_id,loan_data.tenant_id,loan_data.branch_id,society_acc_no || null,loan_data.loan_to,loan_data.branch_shg_id,loan_data.period,loan_data.curr_roi,loan_data.penal_roi,loan_data.disb_dt,loan_data.disb_amt,loan_data.period_mode,loan_data.rep_start_dt,loan_data.rep_end_dt,total_disb_amt,0,0,0,0,loan_data.sanction_no,loan_data.sanction_dt,created_by,datetime,ip_address,group_code, 'O'];
    var whereColumns_td = [];
    var whereValues_td = [];
    var flag_td = 0;
    var result_tds = await saveRecord(table_td,columns_td,values_td,whereColumns_td,whereValues_td,flag_td);

    if(result_tds.suc !== 1){
    return res.send({
        success: true,
        msg: "Failed to save re-fiannce data in loan table",
        data : []
    });
    }

    var table_trn = "bdccb.td_loan_transactions";
    var columns_trn = ["trans_dt","trans_id","tenant_id","loan_to","branch_shg_id","loan_id","loan_ac_no",
    "trans_type","dr_amt", "cr_amt","curr_prn_recov","curr_intt_recov","ovd_prn_recov","ovd_intt_recov","curr_prn", "curr_intt","ovd_prn","ovd_intt","approval_status","approved_by","approved_dt","created_by","created_dt","ip_address"];
    var values_trn = [loan_data.disb_dt,transac_id,loan_data.tenant_id,loan_data.loan_to,loan_data.branch_shg_id,loan_data.loan_id,society_acc_no || null,"D",loan_data.disb_amt,0,0,0,0,0,total_disb_amt,0,0,0,"A",created_by,datetime,created_by,datetime,ip_address];
    var whereColumns_trn = [];
    var whereValues_trn = [];
    var flag_trn = 0;
    var trans_results = await saveRecord(table_trn,columns_trn,values_trn,whereColumns_trn,whereValues_trn,flag_trn);

    if(trans_results.suc !== 1){
        return res.send({
        success: true,
        msg: "Failed to save re-finance data in loan transaction table",
        data : []
         });
    }

    // DATA INSERT INTO CCB LEVEL
    var table_td = "bdccb.td_loan_ccb";
    var columns_td = ["loan_id","tenant_id","branch_id","loan_acc_no","loan_to","branch_shg_id","period","curr_roi","penal_roi","disb_dt","disb_amt","pay_mode","rep_start_dt","rep_end_dt","curr_prn","curr_intt","ovd_prn","ovd_intt","tot_grp","sanction_no","sanction_dt","created_by","created_dt","ip_address","group_code","fund_type"];
    var values_td = [loan_data.loan_id,loan_data.tenant_id,loan_data.branch_id,loan_acc_no || null,loan_data.loan_to,loan_data.branch_shg_id,loan_data.period,0,0,loan_data.disb_dt,loan_data.disb_amt,loan_data.period_mode,loan_data.rep_start_dt,loan_data.rep_end_dt,total_disb_amt,0,0,0,0,loan_data.sanction_no,loan_data.sanction_dt,created_by,datetime,ip_address,group_code,'O'];
    var whereColumns_td = [];
    var whereValues_td = [];
    var flag_td = 0;
    var result_td_ccbs = await saveRecord(table_td,columns_td,values_td,whereColumns_td,whereValues_td,flag_td);

    if(result_td_ccbs.suc !== 1){
        return res.send({
        success: true,
        msg: "Failed to save re-finance data in ccb loan table",
        data : []
        });
    }

    var table_trn = "bdccb.td_loan_ccb_trans";
    var columns_trn = ["trans_dt","trans_id","tenant_id","loan_to","branch_shg_id","loan_id","loan_ac_no",
    "trans_type","dr_amt", "cr_amt","curr_prn_recov","curr_intt_recov","ovd_prn_recov","ovd_intt_recov","curr_prn", "curr_intt","ovd_prn","ovd_intt","approval_status","approved_by","approved_dt","created_by","created_dt","ip_address"];
    var values_trn = [loan_data.disb_dt,transacs_id,loan_data.tenant_id,loan_data.loan_to,loan_data.branch_shg_id,loan_data.loan_id,loan_acc_no || null,"D",loan_data.disb_amt,0,0,0,0,0,total_disb_amt,0,0,0,"U",created_by,datetime,created_by,datetime,ip_address];
    var whereColumns_trn = [];
    var whereValues_trn = [];
    var flag_trn = 0;
    var trans_result_ccbs = await saveRecord(table_trn,columns_trn,values_trn,whereColumns_trn,whereValues_trn,flag_trn)

    if(trans_result_ccbs.suc !== 1){
       return res.send({
       success: true,
       msg: "Failed to save re-finance data in ccb loan transaction table",
       data : []
       });
    }

    if (member_ids && member_ids.length > 0) {

    // Loop & update each member trans
    for (let mem of member_ids) {

    const mem_table = "bdccb.td_loan_member";
    const mem_columns = ["prn_amt","society_acc_no","modified_by","modified_at"];
    const mem_values = [mem.disb_amt,society_acc_no,created_by, datetime];
    const mem_whereColumns = ["loan_id","member_code"];
    const mem_whereValues = [mem.loan_id,mem.member_code];
    const mem_flag = 1;
    await saveRecord(mem_table,mem_columns,mem_values,mem_whereColumns,mem_whereValues,mem_flag);   

    const mem_table_trans = "bdccb.td_loan_member_trans";
    const mem_columns_trans = ["curr_prn","approval_status","approved_by","approved_dt","modified_by","modified_dt"];
    const mem_values_trans = [mem.disb_amt,"A",created_by, datetime,created_by, datetime];
    const mem_whereColumns_trans = ["loan_id","trans_id"];
    const mem_whereValues_trans = [mem.loan_id,mem.trans_id];
    const mem_flag_trans = 1;
    await saveRecord(mem_table_trans,mem_columns_trans,mem_values_trans,mem_whereColumns_trans,mem_whereValues_trans,mem_flag_trans);
    }
    }
    return res.send({
        success: true,
        msg: "Re-finance disburse data Updated Successfully",
         });
}catch (error) {
    console.error("Error in while save refinance disbursement:", error);
    return res.send({
      success: false,
      msg: "Internal server error",
      errorCode: "SERVER_ERROR",
    });
  }
});

// REJECT RE-FINANCE DISBURSEMENT
refinanceRouter.post("/reject_refinance_disb", async (req, res) => {
  try{
  const { loan_id, tenant_id, branch_shg_id, member_refinance_reject } = req.body;
  
  if (!member_refinance_reject || member_refinance_reject.length === 0) {
      return res.send({
        success: true,
        msg: "No member data found"
      });
  }

  let datetime = new Date().toISOString().slice(0, 19).replace('T', ' ');

  if (member_refinance_reject && member_refinance_reject.length > 0) {
  // Loop & update each member
    for (let mem of member_refinance_reject) {
    // delete from member trans
      await deleteRecord(
        "bdccb.td_loan_member_trans",
        ["loan_id","trans_id","ccb_loan_id","tenant_id","branch_shg_id","trans_type"],
        [mem.loan_id,mem.tran_id,loan_id,tenant_id,branch_shg_id,'D']
      );

    // delete from member
      await deleteRecord(
        "bdccb.td_loan_member",
        ["loan_id","ccb_loan_id","tenant_id","branch_shg_id","group_code","member_code"],
        [mem.loan_id,loan_id,tenant_id,branch_shg_id,mem.group_code,mem.member_id]
      );
    }
    return res.send({
      success: true,
      msg: "Re-finance Disbursement Rejected Successfully"
    });  
  }else{
  return res.send({
   success: true,
   msg: "Member details not found for reject",
   data: []
   })
  }
  }catch(error){
   console.error("Error in while reject refinance disbursement:", error);
   return res.send({
      success: false,
      msg: "Internal server error",
      errorCode: "SERVER_ERROR",
    });
  }
});

//FETCH UNAPPROVE RE-FINANCE DISBURSEMENT AT BRANCH LEVEL
refinanceRouter.post("/fetch_unapprove_re-finance_data_branch_level", async (req, res) => {
  try{
  const {branch_id, approval_status} = req.body;

  var select =`a.loan_id,a.tenant_id,a.branch_id,a.loan_acc_no,f.group_name, a.group_code,a.loan_to,a.branch_shg_id,c.branch_name AS loan_to_name,a.period,a.curr_roi,a.penal_roi,TO_CHAR(a.disb_dt, 'YYYY-MM-DD') AS disb_dt,SUM(a.disb_amt) AS disb_amt,a.pay_mode,TO_CHAR(a.rep_start_dt, 'YYYY-MM-DD') AS rep_start_dt,TO_CHAR(a.rep_end_dt, 'YYYY-MM-DD') AS rep_end_dt,a.sanction_no,TO_CHAR(a.sanction_dt, 'YYYY-MM-DD') AS sanction_dt,a.curr_prn,a.curr_intt,a.ovd_prn,a.ovd_intt,a.fund_type,b.trans_type,b.approval_status,a.created_by,a.created_dt,a.ip_address`,
    table_name = `bdccb.td_loan_ccb a LEFT JOIN bdccb.td_loan_ccb_trans b ON a.tenant_id = b.tenant_id AND a.loan_id = b.loan_id LEFT JOIN public.md_branch c ON a.branch_shg_id = c.branch_id LEFT JOIN bdccb.md_group f ON a.group_code = f.group_code`,
    whr = `a.branch_id = '${branch_id}' AND b.approval_status = '${approval_status}' AND b.trans_type = 'D' AND a.fund_type = 'O'`;
    order = `a.loan_id, a.group_code,a.disb_dt DESC`;
    var show_unapprove_branch_data = await db_Select(select, table_name, whr, order);

    if (!(show_unapprove_branch_data.suc === 1 && show_unapprove_branch_data.msg.length > 0)) {
      return res.send({
        success: true,
        msg: `Unable to fetch ${approval_status == "A" ? "Approved" : "Unapproved"} refinance disbursed loan details`,
        data: [],
      });
    }
     return res.send({
      success: true,
      msg: `Fetch ${approval_status == "A" ? "Approved" : "Unapproved"} disbursed Loan Details`,
      data: finalData,
    });
  }catch(error){
   console.error("Error in while fetch unapprove refinance disbursement in branch level:", error);
   return res.send({
      success: false,
      msg: "Internal server error",
      errorCode: "SERVER_ERROR",
    });
  }
})

// APPROVE RE-FINANCE DISBURSEMENT FROM BRANCH
refinanceRouter.post("/approve_re-finance_branch", async (req, res) => {
  try{
    const {} = req.body;

  }catch(error){
   console.error("Error in while approve refinance disbursement from branch level:", error);
   return res.send({
      success: false,
      msg: "Internal server error",
      errorCode: "SERVER_ERROR",
    });
  }
})

module.exports = {refinanceRouter}