const { db_Select,saveRecord } = require('../../model/pgcommon');
const express = require('express');
const bcrypt = require("bcrypt");
userRouter = express.Router();
    
    userRouter.get("/user_list", async (req, res) => {
        const tenant_id = parseInt(req.query.tenant_id || 0);
        const branch_id = parseInt(req.query.branch_id || 0);
        const user_id = parseInt(req.query.user_id || 0);

        // Tenant ID IS MANDATORY
        if (!tenant_id || tenant_id <= 0) {
            return res.send({
                success: false,
                msg: "tenant id is required"
            });
        }
        var select = "user_id,tenant_id,brn_code,user_type,user_name,phone_mobile,active_flag,created_by,created_at,ip_address",
        table_name = "bdccb.md_user",
        whr = `tenant_id = ${tenant_id} `,
        order = null;
        if (branch_id > 0) {
            whr += ` AND brn_code = ${branch_id}`;
        }
        if (user_id > 0) {
            whr += ` AND user_id = ${user_id}`;
        }
    
        try {
           
        var user_data = await db_Select(select,table_name,whr,order);
            return res.send({
                success: true,
                msg: "User List",
                data: user_data.msg
            });
        } catch (error) {
           console.log("Error fetching user data:", error);
           return res.send({
            success: false,
            msg: "Internal server error",
            errorCode: "SERVER_ERROR"
            });
        }
    });
    function validationError(res, msg) {
             return res.send({
                    success: false,
                    msg: msg,
                });
    }
    userRouter.post("/save_user", async (req, res) => {
         const {add_edit_flag,user_id,tenant_id, brn_code, user_type, user_name, phone_mobile, session_id,ip_address,branch_id,created_by } = req.body;
        try {
            const user_type_list  = ['B','P','S','H'];
            if (!tenant_id || tenant_id <= 0) {
               validationError(res, "tenant id is required");
            }else if(!user_type || !user_type_list.includes(user_type)){
                validationError(res, "user type is required and must be one of B, P, S, H");
            }else if(!user_name || user_name.trim() === ""){
                validationError(res, "user name is required");
            }else if(!phone_mobile || phone_mobile.trim().length !== 10){
                validationError(res, "mobile number is required and must be 10 digits");
            }
            const hashedPassword = await bcrypt.hash('12345', 10);
            const table = "bdccb.md_user";
            const columns = add_edit_flag > 0 ? ["tenant_id","brn_code","user_type","user_name","phone_mobile","ip_address"] : ["user_id","tenant_id","brn_code","user_type","user_name","phone_mobile","active_flag","password","session_id","created_by","created_at","ip_address"];
            const values = add_edit_flag > 0 ? [tenant_id, brn_code, user_type, user_name, phone_mobile,  ip_address] : [user_id, tenant_id, brn_code, user_type, user_name, phone_mobile, 'Y', hashedPassword, session_id, created_by, new Date(), ip_address];
            const whereColumns = add_edit_flag > 0 ? ["user_id"] : [];
            const whereValues = add_edit_flag > 0 ? [user_id] : [];
            const flag = add_edit_flag > 0 ? 1 : 0; // 0 for insert, 1 for update
            const result = await saveRecord(table, columns, values,whereColumns,whereValues,flag);
            return res.send({
                success: true,
                msg: add_edit_flag > 0 ? "Record Updated Successfully" : "Record Inserted Successfully",
                data: result.lastId
            });
        } catch (error) {
            console.error("Error in /save_user route:", error);
            return res.send({
            success: false,
            msg: "Internal server error",
            errorCode: "SERVER_ERROR"
            });
        }
    });

     

module.exports = {userRouter}