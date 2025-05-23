const mongoose = require('mongoose');

// Schema para os nós dentro do fluxo
const nodeSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['inicio', 'opcao', 'resposta', 'fim'],
    required: true
  },
  texto: {
    type: String,
    required: true
  },
  position: {
    x: { type: Number, required: true },
    y: { type: Number, required: true }
  }
}, { _id: false });

// Schema para as conexões entre nós
const linkSchema = new mongoose.Schema({
  source: {
    type: String,
    required: true
  },
  target: {
    type: String,
    required: true
  },
  label: String
}, { _id: false });

// Schema para o fluxo completo
const flowSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nome do fluxo é obrigatório'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  active: {
    type: Boolean,
    default: true
  },
  nodes: [nodeSchema],
  links: [linkSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  // Estatísticas sobre o uso do fluxo
  statistics: {
    usageCount: {
      type: Number,
      default: 0
    },
    successRate: {
      type: Number,
      default: 0
    },
    lastUsed: {
      type: Date,
      default: null
    }
  }
});

// Middleware para atualizar a data de modificação
flowSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Método para incrementar o contador de uso
flowSchema.methods.incrementUsage = async function() {
  this.statistics.usageCount += 1;
  this.statistics.lastUsed = Date.now();
  return this.save();
};

// Método para atualizar a taxa de sucesso
flowSchema.methods.updateSuccessRate = async function(isSuccess) {
  const currentCount = this.statistics.usageCount;
  const currentSuccessRate = this.statistics.successRate;
  
  // Calcular nova taxa com base no resultado atual
  if (currentCount > 0) {
    const totalSuccessful = Math.round(currentCount * currentSuccessRate);
    const newTotal = isSuccess ? totalSuccessful + 1 : totalSuccessful;
    this.statistics.successRate = newTotal / (currentCount + 1);
  } else {
    this.statistics.successRate = isSuccess ? 1 : 0;
  }
  
  return this.save();
};

const Flow = mongoose.model('Flow', flowSchema);

module.exports = Flow; 