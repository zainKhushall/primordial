// ===== Phase 3 Client Observer App: NEAT Brain Topology, Endosymbiosis & Era Renderer =====

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
  toxinGene: [0, 1],
  endoCapacity: [0, 1],
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
function dist2(ax, ay, bx, by) { const dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; }
function hueDiff(a, b) { let d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; }

function generateSpeciesName(genome) {
  const prefixes = ['Phyto', 'Micro', 'Velox', 'Macro', 'Colonio', 'Carnis', 'Toxic', 'Abysso', 'Pelag', 'Endo'];
  const suffixes = ['morphic', 'bion', 'vorus', 'dermal', 'spire', 'plax', 'cyte', 'naut', 'stoma', 'troph'];

  let pIndex = 0;
  if (genome.toxinGene > 0.45) pIndex = 6;
  else if (genome.diet > 0.4) pIndex = 5;
  else if (genome.colony > 0.5) pIndex = 4;
  else if (genome.speed > 1.6) pIndex = 2;
  else if (genome.size > 2.0) pIndex = 3;
  else pIndex = 0;

  let sIndex = Math.floor((genome.hue / 360) * suffixes.length) % suffixes.length;
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
  if (Math.abs(g.hue - oldHue) > 30 || Math.random() < 0.08) g.speciesName = generateSpeciesName(g);
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

// Phase 3 NEAT Neural Network Engine
class NEATBrain {
  constructor(inputSize = 10, initialHiddenSize = 8, outputSize = 6) {
    this.inputSize = inputSize;
    this.hiddenSize = initialHiddenSize;
    this.maxHiddenSize = 16;
    this.outputSize = outputSize;

    this.W1 = new Float32Array(this.maxHiddenSize * inputSize);
    this.B1 = new Float32Array(this.maxHiddenSize);

    this.W2 = new Float32Array(outputSize * this.maxHiddenSize);
    this.B2 = new Float32Array(outputSize);

    this.inputs = new Float32Array(inputSize);
    this.hidden = new Float32Array(this.maxHiddenSize);
    this.outputs = new Float32Array(outputSize);

    this.mem1 = 0;
    this.mem2 = 0;
    this.randomize();
  }

  randomize(scale = 0.85) {
    for (let i = 0; i < this.W1.length; i++) this.W1[i] = gaussian() * scale;
    for (let i = 0; i < this.B1.length; i++) this.B1[i] = gaussian() * 0.2;
    for (let i = 0; i < this.W2.length; i++) this.W2[i] = gaussian() * scale;
    for (let i = 0; i < this.B2.length; i++) this.B2[i] = gaussian() * 0.2;
  }

  forward(environmentInputs) {
    for (let i = 0; i < 8; i++) this.inputs[i] = environmentInputs[i] || 0;
    this.inputs[8] = this.mem1;
    this.inputs[9] = this.mem2;

    for (let h = 0; h < this.hiddenSize; h++) {
      let sum = this.B1[h];
      const rowOffset = h * this.inputSize;
      for (let i = 0; i < this.inputSize; i++) sum += this.W1[rowOffset + i] * this.inputs[i];
      this.hidden[h] = Math.tanh(sum);
    }

    for (let o = 0; o < this.outputSize; o++) {
      let sum = this.B2[o];
      const rowOffset = o * this.maxHiddenSize;
      for (let h = 0; h < this.hiddenSize; h++) sum += this.W2[rowOffset + h] * this.hidden[h];
      this.outputs[o] = (o < 2 || o >= 4) ? Math.tanh(sum) : (1 / (1 + Math.exp(-sum)));
    }

    this.mem1 = this.outputs[4];
    this.mem2 = this.outputs[5];
    return this.outputs;
  }

  addNeuronMutation() {
    if (this.hiddenSize < this.maxHiddenSize) {
      const newH = this.hiddenSize;
      this.hiddenSize++;
      const row1 = newH * this.inputSize;
      for (let i = 0; i < this.inputSize; i++) this.W1[row1 + i] = gaussian() * 0.5;
      this.B1[newH] = 0;
      for (let o = 0; o < this.outputSize; o++) this.W2[o * this.maxHiddenSize + newH] = gaussian() * 0.5;
    }
  }

  mutate(rate = 0.1) {
    if (Math.random() < rate * 0.25) this.addNeuronMutation();
    const mutWeight = (w) => {
      if (Math.random() < rate) {
        let delta = gaussian() * rate * 0.5;
        if (Math.random() < 0.03) delta *= 3.0;
        return clamp(w + delta, -3.5, 3.5);
      }
      return w;
    };
    for (let i = 0; i < this.W1.length; i++) this.W1[i] = mutWeight(this.W1[i]);
    for (let i = 0; i < this.B1.length; i++) this.B1[i] = mutWeight(this.B1[i]);
    for (let i = 0; i < this.W2.length; i++) this.W2[i] = mutWeight(this.W2[i]);
    for (let i = 0; i < this.B2.length; i++) this.B2[i] = mutWeight(this.B2[i]);
  }

  adaptPlasticity(reward, plasticityRate = 0.05) {
    if (plasticityRate <= 0.001 || Math.abs(reward) < 0.01) return;
    const lr = clamp(reward, -1, 1) * plasticityRate * 0.1;
    for (let h = 0; h < this.hiddenSize; h++) {
      const rowOffset = h * this.inputSize;
      const hAct = this.hidden[h];
      for (let i = 0; i < this.inputSize; i++) {
        this.W1[rowOffset + i] = clamp(this.W1[rowOffset + i] + lr * hAct * this.inputs[i], -3.5, 3.5);
      }
    }
    for (let o = 0; o < this.outputSize; o++) {
      const rowOffset = o * this.maxHiddenSize;
      const oAct = this.outputs[o];
      for (let h = 0; h < this.hiddenSize; h++) {
        this.W2[rowOffset + h] = clamp(this.W2[rowOffset + h] + lr * oAct * this.hidden[h], -3.5, 3.5);
      }
    }
  }

  crossover(otherBrain, mutRate = 0.1) {
    const child = new NEATBrain(this.inputSize, Math.max(this.hiddenSize, otherBrain.hiddenSize), this.outputSize);
    child.hiddenSize = Math.random() < 0.5 ? this.hiddenSize : otherBrain.hiddenSize;
    for (let i = 0; i < this.W1.length; i++) child.W1[i] = Math.random() < 0.5 ? this.W1[i] : otherBrain.W1[i];
    for (let i = 0; i < this.B1.length; i++) child.B1[i] = Math.random() < 0.5 ? this.B1[i] : otherBrain.B1[i];
    for (let i = 0; i < this.W2.length; i++) child.W2[i] = Math.random() < 0.5 ? this.W2[i] : otherBrain.W2[i];
    for (let i = 0; i < this.B2.length; i++) child.B2[i] = Math.random() < 0.5 ? this.B2[i] : otherBrain.B2[i];
    child.mutate(mutRate);
    return child;
  }

  clone() {
    const n = new NEATBrain(this.inputSize, this.hiddenSize, this.outputSize);
    n.hiddenSize = this.hiddenSize;
    n.W1.set(this.W1); n.B1.set(this.B1); n.W2.set(this.W2); n.B2.set(this.B2);
    n.mem1 = this.mem1; n.mem2 = this.mem2;
    return n;
  }
  reset() { this.randomize(0.9); this.mem1 = 0; this.mem2 = 0; }
  prune(threshold = 0.08) {
    for (let i = 0; i < this.W1.length; i++) if (Math.abs(this.W1[i]) < threshold) this.W1[i] = 0;
    for (let i = 0; i < this.W2.length; i++) if (Math.abs(this.W2[i]) < threshold) this.W2[i] = 0;
  }
}

// Food, Pheromone & Toxin Grid
class FoodGrid {
  constructor(width, height, cellSize = 20) {
    this.cellSize = cellSize;
    this.cols = Math.ceil(width / cellSize);
    this.rows = Math.ceil(height / cellSize);
    this.density = new Float32Array(this.cols * this.rows);
    this.pheromones = new Float32Array(this.cols * this.rows);
    this.toxins = new Float32Array(this.cols * this.rows);
    this.vents = [];

    this.o2Level = 0.05;
    this.co2Level = 0.85;
    this.h2sLevel = 0.65;
    this.currentEra = 'Hadean Volcanic';

    for (let i = 0; i < this.density.length; i++) {
      this.density[i] = 0.16 + Math.random() * 0.24;
      this.pheromones[i] = 0;
      this.toxins[i] = 0;
    }
    const ventCount = 6;
    for (let i = 0; i < ventCount; i++) {
      this.vents.push({
        cx: Math.floor(Math.random() * this.cols),
        cy: Math.floor((0.65 + Math.random() * 0.3) * this.rows),
        r: 3 + Math.random() * 3.5,
        heat: 0.8 + Math.random() * 0.4,
      });
    }
  }
  idx(cx, cy) { return cy * this.cols + cx; }
  cellAt(x, y) {
    const cx = clamp(Math.floor(x / this.cellSize), 0, this.cols - 1);
    const cy = clamp(Math.floor(y / this.cellSize), 0, this.rows - 1);
    return { cx, cy };
  }
  biomeAt(x, y) {
    const relY = y / (this.rows * this.cellSize);
    if (relY < 0.35) return 'photic';
    if (relY < 0.70) return 'pelagic';
    return 'abyssal';
  }
  updateEra(tickCount = 0, plantCoverage = 0.3) {
    if (tickCount < 1500) {
      this.currentEra = 'Hadean Volcanic';
      this.o2Level = clamp(0.04 + plantCoverage * 0.1, 0, 1);
      this.co2Level = 0.85; this.h2sLevel = 0.65;
    } else if (tickCount < 3500) {
      this.currentEra = 'Archean Oxygenation';
      this.o2Level = clamp(0.2 + (tickCount - 1500) * 0.0002 + plantCoverage * 0.3, 0, 1);
      this.co2Level = clamp(0.7 - (tickCount - 1500) * 0.00015, 0.1, 1);
      this.h2sLevel = clamp(0.5 - (tickCount - 1500) * 0.00015, 0.05, 1);
    } else if (tickCount < 5500) {
      this.currentEra = 'Proterozoic Snowball';
      this.o2Level = 0.45; this.co2Level = 0.3; this.h2sLevel = 0.15;
    } else {
      this.currentEra = 'Cambrian Explosion';
      this.o2Level = 0.85; this.co2Level = 0.35; this.h2sLevel = 0.08;
    }
  }
  lightFactor(cy, tickCount = 0) {
    const iceBlock = this.currentEra === 'Proterozoic Snowball' ? 0.35 : 1.0;
    const dayNightOscillation = 0.3 + 0.7 * Math.pow(Math.sin((tickCount * Math.PI) / 120), 2);
    const depthFactor = 0.2 + 0.8 * (1 - cy / this.rows);
    return dayNightOscillation * depthFactor * iceBlock;
  }
  grow(growthRate = 0.011, tickCount = 0) {
    this.updateEra(tickCount, this.coverage());
    const { cols, rows, density, pheromones, toxins } = this;
    for (let cy = 0; cy < rows; cy++) {
      const light = this.lightFactor(cy, tickCount);
      const rowBase = cy * cols;
      for (let cx = 0; cx < cols; cx++) {
        const i = rowBase + cx;
        const d = density[i];
        density[i] = clamp(d + growthRate * light * d * (1 - d) + growthRate * 0.022 * light, 0, 1);
        pheromones[i] *= 0.95;
        toxins[i] *= 0.94;
      }
    }
    for (const vent of this.vents) {
      for (let dy = -vent.r; dy <= vent.r; dy++) {
        for (let dx = -vent.r; dx <= vent.r; dx++) {
          const cx = vent.cx + dx, cy = vent.cy + dy;
          if (cx < 0 || cy < 0 || cx >= cols || cy >= rows) continue;
          if (dx * dx + dy * dy > vent.r * vent.r) continue;
          const i = this.idx(cx, cy);
          if (density[i] < 0.68) density[i] = Math.min(0.68, density[i] + 0.038 * vent.heat);
        }
      }
    }
    const samples = Math.floor(cols * rows * 0.05);
    for (let s = 0; s < samples; s++) {
      const cx = (Math.random() * cols) | 0;
      const cy = (Math.random() * rows) | 0;
      const i = cy * cols + cx;
      const nd = density[i];
      if (nd < 0.08) continue;
      const dir = (Math.random() * 4) | 0;
      let nx = cx, ny = cy;
      if (dir === 0) nx++; else if (dir === 1) nx--; else if (dir === 2) ny++; else ny--;
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
      const j = ny * cols + nx;
      const amt = nd * 0.055;
      density[i] -= amt;
      density[j] = Math.min(1, density[j] + amt);
    }
  }
  eat(x, y, amount) {
    const { cx, cy } = this.cellAt(x, y);
    const i = this.idx(cx, cy);
    const avail = this.density[i];
    const taken = Math.min(avail, amount);
    this.density[i] -= taken;
    return taken;
  }
  deposit(x, y, amount) {
    const { cx, cy } = this.cellAt(x, y);
    const i = this.idx(cx, cy);
    this.density[i] = Math.min(1, this.density[i] + amount);
  }
  depositPheromone(x, y, amount) {
    const { cx, cy } = this.cellAt(x, y);
    const i = this.idx(cx, cy);
    this.pheromones[i] = Math.min(1.0, this.pheromones[i] + amount);
  }
  depositToxin(x, y, amount) {
    const { cx, cy } = this.cellAt(x, y);
    const i = this.idx(cx, cy);
    this.toxins[i] = Math.min(1.0, this.toxins[i] + amount);
  }
  coverage() {
    let sum = 0;
    for (let i = 0; i < this.density.length; i++) sum += this.density[i];
    return sum / this.density.length;
  }
  bestCellNear(x, y, radius) {
    const range = Math.max(1, Math.floor(radius / this.cellSize));
    const { cx: ccx, cy: ccy } = this.cellAt(x, y);
    let best = null, bestD = 0.06;
    for (let dy = -range; dy <= range; dy++) {
      for (let dx = -range; dx <= range; dx++) {
        const cx = ccx + dx, cy = ccy + dy;
        if (cx < 0 || cy < 0 || cx >= this.cols || cy >= this.rows) continue;
        const i = cy * this.cols + cx;
        const d = this.density[i];
        if (d > bestD) { bestD = d; best = { x: (cx + 0.5) * this.cellSize, y: (cy + 0.5) * this.cellSize, d }; }
      }
    }
    return best;
  }
}

// Spatial Hash
class SpatialHash {
  constructor(width, height, cellSize = 40) {
    this.cellSize = cellSize;
    this.cols = Math.ceil(width / cellSize);
    this.rows = Math.ceil(height / cellSize);
    this.buckets = new Map();
  }
  key(cx, cy) { return cx + ',' + cy; }
  insert(org) {
    const cx = clamp(Math.floor(org.x / this.cellSize), 0, this.cols - 1);
    const cy = clamp(Math.floor(org.y / this.cellSize), 0, this.rows - 1);
    const k = this.key(cx, cy);
    let arr = this.buckets.get(k);
    if (!arr) { arr = []; this.buckets.set(k, arr); }
    arr.push(org);
  }
  query(x, y, radius) {
    const result = [];
    const range = Math.max(1, Math.ceil(radius / this.cellSize));
    const ccx = clamp(Math.floor(x / this.cellSize), 0, this.cols - 1);
    const ccy = clamp(Math.floor(y / this.cellSize), 0, this.rows - 1);
    for (let dy = -range; dy <= range; dy++) {
      for (let dx = -range; dx <= range; dx++) {
        const arr = this.buckets.get(this.key(ccx + dx, ccy + dy));
        if (arr) for (let i = 0; i < arr.length; i++) result.push(arr[i]);
      }
    }
    return result;
  }
}

// Organism with Endosymbiosis & Toxin Secretion
let ORG_ID_COUNTER = 1;
class Organism {
  constructor(x, y, genome, energy, generation, lineageId, brain, parentId) {
    this.id = ORG_ID_COUNTER++;
    this.x = x; this.y = y;
    this.vx = 0; this.vy = 0;
    this.genome = genome;
    this.maxEnergy = 40 + genome.size * 60;
    this.energy = energy !== undefined ? energy : this.maxEnergy * 0.55;
    this.age = 0;
    this.generation = generation || 1;
    this.lineageId = lineageId || this.id;
    this.parentId = parentId || 0;
    this.reproCooldown = 0;
    this.alive = true;

    this.brain = brain ? brain.clone() : new NEATBrain(10, 8, 6);

    this.endosymbionts = [];
    if (Math.random() < 0.25 || (genome.endoCapacity > 0.4 && Math.random() < 0.6)) {
      this.endosymbionts.push(Math.random() < 0.5 ? 'chloroplast' : 'mitochondria');
    }

    this.nerveSignal = 0;
    this.colonySize = 1;
    this.colonyMemberCount = 1;
    this.colonyGroupId = 0;
    this.centroidX = x; this.centroidY = y;
    this.bondedPartners = [];
    this.role = 'unicellular';

    this.kills = 0;
    this.offspringCount = 0;
    this._wanderAngle = Math.random() * Math.PI * 2;
  }

  get maxSpeed() {
    let speed = clamp(this.genome.speed / Math.sqrt(this.genome.size), 0.2, 3.4);
    if (this.role === 'motor') speed *= 1.4;
    if (this.endosymbionts.includes('mitochondria')) speed *= 1.25;
    return speed;
  }
  get eatRate() {
    let rate = 0.016 + this.genome.size * 0.012;
    if (this.role === 'digestor') rate *= 1.5;
    return rate;
  }
  get metabolismBase() {
    let base = 0.01 + Math.pow(this.genome.size, 1.65) * 0.013;
    base *= (1.1 - this.genome.membrane * 0.25);
    if (this.role === 'shield') base *= 1.15;
    if (this.role === 'germ') base *= 0.82;
    return base;
  }
  get lifespan() { return 520 + this.genome.size * 280; }
  get reproduceThreshold() {
    let factor = 0.72;
    if (this.role === 'germ') factor = 0.55;
    return this.maxEnergy * factor;
  }
  get captureRadius() { return 3.8 + this.genome.size * 3.4; }
  get effectiveSize() { return this.genome.size * this.colonySize; }

  updateRole(clusterMembers) {
    if (!clusterMembers || clusterMembers.length < 2) {
      this.role = 'unicellular';
      this.bondedPartners = [];
      return;
    }
    const dToCenter = Math.sqrt(dist2(this.x, this.y, this.centroidX, this.centroidY));
    const g = this.genome;

    if (dToCenter < 10 && g.colony > 0.5) this.role = 'germ';
    else if (g.toxinGene > 0.45) this.role = 'toxin';
    else if (g.membrane > 0.65 || g.size > 2.0) this.role = 'shield';
    else if (g.speed > 1.5) this.role = 'motor';
    else if (g.sense > 100) this.role = 'ocellus';
    else this.role = 'digestor';

    this.bondedPartners = clusterMembers.filter(m => m !== this && dist2(this.x, this.y, m.x, m.y) < 26 * 26);
  }

  perceive(foodGrid, spatialHash, W, H) {
    let senseR = this.genome.sense;
    if (this.role === 'ocellus') senseR *= 1.6;
    const senseR2 = senseR * senseR;

    const bestFoodCell = foodGrid.bestCellNear(this.x, this.y, senseR);
    let foodDx = 0, foodDy = 0;
    if (bestFoodCell) {
      const fdx = bestFoodCell.x - this.x, fdy = bestFoodCell.y - this.y;
      const fdist = Math.sqrt(fdx * fdx + fdy * fdy) || 1;
      foodDx = fdx / fdist; foodDy = fdy / fdist;
    }

    const neighbors = spatialHash.query(this.x, this.y, senseR);
    let prey = null, preyD2 = Infinity;
    let threat = null, threatD2 = Infinity;
    let kinSumX = 0, kinSumY = 0, kinCount = 0;

    for (let i = 0; i < neighbors.length; i++) {
      const other = neighbors[i];
      if (other === this || !other.alive) continue;
      const d2 = dist2(this.x, this.y, other.x, other.y);
      if (d2 > senseR2) continue;

      const sameLineage = hueDiff(this.genome.hue, other.genome.hue) < 14;
      const otherEff = other.effectiveSize;
      const selfEff = this.effectiveSize;

      if (sameLineage) {
        kinSumX += other.x; kinSumY += other.y; kinCount++;
      } else {
        if (otherEff > selfEff * 1.12 && (other.genome.aggression > 0.25 || other.genome.diet > 0.2)) {
          if (d2 < threatD2) { threatD2 = d2; threat = other; }
        }
        if (this.genome.diet > 0.12 && otherEff * 1.1 < selfEff) {
          if (d2 < preyD2) { preyD2 = d2; prey = other; }
        }
      }
    }

    let preyDx = 0, preyDy = 0;
    if (prey) {
      const pdx = prey.x - this.x, pdy = prey.y - this.y;
      const pdist = Math.sqrt(pdx * pdx + pdy * pdy) || 1;
      preyDx = pdx / pdist; preyDy = pdy / pdist;
    }

    let threatDx = 0, threatDy = 0;
    if (threat) {
      const tdx = threat.x - this.x, tdy = threat.y - this.y;
      const tdist = Math.sqrt(tdx * tdx + tdy * tdy) || 1;
      threatDx = tdx / tdist; threatDy = tdy / tdist;
    }

    let kinDx = 0, kinDy = 0;
    if (kinCount > 0) {
      const kcx = kinSumX / kinCount, kcy = kinSumY / kinCount;
      const kdx = kcx - this.x, kdy = kcy - this.y;
      const kdist = Math.sqrt(kdx * kdx + kdy * kdy) || 1;
      kinDx = kdx / kdist; kinDy = kdy / kdist;
    }

    return [foodDx, foodDy, preyDx, preyDy, threatDx, threatDy, kinDx, kinDy];
  }

  step(foodGrid, spatialHash, W, H, tempFactor = 1.0) {
    if (!this.alive) return;

    const envInputs = this.perceive(foodGrid, spatialHash, W, H);
    const outputs = this.brain.forward(envInputs);

    let dirX = outputs[0], dirY = outputs[1];
    const attackImpulse = outputs[2];
    const mag = Math.sqrt(dirX * dirX + dirY * dirY);

    if (mag < 0.1) {
      this._wanderAngle += (Math.random() - 0.5) * 0.8;
      dirX = Math.cos(this._wanderAngle); dirY = Math.sin(this._wanderAngle);
    } else {
      dirX /= mag; dirY /= mag;
    }

    const targetVx = dirX * this.maxSpeed;
    const targetVy = dirY * this.maxSpeed;
    this.vx = lerp(this.vx, targetVx, 0.32);
    this.vy = lerp(this.vy, targetVy, 0.32);

    this.nerveSignal = clamp(outputs[2] + outputs[3], 0, 1);
    const REST_LENGTH = 14;
    const STIFFNESS = 0.08;
    const DAMPING = 0.04;

    for (let i = 0; i < this.bondedPartners.length; i++) {
      const partner = this.bondedPartners[i];
      if (!partner.alive) continue;

      const dx = partner.x - this.x;
      const dy = partner.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const delta = dist - REST_LENGTH;

      const springF = delta * STIFFNESS;
      const nx = dx / dist;
      const ny = dy / dist;

      const relVx = partner.vx - this.vx;
      const relVy = partner.vy - this.vy;
      const dampF = (relVx * nx + relVy * ny) * DAMPING;

      const totalF = springF + dampF;
      this.vx += nx * totalF;
      this.vy += ny * totalF;

      if (this.nerveSignal > 0.4 && partner.nerveSignal < 0.4) {
        partner.nerveSignal = this.nerveSignal * 0.85;
      }

      if (this.role === 'digestor' && this.energy > this.maxEnergy * 0.6 && partner.energy < partner.maxEnergy * 0.5) {
        const transfer = 0.12;
        this.energy -= transfer;
        partner.energy += transfer;
      }
    }

    const biome = foodGrid.biomeAt(this.x, this.y);
    if (biome === 'pelagic') {
      this.vx += Math.sin(this.y * 0.01) * 0.08;
    }

    this.x = (this.x + this.vx + W) % W;
    this.y = (this.y + this.vy + H) % H;

    if (this.endosymbionts.includes('chloroplast') && foodGrid.lightFactor(this.y / 20) > 0.3) {
      this.energy = Math.min(this.maxEnergy, this.energy + 0.08 * foodGrid.lightFactor(this.y / 20));
    }

    if ((this.role === 'toxin' || this.genome.toxinGene > 0.4) && Math.random() < 0.15) {
      foodGrid.depositToxin(this.x, this.y, 0.22 * this.genome.toxinGene);
    }

    if (this.energy < this.maxEnergy * 0.98) {
      const eaten = foodGrid.eat(this.x, this.y, this.eatRate);
      if (eaten > 0) {
        const plantEff = 1 - this.genome.diet * 0.42;
        this.energy = Math.min(this.maxEnergy, this.energy + eaten * 44 * plantEff);
        this.brain.adaptPlasticity(0.08, this.genome.plasticity);
      }
    }

    if (attackImpulse > 0.35 && this.genome.diet > 0.12 && this.energy < this.maxEnergy * 0.95) {
      const neighbors = spatialHash.query(this.x, this.y, this.captureRadius * 1.5);
      for (let i = 0; i < neighbors.length; i++) {
        const other = neighbors[i];
        if (other === this || !other.alive) continue;
        const d2 = dist2(this.x, this.y, other.x, other.y);
        if (d2 <= this.captureRadius * this.captureRadius) {
          const sameLineage = hueDiff(this.genome.hue, other.genome.hue) < 12;
          if (!sameLineage && other.effectiveSize * 1.08 < this.effectiveSize) {
            let selfPower = this.genome.aggression * 0.4 + (this.effectiveSize - other.effectiveSize) * 0.06;
            let defenderPower = other.genome.membrane * 0.35 + other.genome.aggression * 0.15;
            if (other.role === 'shield') defenderPower *= 1.8;
            if (other.role === 'toxin' || other.genome.toxinGene > 0.4) {
              this.energy *= 0.85;
            }

            const successP = clamp(0.44 + selfPower - defenderPower, 0.05, 0.92);

            if (Math.random() < successP) {
              const meatGain = other.energy * 0.65 * clamp(0.35 + this.genome.diet * 0.85, 0.35, 1.0);
              this.energy = Math.min(this.maxEnergy, this.energy + meatGain);
              other.alive = false;
              this.kills++;
              foodGrid.deposit(other.x, other.y, 0.14 * other.genome.size);
              this.brain.adaptPlasticity(0.4, this.genome.plasticity);
            }
          }
        }
      }
    }

    const speedUsed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    const cost = (this.metabolismBase + speedUsed * 0.032) * tempFactor;
    this.energy -= cost;
    this.age++;

    if (this.reproCooldown > 0) this.reproCooldown--;
  }
}

// World Engine
class World {
  constructor(opts = {}) {
    this.width = opts.width || 1000;
    this.height = opts.height || 650;
    this.food = new FoodGrid(this.width, this.height, opts.foodCell || 20);
    this.organisms = [];
    this.tickCount = 0;
    this.MULTICELLULAR_THRESHOLD = 7;

    this.cladeTree = new Map();
    this.fossilRecord = [];

    this.params = Object.assign({
      foodGrowth: 0.011,
      mutationRate: 0.1,
      tempFactor: 1.0,
      maxPopulation: 450,
      sexualRatio: 0.35,
    }, opts.params || {});

    this.events = [];
    this.stats = {
      population: 0, species: 0, colonies: 0, multicellular: 0,
      avgSize: 0, avgSpeed: 0, herbivores: 0, carnivores: 0,
      foodCoverage: 0, maxGeneration: 1, topSpecies: 'None',
      era: 'Hadean Volcanic', o2: '5%', co2: '85%'
    };
    this.history = [];
    this._extinctFor = 0;
    this._lastNaturalistReport = 0;
  }

  registerSpecies(speciesName, parentName, hue) {
    if (!this.cladeTree.has(speciesName)) {
      this.cladeTree.set(speciesName, {
        name: speciesName,
        parentName: parentName || 'Abiogenesis',
        originTick: this.tickCount,
        hue: hue || 180,
        count: 0,
        totalEver: 0,
        extinct: false,
      });
    }
  }

  seed(count = 60) {
    const ancestorGenome = {
      size: 0.85, speed: 0.9, sense: 50, diet: 0.05,
      aggression: 0.08, colony: 0.15, membrane: 0.5,
      plasticity: 0.4, pheromoneRate: 0.2, toxinGene: 0.1, endoCapacity: 0.5,
      mutationRate: 0.1, hue: Math.random() * 360,
    };
    ancestorGenome.speciesName = generateSpeciesName(ancestorGenome);
    this.registerSpecies(ancestorGenome.speciesName, 'Abiogenesis', ancestorGenome.hue);

    for (let i = 0; i < count; i++) {
      const g = mutateGenome(ancestorGenome, 0.08);
      this.registerSpecies(g.speciesName, ancestorGenome.speciesName, g.hue);
      const x = Math.random() * this.width;
      const y = Math.random() * this.height;
      this.organisms.push(new Organism(x, y, g, undefined, 1, undefined));
    }
  }

  spawn(genome, x, y, energyFrac, brain, parentId) {
    const g = genome ? Object.assign({}, genome) : randomGenome();
    if (!g.speciesName) g.speciesName = generateSpeciesName(g);
    this.registerSpecies(g.speciesName, 'HandDesign', g.hue);

    const org = new Organism(
      x !== undefined ? x : Math.random() * this.width,
      y !== undefined ? y : Math.random() * this.height,
      g, undefined, 1, undefined, brain, parentId
    );
    if (energyFrac !== undefined) org.energy = org.maxEnergy * energyFrac;
    this.organisms.push(org);
    return org;
  }

  massExtinction(fraction = 0.75) {
    for (const o of this.organisms) if (Math.random() < fraction) o.alive = false;
  }

  generateNaturalistReport() {
    if (this.tickCount - this._lastNaturalistReport < 350) return;
    this._lastNaturalistReport = this.tickCount;

    const s = this.stats;
    const era = this.food.currentEra;
    let reportText = '';

    if (this.tickCount === 1500) {
      reportText = `[AI Naturalist] Great Archean Oxygenation Event begins! Oxygen levels rising.`;
    } else if (this.tickCount === 3500) {
      reportText = `[AI Naturalist] Proterozoic Snowball Earth era arrives! Ice sheets cover the photic surface.`;
    } else if (this.tickCount === 5500) {
      reportText = `[AI Naturalist] Cambrian Explosion! Optimal oxygenation sparks adaptive radiation.`;
    } else if (s.multicellular > 2 && Math.random() < 0.5) {
      reportText = `[AI Naturalist] Multicellular complexity surging: ${s.multicellular} organisms with spring tissue bodies active.`;
    } else if (s.carnivores > s.herbivores && Math.random() < 0.5) {
      reportText = `[AI Naturalist] Apex Predators dominant: Carnivores outweigh grazers in the ${era} era.`;
    } else {
      reportText = `[AI Naturalist] Species ${s.topSpecies} leads ecosystem diversity in ${era}.`;
    }

    this.events.push({ tick: this.tickCount, text: reportText });
  }

  tick() {
    const W = this.width, H = this.height;
    const p = this.params;

    this.food.grow(p.foodGrowth, this.tickCount);

    const hash = new SpatialHash(W, H, 40);
    const alive = [];
    for (let i = 0; i < this.organisms.length; i++) {
      const o = this.organisms[i];
      if (o.alive) { alive.push(o); hash.insert(o); }
    }

    const parent = new Map();
    const find = (o) => {
      let r = o;
      while (parent.get(r) && parent.get(r) !== r) r = parent.get(r);
      return r;
    };
    const union = (a, b) => { const ra = find(a), rb = find(b); if (ra !== rb) parent.set(ra, rb); };

    for (let i = 0; i < alive.length; i++) parent.set(alive[i], alive[i]);

    const BOND_R = 18;
    const BOND_R2 = BOND_R * BOND_R;
    for (let i = 0; i < alive.length; i++) {
      const o = alive[i];
      if (o.genome.colony < 0.38) continue;
      const nearby = hash.query(o.x, o.y, BOND_R);
      for (let j = 0; j < nearby.length; j++) {
        const other = nearby[j];
        if (other === o || !other.alive) continue;
        if (other.genome.colony < 0.38) continue;
        if (hueDiff(o.genome.hue, other.genome.hue) > 14) continue;
        if (dist2(o.x, o.y, other.x, other.y) <= BOND_R2) union(o, other);
      }
    }

    const groups = new Map();
    for (let i = 0; i < alive.length; i++) {
      const o = alive[i];
      const r = find(o);
      let arr = groups.get(r);
      if (!arr) { arr = []; groups.set(r, arr); }
      arr.push(o);
    }

    let groupIdCounter = 0;
    for (const arr of groups.values()) {
      groupIdCounter++;
      const sizeSum = arr.reduce((s, m) => s + m.genome.size, 0);
      const cx = arr.reduce((s, m) => s + m.x, 0) / arr.length;
      const cy = arr.reduce((s, m) => s + m.y, 0) / arr.length;

      for (let i = 0; i < arr.length; i++) {
        const m = arr[i];
        m.colonyMemberCount = arr.length;
        m.colonyGroupId = groupIdCounter;
        m.centroidX = cx; m.centroidY = cy;

        if (arr.length > 1) {
          const othersSize = sizeSum - m.genome.size;
          m.colonySize = 1 + Math.min(2.4, 0.45 * othersSize / m.genome.size);
        } else {
          m.colonySize = 1;
        }
        m.updateRole(arr);
      }
    }

    for (let i = 0; i < alive.length; i++) alive[i].step(this.food, hash, W, H, p.tempFactor);

    const newborns = [];
    for (let i = 0; i < alive.length; i++) {
      const o = alive[i];
      if (!o.alive) continue;

      if (o.energy <= 0 || o.age > o.lifespan) {
        o.alive = false;
        this.food.deposit(o.x, o.y, 0.12 * o.genome.size);

        if (o.kills >= 3 || o.offspringCount >= 4 || o.age > 700) {
          this.fossilRecord.push({
            id: o.id, speciesName: o.genome.speciesName,
            age: o.age, kills: o.kills, offspringCount: o.offspringCount,
            generation: o.generation, genome: Object.assign({}, o.genome),
          });
          if (this.fossilRecord.length > 25) this.fossilRecord.shift();
        }
        continue;
      }

      if (o.energy >= o.reproduceThreshold && o.reproCooldown <= 0 && (alive.length + newborns.length) < p.maxPopulation) {
        let childGenome, childBrain;
        let isSexual = false;

        if (Math.random() < p.sexualRatio) {
          const neighbors = hash.query(o.x, o.y, 24);
          for (let j = 0; j < neighbors.length; j++) {
            const partner = neighbors[j];
            if (partner === o || !partner.alive || partner.reproCooldown > 0) continue;
            if (partner.energy >= partner.reproduceThreshold * 0.75) {
              if (hueDiff(o.genome.hue, partner.genome.hue) < 35) {
                childGenome = crossoverGenome(o.genome, partner.genome, p.mutationRate);
                childBrain = o.brain.crossover(partner.brain, p.mutationRate);
                partner.energy *= 0.65;
                partner.reproCooldown = 40;
                isSexual = true;
                break;
              }
            }
          }
        }

        if (!isSexual) {
          childGenome = mutateGenome(o.genome, p.mutationRate);
          childBrain = o.brain.clone();
          childBrain.mutate(p.mutationRate);
        }

        this.registerSpecies(childGenome.speciesName, o.genome.speciesName, childGenome.hue);

        const energyAlloc = o.energy * 0.45;
        o.energy *= 0.52;
        o.reproCooldown = 50 + Math.floor(o.genome.size * 18);

        const angle = Math.random() * Math.PI * 2;
        const child = new Organism(
          (o.x + Math.cos(angle) * 8 + W) % W,
          (o.y + Math.sin(angle) * 8 + H) % H,
          childGenome, energyAlloc, o.generation + 1, o.lineageId, childBrain, o.id
        );

        newborns.push(child);
        o.offspringCount++;
      }
    }

    this.organisms = alive.filter(o => o.alive).concat(newborns);
    this.tickCount++;

    if (this.organisms.length === 0) {
      this._extinctFor++;
      if (this._extinctFor > 80) {
        this.seed(30);
        this.events.push({ tick: this.tickCount, text: 'A fresh spark of abiogenesis ignites in the vents.' });
        this._extinctFor = 0;
      }
    } else {
      this._extinctFor = 0;
    }

    if (this.tickCount % 20 === 0) {
      this._updateStats();
      this.history.push({ t: this.tickCount, pop: this.organisms.length });
      if (this.history.length > 250) this.history.shift();
      this.generateNaturalistReport();
    }
  }

  _updateStats() {
    const orgs = this.organisms;
    const s = this.stats;
    s.population = orgs.length;
    s.era = this.food.currentEra;
    s.o2 = (this.food.o2Level * 100).toFixed(0) + '%';
    s.co2 = (this.food.co2Level * 100).toFixed(0) + '%';

    for (const node of this.cladeTree.values()) node.count = 0;

    if (orgs.length === 0) {
      s.species = 0; s.colonies = 0; s.multicellular = 0;
      s.avgSize = 0; s.avgSpeed = 0; s.herbivores = 0; s.carnivores = 0;
      s.foodCoverage = this.food.coverage();
      s.topSpecies = 'None';
      return;
    }

    let sumSize = 0, sumSpeed = 0, herb = 0, carn = 0, maxGen = 1;
    const hues = [];
    const seenGroups = new Set();
    let colonies = 0, multicell = 0;

    for (let i = 0; i < orgs.length; i++) {
      const o = orgs[i];
      sumSize += o.genome.size;
      sumSpeed += o.genome.speed;
      if (o.genome.diet > 0.32) carn++; else herb++;
      if (o.generation > maxGen) maxGen = o.generation;
      hues.push(o.genome.hue);

      const sName = o.genome.speciesName || 'Unknown';
      if (!this.cladeTree.has(sName)) this.registerSpecies(sName, 'Unknown', o.genome.hue);
      const node = this.cladeTree.get(sName);
      node.count++;
      node.totalEver++;

      if (o.colonyMemberCount > 1 && !seenGroups.has(o.colonyGroupId)) {
        seenGroups.add(o.colonyGroupId);
        colonies++;
        if (o.colonyMemberCount >= this.MULTICELLULAR_THRESHOLD) multicell++;
      }
    }

    let topName = 'None', maxCount = 0;
    for (const node of this.cladeTree.values()) {
      if (node.count > maxCount) {
        maxCount = node.count;
        topName = node.name;
      }
    }

    hues.sort((a, b) => a - b);
    let speciesClusters = hues.length ? 1 : 0;
    for (let i = 1; i < hues.length; i++) {
      if (hues[i] - hues[i - 1] > 14) speciesClusters++;
    }

    s.species = speciesClusters;
    s.colonies = colonies;
    s.multicellular = multicell;
    s.avgSize = sumSize / orgs.length;
    s.avgSpeed = sumSpeed / orgs.length;
    s.herbivores = herb;
    s.carnivores = carn;
    s.foodCoverage = this.food.coverage();
    s.maxGeneration = maxGen;
    s.topSpecies = `${topName} (${maxCount})`;
  }
}

// =====================================================================
// PHASE 3 UI & GRAPHICS RENDERER LAYER
// =====================================================================

const canvas = document.getElementById('sea');
const ctx = canvas.getContext('2d');
const stage = document.getElementById('stage');
const popChart = document.getElementById('popChart');
const popCtx = popChart.getContext('2d');
const brainCanvas = document.getElementById('brainCanvas');
const brainCtx = brainCanvas.getContext('2d');
const minimapCanvas = document.getElementById('minimapCanvas');
const minimapCtx = minimapCanvas.getContext('2d');

const world = new World({ width: 1000, height: 650 });
world.seed(60);

let paused = false;
let ticksPerFrame = 1;
let selected = null;
let hovered = null;
let followMode = false;

let camera = { x: world.width / 2, y: world.height / 2, zoom: 1.0 };
let isDragging = false;
let dragStart = { x: 0, y: 0 };

function resizeCanvas() {
  const rect = stage.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  canvas.style.width = rect.width + 'px';
  canvas.style.height = rect.height + 'px';
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function getMapping() {
  const cw = canvas.width, ch = canvas.height;
  const baseScale = Math.min(cw / world.width, ch / world.height);
  const scale = baseScale * camera.zoom;
  const offX = (cw / 2) - (camera.x * scale);
  const offY = (ch / 2) - (camera.y * scale);
  return { scale, offX, offY };
}

function worldToScreen(wx, wy) {
  const m = getMapping();
  return [m.offX + wx * m.scale, m.offY + wy * m.scale];
}

function screenToWorld(px, py) {
  const m = getMapping();
  return [(px - m.offX) / m.scale, (py - m.offY) / m.scale];
}

stage.addEventListener('mousedown', (e) => {
  if (e.target !== canvas) return;
  isDragging = true;
  dragStart = { x: e.clientX, y: e.clientY };
});

stage.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const px = (e.clientX - rect.left) * (canvas.width / rect.width);
  const py = (e.clientY - rect.top) * (canvas.height / rect.height);
  const [wx, wy] = screenToWorld(px, py);

  let hBest = null, hD = 22 * 22;
  for (let i = 0; i < world.organisms.length; i++) {
    const o = world.organisms[i];
    const d2 = dist2(o.x, o.y, wx, wy);
    if (d2 < hD) { hD = d2; hBest = o; }
  }
  hovered = hBest;
  updateHoverTooltip(e.clientX, e.clientY);

  if (!isDragging) return;
  const m = getMapping();
  const dx = (e.clientX - dragStart.x) * (canvas.width / stage.clientWidth) / m.scale;
  const dy = (e.clientY - dragStart.y) * (canvas.height / stage.clientHeight) / m.scale;
  camera.x -= dx; camera.y -= dy;
  dragStart = { x: e.clientX, y: e.clientY };
});

