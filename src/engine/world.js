// ===== Primordial V4 World Engine: Sprawling Continents, Amphibious Clades & Ecosystem Naturalist =====

const { Organism } = require('./organism');
const { FoodGrid } = require('./environment');
const { TerrainGrid, TERRAIN_TYPES } = require('./terrain');
const { mutateGenome, crossoverGenome, randomGenome, generateSpeciesName, hueDiff, dist2, clamp } = require('./genome');

class SpatialHash {
  constructor(width, height, cellSize = 60) {
    this.cellSize = cellSize;
    this.cols = Math.ceil(width / cellSize);
    this.rows = Math.ceil(height / cellSize);
    this.buckets = new Map();
  }
  key(cx, cy) { return cx + ',' + cy; }

  clear() { this.buckets.clear(); }

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
    this.width = opts.width || 4000;
    this.height = opts.height || 3000;
    this.terrain = opts.terrain || new TerrainGrid(this.width, this.height, 40);
    this.food = new FoodGrid(this.width, this.height, opts.foodCell || 40, this.terrain);
    this.organisms = [];
    this.tickCount = 0;
    this.MULTICELLULAR_THRESHOLD = 7;

    this.cladeTree = new Map();
    this.fossilRecord = [];

    this.params = Object.assign({
      foodGrowth: 0.012,
      mutationRate: 0.1,
      tempFactor: 1.0,
      maxPopulation: 450,
      sexualRatio: 0.35,
    }, opts.params || {});

    this.events = [];
    this.stats = {
      population: 0, species: 0, colonies: 0, multicellular: 0,
      terrestrial: 0, amphibious: 0, avgMoisture: 100,
      avgSize: 0, avgSpeed: 0, herbivores: 0, carnivores: 0,
      foodCoverage: 0, maxGeneration: 1, topSpecies: 'None',
      era: 'Hadean Volcanic', o2: '5%', co2: '85%'
    };
    this.history = [];
    this._extinctFor = 0;
    this._lastNaturalistReport = 0;
    this._firstLandfall = false;
    this._firstGlacial = false;
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

