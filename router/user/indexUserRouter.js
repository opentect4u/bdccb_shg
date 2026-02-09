const indexUserRouter = require('express').Router();
indexUserRouter.use('/', require('./userRouter').userRouter);
module.exports = indexUserRouter;