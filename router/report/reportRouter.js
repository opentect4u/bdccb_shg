const { db_Select, saveRecord } = require('../../model/pgcommon');
const express = require('express');
const bcrypt = require("bcrypt");
const e = require('express');
const reportRouter = express.Router();


// fetch group details along with member
reportRouter.get("/get_disburs_dtls", async (req, res) => {
    try{
      const {frm_dt,to_dt,branch_id} = req.query;
      if (!frm_dt || !to_dt || !branch_id) {
        return res.send({
          success: false,
          msg: "frm_dt, to_dt and branch_id are required"
        });
      }
      var select = "a.loan_id,a.period,a.curr_roi,a.disb_dt,a.disb_amt,b.group_name,c.member_name,c.member_account_no",
      table_name = "bdccb.td_loan_member a JOIN bdccb.md_group b ON a.group_code = b.group_code JOIN bdccb.md_member c ON a.group_code = c.group_code";
        whr = `a.disb_dt BETWEEN '${frm_dt}' AND '${to_dt}' AND a.branch_shg_id = '${branch_id}'`,
        order = null;

      var loan_result = await db_Select(select,table_name,whr,order);
    
      if (loan_result.suc === 1 && loan_result.msg.length > 0) {
          return res.send({
            success: true,
            msg: "Disbursment List",
            data: loan_result.msg
        });
        } else {
          return res.send({
            success: true,
            msg: "Failed to fetch Disbursment List",
            data: []
          });
        }
    }catch(error){
      console.log("Error fetching Disbursment List:", error);
      return res.send({
        success: false,
        msg: "Internal server error",
        errorCode: "SERVER_ERROR"
      });
    }
});

   reportRouter.get("/get_disburs_society_dtls", async (req, res) => {
    try{
      const {frm_dt,to_dt,pacs_id} = req.query;
      if (!frm_dt || !to_dt || !pacs_id) {
        return res.send({
          success: false,
          msg: "frm_dt, to_dt and pacs_id are required"
        });
      }
      var select = "a.loan_id,a.period,a.curr_roi,a.disb_dt,a.disb_amt,b.branch_name as society_name",
      table_name = "bdccb.td_loan_member a JOIN public.md_branch b ON b.branch_id = a.branch_shg_id";
        whr = `a.disb_dt BETWEEN '${frm_dt}' AND '${to_dt}' AND a.branch_shg_id = '${pacs_id}' AND loan_to='P' `,
        order = null;

      var loan_result = await db_Select(select,table_name,whr,order);
    
      if (loan_result.suc === 1 && loan_result.msg.length > 0) {
          return res.send({
            success: true,
            msg: "Society Loan List",
            data: loan_result.msg
        });
        } else {
          return res.send({
            success: true,
            msg: "Failed to fetch Society Loan List",
            data: []
          });
        }
    }catch(error){
      console.log("Error fetching Society Loan List:", error);
      return res.send({
        success: false,
        msg: "Internal server error",
        errorCode: "SERVER_ERROR"
      });
    }
  });

   reportRouter.get("/get_disburs_dtls_direct", async (req, res) => {
    try{
      const {frm_dt,to_dt,branch_id} = req.query;
      if (!frm_dt || !to_dt || !branch_id) {
        return res.send({
          success: false,
          msg: "frm_dt, to_dt and branch_id are required"
        });
      }
      var select = "a.loan_id,a.period,a.curr_roi,a.disb_dt,a.disb_amt,b.group_name,c.member_name,c.member_account_no",
      table_name = "bdccb.td_loan_member a JOIN bdccb.md_group b ON a.group_code = b.group_code JOIN bdccb.md_member c ON a.group_code = c.group_code";
        whr = `a.disb_dt BETWEEN '${frm_dt}' AND '${to_dt}' AND a.branch_id = '${branch_id}' AND a.loan_to='S' `,
        order = null;

      var loan_result = await db_Select(select,table_name,whr,order);
    
      if (loan_result.suc === 1 && loan_result.msg.length > 0) {
          return res.send({
            success: true,
            msg: "Disbursment List",
            data: loan_result.msg
        });
        } else {
          return res.send({
            success: true,
            msg: "Failed to fetch Disbursment List",
            data: []
          });
        }
    }catch(error){
      console.log("Error fetching Disbursment List:", error);
      return res.send({
        success: false,
        msg: "Internal server error",
        errorCode: "SERVER_ERROR"
      });
    }
});
   
 
// Fetch Branch or Society List from public.md_branch by branch_type (B for Branch, P for Society)
reportRouter.post("/fetch_branch_society_list", async (req, res) => {
	try {
		const { branch_type, tenant_id, branch_code } = req.body;
		const bType = branch_type || 'B';
		
		let select = "branch_id as code, branch_name as name, branch_type, tenant_id";
		let table_name = "public.md_branch";
		let whr = `branch_status = 'O' AND branch_type = '${bType}'`;
		if (tenant_id && tenant_id !== 1 && tenant_id !== "1") {
			whr += ` AND tenant_id = '${tenant_id}'`;
		}
		if (branch_code && branch_code !== "100" && branch_code !== 100 && branch_code !== "undefined" && bType === 'P') {
			whr += ` AND (branch_jurisdiction_id = '${branch_code}' OR branch_id IN (SELECT pacs_id FROM bdccb.md_group WHERE branch_code = '${branch_code}' AND pacs_id IS NOT NULL AND pacs_id != 0) OR branch_id = '${branch_code}')`;
		}

		let order = "branch_name ASC";
		let result = await db_Select(select, table_name, whr, order);

		if (result.suc === 1 && result.msg && result.msg.length > 0) {
			return res.send({ suc: 1, msg: result.msg });
		} else if (bType === 'P' && branch_code) {
			let fallbackWhr = `branch_status = 'O' AND branch_type = 'P'`;
			if (tenant_id && tenant_id !== 1 && tenant_id !== "1") {
				fallbackWhr += ` AND tenant_id = '${tenant_id}'`;
			}
			let fallbackResult = await db_Select(select, table_name, fallbackWhr, order);
			if (fallbackResult.suc === 1) {
				return res.send({ suc: 1, msg: fallbackResult.msg });
			}
		}

		return res.send({ suc: 0, msg: "No branch/society records found" });
	} catch (error) {
		console.error("Error in fetch_branch_society_list:", error);
		return res.send({ suc: 0, msg: "Internal server error" });
	}
});

