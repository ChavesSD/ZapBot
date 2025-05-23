const User = require('../../models/User');
const jwt = require('jsonwebtoken');

// Função para gerar token JWT
const generateToken = (user) => {
  const secret = process.env.JWT_SECRET || 'zap123456bot789secret';
  
  return jwt.sign(
    { 
      id: user._id,
      email: user.email,
      role: user.role 
    },
    secret,
    { expiresIn: '24h' }
  );
};

// Login de usuário
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validar campos
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email e senha são obrigatórios' 
      });
    }
    
    // Buscar usuário pelo email
    const user = await User.findOne({ email });
    
    // Verificar se usuário existe
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Email ou senha incorretos' 
      });
    }
    
    // Verificar se a conta está ativa
    if (!user.active) {
      return res.status(401).json({ 
        success: false, 
        message: 'Conta desativada. Entre em contato com o administrador.' 
      });
    }
    
    // Verificar senha
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Email ou senha incorretos' 
      });
    }
    
    // Atualizar último login
    await user.updateLastLogin();
    
    // Gerar token
    const token = generateToken(user);
    
    // Retornar dados do usuário e token
    return res.status(200).json({
      success: true,
      message: 'Login realizado com sucesso',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Erro no login:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro no servidor ao realizar login' 
    });
  }
};

// Obter dados do usuário atual
const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Buscar usuário sem retornar a senha
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Usuário não encontrado' 
      });
    }
    
    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro no servidor ao buscar usuário' 
    });
  }
};

// Criar um novo usuário (somente para admins)
const createUser = async (req, res) => {
  try {
    // Verificar se o usuário atual é admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Acesso negado. Somente administradores podem criar usuários.' 
      });
    }
    
    const { email, password, name, role } = req.body;
    
    // Validar campos obrigatórios
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email e senha são obrigatórios' 
      });
    }
    
    // Verificar se email já existe
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Este email já está em uso' 
      });
    }
    
    // Criar novo usuário
    const newUser = new User({
      email,
      password,
      name: name || email.split('@')[0],
      role: role || 'user'
    });
    
    // Salvar usuário
    await newUser.save();
    
    return res.status(201).json({
      success: true,
      message: 'Usuário criado com sucesso',
      user: {
        id: newUser._id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro no servidor ao criar usuário' 
    });
  }
};

// Atualizar senha do usuário
const updatePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    
    // Validar campos
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Senha atual e nova senha são obrigatórias' 
      });
    }
    
    // Buscar usuário
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Usuário não encontrado' 
      });
    }
    
    // Verificar senha atual
    const isMatch = await user.comparePassword(currentPassword);
    
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Senha atual incorreta' 
      });
    }
    
    // Atualizar senha
    user.password = newPassword;
    await user.save();
    
    return res.status(200).json({
      success: true,
      message: 'Senha atualizada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar senha:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro no servidor ao atualizar senha' 
    });
  }
};

module.exports = {
  loginUser,
  getCurrentUser,
  createUser,
  updatePassword
}; 