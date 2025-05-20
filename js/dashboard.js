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
const API_URL = 'http://localhost:8000';

// Inicializar QR Code
function initQRCode() {
    const qrContainer = document.querySelector('.qr-code');
    const connectBtn = document.querySelector('.connect-btn');
    const statusText = document.createElement('p');
    statusText.className = 'status-text';
    statusText.textContent = 'Desconectado';
    statusText.classList.add('status-disconnected');
    
    // Adicionar mensagem de status após o botão
    connectBtn.parentNode.insertBefore(statusText, connectBtn.nextSibling);
    
    // Função para buscar QR Code
    async function fetchQRCode() {
        statusText.textContent = 'Gerando QR Code...';
        statusText.className = 'status-text';
        
        try {
            // Iniciar sessão
            await fetch(`${API_URL}/start`, { method: 'POST' });
            
            // Pequeno delay para garantir que o QR code seja gerado
            setTimeout(async () => {
                try {
                    const response = await fetch(`${API_URL}/qrcode`);
                    
                    if (response.ok) {
                        const data = await response.json();
                        
                        if (data.qrcode) {
                            // Limpar conteúdo atual
                            qrContainer.innerHTML = '';
                            
                            // Criar imagem do QR Code
                            const img = document.createElement('img');
                            img.src = data.qrcode;
                            qrContainer.appendChild(img);
                            
                            statusText.textContent = 'Escaneie o QR Code com seu WhatsApp';
                            statusText.className = 'status-text';
                        }
                    } else {
                        throw new Error('QR Code não disponível');
                    }
                } catch (error) {
                    console.error('Erro ao buscar QR code:', error);
                    qrContainer.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
                    statusText.textContent = 'Erro ao gerar QR Code. Tente novamente.';
                    statusText.classList.add('status-disconnected');
                }
            }, 2000);
            
        } catch (error) {
            console.error('Erro ao iniciar sessão:', error);
            qrContainer.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
            statusText.textContent = 'Erro ao conectar ao servidor. Verifique se o backend está rodando.';
            statusText.classList.add('status-disconnected');
        }
    }
    
    // Evento do botão para gerar QR Code
    connectBtn.addEventListener('click', fetchQRCode);
    
    // Tentar buscar QR Code ao carregar a página
    fetchQRCode();
}

// Inicializar botão de novo fluxo
function initNewFlow() {
    // Não precisa mais do alert, pois o modal já está implementado
    // A função de abrir o modal está em initModalNovoFluxo()
}

// Inicializar configurações
function initSettings() {
    const settingsInputs = document.querySelectorAll('.setting-item input, .setting-item textarea');
    settingsInputs.forEach(input => {
        input.addEventListener('change', () => {
            // Aqui será implementada a lógica para salvar as configurações
            alert('Configurações salvas com sucesso!');
        });
    });
}

// Função para enviar mensagem via API
async function sendMessage(number, message) {
    try {
        const response = await fetch(`${API_URL}/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ number, message }),
        });
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        throw error;
    }
}

// Modal Novo Fluxo
function initModalNovoFluxo() {
    const modal = document.getElementById('modalNovoFluxo');
    const openBtn = document.querySelector('.new-flow-btn');
    const closeBtn = document.getElementById('closeModalNovoFluxo');
    const cancelBtn = document.getElementById('cancelNovoFluxo');
    const addPerguntaRespostaBtn = document.getElementById('addPerguntaResposta');
    const perguntasRespostasContainer = document.getElementById('perguntasRespostasContainer');
    const form = document.getElementById('formNovoFluxo');

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
        alert('Fluxo salvo com sucesso!');
        modal.style.display = 'none';
        form.reset();
        perguntasRespostasContainer.innerHTML = `<div class="pergunta-resposta">
            <input type="text" class="pergunta" placeholder="Pergunta" required>
            <input type="text" class="resposta" placeholder="Resposta" required>
        </div>`;
    });
}

// Inicializar todas as funcionalidades
function init() {
    checkAuth();
    initNavigation();
    initLogout();
    updateUserInfo();
    initQRCode();
    initNewFlow();
    initSettings();
    initModalNovoFluxo();
    window.sendWhatsAppMessage = sendMessage;
}

// Iniciar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', init); 