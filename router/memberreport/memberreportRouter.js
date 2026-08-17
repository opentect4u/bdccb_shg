const { db_Select } = require('../../model/pgcommon');
const express = require('express');
const memberreportRouter = express.Router();

// 1. Member Master List Endpoint
memberreportRouter.post("/get_group_memb_list", async (req, res) => {
  try {
    const { branch_code, group_name_code } = req.body;

    let select = "distinct a.branch_id, a.group_code, b.group_name, a.member_code, a.member_name, a.gender, a.dob, a.gurdian_name, a.address, a.phone_no, a.pin_no, a.aadhar_no, a.pan_no, a.voter_id, a.member_account_no, a.ifsc, a.economic_activity, a.religion, a.caste, a.education, a.occupation, a.gp_leader_flag, a.asst_gp_leader_flag";
    let table_name = "bdccb.md_member a JOIN bdccb.md_group b ON a.group_code = b.group_code";
    let whr = "";

    if (!branch_code || branch_code == '0' || branch_code == 0) {
      whr = `a.delete_flag = 'N' ${group_name_code && group_name_code.trim() !== "" ? `AND (b.group_name ILIKE '%${group_name_code}%' OR a.group_code::text ILIKE '%${group_name_code}%' OR a.member_name ILIKE '%${group_name_code}%' OR a.member_code::text ILIKE '%${group_name_code}%')` : ""}`;
    } else {
      whr = `a.branch_id = '${branch_code}' AND a.delete_flag = 'N' ${group_name_code && group_name_code.trim() !== "" ? `AND (b.group_name ILIKE '%${group_name_code}%' OR a.group_code::text ILIKE '%${group_name_code}%' OR a.member_name ILIKE '%${group_name_code}%' OR a.member_code::text ILIKE '%${group_name_code}%')` : ""}`;
    }

    let order = "a.member_code DESC";
    let fetch_member_detail = await db_Select(select, table_name, whr, order);

    if (fetch_member_detail.suc === 1 && fetch_member_detail.msg.length > 0) {
      return res.send({
        success: true,
        suc: 1,
        msg: "Member Report Details",
        data: fetch_member_detail.msg
      });
    } else {
      return res.send({
        success: true,
        suc: 1,
        msg: "No member data found",
        data: []
      });
    }
  } catch (error) {
    console.error("Error while fetching member report details", error);
    return res.send({
      success: false,
      suc: 0,
      msg: "Internal server error",
      errorCode: "SERVER_ERROR"
    });
  }
});

// 2. SHG / Member Groupwise Savings Balance List Endpoint
memberreportRouter.post("/get_shg_savings_balance_list", async (req, res) => {
  try {
    const { search_mode, branch_code, pacs_id, group_name_code, report_type } = req.body;
    const isMemberType = report_type === "MEMBER" || report_type === "MEMBERS";

    // CCB Mode -> pacs_id = '111', SOCIETY Mode -> pacs_id = selected PACS
    let targetPacsId = search_mode === "CCB" ? "111" : (pacs_id || "111");

    if (isMemberType) {
      // Member Savings Balance query joining md_member, md_group, and td_sb
      // Condition: ONLY fetch records where acc_status_flag = 'O'
      let select = `distinct a.member_code, a.member_name, a.branch_id, a.group_code, b.group_name, COALESCE(s.acc_no, a.member_account_no, 'N/A') AS acc_no, TO_CHAR(s.acc_opening_dt, 'DD/MM/YYYY') AS acc_opening_dt, a.ifsc, COALESCE(s.balance, 0) AS balance, COALESCE(s.acc_status_flag::text, a.approval_status::text, 'O') AS acc_status_flag`;
      let table_name = `bdccb.md_member a JOIN bdccb.md_group b ON a.group_code = b.group_code LEFT JOIN bdccb.td_sb s ON (a.member_code::text = s.member_id::text OR a.member_account_no = s.acc_no)`;
      let whr = "";

      if (!branch_code || branch_code == '0' || branch_code == 0) {
        whr = `(a.delete_flag = 'N' OR a.delete_flag IS NULL) AND (COALESCE(s.acc_status_flag::text, 'O') = 'O') ${group_name_code && group_name_code.trim() !== "" ? `AND (b.group_name ILIKE '%${group_name_code}%' OR a.group_code::text ILIKE '%${group_name_code}%' OR a.member_name ILIKE '%${group_name_code}%' OR a.member_code::text ILIKE '%${group_name_code}%' OR s.acc_no ILIKE '%${group_name_code}%')` : ""}`;
      } else {
        whr = `(a.branch_id = '${branch_code}' OR b.branch_code = '${branch_code}') AND (b.pacs_id = '${targetPacsId}' OR b.pacs_id::text = '${targetPacsId}') AND (a.delete_flag = 'N' OR a.delete_flag IS NULL) AND (COALESCE(s.acc_status_flag::text, 'O') = 'O') ${group_name_code && group_name_code.trim() !== "" ? `AND (b.group_name ILIKE '%${group_name_code}%' OR a.group_code::text ILIKE '%${group_name_code}%' OR a.member_name ILIKE '%${group_name_code}%' OR a.member_code::text ILIKE '%${group_name_code}%' OR s.acc_no ILIKE '%${group_name_code}%')` : ""}`;
      }

      let order = "a.member_code DESC";
      let fetch_dtls = await db_Select(select, table_name, whr, order);

      return res.send({
        success: true,
        suc: 1,
        msg: "Member Savings Balance Details",
        data: fetch_dtls.suc === 1 ? fetch_dtls.msg : []
      });
    } else {
      // Group wise savings balance query joining md_group and td_deposit
      // Condition: ONLY fetch records where acc_status_flag = 'O'
      let select = `distinct g.group_code, g.group_name, g.branch_code, g.pacs_id, g.phone1, COALESCE(d.acc_no, g.sb_ac_no, 'N/A') AS acc_no, TO_CHAR(d.acc_opening_dt, 'DD/MM/YYYY') AS acc_opening_dt, COALESCE(d.balance, 0) AS balance, COALESCE(d.acc_status_flag::text, g.open_close_flag::text, 'O') AS acc_status_flag`;
      let table_name = `bdccb.md_group g LEFT JOIN bdccb.td_deposit d ON g.group_code::text = d.shg_id::text`;
      let whr = "";

      if (!branch_code || branch_code == '0' || branch_code == 0) {
        whr = `(g.delete_flag = 'N' OR g.delete_flag IS NULL) AND (COALESCE(d.acc_status_flag::text, g.open_close_flag::text, 'O') = 'O' OR d.acc_status_flag::text = 'O' OR g.open_close_flag::text = 'O') ${group_name_code && group_name_code.trim() !== "" ? `AND (g.group_name ILIKE '%${group_name_code}%' OR g.group_code::text ILIKE '%${group_name_code}%' OR d.acc_no ILIKE '%${group_name_code}%')` : ""}`;
      } else {
        whr = `(g.branch_code = '${branch_code}' OR d.branch_id = '${branch_code}') AND (g.pacs_id = '${targetPacsId}' OR g.pacs_id::text = '${targetPacsId}') AND (g.delete_flag = 'N' OR g.delete_flag IS NULL) AND (COALESCE(d.acc_status_flag::text, g.open_close_flag::text, 'O') = 'O' OR d.acc_status_flag::text = 'O' OR g.open_close_flag::text = 'O') ${group_name_code && group_name_code.trim() !== "" ? `AND (g.group_name ILIKE '%${group_name_code}%' OR g.group_code::text ILIKE '%${group_name_code}%' OR d.acc_no ILIKE '%${group_name_code}%')` : ""}`;
      }

      let order = "g.group_code DESC";
      let fetch_dtls = await db_Select(select, table_name, whr, order);

      return res.send({
        success: true,
        suc: 1,
        msg: "SHG Group Savings Balance Details",
        data: fetch_dtls.suc === 1 ? fetch_dtls.msg : []
      });
    }
  } catch (error) {
    console.error("Error fetching SHG savings balance details", error);
    return res.send({
      success: false,
      suc: 0,
      msg: "Internal server error",
      errorCode: "SERVER_ERROR"
    });
  }
});

