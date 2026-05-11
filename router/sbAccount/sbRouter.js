const { db_Select, saveRecord, deleteRecord } = require('../../model/pgcommon');

const express = require('express'),
  sbRouter = express.Router();

// search group
sbRouter.post("/search_gp", async (req, res) => {
  try {
    const { branch_code, pacs_id, branch_type, gp_search } = req.body;

    var select = "a.group_code,a.group_name,a.sb_ac_no";
    table_name = "bdccb.md_group a";
    if (branch_type == 'B' && pacs_id == 111) {
      whr = `a.branch_code = '${branch_code}' AND a.delete_flag = 'N' AND a.pacs_id = '${pacs_id}' AND a.sb_ac_no = '${gp_search}'
    GROUP BY a.group_code,a.group_name,a.sb_ac_no`;
      order = null;
    } else if (branch_type == 'P') {
      whr = `a.pacs_id='${branch_code}' AND a.delete_flag = 'N'
      AND a.sb_ac_no = '${gp_search}'
      GROUP BY a.group_code,a.group_name,a.sb_ac_no`;
      order = null;
    } else {
      whr = `a.delete_flag = 'N' AND a.sb_ac_no = '${gp_search}'`;
      order = null;
    }
    var fetch_gp = await db_Select(select, table_name, whr, order)

    if (fetch_gp.suc === 1 && fetch_gp.msg.length > 0) {
      return res.send({
        success: true,
        msg: "Group found",
        data: fetch_gp.msg
      });
    } else {
      return res.send({
        success: true,
        msg: "No Group found",
        data: []
      });
    }
  } catch (error) {
    console.log("Error while fetching group details:", error);
    return res.send({
      success: false,
      msg: "Internal server error",
      errorCode: "SERVER_ERROR"
    });
  }
});

// fetch group details in saving account page
// sbRouter.post("/fetch_gp_dtls", async (req, res) => {
//   try {
//     const { branch_code, pacs_id, branch_type, sb_ac_no } = req.body;

//      // CHECK UNAPPROVED GROUP TRANSACTION
//     let select1 = "COUNT(*) cnt";
//     let table_name1 = "bdccb.td_deposit_trans";
//     let whr1 = `shg_id = '${group_code}' 
//                AND approval_flag = 'U'`; 
//     let order1 = null;

//     let unapprove_gp = await db_Select(select1, table_name1, whr1, order1);

//     // CHECK UNAPPROVED MEMBER TRANSACTION
//     select = "COUNT(*) cnt";
//     table_name = "bdccb.td_sb_trans";
//     whr = `shg_id = '${group_code}' 
//            AND approval_flag = 'U'`; // change if needed

//     let unapprove_mem = await db_Select(select, table_name, whr, order);

//     const gp_pending =
//       unapprove_gp.suc === 1 &&
//       Number(unapprove_gp.msg[0].cnt) > 0;

//     const mem_pending =
//       unapprove_mem.suc === 1 &&
//       Number(unapprove_mem.msg[0].cnt) > 0;

//     if (gp_pending || mem_pending) {
//       return res.send({
//         success: true,
//         msg: "First approve transaction"
//       });
//     }

//     // FETCH GROUP DETAILS

//     var select = `a.group_code,a.group_name,a.sb_ac_no,COALESCE(
// (
// SELECT balance
// FROM bdccb.td_deposit_trans t
// WHERE t.shg_id = a.group_code
// ORDER BY t.trans_dt DESC, t.trans_no DESC
// LIMIT 1
// ),0
// ) AS grp_balance`;
//     table_name = "bdccb.md_group a";
//     whr = `a.group_code = '${group_code}'`;
//     order = null;
//     var fetch_gp = await db_Select(select, table_name, whr, order)

//     if (fetch_gp.suc !== 1 || fetch_gp.msg.length === 0) {
//       return res.send({
//         success: true,
//         msg: "Group data not found",
//         data: []
//       });
//     }

//     // FETCH GROUP MEMBERS // 
//     var select = `a.member_code member_id,a.group_code,a.member_name,a.member_account_no as sb_acc_no,COALESCE(
// (
// SELECT balance
// FROM bdccb.td_sb_trans t
// WHERE t.member_id = a.member_code
// AND t.shg_id = a.group_code
// ORDER BY t.trans_dt DESC, t.trans_no DESC
// LIMIT 1
// ),0
// ) AS member_balance`,
//       table_name = "bdccb.md_member a",
//       whr = `a.group_code = '${group_code}' AND a.approval_status NOT IN ('R') AND a.delete_flag = 'N'`,
//       order = null;
//     var grp_mem_dt = await db_Select(select, table_name, whr, order);

