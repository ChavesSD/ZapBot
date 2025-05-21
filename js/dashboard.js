// Verificar autenticação
function checkAuth() {
    const savedEmail = localStorage.getItem('savedEmail');
    const loggedIn = localStorage.getItem('loggedIn');
    
    if (!savedEmail || !loggedIn) {
        console.log('Usuário não autenticado. Redirecionando para login...');
        window.location.href = 'index.html';
    } else {
        console.log('Usuário autenticado:', savedEmail);
    }
}

// Navegação SPA
function initNavigation() {
    const menuItems = document.querySelectorAll('.sidebar-menu li');
    const pages = document.querySelectorAll('.page');

    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            // Remover classe active de todos os itens
            menuItems.forEach(i => i.classList.remove('active'));
            // Adicionar classe active ao item clicado
            item.classList.add('active');

            // Esconder todas as páginas
            pages.forEach(page => page.classList.remove('active'));
            // Mostrar a página correspondente
            const pageId = item.getAttribute('data-page');
            document.getElementById(pageId).classList.add('active');
        });
    });
}

// Função de logout
function initLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('savedEmail');
        localStorage.removeItem('savedPassword');
        localStorage.removeItem('loggedIn');
        console.log('Logout realizado. Redirecionando...');
        window.location.href = 'index.html';
    });
}

// Atualizar informações do usuário
function updateUserInfo() {
    const userEmail = document.getElementById('userEmail');
    const savedEmail = localStorage.getItem('savedEmail');
    if (savedEmail) {
        userEmail.textContent = savedEmail;
    }
}

// Configuração da API
const API_URL = 'http://localhost:21465/api';
// Variável global para armazenar a sessão
let session = 'adm'; // Usamos o mesmo nome da sessão que aparece no e-mail (adm@zapbot.com)
// Token de autenticação para o WPPConnect
const API_TOKEN = 'THISISMYSECURETOKEN';
// Token específico para a sessão (será definido após a geração)
let sessionToken = '';

// Variáveis globais para controle de conexão
let qrCodeInterval = null;
let connectionStatus = 'disconnected';
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

// Variável para função de atualização de UI compartilhada
let updateStatusUIFunction;

// Função para atualizar o status da conexão (movida para o escopo global)
async function updateConnectionStatus() {
    if (!updateStatusUIFunction) {
        console.error('updateStatusUIFunction não está definida');
        return;
    }
    
    try {
        updateStatusUIFunction('connecting', 'Verificando status...');
        
        const options = {
            method: 'GET',
            headers: getHeaders()
        };
        
        console.log(`Verificando status: ${API_URL}/${session}/status-session`);
        const response = await fetch(`${API_URL}/${session}/status-session`, options);
                
        if (response.ok) {
            const data = await response.json();
            console.log('Status da conexão:', data);
            
            if (data.status === 'CONNECTED' && connectionStatus !== 'connected') {
                connectionStatus = 'connected';
                updateStatusUIFunction('connected', 'Conectado');
                clearInterval(qrCodeInterval);
                reconnectAttempts = 0;
                showNotification('success', 'WhatsApp Conectado', 'Seu WhatsApp está conectado com sucesso');
            } else if (data.status === 'DISCONNECTED' && connectionStatus !== 'disconnected') {
                connectionStatus = 'disconnected';
                updateStatusUIFunction('disconnected', 'Desconectado');
                
                // Tentar reconexão automática
                if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                    reconnectAttempts++;
                    setTimeout(fetchQRCode, 5000); // Tentar reconectar após 5 segundos
                }
            }
        } else {
            console.error(`Erro ao verificar status: ${response.status} ${response.statusText}`);
            updateStatusUIFunction('disconnected', 'Erro de conexão');
            
            // Se o erro for 401 (não autorizado), talvez precisemos gerar um novo token
            if (response.status === 401) {
                showNotification('error', 'Autenticação expirada', 'Gerando novo token...');
                await checkToken(); // Tentar gerar um novo token
            }
        }
    } catch (error) {
        console.error('Erro ao verificar status:', error);
        updateStatusUIFunction('disconnected', 'Erro de conexão');
    }
}

