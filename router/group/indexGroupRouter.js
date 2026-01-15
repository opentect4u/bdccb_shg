const indexGroupRouter = require('express').Router();

indexGroupRouter.use('/', require('./groupRouter').groupRouter);

module.exports = indexGroupRouter;