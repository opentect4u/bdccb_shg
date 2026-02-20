const { db_Select, saveRecord } = require("../../model/pgcommon");
const express = require("express"),
recovRouter = express.Router();



const transaction_id = async () => {
  const timestamp = new Date().getTime();
  const newPayId = `${timestamp}`;
  return newPayId;
};

const balance_id = async () => {
  const timestamp = new Date().getTime();
  const balID = `${timestamp}`;
  return balID;
};


const interest_cal_amt = async (principal, time, rate, period_mode) => {
  try {
    const period = periodic.filter((p) => p.id == period_mode);

    const periodValue = period[0].tot_period;
    const interest = ((principal * rate) / 100 / periodValue) * time;

    // console.log(interest);
    return Math.round(interest);
  } catch (error) {
    console.error(error.message);
    throw error;
  }
};



recovRouter.post("/fetch_pacs_shg_details", async (req, res) => {
  try {
    const { loan_to, branch_code, tenant_id, branch_shg_id } = req.body;
    // console.log(req.body,'pacs/shg');

    let select = "";
    let table_name = "";
    let whr = "";
    let order = null;

    if (loan_to == "P") {
      select = "a.branch_id,a.branch_name";
      table_name = "public.md_branch a";
      whr = `a.tenant_id = '${tenant_id}' AND a.branch_status = 'O' AND a.branch_type = 'P' AND (a.branch_name ILIKE '%${branch_shg_id}%' OR a.branch_id::text ILIKE '%${branch_shg_id}%')`;
      order = null;
    } else {
      select = "a.group_code,a.branch_code,a.group_name";
      table_name = "bdccb.md_group a";
      whr = `a.branch_code = '${branch_code}' AND a.open_close_flag = 'O' AND a.delete_flag = 'N' AND (a.group_name ILIKE '%${branch_shg_id}%' OR a.group_code::text ILIKE '%${branch_shg_id}%')`;
      order = null;
    }
    let fetch_details = await db_Select(select, table_name, whr, order);

    if (fetch_details.suc === 1 && fetch_details.msg.length > 0) {
      return res.send({
        success: true,
        msg: loan_to == "P" ? "PACS List" : "SHG List",
        data: fetch_details.msg,
      });
    } else {
      return res.send({
        success: true,
        msg: loan_to == "P" ? "No PACS data found" : "No SHG data found",
        data: [],
      });
    }
  } catch (error) {
    console.error("Error in while fetch pacs/shg details:", error);
    return res.send({
      success: false,
      msg: "Internal server error",
      errorCode: "SERVER_ERROR",
    });
  }
});

// SAVE DISBURSEMENT (BRANCH -> PACS)
recovRouter.post("/save_recovery", async (req, res) => {
  try {
    const { trans_id,tenant_id,branch_id,loan_acc_no,loan_to,branch_shg_id,recov_dt,recov_amt,created_by,ip_address,loan_id,tran_id,curr_prn_recov,curr_intt_recov,curr_prn,curr_intt } = req.body;

    let datetime = new Date().toISOString().slice(0, 19).replace("T", " ");
    let transid = trans_id > 0 ? trans_id : await transaction_id();
    var table = "bdccb.td_loan_transactions";
    var columns =
      trans_id > 0 ? ["trans_dt","loan_to","branch_shg_id","loan_ac_no","cr_amt","curr_prn","modified_by","modified_dt","ip_address"] : ["trans_dt","trans_id","tenant_id","loan_to","branch_shg_id","loan_id","loan_ac_no","trans_type","dr_amt","cr_amt","curr_prn_recov","curr_intt_recov","ovd_prn_recov","ovd_intt_recov","curr_prn","curr_intt","ovd_prn","ovd_intt","approval_status","created_by","created_dt","ip_address"];
    var values =
      trans_id > 0
        ? [recov_dt,loan_to,branch_shg_id,loan_acc_no,recov_amt,curr_prn_recov,created_by,datetime,ip_address,]: [recov_dt,transid,tenant_id,loan_to,branch_shg_id,loan_id,
          loan_acc_no,"R",0,recov_amt,curr_prn_recov,curr_intt_recov,0,0,curr_prn,curr_intt,0,0,"U",created_by,datetime,ip_address];
    var whereColumns = trans_id > 0 ? ["trans_id", "tenant_id", "loan_id"] : [];
    var whereValues = trans_id > 0 ? [tran_id, tenant_id, loan_id] : [];
    var flag = trans_id > 0 ? 1 : 0;
    var trans_result = await saveRecord(
      table,
      columns,
      values,
      whereColumns,
      whereValues,
      flag,
    );

    if (!trans_result || trans_result.suc !== 1) {
      return res.send({
        success: true,
        msg:
          trans_result.msg || loan_id > 0
            ? "Failed to edit loan in transaction table"
            : "Failed to save loan in transaction table",
        data: [],
      });
    }
    return res.send({
      success: true,
      msg:
        trans_id > 0
          ? "Recovery edit Done Successfully"
          : "Recovery Done Successfully",
    });
  } catch (error) {
    console.error("Error in while save recovery:", error);
    return res.send({
      success: false,
      msg: "Internal server error",
      errorCode: "SERVER_ERROR",
    });
  }
});

