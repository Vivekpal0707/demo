const bcrypt = require("bcrypt");
const { UserModel } = require("../models/userModel");
const jwt = require("jsonwebtoken");
const { sendOtpEmail, sendMail } = require("./emailService");

const createUserService = async (userData) => {
    const { password, name, email, ...rest } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const existingUser = await UserModel.findOne({
        where: { email: email }
      });
      if (existingUser) {
        throw new Joi.ValidationError(
          "Duplicate email",
          [
            {
              message: "Email already exists",
              path: ["email"],
              type: "any.duplicate"
            }
          ],
          value
        );
      }
    else{
  try {
        await UserModel.create({
            name,
            email,
            ...rest,
            password: hashedPassword
        });

        try {
            await sendMail(
                email,
                "Welcome to Our App ",
                `
                    <h2>Welcome </h2>
                    <p>Hi ${name}</p>
                    <p>Email: ${email}</p>
                    <a href="https://www.google.com">Google</a>
                `
            );
        } catch (mailError) {
            console.log("MAIL FAILED ", mailError.message);

        }

        return true;

    } catch (error) {
        console.log("DB ERROR ", error.message);
        throw error;
    }
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

const verifyOtpService = async (email, otp) => {
    const user = await UserModel.findOne({ where: { email } });

    if (!user || user.otp !== otp) {
        throw { status: 401, message: "Invalid OTP" };
    }

    if (new Date() > user.otpExpiry) {
        throw { status: 401, message: "OTP expired" };
    }

    const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );

    await user.update({ otp: null, otpExpiry: null });

    return token;
};

const getAllUsersService = async () => {
    const users = await UserModel.findAll();
    return users;
};

const getUserByIdService = async (userId) => {
    const user = await UserModel.findByPk(userId);
    return user;
};

module.exports = {
    createUserService, loginUserService, verifyOtpService, getAllUsersService, getUserByIdService
};


