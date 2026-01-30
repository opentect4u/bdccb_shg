const indexAccountRouter = require('express').Router();

indexAccountRouter.use('/', require('./accountRouter').accountRouter);

module.exports = indexAccountRouter;