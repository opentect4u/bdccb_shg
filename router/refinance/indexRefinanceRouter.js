const indexRefinanceRouter = require('express').Router();

indexRefinanceRouter.use('/', require('./refinanceRouter').refinanceRouter);

module.exports = indexRefinanceRouter;