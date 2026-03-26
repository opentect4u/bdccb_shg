const indexDashboardRouter = require('express').Router();

indexDashboardRouter.use('/', require('./dashboardRouter').dashboardRouter);
indexDashboardRouter.use('/', require('./webDashboradRouter').webDashboardRouter);

module.exports = indexDashboardRouter;