//     fetch_gp.msg.forEach((group) => {
//       group["memb_dt"] =
//         grp_mem_dt.suc === 1
//           ? grp_mem_dt.msg.filter(
//             (m) => m.group_code === group.group_code
//           )
//           : [];
//     });
//     if (fetch_gp.suc === 1 && fetch_gp.msg.length > 0) {
//       return res.send({
//         success: true,
//         msg: "Group with member List",
//         data: fetch_gp.msg
//       });
//     } else {
//       return res.send({
//         success: true,
//         msg: "Failed to fetch group with member data",
//         data: []
//       });
//     }
//   } catch (error) {
//     console.log("Error while fetching group details:", error);
//     return res.send({
//       success: false,
//       msg: "Internal server error",
//       errorCode: "SERVER_ERROR"
//     });
//   }
// });

sbRouter.post("/fetch_gp_dtls", async (req, res) => {
  try {
    const { branch_code, pacs_id, branch_type, sb_ac_no } = req.body;

     // FIRST FETCH GROUP CODE USING ACCOUNT NUMBER

      let select_gp = "group_code";
      let table_gp = "bdccb.md_group a";
      let whr_gp = "";
     if (branch_type == 'B' && pacs_id == 111) {

      whr_gp = `a.branch_code = '${branch_code}'
                AND a.delete_flag = 'N'
                AND a.pacs_id = '${pacs_id}'
                AND a.sb_ac_no = '${sb_ac_no}'`;
    } else if (branch_type == 'P') {
      whr_gp = `a.pacs_id='${branch_code}'
                AND a.delete_flag = 'N'
                AND a.sb_ac_no = '${sb_ac_no}'`;
    } else {
      whr_gp = `a.delete_flag = 'N'
                AND a.sb_ac_no = '${sb_ac_no}'`;
    }

    let fetch_group_code = await db_Select(select_gp,table_gp,whr_gp,null);

    if (fetch_group_code.suc !== 1 ||fetch_group_code.msg.length === 0) {
      return res.send({
        success: true,
        msg: "Group data not found",
        data: []
      });
    }

    // PICK GROUP CODE
    const group_code = fetch_group_code.msg[0].group_code;

    // CHECK UNAPPROVED GROUP TRANSACTION

    let select1 = "COUNT(*) cnt";
    let table_name1 = "bdccb.td_deposit_trans";
    let whr1 = `shg_id = '${group_code}' AND approval_flag = 'U'`;

    let unapprove_gp = await db_Select(select1,table_name1,whr1,null);

    // CHECK UNAPPROVED MEMBER TRANSACTION

    let select2 = "COUNT(*) cnt";
    let table_name2 = "bdccb.td_sb_trans";
    let whr2 = `shg_id = '${group_code}'
                AND approval_flag = 'U'`;
    let unapprove_mem = await db_Select(select2,table_name2,whr2,null);

    // IF ANY UNAPPROVED TRANSACTION EXISTS

    if (
      (unapprove_gp.suc === 1 &&
        Number(unapprove_gp.msg[0].cnt) > 0) ||

      (unapprove_mem.suc === 1 &&
        Number(unapprove_mem.msg[0].cnt) > 0)
    ) {
      return res.send({
        success: true,
        msg: "First approve previous transaction",
        data: []
      });
    }

    // FETCH GROUP DETAILS
    var select = `a.group_code,a.group_name,a.sb_ac_no,COALESCE(
(
SELECT balance
FROM bdccb.td_deposit_trans t
WHERE t.shg_id = a.group_code
ORDER BY t.trans_dt DESC, t.trans_no DESC
LIMIT 1
),0
) AS grp_balance`;
    table_name = "bdccb.md_group a";

     if (branch_type == 'B' && pacs_id == 111) {
    whr = `a.branch_code = '${branch_code}' AND a.delete_flag = 'N' AND a.pacs_id = '${pacs_id}' AND a.sb_ac_no = '${sb_ac_no}'`;
    order = null;
    } else if (branch_type == 'P') {
      whr = `a.pacs_id='${branch_code}' AND a.delete_flag = 'N'
      AND a.sb_ac_no = '${sb_ac_no}'`;
      order = null;
    } else {
      whr = `a.delete_flag = 'N' AND a.sb_ac_no = '${sb_ac_no}'`;
      order = null;
    }
    var fetch_gp = await db_Select(select, table_name, whr, order)

    if (fetch_gp.suc !== 1 || fetch_gp.msg.length === 0) {
      return res.send({
        success: true,
        msg: "Group data not found",
        data: []
      });
    }

    // const group_code = fetch_gp.msg[0].group_code;

    // FETCH GROUP MEMBERS // 
    var select = `a.member_code member_id,a.group_code,a.member_name,a.member_account_no as sb_acc_no,COALESCE(
(
SELECT balance
FROM bdccb.td_sb_trans t
WHERE t.member_id = a.member_code
AND t.shg_id = a.group_code
ORDER BY t.trans_dt DESC, t.trans_no DESC
LIMIT 1
),0
) AS member_balance`,
      table_name = "bdccb.md_member a",
      whr = `a.group_code = '${group_code}' AND a.approval_status NOT IN ('R') AND a.delete_flag = 'N'`,
      order = null;
    var grp_mem_dt = await db_Select(select, table_name, whr, order);

    fetch_gp.msg.forEach((group) => {
      group["memb_dt"] =
        grp_mem_dt.suc === 1
          ? grp_mem_dt.msg.filter(
            (m) => m.group_code === group.group_code
          )
          : [];
    });
    if (fetch_gp.suc === 1 && fetch_gp.msg.length > 0) {
      return res.send({
        success: true,
        msg: "Group with member List",
        data: fetch_gp.msg
      });
    } else {
      return res.send({
        success: true,
        msg: "Failed to fetch group with member data",
        data: []
      });
    }
  } catch (error) {
    console.log("Error while fetching group details:", error);
    return res.send({
      success: false,
      msg: "Internal server error",
      errorCode: "SERVER_ERROR"
    });
  }
});

