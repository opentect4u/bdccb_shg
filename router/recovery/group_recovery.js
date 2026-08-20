const { db_Select, saveRecord } = require("../../model/pgcommon");
const express = require("express"),
  groupRecoveryRouter = express.Router();

const member_trans_id = async () => {
  const timestamp = new Date().getTime();
  const newPayId = `${timestamp}`;
  return (newPayId);
};

// AFTER APPROVAL GROUP LEADER SHOW LOAN DETAILS 
// groupRecoveryRouter.post("/fetch_loan_details", async (req, res) => {
//   try {
//     const { tenant_id, branch_id, emp_id } = req.body;
//     //  let parts = emp_id.split("-");
//     // let group_codes = parts[2];
//     let group_codes = emp_id;


//     if (!group_codes || group_codes.trim() === '') {
//       return res.send({
//         success: true,
//         msg: "No search term provided",
//         data: []
//       });
//     }

//     var select = "DISTINCT a.group_code,a.group_name,b.loan_to",
//       table_name = "bdccb.md_group a LEFT JOIN bdccb.td_loan_member b ON a.group_code = b.group_code",
//       whr = `CAST(a.group_code AS text) = '${group_codes}' OR LOWER(a.group_name) LIKE LOWER('%${group_codes}%') AND b.fund_type = 'B'`,
//       order = null;
//     var fetch_grp_code = await db_Select(select, table_name, whr, order);
//     // console.log(fetch_grp_code,'fetch_grp_code');


//     if (!(fetch_grp_code.suc === 1 && fetch_grp_code.msg.length > 0)) {
//       return res.send({
//         success: true,
//         msg: "No group details found",
//         data: []
//       });
//     }

//     let loan_finalData_mem = [];

//     for (const grp of fetch_grp_code.msg) {
//       const group_code = grp.group_code;
//       const group_name = grp.group_name;
//       const loan_to = grp.loan_to;

//       const roi_column = loan_to == 'S' ? "a.curr_roi" : "a.society_roi";
//       const penal_roi_column = loan_to == 'S' ? "a.penal_roi" : "a.society_penal_roi";
//       const society_acc_no = loan_to == 'S' ? "a.loan_acc_no" : "a.society_acc_no";

//       var select_loan = `a.ccb_loan_id AS loan_id,a.tenant_id,a.branch_id,a.loan_acc_no AS ccb_loan_acc_no,a.branch_shg_id,c.branch_name AS pacs_name,a.period,${roi_column} AS curr_roi,${penal_roi_column} AS penal_roi,TO_CHAR(a.disb_dt, 'YYYY-MM-DD') AS disb_dt,SUM(a.disb_amt) AS disb_amt,a.period_mode,TO_CHAR(a.rep_start_dt, 'YYYY-MM-DD') AS rep_start_dt,TO_CHAR(a.rep_end_dt, 'YYYY-MM-DD') AS rep_end_dt,a.sanction_no,TO_CHAR(a.sanction_dt, 'YYYY-MM-DD') AS sanction_dt,${society_acc_no} society_acc_no,b.trans_type`,
//         table_name_loan = "bdccb.td_loan_member a LEFT JOIN bdccb.td_loan_member_trans b ON a.tenant_id = b.tenant_id AND a.branch_id = b.branch_id AND a.ccb_loan_id = b.ccb_loan_id AND a.loan_id = b.loan_id LEFT JOIN public.md_branch c ON a.branch_shg_id = c.branch_id",
//         whr_loan = `a.tenant_id = '${tenant_id}' AND a.branch_id = '${branch_id}' AND a.group_code = '${group_code}' AND b.approval_status = 'A' AND b.trans_type = 'D' AND a.fund_type = 'B' GROUP BY a.ccb_loan_id,a.tenant_id,a.branch_id,a.loan_acc_no,a.branch_shg_id,c.branch_name,a.period,a.curr_roi,a.penal_roi,a.disb_dt,a.period_mode,a.rep_start_dt,a.rep_end_dt,a.sanction_no,a.sanction_dt,a.society_acc_no,b.trans_type,a.society_roi,a.society_penal_roi`,
//         order_loan = null;
//       var fetch_loan_data = await db_Select(select_loan, table_name_loan, whr_loan, order_loan);

