const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, isAdmin } = require('../../middleware/auth');

// Rotas públicas
router.post('/login', userController.loginUser);

// Rotas protegidas
router.get('/me', authenticate, userController.getCurrentUser);
router.post('/change-password', authenticate, userController.updatePassword);

// Rotas apenas para administradores
router.post('/create', authenticate, isAdmin, userController.createUser);

module.exports = router; 