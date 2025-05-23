const mongoose = require('mongoose');
require('dotenv').config();

// String de conexão com o MongoDB (default local se não fornecida)
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/zapbot';

// Opções de configuração do Mongoose
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true
};

// Função para conectar ao banco de dados
const connectDatabase = async () => {
  try {
    await mongoose.connect(mongoURI, options);
    console.log('Conectado ao MongoDB com sucesso!');
    return true;
  } catch (error) {
    console.error('Erro ao conectar ao MongoDB:', error.message);
    return false;
  }
};

// Função para verificar o status da conexão
const checkDatabaseConnection = () => {
  return mongoose.connection.readyState === 1; // 1 = conectado
};

// Evento de erro na conexão
mongoose.connection.on('error', (err) => {
  console.error('Erro na conexão com o MongoDB:', err);
});

// Evento de desconexão
mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB desconectado, tentando reconectar...');
});

module.exports = {
  connectDatabase,
  checkDatabaseConnection
}; 