//       if (fetch_loan_data.suc === 1 && fetch_loan_data.msg.length > 0) {
//         for (let loan of fetch_loan_data.msg) {
//           let mem_select = "a.loan_id AS mem_loan_id,a.group_code,c.group_name,a.member_code AS member_id,d.member_name,COALESCE(a.prn_amt,0) AS principal_amt,d.member_account_no AS sb_acc_no,e.approval_status",
//             mem_table = "bdccb.td_loan_member a LEFT JOIN bdccb.td_loan_member_trans b ON a.loan_id = b.loan_id AND a.ccb_loan_id = b.ccb_loan_id AND a.tenant_id = b.tenant_id LEFT JOIN bdccb.md_group c ON a.group_code = c.group_code LEFT JOIN bdccb.md_member d ON a.group_code = d.group_code AND a.member_code = d.member_code LEFT JOIN bdccb.td_loan_member_trans_temp e ON a.ccb_loan_id = e.ccb_loan_id AND a.tenant_id = e.tenant_id AND a.loan_id = e.loan_id",
//             mem_whr = `a.tenant_id = '${tenant_id}' AND a.ccb_loan_id = '${loan.loan_id}' AND a.group_code = '${group_code}' AND b.approval_status = 'A'  AND a.fund_type = 'B' GROUP BY a.loan_id,a.group_code,c.group_name,a.member_code,d.member_name,a.prn_amt,d.member_account_no,e.approval_status`;
//           let shg_member_dtls = await db_Select(mem_select, mem_table, mem_whr, null);

//           loan.group_code = group_code;
//           loan.group_name = group_name;
//           loan.loan_to = loan_to;
//           loan.members = shg_member_dtls.suc === 1 ? shg_member_dtls.msg : [];
//           loan_finalData_mem.push(loan);
//         }
//       }
//     }

//     if (loan_finalData_mem.length === 0) {
//       return res.send({
//         success: true,
//         msg: `Unable to fetch disbursed loan details for the given search`,
//         data: [],
//       });
//     }

//     return res.send({
//       success: true,
//       msg: `Fetch group ${loan_finalData_mem[0].group_name} disbursed Loan Details`,
//       data: loan_finalData_mem,
//     });
//   } catch (error) {
//     console.error("Error in while group fetch loan details:", error);
//     return res.send({
//       success: false,
//       msg: "Internal server error",
//       errorCode: "SERVER_ERROR",
//     });
//   }
// });


