const indexRecovRouter = require('express').Router();

indexRecovRouter.use('/', require('./recovRouter').recovRouter);
indexRecovRouter.use('/', require('./group_recovery').groupRecoveryRouter);
indexRecovRouter.use('/', require('./society_recovery').society_recovRouter);


module.exports = indexRecovRouter;