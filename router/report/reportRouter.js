const { db_Select, saveRecord } = require('../../model/pgcommon');
const express = require('express');
const bcrypt = require("bcrypt");
const e = require('express');
reportRouter = express.Router();


// fetch group details along with member
reportRouter.get("/get_disburs_dtls", async (req, res) => {
    try{
      const {frm_dt,to_dt,branch_id} = req.query;
      if (!frm_dt || !to_dt || !branch_id) {
        return res.send({
          success: false,
          msg: "frm_dt, to_dt and branch_id are required"
        });
      }
      var select = "a.loan_id,a.period,a.curr_roi,a.disb_dt,a.disb_amt,b.group_name,c.member_name,c.member_account_no",
      table_name = "bdccb.td_loan_member a JOIN bdccb.md_group b ON a.group_code = b.group_code JOIN bdccb.md_member c ON a.group_code = c.group_code";
        whr = `a.disb_dt >= '${frm_dt}' AND a.disb_dt <= '${to_dt}' AND a.branch_shg_id = '${branch_id}'`,
        order = null;

      var loan_result = await db_Select(select,table_name,whr,order);
    
      if (loan_result.suc === 1 && loan_result.msg.length > 0) {
          return res.send({
            success: true,
            msg: "Group List",
            data: loan_result.msg
        });
        } else {
          return res.send({
            success: true,
            msg: "Failed to fetch group data",
            data: []
          });
        }
    }catch(error){
      console.log("Error fetching group data:", error);
      return res.send({
        success: false,
        msg: "Internal server error",
        errorCode: "SERVER_ERROR"
      });
    }
});

   reportRouter.get("/get_disburs_society_dtls", async (req, res) => {
    try{
      const {frm_dt,to_dt,branch_id} = req.query;
      if (!frm_dt || !to_dt || !branch_id) {
        return res.send({
          success: false,
          msg: "frm_dt, to_dt and branch_id are required"
        });
      }
      var select = "a.loan_id,a.period,a.curr_roi,a.disb_dt,a.disb_amt,b.branch_name as society_name",
      table_name = "bdccb.td_loan_member a JOIN public.md_branch b ON b.branch_id = a.branch_shg_id";
        whr = `a.disb_dt >= '${frm_dt}' AND a.disb_dt <= '${to_dt}' AND a.branch_shg_id = '${branch_id}' AND loan_to='P' `,
        order = null;

      var loan_result = await db_Select(select,table_name,whr,order);
    
      if (loan_result.suc === 1 && loan_result.msg.length > 0) {
          return res.send({
            success: true,
            msg: "Group List",
            data: loan_result.msg
        });
        } else {
          return res.send({
            success: true,
            msg: "Failed to fetch group data",
            data: []
          });
        }
    }catch(error){
      console.log("Error fetching group data:", error);
      return res.send({
        success: false,
        msg: "Internal server error",
        errorCode: "SERVER_ERROR"
      });
    }
  });

   
 
module.exports = {reportRouter}