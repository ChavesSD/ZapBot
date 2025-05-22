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
const API_URL = 'https://zapbot-wpp.herokuapp.com/api';
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
        // Não alterar o status para "connecting" durante verificação
        // para evitar sobrescrever o status "connected" ou "disconnected"
        console.log(`Verificando status: ${API_URL}/whatsapp/status-session`);
        const response = await fetch(`${API_URL}/whatsapp/status-session`, {
            method: 'GET',
            headers: getHeaders()
        });
                
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
            // Não alterar o status da UI em caso de erro temporário
            
            // Se o erro for 401 (não autorizado), talvez precisemos gerar um novo token
            if (response.status === 401) {
                showNotification('error', 'Autenticação expirada', 'Gerando novo token...');
                await checkToken(); // Tentar gerar um novo token
            }
        }
    } catch (error) {
        console.error('Erro ao verificar status:', error);
        // Não alterar o status da UI em caso de erro temporário
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
        const url = `${API_URL}/whatsapp/generate-token`;
        console.log(`Gerando token para sessão adm: ${url}`);
        
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
        // O formato correto da URL é /api/whatsapp/endpoint
        const url = `${API_URL}/whatsapp/${endpoint}`;
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
            
            // Se o erro for 401 (não autorizado), talvez precisemos gerar um novo token
            if (response.status === 401) {
                console.log('Tentando gerar um novo token devido a erro 401...');
                const tokenSuccess = await generateSessionToken();
                
                if (tokenSuccess) {
                    // Tentar novamente com o novo token
                    console.log('Novo token gerado. Tentando requisição novamente...');
                    
                    const retryOptions = {
                        method,
                        headers: getHeaders()
                    };
                    
                    if (body && method !== 'GET') {
                        retryOptions.body = JSON.stringify(body);
                    }
                    
                    return await fetch(url, retryOptions);
                }
            }
            
            throw new Error(`Erro na requisição: ${response.status} ${response.statusText}`);
        }
        
        return response;
    } catch (error) {
        console.error(`Erro em apiRequest para ${endpoint}:`, error);
        throw error;
    }
}

// Função para mostrar notificações
function showNotification(type, title, message, duration = 5000) {
    const notificationContainer = document.getElementById('notificationContainer');
    if (!notificationContainer) {
        console.error('Container de notificações não encontrado');
        return;
    }
    
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.classList.add('notification', `notification-${type}`);
    
    // Adicionar ícone com base no tipo
    let icon = '';
    switch (type) {
        case 'success':
            icon = '<i class="fas fa-check-circle"></i>';
            break;
        case 'error':
            icon = '<i class="fas fa-exclamation-circle"></i>';
            break;
        case 'warning':
            icon = '<i class="fas fa-exclamation-triangle"></i>';
            break;
        case 'info':
        default:
            icon = '<i class="fas fa-info-circle"></i>';
            break;
    }
    
    // Montar conteúdo HTML
    notification.innerHTML = `
        <div class="notification-icon">
            ${icon}
        </div>
        <div class="notification-content">
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
        </div>
        <button class="notification-close">&times;</button>
    `;
    
    // Adicionar ao container
    notificationContainer.appendChild(notification);
    
    // Adicionar classe para animar entrada
    setTimeout(() => {
        notification.classList.add('notification-show');
    }, 10);
    
    // Botão para fechar
    const closeButton = notification.querySelector('.notification-close');
    closeButton.addEventListener('click', () => {
        closeNotification(notification);
    });
    
    // Auto-fechar após duração
    setTimeout(() => {
        closeNotification(notification);
    }, duration);
}

