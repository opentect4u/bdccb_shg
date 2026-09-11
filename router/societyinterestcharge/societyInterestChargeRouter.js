const express = require("express");
const societyInterestChargeRouter = express.Router();
const { db_Select, saveRecord } = require("../../model/pgcommon");

const transaction_id = async () => {
    const timestamp = new Date().getTime();
    const random = Math.floor(Math.random() * 1000);
    const newPayId = `${timestamp}${random.toString().padStart(3, '0')}`;
    return newPayId;
};

societyInterestChargeRouter.post("/search_society_loan", async (req, res) => {
    try {
        const { tenant_id, branch_code, society_loan_ac_no } = req.body;

        var select = "a.loan_id as loan_id, a.branch_id, a.branch_shg_id, a.curr_prn, a.curr_intt, b.group_name, b.group_code, c.branch_name",
            table_name = "bdccb.td_loan a LEFT JOIN bdccb.md_group b ON a.group_code = b.group_code LEFT JOIN public.md_branch c ON a.branch_id = c.branch_id",
            whr = `a.loan_acc_no = '${society_loan_ac_no}' AND a.acc_status = 'O' AND a.tenant_id = '${tenant_id}' AND a.branch_shg_id = '${branch_code}'`,
            order = null;

        var search_res = await db_Select(select, table_name, whr, order);

        if (search_res.suc !== 1 || search_res.msg.length === 0) {
            return res.send({
                success: true,
                msg: "No data found",
                data: []
            });
        }

        return res.send({
            success: true,
            msg: "Data fetched successfully",
            data: search_res.msg
        });

    } catch (err) {
        console.error("Error in search_society_loan:", err);
        return res.send({
            success: false,
            msg: "Some error occurred",
            data: []
        });
    }
});

societyInterestChargeRouter.post("/submit_charge", async (req, res) => {
    try {
        const { trans_dt, tenant_id, branch_shg_id, loan_id, loan_ac_no, dr_amt, curr_prn, curr_intt, group_code, user_id } = req.body;

        // 1. Generate trans_id using timestamp
        let trans_id = await transaction_id();

        // 2. Insert into td_loan_transactions
        const new_curr_intt = parseFloat(curr_intt) + parseFloat(dr_amt);
        const insertCols = [
            "trans_dt", "trans_id", "tenant_id", "loan_to", "branch_shg_id",
            "loan_id", "loan_ac_no", "trans_type", "dr_amt", "cr_amt",
            "curr_prn_recov", "curr_intt_recov", "ovd_prn_recov", "ovd_intt_recov",
            "curr_prn", "curr_intt", "ovd_prn", "ovd_intt", "approval_status", "created_by", "created_dt"
        ];
        const insertVals = [
            trans_dt, trans_id, tenant_id, 'P', branch_shg_id,
            loan_id, loan_ac_no, 'I', parseFloat(dr_amt), 0,
            0, 0, 0, 0,
            parseFloat(curr_prn), new_curr_intt, 0, 0, 'A', user_id, new Date()
        ];

        let insertRes = await saveRecord("bdccb.td_loan_transactions", insertCols, insertVals, [], [], 0);

        if (insertRes.suc !== 1) {
            return res.send({ success: false, msg: "Failed to insert transaction" });
        }

        // 3. Update master td_loan
        const updateCols = ["curr_intt"];
        const updateVals = [new_curr_intt];
        const whereCols = ["loan_acc_no", "tenant_id", "group_code"];
        const whereVals = [loan_ac_no, tenant_id, group_code];

        let updateRes = await saveRecord("bdccb.td_loan", updateCols, updateVals, whereCols, whereVals, 1);

        if (updateRes.suc !== 1) {
            return res.send({ success: false, msg: "Transaction inserted, but failed to update master table." });
        }

        return res.send({
            success: true,
            msg: "Interest charge applied successfully",
        });

    } catch (err) {
        console.error("Error in submit_charge:", err);
        return res.send({
            success: false,
            msg: "Some error occurred during submission"
        });
    }
});

societyInterestChargeRouter.post("/list_charged_loans", async (req, res) => {
    try {
        const { tenant_id, branch_code } = req.body;

        var select = `
            a.loan_ac_no as loan_acc_no, 
            a.trans_dt, 
            a.dr_amt as interest_charged, 
            b.group_name, 
            b.group_code,
            c.branch_name,
            c.branch_id
        `;
        var table_name = `
            bdccb.td_loan_transactions a
            LEFT JOIN bdccb.td_loan l ON a.loan_ac_no = l.loan_acc_no AND a.tenant_id = l.tenant_id
            LEFT JOIN bdccb.md_group b ON l.group_code = b.group_code 
            LEFT JOIN public.md_branch c ON l.branch_id = c.branch_id
        `;
        
        var whr = `a.trans_type = 'I' AND a.tenant_id = '${tenant_id}' AND a.branch_shg_id = '${branch_code}'`;
        var order = `a.trans_dt DESC`;

        var list_res = await db_Select(select, table_name, whr, order);

        if (list_res.suc !== 1) {
            return res.send({
                success: true,
                msg: "No data found",
                data: []
            });
        }

        const formattedData = list_res.msg.map(item => ({
            loan_acc_no: item.loan_acc_no,
            group_code: item.group_code,
            group_name: item.group_name,
            group_details: [{ branch_name: item.branch_name, pacs_id: 111 }], 
            interest_charged: item.interest_charged,
            trans_dt: item.trans_dt
        }));

        return res.send({
            success: true,
            msg: "Data fetched successfully",
            data: formattedData
        });

    } catch (err) {
        console.error("Error in list_charged_loans:", err);
        return res.send({
            success: false,
            msg: "Some error occurred",
            data: []
        });
    }
});

module.exports = { societyInterestChargeRouter };
