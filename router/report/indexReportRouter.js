const indexReportRouter = require('express').Router();

indexReportRouter.use('/', require('./reportRouter').reportRouter);

module.exports = indexReportRouter;