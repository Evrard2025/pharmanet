const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Forcer SSL pour toutes les connexions PostgreSQL
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const app = express();
const PORT = process.env.PORT || 3000;

// Utiliser la même instance Sequelize que les modèles
const { sequelize } = require('./config/db');

// Configuration pour Render (proxy)
app.set('trust proxy', 1);

// Middleware de sécurité
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://test-pharma.netlify.app',
    'https://pharmanet.netlify.app',
    'https://pharmanet-frontend.netlify.app',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limite chaque IP à 100 requêtes par windowMs
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Route de test
app.get('/', (req, res) => {
  res.json({ 
    message: 'PharmaNet API - Backend opérationnel',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Endpoint de santé
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Fonction de connexion à la base de données (version simplifiée)
const connectDB = async () => {
  try {
    console.log('🔧 Configuration Aiven détectée');
    console.log('Tentative de connexion à PostgreSQL avec SSL...');
    
    // Test de connexion
    await sequelize.authenticate();
    console.log('✅ Connexion PostgreSQL établie avec succès.');
    
    // Vérifier les tables existantes
    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log('📋 Tables existantes:', tables);
    
    // Charger tous les modèles
    console.log('📋 Chargement des modèles...');
    require('./models/User');
    require('./models/Patient');
    require('./models/Medicament');
    require('./models/Prescription');
    require('./models/Consultation');
    require('./models/SurveillanceBiologique');
    console.log('✅ Modèles chargés');

    // NE PAS utiliser sync() pour éviter les erreurs SQL
    console.log('✅ Base de données prête (pas de synchronisation forcée)');
    
    // Vérifier que les tables existent
    const newTables = await sequelize.getQueryInterface().showAllTables();
    console.log('📋 Tables disponibles:', newTables);
    console.log('📊 Nombre de tables:', newTables.length);
    
  } catch (error) {
    console.error('❌ Erreur de connexion PostgreSQL:', error.message);
    process.exit(1);
  }
};

// Fonction pour charger les routes
const loadRoutes = () => {
  try {
    console.log('🔄 Chargement des routes...');
    
    // Routes
    app.use('/api/auth', require('./routes/auth'));
    app.use('/api/users', require('./routes/users'));
    app.use('/api/patients', require('./routes/patients'));
    app.use('/api/medicaments', require('./routes/medicaments'));
    app.use('/api/prescriptions', require('./routes/prescriptions'));
    app.use('/api/consultations', require('./routes/consultations'));
    app.use('/api/surveillance-biologique', require('./routes/surveillance-biologique'));
    app.use('/api/dashboard', require('./routes/dashboard'));
    app.use('/api/loyalty', require('./routes/loyalty'));
    app.use('/api/admin-users', require('./routes/admin-users'));

    // Gestion des routes non trouvées
    app.use('*', (req, res) => {
      res.status(404).json({ 
        message: 'Route non trouvée',
        path: req.originalUrl
      });
    });
    
    console.log('✅ Routes chargées avec succès');
  } catch (error) {
    console.error('❌ Erreur lors du chargement des routes:', error);
    throw error;
  }
};

// Démarrage du serveur
const startServer = async () => {
  try {
    await connectDB();
    loadRoutes();
    
    app.listen(PORT, () => {
      console.log(`🌐 URL: ${process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`}`);
      console.log(`🗄️  Base de données: ${process.env.NODE_ENV === 'production' ? 'Aiven PostgreSQL' : 'PostgreSQL Local'}`);
      console.log(`✅ Déploiement réussi !`);
    });
  } catch (error) {
    console.error('❌ Erreur de démarrage:', error);
    process.exit(1);
  }
};

startServer();
