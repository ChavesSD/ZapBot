// Fluxograma.js - Implementação do editor de fluxos usando D3.js

// Variáveis globais
let svg;
let g; // Grupo principal para transformações (zoom/pan)
let simulation;
let nodes = [];
let links = [];
let selectedNode = null;
let nodeIdCounter = 1;
let zoom; // Variável para controlar o zoom

// Inicializar o editor de fluxograma
document.addEventListener('DOMContentLoaded', () => {
    // Configurar o modal de edição de nó
    setupNodeEditModal();
    
    // Configurar os botões de controle
    setupControlButtons();
    
    // Observar abertura do modal para inicializar o fluxograma
    const modalObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'style' && 
                mutation.target.style.display === 'block') {
                console.log('Modal de fluxograma aberto, inicializando editor');
                setTimeout(initFluxograma, 100);
                
                // Ajustar o tamanho do fluxograma quando o modal é aberto
                adjustFluxogramaSize();
            }
        });
    });
    
    const modalElement = document.getElementById('modalNovoFluxo');
    if (modalElement) {
        modalObserver.observe(modalElement, { attributes: true });
    }
    
    // Adicionar evento de redimensionamento da janela
    window.addEventListener('resize', adjustFluxogramaSize);
    
    console.log('Editor de fluxograma inicializado');
});

// Ajustar o tamanho do fluxograma para ocupar todo o espaço disponível
function adjustFluxogramaSize() {
    const container = document.getElementById('fluxograma-editor');
    if (!container || !svg) return;
    
    // Obter o tamanho do container
    const containerRect = container.getBoundingClientRect();
    
    // Definir SVG para ocupar 100% do container
    svg.attr('width', containerRect.width)
       .attr('height', containerRect.height);
       
    // Atualizar o centro da simulação
    if (simulation) {
        simulation.force('center', d3.forceCenter(containerRect.width / 2, containerRect.height / 2));
        simulation.alpha(0.3).restart();
    }
}

// Inicializar o componente D3.js
function initFluxograma() {
    const container = document.getElementById('fluxograma-editor');
    if (!container) {
        console.error('Container do fluxograma não encontrado');
        return;
    }
    
    console.log('Inicializando fluxograma no container:', container);
    
    // Limpar o container primeiro
    container.innerHTML = '';
    
    // Criar SVG com tamanho 100%
    svg = d3.select(container)
        .append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('class', 'fluxograma-svg');
    
    // Adicionar definição para as setas
    const defs = svg.append('defs');
    defs.append('marker')
        .attr('id', 'arrowhead')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 18)
        .attr('refY', 0)
        .attr('orient', 'auto')
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', '#999');
    
    // Configurar o zoom e pan
    zoom = d3.zoom()
        .scaleExtent([0.3, 3])
        .on('zoom', (event) => {
            g.attr('transform', event.transform);
        });
    
    svg.call(zoom);
    
    // Adicionar grupo principal que será transformado pelo zoom/pan
    g = svg.append('g');
    
    // Criar grupos para links e nós
    g.append('g').attr('class', 'links');
    g.append('g').attr('class', 'nodes');
    
    // Obter dimensões do container
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    // Criar simulação de força D3 com configurações melhoradas
    simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links).id(d => d.id).distance(200))
        .force('charge', d3.forceManyBody().strength(-800))
        .force('x', d3.forceX(width / 2).strength(0.1))
        .force('y', d3.forceY(height / 2).strength(0.1))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(100))
        .on('tick', ticked);
    
    // Reiniciar os dados
    resetFlowData();
    
    // Adicionar comportamento de arrastar nós
    const dragHandler = d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended);
        
    svg.select('.nodes').call(dragHandler);
    
    // Adicionar eventos de clique
    svg.on('click', svgClicked);
    
    // Ajustar inicialmente ao centro com um pequeno zoom out
    svg.call(zoom.transform, d3.zoomIdentity.translate(width/2, height/2).scale(0.8).translate(-width/2, -height/2));
    
    console.log('Fluxograma D3 inicializado com sucesso');
}

// Função chamada a cada tick da simulação
function ticked() {
    // Atualizar links
    g.select('.links')
        .selectAll('line')
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);
    
    // Atualizar nós
    g.select('.nodes')
        .selectAll('.node')
        .attr('transform', d => `translate(${d.x},${d.y})`);
}

// Funções de arrastar nós
function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
}

function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
}

function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
}

// Manipular clique no SVG
function svgClicked(event) {
    if (event.target === this) {
        // Clique no fundo do SVG, não em um nó
        selectedNode = null;
    }
}

