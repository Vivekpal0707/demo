const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const UserModel = sequelize.define('employee', {
  name: DataTypes.STRING,

  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },

  password: {
    type: DataTypes.STRING,
    allowNull: false
  },

  otp: {
    type: DataTypes.STRING,
    allowNull: true
  },

  otpExpiry: {
    type: DataTypes.DATE,
    allowNull: true
  },

  resetToken: {
    type: DataTypes.STRING,
    allowNull: true
  },

  resetTokenExpiry: {
    type: DataTypes.DATE,
    allowNull: true
  },

  deletedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }

}, {
  freezeTableName: true,
  timestamps: true,
  paranoid: true   
});

module.exports = { UserModel }
