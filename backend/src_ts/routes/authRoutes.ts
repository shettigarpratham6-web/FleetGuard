import { Router, Request, Response } from 'express';
import authController from '../controllers/authController';
import { auth } from '../middleware/auth';

const router = Router();

router.post('/register', authController.register as any);
router.get('/register', (req: Request, res: Response) => res.json({ message: 'FleetGuard Auth Register API endpoint. Send a POST request with { username, email, password, full_name, role }.' }));

router.post('/login', authController.login as any);
router.get('/login', (req: Request, res: Response) => res.json({ message: 'FleetGuard Auth Login API endpoint. Send a POST request with { email, password } to log in.' }));

router.post('/sync', auth as any, authController.syncUser as any);

router.get('/me', auth as any, authController.getMe as any);

router.get('/users', auth as any, authController.getUsers as any);

export default router;