// save deposit/withdrawl
sbRouter.post("/save_sb_transaction", async (req, res) => {
  try {
    const { flag, tenant_id, branch_id, shg_id, grp_acc_no, dep_with_flag, cr_amt, created_by, created_ip, members } = req.body;
    console.log(req.body, 'sb');


    let datetime = new Date().toISOString().slice(0, 19).replace('T', ' ');

    // if (!members || !Array.isArray(members) || members.length === 0) {
    //   return res.send({ success: true, msg: "Member data is required" });
    // }

    // Fetch current balance
    const balance_data = await db_Select("balance", "bdccb.td_deposit_trans", `acc_no = '${grp_acc_no}'`, "trans_dt DESC", 1);
    let prev_balance = 0;
    if (
      balance_data.suc > 0 &&
      balance_data.msg.length > 0) {
      prev_balance = parseFloat(balance_data.msg[0].balance || 0);
    }
    // let prev_balance = parseFloat(balance_data.suc > 0 ? balance_data.msg[0].balance : 0);
    let trans_amount = parseFloat(cr_amt || 0);
    let new_balance = 0;
    let dr_amt = 0;
    let cr_amount = 0;
    let remarks = dep_with_flag == 'D' ? 'Deposit' : 'Withdrawal';

    if (dep_with_flag == 'D') { // Deposit
      new_balance = prev_balance + trans_amount;
      cr_amount = trans_amount;
    } else { // Withdraw
      new_balance = prev_balance - trans_amount;
      dr_amt = trans_amount;
    }

    // 1. Calculate total amount
    // let total_amount = 0;
    // for (const m of members) {
    //   total_amount += parseFloat(m.amount || 0);
    // }

    // if (total_amount <= 0) {
    //   return res.send({ success: true, msg: "Total amount must be greater than 0" });
    // }

    if (flag == 'M') {
      const table_trans = "bdccb.td_deposit_trans";
      const columns_trans = ["tenant_id", "branch_id", "acc_no", "trans_dt", "dep_with_flag", "dr_amt", "cr_amt", "balance", "remarks", "created_by", "created_at", "created_ip", "approval_flag", "shg_id"];
      const values_trans = [tenant_id, branch_id, grp_acc_no, datetime, dep_with_flag, dr_amt, cr_amount, new_balance, remarks, created_by, datetime, created_ip, 'U', shg_id];
      const whereColumns_trans = [];
      const whereValues_trans = [];
      const flag_trans = 0;
      const result_trans = await saveRecord(table_trans, columns_trans, values_trans, whereColumns_trans, whereValues_trans, flag_trans);

      if (result_trans.suc === 0) {
        return res.send({
          success: true,
          msg: result_trans.msg
        });
      }

      for (const memb of members) {
        const balance_mem_data = await db_Select("balance", "bdccb.td_sb_trans", `acc_no = '${memb.sb_acc_no}'`, "trans_dt DESC", 1);
        let mem_prev_balance = 0;
        if (
          balance_mem_data.suc > 0 &&
          balance_mem_data.msg.length > 0) {
          mem_prev_balance = parseFloat(balance_mem_data.msg[0].balance || 0);
        }
        const memb_amt = parseFloat(memb.amount || 0);
        let new_memb_balance = 0;
        let mem_cr_amount = 0;
        let mem_dr_amount = 0;
        //  let new_memb_balance = dep_with_flag === 'D' ? parseFloat(memb_balance) + memb_amt : parseFloat(memb_balance) - memb_amt;

        if (dep_with_flag == 'D') { // Deposit
          new_memb_balance = mem_prev_balance + memb_amt;
          mem_cr_amount = memb_amt;
          mem_dr_amount = 0;
        } else { // Withdraw
          new_memb_balance = mem_prev_balance - memb_amt;
          mem_dr_amount = memb_amt;
          mem_cr_amount = 0;
        }

        const table_trans = "bdccb.td_sb_trans";
        const columns_trans = ["tenant_id", "branch_id", "acc_no", "trans_dt", "dep_with_flag", "dr_amt", "cr_amt", "balance", "remarks", "created_by", "created_at", "created_ip", "approval_flag", "shg_id", "member_id"];
        const values_trans = [tenant_id, branch_id, memb.sb_acc_no, datetime, dep_with_flag, mem_dr_amount, mem_cr_amount, new_memb_balance, remarks, created_by, datetime, created_ip, 'U', shg_id, memb.member_id];
        const whereColumns_trans = [];
        const whereValues_trans = [];
        const flag_trans = 0;
        const result_trans_memb = await saveRecord(table_trans, columns_trans, values_trans, whereColumns_trans, whereValues_trans, flag_trans);

        if (result_trans_memb.suc === 0) {
          return res.send({
            success: true,
            msg: result_trans_memb.msg,
            member_id: memb.member_id
          });
        }
      }
    } else {
      const table_trans = "bdccb.td_deposit_trans";
      const columns_trans = ["tenant_id", "branch_id", "acc_no", "trans_dt", "dep_with_flag", "dr_amt", "cr_amt", "balance", "remarks", "created_by", "created_at", "created_ip", "approval_flag", "shg_id"];
      const values_trans = [tenant_id, branch_id, grp_acc_no, datetime, dep_with_flag, dr_amt, cr_amount, new_balance, remarks, created_by, datetime, created_ip, 'U', shg_id];
      const whereColumns_trans = [];
      const whereValues_trans = [];
      const flag_trans = 0;
      const result_trans = await saveRecord(table_trans, columns_trans, values_trans, whereColumns_trans, whereValues_trans, flag_trans);

      if (result_trans.suc === 0) {
        return res.send({
          success: true,
          msg: result_trans.msg
        });
      }
    }
    return res.send({
      success: true,
      msg: "Savings transaction saved successfully"
    });
  } catch (error) {
    console.log("Error while save savings transaction:", error);
    return res.send({
      success: false,
      msg: "Internal server error",
      errorCode: "SERVER_ERROR"
    });
  }
});

