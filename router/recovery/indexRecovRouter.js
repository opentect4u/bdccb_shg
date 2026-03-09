const indexRecovRouter = require('express').Router();

indexRecovRouter.use('/', require('./recovRouter').recovRouter);
indexRecovRouter.use('/', require('./group_recovery').groupRecoveryRouter);


module.exports = indexRecovRouter;