groupRecoveryRouter.post("/fetch_loan_details", async (req, res) => {
  try {
    const { branch_type, tenant_id, branch_id, emp_id } = req.body;
    //  let parts = emp_id.split("-");
    // let group_codes = parts[2];
    let group_codes = emp_id;

    if (!group_codes || group_codes.trim() === '') {
      return res.send({
        success: true,
        msg: "No search term provided",
        data: []
      });
    }

    var select = "DISTINCT a.group_code,a.group_name,b.loan_to",
      table_name = "bdccb.md_group a LEFT JOIN bdccb.td_loan_member b ON a.group_code = b.group_code",
      whr = `(CAST(a.group_code AS text) = '${group_codes}' OR LOWER(a.group_name) LIKE LOWER('%${group_codes}%')) AND b.fund_type = 'B'`,
      order = null;
    var fetch_grp_code = await db_Select(select, table_name, whr, order);
    // console.log(fetch_grp_code,'fetch_grp_code');


    if (!(fetch_grp_code.suc === 1 && fetch_grp_code.msg.length > 0)) {
      return res.send({
        success: true,
        msg: "No group details found",
        data: []
      });
    }

    const first_grp = fetch_grp_code.msg[0];
    if (branch_type === 'B' && first_grp.loan_to === 'P') {
      return res.send({
        success: true,
        msg: "This is a PACS Group. Please provide a Branch Group.",
        data: []
      });
    } else if (branch_type === 'P' && first_grp.loan_to === 'S') {
      return res.send({
        success: true,
        msg: "This is a Branch Group. Please provide a PACS Group.",
        data: []
      });
    }

    let loan_finalData_mem = [];

    for (const grp of fetch_grp_code.msg) {
      const group_code = grp.group_code;
      const group_name = grp.group_name;
      const loan_to = grp.loan_to;

      const roi_column = loan_to == 'S' ? "a.curr_roi" : "a.society_roi";
      const penal_roi_column = loan_to == 'S' ? "a.penal_roi" : "a.society_penal_roi";
      const society_acc_no = loan_to == 'S' ? "a.loan_acc_no" : "a.society_acc_no";

      var select_loan = `a.ccb_loan_id AS loan_id,a.tenant_id,a.branch_id,a.loan_acc_no AS ccb_loan_acc_no,a.branch_shg_id,c.branch_name AS pacs_name,a.period,${roi_column} AS curr_roi,${penal_roi_column} AS penal_roi,TO_CHAR(a.disb_dt, 'YYYY-MM-DD') AS disb_dt,SUM(a.disb_amt) AS disb_amt,a.period_mode,TO_CHAR(a.rep_start_dt, 'YYYY-MM-DD') AS rep_start_dt,TO_CHAR(a.rep_end_dt, 'YYYY-MM-DD') AS rep_end_dt,a.sanction_no,TO_CHAR(a.sanction_dt, 'YYYY-MM-DD') AS sanction_dt,${society_acc_no} society_acc_no,b.trans_type`,
        table_name_loan = "bdccb.td_loan_member a LEFT JOIN bdccb.td_loan_member_trans b ON a.tenant_id = b.tenant_id AND a.branch_id = b.branch_id AND a.ccb_loan_id = b.ccb_loan_id AND a.loan_id = b.loan_id LEFT JOIN public.md_branch c ON a.branch_shg_id = c.branch_id",
        whr_loan = `a.tenant_id = '${tenant_id}' AND a.branch_id = '${branch_id}' AND a.group_code = '${group_code}' AND b.approval_status = 'A' AND b.trans_type = 'D' AND a.fund_type = 'B' GROUP BY a.ccb_loan_id,a.tenant_id,a.branch_id,a.loan_acc_no,a.branch_shg_id,c.branch_name,a.period,a.curr_roi,a.penal_roi,a.disb_dt,a.period_mode,a.rep_start_dt,a.rep_end_dt,a.sanction_no,a.sanction_dt,a.society_acc_no,b.trans_type,a.society_roi,a.society_penal_roi`,
        order_loan = null;
      var fetch_loan_data = await db_Select(select_loan, table_name_loan, whr_loan, order_loan);

      if (fetch_loan_data.suc === 1 && fetch_loan_data.msg.length > 0) {
        for (let loan of fetch_loan_data.msg) {
          let mem_select = "a.loan_id AS mem_loan_id,a.group_code,c.group_name,a.member_code AS member_id,d.member_name,COALESCE(a.prn_amt,0) AS principal_amt,d.member_account_no AS sb_acc_no,e.approval_status,a.disb_amt",
            mem_table = "bdccb.td_loan_member a LEFT JOIN bdccb.td_loan_member_trans b ON a.loan_id = b.loan_id AND a.ccb_loan_id = b.ccb_loan_id AND a.tenant_id = b.tenant_id LEFT JOIN bdccb.md_group c ON a.group_code = c.group_code LEFT JOIN bdccb.md_member d ON a.group_code = d.group_code AND a.member_code = d.member_code LEFT JOIN bdccb.td_loan_member_trans_temp e ON a.ccb_loan_id = e.ccb_loan_id AND a.tenant_id = e.tenant_id AND a.loan_id = e.loan_id",
            mem_whr = `a.tenant_id = '${tenant_id}' AND a.ccb_loan_id = '${loan.loan_id}' AND a.group_code = '${group_code}' AND b.approval_status = 'A'  AND a.fund_type = 'B' GROUP BY a.loan_id,a.group_code,c.group_name,a.member_code,d.member_name,a.prn_amt,d.member_account_no,e.approval_status,a.disb_amt`;
          let shg_member_dtls = await db_Select(mem_select, mem_table, mem_whr, null);

          loan.group_code = group_code;
          loan.group_name = group_name;
          loan.loan_to = loan_to;
          loan.members = shg_member_dtls.suc === 1 ? shg_member_dtls.msg : [];
          loan_finalData_mem.push(loan);
        }
      }
    }

    if (loan_finalData_mem.length === 0) {
      return res.send({
        success: true,
        msg: `Unable to fetch disbursed loan details for the given search`,
        data: [],
      });
    }

    return res.send({
      success: true,
      msg: `Fetch group ${loan_finalData_mem[0].group_name} disbursed Loan Details`,
      data: loan_finalData_mem,
    });
  } catch (error) {
    console.error("Error in while group fetch loan details:", error);
    return res.send({
      success: false,
      msg: "Internal server error",
      errorCode: "SERVER_ERROR",
    });
  }
});

