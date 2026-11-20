const express = require("express");
const societyinfoRouter = express.Router();
const pgdb = require("../../db/pgdb");

/**
 * ============================================================================
 * SOCIETY & BRANCH COMPLETE ANALYTICS ROUTER
 * Dedicated Backend Module for /homebm/societyinfo
 * 
 * Rules Implemented:
 * 1. Groups: active, direct (pacs_id = 111), indirect (pacs_id != 111),
 *    closed (open_close_flag = 'C') from md_group, and loanee groups from td_loan.
 * 2. Members: from md_member based on branch/society with group association focus.
 * 3. Loans Direct & Indirect: branch_shg_id = 111 for direct, != 111 for indirect
 *    from td_loan, plus td_loan_ccb for CCB loans and td_loan_member for member loans.
 * 4. Deposits: group deposit accounts from td_deposit and member savings from td_sb.
 * 5. Period Transactions (financial year / month):
 *    - Loan disbursed & recovery from td_loan_ccb_trans (CCB), td_loan_transactions (Society),
 *      and td_loan_member_trans (Member).
 *    - SB transactions (deposit / withdrawal) from td_deposit_trans (Group) and td_sb_trans (Member).
 * 6. Branch / Society Profile: contact_person, branch_phone, branch_address from md_branch.
 * ============================================================================
 */

/**
 * 1. Fetch Branches and Societies for Dropdowns
 * GET or POST /v1/societyinfo/get_branches_and_societies
 */
societyinfoRouter.all("/get_branches_and_societies", async (req, res) => {
  try {
    const branchRes = await pgdb.query(`
      SELECT 
        branch_id, 
        branch_name, 
        branch_type
      FROM public.md_branch 
      WHERE branch_type IN ('B', 'H') AND branch_status = 'O'
      ORDER BY branch_id::integer ASC
    `);

    const pacsRes = await pgdb.query(`
      SELECT 
        p.branch_id AS pacs_id, 
        p.branch_name AS pacs_name,
        p.branch_jurisdiction_id AS branch_code
      FROM public.md_branch p
      WHERE p.branch_type = 'P' AND p.branch_status = 'O'
      ORDER BY p.branch_id::integer ASC
    `);

    return res.json({
      success: true,
      suc: 1,
      branches: branchRes.rows || [],
      societies: pacsRes.rows || []
    });
  } catch (err) {
    console.error("Error in get_branches_and_societies (societyinfoRouter):", err);
    return res.status(500).json({
      success: false,
      suc: 0,
      msg: "Failed to fetch branches and societies list",
      error: err.message
    });
  }
});

/**
 * 2. Fetch Society & Branch Complete Analytics
 * POST /v1/societyinfo/get_society_branch_analytics
 */
