const express = require('express');
const router = express.Router();
const userController = require('../controller/userController');
const validateUser = require('../validation/UserValidation');
const {authenticateToken,authorizeRole} = require('../security/Auth');

router.get('/', authenticateToken,authorizeRole('admin'), userController.getAll);
// router.post('/', validateUser, userController.create);
router.get('/:id', userController.getById);
router.delete('/:id',authenticateToken,authorizeRole('admin'), userController.deleteById);
router.put('/:id', userController.update);

module.exports = router;