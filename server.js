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

app.post("/login", async (req, res) => {
    try {
        const user = { username: "admin", password: "admin123" };
        const { username, password } = req.body;
        if (username === user.username && password === user.password) {
             const userData = { username:username, age: "30", role: "Backend Developer" };
            const jwtToken = await createToken(userData);
            return res.status(200).send({
                success: true,
                msg: "Login Successful",
                data: [userData],
                token: jwtToken.token
            });
        }else{
             return res.status(401).send({
                success: false,
                msg: "Invalid Credentials"
                });
        }

    } catch (error) {
        console.error("Error in /login route:", error);
        return res.status(500).send({
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