// 1. Fetch Loan Statement Group Details (CCB vs Society)
reportRouter.post("/loan_statement_group_dtls", async (req, res) => {
	try {
		const { grp, loan_to, branch_code, branch_shg_id, tenant_id } = req.body;
		const b_code = branch_code || branch_shg_id;
		const isCCB = (loan_to === "B" || loan_to === "C");

		// If group name or code is provided, first validate if the group exists and matches CCB vs Society type
		if (grp && grp.trim() !== "") {
			let checkSelect = "a.group_code, a.group_name, a.pacs_id, a.branch_code";
			let checkTable = "bdccb.md_group a";
			let checkWhr = `a.delete_flag = 'N' AND (a.group_name ILIKE '%${grp.trim()}%' OR a.group_code::text ILIKE '%${grp.trim()}%')`;
			if (tenant_id && tenant_id !== 1 && tenant_id !== "1") {
				checkWhr += ` AND a.tenant_id = '${tenant_id}'`;
			}

			// Add branch filter to check
			if (isCCB) {
				if (b_code && b_code !== "112" && !Array.isArray(b_code)) {
					checkWhr += ` AND a.branch_code = '${b_code}'`;
				} else if (Array.isArray(b_code) && b_code.length > 0) {
					checkWhr += ` AND a.branch_code IN ('${b_code.join("','")}')`;
				}
			} else {
				if (b_code && b_code !== "112" && !Array.isArray(b_code)) {
					checkWhr += ` AND (a.pacs_id = '${b_code}' OR a.pacs_id::text = '${b_code}')`;
				} else if (Array.isArray(b_code) && b_code.length > 0) {
					checkWhr += ` AND a.pacs_id IN ('${b_code.join("','")}')`;
				}
			}

			let checkResult = await db_Select(checkSelect, checkTable, checkWhr, null);

			// Fallback global check if not found under specific branch filter
			if (checkResult.suc !== 1 || !checkResult.msg || checkResult.msg.length === 0) {
				let globalWhr = `a.delete_flag = 'N' AND (a.group_name ILIKE '%${grp.trim()}%' OR a.group_code::text ILIKE '%${grp.trim()}%')`;
				if (tenant_id && tenant_id !== 1 && tenant_id !== "1") {
					globalWhr += ` AND a.tenant_id = '${tenant_id}'`;
				}
				checkResult = await db_Select(checkSelect, checkTable, globalWhr, null);
			}

			// Check if any matching group under this name is a mismatch
			if (checkResult.suc === 1 && checkResult.msg && checkResult.msg.length > 0) {
				const hasCCBGroup = checkResult.msg.some(g => !g.pacs_id || g.pacs_id == 111 || g.pacs_id == "111" || g.pacs_id == 0 || g.pacs_id == "0");
				const hasSocietyGroup = checkResult.msg.some(g => g.pacs_id && g.pacs_id != 111 && g.pacs_id != "111" && g.pacs_id != 0 && g.pacs_id != "0");

				if (isCCB && !hasCCBGroup && hasSocietyGroup) {
					return res.send({
						suc: 0,
						isMismatch: true,
						msg: "This is a Society group. Please select Society under Search By."
					});
				}

				if (!isCCB && !hasSocietyGroup && hasCCBGroup) {
					return res.send({
						suc: 0,
						isMismatch: true,
						msg: "This is a CCB group. Please select CCB under Search By."
					});
				}
			}
		}

		// Main query with branch & society names
		let select = "a.group_code, a.group_name, a.branch_code, a.pacs_id, COALESCE(b.branch_name, 'N/A') as branch_name, COALESCE(c.branch_name, 'N/A') as society_name";
		let table_name = "bdccb.md_group a LEFT JOIN public.md_branch b ON a.branch_code = b.branch_id LEFT JOIN public.md_branch c ON a.pacs_id = c.branch_id";

		let whr = "a.delete_flag = 'N'";
		if (grp && grp.trim() !== "") {
			whr += ` AND (a.group_name ILIKE '%${grp.trim()}%' OR a.group_code::text ILIKE '%${grp.trim()}%')`;
		}
		if (tenant_id && tenant_id !== 1 && tenant_id !== "1") {
			whr += ` AND a.tenant_id = '${tenant_id}'`;
		}

		if (isCCB) {
			// CCB mode (loan_to = "B"): MUST filter branch_code AND pacs_id IN (111, 0, NULL)
			if (b_code && b_code !== "112" && !Array.isArray(b_code)) {
				whr += ` AND a.branch_code = '${b_code}'`;
			} else if (Array.isArray(b_code) && b_code.length > 0) {
				whr += ` AND a.branch_code IN ('${b_code.join("','")}')`;
			}
			// ALWAYS strictly include only CCB groups (pacs_id = 111 / 0 / NULL)
			whr += ` AND (a.pacs_id IS NULL OR a.pacs_id = 0 OR a.pacs_id = '0' OR a.pacs_id = 111 OR a.pacs_id = '111')`;
		} else {
			// Society mode (loan_to = "P"): MUST filter pacs_id = '${b_code}' AND pacs_id NOT IN (111, 0, NULL)
			if (b_code && b_code !== "112" && !Array.isArray(b_code)) {
				whr += ` AND (a.pacs_id = '${b_code}' OR a.pacs_id::text = '${b_code}')`;
			} else if (Array.isArray(b_code) && b_code.length > 0) {
				whr += ` AND a.pacs_id IN ('${b_code.join("','")}')`;
			}
			// ALWAYS strictly include only Society groups (pacs_id != 111 AND pacs_id != 0/NULL)
			whr += ` AND (a.pacs_id IS NOT NULL AND a.pacs_id != 0 AND a.pacs_id != '0' AND a.pacs_id != 111 AND a.pacs_id != '111')`;
		}

		let order = "a.group_name ASC";
		let result = await db_Select(select, table_name, whr, order);

		if (result.suc === 1 && result.msg && result.msg.length > 0) {
			return res.send({
				suc: 1,
				msg: result.msg,
				group_type: isCCB ? "CCB group" : "Society group",
				message: isCCB ? "CCB group details fetched successfully" : "Society group details fetched successfully"
			});
		} else {
			return res.send({
				suc: 0,
				msg: isCCB ? "No CCB group records found for selected branch" : "No Society group records found for selected society branch"
			});
		}
	} catch (error) {
		console.error("Error in loan_statement_group_dtls:", error);
		return res.send({ suc: 0, msg: "Internal server error" });
	}
});