// fetch deposit and Withdrawal list
sbRouter.post("/fetch_sb_transaction_list", async (req, res) => {
  try {
    const { dep_with_flag, tenant_id, branch_id} = req.body;

    var select = `a.shg_id, b.group_name, a.acc_no, TO_CHAR(a.trans_dt, 'YYYY-MM-DD HH24:MI:SS') AS trans_dt, a.dep_with_flag, a.dr_amt, a.cr_amt, a.balance, a.remarks, a.approval_flag,
    CASE WHEN EXISTS (
    SELECT 1
    FROM bdccb.td_sb_trans x
    WHERE x.shg_id = a.shg_id
    AND x.trans_dt = a.trans_dt)
    THEN 'M'
    ELSE 'D'
    END AS flag`;
    var table_name = "bdccb.td_deposit_trans a LEFT JOIN bdccb.md_group b ON a.shg_id = b.group_code";
    var whr = `a.tenant_id = '${tenant_id}' AND a.branch_id = '${branch_id}' AND a.dep_with_flag = '${dep_with_flag}' AND a.balance > 0`;

    // if (trans_dt) {
    //   whr += ` AND date(a.trans_dt) = '${trans_dt}'`;
    // }

    var order = "a.trans_dt";
    var fetch_data = await db_Select(select, table_name, whr, order);

    if (fetch_data.suc === 1 && fetch_data.msg.length > 0) {
      return res.send({
        success: true,
        msg: "Transaction list found",
        data: fetch_data.msg
      });
    } else {
      return res.send({
        success: true,
        msg: "No transaction found",
        data: []
      });
    }
  } catch (error) {
    console.log("Error while fetch savings transaction:", error);
    return res.send({
      success: false,
      msg: "Internal server error",
      errorCode: "SERVER_ERROR"
    });
  }
});

// fetch total transaction details with member
sbRouter.post("/fetch_sb_transaction_dtls", async (req, res) => {
  try {
    const { group_code, trans_dt, flag } = req.body;

    var select = "a.shg_id, b.group_name, a.acc_no as grp_acc_no, TO_CHAR(trans_dt, 'YYYY-MM-DD HH24:MI:SS') AS trans_dt, a.dep_with_flag, a.dr_amt, a.cr_amt, a.balance as grp_balance, a.approval_flag";
    var table_name = "bdccb.td_deposit_trans a LEFT JOIN bdccb.md_group b ON a.shg_id = b.group_code";
    var whr = `a.shg_id = '${group_code}' AND a.trans_dt = '${trans_dt}'`;
    
    var fetch_grp_trans = await db_Select(select, table_name, whr, null);
    if (fetch_grp_trans.suc !== 1 || fetch_grp_trans.msg.length === 0) {
      return res.send({
        success: true,
        msg: "Transaction details not found",
        data: []
      });
    }
    // Fetch Individual Member level transaction details
    if(flag == 'M'){
    var select_mem = "a.member_id, b.member_name, a.acc_no as sb_acc_no, a.dr_amt, a.cr_amt, a.balance as member_balance, a.dep_with_flag";
    var table_mem = "bdccb.td_sb_trans a LEFT JOIN bdccb.md_member b ON a.member_id = b.member_code AND a.shg_id = b.group_code";
    var whr_mem = `a.shg_id = '${group_code}' AND a.trans_dt = '${trans_dt}'`;
    var order_mem = "b.member_name";
    }else{
    var select_mem = "DISTINCT ON (a.member_id) a.member_id, b.member_name, a.acc_no as sb_acc_no, a.dr_amt, a.cr_amt, a.balance as member_balance, a.dep_with_flag";
    var table_mem = "bdccb.td_sb_trans a LEFT JOIN bdccb.md_member b ON a.member_id = b.member_code AND a.shg_id = b.group_code";
    var whr_mem = `a.shg_id = '${group_code}'`;
    var order_mem = `a.member_id, a.trans_dt DESC`;
    }
    
    var fetch_mem_trans = await db_Select(select_mem, table_mem, whr_mem,order_mem);
    var result = fetch_grp_trans.msg[0];
    result["memb_dt"] = fetch_mem_trans.suc === 1 ? fetch_mem_trans.msg : [];
    return res.send({
      success: true,
      msg: "Transaction details with member list",
      data: result
    });
  } catch (error) {
    console.log("Error while fetch savings transaction details:", error);
    return res.send({
      success: false,
      msg: "Internal server error",
      errorCode: "SERVER_ERROR"
    });
  }
});

