import express from 'express';
import cors from 'cors';
import { PORT } from './config/index.js';
import routes from './routes/index.js';
import { swaggerMiddleware } from './middleware/swagger.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { logger } from './lib/logger.js';

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Swagger UI
app.use('/api-docs', ...swaggerMiddleware);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'pumpfun-api'
  });
});

// Routes
app.use('/', routes);

// Error handling
app.use(errorHandler);
app.use(notFoundHandler);

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});

export default app;
