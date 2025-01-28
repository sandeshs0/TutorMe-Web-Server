const express = require('express');
const router = express.Router();
const { getAllSubjects } = require('../controller/subjectController');

router.get("/getAll", getAllSubjects);

module.exports = router;