// 0.9 Fetch SHG Outstanding Group Details for SHG search mode (fetches all groups where pacs_id in 111 and not in 111)
reportRouter.post("/shg_outstanding_group_dtls", async (req, res) => {
	try {
		const { grp, loan_to, branch_code, branch_shg_id, tenant_id } = req.body;
		const b_code = branch_code || branch_shg_id;

		let select = "a.group_code, a.group_name, a.branch_code, a.pacs_id, COALESCE(b.branch_name, 'N/A') as branch_name, CASE WHEN a.pacs_id = 111 OR a.pacs_id = '111' OR c.branch_name ILIKE '%demo%' THEN 'N/A' ELSE COALESCE(c.branch_name, 'N/A') END as society_name";
		let table_name = "bdccb.md_group a LEFT JOIN public.md_branch b ON a.branch_code = b.branch_id LEFT JOIN public.md_branch c ON a.pacs_id = c.branch_id";

		let whr = "a.delete_flag = 'N'";
		if (grp && grp.trim() !== "") {
			whr += ` AND (a.group_name ILIKE '%${grp.trim()}%' OR a.group_code::text ILIKE '%${grp.trim()}%')`;
		}
		if (tenant_id && tenant_id !== 1 && tenant_id !== "1") {
			whr += ` AND a.tenant_id = '${tenant_id}'`;
		}

		// Filter by branch_code: fetches ALL groups under selected branch (where pacs_id is 111 and where pacs_id is not 111)
		if (b_code && b_code !== "112" && !Array.isArray(b_code)) {
			whr += ` AND a.branch_code = '${b_code}'`;
		} else if (Array.isArray(b_code) && b_code.length > 0) {
			whr += ` AND a.branch_code IN ('${b_code.join("','")}')`;
		}

		let order = "a.group_name ASC";
		let result = await db_Select(select, table_name, whr, order);

		if (result.suc === 1 && result.msg && result.msg.length > 0) {
			return res.send({
				suc: 1,
				msg: result.msg,
				message: "SHG group details fetched successfully"
			});
		} else {
			return res.send({
				suc: 0,
				msg: "No group records found for selected branch"
			});
		}
	} catch (error) {
		console.error("Error in shg_outstanding_group_dtls:", error);
		return res.send({ suc: 0, msg: "Internal server error" });
	}
});