societyinfoRouter.post("/get_society_branch_analytics", async (req, res) => {
  try {
    const {
      view_mode = "branch",
      branch_code = "",
      pacs_id = "",
      financial_year = "2026-2027",
      month = "ALL",
      from_date = "",
      to_date = ""
    } = req.body;

    const isSociety = (view_mode === "society");
    const targetId = isSociety ? String(pacs_id || "") : String(branch_code || "");

    if (!targetId) {
      return res.status(400).json({
        success: false,
        suc: 0,
        msg: `Please select a valid ${isSociety ? "Society / PACS" : "Branch"}`
      });
    }

    // Determine Financial Year & Month Date Range Dynamically
    let fromDate = from_date ? String(from_date).trim() : "";
    let toDate = to_date ? String(to_date).trim() : "";

    let startYear = 2026;
    let endYear = 2027;
    if (financial_year && financial_year.includes("-")) {
      const parts = financial_year.split("-");
      startYear = parseInt(parts[0], 10) || 2026;
      endYear = parseInt(parts[1], 10) || startYear + 1;
    }

    // If custom from_date or to_date not provided, compute from financial_year & month
    if (!fromDate || !toDate) {
      fromDate = `${startYear}-04-01`;
      toDate = `${endYear}-03-31`;

      if (month && String(month).toUpperCase() !== "ALL") {
        const m = parseInt(month, 10);
        const yr = (m >= 1 && m <= 3) ? endYear : startYear;
        const mm = String(m).padStart(2, "0");
        const lastDay = new Date(yr, m, 0).getDate();
        fromDate = `${yr}-${mm}-01`;
        toDate = `${yr}-${mm}-${String(lastDay).padStart(2, "0")}`;
      }
    }

    // Determine the corresponding Financial Year range for the 12-month matrix
    let fyFromDate = `${startYear}-04-01`;
    let fyToDate = `${endYear}-03-31`;
    if (fromDate) {
      const parsedDate = new Date(fromDate);
      if (!isNaN(parsedDate.getTime())) {
        const pMonth = parsedDate.getMonth() + 1;
        const pYear = parsedDate.getFullYear();
        const baseStart = (pMonth >= 4) ? pYear : pYear - 1;
        fyFromDate = `${baseStart}-04-01`;
        fyToDate = `${baseStart + 1}-03-31`;
      }
    }

    // ------------------------------------------------------------------------
    // A. Profile & Contact Information (from public.md_branch)
    // ------------------------------------------------------------------------
    const profileQuery = isSociety
      ? `
        SELECT 
          p.branch_id AS pacs_id,
          p.branch_name AS pacs_name,
          COALESCE(p.branch_address, '') AS branch_address,
          COALESCE(p.contact_person, '') AS contact_person,
          COALESCE(p.branch_phone::text, '') AS branch_phone,
          COALESCE(p.pin_no::text, '') AS pin_no,
          p.branch_jurisdiction_id AS branch_code,
          COALESCE(b.branch_name, '') AS branch_name
        FROM public.md_branch p
        LEFT JOIN public.md_branch b ON p.branch_jurisdiction_id = b.branch_id
        WHERE p.branch_id = $1
      `
      : `
        SELECT 
          branch_id AS branch_code,
          branch_name,
          COALESCE(branch_address, '') AS branch_address,
          COALESCE(contact_person, '') AS contact_person,
          COALESCE(branch_phone::text, '') AS branch_phone,
          COALESCE(pin_no::text, '') AS pin_no
        FROM public.md_branch
        WHERE branch_id = $1
      `;

    // ------------------------------------------------------------------------
    // B. Groups Summary (Rule 1: active, closed, direct pacs_id=111, indirect, loanee)
    // ------------------------------------------------------------------------
    const groupWhereClause = isSociety ? `g.pacs_id = $1` : `g.branch_code = $1`;

    const groupsQuery = `
      SELECT 
        COUNT(g.group_code) AS total_groups,
        COUNT(CASE WHEN g.open_close_flag = 'O' THEN 1 END) AS active_groups,
        COUNT(CASE WHEN g.open_close_flag = 'C' THEN 1 END) AS closed_groups,
        COUNT(CASE WHEN g.pacs_id = 111 THEN 1 END) AS direct_groups,
        COUNT(CASE WHEN g.pacs_id != 111 OR g.pacs_id IS NULL THEN 1 END) AS indirect_groups
      FROM bdccb.md_group g
      WHERE g.delete_flag = 'N' AND ${groupWhereClause}
    `;

    const loaneeGroupsQuery = `
      SELECT COUNT(DISTINCT l.group_code) AS loanee_groups
      FROM bdccb.td_loan l
      JOIN bdccb.md_group g ON l.group_code::text = g.group_code::text
      WHERE g.delete_flag = 'N' AND ${groupWhereClause}
    `;

    // ------------------------------------------------------------------------
    // C. Members Summary (Rule 2: from md_member with group association focus)
    // ------------------------------------------------------------------------
    const membersQuery = `
      SELECT 
        COUNT(m.member_code) AS total_members,
        COUNT(CASE WHEN UPPER(m.gender::text) IN ('F', 'FEMALE') THEN 1 END) AS female_members,
        COUNT(CASE WHEN UPPER(m.gender::text) IN ('M', 'MALE') THEN 1 END) AS male_members,
        COUNT(CASE WHEN g.pacs_id = 111 THEN 1 END) AS direct_members,
        COUNT(CASE WHEN g.pacs_id != 111 OR g.pacs_id IS NULL THEN 1 END) AS indirect_members,
        COUNT(CASE WHEN m.gp_leader_flag = 'Y' OR m.asst_gp_leader_flag = 'Y' THEN 1 END) AS leaders_count
      FROM bdccb.md_member m
      JOIN bdccb.md_group g ON m.group_code::text = g.group_code::text
      WHERE m.delete_flag = 'N' AND g.delete_flag = 'N' AND ${groupWhereClause}
    `;

    // ------------------------------------------------------------------------
    // D. Loans Direct & Indirect Breakdown (Rule 3 & 4)
    // Direct if branch_shg_id = 111, indirect otherwise
    // ------------------------------------------------------------------------
    const loansQuery = isSociety
      ? `
        SELECT 
          COUNT(l.loan_id) AS total_loan_count,
          COUNT(CASE WHEN l.acc_status = 'O' THEN 1 END) AS active_loan_count,
          COALESCE(SUM(l.disb_amt), 0) AS total_disb_amt,
          COALESCE(SUM(COALESCE(l.curr_prn, 0) + COALESCE(l.ovd_prn, 0) + COALESCE(l.curr_intt, 0) + COALESCE(l.ovd_intt, 0)), 0) AS total_outstanding,

          COUNT(CASE WHEN l.branch_shg_id = 111 THEN l.loan_id END) AS direct_loan_count,
          COUNT(CASE WHEN l.branch_shg_id = 111 AND l.acc_status = 'O' THEN 1 END) AS direct_active_loan_count,
          COALESCE(SUM(CASE WHEN l.branch_shg_id = 111 THEN l.disb_amt ELSE 0 END), 0) AS direct_disb_amt,
          COALESCE(SUM(CASE WHEN l.branch_shg_id = 111 THEN (COALESCE(l.curr_prn, 0) + COALESCE(l.ovd_prn, 0) + COALESCE(l.curr_intt, 0) + COALESCE(l.ovd_intt, 0)) ELSE 0 END), 0) AS direct_outstanding,

          COUNT(CASE WHEN l.branch_shg_id != 111 OR l.branch_shg_id IS NULL THEN l.loan_id END) AS indirect_loan_count,
          COUNT(CASE WHEN (l.branch_shg_id != 111 OR l.branch_shg_id IS NULL) AND l.acc_status = 'O' THEN 1 END) AS indirect_active_loan_count,
          COALESCE(SUM(CASE WHEN l.branch_shg_id != 111 OR l.branch_shg_id IS NULL THEN l.disb_amt ELSE 0 END), 0) AS indirect_disb_amt,
          COALESCE(SUM(CASE WHEN l.branch_shg_id != 111 OR l.branch_shg_id IS NULL THEN (COALESCE(l.curr_prn, 0) + COALESCE(l.ovd_prn, 0) + COALESCE(l.curr_intt, 0) + COALESCE(l.ovd_intt, 0)) ELSE 0 END), 0) AS indirect_outstanding
        FROM bdccb.td_loan l
        WHERE l.branch_shg_id = $1 OR l.group_code IN (SELECT group_code FROM bdccb.md_group WHERE delete_flag = 'N' AND pacs_id = $1)
      `
      : `
        SELECT 
          COUNT(l.loan_id) AS total_loan_count,
          COUNT(CASE WHEN l.acc_status = 'O' THEN 1 END) AS active_loan_count,
          COALESCE(SUM(l.disb_amt), 0) AS total_disb_amt,
          COALESCE(SUM(COALESCE(l.curr_prn, 0) + COALESCE(l.ovd_prn, 0) + COALESCE(l.curr_intt, 0) + COALESCE(l.ovd_intt, 0)), 0) AS total_outstanding,

          COUNT(CASE WHEN l.branch_shg_id = 111 THEN l.loan_id END) AS direct_loan_count,
          COUNT(CASE WHEN l.branch_shg_id = 111 AND l.acc_status = 'O' THEN 1 END) AS direct_active_loan_count,
          COALESCE(SUM(CASE WHEN l.branch_shg_id = 111 THEN l.disb_amt ELSE 0 END), 0) AS direct_disb_amt,
          COALESCE(SUM(CASE WHEN l.branch_shg_id = 111 THEN (COALESCE(l.curr_prn, 0) + COALESCE(l.ovd_prn, 0) + COALESCE(l.curr_intt, 0) + COALESCE(l.ovd_intt, 0)) ELSE 0 END), 0) AS direct_outstanding,

          COUNT(CASE WHEN l.branch_shg_id != 111 OR l.branch_shg_id IS NULL THEN l.loan_id END) AS indirect_loan_count,
          COUNT(CASE WHEN (l.branch_shg_id != 111 OR l.branch_shg_id IS NULL) AND l.acc_status = 'O' THEN 1 END) AS indirect_active_loan_count,
          COALESCE(SUM(CASE WHEN l.branch_shg_id != 111 OR l.branch_shg_id IS NULL THEN l.disb_amt ELSE 0 END), 0) AS indirect_disb_amt,
          COALESCE(SUM(CASE WHEN l.branch_shg_id != 111 OR l.branch_shg_id IS NULL THEN (COALESCE(l.curr_prn, 0) + COALESCE(l.ovd_prn, 0) + COALESCE(l.curr_intt, 0) + COALESCE(l.ovd_intt, 0)) ELSE 0 END), 0) AS indirect_outstanding
        FROM bdccb.td_loan l
        JOIN bdccb.md_group g ON l.group_code::text = g.group_code::text
        WHERE g.delete_flag = 'N' AND g.branch_code = $1
      `;

    // CCB loans from td_loan_ccb
    const ccbLoansQuery = isSociety
      ? `
        SELECT 
          COUNT(loan_id) AS ccb_loan_count,
          COUNT(CASE WHEN acc_status = 'O' THEN 1 END) AS ccb_active_count,
          COALESCE(SUM(disb_amt), 0) AS ccb_disb_amt,
          COALESCE(SUM(COALESCE(curr_prn, 0) + COALESCE(ovd_prn, 0) + COALESCE(curr_intt, 0) + COALESCE(ovd_intt, 0)), 0) AS ccb_outstanding
        FROM bdccb.td_loan_ccb
        WHERE branch_shg_id = $1
      `
      : `
        SELECT 
          COUNT(loan_id) AS ccb_loan_count,
          COUNT(CASE WHEN acc_status = 'O' THEN 1 END) AS ccb_active_count,
          COALESCE(SUM(disb_amt), 0) AS ccb_disb_amt,
          COALESCE(SUM(COALESCE(curr_prn, 0) + COALESCE(ovd_prn, 0) + COALESCE(curr_intt, 0) + COALESCE(ovd_intt, 0)), 0) AS ccb_outstanding
        FROM bdccb.td_loan_ccb
        WHERE branch_id = $1
      `;

    // Member loans from td_loan_member
    const memberLoansQuery = isSociety
      ? `
        SELECT 
          COUNT(loan_id) AS member_loan_count,
          COUNT(CASE WHEN acc_status = 'O' THEN 1 END) AS member_active_count,
          COALESCE(SUM(disb_amt), 0) AS member_disb_amt,
          COALESCE(SUM(COALESCE(outstanding, 0)), 0) AS member_outstanding
        FROM bdccb.td_loan_member
        WHERE branch_shg_id = $1
      `
      : `
        SELECT 
          COUNT(loan_id) AS member_loan_count,
          COUNT(CASE WHEN acc_status = 'O' THEN 1 END) AS member_active_count,
          COALESCE(SUM(disb_amt), 0) AS member_disb_amt,
          COALESCE(SUM(COALESCE(outstanding, 0)), 0) AS member_outstanding
        FROM bdccb.td_loan_member
        WHERE branch_id = $1
      `;

    // ------------------------------------------------------------------------
    // E. Deposit Accounts Summary (Rule 5)
    // Group deposits from td_deposit and Member savings from td_sb
    // ------------------------------------------------------------------------
    const depositsQuery = isSociety
      ? `
        SELECT 
          COALESCE(d.group_dep_count, 0) AS group_dep_count,
          COALESCE(d.group_dep_amount, 0) AS group_dep_amount,
          COALESCE(s.member_sb_count, 0) AS member_sb_count,
          COALESCE(s.member_sb_amount, 0) AS member_sb_amount,
          (COALESCE(d.group_dep_count, 0) + COALESCE(s.member_sb_count, 0)) AS total_deposit_accounts,
          (COALESCE(d.group_dep_amount, 0) + COALESCE(s.member_sb_amount, 0)) AS total_deposit_amount
        FROM (
          SELECT 
            COUNT(acc_no) AS group_dep_count,
            COALESCE(SUM(balance), 0) AS group_dep_amount
          FROM bdccb.td_deposit
          WHERE shg_id IN (SELECT group_code FROM bdccb.md_group WHERE delete_flag = 'N' AND pacs_id = $1)
        ) d
        CROSS JOIN (
          SELECT 
            COUNT(acc_no) AS member_sb_count,
            COALESCE(SUM(balance), 0) AS member_sb_amount
          FROM bdccb.td_sb
          WHERE shg_id IN (SELECT group_code FROM bdccb.md_group WHERE delete_flag = 'N' AND pacs_id = $1)
        ) s
      `
      : `
        SELECT 
          COALESCE(d.group_dep_count, 0) AS group_dep_count,
          COALESCE(d.group_dep_amount, 0) AS group_dep_amount,
          COALESCE(s.member_sb_count, 0) AS member_sb_count,
          COALESCE(s.member_sb_amount, 0) AS member_sb_amount,
          (COALESCE(d.group_dep_count, 0) + COALESCE(s.member_sb_count, 0)) AS total_deposit_accounts,
          (COALESCE(d.group_dep_amount, 0) + COALESCE(s.member_sb_amount, 0)) AS total_deposit_amount
        FROM (
          SELECT 
            COUNT(acc_no) AS group_dep_count,
            COALESCE(SUM(balance), 0) AS group_dep_amount
          FROM bdccb.td_deposit
          WHERE branch_id = $1
        ) d
        CROSS JOIN (
          SELECT 
            COUNT(acc_no) AS member_sb_count,
            COALESCE(SUM(balance), 0) AS member_sb_amount
          FROM bdccb.td_sb
          WHERE branch_id = $1
        ) s
      `;

    // ------------------------------------------------------------------------
    // F. Transactions Details (Rule 6: Financial Year & Month)
    // ------------------------------------------------------------------------
    // 1) CCB Loan Transactions (td_loan_ccb_trans)
    const ccbTransQuery = isSociety
      ? `
        SELECT 
          COUNT(CASE WHEN t.trans_type = 'D' THEN 1 END) AS disb_count,
          COALESCE(SUM(CASE WHEN t.trans_type = 'D' THEN t.dr_amt ELSE 0 END), 0) AS disb_amt,
          COUNT(CASE WHEN t.trans_type = 'R' THEN 1 END) AS recov_count,
          COALESCE(SUM(CASE WHEN t.trans_type = 'R' THEN t.cr_amt ELSE 0 END), 0) AS recov_amt,
          COALESCE(SUM(CASE WHEN t.trans_type = 'R' THEN t.curr_prn_recov ELSE 0 END), 0) AS prn_recov,
          COALESCE(SUM(CASE WHEN t.trans_type = 'R' THEN t.curr_intt_recov ELSE 0 END), 0) AS intt_recov
        FROM bdccb.td_loan_ccb_trans t
        WHERE t.branch_shg_id = $1
          AND t.approval_status = 'A'
          AND t.trans_dt::date BETWEEN $2 AND $3
      `
      : `
        SELECT 
          COUNT(CASE WHEN t.trans_type = 'D' THEN 1 END) AS disb_count,
          COALESCE(SUM(CASE WHEN t.trans_type = 'D' THEN t.dr_amt ELSE 0 END), 0) AS disb_amt,
          COUNT(CASE WHEN t.trans_type = 'R' THEN 1 END) AS recov_count,
          COALESCE(SUM(CASE WHEN t.trans_type = 'R' THEN t.cr_amt ELSE 0 END), 0) AS recov_amt,
          COALESCE(SUM(CASE WHEN t.trans_type = 'R' THEN t.curr_prn_recov ELSE 0 END), 0) AS prn_recov,
          COALESCE(SUM(CASE WHEN t.trans_type = 'R' THEN t.curr_intt_recov ELSE 0 END), 0) AS intt_recov
        FROM bdccb.td_loan_ccb_trans t
        JOIN bdccb.td_loan_ccb l ON t.loan_id = l.loan_id
        WHERE l.branch_id = $1
          AND t.approval_status = 'A'
          AND t.trans_dt::date BETWEEN $2 AND $3
      `;

    // 2) Society Loan Transactions (td_loan_transactions)
    const socTransQuery = isSociety
      ? `
        SELECT 
          COUNT(CASE WHEN t.trans_type = 'D' THEN 1 END) AS disb_count,
          COALESCE(SUM(CASE WHEN t.trans_type = 'D' THEN t.dr_amt ELSE 0 END), 0) AS disb_amt,
          COUNT(CASE WHEN t.trans_type = 'R' THEN 1 END) AS recov_count,
          COALESCE(SUM(CASE WHEN t.trans_type = 'R' THEN t.cr_amt ELSE 0 END), 0) AS recov_amt,
          COALESCE(SUM(CASE WHEN t.trans_type = 'R' THEN t.curr_prn_recov ELSE 0 END), 0) AS prn_recov,
          COALESCE(SUM(CASE WHEN t.trans_type = 'R' THEN t.curr_intt_recov ELSE 0 END), 0) AS intt_recov
        FROM bdccb.td_loan_transactions t
        WHERE t.branch_shg_id = $1
          AND t.approval_status = 'A'
          AND t.trans_dt::date BETWEEN $2 AND $3
      `
      : `
        SELECT 
          COUNT(CASE WHEN t.trans_type = 'D' THEN 1 END) AS disb_count,
          COALESCE(SUM(CASE WHEN t.trans_type = 'D' THEN t.dr_amt ELSE 0 END), 0) AS disb_amt,
          COUNT(CASE WHEN t.trans_type = 'R' THEN 1 END) AS recov_count,
          COALESCE(SUM(CASE WHEN t.trans_type = 'R' THEN t.cr_amt ELSE 0 END), 0) AS recov_amt,
          COALESCE(SUM(CASE WHEN t.trans_type = 'R' THEN t.curr_prn_recov ELSE 0 END), 0) AS prn_recov,
          COALESCE(SUM(CASE WHEN t.trans_type = 'R' THEN t.curr_intt_recov ELSE 0 END), 0) AS intt_recov
        FROM bdccb.td_loan_transactions t
        JOIN bdccb.td_loan l ON t.loan_id = l.loan_id
        WHERE l.branch_id = $1
          AND t.approval_status = 'A'
          AND t.trans_dt::date BETWEEN $2 AND $3
      `;

    // 3) Member Loan Transactions (td_loan_member_trans)
    const memTransQuery = isSociety
      ? `
        SELECT 
          COUNT(CASE WHEN t.trans_type = 'D' THEN 1 END) AS disb_count,
          COALESCE(SUM(CASE WHEN t.trans_type = 'D' THEN t.dr_amt ELSE 0 END), 0) AS disb_amt,
          COUNT(CASE WHEN t.trans_type = 'R' THEN 1 END) AS recov_count,
          COALESCE(SUM(CASE WHEN t.trans_type = 'R' THEN t.cr_amt ELSE 0 END), 0) AS recov_amt,
          COALESCE(SUM(CASE WHEN t.trans_type = 'R' THEN t.curr_prn_recov ELSE 0 END), 0) AS prn_recov,
          COALESCE(SUM(CASE WHEN t.trans_type = 'R' THEN t.curr_intt_recov ELSE 0 END), 0) AS intt_recov
        FROM bdccb.td_loan_member_trans t
        WHERE t.branch_shg_id = $1
          AND t.approval_status = 'A'
          AND t.trans_date::date BETWEEN $2 AND $3
      `
      : `
        SELECT 
          COUNT(CASE WHEN t.trans_type = 'D' THEN 1 END) AS disb_count,
          COALESCE(SUM(CASE WHEN t.trans_type = 'D' THEN t.dr_amt ELSE 0 END), 0) AS disb_amt,
          COUNT(CASE WHEN t.trans_type = 'R' THEN 1 END) AS recov_count,
          COALESCE(SUM(CASE WHEN t.trans_type = 'R' THEN t.cr_amt ELSE 0 END), 0) AS recov_amt,
          COALESCE(SUM(CASE WHEN t.trans_type = 'R' THEN t.curr_prn_recov ELSE 0 END), 0) AS prn_recov,
          COALESCE(SUM(CASE WHEN t.trans_type = 'R' THEN t.curr_intt_recov ELSE 0 END), 0) AS intt_recov
        FROM bdccb.td_loan_member_trans t
        WHERE t.branch_id = $1
          AND t.approval_status = 'A'
          AND t.trans_date::date BETWEEN $2 AND $3
      `;

    // 4) Group Deposit Transactions (td_deposit_trans)
    const grpDepTransQuery = isSociety
      ? `
        SELECT 
          COUNT(CASE WHEN dt.dep_with_flag = 'D' OR dt.cr_amt > 0 THEN 1 END) AS dep_count,
          COALESCE(SUM(CASE WHEN dt.dep_with_flag = 'D' OR dt.cr_amt > 0 THEN dt.cr_amt ELSE 0 END), 0) AS dep_amt,
          COUNT(CASE WHEN dt.dep_with_flag = 'W' OR dt.dr_amt > 0 THEN 1 END) AS with_count,
          COALESCE(SUM(CASE WHEN dt.dep_with_flag = 'W' OR dt.dr_amt > 0 THEN dt.dr_amt ELSE 0 END), 0) AS with_amt
        FROM bdccb.td_deposit_trans dt
        WHERE dt.shg_id IN (SELECT group_code FROM bdccb.md_group WHERE delete_flag = 'N' AND pacs_id = $1)
          AND dt.trans_dt::date BETWEEN $2 AND $3
      `
      : `
        SELECT 
          COUNT(CASE WHEN dt.dep_with_flag = 'D' OR dt.cr_amt > 0 THEN 1 END) AS dep_count,
          COALESCE(SUM(CASE WHEN dt.dep_with_flag = 'D' OR dt.cr_amt > 0 THEN dt.cr_amt ELSE 0 END), 0) AS dep_amt,
          COUNT(CASE WHEN dt.dep_with_flag = 'W' OR dt.dr_amt > 0 THEN 1 END) AS with_count,
          COALESCE(SUM(CASE WHEN dt.dep_with_flag = 'W' OR dt.dr_amt > 0 THEN dt.dr_amt ELSE 0 END), 0) AS with_amt
        FROM bdccb.td_deposit_trans dt
        WHERE dt.branch_id = $1
          AND dt.trans_dt::date BETWEEN $2 AND $3
      `;

    // 5) Member Savings Transactions (td_sb_trans)
    const memSbTransQuery = isSociety
      ? `
        SELECT 
          COUNT(CASE WHEN st.dep_with_flag = 'D' OR st.cr_amt > 0 THEN 1 END) AS dep_count,
          COALESCE(SUM(CASE WHEN st.dep_with_flag = 'D' OR st.cr_amt > 0 THEN st.cr_amt ELSE 0 END), 0) AS dep_amt,
          COUNT(CASE WHEN st.dep_with_flag = 'W' OR st.dr_amt > 0 THEN 1 END) AS with_count,
          COALESCE(SUM(CASE WHEN st.dep_with_flag = 'W' OR st.dr_amt > 0 THEN st.dr_amt ELSE 0 END), 0) AS with_amt
        FROM bdccb.td_sb_trans st
        WHERE st.shg_id IN (SELECT group_code FROM bdccb.md_group WHERE delete_flag = 'N' AND pacs_id = $1)
          AND st.trans_dt::date BETWEEN $2 AND $3
      `
      : `
        SELECT 
          COUNT(CASE WHEN st.dep_with_flag = 'D' OR st.cr_amt > 0 THEN 1 END) AS dep_count,
          COALESCE(SUM(CASE WHEN st.dep_with_flag = 'D' OR st.cr_amt > 0 THEN st.cr_amt ELSE 0 END), 0) AS dep_amt,
          COUNT(CASE WHEN st.dep_with_flag = 'W' OR st.dr_amt > 0 THEN 1 END) AS with_count,
          COALESCE(SUM(CASE WHEN st.dep_with_flag = 'W' OR st.dr_amt > 0 THEN st.dr_amt ELSE 0 END), 0) AS with_amt
        FROM bdccb.td_sb_trans st
        WHERE st.branch_id = $1
          AND st.trans_dt::date BETWEEN $2 AND $3
      `;

    // ------------------------------------------------------------------------
    // G. 12-Month Matrix for the Financial Year (April - March)
    // ------------------------------------------------------------------------

    const monthlyBreakdownQuery = isSociety
      ? `
        SELECT 
          TO_CHAR(d.m_date, 'YYYY-MM') AS month_key,
          TO_CHAR(d.m_date, 'Mon YYYY') AS month_name,
          EXTRACT(MONTH FROM d.m_date) AS month_num,
          EXTRACT(YEAR FROM d.m_date) AS year_num,
          COALESCE(disb.amount, 0) AS loan_disbursed,
          COALESCE(recov.amount, 0) AS loan_recovery,
          COALESCE(sb_dep.amount, 0) AS sb_deposit,
          COALESCE(sb_with.amount, 0) AS sb_withdrawal
        FROM generate_series($2::date, $3::date, '1 month'::interval) d(m_date)
        LEFT JOIN (
          SELECT 
            DATE_TRUNC('month', t.trans_dt)::date AS m_start,
            SUM(COALESCE(t.dr_amt, 0)) AS amount
          FROM bdccb.td_loan_transactions t
          WHERE t.branch_shg_id = $1 AND t.trans_type = 'D' AND t.approval_status = 'A'
          GROUP BY 1
        ) disb ON DATE_TRUNC('month', d.m_date)::date = disb.m_start
        LEFT JOIN (
          SELECT 
            DATE_TRUNC('month', t.trans_dt)::date AS m_start,
            SUM(COALESCE(t.cr_amt, 0)) AS amount
          FROM bdccb.td_loan_transactions t
          WHERE t.branch_shg_id = $1 AND t.trans_type = 'R' AND t.approval_status = 'A'
          GROUP BY 1
        ) recov ON DATE_TRUNC('month', d.m_date)::date = recov.m_start
        LEFT JOIN (
          SELECT 
            m_start,
            SUM(amount) AS amount
          FROM (
            SELECT 
              DATE_TRUNC('month', dt.trans_dt)::date AS m_start,
              SUM(COALESCE(dt.cr_amt, 0)) AS amount
            FROM bdccb.td_deposit_trans dt
            WHERE dt.shg_id IN (SELECT group_code FROM bdccb.md_group WHERE delete_flag = 'N' AND pacs_id = $1)
              AND (dt.dep_with_flag = 'D' OR dt.cr_amt > 0)
            GROUP BY 1
            UNION ALL
            SELECT 
              DATE_TRUNC('month', st.trans_dt)::date AS m_start,
              SUM(COALESCE(st.cr_amt, 0)) AS amount
            FROM bdccb.td_sb_trans st
            WHERE st.shg_id IN (SELECT group_code FROM bdccb.md_group WHERE delete_flag = 'N' AND pacs_id = $1)
              AND (st.dep_with_flag = 'D' OR st.cr_amt > 0)
            GROUP BY 1
          ) d_all GROUP BY 1
        ) sb_dep ON DATE_TRUNC('month', d.m_date)::date = sb_dep.m_start
        LEFT JOIN (
          SELECT 
            m_start,
            SUM(amount) AS amount
          FROM (
            SELECT 
              DATE_TRUNC('month', dt.trans_dt)::date AS m_start,
              SUM(COALESCE(dt.dr_amt, 0)) AS amount
            FROM bdccb.td_deposit_trans dt
            WHERE dt.shg_id IN (SELECT group_code FROM bdccb.md_group WHERE delete_flag = 'N' AND pacs_id = $1)
              AND (dt.dep_with_flag = 'W' OR dt.dr_amt > 0)
            GROUP BY 1
            UNION ALL
            SELECT 
              DATE_TRUNC('month', st.trans_dt)::date AS m_start,
              SUM(COALESCE(st.dr_amt, 0)) AS amount
            FROM bdccb.td_sb_trans st
            WHERE st.shg_id IN (SELECT group_code FROM bdccb.md_group WHERE delete_flag = 'N' AND pacs_id = $1)
              AND (st.dep_with_flag = 'W' OR st.dr_amt > 0)
            GROUP BY 1
          ) w_all GROUP BY 1
        ) sb_with ON DATE_TRUNC('month', d.m_date)::date = sb_with.m_start
        ORDER BY d.m_date ASC
      `
      : `
        SELECT 
          TO_CHAR(d.m_date, 'YYYY-MM') AS month_key,
          TO_CHAR(d.m_date, 'Mon YYYY') AS month_name,
          EXTRACT(MONTH FROM d.m_date) AS month_num,
          EXTRACT(YEAR FROM d.m_date) AS year_num,
          COALESCE(disb.amount, 0) AS loan_disbursed,
          COALESCE(recov.amount, 0) AS loan_recovery,
          COALESCE(sb_dep.amount, 0) AS sb_deposit,
          COALESCE(sb_with.amount, 0) AS sb_withdrawal
        FROM generate_series($2::date, $3::date, '1 month'::interval) d(m_date)
        LEFT JOIN (
          SELECT 
            DATE_TRUNC('month', t.trans_dt)::date AS m_start,
            SUM(COALESCE(t.dr_amt, 0)) AS amount
          FROM bdccb.td_loan_transactions t
          JOIN bdccb.td_loan l ON t.loan_id = l.loan_id
          WHERE l.branch_id = $1 AND t.trans_type = 'D' AND t.approval_status = 'A'
          GROUP BY 1
        ) disb ON DATE_TRUNC('month', d.m_date)::date = disb.m_start
        LEFT JOIN (
          SELECT 
            DATE_TRUNC('month', t.trans_dt)::date AS m_start,
            SUM(COALESCE(t.cr_amt, 0)) AS amount
          FROM bdccb.td_loan_transactions t
          JOIN bdccb.td_loan l ON t.loan_id = l.loan_id
          WHERE l.branch_id = $1 AND t.trans_type = 'R' AND t.approval_status = 'A'
          GROUP BY 1
        ) recov ON DATE_TRUNC('month', d.m_date)::date = recov.m_start
        LEFT JOIN (
          SELECT 
            m_start,
            SUM(amount) AS amount
          FROM (
            SELECT 
              DATE_TRUNC('month', dt.trans_dt)::date AS m_start,
              SUM(COALESCE(dt.cr_amt, 0)) AS amount
            FROM bdccb.td_deposit_trans dt
            WHERE dt.branch_id = $1 AND (dt.dep_with_flag = 'D' OR dt.cr_amt > 0)
            GROUP BY 1
            UNION ALL
            SELECT 
              DATE_TRUNC('month', st.trans_dt)::date AS m_start,
              SUM(COALESCE(st.cr_amt, 0)) AS amount
            FROM bdccb.td_sb_trans st
            WHERE st.branch_id = $1 AND (st.dep_with_flag = 'D' OR st.cr_amt > 0)
            GROUP BY 1
          ) d_all GROUP BY 1
        ) sb_dep ON DATE_TRUNC('month', d.m_date)::date = sb_dep.m_start
        LEFT JOIN (
          SELECT 
            m_start,
            SUM(amount) AS amount
          FROM (
            SELECT 
              DATE_TRUNC('month', dt.trans_dt)::date AS m_start,
              SUM(COALESCE(dt.dr_amt, 0)) AS amount
            FROM bdccb.td_deposit_trans dt
            WHERE dt.branch_id = $1 AND (dt.dep_with_flag = 'W' OR dt.dr_amt > 0)
            GROUP BY 1
            UNION ALL
            SELECT 
              DATE_TRUNC('month', st.trans_dt)::date AS m_start,
              SUM(COALESCE(st.dr_amt, 0)) AS amount
            FROM bdccb.td_sb_trans st
            WHERE st.branch_id = $1 AND (st.dep_with_flag = 'W' OR st.dr_amt > 0)
            GROUP BY 1
          ) w_all GROUP BY 1
        ) sb_with ON DATE_TRUNC('month', d.m_date)::date = sb_with.m_start
        ORDER BY d.m_date ASC
      `;

    // ------------------------------------------------------------------------
    // H. Associated Groups Directory (with Member Focus)
    // ------------------------------------------------------------------------
    const groupsListQuery = `
      SELECT 
        g.group_code,
        g.group_name,
        g.grp_open_dt,
        g.open_close_flag,
        g.pacs_id,
        CASE WHEN g.pacs_id = 111 THEN 'D' ELSE 'I' END AS direct_indirect_flag,
        COALESCE(b.branch_name, 'Branch ' || g.branch_code::text) AS branch_name,
        COALESCE(p.branch_name, 'Direct') AS pacs_name,
        COALESCE(m.member_count, 0) AS member_count,
        COALESCE(m.leaders_count, 0) AS leaders_count,
        COALESCE(dep.balance, 0) AS group_savings_balance,
        COALESCE(l.disb_amt, 0) AS loan_disb_amt,
        COALESCE(l.outstanding, 0) AS loan_outstanding
      FROM bdccb.md_group g
      LEFT JOIN public.md_branch b ON g.branch_code = b.branch_id
      LEFT JOIN public.md_branch p ON g.pacs_id = p.branch_id
      LEFT JOIN (
        SELECT 
          group_code, 
          COUNT(member_code) AS member_count,
          COUNT(CASE WHEN gp_leader_flag = 'Y' OR asst_gp_leader_flag = 'Y' THEN 1 END) AS leaders_count
        FROM bdccb.md_member
        WHERE delete_flag = 'N'
        GROUP BY group_code
      ) m ON g.group_code::text = m.group_code::text
      LEFT JOIN (
        SELECT shg_id, SUM(COALESCE(balance, 0)) AS balance
        FROM bdccb.td_deposit
        GROUP BY shg_id
      ) dep ON g.group_code::text = dep.shg_id::text
      LEFT JOIN (
        SELECT 
          group_code,
          SUM(COALESCE(disb_amt, 0)) AS disb_amt,
          SUM(COALESCE(curr_prn, 0) + COALESCE(ovd_prn, 0) + COALESCE(curr_intt, 0) + COALESCE(ovd_intt, 0)) AS outstanding
        FROM bdccb.td_loan
        GROUP BY group_code
      ) l ON g.group_code::text = l.group_code::text
      WHERE g.delete_flag = 'N' AND ${groupWhereClause}
      ORDER BY g.open_close_flag ASC, g.group_code ASC
      LIMIT 150
    `;

    // Execute queries in parallel
    const [
      profileRes,
      groupsRes,
      loaneeGroupsRes,
      membersRes,
      loansRes,
      ccbLoansRes,
      memberLoansRes,
      depositsRes,
      ccbTransRes,
      socTransRes,
      memTransRes,
      grpDepTransRes,
      memSbTransRes,
      monthlyRes,
      groupsListRes
    ] = await Promise.all([
      pgdb.query(profileQuery, [targetId]),
      pgdb.query(groupsQuery, [targetId]),
      pgdb.query(loaneeGroupsQuery, [targetId]),
      pgdb.query(membersQuery, [targetId]),
      pgdb.query(loansQuery, [targetId]),
      pgdb.query(ccbLoansQuery, [targetId]),
      pgdb.query(memberLoansQuery, [targetId]),
      pgdb.query(depositsQuery, [targetId]),
      pgdb.query(ccbTransQuery, [targetId, fromDate, toDate]),
      pgdb.query(socTransQuery, [targetId, fromDate, toDate]),
      pgdb.query(memTransQuery, [targetId, fromDate, toDate]),
      pgdb.query(grpDepTransQuery, [targetId, fromDate, toDate]),
      pgdb.query(memSbTransQuery, [targetId, fromDate, toDate]),
      pgdb.query(monthlyBreakdownQuery, [targetId, fyFromDate, fyToDate]),
      pgdb.query(groupsListQuery, [targetId])
    ]);

    const profileData = profileRes.rows[0] || {};
    const groupsData = groupsRes.rows[0] || {};
    const loaneeData = loaneeGroupsRes.rows[0] || {};
    const membersData = membersRes.rows[0] || {};
    const loansData = loansRes.rows[0] || {};
    const ccbLoansData = ccbLoansRes.rows[0] || {};
    const memberLoansData = memberLoansRes.rows[0] || {};
    const depositsData = depositsRes.rows[0] || {};

    const ccbTrans = ccbTransRes.rows[0] || {};
    const socTrans = socTransRes.rows[0] || {};
    const memTrans = memTransRes.rows[0] || {};
    const grpDepTrans = grpDepTransRes.rows[0] || {};
    const memSbTrans = memSbTransRes.rows[0] || {};

    // Calculate aggregated loan transaction metrics
    const totalDisbAmt =
      (parseFloat(ccbTrans.disb_amt) || 0) +
      (parseFloat(socTrans.disb_amt) || 0) +
      (parseFloat(memTrans.disb_amt) || 0);

    const totalDisbCount =
      (parseInt(ccbTrans.disb_count, 10) || 0) +
      (parseInt(socTrans.disb_count, 10) || 0) +
      (parseInt(memTrans.disb_count, 10) || 0);

    const totalRecovAmt =
      (parseFloat(ccbTrans.recov_amt) || 0) +
      (parseFloat(socTrans.recov_amt) || 0) +
      (parseFloat(memTrans.recov_amt) || 0);

    const totalRecovCount =
      (parseInt(ccbTrans.recov_count, 10) || 0) +
      (parseInt(socTrans.recov_count, 10) || 0) +
      (parseInt(memTrans.recov_count, 10) || 0);

    const totalPrnRecov =
      (parseFloat(ccbTrans.prn_recov) || 0) +
      (parseFloat(socTrans.prn_recov) || 0) +
      (parseFloat(memTrans.prn_recov) || 0);

    const totalInttRecov =
      (parseFloat(ccbTrans.intt_recov) || 0) +
      (parseFloat(socTrans.intt_recov) || 0) +
      (parseFloat(memTrans.intt_recov) || 0);

    // Calculate aggregated SB transactions metrics
    const totalSbDepAmt =
      (parseFloat(grpDepTrans.dep_amt) || 0) +
      (parseFloat(memSbTrans.dep_amt) || 0);

    const totalSbDepCount =
      (parseInt(grpDepTrans.dep_count, 10) || 0) +
      (parseInt(memSbTrans.dep_count, 10) || 0);

    const totalSbWithAmt =
      (parseFloat(grpDepTrans.with_amt) || 0) +
      (parseFloat(memSbTrans.with_amt) || 0);

    const totalSbWithCount =
      (parseInt(grpDepTrans.with_count, 10) || 0) +
      (parseInt(memSbTrans.with_count, 10) || 0);

    return res.json({
      success: true,
      suc: 1,
      view_mode,
      target_id: targetId,
      profile: {
        id: targetId,
        name: isSociety ? (profileData.pacs_name || `Society ${targetId}`) : (profileData.branch_name || `Branch ${targetId}`),
        address: profileData.branch_address || "N/A",
        contact_person: profileData.contact_person || "N/A",
        phone: profileData.branch_phone && profileData.branch_phone !== "0" ? profileData.branch_phone : "N/A",
        pin_no: profileData.pin_no && profileData.pin_no !== "0" ? profileData.pin_no : "N/A",
        parent_branch: isSociety ? (profileData.branch_name || "N/A") : null,
        parent_branch_code: isSociety ? (profileData.branch_code || null) : null
      },
      period: {
        financial_year,
        month,
        from_date: fromDate,
        to_date: toDate
      },
      // 1. Groups Summary
      groups_summary: {
        total_groups: parseInt(groupsData.total_groups, 10) || 0,
        active_groups: parseInt(groupsData.active_groups, 10) || 0,
        closed_groups: parseInt(groupsData.closed_groups, 10) || 0,
        direct_groups: parseInt(groupsData.direct_groups, 10) || 0,
        indirect_groups: parseInt(groupsData.indirect_groups, 10) || 0,
        loanee_groups: parseInt(loaneeData.loanee_groups, 10) || 0
      },
      // 2. Members Summary
      members_summary: {
        total_members: parseInt(membersData.total_members, 10) || 0,
        female_members: parseInt(membersData.female_members, 10) || 0,
        male_members: parseInt(membersData.male_members, 10) || 0,
        direct_members: parseInt(membersData.direct_members, 10) || 0,
        indirect_members: parseInt(membersData.indirect_members, 10) || 0,
        leaders_count: parseInt(membersData.leaders_count, 10) || 0
      },
      // 3 & 4. Loans Direct & Indirect Breakdown + CCB & Member loans
      loans_summary: {
        // Grand totals from td_loan
        total_loan_count: parseInt(loansData.total_loan_count, 10) || 0,
        active_loan_count: parseInt(loansData.active_loan_count, 10) || 0,
        total_disb_amt: parseFloat(loansData.total_disb_amt) || 0,
        total_outstanding: parseFloat(loansData.total_outstanding) || 0,

        // Direct loans (branch_shg_id = 111)
        direct_loan_count: parseInt(loansData.direct_loan_count, 10) || 0,
        direct_active_loan_count: parseInt(loansData.direct_active_loan_count, 10) || 0,
        direct_disb_amt: parseFloat(loansData.direct_disb_amt) || 0,
        direct_outstanding: parseFloat(loansData.direct_outstanding) || 0,

        // Indirect loans (branch_shg_id != 111)
        indirect_loan_count: parseInt(loansData.indirect_loan_count, 10) || 0,
        indirect_active_loan_count: parseInt(loansData.indirect_active_loan_count, 10) || 0,
        indirect_disb_amt: parseFloat(loansData.indirect_disb_amt) || 0,
        indirect_outstanding: parseFloat(loansData.indirect_outstanding) || 0,

        // CCB Loans (td_loan_ccb)
        ccb_loan_count: parseInt(ccbLoansData.ccb_loan_count, 10) || 0,
        ccb_active_count: parseInt(ccbLoansData.ccb_active_count, 10) || 0,
        ccb_disb_amt: parseFloat(ccbLoansData.ccb_disb_amt) || 0,
        ccb_outstanding: parseFloat(ccbLoansData.ccb_outstanding) || 0,

        // Member Loans (td_loan_member)
        member_loan_count: parseInt(memberLoansData.member_loan_count, 10) || 0,
        member_active_count: parseInt(memberLoansData.member_active_count, 10) || 0,
        member_disb_amt: parseFloat(memberLoansData.member_disb_amt) || 0,
        member_outstanding: parseFloat(memberLoansData.member_outstanding) || 0
      },
      // 5. Deposit Accounts Summary
      deposits_summary: {
        group_dep_count: parseInt(depositsData.group_dep_count, 10) || 0,
        group_dep_amount: parseFloat(depositsData.group_dep_amount) || 0,
        member_sb_count: parseInt(depositsData.member_sb_count, 10) || 0,
        member_sb_amount: parseFloat(depositsData.member_sb_amount) || 0,
        total_deposit_accounts: parseInt(depositsData.total_deposit_accounts, 10) || 0,
        total_deposit_amount: parseFloat(depositsData.total_deposit_amount) || 0
      },
      // 6. Period Transactions Details
      transactions_details: {
        // Grand totals
        total_disb_amt: totalDisbAmt,
        total_disb_count: totalDisbCount,
        total_recov_amt: totalRecovAmt,
        total_recov_count: totalRecovCount,
        total_prn_recov: totalPrnRecov,
        total_intt_recov: totalInttRecov,

        total_sb_dep_amt: totalSbDepAmt,
        total_sb_dep_count: totalSbDepCount,
        total_sb_with_amt: totalSbWithAmt,
        total_sb_with_count: totalSbWithCount,
        sb_net_flow: totalSbDepAmt - totalSbWithAmt,

        // CCB Level Breakdown
        ccb_trans: {
          disb_amt: parseFloat(ccbTrans.disb_amt) || 0,
          disb_count: parseInt(ccbTrans.disb_count, 10) || 0,
          recov_amt: parseFloat(ccbTrans.recov_amt) || 0,
          recov_count: parseInt(ccbTrans.recov_count, 10) || 0,
          prn_recov: parseFloat(ccbTrans.prn_recov) || 0,
          intt_recov: parseFloat(ccbTrans.intt_recov) || 0
        },
        // Society Level Breakdown
        society_trans: {
          disb_amt: parseFloat(socTrans.disb_amt) || 0,
          disb_count: parseInt(socTrans.disb_count, 10) || 0,
          recov_amt: parseFloat(socTrans.recov_amt) || 0,
          recov_count: parseInt(socTrans.recov_count, 10) || 0,
          prn_recov: parseFloat(socTrans.prn_recov) || 0,
          intt_recov: parseFloat(socTrans.intt_recov) || 0
        },
        // Member Level Breakdown
        member_trans: {
          disb_amt: parseFloat(memTrans.disb_amt) || 0,
          disb_count: parseInt(memTrans.disb_count, 10) || 0,
          recov_amt: parseFloat(memTrans.recov_amt) || 0,
          recov_count: parseInt(memTrans.recov_count, 10) || 0,
          prn_recov: parseFloat(memTrans.prn_recov) || 0,
          intt_recov: parseFloat(memTrans.intt_recov) || 0
        },
        // Group SB Breakdown
        group_deposit_trans: {
          dep_amt: parseFloat(grpDepTrans.dep_amt) || 0,
          dep_count: parseInt(grpDepTrans.dep_count, 10) || 0,
          with_amt: parseFloat(grpDepTrans.with_amt) || 0,
          with_count: parseInt(grpDepTrans.with_count, 10) || 0
        },
        // Member SB Breakdown
        member_sb_trans: {
          dep_amt: parseFloat(memSbTrans.dep_amt) || 0,
          dep_count: parseInt(memSbTrans.dep_count, 10) || 0,
          with_amt: parseFloat(memSbTrans.with_amt) || 0,
          with_count: parseInt(memSbTrans.with_count, 10) || 0
        }
      },
      // 7. Monthly Matrix for 12 months (April - March)
      monthly_matrix: monthlyRes.rows || [],
      // 8. Associated Groups Directory
      groups_list: groupsListRes.rows || []
    });
  } catch (err) {
    console.error("Error in get_society_branch_analytics (societyinfoRouter):", err);
    return res.status(500).json({
      success: false,
      suc: 0,
      msg: "Failed to fetch complete analytics",
      error: err.message
    });
  }
});

