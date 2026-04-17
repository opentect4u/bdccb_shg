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
    const { user_type, branch_code, pacs_id } = req.body;

    let data = {};

    if (user_type === 'B') {

      const fetch_direct_grp_data = await db_Select(
        "COUNT(*) AS direct_count",
        "bdccb.md_group",
        `branch_code = '${branch_code}' 
         AND open_close_flag = 'O' 
         AND delete_flag = 'N' 
         AND pacs_id = '111'`
      );

      // const pacsData = await db_Select("pacs_id","public.md_branch",`branch_id = '${branch_id}'`);

      // const pacs_ids = pacsData.suc > 0 ? pacsData.msg.map(item => item.pacs_id) : [];

      // const fetch_indirect_grp_data = await db_Select(
      //   "COUNT(*) AS indirect_count",
      //   "bdccb.md_group",
      //   `branch_code = '${branch_code}' 
      //    AND open_close_flag = 'O' 
      //    AND delete_flag = 'N' 
      //    AND pacs_id IN (${pacs_ids.map(id => `'${id}'`).join(",")})`
      // );

      // const fetch_indirect_grp_data = await db_Select(
      // "COUNT(*) AS indirect_count",
      // `bdccb.md_group g 
      // JOIN public.md_branch b ON g.pacs_id = b.branch_id`,
      // `g.branch_code = '${branch_code}'
      // AND g.open_close_flag = 'O'
      // AND g.delete_flag = 'N'
      // AND g.pacs_id != '111'`
      // );

      const fetch_indirect_grp_data = await db_Select(
      "COUNT(*) AS indirect_count",
      `bdccb.md_group g`,
      `g.branch_code = '${branch_code}'
      AND g.open_close_flag = 'O'
      AND g.delete_flag = 'N'
      AND g.pacs_id != '111'`
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

    } else if (user_type === 'P') {

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
    }else{

      const branchTypeRes = await db_Select(
      "branch_type",
      "public.md_branch",
      `branch_id = '${branch_code}'`
      );

       const branch_type = branchTypeRes.msg[0].branch_type;

       if(branch_type === 'B'){
       const fetch_direct_grp_data = await db_Select(
        "COUNT(*) AS direct_count",
        "bdccb.md_group",
        `branch_code = '${branch_code}' 
         AND open_close_flag = 'O' 
         AND delete_flag = 'N' 
         AND pacs_id = '111'`
      );

      const fetch_indirect_grp_data = await db_Select(
      "COUNT(*) AS indirect_count",
      `bdccb.md_group g`,
      `g.branch_code = '${branch_code}'
      AND g.open_close_flag = 'O'
      AND g.delete_flag = 'N'
      AND g.pacs_id != '111'`
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
    }else{
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
    }else if (user_type == 'P') {
    var select = "COALESCE(SUM(curr_prn + curr_intt),0) AS total_outstanding",
    table_name = "bdccb.td_loan",
    whr = `branch_shg_id = '${branch_code}'`,
    order = null;
    }else{
      const branchTypeRes = await db_Select(
      "branch_type",
      "public.md_branch",
      `branch_id = '${branch_code}'`
      );
       const branch_type = branchTypeRes.msg[0].branch_type;

      if(branch_type == 'B'){
    var select = "COALESCE(SUM(curr_prn + curr_intt),0) AS total_outstanding",
    table_name = "bdccb.td_loan",
    whr = `branch_id = '${branch_code}'`,
    order = null;
    }else{
      var select = "COALESCE(SUM(curr_prn + curr_intt),0) AS total_outstanding",
    table_name = "bdccb.td_loan",
    whr = `branch_shg_id = '${branch_code}'`,
    order = null;
    }
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
// webDashboardRouter.post("/tot_loan_disb", async (req, res) => {
//     try{
//     const {flag,user_type,branch_code} = req.body;

//     const today = new Date();

//     // yyyy-mm-dd
//     const current_date = today.toISOString().split('T')[0];

//     // first day of month
//     const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
//       .toISOString()
//       .split('T')[0];

//     let dateCondition = "";

//     if (flag === 'Today') {
//       dateCondition = `b.trans_dt = '${current_date}'`;
//     } else {
//       dateCondition = `b.trans_dt BETWEEN '${startOfMonth}' AND '${current_date}'`;
//     }

//     let branchCondition = "";

//      if (user_type === 'B') {
//       branchCondition = `a.branch_id = '${branch_code}'`;
//     } else {
//       branchCondition = `a.branch_shg_id = '${branch_code}'`;
//     }

//     let data = {};

//     // ✅ Society (Indirect)
//     const fetch_indirect = await db_Select(
//       "COALESCE(SUM(b.dr_amt),0) AS indirect_disb",
//       "bdccb.td_loan a JOIN bdccb.td_loan_transactions b ON a.loan_id = b.loan_id",
//       `${branchCondition} 
//        AND b.trans_type = 'D'
//        AND ${dateCondition}
//        AND b.approval_status = 'A'`
//     );

//     // const fetch_indirect_grp = await db_Select(
//     //   "COUNT(DISTINCT a.group_code) AS indirect_grp",
//     //   "bdccb.td_loan a JOIN bdccb.td_loan_transactions b ON a.loan_id = b.loan_id JOIN bdccb.md_group g ON a.group_code = g.group_code",
//     //   `${branchCondition} 
//     //    AND b.trans_type = 'D'
//     //    AND ${dateCondition}
//     //    AND g.direct_indirect_flag = 'I'`
//     // );

//       if (user_type === 'B') {
//          const fetch_direct = await db_Select(
//         "COALESCE(SUM(b.dr_amt),0) AS direct_disb",
//         "bdccb.td_loan a JOIN bdccb.td_loan_transactions b ON a.loan_id = b.loan_id",
//         `${branchCondition} 
//          AND b.trans_type = 'D'
//          AND ${dateCondition}
//          AND b.approval_status = 'A'`
//       );

//     //   const fetch_direct_grp = await db_Select(
//     //     "COUNT(DISTINCT a.group_code) AS direct_grp",
//     //     "bdccb.td_loan a JOIN bdccb.td_loan_transactions b ON a.loan_id = b.loan_id JOIN bdccb.md_group g ON a.group_code = g.group_code",
//     //     `${branchCondition} 
//     //      AND b.trans_type = 'D'
//     //      AND ${dateCondition}
//     //      AND g.direct_indirect_flag = 'D'`
//     //   );

//       data = {
//         shg_disbursed: fetch_direct.msg[0].direct_disb || 0,
//         society_disbursed: fetch_indirect.msg[0].indirect_disb || 0,
//         // shg_group_count: fetch_direct_grp.msg?.[0]?.direct_grp || 0,
//         // society_group_count: fetch_indirect_grp.msg?.[0]?.indirect_grp || 0
//       };
//       }else{
//       // ✅ Only Society for 'P'
//       data = {
//         society_disbursed: fetch_indirect.msg[0].indirect_disb || 0,
//         // society_group_count: fetch_indirect_grp.msg?.[0]?.indirect_grp || 0
//       };
//       }

//       return res.send({
//       success: true,
//       msg: "Loan disbursement fetched successfully",
//       data: data
//     });
//     }catch (error) {
//     console.error("Error in while fetch total loan disbursement:", error);
//     return res.send({
//       success: false,
//       msg: "Internal server error",
//       errorCode: "SERVER_ERROR"
//     });
//     }
// });

webDashboardRouter.post("/tot_loan_disb", async (req, res) => {
  try {
    const { flag, user_type, branch_code } = req.body;

    const today = new Date();

    const current_date = today.toISOString().split("T")[0];

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      .toISOString()
      .split("T")[0];

    let dateCondition = "";

    if (flag === "Today") {
      dateCondition = `b.trans_dt = '${current_date}'`;
    } else {
      dateCondition = `b.trans_dt BETWEEN '${startOfMonth}' AND '${current_date}'`;
    }

    let data = {};

    if (user_type === "B") {

      const shgList = await db_Select(
     "branch_id AS branch_shg_id",
     "public.md_branch",
     `branch_jurisdiction_id = '${branch_code}'`
);
      const shgIds = shgList.msg.map(e => `'${e.branch_shg_id}'`).join(",");
      // SINGLE QUERY FOR BOTH DIRECT + INDIRECT
      const result = await db_Select(
  `
  COALESCE(SUM(CASE 
    WHEN a.branch_id = '${branch_code}' THEN b.dr_amt 
    ELSE 0 END),0) AS shg_disbursed,

  COALESCE(SUM(CASE 
    WHEN a.branch_shg_id IN (${shgIds}) THEN b.dr_amt 
    ELSE 0 END),0) AS society_disbursed
  `,
  "bdccb.td_loan a JOIN bdccb.td_loan_transactions b ON a.loan_id = b.loan_id",
  `
  b.trans_type = 'D'
  AND ${dateCondition}
  AND b.approval_status = 'A'
  `
);

      data = {
        shg_disbursed: result.msg[0].shg_disbursed || 0,
        society_disbursed: result.msg[0].society_disbursed || 0
      };

    } else if (user_type == 'P') {
      // ✅ ONLY SOCIETY FOR P LOGIN
      const result = await db_Select(
        "COALESCE(SUM(b.dr_amt),0) AS society_disbursed",
        "bdccb.td_loan a JOIN bdccb.td_loan_transactions b ON a.loan_id = b.loan_id",
        `
        a.branch_shg_id = '${branch_code}'
        AND b.trans_type = 'D'
        AND ${dateCondition}
        AND b.approval_status = 'A'
        `
      );

      data = {
        society_disbursed: result.msg[0].society_disbursed || 0
      };
    }else{
      const branchTypeRes = await db_Select(
      "branch_type",
      "public.md_branch",
      `branch_id = '${branch_code}'`
      );
       const branch_type = branchTypeRes.msg[0].branch_type;

       if(branch_type == 'B'){
         const shgList = await db_Select(
     "branch_id AS branch_shg_id",
     "public.md_branch",
     `branch_jurisdiction_id = '${branch_code}'`
);
      const shgIds = shgList.msg.map(e => `'${e.branch_shg_id}'`).join(",");
      // SINGLE QUERY FOR BOTH DIRECT + INDIRECT
      const result = await db_Select(
  `
  COALESCE(SUM(CASE 
    WHEN a.branch_id = '${branch_code}' THEN b.dr_amt 
    ELSE 0 END),0) AS shg_disbursed,

  COALESCE(SUM(CASE 
    WHEN a.branch_shg_id IN (${shgIds}) THEN b.dr_amt 
    ELSE 0 END),0) AS society_disbursed
  `,
  "bdccb.td_loan a JOIN bdccb.td_loan_transactions b ON a.loan_id = b.loan_id",
  `
  b.trans_type = 'D'
  AND ${dateCondition}
  AND b.approval_status = 'A'
  `
);

      data = {
        shg_disbursed: result.msg[0].shg_disbursed || 0,
        society_disbursed: result.msg[0].society_disbursed || 0
      };
       }else{
        const result = await db_Select(
        "COALESCE(SUM(b.dr_amt),0) AS society_disbursed",
        "bdccb.td_loan a JOIN bdccb.td_loan_transactions b ON a.loan_id = b.loan_id",
        `
        a.branch_shg_id = '${branch_code}'
        AND b.trans_type = 'D'
        AND ${dateCondition}
        AND b.approval_status = 'A'
        `
      );

      data = {
        society_disbursed: result.msg[0].society_disbursed || 0
      };
       }
    }

    return res.send({
      success: true,
      msg: "Loan disbursement fetched successfully",
      data: data
    });

  } catch (error) {
    console.error("Error in total loan disbursement:", error);
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
    var select = "COALESCE(SUM(b.dr_amt),0) + COALESCE(SUM(b.cr_amt),0) AS tot_unapprove_loan",
    table_name = "bdccb.td_loan a LEFT JOIN bdccb.td_loan_transactions b ON a.loan_id = b.loan_id",
    whr = `a.branch_id = '${branch_code}' AND b.approval_status = 'U' AND b.trans_type IN('D','R')`,
    order = null;

    // TOT_GRP_UNAPPROVE
    var select1 = "COUNT(DISTINCT a.group_code)tot_unapprove_grp",
    table_name1 = "bdccb.td_loan a LEFT JOIN bdccb.td_loan_transactions b ON a.loan_id = b.loan_id",
    whr1 = `a.branch_id = '${branch_code}' AND b.approval_status = 'U' AND b.trans_type IN('D','R')`,
    order1 = null;
    }else if (user_type == 'P'){
    var select = "COALESCE(SUM(dr_amt),0) + COALESCE(SUM(cr_amt),0) AS tot_unapprove_loan",
    table_name = "bdccb.td_loan_transactions",
    whr = `branch_shg_id = '${branch_code}' AND approval_status = 'U' AND trans_type IN('D','R')`,
    order = null;

    var select1 = "COUNT(DISTINCT a.group_code)tot_unapprove_grp",
    table_name1 = "bdccb.td_loan a LEFT JOIN bdccb.td_loan_transactions b ON a.loan_id = b.loan_id",
    whr1 = `a.branch_shg_id = '${branch_code}' AND b.approval_status = 'U' AND b.trans_type IN('D','R')`,
    order1 = null;
    }else{
      const branchTypeRes = await db_Select(
      "branch_type",
      "public.md_branch",
      `branch_id = '${branch_code}'`
      );
       const branch_type = branchTypeRes.msg[0].branch_type;

       if(branch_type == 'B'){
         var select = "COALESCE(SUM(b.dr_amt),0) + COALESCE(SUM(b.cr_amt),0) AS tot_unapprove_loan",
    table_name = "bdccb.td_loan a LEFT JOIN bdccb.td_loan_transactions b ON a.loan_id = b.loan_id",
    whr = `a.branch_id = '${branch_code}' AND b.approval_status = 'U' AND b.trans_type IN('D','R')`,
    order = null;

    // TOT_GRP_UNAPPROVE
    var select1 = "COUNT(DISTINCT a.group_code)tot_unapprove_grp",
    table_name1 = "bdccb.td_loan a LEFT JOIN bdccb.td_loan_transactions b ON a.loan_id = b.loan_id",
    whr1 = `a.branch_id = '${branch_code}' AND b.approval_status = 'U' AND b.trans_type IN('D','R')`,
    order1 = null;
       }else{
        var select = "COALESCE(SUM(dr_amt),0) + COALESCE(SUM(cr_amt),0) AS tot_unapprove_loan",
    table_name = "bdccb.td_loan_transactions",
    whr = `branch_shg_id = '${branch_code}' AND approval_status = 'U' AND trans_type IN('D','R')`,
    order = null;

    var select1 = "COUNT(DISTINCT a.group_code)tot_unapprove_grp",
    table_name1 = "bdccb.td_loan a LEFT JOIN bdccb.td_loan_transactions b ON a.loan_id = b.loan_id",
    whr1 = `a.branch_shg_id = '${branch_code}' AND b.approval_status = 'U' AND b.trans_type IN('D','R')`,
    order1 = null;
       }
    }
    tot_loan_unapprove = await db_Select(select,table_name,whr,order);
    tot_grp_unapprove = await db_Select(select1,table_name1,whr1,order1);

    return res.send({
      success: true,
      msg: "Unapproved loan details fetched successfully",
      data: {
        total_unapproved_amount: tot_loan_unapprove.msg[0].tot_unapprove_loan || 0,
        total_unapproved_group: tot_grp_unapprove.msg[0].tot_unapprove_grp || 0,
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
webDashboardRouter.post("/tot_loan_collected", async (req, res) => {
    try{
    const {branch_code, flag, user_type} = req.body;

    const today = new Date();

    // yyyy-mm-dd
    const current_date = today.toISOString().split('T')[0];

    // first day of month
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      .toISOString()
      .split('T')[0];

     let collected_soc = 0;
     let collected_shg = 0;
     let collected_not_depo = 0; 
 
      if(user_type == 'B' && flag == 'Today'){
      collected_soc = await db_Select(
      "COALESCE(SUM(b.cr_amt),0) AS total_amt_soc",
      "bdccb.td_loan a LEFT JOIN bdccb.td_loan_transactions b ON a.loan_id = b.loan_id",
      `a.branch_id = '${branch_code}'
       AND b.trans_type = 'R'
       AND b.approval_status = 'A'
       AND DATE(b.trans_dt) = '${current_date}'`
       );

       collected = await db_Select(
      "COALESCE(SUM(cr_amt),0) AS total_amt",
      "bdccb.td_loan_member_trans",
      `branch_id = '${branch_code}'
       AND trans_type = 'R'
       AND approval_status = 'A'
       AND DATE(trans_date) = '${current_date}'`
       );

       collected_not_depo = await db_Select(
      "COALESCE(SUM(cr_amt),0) AS total_amt_nt_collec",
      "bdccb.td_loan_member_trans_temp",
      `branch_id = '${branch_code}'
       AND trans_type = 'R'
       AND approval_status = 'U'
       AND DATE(trans_date) = '${current_date}'`
       );

      collected_soc = collected_soc.msg[0].total_amt_soc;
      collected_shg = collected.msg[0].total_amt;
      collected_not_depo = collected_not_depo.msg[0].total_amt_nt_collec;
      
      }else if (user_type == 'B' && flag == 'Month'){
      collected_soc = await db_Select(
      "COALESCE(SUM(b.cr_amt),0) AS total_amt_soc",
      "bdccb.td_loan a LEFT JOIN bdccb.td_loan_transactions b ON a.loan_id = b.loan_id",
      `a.branch_id = '${branch_code}'
       AND b.trans_type = 'R'
       AND b.approval_status = 'A'
       AND DATE(b.trans_dt) BETWEEN '${startOfMonth}' AND '${current_date}'`
       );

      collected = await db_Select(
      "COALESCE(SUM(cr_amt),0) AS total_amt",
      "bdccb.td_loan_member_trans",
      `branch_id = '${branch_code}'
       AND trans_type = 'R'
       AND approval_status = 'A'
       AND DATE(trans_date) BETWEEN '${startOfMonth}' AND '${current_date}'`
       );

       collected_not_depo = await db_Select(
      "COALESCE(SUM(cr_amt),0) AS total_amt_nt_collec",
      "bdccb.td_loan_member_trans_temp",
      `branch_id = '${branch_code}'
       AND trans_type = 'R'
       AND approval_status = 'U'
       AND DATE(trans_date) BETWEEN '${startOfMonth}' AND '${current_date}'`
      );

      collected_soc = collected_soc.msg[0].total_amt_soc;
      collected_shg = collected.msg[0].total_amt;
      collected_not_depo = collected_not_depo.msg[0].total_amt_nt_collec;
      
      }else if (user_type == 'P' && flag == 'Today'){
      collected_soc = await db_Select(
      "COALESCE(SUM(cr_amt),0) AS total_amt_soc",
      "bdccb.td_loan_transactions",
      `branch_shg_id = '${branch_code}'
       AND trans_type = 'R'
       AND approval_status = 'A'
       AND DATE(trans_dt) =' ${current_date}'`
       );

        collected = await db_Select(
      "COALESCE(SUM(cr_amt),0) AS total_amt",
      "bdccb.td_loan_member_trans",
      `branch_shg_id = '${branch_code}'
       AND trans_type = 'R'
       AND approval_status = 'A'
       AND DATE(trans_date) = '${current_date}'`
       );

        collected_not_depo = await db_Select(
      "COALESCE(SUM(cr_amt),0) AS total_amt_nt_collec",
      "bdccb.td_loan_member_trans_temp",
      `branch_shg_id = '${branch_code}'
       AND trans_type = 'R'
       AND approval_status = 'U'
       AND DATE(trans_date) = '${current_date}'`
       );

      collected_soc = collected_soc.msg[0].total_amt_soc;
      collected_shg = collected.msg[0].total_amt;
      collected_not_depo = collected_not_depo.msg[0].total_amt_nt_collec;

      }else if (user_type == 'P' && flag == 'Month'){
        collected_soc = await db_Select(
      "COALESCE(SUM(cr_amt),0) AS total_amt_soc",
      "bdccb.td_loan_transactions",
      `branch_shg_id = '${branch_code}'
       AND trans_type = 'R'
       AND approval_status = 'A'
       AND DATE(trans_dt) BETWEEN '${startOfMonth}' AND '${current_date}'`
       );

        collected = await db_Select(
      "COALESCE(SUM(cr_amt),0) AS total_amt",
      "bdccb.td_loan_member_trans",
      `branch_shg_id = '${branch_code}'
       AND trans_type = 'R'
       AND approval_status = 'A'
       AND DATE(trans_date) BETWEEN '${startOfMonth}' AND '${current_date}'`
       );

        collected_not_depo = await db_Select(
      "COALESCE(SUM(cr_amt),0) AS total_amt_nt_collec",
      "bdccb.td_loan_member_trans_temp",
      `branch_shg_id = '${branch_code}'
       AND trans_type = 'R'
       AND approval_status = 'U'
       AND DATE(trans_date) BETWEEN '${startOfMonth}' AND '${current_date}'`
      );
      collected_soc = collected_soc.msg[0].total_amt_soc;
      collected_shg = collected.msg[0].total_amt;
      collected_not_depo = collected_not_depo.msg[0].total_amt_nt_collec;
      }else if (user_type == 'H') {
       const branchTypeRes = await db_Select(
      "branch_type",
      "public.md_branch",
      `branch_id = '${branch_code}'`
      );
       const branch_type = branchTypeRes.msg[0].branch_type;

      if(branch_type == 'B' && flag == 'Today'){
      collected_soc = await db_Select(
      "COALESCE(SUM(b.cr_amt),0) AS total_amt_soc",
      "bdccb.td_loan a LEFT JOIN bdccb.td_loan_transactions b ON a.loan_id = b.loan_id",
      `a.branch_id = '${branch_code}'
       AND b.trans_type = 'R'
       AND b.approval_status = 'A'
       AND DATE(b.trans_dt) = '${current_date}'`
       );

       collected = await db_Select(
      "COALESCE(SUM(cr_amt),0) AS total_amt",
      "bdccb.td_loan_member_trans",
      `branch_id = '${branch_code}'
       AND trans_type = 'R'
       AND approval_status = 'A'
       AND DATE(trans_date) = '${current_date}'`
       );

       collected_not_depo = await db_Select(
      "COALESCE(SUM(cr_amt),0) AS total_amt_nt_collec",
      "bdccb.td_loan_member_trans_temp",
      `branch_id = '${branch_code}'
       AND trans_type = 'R'
       AND approval_status = 'U'
       AND DATE(trans_date) = '${current_date}'`
       );

      collected_soc = collected_soc.msg[0].total_amt_soc;
      collected_shg = collected.msg[0].total_amt;
      collected_not_depo = collected_not_depo.msg[0].total_amt_nt_collec;
      
      }else if (branch_type == 'B' && flag == 'Month'){
      collected_soc = await db_Select(
      "COALESCE(SUM(b.cr_amt),0) AS total_amt_soc",
      "bdccb.td_loan a LEFT JOIN bdccb.td_loan_transactions b ON a.loan_id = b.loan_id",
      `a.branch_id = '${branch_code}'
       AND b.trans_type = 'R'
       AND b.approval_status = 'A'
       AND DATE(b.trans_dt) BETWEEN '${startOfMonth}' AND '${current_date}'`
       );

      collected = await db_Select(
      "COALESCE(SUM(cr_amt),0) AS total_amt",
      "bdccb.td_loan_member_trans",
      `branch_id = '${branch_code}'
       AND trans_type = 'R'
       AND approval_status = 'A'
       AND DATE(trans_date) BETWEEN '${startOfMonth}' AND '${current_date}'`
       );

       collected_not_depo = await db_Select(
      "COALESCE(SUM(cr_amt),0) AS total_amt_nt_collec",
      "bdccb.td_loan_member_trans_temp",
      `branch_id = '${branch_code}'
       AND trans_type = 'R'
       AND approval_status = 'U'
       AND DATE(trans_date) BETWEEN '${startOfMonth}' AND '${current_date}'`
      );

      collected_soc = collected_soc.msg[0].total_amt_soc;
      collected_shg = collected.msg[0].total_amt;
      collected_not_depo = collected_not_depo.msg[0].total_amt_nt_collec;
      
      }else if (branch_type == 'P' && flag == 'Today'){
      collected_soc = await db_Select(
      "COALESCE(SUM(cr_amt),0) AS total_amt_soc",
      "bdccb.td_loan_transactions",
      `branch_shg_id = '${branch_code}'
       AND trans_type = 'R'
       AND approval_status = 'A'
       AND DATE(trans_dt) =' ${current_date}'`
       );

        collected = await db_Select(
      "COALESCE(SUM(cr_amt),0) AS total_amt",
      "bdccb.td_loan_member_trans",
      `branch_shg_id = '${branch_code}'
       AND trans_type = 'R'
       AND approval_status = 'A'
       AND DATE(trans_date) = '${current_date}'`
       );

        collected_not_depo = await db_Select(
      "COALESCE(SUM(cr_amt),0) AS total_amt_nt_collec",
      "bdccb.td_loan_member_trans_temp",
      `branch_shg_id = '${branch_code}'
       AND trans_type = 'R'
       AND approval_status = 'U'
       AND DATE(trans_date) = '${current_date}'`
       );

      collected_soc = collected_soc.msg[0].total_amt_soc;
      collected_shg = collected.msg[0].total_amt;
      collected_not_depo = collected_not_depo.msg[0].total_amt_nt_collec;

      }else {
        collected_soc = await db_Select(
      "COALESCE(SUM(cr_amt),0) AS total_amt_soc",
      "bdccb.td_loan_transactions",
      `branch_shg_id = '${branch_code}'
       AND trans_type = 'R'
       AND approval_status = 'A'
       AND DATE(trans_dt) BETWEEN '${startOfMonth}' AND '${current_date}'`
       );

        collected = await db_Select(
      "COALESCE(SUM(cr_amt),0) AS total_amt",
      "bdccb.td_loan_member_trans",
      `branch_shg_id = '${branch_code}'
       AND trans_type = 'R'
       AND approval_status = 'A'
       AND DATE(trans_date) BETWEEN '${startOfMonth}' AND '${current_date}'`
       );

        collected_not_depo = await db_Select(
      "COALESCE(SUM(cr_amt),0) AS total_amt_nt_collec",
      "bdccb.td_loan_member_trans_temp",
      `branch_shg_id = '${branch_code}'
       AND trans_type = 'R'
       AND approval_status = 'U'
       AND DATE(trans_date) BETWEEN '${startOfMonth}' AND '${current_date}'`
      );
      collected_soc = collected_soc.msg[0].total_amt_soc;
      collected_shg = collected.msg[0].total_amt;
      collected_not_depo = collected_not_depo.msg[0].total_amt_nt_collec;
    }
  }
      
      const data = {
      deposited_ccb: "0",  
      deposited_soc: collected_soc,
      deposited_shg: collected_shg,
      collected_nt_deposit: collected_not_depo
      };

      return res.send({
      success: true,
      msg: "fetch loan_collected",
      data: data
      });
    }catch (error) {
    console.error("Error in while fetch total loan collected", error);
    return res.send({
      success: false,
      msg: "Internal server error",
      errorCode: "SERVER_ERROR"
    });
    }
});

// FETCH EMPLOYEE TYPE
webDashboardRouter.post("/fetch_emp_type", async (req, res) => {
  try{
  const {emp_id} = req.body;

   var select = "user_type",
   table_name = "bdccb.md_user",
   whr = `user_id = '${emp_id}'`,
   order = null;
   var fetch_emp_type = await db_Select(select, table_name, whr, order);

  if(fetch_emp_type.suc === 1 && fetch_emp_type.msg.length > 0){
     return res.send({
      success: true,
      msg: "Fetch employee Type",
      data: fetch_emp_type.msg
    });
  }else {
    return res.send({
      success: true,
      msg: "Failed to fetch employee type",
      data: []
      });
  } 

  }catch (error) {
    console.error("Error in while fetch employee type", error);
    return res.send({
      success: false,
      msg: "Internal server error",
      errorCode: "SERVER_ERROR"
    });
    }
})

// FETCH BRANCH AND SOCIETY NAME SUPERADMIN LEVEL
webDashboardRouter.get("/fetch_brn_soc_name", async (req, res) => {
  try{
  const {select_type} = req.query;
  
  if(select_type == 'B'){
  var select = "branch_type,branch_id,branch_name",
  table_name = "public.md_branch",
  whr = `branch_type IN ('B','H') AND branch_status = 'O'`,
  order = null;
  }else{
  var select = "branch_type,branch_id,branch_name",
  table_name = "public.md_branch",
  whr = `branch_type IN ('P') AND branch_status = 'O'`,
  order = null;
  }
  var fetch_brn_soc = await db_Select(select,table_name,whr,order);

  if(fetch_brn_soc.suc === 1 && fetch_brn_soc.msg.length > 0){
    return res.send({
      success: true,
      msg: "Branch and Pacs List",
      data: fetch_brn_soc.msg
    });
  }else {
    return res.send({
      success: true,
      msg: "Failed to fetch branch and society data",
      data: []
      });
  }
  }catch (error) {
    console.error("Error in while fetch branch and society name", error);
    return res.send({
      success: false,
      msg: "Internal server error",
      errorCode: "SERVER_ERROR"
    });
    }
});

// fetch superadmin data
webDashboardRouter.post("/fetch_ho_dashboard_group_data", async (req, res) => {
  try{
  const {branch_type} = req.body;

  if(branch_type === 'H'){
  const fetch_ho_grp_direct = await db_Select(
        "COUNT(*) AS direct_count",
        "bdccb.md_group",
        `branch_code IN (select branch_id from public.md_branch where branch_status = 'O' AND branch_type IN ('P', 'B')) 
         AND open_close_flag = 'O' 
         AND delete_flag = 'N' 
         AND pacs_id = '111'`
  );

  const fetch_ho_grp_indirect = await db_Select(
        "COUNT(*) AS indirect_count",
        "bdccb.md_group",
        `branch_code IN (select branch_id from public.md_branch where branch_status = 'O' AND branch_type IN ('P', 'B')) 
         AND open_close_flag = 'O' 
         AND delete_flag = 'N' 
         AND pacs_id != '111'`
  );

  const ho_fetch_with_loan_grp_data = await db_Select(
        "COUNT(DISTINCT group_code) AS with_loan",
        "bdccb.td_loan",
        `branch_id IN (select branch_id from public.md_branch where branch_status = 'O' AND branch_type IN ('P', 'B')) 
         AND (curr_prn + curr_intt) > 0`
      );

  const ho_fetch_without_loan_grp_data = await db_Select(
        "COUNT(DISTINCT group_code) AS without_loan",
        "bdccb.td_loan",
        `branch_id IN (select branch_id from public.md_branch where branch_status = 'O' AND branch_type IN ('P', 'B')) 
         AND (curr_prn + curr_intt) = 0`
  );    
  
  data = {
    direct_group: (fetch_ho_grp_direct.msg && fetch_ho_grp_direct.msg.length > 0)
          ? fetch_ho_grp_direct.msg[0].direct_count
          : 0,

        indirect_group: (fetch_ho_grp_indirect.msg && fetch_ho_grp_indirect.msg.length > 0)
          ? fetch_ho_grp_indirect.msg[0].indirect_count
          : 0,

        with_loan: (ho_fetch_with_loan_grp_data.msg && ho_fetch_with_loan_grp_data.msg.length > 0)
          ? ho_fetch_with_loan_grp_data.msg[0].with_loan
          : 0,

        without_loan: (ho_fetch_without_loan_grp_data.msg && ho_fetch_without_loan_grp_data.msg.length > 0)
          ? ho_fetch_without_loan_grp_data.msg[0].without_loan
          : 0
      };
  }
  return res.send({
      success: true,
      msg: "Group data fetched successfully",
      data: data
  });
  }catch (error) {
    console.error("Error in while fetch group data in ho level", error);
    return res.send({
      success: false,
      msg: "Internal server error",
      errorCode: "SERVER_ERROR"
    });
    }
});

// head office fetch total loan outstanding data in dashboard
webDashboardRouter.post("/fetch_ho_dashboard_tot_loan_outstanding", async (req, res) => {
  try{
  const {branch_type} = req.body;

  if(branch_type === 'H'){
  var select = "COALESCE(SUM(curr_prn + curr_intt),0) AS total_outstanding",
    table_name = "bdccb.td_loan",
    whr = `branch_id IN (select branch_id from public.md_branch where branch_status = 'O' AND branch_type IN ('P', 'B'))`,
    order = null;
  }
  var fetch_ho_loan_outstanding = await db_Select(select,table_name,whr,order);
  return res.send({
    success: true,
    msg: "Dashboard total loan outstanding fetched successfully",
    data: {
        total_outstanding: (fetch_ho_loan_outstanding.msg && fetch_ho_loan_outstanding.msg.length > 0)
          ? Number(fetch_ho_loan_outstanding.msg[0].total_outstanding)
          : 0
      }
    });
  }catch (error) {
    console.error("Error in while fetch dashboard total loan outstanding data in ho level", error);
    return res.send({
      success: false,
      msg: "Internal server error",
      errorCode: "SERVER_ERROR"
    });
    }
});

// HEAD OFFICE FETCH DASHBOARD TOTAL LOAN DISBURSEMENT DATA
webDashboardRouter.post("/fetch_ho_dashboard_tot_loan_disb", async (req, res) => {
  try{
  const {flag,branch_type} = req.body;

  const today = new Date();

  const current_date = today.toISOString().split("T")[0];

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];

  let dateCondition = "";

  if (flag === "Today") {
    dateCondition = `b.trans_dt = '${current_date}'`;
  } else {
    dateCondition = `b.trans_dt BETWEEN '${startOfMonth}' AND '${current_date}'`;
  }

  let data = {};

  if(branch_type === 'H'){

  const result = await db_Select(
  `COALESCE(SUM(CASE 
    WHEN a.branch_id IN (select branch_id from public.md_branch where branch_status = 'O' AND branch_type IN ('P', 'B')) THEN b.dr_amt 
    ELSE 0 END),0) AS ho_shg_disbursed,

  COALESCE(SUM(CASE 
    WHEN a.branch_shg_id IN (select branch_id from public.md_branch where branch_status = 'O' AND branch_type IN ('P', 'B')) THEN b.dr_amt 
    ELSE 0 END),0) AS ho_society_disbursed
  `,
  "bdccb.td_loan a JOIN bdccb.td_loan_transactions b ON a.loan_id = b.loan_id",
  `b.trans_type = 'D'
  AND ${dateCondition}
  AND b.approval_status = 'A'`
);

      data = {
        shg_disbursed: result.msg[0].ho_shg_disbursed || 0,
        society_disbursed: result.msg[0].ho_society_disbursed || 0
      };
  }
  return res.send({
      success: true,
      msg: "Ho fetch Loan disbursement fetched successfully",
      data: data
  });
  }catch (error) {
    console.error("Error in while fetch dashboard total loan outstanding data in ho level", error);
    return res.send({
      success: false,
      msg: "Internal server error",
      errorCode: "SERVER_ERROR"
    });
  }
});

// HEAD OFFICE FETCH DASHBOARD DATA OF UNAPPROVE TRANSACTION DETAILS
webDashboardRouter.post("/fetch_ho_dashboard_tot_loan_unapprove_dtls", async(req, res) => {
try{
const {branch_type} = req.body;

let tot_loan_unapprove;
let tot_grp_unapprove;

if(branch_type === 'H'){

// total loan unapprove details today  
var select = "COALESCE(SUM(b.dr_amt),0) + COALESCE(SUM(b.cr_amt),0) AS ho_tot_unapprove_loan",
table_name = "bdccb.td_loan a LEFT JOIN bdccb.td_loan_transactions b ON a.loan_id = b.loan_id",
whr = `a.branch_id IN (select branch_id from public.md_branch where branch_status = 'O' AND branch_type IN ('P', 'B')) AND b.approval_status = 'U' AND b.trans_type IN('D','R','I')`,
order = null;

// TOT_GRP_UNAPPROVE
var select1 = "COUNT(DISTINCT a.group_code) ho_tot_unapprove_grp",
table_name1 = "bdccb.td_loan a LEFT JOIN bdccb.td_loan_transactions b ON a.loan_id = b.loan_id",
whr1 = `a.branch_id IN (select branch_id from public.md_branch where branch_status = 'O' AND branch_type IN ('P', 'B')) AND b.approval_status = 'U' AND b.trans_type IN('D','R','I')`,
order1 = null;
}

tot_loan_unapprove = await db_Select(select,table_name,whr,order);
tot_grp_unapprove = await db_Select(select1,table_name1,whr1,order1);

return res.send({
  success: true,
  msg: "Unapproved loan details fetched successfully",
  data: {
    total_unapproved_amount: tot_loan_unapprove.msg[0].ho_tot_unapprove_loan || 0,
    total_unapproved_group: tot_grp_unapprove.msg[0].ho_tot_unapprove_grp || 0,
      }
  });
}catch (error) {
    console.error("Error in while fetch dashboard total unapprove data in ho level", error);
    return res.send({
      success: false,
      msg: "Internal server error",
      errorCode: "SERVER_ERROR"
    });
  }
});

// FETCH HEAD OFFICE DASHBOARD TOTAL COLLECTION
webDashboardRouter.post("/fetch_ho_dashboard_tot_loan_collected", async (req, res) => {
  try{
  const {flag,branch_type} = req.body;

  const today = new Date();

  // yyyy-mm-dd
  const current_date = today.toISOString().split('T')[0];

  // first day of month
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];

  let collected_soc = 0;
  let collected_shg = 0;
  let collected_not_depo = 0;

  if(branch_type == 'H' && flag == 'Today'){
    collected_soc = await db_Select(
    "COALESCE(SUM(b.cr_amt),0) AS ho_total_amt_soc",
    "bdccb.td_loan a LEFT JOIN bdccb.td_loan_transactions b ON a.loan_id = b.loan_id",
    `a.branch_id IN (select branch_id from public.md_branch where branch_status = 'O' AND branch_type IN ('P', 'B'))
    AND b.trans_type = 'R'
    AND b.approval_status = 'A'
    AND DATE(b.trans_dt) = '${current_date}'`
    );

    collected = await db_Select(
    "COALESCE(SUM(cr_amt),0) AS ho_total_amt",
    "bdccb.td_loan_member_trans",
    `branch_id IN (select branch_id from public.md_branch where branch_status = 'O' AND branch_type IN ('P', 'B'))
     AND trans_type = 'R'
     AND approval_status = 'A'
     AND DATE(trans_date) = '${current_date}'`
    );

    collected_not_depo = await db_Select(
    "COALESCE(SUM(cr_amt),0) AS ho_total_amt_nt_collec",
    "bdccb.td_loan_member_trans_temp",
    `branch_id IN (select branch_id from public.md_branch where branch_status = 'O' AND branch_type IN ('P', 'B'))
    AND trans_type = 'R'
    AND approval_status = 'U'
    AND DATE(trans_date) = '${current_date}'`
    );

    collected_soc = collected_soc.msg[0].ho_total_amt_soc;
    collected_shg = collected.msg[0].ho_total_amt;
    collected_not_depo = collected_not_depo.msg[0].ho_total_amt_nt_collec;
  }else{
    collected_soc = await db_Select(
    "COALESCE(SUM(b.cr_amt),0) AS ho_total_amt_soc",
    "bdccb.td_loan a LEFT JOIN bdccb.td_loan_transactions b ON a.loan_id = b.loan_id",
    `a.branch_id IN (select branch_id from public.md_branch where branch_status = 'O' AND branch_type IN ('P', 'B'))
     AND b.trans_type = 'R'
     AND b.approval_status = 'A'
     AND DATE(b.trans_dt) BETWEEN '${startOfMonth}' AND '${current_date}'`
     );

    collected = await db_Select(
    "COALESCE(SUM(cr_amt),0) AS ho_total_amt",
    "bdccb.td_loan_member_trans",
    `branch_id IN (select branch_id from public.md_branch where branch_status = 'O' AND branch_type IN ('P', 'B'))
     AND trans_type = 'R'
     AND approval_status = 'A'
     AND DATE(trans_date) BETWEEN '${startOfMonth}' AND '${current_date}'`
     );

    collected_not_depo = await db_Select(
    "COALESCE(SUM(cr_amt),0) AS ho_total_amt_nt_collec",
    "bdccb.td_loan_member_trans_temp",
    `branch_id IN (select branch_id from public.md_branch where branch_status = 'O' AND branch_type IN ('P', 'B'))
     AND trans_type = 'R'
     AND approval_status = 'U'
     AND DATE(trans_date) BETWEEN '${startOfMonth}' AND '${current_date}'`
    );

    collected_soc = collected_soc.msg[0].ho_total_amt_soc;
    collected_shg = collected.msg[0].ho_total_amt;
    collected_not_depo = collected_not_depo.msg[0].ho_total_amt_nt_collec;
  }
  const data = {
      deposited_ccb: "0",  
      deposited_soc: collected_soc,
      deposited_shg: collected_shg,
      collected_nt_deposit: collected_not_depo
  };
  
  return res.send({
      success: true,
      msg: "fetch loan_collected",
      data: data
  });
  }catch (error) {
    console.error("Error in while fetch dashboard total loan collection data in ho level", error);
    return res.send({
      success: false,
      msg: "Internal server error",
      errorCode: "SERVER_ERROR"
    });
  }
});

module.exports = {webDashboardRouter}