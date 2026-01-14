const { Sequelize } = require('sequelize');
require('dotenv').config();   

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT
  }
);

const dbconection = async () => {
   
    try {
        await sequelize.authenticate();
        console.log('DBConnection has been successfully.');
    } catch (error) {
        console.error('Unable to DBconnect to the database:', error);
    }

}
module.exports = {dbconection, sequelize};