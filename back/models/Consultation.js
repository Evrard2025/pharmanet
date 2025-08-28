const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Consultation = sequelize.define('Consultation', {
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
  numeroConsultation: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  medecinConsultant: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  dateConsultation: {
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
  periodePrise: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Période de prise (ex: "matin", "midi", "soir", "avant repas", "après repas")'
  },
  datePriseMedicament: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: 'Date de début de prise du médicament'
  },
  medicamentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'medicaments',
      key: 'id'
    },
    comment: 'Médicament prescrit lors de cette consultation'
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
  typeConsultation: {
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
  tableName: 'consultations',
  timestamps: true,
  indexes: [
    {
      fields: ['patientId']
    },
    {
      fields: ['numeroConsultation']
    },
    {
      fields: ['dateConsultation']
    },
    {
      fields: ['statut']
    },
    {
      fields: ['medecinConsultant']
    }
  ]
});

// Modèle pour les médicaments prescrits lors de la consultation
const ConsultationMedicament = sequelize.define('ConsultationMedicament', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  consultationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'consultations',
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
  momentPrise: {
    type: DataTypes.ARRAY(DataTypes.STRING), // ['matin', 'midi', 'soir']
    defaultValue: []
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
  tableName: 'consultation_medicaments',
  timestamps: true
});

// Méthodes d'instance
Consultation.prototype.isExpired = function() {
  if (this.dateFin) {
    return new Date() > new Date(this.dateFin);
  }
  return false;
};

Consultation.prototype.canBeRenewed = function() {
  return this.isRenouvelable && this.renouvellementsRestants > 0;
};

Consultation.prototype.renew = async function() {
  if (this.canBeRenewed()) {
    this.renouvellementsRestants--;
    if (this.renouvellementsRestants === 0) {
      this.statut = 'terminee';
    }
    await this.save();
  }
  return this;
};

Consultation.prototype.getDuree = function() {
  if (this.dateDebut && this.dateFin) {
    const debut = new Date(this.dateDebut);
    const fin = new Date(this.dateFin);
    const diffTime = Math.abs(fin - debut);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
  return null;
};

module.exports = { Consultation, ConsultationMedicament };