// Renderizar os nós e links
function renderGraph() {
    // Renderizar links
    const link = g.select('.links')
        .selectAll('line')
        .data(links, d => d.id);
    
    link.exit().remove();
    
    const linkEnter = link.enter()
        .append('line')
        .attr('class', 'flow-edge')
        .attr('marker-end', 'url(#arrowhead)');
    
    // Renderizar nós
    const node = g.select('.nodes')
        .selectAll('.node')
        .data(nodes, d => d.id);
    
    node.exit().remove();
    
    const nodeEnter = node.enter()
        .append('g')
        .attr('class', d => `node node-${d.type}`)
        .on('click', nodeClicked)
        .call(d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended));
    
    // Adicionar retângulo para cada nó
    nodeEnter.append('rect')
        .attr('width', 180)
        .attr('height', 60)
        .attr('rx', 8)
        .attr('ry', 8)
        .attr('class', d => `flow-node flow-node-${d.type}`);
    
    // Adicionar texto para o título
    nodeEnter.append('text')
        .attr('class', 'node-title')
        .attr('x', 90)
        .attr('y', 25)
        .attr('text-anchor', 'middle')
        .text(d => d.type === 'inicio' ? 'Nó Central' : 'Opção');
    
    // Adicionar texto para o conteúdo
    nodeEnter.append('text')
        .attr('class', 'node-content')
        .attr('x', 90)
        .attr('y', 45)
        .attr('text-anchor', 'middle')
        .text(d => d.data.texto);
    
    // Reiniciar simulação
    simulation.nodes(nodes);
    simulation.force('link').links(links);
    simulation.alpha(1).restart();
}

// Manipular clique em um nó
function nodeClicked(event, d) {
    event.stopPropagation();
    selectedNode = d;
    openNodeEditModal(d.id);
}

// Criar um novo nó
function createNode(type, position) {
    const nodeId = `node_${nodeIdCounter++}`;
    const newNode = {
        id: nodeId,
        type: type,
        x: position.x,
        y: position.y,
        data: { 
            texto: getDefaultNodeText(type)
        }
    };
    
    nodes.push(newNode);
    renderGraph();
    
    return newNode;
}

// Criar um novo link entre nós
function createLink(sourceId, targetId) {
    const linkId = `link_${sourceId}_${targetId}`;
    
    // Verificar se o link já existe
    if (links.some(link => link.source.id === sourceId && link.target.id === targetId)) {
        return null;
    }
    
    const newLink = {
        id: linkId,
        source: sourceId,
        target: targetId
    };
    
    links.push(newLink);
    renderGraph();
    
    return newLink;
}

// Obter texto padrão para cada tipo de nó
function getDefaultNodeText(type) {
    switch(type) {
        case 'inicio': 
            return 'Olá! Como posso ajudar?';
        case 'opcao': 
            return 'Nova opção';
        default: 
            return 'Novo nó';
    }
}

// Configurar o modal de edição de nó
function setupNodeEditModal() {
    const modalElement = document.getElementById('nodeEditModal');
    if (!modalElement) return;
    
    // Elementos do formulário
    const closeBtn = modalElement.querySelector('.node-edit-modal-close');
    const cancelBtn = modalElement.querySelector('.node-edit-cancel-btn');
    const saveBtn = modalElement.querySelector('.node-edit-save-btn');
    
    // Event listeners para botões
    if (closeBtn) closeBtn.addEventListener('click', closeNodeEditModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeNodeEditModal);
    if (saveBtn) saveBtn.addEventListener('click', saveNodeChanges);
}

// Abrir modal para editar nó
function openNodeEditModal(nodeId) {
    const modalElement = document.getElementById('nodeEditModal');
    if (!modalElement) return;
    
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    selectedNode = node;
    
    // Preencher formulário com dados do nó
    const tipoSelect = document.getElementById('node-edit-tipo');
    const textoInput = document.getElementById('node-edit-texto');
    
    if (tipoSelect) tipoSelect.value = node.type;
    if (textoInput) textoInput.value = node.data.texto || '';
    
    // Mostrar modal
    modalElement.style.display = 'flex';
}

// Fechar modal de edição
function closeNodeEditModal() {
    const modalElement = document.getElementById('nodeEditModal');
    if (modalElement) modalElement.style.display = 'none';
    
    selectedNode = null;
}

// Salvar alterações do nó
function saveNodeChanges() {
    if (!selectedNode) return;
    
    const textoInput = document.getElementById('node-edit-texto');
    if (textoInput) {
        selectedNode.data.texto = textoInput.value;
    }
    
    // Atualizar visualização
    g.select('.nodes')
        .selectAll('.node')
        .filter(d => d.id === selectedNode.id)
        .select('.node-content')
        .text(selectedNode.data.texto);
    
    closeNodeEditModal();
}

