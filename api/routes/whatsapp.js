const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsappController');

// Rotas para a API WhatsApp
router.post('/start-session', whatsappController.startSession);
router.get('/status-session', whatsappController.getStatus);
router.post('/close-session', whatsappController.closeSession);
router.post('/send-message', whatsappController.sendMessage);
router.post('/generate-token', whatsappController.generateToken);

module.exports = router; 