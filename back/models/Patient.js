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
    type: DataTypes.TEXT,
    defaultValue: '[]',
    get() {
      const value = this.getDataValue('traitementsChroniques');
      try {
        return value ? JSON.parse(value) : [];
      } catch (e) {
        return [];
      }
    },
    set(value) {
      this.setDataValue('traitementsChroniques', JSON.stringify(value || []));
    }
  },
  traitementsPonctuels: {
    type: DataTypes.TEXT,
    defaultValue: '[]',
    get() {
      const value = this.getDataValue('traitementsPonctuels');
      try {
        return value ? JSON.parse(value) : [];
      } catch (e) {
        return [];
      }
    },
    set(value) {
      this.setDataValue('traitementsPonctuels', JSON.stringify(value || []));
    }
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
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  numeroSecu: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'numerosecu'
  },
  lieuNaissance: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'lieunaissance'
  },
  nationalite: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  profession: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  situationFamiliale: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'situationfamiliale'
  },
  nombreEnfants: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    field: 'nombreenfants'
  },
  allergies: {
    type: DataTypes.TEXT,
    defaultValue: '[]',
    get() {
      const value = this.getDataValue('allergies');
      try {
        return value ? JSON.parse(value) : [];
      } catch (e) {
        return [];
      }
    },
    set(value) {
      this.setDataValue('allergies', JSON.stringify(value || []));
    }
  },
  antecedentsMedicaux: {
    type: DataTypes.TEXT,
    defaultValue: '[]',
    field: 'antecedentsmedicaux',
    get() {
      const value = this.getDataValue('antecedentsMedicaux');
      try {
        return value ? JSON.parse(value) : [];
      } catch (e) {
        return [];
      }
    },
    set(value) {
      this.setDataValue('antecedentsMedicaux', JSON.stringify(value || []));
    }
  },
  antecedentsChirurgicaux: {
    type: DataTypes.TEXT,
    defaultValue: '[]',
    field: 'antecedentschirurgicaux',
    get() {
      const value = this.getDataValue('antecedentsChirurgicaux');
      try {
        return value ? JSON.parse(value) : [];
      } catch (e) {
        return [];
      }
    },
    set(value) {
      this.setDataValue('antecedentsChirurgicaux', JSON.stringify(value || []));
    }
  },
  antecedentsFamiliaux: {
    type: DataTypes.TEXT,
    defaultValue: '[]',
    field: 'antecedentsfamiliaux',
    get() {
      const value = this.getDataValue('antecedentsFamiliaux');
      try {
        return value ? JSON.parse(value) : [];
      } catch (e) {
        return [];
      }
    },
    set(value) {
      this.setDataValue('antecedentsFamiliaux', JSON.stringify(value || []));
    }
  },
  medecinTraitant: {
    type: DataTypes.STRING(150),
    allowNull: true,
    field: 'medecintraitant'
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