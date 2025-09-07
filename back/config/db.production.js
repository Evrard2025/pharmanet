const { Sequelize } = require('sequelize');

// Configuration pour la production avec Aiven PostgreSQL
const dbName = process.env.DB_NAME || 'defaultdb',
  dbUser = process.env.DB_USER || 'avnadmin',
  dbPassword = process.env.DB_PASSWORD || 'YOUR_AIVEN_PASSWORD_HERE',
  dbHost = process.env.DB_HOST || 'YOUR_AIVEN_HOST_HERE',
  dbPort = process.env.DB_PORT || 28221;

// Certificat CA d'Aiven
const aivenCACert = `-----BEGIN CERTIFICATE-----
MIIEUDCCArigAwIBAgIUS3N1cjKxM9yWGxSnly/uJ9X8D08wDQYJKoZIhvcNAQEM
BQAwQDE+MDwGA1UEAww1ZmE2OGFiMjctYjY5Ny00ZjRlLThkNDEtMmUyODJkYzhk
NDg5IEdFTiAxIFByb2plY3QgQ0EwHhcNMjUwODI4MjMxODMzWhcNMzUwODI2MjMx
ODMzWjBAMT4wPAYDVQQDDDVmYTY4YWIyNy1iNjk3LTRmNGUtOGQ0MS0yZTI4MmRj
OGQ0ODkgR0VOIDEgUHJvamVjdCBDQTCCAaIwDQYJKoZIhvcNAQEBBQADggGPADCC
AYoCggGBAKrM0Joux1FmVsKh6GMlxqJB59q+htrG27n42P+i2GChP/k1Qht2+DGQ
qNfArR6W+tj/hbaRGbdBJNgEvVsVbowdNc032JgLr/riGb7/ZdDCq0onyCc5WAGA
ScPph3M8zth1Lkb6TpTgxTrpWiUoKb8WU/qJEyhYOEZXF5fZBc+4tlbBDV46UbXU
h9YaGUu1fu9QOxZ31IoXlr9uEWi1D3Z18J0gsju6Zi9IcPOUUYU1U3C2AvYCbn7t
kgqtH8+KFaYUo1BZtm/olLk1ela/m2GG/vdB6V1Ddh7ASM4mQsI4EC4J6CZr5Cf+
axXqodj4iFNo8KYUSkkUJTUG/uzSyPLQBOPtbU5yJdLoXSp/RTZWs1SJdg1pf12P
BbO+50DjwuRZLEMI78XRL43wN/et6QtV098NltSj6hp/3G8b+7ibql439UfomNIv
JsZrWoPyCo87vzg2e2JCoI5aQMvbwFyD9q89eqtZBjAuyYw6hGXTlSPG6SMjYnnn
MZBnOskCkQIDAQABo0IwQDAdBgNVHQ4EFgQUSWEtxEAevlZn25D8BXypqjHp+g8w
EgYDVR0TAQH/BAgwBgEB/wIBADALBgNVHQ8EBAMCAQYwDQYJKoZIhvcNAQEMBQAD
ggGBAKIrNCC63TGv3qjbzRq8qVI9DmQKBZSv+TpIaBw9zh8bY2VaEhFC6Ex5EcC7
7ChtnFUw5XCx5SacEHaLOttZMS8ObCuzP+YlfGkpk2xNrGvn3ooCVhmjZnA1K5lu
kZWfajeha7zKlqdnORMQRvUmXlwWp6bTpeQnk4aHV3GAz71m5i/95nzBYhtRRFam
CUWGzrQrpWegoX5rVwFQOOkWj+WUio8OqubYT37FriAgFTu9/NXWTVt80dOQnml3
lP/tYy6hh+AxK1pe+wMyWTiKdDgFXMiDjOrl6OI8VunEyz+AO6cfOaBoJIRcCfJj
CIFnU3kjtEE5++Kb/YMmILAvXYpldpI/LNtERhxy+iUNXFoPFGp5Kv0O4g0zxzHi
GReGC8MDQdzXlj/jjgEoMNXdLtPUOWGVZOVnG7plqXZ8ckLCMfAOaNd/yeTL+Egi
GzzvSuVbfWo51LNUXuIbsf5x420lLcVq2SFx8W74B7SCRPc/xhlRAGC6lsxTJOnH
Ac3B8A==
-----END CERTIFICATE-----`;

// Construire la chaîne de connexion avec SSL
const connectionString = `postgres://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}?sslmode=require`;

const sequelize = new Sequelize(connectionString, {
  dialect: 'postgres',
  logging: false, // Pas de logs en production
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: true, // Utiliser le vrai certificat CA
      ca: aivenCACert // Certificat CA d'Aiven
    },
    // Forcer SSL pour toutes les connexions
    sslmode: 'require'
  },
  pool: {
    max: 20, // Limite de connexion Aiven
    min: 2,
    acquire: 30000,
    idle: 10000
  },
  // Configuration SSL pour toutes les connexions du pool
  ssl: true,
  define: {
    timestamps: true,
    underscored: true
  }
});

const connectDB = async () => {
  try {
    console.log('Tentative de connexion à PostgreSQL avec certificat CA Aiven...');
    console.log('Host:', dbHost);
    console.log('Port:', dbPort);
    console.log('Database:', dbName);
    console.log('User:', dbUser);
    console.log('Connection String:', connectionString.replace(dbPassword, '***'));
    
    await sequelize.authenticate();
    console.log('Connexion PostgreSQL production établie avec succès.');
    
    // Importer les modèles pour définir les associations
    require('../models/index');
    
    // Synchroniser les modèles avec la base de données (force: false pour éviter les conflits)
    await sequelize.sync({ force: false, alter: false });
    console.log('Modèles synchronisés avec la base de données production.');
  } catch (error) {
    console.error('Erreur de connexion PostgreSQL production:', error);
    console.error('Détails de l\'erreur:', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
