const indexMemberReportRouter = require('express').Router();

indexMemberReportRouter.use('/', require('./memberreportRouter').memberreportRouter);

module.exports = indexMemberReportRouter;
