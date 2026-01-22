const Joi = require('joi');

const userSchema = Joi.object({
  name: Joi.string()
    .pattern(/^[A-Za-z]+( [A-Za-z]+)*$/)
    .min(3)
    .max(30)
    .required()
    .messages({
      "any.required": "Name is required",
      "string.pattern.base": "Name must contain only letters"
    }),

  email: Joi.string()
    .email()
    .required()
    .messages({
      "any.required": "Email is required",
      "string.email": "Invalid email format"
    }),

  password: Joi.string()
    .min(8)
    .max(16)
    .pattern(
      new RegExp(
        "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,16}$"
      )
    )
    .required()
    .messages({
      "any.required": "Password is required",
      "string.pattern.base":
        "Password must contain at least 1 uppercase, 1 lowercase, 1 number and 1 special character"
    })
}).unknown(false);

const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      "any.required": "Email is required",
      "string.email": "Invalid email format"
    }),

  password: Joi.string()
    .required()
    .messages({
      "any.required": "Password is required"
    })
}).unknown(false);

const resetPasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      "any.required": "Current password is required"
    }),

  newPassword: Joi.string()
    .min(8)
    .required()
    .messages({
      "any.required": "New password is required",
      "string.min": "New password must be at least 8 characters"
    }),

  confirmPassword: Joi.string()
    .valid(Joi.ref("newPassword"))
    .required()
    .messages({
      "any.only": "New password and confirm password do not match",
      "any.required": "Confirm password is required"
    })
}).unknown(false);

const forgotPasswordSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      "string.email": "Please enter a valid email address",
      "any.required": "Email is required"
    })
}).unknown(false);

const verifyOtpSchema = Joi.object({
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

const authHeaderSchema = Joi.object({
  authorization: Joi.string()
    .required()
    .pattern(/^Bearer\s.+$/)
    .messages({
      "any.required": "Authorization token is required",
      "string.pattern.base": "Invalid authorization token format"
    })
}).unknown(true); 

const userIdParamSchema = Joi.object({
  id: Joi.number()
    .integer()
    .required()
    .messages({
      "number.base": "User id must be a number",
      "any.required": "User id is required"
    })
});

const updateUserBodySchema = Joi.object({
  name: Joi.string()
    .pattern(/^[A-Za-z ]+$/)
    .min(3)
    .max(30)
    .optional(),

  email: Joi.string()
    .email()
    .optional(),

  password: Joi.string()
    .min(8)
    .max(16)
    .optional()
})
.min(1); 

const deleteUserParamSchema = Joi.object({
  id: Joi.number()
    .integer()
    .required()
    .messages({
      "number.base": "User id must be a number",
      "any.required": "User id is required"
    })
});

module.exports = { userSchema,loginSchema,resetPasswordSchema,verifyOtpSchema,authHeaderSchema,userIdParamSchema,updateUserBodySchema,deleteUserParamSchema}