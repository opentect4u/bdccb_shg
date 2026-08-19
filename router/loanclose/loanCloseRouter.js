const express = require("express");
const loanCloseRouter = express.Router();
const { db_Select, saveRecord } = require("../../model/pgcommon");

loanCloseRouter.post("/search_loan_close_grp", async (req, res) => {
    try {
        const { tenant_id, branch_code, group_name_view, branch_type } = req.body;

        let branchCondition = '1=1';
        let branchConditions = '1=1';

        if (branch_type === 'B') {
            branchCondition = `a.branch_id = '${branch_code}'`;
        } else if (branch_type === 'H') {
            branchCondition = `1=1`; // Head office sees all
        } else if (branch_type === 'P') {
            branchCondition = `a.branch_shg_id = '${branch_code}' AND a.loan_to = 'P'`;
        } else if (branch_type === 'BP') {
            branchCondition = `a.branch_id = '${branch_code}' AND a.loan_to = 'P'`;
        }

        if (branch_type === 'B') {
            branchConditions = `a.branch_code = '${branch_code}'`;
        } else if (branch_type === 'H') {
            branchConditions = `1=1`; // Head office sees all
        } else if (branch_type === 'P') {
            branchConditions = `a.pacs_id = '${branch_code}'`;
        } else if (branch_type === 'BP') {
            branchConditions = `a.branch_code = '${branch_code}'`;
        }

        var select = "a.group_code,b.group_name,a.loan_acc_no, COALESCE(c.acc_status, 'O') as acc_status",
            table_name = "bdccb.td_loan_member a LEFT JOIN bdccb.md_group b ON a.group_code = b.group_code LEFT JOIN bdccb.td_loan_ccb c ON a.loan_acc_no = c.loan_acc_no AND a.group_code = c.group_code",
            whr = `a.tenant_id = '${tenant_id}' AND ${branchCondition} AND (a.group_code::TEXT ILIKE '%${group_name_view}%' OR a.loan_acc_no::TEXT ILIKE '%${group_name_view}%' OR b.group_name::TEXT ILIKE '%${group_name_view}%') GROUP BY a.group_code,b.group_name,a.loan_acc_no, c.acc_status`,
            order = null;
        var shg_search_grp_view = await db_Select(select, table_name, whr, order);

        if (shg_search_grp_view.suc !== 1 || shg_search_grp_view.msg.length === 0) {
            return res.send({
                success: true,
                msg: "No data found",
                data: []
            });
        }

        let groupCode = shg_search_grp_view.msg[0].group_code;
        let loanAccNo = shg_search_grp_view.msg[0].loan_acc_no;

        var select1 = "a.group_code,a.branch_code,b.society_acc_no,c.branch_name,a.group_name,a.phone1,a.sahayika_id,d.sahayika_name,a.group_addr,a.dist_id,e.dist_name,a.block_id,f.block_name,a.ps_id,g.ps_name,a.po_id,h.post_name,a.gp_id,i.gp_name,a.village_id,j.vill_name,a.pin_no,a.open_close_flag,a.grp_open_dt,a.grp_close_dt,a.delete_flag,a.direct_indirect_flag,a.pacs_id,k.branch_name AS pacs_name",
            table_name1 = "bdccb.md_group a LEFT JOIN bdccb.td_loan_member b ON a.group_code = b.group_code LEFT JOIN public.md_branch c ON a.branch_code = c.branch_id LEFT JOIN bdccb.md_sahayika d ON a.sahayika_id = d.sahayika_id LEFT JOIN public.md_district e ON a.dist_id = e.dist_code LEFT JOIN public.md_block f ON a.block_id = f.block_id LEFT JOIN public.md_police_station g ON a.ps_id = g.ps_id LEFT JOIN public.md_postoffice h ON a.po_id = h.po_id LEFT JOIN public.md_gp i ON a.gp_id = i.gp_id LEFT JOIN public.md_village j ON a.village_id = j.vill_id LEFT JOIN public.md_branch k ON a.pacs_id = k.branch_id",
            whr1 = `a.group_code = '${groupCode}' AND ${branchConditions} AND a.delete_flag = 'N' AND b.loan_acc_no = '${loanAccNo}' GROUP BY a.group_code,a.branch_code,b.society_acc_no,c.branch_name,a.group_name,a.phone1,a.sahayika_id,d.sahayika_name,a.group_addr,a.dist_id,e.dist_name,a.block_id,f.block_name,a.ps_id,g.ps_name,a.po_id,h.post_name,a.gp_id,i.gp_name,a.village_id,j.vill_name,a.pin_no,a.open_close_flag,a.grp_open_dt,a.grp_close_dt,a.delete_flag,a.direct_indirect_flag,a.pacs_id,k.branch_name`,
            order1 = null;
        var shg_search_grp_view_dtls = await db_Select(select1, table_name1, whr1, order1);

        let shg_grpData = (shg_search_grp_view_dtls.suc === 1 && Array.isArray(shg_search_grp_view_dtls.msg))
            ? shg_search_grp_view_dtls.msg
            : [];

        let finalData = (shg_search_grp_view.msg || []).map(item => {
            return {
                ...item,
                group_details: shg_grpData
            };
        });

        return res.send({
            success: true,
            msg: "Fetch shg group details",
            data: finalData
        })
    } catch (error) {
        console.log(error);
        return res.send({
            success: false,
            msg: "Some error occurred!",
        });
    }
});