// approve transaction
// sbRouter.post("/approve_sb_transaction", async (req, res) => {
//   try {
//     const { flag,tenant_id,branch_id,shg_id,grp_acc_no,dep_with_flag,cr_amt,trans_dt,members,approved_by,approved_ip} = req.body;
//     console.log(req.body,'approve');
    
//     let datetime = new Date().toISOString().slice(0, 19).replace('T', ' ');

//     if (flag == 'M') {
//        let total_member_amt = 0;

//     for (const m of members) {
//         total_member_amt += parseFloat(m.amount || 0);
//     }

//     if (parseFloat(cr_amt || 0) !== total_member_amt) {
//         return res.send({
//           success: true,
//           msg: "Group amount and member amount mismatch"
//         });
//       }
//     }
//       const table_trans = "bdccb.td_deposit_trans";
//       const columns_trans = ["approval_flag","approved_by","approved_at"];
//       const values_trans = ['A',approved_by,datetime];
//       const whereColumns_trans = ["tenant_id","branch_id","acc_no","trans_dt","shg_id"];
//       const whereValues_trans = [tenant_id,branch_id,grp_acc_no,trans_dt,shg_id];
//       const flag_trans = 1;
//       const result_trans_app = await saveRecord(table_trans, columns_trans, values_trans, whereColumns_trans, whereValues_trans, flag_trans);

//       if (result_trans_app.suc === 0) {
//         return res.send({
//           success: true,
//           msg: result_trans_app.msg
//         });
//       }

//       const table_trans1 = "bdccb.td_deposit";
//       const columns_trans1 = ["balance","modified_by","modified_at","modified_ip"];
//       const values_trans1 = [balance,approved_by,datetime,approved_ip];
//       const whereColumns_trans1 = ["tenant_id","shg_id","branch_id","acc_no"];
//       const whereValues_trans1 = [tenant_id,shg_id,branch_id,grp_acc_no];
//       const flag_trans1 = 1;
//       const result_trans_apps = await saveRecord(table_trans1, columns_trans1, values_trans1, whereColumns_trans1, whereValues_trans1, flag_trans1);

//       if (result_trans_apps.suc === 0) {
//         return res.send({
//           success: true,
//           msg: result_trans_apps.msg
//         });
      

//       for (const memb of members) {

//         const table_trans = "bdccb.td_sb_trans";
//         const columns_trans = ["approval_flag", "approved_by", "approved_at"];
//         const values_trans = ['A',approved_by,datetime];
//         const whereColumns_trans = ["tenant_id","branch_id","acc_no","trans_dt","balance","shg_id","member_id"];
//         const whereValues_trans = [tenant_id,branch_id,memb.sb_acc_no,trans_dt,memb.member_balance,shg_id,memb.member_id];
//         const flag_trans = 1;
//         const result_trans_memb = await saveRecord(table_trans, columns_trans, values_trans, whereColumns_trans, whereValues_trans, flag_trans);

//         if (result_trans_memb.suc === 0) {
//           return res.send({
//             success: true,
//             msg: result_trans_memb.msg,
//             member_id: memb.member_id
//           });
//         }

//         const table_trans4 = "bdccb.td_sb";
//         const columns_trans4 = ["balance", "modified_by", "modified_at","modified_ip"];
//         const values_trans4 = [memb.member_balance,approved_by,datetime,approved_ip];
//         const whereColumns_trans4 = ["tenant_id","shg_id","branch_id","acc_no","member_id"];
//         const whereValues_trans4 = [tenant_id,shg_id,branch_id,memb.sb_acc_no,memb.member_id];
//         const flag_trans4 = 1;
//         const result_trans_memb4 = await saveRecord(table_trans4, columns_trans4, values_trans4, whereColumns_trans4, whereValues_trans4, flag_trans4);

