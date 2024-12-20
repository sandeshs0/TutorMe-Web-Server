const express = require('express');
const router = express.Router();
const userController = require('../controller/userController');

router.get('/', userController.getAll);
router.post('/', userController.create);
// router.get('/:id', getById);
// router.delete('/:id', deleteById);
// router.put('/:id', updateById);

module.exports = router;