const ccbtrans_id = async () => {
    const timestamp = new Date().getTime();
    const random = Math.floor(Math.random() * 1000);
    return `${timestamp}${random}`;
};

loanCloseRouter.post("/close_loan_ccb", async (req, res) => {
    try {
        const { loan_id, loan_acc_no, group_code, curr_prn, curr_intt, tenant_id, branch_id, created_by } = req.body;

        let datetime = new Date().toISOString().replace('T', ' ').split('.')[0];
        let trans_dt = new Date().toISOString().split('T')[0];
        let ip_address = req.socket.remoteAddress;

        // 1. SELECT from bdccb.td_loan_ccb
        let sel_query = "loan_to, branch_shg_id, ovd_prn, ovd_intt";
        let sel_table = "bdccb.td_loan_ccb";
        let sel_whr = `loan_id = '${loan_id}' AND tenant_id = '${tenant_id}'`;
        let sel_res = await db_Select(sel_query, sel_table, sel_whr, null);

        if (!sel_res || sel_res.suc !== 1 || sel_res.msg.length === 0) {
            return res.send({ success: false, msg: "Loan details not found" });
        }

        let loanData = sel_res.msg[0];
        let loan_to = loanData.loan_to || 'S';
        let branch_shg_id = loanData.branch_shg_id || branch_id;
        let ovd_prn = loanData.ovd_prn || 0;
        let ovd_intt = loanData.ovd_intt || 0;

        // 2. INSERT into bdccb.td_loan_ccb_trans
        let tran_id = await ccbtrans_id();
        let table_ins = "bdccb.td_loan_ccb_trans";
        let columns_ins = [
            "trans_dt", "trans_id", "tenant_id", "loan_to", "branch_shg_id", "loan_id", "loan_ac_no",
            "trans_type", "dr_amt", "cr_amt", "curr_prn_recov", "curr_intt_recov", "ovd_prn_recov", "ovd_intt_recov",
            "curr_prn", "curr_intt", "ovd_prn", "ovd_intt", "approval_status", "approved_by", "approved_dt",
            "created_by", "created_dt", "ip_address"
        ];

        let cr_amt_val = parseFloat(curr_prn) + parseFloat(curr_intt);

        let values_ins = [
            trans_dt, tran_id, tenant_id, loan_to, branch_shg_id, loan_id, loan_acc_no,
            'R', 0, cr_amt_val, curr_prn, curr_intt, 0, 0,
            0, 0, ovd_prn, ovd_intt, 'A', created_by, datetime,
            created_by, datetime, ip_address
        ];
        let flag_ins = 0;

        const insertRes = await saveRecord(table_ins, columns_ins, values_ins, [], [], flag_ins);
        if (!insertRes || insertRes.suc !== 1) {
            return res.send({ success: false, msg: "Failed to insert loan closure transaction" });
        }

        // 3. UPDATE bdccb.td_loan_ccb
        let table_upd = "bdccb.td_loan_ccb";
        let columns_upd = ["acc_status", "curr_prn", "curr_intt", "modified_by", "modified_dt", "ip_address"];
        let values_upd = ['C', 0, 0, created_by, datetime, ip_address];
        let whereColumns_upd = ["loan_id", "tenant_id", "group_code"];
        let whereValues_upd = [loan_id, tenant_id, group_code];
        let flag_upd = 1;

        const updateRes = await saveRecord(table_upd, columns_upd, values_upd, whereColumns_upd, whereValues_upd, flag_upd);
        if (!updateRes || updateRes.suc !== 1) {
            return res.send({ success: false, msg: "Failed to update loan status" });
        }

        return res.send({
            success: true,
            msg: "Loan closed successfully",
        });
    } catch (error) {
        console.log(error);
        return res.send({
            success: false,
            msg: "Error occurred while closing loan",
        });
    }
});

