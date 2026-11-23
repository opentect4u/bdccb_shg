const express = require("express");
const groupInfoRouter = express.Router();
const pgdb = require("../../db/pgdb");

/**
 * 1. Fetch Branches and Societies for dropdown search filters
 * GET or POST /v1/groupinfo/get_branches_and_societies
 */
groupInfoRouter.all("/get_branches_and_societies", async (req, res) => {
  try {
    const branchRes = await pgdb.query(`
      SELECT branch_id, branch_name, branch_type 
      FROM public.md_branch 
      WHERE branch_type IN ('B') AND branch_status = 'O'
      ORDER BY branch_id::integer ASC
    `);

    const pacsRes = await pgdb.query(`
      SELECT branch_id AS pacs_id, branch_name AS pacs_name
      FROM public.md_branch 
      WHERE branch_type = 'P' AND branch_status = 'O'
      ORDER BY branch_id::integer ASC
    `);

    return res.json({
      success: true,
      suc: 1,
      branches: branchRes.rows || [],
      societies: pacsRes.rows || []
    });
  } catch (err) {
    console.error("Error in get_branches_and_societies:", err);
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
function buildGroupQueryCondition(rawQuery, params, includeBranchPacs = false) {
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

  if (includeBranchPacs) {
    return `(
      g.group_code::text ILIKE $${phraseIdx} OR 
      regexp_replace(trim(g.group_name), '\\s+', ' ', 'g') ILIKE $${phraseIdx} OR 
      b.branch_name ILIKE $${phraseIdx} OR 
      p.branch_name ILIKE $${phraseIdx}
      ${tokenCondition}
    )`;
  }

  return `(
    g.group_code::text ILIKE $${phraseIdx} OR 
    regexp_replace(trim(g.group_name), '\\s+', ' ', 'g') ILIKE $${phraseIdx}
    ${tokenCondition}
  )`;
}

/**
 * 2. Search Groups by Group Code, Group Name, Branch Name, or Society Name
 * POST /v1/groupinfo/search_group_info
 * 
 * Body parameters:
 *  - search_type: 'group' | 'branch' | 'society' | 'all'
 *  - query: string (group code or group name)
 *  - branch_code: string / number (branch_id)
 *  - pacs_id: string / number (pacs_id)
 *  - page: number (default 1)
 *  - limit: number (default 100)
 */
groupInfoRouter.post("/search_group_info", async (req, res) => {
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
      conditions.push(buildGroupQueryCondition(query, params, false));
    } else if (search_type === 'branch' && branch_code && branch_code !== 'All branches' && branch_code !== 'ALL') {
      params.push(String(branch_code));
      conditions.push(`g.branch_code::text = $${params.length}`);
      if (query && String(query).trim()) {
        conditions.push(buildGroupQueryCondition(query, params, false));
      }
    } else if (search_type === 'society' && pacs_id && pacs_id !== 'All PACS' && pacs_id !== 'ALL') {
      params.push(String(pacs_id));
      conditions.push(`g.pacs_id::text = $${params.length}`);
      if (query && String(query).trim()) {
        conditions.push(buildGroupQueryCondition(query, params, false));
      }
    } else {
      // General / Smart search:
      if (branch_code && branch_code !== 'All branches' && branch_code !== 'ALL') {
        params.push(String(branch_code));
        conditions.push(`g.branch_code::text = $${params.length}`);
      }
      if (pacs_id && pacs_id !== 'All PACS' && pacs_id !== 'ALL') {
        params.push(String(pacs_id));
        conditions.push(`g.pacs_id::text = $${params.length}`);
      }
      if (query && String(query).trim()) {
        conditions.push(buildGroupQueryCondition(query, params, true));
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(2000, Math.max(1, parseInt(limit, 10) || 100));
    const offset = (pageNum - 1) * limitNum;

    // Main directory query with joined details and aggregated member + loan metrics
    const listQuery = `
      SELECT 
        g.group_code,
        g.group_name,
        g.branch_code,
        COALESCE(b.branch_name, 'Branch ' || g.branch_code::text) as branch_name,
        g.pacs_id,
        CASE 
          WHEN g.direct_indirect_flag = 'D' THEN 'Direct'
          WHEN p.branch_name ILIKE '%demo society%' THEN 'Direct'
          ELSE COALESCE(p.branch_name, 'Direct')
        END as pacs_name,
        g.direct_indirect_flag,
        g.grp_open_dt,
        g.open_close_flag,
        g.phone1,
        g.group_addr,
        g.pin_no,
        g.sb_ac_no,
        g.economic_activity,
        d.dist_name,
        blk.block_name,
        gp.gp_name,
        v.vill_name as village_name,
        s.sahayika_name,
        s.phone_no as sahayika_phone,
        COALESCE(m.member_count, 0) as member_count,
        COALESCE(l.total_outstanding, 0) as total_outstanding,
        COALESCE(l.total_disbursed, 0) as total_disbursed,
        COALESCE(l.active_loan_count, 0) as active_loan_count
      FROM bdccb.md_group g
      LEFT JOIN public.md_branch b ON g.branch_code::text = b.branch_id::text
      LEFT JOIN public.md_branch p ON g.pacs_id::text = p.branch_id::text
      LEFT JOIN public.md_district d ON g.dist_id::text = d.dist_code::text
      LEFT JOIN public.md_block blk ON g.block_id::text = blk.block_id::text
      LEFT JOIN public.md_gp gp ON g.gp_id::text = gp.gp_id::text
      LEFT JOIN public.md_village v ON g.village_id::text = v.vill_id::text
      LEFT JOIN bdccb.md_sahayika s ON g.sahayika_id::text = s.sahayika_id::text
      LEFT JOIN (
        SELECT group_code, COUNT(member_code) as member_count 
        FROM bdccb.md_member 
        WHERE delete_flag = 'N' 
        GROUP BY group_code
      ) m ON g.group_code::text = m.group_code::text
      LEFT JOIN (
        SELECT 
          group_code,
          SUM(COALESCE(curr_prn, 0) + COALESCE(ovd_prn, 0) + COALESCE(curr_intt, 0) + COALESCE(ovd_intt, 0)) as total_outstanding,
          SUM(COALESCE(disb_amt, 0)) as total_disbursed,
          COUNT(CASE WHEN acc_status = 'O' THEN 1 END) as active_loan_count
        FROM bdccb.td_loan 
        GROUP BY group_code
      ) l ON g.group_code::text = l.group_code::text
      ${whereClause}
      ORDER BY g.branch_code ASC, g.group_code ASC
      LIMIT ${limitNum} OFFSET ${offset}
    `;

    // Summary counts query
    const summaryQuery = `
      SELECT 
        COUNT(g.group_code) as total_groups,
        COUNT(CASE WHEN g.direct_indirect_flag = 'D' THEN 1 END) as direct_groups,
        COUNT(CASE WHEN g.direct_indirect_flag = 'I' THEN 1 END) as indirect_groups,
        COALESCE(SUM(m.member_count), 0) as total_members,
        COALESCE(SUM(l.total_outstanding), 0) as total_outstanding,
        COALESCE(SUM(l.total_disbursed), 0) as total_disbursed
      FROM bdccb.md_group g
      LEFT JOIN public.md_branch b ON g.branch_code::text = b.branch_id::text
      LEFT JOIN public.md_branch p ON g.pacs_id::text = p.branch_id::text
      LEFT JOIN (
        SELECT group_code, COUNT(member_code) as member_count 
        FROM bdccb.md_member 
        WHERE delete_flag = 'N' 
        GROUP BY group_code
      ) m ON g.group_code::text = m.group_code::text
      LEFT JOIN (
        SELECT 
          group_code,
          SUM(COALESCE(curr_prn, 0) + COALESCE(ovd_prn, 0) + COALESCE(curr_intt, 0) + COALESCE(ovd_intt, 0)) as total_outstanding,
          SUM(COALESCE(disb_amt, 0)) as total_disbursed
        FROM bdccb.td_loan 
        GROUP BY group_code
      ) l ON g.group_code::text = l.group_code::text
      ${whereClause}
    `;

    const [listResult, summaryResult] = await Promise.all([
      pgdb.query(listQuery, params),
      pgdb.query(summaryQuery, params)
    ]);

    const summary = summaryResult.rows[0] || {
      total_groups: 0,
      direct_groups: 0,
      indirect_groups: 0,
      total_members: 0,
      total_outstanding: 0,
      total_disbursed: 0
    };

    return res.json({
      success: true,
      suc: 1,
      total: parseInt(summary.total_groups, 10) || 0,
      page: pageNum,
      limit: limitNum,
      summary: {
        total_groups: parseInt(summary.total_groups, 10) || 0,
        direct_groups: parseInt(summary.direct_groups, 10) || 0,
        indirect_groups: parseInt(summary.indirect_groups, 10) || 0,
        total_members: parseInt(summary.total_members, 10) || 0,
        total_outstanding: parseFloat(summary.total_outstanding) || 0,
        total_disbursed: parseFloat(summary.total_disbursed) || 0
      },
      data: listResult.rows || []
    });
  } catch (err) {
    console.error("Error in search_group_info:", err);
    return res.status(500).json({
      success: false,
      suc: 0,
      msg: "Failed to search groups",
      error: err.message
    });
  }
});

/**
 * 3. Fetch Full Details of a Particular Group (Group info + Members + Loans + Summary)
 * POST /v1/groupinfo/get_group_complete_details
 * 
 * Body: { group_code: "1060007" }
 */
groupInfoRouter.post("/get_group_complete_details", async (req, res) => {
  try {
    const { group_code } = req.body;
    if (!group_code) {
      return res.status(400).json({
        success: false,
        suc: 0,
        msg: "group_code is required"
      });
    }

    // 1. Group info
    const groupQuery = `
      SELECT 
        g.group_code,
        g.group_name,
        g.branch_code,
        COALESCE(b.branch_name, 'Branch ' || g.branch_code::text) as branch_name,
        g.pacs_id,
        CASE 
          WHEN g.direct_indirect_flag = 'D' THEN 'Direct'
          WHEN p.branch_name ILIKE '%demo society%' THEN 'Direct'
          ELSE COALESCE(p.branch_name, 'Direct')
        END as pacs_name,
        g.direct_indirect_flag,
        g.grp_open_dt,
        g.grp_close_dt,
        g.open_close_flag,
        g.phone1,
        g.group_addr,
        g.pin_no,
        g.sb_ac_no,
        g.economic_activity,
        d.dist_name,
        blk.block_name,
        ps.ps_name,
        po.post_name as po_name,
        gp.gp_name,
        v.vill_name as village_name,
        s.sahayika_name,
        s.phone_no as sahayika_phone,
        s.address as sahayika_address,
        COALESCE(dep.group_savings_balance, 0) as group_savings_balance,
        dep.group_savings_acc_no
      FROM bdccb.md_group g
      LEFT JOIN public.md_branch b ON g.branch_code::text = b.branch_id::text
      LEFT JOIN public.md_branch p ON g.pacs_id::text = p.branch_id::text
      LEFT JOIN public.md_district d ON g.dist_id::text = d.dist_code::text
      LEFT JOIN public.md_block blk ON g.block_id::text = blk.block_id::text
      LEFT JOIN public.md_police_station ps ON g.ps_id::text = ps.ps_id::text
      LEFT JOIN public.md_postoffice po ON g.po_id::text = po.po_id::text
      LEFT JOIN public.md_gp gp ON g.gp_id::text = gp.gp_id::text
      LEFT JOIN public.md_village v ON g.village_id::text = v.vill_id::text
      LEFT JOIN bdccb.md_sahayika s ON g.sahayika_id::text = s.sahayika_id::text
      LEFT JOIN (
        SELECT 
          shg_id, 
          SUM(COALESCE(balance, 0)) as group_savings_balance,
          MAX(acc_no) as group_savings_acc_no
        FROM bdccb.td_deposit
        GROUP BY shg_id
      ) dep ON g.group_code::text = dep.shg_id::text
      WHERE g.group_code::text = $1 AND g.delete_flag = 'N'
      LIMIT 1
    `;

    // 2. Members roster with savings and loan balances
    const membersQuery = `
      SELECT 
        m.member_code,
        m.member_name,
        m.gurdian_name,
        m.gender,
        m.dob,
        m.phone_no,
        m.address,
        m.pin_no,
        m.caste,
        m.religion,
        m.education,
        m.occupation,
        m.weaker_section,
        m.gp_leader_flag,
        m.asst_gp_leader_flag,
        m.aadhar_no,
        m.pan_no,
        m.voter_id,
        m.member_account_no,
        m.ifsc,
        m.economic_activity,
        COALESCE(sb.savings_balance, 0) as savings_balance,
        sb.savings_acc_no,
        COALESCE(lm.loan_balance, 0) as loan_balance,
        lm.loan_id as member_loan_id,
        lm.loan_acc_no as member_loan_acc_no
      FROM bdccb.md_member m
      LEFT JOIN (
        SELECT 
          shg_id,
          member_id,
          SUM(COALESCE(balance, 0)) as savings_balance,
          MAX(acc_no) as savings_acc_no
        FROM bdccb.td_sb
        GROUP BY shg_id, member_id
      ) sb ON m.group_code::text = sb.shg_id::text AND m.member_code::text = sb.member_id::text
      LEFT JOIN (
        SELECT 
          group_code,
          member_code,
          SUM(COALESCE(prn_amt, 0) + COALESCE(ovd_prn_amt, 0) + COALESCE(intt_amt, 0) + COALESCE(ovd_intt_amt, 0)) as loan_balance,
          MAX(loan_id::text) as loan_id,
          MAX(loan_acc_no) as loan_acc_no
        FROM bdccb.td_loan_member
        GROUP BY group_code, member_code
      ) lm ON m.group_code::text = lm.group_code::text AND m.member_code::text = lm.member_code::text
      WHERE m.group_code::text = $1 AND m.delete_flag = 'N'
      ORDER BY 
        CASE WHEN m.gp_leader_flag = 'Y' THEN 1 WHEN m.asst_gp_leader_flag = 'Y' THEN 2 ELSE 3 END ASC,
        m.member_name ASC
    `;

    // 3. Loans history
    const loansQuery = `
      SELECT 
        loan_id,
        loan_acc_no,
        disb_dt,
        disb_amt,
        curr_roi,
        penal_roi,
        period,
        pay_mode,
        rep_start_dt,
        rep_end_dt,
        sanction_no,
        sanction_dt,
        COALESCE(curr_prn, 0) as curr_prn,
        COALESCE(ovd_prn, 0) as ovd_prn,
        (COALESCE(curr_prn, 0) + COALESCE(ovd_prn, 0)) as outstanding_prn,
        (COALESCE(curr_prn, 0) + COALESCE(ovd_prn, 0) + COALESCE(curr_intt, 0) + COALESCE(ovd_intt, 0)) as total_outstanding,
        acc_status,
        fund_type
      FROM bdccb.td_loan
      WHERE group_code::text = $1
      ORDER BY disb_dt DESC
    `;

    const [groupRes, membersRes, loansRes] = await Promise.all([
      pgdb.query(groupQuery, [String(group_code)]),
      pgdb.query(membersQuery, [String(group_code)]),
      pgdb.query(loansQuery, [String(group_code)])
    ]);

    if (groupRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        suc: 0,
        msg: `Group with code ${group_code} not found.`
      });
    }

    const group = groupRes.rows[0];
    const members = membersRes.rows || [];
    const loans = loansRes.rows || [];

    // Calculate detailed summary metrics
    const totalMembers = members.length;
    const femaleMembers = members.filter(m => String(m.gender).toUpperCase() === 'F' || String(m.gender).toUpperCase() === 'FEMALE').length;
    const maleMembers = members.filter(m => String(m.gender).toUpperCase() === 'M' || String(m.gender).toUpperCase() === 'MALE').length;
    const leadersCount = members.filter(m => m.gp_leader_flag === 'Y' || m.asst_gp_leader_flag === 'Y').length;

    const totalDisbursed = loans.reduce((acc, curr) => acc + (parseFloat(curr.disb_amt) || 0), 0);
    const totalOutstanding = loans.reduce((acc, curr) => acc + (parseFloat(curr.total_outstanding) || 0), 0);
    const activeLoansCount = loans.filter(l => l.acc_status === 'O').length;
    const totalMemberSavings = members.reduce((acc, m) => acc + (parseFloat(m.savings_balance) || 0), 0);

    return res.json({
      success: true,
      suc: 1,
      group,
      members,
      loans,
      summary: {
        total_members: totalMembers,
        female_members: femaleMembers,
        male_members: maleMembers,
        leaders_count: leadersCount,
        total_loans: loans.length,
        active_loans: activeLoansCount,
        total_disbursed: totalDisbursed,
        total_outstanding: totalOutstanding,
        total_member_savings: totalMemberSavings
      }
    });
  } catch (err) {
    console.error("Error in get_group_complete_details:", err);
    return res.status(500).json({
      success: false,
      suc: 0,
      msg: "Failed to fetch group details",
      error: err.message
    });
  }
});

/**
 * 4. Fetch Member Savings Transactions
 * POST /v1/groupinfo/get_member_sb_transactions
 * Body: { group_code, member_code }
 */
groupInfoRouter.post("/get_member_sb_transactions", async (req, res) => {
  try {
    const { group_code, member_code } = req.body;
    if (!group_code || !member_code) {
      return res.status(400).json({
        success: false,
        suc: 0,
        msg: "group_code and member_code are required"
      });
    }

    const transQuery = `
      SELECT 
        trans_no,
        acc_no,
        trans_dt,
        dep_with_flag::text as dep_with_flag,
        COALESCE(dr_amt, 0) as dr_amt,
        COALESCE(cr_amt, 0) as cr_amt,
        COALESCE(balance, 0) as balance,
        remarks,
        approval_flag::text as approval_flag
      FROM bdccb.td_sb_trans
      WHERE shg_id::text = $1 AND member_id::text = $2
      ORDER BY trans_dt DESC, trans_no DESC
    `;

    const result = await pgdb.query(transQuery, [String(group_code), String(member_code)]);
    return res.json({
      success: true,
      suc: 1,
      data: result.rows || []
    });
  } catch (err) {
    console.error("Error in get_member_sb_transactions:", err);
    return res.status(500).json({
      success: false,
      suc: 0,
      msg: "Failed to fetch savings transactions",
      error: err.message
    });
  }
});

/**
 * 5. Fetch Member Loan Transactions
 * POST /v1/groupinfo/get_member_loan_transactions
 * Body: { group_code, member_code, loan_id }
 */
groupInfoRouter.post("/get_member_loan_transactions", async (req, res) => {
  try {
    const { group_code, member_code, loan_id } = req.body;
    if (!group_code && !loan_id) {
      return res.status(400).json({
        success: false,
        suc: 0,
        msg: "group_code or loan_id is required"
      });
    }

    let transQuery = "";
    let params = [];

    if (loan_id) {
      transQuery = `
        SELECT 
          lt.trans_date,
          lt.trans_id,
          lt.loan_id,
          lt.loan_acc_no,
          lt.trans_type::text as trans_type,
          COALESCE(lt.dr_amt, 0) as dr_amt,
          COALESCE(lt.cr_amt, 0) as cr_amt,
          COALESCE(lt.curr_prn_recov, 0) as curr_prn_recov,
          COALESCE(lt.curr_intt_recov, 0) as curr_intt_recov,
          COALESCE(lt.curr_prn, 0) as curr_prn,
          lt.approval_status::text as approval_status
        FROM bdccb.td_loan_member_trans lt
        WHERE lt.loan_id::text = $1
        ORDER BY lt.trans_date DESC, lt.trans_id DESC
      `;
      params = [String(loan_id)];
    } else {
      transQuery = `
        SELECT 
          lt.trans_date,
          lt.trans_id,
          lt.loan_id,
          lt.loan_acc_no,
          lt.trans_type::text as trans_type,
          COALESCE(lt.dr_amt, 0) as dr_amt,
          COALESCE(lt.cr_amt, 0) as cr_amt,
          COALESCE(lt.curr_prn_recov, 0) as curr_prn_recov,
          COALESCE(lt.curr_intt_recov, 0) as curr_intt_recov,
          COALESCE(lt.curr_prn, 0) as curr_prn,
          lt.approval_status::text as approval_status
        FROM bdccb.td_loan_member_trans lt
        JOIN bdccb.td_loan_member lm ON lt.loan_id::text = lm.loan_id::text
        WHERE lm.group_code::text = $1 AND lm.member_code::text = $2
        ORDER BY lt.trans_date DESC, lt.trans_id DESC
      `;
      params = [String(group_code), String(member_code)];
    }

    const result = await pgdb.query(transQuery, params);
    return res.json({
      success: true,
      suc: 1,
      data: result.rows || []
    });
  } catch (err) {
    console.error("Error in get_member_loan_transactions:", err);
    return res.status(500).json({
      success: false,
      suc: 0,
      msg: "Failed to fetch loan transactions",
      error: err.message
    });
  }
});

/**
 * 6. Fetch Society & Branch Analytics
 * POST /v1/groupinfo/get_society_branch_analytics
 */
groupInfoRouter.post("/get_society_branch_analytics", async (req, res) => {
  try {
    const {
      view_mode = "society",
      pacs_id = "",
      branch_code = "",
      financial_year = "2026-2027",
      month = "ALL"
    } = req.body;

    let scopeClause = "1=1";
    let scopeParam = "";
    let scopeInfoQuery = "";

    if (view_mode === "society" && pacs_id && pacs_id !== "ALL") {
      scopeClause = "g.pacs_id::text = $1";
      scopeParam = String(pacs_id);
      scopeInfoQuery = `
        SELECT 
          p.branch_id as pacs_id, 
          p.branch_name as pacs_name,
          p.branch_jurisdiction_id as branch_code,
          b.branch_name as branch_name,
          p.branch_address as branch_addr,
          p.phone
        FROM public.md_branch p
        LEFT JOIN public.md_branch b ON p.branch_jurisdiction_id::text = b.branch_id::text
        WHERE p.branch_id::text = $1
      `;
    } else if (branch_code && branch_code !== "ALL") {
      scopeClause = "g.branch_code::text = $1";
      scopeParam = String(branch_code);
      scopeInfoQuery = `
        SELECT 
          branch_id as branch_code, 
          branch_name,
          branch_address as branch_addr,
          phone
        FROM public.md_branch
        WHERE branch_id::text = $1
      `;
    }

    // Determine Financial Year & Month Date Range
    let startYear = 2026;
    let endYear = 2027;
    if (financial_year && financial_year.includes("-")) {
      const parts = financial_year.split("-");
      startYear = parseInt(parts[0], 10) || 2026;
      endYear = parseInt(parts[1], 10) || startYear + 1;
    }
    let fromDate = `${startYear}-04-01`;
    let toDate = `${endYear}-03-31`;

    if (month && String(month).toUpperCase() !== "ALL") {
      const m = parseInt(month, 10);
      const yr = (m >= 1 && m <= 3) ? endYear : startYear;
      const mm = String(m).padStart(2, "0");
      const lastDay = new Date(yr, m, 0).getDate();
      fromDate = `${yr}-${mm}-01`;
      toDate = `${yr}-${mm}-${String(lastDay).padStart(2, "0")}`;
    }

    const params = scopeParam ? [scopeParam] : [];

    // 1. Scope Info
    let scopeDetails = null;
    if (scopeInfoQuery && scopeParam) {
      const scopeRes = await pgdb.query(scopeInfoQuery, [scopeParam]);
      scopeDetails = scopeRes.rows[0] || null;
    }

    // 2. Active Groups Summary
    const groupsQuery = `
      SELECT 
        COUNT(g.group_code) as total_groups,
        COUNT(CASE WHEN g.open_close_flag = 'O' THEN 1 END) as active_groups,
        COUNT(CASE WHEN g.open_close_flag = 'C' THEN 1 END) as closed_groups,
        COUNT(CASE WHEN g.direct_indirect_flag = 'D' THEN 1 END) as direct_groups,
        COUNT(CASE WHEN g.direct_indirect_flag = 'I' THEN 1 END) as indirect_groups
      FROM bdccb.md_group g
      WHERE g.delete_flag = 'N' AND ${scopeClause}
    `;

    // 3. Members Summary
    const membersQuery = `
      SELECT 
        COUNT(m.member_code) as total_members,
        COUNT(CASE WHEN UPPER(m.gender::text) IN ('F', 'FEMALE') THEN 1 END) as female_members,
        COUNT(CASE WHEN UPPER(m.gender::text) IN ('M', 'MALE') THEN 1 END) as male_members,
        COUNT(CASE WHEN m.gp_leader_flag = 'Y' OR m.asst_gp_leader_flag = 'Y' THEN 1 END) as leaders_count
      FROM bdccb.md_member m
      JOIN bdccb.md_group g ON m.group_code::text = g.group_code::text
      WHERE m.delete_flag = 'N' AND g.delete_flag = 'N' AND ${scopeClause}
    `;

    // 4. Loans Summary (Direct vs Indirect count & amounts)
    const loansQuery = `
      SELECT 
        COUNT(l.loan_id) as total_loan_count,
        COUNT(CASE WHEN l.acc_status = 'O' THEN 1 END) as active_loan_count,
        COALESCE(SUM(l.disb_amt), 0) as total_loan_disbursed,
        COALESCE(SUM(COALESCE(l.curr_prn, 0) + COALESCE(l.ovd_prn, 0) + COALESCE(l.curr_intt, 0) + COALESCE(l.ovd_intt, 0)), 0) as total_loan_outstanding,

        COUNT(CASE WHEN g.direct_indirect_flag = 'D' THEN l.loan_id END) as direct_loan_count,
        COUNT(CASE WHEN g.direct_indirect_flag = 'D' AND l.acc_status = 'O' THEN 1 END) as direct_active_loan_count,
        COALESCE(SUM(CASE WHEN g.direct_indirect_flag = 'D' THEN l.disb_amt ELSE 0 END), 0) as direct_loan_disbursed,
        COALESCE(SUM(CASE WHEN g.direct_indirect_flag = 'D' THEN (COALESCE(l.curr_prn, 0) + COALESCE(l.ovd_prn, 0) + COALESCE(l.curr_intt, 0) + COALESCE(l.ovd_intt, 0)) ELSE 0 END), 0) as direct_loan_outstanding,

        COUNT(CASE WHEN g.direct_indirect_flag = 'I' THEN l.loan_id END) as indirect_loan_count,
        COUNT(CASE WHEN g.direct_indirect_flag = 'I' AND l.acc_status = 'O' THEN 1 END) as indirect_active_loan_count,
        COALESCE(SUM(CASE WHEN g.direct_indirect_flag = 'I' THEN l.disb_amt ELSE 0 END), 0) as indirect_loan_disbursed,
        COALESCE(SUM(CASE WHEN g.direct_indirect_flag = 'I' THEN (COALESCE(l.curr_prn, 0) + COALESCE(l.ovd_prn, 0) + COALESCE(l.curr_intt, 0) + COALESCE(l.ovd_intt, 0)) ELSE 0 END), 0) as indirect_loan_outstanding
      FROM bdccb.td_loan l
      JOIN bdccb.md_group g ON l.group_code::text = g.group_code::text
      WHERE g.delete_flag = 'N' AND ${scopeClause}
    `;

    // 5. Deposit Accounts Summary (Group Deposit + Member SB)
    const depositsQuery = `
      SELECT 
        COALESCE(d.group_deposit_count, 0) as group_deposit_count,
        COALESCE(d.group_deposit_amount, 0) as group_deposit_amount,
        COALESCE(s.member_savings_count, 0) as member_savings_count,
        COALESCE(s.member_savings_amount, 0) as member_savings_amount,
        (COALESCE(d.group_deposit_count, 0) + COALESCE(s.member_savings_count, 0)) as total_deposit_accounts,
        (COALESCE(d.group_deposit_amount, 0) + COALESCE(s.member_savings_amount, 0)) as total_deposit_amount
      FROM (
        SELECT 
          COUNT(dep.acc_no) as group_deposit_count,
          SUM(COALESCE(dep.balance, 0)) as group_deposit_amount
        FROM bdccb.td_deposit dep
        JOIN bdccb.md_group g ON dep.shg_id::text = g.group_code::text
        WHERE g.delete_flag = 'N' AND ${scopeClause}
      ) d
      CROSS JOIN (
        SELECT 
          COUNT(sb.acc_no) as member_savings_count,
          SUM(COALESCE(sb.balance, 0)) as member_savings_amount
        FROM bdccb.td_sb sb
        JOIN bdccb.md_group g ON sb.shg_id::text = g.group_code::text
        WHERE g.delete_flag = 'N' AND ${scopeClause}
      ) s
    `;

    // 6. Period Transactions (Loan Disbursed, Loan Recovery, SB Deposits / Withdrawals)
    const transScopeCondition = scopeClause.replace(/g\./g, "g.");
    const dateParams = scopeParam ? [scopeParam, fromDate, toDate] : [fromDate, toDate];
    const pOffset = scopeParam ? 2 : 1;

    const loanTransQuery = `
      SELECT 
        COUNT(CASE WHEN lt.trans_type::text = 'D' THEN 1 END) as loan_disb_count,
        COALESCE(SUM(CASE WHEN lt.trans_type::text = 'D' THEN lt.dr_amt ELSE 0 END), 0) as loan_disb_amount,
        COUNT(CASE WHEN lt.trans_type::text = 'R' THEN 1 END) as loan_recov_count,
        COALESCE(SUM(CASE WHEN lt.trans_type::text = 'R' THEN lt.cr_amt ELSE 0 END), 0) as loan_recov_amount,
        COALESCE(SUM(CASE WHEN lt.trans_type::text = 'R' THEN lt.curr_prn_recov ELSE 0 END), 0) as loan_recov_prn,
        COALESCE(SUM(CASE WHEN lt.trans_type::text = 'R' THEN lt.curr_intt_recov ELSE 0 END), 0) as loan_recov_intt
      FROM bdccb.td_loan_transactions lt
      JOIN bdccb.td_loan l ON lt.loan_id = l.loan_id
      JOIN bdccb.md_group g ON l.group_code::text = g.group_code::text
      WHERE g.delete_flag = 'N' 
        AND ${transScopeCondition}
        AND lt.approval_status = 'A'
        AND lt.trans_dt::date BETWEEN $${pOffset} AND $${pOffset + 1}
    `;

    const sbTransQuery = `
      SELECT 
        COUNT(CASE WHEN dt.dep_with_flag::text = 'D' OR dt.cr_amt > 0 THEN 1 END) as sb_deposit_count,
        COALESCE(SUM(CASE WHEN dt.dep_with_flag::text = 'D' OR dt.cr_amt > 0 THEN dt.cr_amt ELSE 0 END), 0) as sb_deposit_amount,
        COUNT(CASE WHEN dt.dep_with_flag::text = 'W' OR dt.dr_amt > 0 THEN 1 END) as sb_withdrawal_count,
        COALESCE(SUM(CASE WHEN dt.dep_with_flag::text = 'W' OR dt.dr_amt > 0 THEN dt.dr_amt ELSE 0 END), 0) as sb_withdrawal_amount
      FROM bdccb.td_deposit_trans dt
      JOIN bdccb.md_group g ON dt.shg_id::text = g.group_code::text
      WHERE g.delete_flag = 'N' 
        AND ${transScopeCondition}
        AND dt.trans_dt::date BETWEEN $${pOffset} AND $${pOffset + 1}
    `;

    // 7. Month-by-month breakdown for the whole Financial Year (April - March)
    const fyFromDate = `${startYear}-04-01`;
    const fyToDate = `${endYear}-03-31`;
    const fyDateParams = scopeParam ? [scopeParam, fyFromDate, fyToDate] : [fyFromDate, fyToDate];

    const monthlyBreakdownQuery = `
      SELECT 
        TO_CHAR(d.m_date, 'YYYY-MM') as month_key,
        TO_CHAR(d.m_date, 'Mon YYYY') as month_name,
        EXTRACT(MONTH FROM d.m_date) as month_num,
        EXTRACT(YEAR FROM d.m_date) as year_num,
        COALESCE(disb.amount, 0) as loan_disbursed,
        COALESCE(recov.amount, 0) as loan_recovery,
        COALESCE(sb_dep.amount, 0) as sb_deposit,
        COALESCE(sb_with.amount, 0) as sb_withdrawal
      FROM generate_series($${pOffset}::date, $${pOffset + 1}::date, '1 month'::interval) d(m_date)
      LEFT JOIN (
        SELECT 
          DATE_TRUNC('month', lt.trans_dt)::date as m_start,
          SUM(COALESCE(lt.dr_amt, 0)) as amount
        FROM bdccb.td_loan_transactions lt
        JOIN bdccb.td_loan l ON lt.loan_id = l.loan_id
        JOIN bdccb.md_group g ON l.group_code::text = g.group_code::text
        WHERE g.delete_flag = 'N' AND ${transScopeCondition} AND lt.trans_type::text = 'D' AND lt.approval_status = 'A'
        GROUP BY 1
      ) disb ON DATE_TRUNC('month', d.m_date)::date = disb.m_start
      LEFT JOIN (
        SELECT 
          DATE_TRUNC('month', lt.trans_dt)::date as m_start,
          SUM(COALESCE(lt.cr_amt, 0)) as amount
        FROM bdccb.td_loan_transactions lt
        JOIN bdccb.td_loan l ON lt.loan_id = l.loan_id
        JOIN bdccb.md_group g ON l.group_code::text = g.group_code::text
        WHERE g.delete_flag = 'N' AND ${transScopeCondition} AND lt.trans_type::text = 'R' AND lt.approval_status = 'A'
        GROUP BY 1
      ) recov ON DATE_TRUNC('month', d.m_date)::date = recov.m_start
      LEFT JOIN (
        SELECT 
          DATE_TRUNC('month', dt.trans_dt)::date as m_start,
          SUM(COALESCE(dt.cr_amt, 0)) as amount
        FROM bdccb.td_deposit_trans dt
        JOIN bdccb.md_group g ON dt.shg_id::text = g.group_code::text
        WHERE g.delete_flag = 'N' AND ${transScopeCondition} AND (dt.dep_with_flag::text = 'D' OR dt.cr_amt > 0)
        GROUP BY 1
      ) sb_dep ON DATE_TRUNC('month', d.m_date)::date = sb_dep.m_start
      LEFT JOIN (
        SELECT 
          DATE_TRUNC('month', dt.trans_dt)::date as m_start,
          SUM(COALESCE(dt.dr_amt, 0)) as amount
        FROM bdccb.td_deposit_trans dt
        JOIN bdccb.md_group g ON dt.shg_id::text = g.group_code::text
        WHERE g.delete_flag = 'N' AND ${transScopeCondition} AND (dt.dep_with_flag::text = 'W' OR dt.dr_amt > 0)
        GROUP BY 1
      ) sb_with ON DATE_TRUNC('month', d.m_date)::date = sb_with.m_start
      ORDER BY d.m_date ASC
    `;

    // 8. Associated Groups List (top 100)
    const groupsListQuery = `
      SELECT 
        g.group_code,
        g.group_name,
        g.grp_open_dt,
        g.direct_indirect_flag,
        g.open_close_flag,
        g.sb_ac_no,
        COALESCE(b.branch_name, 'Branch ' || g.branch_code::text) as branch_name,
        CASE 
          WHEN g.direct_indirect_flag = 'D' THEN 'Direct'
          WHEN p.branch_name ILIKE '%demo society%' THEN 'Direct'
          ELSE COALESCE(p.branch_name, 'Direct')
        END as pacs_name,
        COALESCE(m.member_count, 0) as member_count,
        COALESCE(dep.balance, 0) as group_savings_balance,
        COALESCE(l.total_outstanding, 0) as total_outstanding,
        COALESCE(l.disb_amt, 0) as total_disbursed
      FROM bdccb.md_group g
      LEFT JOIN public.md_branch b ON g.branch_code::text = b.branch_id::text
      LEFT JOIN public.md_branch p ON g.pacs_id::text = p.branch_id::text
      LEFT JOIN (
        SELECT group_code, COUNT(member_code) as member_count 
        FROM bdccb.md_member 
        WHERE delete_flag = 'N' 
        GROUP BY group_code
      ) m ON g.group_code::text = m.group_code::text
      LEFT JOIN (
        SELECT shg_id, SUM(COALESCE(balance, 0)) as balance 
        FROM bdccb.td_deposit 
        GROUP BY shg_id
      ) dep ON g.group_code::text = dep.shg_id::text
      LEFT JOIN (
        SELECT 
          group_code,
          SUM(COALESCE(curr_prn, 0) + COALESCE(ovd_prn, 0) + COALESCE(curr_intt, 0) + COALESCE(ovd_intt, 0)) as total_outstanding,
          SUM(COALESCE(disb_amt, 0)) as disb_amt
        FROM bdccb.td_loan 
        GROUP BY group_code
      ) l ON g.group_code::text = l.group_code::text
      WHERE g.delete_flag = 'N' AND ${scopeClause}
      ORDER BY g.open_close_flag ASC, g.group_code ASC
      LIMIT 100
    `;

    const [
      groupsRes,
      membersRes,
      loansRes,
      depositsRes,
      loanTransRes,
      sbTransRes,
      monthlyRes,
      groupsListRes
    ] = await Promise.all([
      pgdb.query(groupsQuery, params),
      pgdb.query(membersQuery, params),
      pgdb.query(loansQuery, params),
      pgdb.query(depositsQuery, params),
      pgdb.query(loanTransQuery, dateParams),
      pgdb.query(sbTransQuery, dateParams),
      pgdb.query(monthlyBreakdownQuery, fyDateParams),
      pgdb.query(groupsListQuery, params)
    ]);

    const groupsData = groupsRes.rows[0] || {};
    const membersData = membersRes.rows[0] || {};
    const loansData = loansRes.rows[0] || {};
    const depositsData = depositsRes.rows[0] || {};
    const loanTransData = loanTransRes.rows[0] || {};
    const sbTransData = sbTransRes.rows[0] || {};

    const sbDepositAmt = parseFloat(sbTransData.sb_deposit_amount) || 0;
    const sbWithdrawalAmt = parseFloat(sbTransData.sb_withdrawal_amount) || 0;

    return res.json({
      success: true,
      suc: 1,
      scope: scopeDetails,
      period: {
        financial_year,
        month,
        from_date: fromDate,
        to_date: toDate
      },
      groups_summary: {
        total_groups: parseInt(groupsData.total_groups, 10) || 0,
        active_groups: parseInt(groupsData.active_groups, 10) || 0,
        closed_groups: parseInt(groupsData.closed_groups, 10) || 0,
        direct_groups: parseInt(groupsData.direct_groups, 10) || 0,
        indirect_groups: parseInt(groupsData.indirect_groups, 10) || 0
      },
      members_summary: {
        total_members: parseInt(membersData.total_members, 10) || 0,
        female_members: parseInt(membersData.female_members, 10) || 0,
        male_members: parseInt(membersData.male_members, 10) || 0,
        leaders_count: parseInt(membersData.leaders_count, 10) || 0
      },
      loans_summary: {
        total_loan_count: parseInt(loansData.total_loan_count, 10) || 0,
        active_loan_count: parseInt(loansData.active_loan_count, 10) || 0,
        total_loan_disbursed: parseFloat(loansData.total_loan_disbursed) || 0,
        total_loan_outstanding: parseFloat(loansData.total_loan_outstanding) || 0,

        direct_loan_count: parseInt(loansData.direct_loan_count, 10) || 0,
        direct_active_loan_count: parseInt(loansData.direct_active_loan_count, 10) || 0,
        direct_loan_disbursed: parseFloat(loansData.direct_loan_disbursed) || 0,
        direct_loan_outstanding: parseFloat(loansData.direct_loan_outstanding) || 0,

        indirect_loan_count: parseInt(loansData.indirect_loan_count, 10) || 0,
        indirect_active_loan_count: parseInt(loansData.indirect_active_loan_count, 10) || 0,
        indirect_loan_disbursed: parseFloat(loansData.indirect_loan_disbursed) || 0,
        indirect_loan_outstanding: parseFloat(loansData.indirect_loan_outstanding) || 0
      },
      deposits_summary: {
        total_deposit_accounts: parseInt(depositsData.total_deposit_accounts, 10) || 0,
        total_deposit_amount: parseFloat(depositsData.total_deposit_amount) || 0,
        group_deposit_count: parseInt(depositsData.group_deposit_count, 10) || 0,
        group_deposit_amount: parseFloat(depositsData.group_deposit_amount) || 0,
        member_savings_count: parseInt(depositsData.member_savings_count, 10) || 0,
        member_savings_amount: parseFloat(depositsData.member_savings_amount) || 0
      },
      transactions_summary: {
        loan_disbursed_count: parseInt(loanTransData.loan_disb_count, 10) || 0,
        loan_disbursed_amount: parseFloat(loanTransData.loan_disb_amount) || 0,
        loan_recovery_count: parseInt(loanTransData.loan_recov_count, 10) || 0,
        loan_recovery_amount: parseFloat(loanTransData.loan_recov_amount) || 0,
        loan_recovery_prn: parseFloat(loanTransData.loan_recov_prn) || 0,
        loan_recovery_intt: parseFloat(loanTransData.loan_recov_intt) || 0,

        sb_deposit_count: parseInt(sbTransData.sb_deposit_count, 10) || 0,
        sb_deposit_amount: sbDepositAmt,
        sb_withdrawal_count: parseInt(sbTransData.sb_withdrawal_count, 10) || 0,
        sb_withdrawal_amount: sbWithdrawalAmt,
        sb_net_flow: sbDepositAmt - sbWithdrawalAmt
      },
      monthly_breakdown: (monthlyRes.rows || []).map(r => ({
        month_key: r.month_key,
        month_name: (r.month_name || "").trim(),
        month_num: parseInt(r.month_num, 10),
        year_num: parseInt(r.year_num, 10),
        loan_disbursed: parseFloat(r.loan_disbursed) || 0,
        loan_recovery: parseFloat(r.loan_recovery) || 0,
        sb_deposit: parseFloat(r.sb_deposit) || 0,
        sb_withdrawal: parseFloat(r.sb_withdrawal) || 0,
        net_sb: (parseFloat(r.sb_deposit) || 0) - (parseFloat(r.sb_withdrawal) || 0)
      })),
      groups_list: groupsListRes.rows || []
    });
  } catch (err) {
    console.error("Error in get_society_branch_analytics:", err);
    return res.status(500).json({
      success: false,
      suc: 0,
      msg: "Failed to fetch analytics",
      error: err.message
    });
  }
});

module.exports = { groupInfoRouter };
