const express = require('express');
const router = express.Router();
const flowController = require('../controllers/flowController');
const { authenticate } = require('../../middleware/auth');

// Todas as rotas de fluxo exigem autenticação
router.use(authenticate);

// Rotas de fluxos
router.get('/', flowController.getAllFlows);
router.get('/stats', flowController.getFlowStats);
router.get('/:id', flowController.getFlowById);
router.post('/', flowController.createFlow);
router.put('/:id', flowController.updateFlow);
router.delete('/:id', flowController.deleteFlow);

module.exports = router; 