const mongoose = require('mongoose');
require('dotenv').config();

// String de conexão com o MongoDB (default local se não fornecida)
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/zapbot';

// Opções de configuração do Mongoose
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // Timeout de 5 segundos
  socketTimeoutMS: 45000, // Timeout do socket de 45 segundos
  family: 4 // Força IPv4
};

// Função para conectar ao banco de dados
const connectDatabase = async () => {
  try {
    console.log('Tentando conectar ao MongoDB...');
    console.log('URI:', mongoURI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')); // Log seguro da URI
    
    await mongoose.connect(mongoURI, options);
    
    console.log('Conectado ao MongoDB com sucesso!');
    console.log('Status da conexão:', mongoose.connection.readyState);
    console.log('Nome do banco:', mongoose.connection.name);
    
    return true;
  } catch (error) {
    console.error('Erro ao conectar ao MongoDB:', error.message);
    console.error('Stack trace:', error.stack);
    
    if (error.name === 'MongoServerSelectionError') {
      console.error('Não foi possível selecionar um servidor MongoDB. Verifique se a URI está correta e se o servidor está acessível.');
    }
    
    return false;
  }
};

// Função para verificar o status da conexão
const checkDatabaseConnection = () => {
  const state = mongoose.connection.readyState;
  console.log('Estado atual da conexão:', state);
  return state === 1; // 1 = conectado
};

// Evento de erro na conexão
mongoose.connection.on('error', (err) => {
  console.error('Erro na conexão com o MongoDB:', err);
  console.error('Tentando reconectar automaticamente...');
  
  // Tentar reconectar após 5 segundos
  setTimeout(() => {
    connectDatabase();
  }, 5000);
});

// Evento de desconexão
mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB desconectado, tentando reconectar...');
  
  // Tentar reconectar após 5 segundos
  setTimeout(() => {
    connectDatabase();
  }, 5000);
});

// Evento de conexão bem-sucedida
mongoose.connection.on('connected', () => {
  console.log('MongoDB reconectado com sucesso!');
});

module.exports = {
  connectDatabase,
  checkDatabaseConnection
}; 