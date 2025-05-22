// Funções para gerenciar fluxos interativos

// Modal Novo Fluxo
function initModalNovoFluxo() {
    const modal = document.getElementById('modalNovoFluxo');
    if (!modal) {
        console.log('Modal Novo Fluxo não encontrado, pulando inicialização');
        return;
    }
    
    const openBtn = document.getElementById('btnNovoFluxo');
    const closeBtn = modal.querySelector('.close');
    const addNodeBtn = document.getElementById('add-node-opcao');
    const saveFlowBtn = document.getElementById('save-flow');
    const fluxogramaEditor = document.getElementById('fluxograma-editor');

    // Verificar se todos os elementos necessários estão presentes
    if (!openBtn || !closeBtn || !fluxogramaEditor) {
        console.error('Elementos necessários para Modal Novo Fluxo não encontrados no DOM');
        return;
    }

    // Abrir modal
    openBtn.addEventListener('click', () => {
        modal.style.display = 'block';
        // Resetar o editor para um novo fluxo
        resetEditor();
    });
    
    // Fechar modal
    function closeModal() {
        modal.style.display = 'none';
    }
    
    // Função para resetar o editor de fluxo
    function resetEditor() {
        document.getElementById('nomeFluxo').value = '';
        // Limpar o editor de fluxograma
        if (typeof initFluxograma === 'function') {
            initFluxograma();
        }
    }
    
    closeBtn.addEventListener('click', closeModal);
    
    // Se o botão de salvar existir, adicionar listener
    if (saveFlowBtn) {
        saveFlowBtn.addEventListener('click', function() {
            const nome = document.getElementById('nomeFluxo').value;
            if (!nome) {
                showNotification('warning', 'Atenção', 'O nome do fluxo é obrigatório');
                return;
            }
            
            // Aqui salvaria o fluxo
            showNotification('success', 'Sucesso', 'Fluxo salvo com sucesso');
            closeModal();
        });
    }
}

// Configuração do botão de enviar mensagem de teste
function initSendTestMessage() {
    const sendButton = document.getElementById('send-test-message');
    if (!sendButton) {
        console.log('Botão de enviar mensagem não encontrado');
        return;
    }
    
    sendButton.addEventListener('click', function() {
        const number = document.getElementById('test-number').value;
        const message = document.getElementById('test-message').value;
        
        if (!number || !message) {
            showNotification('error', 'Erro', 'Preencha o número e a mensagem');
            return;
        }
        
        // Simular envio
        document.getElementById('message-status').textContent = 'Enviando...';
        
        setTimeout(() => {
            document.getElementById('message-status').textContent = 'Mensagem enviada com sucesso!';
            showNotification('success', 'Sucesso', 'Mensagem enviada com sucesso!');
        }, 1500);
    });
    
    console.log('Botão de novo fluxo configurado');
}

// Função principal para inicializar o módulo de fluxos
function initFluxograma() {
    console.log('Módulo de fluxos inicializado com sucesso');
    // Inicializar components
    initModalNovoFluxo();
    initSendTestMessage();
}

