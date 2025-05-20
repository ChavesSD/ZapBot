const http = require('http');
const url = require('url');

// Variáveis globais
let qrCode = null;

// Criar servidor HTTP
const server = http.createServer((req, res) => {
    // Configurar CORS para permitir acesso de qualquer origem
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Lidar com requisições OPTIONS (pré-voo CORS)
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // Analisar URL
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    // Rota para obter QR Code
    if (pathname === '/qrcode' && req.method === 'GET') {
        if (qrCode) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ qrcode: qrCode }));
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'QR Code não gerado ainda' }));
        }
        return;
    }

    // Rota para iniciar
    if (pathname === '/start' && req.method === 'POST') {
        // Demonstração - apenas definir um QR Code de exemplo
        qrCode = 'data:image/png;base64,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';
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'Iniciando WhatsApp...' }));
        return;
    }

    // Rota para enviar mensagem
    if (pathname === '/send' && req.method === 'POST') {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const { number, message } = data;
                
                if (!number || !message) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Número e mensagem são obrigatórios' }));
                    return;
                }
                
                // Em um caso real, aqui enviaríamos a mensagem
                // Nesta versão simplificada, apenas simulamos sucesso
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'Mensagem enviada com sucesso' }));
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'JSON inválido' }));
            }
        });
        
        return;
    }

    // Rota não encontrada
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Rota não encontrada' }));
});

// Porta
const port = 8000;

// Iniciar servidor
server.listen(port, () => {
    console.log(`Servidor simplificado rodando em http://localhost:${port}`);
    console.log('Este é um servidor de demonstração que simula a API do WhatsApp');
    console.log('Use a interface web para testar a conexão');
}); 