loanCloseRouter.post("/close_loan_society", async (req, res) => {
    try {
        const { loan_id, loan_acc_no, group_code, curr_prn, curr_intt, tenant_id, branch_id, created_by } = req.body;

        let datetime = new Date().toISOString().replace('T', ' ').split('.')[0];
        let trans_dt = new Date().toISOString().split('T')[0];
        let ip_address = req.socket.remoteAddress;

        // 1. SELECT from bdccb.td_loan
        let sel_query = "loan_to, branch_shg_id"; // ovd not typical but let's default to 0
        let sel_table = "bdccb.td_loan";
        let sel_whr = `loan_id = '${loan_id}' AND tenant_id = '${tenant_id}'`;
        let sel_res = await db_Select(sel_query, sel_table, sel_whr, null);

        if (!sel_res || sel_res.suc !== 1 || sel_res.msg.length === 0) {
            return res.send({ success: false, msg: "Loan details not found" });
        }

        let loanData = sel_res.msg[0];
        let loan_to = loanData.loan_to || 'P'; // typically P or M for society, let's use 'P' for PACS
        let branch_shg_id = loanData.branch_shg_id || branch_id;
        let ovd_prn = loanData.ovd_prn || 0;
        let ovd_intt = loanData.ovd_intt || 0;

        // 2. INSERT into bdccb.td_loan_transactions
        let tran_id = await ccbtrans_id(); // Using the same trans_id generator
        let table_ins = "bdccb.td_loan_transactions";
        let columns_ins = [
            "trans_dt", "trans_id", "tenant_id", "loan_to", "branch_shg_id", "loan_id", "loan_ac_no",
            "trans_type", "dr_amt", "cr_amt", "curr_prn_recov", "curr_intt_recov", "ovd_prn_recov", "ovd_intt_recov",
            "curr_prn", "curr_intt", "ovd_prn", "ovd_intt", "approval_status", "created_by", "created_dt", "ip_address"
        ];

        let cr_amt_val = parseFloat(curr_prn) + parseFloat(curr_intt);

        let values_ins = [
            trans_dt, tran_id, tenant_id, loan_to, branch_shg_id, loan_id, loan_acc_no,
            'R', 0, cr_amt_val, curr_prn, curr_intt, 0, 0,
            0, 0, ovd_prn, ovd_intt, 'A', created_by, datetime, ip_address
        ];
        let flag_ins = 0;

        const insertRes = await saveRecord(table_ins, columns_ins, values_ins, [], [], flag_ins);
        if (!insertRes || insertRes.suc !== 1) {
            return res.send({ success: false, msg: "Failed to insert loan closure transaction" });
        }

        // 3. UPDATE bdccb.td_loan
        let table_upd = "bdccb.td_loan";
        let columns_upd = ["acc_status", "curr_prn", "curr_intt", "modified_by", "modified_dt", "ip_address"];
        let values_upd = ['C', 0, 0, created_by, datetime, ip_address];
        let whereColumns_upd = ["loan_id", "tenant_id", "group_code"];
        let whereValues_upd = [loan_id, tenant_id, group_code];
        let flag_upd = 1;

        const updateRes = await saveRecord(table_upd, columns_upd, values_upd, whereColumns_upd, whereValues_upd, flag_upd);
        if (!updateRes || updateRes.suc !== 1) {
            return res.send({ success: false, msg: "Failed to update loan status" });
        }

        return res.send({
            success: true,
            msg: "Loan closed successfully",
        });
    } catch (error) {
        console.log(error);
        return res.send({
            success: false,
            msg: "Error occurred while closing loan",
        });
    }
});