// Função para atualizar a lista de fluxos na interface
function atualizarListaFluxos() {
    const fluxosContainer = document.querySelector('.flows-list');
    const fluxosSalvos = JSON.parse(localStorage.getItem('zapbot_fluxos') || '[]');
    
    if (!fluxosContainer) {
        console.error('Container de fluxos não encontrado');
        return;
    }
    
    if (fluxosSalvos.length === 0) {
        fluxosContainer.innerHTML = '<p class="empty-state">Nenhum fluxo criado ainda</p>';
        return;
    }
    
    let html = '<div class="fluxos-grid">';
    
    fluxosSalvos.forEach((fluxo, index) => {
        html += `
            <div class="fluxo-card" data-index="${index}">
                <div class="fluxo-card-header">
                    <h3>${fluxo.nome}</h3>
                    <div class="fluxo-actions">
                        <button class="edit-fluxo" data-index="${index}" data-tooltip="Editar fluxo">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="delete-fluxo" data-index="${index}" data-tooltip="Excluir fluxo">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="fluxo-preview">
                    <p><strong>Mensagem inicial:</strong> ${fluxo.mensagemInicial}</p>
                    <p><strong>Opções:</strong> ${fluxo.opcoes.length}</p>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    fluxosContainer.innerHTML = html;
    
    // Adicionar event listeners aos botões de editar e excluir
    document.querySelectorAll('.edit-fluxo').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = this.getAttribute('data-index');
            editarFluxo(index);
        });
    });
    
    document.querySelectorAll('.delete-fluxo').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = this.getAttribute('data-index');
            excluirFluxo(index);
        });
    });
    
    console.log(`Listagem atualizada: ${fluxosSalvos.length} fluxos exibidos`);
}

// Função para editar um fluxo existente
function editarFluxo(index) {
    const fluxosSalvos = JSON.parse(localStorage.getItem('zapbot_fluxos') || '[]');
    const fluxo = fluxosSalvos[index];
    
    if (!fluxo) {
        showNotification('error', 'Erro', 'Fluxo não encontrado');
        return;
    }
    
    // Abrir o modal
    const modal = document.getElementById('modalNovoFluxo');
    if (!modal) {
        console.error('Modal não encontrado');
        return;
    }
    
    modal.setAttribute('data-edit-index', index);
    modal.style.display = 'block';
    
    // Preencher o nome do fluxo
    const nomeFluxoInput = document.getElementById('nomeFluxo');
    if (nomeFluxoInput) {
        nomeFluxoInput.value = fluxo.nome;
    }
    
    // Resetar e carregar o fluxograma
    setTimeout(() => {
        if (window.FluxogramaEditor && typeof window.FluxogramaEditor.loadFluxo === 'function') {
            window.FluxogramaEditor.loadFluxo(fluxo);
            showNotification('info', 'Editor de Fluxograma', 'Agora você pode editar o fluxo usando o editor gráfico');
        } else {
            showNotification('error', 'Editor não carregado', 'O editor de fluxograma não está disponível');
        }
    }, 500);
}

// Função para excluir um fluxo
function excluirFluxo(index) {
    if (confirm('Tem certeza que deseja excluir este fluxo?')) {
        const fluxosSalvos = JSON.parse(localStorage.getItem('zapbot_fluxos') || '[]');
        fluxosSalvos.splice(index, 1);
        localStorage.setItem('zapbot_fluxos', JSON.stringify(fluxosSalvos));
        
        showNotification('success', 'Fluxo Excluído', 'O fluxo foi excluído com sucesso');
        atualizarListaFluxos();
    }
}

// Inicialização quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar o modal
    initModalNovoFluxo();
    
    // Configurar o botão "Novo Fluxo"
    const newFlowBtn = document.getElementById('btnNovoFluxo');
    if (newFlowBtn) {
        newFlowBtn.addEventListener('click', () => {
            const modal = document.getElementById('modalNovoFluxo');
            if (modal) {
                // Remover qualquer índice de edição anterior
                modal.removeAttribute('data-edit-index');
                
                // Limpar o campo de nome
                const nomeFluxoInput = document.getElementById('nomeFluxo');
                if (nomeFluxoInput) {
                    nomeFluxoInput.value = '';
                }
                
                // Abrir o modal
                modal.style.display = 'block';
                
                // Inicializar/resetar o fluxograma
                setTimeout(() => {
                    if (window.FluxogramaEditor && typeof window.FluxogramaEditor.init === 'function') {
                        window.FluxogramaEditor.init();
                    } else {
                        console.error('FluxogramaEditor não está disponível');
                    }
                }, 300);
            }
        });
        console.log('Botão de novo fluxo configurado');
    }
    
    // Atualizar a lista de fluxos
    atualizarListaFluxos();
    
    console.log('Módulo de fluxos inicializado com sucesso');
}); 