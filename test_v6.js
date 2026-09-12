// Automated Verification Test Suite for Primordial V6 Engine
const assert = require('assert');
const engine = require('./engine');
const {
  World, Organism, NeuralNetwork, TerrainGrid, SpatialHash, FoodGrid, TERRAIN_TYPES,
  FloraManager, FLORA_TYPES, CarcassManager, WeatherManager, WEATHER_TYPES,
  castCompoundVision, HIT_TYPES,
  randomGenome, mutateGenome, crossoverGenome, GENETIC_ANOMALIES, GENE_RANGES
} = engine;

console.log('================================================================');
console.log('         PRIMORDIAL EARTH V6 - AUTOMATED VERIFICATION SUITE       ');
console.log('================================================================\n');

// ---------------------------------------------------------------------
// TEST 1: Dynamic Deep Neural Brain Architecture
// ---------------------------------------------------------------------
console.log('=== Test 1: Dynamic Multi-Layer Brain Architecture ===');
const brainV5 = new NeuralNetwork();
assert.strictEqual(brainV5.inputSize, 16, 'Default brain inputSize should be 16');
assert.strictEqual(brainV5.outputSize, 7, 'Default brain outputSize should be 7');
assert.strictEqual(brainV5.hasDeepLayer, false, 'Default brain should not have deep layer');

// Forward pass on default brain
const in16 = new Float32Array(16);
for (let i = 0; i < 16; i++) in16[i] = 0.5;
const out7 = brainV5.forward(in16);
assert.strictEqual(out7.length, 7, 'Default forward pass should return 7 outputs');

// Deep Brain with 24 inputs, 14 hidden1, 8 hidden2, 11 outputs
const brainV6 = new NeuralNetwork(24, 14, 11, true, 8, true);
assert.strictEqual(brainV6.inputSize, 24, 'Brain should have 24 input channels');
assert.strictEqual(brainV6.hiddenSize, 14, 'Brain should have 14 hidden1 nodes');
assert.strictEqual(brainV6.hasDeepLayer, true, 'Brain should have deep layer enabled');
assert.strictEqual(brainV6.deepHiddenSize, 8, 'Brain should have 8 hidden2 nodes');
assert.strictEqual(brainV6.outputSize, 11, 'Brain should have 11 action outputs');
assert.strictEqual(brainV6.hasSkipConn, true, 'Brain should have residual skip connection');

// Forward pass on 24-input deep brain
const in24 = new Float32Array(24);
for (let i = 0; i < 24; i++) in24[i] = (i + 1) / 24;
const out11 = brainV6.forward(in24);
assert.strictEqual(out11.length, 11, 'Deep brain forward pass should return 11 outputs');
for (let i = 0; i < 11; i++) {
  assert(!isNaN(out11[i]) && isFinite(out11[i]), `Output ${i} should be a finite valid number`);
  assert(out11[i] >= -1.0 && out11[i] <= 1.0, `Output ${i} should be bounded in [-1, 1] by tanh`);
}

// Synaptic Hebbian Plasticity
const w1Before = brainV6.W1[0];
brainV6.applyPlasticity(0.4);
const w1After = brainV6.W1[0];
console.log(`Hebbian plasticity test: W1[0] went from ${w1Before.toFixed(4)} to ${w1After.toFixed(4)}`);

// Brain Crossover & Mutation
const brainMate = new NeuralNetwork(24, 14, 11, true, 8, true);
const childBrain = brainV6.crossover(brainMate, 0.25);
assert(childBrain.inputSize >= 16 && childBrain.inputSize <= 24, 'Child brain inputSize should be within [16, 24]');
assert(childBrain.outputSize >= 7 && childBrain.outputSize <= 11, 'Child brain outputSize should be within [7, 11]');
console.log(`✔ Dynamic Deep Neural Architecture Passed! Inputs: ${brainV6.inputSize}, Deep H2: ${brainV6.deepHiddenSize}, Outputs: ${brainV6.outputSize}\n`);

// ---------------------------------------------------------------------
// TEST 2: Homologous Chromosomal Crossover & Genetic Anomalies
// ---------------------------------------------------------------------
console.log('=== Test 2: Homologous Chromosomal Crossover & Genetic Anomalies ===');
const parentA = randomGenome();
parentA.segmentCount = 6;
parentA.shellMineral = 0.85;
parentA.speciesName = 'Titan-Trilobite';

