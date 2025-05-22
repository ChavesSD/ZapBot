// Funções para gerenciar fluxos interativos

// Modal Novo Fluxo
function initModalNovoFluxo() {
    const modal = document.getElementById('modalNovoFluxo');
    if (!modal) {
        console.log('Modal Novo Fluxo não encontrado, pulando inicialização');
        return;
    }
    
    const openBtn = document.querySelector('.new-flow-btn');
    const closeBtn = modal.querySelector('.close');
    const cancelBtn = modal.querySelector('.cancel');
    const addOpcaoBtn = document.getElementById('addOpcao');
    const opcoesContainer = document.getElementById('opcoesContainer');
    const form = document.getElementById('formNovoFluxo');

    // Verificar se todos os elementos necessários estão presentes
    if (!openBtn || !closeBtn || !cancelBtn || !addOpcaoBtn || !opcoesContainer || !form) {
        console.error('Elementos necessários para Modal Novo Fluxo não encontrados no DOM');
        return;
    }

    // Abrir modal
    openBtn.addEventListener('click', () => {
        modal.style.display = 'block';
        // Resetar o formulário para um novo fluxo
        resetForm();
        // Não estamos editando, então não há índice
        form.removeAttribute('data-edit-index');
    });
    
    // Fechar modal
    function resetAndCloseModal() {
        modal.style.display = 'none';
        resetForm();
    }
    
    // Função para resetar o formulário
    function resetForm() {
        form.reset();
        
        // Reset opções para o estado inicial
        opcoesContainer.innerHTML = `
            <div class="opcao-container">
                <div class="opcao-header">
                    <h4>Opção 1</h4>
                    <button type="button" class="remove-opcao" data-tooltip="Remover opção"><i class="fas fa-trash"></i></button>
                </div>
                <div class="form-group">
                    <label>Texto da opção:</label>
                    <input type="text" class="opcao-texto" placeholder="Ex: Digite 1 para Comercial" required>
                </div>
                <div class="form-group">
                    <label>Resposta para esta opção:</label>
                    <textarea class="opcao-resposta" placeholder="Mensagem que será enviada quando o usuário escolher esta opção" required></textarea>
                </div>
                <div class="subfluxo-container">
                    <div class="form-group subfluxo-toggle">
                        <label class="toggle-label">
                            <input type="checkbox" class="habilitar-subfluxo">
                            <span class="toggle-text">Adicionar sub-opções para esta resposta</span>
                        </label>
                    </div>
                    <div class="subfluxo-opcoes" style="display: none;">
                        <h5>Sub-opções</h5>
                        <div class="subfluxo-lista">
                            <div class="subfluxo-item">
                                <div class="form-group">
                                    <label>Texto da sub-opção:</label>
                                    <input type="text" class="subfluxo-texto" placeholder="Ex: Digite 1 para Vendas" required>
                                </div>
                                <div class="form-group">
                                    <label>Resposta:</label>
                                    <textarea class="subfluxo-resposta" placeholder="Resposta para esta sub-opção" required></textarea>
                                </div>
                                <button type="button" class="remove-subfluxo" data-tooltip="Remover sub-opção"><i class="fas fa-trash"></i></button>
                            </div>
                        </div>
                        <button type="button" class="add-subfluxo" data-tooltip="Adicionar sub-opção"><i class="fas fa-plus"></i> Adicionar Sub-opção</button>
                    </div>
                </div>
            </div>
        `;
        
        // Reativar os event listeners
        setupEventListeners();
    }
    
    closeBtn.addEventListener('click', resetAndCloseModal);
    cancelBtn.addEventListener('click', resetAndCloseModal);
    
    // Função para configurar event listeners nas opções e sub-opções
    function setupEventListeners() {
        // Event listeners para os botões de remover opção
        document.querySelectorAll('.remove-opcao').forEach(btn => {
            btn.addEventListener('click', function() {
                // Impedir a remoção se for a única opção
                if (opcoesContainer.querySelectorAll('.opcao-container').length <= 1) {
                    showNotification('warning', 'Atenção', 'É necessário ter pelo menos uma opção no fluxo');
                    return;
                }
                
                this.closest('.opcao-container').remove();
                
                // Atualizar os números das opções
                updateOpcaoNumbers();
            });
        });
        
        // Event listeners para toggles de sub-fluxo
        document.querySelectorAll('.habilitar-subfluxo').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const subfluxoOpcoes = this.closest('.subfluxo-container').querySelector('.subfluxo-opcoes');
                subfluxoOpcoes.style.display = this.checked ? 'block' : 'none';
            });
        });
        
        // Event listeners para adicionar sub-opção
        document.querySelectorAll('.add-subfluxo').forEach(btn => {
            btn.addEventListener('click', function() {
                const subfluxoLista = this.previousElementSibling;
                const newSubfluxo = document.createElement('div');
                newSubfluxo.className = 'subfluxo-item';
                newSubfluxo.innerHTML = `
                    <div class="form-group">
                        <label>Texto da sub-opção:</label>
                        <input type="text" class="subfluxo-texto" placeholder="Ex: Digite 1 para Vendas" required>
                    </div>
                    <div class="form-group">
                        <label>Resposta:</label>
                        <textarea class="subfluxo-resposta" placeholder="Resposta para esta sub-opção" required></textarea>
                    </div>
                    <button type="button" class="remove-subfluxo" data-tooltip="Remover sub-opção"><i class="fas fa-trash"></i></button>
                `;
                
                subfluxoLista.appendChild(newSubfluxo);
                
                // Adicionar event listener para o botão remover
                newSubfluxo.querySelector('.remove-subfluxo').addEventListener('click', function() {
                    if (subfluxoLista.querySelectorAll('.subfluxo-item').length <= 1) {
                        showNotification('warning', 'Atenção', 'É necessário ter pelo menos uma sub-opção');
                        return;
                    }
                    newSubfluxo.remove();
                });
            });
        });
        
        // Event listeners para remover sub-opção
        document.querySelectorAll('.remove-subfluxo').forEach(btn => {
            btn.addEventListener('click', function() {
                const subfluxoLista = this.closest('.subfluxo-lista');
                if (subfluxoLista.querySelectorAll('.subfluxo-item').length <= 1) {
                    showNotification('warning', 'Atenção', 'É necessário ter pelo menos uma sub-opção');
                    return;
                }
                this.closest('.subfluxo-item').remove();
            });
        });
    }
    
    // Função para atualizar os números das opções
    function updateOpcaoNumbers() {
        const opcoes = opcoesContainer.querySelectorAll('.opcao-container');
        opcoes.forEach((opcao, index) => {
            opcao.querySelector('h4').textContent = `Opção ${index + 1}`;
        });
    }
    
    // Adicionar nova opção
    addOpcaoBtn.addEventListener('click', () => {
        const numOpcoes = opcoesContainer.querySelectorAll('.opcao-container').length;
        const div = document.createElement('div');
        div.className = 'opcao-container';
        div.innerHTML = `
            <div class="opcao-header">
                <h4>Opção ${numOpcoes + 1}</h4>
                <button type="button" class="remove-opcao" data-tooltip="Remover opção"><i class="fas fa-trash"></i></button>
            </div>
            <div class="form-group">
                <label>Texto da opção:</label>
                <input type="text" class="opcao-texto" placeholder="Ex: Digite ${numOpcoes + 1} para Comercial" required>
            </div>
            <div class="form-group">
                <label>Resposta para esta opção:</label>
                <textarea class="opcao-resposta" placeholder="Mensagem que será enviada quando o usuário escolher esta opção" required></textarea>
            </div>
            <div class="subfluxo-container">
                <div class="form-group subfluxo-toggle">
                    <label class="toggle-label">
                        <input type="checkbox" class="habilitar-subfluxo">
                        <span class="toggle-text">Adicionar sub-opções para esta resposta</span>
                    </label>
                </div>
                <div class="subfluxo-opcoes" style="display: none;">
                    <h5>Sub-opções</h5>
                    <div class="subfluxo-lista">
                        <div class="subfluxo-item">
                            <div class="form-group">
                                <label>Texto da sub-opção:</label>
                                <input type="text" class="subfluxo-texto" placeholder="Ex: Digite 1 para Vendas" required>
                            </div>
                            <div class="form-group">
                                <label>Resposta:</label>
                                <textarea class="subfluxo-resposta" placeholder="Resposta para esta sub-opção" required></textarea>
                            </div>
                            <button type="button" class="remove-subfluxo" data-tooltip="Remover sub-opção"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                    <button type="button" class="add-subfluxo" data-tooltip="Adicionar sub-opção"><i class="fas fa-plus"></i> Adicionar Sub-opção</button>
                </div>
            </div>
        `;
        
        opcoesContainer.appendChild(div);
        setupEventListeners();
    });
    
    // Configurar handlers iniciais
    setupEventListeners();
    
    // Submeter novo fluxo
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Obter nome do fluxo e mensagem inicial
        const nomeFluxo = document.getElementById('nomeFluxo').value;
        const mensagemInicial = document.getElementById('mensagemInicial').value;
        
        // Construir o objeto de fluxo
        const fluxo = {
            nome: nomeFluxo,
            mensagemInicial: mensagemInicial,
            opcoes: []
        };
        
        // Processar todas as opções
        const opcoesElements = opcoesContainer.querySelectorAll('.opcao-container');
        opcoesElements.forEach((opcaoElement, index) => {
            const opcaoTexto = opcaoElement.querySelector('.opcao-texto').value;
            const opcaoResposta = opcaoElement.querySelector('.opcao-resposta').value;
            const habilitarSubfluxo = opcaoElement.querySelector('.habilitar-subfluxo').checked;
            
            const opcao = {
                numero: index + 1,
                texto: opcaoTexto,
                resposta: opcaoResposta,
                temSubfluxo: habilitarSubfluxo,
                subOpcoes: []
            };
            
            // Se tiver sub-opções, processar
            if (habilitarSubfluxo) {
                const subOpcoesElements = opcaoElement.querySelectorAll('.subfluxo-item');
                subOpcoesElements.forEach((subOpcaoElement, subIndex) => {
                    const subOpcaoTexto = subOpcaoElement.querySelector('.subfluxo-texto').value;
                    const subOpcaoResposta = subOpcaoElement.querySelector('.subfluxo-resposta').value;
                    
                    opcao.subOpcoes.push({
                        numero: subIndex + 1,
                        texto: subOpcaoTexto,
                        resposta: subOpcaoResposta
                    });
                });
            }
            
            fluxo.opcoes.push(opcao);
        });
        
        // Verificar se estamos editando ou criando um novo fluxo
        const editIndex = form.getAttribute('data-edit-index');
        const fluxosSalvos = JSON.parse(localStorage.getItem('zapbot_fluxos') || '[]');
        
        if (editIndex !== null && editIndex !== undefined) {
            // Estamos editando um fluxo existente
            fluxosSalvos[editIndex] = fluxo;
            showNotification('success', 'Fluxo Atualizado', 'Seu fluxo de conversa foi atualizado com sucesso!');
        } else {
            // Estamos criando um novo fluxo
            fluxosSalvos.push(fluxo);
            showNotification('success', 'Fluxo Salvo', 'Seu fluxo de conversa interativo foi salvo com sucesso!');
        }
        
        // Salvar no localStorage
        localStorage.setItem('zapbot_fluxos', JSON.stringify(fluxosSalvos));
        
        // Fechar o modal e resetar o formulário
        resetAndCloseModal();
        
        // Atualizar a lista de fluxos
        atualizarListaFluxos();
    });
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