// FETCH PACS DETAILS FOR APPROVE
recovRouter.post("/fetch_disburse_dtls", async (req, res) => {
  try {
    const { branch_id, tenant_id, loan_to, approval_status } = req.body;
    // console.log(req.body,'fetch');

    var select =
        "a.loan_id,a.tenant_id,a.branch_id,a.loan_acc_no,a.loan_to,a.branch_shg_id,a.period,a.curr_roi,a.penal_roi,a.disb_dt,a.disb_amt,a.pay_mode,a.rep_start_dt,a.rep_end_dt,a.curr_prn,a.curr_intt,a.ovd_prn,a.ovd_intt,a.tot_grp,a.tot_memb,a.created_by,a.created_dt,a.ip_address,b.trans_dt,b.trans_id,b.trans_type,CASE WHEN a.loan_to = 'P' THEN c.branch_name ELSE d.group_name END AS branch_name",
      table_name =
        "bdccb.td_loan a LEFT JOIN bdccb.td_loan_transactions b ON a.loan_id = b.loan_id AND a.tenant_id = b.tenant_id AND a.branch_shg_id = b.branch_shg_id LEFT JOIN public.md_branch c ON a.branch_shg_id = c.branch_id LEFT JOIN bdccb.md_group d ON a.branch_shg_id = d.group_code",
      whr = `a.branch_shg_id = '${branch_id}' AND a.tenant_id = '${tenant_id}' AND a.loan_to = '${loan_to}' AND b.approval_status = '${approval_status}'`,
      order = null;
    var fetch_data = await db_Select(select, table_name, whr, order);

    if (fetch_data.suc === 1 && fetch_data.msg.length > 0) {
      return res.send({
        success: true,
        msg: "Fetch unapprove disbursement details",
        data: fetch_data.msg,
      });
    } else {
      return res.send({
        success: true,
        msg: "No unapprove disbursement details found",
        data: [],
      });
    }
  } catch (error) {
    console.error("Error in while fetch disbursement details:", error);
    return res.send({
      success: false,
      msg: "Internal server error",
      errorCode: "SERVER_ERROR",
    });
  }
});


