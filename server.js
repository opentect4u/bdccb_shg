const http = require('http');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const PORT = process.env.PORT || 3017;

// try {
// 	const srcMedia = 'C:\\Users\\ssspl\\.gemini\\antigravity-ide\\brain\\f8b06fe4-1d6a-4788-ba3e-741def0d35c5\\media__1786360767432.jpg';
// 	const destMedia = 'd:\\Sayantika\\bdccb_shg\\bdccb_shg\\bdccb_shg_frontend\\src\\Assets\\Images\\shg_user_exact.jpg';
// 	if (fs.existsSync(srcMedia)) {
// 		fs.copyFileSync(srcMedia, destMedia);
// 	}
// 	const srcMedia2 = 'C:\\Users\\ssspl\\.gemini\\antigravity-ide\\brain\\f8b06fe4-1d6a-4788-ba3e-741def0d35c5\\media__1786361110788.jpg';
// 	const destMedia2 = 'd:\\Sayantika\\bdccb_shg\\bdccb_shg\\bdccb_shg_frontend\\src\\Assets\\Images\\shg_tailoring.jpg';
// 	if (fs.existsSync(srcMedia2)) {
// 		fs.copyFileSync(srcMedia2, destMedia2);
// 	}
// } catch (err) {
// 	console.log('Copy media error:', err);
// }
const app = express();
const server = http.createServer(app);
const bcrypt = require("bcrypt");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
const { db_Select, saveRecord } = require('./model/pgcommon');
const { createToken, verifyToken, newfuncttion } = require("./middleware/authMiddleware");


// app.get('/v1/copy_user_media', (req, res) => {
// 	try {
// 		const srcMedia3 = 'C:\\Users\\ssspl\\.gemini\\antigravity-ide\\brain\\f8b06fe4-1d6a-4788-ba3e-741def0d35c5\\shg_tailoring_hd_1786361376021.png';
// 		const destMedia3 = 'd:\\Sayantika\\bdccb_shg\\bdccb_shg\\bdccb_shg_frontend\\src\\Assets\\Images\\shg_tailoring_hd.png';
// 		if (fs.existsSync(srcMedia3)) {
// 			fs.copyFileSync(srcMedia3, destMedia3);
// 			return res.json({ success: true, msg: 'HD_COPIED_SUCCESSFULLY' });
// 		}
// 		return res.json({ success: false, msg: 'HD_SRC_NOT_FOUND' });
// 	} catch (err) {
// 		return res.json({ success: false, error: err.message });
// 	}
// });

app.use('/v1/master', require('./router/master/indexRouter'));
app.use('/v1/group', require('./router/group/indexGroupRouter'));
app.use('/v1/member', require('./router/member/indexMemberRouter'));
app.use('/v1/trans', require('./router/transacation/indexTransRouter'));
app.use('/v1/loan', require('./router/loan/indexLoanRouter'));
app.use('/v1/recov', require('./router/recovery/indexRecovRouter'));
app.use('/v1/depsav', require('./router/deposit_saving/indexdepsavingRouter'));
app.use('/v1/account', require('./router/account/indexAccountRouter'));
app.use('/v1/dashboard', require('./router/dashboard/indexDashboardRouter'));
app.use('/v1/user', require('./router/user/indexUserRouter'));
app.use('/v1/report', require('./router/report/indexReportRouter'));
app.use('/v1', require('./router/report/indexReportRouter'));
app.use('/v1/refinance', require('./router/refinance/indexRefinanceRouter'));
app.use('/v1/savings', require('./router/sbAccount/indexSbRouter'));
app.use('/v1/sbledger', require('./router/sbledger/indexsbledgerRouter'));
app.use('/v1/memberreport', require('./router/memberreport/indexMemberReportRouter'));
app.use('/v1/loanclose', require('./router/loanclose/indexLoanCloseRouter'));


// app.post("/v1/login", async (req, res) => {
//   try {
//     const { username, password } = req.body;

//     if (!username || !password) {
//       return res.send({
//         success: false,
//         msg: "Username and password are required"
//       });
//     }