groupRecoveryRouter.post("/fetch_loan_details_web", async (req, res) => {
  try {
    const { branch_type, tenant_id, branch_id, emp_id } = req.body;
    //  let parts = emp_id.split("-");
    // let group_codes = parts[2];
    let group_codes = emp_id;

    if (!group_codes || group_codes.trim() === '') {
      return res.send({
        success: true,
        msg: "No search term provided",
        data: []
      });
    }

    let branch_condition = '';

    if (branch_type === 'B') {
      branch_condition = `a.branch_code = '${branch_id}'`;
    } else if (branch_type === 'P') {
      branch_condition = `a.pacs_id = '${branch_id}'`;
    } else if (branch_type === 'H') {
      branch_condition = `1=1`; // No branch filter
    } else {
      return res.send({
        success: false,
        msg: "Invalid branch type"
      });
    }

    var select = "DISTINCT a.group_code,a.group_name,b.loan_to",
      table_name = "bdccb.md_group a LEFT JOIN bdccb.td_loan_member b ON a.group_code = b.group_code",
      whr = `(CAST(a.group_code AS text) = '${group_codes}' OR LOWER(a.group_name) LIKE LOWER('%${group_codes}%')) AND ${branch_condition} AND b.fund_type = 'B'`,
      order = null;
    var fetch_grp_code = await db_Select(select, table_name, whr, order);
    // console.log(fetch_grp_code,'fetch_grp_code');


    if (!(fetch_grp_code.suc === 1 && fetch_grp_code.msg.length > 0)) {
      return res.send({
        success: true,
        msg: "No group details found",
        data: []
      });
    }

    const first_grp = fetch_grp_code.msg[0];

    // Check if account status of all loans/members in this group is 'C' (Closed)
    var check_closed = await db_Select("acc_status", "bdccb.td_loan_member", `group_code = '${first_grp.group_code}' AND tenant_id = '${tenant_id}' AND fund_type = 'B'`, null);
    if (check_closed.suc === 1 && check_closed.msg.length > 0) {
      const hasOpen = check_closed.msg.some(m => m.acc_status === 'O');
      if (!hasOpen) {
        return res.send({
          success: true,
          msg: "Account closed",
          data: []
        });
      }
    }

    if (branch_type === 'B' && first_grp.loan_to === 'P') {
      return res.send({
        success: true,
        msg: "This is a PACS Group. Please provide a Branch Group.",
        data: []
      });
    } else if (branch_type === 'P' && first_grp.loan_to === 'S') {
      return res.send({
        success: true,
        msg: "This is a Branch Group. Please provide a PACS Group.",
        data: []
      });
    }

    let loan_finalData_mem = [];

    for (const grp of fetch_grp_code.msg) {
      const group_code = grp.group_code;
      const group_name = grp.group_name;
      const loan_to = grp.loan_to;

      const roi_column = loan_to == 'S' ? "a.curr_roi" : "a.society_roi";
      const penal_roi_column = loan_to == 'S' ? "a.penal_roi" : "a.society_penal_roi";
      const society_acc_no = loan_to == 'S' ? "a.loan_acc_no" : "a.society_acc_no";

      let branch_conditions = '';

      if (branch_type === 'B') {
        branch_conditions = `a.branch_id = '${branch_id}'`;
      } else if (branch_type === 'P') {
        branch_conditions = `a.branch_shg_id = '${branch_id}'`;
      } else if (branch_type === 'H') {
        branch_conditions = `1=1`; // No branch filter
      } else {
        return res.send({
          success: false,
          msg: "Invalid branch type"
        });
      }

      var select_loan = `a.ccb_loan_id AS loan_id,a.tenant_id,a.branch_id,a.loan_acc_no AS ccb_loan_acc_no,a.branch_shg_id,c.branch_name AS pacs_name,a.period,${roi_column} AS curr_roi,${penal_roi_column} AS penal_roi,TO_CHAR(a.disb_dt, 'YYYY-MM-DD') AS disb_dt,SUM(a.disb_amt) AS disb_amt,a.period_mode,TO_CHAR(a.rep_start_dt, 'YYYY-MM-DD') AS rep_start_dt,TO_CHAR(a.rep_end_dt, 'YYYY-MM-DD') AS rep_end_dt,a.sanction_no,TO_CHAR(a.sanction_dt, 'YYYY-MM-DD') AS sanction_dt,${society_acc_no} society_acc_no,b.trans_type`,
        table_name_loan = "bdccb.td_loan_member a LEFT JOIN bdccb.td_loan_member_trans b ON a.tenant_id = b.tenant_id AND a.branch_id = b.branch_id AND a.ccb_loan_id = b.ccb_loan_id AND a.loan_id = b.loan_id LEFT JOIN public.md_branch c ON a.branch_shg_id = c.branch_id",
        whr_loan = `a.tenant_id = '${tenant_id}' AND ${branch_conditions} AND a.group_code = '${group_code}' AND b.approval_status = 'A' AND b.trans_type = 'D' AND a.fund_type = 'B' AND a.acc_status = 'O' GROUP BY a.ccb_loan_id,a.tenant_id,a.branch_id,a.loan_acc_no,a.branch_shg_id,c.branch_name,a.period,a.curr_roi,a.penal_roi,a.disb_dt,a.period_mode,a.rep_start_dt,a.rep_end_dt,a.sanction_no,a.sanction_dt,a.society_acc_no,b.trans_type,a.society_roi,a.society_penal_roi,a.acc_status`,
        order_loan = null;
      var fetch_loan_data = await db_Select(select_loan, table_name_loan, whr_loan, order_loan);

      if (fetch_loan_data.suc === 1 && fetch_loan_data.msg.length > 0) {
        for (let loan of fetch_loan_data.msg) {
          let mem_select = "a.loan_id AS mem_loan_id,a.group_code,c.group_name,a.member_code AS member_id,d.member_name,COALESCE(a.prn_amt,0) AS principal_amt,d.member_account_no AS sb_acc_no,e.approval_status,a.disb_amt,a.acc_status",
            mem_table = "bdccb.td_loan_member a LEFT JOIN bdccb.td_loan_member_trans b ON a.loan_id = b.loan_id AND a.ccb_loan_id = b.ccb_loan_id AND a.tenant_id = b.tenant_id LEFT JOIN bdccb.md_group c ON a.group_code = c.group_code LEFT JOIN bdccb.md_member d ON a.group_code = d.group_code AND a.member_code = d.member_code LEFT JOIN bdccb.td_loan_member_trans_temp e ON a.ccb_loan_id = e.ccb_loan_id AND a.tenant_id = e.tenant_id AND a.loan_id = e.loan_id",
            mem_whr = `a.tenant_id = '${tenant_id}' AND a.ccb_loan_id = '${loan.loan_id}' AND a.group_code = '${group_code}' AND b.approval_status = 'A'  AND a.fund_type = 'B' AND a.acc_status = 'O' GROUP BY a.loan_id,a.group_code,c.group_name,a.member_code,d.member_name,a.prn_amt,d.member_account_no,e.approval_status,a.disb_amt,a.acc_status`;
          let shg_member_dtls = await db_Select(mem_select, mem_table, mem_whr, null);

          if (shg_member_dtls.suc === 1 && shg_member_dtls.msg.some(m => m.acc_status === 'C')) {
            return res.send({
              success: true,
              msg: "Account closed",
              data: []
            });
          }

          loan.group_code = group_code;
          loan.group_name = group_name;
          loan.loan_to = loan_to;
          loan.members = shg_member_dtls.suc === 1 ? shg_member_dtls.msg : [];
          loan_finalData_mem.push(loan);
        }
      }
    }

    if (loan_finalData_mem.length === 0) {
      return res.send({
        success: true,
        msg: `Unable to fetch disbursed loan details for the given search`,
        data: [],
      });
    }

    return res.send({
      success: true,
      msg: `Fetch group ${loan_finalData_mem[0].group_name} disbursed Loan Details`,
      data: loan_finalData_mem,
    });
  } catch (error) {
    console.error("Error in while group fetch loan details:", error);
    return res.send({
      success: false,
      msg: "Internal server error",
      errorCode: "SERVER_ERROR",
    });
  }
});


