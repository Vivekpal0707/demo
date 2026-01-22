const Joi = require('joi');
const { userSchema,loginSchema,resetPasswordSchema,forgotPasswordSchema,verifyOtpSchema,authHeaderSchema,userIdParamSchema,updateUserBodySchema,deleteUserParamSchema } = require('../middlewares/userValidate');
const { sendSuccess, sendError } = require("../middlewares/responseHandler");
const { UserModel } = require('../models/userModel');
const { createUserService } = require("../services/userService")
const { loginUserService } = require("../services/userService");
const { verifyOtpService } = require("../services/userService");
const { getAllUsersService } = require("../services/userService");
const { getUserByIdService } = require("../services/userService");
const { updateUserService } = require("../services/userService");
const { deleteUserService } = require("../services/userService");
const { resetPasswordService } = require("../services/userService");
const { forgotPasswordService } = require('../services/userService');

const createUser = async (req, res) => {
  try {
    await userSchema.validateAsync(req.body, { abortEarly: false });

    await createUserService(req.body);

    return sendSuccess(
      res,
      "User created successfully",
      null,
      201
    );

  } catch (error) {

    if (error.isJoi) {
      return sendError(
        res,
        "Validation error",
        400,
        error.details.map(err => err.message)
      );
    }

    if (error.statusCode === 409) {
      return sendError(
        res,
        error.message,
        409
      );
    }

    if (error.name === "SequelizeUniqueConstraintError") {
      return sendError(
        res,
        "Email already exists",
        409
      );
    }

    return sendError(
      res,
      "Something went wrong",
      500
    );
  }
};

const loginUser = async (req, res) => {
  try {
    await loginSchema.validateAsync(req.body, {
      abortEarly: false
    });

    const { email, password } = req.body;

    await loginUserService(email, password);

    return sendSuccess(
      res,
      "OTP sent to your email"
    );

  } catch (error) {

    if (error.isJoi) {
      return sendError(
        res,
        error.details.map(err => err.message).join(", "),
        400
      );
    }

    if (error.status) {
      return sendError(
        res,
        error.message,
        error.status
      );
    }

    return sendError(
      res,
      "Something went wrong",
      500
    );
  }
};

const resetPassword = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return sendError(
        res,
        "Unauthorized",
        401
      );
    }

    await resetPasswordSchema.validateAsync(req.body, {
      abortEarly: false
    });

    const { currentPassword, newPassword } = req.body;

    await resetPasswordService(
      req.user.id,
      currentPassword,
      newPassword
    );

    return sendSuccess(
      res,
      "Password reset successfully"
    );

  } catch (error) {

    if (error.isJoi) {
      return sendError(
        res,
        error.details.map(err => err.message).join(", "),
        400
      );
    }

    return sendError(
      res,
      error.message || "Something went wrong",
      error.status || 500
    );
  }
};

const forgotPassword = async (req, res) => {
  try {
    await forgotPasswordSchema.validateAsync(req.body, {
      abortEarly: false
    });

    const { email } = req.body;

    await forgotPasswordService(email);

    return res.status(200).json({
      message: "Password reset link sent to your registered email",
      success: true
    });

  } catch (error) {

    if (error.isJoi) {
      return res.status(400).json({
        message: "Validation error",
        details: error.details.map(err => err.message),
        success: false
      });
    }

    return res.status(500).json({
      message: "Something went wrong",
      success: false
    });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { otp } = await verifyOtpSchema.validateAsync(req.body, {
      abortEarly: false
    });

    const token = await verifyOtpService(otp);

    return sendSuccess(
      res,
      "Login successful",
      {
        token: `Bearer ${token}`
      }
    );

  } catch (error) {

    if (error.isJoi) {
      return sendError(
        res,
        "Validation error",
        400,
        error.details.map(err => err.message)
      );
    }

    if (error.status) {
      return sendError(
        res,
        error.message,
        error.status
      );
    }

    console.log(error);
    return sendError(
      res,
      "Something went wrong",
      500
    );
  }
};

// const getUser = async (req, res) => {
//   try {
//     await authHeaderSchema.validateAsync(req.headers, {
//       abortEarly: false
//     });

//     const users = await getAllUsersService();

//     return sendSuccess(
//       res,
//       "Users fetched successfully",
//       users
//     );

//   } catch (error) {

//     if (error.isJoi) {
//       return sendError(
//         res,
//         error.details.map(err => err.message).join(", "),
//         401
//       );
//     }
//     return sendError(
//       res,
//       "Internal server error",
//       500
//     );
//   }
// };

const getUser = async (req, res) => {
  try {
 
    const users = await getAllUsersService();

    return sendSuccess(
      res,
      "Users fetched successfully",
      users
    );

  } catch (error) {
    return sendError(
      res,
      "Internal server error",
      500
    );
  }
};


const getUserById = async (req, res) => {
  try {
    await userIdParamSchema.validateAsync(req.params, {
      abortEarly: false
    });

    const { id } = req.params;

    const user = await getUserByIdService(id);

    if (!user) {
      return sendError(
        res,
        "User not found",
        404
      );
    }

    return sendSuccess(
      res,
      "User fetched successfully",
      user
    );

  } catch (error) {

    if (error.isJoi) {
      return sendError(
        res,
        error.details.map(err => err.message).join(", "),
        400
      );
    }
    return sendError(
      res,
      "Internal server error",
      500
    );
  }
};

const updateUser = async (req, res) => {
  try {
  
    if (!req.user || !req.user.id) {
      return sendError(
        res,
        "Unauthorized",
        401
      );
    }

    await updateUserBodySchema.validateAsync(req.body, {
      abortEarly: false
    });

    if (Number(req.params.id) !== Number(req.user.id)) {
      return sendError(
        res,
        "You are not allowed to update this user",
        403
      );
    }

    const user = await updateUserService(req.params.id, req.body);

    if (!user) {
      return sendError(
        res,
        "User not found",
        404
      );
    }

    return sendSuccess(
      res,
      "User updated successfully"
    );

  } catch (error) {

    if (error.isJoi) {
      return sendError(
        res,
        error.details.map(err => err.message).join(", "),
        400
      );
    }

    console.error("UPDATE USER ERROR:", error);

    return sendError(
      res,
      "Internal server error",
      500
    );
  }
};

const deleteUser = async (req, res) => {
  try {
    await deleteUserParamSchema.validateAsync(req.params, { abortEarly: false });

    const { id } = req.params;

    if (Number(id) !== req.user.id) {
      return sendError(
        res,
        "You are not allowed to delete this user",
        403
      );
    }
  
    const deleted = await deleteUserService(id);

    if (!deleted) {
      return sendError(
        res,
        "User not found",
        404
      );
    }

    return sendSuccess(
      res,
      "User deleted successfully"
    );

  } catch (error) {

    if (error.isJoi) {
      return sendError(
        res,
        error.details.map(err => err.message).join(", "),
        400
      );
    }

    return sendError(
      res,
      "Internal server error",
      500
    );
  }
};


module.exports = { createUser, loginUser, resetPassword,forgotPassword, verifyOtp, getUser, getUserById, updateUser, deleteUser }