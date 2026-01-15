const indexMasterRouter = require('express').Router();

indexMasterRouter.use('/', require('./block_dist_Router').bdRouter);
indexMasterRouter.use('/', require('./police_post_Router').ppRouter);

module.exports = indexMasterRouter;