// SAVE RECOVERY IN GROUP LEVEL
groupRecoveryRouter.post("/save_grp_recovery", async (req, res) => {
  try {
    const { tenant_id, branch_id, loan_acc_no, loan_to, branch_shg_id, members, created_by, ip_address, loan_id, trans_date } = req.body;
    console.log(req.body, 'recov');

    let datetime = new Date().toISOString().slice(0, 19).replace("T", " ");

    let date = new Date().toISOString().slice(0, 10);

    let isInserted = false;
    let isUpdated = false;

    // row insert td_loan_member_trans_temp table //

    for (const mem of members) {

      const isUpdate = mem.mem_trn_id && Number(mem.mem_trn_id) > 0;
      let mem_trans_id = await member_trans_id();

      const table2 = "bdccb.td_loan_member_trans_temp";
      const columns2 = ["trans_date", "trans_id", "loan_id", "ccb_loan_id", "tenant_id", "branch_id", "loan_to", "branch_shg_id", "loan_acc_no", "trans_type", "dr_amt", "cr_amt", "curr_prn_recov", "curr_intt_recov", "ovd_prn_recov", "ovd_intt_recov", "curr_prn", "curr_intt", "ovd_prn", "ovd_intt", "approval_status", "created_by", "created_dt", "ip_address", "sb_amt"];

      const values2 = [trans_date, mem_trans_id, mem.mem_loan_id, loan_id, tenant_id, branch_id, loan_to, branch_shg_id, loan_acc_no, 'R', 0, mem.cr_amt, 0, 0, 0, 0, 0, 0, 0, 0, 'U', created_by, datetime, ip_address, mem.sb_amt];
      const whereColumns2 = [];
      const whereValues2 = [];
      const flag2 = 0;
      const member_trans_result = await saveRecord(table2, columns2, values2, whereColumns2, whereValues2, flag2);

      if (!member_trans_result || member_trans_result.suc !== 1) {
        return res.send({
          success: false,
          msg: "Failed to save loan in member transaction table group recovery time",
          data: []
        });
      }

      //  if (isUpdate) {
      //   isUpdated = true;
      // } else {
      //   isInserted = true;
      // }
    }

    return res.send({
      success: true,
      msg: "Recovery Done Successfully",
    });
  } catch (error) {
    console.error("Error in while save group recovery data:", error);
    return res.send({
      success: false,
      msg: "Internal server error",
      errorCode: "SERVER_ERROR",
    });
  }
});

