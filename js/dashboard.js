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

// Função para buscar QR Code
async function fetchQRCode() {
    try {
        const qrContainer = document.getElementById('qrcode');
        if (!qrContainer) {
            console.error('Elemento QR Code não encontrado');
            return;
        }
        
        // Mostrar indicador de carregamento
        qrContainer.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        
        // Atualizar status
        if (updateStatusUIFunction) {
            updateStatusUIFunction('connecting', 'Gerando QR Code...');
        }
        
        // Solicitar QR Code da API
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
        
        if (!response.ok) {
            throw new Error(`Erro ao iniciar sessão: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('QR Code recebido:', data);
        
        if (!data || !data.qrcode) {
            throw new Error('QR Code não recebido do servidor');
        }
        
        // Exibir QR Code - tentativa direta usando HTML e CSS inline
        let qrSource = '';
        
        // Tentar extrair a string base64 independente do formato
        if (typeof data.qrcode === 'string') {
            qrSource = data.qrcode.startsWith('data:') 
                ? data.qrcode 
                : 'data:image/png;base64,' + data.qrcode;
        } else if (typeof data.qrcode === 'object' && data.qrcode !== null) {
            if (data.qrcode.base64Qr) {
                qrSource = 'data:image/png;base64,' + data.qrcode.base64Qr;
            } else if (data.qrcode.qrcode && typeof data.qrcode.qrcode === 'string') {
                qrSource = data.qrcode.qrcode.startsWith('data:') 
                    ? data.qrcode.qrcode 
                    : 'data:image/png;base64,' + data.qrcode.qrcode;
            } else {
                throw new Error('Formato de QR Code não reconhecido');
            }
        } else {
            throw new Error('Formato de QR Code não suportado');
        }
        
        // Adicionar QR Code diretamente como atributo background-image
        qrContainer.innerHTML = '';
        qrContainer.style.backgroundImage = `url(${qrSource})`;
        qrContainer.style.backgroundSize = 'contain';
        qrContainer.style.backgroundPosition = 'center';
        qrContainer.style.backgroundRepeat = 'no-repeat';
        
        // Atualizar status
        if (updateStatusUIFunction) {
            updateStatusUIFunction('connecting', 'Escaneie o QR Code');
        }
        
        // Iniciar verificação periódica do status
        if (!qrCodeInterval) {
            qrCodeInterval = setInterval(updateConnectionStatus, 3000);
        }
        
        // Notificar usuário
        showNotification('success', 'QR Code Gerado', 'Escaneie o QR Code com seu WhatsApp');
        
    } catch (error) {
        console.error('Erro ao buscar QR Code:', error);
        
        const qrContainer = document.getElementById('qrcode');
        if (qrContainer) {
            qrContainer.innerHTML = '<div class="qr-error"><i class="fas fa-exclamation-triangle"></i><p>Erro ao gerar QR Code</p></div>';
        }
        
        // Atualizar status
        if (updateStatusUIFunction) {
            updateStatusUIFunction('disconnected', 'Erro ao gerar QR Code');
        }
        
        // Notificar usuário
        showNotification('error', 'Erro', error.message || 'Erro ao gerar QR Code');
    }
}

// Inicializar QR Code e gerenciamento de conexão
function initQRCode() {
    console.log("Inicializando QR Code...");
    
    const qrContainer = document.getElementById('qrcode');
    const connectBtn = document.getElementById('connect-btn');
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
            // Não modificar o QR code quando estiver conectando
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
    
    // Disponibilizar funções globalmente
    window.sendWhatsAppMessage = sendMessage;
    
    // Função especial para testar a exibição de QR Code diretamente
    window.testQRCode = function() {
        // QR Code de exemplo (uma imagem pequena em base64)
        const testQrCode = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAABmJLR0QA/wD/AP+gvaeTAAAA30lEQVRoge2ZMQ6CQBBFn8baA3gUj0JtLT2JNpbewcIjeGprY2o3ycZiBggJzP5/yRSEeS+zu0MgiqIoiqIoiqIoyjiJHnXm3glYAxvg5JzbBVUVRETiTUS+9olKRFnHmiG0PLzARxP5C8YdKxmwB+bOuUdr4dnw9ZVIgeLIKYiRplmAFZDmcT2UmCFDlL5Dq9pIBtzD60qU7exn12oF3IA5sAvrrx8ZUfo+HvMrlZLJBnSSUeaOK6NUyGRB+skoK8bTuVqiRA0Z+svm7n3+NcMWWHoXKYqiKIqiKIryfzwBUss8kilwVikAAAAASUVORK5CYII=';
        
        console.log('Testando exibição direta de QR Code...');
        
        const qrContainer = document.querySelector('.qr-code');
        if (!qrContainer) {
            console.error('Elemento QR code não encontrado');
            return;
        }
        
        // Limpar container
        qrContainer.innerHTML = '';
        
        // Criar elemento de imagem
        const img = document.createElement('img');
        
        // Configurar atributos e estilo
        img.alt = 'QR Code de Teste';
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.position = 'absolute';
        img.style.top = '0';
        img.style.left = '0';
        img.style.objectFit = 'contain';
        
        // Evento de carregamento
        img.addEventListener('load', function() {
            console.log('QR Code de teste carregado com sucesso');
        });
        
        // Evento de erro
        img.addEventListener('error', function(e) {
            console.error('Erro ao carregar QR Code de teste', e);
        });
        
        // Definir a fonte da imagem
        img.src = testQrCode;
        
        // Adicionar ao DOM
        qrContainer.appendChild(img);
        
        return 'Teste de QR Code iniciado - verifique a tela';
    };
    
    window.debugQRCode = function(base64String) {
        const qrContainer = document.querySelector('.qr-code');
        if (!qrContainer) {
            console.error('Elemento QR Code não encontrado');
            return;
        }
        
        console.log('Tentando exibir QR Code via Debug');
        
        // Limpar container
        qrContainer.innerHTML = '';
        
        // Criar imagem
        const img = document.createElement('img');
        img.src = base64String.startsWith('data:image/') 
            ? base64String 
            : 'data:image/png;base64,' + base64String;
            
        // Aplicar estilos
        img.style.width = '100%';
        img.style.height = 'auto';
        img.style.maxWidth = '250px';
        img.style.maxHeight = '250px';
        img.style.display = 'block';
        img.style.margin = '0 auto';
        
        // Adicionar ao DOM
        qrContainer.appendChild(img);
        
        console.log('QR Code adicionado via debug');
    };
}

// Iniciar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM carregado, iniciando aplicação');
    init().catch(error => {
        console.error('Erro ao inicializar aplicação:', error);
        showNotification('error', 'Erro de inicialização', 'Não foi possível inicializar a aplicação corretamente');
    });
}); 