//         if (result_trans_memb4.suc === 0) {
//           return res.send({
//             success: true,
//             msg: result_trans_memb.msg,
//             member_id: memb.member_id
//           });
//         }
//       }
//     } else {
//       const table_trans2 = "bdccb.td_deposit_trans";
//       const columns_trans2 = ["approval_flag","approved_by","approved_at"];
//       const values_trans2 = ['A',approved_by,datetime];
//       const whereColumns_trans2 = ["tenant_id","branch_id","acc_no","trans_dt","shg_id"];
//       const whereValues_trans2 = [tenant_id,branch_id,grp_acc_no,trans_dt,shg_id];
//       const flag_trans2 = 1;
//       const result_trans_app2 = await saveRecord(table_trans2, columns_trans2, values_trans2, whereColumns_trans2, whereValues_trans2, flag_trans2);

//       if (result_trans_app2.suc === 0) {
//         return res.send({
//           success: true,
//           msg: result_trans_app2.msg
//         });
//       }

//       const table_trans3 = "bdccb.td_deposit";
//       const columns_trans3 = ["balance","modified_by","modified_at","modified_ip"];
//       const values_trans3 = [balance,approved_by,datetime,approved_ip];
//       const whereColumns_trans3 = ["tenant_id","shg_id","branch_id","acc_no"];
//       const whereValues_trans3 = [tenant_id,shg_id,branch_id,grp_acc_no];
//       const flag_trans3 = 1;
//       const result_trans_app3 = await saveRecord(table_trans3, columns_trans3, values_trans3, whereColumns_trans3, whereValues_trans3, flag_trans3);

//       if (result_trans_app3.suc === 0) {
//         return res.send({
//           success: true,
//           msg: result_trans_app3.msg
//         });
//       }
//     }
//     return res.send({
//       success: true,
//       msg: "Transaction approved successfully"
//     });

//   } catch (error) {
//     console.log("Error while approved transaction:", error);
//     return res.send({
//       success: false,
//       msg: "Internal server error",
//       errorCode: "SERVER_ERROR"
//     });
//   }
// });