// FETCH GROUP RECOVERY LIST
groupRecoveryRouter.post("/fetch_group_recovery_list", async (req, res) => {
  try {
    const { tenant_id, branch_id, from_dt, to_dt, approval_status, branch_type } = req.body;

    let branch_condition = '';

    if (branch_type === 'B') {
      branch_condition = `c.branch_id = '${branch_id}' AND c.loan_to = 'S'`;
    } else if (branch_type === 'P') {
      branch_condition = `c.branch_shg_id = '${branch_id}' AND c.loan_to = 'P'`;
    } else if (branch_type === 'H') {
      branch_condition = `1=1`; // No branch filter
    } else {
      return res.send({
        success: false,
        msg: "Invalid branch type"
      });
    }

    var select = "a.ccb_loan_id AS loan_id, a.group_code, b.group_name, 0 AS disb_amt, TO_CHAR(c.trans_date, 'YYYY-MM-DD') AS trans_dt, MAX(c.trans_id) AS transaction_id, SUM(COALESCE(c.cr_amt,0)) AS credit_amount, c.approval_status";
    var table_name = `bdccb.td_loan_member_trans_temp c JOIN bdccb.td_loan_member a ON c.ccb_loan_id = a.ccb_loan_id AND c.loan_id = a.loan_id AND c.tenant_id = a.tenant_id JOIN bdccb.md_group b ON a.group_code = b.group_code`;
    var whr = `c.tenant_id = '${tenant_id}' AND ${branch_condition} AND c.trans_type = 'R' AND c.approval_status = '${approval_status}'`;

    if (from_dt && to_dt) {
      whr += ` AND c.trans_date::date BETWEEN '${from_dt}' AND '${to_dt}'`;
    }

    whr += ` GROUP BY a.ccb_loan_id, a.group_code, b.group_name, c.trans_date, c.approval_status`;
    var order = `c.trans_date DESC`;

    var fetch_recov_data = await db_Select(select, table_name, whr, order);

    if (fetch_recov_data.suc === 1 && fetch_recov_data.msg.length > 0) {
      return res.send({
        success: true,
        msg: "Fetch group recovery details successfully",
        data: fetch_recov_data.msg,
      });
    } else {
      return res.send({
        success: true,
        msg: "No group recovery details found",
        data: [],
      });
    }
  } catch (error) {
    console.error("Error fetching group recovery list:", error);
    return res.send({
      success: false,
      msg: "Internal server error",
      errorCode: "SERVER_ERROR",
    });
  }
});

