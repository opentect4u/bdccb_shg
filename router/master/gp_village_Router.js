const { db_Select,saveRecord } = require('../../model/pgcommon');
const express = require('express'),
gpvillRouter = express.Router();


         //  GP List
    gpvillRouter.get("/gp_list", async (req, res) => {
        const id = parseInt(req.query.gp_id || 0);
        const dist_id = parseInt(req.query.dist_id || 0);
        const block_id = parseInt(req.query.block_id || 0);

        // DIST ID AND BLOCK ID IS MANDATORY
            if (!dist_id || dist_id <= 0 || !block_id || block_id <= 0) {
                return res.send({
                    success: false,
                    msg: "dist_id and block id is required"
                });
            }

        var select = "a.gp_id,a.dist_id,a.block_id,a.gp_name,b.block_name,c.dist_name",
        table_name = "md_gp a LEFT JOIN md_block b ON a.block_id = b.block_id LEFT JOIN md_district c ON a.dist_id = c.dist_code",
        whr = ` a.block_id = ${block_id} AND a.dist_id = ${dist_id}`,
        order = null;
        // if (id > 0) {
        //     whr += ` AND a.gp_id = ${id}`;
        // }
        // if (block_id > 0) {
        //     whr += ` AND a.block_id = ${block_id}`;
        // }
        // if (dist_id > 0) {
        //     whr += ` AND a.dist_id = ${dist_id}`;
        // }
        try {
            // console.log("Where Clause:", whr);
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
            console.log(req.body);
            

            const table = "md_gp";
            const columns = gp_id > 0 ? ["dist_id","block_id","gp_name","modified_by","modified_at","ip_address"] : ["dist_id","block_id","gp_name", "delete_flag","created_by","created_at","ip_address"];
            const values = gp_id > 0 ? [dist_id, block_id, gp_name, created_by, new Date(), created_ip] : [dist_id, block_id, gp_name, 'N', created_by, new Date(), created_ip];
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

        // DIST ID AND BLOCK ID AND GP ID IS MANDATORY
            if (!dist_id || dist_id <= 0 || !block_id || block_id <= 0 || !gp_id || gp_id <= 0) {
                return res.send({
                    success: false,
                    msg: "dist id and block id and gp id is required"
                });
            }

        var select = "a.vill_id,a.dist_id,a.block_id,a.gp_id,a.vill_name,b.block_name,c.dist_name,d.gp_name",
        table_name = "md_village a LEFT JOIN md_block b ON a.block_id = b.block_id LEFT JOIN md_district c ON a.dist_id = c.dist_code LEFT JOIN md_gp d ON a.gp_id = d.gp_id",
        whr = `a.dist_id = ${dist_id} AND a.block_id = ${block_id} AND a.gp_id = ${gp_id}`,
        order = null;
        // if (id > 0) {
        //     whr += ` AND a.vill_id = ${id}`;
        // }
        // if (gp_id > 0) {
        //     whr += ` AND a.gp_id = ${gp_id}`;
        // }
        // if (block_id > 0) {
        //     whr += ` AND a.block_id = ${block_id}`;
        // }
        // if (dist_id > 0) {
        //     whr += ` AND a.dist_id = ${dist_id}`;
        // }
        //  console.log("Where Clause:", whr);
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
            const columns = vill_id > 0 ? ["dist_id","block_id","gp_id","vill_name","modified_by","modified_at","ip_address"] : ["dist_id","block_id","gp_id","vill_name","delete_flag","created_by","created_at","ip_address"];
            const values = vill_id > 0 ? [dist_id, block_id, gp_id, vill_name, created_by, new Date(), created_ip] : [dist_id, block_id, gp_id, vill_name, 'N', created_by, new Date(), created_ip];
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
    
    gpvillRouter.get("/branch_list", async (req, res) => {
        
        const tenant_id = parseInt(req.query.tenant_id || 0);
        const dist_id = parseInt(req.query.dist_id || 0);
        const block_id = parseInt(req.query.block_id || 0);
        const id = parseInt(req.query.branch_id || 0);

        // DIST ID AND BLOCK ID AND GP ID IS MANDATORY
            if (!dist_id || dist_id <= 0 || !tenant_id || tenant_id <= 0) {
                return res.send({
                    success: false,
                    msg: "dist id and tenant id is required"
                });
            }

        var select = "a.branch_id,a.dist_id,a.block_id,a.tenant_id,a.branch_type,a.branch_name,a.branch_address,a.pin_no,a.contact_person,a.branch_phone,a.branch_status,b.block_name,c.dist_name,d.tenant_name",
        table_name = "md_branch a LEFT JOIN md_block b ON a.block_id = b.block_id LEFT JOIN md_district c ON a.dist_id = c.dist_code LEFT JOIN md_tenant d ON a.tenant_id = d.tenant_id",
        whr = `a.dist_id = ${dist_id} AND a.tenant_id = ${tenant_id} `,
        order = null;
        if (id > 0) {
            whr += ` AND a.branch_id = ${id}`;
        }
        if (block_id > 0) {
            whr += ` AND a.block_id = ${block_id}`;
        }
        
        //  console.log("Where Clause:", whr);
        try {
           
        var gp_datas = await db_Select(select,table_name,whr,order);
            return res.send({
                success: true,
                msg: "Branch List",
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
    gpvillRouter.post("/save_branch", async (req, res) => {
        try {
            const { dist_id,tenant_id, block_id,branch_type, branch_name, branch_address, branch_city, pin_no, contact_person, branch_phone, created_by,created_ip,branch_id,closed_opened_by,closed_opened_at } = req.body;
            const table = "md_branch";
            const columns = branch_id > 0 ? ["dist_id","tenant_id","block_id","branch_type","branch_name","branch_address","branch_city","pin_no","contact_person","branch_phone","modified_by","modified_at","closed_opened_by","closed_opened_at","ip_address"] : ["dist_id","tenant_id","block_id","branch_type","branch_name","branch_address","branch_city","pin_no","contact_person","branch_phone","created_by","created_at","closed_opened_by","closed_opened_at","ip_address"];
            const values = [dist_id, tenant_id, block_id, branch_type, branch_name, branch_address, branch_city, pin_no, contact_person, branch_phone, created_by, new Date(),closed_opened_by,closed_opened_at, created_ip];
            const whereColumns = branch_id > 0 ? ["branch_id"] : [];
            const whereValues = branch_id > 0 ? [branch_id] : [];
            const flag = branch_id > 0 ? 1 : 0; // 0 for insert, 1 for update
            const result = await saveRecord(table, columns, values,whereColumns,whereValues,flag);
            return res.send({
                success: true,
                msg: branch_id > 0 ? "Record Updated Successfully" : "Record Inserted Successfully",
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

     

module.exports = {gpvillRouter}