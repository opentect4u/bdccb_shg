const indexLoanRouter = require('express').Router();

indexLoanRouter.use('/', require('./loanRouter').loanRouter);
indexLoanRouter.use('/', require('./loanMemberRouter').loanMemberRouter);

module.exports = indexLoanRouter;