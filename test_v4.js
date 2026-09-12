// Automated Verification Test for Primordial V4 Engine
const assert = require('assert');
const engine = require('./engine');
const { TerrainGrid, TERRAIN_TYPES, MATERIAL_PROPERTIES } = engine;
const { NeuralNetwork } = engine;
const { Organism } = engine;
const { World } = engine;
const { castCompoundVision, HIT_TYPES } = engine;

console.log('=== Step 1: Testing TerrainGrid & Stones ===');
const terrain = new TerrainGrid(4000, 3000, 40);
assert(terrain.cols === 100, `Expected 100 cols, got ${terrain.cols}`);
assert(terrain.rows === 75, `Expected 75 rows, got ${terrain.rows}`);
assert(terrain.stones.length > 50, `Expected >50 stones, got ${terrain.stones.length}`);

// Test stone collision
const stone = terrain.stones[0];
const col = terrain.resolveStoneCollision(stone.x, stone.y + stone.r - 2, 8, 0, -2);
assert(col.collided === true, 'Expected stone collision');
assert(col.y > stone.y + stone.r, 'Expected to be pushed out of stone');

// Test stone raycast occlusion
const rayHit = terrain.raycastStone(stone.x, stone.y - stone.r - 30, 0, 1, 100);
assert(rayHit.hit === true, 'Expected ray to hit stone');
assert(rayHit.dist < 35, `Expected ray hit distance ~30, got ${rayHit.dist}`);
console.log('✔ Terrain & Stone Collisions Passed!');

console.log('=== Step 2: Testing Cognitive Brain & Hebbian Learning ===');
const brain = new NeuralNetwork(16, 10, 7);
const inputs = new Float32Array(16);
inputs[0] = 0.8; // ray0
inputs[7] = 0.9; // hunger
const out1 = brain.forward(inputs);
assert(out1.length === 7, `Expected 7 outputs, got ${out1.length}`);

// Test Hebbian adaptation
const initialW = brain.W1[0];
brain.adaptPlasticity(0.8, 0.5); // Strong positive reward
const postW = brain.W1[0];
console.log(`Initial W1[0]: ${initialW.toFixed(4)}, Post-Reward W1[0]: ${postW.toFixed(4)}`);
assert(Math.abs(postW - initialW) > 0.001, 'Expected synaptic weight change after Hebbian reward');
console.log('✔ Cognitive Brain & Hebbian Learning Passed!');

console.log('=== Step 3: Testing Amphibious Organism Mechanics ===');
const fishGenome = {
  size: 1.0, speed: 1.2, sense: 60, diet: 0.1, aggression: 0.1, colony: 0.2,
  membrane: 0.5, plasticity: 0.5, pheromoneRate: 0.2, toxinGene: 0.1, endoCapacity: 0.5,
  moistureRetention: 0.05, locomotionType: 0.05, thermalTolerance: 0.5,
  visionFov: 120, visionRange: 100, mutationRate: 0.1, hue: 180, speciesName: 'Fish-bion'
};
const frogGenome = {
  size: 1.0, speed: 1.2, sense: 60, diet: 0.1, aggression: 0.1, colony: 0.2,
  membrane: 0.5, plasticity: 0.5, pheromoneRate: 0.2, toxinGene: 0.1, endoCapacity: 0.5,
  moistureRetention: 0.95, locomotionType: 0.85, thermalTolerance: 0.5,
  visionFov: 120, visionRange: 100, mutationRate: 0.1, hue: 120, speciesName: 'Frog-poda'
};

const fish = new Organism(500, 500, fishGenome);
const frog = new Organism(500, 500, frogGenome);

// Place both on land
const landCoords = { x: 2200, y: 1500 };
terrain.materials[terrain.idx(Math.floor(landCoords.x / 40), Math.floor(landCoords.y / 40))] = TERRAIN_TYPES.LAND;
fish.x = landCoords.x; fish.y = landCoords.y;
frog.x = landCoords.x; frog.y = landCoords.y;

// Step 50 times on land
for (let i = 0; i < 50; i++) {
  fish.step(null, new engine.SpatialHash(4000, 3000, 60), 4000, 3000, 1.0, terrain);
  frog.step(null, new engine.SpatialHash(4000, 3000, 60), 4000, 3000, 1.0, terrain);
}

console.log(`Fish moisture: ${fish.moisture.toFixed(1)}%, Frog moisture: ${frog.moisture.toFixed(1)}%`);
assert(frog.moisture > fish.moisture, 'Adapted frog should retain more moisture than unadapted fish');
console.log('✔ Amphibious Locomotion & Desiccation Physiology Passed!');

console.log('=== Step 4: World Benchmark on 4000x3000 Map ===');
const world = new World({ width: 4000, height: 3000 });
world.seed(80);
console.log('Initial population:', world.organisms.length);

const start = Date.now();
for (let t = 0; t < 100; t++) {
  world.tick();
}
const elapsed = Date.now() - start;
const tps = Math.round((100 / (elapsed / 1000)));
console.log(`Simulated 100 ticks in ${elapsed}ms (${tps} ticks/sec)`);
console.log('Final Population:', world.organisms.length);
console.log('World Stats:', world.stats);
assert(tps > 25, `Expected TPS > 25, got ${tps}`);
console.log('✔ World 4000x3000 Benchmark Passed!');

console.log('\n=============================================');
console.log('   ALL PRIMORDIAL V4 VERIFICATIONS PASSED!   ');
console.log('=============================================');
