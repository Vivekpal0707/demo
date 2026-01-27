const Joi = require('joi');
const { userSchema,loginSchema,resetPasswordSchema,forgotPasswordSchema,forgotLinkHeaderSchema,resetForgotPasswordSchema,verifyOtpSchema,authHeaderSchema,paginationSchema,userIdParamSchema,updateUserBodySchema,deleteUserParamSchema } = require('../middlewares/userValidate');
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
const {verifyForgotLinkService} =require("../services/userService");
const {resetForgotPasswordService} =require("../services/userService");

const createUser = async (req, res) => {
  try {
    await userSchema.validateAsync(req.body, { abortEarly: false });

    const user = await createUserService(req.body);

    return sendSuccess(
      res,
      "User created successfully",
      { id: user.id },
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

    return sendError(
      res,
      error.message || "Something went wrong",
      error.statusCode || 500
    );
  }
};

const loginUser = async (req, res) => {
  try {
    await loginSchema.validateAsync(req.body, { abortEarly: false });

    const { email, password } = req.body;

    const user = await loginUserService(email, password);

    return sendSuccess(
      res,
      "OTP sent to your email",
      { id: user.id },
      200
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
    const { email } = await forgotPasswordSchema.validateAsync(req.body,{ abortEarly: false });

    await forgotPasswordService(email);

    return res.status(200).json({
      success: true,
      message: "Verification link sent to your email"
    });

  } catch (error) {

    if (error.isJoi) {
      return res.status(400).json({
        success: false,
        message: error.details.map(err => err.message).join(", ")
      });
    }

    return res.status(500).json({
      success: false,
      message: "Something went wrong"
    });
  }
};

const verifyForgotLink = async (req, res) => {
  try {
    const { authorization } = await forgotLinkHeaderSchema.validateAsync(req.headers,{ abortEarly: false });

    const token = authorization.split(" ")[1];
    if (!token) {
      return res.status(400).json({ message: "Invalid authorization token format" });
    }

    const resetToken = await verifyForgotLinkService(token);

    return res.status(200).json({
      success: true,
      resetLink: `${resetToken}`
    });

  } catch (error) {

    if (error.isJoi) {
      return res.status(400).json({
        success: false,
        message: error.details.map(err => err.message).join(", ")
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const resetForgotPassword = async (req, res) => {
  try {
    const { newPassword } = await resetForgotPasswordSchema.validateAsync(req.body,{ abortEarly: false });

    const { userId, resetToken } = req; 

    await resetForgotPasswordService(userId, resetToken, newPassword);

    return res.status(200).json({
      success: true,
      message: "Password reset successfully"
    });

  } catch (error) {

    if (error.isJoi) {
      return res.status(400).json({
        success: false,
        message: error.details.map(err => err.message).join(", ")
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { otp } = await verifyOtpSchema.validateAsync(req.body, {abortEarly: false});

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
    return sendError(
      res,
      "Something went wrong",
      500
    );
  }
};

const getUser = async (req, res) => {
  try {
    await authHeaderSchema.validateAsync(req.headers, {
      abortEarly: false
    });

    const {page,limit,search,startDate,endDate} = await paginationSchema.validateAsync(req.query, {abortEarly: false});

    const users = await getAllUsersService(page,limit,search,startDate,endDate);

    return res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      data: users
    });

  } catch (error) {

    if (error.isJoi) {
      return res.status(400).json({
        success: false,
        message: error.details.map(err => err.message).join(", ")
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getUserById = async (req, res) => {
  try {
    await userIdParamSchema.validateAsync(req.params, {abortEarly: false});

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

    await updateUserBodySchema.validateAsync(req.body, {abortEarly: false});

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
      "User updated successfully",
        { id: user.id },
      200

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

module.exports = { createUser, loginUser, resetPassword,forgotPassword,verifyForgotLink,resetForgotPassword,verifyOtp, getUser, getUserById, updateUser, deleteUser }