// Função para criar headers com autenticação usando o token específico da sessão
function getHeaders(contentType = 'application/json') {
    const headers = {};
    
    // Usar o token específico da sessão se disponível, caso contrário usar o padrão
    if (sessionToken) {
        headers['Authorization'] = `Bearer ${sessionToken}`;
    } else {
        headers['Authorization'] = `Bearer ${API_TOKEN}`;
    }
    
    if (contentType) {
        headers['Content-Type'] = contentType;
    }
    
    return headers;
}

// Função para gerar um token específico para a sessão
async function generateSessionToken() {
    try {
        const url = `${API_URL}/${session}/${API_TOKEN}/generate-token`;
        console.log(`Gerando token para sessão ${session}: ${url}`);
        
        const response = await fetch(url, { method: 'POST' });
        
        if (response.ok) {
            const data = await response.json();
            console.log('Token gerado com sucesso:', data);
            
            if (data && data.token) {
                sessionToken = data.token;
                localStorage.setItem('wpp_session_token', data.token);
                console.log('Token salvo para uso futuro');
                return true;
            } else {
                console.error('Token não encontrado na resposta');
                return false;
            }
        } else {
            const errorText = await response.text();
            console.error(`Erro ao gerar token: ${response.status} ${response.statusText}`);
            console.error(`Detalhes: ${errorText}`);
            return false;
        }
    } catch (error) {
        console.error('Erro ao gerar token:', error);
        return false;
    }
}

// Função para fazer requisições autenticadas
async function apiRequest(endpoint, method = 'GET', body = null) {
    try {
        // O formato correto da URL é /api/:session/endpoint
        const url = `${API_URL}/${session}/${endpoint}`;
        console.log(`Fazendo requisição para: ${url}`);
        
        const options = {
            method,
            headers: getHeaders()
        };
        
        if (body && method !== 'GET') {
            options.body = JSON.stringify(body);
        }
        
        const response = await fetch(url, options);
        
        // Adicionar log detalhado em caso de erro
        if (!response.ok) {
            console.error(`Erro na requisição: ${response.status} ${response.statusText}`);
            try {
                const errorBody = await response.text();
                console.error(`Corpo da resposta: ${errorBody}`);
            } catch (e) {
                console.error('Não foi possível ler o corpo da resposta');
            }
        }
        
        return response;
    } catch (error) {
        console.error('Erro na requisição API:', error);
        throw error;
    }
}

// Sistema de Notificações
function showNotification(type, title, message, duration = 5000) {
    console.log(`Mostrando notificação: ${type} - ${title} - ${message}`);
    
    const container = document.querySelector('.notification-container');
    if (!container) {
        console.error('Container de notificações não encontrado');
        return;
    }
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // Ícone com base no tipo
    let icon = '';
    switch (type) {
        case 'success':
            icon = 'check-circle';
            break;
        case 'error':
            icon = 'exclamation-circle';
            break;
        case 'warning':
            icon = 'exclamation-triangle';
            break;
        default:
            icon = 'info-circle';
    }
    
    notification.innerHTML = `
        <div class="notification-icon">
            <i class="fas fa-${icon}"></i>
        </div>
        <div class="notification-content">
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
        </div>
        <div class="notification-close">
            <i class="fas fa-times"></i>
        </div>
    `;
    
    container.appendChild(notification);
    
    // Exibir após um pequeno delay para permitir a animação
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Configurar fechamento
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    });
    
    // Auto-fechar após duração especificada
    if (duration > 0) {
        setTimeout(() => {
            if (notification.parentNode) {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }
        }, duration);
    }
    
    return notification;
}

// Função para exibir erros em formato amigável
function handleApiError(error, defaultMessage = 'Ocorreu um erro na operação.') {
    console.error('Erro de API:', error);
    
    let message = defaultMessage;
    if (error.response) {
        // O servidor respondeu com um status de erro
        message = `Erro ${error.response.status}: ${error.response.statusText || 'Erro desconhecido'}`;
    } else if (error.request) {
        // A requisição foi feita mas não houve resposta
        message = 'Sem resposta do servidor. Verifique sua conexão.';
    } else if (error.message) {
        // Erro na configuração da requisição
        message = error.message;
    }
    
    showNotification('error', 'Erro', message);
}

