const { db_Select,saveRecord } = require('../../model/pgcommon');
const express = require('express'),
bdRouter = express.Router();

    // get district
    bdRouter.get("/dist_list", async (req, res) => {
        const id = parseInt(req.query.dist_code || 0);
        var select = "dist_code as dist_id,dist_name",
        table_name = "md_district",
        whr = `dist_code = ${id}`,
        order = null;
        // if (id > 0) {
        //     whr = `dist_code = ${id}`;
        // }
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

    // get block details
     bdRouter.get("/block_list", async (req, res) => {
            const id = parseInt(req.query.block_id || 0);
            const dist_id = parseInt(req.query.dist_id || 0);

            // DIST ID IS MANDATORY
            if (!dist_id || dist_id <= 0) {
                return res.send({
                    success: false,
                    msg: "dist_id is required"
                });
            }
            
            const select = "a.block_id,a.block_name,a.dist_id,b.dist_name";
            const table_name = "md_block a LEFT JOIN md_district b ON a.dist_id = b.dist_code";
            let whr = `a.dist_id = ${dist_id}`;
            const order = "a.block_name ASC";
            // if (id > 0) {
            //     whr += ` AND a.block_id = ${id}`;
            // }
            // if (dist_id > 0) {
            //     whr += ` AND a.dist_id = ${dist_id}`;
            // }    
            try {
                const block_data = await db_Select(select, table_name, whr, order);
                return res.send({
                success: true,
                // msg: id > 0 ? "Block details" : "Block list",
                msg: "Block list",
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
            const { dist_id, block_name,block_id,created_by, created_at } = req.body;
            console.log(req.body);
            
            const table = "md_block";
            const columns = block_id > 0 ? ["dist_id", "block_name", "modified_by", "modified_at"] : ["dist_id", "block_name", "delete_flag", "created_by", "created_at"];
            const values = block_id > 0 ? [dist_id, block_name, created_by, created_at] : [dist_id, block_name,'N', created_by, created_at];
            const whereColumns = block_id > 0 ? ["block_id"] : [];
            const whereValues = block_id > 0 ? [block_id] : [];
            const flag = block_id > 0 ? 1 : 0; // 0 for insert, 1 for update
            const result = await saveRecord(table, columns, values,whereColumns,whereValues,flag);
            return res.send({
                success: true,
                msg: block_id > 0 ? "Record Updated Successfully" : "Record Inserted Successfully",
                data: result.lastId
            });
        } catch (error) {
            console.error("Error in inserted record:", error);
            return res.send({
            success: false,
            msg: "Internal server error",
            errorCode: "SERVER_ERROR"
            });
        }
    });

module.exports = {bdRouter}