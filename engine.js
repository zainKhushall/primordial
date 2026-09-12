// ===== Phase 3 Primordial Sea — Engine Entry Point =====

const { GENE_RANGES, GENE_LABELS, clamp, lerp, gaussian, dist2, hueDiff, generateSpeciesName, randomGenome, mutateGenome, crossoverGenome, exportGenomeJSON, importGenomeJSON } = require('./src/engine/genome');
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
    generateSpeciesName,
    exportGenomeJSON,
    importGenomeJSON,
    GENE_RANGES,
    GENE_LABELS,
    clamp,
    lerp,
    gaussian,
    dist2,
    hueDiff,
  };
}
