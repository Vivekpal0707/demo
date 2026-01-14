const Joi = require('joi');
const { UserModel } = require("../models/userModel");

const userSchema = Joi.object({
    name: Joi.string().pattern(/^[A-Za-z]+( [A-Za-z]+)*$/).min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(8).required(),
    
})
module.exports = {userSchema}