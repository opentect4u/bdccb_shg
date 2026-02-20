const indexRecovRouter = require('express').Router();

indexRecovRouter.use('/', require('./recovRouter').recovRouter);

module.exports = indexRecovRouter;