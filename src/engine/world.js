// ===== World Engine: Ecosystem Simulation, Spatial Hash, Colony Clustering & Selection =====

const { Organism } = require('./organism');
const { FoodGrid } = require('./environment');
const { mutateGenome, crossoverGenome, randomGenome, hueDiff, dist2, clamp } = require('./genome');

class SpatialHash {
  constructor(width, height, cellSize = 40) {
    this.cellSize = cellSize;
    this.cols = Math.ceil(width / cellSize);
    this.rows = Math.ceil(height / cellSize);
    this.buckets = new Map();
  }
  key(cx, cy) { return cx + ',' + cy; }

  clear() {
    this.buckets.clear();
  }

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
        if (arr) {
          for (let i = 0; i < arr.length; i++) result.push(arr[i]);
        }
      }
    }
    return result;
  }
}

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
      sexualRatio: 0.35, // probability of sexual crossover when compatible mates meet
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
    // All life emerges from a single ancestral lineage with subtle initial variation
    const ancestorGenome = {
      size: 0.85,
      speed: 0.9,
      sense: 50,
      diet: 0.05,
      aggression: 0.08,
      colony: 0.15,
      membrane: 0.5,
      plasticity: 0.4,
      mutationRate: 0.1,
      hue: Math.random() * 360,
    };

    for (let i = 0; i < count; i++) {
      const g = mutateGenome(ancestorGenome, 0.08);
      const x = Math.random() * this.width;
      const y = Math.random() * this.height;
      const org = new Organism(x, y, g, undefined, 1, undefined);
      this.organisms.push(org);
    }
  }

  spawn(genome, x, y, energyFrac, brain) {
    const g = genome ? Object.assign({}, genome) : randomGenome();
    const org = new Organism(
      x !== undefined ? x : Math.random() * this.width,
      y !== undefined ? y : Math.random() * this.height,
      g,
      undefined,
      1,
      undefined,
      brain
    );
    if (energyFrac !== undefined) org.energy = org.maxEnergy * energyFrac;
    this.organisms.push(org);
    return org;
  }

  massExtinction(fraction = 0.75) {
    for (const o of this.organisms) {
      if (Math.random() < fraction) o.alive = false;
    }
  }

  tick() {
    const W = this.width, H = this.height;
    const p = this.params;

    // 1. Grow nutrients & diffuse food grid
    this.food.grow(p.foodGrowth);

    // 2. Spatial Hash Indexing
    const hash = new SpatialHash(W, H, 40);
    const alive = [];
    for (let i = 0; i < this.organisms.length; i++) {
      const o = this.organisms[i];
      if (o.alive) {
        alive.push(o);
        hash.insert(o);
      }
    }

    // 3. Colony grouping & Multicellular Union-Find
    const parent = new Map();
    const find = (o) => {
      let r = o;
      while (parent.get(r) && parent.get(r) !== r) r = parent.get(r);
      return r;
    };
    const union = (a, b) => {
      const ra = find(a), rb = find(b);
      if (ra !== rb) parent.set(ra, rb);
    };

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
        m.centroidX = cx;
        m.centroidY = cy;

        if (arr.length > 1) {
          const othersSize = sizeSum - m.genome.size;
          m.colonySize = 1 + Math.min(2.4, 0.45 * othersSize / m.genome.size);
        } else {
          m.colonySize = 1;
        }
        // Update specialized multicellular cell role
        m.updateRole(arr);
      }
    }

    // 4. Creature physical & neural updates
    for (let i = 0; i < alive.length; i++) {
      alive[i].step(this.food, hash, W, H, p.tempFactor);
    }

    // 5. Reproduction & Natural Selection
    const newborns = [];
    for (let i = 0; i < alive.length; i++) {
      const o = alive[i];
      if (!o.alive) continue;

      // Death check
      if (o.energy <= 0 || o.age > o.lifespan) {
        o.alive = false;
        this.food.deposit(o.x, o.y, 0.12 * o.genome.size);
        continue;
      }

      // Reproduction check
      if (o.energy >= o.reproduceThreshold && o.reproCooldown <= 0 && (alive.length + newborns.length) < p.maxPopulation) {
        let childGenome, childBrain;
        let isSexual = false;

        // Check for sexual mating partner nearby
        if (Math.random() < p.sexualRatio) {
          const neighbors = hash.query(o.x, o.y, 24);
          for (let j = 0; j < neighbors.length; j++) {
            const partner = neighbors[j];
            if (partner === o || !partner.alive || partner.reproCooldown > 0) continue;
            if (partner.energy >= partner.reproduceThreshold * 0.75) {
              if (hueDiff(o.genome.hue, partner.genome.hue) < 35) {
                // Sexual crossover!
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

        // Fallback to asexual mitosis
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
          childGenome,
          energyAlloc,
          o.generation + 1,
          o.lineageId,
          childBrain
        );

        newborns.push(child);
        o.offspringCount++;
      }
    }

    // Filter alive organisms and append newborns
    this.organisms = alive.filter(o => o.alive).concat(newborns);
    this.tickCount++;

    // Safety Abiogenesis: If extinction occurs, seed fresh life after pause
    if (this.organisms.length === 0) {
      this._extinctFor++;
      if (this._extinctFor > 80) {
        this.seed(30);
        this.events.push({ tick: this.tickCount, text: 'A fresh spark of abiogenesis ignites in the hydrothermal vents.' });
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

if (typeof module !== 'undefined') {
  module.exports = { World, SpatialHash };
}
