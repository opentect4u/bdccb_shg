const indexLoanCloseRouter = require('express').Router();

indexLoanCloseRouter.use('/', require('./loanCloseRouter').loanCloseRouter);

module.exports = indexLoanCloseRouter;