// Mover a função displayQRCode para o escopo global
// Função para exibir o QR Code
function displayQRCode(qrcode) {
    if (!updateStatusUIFunction) {
        console.error('updateStatusUIFunction não está definida');
        return;
    }
    
    const qrContainer = document.querySelector('.qr-code');
    if (!qrContainer) {
        console.error('Elemento QR code não encontrado');
        return;
    }
    
    // Limpar conteúdo atual
    qrContainer.innerHTML = '';
    
    // Criar imagem do QR Code
    const img = document.createElement('img');
    
    try {
        // Verificar se o QR code já é uma URL de imagem
        if (typeof qrcode === 'string') {
            if (qrcode.startsWith('data:image/')) {
                img.src = qrcode;
            } else if (qrcode.startsWith('http')) {
                img.src = qrcode;
            } else {
                // Se for uma string base64 sem o prefixo de data URL
                img.src = 'data:image/png;base64,' + qrcode;
            }
        } else if (qrcode && qrcode.base64Qr) {
            // Se for um objeto com propriedade base64Qr
            img.src = 'data:image/png;base64,' + qrcode.base64Qr;
        } else if (qrcode && qrcode.qrcode) {
            // Se for um objeto com propriedade qrcode (outro formato comum)
            if (typeof qrcode.qrcode === 'string') {
                if (qrcode.qrcode.startsWith('data:image/')) {
                    img.src = qrcode.qrcode;
                } else if (qrcode.qrcode.startsWith('http')) {
                    img.src = qrcode.qrcode;
                } else {
                    img.src = 'data:image/png;base64,' + qrcode.qrcode;
                }
            } else {
                console.error('Formato de QR code não reconhecido');
                qrContainer.innerHTML = '<div class="qr-error"><i class="fas fa-exclamation-triangle"></i><p>Formato de QR Code não reconhecido</p></div>';
                return;
            }
        } else {
            console.error('Formato de QR code não reconhecido');
            qrContainer.innerHTML = '<div class="qr-error"><i class="fas fa-exclamation-triangle"></i><p>Formato de QR Code não reconhecido</p></div>';
            return;
        }
        
        // Adicionar evento para verificar se a imagem carregou corretamente
        img.onload = function() {
            console.log('QR Code carregado com sucesso');
        };
        
        img.onerror = function() {
            console.error('Erro ao carregar QR Code');
            qrContainer.innerHTML = '<div class="qr-error"><i class="fas fa-exclamation-triangle"></i><p>Erro ao carregar QR Code</p></div>';
        };
        
        qrContainer.appendChild(img);
        
        updateStatusUIFunction('connecting', 'Escaneie o QR Code');
        
        // Adicionar logs para debug
        if (typeof qrcode === 'string') {
            console.log('QR Code exibido (string):', qrcode.substring(0, 50) + '...');
        } else {
            console.log('QR Code exibido (objeto):', JSON.stringify(qrcode).substring(0, 50) + '...');
        }
        
        // Iniciar verificação periódica do status
        if (!qrCodeInterval) {
            qrCodeInterval = setInterval(updateConnectionStatus, 3000);
        }
    } catch (error) {
        console.error('Erro ao processar QR Code:', error);
        qrContainer.innerHTML = '<div class="qr-error"><i class="fas fa-exclamation-triangle"></i><p>Erro ao processar QR Code</p></div>';
        showNotification('error', 'Erro no QR Code', 'Não foi possível processar o QR Code');
    }
}

