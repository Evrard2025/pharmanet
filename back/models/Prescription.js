const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Prescription = sequelize.define('Prescription', {
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
  numeroPrescription: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  medecinPrescripteur: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  datePrescription: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  dateDebut: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  dateFin: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  diagnostic: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  indication: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  statut: {
    type: DataTypes.ENUM('active', 'terminee', 'annulee', 'renouvellement'),
    defaultValue: 'active',
    allowNull: false
  },
  typePrescription: {
    type: DataTypes.ENUM('courte', 'longue', 'renouvellement', 'urgence'),
    defaultValue: 'courte',
    allowNull: false
  },
  ordonnance: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  notesPharmacien: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isRenouvelable: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  nombreRenouvellements: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  renouvellementsRestants: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  }
}, {
  tableName: 'prescriptions',
  timestamps: true,
  indexes: [
    {
      fields: ['patientId']
    },
    {
      fields: ['numeroPrescription']
    },
    {
      fields: ['datePrescription']
    },
    {
      fields: ['statut']
    },
    {
      fields: ['medecinPrescripteur']
    }
  ]
});

// Modèle pour les médicaments prescrits
const PrescriptionMedicament = sequelize.define('PrescriptionMedicament', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  prescriptionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'prescriptions',
      key: 'id'
    }
  },
  nom: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  categorie: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  marque: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  posologie: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  duree: {
    type: DataTypes.INTEGER, // en jours
    allowNull: true
  },
  quantite: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  unite: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'comprimé'
  },
  dateDebutPrise: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  dateFinPrise: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  precaution: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  statut: {
    type: DataTypes.ENUM('en_cours', 'termine', 'arrete'),
    defaultValue: 'en_cours',
    allowNull: false
  },
  dateDebutPrise: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  dateFinPrise: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  observance: {
    type: DataTypes.ENUM('bonne', 'moyenne', 'mauvaise'),
    allowNull: true
  },
  effetsSecondaires: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'prescription_medicaments',
  timestamps: true
});

// Méthodes d'instance
Prescription.prototype.isExpired = function() {
  if (this.dateFin) {
    return new Date() > new Date(this.dateFin);
  }
  return false;
};

Prescription.prototype.canBeRenewed = function() {
  return this.isRenouvelable && this.renouvellementsRestants > 0;
};

Prescription.prototype.renew = async function() {
  if (this.canBeRenewed()) {
    this.renouvellementsRestants--;
    if (this.renouvellementsRestants === 0) {
      this.statut = 'terminee';
    }
    await this.save();
  }
  return this;
};

Prescription.prototype.getDuree = function() {
  if (this.dateDebut && this.dateFin) {
    const debut = new Date(this.dateDebut);
    const fin = new Date(this.dateFin);
    const diffTime = Math.abs(fin - debut);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
  return null;
};

module.exports = { Prescription, PrescriptionMedicament }; 