// 3. Deposit Transaction Details Endpoint (Group vs Member Transactions)
memberreportRouter.post("/get_shg_deposit_transactions", async (req, res) => {
  try {
    const { shg_id, member_id, acc_no } = req.body;

    if ((!shg_id || shg_id === "") && (!member_id || member_id === "") && (!acc_no || acc_no === "")) {
      return res.send({
        success: false,
        suc: 0,
        msg: "SHG ID, Member ID, or Account Number is required",
        data: []
      });
    }

    let order = `CASE WHEN UPPER(COALESCE(remarks, '')) LIKE '%OPENING%' THEN 0 ELSE 1 END, trans_dt ASC, trans_no ASC`;

    if (member_id && member_id !== "") {
      // Member transactions query from bdccb.td_sb_trans
      let select = `trans_no, tenant_id, branch_id, acc_no, TO_CHAR(trans_dt, 'DD/MM/YYYY HH24:MI') AS trans_dt, dep_with_flag, COALESCE(dr_amt, 0) AS dr_amt, COALESCE(cr_amt, 0) AS cr_amt, COALESCE(balance, 0) AS balance, remarks, COALESCE(approval_flag, 'A') AS approval_flag, shg_id, member_id`;
      let table_name = `bdccb.td_sb_trans`;
      let whr = `(member_id::text = '${member_id}' ${acc_no && acc_no !== "N/A" ? `OR acc_no = '${acc_no}'` : ""})`;

      let fetch_trans = await db_Select(select, table_name, whr, order);

      return res.send({
        success: true,
        suc: fetch_trans.suc === 1 ? 1 : 0,
        msg: fetch_trans.suc === 1 ? "Member Savings Transactions" : "No transaction records found",
        data: fetch_trans.suc === 1 ? fetch_trans.msg : []
      });
    } else {
      // Group transactions query from bdccb.td_deposit_trans
      let select = `trans_no, tenant_id, branch_id, acc_no, TO_CHAR(trans_dt, 'DD/MM/YYYY HH24:MI') AS trans_dt, dep_with_flag, COALESCE(dr_amt, 0) AS dr_amt, COALESCE(cr_amt, 0) AS cr_amt, COALESCE(balance, 0) AS balance, remarks, COALESCE(approval_flag, 'A') AS approval_flag, shg_id`;
      let table_name = `bdccb.td_deposit_trans`;
      let whr = `(${shg_id && shg_id !== "" ? `shg_id::text = '${shg_id}'` : ""}${shg_id && shg_id !== "" && acc_no && acc_no !== "N/A" ? " OR " : ""}${acc_no && acc_no !== "N/A" ? `acc_no = '${acc_no}'` : ""})`;

      let fetch_trans = await db_Select(select, table_name, whr, order);

      return res.send({
        success: true,
        suc: fetch_trans.suc === 1 ? 1 : 0,
        msg: fetch_trans.suc === 1 ? "Group Deposit Transactions" : "No transaction records found",
        data: fetch_trans.suc === 1 ? fetch_trans.msg : []
      });
    }
  } catch (error) {
    console.error("Error fetching deposit transactions", error);
    return res.send({
      success: false,
      suc: 0,
      msg: "Internal server error",
      errorCode: "SERVER_ERROR"
    });
  }
});

module.exports = { memberreportRouter };