//     // FETCH USER
//     let select = `a.user_id emp_id,a.user_name emp_name,a.designation,a.brn_code,a.user_type,a.phone_mobile,a.active_flag,a.password,a.session_id,b.branch_name,b.block_id as org_block_id,c.tenant_id,c.tenant_name,d.dist_id,e.dist_name`;

//     let table_name = `bdccb.md_user a LEFT JOIN public.md_branch b ON a.brn_code = b.branch_id
//       LEFT JOIN public.md_tenant c ON a.tenant_id = c.tenant_id
//       LEFT JOIN public.md_tenant_dist d ON c.tenant_id = d.tenant_id
//       LEFT JOIN public.md_district e ON d.dist_id = e.dist_code`;

//     //let whr = `a.user_id = '${username}' AND a.active_flag = 'Y'`;
//     let whr = `a.user_id = '${username}' `;
//     let order = null;

//     let res_dt = await db_Select(select, table_name, whr, order);

//     // Validate login response structure safely
//     if (!res_dt || res_dt.suc !== 1 || res_dt.msg.length === 0) {
//          return res.send({
//               success: false,
//               msg: "Invalid username"
//             });

//     }
//     // CREATE TOKEN
//     const userData = res_dt.msg[0];
//     // Check if user is active
//     if (userData.active_flag !== 'Y') {
//             return res.send({
//                success: false,
//                msg: "Account is inactive. Please contact administrator."
//             });
//     }

//     const isMatch = await bcrypt.compare(password.toString(), userData.password);

//      if (!isMatch) {
//       return res.send({ success: false, msg: "Invalid Password" });
//     }
//     const jwtToken = await createToken(userData);

//     // DISTRICT LIST
//     const district_list = res_dt.msg.map(row => ({
//       dist_code: row.dist_id,
//       dist_name: row.dist_name
//     }));

//     // USER DETAILS RESPONSE
//     const user_dtls = {
//       district_list: district_list,
//       tenant_id: userData.tenant_id,
//       tenant_name: userData.tenant_name,
//       emp_id: userData.emp_id,
//       emp_name: userData.emp_name,
//       designation: userData.designation,
//       brn_code: userData.brn_code,
//       brn_block_id : userData.org_block_id,
//       branch_name: userData.branch_name,
//       user_type: userData.user_type,
//       phone_mobile: userData.phone_mobile,
//       active_flag: userData.active_flag,
//       session_id: userData.session_id
//     };

//     return res.send({
//       success: true,
//       msg: "Login Successful",
//       user_dtls: [user_dtls],
//       token: jwtToken.token,
//       refresh_token: jwtToken.token
//     });

//   } catch (error) {
//     console.error("Error in /login route:", error);
//     return res.send({
//       success: false,
//       msg: "Internal server error",
//       errorCode: "SERVER_ERROR"
//     });
//   }
// });

