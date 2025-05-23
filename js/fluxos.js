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
        if (window.FluxogramaEditor && typeof window.FluxogramaEditor.reset === 'function') {
            window.FluxogramaEditor.reset();
        }
    }
    
    closeBtn.addEventListener('click', closeModal);
    
    // Se o botão de salvar existir, adicionar listener
    if (saveFlowBtn) {
        saveFlowBtn.addEventListener('click', function() {
            saveFlow(closeModal);
        });
    }
}

// Função para salvar o fluxo através da API
async function saveFlow(closeModalCallback) {
    try {
        const nome = document.getElementById('nomeFluxo').value;
        if (!nome) {
            showNotification('warning', 'Atenção', 'O nome do fluxo é obrigatório');
            return;
        }
        
        // Verificar se o fluxo tem pelo menos um nó
        // Esta função deve ser implementada no módulo de fluxograma
        if (typeof window.FluxogramaEditor.getNodesAndLinks !== 'function') {
            console.error('A função getNodesAndLinks não está disponível no FluxogramaEditor');
            showNotification('error', 'Erro', 'Não foi possível obter os dados do fluxo');
            return;
        }
        
        // Obter os nós e links do editor de fluxograma
        const { nodes, links } = window.FluxogramaEditor.getNodesAndLinks();
        
        if (!nodes || nodes.length === 0) {
            showNotification('warning', 'Atenção', 'O fluxo deve conter pelo menos um nó');
            return;
        }
        
        // Verificar se estamos editando um fluxo existente
        const modalElement = document.getElementById('modalNovoFluxo');
        const editIndex = modalElement.getAttribute('data-edit-index');
        
        const flowData = {
            name: nome,
            description: 'Fluxo criado via editor visual',
            nodes: nodes,
            links: links,
            active: true
        };
        
        let response;
        
        if (editIndex) {
            // Atualizar fluxo existente
            response = await fetch(`/api/flows/${editIndex}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(flowData)
            });
        } else {
            // Criar novo fluxo
            response = await fetch('/api/flows', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(flowData)
            });
        }
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erro ao salvar fluxo');
        }
        
        const data = await response.json();
        
        showNotification('success', 'Sucesso', data.message || 'Fluxo salvo com sucesso');
        
        // Atualizar a lista de fluxos
        atualizarListaFluxos();
        
        // Fechar o modal
        if (typeof closeModalCallback === 'function') {
            closeModalCallback();
        }
    } catch (error) {
        console.error('Erro ao salvar fluxo:', error);
        showNotification('error', 'Erro', error.message || 'Não foi possível salvar o fluxo');
    }
}

// Função para atualizar a lista de fluxos
async function atualizarListaFluxos() {
    try {
        const response = await fetch('/api/flows', {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Erro ao buscar fluxos');
        }
        
        const data = await response.json();
        const fluxos = data.flows || [];
        
        // Atualizar a UI com os fluxos
        renderizarListaFluxos(fluxos);
        
        // Atualizar estatísticas
        atualizarEstatisticas();
    } catch (error) {
        console.error('Erro ao atualizar lista de fluxos:', error);
        showNotification('error', 'Erro', 'Não foi possível atualizar a lista de fluxos');
    }
}

// Função para renderizar a lista de fluxos na UI
function renderizarListaFluxos(fluxos) {
    const container = document.querySelector('.flows-list');
    if (!container) return;
    
    // Limpar o container
    container.innerHTML = '';
    
    if (fluxos.length === 0) {
        container.innerHTML = '<p class="empty-state">Nenhum fluxo criado ainda</p>';
        return;
    }
    
    // Criar card para cada fluxo
    fluxos.forEach(fluxo => {
        const card = document.createElement('div');
        card.className = 'flow-card';
        card.setAttribute('data-id', fluxo._id);
        
        // Formatação da data
        const createdDate = new Date(fluxo.createdAt).toLocaleDateString('pt-BR');
        const updatedDate = new Date(fluxo.updatedAt).toLocaleDateString('pt-BR');
        
        // Estatísticas de uso
        const usageCount = fluxo.statistics?.usageCount || 0;
        const successRate = fluxo.statistics?.successRate 
            ? `${Math.round(fluxo.statistics.successRate * 100)}%` 
            : '0%';
        
        card.innerHTML = `
            <div class="flow-card-header">
                <h3>${fluxo.name}</h3>
                <span class="flow-status ${fluxo.active ? 'active' : 'inactive'}">
                    ${fluxo.active ? 'Ativo' : 'Inativo'}
                </span>
            </div>
            <div class="flow-card-body">
                <div class="flow-stats">
                    <div class="flow-stat">
                        <span class="flow-stat-label">Uso:</span>
                        <span class="flow-stat-value">${usageCount}</span>
                    </div>
                    <div class="flow-stat">
                        <span class="flow-stat-label">Sucesso:</span>
                        <span class="flow-stat-value">${successRate}</span>
                    </div>
                </div>
                <div class="flow-dates">
                    <div class="flow-date">
                        <span class="flow-date-label">Criado:</span>
                        <span class="flow-date-value">${createdDate}</span>
                    </div>
                    <div class="flow-date">
                        <span class="flow-date-label">Atualizado:</span>
                        <span class="flow-date-value">${updatedDate}</span>
                    </div>
                </div>
            </div>
            <div class="flow-card-actions">
                <button class="edit-flow-btn" data-id="${fluxo._id}" data-tooltip="Editar fluxo">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="toggle-flow-btn" data-id="${fluxo._id}" data-active="${fluxo.active}" data-tooltip="${fluxo.active ? 'Desativar' : 'Ativar'}">
                    <i class="fas ${fluxo.active ? 'fa-toggle-on' : 'fa-toggle-off'}"></i>
                </button>
                <button class="delete-flow-btn" data-id="${fluxo._id}" data-tooltip="Excluir fluxo">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        container.appendChild(card);
    });
    
    // Adicionar listeners aos botões
    attachFlowCardListeners();
}

// Função para anexar listeners aos botões dos cards de fluxo
function attachFlowCardListeners() {
    // Botões de edição
    document.querySelectorAll('.edit-flow-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const flowId = e.currentTarget.getAttribute('data-id');
            editFlow(flowId);
        });
    });
    
    // Botões de ativar/desativar
    document.querySelectorAll('.toggle-flow-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const flowId = e.currentTarget.getAttribute('data-id');
            const isActive = e.currentTarget.getAttribute('data-active') === 'true';
            toggleFlowActive(flowId, !isActive);
        });
    });
    
    // Botões de exclusão
    document.querySelectorAll('.delete-flow-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const flowId = e.currentTarget.getAttribute('data-id');
            const flowName = e.currentTarget.closest('.flow-card').querySelector('h3').textContent;
            
            if (confirm(`Deseja realmente excluir o fluxo "${flowName}"?`)) {
                deleteFlow(flowId);
            }
        });
    });
}

