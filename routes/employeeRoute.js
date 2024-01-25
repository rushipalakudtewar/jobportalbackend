const express = require('express');
const { signup, login, updateProfileDetails, getProfileDetailsById, uploadProfile, uploadResume} = require('../controllers/employeeController')
const router = express.Router()
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // This saves files to 'uploads/' folder


router.post('/signup',signup)
router.post('/login',login)
router.put('/upload/profile/:id', upload.single('image'),uploadProfile);
router.put('/upload/resume/:id', upload.single('resume'),uploadResume);
router.put('/updatedetails/:id',updateProfileDetails);
router.get('/getdetails/:id',getProfileDetailsById)

module.exports = router