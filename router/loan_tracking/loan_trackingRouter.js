const express = require("express");
const loanTrackingRouter = express.Router();
const pgdb = require("../../db/pgdb");

/**
 * 1. Fetch Branches and Societies for Dropdowns
 * GET or POST /v1/loantracking/get_branches_and_societies
 */
loanTrackingRouter.all("/get_branches_and_societies", async (req, res) => {
  try {
    const branchRes = await pgdb.query(`
      SELECT branch_id, branch_name, branch_type, branch_address, contact_person, branch_phone
      FROM public.md_branch 
      WHERE branch_type IN ('B') AND branch_status = 'O'
      ORDER BY branch_id::integer ASC
    `);

    const pacsRes = await pgdb.query(`
      SELECT 
        p.branch_id AS pacs_id, 
        p.branch_name AS pacs_name,
        p.branch_type
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
    console.error("Error in get_branches_and_societies (loan_tracking):", err);
    return res.status(500).json({
      success: false,
      suc: 0,
      msg: "Failed to fetch branches and societies",
      error: err.message
    });
  }
});

/**
 * Helper to construct flexible whitespace-insensitive and token-aware group search condition.
 * Handles cases where database has multiple spaces (e.g. 'ARIYAN  SHG') or user copies text with single space.
 */
function buildLoanTrackingQueryCondition(rawQuery, params, includeBranchPacs = false) {
  const normalized = String(rawQuery).trim().replace(/\s+/g, ' ');
  const tokens = normalized.split(' ').filter(Boolean);

  params.push(`%${normalized}%`);
  const phraseIdx = params.length;

  let tokenCondition = '';
  if (tokens.length > 1) {
    const tokenClauses = tokens.map(t => {
      params.push(`%${t}%`);
      const tIdx = params.length;
      return `(g.group_code::text ILIKE $${tIdx} OR regexp_replace(trim(g.group_name), '\\s+', ' ', 'g') ILIKE $${tIdx})`;
    });
    tokenCondition = ` OR (${tokenClauses.join(' AND ')})`;
  }

  const loanAccSubquery = `
    EXISTS (
      SELECT 1 FROM bdccb.td_loan lchk 
      WHERE (lchk.group_code::text = g.group_code::text OR lchk.branch_shg_id::text = g.group_code::text)
        AND lchk.loan_acc_no::text ILIKE $${phraseIdx}
        AND lchk.acc_status = 'O'
    )
  `;

  if (includeBranchPacs) {
    return `(
      g.group_code::text ILIKE $${phraseIdx} OR 
      regexp_replace(trim(g.group_name), '\\s+', ' ', 'g') ILIKE $${phraseIdx} OR 
      b.branch_name ILIKE $${phraseIdx} OR 
      p.branch_name ILIKE $${phraseIdx} OR
      ${loanAccSubquery}
      ${tokenCondition}
    )`;
  }

  return `(
    g.group_code::text ILIKE $${phraseIdx} OR 
    regexp_replace(trim(g.group_name), '\\s+', ' ', 'g') ILIKE $${phraseIdx} OR 
    ${loanAccSubquery}
    ${tokenCondition}
  )`;
}

/**
 * 2. Search Groups & Loan Tracking Information
 * POST /v1/loantracking/search_loan_tracking
 * 
 * Body parameters:
 *  - search_type: 'group' | 'branch' | 'society' | 'all'
 *  - query: string (group code, group name, or loan account no)
 *  - branch_code: string / number (branch_id)
 *  - pacs_id: string / number (pacs_id)
 *  - page: number (default 1)
 *  - limit: number (default 100)
 */
loanTrackingRouter.post("/search_loan_tracking", async (req, res) => {
  try {
    const {
      search_type = 'all',
      query = '',
      branch_code = '',
      pacs_id = '',
      page = 1,
      limit = 100
    } = req.body;

    const conditions = ["g.delete_flag = 'N'"];
    const params = [];

    // Filter by Search Type
    if (search_type === 'group' && query && String(query).trim()) {
      conditions.push(buildLoanTrackingQueryCondition(query, params, false));
    } else if (search_type === 'branch' && branch_code && branch_code !== 'All branches' && branch_code !== 'ALL') {
      params.push(String(branch_code));
      conditions.push(`g.branch_code::text = $${params.length}`);
      if (query && String(query).trim()) {
        conditions.push(buildLoanTrackingQueryCondition(query, params, false));
      }
    } else if (search_type === 'society' && pacs_id && pacs_id !== 'All PACS' && pacs_id !== 'ALL') {
      params.push(String(pacs_id));
      conditions.push(`g.pacs_id::text = $${params.length}`);
      if (query && String(query).trim()) {
        conditions.push(buildLoanTrackingQueryCondition(query, params, false));
      }
    } else {
      // General / Smart search
      if (branch_code && branch_code !== 'All branches' && branch_code !== 'ALL') {
        params.push(String(branch_code));
        conditions.push(`g.branch_code::text = $${params.length}`);
      }
      if (pacs_id && pacs_id !== 'All PACS' && pacs_id !== 'ALL') {
        params.push(String(pacs_id));
        conditions.push(`g.pacs_id::text = $${params.length}`);
      }
      if (query && String(query).trim()) {
        conditions.push(buildLoanTrackingQueryCondition(query, params, true));
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(2000, Math.max(1, parseInt(limit, 10) || 100));
    const offset = (pageNum - 1) * limitNum;

    // Query groups joined with loan aggregated figures from bdccb.td_loan
    const listQuery = `
      SELECT 
        g.group_code,
        g.group_name,
        g.branch_code,
        COALESCE(b.branch_name, 'Branch ' || g.branch_code::text) as branch_name,
        g.pacs_id,
        CASE 
          WHEN g.direct_indirect_flag = 'D' THEN 'Direct'
          WHEN p.branch_name ILIKE '%demo%' THEN 'Direct'
          ELSE COALESCE(p.branch_name, 'Direct')
        END as pacs_name,
        g.direct_indirect_flag,
        g.grp_open_dt,
        g.open_close_flag,
        g.phone1,
        g.group_addr,
        g.pin_no,
        g.sb_ac_no,
        COALESCE(m.member_count, 0) as member_count,
        COALESCE(l.total_loans, 0) as total_loans,
        COALESCE(l.active_loans, 0) as active_loans,
        COALESCE(l.total_disbursed, 0) as total_disbursed,
        COALESCE(l.total_outstanding, 0) as total_outstanding,
        COALESCE(l.curr_prn, 0) as curr_prn,
        COALESCE(l.ovd_prn, 0) as ovd_prn,
        COALESCE(l.curr_intt, 0) as curr_intt,
        COALESCE(l.ovd_intt, 0) as ovd_intt,
        l.last_disb_dt,
        l.last_loan_acc_no,
        l.fund_types,
        CASE WHEN COALESCE(l.total_loans, 0) > 0 THEN true ELSE false END as is_loanee,
        CASE WHEN COALESCE(l.active_loans, 0) > 0 THEN true ELSE false END as has_active_loan
      FROM bdccb.md_group g
      LEFT JOIN public.md_branch b ON g.branch_code::text = b.branch_id::text
      LEFT JOIN public.md_branch p ON g.pacs_id::text = p.branch_id::text
      LEFT JOIN (
        SELECT 
          group_code, 
          COUNT(*) as member_count 
        FROM bdccb.md_member 
        WHERE delete_flag = 'N'
        GROUP BY group_code
      ) m ON g.group_code::text = m.group_code::text
      LEFT JOIN (
        SELECT 
          COALESCE(NULLIF(group_code::text, ''), branch_shg_id::text) as grp_ref,
          COUNT(*) as total_loans,
          COUNT(CASE WHEN (COALESCE(curr_prn, 0) + COALESCE(ovd_prn, 0) + COALESCE(curr_intt, 0) + COALESCE(ovd_intt, 0)) > 0 THEN 1 END) as active_loans,
          SUM(COALESCE(disb_amt, 0)) as total_disbursed,
          SUM(COALESCE(curr_prn, 0) + COALESCE(ovd_prn, 0) + COALESCE(curr_intt, 0) + COALESCE(ovd_intt, 0)) as total_outstanding,
          SUM(COALESCE(curr_prn, 0)) as curr_prn,
          SUM(COALESCE(ovd_prn, 0)) as ovd_prn,
          SUM(COALESCE(curr_intt, 0)) as curr_intt,
          SUM(COALESCE(ovd_intt, 0)) as ovd_intt,
          MAX(disb_dt) as last_disb_dt,
          MAX(loan_acc_no) as last_loan_acc_no,
          string_agg(DISTINCT fund_type::text, ',') as fund_types
        FROM bdccb.td_loan
        WHERE acc_status = 'O'
        GROUP BY COALESCE(NULLIF(group_code::text, ''), branch_shg_id::text)
      ) l ON g.group_code::text = l.grp_ref
      ${whereClause}
      ORDER BY 
        CASE WHEN COALESCE(l.active_loans, 0) > 0 THEN 0 ELSE 1 END ASC,
        g.branch_code::integer ASC, 
        g.group_code::text ASC
      LIMIT ${limitNum} OFFSET ${offset}
    `;

    // Aggregated Summary Statistics
    const summaryQuery = `
      SELECT 
        COUNT(DISTINCT g.group_code) as total_groups,
        COUNT(DISTINCT CASE WHEN COALESCE(l.total_loans, 0) > 0 THEN g.group_code END) as loanee_groups,
        COUNT(DISTINCT CASE WHEN COALESCE(l.active_loans, 0) > 0 THEN g.group_code END) as active_loanee_groups,
        SUM(COALESCE(l.total_loans, 0)) as total_loans_count,
        SUM(COALESCE(l.active_loans, 0)) as active_loans_count,
        SUM(COALESCE(l.total_disbursed, 0)) as total_disbursed_amt,
        SUM(COALESCE(l.total_outstanding, 0)) as total_outstanding_amt,
        SUM(COALESCE(l.curr_prn, 0)) as total_curr_prn,
        SUM(COALESCE(l.ovd_prn, 0)) as total_ovd_prn,
        SUM(COALESCE(l.curr_intt, 0)) as total_curr_intt,
        SUM(COALESCE(l.ovd_intt, 0)) as total_ovd_intt,
        SUM(COALESCE(l.ovd_prn, 0) + COALESCE(l.ovd_intt, 0)) as total_overdue_amt
      FROM bdccb.md_group g
      LEFT JOIN public.md_branch b ON g.branch_code::text = b.branch_id::text
      LEFT JOIN public.md_branch p ON g.pacs_id::text = p.branch_id::text
      LEFT JOIN (
        SELECT 
          COALESCE(NULLIF(group_code::text, ''), branch_shg_id::text) as grp_ref,
          COUNT(*) as total_loans,
          COUNT(CASE WHEN (COALESCE(curr_prn, 0) + COALESCE(ovd_prn, 0) + COALESCE(curr_intt, 0) + COALESCE(ovd_intt, 0)) > 0 THEN 1 END) as active_loans,
          SUM(COALESCE(disb_amt, 0)) as total_disbursed,
          SUM(COALESCE(curr_prn, 0) + COALESCE(ovd_prn, 0) + COALESCE(curr_intt, 0) + COALESCE(ovd_intt, 0)) as total_outstanding,
          SUM(COALESCE(curr_prn, 0)) as curr_prn,
          SUM(COALESCE(ovd_prn, 0)) as ovd_prn,
          SUM(COALESCE(curr_intt, 0)) as curr_intt,
          SUM(COALESCE(ovd_intt, 0)) as ovd_intt
        FROM bdccb.td_loan
        WHERE acc_status = 'O'
        GROUP BY COALESCE(NULLIF(group_code::text, ''), branch_shg_id::text)
      ) l ON g.group_code::text = l.grp_ref
      ${whereClause}
    `;

    const [listResult, summaryResult] = await Promise.all([
      pgdb.query(listQuery, params),
      pgdb.query(summaryQuery, params)
    ]);

    const groups = listResult.rows || [];
    const summary = summaryResult.rows[0] || {};

    return res.json({
      success: true,
      suc: 1,
      page: pageNum,
      limit: limitNum,
      count: groups.length,
      groups,
      summary: {
        total_groups: parseInt(summary.total_groups, 10) || 0,
        loanee_groups: parseInt(summary.loanee_groups, 10) || 0,
        active_loanee_groups: parseInt(summary.active_loanee_groups, 10) || 0,
        total_loans_count: parseInt(summary.total_loans_count, 10) || 0,
        active_loans_count: parseInt(summary.active_loans_count, 10) || 0,
        total_disbursed_amt: parseFloat(summary.total_disbursed_amt) || 0,
        total_outstanding_amt: parseFloat(summary.total_outstanding_amt) || 0,
        total_curr_prn: parseFloat(summary.total_curr_prn) || 0,
        total_ovd_prn: parseFloat(summary.total_ovd_prn) || 0,
        total_curr_intt: parseFloat(summary.total_curr_intt) || 0,
        total_ovd_intt: parseFloat(summary.total_ovd_intt) || 0,
        total_overdue_amt: parseFloat(summary.total_overdue_amt) || 0
      }
    });
  } catch (err) {
    console.error("Error in search_loan_tracking:", err);
    return res.status(500).json({
      success: false,
      suc: 0,
      msg: "Failed to search loan tracking records",
      error: err.message
    });
  }
});

/**
 * 3. Fetch Specific Group Loan Details (All loan accounts for a group)
 * POST /v1/loantracking/get_group_loans
 * Body: { group_code: string }
 */
loanTrackingRouter.post("/get_group_loans", async (req, res) => {
  try {
    const { group_code } = req.body;
    if (!group_code) {
      return res.status(400).json({
        success: false,
        suc: 0,
        msg: "group_code is required"
      });
    }

    const loansQuery = `
      SELECT 
        l.loan_id,
        l.loan_acc_no,
        l.branch_id,
        COALESCE(b.branch_name, 'Branch ' || l.branch_id::text) as branch_name,
        l.branch_shg_id,
        l.period,
        l.curr_roi,
        l.penal_roi,
        l.disb_dt,
        l.disb_amt,
        l.rep_start_dt,
        l.rep_end_dt,
        l.curr_prn,
        l.ovd_prn,
        l.curr_intt,
        l.ovd_intt,
        (COALESCE(l.curr_prn, 0) + COALESCE(l.ovd_prn, 0) + COALESCE(l.curr_intt, 0) + COALESCE(l.ovd_intt, 0)) as total_outstanding,
        l.sanction_no,
        l.sanction_dt,
        l.fund_type,
        l.acc_status,
        CASE WHEN (COALESCE(l.curr_prn, 0) + COALESCE(l.ovd_prn, 0) + COALESCE(l.curr_intt, 0) + COALESCE(l.ovd_intt, 0)) > 0 THEN 'Active' ELSE 'Closed' END as loan_live_status
      FROM bdccb.td_loan l
      LEFT JOIN public.md_branch b ON l.branch_id::text = b.branch_id::text
      WHERE (l.group_code::text = $1 OR l.branch_shg_id::text = $1)
        AND l.acc_status = 'O'
      ORDER BY l.disb_dt DESC NULLS LAST, l.loan_id DESC
    `;

    const result = await pgdb.query(loansQuery, [String(group_code)]);

    return res.json({
      success: true,
      suc: 1,
      group_code,
      loans: result.rows || []
    });
  } catch (err) {
    console.error("Error in get_group_loans:", err);
    return res.status(500).json({
      success: false,
      suc: 0,
      msg: "Failed to fetch group loan accounts",
      error: err.message
    });
  }
});

/**
 * 4. Fetch Full Loan Hierarchy (Members <- Group <- Society <- CCB) with Statements
 * POST /v1/loantracking/get_loan_hierarchy_details
 * Body: { group_code: string, loan_acc_no?: string, fund_type?: string, loan_id?: number }
 */
loanTrackingRouter.post("/get_loan_hierarchy_details", async (req, res) => {
  try {
    const { group_code, loan_acc_no: targetAccNo, fund_type: targetFundType, loan_id: targetLoanId } = req.body;
    if (!group_code) {
      return res.status(400).json({
        success: false,
        suc: 0,
        msg: "group_code is required"
      });
    }

    const gCodeStr = String(group_code).trim();

    // 1. Group Information
    const grpRes = await pgdb.query(`
      SELECT 
        g.group_code, 
        g.group_name, 
        g.branch_code, 
        COALESCE(b.branch_name, 'Branch ' || g.branch_code::text) as branch_name, 
        g.pacs_id, 
        CASE 
          WHEN g.direct_indirect_flag = 'D' THEN 'Direct'
          WHEN p.branch_name ILIKE '%demo%' THEN 'Direct'
          ELSE COALESCE(p.branch_name, 'Direct')
        END as pacs_name, 
        g.direct_indirect_flag,
        g.grp_open_dt, 
        g.phone1,
        COALESCE(m.member_count, 0) as member_count
      FROM bdccb.md_group g
      LEFT JOIN public.md_branch b ON g.branch_code::text = b.branch_id::text
      LEFT JOIN public.md_branch p ON g.pacs_id::text = p.branch_id::text
      LEFT JOIN (
        SELECT group_code, COUNT(*) as member_count
        FROM bdccb.md_member
        GROUP BY group_code
      ) m ON g.group_code::text = m.group_code::text
      WHERE g.group_code::text = $1
    `, [gCodeStr]);

    const groupInfo = grpRes.rows[0] || null;

    // 2. CCB Level Loans (td_loan_ccb)
    const ccbLoansRes = await pgdb.query(`
      SELECT 
        c.loan_id, c.branch_id, c.loan_acc_no, c.loan_to, c.branch_shg_id, c.group_code,
        c.period, c.curr_roi, c.penal_roi, c.disb_dt, c.disb_amt, c.pay_mode,
        c.rep_start_dt, c.rep_end_dt, c.curr_prn, c.curr_intt, c.ovd_prn, c.ovd_intt,
        c.tot_grp, c.tot_memb, c.sanction_no, c.sanction_dt, c.fund_type, c.acc_status,
        (COALESCE(c.curr_prn, 0) + COALESCE(c.ovd_prn, 0) + COALESCE(c.curr_intt, 0) + COALESCE(c.ovd_intt, 0)) AS present_outstanding,
        (COALESCE(c.ovd_prn, 0) + COALESCE(c.ovd_intt, 0)) AS total_overdue
      FROM bdccb.td_loan_ccb c
      WHERE (c.group_code::text = $1 OR c.branch_shg_id::text = $1)
      ORDER BY (CASE WHEN c.acc_status = 'O' THEN 0 ELSE 1 END) ASC, c.disb_dt DESC NULLS LAST, c.loan_id DESC
    `, [gCodeStr]);

    // 3. Society Level Loans (td_loan)
    const sociLoansRes = await pgdb.query(`
      SELECT 
        s.loan_id, s.branch_id, s.loan_acc_no, s.loan_to, s.branch_shg_id, s.group_code,
        s.period, s.curr_roi, s.penal_roi, s.disb_dt, s.disb_amt, s.pay_mode,
        s.rep_start_dt, s.rep_end_dt, s.curr_prn, s.curr_intt, s.ovd_prn, s.ovd_intt,
        s.tot_grp, s.tot_memb, s.sanction_no, s.sanction_dt, s.fund_type, s.acc_status,
        (COALESCE(s.curr_prn, 0) + COALESCE(s.ovd_prn, 0) + COALESCE(s.curr_intt, 0) + COALESCE(s.ovd_intt, 0)) AS present_outstanding,
        (COALESCE(s.ovd_prn, 0) + COALESCE(s.ovd_intt, 0)) AS total_overdue
      FROM bdccb.td_loan s
      WHERE (s.group_code::text = $1 OR s.branch_shg_id::text = $1)
      ORDER BY (CASE WHEN s.acc_status = 'O' THEN 0 ELSE 1 END) ASC, s.disb_dt DESC NULLS LAST, s.loan_id DESC
    `, [gCodeStr]);

    // 4. Member Level Loans (td_loan_member)
    const membLoansRes = await pgdb.query(`
      SELECT 
        m.loan_id, m.ccb_loan_id, m.branch_id, m.loan_acc_no, m.loan_to, m.branch_shg_id,
        m.group_code, m.member_code, mm.member_name, mm.phone_no AS member_phone,
        m.period, m.curr_roi, m.penal_roi, m.disb_dt, m.disb_amt, m.period_mode,
        m.rep_start_dt, m.rep_end_dt, m.prn_amt AS curr_prn, m.ovd_prn_amt AS ovd_prn,
        m.intt_amt AS curr_intt, m.ovd_intt_amt AS ovd_intt, m.outstanding,
        m.prn_emi, m.intt_emi, m.tot_emi, m.last_trn_dt, m.fund_type, m.acc_status,
        (COALESCE(m.prn_amt, 0) + COALESCE(m.ovd_prn_amt, 0) + COALESCE(m.intt_amt, 0) + COALESCE(m.ovd_intt_amt, 0)) AS present_outstanding,
        (COALESCE(m.ovd_prn_amt, 0) + COALESCE(m.ovd_intt_amt, 0)) AS total_overdue
      FROM bdccb.td_loan_member m
      LEFT JOIN bdccb.md_member mm ON m.member_code::text = mm.member_code::text
      WHERE (m.group_code::text = $1 OR m.branch_shg_id::text = $1)
      ORDER BY (CASE WHEN m.acc_status = 'O' THEN 0 ELSE 1 END) ASC, m.member_code::text ASC
    `, [gCodeStr]);

    const ccbLoans = ccbLoansRes.rows || [];
    const sociLoans = sociLoansRes.rows || [];
    const membLoans = membLoansRes.rows || [];

    // Distinct fund types across all 3 tiers
    const fundTypeMap = new Map();
    [...ccbLoans, ...sociLoans, ...membLoans].forEach(l => {
      const ft = (l.fund_type || 'B').toUpperCase();
      if (!fundTypeMap.has(ft)) {
        fundTypeMap.set(ft, {
          fund_type: ft,
          fund_label: ft === 'B' ? 'Bank Fund (B)' : ft === 'O' ? 'Own Fund (O)' : `Fund (${ft})`,
          count: 0
        });
      }
      fundTypeMap.get(ft).count++;
    });
    const distinctFunds = Array.from(fundTypeMap.values());

    // Combine distinct loan accounts keyed by (loan_acc_no + '_' + fund_type)
    const allAccountsMap = new Map();
    [...ccbLoans, ...sociLoans].forEach((l) => {
      const ft = (l.fund_type || 'B').toUpperCase();
      const key = `${l.loan_acc_no || l.loan_id}_${ft}`;
      if (!allAccountsMap.has(key)) {
        allAccountsMap.set(key, {
          portfolio_id: key,
          loan_acc_no: l.loan_acc_no,
          loan_id: l.loan_id,
          fund_type: ft,
          fund_label: ft === 'B' ? 'Bank Fund' : ft === 'O' ? 'Own Fund' : `Fund (${ft})`,
          disb_amt: l.disb_amt,
          disb_dt: l.disb_dt,
          curr_roi: l.curr_roi,
          period: l.period,
          acc_status: l.acc_status,
          present_outstanding: l.present_outstanding,
          total_overdue: l.total_overdue
        });
      }
    });
    const loanAccounts = Array.from(allAccountsMap.values());

    // Determine the active portfolio to display
    let selectedPortfolio = null;
    if (targetLoanId) {
      selectedPortfolio = loanAccounts.find(l => Number(l.loan_id) === Number(targetLoanId)) || null;
    }
    if (!selectedPortfolio && targetAccNo && targetFundType) {
      selectedPortfolio = loanAccounts.find(
        l => String(l.loan_acc_no || '').trim().toLowerCase() === String(targetAccNo).trim().toLowerCase() &&
          l.fund_type === String(targetFundType).toUpperCase()
      ) || null;
    }
    if (!selectedPortfolio && targetAccNo) {
      selectedPortfolio = loanAccounts.find(
        l => String(l.loan_acc_no || '').trim().toLowerCase() === String(targetAccNo).trim().toLowerCase()
      ) || null;
    }
    if (!selectedPortfolio && targetFundType) {
      selectedPortfolio = loanAccounts.find(
        l => l.fund_type === String(targetFundType).toUpperCase()
      ) || null;
    }
    if (!selectedPortfolio && loanAccounts.length > 0) {
      // Pick first open loan with present_outstanding > 0, else first open loan, else first with balance, else first
      selectedPortfolio = loanAccounts.find(l => l.acc_status === 'O' && Number(l.present_outstanding) > 0) ||
        loanAccounts.find(l => l.acc_status === 'O') ||
        loanAccounts.find(l => Number(l.present_outstanding) > 0) ||
        loanAccounts[0];
    }

    const activeFundType = selectedPortfolio?.fund_type || (distinctFunds[0]?.fund_type || 'B');
    const activeLoanAccNo = selectedPortfolio?.loan_acc_no || null;
    const activeLoanId = selectedPortfolio?.loan_id || null;

    // Filter level loan record strictly for the active selected account
    let activeCcbLoan = null;
    if (activeLoanAccNo) {
      activeCcbLoan = ccbLoans.find(l =>
        String(l.loan_acc_no || '').trim().toLowerCase() === String(activeLoanAccNo).trim().toLowerCase() &&
        (l.fund_type || 'B').toUpperCase() === activeFundType
      ) || ccbLoans.find(l =>
        String(l.loan_acc_no || '').trim().toLowerCase() === String(activeLoanAccNo).trim().toLowerCase()
      ) || null;
    }
    if (!activeCcbLoan && activeLoanId) {
      activeCcbLoan = ccbLoans.find(l => Number(l.loan_id) === Number(activeLoanId)) || null;
    }

    let activeSociLoan = null;
    if (activeLoanAccNo) {
      activeSociLoan = sociLoans.find(l =>
        String(l.loan_acc_no || '').trim().toLowerCase() === String(activeLoanAccNo).trim().toLowerCase() &&
        (l.fund_type || 'B').toUpperCase() === activeFundType
      ) || sociLoans.find(l =>
        String(l.loan_acc_no || '').trim().toLowerCase() === String(activeLoanAccNo).trim().toLowerCase()
      ) || null;
    }
    if (!activeSociLoan && activeLoanId) {
      activeSociLoan = sociLoans.find(l => Number(l.loan_id) === Number(activeLoanId)) || null;
    }

    const ccbLoanId = activeCcbLoan?.loan_id || (activeLoanId ? activeLoanId : null);
    const sociLoanId = activeSociLoan?.loan_id || null;

    // Filter member loans strictly for this fund_type and matching ccb_loan_id / loan_acc_no
    let activeMembLoans = membLoans.filter(l => {
      const membFund = (l.fund_type || 'B').toUpperCase();
      if (membFund !== activeFundType) return false;
      if (activeLoanAccNo && l.loan_acc_no && String(l.loan_acc_no).trim().toLowerCase() === String(activeLoanAccNo).trim().toLowerCase()) return true;
      if (ccbLoanId && l.ccb_loan_id && Number(l.ccb_loan_id) === Number(ccbLoanId)) return true;
      if (activeLoanId && l.ccb_loan_id && Number(l.ccb_loan_id) === Number(activeLoanId)) return true;
      // If the member loan has neither loan_acc_no nor ccb_loan_id, and group only has 1 loan account
      if (!l.loan_acc_no && !l.ccb_loan_id && loanAccounts.length <= 1) return true;
      return false;
    });

    const memberLoanIds = activeMembLoans.map(m => m.loan_id);

    // 5. Fetch Statements (Transactions) for the selected fund type loan
    // 5.1 CCB Statement (td_loan_ccb_trans) - filtered by CCB loan_id
    let ccbTrans = [];
    if (ccbLoanId) {
      const ccbTransRes = await pgdb.query(`
        SELECT 
          trans_dt, trans_id, tenant_id, loan_to, branch_shg_id, loan_id, loan_ac_no,
          trans_type, dr_amt, cr_amt, curr_prn_recov, curr_intt_recov, ovd_prn_recov, ovd_intt_recov,
          curr_prn, curr_intt, ovd_prn, ovd_intt, approval_status, approved_by, approved_dt
        FROM bdccb.td_loan_ccb_trans
        WHERE loan_id = $1
        ORDER BY trans_dt ASC, trans_id ASC
      `, [ccbLoanId]);
      ccbTrans = ccbTransRes.rows || [];
    } else if (activeLoanAccNo) {
      const ccbTransRes = await pgdb.query(`
        SELECT 
          trans_dt, trans_id, tenant_id, loan_to, branch_shg_id, loan_id, loan_ac_no,
          trans_type, dr_amt, cr_amt, curr_prn_recov, curr_intt_recov, ovd_prn_recov, ovd_intt_recov,
          curr_prn, curr_intt, ovd_prn, ovd_intt, approval_status, approved_by, approved_dt
        FROM bdccb.td_loan_ccb_trans
        WHERE loan_ac_no = $1
        ORDER BY trans_dt ASC, trans_id ASC
      `, [activeLoanAccNo]);
      ccbTrans = ccbTransRes.rows || [];
    }

    // 5.2 Society Statement (td_loan_transactions) - filtered by Society loan_id
    let sociTrans = [];
    if (sociLoanId) {
      const sociTransRes = await pgdb.query(`
        SELECT 
          trans_dt, trans_id, tenant_id, loan_to, branch_shg_id, loan_id, loan_ac_no,
          trans_type, dr_amt, cr_amt, curr_prn_recov, curr_intt_recov, ovd_prn_recov, ovd_intt_recov,
          curr_prn, curr_intt, ovd_prn, ovd_intt, approval_status, approved_by, approved_dt
        FROM bdccb.td_loan_transactions
        WHERE loan_id = $1
        ORDER BY trans_dt ASC, trans_id ASC
      `, [sociLoanId]);
      sociTrans = sociTransRes.rows || [];
    } else if (activeLoanAccNo) {
      const sociTransRes = await pgdb.query(`
        SELECT 
          trans_dt, trans_id, tenant_id, loan_to, branch_shg_id, loan_id, loan_ac_no,
          trans_type, dr_amt, cr_amt, curr_prn_recov, curr_intt_recov, ovd_prn_recov, ovd_intt_recov,
          curr_prn, curr_intt, ovd_prn, ovd_intt, approval_status, approved_by, approved_dt
        FROM bdccb.td_loan_transactions
        WHERE loan_ac_no = $1
        ORDER BY trans_dt ASC, trans_id ASC
      `, [activeLoanAccNo]);
      sociTrans = sociTransRes.rows || [];
    }

    // 5.3 Member Transactions (td_loan_member_trans) - filtered by ccb_loan_id or memberLoanIds
    let membTrans = [];
    if (ccbLoanId || memberLoanIds.length > 0) {
      const membTransRes = await pgdb.query(`
        SELECT 
          t.trans_date AS trans_dt, t.trans_id, t.loan_id, t.ccb_loan_id, t.branch_id, t.loan_to,
          t.branch_shg_id, t.loan_acc_no, t.trans_type, t.dr_amt, t.cr_amt, t.curr_prn_recov,
          t.curr_intt_recov, t.ovd_prn_recov, t.ovd_intt_recov, t.curr_prn, t.curr_intt, t.ovd_prn, t.ovd_intt,
          t.approval_status, t.approved_by, t.approved_dt,
          m.member_code, mm.member_name
        FROM bdccb.td_loan_member_trans t
        LEFT JOIN bdccb.td_loan_member m ON t.loan_id::text = m.loan_id::text
        LEFT JOIN bdccb.md_member mm ON m.member_code::text = mm.member_code::text
        WHERE (t.ccb_loan_id = $1 OR t.loan_id = ANY($2::int[]))
        ORDER BY t.trans_date ASC, t.trans_id ASC
      `, [ccbLoanId || -1, memberLoanIds.length ? memberLoanIds : [-1]]);
      membTrans = membTransRes.rows || [];
    }

    // Aggregates for Member Level
    const totalMemberDisb = activeMembLoans.reduce(
      (sum, m) => sum + (parseFloat(m.disb_amt) || 0), 0
    );
    const totalMemberOutstanding = activeMembLoans.reduce(
      (sum, m) => sum + (parseFloat(m.present_outstanding) || 0), 0
    );
    const totalMemberOverdue = activeMembLoans.reduce(
      (sum, m) => sum + (parseFloat(m.total_overdue) || 0), 0
    );

    return res.json({
      success: true,
      suc: 1,
      group: groupInfo,
      loan_accounts: loanAccounts,
      distinct_funds: distinctFunds,
      selected_portfolio_id: selectedPortfolio?.portfolio_id || null,
      selected_loan_acc_no: activeLoanAccNo,
      selected_fund_type: activeFundType,
      selected_loan_id: activeLoanId,
      // 1. CCB Level (td_loan_ccb + td_loan_ccb_trans)
      ccb_level: {
        loan: activeCcbLoan,
        statement: ccbTrans
      },
      // 2. Society Level (td_loan + td_loan_transactions)
      society_level: {
        loan: activeSociLoan,
        statement: sociTrans
      },
      // 3. Member Level (td_loan_member + td_loan_member_trans)
      member_level: {
        total_loanee_members: activeMembLoans.length,
        total_member_disb: totalMemberDisb,
        total_member_outstanding: totalMemberOutstanding,
        total_member_overdue: totalMemberOverdue,
        members: activeMembLoans,
        statement: membTrans
      }
    });

  } catch (err) {
    console.error("Error in get_loan_hierarchy_details:", err);
    return res.status(500).json({
      success: false,
      suc: 0,
      msg: "Failed to fetch loan hierarchy details",
      error: err.message
    });
  }
});

/**
 * 5. Fetch Single Member Statement
 * POST /v1/loantracking/get_member_statement
 * Body: { member_loan_id: number }
 */
loanTrackingRouter.post("/get_member_statement", async (req, res) => {
  try {
    const { member_loan_id } = req.body;
    if (!member_loan_id) {
      return res.status(400).json({
        success: false,
        suc: 0,
        msg: "member_loan_id is required"
      });
    }

    const transRes = await pgdb.query(`
      SELECT 
        t.trans_date AS trans_dt, t.trans_id, t.loan_id, t.ccb_loan_id, t.branch_id, t.loan_to,
        t.branch_shg_id, t.loan_acc_no, t.trans_type, t.dr_amt, t.cr_amt, t.curr_prn_recov,
        t.curr_intt_recov, t.ovd_prn_recov, t.ovd_intt_recov, t.curr_prn, t.curr_intt, t.ovd_prn, t.ovd_intt,
        t.approval_status, t.approved_by, t.approved_dt
      FROM bdccb.td_loan_member_trans t
      WHERE t.loan_id::text = $1
      ORDER BY t.trans_date ASC, t.trans_id ASC
    `, [String(member_loan_id)]);

    return res.json({
      success: true,
      suc: 1,
      member_loan_id,
      statement: transRes.rows || []
    });
  } catch (err) {
    console.error("Error in get_member_statement:", err);
    return res.status(500).json({
      success: false,
      suc: 0,
      msg: "Failed to fetch member statement",
      error: err.message
    });
  }
});

module.exports = { loanTrackingRouter };
