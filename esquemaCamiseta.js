const { Schema, model } = require('mongoose');

const votoSchema = new Schema({
  usuario: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },

  valor: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  }
});

const camisetaSchema = new Schema({
  nombreDiseno: {
    type: String,
    required: true,
    trim: true
  },

  autor: {
    type: String,
    required: true,
    trim: true
  },

  creador: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },

  descripcion: {
    type: String,
    default: ''
  },

  torsoColor: {
    type: String,
    required: true,
    default: '#ffffff'
  },

  mangaIzquierdaColor: {
    type: String,
    required: true,
    default: '#ffffff'
  },

  mangaDerechaColor: {
    type: String,
    required: true,
    default: '#ffffff'
  },

  cuelloColor: {
    type: String,
    required: true,
    default: '#ffffff'
  },

  votos: {
    type: [votoSchema],
    default: []
  },

  calificacion: {
    type: Number,
    default: 0
  },

  fechaCreacion: {
    type: Date,
    default: Date.now
  },

  actualizadoEn: {
    type: Date,
    default: Date.now
  }
});

camisetaSchema.methods.calcularCalificacion = function () {
  if (this.votos.length === 0) {
    this.calificacion = 0;
    return;
  }

  const suma = this.votos.reduce((total, voto) => total + voto.valor, 0);
  this.calificacion = suma / this.votos.length;
};

const Camiseta = model('Camiseta', camisetaSchema);

module.exports = Camiseta;