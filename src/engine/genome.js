// ===== Primordial V4 Genome Module: Amphibious Genes, Locomotion, Vision & Taxonomy =====

const GENE_RANGES = {
  size: [0.4, 3.2],
  speed: [0.3, 2.6],
  sense: [15, 160],
  diet: [0, 1],
  aggression: [0, 1],
  colony: [0, 1],
  membrane: [0.2, 1.0],
  plasticity: [0, 1],
  pheromoneRate: [0, 1],
  toxinGene: [0, 1],          // Venom secretion / poison defense gene
  endoCapacity: [0, 1],       // Endosymbiont organelle host capacity
  moistureRetention: [0, 1],  // Cuticle & mucous barrier against terrestrial desiccation
  locomotionType: [0, 1],     // 0 = Aquatic swimming fin, 1 = Terrestrial crawling limb
  thermalTolerance: [0, 1],   // Antifreeze protein synthesis / cold & heat shock resilience
  visionFov: [45, 240],       // Compound eye field of view (degrees)
  visionRange: [40, 220],     // Compound eye ray distance (px)
  mutationRate: [0.02, 0.35],
};

const GENE_LABELS = {
  size: 'Cell Size',
  speed: 'Max Speed',
  sense: 'Sense Radius',
  diet: 'Carnivory Diet',
  aggression: 'Aggression',
  colony: 'Colony Adhesion',
  membrane: 'Membrane Shield',
  plasticity: 'Brain Plasticity',
  pheromoneRate: 'Pheromone Signal',
  toxinGene: 'Toxin Secretion',
  endoCapacity: 'Endosymbiosis Host',
  moistureRetention: 'Moisture Cuticle',
  locomotionType: 'Crawl vs Swim',
  thermalTolerance: 'Thermal Resilience',
  visionFov: 'Vision Field of View',
  visionRange: 'Eye Sight Distance',
  mutationRate: 'Genetic Instability',
};

function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
function lerp(a, b, t) { return a + (b - a) * t; }

function gaussian() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function dist2(ax, ay, bx, by) {
  const dx = ax - bx, dy = ay - by;
  return dx * dx + dy * dy;
}

function hueDiff(a, b) {
  let d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

function generateSpeciesName(genome) {
  const prefixes = [
    'Phyto', 'Micro', 'Velox', 'Macro', 'Colonio',
    'Carnis', 'Toxic', 'Abysso', 'Pelag', 'Endo',
    'Amphi', 'Terro', 'Cryo', 'Oculo'
  ];
  const suffixes = [
    'morphic', 'bion', 'vorus', 'dermal', 'spire',
    'plax', 'cyte', 'naut', 'stoma', 'troph',
    'poda', 'cutis', 'chitin', 'ops'
  ];

  let pIndex = 0;
  if (genome.locomotionType > 0.65 && genome.moistureRetention > 0.45) pIndex = 11; // Terro
  else if (genome.locomotionType > 0.45 && genome.moistureRetention > 0.35) pIndex = 10; // Amphi
  else if (genome.thermalTolerance > 0.65) pIndex = 12; // Cryo
  else if (genome.visionRange > 160) pIndex = 13; // Oculo
  else if (genome.toxinGene > 0.45) pIndex = 6; // Toxic
  else if (genome.diet > 0.4) pIndex = 5; // Carnis
  else if (genome.colony > 0.5) pIndex = 4; // Colonio
  else if (genome.speed > 1.6) pIndex = 2; // Velox
  else if (genome.size > 2.0) pIndex = 3; // Macro
  else pIndex = 0;

  let sIndex = Math.floor((genome.hue / 360) * suffixes.length) % suffixes.length;
  if (genome.locomotionType > 0.6) sIndex = 10; // -poda
  else if (genome.moistureRetention > 0.7) sIndex = 11; // -cutis

  return `${prefixes[pIndex]}-${suffixes[sIndex]}`;
}

function randomGenome(base) {
  const g = {};
  for (const k in GENE_RANGES) {
    const [lo, hi] = GENE_RANGES[k];
    g[k] = base && base[k] !== undefined ? base[k] : lerp(lo, hi, Math.random());
  }
  g.hue = base && base.hue !== undefined ? base.hue : Math.random() * 360;
  g.speciesName = generateSpeciesName(g);
  return g;
}

function mutateGenome(genome, mutRate) {
  const rate = mutRate !== undefined ? mutRate : (genome.mutationRate || 0.1);
  const g = Object.assign({}, genome);
  for (const k in GENE_RANGES) {
    const [lo, hi] = GENE_RANGES[k];
    const width = hi - lo;
    let delta = gaussian() * rate * width * 0.18;
    if (Math.random() < 0.05) delta *= 3.5;
    g[k] = clamp(g[k] + delta, lo, hi);
  }
  const oldHue = g.hue;
  g.hue = (g.hue + gaussian() * rate * 35 + 360) % 360;
  if (Math.abs(g.hue - oldHue) > 28 || Math.random() < 0.08) g.speciesName = generateSpeciesName(g);
  else g.speciesName = genome.speciesName || generateSpeciesName(g);
  return g;
}

function crossoverGenome(parentA, parentB, mutRate) {
  const child = {};
  for (const k in GENE_RANGES) {
    if (Math.random() < 0.5) child[k] = parentA[k];
    else if (Math.random() < 0.8) child[k] = parentB[k];
    else child[k] = lerp(parentA[k], parentB[k], 0.5);
  }
  child.hue = Math.random() < 0.5 ? parentA.hue : parentB.hue;
  if (Math.abs(parentA.hue - parentB.hue) < 40) child.hue = lerp(parentA.hue, parentB.hue, 0.5);
  const effectiveMutRate = mutRate !== undefined ? mutRate : (parentA.mutationRate + parentB.mutationRate) * 0.5;
  child.speciesName = generateSpeciesName(child);
  return mutateGenome(child, effectiveMutRate);
}

function exportGenomeJSON(genome) { return JSON.stringify(genome, null, 2); }

function importGenomeJSON(jsonString) {
  try {
    const g = JSON.parse(jsonString);
    for (const k in GENE_RANGES) {
      const [lo, hi] = GENE_RANGES[k];
      if (g[k] === undefined) g[k] = lerp(lo, hi, 0.5);
      else g[k] = clamp(g[k], lo, hi);
    }
    if (g.hue === undefined) g.hue = Math.random() * 360;
    if (!g.speciesName) g.speciesName = generateSpeciesName(g);
    return g;
  } catch (err) {
    return null;
  }
}

if (typeof module !== 'undefined') {
  module.exports = {
    GENE_RANGES,
    GENE_LABELS,
    clamp,
    lerp,
    gaussian,
    dist2,
    hueDiff,
    generateSpeciesName,
    randomGenome,
    mutateGenome,
    crossoverGenome,
    exportGenomeJSON,
    importGenomeJSON,
  };
}