  seed(count = 70) {
    const ancestorGenome = {
      size: 0.85, speed: 0.9, sense: 55, diet: 0.05,
      aggression: 0.08, colony: 0.15, membrane: 0.5,
      plasticity: 0.45, pheromoneRate: 0.2, toxinGene: 0.1, endoCapacity: 0.5,
      moistureRetention: 0.15, locomotionType: 0.12, thermalTolerance: 0.4,
      visionFov: 120, visionRange: 90,
      mutationRate: 0.1, hue: Math.random() * 360,
    };
    ancestorGenome.speciesName = generateSpeciesName(ancestorGenome);
    this.registerSpecies(ancestorGenome.speciesName, 'Abiogenesis', ancestorGenome.hue);

    // Seed in oceanic or coastal zones
    for (let i = 0; i < count; i++) {
      const g = mutateGenome(ancestorGenome, 0.08);
      this.registerSpecies(g.speciesName, ancestorGenome.speciesName, g.hue);

      // Find an aquatic or shallow location
      let x = Math.random() * this.width;
      let y = Math.random() * this.height;
      for (let attempt = 0; attempt < 15; attempt++) {
        const mat = this.terrain.getMaterial(x, y);
        if (mat === TERRAIN_TYPES.WATER_DEEP || mat === TERRAIN_TYPES.WATER_SHALLOW || mat === TERRAIN_TYPES.MUD) {
          break;
        }
        x = Math.random() * this.width;
        y = Math.random() * this.height;
      }

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

  // AI Automated Ecosystem Naturalist Report
  generateNaturalistReport() {
    if (this.tickCount - this._lastNaturalistReport < 350) return;
    this._lastNaturalistReport = this.tickCount;

    const s = this.stats;
    const era = this.food.currentEra;
    let reportText = '';

    if (!this._firstLandfall && s.terrestrial > 2) {
      this._firstLandfall = true;
      reportText = `[AI Naturalist] Major Evolutionary Leap: First amphibious creatures colonize the continental shores!`;
    } else if (!this._firstGlacial && s.population > 20) {
      const coldDwellers = this.organisms.filter(o => this.terrain.getMaterial(o.x, o.y) === TERRAIN_TYPES.ICE);
      if (coldDwellers.length >= 2) {
        this._firstGlacial = true;
        reportText = `[AI Naturalist] Glacial Pioneers: Species colonize the northern ice sheet with antifreeze protein genes.`;
      }
    }

    if (!reportText) {
      if (this.tickCount === 1500) {
        reportText = `[AI Naturalist] Great Archean Oxygenation Event begins! Oxygen levels rising.`;
      } else if (this.tickCount === 3500) {
        reportText = `[AI Naturalist] Proterozoic Snowball Earth era arrives! Glacial sheets expand across the continents.`;
      } else if (this.tickCount === 5500) {
        reportText = `[AI Naturalist] Cambrian Explosion! Optimal atmospheric oxygenation sparks rapid speciation.`;
      } else if (s.multicellular > 2 && Math.random() < 0.5) {
        reportText = `[AI Naturalist] Multicellular complexity surging: ${s.multicellular} organisms with spring tissue bodies active.`;
      } else if (s.carnivores > s.herbivores && Math.random() < 0.5) {
        reportText = `[AI Naturalist] Apex Predators dominant: Carnivores outweigh grazers in the ${era} era.`;
      } else {
        reportText = `[AI Naturalist] Species ${s.topSpecies} leads ecosystem diversity across land and sea.`;
      }
    }

    this.events.push({ tick: this.tickCount, text: reportText });
  }

  tick() {
    const W = this.width, H = this.height;
    const p = this.params;

    this.food.grow(p.foodGrowth, this.tickCount);

    const hash = new SpatialHash(W, H, 60);
    const alive = [];
    for (let i = 0; i < this.organisms.length; i++) {
      const o = this.organisms[i];
      if (o.alive) { alive.push(o); hash.insert(o); }
    }

    // Colony clustering (Union-Find)
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

    // Step each organism with V4 terrain physics
    for (let i = 0; i < alive.length; i++) {
      alive[i].step(this.food, hash, W, H, p.tempFactor, this.terrain);
    }

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
          if (this.fossilRecord.length > 30) this.fossilRecord.shift();
        }
        continue;
      }

      if (o.energy >= o.reproduceThreshold && o.reproCooldown <= 0 && (alive.length + newborns.length) < p.maxPopulation) {
        let childGenome, childBrain;
        let isSexual = false;

        if (Math.random() < p.sexualRatio) {
          const neighbors = hash.query(o.x, o.y, 28);
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
        this.seed(35);
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
      s.terrestrial = 0; s.amphibious = 0; s.avgMoisture = 100;
      s.avgSize = 0; s.avgSpeed = 0; s.herbivores = 0; s.carnivores = 0;
      s.foodCoverage = this.food.coverage();
      s.topSpecies = 'None';
      return;
    }

    let sumSize = 0, sumSpeed = 0, herb = 0, carn = 0, maxGen = 1;
    let terrestrial = 0, amphibious = 0, sumMoisture = 0;
    const hues = [];
    const seenGroups = new Set();
    let colonies = 0, multicell = 0;

    for (let i = 0; i < orgs.length; i++) {
      const o = orgs[i];
      sumSize += o.genome.size;
      sumSpeed += o.genome.speed;
      sumMoisture += o.moisture;

      const mat = this.terrain.getMaterial(o.x, o.y);
      if (mat === TERRAIN_TYPES.LAND || mat === TERRAIN_TYPES.MUD) {
        if ((o.genome.locomotionType || 0) > 0.45) terrestrial++;
      }
      if ((o.genome.locomotionType || 0) > 0.35 && (o.genome.moistureRetention || 0) > 0.35) {
        amphibious++;
      }

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
    s.terrestrial = terrestrial;
    s.amphibious = amphibious;
    s.avgMoisture = Math.round(sumMoisture / orgs.length);
    s.avgSize = sumSize / orgs.length;
    s.avgSpeed = sumSpeed / orgs.length;
    s.herbivores = herb;
    s.carnivores = carn;
    s.foodCoverage = this.food.coverage();
    s.maxGeneration = maxGen;
    s.topSpecies = `${topName} (${maxCount})`;
  }
}

if (typeof module !== 'undefined') {
  module.exports = { World, SpatialHash };
}
