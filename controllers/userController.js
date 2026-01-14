const Joi = require('joi');
const { userSchema } = require('../middlewares/userValidate');
const { UserModel } = require('../models/userModel');
const { createUserService } = require("../services/userService")
const { loginUserService } = require("../services/userService");
const { verifyOtpService } = require("../services/userService");
const { getAllUsersService } = require("../services/userService");
const { getUserByIdService } = require("../services/userService");


const createUser = async (req, res) => {
    try {
        await userSchema.validateAsync(req.body, { abortEarly: false });
    } catch (error) {
        return res.status(400).json({
            message: "Validation error",
            details: error.details.map(err => err.message)
        });
    }

    try {
        const saved = await createUserService(req.body);

        if (saved) {
            return res.status(201).json({
                message: "User created successfully",
                success: true
            });
        }

        return res.status(500).json({
            message: "Something went wrong",
            success: false
        });

    } catch (error) {

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

    console.log(error);
    return res.status(500).json({
      message: "Something went wrong",
      error: error.message
    });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        message: "Email and OTP required"
      });
    }

    const token = await verifyOtpService(email, otp);

    return res.status(200).json({
      message: "Login successful",
      token: `bearer ${token}`
    });

  } catch (error) {
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
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};


const updateUser = async (req, res) => {
  try {
    const { error } = userSchema.validate(req.boy);
    if (error) return res.status(400).json({ message: error.details[0].message })

    const user = await UserModel.findByPk(req.params.id);
    if (!user) return res.status(500).json({ error: "User not found" });

    await user.update(req.body);
    return res.status(200).json({ message: "User updated" })

  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.message })
  }

};

const deleteUser = async (req, res) => {
  try {
    const user = await UserModel.findByPk(req.params.id);
    if (!user) return res.status(500).json({ error: "User not found" });
    await user.destroy();
    return res.status(200).json({ message: "User deleted" })


  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.message })

  }

};

module.exports = { createUser, loginUser, verifyOtp, getUser, getUserById, updateUser, deleteUser }