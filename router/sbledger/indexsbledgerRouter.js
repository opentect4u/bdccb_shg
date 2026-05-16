const indexsbledgerRouter = require('express').Router();

indexsbledgerRouter.use('/', require('./sblegderRouter').sbledgerRouter);

module.exports = indexsbledgerRouter;