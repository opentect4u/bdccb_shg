const { db_Select, saveRecord } = require('../../model/pgcommon');
const express = require('express'),
accountRouter = express.Router();

const transaction_id = async () => {
  const timestamp = new Date().getTime();
  const newPayId = `${timestamp}`;
  return newPayId;
};

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
         const { tenant_id,branch_id,voucher_dt,voucher_id,trans_id,voucher_type,acc_code,trans_type,dr_amt,cr_amt,member_ids,society_acc_no,loan_acc_no,created_by,ip_address,group_code} = req.body;
        //  console.log(req.body);
         
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

           /* ================= LOAN UPDATE ================= */

          // const loan_table = "bdccb.td_loan";
          // const loan_column = ["curr_prn","modified_by","modified_dt"];
          // const loan_values = [disb_amt,created_by,datetime];
          // const loan_wherecolumn = ["loan_id","loan_acc_no"];
          // const loan_wherevalues = [loan_id,loan_acc_no];
          // const loan_flag = 1;
          // const loan_table_update = await saveRecord(loan_table,loan_column,loan_values,loan_wherecolumn,loan_wherevalues,loan_flag)

          // if (loan_table_update.suc !== 1) {
          //   return res.send({ success: false, msg: "Loan update failed" });
          // }

          /* ================= LOAN TRANS UPDATE ================= */

          // const table1 = "bdccb.td_loan_transactions";
          // const columns1 = ["curr_prn","approval_status","approved_by","approved_dt","modified_by","modified_dt"];
          // const values1 = [disb_amt,"A",created_by,datetime,created_by,datetime];
          // const whereColumns1 = ["trans_id","loan_id"];
          // const whereValues1 = [trans_id,loan_id];
          // const flag1 = 1;
          // const trans_update = await saveRecord(table1,columns1,values1,whereColumns1,whereValues1,flag1);

          // if (trans_update.suc !== 1) {
          //   return res.send({
          //     success: false,
          //     msg: "Transaction update failed"
          //   });
          // }

          let total_disb_amt = 0;

          if (member_ids && member_ids.length > 0) {
          total_disb_amt = member_ids.reduce((sum, mem) => {
          return sum + parseFloat(mem.disb_amt || 0);
           }, 0);
            }

          let transac_id = await transaction_id();

          // fetch data from td_loan_member

          var select = "a.ccb_loan_id AS loan_id,a.tenant_id,a.branch_id,a.loan_to,a.branch_shg_id,a.group_code,a.period,a.curr_roi,a.penal_roi,TO_CHAR(a.disb_dt, 'YYYY-MM-DD') AS disb_dt,SUM(a.disb_amt) AS disb_amt,a.period_mode,TO_CHAR(a.rep_start_dt, 'YYYY-MM-DD') AS rep_start_dt,TO_CHAR(a.rep_end_dt, 'YYYY-MM-DD') AS rep_end_dt,a.sanction_no,TO_CHAR(a.sanction_dt, 'YYYY-MM-DD') AS sanction_dt",
          table_name = "bdccb.td_loan_member a",
          whr = `group_code = '${group_code}' GROUP BY a.ccb_loan_id,a.tenant_id,a.branch_id,a.loan_to,a.branch_shg_id,a.group_code,a.period,a.curr_roi,a.penal_roi,a.disb_dt,a.period_mode,a.rep_start_dt,a.rep_end_dt,a.sanction_no,a.sanction_dt`,
          order = null;
          var fetch_data = await db_Select(select,table_name,whr,order);

          if(!(fetch_data.suc === 1 && fetch_data.msg.length > 0)){
            return res.send({
            success: true,
            msg:"Loan data not found"
          });
          }

          const loan_data = fetch_data.msg[0];

          var table_td = "bdccb.td_loan";
          var columns_td = ["loan_id","tenant_id","branch_id","loan_acc_no","loan_to","branch_shg_id","period","curr_roi","penal_roi","disb_dt","disb_amt","pay_mode","rep_start_dt","rep_end_dt","curr_prn","curr_intt","ovd_prn","ovd_intt","tot_grp","sanction_no","sanction_dt","created_by","created_dt","ip_address","group_code"];
          var values_td = [loan_data.loan_id,loan_data.tenant_id,loan_data.branch_id,loan_acc_no || null,loan_data.loan_to,loan_data.branch_shg_id,loan_data.period,loan_data.curr_roi,loan_data.penal_roi,loan_data.disb_dt,loan_data.disb_amt,loan_data.period_mode,loan_data.rep_start_dt,loan_data.rep_end_dt,total_disb_amt,0,0,0,0,loan_data.sanction_no,loan_data.sanction_dt,created_by,datetime,ip_address,group_code];
          var whereColumns_td = [];
          var whereValues_td = [];
          var flag_td = 0;
          var result_td = await saveRecord(table_td,columns_td,values_td,whereColumns_td,whereValues_td,flag_td);

           if(result_td.suc !== 1){
             return res.send({
             success: true,
             msg: "Failed to save in loan table",
             data : []
            });
            }

          var table_trn = "bdccb.td_loan_transactions";
          var columns_trn = ["trans_dt","trans_id","tenant_id","loan_to","branch_shg_id","loan_id","loan_ac_no",
          "trans_type","dr_amt", "cr_amt","curr_prn_recov","curr_intt_recov","ovd_prn_recov","ovd_intt_recov","curr_prn", "curr_intt","ovd_prn","ovd_intt","approval_status","approved_by","approved_dt","created_by","created_dt","ip_address"];
          var values_trn = [loan_data.disb_dt,transac_id,loan_data.tenant_id,loan_data.loan_to,loan_data.branch_shg_id,loan_data.loan_id,loan_acc_no || null,"D",
          loan_data.disb_amt,0,0,0,0,0,total_disb_amt,0,0,0,"A",created_by,datetime,created_by,datetime,ip_address];
          var whereColumns_trn = [];
          var whereValues_trn = [];
          var flag_trn = 0;
          var trans_result = await saveRecord(table_trn,columns_trn,values_trn,whereColumns_trn,whereValues_trn,flag_trn);

            if(trans_result.suc !== 1){
            return res.send({
            success: true,
            msg: "Failed to save in loan transaction table",
            data : []
            });
            }
          
        
          // if(trans_update.suc === 1){

           /* ================= MEMBER LOOP ================= */

        if (member_ids && member_ids.length > 0) {

          // Loop & update each member trans
          for (let mem of member_ids) {

          const mem_table = "bdccb.td_loan_member";
          const mem_columns = ["prn_amt","society_acc_no","modified_by","modified_at"];
          const mem_values = [mem.disb_amt,society_acc_no,created_by, datetime];
          const mem_whereColumns = ["loan_id","member_code"];
          const mem_whereValues = [mem.loan_id,mem.member_code];
          const mem_flag = 1;
          await saveRecord(mem_table,mem_columns,mem_values,mem_whereColumns,mem_whereValues,mem_flag);   

          const mem_table_trans = "bdccb.td_loan_member_trans";
          const mem_columns_trans = ["curr_prn","approval_status","approved_by","approved_dt","modified_by","modified_dt"];
          const mem_values_trans = [mem.disb_amt,"A",created_by, datetime,created_by, datetime];
          const mem_whereColumns_trans = ["loan_id","trans_id"];
          const mem_whereValues_trans = [mem.loan_id,mem.trans_id];
          const mem_flag_trans = 1;
          await saveRecord(mem_table_trans,mem_columns_trans,mem_values_trans,mem_whereColumns_trans,mem_whereValues_trans,mem_flag_trans);
          }
        }
        // }

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
         const whereColumns2 = voucher_id > 0 ? ["voucher_id","tenant_id",'dr_amt'] : [];
         const whereValues2 = voucher_id > 0 ? [voucher_id,tenant_id,0] : [];
         const flag2 = voucher_id > 0 ? 1 : 0;
          // console.log('values_cr:', values_cr);
         const result1 = await saveRecord(table, columns, values_cr,whereColumns2,whereValues2,flag2);
   
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
        // }else {
        //       return res.send({
        //        success: true,
        //        msg: "Balance inserted but transaction update failed"
        //        });
        //    }
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