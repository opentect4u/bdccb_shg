const { db_Select, saveRecord } = require('../../model/pgcommon');
const express = require('express'),
webDashboardRouter = express.Router();

// FETCH TOTAL DIRECT/INDECT GROUP AND ALSO WITH LOAN AND WITHOUT LOAN
// webDashboardRouter.post("/fetch_ccb_web_dashboardgroup_data", async (req, res) => {
//     try{
//     const {user_type,branch_code} = req.body;

//     let data = {};

//     if (user_type === 'B') {
//     // DIRECT GROUP    
//     var select = "COUNT(*) AS direct_count",
//     table_name = "bdccb.md_group",
//     whr = `branch_code = '${branch_code}' AND open_close_flag = 'O' AND delete_flag = 'N' AND direct_indirect_flag = 'D'`,
//     order = null;
//     var fetch_direct_grp_data = await db_Select(select,table_name,whr,order);

//     //INDIRECT GROUP
//     var select1 = "COUNT(*) AS indirect_count",
//     table_name1 = "bdccb.md_group",
//     whr1 = `branch_code = '${branch_code}' AND open_close_flag = 'O' AND delete_flag = 'N' AND direct_indirect_flag = 'I'`,
//     order1 = null;
//     var fetch_indirect_grp_data = await db_Select(select1,table_name1,whr1,order1);

//     // fetch group count with loan
//     var select2 = "COUNT(DISTINCT group_code) AS with_loan",
//     table_name2 = "bdccb.td_loan",
//     whr2 = `branch_id = '${branch_code}' AND (curr_prn + curr_intt) > 0`,
//     order2 = null;
//     var fetch_with_loan_grp_data = await db_Select(select2,table_name2,whr2,order2);

//     // fetch group count without loan
//     var select3 = "COUNT(*) AS without_loan",
//     table_name3 = "bdccb.md_group",
//     whr3 = `branch_code = '${branch_code}' AND open_close_flag = 'O' AND delete_flag = 'N' AND group_code NOT IN (
//            SELECT group_code FROM bdccb.td_loan 
//            WHERE branch_id = '${branch_code}'
//          )`,
//     order3 = null;
//     var fetch_without_loan_grp_data = await db_Select(select3,table_name3,whr3,order3);

//     data = {
//         direct_group: fetch_direct_grp_data.msg && fetch_direct_grp_data.msg > 0 ? fetch_direct_grp_data.msg[0].direct_count : 0,
//         indirect_group: fetch_indirect_grp_data.msg && fetch_indirect_grp_data.msg.length > 0 ? fetch_indirect_grp_data.msg[0].indirect_count : 0,
//         with_loan: fetch_with_loan_grp_data.msg && fetch_with_loan_grp_data.msg.length > 0 ? fetch_with_loan_grp_data.msg[0].with_loan : 0,
//         without_loan: fetch_without_loan_grp_data.msg && fetch_without_loan_grp_data.msg.length > 0 ? fetch_without_loan_grp_data.msg[0].without_loan : 0,
//       };
//     }else{
//         // fetch group count with loan
//         var select2 = "COUNT(DISTINCT group_code) AS with_loan",
//         table_name2 = "bdccb.td_loan",
//         whr2 = `branch_shg_id = '${branch_code}' AND (curr_prn + curr_intt) > 0`,
//         order2 = null;
//         var fetch_with_loan_grp_data = await db_Select(select2,table_name2,whr2,order2);

//         // fetch group count without loan
//         var select2 = "COUNT(*) AS without_loan",
//         table_name2 = "bdccb.md_group",
//         whr2 = `branch_code = '${branch_code}' AND group_code NOT IN (
//            SELECT group_code FROM bdccb.td_loan 
//            WHERE branch_shg_id = '${branch_code}'
//          )`,
//         order2 = null;
//         var fetch_without_loan_grp_data = await db_Select(select2,table_name2,whr2,order2);