const parentB = randomGenome();
parentB.segmentCount = 2;
parentB.shellMineral = 0.15;
parentB.speciesName = 'Swift-Annelid';

// Homologous two-point crossover
const childGenome = crossoverGenome(parentA, parentB, 0.05);
assert(childGenome.segmentCount >= 1 && childGenome.segmentCount <= 8, 'Child segment count should be bounded in [1, 8]');
assert(childGenome.speciesName.length > 0, 'Child should inherit hybridized species name');
console.log(`Crossover child species: ${childGenome.speciesName}, segments: ${childGenome.segmentCount.toFixed(1)}, mineral: ${childGenome.shellMineral.toFixed(2)}`);

// Mutation & Rare Anomaly Generation
let anomalyDetected = null;
for (let attempt = 0; attempt < 400; attempt++) {
  const mutG = mutateGenome(parentA, 0.35, 3.5); // High mutagen multiplier
  if (mutG.anomaly && mutG.anomaly !== GENETIC_ANOMALIES.NONE) {
    anomalyDetected = mutG.anomaly;
    break;
  }
}
assert(anomalyDetected !== null, 'High mutation rate with mutagen multiplier should produce a genetic anomaly');
assert(Object.values(GENETIC_ANOMALIES).includes(anomalyDetected), 'Anomaly must be a valid GENETIC_ANOMALIES key');
console.log(`✔ Homologous Crossover & Anomaly Generation Passed! Detected macro-mutation: ${anomalyDetected}\n`);

// ---------------------------------------------------------------------
// TEST 3: Morphological Body Organogenesis & Kinematics
// ---------------------------------------------------------------------
console.log('=== Test 3: Morphological Body Organogenesis & Kinematics ===');
const multiOrg = new Organism(1000, 1000, {
  segmentCount: 5,
  bodyAspect: 1.4,
  appendagePairs: 4,
  shellMineral: 0.7,
  headOrnament: 0.8, // Mandibles
  tailType: 0.8, // Stinger
  size: 1.6,
  speed: 1.5,
  speciesName: 'Chitin-Centipede'
});

assert.strictEqual(multiOrg.segmentCount, 5, 'Organism should have 5 body segments');
assert.strictEqual(multiOrg.segments.length, 5, 'Segments kinematics array should contain 5 items');
assert.strictEqual(multiOrg.appendagePairs, 4, 'Organism should have 4 pairs of appendages');

// Test segment kinematics projection
const initialHeadX = multiOrg.x;
const initialTailX = multiOrg.segments[4].x;

// Apply forward movement
multiOrg.vx = 8.0;
multiOrg.vy = 0.0;
multiOrg._updateSegments();

assert.strictEqual(multiOrg.segments[0].x, multiOrg.x, 'Segment 0 must match head coordinate');
// Check that segment distance constraints are maintained
for (let s = 1; s < multiOrg.segments.length; s++) {
  const prev = multiOrg.segments[s - 1];
  const curr = multiOrg.segments[s];
  const dx = curr.x - prev.x, dy = curr.y - prev.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const targetDist = (prev.r + curr.r) * 0.72;
  assert(Math.abs(dist - targetDist) < 0.01, `Segment ${s} distance constraint should match target spacing within 0.01px`);
}
console.log(`✔ Multi-segment kinematic chain verified! Segment 0 to 4 spacing precisely constrained.`);

// Appendage stepping gait
const initialPhase = multiOrg.appendagePhase;
multiOrg.vx = 4.0;
multiOrg.vy = 2.0;
multiOrg.tick(new SpatialHash(4000, 3000, 60), new FoodGrid(4000, 3000, 40), new TerrainGrid(4000, 3000, 40));
assert(multiOrg.appendagePhase !== initialPhase, 'Moving organism should increment appendage stepping cycle');
console.log(`✔ Morphological Appendage Stepping Gait Passed!\n`);

// ---------------------------------------------------------------------
// TEST 4: Deep Element Interactions & Phenotypic Anomalies
// ---------------------------------------------------------------------
console.log('=== Test 4: Deep Element Interactions (Stone Scraping, Mud Burrowing, Mutagen Zones) ===');
const terrain = new TerrainGrid(4000, 3000, 40);
terrain.addStone(1000, 1000, 30); // Place a stone boulder at (1000, 1000)

