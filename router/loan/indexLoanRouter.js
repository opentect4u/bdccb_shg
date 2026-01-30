const indexLoanRouter = require('express').Router();

indexLoanRouter.use('/', require('./loanRouter').loanRouter);

module.exports = indexLoanRouter;