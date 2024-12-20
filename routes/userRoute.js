const express = require('express');
const router = express.Router();
const {getAll, create, getById, deleteById, updateById} = require('../controllers/userController');

router.get('/', getAll);
router.post('/', create);
router.get('/:id', getById);
router.delete('/:id', deleteById);
router.put('/:id', updateById);

modeule.exports = router;