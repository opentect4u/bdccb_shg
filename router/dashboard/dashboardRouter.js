const { db_Select, saveRecord } = require('../../model/pgcommon');
const express = require('express'),
dashboardRouter = express.Router();

dashboardRouter.post("/fetch_member_loan_dtls", async (req, res) => {
try{
 const {branch_id,tenant_id,group_code} = req.body;
//  console.log(req.body,'loan_data');

 var select = "a.group_code,a.member_code,a.tenant_id,a.branch_id,a.period,a.curr_roi,a.penal_roi,TO_CHAR(a.disb_dt,'YYYY-MM-DD') AS disb_dt,a.loan_id,b.member_name,b.gp_leader_flag,COALESCE(SUM(a.prn_amt + a.ovd_prn_amt + a.intt_amt + a.ovd_intt_amt),0) As loan_amount,CASE WHEN COUNT(CASE WHEN c.trans_type = 'R' THEN 1 END) > 0 THEN 'Y' ELSE 'N' END AS recovery_flag,CASE WHEN a.loan_id > 0 THEN 'Y' ELSE 'N' END AS approve_member",
 table_name = "bdccb.td_loan_member a LEFT JOIN bdccb.md_member b ON a.member_code = b.member_code AND a.tenant_id = b.tenant_id AND a.group_code = b.group_code LEFT JOIN bdccb.td_loan_member_trans c ON a.loan_id = c.loan_id AND a.branch_id = c.branch_id AND a.tenant_id = c.tenant_id",
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
      disb_amt: Number(row.loan_amount),
      approve_member: row.approve_member
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

// dashboardRouter.post("/fetch_member_loan_dtls", async (req, res) => {
// try{
//  const {branch_id,tenant_id,group_code} = req.body;
//  console.log(req.body,'loan_data');

//  var select = "a.group_code,a.member_code,a.tenant_id,a.branch_id,b.period,b.curr_roi,b.penal_roi,TO_CHAR(b.disb_dt,'YYYY-MM-DD') AS disb_dt,b.loan_id,a.member_name,a.gp_leader_flag,COALESCE(SUM(b.prn_amt + b.ovd_prn_amt + b.intt_amt + b.ovd_intt_amt),0) As loan_amount,CASE WHEN COUNT(CASE WHEN c.trans_type = 'R' THEN 1 END) > 0 THEN 'Y' ELSE 'N' END AS recovery_flag,CASE WHEN b.loan_id > 0 THEN 'Y' ELSE 'N' END AS approve_member",
//  table_name = "bdccb.md_member a LEFT JOIN bdccb.td_loan_member b ON a.member_code = b.member_code AND a.tenant_id = b.tenant_id AND a.group_code = b.group_code LEFT JOIN bdccb.td_loan_member_trans c ON b.loan_id = c.loan_id AND b.branch_id = c.branch_id AND b.tenant_id = c.tenant_id",
//  whr = `a.branch_id = '${branch_id}' AND a.tenant_id = '${tenant_id}' AND a.group_code = '${group_code}' GROUP BY
//       a.group_code,a.member_code,a.tenant_id,a.branch_id,b.period,b.curr_roi,b.penal_roi,b.disb_dt,b.loan_id,a.member_name,
//       a.gp_leader_flag`,
//  order = `a.member_code`;
//  var fetch_memb_loan_dtls = await db_Select(select,table_name,whr,order);

//  if(fetch_memb_loan_dtls.suc === 1 && fetch_memb_loan_dtls.msg.length > 0){

//      const header = fetch_memb_loan_dtls.msg[0];

//       const members = fetch_memb_loan_dtls.msg.map(row => ({
//       loan_id: row.loan_id,
//       member_id: row.member_code,
//       member_name: row.member_name,
//       disb_amt: Number(row.loan_amount),
//       approve_member: row.approve_member,
//     }));

//     let recovery_flag = 'N';

//     fetch_memb_loan_dtls.msg.forEach(row => {
//       if(row.recovery_flag === 'Y'){
//         recovery_flag = 'Y';
//       }
//     });

//     let grand_total = 0;

//     fetch_memb_loan_dtls.msg.forEach(row => {
//       grand_total += Number(row.loan_amount);
//     });

//     const finalData = {
//       group_code: header.group_code,
//       tenant_id: header.tenant_id,
//       branch_id: header.branch_id,
//       period: header.period,
//       curr_roi: header.curr_roi,
//       penal_roi: header.penal_roi,
//       disb_dt: header.disb_dt,
//       grand_total: grand_total.toFixed(2),
//       recovery_flag: recovery_flag,
//       members: members
//     };
//    return res.send({
//    success: true,
//    msg: "Fetch member Loan Details",
//    data: finalData,
//  });
//  }else{
//     return res.send({
//     success: true,
//     msg: "Unable to fetch member loan details",
//     data: []
//    });
//  }
// }catch(error){
//   console.error("Error in while fetch member loan details:", error);
//   return res.send({
//   success: false,
//   msg: "Internal server error",
//   errorCode: "SERVER_ERROR"
//   });
//     }
// });

// FETCH DASHBOARD LOAN AMOUNT DETAILS
dashboardRouter.post("/dashboard_grp_loan_bal", async (req, res) => {
  try{
    const {emp_id,tenant_id} = req.body;

    var select = "a.group_code,a.group_name,b.loan_to",
    table_name = "bdccb.md_group a LEFT JOIN bdccb.td_loan_member b ON a.group_code = b.group_code",
    whr = `a.phone1 = '${emp_id}'`,
    order = null;
    var fetch_grp_code = await db_Select(select,table_name,whr,order);

    if (!(fetch_grp_code.suc === 1 && fetch_grp_code.msg.length > 0)) {
    return res.send({
      success: true,
      msg: "No group found for this employee",
      data: []
    });
    }

    const group_code = fetch_grp_code.msg[0].group_code;
    const group_name = fetch_grp_code.msg[0].group_name;

    var select1 = "COALESCE(SUM(curr_prn + curr_intt),0) As loan_balance,group_code",
    table_name1 = "bdccb.td_loan",
    whr1 = `tenant_id = '${tenant_id}' AND group_code = '${group_code}' GROUP BY group_code`,
    order1 = null;
    var fetch_loan_amount = await db_Select(select1,table_name1,whr1,order1);

    if(fetch_loan_amount.suc === 1 && fetch_loan_amount.msg.length > 0){
      return res.send({
      success: true,
      msg: `Fetch loan balance of ${group_name} group`,
      data: fetch_loan_amount.msg,
      })
    }else{
      return res.send({
      success: true,
      msg: "Unable to fetch loan amount of particular group",
      data: []
      })
    }

  }catch(error){
  console.error("Error in while fetch group loan details in dashboard:", error);
  return res.send({
  success: false,
  msg: "Internal server error",
  errorCode: "SERVER_ERROR"
  });
    }
});

dashboardRouter.post("/fetch_member_outstanding_dtls", async (req, res) => {
  try{
   const {tenant_id,group_code,loan_to} = req.body;

   const roi_column = loan_to == 'S' ? "a.curr_roi" : "a.society_roi";
   const penal_roi_column = loan_to == 'S' ? "a.penal_roi" : "a.society_penal_roi";

   var select = `a.ccb_loan_id AS loan_id,a.tenant_id,a.branch_id,a.period,${roi_column} AS curr_roi,${penal_roi_column} AS penal_roi,TO_CHAR(a.disb_dt, 'YYYY-MM-DD') AS disb_dt,SUM(a.disb_amt) AS disb_amt`,
   table_name = "bdccb.td_loan_member a LEFT JOIN bdccb.td_loan_member_trans b ON a.tenant_id = b.tenant_id AND a.ccb_loan_id = b.ccb_loan_id AND a.loan_id = b.loan_id",
   whr = `a.tenant_id = '${tenant_id}' AND a.group_code = '${group_code}' GROUP BY a.ccb_loan_id,a.tenant_id,a.branch_id,a.period,a.curr_roi,a.society_roi,a.penal_roi,a.society_penal_roi,a.disb_dt`,
   order = null;
   var fetch_loan_dtls = await db_Select(select,table_name,whr,order);

   if (!(fetch_loan_dtls.suc === 1 && fetch_loan_dtls.msg.length > 0)) {
      return res.send({
        success: true,
        msg: `Unable to fetch group disbursed loan details`,
        data: [],
      });
    }

    // * ---------------- MEMBER QUERY LOOP ---------------- //
   let loan_finalData_member = [];

   for (let loans of fetch_loan_dtls.msg) {
    let mem_select = "a.loan_id AS mem_loan_id,a.group_code,c.group_name,a.member_code AS member_id,d.member_name,COALESCE(a.prn_amt,0) AS principal_amt,COALESCE(a.intt_amt,0) AS interest_amt,COALESCE(SUM(a.prn_amt + a.intt_amt),0) AS outstanding,TO_CHAR(MAX(CASE WHEN b.trans_type = 'I' THEN b.trans_date END),'YYYY-MM-DD') AS interest_calculated_date",
    mem_table = "bdccb.td_loan_member a LEFT JOIN bdccb.td_loan_member_trans b ON a.loan_id = b.loan_id AND a.ccb_loan_id = b.ccb_loan_id AND a.tenant_id = b.tenant_id LEFT JOIN bdccb.md_member d ON a.group_code = d.group_code AND a.member_code = d.member_code LEFT JOIN bdccb.md_group c ON a.group_code = c.group_code",
    mem_whr = `a.tenant_id = '${tenant_id}' AND a.ccb_loan_id = '${loans.loan_id}' AND a.group_code = '${group_code}' GROUP BY a.loan_id,a.group_code,c.group_name,a.member_code,d.member_name,a.prn_amt,a.intt_amt`;
    let shg_member_dtls = await db_Select(mem_select,mem_table,mem_whr,null);

    loans.members = shg_member_dtls.suc === 1 ? shg_member_dtls.msg : [];

    loan_finalData_member.push(loans);
   }

    return res.send({
      success: true,
      msg: `Fetch group disbursed Loan Details`,
      data: loan_finalData_member,
    });

  }catch(error){
  console.error("Error in while fetch member loan details in app:", error);
  return res.send({
  success: false,
  msg: "Internal server error",
  errorCode: "SERVER_ERROR"
  });
  }
})

module.exports = {dashboardRouter}