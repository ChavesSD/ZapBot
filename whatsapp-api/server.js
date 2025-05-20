const express = require('express');
const cors = require('cors');
const wppconnect = require('@wppconnect-team/wppconnect');

const app = express();
const port = 8000;

// Middleware
app.use(cors());
app.use(express.json());

// Armazenar cliente do WhatsApp
let client = null;

// Iniciar sessão do WhatsApp
async function startSession() {
  try {
    client = await wppconnect.create({
      session: 'zapbot',
      puppeteerOptions: { args: ['--no-sandbox'] },
      catchQR: (base64Qr, asciiQR, attempts, urlCode) => {
        // Armazenar o QR code para enviar ao frontend
        global.qrcode = base64Qr;
        console.log('QR Code gerado. Escaneie para conectar!');
      },
      statusFind: (statusSession, session) => {
        console.log('Status:', statusSession);
        // Status 'isLogged' = WhatsApp conectado com sucesso
      }
    });
    
    console.log('WhatsApp conectado!');
    
    // Eventos de mensagem
    client.onMessage((message) => {
      if (message.body === 'Oi' || message.body === 'oi') {
        client.sendText(message.from, 'Olá! Como posso ajudar?');
      }
    });
    
  } catch (error) {
    console.error('Erro ao iniciar sessão:', error);
  }
}

// Rotas da API
app.get('/qrcode', (req, res) => {
  if (global.qrcode) {
    res.json({ qrcode: global.qrcode });
  } else {
    res.status(404).json({ error: 'QR Code não gerado ainda' });
  }
});

app.post('/start', async (req, res) => {
  if (!client) {
    await startSession();
    res.json({ status: 'Iniciando WhatsApp...' });
  } else {
    res.json({ status: 'WhatsApp já está em execução' });
  }
});

app.post('/send', async (req, res) => {
  const { number, message } = req.body;
  
  if (!client) {
    return res.status(400).json({ error: 'WhatsApp não está conectado' });
  }
  
  if (!number || !message) {
    return res.status(400).json({ error: 'Número e mensagem são obrigatórios' });
  }
  
  // Formatar número (adiciona @c.us no final)
  const formattedNumber = `${number.replace(/\D/g, '')}@c.us`;
  
  try {
    await client.sendText(formattedNumber, message);
    res.json({ status: 'Mensagem enviada com sucesso' });
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({ error: 'Erro ao enviar mensagem' });
  }
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});

// Iniciar sessão ao iniciar o servidor
startSession(); 