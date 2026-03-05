const { db_Select, saveRecord } = require("../../model/pgcommon");
const express = require("express"),
groupRecoveryRouter = express.Router();

const member_trans_id = async () => {
    const timestamp = new Date().getTime();
    const newPayId = `${timestamp}`;
    return(newPayId);
};

// AFTER APPROVAL GROUP LEADER SHOW LOAN DETAILS 
groupRecoveryRouter.post("/fetch_loan_details", async (req, res) => {
    try{
    const {tenant_id,branch_id,emp_id} = req.body;
    // console.log(req.body);
    

    var select = "group_code,group_name",
    table_name = "bdccb.md_group",
    whr = `phone1 = '${emp_id}'`,
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

    var select_loan = "a.ccb_loan_id AS loan_id,a.tenant_id,a.branch_id,a.loan_acc_no AS ccb_loan_acc_no,a.branch_shg_id,c.branch_name AS pacs_name,a.period,a.curr_roi,a.penal_roi,TO_CHAR(a.disb_dt, 'YYYY-MM-DD') AS disb_dt,SUM(a.disb_amt) AS disb_amt,a.period_mode,TO_CHAR(a.rep_start_dt, 'YYYY-MM-DD') AS rep_start_dt,TO_CHAR(a.rep_end_dt, 'YYYY-MM-DD') AS rep_end_dt,a.sanction_no,TO_CHAR(a.sanction_dt, 'YYYY-MM-DD') AS sanction_dt,a.society_acc_no,b.trans_type",
    table_name_loan = "bdccb.td_loan_member a LEFT JOIN bdccb.td_loan_member_trans b ON a.tenant_id = b.tenant_id AND a.branch_id = b.branch_id AND a.ccb_loan_id = b.ccb_loan_id AND a.loan_id = b.loan_id AND b.approval_status = 'A' AND b.trans_type = 'D' LEFT JOIN public.md_branch c ON a.branch_shg_id = c.branch_id",
    whr_loan = `a.tenant_id = '${tenant_id}' AND a.branch_id = '${branch_id}' AND a.group_code = '${group_code}' GROUP BY a.ccb_loan_id,a.tenant_id,a.branch_id,a.loan_acc_no,a.branch_shg_id,c.branch_name,a.period,a.curr_roi,a.penal_roi,a.disb_dt,a.period_mode,a.rep_start_dt,a.rep_end_dt,a.sanction_no,a.sanction_dt,a.society_acc_no,b.trans_type`,
    order_loan = null;
    var fetch_loan_data = await db_Select(select_loan,table_name_loan,whr_loan,order_loan);

    if (!(fetch_loan_data.suc === 1 && fetch_loan_data.msg.length > 0)) {
      return res.send({
        success: true,
        msg: `Unable to fetch group ${group_name} disbursed loan details`,
        data: [],
      });
    }

    // * ---------------- MEMBER QUERY LOOP ---------------- //

    let loan_finalData_mem = [];

    for (let loan of fetch_loan_data.msg) {
    let mem_select = "a.loan_id AS mem_loan_id,e.trans_id AS recov_trans_id,TO_CHAR(e.trans_date, 'YYYY-MM-DD') AS recov_trans_date,b.trans_id AS tran_id,TO_CHAR(b.trans_date, 'YYYY-MM-DD') AS trans_date,TO_CHAR(e.created_dt, 'YYYY-MM-DD') AS created_dt,a.group_code,c.group_name,a.member_code AS member_id,d.member_name,COALESCE(a.prn_amt,0) AS principal_amt,d.member_account_no AS sb_acc_no,COALESCE(e.cr_amt,0) AS cr_amt,COALESCE(e.sb_amt,0) AS sb_amt,e.approval_status",
      mem_table = "bdccb.td_loan_member a LEFT JOIN bdccb.td_loan_member_trans b ON a.loan_id = b.loan_id AND a.ccb_loan_id = b.ccb_loan_id AND a.tenant_id = b.tenant_id LEFT JOIN bdccb.md_group c ON a.group_code = c.group_code LEFT JOIN bdccb.md_member d ON a.group_code = d.group_code AND a.member_code = d.member_code LEFT JOIN bdccb.td_loan_member_trans_temp e ON a.ccb_loan_id = e.ccb_loan_id AND a.tenant_id = e.tenant_id AND a.loan_id = e.loan_id",
      mem_whr = `a.tenant_id = '${tenant_id}' AND a.ccb_loan_id = '${loan.loan_id}' AND a.group_code = '${group_code}'`;
      let shg_member_dtls = await db_Select(mem_select,mem_table,mem_whr,null);

      let created_dt = null;
      let approval_status = null;

     if (shg_member_dtls.suc === 1 && shg_member_dtls.msg.length > 0) {
        created_dt = shg_member_dtls.msg[0].created_dt;
        approval_status = shg_member_dtls.msg[0].approval_status;
     }

        let today = new Date().toISOString().split('T')[0];

      loan.members = shg_member_dtls.suc === 1 ? shg_member_dtls.msg : [];

       loan.created_dt = created_dt;
       loan.approval_status = approval_status;
       loan.is_editable = approval_status === 'U' && created_dt === today;

        //  loan.members = shg_member_dtls.suc === 1 ? shg_member_dtls.msg.map(m => ({
        //  ...m,
        //  is_editable: m.approval_status === 'U' && m.created_dt === new Date().toISOString().split('T')[0]
        // })) : [];

      loan_finalData_mem.push(loan);
    }

    return res.send({
      success: true,
      msg: `Fetch group ${fetch_grp_code.msg[0].group_name} disbursed Loan Details`,
      data: loan_finalData_mem,
    });
    }catch(error){
    console.error("Error in while group leader fetch loan details:", error);
    return res.send({
      success: false,
      msg: "Internal server error",
      errorCode: "SERVER_ERROR",
    });
    }
});