// Função específica para iniciar uma sessão do WhatsApp
async function startWhatsAppSession() {
    try {
        showNotification('info', 'Iniciando sessão', 'Iniciando sessão do WhatsApp...');
        
        // Verificar se temos um token válido
        if (!sessionToken) {
            const tokenGenerated = await generateSessionToken();
            if (!tokenGenerated) {
                throw new Error('Não foi possível gerar um token para a sessão');
            }
        }
        
        const options = {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
                webhook: null,
                waitQrCode: true
            })
        };
        
        console.log(`Iniciando sessão: ${API_URL}/${session}/start-session`);
        const response = await fetch(`${API_URL}/${session}/start-session`, options);
        
        if (response.ok) {
            const data = await response.json();
            console.log('Sessão iniciada com sucesso:', data);
            showNotification('success', 'Sessão iniciada', 'A sessão do WhatsApp foi iniciada com sucesso');
            
            if (data && data.qrcode) {
                console.log('QR Code recebido do servidor');
                try {
                    displayQRCode(data.qrcode);
                } catch (e) {
                    console.error('Erro ao exibir QR Code:', e);
                    showNotification('error', 'Erro ao exibir QR Code', e.message || 'Ocorreu um erro ao exibir o QR Code');
                }
            } else {
                console.log('QR Code não encontrado na resposta:', data);
                showNotification('warning', 'QR Code não encontrado', 'A resposta do servidor não contém um QR Code');
            }
            
            return true;
        } else {
            const errorText = await response.text();
            console.error(`Erro ao iniciar sessão: ${response.status} ${response.statusText}`);
            console.error(`Detalhes: ${errorText}`);
            
            // Se o erro for 401, tentar gerar um novo token
            if (response.status === 401) {
                showNotification('error', 'Token inválido', 'Tentando gerar um novo token...');
                const tokenGenerated = await generateSessionToken();
                if (tokenGenerated) {
                    // Tentar novamente com o novo token
                    return startWhatsAppSession();
                }
            }
            
            showNotification('error', 'Erro ao iniciar sessão', `Falha ao iniciar sessão: ${response.status}`);
            return false;
        }
    } catch (error) {
        console.error('Erro ao iniciar sessão:', error);
        showNotification('error', 'Erro de conexão', 'Não foi possível conectar ao servidor');
        return false;
    }
}

// Função global para buscar QR Code
async function fetchQRCode() {
    const qrContainer = document.querySelector('.qr-code');
    if (!qrContainer) {
        console.error('Elemento QR Code não encontrado');
        return;
    }
    
    if (!updateStatusUIFunction) {
        console.error('updateStatusUIFunction não está definida');
        showNotification('error', 'Erro interno', 'Erro na inicialização da interface');
        return;
    }
    
    // Configurar a aparência inicial
    qrContainer.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    updateStatusUIFunction('connecting', 'Gerando QR Code...');
    
    try {
        // Primeiro, iniciar a sessão
        const sessionStarted = await startWhatsAppSession();
        
        if (!sessionStarted) {
            throw new Error('Falha ao iniciar sessão');
        }
        
    } catch (error) {
        console.error('Erro ao iniciar sessão:', error);
        updateStatusUIFunction('disconnected', 'Erro de servidor');
        showNotification('error', 'Erro de Conexão', error.message || 'Não foi possível conectar ao servidor');
    }
}