// Configurar os botões de controle do fluxograma
function setupControlButtons() {
    // Botão para adicionar nó central
    const addNodeInicioBtn = document.getElementById('add-node-inicio');
    if (addNodeInicioBtn) {
        addNodeInicioBtn.addEventListener('click', () => {
            // Verificar se já existe um nó central
            if (nodes.some(node => node.type === 'inicio')) {
                showNotification('warning', 'Nó já existe', 'Um fluxo só pode ter um nó central');
                return;
            }
            
            // Obter dimensões do SVG
            const svgElement = document.querySelector('.fluxograma-svg');
            if (!svgElement) return;
            
            const width = svgElement.clientWidth;
            const height = svgElement.clientHeight;
            
            createNode('inicio', { x: width / 2, y: height / 2 });
        });
    }
    
    // Botão para adicionar nó de opção
    const addNodeOpcaoBtn = document.getElementById('add-node-opcao');
    if (addNodeOpcaoBtn) {
        addNodeOpcaoBtn.addEventListener('click', () => {
            // Verificar se existe um nó central para conectar
            const centralNode = nodes.find(node => node.type === 'inicio');
            if (!centralNode) {
                showNotification('warning', 'Crie um nó central', 'Primeiro adicione um nó central (Início)');
                return;
            }
            
            // Calcular posição para o novo nó
            const existingOptions = nodes.filter(node => node.type === 'opcao').length;
            const angle = (Math.PI * 2 / (existingOptions + 1)) * existingOptions;
            const radius = 250; // Aumentar o raio para melhor distribuição
            const x = centralNode.x + radius * Math.cos(angle);
            const y = centralNode.y + radius * Math.sin(angle);
            
            // Criar o nó e conectá-lo ao central
            const newNode = createNode('opcao', { x, y });
            createLink(centralNode.id, newNode.id);
        });
    }
    
    // Botão para salvar o fluxo
    const saveFlowBtn = document.getElementById('save-flow');
    if (saveFlowBtn) {
        saveFlowBtn.addEventListener('click', saveCompleteFlow);
    }
    
    // Adicionar botões de controle de zoom
    const controlsContainer = document.querySelector('.fluxograma-controls');
    
    if (controlsContainer) {
        // Botão de zoom in
        const zoomInBtn = document.createElement('button');
        zoomInBtn.type = 'button';
        zoomInBtn.className = 'fluxograma-control-button';
        zoomInBtn.innerHTML = '<i class="fas fa-search-plus"></i> Zoom In';
        zoomInBtn.addEventListener('click', () => {
            if (svg && zoom) {
                svg.transition().duration(300).call(zoom.scaleBy, 1.3);
            }
        });
        
        // Botão de zoom out
        const zoomOutBtn = document.createElement('button');
        zoomOutBtn.type = 'button';
        zoomOutBtn.className = 'fluxograma-control-button';
        zoomOutBtn.innerHTML = '<i class="fas fa-search-minus"></i> Zoom Out';
        zoomOutBtn.addEventListener('click', () => {
            if (svg && zoom) {
                svg.transition().duration(300).call(zoom.scaleBy, 0.7);
            }
        });
        
        // Botão de reset view
        const resetViewBtn = document.createElement('button');
        resetViewBtn.type = 'button';
        resetViewBtn.className = 'fluxograma-control-button';
        resetViewBtn.innerHTML = '<i class="fas fa-home"></i> Centralizar';
        resetViewBtn.addEventListener('click', () => {
            if (svg && zoom) {
                const container = document.getElementById('fluxograma-editor');
                const width = container.clientWidth;
                const height = container.clientHeight;
                
                svg.transition().duration(500)
                   .call(zoom.transform, d3.zoomIdentity.translate(width/2, height/2).scale(0.8).translate(-width/2, -height/2));
            }
        });
        
        // Adicionar botões ao container
        controlsContainer.appendChild(zoomInBtn);
        controlsContainer.appendChild(zoomOutBtn);
        controlsContainer.appendChild(resetViewBtn);
    }
}