// 0.95 Fetch SHG Member Outstanding Details from bdccb.td_loan_member & bdccb.td_loan_member_trans
reportRouter.post("/fetch_shg_member_outstanding_report", async (req, res) => {
	try {
		const { group_code, as_on_date, tenant_id } = req.body;
		if (!group_code) {
			return res.send({ suc: 0, msg: "Group code is required" });
		}

		const filterDate = as_on_date || new Date().toISOString().split("T")[0];

		let select = `DISTINCT ON (a.member_code)
			a.loan_id,
			COALESCE(a.ccb_loan_id::text, a.loan_acc_no::text, a.loan_id::text) as ccb_loan_id,
			a.member_code,
			COALESCE(m.member_name::text, 'N/A') as member_name,
			COALESCE(a.period, 0) as period,
			COALESCE(a.curr_roi, 0) as curr_roi,
			COALESCE(a.penal_roi::numeric, 0) as penal_roi,
			a.disb_dt as disb_date,
			COALESCE(a.disb_amt, 0) as disb_amt,
			COALESCE(a.period_mode::text, 'N/A') as period_mode,
			COALESCE(a.rep_start_dt, a.disb_dt) as start_date,
			COALESCE(a.rep_end_dt, a.disb_dt) as end_date,
			COALESCE(
				(
					SELECT (COALESCE(b.curr_prn, 0) + COALESCE(b.curr_intt, 0))::numeric
					FROM bdccb.td_loan_member_trans b
					WHERE b.loan_id = a.loan_id AND b.trans_date <= '${filterDate}' AND (b.approval_status = 'A' OR b.approval_status IS NULL)
					ORDER BY b.trans_date DESC, b.trans_id DESC
					LIMIT 1
				),
				(
					SELECT SUM(COALESCE(b.curr_prn, 0) + COALESCE(b.curr_intt, 0))::numeric
					FROM bdccb.td_loan_member_trans b
					WHERE b.loan_id = a.loan_id AND b.trans_date <= '${filterDate}' AND (b.approval_status = 'A' OR b.approval_status IS NULL)
				),
				(
					SELECT SUM(COALESCE(b.dr_amt, 0) - COALESCE(b.cr_amt, 0))::numeric
					FROM bdccb.td_loan_member_trans b
					WHERE b.loan_id = a.loan_id AND b.trans_date <= '${filterDate}' AND (b.approval_status = 'A' OR b.approval_status IS NULL)
				),
				a.prn_amt::numeric,
				a.disb_amt::numeric,
				0
			) as member_outstanding
		`;

		let table_name = `
			bdccb.td_loan_member a
			LEFT JOIN bdccb.md_member m ON a.member_code = m.member_code
		`;

		let whr = `a.group_code = '${group_code}'`;
		if (tenant_id && tenant_id !== 1 && tenant_id !== "1") {
			whr += ` AND a.tenant_id = '${tenant_id}'`;
		}

		let order = `a.member_code ASC, a.disb_dt DESC, a.loan_id DESC`;

		let result = await db_Select(select, table_name, whr, order);

		if (result.suc === 1 && result.msg && result.msg.length > 0) {
			return res.send({
				suc: 1,
				msg: result.msg,
				message: "Member outstanding details fetched successfully"
			});
		} else {
			return res.send({
				suc: 0,
				msg: "No member loan outstanding records found for this group"
			});
		}
	} catch (error) {
		console.error("Error in fetch_shg_member_outstanding_report:", error);
		return res.send({ suc: 0, msg: "Internal server error" });
	}
});

