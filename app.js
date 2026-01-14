require("dotenv").config();
const express = require('express');
const { router } = require('./routes/router');
const { dbconection } = require('./config/db');
const { UserModel } = require('./models/userModel');

const app = express();

app.use(express.json());

app.use('/api', router);

UserModel.sync();

const PORT = process.env.PORT || 4000;
app.listen(PORT,async()=>{
    console.log('Server is listen at port:'+PORT)
    await dbconection()
});