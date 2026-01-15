const http = require('http');
const express = require('express');
const cors = require('cors');
const PORT = process.env.PORT || 3017;
const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
const {db_Select,saveRecord} =  require('./model/pgcommon');
const {createToken,verifyToken,newfuncttion} = require("./middleware/authMiddleware");


app.use('/v1/master', require('./router/master/indexRouter'));
app.use('/v1/group', require('./router/group/indexGroupRouter'));

 

app.post("/v1/login", async (req, res) => {
    try {
        const user = { username: "admin", password: "admin123" };
        const { username, password } = req.body;
        if (username === user.username && password === user.password) {
             const userData = { username:username, age: "30", role: "Backend Developer" };
            const jwtToken = await createToken(userData);
            const user_dtls = {
                          "emp_id": 9999,
                          "brn_code": "100",
                          "id": 4,
                          "user_type": "Super Admin",
                          "session_id": 8585858585,
                          "emp_name": "Test EMP",
                          "phone_home": 0,
                          "phone_mobile": 0,
                          "email": "",
                          "gender": "M",
                          "active_flag": "Y",
                          "area_code": 0,
                          "branch_name": "SSVWS",
                          "dist_code": 10021,
                          "transaction_date": "2026-01-15"
                       };
            return res.send({
                success: true,
                msg: "Login Successful",
                user_dtls: [user_dtls],
                token: jwtToken.token,
                refresh_token: jwtToken.token
            });
        }else{
             return res.send({
                success: false,
                msg: "Invalid Credentials"
                });
        }

    } catch (error) {
        console.error("Error in /login route:", error);
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


server.listen(PORT, '0.0.0.0',() => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
});
