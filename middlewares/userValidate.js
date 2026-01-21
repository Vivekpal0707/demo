const Joi = require('joi');
const { UserModel } = require("../models/userModel");

const userSchema = Joi.object({
  name: Joi.string()
    .pattern(/^[A-Za-z]+( [A-Za-z]+)*$/)
    .min(3)
    .max(30),

  email: Joi.string()
    .email(),

  password: Joi.string()
    .min(8)
    .max(16)
    .pattern(
      new RegExp(
        "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,16}$"
      )
    )
    .messages({
      "string.pattern.base":
        "Password must contain at least 1 uppercase, 1 lowercase, 1 number and 1 special character"
    }),

  otp: Joi.string()
    .length(6)
    .pattern(/^[0-9]+$/)
    .required()
    .messages({
      "string.length": "OTP must be exactly 6 digits",
      "string.pattern.base": "OTP must contain only numbers",
      "any.required": "OTP is required"
    })
}).unknown(false);

module.exports = { userSchema }