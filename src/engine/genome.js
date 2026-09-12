// ===== Primordial V6 Genome Module: Organogenesis, Segmentation, Neural Topology & Anomalies =====

const GENE_RANGES = {
  // 1. Baseline Vital Physiology
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

  // 2. Morphological Organogenesis & Body Segmentation (V6)
  segmentCount: [1, 8],       // Number of articulated body segments (1 = unicellular, 2..8 = metazoan)
  bodyAspect: [0.6, 2.4],     // Width vs elongation ratio (broad shield vs vermiform centipede)
  appendagePairs: [0, 5],     // Paired lateral limbs (crawling legs on land, undulating fins in water)
  shellMineral: [0, 1],       // Chitinous carapace thickness & mineral calcium absorption affinity
  headOrnament: [0, 1],       // 0 = Sensory antennae, 1 = Predatory hunting mandibles
  tailType: [0, 1],           // 0 = Propulsion caudal fluke, 1 = Defensive sting / telson spine

  // 3. Dynamic Brain Architecture Topology (V6)
  brainInputs: [16, 24],      // Number of active sensory input channels (16 baseline -> 24 advanced)
  brainHidden1: [6, 20],      // Hidden neurons in layer 1
  brainDeepLayers: [0, 1],    // Deep layer flag (> 0.5 activates deep Hidden Layer 2)
  brainOutputs: [7, 11],      // Number of action output channels (7 baseline -> 11 advanced)
};

const GENE_LABELS = {
  size: 'Body Size',
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

  segmentCount: 'Body Segments',
  bodyAspect: 'Elongation Ratio',
  appendagePairs: 'Limb Pairs',
  shellMineral: 'Shell Mineralization',
  headOrnament: 'Antennae vs Mandibles',
  tailType: 'Fin vs Stinger',

  brainInputs: 'Brain Input Channels',
  brainHidden1: 'Hidden Layer 1 Nodes',
  brainDeepLayers: 'Deep Layer 2 Status',
  brainOutputs: 'Action Output Channels',
};

// Rare Chromosomal & Genetic Anomalies (Macro-Mutations)
const GENETIC_ANOMALIES = {
  NONE: 'NONE',
  TITAN: 'TITAN',                     // Gigantism (2.2x scale, massive health, slower metabolism)
  POLYCEPHALY: 'POLYCEPHALY',         // Twin heads, dual compound eyes (240 deg FOV)
  ALBINO: 'ALBINO',                   // Translucent ghost membrane, +50% stealth evasion
  SPIKED_CARAPACE: 'SPIKED_CARAPACE', // Chitinous spikes reflecting 50% damage to attackers
  CHIMERA: 'CHIMERA',                 // Rainbow shifting chromatic iridescence
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
    'Amphi', 'Terro', 'Cryo', 'Oculo', 'Trilo',
    'Articulo', 'Scolop', 'Poly', 'Verm', 'Titan', 'Draco'
  ];
  const suffixes = [
    'morphic', 'bion', 'vorus', 'dermal', 'spire',
    'plax', 'cyte', 'naut', 'stoma', 'troph',
    'poda', 'cutis', 'chitin', 'ops', 'caris', 'aspis', 'gnatha'
  ];

  let pIndex = 0;
  if (genome.anomaly === GENETIC_ANOMALIES.TITAN) pIndex = 19; // Titan
  else if (genome.anomaly === GENETIC_ANOMALIES.POLYCEPHALY) pIndex = 17; // Poly
  else if (genome.segmentCount > 5) pIndex = 16; // Scolop
  else if (genome.segmentCount > 2) pIndex = 14; // Trilo
  else if (genome.locomotionType > 0.65 && genome.moistureRetention > 0.45) pIndex = 11; // Terro
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
  if (genome.appendagePairs >= 3) sIndex = 10; // -poda
  else if (genome.shellMineral > 0.6) sIndex = 15; // -aspis
  else if (genome.headOrnament > 0.6) sIndex = 16; // -gnatha
  else if (genome.segmentCount > 3) sIndex = 14; // -caris
  else if (genome.moistureRetention > 0.7) sIndex = 11; // -cutis

  return `${prefixes[pIndex]}-${suffixes[sIndex]}`;
}

function randomGenome(base) {
  const g = {};
  for (const k in GENE_RANGES) {
    const [lo, hi] = GENE_RANGES[k];
    g[k] = base && base[k] !== undefined ? base[k] : lerp(lo, hi, Math.random());
  }
  // Start initial generation with small segment count (1..2)
  if (!base || base.segmentCount === undefined) {
    g.segmentCount = 1 + Math.random() * 0.8;
    g.appendagePairs = Math.random() < 0.3 ? 1 : 0;
    g.brainInputs = 16;
    g.brainHidden1 = 10;
    g.brainDeepLayers = 0.1;
    g.brainOutputs = 7;
  }
  g.hue = base && base.hue !== undefined ? base.hue : Math.random() * 360;
  g.anomaly = base && base.anomaly !== undefined ? base.anomaly : GENETIC_ANOMALIES.NONE;
  g.speciesName = generateSpeciesName(g);
  return g;
}

