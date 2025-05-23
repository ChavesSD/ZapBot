const Flow = require('../../models/Flow');

// Listar todos os fluxos
const getAllFlows = async (req, res) => {
  try {
    // Buscar apenas os fluxos criados pelo usuário atual, exceto para admins
    let query = {};
    if (req.user.role !== 'admin') {
      query.createdBy = req.user.id;
    }
    
    // Buscar fluxos sem os detalhes dos nós e links
    const flows = await Flow.find(query)
      .select('name description active statistics createdAt updatedAt')
      .sort({ updatedAt: -1 });
    
    return res.status(200).json({
      success: true,
      count: flows.length,
      flows
    });
  } catch (error) {
    console.error('Erro ao listar fluxos:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro no servidor ao listar fluxos' 
    });
  }
};

// Obter um fluxo específico
const getFlowById = async (req, res) => {
  try {
    const flowId = req.params.id;
    
    // Buscar fluxo completo
    const flow = await Flow.findById(flowId);
    
    if (!flow) {
      return res.status(404).json({ 
        success: false, 
        message: 'Fluxo não encontrado' 
      });
    }
    
    // Verificar se o usuário tem permissão para acessar o fluxo
    if (req.user.role !== 'admin' && flow.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Acesso negado. Você não tem permissão para acessar este fluxo.' 
      });
    }
    
    return res.status(200).json({
      success: true,
      flow
    });
  } catch (error) {
    console.error('Erro ao buscar fluxo:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro no servidor ao buscar fluxo' 
    });
  }
};

// Criar um novo fluxo
const createFlow = async (req, res) => {
  try {
    const { name, description, nodes, links } = req.body;
    
    // Validar campos obrigatórios
    if (!name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nome do fluxo é obrigatório' 
      });
    }
    
    // Validar estrutura do fluxo
    if (!nodes || !Array.isArray(nodes) || nodes.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'O fluxo deve conter pelo menos um nó' 
      });
    }
    
    // Verificar se já existe um fluxo com o mesmo nome para este usuário
    const existingFlow = await Flow.findOne({ 
      name, 
      createdBy: req.user.id 
    });
    
    if (existingFlow) {
      return res.status(400).json({ 
        success: false, 
        message: 'Você já possui um fluxo com este nome' 
      });
    }
    
    // Criar novo fluxo
    const newFlow = new Flow({
      name,
      description,
      nodes,
      links,
      createdBy: req.user.id
    });
    
    // Salvar fluxo
    await newFlow.save();
    
    return res.status(201).json({
      success: true,
      message: 'Fluxo criado com sucesso',
      flow: newFlow
    });
  } catch (error) {
    console.error('Erro ao criar fluxo:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro no servidor ao criar fluxo' 
    });
  }
};

// Atualizar um fluxo existente
const updateFlow = async (req, res) => {
  try {
    const flowId = req.params.id;
    const { name, description, nodes, links, active } = req.body;
    
    // Buscar fluxo
    const flow = await Flow.findById(flowId);
    
    if (!flow) {
      return res.status(404).json({ 
        success: false, 
        message: 'Fluxo não encontrado' 
      });
    }
    
    // Verificar se o usuário tem permissão para editar o fluxo
    if (req.user.role !== 'admin' && flow.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Acesso negado. Você não tem permissão para editar este fluxo.' 
      });
    }
    
    // Verificar se o nome foi alterado e já existe
    if (name && name !== flow.name) {
      const existingFlow = await Flow.findOne({ 
        name, 
        createdBy: req.user.id,
        _id: { $ne: flowId }
      });
      
      if (existingFlow) {
        return res.status(400).json({ 
          success: false, 
          message: 'Você já possui um fluxo com este nome' 
        });
      }
    }
    
    // Atualizar campos
    if (name) flow.name = name;
    if (description !== undefined) flow.description = description;
    if (nodes) flow.nodes = nodes;
    if (links) flow.links = links;
    if (active !== undefined) flow.active = active;
    
    // Atualizar data de modificação
    flow.updatedAt = Date.now();
    
    // Salvar fluxo
    await flow.save();
    
    return res.status(200).json({
      success: true,
      message: 'Fluxo atualizado com sucesso',
      flow
    });
  } catch (error) {
    console.error('Erro ao atualizar fluxo:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro no servidor ao atualizar fluxo' 
    });
  }
};

// Excluir um fluxo
const deleteFlow = async (req, res) => {
  try {
    const flowId = req.params.id;
    
    // Buscar fluxo
    const flow = await Flow.findById(flowId);
    
    if (!flow) {
      return res.status(404).json({ 
        success: false, 
        message: 'Fluxo não encontrado' 
      });
    }
    
    // Verificar se o usuário tem permissão para excluir o fluxo
    if (req.user.role !== 'admin' && flow.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Acesso negado. Você não tem permissão para excluir este fluxo.' 
      });
    }
    
    // Excluir fluxo
    await Flow.findByIdAndDelete(flowId);
    
    return res.status(200).json({
      success: true,
      message: 'Fluxo excluído com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir fluxo:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro no servidor ao excluir fluxo' 
    });
  }
};

// Obter estatísticas dos fluxos
const getFlowStats = async (req, res) => {
  try {
    // Obter estatísticas gerais para o usuário
    let query = {};
    if (req.user.role !== 'admin') {
      query.createdBy = req.user.id;
    }
    
    // Contar total de fluxos
    const totalFlows = await Flow.countDocuments(query);
    
    // Contar fluxos ativos
    const activeFlows = await Flow.countDocuments({
      ...query,
      active: true
    });
    
    // Obter total de mensagens enviadas (soma de todos os usageCounts)
    const flowStats = await Flow.aggregate([
      { $match: query },
      { $group: {
        _id: null,
        totalMessages: { $sum: '$statistics.usageCount' },
        averageSuccessRate: { $avg: '$statistics.successRate' }
      }}
    ]);
    
    const totalMessages = flowStats.length > 0 ? flowStats[0].totalMessages : 0;
    const averageSuccessRate = flowStats.length > 0 ? 
      Math.round(flowStats[0].averageSuccessRate * 100) / 100 : 0;
    
    // Obter fluxos mais usados
    const topFlows = await Flow.find(query)
      .sort({ 'statistics.usageCount': -1 })
      .limit(5)
      .select('name statistics');
    
    return res.status(200).json({
      success: true,
      stats: {
        totalFlows,
        activeFlows,
        totalMessages,
        averageSuccessRate,
        topFlows
      }
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas de fluxos:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro no servidor ao obter estatísticas de fluxos' 
    });
  }
};

module.exports = {
  getAllFlows,
  getFlowById,
  createFlow,
  updateFlow,
  deleteFlow,
  getFlowStats
}; 