// SAVE RECOVERY IN GROUP LEVEL
groupRecoveryRouter.post("/save_grp_recovery", async (req, res) => {
    try{
    const {tenant_id,branch_id,loan_acc_no,loan_to,branch_shg_id,members,created_by,ip_address,loan_id} = req.body;
    console.log(req.body,'recov');
    
    let datetime = new Date().toISOString().slice(0, 19).replace("T", " ");

    let date = new Date().toISOString().slice(0, 10);

     let isInserted = false;
    let isUpdated = false;

    // row insert td_loan_member_trans_temp table //

    for (const mem of members) {  

     const isUpdate = mem.mem_trn_id && Number(mem.mem_trn_id) > 0;   
     let mem_trans_id = await member_trans_id();

     const table2 = "bdccb.td_loan_member_trans_temp";
     const columns2 = mem.mem_trn_id > 0 ? ["cr_amt","modified_by","modified_dt","ip_address","sb_amt"] : ["trans_date","trans_id","loan_id","ccb_loan_id","tenant_id","branch_id","loan_to","branch_shg_id","loan_acc_no","trans_type","dr_amt","cr_amt","curr_prn_recov","curr_intt_recov","ovd_prn_recov","ovd_intt_recov","curr_prn","curr_intt","ovd_prn","ovd_intt","approval_status","created_by","created_dt","ip_address","sb_amt"];

     const values2 = mem.mem_trn_id > 0 ? [mem.cr_amt,created_by,datetime,ip_address,mem.sb_amt] : [date,mem_trans_id,mem.mem_loan_id,loan_id,tenant_id,branch_id,loan_to,branch_shg_id,loan_acc_no,'R',mem.principal_amt,mem.cr_amt,0,0,0,0,0,0,0,0,'U',created_by,datetime,ip_address,mem.sb_amt];
     const whereColumns2 = mem.mem_trn_id > 0 ? ["loan_id","ccb_loan_id","tenant_id","branch_id"] : [];
     const whereValues2 = mem.mem_trn_id > 0 ? [mem.mem_loan_id,loan_id,tenant_id,branch_id] : [];
     const flag2 = mem.mem_trn_id > 0 ? 1 : 0;
     const member_trans_result = await saveRecord(table2,columns2,values2,whereColumns2,whereValues2,flag2);

      if (!member_trans_result || member_trans_result.suc !== 1) {
      return res.send({
            success: false,
            msg: mem.mem_trn_id > 0 ? "Failed to update loan in member transaction table group recovery time" : "Failed to save loan in member transaction table group recovery time",
            data: []
          });
      }

       if (isUpdate) {
        isUpdated = true;
      } else {
        isInserted = true;
      }
    }

    return res.send({
      success: true,
      msg: isUpdated > 0 ? "Recovery Updated Successfully" : "Recovery Done Successfully",
    });
    }catch(error){
    console.error("Error in while save group recovery data:", error);
    return res.send({
      success: false,
      msg: "Internal server error",
      errorCode: "SERVER_ERROR",
    });
    }
});


module.exports = {groupRecoveryRouter}
