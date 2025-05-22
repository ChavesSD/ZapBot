// Modelo para fluxos de mensagens automatizados
// Este é um modelo simples usando arquivo local em vez de banco de dados
// Em produção, seria recomendável usar um banco de dados como MongoDB

const fs = require('fs').promises;
const path = require('path');

const FLUXOS_FILE = path.join(__dirname, '../../data/fluxos.json');

// Garantir que o diretório de dados exista
const ensureDataDir = async () => {
    const dataDir = path.join(__dirname, '../../data');
    try {
        await fs.mkdir(dataDir, { recursive: true });
    } catch (error) {
        if (error.code !== 'EEXIST') {
            throw error;
        }
    }
};

// Carregar todos os fluxos
const getFluxos = async () => {
    await ensureDataDir();
    
    try {
        const data = await fs.readFile(FLUXOS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            // Arquivo não existe, retorna array vazio
            return [];
        }
        throw error;
    }
};

// Salvar fluxos
const saveFluxos = async (fluxos) => {
    await ensureDataDir();
    await fs.writeFile(FLUXOS_FILE, JSON.stringify(fluxos, null, 2));
};

// Obter um fluxo pelo ID
const getFluxoById = async (id) => {
    const fluxos = await getFluxos();
    return fluxos.find(f => f.id === id);
};

// Criar um novo fluxo
const createFluxo = async (fluxoData) => {
    const fluxos = await getFluxos();
    
    const newFluxo = {
        id: Date.now().toString(), // ID baseado no timestamp
        ...fluxoData,
        createdAt: new Date().toISOString()
    };
    
    fluxos.push(newFluxo);
    await saveFluxos(fluxos);
    return newFluxo;
};

// Atualizar um fluxo
const updateFluxo = async (id, fluxoData) => {
    const fluxos = await getFluxos();
    const index = fluxos.findIndex(f => f.id === id);
    
    if (index === -1) {
        throw new Error(`Fluxo com ID ${id} não encontrado`);
    }
    
    fluxos[index] = {
        ...fluxos[index],
        ...fluxoData,
        updatedAt: new Date().toISOString()
    };
    
    await saveFluxos(fluxos);
    return fluxos[index];
};

// Excluir um fluxo
const deleteFluxo = async (id) => {
    const fluxos = await getFluxos();
    const newFluxos = fluxos.filter(f => f.id !== id);
    
    if (newFluxos.length === fluxos.length) {
        throw new Error(`Fluxo com ID ${id} não encontrado`);
    }
    
    await saveFluxos(newFluxos);
    return { success: true, message: `Fluxo ${id} excluído com sucesso` };
};

module.exports = {
    getFluxos,
    getFluxoById,
    createFluxo,
    updateFluxo,
    deleteFluxo
}; 