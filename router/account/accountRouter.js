const { db_Select, saveRecord } = require('../../model/pgcommon');
const express = require('express'),
accountRouter = express.Router();

  const generateBalanceId = async () => {
      const timestamp = new Date().getTime();
      const balID = `${timestamp}`;
      return(balID);
  };

  function getFinancialYear(date = new Date()) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // Jan = 1, Apr = 4

    let startYear, endYear;

    if (month >= 4) {
      // April to December → current year is start FY
      startYear = year;
      endYear = year + 1;
    } else {
      // Jan to March → previous year is start FY
      startYear = year - 1;
      endYear = year;
    }

    return {
      label: `${startYear}-${String(endYear).slice(-2)}`, // 2025-26
      startDate: `01-04-${startYear}`,
      endDate: `31-03-${endYear}`
    };
  }

  const getNextVoucherId = async (tenant_id) => {
    const select = `COALESCE(MAX(voucher_id), 0) + 1 AS next_voucher_id`;
    const table_name = "bdccb.td_voucher";
    const whr = `tenant_id = '${tenant_id}'`;
    const res_dt = await db_Select(select, table_name, whr, null);
    const next_voucher_id = res_dt.msg[0].next_voucher_id;
    return next_voucher_id; // INTEGER
  };
  // const getbalance = async (pacs_shg_id) => {
  //   const select = `COALESCE(NULLIF(balance, 'NaN'::numeric), 0) AS next_balance`;
  //   const table_name = "bdccb.td_loan_balance";
  //   const whr = `pacs_shg_id = '${pacs_shg_id}' ORDER BY balance_id DESC LIMIT 1`;
  //   const res_dt = await db_Select(select, table_name, whr, null);
  //   // console.log('Balance Query Result:', res_dt);
  //   let lastBalance = 0;

  //     if (res_dt.msg.length > 0 && res_dt.msg[0].next_balance !== null) {
  //       lastBalance = parseFloat(res_dt.msg[0].next_balance);
  //     }
  //   const next_balance = lastBalance;
  //   return next_balance; // INTEGER
  // };
  accountRouter.post("/save_loan_voucher", async (req, res) => {
       try {
        var voucher_ids = 0;
         const { tenant_id,branch_id,voucher_dt,voucher_id,trans_id,voucher_type,acc_code,trans_type,loan_to,loan_id,pacs_shg_id,dr_amt,cr_amt,created_by,ip_address } = req.body;
         let datetime = new Date().toISOString().slice(0, 19).replace('T', ' ');
        let date = new Date().toISOString().slice(0, 10);

          // Generate balance id
        //  var balance_id = await generateBalanceId();

         // it check voucher id is > 0 then assign that value otherwise get next voucher id and also check for add or edit operation.
         if(voucher_id > 0){
            voucher_ids = voucher_id;
         }else{
            // get next voucher id
            voucher_ids = await getNextVoucherId(tenant_id);
         }
    
         const table = "bdccb.td_voucher";
         if(dr_amt <= 0 && cr_amt <= 0){
            return res.send({ success: false, msg: "Both DR and CR amounts are zero. Please provide valid amounts." });
         }
          if(dr_amt !== cr_amt){
            return res.send({ success: false, msg: "DR and CR amounts are not equal. Please provide equal amounts." });
         }
          // var balance = await getbalance(pacs_shg_id);
          // console.log('Current Balance:', balance);
          // balance = parseFloat(balance) + parseFloat(cr_amt);
          // INSERT INTO BALANCE TABLE
          // const table_bal = "bdccb.td_loan_balance";
          // const columns_bal = ["balance_date","balance_id","tenant_id","loan_to","pacs_shg_id","debit_amt","cr_amt","balance"];
          // const values_bal = [date,balance_id,tenant_id,loan_to,pacs_shg_id,0,cr_amt,balance];
          // const whereColumns_bal = [];
          // const whereValues_bal = [];
          // const flag_bal = 0;
          // const balance_data = await saveRecord(table_bal, columns_bal, values_bal, whereColumns_bal, whereValues_bal, flag_bal);

          // IF BALANCE INSERT SUCCESS 
          // if(balance_data.suc === 1){
           const table1 = "bdccb.td_loan_transactions";
           const columns1 = ["approval_status","approved_by","approved_dt"];
           const values1 = ["A",created_by,datetime];
           const whereColumns1 = ["trans_id","loan_id"];
           const whereValues1 = [trans_id,loan_id];
           const flag1 = 1;
           const trans_update = await saveRecord(table1,columns1,values1,whereColumns1,whereValues1,flag1);
        
        if(trans_update.suc === 1){
         //  For DR  value 
         const columns = voucher_id > 0 ? ["branch_id","voucher_dt","trans_id","voucher_type","acc_code","trans_type","dr_amt","cr_amt","modified_by","modified_at","modified_ip"] : ["tenant_id","branch_id","voucher_dt","voucher_id","trans_id","voucher_type","acc_code","trans_type","dr_amt","cr_amt","created_by","created_at","created_ip"];
         const values_dr = voucher_id > 0 ? [branch_id,voucher_dt,trans_id,voucher_type,acc_code,trans_type,dr_amt,0,created_by,datetime,ip_address] : [tenant_id,branch_id,voucher_dt,voucher_ids,trans_id,voucher_type,acc_code,trans_type,dr_amt,0,created_by,datetime,ip_address];
         const whereColumns = voucher_id > 0 ? ["voucher_id","tenant_id",'cr_amt'] : [];
         const whereValues = voucher_id > 0 ? [voucher_id,tenant_id,0] : [];
         const flag = voucher_id > 0 ? 1 : 0;
        //  console.log('values_dr:', values_dr);
         const result = await saveRecord(table, columns, values_dr,whereColumns,whereValues,flag);
        // For CR  value
         const values_cr = voucher_id > 0 ? [branch_id,voucher_dt,trans_id,voucher_type,'21101','C',0,cr_amt,created_by,datetime,ip_address] : [tenant_id,branch_id,voucher_dt,voucher_ids,trans_id,voucher_type,'21101','C',0,cr_amt,created_by,datetime,ip_address];
         const whereColumns1 = voucher_id > 0 ? ["voucher_id","tenant_id",'dr_amt'] : [];
         const whereValues1 = voucher_id > 0 ? [voucher_id,tenant_id,0] : [];
         const flag1 = voucher_id > 0 ? 1 : 0;
          // console.log('values_cr:', values_cr);
         const result1 = await saveRecord(table, columns, values_cr,whereColumns1,whereValues1,flag1);
   
         if (result.suc !== 1 || result1.suc !== 1) {
         return res.send({
           success: true,
           msg: result.msg || result1.msg || "Failed to save voucher",
           data : []
         });
       }
   
         return res.send({
           success: true,
           msg: voucher_id > 0 ? "Record Updated Successfully" : "Record Inserted Successfully",
           // data: result.lastId
         });
        }else {
              return res.send({
               success: true,
               msg: "Balance inserted but transaction update failed"
               });
           }
          //  }else{
          //  return res.send({
          //        success: true,
          //        msg: "Balance insert failed"
          //  });
          // }
         } catch (error) {
           console.error("Error in while save voucher:", error);
           return res.send({
           success: false,
           msg: "Internal server error",
           errorCode: "SERVER_ERROR"
          });
         }
   });
 
module.exports = {accountRouter, getFinancialYear}