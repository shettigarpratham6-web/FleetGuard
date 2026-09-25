import { Router, Request, Response } from 'express';
import authController from '../controllers/authController';
import { auth } from '../middleware/auth';

const router = Router();

// Register a new user
router.post('/register', authController.register as any);
router.get('/register', (req: Request, res: Response) => res.json({ message: 'FleetGuard Auth Register API endpoint. Send a POST request with { username, email, password, full_name, role }.' }));

// Login a user
router.post('/login', authController.login as any);
router.get('/login', (req: Request, res: Response) => res.json({ message: 'FleetGuard Auth Login API endpoint. Send a POST request with { email, password } to log in.' }));

// Synchronize Firebase user with Supabase PostgreSQL users table
router.post('/sync', auth as any, authController.syncUser as any);

// Get current authenticated user profile
router.get('/me', auth as any, authController.getMe as any);

// Get all users (filtered by role)
router.get('/users', auth as any, authController.getUsers as any);

export default router;
