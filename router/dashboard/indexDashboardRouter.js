const indexDashboardRouter = require('express').Router();

indexDashboardRouter.use('/', require('./dashboardRouter').dashboardRouter);

module.exports = indexDashboardRouter;