//         data = {
//         with_loan: fetch_with_loan_grp_data.msg && fetch_with_loan_grp_data.msg.length > 0 ? fetch_with_loan_grp_data.msg[0].with_loan : 0,
//         without_loan: fetch_without_loan_grp_data.msg && fetch_without_loan_grp_data.msg.length > 0 ? fetch_without_loan_grp_data.msg[0].without_loan : 0,
//       };
//      }  

//      return res.send({
//       success: true,
//       msg: "Group data fetched successfully",
//       data: {
//         direct_group: fetch_direct_grp_data.msg && fetch_direct_grp_data.msg.length > 0 ? fetch_direct_grp_data.msg[0].direct_count : 0,
//         indirect_group: fetch_indirect_grp_data.msg && fetch_indirect_grp_data.msg.length > 0 ? fetch_indirect_grp_data.msg[0].indirect_count : 0
//       }
//     });
//     }catch(error){
//      console.error("Error in while fetch total direct indirect group details:", error);
//      return res.send({
//      success: false,
//      msg: "Internal server error",
//      errorCode: "SERVER_ERROR"
//      });
//     }
// });


webDashboardRouter.post("/fetch_ccb_web_dashboardgroup_data", async (req, res) => {
  try {
    const { user_type, branch_code } = req.body;

    let data = {};

    if (user_type === 'B') {

      const fetch_direct_grp_data = await db_Select(
        "COUNT(*) AS direct_count",
        "bdccb.md_group",
        `branch_code = '${branch_code}' 
         AND open_close_flag = 'O' 
         AND delete_flag = 'N' 
         AND direct_indirect_flag = 'D'`
      );

      const fetch_indirect_grp_data = await db_Select(
        "COUNT(*) AS indirect_count",
        "bdccb.md_group",
        `branch_code = '${branch_code}' 
         AND open_close_flag = 'O' 
         AND delete_flag = 'N' 
         AND direct_indirect_flag = 'I'`
      );

      const fetch_with_loan_grp_data = await db_Select(
        "COUNT(DISTINCT group_code) AS with_loan",
        "bdccb.td_loan",
        `branch_id = '${branch_code}' 
         AND (curr_prn + curr_intt) > 0`
      );

      const fetch_without_loan_grp_data = await db_Select(
        "COUNT(DISTINCT group_code) AS without_loan",
        "bdccb.td_loan",
        `branch_id = '${branch_code}' 
         AND (curr_prn + curr_intt) = 0`
      );

      data = {
        direct_group: (fetch_direct_grp_data.msg && fetch_direct_grp_data.msg.length > 0)
          ? fetch_direct_grp_data.msg[0].direct_count
          : 0,

        indirect_group: (fetch_indirect_grp_data.msg && fetch_indirect_grp_data.msg.length > 0)
          ? fetch_indirect_grp_data.msg[0].indirect_count
          : 0,

        with_loan: (fetch_with_loan_grp_data.msg && fetch_with_loan_grp_data.msg.length > 0)
          ? fetch_with_loan_grp_data.msg[0].with_loan
          : 0,

        without_loan: (fetch_without_loan_grp_data.msg && fetch_without_loan_grp_data.msg.length > 0)
          ? fetch_without_loan_grp_data.msg[0].without_loan
          : 0
      };

    } else {

      const fetch_with_loan_grp_data = await db_Select(
        "COUNT(DISTINCT group_code) AS with_loan",
        "bdccb.td_loan",
        `branch_shg_id = '${branch_code}' 
         AND (curr_prn + curr_intt) > 0`
      );

      const fetch_without_loan_grp_data = await db_Select(
        "COUNT(DISTINCT group_code) AS without_loan",
        "bdccb.td_loan",
        `branch_shg_id = '${branch_code}' 
         AND (curr_prn + curr_intt) = 0`
      );

      data = {
        with_loan: (fetch_with_loan_grp_data.msg && fetch_with_loan_grp_data.msg.length > 0)
          ? fetch_with_loan_grp_data.msg[0].with_loan
          : 0,

        without_loan: (fetch_without_loan_grp_data.msg && fetch_without_loan_grp_data.msg.length > 0)
          ? fetch_without_loan_grp_data.msg[0].without_loan
          : 0
      };
    }

    // ✅ FINAL RETURN (FIXED)
    return res.send({
      success: true,
      msg: "Group data fetched successfully",
      data: data
    });

  } catch (error) {
    console.error("Error in while fetch total direct indirect group details:", error);
    return res.send({
      success: false,
      msg: "Internal server error",
      errorCode: "SERVER_ERROR"
    });
  }
});