stage.addEventListener('mouseup', () => { isDragging = false; });
stage.addEventListener('mouseleave', () => { isDragging = false; hovered = null; updateHoverTooltip(); });

stage.addEventListener('wheel', (e) => {
  e.preventDefault();
  const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
  camera.zoom = clamp(camera.zoom * zoomFactor, 0.4, 4.5);
}, { passive: false });

document.getElementById('resetCamBtn').addEventListener('click', () => {
  camera = { x: world.width / 2, y: world.height / 2, zoom: 1.0 };
  followMode = false;
  document.getElementById('followBtn').textContent = 'Follow Cell: OFF';
  document.getElementById('followBtn').classList.remove('active');
});

const followBtn = document.getElementById('followBtn');
followBtn.addEventListener('click', () => {
  followMode = !followMode;
  followBtn.textContent = followMode ? 'Follow Cell: ON' : 'Follow Cell: OFF';
  if (followMode) followBtn.classList.add('active'); else followBtn.classList.remove('active');
});

const tt = document.getElementById('creatureTooltip');
function updateHoverTooltip(screenX, screenY) {
  if (!hovered || !hovered.alive) {
    tt.style.display = 'none';
    return;
  }
  tt.style.display = 'block';
  tt.style.left = screenX + 'px';
  tt.style.top = screenY + 'px';
  document.getElementById('ttTitle').textContent = hovered.genome.speciesName;
  document.getElementById('ttInfo').textContent = `${hovered.role} · ${hovered.age} ticks · Endosymbionts: ${hovered.endosymbionts.length}`;
  const pct = Math.round((hovered.energy / hovered.maxEnergy) * 100);
  document.getElementById('ttEnergyBar').style.width = pct + '%';
}

