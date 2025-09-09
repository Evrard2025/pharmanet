const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Medicament = sequelize.define('Medicament', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nomCommercial: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: 'Nom commercial du médicament'
  },
  dci: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: 'Dénomination Commune Internationale (nom générique)'
  },
  classeTherapeutique: {
    type: DataTypes.STRING(150),
    allowNull: false,
    comment: 'Classe thérapeutique du médicament'
  },
  formePharmaceutique: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Comprimé, sirop, injection, etc.'
  },
  dosage: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Dosage du médicament (ex: 500mg, 10mg/ml)'
  },
  laboratoire: {
    type: DataTypes.STRING(150),
    allowNull: true,
    comment: 'Laboratoire pharmaceutique'
  },
  indication: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Indications thérapeutiques'
  },
  contreIndication: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Contre-indications'
  },
  effetsSecondaires: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Effets secondaires principaux'
  },
  posologie: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Posologie recommandée'
  },
  interactions: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Interactions médicamenteuses'
  },
  surveillanceHepatique: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Nécessite une surveillance hépatique'
  },
  surveillanceRenale: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Nécessite une surveillance rénale'
  },
  frequenceSurveillance: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Fréquence de surveillance en mois (défaut: 3)'
  },
  parametresSurveillance: {
    type: DataTypes.TEXT,
    defaultValue: '[]',
    comment: 'Paramètres à surveiller (ex: ["ASAT", "ALAT", "Créatinine"])'
  },
  statut: {
    type: DataTypes.ENUM('actif', 'inactif', 'retire'),
    defaultValue: 'actif',
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  }
}, {
  tableName: 'medicaments',
  timestamps: true,
  indexes: [
    {
      fields: ['nomCommercial']
    },
    {
      fields: ['dci']
    },
    {
      fields: ['classeTherapeutique']
    },
    {
      fields: ['statut']
    }
  ]
});

// Méthodes d'instance
Medicament.prototype.requiresSurveillance = function() {
  return this.surveillanceHepatique || this.surveillanceRenale;
};

Medicament.prototype.getSurveillanceFrequency = function() {
  return this.frequenceSurveillance || 3; // Par défaut 3 mois
};

Medicament.prototype.getSurveillanceParameters = function() {
  const params = [];
  
  if (this.surveillanceHepatique) {
    params.push('ASAT', 'ALAT', 'Gamma-GT', 'Bilirubine');
  }
  
  if (this.surveillanceRenale) {
    params.push('Créatinine', 'Urée', 'Clairance créatinine');
  }
  
  return [...new Set([...params, ...this.parametresSurveillance])];
};

module.exports = { Medicament };