// TOTAL LOAN OUTSTANDING
webDashboardRouter.post("/tot_loan_outstanding", async (req, res) => {
    try{
    const {branch_code,user_type} = req.body;

    if(user_type == 'B'){
    var select = "COALESCE(SUM(curr_prn + curr_intt),0) AS total_outstanding",
    table_name = "bdccb.td_loan",
    whr = `branch_id = '${branch_code}'`,
    order = null;
    }else {
    var select = "COALESCE(SUM(curr_prn + curr_intt),0) AS total_outstanding",
    table_name = "bdccb.td_loan",
    whr = `branch_shg_id = '${branch_code}'`,
    order = null;
    }
    var fetch_loan_outstanding = await db_Select(select,table_name,whr,order);
    return res.send({
      success: true,
      msg: "Total loan outstanding fetched successfully",
      data: {
        total_outstanding: (fetch_loan_outstanding.msg && fetch_loan_outstanding.msg.length > 0)
          ? Number(fetch_loan_outstanding.msg[0].total_outstanding)
          : 0
      }
    });
    }catch (error) {
    console.error("Error in while fetch total loan outstanding:", error);
    return res.send({
      success: false,
      msg: "Internal server error",
      errorCode: "SERVER_ERROR"
    });
    }
});

// TOTAL LOAN DISBURSED SHG/SOCIETY
webDashboardRouter.post("/tot_loan_disb", async (req, res) => {
    try{
    const {flag,user_type,branch_code} = req.body;

    const today = new Date();

    // yyyy-mm-dd
    const current_date = today.toISOString().split('T')[0];

    // first day of month
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      .toISOString()
      .split('T')[0];

    let dateCondition = "";

    if (flag === 'Today') {
      dateCondition = `b.trans_dt = '${current_date}'`;
    } else {
      dateCondition = `b.trans_dt BETWEEN '${startOfMonth}' AND '${current_date}'`;
    }

    let branchCondition = "";

     if (user_type === 'B') {
      branchCondition = `a.branch_id = '${branch_code}'`;
    } else {
      branchCondition = `a.branch_shg_id = '${branch_code}'`;
    }

    let data = {};

    // ✅ Society (Indirect)
    const fetch_indirect = await db_Select(
      "COALESCE(SUM(b.dr_amt),0) AS indirect_disb",
      "bdccb.td_loan a JOIN bdccb.td_loan_transactions b ON a.loan_id = b.loan_id JOIN bdccb.md_group g ON a.group_code = g.group_code",
      `${branchCondition} 
       AND b.trans_type = 'D'
       AND ${dateCondition}
       AND g.direct_indirect_flag = 'I'`
    );

    // const fetch_indirect_grp = await db_Select(
    //   "COUNT(DISTINCT a.group_code) AS indirect_grp",
    //   "bdccb.td_loan a JOIN bdccb.td_loan_transactions b ON a.loan_id = b.loan_id JOIN bdccb.md_group g ON a.group_code = g.group_code",
    //   `${branchCondition} 
    //    AND b.trans_type = 'D'
    //    AND ${dateCondition}
    //    AND g.direct_indirect_flag = 'I'`
    // );

      if (user_type === 'B') {
         const fetch_direct = await db_Select(
        "COALESCE(SUM(b.dr_amt),0) AS direct_disb",
        "bdccb.td_loan a JOIN bdccb.td_loan_transactions b ON a.loan_id = b.loan_id JOIN bdccb.md_group g ON a.group_code = g.group_code",
        `${branchCondition} 
         AND b.trans_type = 'D'
         AND ${dateCondition}
         AND g.direct_indirect_flag = 'D'`
      );

    //   const fetch_direct_grp = await db_Select(
    //     "COUNT(DISTINCT a.group_code) AS direct_grp",
    //     "bdccb.td_loan a JOIN bdccb.td_loan_transactions b ON a.loan_id = b.loan_id JOIN bdccb.md_group g ON a.group_code = g.group_code",
    //     `${branchCondition} 
    //      AND b.trans_type = 'D'
    //      AND ${dateCondition}
    //      AND g.direct_indirect_flag = 'D'`
    //   );

      data = {
        shg_disbursed: fetch_direct.msg[0].direct_disb || 0,
        society_disbursed: fetch_indirect.msg[0].indirect_disb || 0,
        // shg_group_count: fetch_direct_grp.msg?.[0]?.direct_grp || 0,
        // society_group_count: fetch_indirect_grp.msg?.[0]?.indirect_grp || 0
      };
      }else{
      // ✅ Only Society for 'P'
      data = {
        society_disbursed: fetch_indirect.msg[0].indirect_disb || 0,
        // society_group_count: fetch_indirect_grp.msg?.[0]?.indirect_grp || 0
      };
      }

      return res.send({
      success: true,
      msg: "Loan disbursement fetched successfully",
      data: data
    });
    }catch (error) {
    console.error("Error in while fetch total loan disbursement:", error);
    return res.send({
      success: false,
      msg: "Internal server error",
      errorCode: "SERVER_ERROR"
    });
    }
});

