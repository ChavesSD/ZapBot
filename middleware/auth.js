const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware para verificar autenticação via JWT
const authenticate = async (req, res, next) => {
  try {
    // Obter o token do cabeçalho Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Acesso negado. Token não fornecido.' 
      });
    }
    
    // Extrair o token
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Acesso negado. Token não fornecido.' 
      });
    }
    
    // Verificar o token
    const secret = process.env.JWT_SECRET || 'zap123456bot789secret';
    const decoded = jwt.verify(token, secret);
    
    // Verificar se o usuário ainda existe
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Usuário não encontrado ou token inválido' 
      });
    }
    
    // Verificar se o usuário está ativo
    if (!user.active) {
      return res.status(401).json({ 
        success: false, 
        message: 'Conta desativada. Entre em contato com o administrador.' 
      });
    }
    
    // Adicionar dados do usuário ao request
    req.user = {
      id: user._id,
      email: user.email,
      role: user.role
    };
    
    // Prosseguir para o próximo middleware
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expirado. Faça login novamente.' 
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token inválido. Faça login novamente.' 
      });
    }
    
    console.error('Erro no middleware de autenticação:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro no servidor ao verificar autenticação' 
    });
  }
};

// Middleware para verificar permissões de administrador
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ 
      success: false, 
      message: 'Acesso negado. Apenas administradores podem acessar este recurso.' 
    });
  }
};

module.exports = {
  authenticate,
  isAdmin
}; 