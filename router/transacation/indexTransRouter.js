const indexGroupRouter = require('express').Router();

indexGroupRouter.use('/', require('./sahayikaRouter').sahayikaRouter);
module.exports = indexGroupRouter;