// Salvar o fluxo completo
function saveCompleteFlow() {
    // Validar o fluxo antes de salvar
    if (!validateFlow()) {
        showNotification('error', 'Erro ao salvar fluxo', 'O fluxo deve ter pelo menos um nó central e um nó conectado');
        return;
    }
    
    const nomeFluxo = document.getElementById('nomeFluxo')?.value;
    
    if (!nomeFluxo) {
        showNotification('error', 'Nome obrigatório', 'Digite um nome para o fluxo');
        return;
    }
    
    // Encontrar o nó central (tipo início)
    const nodoCentral = nodes.find(node => node.type === 'inicio');
    if (!nodoCentral) {
        showNotification('error', 'Erro na estrutura', 'O fluxo deve ter um nó central');
        return;
    }
    
    // Converter o fluxograma para o formato de fluxos do ZAP Bot
    const fluxo = {
        nome: nomeFluxo,
        mensagemInicial: nodoCentral.data.texto || 'Olá! Como posso ajudar?',
        opcoes: []
    };
    
    // Encontrar todas as conexões saindo do nó central
    const conexoesCentral = links.filter(link => link.source.id === nodoCentral.id || 
                                              (typeof link.source === 'string' && link.source === nodoCentral.id));
    
    // Para cada conexão, encontrar o nó conectado e criar uma opção
    conexoesCentral.forEach((conexao, index) => {
        const nodeId = typeof conexao.target === 'string' ? conexao.target : conexao.target.id;
        const node = nodes.find(n => n.id === nodeId);
        
        if (node) {
            const opcao = {
                numero: index + 1,
                texto: node.data.texto || `Opção ${index + 1}`,
                resposta: "Resposta automática para " + node.data.texto,
                temSubfluxo: false,
                subOpcoes: []
            };
            
            fluxo.opcoes.push(opcao);
        }
    });
    
    // Salvar o fluxo no localStorage
    const fluxosSalvos = JSON.parse(localStorage.getItem('zapbot_fluxos') || '[]');
    
    // Verificar se estamos editando ou criando um novo fluxo
    const modalElement = document.getElementById('modalNovoFluxo');
    const editIndex = modalElement?.getAttribute('data-edit-index');
    
    if (editIndex !== null && editIndex !== undefined) {
        fluxosSalvos[editIndex] = fluxo;
        showNotification('success', 'Fluxo Atualizado', 'Seu fluxo de conversa foi atualizado com sucesso!');
    } else {
        fluxosSalvos.push(fluxo);
        showNotification('success', 'Fluxo Salvo', 'Seu fluxo foi criado com sucesso!');
    }
    
    localStorage.setItem('zapbot_fluxos', JSON.stringify(fluxosSalvos));
    
    // Fechar o modal e atualizar a lista de fluxos
    document.querySelector('#modalNovoFluxo .close')?.click();
    
    // Se existir a função atualizarListaFluxos, chamá-la
    if (typeof atualizarListaFluxos === 'function') {
        atualizarListaFluxos();
    }
}

// Validar o fluxograma antes de salvar
function validateFlow() {
    // Verificar se temos pelo menos um nó central e um nó conectado
    const hasInicio = nodes.some(node => node.type === 'inicio');
    const hasOpcao = nodes.some(node => node.type === 'opcao');
    
    return hasInicio && hasOpcao;
}

// Carregar um fluxo existente no editor
function loadFluxoIntoFlow(fluxo) {
    // Limpar o fluxo atual
    resetFlowData();
    
    // Aguardar um pouco para o SVG ser inicializado
    setTimeout(() => {
        // Obter dimensões do SVG
        const svgElement = document.querySelector('.fluxograma-svg');
        if (!svgElement) return;
        
        const width = svgElement.clientWidth;
        const height = svgElement.clientHeight;
        
        // Criar o nó central
        const nodoCentral = createNode('inicio', { x: width / 2, y: height / 2 });
        nodoCentral.data.texto = fluxo.mensagemInicial;
        
        // Calcular posições em círculo para as opções
        const numOptions = fluxo.opcoes.length;
        const radius = 250; // Aumentar o raio para melhor distribuição
        
        // Criar nós para cada opção em torno do nó central
        fluxo.opcoes.forEach((opcao, index) => {
            // Calcular ângulo e posição para distribuir os nós em círculo
            const angle = (Math.PI * 2 / numOptions) * index;
            const x = width / 2 + radius * Math.cos(angle);
            const y = height / 2 + radius * Math.sin(angle);
            
            // Criar o nó de opção
            const opcaoNode = createNode('opcao', { x, y });
            opcaoNode.data.texto = opcao.texto;
            
            // Conectar o nó central à opção
            createLink(nodoCentral.id, opcaoNode.id);
        });
        
        // Atualizar visualização
        renderGraph();
        
        // Centralizar a visualização
        if (svg && zoom) {
            svg.transition().duration(500)
               .call(zoom.transform, d3.zoomIdentity.translate(width/2, height/2).scale(0.8).translate(-width/2, -height/2));
        }
    }, 300);
}

// Resetar os dados do fluxo
function resetFlowData() {
    nodes = [];
    links = [];
    nodeIdCounter = 1;
    
    if (g) {
        g.select('.nodes').selectAll('*').remove();
        g.select('.links').selectAll('*').remove();
    }
}

// Expor funções para uso externo
window.FluxogramaEditor = {
    create: initFluxograma,
    reset: resetFlowData,
    loadFluxo: loadFluxoIntoFlow,
    init: function() {
        console.log('Inicializando editor de fluxograma via API pública');
        resetFlowData();
        setTimeout(initFluxograma, 100);
    }
}; 