// Inicializar QR Code e gerenciamento de conexão
function initQRCode() {
    console.log("Inicializando QR Code...");
    
    const qrContainer = document.querySelector('.qr-code');
    const connectBtn = document.querySelector('.connect-btn');
    const statusTextElement = document.getElementById('connection-status-text');
    
    // Verificar se todos os elementos necessários estão presentes
    if (!qrContainer || !connectBtn || !statusTextElement) {
        console.error('Elementos necessários para QR Code não encontrados no DOM:');
        console.error('qrContainer:', qrContainer);
        console.error('connectBtn:', connectBtn);
        console.error('statusTextElement:', statusTextElement);
        return; // Não prosseguir se os elementos não existirem
    }
    
    // Função para atualizar o status na interface
    function updateStatusUI(status, message) {
        console.log(`Atualizando status UI: ${status} - ${message}`);
        
        // Atualizar o elemento de status se existir
        if (statusTextElement) {
            statusTextElement.textContent = message;
            statusTextElement.className = '';
            statusTextElement.classList.add(status);
        }
        
        // Status no contêiner da página
        const statusContainer = document.querySelector('.status-container');
        if (statusContainer) {
            statusContainer.textContent = `Status: ${message}`;
            statusContainer.className = 'status-container';
            statusContainer.classList.add(`status-${status}`);
        }
        
        // Atualizar também a aparência do QR code
        if (status === 'connected') {
            qrContainer.innerHTML = '<i class="fas fa-check-circle"></i>';
            connectBtn.innerHTML = '<i class="fas fa-link-slash"></i> Desconectar';
            connectBtn.setAttribute('data-tooltip', 'Desconectar WhatsApp');
        } else if (status === 'connecting') {
            qrContainer.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        } else if (status === 'disconnected') {
            qrContainer.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
            connectBtn.innerHTML = '<i class="fas fa-sync"></i> Gerar Novo QR Code';
            connectBtn.setAttribute('data-tooltip', 'Gerar novo QR Code');
        }
    }
    
    // Salvar a função para uso global
    updateStatusUIFunction = updateStatusUI;
    
    // Inicializa com status desconectado
    updateStatusUI('disconnected', 'Desconectado');

    // Função para desconectar
    async function disconnect() {
        if (!updateStatusUIFunction) {
            console.error('updateStatusUIFunction não está definida');
            showNotification('error', 'Erro interno', 'Erro na inicialização da interface');
            return;
        }
        
        try {
            updateStatusUIFunction('connecting', 'Desconectando...');
            
            const options = {
                method: 'POST',
                headers: getHeaders()
            };
            
            console.log(`Desconectando: ${API_URL}/${session}/close-session`);
            const response = await fetch(`${API_URL}/${session}/close-session`, options);
            
            if (response.ok) {
                connectionStatus = 'disconnected';
                updateStatusUIFunction('disconnected', 'Desconectado');
                
                clearInterval(qrCodeInterval);
                qrCodeInterval = null;
                
                showNotification('success', 'Desconectado', 'Seu WhatsApp foi desconectado com sucesso');
            } else {
                const errorText = await response.text();
                console.error(`Erro ao desconectar: ${response.status} ${response.statusText}`);
                console.error(`Detalhes: ${errorText}`);
                throw new Error(`Erro ao desconectar: ${response.status}`);
            }
        } catch (error) {
            console.error('Erro ao desconectar:', error);
            showNotification('error', 'Erro', 'Não foi possível desconectar. Tente novamente.');
        }
    }
    
    // Evento do botão para conectar/desconectar
    connectBtn.addEventListener('click', () => {
        if (connectionStatus === 'connected') {
            disconnect();
        } else {
            fetchQRCode();
        }
    });
    
    // Tentar buscar QR Code ao carregar a página
    fetchQRCode();
}

// Inicializar botão de novo fluxo
function initNewFlow() {
    const newFlowBtn = document.querySelector('.new-flow-btn');
    if (!newFlowBtn) {
        console.log('Botão de novo fluxo não encontrado, pulando inicialização');
        return;
    }
    
    // O botão já tem seu evento no initModalNovoFluxo
    console.log('Botão de novo fluxo inicializado');
}

// Inicializar configurações
function initSettings() {
    const settingsInputs = document.querySelectorAll('.setting-item input, .setting-item textarea');
    if (!settingsInputs || settingsInputs.length === 0) {
        console.log('Elementos de configurações não encontrados, pulando inicialização');
        return;
    }
    
    settingsInputs.forEach(input => {
        input.addEventListener('change', () => {
            // Aqui será implementada a lógica para salvar as configurações
            showNotification('success', 'Configurações Salvas', 'Suas configurações foram salvas com sucesso!');
        });
    });
}

// Função para enviar mensagem via API
async function sendMessage(number, message) {
    try {
        const options = {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ 
                phone: number, 
                message: message,
                isGroup: false
            })
        };
        
        console.log(`Enviando mensagem para ${number}: ${API_URL}/${session}/send-message`);
        const response = await fetch(`${API_URL}/${session}/send-message`, options);
        
        if (response.ok) {
            const data = await response.json();
            console.log('Mensagem enviada com sucesso:', data);
            showNotification('success', 'Mensagem Enviada', `Mensagem enviada para ${number}`);
            return data;
        } else {
            const errorText = await response.text();
            console.error(`Erro ao enviar mensagem: ${response.status} ${response.statusText}`);
            console.error(`Detalhes: ${errorText}`);
            showNotification('error', 'Erro', `Falha ao enviar mensagem: ${response.status}`);
            throw new Error(`Erro ao enviar mensagem: ${response.status}`);
        }
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        showNotification('error', 'Erro', 'Não foi possível enviar a mensagem');
        throw error;
    }
}

