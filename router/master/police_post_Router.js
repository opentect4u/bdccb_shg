const { db_Select,saveRecord } = require('../../model/pgcommon');
const express = require('express'),
ppRouter = express.Router();

    // get district
    ppRouter.get("/po_list", async (req, res) => {
        const id = parseInt(req.query.po_id || 0);
        const dist_id = parseInt(req.query.dist_id || 0);
        var select = "a.po_id,a.dist_id,a.post_name,a.pin,c.dist_name",
        table_name = "md_postoffice a, md_district c",
        whr = 'a.dist_id = c.dist_code',
        order = null;
        if (id > 0) {
            whr += ` AND a.po_id = ${id}`;
        }
        if (dist_id > 0) {
            whr += ` AND a.dist_id = ${dist_id}`;
        }
        try {
            console.log("Where Clause:", whr);
        var po_datas = await db_Select(select,table_name,whr,order);
            return res.send({
                success: true,
                msg: "Post Office List",
                data: po_datas.msg
            });
        } catch (error) {
           console.log("Error fetching post office data:", error);
           return res.send({
            success: false,
            msg: "Internal server error",
            errorCode: "SERVER_ERROR"
            });
        }
    });

    ppRouter.post("/save_post", async (req, res) => {
        try {
            const { dist_id, block_id, post_name, pin, po_id,created_by,created_at,created_ip } = req.body;
            const table = "md_postoffice";
            const columns = po_id > 0 ? ["dist_id","block_id","post_name","pin","modified_by","modified_at","ip_address"] : ["dist_id","block_id","post_name","pin","created_by","created_at","ip_address"];

            const values = [dist_id, block_id, post_name, pin, created_by, new Date(), created_ip];
            const whereColumns = po_id > 0 ? ["po_id"] : [];
            const whereValues = po_id > 0 ? [po_id] : [];
            const flag = po_id > 0 ? 1 : 0; // 0 for insert, 1 for update
            const result = await saveRecord(table, columns, values,whereColumns,whereValues,flag);
            return res.status(200).send({
                success: true,
                msg: po_id > 0 ? "Record Updated Successfully" : "Record Inserted Successfully",
                data: result.lastId
            });
        } catch (error) {
            console.error("Error in /login route:", error);
            return res.status(500).send({
            success: false,
            msg: "Internal server error",
            errorCode: "SERVER_ERROR"
            });
        }
    });

module.exports = {ppRouter}