loanCloseRouter.post("/close_loan_group", async (req, res) => {
    try {
        const { loan_id, curr_prn, curr_intt, tenant_id, created_by } = req.body;

        let datetime = new Date().toISOString().replace('T', ' ').split('.')[0];
        let trans_dt = new Date().toISOString().split('T')[0];
        let ip_address = req.socket.remoteAddress;

        // 1. SELECT from bdccb.td_loan_member
        let sel_query = "*";
        let sel_table = "bdccb.td_loan_member";
        let sel_whr = `loan_id = '${loan_id}' AND tenant_id = '${tenant_id}'`;
        let sel_res = await db_Select(sel_query, sel_table, sel_whr, null);

        if (!sel_res || sel_res.suc !== 1 || sel_res.msg.length === 0) {
            return res.send({ success: false, msg: "Loan details not found" });
        }

        let loanData = sel_res.msg[0];
        let ovd_prn = loanData.ovd_prn || 0;
        let ovd_intt = loanData.ovd_intt || 0;
        let ccb_loan_id = loanData.ccb_loan_id || loan_acc_no;
        let member_branch_id = loanData.branch_id || branch_id;

        // 2. INSERT into bdccb.td_loan_member_trans
        let tran_id = await ccbtrans_id();
        let cr_amt_val = parseFloat(curr_prn) + parseFloat(curr_intt);
        let table_ins = "bdccb.td_loan_member_trans";
        let columns_ins = [
            "trans_date", "trans_id", "loan_id", "ccb_loan_id", "tenant_id", "branch_id", 
            "loan_to", "branch_shg_id", "loan_acc_no", "trans_type", 
            "dr_amt", "cr_amt", "curr_prn_recov", "curr_intt_recov", "ovd_prn_recov", "ovd_intt_recov", 
            "curr_prn", "curr_intt", "ovd_prn", "ovd_intt", "approval_status", "created_by", "created_dt", "ip_address"
        ];
        let values_ins = [
            trans_dt, tran_id, loan_id, ccb_loan_id, tenant_id, member_branch_id, 
            loanData.loan_to || "M", loanData.branch_shg_id || member_branch_id, loanData.loan_acc_no || loan_id, "R", 
            0, cr_amt_val, curr_prn, curr_intt, 0, 0, 
            0, 0, ovd_prn, ovd_intt, "A", created_by, datetime, ip_address
        ];
        const insertRes = await saveRecord(table_ins, columns_ins, values_ins, [], [], 0);
        if (!insertRes || insertRes.suc !== 1) {
            return res.send({ success: false, msg: "Failed to insert loan member transaction" });
        }

        // 3. UPDATE bdccb.td_loan_member
        let table_upd = "bdccb.td_loan_member";
        let columns_upd = ["acc_status", "prn_amt", "intt_amt", "modified_by", "modified_at", "ip_address"];
        let values_upd = ['C', 0, 0, created_by, datetime, ip_address];
        let whereColumns_upd = ["loan_id", "tenant_id", "group_code"];
        let whereValues_upd = [loan_id, tenant_id, loanData.group_code];
        let flag_upd = 1;

        const updateRes = await saveRecord(table_upd, columns_upd, values_upd, whereColumns_upd, whereValues_upd, flag_upd);
        if (!updateRes || updateRes.suc !== 1) {
            return res.send({ success: false, msg: "Failed to update loan status" });
        }

        return res.send({
            success: true,
            msg: "Loan closed successfully",
        });
    } catch (error) {
        console.log(error);
        return res.send({
            success: false,
            msg: "Error occurred while closing loan",
        });
    }
});

module.exports = { loanCloseRouter };
