import express from 'express';
import cors from 'cors';
import multer from 'multer';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { createToken } from './token-creator.js';
import { buyToken } from './buy-token.js';
import { sequentialBuyTokens } from './jito.js';
import { getSOLPrice } from './binance-price.js';
import { sellToken } from './sell-token.js';
import { PORT } from './config.js';

const upload = multer();

// Swagger configuration
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'PumpFun API',
      version: '1.0.0',
      description: 'API for creating tokens on Pump.fun',
    },
    servers: [
      {
        url: 'https://legal-lucine-nightloveil-233e8e81.koyeb.app',
        description: 'Production server',
      },
      {
        url: `http://localhost:${PORT}`,
        variables: {
          port: {
            default: PORT,
          },
        },
        description: 'Development server',
      },
    ],
  },
  apis: ['./server.js'], // files containing annotations for swagger
};

const specs = swaggerJsdoc(options);


const app = express();

// Middleware
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

/**
 * @swagger
 * /:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns a simple message to confirm the API is running
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "PumpFun API is running!"
 */
// Routes
app.get('/', (req, res) => {
  res.json({ message: 'PumpFun API is running!' });
});

/**
 * @swagger
 * /api/create-token:
 *   post:
 *     summary: Create a new token on Pump.fun
 *     description: Creates a new token on the Solana blockchain via Pump.fun
 *     tags: [Tokens]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - symbol
 *               - image
 *               - privateKey
 *               - amount
 *             properties:
 *               name:
 *                 type: string
 *                 description: Token name
 *                 example: "MyToken"
 *               symbol:
 *                 type: string
 *                 description: Token symbol
 *                 example: "MTK"
 *               description:
 *                 type: string
 *                 description: Token description
 *                 example: "My custom token"
 *               twitter:
 *                 type: string
 *                 description: Twitter URL
 *                 example: "https://x.com/username"
 *               telegram:
 *                 type: string
 *                 description: Telegram URL
 *                 example: "https://t.me/groupname"
 *               website:
 *                 type: string
 *                 description: Website URL
 *                 example: "https://example.com"
 *               image:
 *                 type: string
 *                 description: Base64 encoded image string
 *                 example: "data:image/jpeg;base64,..."
 *               privateKey:
 *                 type: string
 *                 description: Private key in base58 format
 *                 example: "2d82FQEqKq2Qcvk3BtVfC4nhH2dLhdTapnWy1XrEeiNreSZFfCPzwkfLrDQjqnbXs78tv3wRQTJP3FEtonuqa6z2"
 *               amount:
 *                 type: number
 *                 description: Dev buy amount in SOL
 *                 example: 0.04
 *               priorityFee:
 *                 type: number
 *                 description: "Priority fee in SOL (default: 0.005)"
 *                 example: 0.005
 *     responses:
 *       200:
 *         description: Token created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Token created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     signature:
 *                       type: string
 *                       example: "5jN9..."
 *                     mintAddress:
 *                       type: string
 *                       example: "Ck..."
 *                     creatorAddress:
 *                       type: string
 *                       example: "4C..."
 *                     transactionUrl:
 *                       type: string
 *                       example: "https://solscan.io/tx/..."
 *                     metadataUri:
 *                       type: string
 *                       example: "https://..."
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Internal server error
 */
app.post('/api/create-token', async (req, res) => {
  try {
    const { name, symbol, description, twitter, telegram, website, image, privateKey, amount, priorityFee } = req.body;

    if (!name || !symbol || !image || !privateKey || amount === undefined || amount === null) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, symbol, image, privateKey, and amount are required'
      });
    }

    const result = await createToken({ name, symbol, description, twitter, telegram, website, image, privateKey, amount, priorityFee });
    
    res.json({
      success: true,
      message: 'Token created successfully',
      data: result
    });
  } catch (error) {
    console.error('Error creating token:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'An error occurred while creating the token'
    });
  }
});

/**
 * @swagger
 * /api/create-token-multipart:
 *   post:
 *     summary: Create a new token with multipart form data
 *     description: Create a new token with multipart form data for image upload
 *     tags: [Tokens]
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - symbol
 *               - image
 *               - privateKey
 *               - amount
 *             properties:
 *               name:
 *                 type: string
 *                 description: Token name
 *                 example: "MyToken"
 *               symbol:
 *                 type: string
 *                 description: Token symbol
 *                 example: "MTK"
 *               description:
 *                 type: string
 *                 description: Token description
 *                 example: "My custom token"
 *               twitter:
 *                 type: string
 *                 description: Twitter URL
 *                 example: "https://x.com/username"
 *               telegram:
 *                 type: string
 *                 description: Telegram URL
 *                 example: "https://t.me/groupname"
 *               website:
 *                 type: string
 *                 description: Website URL
 *                 example: "https://example.com"
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file for the token
 *               privateKey:
 *                 type: string
 *                 description: Private key in base58 format
 *                 example: "2d82FQEqKq2Qcvk3BtVfC4nhH2dLhdTapnWy1XrEeiNreSZFfCPzwkfLrDQjqnbXs78tv3wRQTJP3FEtonuqa6z2"
 *               amount:
 *                 type: number
 *                 description: Dev buy amount in SOL
 *                 example: 0.04
 *     responses:
 *       200:
 *         description: Token created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Token created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     signature:
 *                       type: string
 *                       example: "5jN9..."
 *                     mintAddress:
 *                       type: string
 *                       example: "Ck..."
 *                     creatorAddress:
 *                       type: string
 *                       example: "4C..."
 *                     transactionUrl:
 *                       type: string
 *                       example: "https://solscan.io/tx/..."
 *                     metadataUri:
 *                       type: string
 *                       example: "https://..."
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Internal server error
 */