const stoneScraper = new Organism(1010, 1000, {
  segmentCount: 3,
  shellMineral: 0.9,
  size: 1.2,
  speciesName: 'Litho-Grazer'
});
stoneScraper.shellHardness = 0.2;

// Execute stone calcium scraping
stoneScraper.scrapeStone(terrain);
assert(stoneScraper.shellHardness > 0.2, 'Scraping stone boulder should increase shell hardness via calcium uptake');
console.log(`✔ Stone scraping passed! Shell hardness increased to: ${stoneScraper.shellHardness.toFixed(3)}`);

// Mud burrowing test
terrain.paintMaterial(1500, 1500, 80, TERRAIN_TYPES.MUD);
const mudBurrower = new Organism(1500, 1500, {
  segmentCount: 4,
  locomotionType: 0.8, // Burrowing crawler
  speciesName: 'Mud-Worm'
});
assert.strictEqual(mudBurrower.isBurrowed, false, 'Organism starts surfaced');
mudBurrower.burrowInMud(terrain, true);
assert.strictEqual(mudBurrower.isBurrowed, true, 'Organism in mud should successfully burrow');
console.log(`✔ Mud burrowing passed! Organism concealed in sediment layer.`);

// Mutagen Zone Test
const testWorld = new World(4000, 3000, 70);
testWorld.addMutagenSpot(2000, 2000, 150);
const mutMultInside = testWorld.getMutagenMultiplierAt(2000, 2000);
const mutMultOutside = testWorld.getMutagenMultiplierAt(100, 100);
assert(mutMultInside > 2.5, 'Mutagen multiplier at epicenter should be > 2.5');
assert.strictEqual(mutMultOutside, 1.0, 'Mutagen multiplier far away should be 1.0');
console.log(`✔ Mutagenic pool verified! Epicenter radiation multiplier: ${mutMultInside.toFixed(2)}x\n`);

// Polycephaly Anomaly Vision Test
const polyOrg = new Organism(500, 500, {
  size: 1.2,
  visionFov: 140,
  visionRange: 120,
  speciesName: 'Hydra-TwoHead'
});
polyOrg.anomaly = GENETIC_ANOMALIES.POLYCEPHALY;
const polyVision = castCompoundVision(
  polyOrg, new SpatialHash(4000, 3000, 60), new FoodGrid(4000, 3000, 40), terrain, 4000, 3000
);
assert.strictEqual(polyVision.rays.length, 10, 'Polycephaly organism should cast 10 compound vision rays (twin heads)');
console.log(`✔ Polycephaly twin-headed vision test passed! Cast ${polyVision.rays.length} sensory rays.\n`);

// ---------------------------------------------------------------------
// TEST 5: Full 4000x3000 World Simulation & Performance Benchmark
// ---------------------------------------------------------------------
console.log('=== Test 5: Full World Simulation & Performance Benchmark ===');
const simWorld = new World(4000, 3000, 120);
// Add mutagenic spots
simWorld.addMutagenSpot(1200, 800, 140);
simWorld.addMutagenSpot(2800, 2200, 160);

const ticksToRun = 120;
const startMs = Date.now();
for (let t = 0; t < ticksToRun; t++) {
  simWorld.tick();
}
const elapsedMs = Date.now() - startMs;
const tps = (ticksToRun / (elapsedMs / 1000));

console.log(`Simulated ${ticksToRun} ticks in ${elapsedMs}ms (${tps.toFixed(1)} TPS)`);
assert(tps >= 50, 'Simulation throughput should maintain high performance (>= 50 TPS in test harness)');

const stats = simWorld.stats;
console.log('World telemetry stats after 120 ticks:');
console.log(`- Era: ${stats.era}`);
console.log(`- Population: ${stats.population}`);
console.log(`- Average Segments: ${stats.avgSegments}`);
console.log(`- Multicellular Count: ${stats.segmentedCount}`);
console.log(`- Deep Neural Brains: ${stats.deepBrains}`);
console.log(`- Active Anomalies: ${stats.anomalies}`);

assert(stats.population > 0, 'Organism population should survive and reproduce');
console.log('\n✔ All V6 Verification Tests Passed Successfully!');
console.log('================================================================');
