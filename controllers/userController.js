const Joi = require('joi');
const { userSchema } = require('../middlewares/userValidate');
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

    return res.status(201).json({
      message: "User created successfully",
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

    if (error.statusCode === 409) {
      return res.status(409).json({
        message: error.message,
        success: false
      });
    }

    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        message: "Email already exists",
        success: false
      });
    }

    return res.status(500).json({
      message: "Something went wrong",
      success: false
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password required"
      });
    }

    await loginUserService(email, password);

    return res.status(200).json({
      message: "OTP sent to your email"
    });

  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        message: error.message
      });
    }
    
    return res.status(500).json({
      message: "Something went wrong",
      error: error.message
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        message: "Unauthorized"
      });
    }

    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message: "currentPassword, newPassword and confirmPassword are required"
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "New password and confirm password do not match"
      });
    }

    await resetPasswordService(req.user.id, currentPassword, newPassword);

    return res.status(200).json({
      message: "Password reset successfully"
    });

  } catch (error) {

    return res.status(error.status || 500).json({
      message: error.message || "Something went wrong"
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required"
      });
    }

    await forgotPasswordService(email);

    return res.status(200).json({
      message: "Password reset link sent to your registered email"
    });

  } catch (error) {
    return res.status(error.status || 500).json({
      message: error.message || "Something went wrong"
    });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { otp } = await userSchema.validateAsync(req.body, {
      abortEarly: false
    });

    const token = await verifyOtpService(otp);

    return res.status(200).json({
      message: "Login successful",
      token: `Bearer ${token}`
    });

  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json({
        message: "Validation error",
        details: error.details.map(err => err.message)
      });
    }

    if (error.status) {
      return res.status(error.status).json({
        message: error.message
      });
    }

    console.log(error);
    return res.status(500).json({
      message: "Something went wrong",
      error: error.message
    });
  }
};

const getUser = async (req, res) => {
  try {
    const users = await getAllUsersService();

    return res.status(200).json({
      message: "Users fetched successfully",
      data: users
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        message: "Invalid user id"
      });
    }

    const user = await getUserByIdService(id);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    return res.status(200).json({
      message: "User fetched successfully",
      data: user
    });

  } catch (error) {
    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

const updateUser = async (req, res) => {
  try {
    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({
        message: "At least one field is required to update"
      });
    }

    const { error } = userSchema.validate(req.body, {
      allowUnknown: false
    });

    if (error) {
      return res.status(400).json({
        message: error.details[0].message
      });
    }

    if (Number(req.params.id) !== req.user.id) {
      return res.status(403).json({
        message: "You are not allowed to update this user"
      });
    }

    const user = await updateUserService(req.params.id, req.body);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    return res.status(200).json({
      message: "User updated successfully"
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        message: "Invalid user id"
      });
    }

    if (Number(id) !== req.user.id) {
      return res.status(403).json({
        message: "You are not allowed to delete this user"
      });
    }

    const deleted = await deleteUserService(id);

    if (!deleted) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    return res.status(200).json({
      message: "User deleted successfully"
    });

  } catch (error) {
    return res.status(500).json({
      message: "Internal server error"
    });
  }
};



module.exports = { createUser, loginUser, resetPassword,forgotPassword, verifyOtp, getUser, getUserById, updateUser, deleteUser }