// Alternative endpoint that accepts multipart form data for image upload
app.post('/api/create-token-multipart', upload.single('image'), async (req, res) => {
  try {
    const { name, symbol, description, twitter, telegram, website, privateKey, amount } = req.body;
    
    if (!name || !symbol || !req.file || !privateKey || amount === undefined || amount === null) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, symbol, image file, privateKey, and amount are required'
      });
    }
    
    // Convert the uploaded file to base64
    const imageBuffer = req.file.buffer;
    const imageBase64 = `data:image/${req.file.mimetype.split('/')[1]};base64,${imageBuffer.toString('base64')}`;
    
    const result = await createToken({ 
      name, 
      symbol, 
      description, 
      twitter, 
      telegram, 
      website, 
      image: imageBase64,
      privateKey,
      amount
    });
    
    res.json({
      success: true,
      message: 'Token created successfully',
      data: result
    });
  } catch (error) {
    console.error('Error creating token:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'An error occurred while creating the token'
    });
  }
});

/**
 * @swagger
 * /api/buy-token:
 *   post:
 *     summary: Buy tokens on Pump.fun
 *     description: Buys tokens on the Solana blockchain via Pump.fun
 *     tags: [Tokens]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mintAddress
 *               - privateKey
 *               - amount
 *             properties:
 *               mintAddress:
 *                 type: string
 *                 description: Token mint address to buy
 *                 example: "Ck..."
 *               privateKey:
 *                 type: string
 *                 description: Private key in base58 format
 *                 example: "2d82FQEqKq2Qcvk3BtVfC4nhH2dLhdTapnWy1XrEeiNreSZFfCPzwkfLrDQjqnbXs78tv3wRQTJP3FEtonuqa6z2"
 *               amount:
 *                 type: number
 *                 description: Amount in SOL to spend
 *                 example: 0.05
 *               slippage:
 *                 type: number
 *                 description: "Slippage percentage (default: 10)"
 *                 example: 10
 *               priorityFee:
 *                 type: number
 *                 description: "Priority fee in SOL (default: 0.005)"
 *                 example: 0.005
 *     responses:
 *       200:
 *         description: Token purchase successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Token purchase successful"
 *                 data:
 *                   type: object
 *                   properties:
 *                     signature:
 *                       type: string
 *                       example: "5jN9..."
 *                     transactionUrl:
 *                       type: string
 *                       example: "https://solscan.io/tx/..."
 *                     mintAddress:
 *                       type: string
 *                       example: "Ck..."
 *                     amountSpent:
 *                       type: number
 *                       example: 0.05
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Internal server error
 */
app.post('/api/buy-token', async (req, res) => {
  try {
    const { mintAddress, privateKey, amount, slippage, priorityFee } = req.body;

    if (!mintAddress || !privateKey || amount === undefined || amount === null) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: mintAddress, privateKey, and amount are required'
      });
    }

    const result = await buyToken({ mintAddress, privateKey, amount, slippage, priorityFee });
    
    res.json({
      success: true,
      message: 'Token purchase successful',
      data: result
    });
  } catch (error) {
    console.error('Error buying token:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'An error occurred while purchasing the token'
    });
  }
});

