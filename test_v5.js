// Automated Verification Test for Primordial V5 Engine
const assert = require('assert');
const engine = require('./engine');
const { 
  World, Organism, NeuralNetwork, TerrainGrid, SpatialHash, FoodGrid, TERRAIN_TYPES,
  Flora, FloraManager, FLORA_TYPES,
  Carcass, CarcassManager,
  WeatherFront, WeatherManager, WEATHER_TYPES,
  castCompoundVision, HIT_TYPES 
} = engine;

console.log('=== Step 1: Testing Living Flora & Herbivore Grazing ===');
const terrain = new TerrainGrid(4000, 3000, 40);
const foodGrid = new FoodGrid(4000, 3000, 40);
const floraMgr = new FloraManager(4000, 3000, 100);

// Spawn kelp in water
const kelp = floraMgr.addFlora(500, 500, FLORA_TYPES.KELP, 15);
assert(kelp !== null, 'Failed to spawn kelp');
assert(kelp.type === FLORA_TYPES.KELP, 'Flora type should be KELP');
assert(kelp.biomass > 0, 'Kelp biomass should be > 0');
floraMgr.rebuildSpatialHash();

// Test flora growth under sunlight
const initialBiomass = kelp.biomass;
kelp.tick(1.0, 0.8, 1.0); // full daylight
assert(kelp.biomass > initialBiomass, 'Kelp should grow under daylight');

// Test herbivore grazing
const grazed = kelp.graze(5.0);
assert(grazed > 0, 'Herbivore should successfully graze flora biomass');
console.log(`✔ Flora Photosynthesis & Grazing Passed! Grazed: ${grazed.toFixed(2)} biomass`);

// Test flora manager tick
const o2Gen = floraMgr.tick(foodGrid, terrain, null, 1);
assert(typeof o2Gen === 'number' && o2Gen >= 0, 'FloraManager tick should return non-negative O2 generated');
console.log(`✔ FloraManager lifecycle tick passed! Net O2 generation: ${o2Gen.toFixed(3)}`);

console.log('=== Step 2: Testing Carcass Decomposition & Scavenging ===');
const carcassMgr = new CarcassManager(4000, 3000, 100);
const deadOrg = new Organism(800, 800, { size: 1.5, hue: 45, speciesName: 'Apex-Test' });
deadOrg.energy = 100;

// Spawn carcass
const carcass = carcassMgr.addCarcassFromOrganism(deadOrg);
assert(carcass !== null, 'Failed to spawn carcass');
assert(carcass.meatEnergy > 50, 'Carcass should retain flesh biomass');
assert(carcass.boneIntegrity > 10, 'Carcass should retain skeletal bones');
carcassMgr.rebuildSpatialHash();

// Test scavenging
const scavMeat = carcass.scavenge(12.0);
assert(scavMeat > 0, 'Scavenger should consume flesh');
console.log(`Scavenger consumed: ${scavMeat.toFixed(2)} flesh`);

// Step decomposition
const initialMeat = carcass.meatEnergy;
for (let i = 0; i < 20; i++) {
  carcassMgr.tick(foodGrid, i);
}
assert(carcass.meatEnergy < initialMeat, 'Carcass flesh should decompose over time');
console.log('✔ Carcass Decomposition & Scavenging Passed!');

console.log('=== Step 3: Testing Dynamic Weather Systems ===');
const weatherMgr = new WeatherManager(4000, 3000);
const initialCount = weatherMgr.fronts.length;
const storm = weatherMgr.spawnStorm(WEATHER_TYPES.RAIN, 1000, 1000, 300);
assert(storm !== null, 'Failed to spawn rainstorm');
assert(weatherMgr.fronts.length === initialCount + 1, 'Weather manager should have 1 additional front');

// Sample weather at center
const moist = weatherMgr.getMoistureAt(1000, 1000);
const lightMod = weatherMgr.getLightModifierAt(1000, 1000);
assert(moist > 1.0, 'Center of storm should enhance moisture above 1.0');
assert(lightMod < 1.0, 'Storm clouds should reduce light below 1.0');

