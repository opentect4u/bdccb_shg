const indexsbRouter = require('express').Router();

indexsbRouter.use('/', require('./sbRouter').sbRouter);

module.exports = indexsbRouter;