// Modal Novo Fluxo
function initModalNovoFluxo() {
    const modal = document.getElementById('modalNovoFluxo');
    if (!modal) {
        console.log('Modal Novo Fluxo não encontrado, pulando inicialização');
        return;
    }
    
    const openBtn = document.querySelector('.new-flow-btn');
    const closeBtn = modal.querySelector('.close');  // Corrigido para usar querySelector no modal
    const cancelBtn = modal.querySelector('.cancel');  // Corrigido para usar querySelector no modal
    const addPerguntaRespostaBtn = document.getElementById('addPerguntaResposta');
    const perguntasRespostasContainer = document.getElementById('perguntasRespostasContainer');
    const form = document.getElementById('formNovoFluxo');

    // Verificar se todos os elementos necessários estão presentes
    if (!openBtn || !closeBtn || !cancelBtn || !addPerguntaRespostaBtn || !perguntasRespostasContainer || !form) {
        console.error('Elementos necessários para Modal Novo Fluxo não encontrados no DOM:');
        console.error('openBtn:', openBtn);
        console.error('closeBtn:', closeBtn);
        console.error('cancelBtn:', cancelBtn);
        console.error('addPerguntaRespostaBtn:', addPerguntaRespostaBtn);
        console.error('perguntasRespostasContainer:', perguntasRespostasContainer);
        console.error('form:', form);
        return;
    }

    // Abrir modal
    openBtn.addEventListener('click', () => {
        modal.style.display = 'block';
    });
    
    // Fechar modal
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        form.reset();
        perguntasRespostasContainer.innerHTML = `<div class="pergunta-resposta">
            <input type="text" class="pergunta" placeholder="Pergunta" required>
            <input type="text" class="resposta" placeholder="Resposta" required>
        </div>`;
    });
    
    cancelBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        form.reset();
        perguntasRespostasContainer.innerHTML = `<div class="pergunta-resposta">
            <input type="text" class="pergunta" placeholder="Pergunta" required>
            <input type="text" class="resposta" placeholder="Resposta" required>
        </div>`;
    });
    
    // Adicionar nova pergunta/resposta
    addPerguntaRespostaBtn.addEventListener('click', () => {
        const div = document.createElement('div');
        div.className = 'pergunta-resposta';
        div.innerHTML = `<input type="text" class="pergunta" placeholder="Pergunta" required>
            <input type="text" class="resposta" placeholder="Resposta" required>
            <button type="button" class="remove-pergunta">Remover</button>`;
        perguntasRespostasContainer.appendChild(div);
        // Remover pergunta/resposta
        div.querySelector('.remove-pergunta').addEventListener('click', () => {
            div.remove();
        });
    });
    
    // Submeter novo fluxo
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const nomeFluxo = document.getElementById('nomeFluxo').value;
        const perguntas = Array.from(perguntasRespostasContainer.querySelectorAll('.pergunta')).map(input => input.value);
        const respostas = Array.from(perguntasRespostasContainer.querySelectorAll('.resposta')).map(input => input.value);
        const fluxo = perguntas.map((pergunta, i) => ({ pergunta, resposta: respostas[i] }));
        // Aqui você pode salvar o fluxo no localStorage, backend, etc.
        console.log('Fluxo salvo:', { nomeFluxo, fluxo });
        showNotification('success', 'Fluxo Salvo', 'Seu fluxo de conversa foi salvo com sucesso!');
        modal.style.display = 'none';
        form.reset();
        perguntasRespostasContainer.innerHTML = `<div class="pergunta-resposta">
            <input type="text" class="pergunta" placeholder="Pergunta" required>
            <input type="text" class="resposta" placeholder="Resposta" required>
        </div>`;
    });
}

