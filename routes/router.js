const express = require('express');
const { createUser,loginUser,resetPassword,forgotPassword,verifyOtp, getUser, getUserById, updateUser, deleteUser } = require('../controllers/userController');
const { auth } = require('../middlewares/auth');

const router = express.Router();

router.post('/register',createUser);

router.post('/login',loginUser);

router.post('/resetPassword',auth,resetPassword);

router.post('/forgot-password',forgotPassword);

router.post('/verifyOtp',verifyOtp);

router.get('/getalluser',auth,getUser);

router.get('/getuser/:id',auth,getUserById);

router.put("/updateUser/:id",auth,updateUser);

router.delete('/deleteUser/:id',auth,deleteUser);

module.exports = {router}