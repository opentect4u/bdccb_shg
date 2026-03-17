const { db_Select, saveRecord, deleteRecord } = require("../../model/pgcommon");
const express = require("express"),
ccb_recovRouter = express.Router();

const ccb_trans_id = async () => {
    const timestamp = new Date().getTime();
    // const random = Math.floor(Math.random() * 1000000);
    const newPayId = `${timestamp}`;
    return(newPayId);
};

// FETCH LOAN DETAILS BASED ON CCB LOAN ACC NO
ccb_recovRouter.post("/fetch_loan_dtls_based_ccbacc_no", async (req, res) => {
  try{
   const {ccb_acc_no,branch_id,tenant_id,loan_to} = req.body;
  //  console.log(req.body);
 
   var select = "c.group_code,b.group_name,a.period,a.curr_roi,a.penal_roi,TO_CHAR(a.disb_dt, 'YYYY-MM-DD') AS disb_dt,a.disb_amt,SUM(a.curr_prn + a.curr_intt) AS loan_outstanding",
   table_name = "bdccb.td_loan a LEFT JOIN bdccb.md_group b ON a.group_code = b.group_code LEFT JOIN bdccb.td_loan_member C ON b.group_code = c.group_code",
   whr = `a.loan_acc_no = '${ccb_acc_no}' AND a.tenant_id = '${tenant_id}' AND a.branch_id = '${branch_id}'  GROUP BY c.group_code,b.group_name,a.period,a.curr_roi,a.penal_roi,a.disb_dt,a.disb_amt`,
   order = null;
   var fetch_ccb_loan_dtls = await db_Select(select,table_name,whr,order);

   if(fetch_ccb_loan_dtls.suc === 1 && fetch_ccb_loan_dtls.msg.length > 0){
     /* -------- Fetch Member recovery Details -------- */
     var select_mem_recov = "a.loan_id,b.member_code,c.member_name,a.ccb_loan_id,COALESCE(SUM(a.cr_amt),0) AS cr_amt,(COALESCE(b.prn_amt,0)) AS mem_outstanding",
     table_name_mem_recov = "bdccb.td_loan_member_trans_temp a LEFT JOIN bdccb.td_loan_member b ON a.loan_id = b.loan_id AND a.tenant_id = b.tenant_id AND a.ccb_loan_id = b.ccb_loan_id LEFT JOIN bdccb.md_member c ON b.member_code = c.member_code AND b.group_code = c.group_code",
     whr_mem_recov = `a.loan_acc_no = '${ccb_acc_no}' AND a.tenant_id = '${tenant_id}' AND a.branch_id = '${branch_id}' GROUP BY a.loan_id,b.member_code,c.member_name,a.ccb_loan_id,b.prn_amt`,
     order_mem_recov = null;
     var fetch_ccb_member_dtls = await db_Select(select_mem_recov, table_name_mem_recov, whr_mem_recov, order_mem_recov);

     // attach member list under data
     fetch_ccb_loan_dtls.msg[0].member_list = fetch_ccb_member_dtls.suc === 1 && fetch_ccb_member_dtls.msg.length > 0 ? fetch_ccb_member_dtls.msg : [];

     return res.send({
        success: true,
        msg: "Fetch CCB Level loan details",
        data: fetch_ccb_loan_dtls.msg,
     });
   }else {
    return res.send({
    success: true,
    msg: "CCB Level loan details not found",
    data: [],
  });
   }
  }catch (error) {
    console.error("Error in while fetch ccb level loan dtls:", error);
    return res.send({
    success: false,
    msg: "Internal server error",
    errorCode: "SERVER_ERROR"
    });
    }
});

module.exports = {ccb_recovRouter}