// ===== Client Observer App: Simulation Renderer & Interactive Dashboard =====

// =====================================================================
// SIMULATION ENGINE (Client Bundle)
// =====================================================================

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
function dist2(ax, ay, bx, by) { const dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; }
function hueDiff(a, b) { let d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; }

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
    if (Math.random() < 0.05) delta *= 3.5;
    g[k] = clamp(g[k] + delta, lo, hi);
  }
  g.hue = (g.hue + gaussian() * rate * 35 + 360) % 360;
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
  return mutateGenome(child, effectiveMutRate);
}

// Neural Network Brain
class NeuralNetwork {
  constructor(inputSize = 8, hiddenSize = 6, outputSize = 4) {
    this.inputSize = inputSize;
    this.hiddenSize = hiddenSize;
    this.outputSize = outputSize;

    this.W1 = new Float32Array(hiddenSize * inputSize);
    this.B1 = new Float32Array(hiddenSize);
    this.W2 = new Float32Array(outputSize * hiddenSize);
    this.B2 = new Float32Array(outputSize);

    this.inputs = new Float32Array(inputSize);
    this.hidden = new Float32Array(hiddenSize);
    this.outputs = new Float32Array(outputSize);

    this.randomize();
  }

  randomize(scale = 0.85) {
    for (let i = 0; i < this.W1.length; i++) this.W1[i] = gaussian() * scale;
    for (let i = 0; i < this.B1.length; i++) this.B1[i] = gaussian() * 0.2;
    for (let i = 0; i < this.W2.length; i++) this.W2[i] = gaussian() * scale;
    for (let i = 0; i < this.B2.length; i++) this.B2[i] = gaussian() * 0.2;
  }

  forward(inputArray) {
    for (let i = 0; i < this.inputSize; i++) this.inputs[i] = inputArray[i] || 0;

    for (let h = 0; h < this.hiddenSize; h++) {
      let sum = this.B1[h];
      const rowOffset = h * this.inputSize;
      for (let i = 0; i < this.inputSize; i++) sum += this.W1[rowOffset + i] * this.inputs[i];
      this.hidden[h] = Math.tanh(sum);
    }

    for (let o = 0; o < this.outputSize; o++) {
      let sum = this.B2[o];
      const rowOffset = o * this.hiddenSize;
      for (let h = 0; h < this.hiddenSize; h++) sum += this.W2[rowOffset + h] * this.hidden[h];
      this.outputs[o] = o < 2 ? Math.tanh(sum) : (1 / (1 + Math.exp(-sum)));
    }
    return this.outputs;
  }

  mutate(rate = 0.1) {
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
      const rowOffset = o * this.hiddenSize;
      const oAct = this.outputs[o];
      for (let h = 0; h < this.hiddenSize; h++) {
        this.W2[rowOffset + h] = clamp(this.W2[rowOffset + h] + lr * oAct * this.hidden[h], -3.5, 3.5);
      }
    }
  }

  crossover(otherBrain, mutRate = 0.1) {
    const child = new NeuralNetwork(this.inputSize, this.hiddenSize, this.outputSize);
    for (let i = 0; i < this.W1.length; i++) child.W1[i] = Math.random() < 0.5 ? this.W1[i] : otherBrain.W1[i];
    for (let i = 0; i < this.B1.length; i++) child.B1[i] = Math.random() < 0.5 ? this.B1[i] : otherBrain.B1[i];
    for (let i = 0; i < this.W2.length; i++) child.W2[i] = Math.random() < 0.5 ? this.W2[i] : otherBrain.W2[i];
    for (let i = 0; i < this.B2.length; i++) child.B2[i] = Math.random() < 0.5 ? this.B2[i] : otherBrain.B2[i];
    child.mutate(mutRate);
    return child;
  }

  clone() {
    const n = new NeuralNetwork(this.inputSize, this.hiddenSize, this.outputSize);
    n.W1.set(this.W1); n.B1.set(this.B1); n.W2.set(this.W2); n.B2.set(this.B2);
    return n;
  }
  reset() { this.randomize(0.9); }
  prune(threshold = 0.08) {
    for (let i = 0; i < this.W1.length; i++) if (Math.abs(this.W1[i]) < threshold) this.W1[i] = 0;
    for (let i = 0; i < this.W2.length; i++) if (Math.abs(this.W2[i]) < threshold) this.W2[i] = 0;
  }
}

