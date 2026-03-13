const { db_Select, saveRecord,deposit_balance_update } = require('../../model/pgcommon');
const express = require('express'),
depsavingRouter = express.Router();

// fetch group details
depsavingRouter.get("/deposit_list", async (req, res) => {
    try{
        const tenant_id = parseInt(req.query.tenant_id || 0);
        const branch_id = parseInt(req.query.branch_id || 0);
        const shg_id = parseInt(req.query.shg_id || 0);
            // DIST ID AND BLOCK ID AND GP ID IS MANDATORY
                if (!tenant_id || tenant_id <= 0) {
                    return res.send({
                        success: false,
                        msg: "shg id and tenant id is required"
                    });
                }

      var select = "a.shg_id,b.group_name,sum(a.balance) as balance",
      table_name = "bdccb.td_deposit a LEFT JOIN bdccb.md_group b ON a.shg_id = b.group_code",
      order = null;
      whr = `a.tenant_id = '${tenant_id}' AND a.acc_status_flag = 'O'`;
      if (branch_id > 0) {
        whr += ` AND a.branch_id = '${branch_id}'`;
      }
      if(shg_id > 0){
        whr += ` AND a.shg_id = '${shg_id}'`;
      }
        whr += ` GROUP BY a.shg_id,b.group_name ORDER BY b.group_name`;
      var fetch_data = await db_Select(select,table_name,whr,order);

      if (fetch_data.suc === 1 && fetch_data.msg.length > 0) {
          return res.send({
            success: true,
            msg: "Deposit acc List",
            data: fetch_data.msg
        });
        } else {
          return res.send({
            success: false,
            msg: "Failed to fetch Deposit List"
          });
        }
    }catch(error){
      console.log("Error fetching Deposit List:", error);
      return res.send({
        success: false,
        msg: "Internal server error",
        errorCode: "SERVER_ERROR"
      });
    }
});

    // save / edit group
    depsavingRouter.post("/save_sbacc", async (req, res) => {
        try {
          const {sb_id,trans_no,tenant_id,shg_id,branch_id,acc_no,acc_opening_dt,balance,created_by,created_ip } = req.body;
          let datetime = new Date().toISOString().slice(0, 19).replace('T', ' ');
          const table = "bdccb.td_deposit";
          const columns = sb_id > 0 ? ["tenant_id","shg_id","branch_id","acc_no","acc_opening_dt","balance","modified_by","modified_at","modified_ip"] : ["tenant_id","shg_id","branch_id","acc_no","acc_opening_dt","balance","created_by","created_at","created_ip"];
          const values = sb_id > 0 ? [tenant_id,shg_id,branch_id,acc_no,acc_opening_dt,balance,created_by,datetime,created_ip] : [tenant_id,shg_id,branch_id,acc_no,acc_opening_dt,balance,created_by,datetime,created_ip];
          const whereColumns = sb_id > 0 ? ["sb_id"] : [];
          const whereValues = sb_id > 0 ? [sb_id] : [];
          const flag = sb_id > 0 ? 1 : 0;
          const result = await saveRecord(table, columns, values,whereColumns,whereValues,flag);

            const table_trans = "bdccb.td_deposit_trans";
            const columns_trans = trans_no > 0
            ? ["sb_id","tenant_id","branch_id","acc_no","trans_dt","dep_with_flag","dr_amt","cr_amt","balance","remarks","modified_by","modified_at","modified_ip"]
            : ["sb_id","tenant_id","branch_id","acc_no","trans_dt","dep_with_flag","dr_amt","cr_amt","balance","remarks","created_by","created_at","created_ip"];

          const values_trans = trans_no > 0
            ? [trans_no,tenant_id,branch_id,acc_no,datetime,'D',0,balance,balance,'Opening ACC',created_by,datetime,created_ip]
            : [result.lastId,tenant_id,branch_id,acc_no,datetime,'D',0,balance,balance,'Opening ACC',created_by,datetime,created_ip];
          const whereColumns_trans = trans_no > 0 ? ["sb_id", "trans_no"] : [];
          const whereValues_trans = trans_no > 0 ? [trans_no, trans_no] : [];
          const flag_trans = trans_no > 0 ? 1 : 0;
          const result_trans = await saveRecord(table_trans,columns_trans,values_trans,whereColumns_trans,whereValues_trans,flag_trans); 

          return res.send({
            success: true,
            msg: sb_id > 0 ? "Record Updated Successfully" : "Record Inserted Successfully",
            data: result_trans.lastId
          });
          } catch (error) {
            console.error("Error in while save group:", error);
            return res.send({
            success: false,
            msg: "Internal server error",
            errorCode: "SERVER_ERROR"
          });
          }
    });
    get_acount_balance = async (sb_id) => {
        //  First check first transaction OR NOT  // 
          const first_trans_result = await db_Select('count(*) as count ', 'bdccb.td_deposit_trans', `sb_id = '${sb_id}'`, null);
         // if(first_trans_result.suc === 1 && first_trans_result.msg[0].count === '0') {

            const inital_balance = await db_Select('COALESCE(balance, 0) AS balance', 'bdccb.td_deposit', `sb_id = '${sb_id}'`, null);
            // console.log('Initial Balance Result:', inital_balance);
            if(inital_balance.suc === 1 && inital_balance.msg.length > 0) {
              return inital_balance.msg[0].balance; // INTEGER
            }else{
              return 0;
            }
    }
   depsavingRouter.post("/get_meb_acc_dtls", async (req, res) => {

        try{
            const {shg_id} = req.body;
            var select = "a.sb_id,a.acc_no,COALESCE(a.balance, 0) AS balance,b.member_name";
            var table_name = "bdccb.td_deposit a JOIN bdccb.md_member b ON a.acc_no = b.member_account_no";
            var whr = `a.shg_id = '${shg_id}'`;
            var order = null;
            var fetch_data = await db_Select(select,table_name,whr,order);

            return res.send({
              success: true,
              msg: "Member account details fetched successfully",
              data: fetch_data.msg
            });

        }catch(error){
            console.error("Error while fetching member account details:", error);
            return res.send({
              success: false,
              msg: "Internal server error",
              errorCode: "SERVER_ERROR"
            });
        }
          
   })

      depsavingRouter.post("/get_meb_acc_dtls_edit", async (req, res) => {
        try{
             const {shg_id} = req.body;
            var select = "c.trans_no,a.sb_id,a.acc_no,a.balance,b.member_name";
            var table_name = "bdccb.td_deposit a JOIN bdccb.md_member b ON a.acc_no = b.member_code JOIN bdccb.td_deposit_trans c ON a.sb_id = c.sb_id AND c.trans_no = ( SELECT MAX(ct.trans_no) FROM bdccb.td_deposit_trans ct WHERE ct.sb_id = a.sb_id)";
            var whr = `a.shg_id = '${shg_id}'`;
            var order = ` c.trans_no desc`;
            var fetch_data = await db_Select(select,table_name,whr,order);

            return res.send({
              success: true,
              msg: "Member account details fetched successfully",
              data: fetch_data.msg
            });

        }catch(error){
            console.error("Error while fetching member account details:", error);
            return res.send({
              success: false,
              msg: "Internal server error",
              errorCode: "SERVER_ERROR"
            });
        }
          
      })

       depsavingRouter.post("/save_dept_trans", async (req, res) => {
          const { rows } = req.body;
          if (!Array.isArray(rows) || rows.length === 0) {
            return res.status(400).json({
              success: false,
              msg: "Rows are required"
            });
          }
            
        try {
                var count = 0;
                var lastId = '';
              for (const row of rows) {
                const {trans_no,sb_id,tenant_id,branch_id,acc_no,dep_with_flag,amt,remarks,created_by,created_at,created_ip} = row;
                /* ================= VALIDATION ================= */

                // dep_with_flag required and must be D or W
                if (!dep_with_flag || !['D', 'W'].includes(dep_with_flag)) {
                  return res.status.json({
                    status: true,
                    message: 'Deposit Withdrawl Flag is required and must be either D or W'
                  });
                }

                // amt required and must be > 0
                const amount = parseFloat(amt);
              if (amount > 0) {

                  let datetime = new Date().toISOString().slice(0, 19).replace('T', ' ');
                  var trans_dt = new Date().toISOString().slice(0, 19).replace('T', ' ');

                    let balance = await get_acount_balance(sb_id);
                    balance = parseFloat(balance);
                    // console.log("Current Balance:", balance, "Transaction Amount:", amount, "Transaction Type:", dep_with_flag);
                    let dr_amt = 0;
                    let cr_amt = 0;

                    // D = Debit / Withdraw
                    if (dep_with_flag === 'W') {

                        if (balance < amount) {
                            // console.log("teste---------",balance,amount)
                            return res.send({
                              success: false,
                              msg: "Insufficient balance",
                              data: null
                            });
                          
                        }
                      // Withdrawal logic: Debit the account
                        dr_amt = amount;
                        cr_amt = 0;
                        balance = balance - amount;

                    } else { 
                        // C = Credit / Deposit
                        dr_amt = 0;
                        cr_amt = amount;
                        balance = balance + cr_amt;
                    }
                
                  const table = "bdccb.td_deposit_trans";
                  const columns = trans_no > 0
                  ? ["sb_id","tenant_id","branch_id","acc_no","trans_dt","dep_with_flag","dr_amt","cr_amt","balance","remarks","modified_by","modified_at","modified_ip"]
                  : ["sb_id","tenant_id","branch_id","acc_no","trans_dt","dep_with_flag","dr_amt","cr_amt","balance","remarks","created_by","created_at","created_ip"];

                const values = trans_no > 0
                  ? [sb_id,tenant_id,branch_id,acc_no,trans_dt,dep_with_flag,dr_amt,cr_amt,balance,remarks,created_by,datetime,created_ip]
                  : [sb_id,tenant_id,branch_id,acc_no,trans_dt,dep_with_flag,dr_amt,cr_amt,balance,remarks,created_by,datetime,created_ip];
                const whereColumns = trans_no > 0 ? ["sb_id", "trans_no"] : [];
                const whereValues  = trans_no > 0 ? [sb_id, trans_no] : [];
                const flag = trans_no > 0 ? 1 : 0;

                const result = await saveRecord(table,columns,values,whereColumns,whereValues,flag);
              
                // code for update balance in td_deposit table;
                if (result.suc === 1) {
                const balance_update_query = deposit_balance_update(sb_id, amount, dep_with_flag);
                lastId += result.lastId + ',';
                count++;
                }
      
              }
            }
            return res.send({
              success: true,
              msg: count > 0 ? "Successfully" : "No transactions processed",
              data: lastId
            });
        } catch (error) {
            console.error("Error while saving SB account:", error);
            return res.send({
              success: false,
              msg: "Internal server error",
              errorCode: "SERVER_ERROR"
            });
        } 
    });



module.exports = {depsavingRouter}