// Função para fechar notificação com animação
function closeNotification(notification) {
    notification.classList.remove('notification-show');
    notification.classList.add('notification-hide');
    
    // Remover após animação
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

// Função para lidar com erros de API
function handleApiError(error, defaultMessage = 'Ocorreu um erro na operação.') {
    let message = defaultMessage;
    
    if (error && error.response && error.response.data && error.response.data.message) {
        message = error.response.data.message;
    } else if (error && error.message) {
        message = error.message;
    }
    
    showNotification('error', 'Erro', message);
    console.error('Erro na API:', error);
}

// Função para salvar a última mensagem enviada no localStorage
function saveLastMessage(number, message) {
    localStorage.setItem('lastMessageNumber', number);
    localStorage.setItem('lastMessageText', message);
    showNotification('info', 'Mensagem salva', 'Sua última mensagem foi salva localmente');
}

// Função para obter o QR Code
async function fetchQRCode() {
    try {
        // Atualizar o status da UI para "connecting"
        if (updateStatusUIFunction) {
            connectionStatus = 'connecting';
            updateStatusUIFunction('connecting', 'Gerando QR Code...');
        }
        
        console.log('Iniciando sessão para gerar QR Code...');
        
        // Fazer a requisição para iniciar a sessão e obter o QR Code
        const url = `${API_URL}/whatsapp/start-session`;
        console.log('Solicitando QR Code em:', url);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: getHeaders()
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Erro ao obter QR Code: ${response.status} ${response.statusText}`);
            console.error(`Detalhes: ${errorText}`);
            
            if (updateStatusUIFunction) {
                updateStatusUIFunction('error', 'Erro ao gerar QR');
            }
            
            showNotification('error', 'Erro ao gerar QR Code', 'Tente novamente mais tarde');
            return;
        }
        
        const data = await response.json();
        console.log('Resposta da API (QR Code):', data);
        
        if (data && data.qrcode) {
            // Atualizar o QR Code na UI
            const qrCodeElement = document.getElementById('qrcode');
            if (qrCodeElement) {
                qrCodeElement.innerHTML = ''; // Limpar conteúdo anterior
                
                // Criar uma imagem para o QR Code
                const qrImage = document.createElement('img');
                qrImage.src = data.qrcode;
                qrImage.alt = 'QR Code para WhatsApp';
                qrImage.classList.add('qrcode-img');
                
                qrCodeElement.appendChild(qrImage);
                
                // Atualizar instruções
                const instructionsElement = document.getElementById('qrInstructions');
                if (instructionsElement) {
                    instructionsElement.textContent = 'Escaneie o QR Code com seu WhatsApp para conectar';
                }
            }
            
            // Atualizar o status
            if (updateStatusUIFunction) {
                updateStatusUIFunction('qrReady', 'QR Code pronto');
            }
            
            // Configurar verificação periódica do status
            clearInterval(qrCodeInterval);
            qrCodeInterval = setInterval(updateConnectionStatus, 5000);
        } else {
            console.error('QR Code não encontrado na resposta', data);
            if (updateStatusUIFunction) {
                updateStatusUIFunction('error', 'QR Code inválido');
            }
        }
    } catch (error) {
        console.error('Erro ao buscar QR Code:', error);
        if (updateStatusUIFunction) {
            updateStatusUIFunction('error', 'Erro ao gerar QR');
        }
        
        showNotification('error', 'Erro', 'Não foi possível conectar à API do WhatsApp');
    }
}

// Inicializar a página de QR Code
function initQRCode() {
    const qrTab = document.getElementById('connect');
    
    if (!qrTab) {
        console.error('Tab de conexão não encontrada');
        return;
    }
    
    // Botão gerar QR Code
    const generateQRButton = document.getElementById('connect-btn');
    const disconnectButton = document.getElementById('disconnectWhatsApp');
    
    // Função para atualizar a UI com base no status
    updateStatusUIFunction = function(status, message) {
        const statusElement = document.getElementById('connection-status-text');
        
        if (statusElement) {
            statusElement.textContent = message;
            
            // Remover classes anteriores
            statusElement.classList.remove('status-connected', 'status-connecting', 'status-disconnected', 'status-error');
            
            // Adicionar classe apropriada
            statusElement.classList.add(`status-${status}`);
        }
    };
    
    // Função para desconectar do WhatsApp
    async function disconnect() {
        try {
            console.log('Desconectando do WhatsApp...');
            updateStatusUIFunction('connecting', 'Desconectando...');
            
            const url = `${API_URL}/whatsapp/close-session`;
            const response = await fetch(url, {
                method: 'POST',
                headers: getHeaders()
            });
            
            if (response.ok) {
                console.log('Desconexão bem-sucedida');
                connectionStatus = 'disconnected';
                updateStatusUIFunction('disconnected', 'Desconectado');
                showNotification('info', 'Desconectado', 'Sessão do WhatsApp encerrada com sucesso');
                
                // Limpar o QR Code
                const qrCodeElement = document.getElementById('qrcode');
                if (qrCodeElement) {
                    qrCodeElement.innerHTML = '<i class="fas fa-qrcode"></i>';
                }
                
                // Limpar o intervalo de verificação
                clearInterval(qrCodeInterval);
            } else {
                console.error('Erro ao desconectar');
                updateStatusUIFunction('error', 'Erro ao desconectar');
                showNotification('error', 'Erro', 'Não foi possível desconectar do WhatsApp');
            }
        } catch (error) {
            console.error('Erro ao desconectar:', error);
            updateStatusUIFunction('error', 'Erro ao desconectar');
            showNotification('error', 'Erro', 'Ocorreu um erro ao desconectar do WhatsApp');
        }
    }
    
    // Botão para gerar o QR code
    if (generateQRButton) {
        generateQRButton.addEventListener('click', fetchQRCode);
    }
    
    // Botão para desconectar
    if (disconnectButton) {
        disconnectButton.addEventListener('click', disconnect);
    }
    
    // Verificar o status inicial
    checkToken().then(() => {
        updateConnectionStatus();
    });
}

// Inicializar a página de novos fluxos
function initNewFlow() {
    const newFlowTab = document.getElementById('flows');
    
    if (!newFlowTab) {
        console.error('Tab de fluxos não encontrada');
        return;
    }
    
    // Código de inicialização do editor de fluxos
    console.log('Inicializando editor de fluxos');
    
    // Aqui você pode adicionar o código para inicializar o fluxograma
}

// Inicializar a página de configurações
function initSettings() {
    const settingsTab = document.getElementById('settings');
    
    if (!settingsTab) {
        console.error('Tab de configurações não encontrada');
        return;
    }
    
    // Código de inicialização das configurações
    console.log('Inicializando configurações');
    
    const saveSettingsButton = document.getElementById('saveSettings');
    if (saveSettingsButton) {
        saveSettingsButton.addEventListener('click', () => {
            showNotification('success', 'Configurações salvas', 'Suas configurações foram salvas com sucesso');
        });
    }
}

// Função para enviar mensagem
async function sendMessage(number, message) {
    try {
        // Validar número de telefone
        if (!number || number.trim() === '') {
            showNotification('error', 'Erro', 'Número de telefone é obrigatório');
            return false;
        }
        
        // Validar mensagem
        if (!message || message.trim() === '') {
            showNotification('error', 'Erro', 'Mensagem é obrigatória');
            return false;
        }
        
        // Preparar número (remover caracteres não numéricos)
        const cleanNumber = number.replace(/\D/g, '');
        
        console.log(`Enviando mensagem para ${cleanNumber}: ${message}`);
        
        // Fazer a requisição para a API
        const response = await apiRequest('send-message', 'POST', { 
            phone: cleanNumber, 
            message: message 
        });
        
        const data = await response.json();
        console.log('Resposta do envio:', data);
        
        if (data && data.status === 'SENT') {
            showNotification('success', 'Mensagem enviada', `Mensagem enviada com sucesso para ${number}`);
            saveLastMessage(number, message);
            return true;
        } else {
            showNotification('error', 'Erro', 'Não foi possível enviar a mensagem');
            return false;
        }
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        showNotification('error', 'Erro', 'Ocorreu um erro ao enviar a mensagem');
        return false;
    }
}

// Verificar e gerar token se necessário
async function checkToken() {
    // Verificar se já temos um token salvo
    const savedToken = localStorage.getItem('wpp_session_token');
    
    if (savedToken) {
        console.log('Token encontrado no localStorage');
        sessionToken = savedToken;
        
        // Testar o token com uma requisição simples
        try {
            const response = await fetch(`${API_URL}/whatsapp/status-session`, {
                method: 'GET',
                headers: getHeaders()
            });
            
            if (response.ok) {
                console.log('Token válido');
                return true;
            } else {
                console.log('Token inválido ou expirado. Gerando um novo...');
                // Token inválido, tentar gerar um novo
                return await generateSessionToken();
            }
        } catch (error) {
            console.error('Erro ao verificar token:', error);
            // Em caso de erro, tentar gerar um novo token
            return await generateSessionToken();
        }
    } else {
        console.log('Token não encontrado. Gerando um novo...');
        // Não temos token salvo, gerar um novo
        return await generateSessionToken();
    }
}

// Inicializar botão de envio de mensagem
function initSendMessageButton() {
    const messageTab = document.getElementById('flows');
    
    if (!messageTab) {
        console.error('Tab de mensagens não encontrada');
        return;
    }
    
    const sendMessageForm = document.querySelector('.test-message-form');
    const phoneNumberInput = document.getElementById('test-number');
    const messageTextarea = document.getElementById('test-message');
    const sendButton = document.getElementById('send-test-message');
    
    // Carregar última mensagem enviada
    const lastMessageNumber = localStorage.getItem('lastMessageNumber');
    const lastMessageText = localStorage.getItem('lastMessageText');
    
    if (lastMessageNumber && phoneNumberInput) {
        phoneNumberInput.value = lastMessageNumber;
    }
    
    if (lastMessageText && messageTextarea) {
        messageTextarea.value = lastMessageText;
    }
    
    if (sendButton) {
        sendButton.addEventListener('click', async (e) => {
            e.preventDefault();
            
            // Verificar conexão antes de enviar
            if (connectionStatus !== 'connected') {
                showNotification('error', 'Não conectado', 'Você precisa estar conectado ao WhatsApp para enviar mensagens');
                return;
            }
            
            const number = phoneNumberInput.value;
            const message = messageTextarea.value;
            
            const success = await sendMessage(number, message);
            
            if (success) {
                // Limpar formulário após envio bem-sucedido
                messageTextarea.value = '';
            }
        });
    }
}

// Função principal de inicialização
async function init() {
    // Verificar autenticação
    checkAuth();
    
    // Inicializar todos os componentes da UI
    initNavigation();
    initLogout();
    updateUserInfo();
    
    // Inicializar os componentes das abas
    initQRCode();
    initNewFlow();
    initSettings();
    initSendMessageButton();
    
    // Adicionar evento para chamar função fluxograma.js quando em aba específica
    const fluxosLink = document.querySelector('[data-page="fluxosTab"]');
    if (fluxosLink) {
        fluxosLink.addEventListener('click', () => {
            // Se temos a função de inicialização do fluxograma disponível, chamá-la
            if (typeof initFluxograma === 'function') {
                setTimeout(initFluxograma, 100);
            }
        });
    }
    
    console.log('App inicializado com sucesso!');
}

// Inicializar quando o documento estiver carregado
document.addEventListener('DOMContentLoaded', init); 