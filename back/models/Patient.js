const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Patient = sequelize.define('Patient', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  firstName: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  dateNaissance: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  sexe: {
    type: DataTypes.ENUM('M', 'F'),
    allowNull: true
  },
  poids: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  taille: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  adresse: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  telephone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  traitementsChroniques: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  traitementsPonctuels: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  effetsIndesirables: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  sousContraceptif: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  structureEmission: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  serviceEmission: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  medecinPrescripteur: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  groupeSanguin: {
    type: DataTypes.ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
    allowNull: true
  },
  assurance: {
    type: DataTypes.STRING(120),
    allowNull: true
  }
}, {
  tableName: 'patients',
  timestamps: true,
  indexes: [
    { fields: ['lastName'] },
    { fields: ['firstName'] },
    { fields: ['dateNaissance'] }
  ]
});

// Méthodes d'instance
// Utilitaires
Patient.prototype.getAge = function() {
  if (this.dateNaissance) {
    const today = new Date();
    const birthDate = new Date(this.dateNaissance);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }
  return null;
};

module.exports = Patient; 