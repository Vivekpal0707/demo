const bcrypt = require("bcrypt");
const { Op } = require("sequelize");
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

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await UserModel.create({
    name,
    email,
    ...rest,
    password: hashedPassword
  });

  try {
    await sendMail({
      to: email,
      subject: "Welcome to Our App",
      html: `
        <h2>Welcome</h2>
        <p>Hi ${name}</p>
        <p>Email: ${email}</p>
        <a href="https://www.google.com">Google</a>
      `
    });
  } catch (mailError) {
    console.error("Welcome mail failed:", mailError.message);
  }
  return user;
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

  await user.update({ otp, otpExpiry });

  await sendOtpEmail(user.email, otp);

  return user; 
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
    where: { email, deletedAt: null }
  });

  if (!user) return true; 

  const verifyToken = jwt.sign(
    { id: user.id, type: "VERIFY_FORGOT" },
    process.env.JWT_SECRET,
    { expiresIn: "30m" }
  );

  await user.update({ resetToken: verifyToken });

  const link = `${verifyToken}`;

  await sendResetPasswordEmail(user.email, link);

  return true;
};

const verifyForgotLinkService = async (token) => {
  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new Error("Verification link expired");
  }

  if (decoded.type !== "VERIFY_FORGOT") {
    throw new Error("Invalid verification link");
  }

  const user = await UserModel.findOne({
    where: {
      id: decoded.id,
      resetToken: token,
      deletedAt: null
    }
  });

  if (!user) {
    throw new Error("Invalid or already used verification link");
  }

  const resetToken = jwt.sign(
    { id: user.id, type: "RESET_PASSWORD" },
    process.env.JWT_SECRET,
    { expiresIn: "30m" }
  );

  await user.update({ resetToken });

  return resetToken;
};

const resetForgotPasswordService = async (userId, token, newPassword) => {
  const user = await UserModel.findOne({
    where: {
      id: userId,
      resetToken: token,
      deletedAt: null
    }
  });

  if (!user) {
    throw new Error("Invalid reset link");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await user.update({
    password: hashedPassword,
    resetToken: null
  });

  return true;
};

exports.resetPasswordService = async (token, newPassword) => {
  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new Error("Reset link expired");
  }

  if (decoded.type !== "RESET_PASSWORD") {
    throw new Error("Invalid reset token");
  }

  const user = await UserModel.findOne({
    where: {
      id: decoded.id,
      resetToken: token,
      deletedAt: null
    }
  });

  if (!user) {
    throw new Error("Invalid reset token");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await user.update({
    password: hashedPassword,
    resetToken: null
  });

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

const getAllUsersService = async (
  page = 1,
  limit = 5,
  search,
  startDate,
  endDate
) => {
  const offset = (page - 1) * limit;

  const whereCondition = {
    deletedAt: null
  };

  if (search) {
    whereCondition[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } }
    ];
  }

  if (startDate && endDate) {
    whereCondition.createdAt = {
      [Op.between]: [startDate, endDate]
    };
  }

  const users = await UserModel.findAll({
    attributes: ['id', 'name', 'email', 'createdAt'],
    where: whereCondition,
    limit,
    offset,
    order: [['id', 'ASC']]
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

  const { password, ...safeUpdateData } = updateData;

  await user.update(safeUpdateData);

  return user;
};

const deleteUserService = async (userId) => {
  const user = await UserModel.findByPk(userId);

  if (!user) return false;

  await user.destroy(); 
  return true;
};



module.exports = {
  createUserService, loginUserService, resetPasswordService,forgotPasswordService,verifyForgotLinkService,resetForgotPasswordService, verifyOtpService, getAllUsersService, getUserByIdService, updateUserService, deleteUserService
};


