const indexLoanRouter = require('express').Router();

indexLoanRouter.use('/', require('./brn_pacs_disbRouter').brn_pacsdisbRouter);

module.exports = indexLoanRouter;