// FETCH UNAPPROVED TRANSACTION BRANCH AND SOCIETY
webDashboardRouter.post("/dashboard_tot_loan_unapprove_dtls", async (req, res) => {
    try {
    const {user_type, branch_code} = req.body;

     let tot_loan_unapprove;

    //total loan unapprove details today
    if(user_type == 'B'){
    var select = "COALESCE(SUM(dr_amt),0) + COALESCE(SUM(cr_amt),0) AS tot_unapprove_loan",
    table_name = "bdccb.td_loan_transactions",
    whr = `branch_shg_id = '111' AND approval_status = 'U' AND trans_type IN('D','R')`,
    order = null;
    }else{
    var select = "COALESCE(SUM(dr_amt),0) + COALESCE(SUM(cr_amt),0) AS tot_unapprove_loan",
    table_name = "bdccb.td_loan_transactions",
    whr = `branch_shg_id = '${branch_code}' AND approval_status = 'U' AND trans_type IN('D','R')`,
    order = null;
    }
    tot_loan_unapprove = await db_Select(select,table_name,whr,order);

    return res.send({
      success: true,
      msg: "Unapproved loan details fetched successfully",
      data: {
        total_unapproved_amount: tot_loan_unapprove.msg[0].tot_unapprove_loan || 0,
      }
    });
    }catch (error) {
    console.error("Error in while fetch total unapproved loan", error);
    return res.send({
      success: false,
      msg: "Internal server error",
      errorCode: "SERVER_ERROR"
    });
    }
});

// LOAN COLLECTED
// webDashboardRouter,post("/tot_loan_collected", async (req, res) => {
//     try{
//     const {} = req.body;

//     const today = new Date();

//     // yyyy-mm-dd
//     const current_date = today.toISOString().split('T')[0];

//     // first day of month
//     const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
//       .toISOString()
//       .split('T')[0];

//         let collected_today = await db_Select(
//       "COALESCE(SUM(cr_amt),0) AS total",
//       "bdccb.td_loan_transactions",
//       `branch_id = '${branch_code}'
//        AND trans_type = 'R'
//        AND approval_status = 'A'
//        AND DATE(trans_dt) = ${today}`
//     );

//       let collected_month = await db_Select(
//       "COALESCE(SUM(cr_amt),0) AS total",
//       "bdccb.td_loan_transactions",
//       `branch_id = '${branch_code}'
//        AND trans_type = 'R'
//        AND approval_status = 'A'
//        AND DATE(trans_dt) BETWEEN ${month_start} AND ${today}`
//     );

//     }catch (error) {
//     console.error("Error in while fetch total loan collected", error);
//     return res.send({
//       success: false,
//       msg: "Internal server error",
//       errorCode: "SERVER_ERROR"
//     });
//     }
// })
module.exports = {webDashboardRouter}