// Função para editar um fluxo existente
async function editFlow(flowId) {
    try {
        const response = await fetch(`/api/flows/${flowId}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Erro ao buscar dados do fluxo');
        }
        
        const data = await response.json();
        const fluxo = data.flow;
        
        if (!fluxo) {
            throw new Error('Fluxo não encontrado');
        }
        
        // Abrir o modal e preencher com os dados do fluxo
        const modal = document.getElementById('modalNovoFluxo');
        if (!modal) return;
        
        // Definir o ID do fluxo que está sendo editado
        modal.setAttribute('data-edit-index', flowId);
        
        // Preencher nome do fluxo
        document.getElementById('nomeFluxo').value = fluxo.name;
        
        // Abrir o modal
        modal.style.display = 'block';
        
        // Carregar o fluxo no editor (após um breve delay para garantir que o editor esteja inicializado)
        setTimeout(() => {
            if (window.FluxogramaEditor && typeof window.FluxogramaEditor.loadFlow === 'function') {
                window.FluxogramaEditor.loadFlow(fluxo);
            } else {
                console.error('A função loadFlow não está disponível no FluxogramaEditor');
            }
        }, 300);
    } catch (error) {
        console.error('Erro ao editar fluxo:', error);
        showNotification('error', 'Erro', error.message || 'Não foi possível editar o fluxo');
    }
}

// Função para ativar/desativar um fluxo
async function toggleFlowActive(flowId, newActiveState) {
    try {
        const response = await fetch(`/api/flows/${flowId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ active: newActiveState })
        });
        
        if (!response.ok) {
            throw new Error('Erro ao atualizar status do fluxo');
        }
        
        // Atualizar a lista de fluxos
        atualizarListaFluxos();
        
        showNotification('success', 'Sucesso', `Fluxo ${newActiveState ? 'ativado' : 'desativado'} com sucesso`);
    } catch (error) {
        console.error('Erro ao atualizar status do fluxo:', error);
        showNotification('error', 'Erro', error.message || 'Não foi possível atualizar o status do fluxo');
    }
}

// Função para excluir um fluxo
async function deleteFlow(flowId) {
    try {
        const response = await fetch(`/api/flows/${flowId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Erro ao excluir fluxo');
        }
        
        // Atualizar a lista de fluxos
        atualizarListaFluxos();
        
        showNotification('success', 'Sucesso', 'Fluxo excluído com sucesso');
    } catch (error) {
        console.error('Erro ao excluir fluxo:', error);
        showNotification('error', 'Erro', error.message || 'Não foi possível excluir o fluxo');
    }
}

// Função para atualizar as estatísticas
async function atualizarEstatisticas() {
    try {
        const response = await fetch('/api/flows/stats', {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Erro ao buscar estatísticas');
        }
        
        const data = await response.json();
        const stats = data.stats;
        
        // Atualizar os cartões de estatística no dashboard
        const statCards = document.querySelectorAll('.dashboard-stats .stat-card p');
        if (statCards.length >= 3) {
            // Mensagens
            statCards[0].textContent = stats.totalMessages || 0;
            // Substituir "Contatos" por "Total de Fluxos"
            statCards[1].textContent = stats.totalFlows || 0;
            // Fluxos ativos
            statCards[2].textContent = stats.activeFlows || 0;
        }
    } catch (error) {
        console.error('Erro ao atualizar estatísticas:', error);
        // Não mostrar notificação para não atrapalhar a experiência do usuário
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