// Render Main Sea Canvas with Phase 3 Bioluminescent & Toxin FX
function render() {
  if (followMode && selected && selected.alive) {
    camera.x = lerp(camera.x, selected.x, 0.1);
    camera.y = lerp(camera.y, selected.y, 0.1);
  }

  const m = getMapping();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#070b09';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(m.offX, m.offY);
  ctx.scale(m.scale, m.scale);

  // Multi-Biome Background Gradients
  const gradPhotic = ctx.createLinearGradient(0, 0, 0, world.height * 0.35);
  gradPhotic.addColorStop(0, '#2d4a39');
  gradPhotic.addColorStop(1, '#1b2d23');
  ctx.fillStyle = gradPhotic;
  ctx.fillRect(0, 0, world.width, world.height * 0.35);

  const gradPelagic = ctx.createLinearGradient(0, world.height * 0.35, 0, world.height * 0.70);
  gradPelagic.addColorStop(0, '#1b2d23');
  gradPelagic.addColorStop(1, '#111f18');
  ctx.fillStyle = gradPelagic;
  ctx.fillRect(0, world.height * 0.35, world.width, world.height * 0.35);

  const gradAbyssal = ctx.createLinearGradient(0, world.height * 0.70, 0, world.height);
  gradAbyssal.addColorStop(0, '#111f18');
  gradAbyssal.addColorStop(1, '#070c09');
  ctx.fillStyle = gradAbyssal;
  ctx.fillRect(0, world.height * 0.70, world.width, world.height * 0.30);

  // Snowball Earth Ice Layer Visual Overlay
  if (world.food.currentEra === 'Proterozoic Snowball') {
    ctx.fillStyle = 'rgba(200, 240, 255, 0.28)';
    ctx.fillRect(0, 0, world.width, world.height * 0.18);
  }

  // Sunlit Photic Surface Caustics
  const dayPhase = Math.sin((world.tickCount * Math.PI) / 120);
  if (dayPhase > 0 && world.food.currentEra !== 'Proterozoic Snowball') {
    ctx.strokeStyle = `rgba(180, 230, 200, ${0.08 * dayPhase})`;
    ctx.lineWidth = 15;
    for (let c = 0; c < 5; c++) {
      const cx = (c * 220 + world.tickCount * 0.5) % world.width;
      ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx + 80, world.height * 0.35); ctx.stroke();
    }
  }

  // Biome Division Boundary Lines
  ctx.strokeStyle = 'rgba(155, 93, 229, 0.35)';
  ctx.lineWidth = 1 / m.scale;
  ctx.setLineDash([8, 8]);
  ctx.beginPath(); ctx.moveTo(0, world.height * 0.35); ctx.lineTo(world.width, world.height * 0.35); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, world.height * 0.70); ctx.lineTo(world.width, world.height * 0.70); ctx.stroke();
  ctx.setLineDash([]);

  // Hydrothermal Vent Embers
  for (let i = 0; i < world.food.vents.length; i++) {
    const v = world.food.vents[i];
    const vx = (v.cx + 0.5) * world.food.cellSize;
    const vy = (v.cy + 0.5) * world.food.cellSize;
    const pulse = 1.0 + Math.sin(world.tickCount * 0.08 + i) * 0.14;
    const r = v.r * world.food.cellSize * 1.8 * pulse;

    const g = ctx.createRadialGradient(vx, vy, 0, vx, vy, r);
    g.addColorStop(0, 'rgba(240,106,56,0.35)');
    g.addColorStop(0.5, 'rgba(240,106,56,0.12)');
    g.addColorStop(1, 'rgba(240,106,56,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(vx, vy, r, 0, Math.PI * 2); ctx.fill();

    for (let e = 0; e < 3; e++) {
      const ey = vy - ((world.tickCount * 1.5 + e * 20) % (r * 0.9));
      const ex = vx + Math.sin(ey * 0.1 + e) * 6;
      ctx.fillStyle = 'rgba(255,209,102,0.6)';
      ctx.beginPath(); ctx.arc(ex, ey, 1.2, 0, Math.PI * 2); ctx.fill();
    }
  }

  // Food, Pheromone & Toxin Grid Density
  const cs = world.food.cellSize;
  const dens = world.food.density;
  const phero = world.food.pheromones;
  const toxins = world.food.toxins;
  for (let cy = 0; cy < world.food.rows; cy++) {
    for (let cx = 0; cx < world.food.cols; cx++) {
      const idx = cy * world.food.cols + cx;
      const d = dens[idx];
      const p = phero[idx];
      const t = toxins[idx];

      if (d > 0.05) {
        const alpha = Math.min(0.58, d * 0.58);
        ctx.fillStyle = `rgba(140,185,85,${alpha})`;
        ctx.fillRect(cx * cs, cy * cs, cs + 0.5, cs + 0.5);
      }
      if (p > 0.05) {
        ctx.fillStyle = `rgba(60,174,163,${p * 0.45})`;
        ctx.fillRect(cx * cs, cy * cs, cs + 0.5, cs + 0.5);
      }
      if (t > 0.05) {
        ctx.fillStyle = `rgba(155,93,229,${t * 0.45})`;
        ctx.fillRect(cx * cs, cy * cs, cs + 0.5, cs + 0.5);
      }
    }
  }

  // Multicellular Tissue & Inter-Cell Nerve Net Pulses
  for (let i = 0; i < world.organisms.length; i++) {
    const o = world.organisms[i];
    if (o.colonyMemberCount > 1) {
      for (let j = 0; j < o.bondedPartners.length; j++) {
        const partner = o.bondedPartners[j];
        if (partner.alive) {
          ctx.strokeStyle = `hsla(${o.genome.hue.toFixed(0)}, 65%, 55%, 0.45)`;
          ctx.lineWidth = Math.min(o.genome.size, partner.genome.size) * 2.2;
          ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(partner.x, partner.y); ctx.stroke();

          // Nerve pulse dot moving along link
          if (o.nerveSignal > 0.3) {
            const px = lerp(o.x, partner.x, (world.tickCount * 0.1) % 1);
            const py = lerp(o.y, partner.y, (world.tickCount * 0.1) % 1);
            ctx.fillStyle = '#ffd166';
            ctx.beginPath(); ctx.arc(px, py, 1.5, 0, Math.PI * 2); ctx.fill();
          }
        }
      }
    }
  }

  // Multicellular Glowing Halos
  const haloSeen = new Set();
  for (let i = 0; i < world.organisms.length; i++) {
    const o = world.organisms[i];
    if (o.colonyMemberCount >= world.MULTICELLULAR_THRESHOLD && !haloSeen.has(o.colonyGroupId)) {
      haloSeen.add(o.colonyGroupId);
      const r = 15 + o.colonyMemberCount * 3.6;
      const g = ctx.createRadialGradient(o.centroidX, o.centroidY, 0, o.centroidX, o.centroidY, r);
      g.addColorStop(0, 'rgba(155,93,229,0.3)');
      g.addColorStop(0.7, 'rgba(155,93,229,0.1)');
      g.addColorStop(1, 'rgba(155,93,229,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(o.centroidX, o.centroidY, r, 0, Math.PI * 2); ctx.fill();
    }
  }

  // Organisms with Endosymbionts & Organelles
  for (let i = 0; i < world.organisms.length; i++) {
    const o = world.organisms[i];
    const r = 2.4 + o.genome.size * 2.4;
    const light = 42 + o.genome.diet * 12;
    const sat = 55 + o.genome.colony * 20;

    // Bioluminescent Aura
    const auraG = ctx.createRadialGradient(o.x, o.y, r * 0.4, o.x, o.y, r * 2.2);
    auraG.addColorStop(0, `hsla(${o.genome.hue.toFixed(0)},${sat}%,${light + 18}%,0.4)`);
    auraG.addColorStop(1, `hsla(${o.genome.hue.toFixed(0)},${sat}%,${light}%,0)`);
    ctx.fillStyle = auraG;
    ctx.beginPath(); ctx.arc(o.x, o.y, r * 2.2, 0, Math.PI * 2); ctx.fill();

    // Motor Flagella
    if (o.role === 'motor' || o.genome.speed > 1.2) {
      const cCount = Math.floor(3 + o.genome.speed * 2.5);
      ctx.strokeStyle = `hsla(${o.genome.hue.toFixed(0)},${sat}%,${light + 10}%,0.65)`;
      ctx.lineWidth = 1.0;
      for (let c = 0; c < cCount; c++) {
        const angle = (c / cCount) * Math.PI * 2 + world.tickCount * 0.2;
        const tx = o.x + Math.cos(angle) * (r + 4.5);
        const ty = o.y + Math.sin(angle) * (r + 4.5);
        ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(tx, ty); ctx.stroke();
      }
    }

    // Cell Body Core
    ctx.beginPath();
    ctx.arc(o.x, o.y, r, 0, Math.PI * 2);
    ctx.fillStyle = `hsl(${o.genome.hue.toFixed(0)},${sat}%,${light + 18}%)`;
    ctx.fill();

    // Endosymbiont Rings inside cell body
    if (o.endosymbionts.includes('chloroplast')) {
      ctx.fillStyle = '#4ecdc4';
      ctx.beginPath(); ctx.arc(o.x - r * 0.3, o.y - r * 0.3, r * 0.25, 0, Math.PI * 2); ctx.fill();
    }
    if (o.endosymbionts.includes('mitochondria')) {
      ctx.fillStyle = '#ffd166';
      ctx.beginPath(); ctx.arc(o.x + r * 0.3, o.y + r * 0.3, r * 0.25, 0, Math.PI * 2); ctx.fill();
    }

    // Morphotype Specific Details
    if (o.role === 'shield') {
      ctx.lineWidth = 1.8; ctx.strokeStyle = '#ffd166'; ctx.stroke();
    } else if (o.role === 'toxin') {
      ctx.lineWidth = 1.8; ctx.strokeStyle = '#9b5de5'; ctx.stroke();
    } else if (o.role === 'ocellus') {
      ctx.fillStyle = '#3caea3';
      ctx.beginPath(); ctx.arc(o.x + r * 0.5, o.y, r * 0.3, 0, Math.PI * 2); ctx.fill();
    }

    // Selection Ring
    if (o === selected) {
      ctx.lineWidth = 2.0; ctx.strokeStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(o.x, o.y, r + 3.5, 0, Math.PI * 2); ctx.stroke();

      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = 'rgba(155,93,229,0.6)';
      ctx.beginPath(); ctx.arc(o.x, o.y, o.genome.sense, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  ctx.restore();
  renderMinimap();
}

// Render Mini-Map Radar Overview (#minimapCanvas)
function renderMinimap() {
  const mw = minimapCanvas.width, mh = minimapCanvas.height;
  minimapCtx.clearRect(0, 0, mw, mh);

  minimapCtx.fillStyle = 'rgba(10, 16, 13, 0.9)';
  minimapCtx.fillRect(0, 0, mw, mh);

  const scaleX = mw / world.width;
  const scaleY = mh / world.height;

  for (let i = 0; i < world.organisms.length; i++) {
    const o = world.organisms[i];
    minimapCtx.fillStyle = `hsl(${o.genome.hue.toFixed(0)}, 70%, 60%)`;
    minimapCtx.fillRect(o.x * scaleX, o.y * scaleY, 1.8, 1.8);
  }

  const m = getMapping();
  const vx = (-m.offX / m.scale) * scaleX;
  const vy = (-m.offY / m.scale) * scaleY;
  const vw = (canvas.width / m.scale) * scaleX;
  const vh = (canvas.height / m.scale) * scaleY;

  minimapCtx.strokeStyle = '#9b5de5';
  minimapCtx.lineWidth = 1;
  minimapCtx.strokeRect(vx, vy, vw, vh);
}

// Render Population Graph Chart
function renderPopChart() {
  const w = popChart.width, h = popChart.height;
  popCtx.clearRect(0, 0, w, h);
  const hist = world.history;
  if (hist.length < 2) return;
  let maxPop = 10;
  for (let i = 0; i < hist.length; i++) if (hist[i].pop > maxPop) maxPop = hist[i].pop;

  popCtx.beginPath();
  hist.forEach((p, i) => {
    const x = (i / (hist.length - 1)) * (w - 4) + 2;
    const y = h - 4 - (p.pop / maxPop) * (h - 8);
    if (i === 0) popCtx.moveTo(x, y); else popCtx.lineTo(x, y);
  });
  popCtx.strokeStyle = '#9b5de5';
  popCtx.lineWidth = 1.4;
  popCtx.stroke();
}

// Render Dynamic NEAT Neural Network Brain Graph
function renderBrainGraph() {
  const w = brainCanvas.width, h = brainCanvas.height;
  brainCtx.clearRect(0, 0, w, h);

  if (!selected || !selected.alive) {
    document.getElementById('brainTargetLabel').textContent = 'No cell selected';
    document.getElementById('brainActions').style.display = 'none';
    brainCtx.fillStyle = '#8b9488';
    brainCtx.font = '11px ui-monospace, monospace';
    brainCtx.textAlign = 'center';
    brainCtx.fillText('Click any cell in the ocean to inspect its NEAT brain', w / 2, h / 2);
    return;
  }

  document.getElementById('brainTargetLabel').textContent = `Cell #${selected.id} (${selected.genome.speciesName})`;
  document.getElementById('brainActions').style.display = 'block';

  const brain = selected.brain;
  const inputs = brain.inputs;
  const hidden = brain.hidden;
  const outputs = brain.outputs;

  const inputLabels = ['F.dx', 'F.dy', 'P.dx', 'P.dy', 'T.dx', 'T.dy', 'K.dx', 'NRG', 'M1.in', 'M2.in'];
  const outputLabels = ['MovX', 'MovY', 'Atk', 'Col', 'M1.out', 'M2.out'];

  const layerX = [38, w / 2, w - 46];
  const inputY = [];
  const hiddenY = [];
  const outputY = [];

  for (let i = 0; i < 10; i++) inputY.push(14 + i * 16);
  for (let hIndex = 0; hIndex < brain.hiddenSize; hIndex++) hiddenY.push(18 + hIndex * (160 / brain.hiddenSize));
  for (let o = 0; o < 6; o++) outputY.push(22 + o * 27);

  // W1 Synapses
  for (let hIndex = 0; hIndex < brain.hiddenSize; hIndex++) {
    const rowOffset = hIndex * 10;
    for (let i = 0; i < 10; i++) {
      const weight = brain.W1[rowOffset + i];
      if (Math.abs(weight) < 0.05) continue;
      const alpha = clamp(Math.abs(weight) / 2.5, 0.12, 0.85);
      brainCtx.strokeStyle = weight > 0 ? `rgba(155,93,229,${alpha})` : `rgba(240,106,56,${alpha})`;
      brainCtx.lineWidth = clamp(Math.abs(weight) * 1.2, 0.5, 2.4);
      brainCtx.beginPath();
      brainCtx.moveTo(layerX[0], inputY[i]);
      brainCtx.lineTo(layerX[1], hiddenY[hIndex]);
      brainCtx.stroke();
    }
  }

  // W2 Synapses
  for (let o = 0; o < 6; o++) {
    const rowOffset = o * brain.maxHiddenSize;
    for (let hIndex = 0; hIndex < brain.hiddenSize; hIndex++) {
      const weight = brain.W2[rowOffset + hIndex];
      if (Math.abs(weight) < 0.05) continue;
      const alpha = clamp(Math.abs(weight) / 2.5, 0.12, 0.85);
      brainCtx.strokeStyle = weight > 0 ? `rgba(155,93,229,${alpha})` : `rgba(240,106,56,${alpha})`;
      brainCtx.lineWidth = clamp(Math.abs(weight) * 1.2, 0.5, 2.4);
      brainCtx.beginPath();
      brainCtx.moveTo(layerX[1], hiddenY[hIndex]);
      brainCtx.lineTo(layerX[2], outputY[o]);
      brainCtx.stroke();
    }
  }

  // Input Nodes
  for (let i = 0; i < 10; i++) {
    const act = inputs[i] || 0;
    brainCtx.fillStyle = i >= 8 ? `rgba(255,209,102,${0.4 + Math.abs(act) * 0.6})` : `rgba(60,174,163,${0.3 + Math.abs(act) * 0.7})`;
    brainCtx.beginPath(); brainCtx.arc(layerX[0], inputY[i], 3.8, 0, Math.PI * 2); brainCtx.fill();
    brainCtx.fillStyle = '#8b9488';
    brainCtx.font = '8.5px ui-monospace, monospace';
    brainCtx.textAlign = 'right';
    brainCtx.fillText(inputLabels[i], layerX[0] - 5, inputY[i] + 3);
  }

  // NEAT Dynamic Hidden Nodes
  for (let hIndex = 0; hIndex < brain.hiddenSize; hIndex++) {
    const act = hidden[hIndex] || 0;
    brainCtx.fillStyle = `rgba(155,93,229,${0.4 + Math.abs(act) * 0.6})`;
    brainCtx.beginPath(); brainCtx.arc(layerX[1], hiddenY[hIndex], 4.5, 0, Math.PI * 2); brainCtx.fill();
  }

  // Output Nodes
  for (let o = 0; o < 6; o++) {
    const act = outputs[o] || 0;
    brainCtx.fillStyle = o >= 4 ? `rgba(255,209,102,${0.4 + Math.abs(act) * 0.6})` : `rgba(240,106,56,${0.3 + Math.abs(act) * 0.7})`;
    brainCtx.beginPath(); brainCtx.arc(layerX[2], outputY[o], 4.5, 0, Math.PI * 2); brainCtx.fill();
    brainCtx.fillStyle = '#e6ebd9';
    brainCtx.font = '8.5px ui-monospace, monospace';
    brainCtx.textAlign = 'left';
    brainCtx.fillText(outputLabels[o], layerX[2] + 6, outputY[o] + 3);
  }
}

// Render Telemetry & Stats Panel
const statGrid = document.getElementById('statGrid');
function renderStats() {
  const s = world.stats;
  const rows = [
    ['Geological Era', s.era, 'purple'],
    ['Oxygen (O₂)', s.o2, 'cyan'],
    ['Carbon Dioxide (CO₂)', s.co2],
    ['Population', s.population],
    ['Distinct Species', s.species],
    ['Dominant Species', s.topSpecies, 'cyan'],
    ['Colonies', s.colonies],
    ['Multicellular Organisms', s.multicellular, s.multicellular > 0 ? 'ember' : ''],
    ['Grazers / Hunters', `${s.herbivores} / ${s.carnivores}`],
    ['Nutrient Coverage', (s.foodCoverage * 100).toFixed(1) + '%'],
    ['Deepest Generation', s.maxGeneration || 1, 'mineral'],
  ];
  statGrid.innerHTML = rows.map(r => `<div class="k">${r[0]}</div><div class="v ${r[2] || ''}">${r[1]}</div>`).join('');
  document.getElementById('dayLabel').textContent = `Day ${Math.floor(world.tickCount / 60)} · Tick ${world.tickCount} · Gen ${s.maxGeneration || 1}`;
  document.getElementById('eraBadge').textContent = s.era;
}

// Event Log
const eventLog = document.getElementById('eventLog');
const loggedEvents = [];
function flushEvents() {
  if (!world.events.length) return;
  for (let i = 0; i < world.events.length; i++) loggedEvents.unshift(world.events[i]);
  world.events = [];
  if (loggedEvents.length > 12) loggedEvents.length = 12;
  eventLog.innerHTML = loggedEvents.map(e => `<div class="row"><span class="t">t${e.tick}</span>${e.text}</div>`).join('');
}

// Main Loop
let lastStatTime = 0;
function frame(ts) {
  if (!paused) {
    for (let i = 0; i < ticksPerFrame; i++) world.tick();
  }
  render();
  flushEvents();
  if (!lastStatTime || ts - lastStatTime > 180) {
    world._updateStats();
    renderStats();
    renderPopChart();
    renderBrainGraph();
    if (selected && !selected.alive) { selected = null; renderInspector(); }
    else if (selected) renderInspector();
    lastStatTime = ts;
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Topbar Controls
const playPauseBtn = document.getElementById('playPauseBtn');
playPauseBtn.addEventListener('click', () => {
  paused = !paused;
  playPauseBtn.textContent = paused ? 'Resume' : 'Pause';
});

document.getElementById('speedSeg').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-speed]');
  if (!btn) return;
  ticksPerFrame = parseInt(btn.dataset.speed, 10);
  document.querySelectorAll('#speedSeg .btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
});

document.getElementById('resetBtn').addEventListener('click', () => {
  world.organisms = [];
  world.food = new FoodGrid(world.width, world.height, 20);
  world.tickCount = 0;
  world.history = [];
  world.cladeTree.clear();
  loggedEvents.length = 0;
  eventLog.innerHTML = '';
  selected = null;
  world.seed(60);
  renderInspector();
});

// Environment Sliders
const mutSlider = document.getElementById('mutSlider');
const growSlider = document.getElementById('growSlider');
const tempSlider = document.getElementById('tempSlider');
const sexSlider = document.getElementById('sexSlider');
mutSlider.value = world.params.mutationRate;
growSlider.value = world.params.foodGrowth;
tempSlider.value = world.params.tempFactor;
sexSlider.value = world.params.sexualRatio;

function syncSliderLabels() {
  document.getElementById('mutVal').textContent = Number(mutSlider.value).toFixed(2);
  document.getElementById('growVal').textContent = Number(growSlider.value).toFixed(3);
  document.getElementById('tempVal').textContent = Number(tempSlider.value).toFixed(2) + '×';
  document.getElementById('sexVal').textContent = Number(sexSlider.value).toFixed(2);
}
mutSlider.addEventListener('input', () => { world.params.mutationRate = parseFloat(mutSlider.value); syncSliderLabels(); });
growSlider.addEventListener('input', () => { world.params.foodGrowth = parseFloat(growSlider.value); syncSliderLabels(); });
tempSlider.addEventListener('input', () => { world.params.tempFactor = parseFloat(tempSlider.value); syncSliderLabels(); });
sexSlider.addEventListener('input', () => { world.params.sexualRatio = parseFloat(sexSlider.value); syncSliderLabels(); });
syncSliderLabels();

// Disaster & Intervention Buttons
document.getElementById('extinctionBtn').addEventListener('click', () => {
  world.massExtinction(0.75);
  world.events.push({ tick: world.tickCount, text: 'Mass extinction: three out of four cells perish.' });
});
document.getElementById('bloomBtn').addEventListener('click', () => {
  for (let i = 0; i < world.food.density.length; i++) world.food.density[i] = Math.min(1, world.food.density[i] + 0.45);
  world.events.push({ tick: world.tickCount, text: 'Nutrient bloom: organic soup surges across the seabed.' });
});
document.getElementById('stormBtn').addEventListener('click', () => {
  const prev = world.params.mutationRate;
  world.params.mutationRate = Math.min(0.35, prev + 0.18);
  mutSlider.value = world.params.mutationRate;
  syncSliderLabels();
  world.events.push({ tick: world.tickCount, text: 'Mutation storm: cosmic radiation destabilises genomes.' });
  setTimeout(() => {
    world.params.mutationRate = prev;
    mutSlider.value = prev;
    syncSliderLabels();
  }, 14000);
});
document.getElementById('surgeBtn').addEventListener('click', () => {
  for (const v of world.food.vents) v.heat *= 1.8;
  world.events.push({ tick: world.tickCount, text: 'Hydrothermal vent surge: seabed erupts with mineral energy.' });
  setTimeout(() => {
    for (const v of world.food.vents) v.heat /= 1.8;
  }, 12000);
});
document.getElementById('advanceEraBtn').addEventListener('click', () => {
  world.tickCount += 1600;
  world.events.push({ tick: world.tickCount, text: 'Geological Era accelerated via observer controls!' });
});

// Neural Brain Controls
document.getElementById('resetBrainBtn').addEventListener('click', () => {
  if (selected && selected.alive) {
    selected.brain.reset();
    world.events.push({ tick: world.tickCount, text: `Cell #${selected.id}'s NEAT brain has been reset.` });
    renderBrainGraph();
  }
});
document.getElementById('pruneBrainBtn').addEventListener('click', () => {
  if (selected && selected.alive) {
    selected.brain.prune(0.15);
    world.events.push({ tick: world.tickCount, text: `Cell #${selected.id}'s weak synaptic connections were pruned.` });
    renderBrainGraph();
  }
});

// Phylogenetic Clade Tree Modal
const cladeModal = document.getElementById('cladeModal');
document.getElementById('cladeBtn').addEventListener('click', () => {
  renderCladeTree();
  cladeModal.style.display = 'flex';
});
document.getElementById('closeCladeModal').addEventListener('click', () => {
  cladeModal.style.display = 'none';
});

function renderCladeTree() {
  const container = document.getElementById('cladeGraph');
  const nodes = Array.from(world.cladeTree.values());
  nodes.sort((a, b) => b.count - a.count);

  if (nodes.length === 0) {
    container.innerHTML = '<p class="empty-note">No species recorded yet.</p>';
    return;
  }

  container.innerHTML = nodes.map(n => `
    <div class="clade-node" style="border-left-color: hsl(${n.hue.toFixed(0)},70%,55%)">
      <div>
        <strong>${n.name}</strong> <span style="color:var(--foam-dim); font-size:11px;">(Ancestor: ${n.parentName}, Originated t${n.originTick})</span>
      </div>
      <div>
        <span class="badge ${n.count > 0 ? 'phase3' : ''}">${n.count} alive</span>
      </div>
    </div>
  `).join('');
}

// Organism Click Selection
canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const px = (e.clientX - rect.left) * (canvas.width / rect.width);
  const py = (e.clientY - rect.top) * (canvas.height / rect.height);
  const [wx, wy] = screenToWorld(px, py);

  let best = null, bestD = 28 * 28;
  for (let i = 0; i < world.organisms.length; i++) {
    const o = world.organisms[i];
    const d2 = dist2(o.x, o.y, wx, wy);
    if (d2 < bestD) { bestD = d2; best = o; }
  }
  selected = best;
  renderInspector();
  renderBrainGraph();
});

// Inspector & Gene Editor Panel
const inspectorTitle = document.getElementById('inspectorTitle');
const inspectorBody = document.getElementById('inspectorBody');

function geneSliderHTML(key, value, idPrefix) {
  const [lo, hi] = GENE_RANGES[key];
  const step = (hi - lo) / 200;
  return `<div class="field">
    <label>${GENE_LABELS[key]} <span class="val" id="${idPrefix}_${key}_val">${value.toFixed(2)}</span></label>
    <input type="range" id="${idPrefix}_${key}" min="${lo}" max="${hi}" step="${step}" value="${value}">
  </div>`;
}

function defaultSpawnGenome() {
  return { size: 1, speed: 1, sense: 55, diet: 0.1, aggression: 0.15, colony: 0.2, membrane: 0.5, plasticity: 0.4, pheromoneRate: 0.2, toxinGene: 0.1, endoCapacity: 0.5, mutationRate: 0.1, hue: Math.random() * 360, speciesName: 'Phyto-morphic' };
}
let spawnGenome = defaultSpawnGenome();

function renderInspector() {
  if (!selected || !selected.alive) {
    inspectorTitle.textContent = 'Introduce a genome';
    inspectorBody.innerHTML = `
      <p class="empty-note">Design a cell by hand and release it into Phase 3 ocean. Click any cell to follow & inspect its NEAT brain.</p>
      ${Object.keys(GENE_RANGES).map(k => geneSliderHTML(k, spawnGenome[k], 'spawn')).join('')}
      <div class="field">
        <label>Lineage Hue <span class="val" id="spawn_hue_val">${spawnGenome.hue.toFixed(0)}</span></label>
        <input type="range" id="spawn_hue" min="0" max="360" step="1" value="${spawnGenome.hue}">
      </div>
      <div class="row-btns">
        <button class="btn primary" id="spawnAddBtn">Add to sea</button>
        <button class="btn" id="spawnRandomBtn">Randomise</button>
      </div>`;

    Object.keys(GENE_RANGES).forEach(k => {
      const el = document.getElementById('spawn_' + k);
      if (el) {
        el.addEventListener('input', (e) => {
          spawnGenome[k] = parseFloat(e.target.value);
          document.getElementById(`spawn_${k}_val`).textContent = spawnGenome[k].toFixed(2);
        });
      }
    });
    document.getElementById('spawn_hue').addEventListener('input', (e) => {
      spawnGenome.hue = parseFloat(e.target.value);
      document.getElementById('spawn_hue_val').textContent = spawnGenome.hue.toFixed(0);
    });
    document.getElementById('spawnAddBtn').addEventListener('click', () => {
      world.spawn(spawnGenome, undefined, undefined, 0.6);
      world.events.push({ tick: world.tickCount, text: 'A custom hand-designed organism is released into Phase 3 sea.' });
    });
    document.getElementById('spawnRandomBtn').addEventListener('click', () => {
      spawnGenome = defaultSpawnGenome();
      Object.assign(spawnGenome, randomGenome());
      renderInspector();
    });
    return;
  }

  const o = selected;
  inspectorTitle.innerHTML = `<span class="genome-swatch" style="background:hsl(${o.genome.hue.toFixed(0)},65%,58%)"></span>${o.genome.speciesName} #${o.id}`;
  const energyPct = Math.round((o.energy / o.maxEnergy) * 100);

  inspectorBody.innerHTML = `
    <div class="stat-grid" style="margin-bottom:12px;">
      <div class="k">Species</div><div class="v purple">${o.genome.speciesName}</div>
      <div class="k">Cell Morphotype</div><div class="v ember">${o.role}</div>
      <div class="k">Endosymbionts</div><div class="v cyan">${o.endosymbionts.join(', ') || 'None'}</div>
      <div class="k">NEAT Brain Nodes</div><div class="v">${o.brain.hiddenSize} Hidden</div>
      <div class="k">Energy</div><div class="v">${energyPct}%</div>
      <div class="k">Age</div><div class="v">${o.age} ticks</div>
      <div class="k">Generation</div><div class="v">${o.generation}</div>
      <div class="k">Offspring count</div><div class="v">${o.offspringCount}</div>
      <div class="k">Predatory Kills</div><div class="v">${o.kills}</div>
    </div>
    ${Object.keys(GENE_RANGES).map(k => geneSliderHTML(k, o.genome[k], 'sel')).join('')}
    <div class="field">
      <label>Lineage Hue <span class="val" id="sel_hue_val">${o.genome.hue.toFixed(0)}</span></label>
      <input type="range" id="sel_hue" min="0" max="360" step="1" value="${o.genome.hue}">
    </div>
    <div class="row-btns">
      <button class="btn primary" id="followCellBtn">${followMode ? 'Stop Following' : 'Follow Cell'}</button>
      <button class="btn" id="cloneBtn">Clone with mutation</button>
      <button class="btn warn" id="mateBtn">Mate partner</button>
      <button class="btn danger" id="removeBtn">Remove cell</button>
    </div>
    <p class="hint">Adjusting sliders edits this cell's traits live in Phase 3 ocean.</p>`;

  Object.keys(GENE_RANGES).forEach(k => {
    const el = document.getElementById('sel_' + k);
    if (el) {
      el.addEventListener('input', (e) => {
        o.genome[k] = parseFloat(e.target.value);
        document.getElementById(`sel_${k}_val`).textContent = o.genome[k].toFixed(2);
      });
    }
  });
  document.getElementById('sel_hue').addEventListener('input', (e) => {
    o.genome.hue = parseFloat(e.target.value);
    document.getElementById('sel_hue_val').textContent = o.genome.hue.toFixed(0);
  });

  document.getElementById('followCellBtn').addEventListener('click', () => {
    followMode = !followMode;
    followBtn.textContent = followMode ? 'Follow Cell: ON' : 'Follow Cell: OFF';
    if (followMode) followBtn.classList.add('active'); else followBtn.classList.remove('active');
    renderInspector();
  });

  document.getElementById('cloneBtn').addEventListener('click', () => {
    const child = world.spawn(mutateGenome(o.genome, world.params.mutationRate), o.x, o.y, 0.5, o.brain, o.id);
    world.events.push({ tick: world.tickCount, text: `Cell #${o.id} cloned with mutative variation.` });
  });

  document.getElementById('mateBtn').addEventListener('click', () => {
    const nearby = world.organisms.filter(other => other !== o && other.alive && dist2(o.x, o.y, other.x, other.y) < 120 * 120);
    if (nearby.length > 0) {
      const partner = nearby[0];
      const childGenome = crossoverGenome(o.genome, partner.genome, world.params.mutationRate);
      const childBrain = o.brain.crossover(partner.brain, world.params.mutationRate);
      world.spawn(childGenome, (o.x + partner.x) / 2, (o.y + partner.y) / 2, 0.55, childBrain, o.id);
      world.events.push({ tick: world.tickCount, text: `Cell #${o.id} & Cell #${partner.id} mated via sexual crossover.` });
    } else {
      world.events.push({ tick: world.tickCount, text: `No partner nearby to mate with Cell #${o.id}.` });
    }
  });

  document.getElementById('removeBtn').addEventListener('click', () => {
    o.alive = false;
    selected = null;
    renderInspector();
    renderBrainGraph();
  });
}
renderInspector();

// Intro Overlay dismiss
document.getElementById('beginBtn').addEventListener('click', () => {
  document.getElementById('introOverlay').remove();
});
