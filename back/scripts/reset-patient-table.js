/*
  Script: reset-patient-table.js
  Usage: node scripts/reset-patient-table.js
  Drops the 'patients' table then recreates it according to the current Sequelize model definitions.
*/

require('dotenv').config();

const { sequelize, connectDB } = require('../config/db');

// Ensure models and associations are registered
require('../models');

async function resetPatientTable() {
  try {
    await connectDB();

    const queryInterface = sequelize.getQueryInterface();

    console.log("Dropping table 'patients' if it exists...");
    await queryInterface.dropTable('patients').catch((err) => {
      console.warn("Warning while dropping 'patients' table:", err.message || err);
    });

    console.log('Recreating tables from models...');
    await sequelize.sync({ alter: true });

    console.log("'patients' table reset successfully.");
    process.exit(0);
  } catch (error) {
    console.error('Failed to reset patients table:', error);
    process.exit(1);
  }
}

resetPatientTable();