sbRouter.post("/approve_sb_transaction", async (req, res) => {
  try {
    const { flag,tenant_id,branch_id,shg_id,grp_acc_no,dep_with_flag,cr_amt,trans_dt,members,approved_by,approved_ip} = req.body;
    console.log(req.body,'approve');
    
    let datetime = new Date().toISOString().slice(0, 19).replace('T', ' ');

    if (flag == 'M') {
       let total_member_amt = 0;

    for (const m of members) {
        total_member_amt += parseFloat(m.amount || 0);
    }

    if (parseFloat(cr_amt || 0) !== total_member_amt) {
        return res.send({
          success: true,
          msg: "Group amount and member amount mismatch"
        });
      }
    }

     // =========================
    // FETCH OLD GROUP TRANS
    // =========================

    const old_grp_trans = await db_Select("*","bdccb.td_deposit_trans",`tenant_id='${tenant_id}' AND branch_id='${branch_id}' AND shg_id='${shg_id}' AND acc_no='${grp_acc_no}' AND trans_dt='${trans_dt}' AND approval_flag='U'`,null);

     if (old_grp_trans.suc === 0 ||old_grp_trans.msg.length === 0) {
      return res.send({
        success: true,
        msg: "Transaction not found"
      });
    }

    const old_grp = old_grp_trans.msg[0];

     // =========================
    // FETCH CURRENT GROUP BALANCE
    // =========================

    const grp_bal_dt = await db_Select("balance","bdccb.td_deposit",`tenant_id='${tenant_id}' AND branch_id='${branch_id}' AND shg_id='${shg_id}' AND acc_no='${grp_acc_no}'`, null);

    let current_grp_balance = 0;

    if (grp_bal_dt.suc > 0 && grp_bal_dt.msg.length > 0) {
      current_grp_balance = parseFloat(grp_bal_dt.msg[0].balance || 0);
    }

    let old_grp_amt =parseFloat(old_grp.cr_amt || old_grp.dr_amt || 0);

    let edited_grp_amt = parseFloat(cr_amt || 0);

    let final_grp_balance = 0;

    if (dep_with_flag == 'D') {

      final_grp_balance = current_grp_balance + edited_grp_amt;

    } else {

      final_grp_balance = current_grp_balance - edited_grp_amt;
    }

    const table_trans = "bdccb.td_deposit_trans";
    const columns_trans = ["dr_amt","cr_amt","balance","approval_flag","approved_by","approved_at"];
    const values_trans = [dep_with_flag == 'W' ? edited_grp_amt : 0,dep_with_flag == 'D' ? edited_grp_amt: 0, 
    final_grp_balance,'A',approved_by,datetime];
    const whereColumns_trans = ["tenant_id","branch_id","acc_no","trans_dt","shg_id"];
    const whereValues_trans = [tenant_id,branch_id,grp_acc_no,trans_dt,shg_id];
    const flag_trans = 1;
    const result_trans_app = await saveRecord(table_trans, columns_trans, values_trans, whereColumns_trans, whereValues_trans, flag_trans)  
      if (result_trans_app.suc === 0) {
        return res.send({
          success: true,
          msg: result_trans_app.msg
        });
      }

      const table_trans1 = "bdccb.td_deposit";
      const columns_trans1 = ["balance","modified_by","modified_at","modified_ip"];
      const values_trans1 = [final_grp_balance,approved_by,datetime,approved_ip];
      const whereColumns_trans1 = ["tenant_id","shg_id","branch_id","acc_no"];
      const whereValues_trans1 = [tenant_id,shg_id,branch_id,grp_acc_no];
      const flag_trans1 = 1;
      const result_trans_apps = await saveRecord(table_trans1, columns_trans1, values_trans1, whereColumns_trans1, whereValues_trans1, flag_trans1);

      if (result_trans_apps.suc === 0) {
        return res.send({
          success: true,
          msg: result_trans_apps.msg
        });
      }
      

      if (flag == 'M') {  
      for (const memb of members) {

      // FETCH OLD MEMBER TRANS

      const old_mem_trans = await db_Select("*","bdccb.td_sb_trans",`tenant_id='${tenant_id}' AND branch_id='${branch_id}' AND shg_id='${shg_id}' AND member_id='${memb.member_id}' AND trans_dt='${trans_dt}'
      AND approval_flag='U'`,null);

      if (old_mem_trans.suc === 0 || old_mem_trans.msg.length === 0) {
          return res.send({
            success: true,
            msg: `Old member transaction not found for ${memb.member_id}`
          });
        }

       const old_mem = old_mem_trans.msg[0];

      // FETCH CURRENT MEMBER BALANCE

       const mem_bal_dt = await db_Select("balance","bdccb.td_sb",`tenant_id='${tenant_id}' AND branch_id='${branch_id}' AND shg_id='${shg_id}' AND member_id='${memb.member_id}'`,null);

        let current_mem_balance = 0;

        if (mem_bal_dt.suc > 0 && mem_bal_dt.msg.length > 0) {
          current_mem_balance = parseFloat(mem_bal_dt.msg[0].balance || 0);
        }

        // let old_mem_amt =parseFloat( old_mem.cr_amt || old_mem.dr_amt || 0);

        let edited_mem_amt = parseFloat(memb.amount || 0);

        let final_mem_balance = 0;

        if (dep_with_flag == 'D') {

          final_mem_balance = current_mem_balance + edited_mem_amt;
        } else {

          final_mem_balance = current_mem_balance - edited_mem_amt;
        }

        const table_trans = "bdccb.td_sb_trans";
        const columns_trans = ["dr_amt","cr_amt","balance","approval_flag", "approved_by", "approved_at"];
        const values_trans = [dep_with_flag == 'W' ? edited_mem_amt : 0, dep_with_flag == 'D' ? edited_mem_amt : 0, final_mem_balance,'A',approved_by,datetime];
        const whereColumns_trans = ["tenant_id","branch_id","acc_no","trans_dt","balance","shg_id","member_id"];
        const whereValues_trans = [tenant_id,branch_id,memb.sb_acc_no,trans_dt,memb.member_balance,shg_id,memb.member_id];
        const flag_trans = 1;
        const result_trans_memb = await saveRecord(table_trans, columns_trans, values_trans, whereColumns_trans, whereValues_trans, flag_trans);

        if (result_trans_memb.suc === 0) {
          return res.send({
            success: true,
            msg: result_trans_memb.msg,
            member_id: memb.member_id
          });
        }

        const table_trans4 = "bdccb.td_sb";
        const columns_trans4 = ["balance", "modified_by", "modified_at","modified_ip"];
        const values_trans4 = [final_mem_balance,approved_by,datetime,approved_ip];
        const whereColumns_trans4 = ["tenant_id","shg_id","branch_id","acc_no","member_id"];
        const whereValues_trans4 = [tenant_id,shg_id,branch_id,memb.sb_acc_no,memb.member_id];
        const flag_trans4 = 1;
        const result_trans_memb4 = await saveRecord(table_trans4, columns_trans4, values_trans4, whereColumns_trans4, whereValues_trans4, flag_trans4);

        if (result_trans_memb4.suc === 0) {
          return res.send({
            success: true,
            msg: result_trans_memb.msg,
            member_id: memb.member_id
          });
        }
      }
    }
    // } else {
    //   const table_trans2 = "bdccb.td_deposit_trans";
    //   const columns_trans2 = ["approval_flag","approved_by","approved_at"];
    //   const values_trans2 = ['A',approved_by,datetime];
    //   const whereColumns_trans2 = ["tenant_id","branch_id","acc_no","trans_dt","shg_id"];
    //   const whereValues_trans2 = [tenant_id,branch_id,grp_acc_no,trans_dt,shg_id];
    //   const flag_trans2 = 1;
    //   const result_trans_app2 = await saveRecord(table_trans2, columns_trans2, values_trans2, whereColumns_trans2, whereValues_trans2, flag_trans2);

    //   if (result_trans_app2.suc === 0) {
    //     return res.send({
    //       success: true,
    //       msg: result_trans_app2.msg
    //     });
    //   }

    //   const table_trans3 = "bdccb.td_deposit";
    //   const columns_trans3 = ["balance","modified_by","modified_at","modified_ip"];
    //   const values_trans3 = [balance,approved_by,datetime,approved_ip];
    //   const whereColumns_trans3 = ["tenant_id","shg_id","branch_id","acc_no"];
    //   const whereValues_trans3 = [tenant_id,shg_id,branch_id,grp_acc_no];
    //   const flag_trans3 = 1;
    //   const result_trans_app3 = await saveRecord(table_trans3, columns_trans3, values_trans3, whereColumns_trans3, whereValues_trans3, flag_trans3);

    //   if (result_trans_app3.suc === 0) {
    //     return res.send({
    //       success: true,
    //       msg: result_trans_app3.msg
    //     });
    //   }
    // }
    return res.send({
      success: true,
      msg: "Transaction approved successfully"
    });

  } catch (error) {
    console.log("Error while approved transaction:", error);

    return res.send({
      success: false,
      msg: "Internal server error",
      errorCode: "SERVER_ERROR"
    });
  }
});