// Verificar se o token é válido
async function checkToken() {
    try {
        // Primeiro, tentar ler o token do localStorage
        const savedToken = localStorage.getItem('wpp_session_token');
        if (savedToken) {
            console.log('Token encontrado no localStorage');
            sessionToken = savedToken;
            return true;
        }
        
        // Se não encontrar token, tentar gerar um novo
        console.log('Gerando novo token para a sessão');
        const tokenGenerated = await generateSessionToken();
        if (tokenGenerated) {
            return true;
        } else {
            console.error('Não foi possível gerar um token válido');
            showNotification('error', 'Erro de Autenticação', 'Não foi possível autenticar-se com o servidor');
            return false;
        }
    } catch (error) {
        console.error('Erro ao verificar token:', error);
        showNotification('error', 'Erro de Conexão', 'Não foi possível conectar ao servidor para verificar o token.');
        return false;
    }
}

// Inicializar botão de envio de mensagem
function initSendMessageButton() {
    const sendButton = document.getElementById('send-test-message');
    const numberInput = document.getElementById('test-number');
    const messageInput = document.getElementById('test-message');
    const statusElement = document.getElementById('message-status');
    
    if (!sendButton || !numberInput || !messageInput || !statusElement) {
        console.log('Elementos de envio de mensagem não encontrados, pulando inicialização');
        return;
    }
    
    sendButton.addEventListener('click', async () => {
        try {
            const number = numberInput.value.trim();
            const message = messageInput.value.trim();
            
            if (!number || !message) {
                statusElement.textContent = 'Preencha todos os campos';
                statusElement.className = 'error';
                return;
            }
            
            statusElement.textContent = 'Enviando mensagem...';
            statusElement.className = 'sending';
            
            await sendMessage(number, message);
            
            statusElement.textContent = 'Mensagem enviada com sucesso!';
            statusElement.className = 'success';
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            statusElement.textContent = 'Erro ao enviar mensagem. Tente novamente.';
            statusElement.className = 'error';
        }
    });
}

// Inicializar todas as funcionalidades
async function init() {
    console.log("Inicializando aplicação...");
    
    // Verificar se estamos na página de dashboard
    if (!document.querySelector('.sidebar')) {
        console.log('Não estamos na página de dashboard, pulando inicialização.');
        return;
    }
    
    // Verificar autenticação do usuário
    checkAuth();
    
    // Inicializar navegação
    initNavigation();
    
    // Verificar se o botão de logout existe antes de inicializar
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        initLogout();
    } else {
        console.error('Botão de logout não encontrado');
    }
    
    // Verificar se o userEmail existe antes de atualizar
    const userEmail = document.getElementById('userEmail');
    if (userEmail) {
        updateUserInfo();
    } else {
        console.error('userEmail não encontrado');
    }
    
    // Usar 'adm' como sessão fixa para evitar problemas
    session = 'adm';
    console.log('Usando sessão fixa:', session);
    
    // Verificar token antes de inicializar módulos que dependem da API
    const tokenValid = await checkToken();
    if (!tokenValid) {
        showNotification('error', 'Erro de API', 'Não foi possível validar o token. O QR Code não estará disponível.');
    }
    
    // Inicializar módulos da aplicação - cheque se os elementos existem
    if (document.querySelector('.qr-code')) {
        initQRCode();
    } else {
        console.log('Elemento QR Code não encontrado, pulando inicialização.');
    }
    
    if (document.querySelector('.new-flow-btn')) {
        initNewFlow();
    }
    
    if (document.querySelector('.setting-item')) {
        initSettings();
    }
    
    if (document.getElementById('modalNovoFluxo')) {
        initModalNovoFluxo();
    }
    
    // Inicializar botão de envio de mensagem de teste
    initSendMessageButton();
    
    // Disponibilizar função de envio globalmente
    window.sendWhatsAppMessage = sendMessage;
}

// Iniciar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM carregado, iniciando aplicação');
    init().catch(error => {
        console.error('Erro ao inicializar aplicação:', error);
        showNotification('error', 'Erro de inicialização', 'Não foi possível inicializar a aplicação corretamente');
    });
}); 