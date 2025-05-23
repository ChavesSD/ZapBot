const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

// Importação da configuração do banco de dados
const { connectDatabase } = require('./config/database');
const { initializeDatabase } = require('./config/initDb');

// Inicializar o aplicativo Express
const app = express();
const PORT = process.env.PORT || 3000;

// Configuração de middleware
app.use(cors({
  origin: '*', // Permite todas as origens
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, './')));

// Conectar ao banco de dados
(async () => {
  try {
    const dbConnected = await connectDatabase();
    if (dbConnected) {
      console.log('Conectado ao MongoDB com sucesso');
      
      // Inicializar dados do banco (criar usuário admin padrão)
      await initializeDatabase();
    } else {
      console.error('Falha ao conectar ao MongoDB');
    }
  } catch (error) {
    console.error('Erro na inicialização do banco de dados:', error);
  }
})();

// Importação das rotas da API
const whatsappRoutes = require('./api/routes/whatsapp');
const userRoutes = require('./api/routes/user');
const flowRoutes = require('./api/routes/flow');

// Usar as rotas
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/users', userRoutes);
app.use('/api/flows', flowRoutes);

// Rotas para páginas HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages/dashboard.html'));
});

// Rota catch-all para lidar com todas as outras requisições e redirecioná-las para index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor ZapBot rodando na porta ${PORT}`);
  console.log(`Acesse: http://localhost:${PORT}`);
}); 