// 0.96 Fetch Society / CCB Outstanding Group Details (1 row per group with latest balance as of as_on_date)
reportRouter.post("/fetch_society_ccb_outstanding_report", async (req, res) => {
	try {
		const { tenant_id, loan_to, as_on_date, branch_code, branch_shg_id } = req.body;

		const isCCB = (loan_to === "B" || loan_to === "C");
		const filterDate = as_on_date || new Date().toISOString().split("T")[0];

		let mainTable = isCCB ? "bdccb.td_loan_ccb" : "bdccb.td_loan";
		let transTable = isCCB ? "bdccb.td_loan_ccb_trans" : "bdccb.td_loan_transactions";

		let groupCol = "COALESCE(a.group_code::text, a.group_code::text)";
		let select = `DISTINCT ON (${groupCol})
			a.loan_id,
			COALESCE(a.loan_acc_no::text, a.loan_id::text) as loan_acc_no,
			COALESCE(a.period, 0) as period,
			COALESCE(a.curr_roi, 0) as curr_roi,
			COALESCE(a.penal_roi::numeric, 0) as penal_roi,
			a.disb_dt as disb_date,
			COALESCE(a.disb_amt, 0) as disb_amt,
			COALESCE(a.pay_mode::text, 'N/A') as period_mode,
			COALESCE(a.rep_start_dt, a.disb_dt) as start_date,
			COALESCE(a.rep_end_dt, a.disb_dt) as end_date,
			COALESCE(
				(
					SELECT (COALESCE(b.curr_prn, 0) + COALESCE(b.curr_intt, 0))::numeric
					FROM ${transTable} b
					WHERE (b.loan_id::text = a.loan_id::text OR b.loan_acc_no::text = a.loan_acc_no::text OR (a.group_code IS NOT NULL AND b.branch_shg_id::text = a.group_code::text))
					  AND (b.trans_dt::date <= '${filterDate}'::date OR b.trans_dt IS NULL)
					  AND (b.approval_status = 'A' OR b.approval_status IS NULL OR b.approval_status = '')
					ORDER BY b.trans_dt DESC, b.trans_id DESC
					LIMIT 1
				),
				(
					SELECT (COALESCE(b.curr_prn, 0) + COALESCE(b.curr_intt, 0))::numeric
					FROM ${transTable} b
					WHERE (b.loan_id::text = a.loan_id::text OR b.loan_acc_no::text = a.loan_acc_no::text OR (a.group_code IS NOT NULL AND b.branch_shg_id::text = a.group_code::text))
					  AND (b.approval_status = 'A' OR b.approval_status IS NULL OR b.approval_status = '')
					ORDER BY b.trans_id DESC
					LIMIT 1
				),
				(
					SELECT SUM(COALESCE(b.dr_amt, 0) - COALESCE(b.cr_amt, 0))::numeric
					FROM ${transTable} b
					WHERE (b.loan_id::text = a.loan_id::text OR b.loan_acc_no::text = a.loan_acc_no::text OR (a.group_code IS NOT NULL AND b.branch_shg_id::text = a.group_code::text))
					  AND (b.trans_dt::date <= '${filterDate}'::date OR b.trans_dt IS NULL)
					  AND (b.approval_status = 'A' OR b.approval_status IS NULL OR b.approval_status = '')
				),
				(COALESCE(a.curr_prn, 0) + COALESCE(a.curr_intt, 0))::numeric,
				a.curr_prn::numeric,
				a.disb_amt::numeric,
				0
			) as group_outstanding,
			${groupCol} as group_code,
			COALESCE(g.group_name::text, 'N/A') as group_name
		`;

		let table_name = `
			${mainTable} a
			LEFT JOIN bdccb.md_group g ON (${groupCol} = g.group_code::text)
		`;

		let whr = `1=1`;
		if (isCCB) {
			if (branch_code) {
				whr += ` AND a.branch_id::text = '${branch_code}'`;
			}
		} else {
			if (branch_code) {
				whr += ` AND a.branch_id::text = '${branch_code}'`;
			}
			if (branch_shg_id && branch_shg_id !== "undefined") {
				whr += ` AND a.branch_shg_id::text = '${branch_shg_id}'`;
			}
		}
		if (tenant_id && tenant_id !== 1 && tenant_id !== "1") {
			whr += ` AND a.tenant_id::text = '${tenant_id}'`;
		}

		let order = `${groupCol} ASC, a.disb_dt DESC, a.loan_id DESC`;

		let result = await db_Select(select, table_name, whr, order);

		if (result.suc === 1 && result.msg && result.msg.length > 0) {
			return res.send({
				suc: 1,
				msg: result.msg,
				message: "Society/CCB group outstanding details fetched successfully"
			});
		} else {
			return res.send({
				suc: 0,
				msg: "No loan outstanding records found for selected branch/society"
			});
		}
	} catch (error) {
		console.error("Error in fetch_society_ccb_outstanding_report:", error);
		return res.send({ suc: 0, msg: "Internal server error" });
	}
});

