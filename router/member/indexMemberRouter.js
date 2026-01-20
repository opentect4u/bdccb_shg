const indexMemberRouter = require('express').Router();

indexMemberRouter.use('/', require('./memberRouter').memberRouter);

module.exports = indexMemberRouter;