import { Router } from 'express';
import healthRoutes from './health.js';
import tokenRoutes from './tokens.js';
import priceRoutes from './price.js';

const router = Router();

// Health routes (includes root /)
router.use('/', healthRoutes);

// Token routes
router.use('/api', tokenRoutes);

// Price routes
router.use('/api', priceRoutes);

export default router;
