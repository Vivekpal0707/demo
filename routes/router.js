const express = require('express');
const { createUser,loginUser,verifyOtp, getUser, getUserById, updateUser, deleteUser } = require('../controllers/userController');
const { auth } = require('../middlewares/auth');

const router = express.Router();

router.post('/register',createUser);

router.post('/login',loginUser);

router.post('/verifyOtp',verifyOtp);

router.get('/getalluser',auth,getUser);

router.get('/getuser/:id',auth,getUserById);

router.put('/updateuser/:id',updateUser);

router.delete('/deletuser/:id',deleteUser);

module.exports = {router}