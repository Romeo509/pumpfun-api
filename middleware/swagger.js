import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { PORT } from '../config/index.js';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'PumpFun API',
      version: '1.0.0',
      description: 'API for creating and trading tokens on Pump.fun'
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server'
      }
    ]
  },
  apis: ['./routes/*.js'] // Route files containing Swagger annotations
};

export const specs = swaggerJsdoc(options);

export const swaggerMiddleware = [
  swaggerUi.serve,
  swaggerUi.setup(specs)
];