function mutateGenome(genome, mutRate, mutagenMultiplier = 1.0) {
  const rate = (mutRate !== undefined ? mutRate : (genome.mutationRate || 0.1)) * mutagenMultiplier;
  const g = Object.assign({}, genome);

  for (const k in GENE_RANGES) {
    const [lo, hi] = GENE_RANGES[k];
    const width = hi - lo;
    let delta = gaussian() * rate * width * 0.16;
    // Rare high-variance mutation burst
    if (Math.random() < 0.04 * mutagenMultiplier) delta *= 3.2;
    g[k] = clamp(g[k] + delta, lo, hi);
  }

  // Segment Count Discrete Evolution (Gene Duplication / Deletion)
  if (Math.random() < 0.08 * mutagenMultiplier) {
    const segDelta = Math.random() < 0.65 ? 1 : -1;
    g.segmentCount = clamp(Math.round(g.segmentCount + segDelta), 1, 8);
  }

  // Appendage Evolution (Pairs of legs/fins sprouting on segments)
  if (Math.random() < 0.08 * mutagenMultiplier) {
    const limbDelta = Math.random() < 0.6 ? 1 : -1;
    g.appendagePairs = clamp(Math.round(g.appendagePairs + limbDelta), 0, Math.min(5, Math.ceil(g.segmentCount)));
  }

  // Neural Topology Evolution
  if (Math.random() < 0.09 * mutagenMultiplier) {
    // Input expansion: 16 -> up to 24
    if (Math.random() < 0.55 && g.brainInputs < 24) g.brainInputs = clamp(Math.round(g.brainInputs + 1), 16, 24);
    // Hidden layer 1 expansion
    if (Math.random() < 0.5) g.brainHidden1 = clamp(Math.round(g.brainHidden1 + (Math.random() < 0.6 ? 1 : -1)), 6, 20);
    // Deep layer 2 differentiation
    if (Math.random() < 0.25) g.brainDeepLayers = clamp(g.brainDeepLayers + (Math.random() - 0.45) * 0.4, 0, 1);
    // Output expansion: 7 -> up to 11
    if (Math.random() < 0.55 && g.brainOutputs < 11) g.brainOutputs = clamp(Math.round(g.brainOutputs + 1), 7, 11);
  }

  // Hue Mutation
  const oldHue = g.hue;
  g.hue = (g.hue + gaussian() * rate * 32 + 360) % 360;

  // Rare Chromosomal Anomaly / Macro-Mutation (1.5% base chance, elevated in mutagen zones)
  const anomalyChance = 0.016 * mutagenMultiplier;
  if (g.anomaly === GENETIC_ANOMALIES.NONE && Math.random() < anomalyChance) {
    const roll = Math.random();
    if (roll < 0.22) {
      g.anomaly = GENETIC_ANOMALIES.TITAN;
      g.size = Math.min(3.2, g.size * 1.8);
      g.speed = Math.max(0.4, g.speed * 0.75);
    } else if (roll < 0.44) {
      g.anomaly = GENETIC_ANOMALIES.POLYCEPHALY;
      g.visionFov = Math.min(240, g.visionFov * 1.5);
      g.sense = Math.min(160, g.sense * 1.4);
    } else if (roll < 0.65) {
      g.anomaly = GENETIC_ANOMALIES.ALBINO;
      g.membrane = Math.max(0.2, g.membrane * 0.7);
    } else if (roll < 0.85) {
      g.anomaly = GENETIC_ANOMALIES.SPIKED_CARAPACE;
      g.shellMineral = Math.max(0.7, g.shellMineral * 1.4);
    } else {
      g.anomaly = GENETIC_ANOMALIES.CHIMERA;
    }
  }

  if (Math.abs(g.hue - oldHue) > 26 || Math.random() < 0.08 || g.anomaly !== (genome.anomaly || GENETIC_ANOMALIES.NONE)) {
    g.speciesName = generateSpeciesName(g);
  } else {
    g.speciesName = genome.speciesName || generateSpeciesName(g);
  }

  return g;
}

// Homologous Two-Point Chromosomal Recombination during Sexual Reproduction
function crossoverGenome(parentA, parentB, mutRate, mutagenMultiplier = 1.0) {
  const child = {};
  const geneKeys = Object.keys(GENE_RANGES);
  
  // Two-point crossover slice indices
  const pt1 = Math.floor(Math.random() * (geneKeys.length - 2));
  const pt2 = pt1 + 1 + Math.floor(Math.random() * (geneKeys.length - pt1 - 1));

  for (let i = 0; i < geneKeys.length; i++) {
    const k = geneKeys[i];
    if (i < pt1 || i >= pt2) {
      child[k] = Math.random() < 0.85 ? parentA[k] : parentB[k];
    } else {
      // Homologous crossover region from parent B
      child[k] = Math.random() < 0.85 ? parentB[k] : parentA[k];
    }
  }

  // Hue Blending
  child.hue = Math.random() < 0.5 ? parentA.hue : parentB.hue;
  if (hueDiff(parentA.hue, parentB.hue) < 45) {
    child.hue = (parentA.hue + parentB.hue) * 0.5;
  }

  // Inherit or clear anomaly
  child.anomaly = Math.random() < 0.35 ? (parentA.anomaly || parentB.anomaly || GENETIC_ANOMALIES.NONE) : GENETIC_ANOMALIES.NONE;

  const effectiveMutRate = (parentA.mutationRate + parentB.mutationRate) * 0.5;
  child.speciesName = generateSpeciesName(child);
  return mutateGenome(child, effectiveMutRate, mutagenMultiplier);
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
    if (!g.anomaly) g.anomaly = GENETIC_ANOMALIES.NONE;
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
    GENETIC_ANOMALIES,
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
