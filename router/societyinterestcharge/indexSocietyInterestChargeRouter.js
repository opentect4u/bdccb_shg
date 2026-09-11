const express = require("express");
const societyInterestChargeRouter = express.Router();

const { societyInterestChargeRouter: societyRouter } = require("./societyInterestChargeRouter");

societyInterestChargeRouter.use("/", societyRouter);

module.exports = societyInterestChargeRouter;
