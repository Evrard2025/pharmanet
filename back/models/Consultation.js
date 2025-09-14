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
  // Informations du médicament
  nomMedicament: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: 'Nom commercial du médicament'
  },
  dciMedicament: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: 'DCI (Dénomination Commune Internationale)'
  },
  classeTherapeutique: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Classe thérapeutique du médicament'
  },
  posologie: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Posologie prescrite'
  },
  quantite: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Quantité prescrite'
  },
  unite: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'comprimé',
    comment: 'Unité de mesure'
  },
  // Période de prise
  dateDebutPrise: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: 'Date de début de prise'
  },
  dateFinPrise: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: 'Date de fin de prise'
  },
  // Effets indésirables et suivi
  effetsIndesirablesSignales: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Effets indésirables signalés par le patient'
  },
  observance: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'Observance du traitement (bonne, moyenne, mauvaise)',
    validate: {
      isIn: [['bonne', 'moyenne', 'mauvaise']]
    }
  },
  statut: {
    type: DataTypes.ENUM('en_cours', 'termine', 'arrete'),
    defaultValue: 'en_cours',
    allowNull: false,
    comment: 'Statut du traitement'
  },
  precaution: {
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
