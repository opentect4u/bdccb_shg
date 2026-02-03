const indexTransRouter = require('express').Router();

indexTransRouter.use('/', require('./sahayikaRouter').sahayikaRouter);
module.exports = indexTransRouter;