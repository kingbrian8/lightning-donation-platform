// Main backend server file
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Manually load .env file
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

// Config
import lndConfig from './config/lnd-config.js';
import serverConfig from './config/server-config.js';

// Components
import LightningClient from './lightning.js';
import InvoiceGenerator from './invoice-generator.js';
import DonationTracker from './donation-tracker.js';
import ProofManager from './proof-manager.js';
import StatusMonitor from './status-monitor.js';
import AIService from './ai-service.js';
import ConverterService from './converter-service.js';

// Routes
import createApiRoutes from './routes/api.js';
import createAIRoutes from './routes/ai.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();
const PORT = serverConfig.port;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// Initialize Components
const lightningClient = new LightningClient(lndConfig);
const donationTracker = new DonationTracker(serverConfig.dataFilePath);
const invoiceGenerator = new InvoiceGenerator(lightningClient);
const proofManager = new ProofManager(donationTracker);
const statusMonitor = new StatusMonitor(lightningClient, donationTracker, proofManager);
const aiService = new AIService(process.env.GEMINI_API_KEY);
const converterService = new ConverterService();

// Connect to LND
(async () => {
  try {
    console.log(`Connecting to Lightning Network at ${lndConfig.lndSocket}...`);
    console.log(`Cert path: ${lndConfig.tlsCertPath}`);
    console.log(`Macaroon path: ${lndConfig.macaroonPath}`);
    await lightningClient.connect();
    const nodeInfo = await lightningClient.getNodeInfo();
    console.log(`Connected to LND node: ${nodeInfo.alias} (${nodeInfo.publicKey})`);
  } catch (err) {
    console.warn('Failed to connect to LND (skipping connection for AI tests):', err.message);
  }
})();

// Mount API routes
app.use('/api', createApiRoutes(invoiceGenerator, statusMonitor, lightningClient, donationTracker));
app.use('/api/ai', createAIRoutes(aiService, converterService));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Flash Aid server running on port ${PORT}`);
  console.log(`Frontend: http://localhost:${PORT}`);
  console.log(`API: http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  donationTracker.saveToDisk(); // Ensure data is saved
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down gracefully...');
  donationTracker.saveToDisk();
  process.exit(0);
});