/**
 * 3. Fetch Associated Groups Only (for pagination or dedicated search)
 * POST /v1/societyinfo/get_society_groups
 */
societyinfoRouter.post("/get_society_groups", async (req, res) => {
  try {
    const { view_mode = "branch", branch_code = "", pacs_id = "", query = "" } = req.body;
    const isSociety = (view_mode === "society");
    const targetId = isSociety ? String(pacs_id || "") : String(branch_code || "");

    if (!targetId) {
      return res.status(400).json({ success: false, suc: 0, msg: "Missing branch or society ID" });
    }

    const scopeClause = isSociety ? `g.pacs_id = $1` : `g.branch_code = $1`;
    let searchClause = "";
    const params = [targetId];

    if (query && query.trim()) {
      params.push(`%${query.trim()}%`);
      searchClause = `AND (g.group_name ILIKE $2 OR g.group_code::text ILIKE $2)`;
    }

    const sql = `
      SELECT 
        g.group_code,
        g.group_name,
        g.grp_open_dt,
        g.open_close_flag,
        g.pacs_id,
        CASE WHEN g.pacs_id = 111 THEN 'D' ELSE 'I' END AS direct_indirect_flag,
        COALESCE(b.branch_name, 'Branch ' || g.branch_code::text) AS branch_name,
        COALESCE(p.branch_name, 'Direct') AS pacs_name,
        COALESCE(m.member_count, 0) AS member_count,
        COALESCE(m.leaders_count, 0) AS leaders_count,
        COALESCE(dep.balance, 0) AS group_savings_balance,
        COALESCE(l.disb_amt, 0) AS loan_disb_amt,
        COALESCE(l.outstanding, 0) AS loan_outstanding
      FROM bdccb.md_group g
      LEFT JOIN public.md_branch b ON g.branch_code = b.branch_id
      LEFT JOIN public.md_branch p ON g.pacs_id = p.branch_id
      LEFT JOIN (
        SELECT 
          group_code, 
          COUNT(member_code) AS member_count,
          COUNT(CASE WHEN gp_leader_flag = 'Y' OR asst_gp_leader_flag = 'Y' THEN 1 END) AS leaders_count
        FROM bdccb.md_member
        WHERE delete_flag = 'N'
        GROUP BY group_code
      ) m ON g.group_code::text = m.group_code::text
      LEFT JOIN (
        SELECT shg_id, SUM(COALESCE(balance, 0)) AS balance
        FROM bdccb.td_deposit
        GROUP BY shg_id
      ) dep ON g.group_code::text = dep.shg_id::text
      LEFT JOIN (
        SELECT 
          group_code,
          SUM(COALESCE(disb_amt, 0)) AS disb_amt,
          SUM(COALESCE(curr_prn, 0) + COALESCE(ovd_prn, 0) + COALESCE(curr_intt, 0) + COALESCE(ovd_intt, 0)) AS outstanding
        FROM bdccb.td_loan
        GROUP BY group_code
      ) l ON g.group_code::text = l.group_code::text
      WHERE g.delete_flag = 'N' AND ${scopeClause} ${searchClause}
      ORDER BY g.open_close_flag ASC, g.group_code ASC
      LIMIT 200
    `;

    const result = await pgdb.query(sql, params);
    return res.json({
      success: true,
      suc: 1,
      groups: result.rows || []
    });
  } catch (err) {
    console.error("Error in get_society_groups (societyinfoRouter):", err);
    return res.status(500).json({
      success: false,
      suc: 0,
      msg: "Failed to fetch groups list",
      error: err.message
    });
  }
});

module.exports = { societyinfoRouter };