// Step weather
weatherMgr.tick();
console.log(`Storm moisture: ${moist.toFixed(2)}, light modifier: ${lightMod.toFixed(2)}`);
console.log('✔ Weather Dynamics & Environmental Modulation Passed!');

console.log('=== Step 4: Testing Compound Eye Raycasting for Flora & Carcasses ===');
const observerOrg = new Organism(500, 460, {
  visionFov: 120, visionRange: 100, size: 1.0, sense: 80, hue: 180, speciesName: 'Eye-Test'
});
observerOrg.facingAngle = Math.PI / 2; // Facing downward toward kelp at (500, 500)

const spatialHash = new SpatialHash(4000, 3000, 60);
spatialHash.insert(observerOrg);

const vision = castCompoundVision(
  observerOrg, spatialHash, foodGrid, terrain, 4000, 3000, floraMgr, carcassMgr
);
assert(vision.rays && vision.rays.length === 5, 'Should return 5 compound eye vision rays');
console.log('Raycast hit signatures:', vision.rays.map(r => r.signature));
const detectedFlora = vision.rays.some(r => r.signature === HIT_TYPES.FLORA);
assert(detectedFlora, 'Compound vision should detect living flora ahead');
console.log('✔ Vision Raycasting for V5 Entities Passed!');

console.log('=== Step 5: Testing Intracellular Mitosis Cycle ===');
const parent = new Organism(1200, 1200, {
  size: 1.2, speed: 1.0, sense: 50, diet: 0.5, hue: 200,
  speciesName: 'Mitosis-Proto'
});
parent.energy = 180;
parent.age = 150;

// Setup mitosis state machine
parent.mitosisPhase = 1;
parent.mitosisData = {
  childGenome: Object.assign({}, parent.genome),
  childBrain: parent.brain.clone()
};

console.log('Simulating 40-tick mitosis division...');
let childCreated = null;
for (let tick = 0; tick < 45; tick++) {
  const child = parent.step(foodGrid, spatialHash, 4000, 3000, 1.0, terrain, floraMgr, carcassMgr, weatherMgr);
  if (child) {
    childCreated = child;
    console.log(`Mitosis cytokinesis complete! Child spawned at tick ${tick} with energy ${child.energy.toFixed(1)}`);
    assert(child.generation === parent.generation + 1, 'Child generation should increment');
    break;
  }
}
assert(childCreated !== null, 'Organism should complete 40-tick mitosis and produce offspring');
assert(parent.mitosisPhase === 0, 'Parent should exit mitosis state after cytokinesis');
console.log('✔ Intracellular Mitosis State Machine Passed!');

console.log('=== Step 6: World Benchmark on 4000x3000 V5 Planet ===');
const world = new World({ width: 4000, height: 3000 });
world.seed(80);

console.log('Initial V5 World State:');
console.log(`  Organisms: ${world.organisms.length}`);
console.log(`  Living Flora: ${world.flora.floras.length}`);
console.log(`  Weather Fronts: ${world.weather.fronts.length}`);
console.log(`  Diurnal Phase: ${world.diurnalPhase.toFixed(2)} (${world.isNight ? 'Night' : 'Day'})`);

const start = Date.now();
for (let t = 0; t < 100; t++) {
  world.tick();
}
const elapsed = Date.now() - start;
const tps = Math.round((100 / (elapsed / 1000)));

console.log(`Simulated 100 full V5 ticks in ${elapsed}ms (${tps} ticks/sec)`);
console.log('Final V5 Telemetry Stats:');
console.log(world.stats);

assert(world.stats.floraCount > 0, 'World should maintain living flora');
assert(world.stats.dayNightCycle !== undefined, 'World stats should include dayNightCycle');
assert(world.stats.diurnalPhase !== undefined, 'World stats should include diurnalPhase');
assert(tps >= 25, `Expected TPS >= 25, got ${tps}`);
console.log('✔ Full V5 World 4000x3000 Benchmark Passed!');

console.log('\n=============================================');
console.log('   ALL PRIMORDIAL V5 VERIFICATIONS PASSED!   ');
console.log('=============================================');