// 1.1 Fetch Group Loan Master Details (bdccb.td_loan_ccb for CCB vs bdccb.td_loan for Society)
reportRouter.post("/fetch_group_loan_master_dtls", async (req, res) => {
	try {
		const { group_code, loan_to, tenant_id, from_date, to_date } = req.body;
		if (!group_code) {
			return res.send({ suc: 0, msg: "Group code is required" });
		}

		const isCCB = (loan_to === "B" || loan_to === "C");
		let table_name = isCCB ? "bdccb.td_loan_ccb a" : "bdccb.td_loan a";

		let select = `
			a.loan_id,
			COALESCE(a.loan_acc_no, a.loan_id::text) as loan_acc_no,
			COALESCE(a.period, 0) as period,
			COALESCE(a.curr_roi, 0) as curr_roi,
			COALESCE(a.penal_roi, 0) as ovd_roi,
			a.disb_dt as disb_date,
			COALESCE(a.disb_amt, 0) as disb_amt,
			COALESCE(a.pay_mode::text, 'N/A') as paymode,
			COALESCE(a.rep_start_dt, a.disb_dt) as start_date,
			COALESCE(a.rep_end_dt, a.disb_dt) as end_date,
			COALESCE(a.curr_prn, 0) as current_loan_outstanding,
			a.group_code
		`;
		
		let whr = `a.group_code = '${group_code}'`;
		if (from_date && to_date) {
			whr += ` AND a.disb_dt BETWEEN '${from_date}' AND '${to_date}'`;
		}
		if (tenant_id && tenant_id !== 1 && tenant_id !== "1") {
			whr += ` AND a.tenant_id = '${tenant_id}'`;
		}

		let order = "a.loan_id DESC";
		let result = await db_Select(select, table_name, whr, order);

		// Fallback check if no records found in primary table
		if (!result || result.suc !== 1 || !result.msg || result.msg.length === 0) {
			let fallbackTable = isCCB ? "bdccb.td_loan a" : "bdccb.td_loan_ccb a";
			let fallbackResult = await db_Select(select, fallbackTable, whr, order);
			if (fallbackResult && fallbackResult.suc === 1 && fallbackResult.msg && fallbackResult.msg.length > 0) {
				return res.send({ suc: 1, msg: fallbackResult.msg });
			}
		}

		if (result.suc === 1 && result.msg && result.msg.length > 0) {
			return res.send({ suc: 1, msg: result.msg });
		} else {
			return res.send({ suc: 0, msg: "No loan details found for this group" });
		}
	} catch (error) {
		console.error("Error in fetch_group_loan_master_dtls:", error);
		return res.send({ suc: 0, msg: "Internal server error" });
	}
});

