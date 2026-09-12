// ===== Primordial V4 Engine Entry Point =====

const {
  GENE_RANGES, GENE_LABELS, clamp, lerp, gaussian, dist2, hueDiff,
  generateSpeciesName, randomGenome, mutateGenome, crossoverGenome,
  exportGenomeJSON, importGenomeJSON
} = require('./src/engine/genome');
const { NeuralNetwork } = require('./src/engine/brain');
const { FoodGrid } = require('./src/engine/environment');
const { TerrainGrid, TERRAIN_TYPES, MATERIAL_PROPERTIES } = require('./src/engine/terrain');
const { castCompoundVision, HIT_TYPES } = require('./src/engine/vision');
const { Organism } = require('./src/engine/organism');
const { World, SpatialHash } = require('./src/engine/world');

if (typeof module !== 'undefined') {
  module.exports = {
    World,
    Organism,
    NeuralNetwork,
    FoodGrid,
    TerrainGrid,
    TERRAIN_TYPES,
    MATERIAL_PROPERTIES,
    castCompoundVision,
    HIT_TYPES,
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
