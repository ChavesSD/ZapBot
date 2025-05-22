const express = require('express');
const path = require('path');
const cors = require('cors');
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

// Importação das rotas da API
const whatsappRoutes = require('./api/routes/whatsapp');

// Usar as rotas
app.use('/api/whatsapp', whatsappRoutes);

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