// 1.2 Fetch Detailed Loan Transactions (bdccb.td_loan_ccb_trans for CCB vs bdccb.td_loan_transactions for Society)
reportRouter.post("/fetch_loan_transaction_details", async (req, res) => {
	try {
		const { loan_id, loan_to, from_date, to_date, tenant_id } = req.body;
		if (!loan_id) {
			return res.send({ suc: 0, msg: "Loan ID is required" });
		}

		const isCCB = (loan_to === "B" || loan_to === "C");
		let table_name = isCCB 
			? "bdccb.td_loan_ccb_trans b LEFT JOIN bdccb.md_user e ON b.approved_by = e.user_id" 
			: "bdccb.td_loan_transactions b LEFT JOIN bdccb.md_user e ON b.approved_by = e.user_id";

		let select = `
			b.loan_id,
			COALESCE(b.trans_id, 0) as trans_id,
			COALESCE(b.trans_dt) as trans_date,
			COALESCE(b.trans_type) as tr_type,
			COALESCE(b.dr_amt, 0) as debit_amt,
			COALESCE(b.cr_amt, 0) as credit_amt,
			COALESCE(b.curr_prn, 0) as outstanding_amt,
			COALESCE(b.approved_by::text, 'N/A') as approved_by,
			b.approved_dt,
			COALESCE(b.approval_status, 'A') as approval_status
		`;
		let whr = `b.loan_id = '${loan_id}'`;

		if (from_date && to_date) {
			whr += ` AND COALESCE(b.trans_dt)::date BETWEEN '${from_date}' AND '${to_date}'`;
		}
		if (tenant_id && tenant_id !== 1 && tenant_id !== "1") {
			whr += ` AND b.tenant_id = '${tenant_id}'`;
		}

		let order = "COALESCE(b.trans_dt) ASC, COALESCE(b.trans_id) ASC";
		let result = await db_Select(select, table_name, whr, order);

		// Fallback check to alternate transaction table if primary transaction table has 0 records
		if (!result || result.suc !== 1 || !result.msg || result.msg.length === 0) {
			let fallbackTable = isCCB 
				? "bdccb.td_loan_transactions b LEFT JOIN bdccb.md_user e ON b.approved_by = e.user_id"
				: "bdccb.td_loan_ccb_trans b LEFT JOIN bdccb.md_user e ON b.approved_by = e.user_id";
			let fallbackResult = await db_Select(select, fallbackTable, whr, order);
			if (fallbackResult && fallbackResult.suc === 1 && fallbackResult.msg && fallbackResult.msg.length > 0) {
				return res.send({ suc: 1, msg: fallbackResult.msg });
			}
		}

		if (result.suc === 1 && result.msg && result.msg.length > 0) {
			return res.send({ suc: 1, msg: result.msg });
		} else {
			return res.send({ suc: 0, msg: "No transaction records found for this loan ID" });
		}
	} catch (error) {
		console.error("Error in fetch_loan_transaction_details:", error);
		return res.send({ suc: 0, msg: "Internal server error" });
	}
});

