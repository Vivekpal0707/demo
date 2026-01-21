const bcrypt = require("bcrypt");
const crypto = require('crypto');
const { UserModel } = require("../models/userModel");
const jwt = require("jsonwebtoken");
const { sendOtpEmail, sendMail, sendResetPasswordEmail} = require("./emailService");

const createUserService = async (userData) => {
  const { password, name, email, ...rest } = userData;

  const existingUser = await UserModel.findOne({
    where: { email }
  });

  if (existingUser) {
    const error = new Error("Email already exists");
    error.statusCode = 409;
    throw error;
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    await UserModel.create({
      name,
      email,
      ...rest,
      password: hashedPassword
    });

    try {
      await sendMail(
        email,
        "Welcome to Our App",
        `
          <h2>Welcome</h2>
          <p>Hi ${name}</p>
          <p>Email: ${email}</p>
          <a href="https://www.google.com">Google</a>
        `
      );
    } catch (mailError) {
      console.log("MAIL FAILED:", mailError.message);
    }

    return true;

  } catch (error) {
    console.log("DB ERROR:", error.message);
    throw error;
  }
};

const loginUserService = async (email, password) => {
  const user = await UserModel.findOne({ where: { email } });

  if (!user) {
    throw { status: 401, message: "Invalid credentials" };
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw { status: 401, message: "Invalid credentials" };
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

  await user.reload();
  await user.update({ otp, otpExpiry });

  await sendOtpEmail(user.email, otp);

  return true;
};

const resetPasswordService = async (userId, currentPassword, newPassword) => {
  const user = await UserModel.findOne({
    where: { id: userId, deletedAt: null }
  });

  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    const err = new Error("Current password is incorrect");
    err.status = 401;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await user.update({
    password: hashedPassword,
    otp: null,
    otpExpiry: null
  });

  return true;
};

const forgotPasswordService = async (email) => {
  const user = await UserModel.findOne({
    where: {
      email,
      deletedAt: null
    }
  });

  if (!user) {
    throw { status: 404, message: "User not found" };
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); 

  await user.update({
    resetToken,
    resetTokenExpiry
  });

  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  await sendResetPasswordEmail(user.email, resetLink);

  return true;
};

const verifyOtpService = async (otp) => {
  const users = await UserModel.findAll({
    where: { otp }
  });

  if (!users || users.length === 0) {
    throw { status: 401, message: "Invalid OTP" };
  }

  const validUser = users.find(
    user => new Date() <= user.otpExpiry
  );

  if (!validUser) {
    throw { status: 401, message: "OTP expired" };
  }

  const token = jwt.sign(
    { id: validUser.id },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );


  await validUser.update({
    otp: null,
    otpExpiry: null
  });

  return token;
};

const getAllUsersService = async () => {
  const users = await UserModel.findAll({
    attributes: ['id', 'name', 'email'],
    where: {
      deletedAt: null   
    }
  });

  return users;
};


const getUserByIdService = async (userId) => {
  const user = await UserModel.findByPk(userId, {
    attributes: ['id', 'name', 'email']
  });
  return user;
};

const updateUserService = async (userId, updateData) => {
  const user = await UserModel.findByPk(userId);

  if (!user) {
    return null;
  }

  await user.update(updateData);
  return user;
};


const deleteUserService = async (userId) => {
  const user = await UserModel.findByPk(userId);

  if (!user) return false;

  await user.destroy(); 
  return true;
};



module.exports = {
  createUserService, loginUserService, resetPasswordService,forgotPasswordService, verifyOtpService, getAllUsersService, getUserByIdService, updateUserService, deleteUserService
};