/**
 * @swagger
 * /api/sell-token:
 *   post:
 *     summary: Sell tokens on Pump.fun
 *     description: Sells tokens on the Solana blockchain via Pump.fun
 *     tags: [Tokens]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mintAddress
 *               - privateKey
 *               - amount
 *             properties:
 *               mintAddress:
 *                 type: string
 *                 description: Token mint address to sell
 *                 example: "Ck..."
 *               privateKey:
 *                 type: string
 *                 description: Private key in base58 format
 *                 example: "2d82FQEqKq2Qcvk3BtVfC4nhH2dLhdTapnWy1XrEeiNreSZFfCPzwkfLrDQjqnbXs78tv3wRQTJP3FEtonuqa6z2"
 *               amount:
 *                 type: number
 *                 description: Amount of tokens to sell
 *                 example: 1000000
 *               slippage:
 *                 type: number
 *                 description: "Slippage percentage (default: 10)"
 *                 example: 10
 *               priorityFee:
 *                 type: number
 *                 description: "Priority fee in SOL (default: 0.005)"
 *                 example: 0.005
 *     responses:
 *       200:
 *         description: Token sell successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Token sell successful"
 *                 data:
 *                   type: object
 *                   properties:
 *                     signature:
 *                       type: string
 *                       example: "5jN9..."
 *                     transactionUrl:
 *                       type: string
 *                       example: "https://solscan.io/tx/..."
 *                     mintAddress:
 *                       type: string
 *                       example: "Ck..."
 *                     amountSold:
 *                       type: number
 *                       example: 1000000
 *                     slippage:
 *                       type: number
 *                       example: 10
 *                     priorityFee:
 *                       type: number
 *                       example: 0.005
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Internal server error
 */
app.post('/api/sell-token', async (req, res) => {
  try {
    const { mintAddress, privateKey, amount, slippage, priorityFee } = req.body;

    if (!mintAddress || !privateKey || amount === undefined || amount === null) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: mintAddress, privateKey, and amount are required'
      });
    }

    const result = await sellToken({ mintAddress, privateKey, amount, slippage, priorityFee });
    
    res.json({
      success: true,
      message: 'Token sell successful',
      data: result
    });
  } catch (error) {
    console.error('Error selling token:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'An error occurred while selling the token'
    });
  }
});

/**
 * @swagger
 * /api/sequential-buy-tokens:
 *   post:
 *     summary: Perform sequential token purchases
 *     description: Performs sequential token purchases for an array of buy requests. Each wallet receives its response before the next wallet processes.
 *     tags: [Tokens]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - buyRequests
 *             properties:
 *               buyRequests:
 *                 type: array
 *                 description: Array of buy request objects
 *                 items:
 *                   type: object
 *                   required:
 *                     - mintAddress
 *                     - privateKey
 *                     - amount
 *                   properties:
 *                     mintAddress:
 *                       type: string
 *                       description: Token mint address to buy
 *                       example: "Ck..."
 *                     privateKey:
 *                       type: string
 *                       description: Private key in base58 format
 *                       example: "2d82FQEqKq2Qcvk3BtVfC4nhH2dLhdTapnWy1XrEeiNreSZFfCPzwkfLrDQjqnbXs78tv3wRQTJP3FEtonuqa6z2"
 *                     amount:
 *                       type: number
 *                       description: Amount in SOL to spend
 *                       example: 0.05
 *                     slippage:
 *                       type: number
 *                       description: "Slippage percentage (default: 10)"
 *                       example: 10
 *                     priorityFee:
 *                       type: number
 *                       description: "Priority fee in SOL (default: 0.005)"
 *                       example: 0.005
 *     responses:
 *       200:
 *         description: Sequential token purchases completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Sequential token purchases completed"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       index:
 *                         type: number
 *                         example: 0
 *                       success:
 *                         type: boolean
 *                         example: true
 *                       signature:
 *                         type: string
 *                         example: "5jN9..."
 *                       transactionUrl:
 *                         type: string
 *                         example: "https://solscan.io/tx/..."
 *                       mintAddress:
 *                         type: string
 *                         example: "Ck..."
 *                       amountSpent:
 *                         type: number
 *                         example: 0.05
 *                       slippage:
 *                         type: number
 *                         example: 10
 *                       error:
 *                         type: string
 *                         example: "Error message if failed"
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Internal server error
 */
app.post('/api/sequential-buy-tokens', async (req, res) => {
  try {
    const { buyRequests } = req.body;

    if (!buyRequests || !Array.isArray(buyRequests) || buyRequests.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: buyRequests must be a non-empty array'
      });
    }

    const results = await sequentialBuyTokens(buyRequests);
    
    res.json({
      success: true,
      message: 'Sequential token purchases completed',
      data: results
    });
  } catch (error) {
    console.error('Error in sequential token purchases:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'An error occurred during sequential token purchases'
    });
  }
});

/**
 * @swagger
 * /api/sol-price:
 *   get:
 *     summary: Get current SOL/USDT price from Binance
 *     description: Fetches the current price of SOL in USDT from Binance API
 *     tags: [Price]
 *     responses:
 *       200:
 *         description: Current SOL price retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 symbol:
 *                   type: string
 *                   example: "SOLUSDT"
 *                 price:
 *                   type: number
 *                   example: 98.45
 *                 timestamp:
 *                   type: number
 *                   example: 1678886400000
 *       500:
 *         description: Error retrieving price data
 */
app.get('/api/sol-price', async (req, res) => {
  try {
    const result = await getSOLPrice();
    res.json(result);
  } catch (error) {
    console.error('Error in SOL price endpoint:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'An error occurred while fetching SOL price',
      price: null
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;