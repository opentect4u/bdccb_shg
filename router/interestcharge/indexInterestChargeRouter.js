const indexInterestChargeRouter = require('express').Router();

indexInterestChargeRouter.use('/', require('./interestChargeRouter').interestChargeRouter);

module.exports = indexInterestChargeRouter;
