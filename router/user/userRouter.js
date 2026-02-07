const { db_Select,saveRecord } = require('../../model/pgcommon');
const express = require('express'),
userRouter = express.Router();
    
    userRouter.get("/user_list", async (req, res) => {
        
        const tenant_id = parseInt(req.query.tenant_id || 0);
        const dist_id = parseInt(req.query.dist_id || 0);
        const block_id = parseInt(req.query.block_id || 0);
        const id = parseInt(req.query.branch_id || 0);

        // DIST ID AND BLOCK ID AND GP ID IS MANDATORY
            if (!tenant_id || tenant_id <= 0) {
                return res.send({
                    success: false,
                    msg: "tenant id is required"
                });
            }

        var select = "a.branch_id,a.dist_id,a.block_id,a.tenant_id,a.branch_type,a.branch_name,a.branch_address,a.pin_no,a.contact_person,a.branch_phone,a.branch_status,b.block_name,c.dist_name,d.tenant_name",
        table_name = "md_branch a LEFT JOIN md_block b ON a.block_id = b.block_id LEFT JOIN md_district c ON a.dist_id = c.dist_code LEFT JOIN md_tenant d ON a.tenant_id = d.tenant_id",
        whr = `a.tenant_id = ${tenant_id} `,
        order = null;
        if (id > 0) {
            whr += ` AND a.branch_id = ${id}`;
        }
        if( dist_id > 0) {
            whr += ` AND a.dist_id = ${dist_id}`;
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
    userRouter.post("/save_user", async (req, res) => {
        try {
            const {user_id,tenant_id, brn_code, user_type, user_name, phone_mobile, active_flag, password, session_id,created_ip,branch_id,closed_opened_by,closed_opened_at } = req.body;
            const table = "md_branch";
            const columns = user_id > 0 ? ["user_id","tenant_id","brn_code","user_type","user_name","phone_mobile","active_flag","password","session_id","modified_by","modified_at","ip_address"] : ["user_id","tenant_id","brn_code","user_type","user_name","phone_mobile","active_flag","password","session_id","created_by","created_at","closed_opened_by","closed_opened_at","ip_address"];
            const values = [user_id, tenant_id, brn_code, user_type, user_name, phone_mobile, active_flag, password, session_id, created_by, new Date(),closed_opened_by,closed_opened_at, created_ip];
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

     

module.exports = {userRouter}