const { db_Select, saveRecord } = require('../../model/pgcommon');
const express = require('express'),
accountRouter = express.Router();

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
  accountRouter.post("/save_voucher", async (req, res) => {
       try {
        var voucher_ids = 0;
         const { tenant_id,branch_id,voucher_dt,voucher_id,trans_id,voucher_type,acc_code,trans_type,dr_amt,cr_amt,created_by,ip_address } = req.body;
         let datetime = new Date().toISOString().slice(0, 19).replace('T', ' ');
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
         //  For DR  value 
         const columns = voucher_id > 0 ? ["branch_id","voucher_dt","trans_id","voucher_type","acc_code","trans_type","dr_amt","cr_amt","modified_by","modified_at","modified_ip"] : ["tenant_id","branch_id","voucher_dt","voucher_id","trans_id","voucher_type","acc_code","trans_type","dr_amt","cr_amt","created_by","created_at","created_ip"];
         const values_dr = voucher_id > 0 ? [branch_id,voucher_dt,trans_id,voucher_type,acc_code,trans_type,dr_amt,0,created_by,datetime,ip_address] : [tenant_id,branch_id,voucher_dt,voucher_ids,trans_id,voucher_type,acc_code,trans_type,dr_amt,0,created_by,datetime,ip_address];
         const whereColumns = voucher_id > 0 ? ["voucher_id","tenant_id",'cr_amt'] : [];
         const whereValues = voucher_id > 0 ? [voucher_id,tenant_id,0] : [];
         const flag = voucher_id > 0 ? 1 : 0;
         console.log('values_dr:', values_dr);
         const result = await saveRecord(table, columns, values_dr,whereColumns,whereValues,flag);
        // For CR  value
         const values_cr = voucher_id > 0 ? [branch_id,voucher_dt,trans_id,voucher_type,acc_code,trans_type,0,cr_amt,created_by,datetime,ip_address] : [tenant_id,branch_id,voucher_dt,voucher_ids,trans_id,voucher_type,acc_code,trans_type,0,cr_amt,created_by,datetime,ip_address];
         const whereColumns1 = voucher_id > 0 ? ["voucher_id","tenant_id",'dr_amt'] : [];
         const whereValues1 = voucher_id > 0 ? [voucher_id,tenant_id,0] : [];
         const flag1 = voucher_id > 0 ? 1 : 0;
          console.log('values_cr:', values_cr);
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