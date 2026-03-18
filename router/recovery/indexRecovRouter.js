const indexRecovRouter = require('express').Router();

indexRecovRouter.use('/', require('./recovRouter').recovRouter);
indexRecovRouter.use('/', require('./group_recovery').groupRecoveryRouter);
indexRecovRouter.use('/', require('./society_recovery').society_recovRouter);
indexRecovRouter.use('/', require('./ccb_recovery').ccb_recovRouter);

module.exports = indexRecovRouter;