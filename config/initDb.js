const User = require('../models/User');

// Função para criar usuário admin padrão se não existir
const createDefaultAdmin = async () => {
  try {
    // Verificar se já existe um usuário admin
    const adminExists = await User.findOne({ email: 'adm@zapbot.com' });
    
    if (!adminExists) {
      console.log('Criando usuário admin padrão...');
      
      // Criar novo usuário admin
      const adminUser = new User({
        email: 'adm@zapbot.com',
        password: 'adm123',
        name: 'Administrador',
        role: 'admin'
      });
      
      // Salvar usuário
      await adminUser.save();
      console.log('Usuário admin padrão criado com sucesso!');
    } else {
      console.log('Usuário admin já existe, pulando criação...');
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao criar usuário admin padrão:', error);
    return false;
  }
};

// Inicializar dados do banco
const initializeDatabase = async () => {
  try {
    console.log('Inicializando banco de dados...');
    await createDefaultAdmin();
    console.log('Banco de dados inicializado com sucesso!');
    return true;
  } catch (error) {
    console.error('Erro ao inicializar banco de dados:', error);
    return false;
  }
};

module.exports = {
  initializeDatabase
}; 