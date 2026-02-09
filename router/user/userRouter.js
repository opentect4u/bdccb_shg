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
    get_tenant_id = async (branch_id) => {
        $result = await db_Select("tenant_id", "md_branch", `branch_id = ${branch_id}`, null);
        if ($result.success && $result.msg.length > 0) {
            return $result.msg[0].tenant_id;
        }

    }
    userRouter.post("/save_user", async (req, res) => {
         const {add_edit_flag,user_id,branch_id, user_type, user_name,pwd, phone_mobile,ip_address,created_by,designation } = req.body;
        try {
            const user_type_list  = ['B','P','S','H'];
            const tenant_id = await get_tenant_id(branch_id);   
            // if (!tenant_id || tenant_id <= 0) {
            //    validationError(res, "tenant id is required");
            // }else 
            if(!user_type || !user_type_list.includes(user_type)){
                validationError(res, "user type is required and must be one of B, P, S, H");
            }else if(!user_name || user_name.trim() === ""){
                validationError(res, "user name is required");
            }
            const hashedPassword = await bcrypt.hash(pwd, 10);
            const table = "bdccb.md_user";
            const columns = add_edit_flag > 0 ? ["tenant_id","brn_code","user_type","user_name","phone_mobile","ip_address","designation"] : ["user_id","tenant_id","brn_code","user_type","user_name","phone_mobile","active_flag","password","session_id","created_by","created_at","ip_address","designation"];
            const values = add_edit_flag > 0 ? [tenant_id, brn_code, user_type, user_name, phone_mobile,  ip_address, designation] : [user_id, tenant_id, brn_code, user_type, user_name, phone_mobile, 'Y', hashedPassword, session_id, created_by, new Date(), ip_address,designation ];
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
    userRouter.post("/changepass", async (req, res) => {
        const {old_pass,new_pass,user_id } = req.body;
        try {
            if(old_pass != new_pass){
            
            var whr = `user_id='${user_id}' AND active_flag='Y'`;
            var res_dt = await db_Select("*", "bdccb.md_user", whr, null);

            if (res_dt.msg.length > 0) {
            const hasLowercase = /[a-z]/.test(new_pass);
            const hasUppercase = /[A-Z]/.test(new_pass);
            const hasNumber = /[0-9]/.test(new_pass);
            const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(new_pass);
            const hasMinLength = new_pass.length >= 8;
            if (hasLowercase && hasUppercase && hasNumber && hasSpecialChar && hasMinLength) {
                if (await bcrypt.compare(old_pass, res_dt.msg[0].password)) {
                var pass = bcrypt.hashSync(new_pass, 10);

                var date_ob = moment();
                var formattedDate = date_ob.format("YYYY-MM-DD HH:mm:ss");
                // var ipresult = await fetchIpData();
                // var ip = ipresult.ipdata;
                var ip = req.clientIp;
                var values = null;
                var table_name = "bdccb.md_user";
                var fields = `password = '${pass}',modified_at='${formattedDate}',modified_by='${user_id}',modified_ip='${ip}'`;
                var whr = `user_id = '${user_id}'`;
                var save_data = await db_Insert(table_name, fields, values, whr, 1);
                req.flash("success_msg", "Update successful!");
                res.redirect("/logout");
                } else {
                result = {
                    suc: 0,
                    msg: "Please check your userid or password",
                    dt: res_dt,
                };
                req.flash("error_msg", "Old Password Is Wrong!");
                res.redirect("/wdtls/changepass");
                }
            }else{
                req.flash("error_msg", "Password does not meet the requirements");
                res.redirect("/wdtls/changepass");
            }
            } else {
            result = { suc: 0, msg: "No data found", dt: res_dt };
            res.redirect("/wdtls/changepass");
            }
            }else{
                validationError(res, "Old Password And New Password is Same!");
            }
            } catch (error) {
                // Log the error and send an appropriate response
                console.error("Error during dashboard rendering:", error);
            }
    });

     

module.exports = {userRouter}