// 2. Fetch Loan Statement Group Report Transactions
reportRouter.post("/loan_statement_group_report", async (req, res) => {
	try {
		const { from_dt, to_dt, group_code } = req.body;
		let select = "b.trans_no, b.trans_date, b.tr_type, COALESCE(b.dr_amt, 0) as debit, COALESCE(b.cr_amt, 0) as credit, COALESCE(b.bal_amt, 0) as balance, a.loan_id, a.group_code";
		let table_name = "bdccb.td_loan a JOIN bdccb.td_loan_transactions b ON a.loan_id = b.loan_id";

		let whr = `a.group_code = '${group_code}'`;
		if (from_dt && to_dt) {
			whr += ` AND b.trans_date BETWEEN '${from_dt}' AND '${to_dt}'`;
		}

		let order = "b.trans_date ASC, b.trans_no ASC";
		let result = await db_Select(select, table_name, whr, order);

		if (result.suc === 1) {
			return res.send({ suc: 1, msg: result.msg });
		} else {
			return res.send({ suc: 0, msg: "No transaction records found" });
		}
	} catch (error) {
		console.error("Error in loan_statement_group_report:", error);
		return res.send({ suc: 0, msg: "Internal server error" });
	}
});

// 3. Fetch Loan Statement Member Details
// reportRouter.post("/loan_statement_memb_dtls", async (req, res) => {
// 	try {
// 		const { memb, branch_code } = req.body;
// 		let select = "a.member_code, a.member_name as client_name, a.group_code, b.group_name, a.loan_id, a.area_code, c.branch_name";
// 		let table_name = "bdccb.md_member a LEFT JOIN bdccb.md_group b ON a.group_code = b.group_code LEFT JOIN public.md_branch c ON a.branch_code = c.branch_id";

// 		let whr = "1=1";
// 		if (memb) {
// 			whr += ` AND (a.member_name ILIKE '%${memb}%' OR a.member_code::text ILIKE '%${memb}%')`;
// 		}
// 		if (branch_code && !Array.isArray(branch_code)) {
// 			whr += ` AND a.branch_code = '${branch_code}'`;
// 		}

// 		let order = "a.member_name ASC";
// 		let result = await db_Select(select, table_name, whr, order);

// 		if (result.suc === 1) {
// 			return res.send({ suc: 1, msg: result.msg });
// 		} else {
// 			return res.send({ suc: 0, msg: "No member records found" });
// 		}
// 	} catch (error) {
// 		console.error("Error in loan_statement_memb_dtls:", error);
// 		return res.send({ suc: 0, msg: "Internal server error" });
// 	}
// });

// 4. Fetch Loan Statement Member Report Transactions
reportRouter.post("/loan_statement_report", async (req, res) => {
	try {
		const { from_dt, to_dt, loan_id } = req.body;
		let select = "a.trans_no, a.trans_date, a.tr_type, COALESCE(a.dr_amt, 0) as debit, COALESCE(a.cr_amt, 0) as credit, COALESCE(a.curr_prn_recov, 0) as curr_prn_recov, COALESCE(a.curr_intt_recov, 0) as curr_intt_recov, a.loan_id";
		let table_name = "bdccb.td_loan_member_trans a";

		let whr = `a.loan_id = '${loan_id}'`;
		if (from_dt && to_dt) {
			whr += ` AND a.trans_date BETWEEN '${from_dt}' AND '${to_dt}'`;
		}

		let order = "a.trans_date ASC, a.trans_no ASC";
		let result = await db_Select(select, table_name, whr, order);

		if (result.suc === 1) {
			return res.send({ suc: 1, msg: result.msg });
		} else {
			return res.send({ suc: 0, msg: "No transaction records found" });
		}
	} catch (error) {
		console.error("Error in loan_statement_report:", error);
		return res.send({ suc: 0, msg: "Internal server error" });
	}
});

module.exports = { reportRouter }