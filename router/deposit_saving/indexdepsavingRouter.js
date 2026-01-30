const indexdepsavingRouter = require('express').Router();
indexdepsavingRouter.use('/', require('./dep_saving_Router').depsavingRouter);
module.exports = indexdepsavingRouter;