recovRouter.post("/show_loan_status", async (req, res) => {
  try {
    const { branch_id, approval_status, loan_to } = req.body;
    //  console.log(req.body,'show');

    var select =
        loan_to == "P"
          ? `a.loan_id,b.trans_dt,b.trans_id,a.tenant_id,a.branch_id,a.loan_acc_no,a.loan_to,a.branch_shg_id,c.branch_name AS loan_to_name,a.period,a.curr_roi,a.penal_roi,a.disb_dt,a.disb_amt,a.pay_mode,a.rep_start_dt,a.rep_end_dt,a.curr_prn,a.curr_intt,a.ovd_prn,a.ovd_intt,a.tot_grp,a.tot_memb,b.trans_type,b.approval_status,a.created_by,a.created_dt,b.approved_by approved_id,e.user_name approved_by,b.approved_dt,a.ip_address`
          : `a.loan_id,b.trans_dt,b.trans_id,a.tenant_id,a.branch_id,a.loan_acc_no,a.loan_to,a.branch_shg_id,d.group_name AS loan_to_name,a.period,a.curr_roi,a.penal_roi,a.disb_dt,a.disb_amt,a.pay_mode,a.rep_start_dt,a.rep_end_dt,a.curr_prn,a.curr_intt,a.ovd_prn,a.ovd_intt,a.tot_grp,a.tot_memb,b.trans_type,b.approval_status,a.created_by,a.created_dt,b.approved_by approved_id,e.user_name approved_by,b.approved_dt,a.ip_address`,
      table_name =
        "bdccb.td_loan a LEFT JOIN bdccb.td_loan_transactions b ON a.tenant_id = b.tenant_id AND a.loan_id = b.loan_id LEFT JOIN public.md_branch c ON a.branch_id = c.branch_id LEFT JOIN bdccb.md_group d ON a.branch_shg_id = d.group_code LEFT JOIN bdccb.md_user e ON b.approved_by = e.user_id",
      whr = `a.branch_id = '${branch_id}' AND b.approval_status = '${approval_status}' AND a.loan_to = '${loan_to}'`,
      order = `b.trans_id,b.trans_dt`;
    var show_loan_dtls = await db_Select(select, table_name, whr, order);

    if (show_loan_dtls.suc === 1 && show_loan_dtls.msg.length > 0) {
      
      return res.send({
        success: true,
        msg: `Fetch ${approval_status == "A" ? "Approved" : "Unapproved"} disbursed Loan Details`,
        data: show_loan_dtls.msg,
      });
    } else {
      return res.send({
        success: true,
        msg: `Unable to fetch ${approval_status == "A" ? "Approved" : "Unapproved"} disbursed loan details`,
        data: [],
      });
    }
  } catch (error) {
    console.error("Error in while fetch loan status:", error);
    return res.send({
      success: false,
      msg: "Internal server error",
      errorCode: "SERVER_ERROR",
    });
  }
});

// FETCH TOTAL MEMBER IN PARTICULAR SHG
recovRouter.post("/fetch_tot_memb", async (req, res) => {
  try {
    const { group_code, tenant_id } = req.body;
    // console.log(req.body, "ftech_memb");

    var select = "COALESCE(COUNT(*),0) AS tot_memb",
      table_name = "bdccb.md_member",
      whr = `group_code = '${group_code}' AND tenant_id = '${tenant_id}'`,
      order = null;
    var fetch_member = await db_Select(select, table_name, whr, order);

    if (fetch_member.suc > 0 && fetch_member.msg.length > 0) {
      return res.send({
        success: true,
        msg: "fetch member details",
        data: fetch_member.msg,
      });
    } else {
      return res.send({
        success: true,
        msg: "Unable to fetch total no of member in particular shg",
        data: [],
      });
    }
  } catch (error) {
    console.error("Error in while fetch member details particular shg:", error);
    return res.send({
      success: false,
      msg: "Internal server error",
      errorCode: "SERVER_ERROR",
    });
  }
});