// REJECT TRANSACTION BEFORE APPROVE
sbRouter.post("/reject_sb_transaction", async (req, res) => {
  try{
  const {flag,tenant_id,branch_id,shg_id,grp_acc_no,dep_with_flag,trans_dt,members,modified_by,modified_ip} = req.body;

  let datetime = new Date().toISOString().slice(0, 19).replace('T', ' ');

  // DELETE GROUP TRANSACTION
 
  // td_deposit_trans
    await deleteRecord("bdccb.td_deposit_trans",["tenant_id","branch_id","shg_id","acc_no","trans_dt","approval_flag"],
      [tenant_id,branch_id,shg_id,grp_acc_no,trans_dt,'U']
    );

  // FETCH LAST APPROVED GROUP BALANCE
   let grpData = await db_Select(
      "balance",
      "bdccb.td_deposit_trans",
      `tenant_id = '${tenant_id}'
      AND branch_id = '${branch_id}'
      AND shg_id = '${shg_id}'
      AND acc_no = '${grp_acc_no}'
      AND approval_flag = 'A'`,
      "trans_dt DESC",
      1
    );

    let grp_balance = 0;

    if (grpData.suc > 0 && grpData.msg.length > 0) {
      grp_balance = grpData.msg[0].balance;
    }

    // UPDATE GROUP MAIN TABLE

      await saveRecord("bdccb.td_deposit",
      ["balance","modified_by","modified_at","modified_ip"],
      [grp_balance,modified_by,datetime,modified_ip],
      ["tenant_id","branch_id","shg_id","acc_no"],
      [tenant_id,branch_id,shg_id,grp_acc_no],
      1
    );

  // MEMBER PROCESS
   if (members && members.length > 0) {
     for (let m of members) {

       // DELETE MEMBER UNAPPROVED TRANS
        await deleteRecord("bdccb.td_sb_trans",["tenant_id","branch_id","acc_no","trans_dt","shg_id","member_id", "approval_flag"],
          [tenant_id,branch_id,m.sb_acc_no,trans_dt,shg_id,m.member_id,'U']
        );

         // FETCH LAST APPROVED MEMBER BALANCE

         let memData = await db_Select(
          "balance",
          "bdccb.td_sb_trans",
          `tenant_id = '${tenant_id}'
          AND branch_id = '${branch_id}'
          AND acc_no = '${m.sb_acc_no}'
          AND shg_id = '${shg_id}'
          AND member_id = '${m.member_id}'
          AND approval_flag = 'A'`,
          "trans_dt DESC",
          1
        );

        let member_balance = 0;

        if (memData.suc > 0 && memData.msg.length > 0) {
          member_balance = memData.msg[0].balance;
        }

         // UPDATE MEMBER MAIN TABLE
           await saveRecord(
          "bdccb.td_sb",
          ["balance"],
          [member_balance],
          ["tenant_id","branch_id","acc_no","shg_id","member_id","modified_by","modified_at","modified_id"],
          [tenant_id,branch_id,m.sb_acc_no,shg_id,m.member_id,modified_by,datetime,modified_ip],
          1
        );
     }
   }

    return res.send({
      success: true,
      msg: "Transaction Rejected Successfully"
    });

  }catch (error) {
    console.log("Error while reject transaction:", error);
    return res.send({
      success: false,
      msg: "Internal server error",
      errorCode: "SERVER_ERROR"
    });
  }
});

module.exports = { sbRouter }