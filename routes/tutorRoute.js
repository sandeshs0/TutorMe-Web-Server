const express = require('express');
const router = express.Router();
const tutorController = require('../controller/tutorController');
const {authenticateToken,authorizeRole} = require('../security/Auth');


const multer = require('multer');
const storage=multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,'./tutor_images')
    },
    filename:(req,file,cb)=>{
        cb(null,Date.now()+'-'+file.originalname)
    }
})

const upload=multer({storage})

router.get('/', tutorController.getAll);
router.post('/',upload.single('file'), tutorController.create);
router.get('/:id', tutorController.getById);
router.delete('/:id', authenticateToken,authorizeRole('admin'),tutorController.deleteById);
router.put('/:id', tutorController.update);

module.exports = router;