app.post("/v1/login", async (req, res) => {
  try {
    const { username, password, user_type, branch_id } = req.body;
    console.log(req.body, 'login');


    if (!username || !password) {
      return res.send({
        success: false,
        msg: "Username and password are required"
      });
    }

    // FETCH USER
    let select = `a.user_id emp_id,a.user_name emp_name,a.designation,a.brn_code,a.user_type,a.phone_mobile,a.active_flag,a.password,a.session_id,b.branch_name,b.block_id as org_block_id,b.branch_type,c.tenant_id,c.tenant_name,d.dist_id,e.dist_name,f.sb_ac_no`;

    // let table_name = `bdccb.md_user a LEFT JOIN public.md_branch b ON a.brn_code = b.branch_id
    //   LEFT JOIN public.md_tenant c ON a.tenant_id = c.tenant_id
    //   LEFT JOIN public.md_tenant_dist d ON c.tenant_id = d.tenant_id
    //   LEFT JOIN public.md_district e ON d.dist_id = e.dist_code
    //   LEFT JOIN bdccb.md_group f ON split_part(a.user_id, '-', 3) = f.group_code::text`;

    let table_name = `bdccb.md_user a LEFT JOIN public.md_branch b ON a.brn_code = b.branch_id
      LEFT JOIN public.md_tenant c ON a.tenant_id = c.tenant_id
      LEFT JOIN public.md_tenant_dist d ON c.tenant_id = d.tenant_id
      LEFT JOIN public.md_district e ON d.dist_id = e.dist_code
      LEFT JOIN bdccb.md_group f ON a.user_id = f.group_code::text`;

    //let whr = `a.user_id = '${username}' AND a.active_flag = 'Y'`;
    let whr = `a.user_id = '${username}'`;

    let order = null;

    let res_dt = await db_Select(select, table_name, whr, order);

    // Validate login response structure safely
    if (!res_dt || res_dt.suc !== 1 || res_dt.msg.length === 0) {
      return res.send({
        success: false,
        msg: "Invalid username"
      });

    }
    // CREATE TOKEN
    const userData = res_dt.msg[0];
    // Check if user is active
    if (userData.active_flag !== 'Y') {
      return res.send({
        success: false,
        msg: "Account is inactive. Please contact administrator."
      });
    }

    const isMatch = await bcrypt.compare(password.toString(), userData.password);

    if (!isMatch) {
      return res.send({ success: false, msg: "Invalid Password" });
    }

    // =========================
    // BRANCH OVERRIDE LOGIC
    // =========================
    let final_branch_code = userData.brn_code;
    let final_branch_name = userData.branch_name;
    let final_block_id = userData.org_block_id;
    let final_branch_type = userData.branch_type;

    // If Head Office user → use frontend branch
    if (user_type === 'H' && branch_id) {

      const branch_dt = await db_Select(
        "branch_id, branch_name, block_id, branch_type",
        "public.md_branch",
        `branch_id = '${branch_id}'`,
        null
      );

      if (!branch_dt || branch_dt.suc !== 1 || branch_dt.msg.length === 0) {
        return res.send({
          success: false,
          msg: "Invalid branch selected"
        });
      }

      final_branch_code = branch_dt.msg[0].branch_id;
      final_branch_name = branch_dt.msg[0].branch_name;
      final_block_id = branch_dt.msg[0].block_id;
      final_branch_type = branch_dt.msg[0].branch_type;
    }

    const jwtToken = await createToken(userData);

    // DISTRICT LIST
    const district_list = res_dt.msg.map(row => ({
      dist_code: row.dist_id,
      dist_name: row.dist_name
    }));

    // USER DETAILS RESPONSE
    const user_dtls = {
      district_list: district_list,
      tenant_id: userData.tenant_id,
      tenant_name: userData.tenant_name,
      emp_id: userData.emp_id,
      emp_name: userData.emp_name,
      designation: userData.designation,
      // brn_code: userData.brn_code,
      // brn_block_id : userData.org_block_id,
      // branch_name: userData.branch_name,

      brn_code: final_branch_code,
      brn_block_id: final_block_id,
      branch_name: final_branch_name,
      branch_type: final_branch_type,
      user_type: userData.user_type,
      phone_mobile: userData.phone_mobile,
      active_flag: userData.active_flag,
      session_id: userData.session_id,
      sb_ac_no: userData.sb_ac_no
    };

    return res.send({
      success: true,
      msg: "Login Successful",
      user_dtls: [user_dtls],
      token: jwtToken.token,
      refresh_token: jwtToken.token
    });

  } catch (error) {
    console.error("Error in /login route:", error);
    return res.send({
      success: false,
      msg: "Internal server error",
      errorCode: "SERVER_ERROR"
    });
  }
});

app.post("/v1/logout", async (req, res) => {
  try {
    // Optionally handle session clearing logic here if needed in the future
    return res.send({
      success: true,
      msg: "Logged out successfully"
    });
  } catch (error) {
    console.error("Error in /logout route:", error);
    return res.send({
      success: false,
      msg: "Internal server error",
      errorCode: "SERVER_ERROR"
    });
  }
});


process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION');
  logger.error(err);
  process.exit(1); // prevent corrupted state
});

process.on('unhandledRejection', (reason) => {
  logger.error('UNHANDLED PROMISE REJECTION');
  logger.error(reason);
});


server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
});
