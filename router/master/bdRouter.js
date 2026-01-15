const { db_Select,saveRecord } = require('../../model/pgcommon');
const express = require('express'),
bdRouter = express.Router();

    // get district
    bdRouter.get("/dist_list", async (req, res) => {
        var select = "dist_code,dist_name",
        table_name = "md_district",
        whr = null,
        order = null;
        try {
        var district_datas = await db_Select(select,table_name,whr,order);
            return res.status(200).send({
                success: true,
                msg: "District List",
                data: district_datas
            });
        } catch (error) {
           console.log("Error fetching district data:", error);
           return res.status(500).send({
            success: false,
            msg: "Internal server error",
            errorCode: "SERVER_ERROR"
            });
        }
    });

    // get block
    bdRouter.get("/block_list", async (req, res) => {
        var select = "block_id,block_name",
        table_name = "md_block",
        whr = null,
        order = null;
        try {
        var block_data = await db_Select(select,table_name,whr,order);
            return res.status(200).send({
                success: true,
                msg: "Block List",
                data: block_data
            });
        } catch (error) {
           console.log("Error fetching block data:", error);
           return res.status(500).send({
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

module.exports = bdRouter