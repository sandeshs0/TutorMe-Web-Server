const express = require('express');
const router = express.Router();
const userController = require('../controller/userController');

router.get('/', userController.getAll);
router.post('/', userController.create);
router.get('/:id', userController.getById);
router.delete('/:id', userController.deleteById);
router.put('/:id', userController.update);

module.exports = router;