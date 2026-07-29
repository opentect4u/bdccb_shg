const indexDashboardRouter = require("express").Router();

indexDashboardRouter.use("/", require("./dashboardRouter").dashboardRouter);
indexDashboardRouter.use(
  "/",
  require("./webDashboradRouter").webDashboardRouter,
);
indexDashboardRouter.use("/", require("./menuRouter").menuRouter);

module.exports = indexDashboardRouter;
