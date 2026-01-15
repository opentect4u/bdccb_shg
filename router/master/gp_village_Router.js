const { db_Select,saveRecord } = require('../../model/pgcommon');
const express = require('express'),
gpvillRouter = express.Router();


         //  GP List
    gpvillRouter.get("/gp_list", async (req, res) => {
        const id = parseInt(req.query.gp_id || 0);
        const dist_id = parseInt(req.query.dist_id || 0);
        const block_id = parseInt(req.query.block_id || 0);
        var select = "a.gp_id,a.dist_id,a.block_id,a.gp_name,b.block_name,c.dist_name",
        table_name = "md_gp a, md_block b, md_district c",
        whr = 'a.dist_id = c.dist_code AND a.block_id = b.block_id',
        order = null;
        if (id > 0) {
            whr += ` AND a.gp_id = ${id}`;
        }
        if (block_id > 0) {
            whr += ` AND a.block_id = ${block_id}`;
        }
        if (dist_id > 0) {
            whr += ` AND a.dist_id = ${dist_id}`;
        }
        try {
            console.log("Where Clause:", whr);
        var gp_datas = await db_Select(select,table_name,whr,order);
            return res.send({
                success: true,
                msg: "Gram Panchayat List",
                data: gp_datas.msg
            });
        } catch (error) {
           console.log("Error fetching police station data:", error);
           return res.send({
            success: false,
            msg: "Internal server error",
            errorCode: "SERVER_ERROR"
            });
        }
    });

    gpvillRouter.post("/save_gp", async (req, res) => {
        try {
            const { dist_id, block_id, gp_name, gp_id ,created_by,created_ip } = req.body;
            const table = "md_gp";
            const columns = gp_id > 0 ? ["dist_id","block_id","gp_name","modified_by","modified_at","ip_address"] : ["dist_id","block_id","gp_name","created_by","created_at","ip_address"];
            const values = [dist_id, block_id, gp_name, created_by, new Date(), created_ip];
            const whereColumns = gp_id > 0 ? ["gp_id"] : [];
            const whereValues = gp_id > 0 ? [gp_id] : [];
            const flag = gp_id > 0 ? 1 : 0; // 0 for insert, 1 for update
            const result = await saveRecord(table, columns, values,whereColumns,whereValues,flag);
            return res.send({
                success: true,
                msg: gp_id > 0 ? "Record Updated Successfully" : "Record Inserted Successfully",
                data: result.lastId
            });
        } catch (error) {
            console.error("Error in /login route:", error);
            return res.send({
            success: false,
            msg: "Internal server error",
            errorCode: "SERVER_ERROR"
            });
        }
    });

    gpvillRouter.get("/vill_list", async (req, res) => {
        const id = parseInt(req.query.vill_id || 0);
        const dist_id = parseInt(req.query.dist_id || 0);
        const block_id = parseInt(req.query.block_id || 0);
        const gp_id = parseInt(req.query.gp_id || 0);
        var select = "a.vill_id,a.dist_id,a.block_id,a.gp_id,a.vill_name,b.block_name,c.dist_name,d.gp_name",
        table_name = "md_village a, md_block b, md_district c,md_gp d",
        whr = 'a.dist_id = c.dist_code AND a.block_id = b.block_id AND a.gp_id = d.gp_id',
        order = null;
        if (id > 0) {
            whr += ` AND a.vill_id = ${id}`;
        }
        if (gp_id > 0) {
            whr += ` AND a.gp_id = ${gp_id}`;
        }
        if (block_id > 0) {
            whr += ` AND a.block_id = ${block_id}`;
        }
        if (dist_id > 0) {
            whr += ` AND a.dist_id = ${dist_id}`;
        }
         console.log("Where Clause:", whr);
        try {
           
        var gp_datas = await db_Select(select,table_name,whr,order);
            return res.send({
                success: true,
                msg: "Gram Panchayat List",
                data: gp_datas.msg
            });
        } catch (error) {
           console.log("Error fetching police station data:", error);
           return res.send({
            success: false,
            msg: "Internal server error",
            errorCode: "SERVER_ERROR"
            });
        }
    });

    gpvillRouter.post("/save_vill", async (req, res) => {
        try {
            const { dist_id, block_id,gp_id, vill_name, vill_id ,created_by,created_ip } = req.body;
            const table = "md_village";
            const columns = vill_id > 0 ? ["dist_id","block_id","gp_id","vill_name","modified_by","modified_at","ip_address"] : ["dist_id","block_id","gp_id","vill_name","created_by","created_at","ip_address"];
            const values = [dist_id, block_id, gp_id, vill_name, created_by, new Date(), created_ip];
            const whereColumns = vill_id > 0 ? ["vill_id"] : [];
            const whereValues = vill_id > 0 ? [vill_id] : [];
            const flag = vill_id > 0 ? 1 : 0; // 0 for insert, 1 for update
            const result = await saveRecord(table, columns, values,whereColumns,whereValues,flag);
            return res.send({
                success: true,
                msg: vill_id > 0 ? "Record Updated Successfully" : "Record Inserted Successfully",
                data: result.lastId
            });
        } catch (error) {
            console.error("Error in /login route:", error);
            return res.send({
            success: false,
            msg: "Internal server error",
            errorCode: "SERVER_ERROR"
            });
        }
    });

    // gpvillRouter.post("/save_branch", async (req, res) => {
    //     try {
    //         const { dist_id,tenant_id, block_id,branch_type, branch_name, branch_address, branch_city, pin_no, contact_person, branch_phone, created_by,created_ip,branch_id,closed_opened_by,closed_opened_at } = req.body;
    //         const table = "md_branch";
    //         const columns = branch_id > 0 ? ["dist_id","tenant_id","block_id","branch_type","branch_name","branch_address","branch_city","pin_no","contact_person","branch_phone","modified_by","modified_at","closed_opened_by","closed_opened_at","ip_address"] : ["dist_id","tenant_id","block_id","branch_type","branch_name","branch_address","branch_city","pin_no","contact_person","branch_phone","created_by","created_at","closed_opened_by","closed_opened_at","ip_address"];
    //         const values = [dist_id, tenant_id, block_id, branch_type, branch_name, branch_address, branch_city, pin_no, contact_person, branch_phone, created_by, new Date(),closed_opened_by,closed_opened_at, created_ip];
    //         const whereColumns = branch_id > 0 ? ["branch_id"] : [];
    //         const whereValues = branch_id > 0 ? [branch_id] : [];
    //         const flag = branch_id > 0 ? 1 : 0; // 0 for insert, 1 for update
    //         const result = await saveRecord(table, columns, values,whereColumns,whereValues,flag);
    //         return res.send({
    //             success: true,
    //             msg: branch_id > 0 ? "Record Updated Successfully" : "Record Inserted Successfully",
    //             data: result.lastId
    //         });
    //     } catch (error) {
    //         console.error("Error in /login route:", error);
    //         return res.send({
    //         success: false,
    //         msg: "Internal server error",
    //         errorCode: "SERVER_ERROR"
    //         });
    //     }
    // });
     

module.exports = {gpvillRouter}