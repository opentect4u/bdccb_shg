const { db_Select,saveRecord } = require('../../model/pgcommon');
const express = require('express'),
bdRouter = express.Router();

    // get district
    bdRouter.get("/dist_list", async (req, res) => {
        const id = parseInt(req.query.dist_code || 0);
        var select = "dist_code as dist_id,dist_name",
        table_name = "md_district",
        whr = null,
        order = null;
        if (id > 0) {
            whr = `dist_code = ${id}`;
        }
        try {
        var district_datas = await db_Select(select,table_name,whr,order);
            return res.send({
                success: true,
                msg: "District List",
                data: district_datas.msg
            });
        } catch (error) {
           console.log("Error fetching district data:", error);
           return res.send({
            success: false,
            msg: "Internal server error",
            errorCode: "SERVER_ERROR"
            });
        }
    });

    // get block
     bdRouter.get("/block_list", async (req, res) => {
            const id = parseInt(req.query.block_id || 0);
            const dist_id = parseInt(req.query.dist_id || 0);
            const select = "a.block_id,a.block_name,a.dist_id,b.dist_name";
            const table_name = "md_block a, md_district b";
            let whr = 'a.dist_id = b.dist_code';
            const order = "a.block_name ASC";
            if (id > 0) {
                whr += ` AND a.block_id = ${id}`;
            }
            if (dist_id > 0) {
                whr += ` AND a.dist_id = ${dist_id}`;
            }
    
            try {
                const block_data = await db_Select(select, table_name, whr, order);
                return res.send({
                success: true,
                msg: id > 0 ? "Block details" : "Block list",
                data: block_data.msg
                });
            } catch (error) {
                console.error("Error fetching block data:", error);
    
                return res.send({
                success: false,
                msg: "Internal server error",
                errorCode: "SERVER_ERROR"
                });
            }
    });

    bdRouter.post("/save_block", async (req, res) => {
        try {
            const { dist_id, block_name,block_id } = req.body;
            const table = "md_block";
            const columns = ["dist_id", "block_name"];
            const values = [dist_id, block_name];
            const whereColumns = block_id > 0 ? ["block_id"] : [];
            const whereValues = block_id > 0 ? [block_id] : [];
            const flag = block_id > 0 ? 1 : 0; // 0 for insert, 1 for update
            const result = await saveRecord(table, columns, values,whereColumns,whereValues,flag);
            return res.status(200).send({
                success: true,
                msg: "Record Inserted Successfully",
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

module.exports = {bdRouter}