// FETCH GROUP RECOVERY MEMBER DETAILS FOR VIEW
groupRecoveryRouter.post("/fetch_group_mem_recov_dtls", async (req, res) => {
  try {
    const { tenant_id, branch_id, group_code, trans_dt, approval_status, loan_id } = req.body;

    var select_loan = "MAX(a.ccb_loan_id) AS loan_id, a.group_code, b.group_name, MAX(a.period) AS period, MAX(a.curr_roi) AS curr_roi, MAX(a.penal_roi) AS penal_roi, TO_CHAR(MAX(a.disb_dt), 'YYYY-MM-DD') AS disb_dt, SUM(COALESCE(a.disb_amt,0)) AS disb_amt";
    var table_name_loan = "bdccb.td_loan_member a LEFT JOIN bdccb.md_group b ON a.group_code = b.group_code";
    var whr_loan = `a.tenant_id = '${tenant_id}' AND a.group_code = '${group_code}' AND a.fund_type = 'B' ${loan_id ? `AND a.ccb_loan_id = '${loan_id}'` : ''} GROUP BY a.group_code, b.group_name`;

    var fetch_loan_dtls = await db_Select(select_loan, table_name_loan, whr_loan, null);

    if (fetch_loan_dtls.suc === 1 && fetch_loan_dtls.msg.length > 0) {
      let mem_table = "bdccb.td_loan_member_trans_temp";

      var select_mem = `a.loan_id AS mem_loan_id, a.member_code, b.member_name, COALESCE(a.prn_amt,0) AS principal_amt, b.member_account_no AS sb_acc_no, COALESCE(c.cr_amt, 0) AS cr_amt, COALESCE(c.sb_amt, 0) AS sb_amt`;
      var table_name_mem = `bdccb.td_loan_member a LEFT JOIN bdccb.md_member b ON a.group_code = b.group_code AND a.member_code = b.member_code LEFT JOIN ${mem_table} c ON a.ccb_loan_id = c.ccb_loan_id AND a.loan_id = c.loan_id AND c.trans_type = 'R' AND DATE(c.trans_date) = '${trans_dt}' AND c.approval_status = '${approval_status}'`;
      var whr_mem = `a.tenant_id = '${tenant_id}' AND a.group_code = '${group_code}' AND a.fund_type = 'B' ${loan_id ? `AND a.ccb_loan_id = '${loan_id}'` : ''}`;

      var fetch_mem_dtls = await db_Select(select_mem, table_name_mem, whr_mem, null);

      let loan = fetch_loan_dtls.msg[0];
      loan.members = fetch_mem_dtls.suc === 1 && fetch_mem_dtls.msg.length > 0 ? fetch_mem_dtls.msg : [];

      return res.send({
        success: true,
        msg: "Fetch group member details successfully",
        data: [loan]
      });
    } else {
      return res.send({
        success: true,
        msg: "No group details found",
        data: []
      });
    }
  } catch (error) {
    console.error("Error fetching group member recov dtls:", error);
    return res.send({
      success: false,
      msg: "Internal server error",
      errorCode: "SERVER_ERROR",
    });
  }
});

module.exports = { groupRecoveryRouter }
