const { db_Select, saveRecord } = require('../../model/pgcommon');
const express = require('express'),
dashboardRouter = express.Router();

dashboardRouter.post("/fetch_member_loan_dtls", async (req, res) => {
try{
 const {branch_id,tenant_id,group_code} = req.body;
 console.log(req.body,'loan_data');

 var select = "a.group_code,a.member_code,a.tenant_id,a.branch_id,a.period,a.curr_roi,a.penal_roi,TO_CHAR(a.disb_dt,'YYYY-MM-DD') AS disb_dt,a.loan_id,b.member_name,b.gp_leader_flag,COALESCE(SUM(a.prn_amt + a.ovd_prn_amt + a.intt_amt + a.ovd_intt_amt),0) As loan_amount,CASE WHEN COUNT(CASE WHEN c.trans_type = 'R' THEN 1 END) > 0 THEN 'Y' ELSE 'N' END AS recovery_flag",
 table_name = "bdccb.td_loan_member a LEFT JOIN bdccb.md_member b ON a.member_code = b.member_code AND a.branch_id = b.branch_id AND a.tenant_id = b.tenant_id LEFT JOIN bdccb.td_loan_member_trans c ON a.loan_id = c.loan_id AND a.branch_id = c.branch_id AND a.tenant_id = c.tenant_id",
 whr = `a.branch_id = '${branch_id}' AND a.tenant_id = '${tenant_id}' AND a.group_code = '${group_code}' GROUP BY
      a.group_code,a.tenant_id,a.branch_id,a.period,a.curr_roi,a.penal_roi,a.disb_dt,a.loan_id,b.member_name,
      b.gp_leader_flag`,
 order = `a.member_code`;
 var fetch_memb_loan_dtls = await db_Select(select,table_name,whr,order);

 if(fetch_memb_loan_dtls.suc === 1 && fetch_memb_loan_dtls.msg.length > 0){

     const header = fetch_memb_loan_dtls.msg[0];

      const members = fetch_memb_loan_dtls.msg.map(row => ({
      loan_id: row.loan_id,
      member_id: row.member_code,
      member_name: row.member_name,
      gp_leader_flag: row.gp_leader_flag,
      disb_amt: Number(row.loan_amount)
    }));

    let recovery_flag = 'N';

    fetch_memb_loan_dtls.msg.forEach(row => {
      if(row.recovery_flag === 'Y'){
        recovery_flag = 'Y';
      }
    });

    let grand_total = 0;

    fetch_memb_loan_dtls.msg.forEach(row => {
      grand_total += Number(row.loan_amount);
    });

    const finalData = {
      group_code: header.group_code,
      tenant_id: header.tenant_id,
      branch_id: header.branch_id,
      period: header.period,
      curr_roi: header.curr_roi,
      penal_roi: header.penal_roi,
      disb_dt: header.disb_dt,
      grand_total: grand_total.toFixed(2),
      recovery_flag: recovery_flag,
      members: members
    };
   return res.send({
   success: true,
   msg: "Fetch member Loan Details",
   data: finalData,
 });
 }else{
    return res.send({
    success: true,
    msg: "Unable to fetch member loan details",
    data: []
   });
 }
}catch(error){
  console.error("Error in while fetch member loan details:", error);
  return res.send({
  success: false,
  msg: "Internal server error",
  errorCode: "SERVER_ERROR"
  });
    }
});

module.exports = {dashboardRouter}