// Food Grid
class FoodGrid {
  constructor(width, height, cellSize = 20) {
    this.cellSize = cellSize;
    this.cols = Math.ceil(width / cellSize);
    this.rows = Math.ceil(height / cellSize);
    this.density = new Float32Array(this.cols * this.rows);
    this.vents = [];
    for (let i = 0; i < this.density.length; i++) this.density[i] = 0.16 + Math.random() * 0.24;
    const ventCount = 5;
    for (let i = 0; i < ventCount; i++) {
      this.vents.push({
        cx: Math.floor(Math.random() * this.cols),
        cy: Math.floor((0.55 + Math.random() * 0.4) * this.rows),
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
  lightFactor(cy) { return 0.3 + 0.7 * (1 - cy / this.rows); }
  grow(growthRate = 0.011) {
    const { cols, rows, density } = this;
    for (let cy = 0; cy < rows; cy++) {
      const light = this.lightFactor(cy);
      const rowBase = cy * cols;
      for (let cx = 0; cx < cols; cx++) {
        const i = rowBase + cx;
        const d = density[i];
        density[i] = clamp(d + growthRate * light * d * (1 - d) + growthRate * 0.022 * light, 0, 1);
      }
    }
    for (const vent of this.vents) {
      for (let dy = -vent.r; dy <= vent.r; dy++) {
        for (let dx = -vent.r; dx <= vent.r; dx++) {
          const cx = vent.cx + dx, cy = vent.cy + dy;
          if (cx < 0 || cy < 0 || cx >= cols || cy >= rows) continue;
          if (dx * dx + dy * dy > vent.r * vent.r) continue;
          const i = this.idx(cx, cy);
          if (density[i] < 0.65) density[i] = Math.min(0.65, density[i] + 0.035 * vent.heat);
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

// Organism
let ORG_ID_COUNTER = 1;
class Organism {
  constructor(x, y, genome, energy, generation, lineageId, brain) {
    this.id = ORG_ID_COUNTER++;
    this.x = x; this.y = y;
    this.vx = 0; this.vy = 0;
    this.genome = genome;
    this.maxEnergy = 40 + genome.size * 60;
    this.energy = energy !== undefined ? energy : this.maxEnergy * 0.55;
    this.age = 0;
    this.generation = generation || 1;
    this.lineageId = lineageId || this.id;
    this.reproCooldown = 0;
    this.alive = true;

    this.brain = brain ? brain.clone() : new NeuralNetwork(8, 6, 4);

    this.colonySize = 1;
    this.colonyMemberCount = 1;
    this.colonyGroupId = 0;
    this.centroidX = x; this.centroidY = y;
    this.role = 'unicellular';

    this.kills = 0;
    this.offspringCount = 0;
    this._wanderAngle = Math.random() * Math.PI * 2;
  }

  get maxSpeed() { return clamp(this.genome.speed / Math.sqrt(this.genome.size), 0.2, 3.4); }
  get eatRate() {
    let rate = 0.016 + this.genome.size * 0.012;
    if (this.role === 'feeder') rate *= 1.4;
    return rate;
  }
  get metabolismBase() {
    let base = 0.01 + Math.pow(this.genome.size, 1.65) * 0.013;
    base *= (1.1 - this.genome.membrane * 0.25);
    if (this.role === 'reproducer') base *= 0.85;
    return base;
  }
  get lifespan() { return 520 + this.genome.size * 280; }
  get reproduceThreshold() {
    let factor = 0.72;
    if (this.role === 'reproducer') factor = 0.58;
    return this.maxEnergy * factor;
  }
  get captureRadius() { return 3.8 + this.genome.size * 3.4; }
  get effectiveSize() { return this.genome.size * this.colonySize; }

  updateRole(clusterMembers) {
    if (!clusterMembers || clusterMembers.length < 2) { this.role = 'unicellular'; return; }
    const dToCenter = Math.sqrt(dist2(this.x, this.y, this.centroidX, this.centroidY));
    const g = this.genome;
    if (dToCenter < 12 && g.colony > 0.5) this.role = 'reproducer';
    else if (g.aggression > 0.4 || g.diet > 0.35) this.role = 'defender';
    else if (g.speed > 1.4) this.role = 'navigator';
    else this.role = 'feeder';
  }

  perceive(foodGrid, spatialHash, W, H) {
    const senseR = this.genome.sense;
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

    const energyRatio = clamp(this.energy / this.maxEnergy, 0, 1);

    return [foodDx, foodDy, preyDx, preyDy, threatDx, threatDy, kinDx, kinDy];
  }

  step(foodGrid, spatialHash, W, H, tempFactor = 1.0) {
    if (!this.alive) return;

    const inputs = this.perceive(foodGrid, spatialHash, W, H);
    const outputs = this.brain.forward(inputs);

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

    this.x = (this.x + this.vx + W) % W;
    this.y = (this.y + this.vy + H) % H;

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
            const selfPower = this.genome.aggression * 0.4 + (this.effectiveSize - other.effectiveSize) * 0.06;
            const defenderPower = other.genome.membrane * 0.35 + other.genome.aggression * 0.15;
            const successP = clamp(0.44 + selfPower - defenderPower, 0.08, 0.92);

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
      foodCoverage: 0, maxGeneration: 1
    };
    this.history = [];
    this._extinctFor = 0;
  }

  seed(count = 60) {
    const ancestorGenome = {
      size: 0.85, speed: 0.9, sense: 50, diet: 0.05,
      aggression: 0.08, colony: 0.15, membrane: 0.5,
      plasticity: 0.4, mutationRate: 0.1, hue: Math.random() * 360,
    };

    for (let i = 0; i < count; i++) {
      const g = mutateGenome(ancestorGenome, 0.08);
      const x = Math.random() * this.width;
      const y = Math.random() * this.height;
      this.organisms.push(new Organism(x, y, g, undefined, 1, undefined));
    }
  }

  spawn(genome, x, y, energyFrac, brain) {
    const g = genome ? Object.assign({}, genome) : randomGenome();
    const org = new Organism(
      x !== undefined ? x : Math.random() * this.width,
      y !== undefined ? y : Math.random() * this.height,
      g, undefined, 1, undefined, brain
    );
    if (energyFrac !== undefined) org.energy = org.maxEnergy * energyFrac;
    this.organisms.push(org);
    return org;
  }

  massExtinction(fraction = 0.75) {
    for (const o of this.organisms) if (Math.random() < fraction) o.alive = false;
  }

  tick() {
    const W = this.width, H = this.height;
    const p = this.params;

    this.food.grow(p.foodGrowth);

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

        const energyAlloc = o.energy * 0.45;
        o.energy *= 0.52;
        o.reproCooldown = 50 + Math.floor(o.genome.size * 18);

        const angle = Math.random() * Math.PI * 2;
        const child = new Organism(
          (o.x + Math.cos(angle) * 8 + W) % W,
          (o.y + Math.sin(angle) * 8 + H) % H,
          childGenome, energyAlloc, o.generation + 1, o.lineageId, childBrain
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
    }
  }

  _updateStats() {
    const orgs = this.organisms;
    const s = this.stats;
    s.population = orgs.length;

    if (orgs.length === 0) {
      s.species = 0; s.colonies = 0; s.multicellular = 0;
      s.avgSize = 0; s.avgSpeed = 0; s.herbivores = 0; s.carnivores = 0;
      s.foodCoverage = this.food.coverage();
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

      if (o.colonyMemberCount > 1 && !seenGroups.has(o.colonyGroupId)) {
        seenGroups.add(o.colonyGroupId);
        colonies++;
        if (o.colonyMemberCount >= this.MULTICELLULAR_THRESHOLD) multicell++;
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
  }
}


// =====================================================================
// UI & CANVAS RENDERER LAYER
// =====================================================================

const canvas = document.getElementById('sea');
const ctx = canvas.getContext('2d');
const stage = document.getElementById('stage');
const popChart = document.getElementById('popChart');
const popCtx = popChart.getContext('2d');
const brainCanvas = document.getElementById('brainCanvas');
const brainCtx = brainCanvas.getContext('2d');

const world = new World({ width: 1000, height: 650 });
world.seed(60);

let paused = false;
let ticksPerFrame = 1;
let selected = null;

// Camera view transform (zoom & pan)
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

// Camera Mouse & Wheel Controls
stage.addEventListener('mousedown', (e) => {
  if (e.target !== canvas) return;
  isDragging = true;
  dragStart = { x: e.clientX, y: e.clientY };
});

stage.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  const m = getMapping();
  const dx = (e.clientX - dragStart.x) * (canvas.width / stage.clientWidth) / m.scale;
  const dy = (e.clientY - dragStart.y) * (canvas.height / stage.clientHeight) / m.scale;
  camera.x -= dx;
  camera.y -= dy;
  dragStart = { x: e.clientX, y: e.clientY };
});

stage.addEventListener('mouseup', () => { isDragging = false; });
stage.addEventListener('mouseleave', () => { isDragging = false; });

stage.addEventListener('wheel', (e) => {
  e.preventDefault();
  const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
  camera.zoom = clamp(camera.zoom * zoomFactor, 0.4, 4.5);
}, { passive: false });

document.getElementById('resetCamBtn').addEventListener('click', () => {
  camera = { x: world.width / 2, y: world.height / 2, zoom: 1.0 };
});

// Render Main Sea Canvas
function render() {
  const m = getMapping();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#111915';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(m.offX, m.offY);
  ctx.scale(m.scale, m.scale);

  // Background water gradient
  const grad = ctx.createRadialGradient(
    world.width * 0.5, world.height * 0.2, 40,
    world.width * 0.5, world.height * 0.65, world.width * 0.8
  );
  grad.addColorStop(0, '#24372b');
  grad.addColorStop(1, '#131e17');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, world.width, world.height);

  // Hydrothermal Vents
  for (let i = 0; i < world.food.vents.length; i++) {
    const v = world.food.vents[i];
    const vx = (v.cx + 0.5) * world.food.cellSize;
    const vy = (v.cy + 0.5) * world.food.cellSize;
    const pulse = 1.0 + Math.sin(world.tickCount * 0.08 + i) * 0.12;
    const r = v.r * world.food.cellSize * 1.8 * pulse;

    const g = ctx.createRadialGradient(vx, vy, 0, vx, vy, r);
    g.addColorStop(0, 'rgba(226,98,43,0.22)');
    g.addColorStop(0.6, 'rgba(226,98,43,0.08)');
    g.addColorStop(1, 'rgba(226,98,43,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(vx, vy, r, 0, Math.PI * 2); ctx.fill();
  }

  // Food Grid Density
  const cs = world.food.cellSize;
  const dens = world.food.density;
  for (let cy = 0; cy < world.food.rows; cy++) {
    for (let cx = 0; cx < world.food.cols; cx++) {
      const d = dens[cy * world.food.cols + cx];
      if (d < 0.05) continue;
      const alpha = Math.min(0.6, d * 0.6);
      ctx.fillStyle = `rgba(140,185,85,${alpha})`;
      ctx.fillRect(cx * cs, cy * cs, cs + 0.5, cs + 0.5);
    }
  }

  // Connective colony filaments
  ctx.lineWidth = 1;
  for (let i = 0; i < world.organisms.length; i++) {
    const o = world.organisms[i];
    if (o.colonyMemberCount > 1) {
      ctx.strokeStyle = 'rgba(226,98,43,0.38)';
      ctx.beginPath();
      ctx.moveTo(o.x, o.y);
      ctx.lineTo(o.centroidX, o.centroidY);
      ctx.stroke();
    }
  }

  // Multicellular glowing halos
  const haloSeen = new Set();
  for (let i = 0; i < world.organisms.length; i++) {
    const o = world.organisms[i];
    if (o.colonyMemberCount >= world.MULTICELLULAR_THRESHOLD && !haloSeen.has(o.colonyGroupId)) {
      haloSeen.add(o.colonyGroupId);
      const r = 12 + o.colonyMemberCount * 3.4;
      const g = ctx.createRadialGradient(o.centroidX, o.centroidY, 0, o.centroidX, o.centroidY, r);
      g.addColorStop(0, 'rgba(226,98,43,0.25)');
      g.addColorStop(1, 'rgba(226,98,43,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(o.centroidX, o.centroidY, r, 0, Math.PI * 2); ctx.fill();
    }
  }

  // Organisms with tentacles & cilia
  for (let i = 0; i < world.organisms.length; i++) {
    const o = world.organisms[i];
    const r = 2.2 + o.genome.size * 2.3;
    const light = 42 + o.genome.diet * 12;
    const sat = 55 + o.genome.colony * 20;

    // Tentacles / cilia based on speed
    if (o.genome.speed > 1.1) {
      const cCount = Math.floor(4 + o.genome.speed * 3);
      ctx.strokeStyle = `hsla(${o.genome.hue.toFixed(0)},${sat}%,${light}%,0.45)`;
      ctx.lineWidth = 0.8;
      for (let c = 0; c < cCount; c++) {
        const angle = (c / cCount) * Math.PI * 2 + world.tickCount * 0.15;
        const tx = o.x + Math.cos(angle) * (r + 3.5);
        const ty = o.y + Math.sin(angle) * (r + 3.5);
        ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(tx, ty); ctx.stroke();
      }
    }

    // Cell Body
    ctx.beginPath();
    ctx.arc(o.x, o.y, r, 0, Math.PI * 2);
    ctx.fillStyle = `hsl(${o.genome.hue.toFixed(0)},${sat}%,${light + 18}%)`;
    ctx.fill();

    // Predator outline
    if (o.genome.diet > 0.3) {
      ctx.lineWidth = 0.9;
      ctx.strokeStyle = 'rgba(193,68,58,0.85)';
      ctx.stroke();
    }

    // Selection ring & sense radius
    if (o === selected) {
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = '#f2f0e6';
      ctx.beginPath(); ctx.arc(o.x, o.y, r + 3, 0, Math.PI * 2); ctx.stroke();

      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = 'rgba(226,98,43,0.55)';
      ctx.beginPath(); ctx.arc(o.x, o.y, o.genome.sense, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  ctx.restore();
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
  popCtx.strokeStyle = '#e2622b';
  popCtx.lineWidth = 1.4;
  popCtx.stroke();
}

// Render Neural Network Brain Diagram
function renderBrainGraph() {
  const w = brainCanvas.width, h = brainCanvas.height;
  brainCtx.clearRect(0, 0, w, h);

  if (!selected || !selected.alive) {
    document.getElementById('brainTargetLabel').textContent = 'No cell selected';
    document.getElementById('brainActions').style.display = 'none';
    brainCtx.fillStyle = '#8b9488';
    brainCtx.font = '11px ui-monospace, monospace';
    brainCtx.textAlign = 'center';
    brainCtx.fillText('Click any cell in the sea to inspect its brain', w / 2, h / 2);
    return;
  }

  document.getElementById('brainTargetLabel').textContent = `Cell #${selected.id}`;
  document.getElementById('brainActions').style.display = 'block';

  const brain = selected.brain;
  const inputs = brain.inputs;
  const hidden = brain.hidden;
  const outputs = brain.outputs;

  const inputLabels = ['F.dx', 'F.dy', 'P.dx', 'P.dy', 'T.dx', 'T.dy', 'K.dx', 'NRG'];
  const outputLabels = ['MovX', 'MovY', 'Atk', 'Col'];

  // Node Positions
  const layerX = [35, w / 2, w - 40];
  const inputY = [];
  const hiddenY = [];
  const outputY = [];

  for (let i = 0; i < 8; i++) inputY.push(16 + i * 17);
  for (let hIndex = 0; hIndex < 6; hIndex++) hiddenY.push(26 + hIndex * 21);
  for (let o = 0; o < 4; o++) outputY.push(32 + o * 30);

  // Draw Synaptic Connections W1 (Input -> Hidden)
  for (let hIndex = 0; hIndex < 6; hIndex++) {
    const rowOffset = hIndex * 8;
    for (let i = 0; i < 8; i++) {
      const weight = brain.W1[rowOffset + i];
      if (Math.abs(weight) < 0.05) continue;
      const alpha = clamp(Math.abs(weight) / 2.5, 0.12, 0.85);
      brainCtx.strokeStyle = weight > 0 ? `rgba(60,174,163,${alpha})` : `rgba(226,98,43,${alpha})`;
      brainCtx.lineWidth = clamp(Math.abs(weight) * 1.2, 0.5, 2.5);
      brainCtx.beginPath();
      brainCtx.moveTo(layerX[0], inputY[i]);
      brainCtx.lineTo(layerX[1], hiddenY[hIndex]);
      brainCtx.stroke();
    }
  }

  // Draw Synaptic Connections W2 (Hidden -> Output)
  for (let o = 0; o < 4; o++) {
    const rowOffset = o * 6;
    for (let hIndex = 0; hIndex < 6; hIndex++) {
      const weight = brain.W2[rowOffset + hIndex];
      if (Math.abs(weight) < 0.05) continue;
      const alpha = clamp(Math.abs(weight) / 2.5, 0.12, 0.85);
      brainCtx.strokeStyle = weight > 0 ? `rgba(60,174,163,${alpha})` : `rgba(226,98,43,${alpha})`;
      brainCtx.lineWidth = clamp(Math.abs(weight) * 1.2, 0.5, 2.5);
      brainCtx.beginPath();
      brainCtx.moveTo(layerX[1], hiddenY[hIndex]);
      brainCtx.lineTo(layerX[2], outputY[o]);
      brainCtx.stroke();
    }
  }

  // Draw Input Neurons
  for (let i = 0; i < 8; i++) {
    const act = inputs[i] || 0;
    brainCtx.fillStyle = `rgba(60,174,163,${0.3 + Math.abs(act) * 0.7})`;
    brainCtx.beginPath(); brainCtx.arc(layerX[0], inputY[i], 4, 0, Math.PI * 2); brainCtx.fill();
    brainCtx.fillStyle = '#8b9488';
    brainCtx.font = '9px ui-monospace, monospace';
    brainCtx.textAlign = 'right';
    brainCtx.fillText(inputLabels[i], layerX[0] - 6, inputY[i] + 3);
  }

  // Draw Hidden Neurons
  for (let hIndex = 0; hIndex < 6; hIndex++) {
    const act = hidden[hIndex] || 0;
    brainCtx.fillStyle = `rgba(222,227,214,${0.3 + Math.abs(act) * 0.7})`;
    brainCtx.beginPath(); brainCtx.arc(layerX[1], hiddenY[hIndex], 5, 0, Math.PI * 2); brainCtx.fill();
  }

  // Draw Output Neurons
  for (let o = 0; o < 4; o++) {
    const act = outputs[o] || 0;
    brainCtx.fillStyle = `rgba(226,98,43,${0.3 + Math.abs(act) * 0.7})`;
    brainCtx.beginPath(); brainCtx.arc(layerX[2], outputY[o], 5, 0, Math.PI * 2); brainCtx.fill();
    brainCtx.fillStyle = '#dee3d6';
    brainCtx.font = '9px ui-monospace, monospace';
    brainCtx.textAlign = 'left';
    brainCtx.fillText(outputLabels[o], layerX[2] + 7, outputY[o] + 3);
  }
}

// Render Stats & Telemetry Panel
const statGrid = document.getElementById('statGrid');
function renderStats() {
  const s = world.stats;
  const rows = [
    ['Population', s.population],
    ['Distinct Lineages', s.species],
    ['Colonies', s.colonies],
    ['Multicellular Organisms', s.multicellular, s.multicellular > 0 ? 'ember' : ''],
    ['Grazers / Hunters', `${s.herbivores} / ${s.carnivores}`],
    ['Avg Size Gene', s.avgSize.toFixed(2)],
    ['Avg Speed Gene', s.avgSpeed.toFixed(2)],
    ['Nutrient Soup Coverage', (s.foodCoverage * 100).toFixed(1) + '%'],
    ['Deepest Generation', s.maxGeneration || 1, 'cyan'],
  ];
  statGrid.innerHTML = rows.map(r => `<div class="k">${r[0]}</div><div class="v ${r[2] || ''}">${r[1]}</div>`).join('');
  document.getElementById('dayLabel').textContent = `Day ${Math.floor(world.tickCount / 60)} · Tick ${world.tickCount} · Gen ${s.maxGeneration || 1}`;
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

// Main Animation Loop
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

// Disaster Buttons
document.getElementById('extinctionBtn').addEventListener('click', () => {
  world.massExtinction(0.75);
  world.events.push({ tick: world.tickCount, text: 'Mass extinction: three out of four cells perish.' });
});
document.getElementById('bloomBtn').addEventListener('click', () => {
  for (let i = 0; i < world.food.density.length; i++) world.food.density[i] = Math.min(1, world.food.density[i] + 0.45);
  world.events.push({ tick: world.tickCount, text: 'Nutrient bloom: organic soup surges across the ocean floor.' });
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
  world.events.push({ tick: world.tickCount, text: 'Hydrothermal vent surge: deep seabed erupts with mineral energy.' });
  setTimeout(() => {
    for (const v of world.food.vents) v.heat /= 1.8;
  }, 12000);
});

// Neural Brain Reset & Pruning Buttons
document.getElementById('resetBrainBtn').addEventListener('click', () => {
  if (selected && selected.alive) {
    selected.brain.reset();
    world.events.push({ tick: world.tickCount, text: `Cell #${selected.id}'s neural network brain has been reset.` });
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
  return { size: 1, speed: 1, sense: 55, diet: 0.1, aggression: 0.15, colony: 0.2, membrane: 0.5, plasticity: 0.4, mutationRate: 0.1, hue: Math.random() * 360 };
}
let spawnGenome = defaultSpawnGenome();

function renderInspector() {
  if (!selected || !selected.alive) {
    inspectorTitle.textContent = 'Introduce a genome';
    inspectorBody.innerHTML = `
      <p class="empty-note">Design a cell by hand and release it into the ocean. Click any living cell in the water to inspect its brain & edit its genes.</p>
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
      world.events.push({ tick: world.tickCount, text: 'A custom hand-designed organism is released into the sea.' });
    });
    document.getElementById('spawnRandomBtn').addEventListener('click', () => {
      spawnGenome = defaultSpawnGenome();
      Object.assign(spawnGenome, randomGenome());
      renderInspector();
    });
    return;
  }

  const o = selected;
  inspectorTitle.innerHTML = `<span class="genome-swatch" style="background:hsl(${o.genome.hue.toFixed(0)},65%,58%)"></span>Cell #${o.id} (${o.role})`;
  const energyPct = Math.round((o.energy / o.maxEnergy) * 100);

  inspectorBody.innerHTML = `
    <div class="stat-grid" style="margin-bottom:12px;">
      <div class="k">Energy</div><div class="v">${energyPct}%</div>
      <div class="k">Age</div><div class="v">${o.age} ticks</div>
      <div class="k">Generation</div><div class="v">${o.generation}</div>
      <div class="k">Offspring count</div><div class="v">${o.offspringCount}</div>
      <div class="k">Predatory Kills</div><div class="v">${o.kills}</div>
      <div class="k">Colony members</div><div class="v">${o.colonyMemberCount}</div>
      <div class="k">Cell Role</div><div class="v ember">${o.role}</div>
    </div>
    ${Object.keys(GENE_RANGES).map(k => geneSliderHTML(k, o.genome[k], 'sel')).join('')}
    <div class="field">
      <label>Lineage Hue <span class="val" id="sel_hue_val">${o.genome.hue.toFixed(0)}</span></label>
      <input type="range" id="sel_hue" min="0" max="360" step="1" value="${o.genome.hue}">
    </div>
    <div class="row-btns">
      <button class="btn" id="cloneBtn">Clone with mutation</button>
      <button class="btn warn" id="mateBtn">Mate with partner</button>
      <button class="btn danger" id="removeBtn">Remove cell</button>
    </div>
    <p class="hint">Adjusting sliders edits this cell's traits live in the ocean.</p>`;

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
  document.getElementById('cloneBtn').addEventListener('click', () => {
    const child = world.spawn(mutateGenome(o.genome, world.params.mutationRate), o.x, o.y, 0.5, o.brain);
    world.events.push({ tick: world.tickCount, text: `Cell #${o.id} cloned with mutative variation.` });
  });
  document.getElementById('mateBtn').addEventListener('click', () => {
    const nearby = world.organisms.filter(other => other !== o && other.alive && dist2(o.x, o.y, other.x, other.y) < 120 * 120);
    if (nearby.length > 0) {
      const partner = nearby[0];
      const childGenome = crossoverGenome(o.genome, partner.genome, world.params.mutationRate);
      const childBrain = o.brain.crossover(partner.brain, world.params.mutationRate);
      world.spawn(childGenome, (o.x + partner.x) / 2, (o.y + partner.y) / 2, 0.55, childBrain);
      world.events.push({ tick: world.tickCount, text: `Cell #${o.id} & Cell #${partner.id} mated via sexual crossover.` });
    } else {
      world.events.push({ tick: world.tickCount, text: `No compatible partner nearby to mate with Cell #${o.id}.` });
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
