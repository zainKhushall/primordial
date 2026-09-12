// ===== Genome Module: Trait Definitions, Mutations & Sexual Crossover =====

const GENE_RANGES = {
  size: [0.4, 3.2],
  speed: [0.3, 2.6],
  sense: [15, 160],
  diet: [0, 1],
  aggression: [0, 1],
  colony: [0, 1],
  membrane: [0.2, 1.0],
  plasticity: [0, 1],
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

function randomGenome(base) {
  const g = {};
  for (const k in GENE_RANGES) {
    const [lo, hi] = GENE_RANGES[k];
    g[k] = base && base[k] !== undefined ? base[k] : lerp(lo, hi, Math.random());
  }
  g.hue = base && base.hue !== undefined ? base.hue : Math.random() * 360;
  return g;
}

function mutateGenome(genome, mutRate) {
  const rate = mutRate !== undefined ? mutRate : (genome.mutationRate || 0.1);
  const g = Object.assign({}, genome);
  for (const k in GENE_RANGES) {
    const [lo, hi] = GENE_RANGES[k];
    const width = hi - lo;
    let delta = gaussian() * rate * width * 0.18;
    if (Math.random() < 0.05) delta *= 3.5; // macro-mutation
    g[k] = clamp(g[k] + delta, lo, hi);
  }
  g.hue = (g.hue + gaussian() * rate * 35 + 360) % 360;
  return g;
}

// Sexual reproduction: recombining genes of two parent genomes
function crossoverGenome(parentA, parentB, mutRate) {
  const child = {};
  for (const k in GENE_RANGES) {
    // 50% coin flip or blend
    if (Math.random() < 0.5) {
      child[k] = parentA[k];
    } else if (Math.random() < 0.8) {
      child[k] = parentB[k];
    } else {
      child[k] = lerp(parentA[k], parentB[k], 0.5);
    }
  }
  // Hue blending or dominance
  child.hue = Math.random() < 0.5 ? parentA.hue : parentB.hue;
  if (Math.abs(parentA.hue - parentB.hue) < 40) {
    child.hue = lerp(parentA.hue, parentB.hue, 0.5);
  }
  const effectiveMutRate = mutRate !== undefined ? mutRate : (parentA.mutationRate + parentB.mutationRate) * 0.5;
  return mutateGenome(child, effectiveMutRate);
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
    randomGenome,
    mutateGenome,
    crossoverGenome,
  };
}
