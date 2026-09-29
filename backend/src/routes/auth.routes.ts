import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from '../validators/index.js';

const router = Router();

router.post('/register', validateRequest(registerSchema), (req, res) => authController.register(req, res));
router.post('/login', validateRequest(loginSchema), (req, res) => authController.login(req, res));
router.post('/logout', requireAuth, (req, res) => authController.logout(req, res));
router.get('/me', requireAuth, (req, res) => authController.getMe(req, res));
router.post('/forgot-password', validateRequest(forgotPasswordSchema), (req, res) => authController.forgotPassword(req, res));
router.post('/reset-password', validateRequest(resetPasswordSchema), (req, res) => authController.resetPassword(req, res));
router.post('/change-password', requireAuth, validateRequest(changePasswordSchema), (req, res) => authController.changePassword(req, res));

export default router;
