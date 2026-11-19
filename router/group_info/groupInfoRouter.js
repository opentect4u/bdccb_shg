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
      WHERE branch_type IN ('B', 'H') AND branch_status = 'O'
      ORDER BY branch_id::integer ASC
    `);

    const pacsRes = await pgdb.query(`
      SELECT branch_id AS pacs_id, branch_name AS pacs_name, branch_jurisdiction_id AS branch_code
      FROM public.md_branch 
      WHERE branch_type = 'P' AND branch_status = 'O'
      ORDER BY branch_jurisdiction_id::integer ASC, branch_id::integer ASC
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
      const q = `%${String(query).trim()}%`;
      params.push(q);
      const paramIdx = params.length;
      conditions.push(`(g.group_code::text ILIKE $${paramIdx} OR g.group_name ILIKE $${paramIdx})`);
    } else if (search_type === 'branch' && branch_code && branch_code !== 'All branches' && branch_code !== 'ALL') {
      params.push(String(branch_code));
      const paramIdx = params.length;
      conditions.push(`g.branch_code::text = $${paramIdx}`);
      if (query && String(query).trim()) {
        params.push(`%${String(query).trim()}%`);
        const qIdx = params.length;
        conditions.push(`(g.group_code::text ILIKE $${qIdx} OR g.group_name ILIKE $${qIdx})`);
      }
    } else if (search_type === 'society' && pacs_id && pacs_id !== 'All PACS' && pacs_id !== 'ALL') {
      params.push(String(pacs_id));
      const paramIdx = params.length;
      conditions.push(`g.pacs_id::text = $${paramIdx}`);
      if (query && String(query).trim()) {
        params.push(`%${String(query).trim()}%`);
        const qIdx = params.length;
        conditions.push(`(g.group_code::text ILIKE $${qIdx} OR g.group_name ILIKE $${qIdx})`);
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
        params.push(`%${String(query).trim()}%`);
        const qIdx = params.length;
        conditions.push(`(
          g.group_code::text ILIKE $${qIdx} OR 
          g.group_name ILIKE $${qIdx} OR 
          b.branch_name ILIKE $${qIdx} OR 
          p.branch_name ILIKE $${qIdx}
        )`);
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
        COALESCE(p.branch_name, 'Direct') as pacs_name,
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
        COALESCE(p.branch_name, 'Direct') as pacs_name,
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
        total_outstanding: totalOutstanding
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

module.exports = { groupInfoRouter };
