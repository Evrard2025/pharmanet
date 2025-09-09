const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const SurveillanceBiologique = sequelize.define('SurveillanceBiologique', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  patientId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'patients',
      key: 'id'
    }
  },
  medicamentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'medicaments',
      key: 'id'
    },
    comment: 'Médicament associé à cette surveillance (optionnel)'
  },
  typeSurveillance: {
    type: DataTypes.ENUM('hepatique', 'renale', 'mixte', 'autre'),
    allowNull: false,
    comment: 'Type de surveillance biologique'
  },
  parametres: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '[]',
    comment: 'Paramètres biologiques à surveiller'
  },
  frequenceMois: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 3,
    comment: 'Fréquence de surveillance en mois'
  },
  dateDebut: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: 'Date de début de la surveillance'
  },
  dateProchaineAnalyse: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: 'Date de la prochaine analyse prévue'
  },
  dateDerniereAnalyse: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: 'Date de la dernière analyse effectuée'
  },
  resultatsDerniereAnalyse: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Résultats de la dernière analyse (format JSON)'
  },
  statut: {
    type: DataTypes.ENUM('active', 'en_attente', 'terminee', 'annulee'),
    defaultValue: 'active',
    allowNull: false
  },
  priorite: {
    type: DataTypes.ENUM('basse', 'normale', 'haute', 'urgente'),
    defaultValue: 'normale',
    allowNull: false
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Notes et observations du professionnel de santé'
  },
  laboratoire: {
    type: DataTypes.STRING(150),
    allowNull: true,
    comment: 'Laboratoire partenaire pour les analyses'
  },
  contactLaboratoire: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: 'Contact du laboratoire partenaire'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  }
}, {
  tableName: 'surveillance_biologique',
  timestamps: true,
  indexes: [
    {
      fields: ['patientId']
    },
    {
      fields: ['medicamentId']
    },
    {
      fields: ['dateProchaineAnalyse']
    },
    {
      fields: ['statut']
    },
    {
      fields: ['typeSurveillance']
    }
  ]
});

// Méthodes d'instance
SurveillanceBiologique.prototype.isOverdue = function() {
  if (!this.dateProchaineAnalyse) return false;
  return new Date() > new Date(this.dateProchaineAnalyse);
};

SurveillanceBiologique.prototype.getDaysUntilNextAnalysis = function() {
  if (!this.dateProchaineAnalyse) return null;
  const today = new Date();
  const nextAnalysis = new Date(this.dateProchaineAnalyse);
  const diffTime = nextAnalysis - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

SurveillanceBiologique.prototype.calculateNextAnalysisDate = function() {
  if (!this.dateDerniereAnalyse) {
    return this.dateDebut;
  }
  
  const lastAnalysis = new Date(this.dateDerniereAnalyse);
  const nextDate = new Date(lastAnalysis);
  nextDate.setMonth(nextDate.getMonth() + this.frequenceMois);
  
  return nextDate;
};

SurveillanceBiologique.prototype.updateNextAnalysisDate = async function() {
  this.dateProchaineAnalyse = this.calculateNextAnalysisDate();
  await this.save();
  return this;
};

SurveillanceBiologique.prototype.addResult = async function(resultats, dateAnalyse = new Date()) {
  this.dateDerniereAnalyse = dateAnalyse;
  this.resultatsDerniereAnalyse = resultats;
  await this.updateNextAnalysisDate();
  return this;
};

module.exports = { SurveillanceBiologique };
