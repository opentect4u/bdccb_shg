const { db_Select,saveRecord,get_pacs_of_branch } = require('../../model/pgcommon');
const express = require('express');
const bcrypt = require("bcrypt");
userRouter = express.Router();
    
    userRouter.get("/user_list", async (req, res) => {
        const tenant_id = parseInt(req.query.tenant_id || 0);
        const branch_id = parseInt(req.query.branch_id || 0);
        const user_id = req.query.user_id?.trim() || '';
        const user_type = req.query.user_type || null;
        const branch_type = req.query.branch_type || null;
        const user_status = req.query.user_status || null;

        // Tenant ID IS MANDATORY
        if (!tenant_id || tenant_id <= 0 || !branch_id || branch_id <= 0 ) {
            return res.send({
                success: false,
                msg: "tenant id is required and branch id is required"
            });
        }
        var select = "a.user_id,b.branch_name as branch_society_name,a.tenant_id,a.brn_code,a.user_type,a.user_name,a.phone_mobile,a.active_flag,a.designation",
        table_name = "bdccb.md_user a ,public.md_branch b",
        whr = `a.tenant_id = ${tenant_id} AND a.brn_code = b.branch_id `,
        order = null;
        
        if (user_id.length > 0) {
            whr += ` AND a.user_id = '${user_id}'`;
            console.log("User ID filter applied: " + user_id);
        }
        if(user_status){
            whr += ` AND a.active_flag = '${user_status}'`;
        }
        if(branch_type != 'B' ){
        if(user_type){whr += ` AND a.user_type = '${user_type}'`; }
        }
        
       
        if(branch_type == 'B' ){
        var branch_ids = await get_pacs_of_branch(branch_id);
        whr += branch_ids.length > 0  ? ` AND a.brn_code IN (${branch_ids},${branch_id})`:` AND a.brn_code IN (${branch_id})`; 
        
        }else{
            whr += branch_id > 0 ? ` AND a.brn_code = ${branch_id}` : ""; 
        }
       console.log("WHERE clause after applying branch type B filter: " + whr);
        try {
                var user_data = await db_Select(select,table_name,whr,order);
                    return res.send({
                        success: true,
                        msg: "User List",
                        data: user_data.msg
                    });
        } catch (error) {
            
                return res.send({
                success: false,
                msg: "Internal server error",
                errorCode: "SERVER_ERROR"
                });
        }
    });
    userRouter.get("/user_list_branch", async (req, res) => {
        const tenant_id = parseInt(req.query.tenant_id || 0);
        const branch_id = parseInt(req.query.branch_id || 0);
        const user_id = req.query.user_id?.trim() || '';
        const user_type = req.query.user_type || null;
        const user_status = req.query.user_status || null;

        // Tenant ID IS MANDATORY
        if (!tenant_id || tenant_id <= 0) {
            return res.send({
                success: false,
                msg: "tenant id is required"
            });
        }
        var select = "user_id,tenant_id,brn_code,user_type,user_name,phone_mobile,active_flag,designation",
        table_name = "bdccb.md_user",
        whr = `tenant_id = ${tenant_id} `,
        order = null;
        
        if (user_id.length > 0) {
            whr += ` AND user_id = '${user_id}'`;
            console.log("User ID filter applied: " + user_id);
        }
        if(user_status){
            whr += ` AND active_flag = '${user_status}'`;
        }
        if(user_type){whr += ` AND user_type = '${user_type}'`; }
        
        if(user_type){
               if(user_type == 'P' ){
                var branch_ids = await get_pacs_of_branch(branch_id);
                whr += branch_ids.length > 0  ? ` AND brn_code IN (${branch_ids})`:""; 
                }else{
                   whr += branch_id > 0 ? ` AND brn_code = ${branch_id}` : ""; 
                }
        }else{
            whr += branch_id > 0 ? ` AND brn_code = ${branch_id}` : "";
        }
        
    
        try {
           
                var user_data = await db_Select(select,table_name,whr,order);
                    return res.send({
                        success: true,
                        msg: "User List",
                        data: user_data.msg
                    });
        } catch (error) {
            
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
    get_tenant_id = async (branch_id) => {
        var result = await db_Select("tenant_id", "md_branch", `branch_id = ${branch_id}`, null);
        return result.msg[0].tenant_id ? result.msg[0].tenant_id : null;
    }
    userRouter.get("/checkuser", async (req, res) => {
        const {user_id } = req.query;
        if(!user_id || user_id.trim() === ""){
                validationError(res, "user id is required");
        }
        try {
            var whr = `user_id='${user_id}'`;
            var res_dt = await db_Select("*", "bdccb.md_user", whr, null);
            if(res_dt.msg.length > 0){
                return res.send({
                    success: true,
                    msg: "User Already Exists",
                    user_status: 1
                });
            }else{
                return res.send({
                    success: true,
                    msg: "User Available",
                    user_status: 0
                });
            }
        } catch (error) {
            console.error("Error in /checkuser route:", error);
            return res.send({
            success: false,
            msg: "Internal server error",
            errorCode: "SERVER_ERROR"
            });
        }
                    
    });
   
    userRouter.post("/changepass", async (req, res) => {
        const {old_pass,new_pass,user_id,created_by,ip_address } = req.body;
        try {
                if(old_pass != new_pass){
                    var whr = `user_id='${user_id}' AND active_flag='Y'`;
                    var res_dt = await db_Select("*", "bdccb.md_user", whr, null);
                  let datetime = new Date().toISOString().slice(0, 19).replace('T', ' ');
                    if (res_dt.msg.length > 0) {
                            //const hasLowercase = /[a-z]/.test(new_pass);
                            const hasUppercase = /[A-Z]/.test(new_pass);
                            const hasNumber = /[0-9]/.test(new_pass);
                           // const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(new_pass);
                            const hasMinLength = new_pass.length >= 6;
                            if (hasUppercase && hasNumber && hasMinLength) {
                                if (await bcrypt.compare(old_pass, res_dt.msg[0].password)) {
                                var pass = await bcrypt.hash(new_pass, 10);
                                var ip = req.clientIp;
                                const table = "bdccb.md_user";
                                const columns = ["password","modified_by","modified_at","ip_address"];
                                const values = [pass,created_by,datetime,ip_address] 
                                const whereColumns = ["user_id"] ;
                                const whereValues = [user_id];
                        
                            const result = await saveRecord(table, columns, values,whereColumns,whereValues,1);
                               return res.send({
                                    success: true,
                                    msg: "Update successful!",
                                });
                                
                                } else {
                                    return res.send({
                                    success: false,
                                    msg: "Old password is incorrect!",
                                    });
                                
                                }
                        }else{
                            return res.send({
                                    success: false,
                                    msg: "Password does not meet the requirements",
                                });
                        }
                    } else {
                        validationError(res, "User not found or inactive!");
                    }
                }else{
                    validationError(res, "Old Password And New Password is Same!");
                }
            } catch (error) {
                // Log the error and send an appropriate response
                console.error("Error during dashboard rendering:", error);
            }
    });

    userRouter.post("/save_user", async (req, res) => {
         const {add_edit_flag,user_id,branch_id, user_type,active_flag, user_name,pwd,default_pass, phone_mobile,ip_address,created_by,designation,shg_id } = req.body;
         if (shg_id == null || shg_id == undefined || shg_id == "") {
            var shg_ids = 0;
         }else{
            var shg_ids = shg_id;
         }
        try {
            const user_type_list  = ['B','P','S','H'];
            const tenant_id = await get_tenant_id(branch_id);   
            let datetime = new Date().toISOString().slice(0, 19).replace('T', ' ');
            if(!user_type || !user_type_list.includes(user_type)){
                validationError(res, "user type is required and must be one of B, P, S, H");
            }else if(!user_name || user_name.trim() === ""){
                validationError(res, "user name is required");
            }
            const hashedPassword = await bcrypt.hash(pwd, 10);
            // If default password flag is set
            const hashedDefaultPassword = await bcrypt.hash('bdccb1234', 10);

            const table = "bdccb.md_user";
            const columns = add_edit_flag > 0 ? ["tenant_id","brn_code","user_type","user_name","phone_mobile","active_flag","approved_by","approved_dt","ip_address","designation"] : ["user_id","tenant_id","brn_code","user_type","user_name","phone_mobile","active_flag","password","created_by","created_at","ip_address","designation","shg_id"];
            const values = add_edit_flag > 0 ? [tenant_id, branch_id, user_type, user_name, phone_mobile, active_flag,created_by,datetime,ip_address, designation] : [user_id, tenant_id, branch_id, user_type, user_name, phone_mobile, 'N', hashedPassword, created_by, new Date(), ip_address,designation,shg_ids ];

            if(add_edit_flag > 0 && default_pass > 0){
                columns.push("password");
                values.push(hashedDefaultPassword);
            }
          
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
    userRouter.post("/profile_update", async (req, res) => {
        const {user_id,designation,created_by,ip_address} = req.body;
        try {
                var whr = `user_id='${user_id}'`;
                var res_dt = await db_Select("*", "bdccb.md_user", whr, null);
               
                if (res_dt.msg.length > 0) {
                    
                    const table = "bdccb.md_user";
                    const columns = user_id.length > 0 ? ["designation","modified_by","modified_at","ip_address"] : ["designation","modified_by","modified_at","ip_address"];
                    const values = user_id.length > 0 ? [designation,created_by,new Date().toISOString().slice(0, 19).replace('T', ' '),ip_address] : [designation,created_by,new Date().toISOString().slice(0, 19).replace('T', ' '),ip_address];
                    const whereColumns = ["user_id"];
                    const whereValues = [user_id];
                    const result = await saveRecord(table, columns, values,whereColumns,whereValues,1);
                    return res.send({
                        success: true,
                        msg: "Profile Updated Successfully",
                    });
                    
                } else {
                    validationError(res, "User not found or inactive!");
                }
                
            } catch (error) {
                // Log the error and send an appropriate response
                console.error("Error during dashboard rendering:", error);
            }
    });

     

module.exports = {userRouter}