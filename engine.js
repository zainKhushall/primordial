// ===== Primordial Sea — Simulation Engine v2.0 (No DOM dependencies) =====

const { GENE_RANGES, GENE_LABELS, clamp, lerp, gaussian, dist2, hueDiff, randomGenome, mutateGenome, crossoverGenome } = require('./src/engine/genome');
const { NeuralNetwork } = require('./src/engine/brain');
const { FoodGrid } = require('./src/engine/environment');
const { Organism } = require('./src/engine/organism');
const { World, SpatialHash } = require('./src/engine/world');

if (typeof module !== 'undefined') {
  module.exports = {
    World,
    Organism,
    NeuralNetwork,
    FoodGrid,
    SpatialHash,
    randomGenome,
    mutateGenome,
    crossoverGenome,
    GENE_RANGES,
    GENE_LABELS,
    clamp,
    lerp,
    gaussian,
    dist2,
    hueDiff,
  };
}
