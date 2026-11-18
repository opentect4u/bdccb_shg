const indexDashboardRouter = require("express").Router();

indexDashboardRouter.use("/", require("./dashboardRouter").dashboardRouter);
indexDashboardRouter.use(
  "/",
  require("./webDashboradRouter").webDashboardRouter,
);
indexDashboardRouter.use("/", require("./menuRouter").menuRouter);
indexDashboardRouter.use(
  "/",
  require("./hodashboardRouter").hodashboardRouter,
);

module.exports = indexDashboardRouter;