// SAVE DISBURSEMENT (BRANCH -> SHG / PACS -> SHG)
recovRouter.post("/save_disburse_brn_pacs_shg", async (req, res) => {
  try {
    const {
      tenant_id,
      branch_id,
      loan_to,
      period,
      curr_roi,
      penal_roi,
      disb_dt,
      loanee_dtls,
      created_by,
      ip_address,
    } = req.body;
    console.log(req.body, "data shg");

    let datetime = new Date().toISOString().slice(0, 19).replace("T", " ");

    let isEdit = loanee_dtls.some((m) => Number(m.loan_id) > 0);

    for (let dt of loanee_dtls) {
      var pay_mode = "Monthly";

      let instl_date = await genDate(disb_dt, period, pay_mode);
      const startDate = instl_date.emtStart;
      const endDate = instl_date.emiEnd;

      let loan_code = await loanCode(branch_id);

      var table = "bdccb.td_loan";
      var columns =
        dt.loan_id > 0
          ? [
              "loan_acc_no",
              "loan_to",
              "branch_shg_id",
              "period",
              "curr_roi",
              "penal_roi",
              "disb_dt",
              "disb_amt",
              "rep_start_dt",
              "rep_end_dt",
              "curr_prn",
              "tot_memb",
              "modified_by",
              "modified_dt",
              "ip_address",
            ]
          : [
              "loan_id",
              "tenant_id",
              "branch_id",
              "loan_acc_no",
              "loan_to",
              "branch_shg_id",
              "period",
              "curr_roi",
              "penal_roi",
              "disb_dt",
              "disb_amt",
              "pay_mode",
              "rep_start_dt",
              "rep_end_dt",
              "curr_prn",
              "curr_intt",
              "ovd_prn",
              "ovd_intt",
              "tot_memb",
              "created_by",
              "created_dt",
              "ip_address",
            ];
      var values =
        dt.loan_id > 0
          ? [
              dt.loan_acc_no || null,
              loan_to,
              dt.branch_shg_id,
              period,
              curr_roi,
              penal_roi,
              disb_dt,
              dt.disb_amt,
              startDate,
              endDate,
              dt.disb_amt,
              dt.tot_memb,
              created_by,
              datetime,
              ip_address,
            ]
          : [
              loan_code,
              tenant_id,
              branch_id,
              dt.loan_acc_no || null,
              loan_to,
              dt.branch_shg_id,
              period,
              curr_roi,
              penal_roi,
              disb_dt,
              dt.disb_amt,
              pay_mode,
              startDate,
              endDate,
              dt.disb_amt,
              0,
              0,
              0,
              dt.tot_memb,
              created_by,
              datetime,
              ip_address,
            ];
      var whereColumns =
        dt.loan_id > 0 ? ["loan_id", "tenant_id", "branch_id"] : [];
      var whereValues =
        dt.loan_id > 0 ? [dt.loan_id, tenant_id, branch_id] : [];
      var flag = dt.loan_id > 0 ? 1 : 0;
      var result_shg = await saveRecord(
        table,
        columns,
        values,
        whereColumns,
        whereValues,
        flag,
      );

      if (!result_shg || result_shg.suc !== 1) {
        return res.send({
          success: true,
          msg: dt.loan_id > 0 ? "Loan edit failed" : "Loan save failed",
          data: [],
        });
      }

      let trans_id = await transaction_id();

      var table = "bdccb.td_loan_transactions";
      var columns =
        dt.loan_id > 0
          ? [
              "trans_dt",
              "loan_to",
              "branch_shg_id",
              "loan_ac_no",
              "dr_amt",
              "curr_prn",
              "modified_by",
              "modified_dt",
              "ip_address",
            ]
          : [
              "trans_dt",
              "trans_id",
              "tenant_id",
              "loan_to",
              "branch_shg_id",
              "loan_id",
              "loan_ac_no",
              "trans_type",
              "dr_amt",
              "cr_amt",
              "curr_prn_recov",
              "curr_intt_recov",
              "ovd_prn_recov",
              "ovd_intt_recov",
              "curr_prn",
              "curr_intt",
              "ovd_prn",
              "ovd_intt",
              "approval_status",
              "created_by",
              "created_dt",
              "ip_address",
            ];
      var values =
        dt.loan_id > 0
          ? [
              disb_dt,
              loan_to,
              dt.branch_shg_id,
              dt.loan_acc_no || null,
              dt.disb_amt,
              dt.disb_amt,
              created_by,
              datetime,
              ip_address,
            ]
          : [
              disb_dt,
              trans_id,
              tenant_id,
              loan_to,
              dt.branch_shg_id,
              loan_code,
              dt.loan_acc_no || null,
              "D",
              dt.disb_amt,
              0,
              0,
              0,
              0,
              0,
              dt.disb_amt,
              0,
              0,
              0,
              "U",
              created_by,
              datetime,
              ip_address,
            ];
      var whereColumns =
        dt.loan_id > 0 ? ["trans_id", "tenant_id", "loan_id"] : [];
      var whereValues =
        dt.loan_id > 0 ? [dt.tran_id, tenant_id, dt.loan_id] : [];
      var flag = dt.loan_id > 0 ? 1 : 0;
      var trans_result = await saveRecord(
        table,
        columns,
        values,
        whereColumns,
        whereValues,
        flag,
      );

      if (!trans_result || trans_result.suc !== 1) {
        return res.send({
          success: true,
          msg:
            trans_result.msg || dt.loan_id > 0
              ? "Failed to edit loan in transaction table"
              : "Failed to save loan in transaction table",
          data: [],
        });
      }
    }
    return res.send({
      success: true,
      msg: isEdit
        ? "Disbursement edit Done Successfully"
        : "Disbursement Done Successfully",
    });
  } catch (error) {
    console.error(
      "Error in while save disbursement from Branch/Pacs to SHG:",
      error,
    );
    return res.send({
      success: false,
      msg: "Internal server error",
      errorCode: "SERVER_ERROR",
    });
  }
});

module.exports = {
  recovRouter,
};
