// ===== Primordial Earth V5 Observer App =====
// Sprawling 4000x3000 Living Planet, Atmospheric Day/Night Lighting,
// Bioluminescence, Living Flora, Carcasses, Mitosis Animations, & Weather Storms.

// =====================================================================
// 1. GENOME & TAXONOMY ENGINE
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
  pheromoneRate: [0, 1],
  toxinGene: [0, 1],
  endoCapacity: [0, 1],
  moistureRetention: [0, 1],
  locomotionType: [0, 1],
  thermalTolerance: [0, 1],
  visionFov: [45, 240],
  visionRange: [40, 220],
  mutationRate: [0.02, 0.35],

  // V6 Morphological Organogenesis
  segmentCount: [1, 8],
  bodyAspect: [0.6, 2.4],
  appendagePairs: [0, 5],
  shellMineral: [0, 1],
  headOrnament: [0, 1],
  tailType: [0, 1],

  // V6 Dynamic Brain Topology
  brainInputs: [16, 24],
  brainHidden1: [6, 20],
  brainDeepLayers: [0, 1],
  brainOutputs: [7, 11],
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
  visionFov: 'Vision FOV',
  visionRange: 'Sight Distance',
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

const GENETIC_ANOMALIES = {
  NONE: 'NONE',
  TITAN: 'TITAN',
  POLYCEPHALY: 'POLYCEPHALY',
  ALBINO: 'ALBINO',
  SPIKED_CARAPACE: 'SPIKED_CARAPACE',
  CHIMERA: 'CHIMERA',
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
  if (genome.anomaly === GENETIC_ANOMALIES.TITAN) pIndex = 19;
  else if (genome.anomaly === GENETIC_ANOMALIES.POLYCEPHALY) pIndex = 17;
  else if (genome.segmentCount > 5) pIndex = 16;
  else if (genome.segmentCount > 2) pIndex = 14;
  else if (genome.locomotionType > 0.65 && genome.moistureRetention > 0.45) pIndex = 11;
  else if (genome.locomotionType > 0.45 && genome.moistureRetention > 0.35) pIndex = 10;
  else if (genome.thermalTolerance > 0.65) pIndex = 12;
  else if (genome.visionRange > 160) pIndex = 13;
  else if (genome.toxinGene > 0.45) pIndex = 6;
  else if (genome.diet > 0.4) pIndex = 5;
  else if (genome.colony > 0.5) pIndex = 4;
  else if (genome.speed > 1.6) pIndex = 2;
  else if (genome.size > 2.0) pIndex = 3;
  else pIndex = 0;

  let sIndex = Math.floor((genome.hue / 360) * suffixes.length) % suffixes.length;
  if (genome.appendagePairs >= 3) sIndex = 10;
  else if (genome.shellMineral > 0.6) sIndex = 15;
  else if (genome.headOrnament > 0.6) sIndex = 16;
  else if (genome.segmentCount > 3) sIndex = 14;
  else if (genome.moistureRetention > 0.7) sIndex = 11;

  return `${prefixes[pIndex]}-${suffixes[sIndex]}`;
}

function randomGenome(base) {
  const g = {};
  for (const k in GENE_RANGES) {
    const [lo, hi] = GENE_RANGES[k];
    g[k] = base && base[k] !== undefined ? base[k] : lerp(lo, hi, Math.random());
  }
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
    if (Math.random() < 0.04 * mutagenMultiplier) delta *= 3.2;
    g[k] = clamp(g[k] + delta, lo, hi);
  }

  if (Math.random() < 0.08 * mutagenMultiplier) {
    const segDelta = Math.random() < 0.65 ? 1 : -1;
    g.segmentCount = clamp(Math.round(g.segmentCount + segDelta), 1, 8);
  }
  if (Math.random() < 0.08 * mutagenMultiplier) {
    const limbDelta = Math.random() < 0.6 ? 1 : -1;
    g.appendagePairs = clamp(Math.round(g.appendagePairs + limbDelta), 0, Math.min(5, Math.ceil(g.segmentCount)));
  }
  if (Math.random() < 0.09 * mutagenMultiplier) {
    if (Math.random() < 0.55 && g.brainInputs < 24) g.brainInputs = clamp(Math.round(g.brainInputs + 1), 16, 24);
    if (Math.random() < 0.5) g.brainHidden1 = clamp(Math.round(g.brainHidden1 + (Math.random() < 0.6 ? 1 : -1)), 6, 20);
    if (Math.random() < 0.25) g.brainDeepLayers = clamp(g.brainDeepLayers + (Math.random() - 0.45) * 0.4, 0, 1);
    if (Math.random() < 0.55 && g.brainOutputs < 11) g.brainOutputs = clamp(Math.round(g.brainOutputs + 1), 7, 11);
  }

  const oldHue = g.hue;
  g.hue = (g.hue + gaussian() * rate * 32 + 360) % 360;

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

function crossoverGenome(parentA, parentB, mutRate, mutagenMultiplier = 1.0) {
  const child = {};
  const geneKeys = Object.keys(GENE_RANGES);
  const pt1 = Math.floor(Math.random() * (geneKeys.length - 2));
  const pt2 = pt1 + 1 + Math.floor(Math.random() * (geneKeys.length - pt1 - 1));

  for (let i = 0; i < geneKeys.length; i++) {
    const k = geneKeys[i];
    if (i < pt1 || i >= pt2) {
      child[k] = Math.random() < 0.85 ? parentA[k] : parentB[k];
    } else {
      child[k] = Math.random() < 0.85 ? parentB[k] : parentA[k];
    }
  }

  child.hue = Math.random() < 0.5 ? parentA.hue : parentB.hue;
  if (hueDiff(parentA.hue, parentB.hue) < 45) {
    child.hue = (parentA.hue + parentB.hue) * 0.5;
  }
  child.anomaly = Math.random() < 0.35 ? (parentA.anomaly || parentB.anomaly || GENETIC_ANOMALIES.NONE) : GENETIC_ANOMALIES.NONE;

  const effectiveMutRate = (parentA.mutationRate + parentB.mutationRate) * 0.5;
  child.speciesName = generateSpeciesName(child);
  return mutateGenome(child, effectiveMutRate, mutagenMultiplier);
}

// =====================================================================
// 2. TERRAIN & NATURAL MATERIALS
// =====================================================================

const TERRAIN_TYPES = {
  WATER_DEEP: 0,
  WATER_SHALLOW: 1,
  LAND: 2,
  MUD: 3,
  ICE: 4,
};

const MATERIAL_PROPERTIES = {
  [TERRAIN_TYPES.WATER_DEEP]: { name: 'Deep Ocean', friction: 0.94, moistureReplenish: 1.2, color: '#091822' },
  [TERRAIN_TYPES.WATER_SHALLOW]: { name: 'Tidal Shallows', friction: 0.92, moistureReplenish: 1.5, color: '#113336' },
  [TERRAIN_TYPES.LAND]: { name: 'Continental Land', friction: 0.88, moistureReplenish: -0.85, color: '#383224' },
  [TERRAIN_TYPES.MUD]: { name: 'Detritus Mudflat', friction: 0.72, moistureReplenish: 0.4, color: '#271f16' },
  [TERRAIN_TYPES.ICE]: { name: 'Glacial Ice Sheet', friction: 0.985, moistureReplenish: -0.4, color: '#273e50' },
};

class TerrainGrid {
  constructor(width = 4000, height = 3000, cellSize = 40) {
    this.width = width;
    this.height = height;
    this.cellSize = cellSize;
    this.cols = Math.ceil(width / cellSize);
    this.rows = Math.ceil(height / cellSize);
    this.materials = new Uint8Array(this.cols * this.rows);
    this.detritusGrid = new Float32Array(this.cols * this.rows);

    this.stones = [];
    this._stoneSpatialHash = new Map();
    this.stoneCellSize = 120;
    this.stoneCols = Math.ceil(width / this.stoneCellSize);
    this.stoneRows = Math.ceil(height / this.stoneCellSize);

    this.generateProceduralWorld();
  }

  idx(cx, cy) { return cy * this.cols + cx; }
  cellAt(x, y) {
    const cx = clamp(Math.floor(x / this.cellSize), 0, this.cols - 1);
    const cy = clamp(Math.floor(y / this.cellSize), 0, this.rows - 1);
    return { cx, cy };
  }
  getMaterial(x, y) {
    const { cx, cy } = this.cellAt(x, y);
    return this.materials[this.idx(cx, cy)];
  }
  getMaterialProps(x, y) {
    const mat = this.getMaterial(x, y);
    return MATERIAL_PROPERTIES[mat] || MATERIAL_PROPERTIES[TERRAIN_TYPES.WATER_DEEP];
  }

  generateProceduralWorld() {
    const { cols, rows, materials, detritusGrid, width, height } = this;
    const fbm = (nx, ny) => {
      let val = Math.sin(nx * 1.8) * Math.cos(ny * 1.6);
      val += 0.5 * Math.sin(nx * 3.7 + 1.2) * Math.cos(ny * 3.4 + 0.8);
      val += 0.25 * Math.sin(nx * 7.5 - 0.4) * Math.cos(ny * 8.1 + 2.1);
      return val;
    };

    const centerX = cols * 0.55;
    const centerY = rows * 0.48;

    for (let cy = 0; cy < rows; cy++) {
      const ny = (cy / rows) * Math.PI * 2;
      const distY = Math.abs(cy - centerY) / (rows * 0.5);

      for (let cx = 0; cx < cols; cx++) {
        const nx = (cx / cols) * Math.PI * 2;
        const distX = Math.abs(cx - centerX) / (cols * 0.5);
        const centerDist = Math.sqrt(distX * distX + distY * distY);

        const noise = fbm(nx, ny);
        const elevation = noise * 0.8 - (centerDist * 1.35) + 0.55;
        const i = cy * cols + cx;

        const isPolar = (cy < rows * 0.12 || cy > rows * 0.88);
        const isMountainIce = elevation > 1.05;

        if (isPolar || isMountainIce) {
          materials[i] = TERRAIN_TYPES.ICE;
          detritusGrid[i] = 0.05;
        } else if (elevation > 0.35) {
          materials[i] = TERRAIN_TYPES.LAND;
          detritusGrid[i] = 0.25 + Math.random() * 0.3;
        } else if (elevation > 0.08) {
          if (noise > 0.2) {
            materials[i] = TERRAIN_TYPES.MUD;
            detritusGrid[i] = 0.75 + Math.random() * 0.25;
          } else {
            materials[i] = TERRAIN_TYPES.WATER_SHALLOW;
            detritusGrid[i] = 0.45;
          }
        } else if (elevation > -0.35) {
          materials[i] = TERRAIN_TYPES.WATER_SHALLOW;
          detritusGrid[i] = 0.25;
        } else {
          materials[i] = TERRAIN_TYPES.WATER_DEEP;
          detritusGrid[i] = 0.08;
        }
      }
    }

    this.stones = [];
    const stoneCount = 140;
    let stoneId = 1;

    for (let s = 0; s < stoneCount; s++) {
      const sx = 120 + Math.random() * (width - 240);
      const sy = 120 + Math.random() * (height - 240);
      const radius = 18 + Math.random() * 32;

      const clusterSize = Math.random() < 0.4 ? (2 + Math.floor(Math.random() * 4)) : 1;
      for (let c = 0; c < clusterSize; c++) {
        const ox = sx + (c > 0 ? (Math.random() - 0.5) * 80 : 0);
        const oy = sy + (c > 0 ? (Math.random() - 0.5) * 80 : 0);
        const r = clamp(radius * (0.7 + Math.random() * 0.6), 14, 48);

        if (ox > r && ox < width - r && oy > r && oy < height - r) {
          this.stones.push({ id: stoneId++, x: ox, y: oy, r, minerals: 0.5 + Math.random() * 0.5 });
        }
      }
    }
    this.rebuildStoneSpatialHash();
  }

  rebuildStoneSpatialHash() {
    this._stoneSpatialHash.clear();
    for (const st of this.stones) {
      const minCx = clamp(Math.floor((st.x - st.r) / this.stoneCellSize), 0, this.stoneCols - 1);
      const maxCx = clamp(Math.floor((st.x + st.r) / this.stoneCellSize), 0, this.stoneCols - 1);
      const minCy = clamp(Math.floor((st.y - st.r) / this.stoneCellSize), 0, this.stoneRows - 1);
      const maxCy = clamp(Math.floor((st.y + st.r) / this.stoneCellSize), 0, this.stoneRows - 1);

      for (let cy = minCy; cy <= maxCy; cy++) {
        for (let cx = minCx; cx <= maxCx; cx++) {
          const k = `${cx},${cy}`;
          let bucket = this._stoneSpatialHash.get(k);
          if (!bucket) { bucket = []; this._stoneSpatialHash.set(k, bucket); }
          bucket.push(st);
        }
      }
    }
  }

  queryStonesNear(x, y, radius) {
    const minCx = clamp(Math.floor((x - radius) / this.stoneCellSize), 0, this.stoneCols - 1);
    const maxCx = clamp(Math.floor((x + radius) / this.stoneCellSize), 0, this.stoneCols - 1);
    const minCy = clamp(Math.floor((y - radius) / this.stoneCellSize), 0, this.stoneRows - 1);
    const maxCy = clamp(Math.floor((y + radius) / this.stoneCellSize), 0, this.stoneRows - 1);

    const visited = new Set();
    const result = [];
    for (let cy = minCy; cy <= maxCy; cy++) {
      for (let cx = minCx; cx <= maxCx; cx++) {
        const bucket = this._stoneSpatialHash.get(`${cx},${cy}`);
        if (bucket) {
          for (const st of bucket) {
            if (!visited.has(st.id)) { visited.add(st.id); result.push(st); }
          }
        }
      }
    }
    return result;
  }

  resolveStoneCollision(x, y, radius, vx, vy) {
    const nearby = this.queryStonesNear(x, y, radius + 50);
    let rx = x, ry = y, rvx = vx, rvy = vy, collided = false;

    for (const st of nearby) {
      const minDist = st.r + radius;
      const dx = rx - st.x, dy = ry - st.y;
      const d2 = dx * dx + dy * dy;

      if (d2 < minDist * minDist) {
        collided = true;
        const d = Math.sqrt(d2) || 1;
        const nx = dx / d, ny = dy / d;
        const overlap = minDist - d;
        rx += nx * overlap;
        ry += ny * overlap;

        const dot = rvx * nx + rvy * ny;
        if (dot < 0) {
          rvx = (rvx - 1.4 * dot * nx) * 0.65;
          rvy = (rvy - 1.4 * dot * ny) * 0.65;
        }
      }
    }
    return { x: rx, y: ry, vx: rvx, vy: rvy, collided };
  }

  raycastStone(originX, originY, dirX, dirY, maxDist) {
    const nearby = this.queryStonesNear(originX + dirX * maxDist * 0.5, originY + dirY * maxDist * 0.5, maxDist * 0.6 + 60);
    let closestDist = maxDist, hitStone = null;

    for (const st of nearby) {
      const fx = originX - st.x, fy = originY - st.y;
      const a = dirX * dirX + dirY * dirY;
      const b = 2 * (fx * dirX + fy * dirY);
      const c = (fx * fx + fy * fy) - st.r * st.r;
      const discriminant = b * b - 4 * a * c;
      if (discriminant >= 0) {
        const sq = Math.sqrt(discriminant);
        const t1 = (-b - sq) / (2 * a);
        if (t1 > 0 && t1 < closestDist) {
          closestDist = t1;
          hitStone = st;
        }
      }
    }
    return { hit: hitStone !== null, dist: closestDist, stone: hitStone };
  }

  paintMaterial(x, y, radius, materialType) {
    const { cols, rows, materials, cellSize } = this;
    const rCells = Math.ceil(radius / cellSize);
    const { cx: ccx, cy: ccy } = this.cellAt(x, y);

    for (let dy = -rCells; dy <= rCells; dy++) {
      for (let dx = -rCells; dx <= rCells; dx++) {
        const cx = ccx + dx, cy = ccy + dy;
        if (cx < 0 || cy < 0 || cx >= cols || cy >= rows) continue;
        const px = (cx + 0.5) * cellSize, py = (cy + 0.5) * cellSize;
        if (dist2(px, py, x, y) <= radius * radius) {
          materials[this.idx(cx, cy)] = materialType;
        }
      }
    }
  }

  addStone(x, y, radius = 26) {
    this.stones.push({ id: this.stones.length + 1, x, y, r: radius, minerals: 0.8 });
    this.rebuildStoneSpatialHash();
  }
}

// =====================================================================
// 3. LIVING FLORA, CARCASSES & WEATHER
// =====================================================================

const FLORA_TYPES = { KELP: 0, MOSS: 1, CORAL: 2, FERN: 3 };
const FLORA_PROPERTIES = {
  [FLORA_TYPES.KELP]: { name: 'Giant Kelp', maxHeight: 45, maxBiomass: 35, color: '#38b000', o2Output: 0.0004 },
  [FLORA_TYPES.MOSS]: { name: 'Continental Moss', maxHeight: 14, maxBiomass: 20, color: '#70e000', o2Output: 0.0003 },
  [FLORA_TYPES.CORAL]: { name: 'Tidal Coral Polyp', maxHeight: 22, maxBiomass: 28, color: '#ff70a6', o2Output: 0.0002 },
  [FLORA_TYPES.FERN]: { name: 'Coastal Fern', maxHeight: 28, maxBiomass: 30, color: '#007200', o2Output: 0.00035 },
};

let FLORA_ID_COUNTER = 1;
class Flora {
  constructor(x, y, type = FLORA_TYPES.KELP, initialBiomass = 8) {
    this.id = FLORA_ID_COUNTER++;
    this.x = x; this.y = y; this.type = type;
    const props = FLORA_PROPERTIES[type] || FLORA_PROPERTIES[FLORA_TYPES.KELP];
    this.maxBiomass = props.maxBiomass;
    this.biomass = initialBiomass;
    this.maxHeight = props.maxHeight;
    this.height = (this.biomass / this.maxBiomass) * props.maxHeight;
    this.age = 0;
    this.matureAge = 120 + Math.floor(Math.random() * 80);
    this.sporeCooldown = Math.floor(Math.random() * 100);
    this.alive = true;
    this.swayPhase = Math.random() * Math.PI * 2;
  }
  get radius() { return Math.max(4, this.height * 0.45); }

  tick(lightFactor = 1.0, soilNutrient = 0.5, moisture = 1.0) {
    if (!this.alive) return null;
    this.age++;
    if (this.sporeCooldown > 0) this.sporeCooldown--;

    const growth = 0.035 * lightFactor * (0.5 + soilNutrient * 0.8) * Math.min(1.5, moisture);
    this.biomass = Math.min(this.maxBiomass, this.biomass + growth);
    this.height = (this.biomass / this.maxBiomass) * this.maxHeight;

    if (this.biomass >= this.maxBiomass * 0.65 && this.sporeCooldown <= 0 && this.age > this.matureAge) {
      this.sporeCooldown = 180 + Math.floor(Math.random() * 120);
      return { originX: this.x, originY: this.y, type: this.type };
    }
    return null;
  }

  graze(amount) {
    const taken = Math.min(this.biomass * 0.6, amount);
    this.biomass -= taken;
    this.height = (this.biomass / this.maxBiomass) * this.maxHeight;
    if (this.biomass < 1.2) this.alive = false;
    return taken;
  }
}

class FloraManager {
  constructor(width = 4000, height = 3000, cellSize = 100) {
    this.width = width; this.height = height; this.cellSize = cellSize;
    this.cols = Math.ceil(width / cellSize); this.rows = Math.ceil(height / cellSize);
    this.floras = [];
    this.maxFloraCount = 380;
    this._buckets = new Map();
  }
  _key(cx, cy) { return `${cx},${cy}`; }

  rebuildSpatialHash() {
    this._buckets.clear();
    for (let i = 0; i < this.floras.length; i++) {
      const f = this.floras[i];
      if (!f.alive) continue;
      const cx = clamp(Math.floor(f.x / this.cellSize), 0, this.cols - 1);
      const cy = clamp(Math.floor(f.y / this.cellSize), 0, this.rows - 1);
      const k = this._key(cx, cy);
      let arr = this._buckets.get(k);
      if (!arr) { arr = []; this._buckets.set(k, arr); }
      arr.push(f);
    }
  }

  queryNear(x, y, radius) {
    const minCx = clamp(Math.floor((x - radius) / this.cellSize), 0, this.cols - 1);
    const maxCx = clamp(Math.floor((x + radius) / this.cellSize), 0, this.cols - 1);
    const minCy = clamp(Math.floor((y - radius) / this.cellSize), 0, this.rows - 1);
    const maxCy = clamp(Math.floor((y + radius) / this.cellSize), 0, this.rows - 1);
    const res = [];
    for (let cy = minCy; cy <= maxCy; cy++) {
      for (let cx = minCx; cx <= maxCx; cx++) {
        const bucket = this._buckets.get(this._key(cx, cy));
        if (bucket) for (let i = 0; i < bucket.length; i++) res.push(bucket[i]);
      }
    }
    return res;
  }

  addFlora(x, y, type = FLORA_TYPES.KELP, initialBiomass = 8) {
    if (this.floras.length >= this.maxFloraCount) {
      this.floras = this.floras.filter(f => f.alive);
      if (this.floras.length >= this.maxFloraCount) return null;
    }
    const f = new Flora(x, y, type, initialBiomass);
    this.floras.push(f);
    return f;
  }

  seedInitialFlora(terrain, count = 180) {
    this.floras = [];
    for (let i = 0; i < count; i++) {
      const x = 80 + Math.random() * (this.width - 160);
      const y = 80 + Math.random() * (this.height - 160);
      const mat = terrain.getMaterial(x, y);
      let type = FLORA_TYPES.KELP;
      if (mat === TERRAIN_TYPES.LAND) type = Math.random() < 0.6 ? FLORA_TYPES.MOSS : FLORA_TYPES.FERN;
      else if (mat === TERRAIN_TYPES.MUD) type = Math.random() < 0.5 ? FLORA_TYPES.MOSS : FLORA_TYPES.KELP;
      else if (mat === TERRAIN_TYPES.WATER_SHALLOW) type = Math.random() < 0.4 ? FLORA_TYPES.CORAL : FLORA_TYPES.KELP;
      else if (mat === TERRAIN_TYPES.WATER_DEEP) type = FLORA_TYPES.KELP;
      else continue;
      this.addFlora(x, y, type, 10 + Math.random() * 15);
    }
    this.rebuildSpatialHash();
  }

  tick(foodGrid, terrain, weatherManager, tickCount = 0) {
    const spores = [];
    let netO2 = 0;
    for (let i = 0; i < this.floras.length; i++) {
      const f = this.floras[i];
      if (!f.alive) continue;
      const light = foodGrid ? foodGrid.lightFactor(f.y / 40, tickCount) : 1.0;
      const soil = foodGrid ? (foodGrid.density[foodGrid.idx(foodGrid.cellAt(f.x, f.y).cx, foodGrid.cellAt(f.x, f.y).cy)] || 0.4) : 0.4;
      const moisture = weatherManager ? weatherManager.getMoistureAt(f.x, f.y) : 1.0;

      const spore = f.tick(light, soil, moisture);
      if (spore) spores.push(spore);
      netO2 += FLORA_PROPERTIES[f.type].o2Output;
    }

    if (this.floras.length < this.maxFloraCount && spores.length > 0) {
      for (const sp of spores) {
        if (this.floras.length >= this.maxFloraCount) break;
        const dist = 30 + Math.random() * 90, ang = Math.random() * Math.PI * 2;
        const nx = clamp(sp.originX + Math.cos(ang) * dist, 40, this.width - 40);
        const ny = clamp(sp.originY + Math.sin(ang) * dist, 40, this.height - 40);
        const mat = terrain.getMaterial(nx, ny);
        const isWater = mat === TERRAIN_TYPES.WATER_DEEP || mat === TERRAIN_TYPES.WATER_SHALLOW;
        if (sp.type === FLORA_TYPES.KELP && isWater) this.addFlora(nx, ny, sp.type, 5);
        else if ((sp.type === FLORA_TYPES.MOSS || sp.type === FLORA_TYPES.FERN) && (mat === TERRAIN_TYPES.LAND || mat === TERRAIN_TYPES.MUD)) this.addFlora(nx, ny, sp.type, 5);
      }
    }

    if (tickCount % 20 === 0) {
      this.floras = this.floras.filter(f => f.alive);
      this.rebuildSpatialHash();
    }
    return netO2;
  }
}

// Carcass Subsystem
let CARCASS_ID_COUNTER = 1;
class Carcass {
  constructor(x, y, size = 1.0, hue = 180, speciesName = 'Unknown', energy = 30) {
    this.id = CARCASS_ID_COUNTER++;
    this.x = x; this.y = y; this.size = size; this.hue = hue; this.speciesName = speciesName;
    this.maxMeat = 15 + size * 25 + Math.min(30, energy * 0.4);
    this.meatEnergy = this.maxMeat;
    this.boneIntegrity = 100;
    this.age = 0;
    this.alive = true;
  }
  get isSkeleton() { return this.meatEnergy <= 0.5; }
  get radius() { return 3.0 + this.size * 3.2; }

  scavenge(amount) {
    if (this.meatEnergy <= 0) return 0;
    const taken = Math.min(this.meatEnergy, amount);
    this.meatEnergy -= taken;
    return taken;
  }
  tick(foodGrid) {
    this.age++;
    if (this.meatEnergy > 0) {
      const rot = Math.min(this.meatEnergy, 0.035 + this.size * 0.015);
      this.meatEnergy -= rot;
      if (foodGrid) foodGrid.deposit(this.x, this.y, rot * 0.08);
    } else {
      this.boneIntegrity -= 0.075;
      if (this.boneIntegrity <= 0) this.alive = false;
    }
  }
}

class CarcassManager {
  constructor(width = 4000, height = 3000, cellSize = 100) {
    this.width = width; this.height = height; this.cellSize = cellSize;
    this.cols = Math.ceil(width / cellSize); this.rows = Math.ceil(height / cellSize);
    this.carcasses = [];
    this.maxCarcasses = 180;
    this._buckets = new Map();
  }
  _key(cx, cy) { return `${cx},${cy}`; }

  rebuildSpatialHash() {
    this._buckets.clear();
    for (let i = 0; i < this.carcasses.length; i++) {
      const c = this.carcasses[i];
      if (!c.alive) continue;
      const cx = clamp(Math.floor(c.x / this.cellSize), 0, this.cols - 1);
      const cy = clamp(Math.floor(c.y / this.cellSize), 0, this.rows - 1);
      const k = this._key(cx, cy);
      let arr = this._buckets.get(k);
      if (!arr) { arr = []; this._buckets.set(k, arr); }
      arr.push(c);
    }
  }

  queryNear(x, y, radius) {
    const minCx = clamp(Math.floor((x - radius) / this.cellSize), 0, this.cols - 1);
    const maxCx = clamp(Math.floor((x + radius) / this.cellSize), 0, this.cols - 1);
    const minCy = clamp(Math.floor((y - radius) / this.cellSize), 0, this.rows - 1);
    const maxCy = clamp(Math.floor((y + radius) / this.cellSize), 0, this.rows - 1);
    const res = [];
    for (let cy = minCy; cy <= maxCy; cy++) {
      for (let cx = minCx; cx <= maxCx; cx++) {
        const b = this._buckets.get(this._key(cx, cy));
        if (b) for (let i = 0; i < b.length; i++) res.push(b[i]);
      }
    }
    return res;
  }

  addCarcassFromOrganism(org) {
    if (this.carcasses.length >= this.maxCarcasses) {
      this.carcasses = this.carcasses.filter(c => c.alive);
      if (this.carcasses.length >= this.maxCarcasses) return null;
    }
    const c = new Carcass(org.x, org.y, org.genome.size, org.genome.hue, org.genome.speciesName, org.energy);
    this.carcasses.push(c);
    return c;
  }

  tick(foodGrid, tickCount = 0) {
    for (let i = 0; i < this.carcasses.length; i++) this.carcasses[i].tick(foodGrid);
    if (tickCount % 25 === 0) {
      this.carcasses = this.carcasses.filter(c => c.alive);
      this.rebuildSpatialHash();
    }
  }
}

// Weather Subsystem
const WEATHER_TYPES = { RAIN: 0, BLIZZARD: 1, CLEAR: 2 };
class WeatherFront {
  constructor(x, y, type = WEATHER_TYPES.RAIN, radius = 350, vx = 0.6, vy = 0.2) {
    this.x = x; this.y = y; this.type = type; this.radius = radius;
    this.vx = vx; this.vy = vy; this.intensity = 0.8; this.alive = true; this.age = 0;
    this.lifetime = 1400;
  }
  tick(W, H) {
    this.age++;
    this.x = (this.x + this.vx + W) % W;
    this.y = (this.y + this.vy + H) % H;
    if (this.age > this.lifetime) this.alive = false;
  }
  affects(x, y) {
    const d2 = dist2(this.x, this.y, x, y);
    if (d2 > this.radius * this.radius) return 0;
    return (1 - Math.sqrt(d2) / this.radius) * this.intensity;
  }
}

class WeatherManager {
  constructor(width = 4000, height = 3000) {
    this.width = width; this.height = height;
    this.fronts = [
      new WeatherFront(1000, 1200, WEATHER_TYPES.RAIN, 380, 0.7, 0.2),
      new WeatherFront(2500, 2200, WEATHER_TYPES.RAIN, 420, 0.6, 0.15),
      new WeatherFront(1800, 300, WEATHER_TYPES.BLIZZARD, 350, 0.8, -0.1),
    ];
  }
  spawnStorm(type = WEATHER_TYPES.RAIN, x, y, radius = 380) {
    const f = new WeatherFront(x !== undefined ? x : Math.random() * this.width, y !== undefined ? y : Math.random() * this.height, type, radius);
    this.fronts.push(f);
    return f;
  }
  getMoistureAt(x, y) {
    let m = 1.0;
    for (let i = 0; i < this.fronts.length; i++) {
      if (this.fronts[i].type === WEATHER_TYPES.RAIN) {
        const inf = this.fronts[i].affects(x, y);
        if (inf > 0) m += inf * 1.5;
      }
    }
    return m;
  }
  tick() {
    for (let i = 0; i < this.fronts.length; i++) this.fronts[i].tick(this.width, this.height);
    this.fronts = this.fronts.filter(f => f.alive);
    if (this.fronts.length < 2) this.spawnStorm(Math.random() < 0.7 ? WEATHER_TYPES.RAIN : WEATHER_TYPES.BLIZZARD);
  }
}

// =====================================================================
// 4. COMPOUND EYE VISION & OCCLUSION
// =====================================================================

const RAY_COUNT = 5;
const HIT_TYPES = { NONE: 0, FOOD: 1, PREY: 2, THREAT: -1, KIN: 0.5, OBSTACLE: -0.8, FLORA: 1.5, CARCASS: 2.2 };

function castCompoundVision(org, spatialHash, foodGrid, terrain, W, H, floraManager, carcassManager) {
  const fov = (org.genome.visionFov || 120) * (Math.PI / 180);
  let range = org.genome.visionRange || (35 + org.genome.sense * 0.85);
  if (org.role === 'ocellus') range *= 1.5;

  const facing = org.facingAngle || 0;
  const rayHits = [];
  const nearbyOrgs = spatialHash.query(org.x, org.y, range + 20);
  const nearbyFloras = floraManager ? floraManager.queryNear(org.x, org.y, range + 20) : [];
  const nearbyCarcasses = carcassManager ? carcassManager.queryNear(org.x, org.y, range + 20) : [];

  const isPoly = org.anomaly === 'POLYCEPHALY';
  const rayCount = isPoly ? 10 : RAY_COUNT;

  for (let r = 0; r < rayCount; r++) {
    const angleOffset = fov * (r / (rayCount - 1) - 0.5);
    const rayAngle = facing + angleOffset;
    const dirX = Math.cos(rayAngle), dirY = Math.sin(rayAngle);

    let closestDist = range;
    let hitSign = HIT_TYPES.NONE;

    if (terrain) {
      const stoneHit = terrain.raycastStone(org.x, org.y, dirX, dirY, range);
      if (stoneHit.hit && stoneHit.dist < closestDist) {
        closestDist = stoneHit.dist;
        hitSign = HIT_TYPES.OBSTACLE;
      }
    }

    for (let i = 0; i < nearbyOrgs.length; i++) {
      const other = nearbyOrgs[i];
      if (other === org || !other.alive) continue;

      const toX = other.x - org.x, toY = other.y - org.y;
      const proj = toX * dirX + toY * dirY;
      if (proj <= 0 || proj >= closestDist) continue;

      // Concealment stealth: Burrowed in mud or Albino camouflage
      if (other.isBurrowed && proj > range * 0.35) continue;
      if (other.anomaly === 'ALBINO' && proj > range * 0.45) continue;
      const perp2 = (toX * toX + toY * toY) - (proj * proj);
      const rad = other.effectiveSize || (other.genome.size * 5);
      if (perp2 <= rad * rad) {
        closestDist = proj;
        const isKin = hueDiff(org.genome.hue, other.genome.hue) < 16;
        const otherEff = other.effectiveSize || other.genome.size;
        const selfEff = org.effectiveSize || org.genome.size;
        if (isKin) hitSign = HIT_TYPES.KIN;
        else if (otherEff > selfEff * 1.15 && (other.genome.aggression > 0.2 || other.genome.diet > 0.2)) hitSign = HIT_TYPES.THREAT;
        else if (org.genome.diet > 0.15 && otherEff * 1.1 < selfEff) hitSign = HIT_TYPES.PREY;
        else hitSign = 0.1;
      }
    }

    for (let i = 0; i < nearbyFloras.length; i++) {
      const fl = nearbyFloras[i];
      if (!fl.alive) continue;
      const toX = fl.x - org.x, toY = fl.y - org.y;
      const proj = toX * dirX + toY * dirY;
      if (proj <= 0 || proj >= closestDist) continue;
      const perp2 = (toX * toX + toY * toY) - (proj * proj);
      if (perp2 <= fl.radius * fl.radius) { closestDist = proj; hitSign = HIT_TYPES.FLORA; }
    }

    for (let i = 0; i < nearbyCarcasses.length; i++) {
      const car = nearbyCarcasses[i];
      if (!car.alive || car.meatEnergy <= 0) continue;
      const toX = car.x - org.x, toY = car.y - org.y;
      const proj = toX * dirX + toY * dirY;
      if (proj <= 0 || proj >= closestDist) continue;
      const perp2 = (toX * toX + toY * toY) - (proj * proj);
      if (perp2 <= car.radius * car.radius) { closestDist = proj; hitSign = HIT_TYPES.CARCASS; }
    }

    const proximity = 1.0 - (closestDist / range);
    rayHits.push({ dirX, dirY, dist: closestDist, proximity, signature: hitSign, signal: proximity * hitSign });
  }

  const probeDist = 18 + org.genome.size * 6;
  const leftAngle = facing - 0.45, rightAngle = facing + 0.45;
  const leftX = (org.x + Math.cos(leftAngle) * probeDist + W) % W;
  const leftY = (org.y + Math.sin(leftAngle) * probeDist + H) % H;
  const rightX = (org.x + Math.cos(rightAngle) * probeDist + W) % W;
  const rightY = (org.y + Math.sin(rightAngle) * probeDist + H) % H;

  let leftFood = 0, rightFood = 0, leftToxin = 0, rightToxin = 0;
  if (foodGrid) {
    const lCell = foodGrid.cellAt(leftX, leftY);
    const rCell = foodGrid.cellAt(rightX, rightY);
    leftFood = foodGrid.density[foodGrid.idx(lCell.cx, lCell.cy)] || 0;
    rightFood = foodGrid.density[foodGrid.idx(rCell.cx, rCell.cy)] || 0;
    leftToxin = foodGrid.toxinAt(leftX, leftY) || 0;
    rightToxin = foodGrid.toxinAt(rightX, rightY) || 0;
  }

  return {
    rays: rayHits,
    foodGradient: clamp((rightFood - leftFood) * 2.5, -1, 1),
    toxinGradient: clamp((rightToxin - leftToxin) * 3.0, -1, 1),
  };
}

// =====================================================================
// 5. COGNITIVE NEURAL NETWORK BRAIN (MULTI-LAYER DYNAMIC NEAT)
// =====================================================================

const MAX_INPUTS = 24;
const MAX_HIDDEN1 = 20;
const MAX_HIDDEN2 = 12;
const MAX_OUTPUTS = 11;

class NEATBrain {
  constructor(inputSize = 16, initialHiddenSize = 10, outputSize = 7, hasDeepLayer = false, initialHidden2 = 6) {
    this.inputSize = clamp(Math.round(inputSize), 16, MAX_INPUTS);
    this.hidden1Size = clamp(Math.round(initialHiddenSize), 6, MAX_HIDDEN1);
    this.hasDeepLayer = Boolean(hasDeepLayer);
    this.hidden2Size = clamp(Math.round(initialHidden2), 4, MAX_HIDDEN2);
    this.outputSize = clamp(Math.round(outputSize), 7, MAX_OUTPUTS);

    this.maxInputs = MAX_INPUTS;
    this.maxHidden1 = MAX_HIDDEN1;
    this.maxHidden2 = MAX_HIDDEN2;
    this.maxOutputs = MAX_OUTPUTS;

    this.W1 = new Float32Array(MAX_HIDDEN1 * MAX_INPUTS);
    this.B1 = new Float32Array(MAX_HIDDEN1);
    this.WDeep = new Float32Array(MAX_HIDDEN2 * MAX_HIDDEN1);
    this.BDeep = new Float32Array(MAX_HIDDEN2);
    this.W2 = new Float32Array(MAX_OUTPUTS * MAX_HIDDEN1);
    this.WOutDeep = new Float32Array(MAX_OUTPUTS * MAX_HIDDEN2);
    this.B2 = new Float32Array(MAX_OUTPUTS);

    this.inputs = new Float32Array(MAX_INPUTS);
    this.hidden1 = new Float32Array(MAX_HIDDEN1);
    this.hidden2 = new Float32Array(MAX_HIDDEN2);
    this.outputs = new Float32Array(MAX_OUTPUTS);

    this.mem1 = 0; this.mem2 = 0; this.mem3 = 0; this.painTrace = 0;
    this.trace1 = new Float32Array(MAX_HIDDEN1 * MAX_INPUTS);
    this.traceDeep = new Float32Array(MAX_HIDDEN2 * MAX_HIDDEN1);
    this.trace2 = new Float32Array(MAX_OUTPUTS * MAX_HIDDEN1);
    this.traceOutDeep = new Float32Array(MAX_OUTPUTS * MAX_HIDDEN2);

    this.randomize();
  }

  get hiddenSize() { return this.hidden1Size; }
  set hiddenSize(v) { this.hidden1Size = clamp(Math.round(v), 6, MAX_HIDDEN1); }
  get deepHiddenSize() { return this.hidden2Size; }
  set deepHiddenSize(v) { this.hidden2Size = clamp(Math.round(v), 4, MAX_HIDDEN2); }
  get hasSkipConn() { return this.hasDeepLayer; }
  get maxHiddenSize() { return MAX_HIDDEN1; }

  applyPlasticity(reward, plasticityRate = 0.06) {
    return this.adaptPlasticity(reward, plasticityRate);
  }

  randomize(scale = 0.82) {
    for (let i = 0; i < this.W1.length; i++) this.W1[i] = gaussian() * scale;
    for (let i = 0; i < this.B1.length; i++) this.B1[i] = gaussian() * 0.2;
    for (let i = 0; i < this.WDeep.length; i++) this.WDeep[i] = gaussian() * scale;
    for (let i = 0; i < this.BDeep.length; i++) this.BDeep[i] = gaussian() * 0.2;
    for (let i = 0; i < this.W2.length; i++) this.W2[i] = gaussian() * scale;
    for (let i = 0; i < this.WOutDeep.length; i++) this.WOutDeep[i] = gaussian() * scale;
    for (let i = 0; i < this.B2.length; i++) this.B2[i] = gaussian() * 0.2;
  }

  forward(environmentInputs) {
    const inCount = Math.min(environmentInputs.length, this.inputSize);
    for (let i = 0; i < inCount; i++) this.inputs[i] = environmentInputs[i] || 0;
    for (let i = inCount; i < this.inputSize; i++) this.inputs[i] = 0;

    if (this.inputSize >= 16) {
      this.inputs[12] = this.mem1;
      this.inputs[13] = this.mem2;
      this.inputs[14] = this.mem3;
      this.inputs[15] = this.painTrace;
    }

    for (let h = 0; h < this.hidden1Size; h++) {
      let sum = this.B1[h];
      const rowOffset = h * MAX_INPUTS;
      for (let i = 0; i < this.inputSize; i++) sum += this.W1[rowOffset + i] * this.inputs[i];
      this.hidden1[h] = Math.tanh(sum);
    }

    if (this.hasDeepLayer) {
      for (let d = 0; d < this.hidden2Size; d++) {
        let sum = this.BDeep[d];
        const rowOffset = d * MAX_HIDDEN1;
        for (let h = 0; h < this.hidden1Size; h++) sum += this.WDeep[rowOffset + h] * this.hidden1[h];
        this.hidden2[d] = Math.tanh(sum);
      }
    }

    for (let o = 0; o < this.outputSize; o++) {
      let sum = this.B2[o];
      if (this.hasDeepLayer) {
        const deepRow = o * MAX_HIDDEN2;
        for (let d = 0; d < this.hidden2Size; d++) sum += this.WOutDeep[deepRow + d] * this.hidden2[d];
        const skipRow = o * MAX_HIDDEN1;
        for (let h = 0; h < this.hidden1Size; h++) sum += this.W2[skipRow + h] * this.hidden1[h] * 0.45;
      } else {
        const rowOffset = o * MAX_HIDDEN1;
        for (let h = 0; h < this.hidden1Size; h++) sum += this.W2[rowOffset + h] * this.hidden1[h];
      }

      if (o === 2 || o === 3 || o === 7 || o === 8 || o === 9) {
        this.outputs[o] = (1 / (1 + Math.exp(-sum)));
      } else {
        this.outputs[o] = Math.tanh(sum);
      }
    }

    if (this.outputSize >= 6) {
      this.mem1 = lerp(this.mem1, this.outputs[4], 0.65);
      this.mem2 = lerp(this.mem2, this.outputs[5], 0.65);
      if (this.outputSize >= 7) this.mem3 = lerp(this.mem3, this.outputs[6], 0.65);
    }
    this.painTrace *= 0.88;

    for (let h = 0; h < this.hidden1Size; h++) {
      const rowOffset = h * MAX_INPUTS, hAct = this.hidden1[h];
      for (let i = 0; i < this.inputSize; i++) {
        const idx = rowOffset + i;
        this.trace1[idx] = this.trace1[idx] * 0.82 + hAct * this.inputs[i];
      }
    }

    if (this.hasDeepLayer) {
      for (let d = 0; d < this.hidden2Size; d++) {
        const rowOffset = d * MAX_HIDDEN1, dAct = this.hidden2[d];
        for (let h = 0; h < this.hidden1Size; h++) {
          const idx = rowOffset + h;
          this.traceDeep[idx] = this.traceDeep[idx] * 0.82 + dAct * this.hidden1[h];
        }
      }
      for (let o = 0; o < this.outputSize; o++) {
        const rowOffset = o * MAX_HIDDEN2, oAct = this.outputs[o];
        for (let d = 0; d < this.hidden2Size; d++) {
          const idx = rowOffset + d;
          this.traceOutDeep[idx] = this.traceOutDeep[idx] * 0.82 + oAct * this.hidden2[d];
        }
      }
    } else {
      for (let o = 0; o < this.outputSize; o++) {
        const rowOffset = o * MAX_HIDDEN1, oAct = this.outputs[o];
        for (let h = 0; h < this.hidden1Size; h++) {
          const idx = rowOffset + h;
          this.trace2[idx] = this.trace2[idx] * 0.82 + oAct * this.hidden1[h];
        }
      }
    }

    return this.outputs.subarray(0, this.outputSize);
  }

  adaptPlasticity(reward, plasticityRate = 0.06) {
    if (plasticityRate <= 0.001 || Math.abs(reward) < 0.005) return;
    const lr = clamp(reward, -1.0, 1.0) * plasticityRate * 0.12, decay = 0.9992;
    for (let h = 0; h < this.hidden1Size; h++) {
      const rowOffset = h * MAX_INPUTS;
      for (let i = 0; i < this.inputSize; i++) {
        const idx = rowOffset + i;
        this.W1[idx] = clamp(this.W1[idx] * decay + lr * this.trace1[idx], -3.8, 3.8);
      }
    }

    if (this.hasDeepLayer) {
      for (let d = 0; d < this.hidden2Size; d++) {
        const rowOffset = d * MAX_HIDDEN1;
        for (let h = 0; h < this.hidden1Size; h++) {
          const idx = rowOffset + h;
          this.WDeep[idx] = clamp(this.WDeep[idx] * decay + lr * this.traceDeep[idx], -3.8, 3.8);
        }
      }
      for (let o = 0; o < this.outputSize; o++) {
        const rowOffset = o * MAX_HIDDEN2;
        for (let d = 0; d < this.hidden2Size; d++) {
          const idx = rowOffset + d;
          this.WOutDeep[idx] = clamp(this.WOutDeep[idx] * decay + lr * this.traceOutDeep[idx], -3.8, 3.8);
        }
      }
    } else {
      for (let o = 0; o < this.outputSize; o++) {
        const rowOffset = o * MAX_HIDDEN1;
        for (let h = 0; h < this.hidden1Size; h++) {
          const idx = rowOffset + h;
          this.W2[idx] = clamp(this.W2[idx] * decay + lr * this.trace2[idx], -3.8, 3.8);
        }
      }
    }
  }

  registerPain(trauma = 0.4) { this.painTrace = clamp(this.painTrace + trauma, 0, 1); }

  addNeuronMutation() {
    if (this.hidden1Size < MAX_HIDDEN1) {
      this.hidden1Size++;
    } else if (!this.hasDeepLayer) {
      this.hasDeepLayer = true;
      this.hidden2Size = 6;
    } else if (this.hidden2Size < MAX_HIDDEN2) {
      this.hidden2Size++;
    }
  }

  mutate(rate = 0.1) {
    if (Math.random() < rate * 0.35) this.addNeuronMutation();
    const mutWeight = (w) => {
      if (Math.random() < rate) {
        let delta = gaussian() * rate * 0.55;
        if (Math.random() < 0.04) delta *= 3.2;
        return clamp(w + delta, -3.8, 3.8);
      }
      return w;
    };
    for (let i = 0; i < this.W1.length; i++) this.W1[i] = mutWeight(this.W1[i]);
    for (let i = 0; i < this.B1.length; i++) this.B1[i] = mutWeight(this.B1[i]);
    for (let i = 0; i < this.WDeep.length; i++) this.WDeep[i] = mutWeight(this.WDeep[i]);
    for (let i = 0; i < this.BDeep.length; i++) this.BDeep[i] = mutWeight(this.BDeep[i]);
    for (let i = 0; i < this.W2.length; i++) this.W2[i] = mutWeight(this.W2[i]);
    for (let i = 0; i < this.WOutDeep.length; i++) this.WOutDeep[i] = mutWeight(this.WOutDeep[i]);
    for (let i = 0; i < this.B2.length; i++) this.B2[i] = mutWeight(this.B2[i]);
  }

  crossover(otherBrain, mutRate = 0.1) {
    const inputCount = Math.max(this.inputSize, otherBrain.inputSize);
    const h1Count = Math.random() < 0.5 ? this.hidden1Size : otherBrain.hidden1Size;
    const outCount = Math.max(this.outputSize, otherBrain.outputSize);
    const deepFlag = (this.hasDeepLayer || otherBrain.hasDeepLayer) ? (Math.random() < 0.7) : false;
    const h2Count = Math.max(this.hidden2Size, otherBrain.hidden2Size);

    const child = new NEATBrain(inputCount, h1Count, outCount, deepFlag, h2Count);
    for (let i = 0; i < this.W1.length; i++) child.W1[i] = Math.random() < 0.5 ? this.W1[i] : otherBrain.W1[i];
    for (let i = 0; i < this.B1.length; i++) child.B1[i] = Math.random() < 0.5 ? this.B1[i] : otherBrain.B1[i];
    for (let i = 0; i < this.WDeep.length; i++) child.WDeep[i] = Math.random() < 0.5 ? this.WDeep[i] : otherBrain.WDeep[i];
    for (let i = 0; i < this.BDeep.length; i++) child.BDeep[i] = Math.random() < 0.5 ? this.BDeep[i] : otherBrain.BDeep[i];
    for (let i = 0; i < this.W2.length; i++) child.W2[i] = Math.random() < 0.5 ? this.W2[i] : otherBrain.W2[i];
    for (let i = 0; i < this.WOutDeep.length; i++) child.WOutDeep[i] = Math.random() < 0.5 ? this.WOutDeep[i] : otherBrain.WOutDeep[i];
    for (let i = 0; i < this.B2.length; i++) child.B2[i] = Math.random() < 0.5 ? this.B2[i] : otherBrain.B2[i];

    child.mutate(mutRate);
    return child;
  }

  clone() {
    const n = new NEATBrain(this.inputSize, this.hidden1Size, this.outputSize, this.hasDeepLayer, this.hidden2Size);
    n.W1.set(this.W1); n.B1.set(this.B1);
    n.WDeep.set(this.WDeep); n.BDeep.set(this.BDeep);
    n.W2.set(this.W2); n.WOutDeep.set(this.WOutDeep); n.B2.set(this.B2);
    n.mem1 = this.mem1; n.mem2 = this.mem2; n.mem3 = this.mem3; n.painTrace = this.painTrace;
    return n;
  }

  reset() {
    this.randomize(0.82);
    this.mem1 = 0; this.mem2 = 0; this.mem3 = 0; this.painTrace = 0;
  }

  prune(threshold = 0.08) {
    for (let i = 0; i < this.W1.length; i++) if (Math.abs(this.W1[i]) < threshold) this.W1[i] = 0;
    for (let i = 0; i < this.WDeep.length; i++) if (Math.abs(this.WDeep[i]) < threshold) this.WDeep[i] = 0;
    for (let i = 0; i < this.W2.length; i++) if (Math.abs(this.W2[i]) < threshold) this.W2[i] = 0;
    for (let i = 0; i < this.WOutDeep.length; i++) if (Math.abs(this.WOutDeep[i]) < threshold) this.WOutDeep[i] = 0;
  }
}

// =====================================================================
// 6. ORGANISM & MITOSIS CYCLE
// =====================================================================

let ORG_ID_COUNTER = 1;
class Organism {
  constructor(x, y, genome, energy, generation, lineageId, brain, parentId) {
    this.id = ORG_ID_COUNTER++;
    this.x = x; this.y = y; this.vx = 0; this.vy = 0;
    this.facingAngle = Math.random() * Math.PI * 2;
    this.genome = genome;
    this.anomaly = genome.anomaly || GENETIC_ANOMALIES.NONE;

    let sizeMultiplier = 1.0;
    if (this.anomaly === GENETIC_ANOMALIES.TITAN) sizeMultiplier = 1.9;

    this.maxEnergy = (40 + genome.size * 60) * sizeMultiplier;
    this.energy = energy !== undefined ? energy : this.maxEnergy * 0.55;
    this.moisture = 100;
    this.age = 0; this.generation = generation || 1;
    this.lineageId = lineageId || this.id; this.parentId = parentId || 0;
    this.reproCooldown = 0; this.alive = true;

    this.mitosisPhase = 0;
    this.mitosisData = null;
    this.harpoonTarget = null;

    if (brain) {
      this.brain = brain.clone();
    } else {
      const inCount = genome.brainInputs || 16;
      const h1Count = genome.brainHidden1 || 10;
      const deepFlag = (genome.brainDeepLayers || 0) > 0.5;
      const outCount = genome.brainOutputs || 7;
      this.brain = new NEATBrain(inCount, h1Count, outCount, deepFlag, 6);
    }

    this.endosymbionts = [];
    if (Math.random() < 0.25 || (genome.endoCapacity > 0.4 && Math.random() < 0.6)) {
      this.endosymbionts.push(Math.random() < 0.5 ? 'chloroplast' : 'mitochondria');
    }

    this.nerveSignal = 0; this.colonySize = 1; this.colonyMemberCount = 1;
    this.colonyGroupId = 0; this.centroidX = x; this.centroidY = y;
    this.bondedPartners = []; this.role = 'unicellular';

    // V6 Morphological Body Segments
    this.segmentCount = Math.max(1, Math.min(8, Math.round(genome.segmentCount || 1)));
    this.segments = [];
    const baseR = 2.5 + genome.size * 2.6 * sizeMultiplier;
    const segSpacing = (baseR * 2) * 0.72;
    for (let i = 0; i < this.segmentCount; i++) {
      const taper = 1.0 - (i / Math.max(1, this.segmentCount)) * 0.45;
      const segR = Math.max(1.8, baseR * taper);
      this.segments.push({
        x: this.x - Math.cos(this.facingAngle) * i * segSpacing,
        y: this.y - Math.sin(this.facingAngle) * i * segSpacing,
        r: segR,
        angle: this.facingAngle,
      });
    }

    // V6 Element Interactions & Dynamics
    this.shellHardness = 0.25 + (genome.shellMineral || 0) * 0.45;
    this.mineralReserves = 0;
    this.isBurrowed = false;
    this.isSpurred = false;
    this.chromatophoreHue = genome.hue;
    this.vocalSignal = 0;
    this.limbPhase = Math.random() * Math.PI * 2;

    this.kills = 0; this.offspringCount = 0; this.lastVision = null;
    this._wanderAngle = Math.random() * Math.PI * 2;
  }

  get maxSpeed() {
    let speed = clamp(this.genome.speed / Math.sqrt(this.genome.size), 0.2, 3.4);
    if (this.role === 'motor') speed *= 1.4;
    if (this.endosymbionts.includes('mitochondria')) speed *= 1.25;
    if (this.anomaly === GENETIC_ANOMALIES.TITAN) speed *= 0.8;
    if (this.isSpurred) speed *= 1.5;
    if (this.isBurrowed) speed *= 0.25;
    return speed;
  }
  get eatRate() { return (0.016 + this.genome.size * 0.012) * (this.role === 'digestor' ? 1.5 : 1.0); }
  get metabolismBase() {
    let base = 0.01 + Math.pow(this.genome.size, 1.65) * 0.013;
    base *= (1.1 - this.genome.membrane * 0.25);
    if (this.role === 'shield') base *= 1.15;
    if (this.role === 'germ') base *= 0.82;
    if (this.anomaly === GENETIC_ANOMALIES.TITAN) base *= 0.75;
    if (this.isSpurred) base *= 1.4;
    return base;
  }
  get lifespan() {
    const titanBonus = this.anomaly === GENETIC_ANOMALIES.TITAN ? 400 : 0;
    return 550 + this.genome.size * 300 + titanBonus;
  }
  get reproduceThreshold() { return this.maxEnergy * (this.role === 'germ' ? 0.55 : 0.72); }
  get captureRadius() {
    let r = 3.8 + this.genome.size * 3.4;
    if (this.anomaly === GENETIC_ANOMALIES.TITAN) r *= 1.6;
    return r;
  }
  get effectiveSize() {
    let s = this.genome.size * this.colonySize;
    if (this.anomaly === GENETIC_ANOMALIES.TITAN) s *= 1.85;
    return s;
  }

  get appendagePairs() { return Math.max(0, Math.min(5, Math.round(this.genome.appendagePairs || 0))); }
  get appendagePhase() { return this.limbPhase; }
  set appendagePhase(v) { this.limbPhase = v; }
  get isSprinting() { return this.isSpurred; }
  get vocalization() { return this.vocalSignal; }

  scrapeStone(terrain) {
    if (!terrain) return;
    this.shellHardness = Math.min(1.0, this.shellHardness + 0.05 * (this.genome.shellMineral || 0.5));
    this.energy = Math.min(this.maxEnergy, this.energy + 0.05);
  }

  burrowInMud(terrain, state = true) {
    if (!terrain) {
      this.isBurrowed = state;
      return;
    }
    const mat = terrain.getMaterial(this.x, this.y);
    if (mat === TERRAIN_TYPES.MUD || mat === TERRAIN_TYPES.LAND) {
      this.isBurrowed = state;
    }
  }

  _updateSegments() {
    if (this.segments && this.segments.length > 0) {
      this.segments[0].x = this.x;
      this.segments[0].y = this.y;
      this.segments[0].angle = this.facingAngle;

      for (let s = 1; s < this.segments.length; s++) {
        const prev = this.segments[s - 1];
        const cur = this.segments[s];

        const dx = cur.x - prev.x;
        const dy = cur.y - prev.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        const targetDist = (prev.r + cur.r) * 0.72;

        cur.x = prev.x + (dx / d) * targetDist;
        cur.y = prev.y + (dy / d) * targetDist;
        cur.angle = Math.atan2(prev.y - cur.y, prev.x - cur.x);
      }
    }
  }

  updateRole(clusterMembers) {
    if (!clusterMembers || clusterMembers.length < 2) {
      this.role = 'unicellular'; this.bondedPartners = []; return;
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

  perceive(foodGrid, spatialHash, W, H, terrain, floraManager, carcassManager, weatherManager = null) {
    const vision = castCompoundVision(this, spatialHash, foodGrid, terrain, W, H, floraManager, carcassManager);
    this.lastVision = vision;

    const rays = vision.rays;
    let threatAlert = 0;
    for (let r = 0; r < rays.length; r++) {
      if (rays[r].signature === HIT_TYPES.THREAT) threatAlert = Math.max(threatAlert, rays[r].proximity);
    }

    const hungerDrive = clamp(1.0 - (this.energy / this.maxEnergy), 0, 1);
    const thirstDrive = clamp(1.0 - (this.moisture / 100), 0, 1);
    const matingDrive = (this.energy > this.reproduceThreshold && this.reproCooldown === 0) ? 1.0 : 0.0;
    
    let matFriction = 0.94;
    let currentMaterial = TERRAIN_TYPES.WATER_DEEP;
    if (terrain) {
      currentMaterial = terrain.getMaterial(this.x, this.y);
      matFriction = terrain.getMaterialProps(this.x, this.y).friction;
    }

    const inputs = [
      rays[0] ? rays[0].signal : 0,
      rays[1] ? rays[1].signal : 0,
      rays[2] ? rays[2].signal : 0,
      rays[3] ? rays[3].signal : 0,
      rays[4] ? rays[4].signal : 0,
      vision.foodGradient,
      vision.toxinGradient,
      hungerDrive,
      thirstDrive,
      threatAlert,
      matingDrive,
      matFriction,
      this.brain.mem1,
      this.brain.mem2,
      this.brain.mem3,
      this.brain.painTrace,
    ];

    if (this.brain.inputSize > 16) {
      let acousticResonance = 0;
      if (spatialHash) {
        const neighbors = spatialHash.query(this.x, this.y, 130);
        for (let i = 0; i < neighbors.length; i++) {
          const other = neighbors[i];
          if (other === this || !other.alive) continue;
          if (other.vocalSignal > 0.1) {
            const d = Math.sqrt(dist2(this.x, this.y, other.x, other.y)) || 1;
            acousticResonance += (other.vocalSignal * (1.0 - d / 130));
          }
        }
      }
      inputs.push(clamp(acousticResonance, 0, 1));

      let baro = 0;
      if (weatherManager) baro = clamp(weatherManager.getMoistureAt(this.x, this.y) - 1.0, -1, 1);
      inputs.push(baro);

      let thermal = 0.2;
      if (currentMaterial === TERRAIN_TYPES.ICE) thermal = -0.9;
      else if (currentMaterial === TERRAIN_TYPES.LAND) thermal = 0.5;
      inputs.push(thermal);

      let stoneSense = 0;
      if (terrain) {
        const stonesNear = terrain.queryStonesNear(this.x, this.y, 90);
        if (stonesNear.length > 0) stoneSense = clamp(1.0 - Math.sqrt(dist2(this.x, this.y, stonesNear[0].x, stonesNear[0].y)) / 90, 0, 1);
      }
      inputs.push(stoneSense);

      let kinDensity = 0;
      if (spatialHash) {
        const near = spatialHash.query(this.x, this.y, 80);
        let kinCount = 0;
        for (let i = 0; i < near.length; i++) if (near[i].genome.speciesName === this.genome.speciesName) kinCount++;
        kinDensity = clamp(kinCount / 6, 0, 1);
      }
      inputs.push(kinDensity);

      const currentDrift = currentMaterial === TERRAIN_TYPES.WATER_DEEP ? Math.sin(this.y * 0.01) : 0;
      inputs.push(currentDrift);

      let floraProximity = 0;
      if (floraManager) {
        const nearFlora = floraManager.queryNear(this.x, this.y, 70);
        if (nearFlora.length > 0) floraProximity = clamp(nearFlora.length / 4, 0, 1);
      }
      inputs.push(floraProximity);

      let carcassScent = 0;
      if (carcassManager) {
        const nearCarcass = carcassManager.queryNear(this.x, this.y, 100);
        if (nearCarcass.length > 0) carcassScent = 0.8;
      }
      inputs.push(carcassScent);
    }

    return inputs;
  }

  tick(arg1, arg2, terrain = null, W = 4000, H = 3000, tempFactor = 1.0, floraManager = null, carcassManager = null, weatherManager = null) {
    let foodGrid = arg1;
    let spatialHash = arg2;
    if (arg1 && typeof arg1.query === 'function') {
      spatialHash = arg1;
      foodGrid = arg2;
    }
    return this.step(foodGrid, spatialHash, W, H, tempFactor, terrain, floraManager, carcassManager, weatherManager);
  }

  step(foodGrid, spatialHash, W, H, tempFactor = 1.0, terrain, floraManager, carcassManager, weatherManager) {
    if (!this.alive) return null;

    if (this.harpoonTarget) {
      this.harpoonTarget.timer--;
      if (this.harpoonTarget.timer <= 0) this.harpoonTarget = null;
    }

    let spawnedChild = null;
    if (this.mitosisPhase > 0) {
      this.mitosisPhase++;
      this.vx *= 0.65; this.vy *= 0.65;
      if (this.mitosisPhase >= 40) {
        if (this.mitosisData) {
          const angle = this.facingAngle + (Math.random() - 0.5) * 0.8;
          const distOffset = this.effectiveSize * 2.2;
          const cx = (this.x + Math.cos(angle) * distOffset + W) % W;
          const cy = (this.y + Math.sin(angle) * distOffset + H) % H;
          const energyAlloc = this.energy * 0.45;
          this.energy *= 0.52;
          this.reproCooldown = 55 + Math.floor(this.genome.size * 18);
          this.offspringCount++;

          spawnedChild = new Organism(
            cx, cy, this.mitosisData.childGenome, energyAlloc,
            this.generation + 1, this.lineageId, this.mitosisData.childBrain, this.id
          );
        }
        this.mitosisPhase = 0;
        this.mitosisData = null;
      }
      return spawnedChild;
    }

    const envInputs = this.perceive(foodGrid, spatialHash, W, H, terrain, floraManager, carcassManager, weatherManager);
    const outputs = this.brain.forward(envInputs);

    let thrust = outputs[0], turn = outputs[1];
    const attackImpulse = outputs[2], colonyImpulse = outputs[3];

    this.vocalSignal = outputs.length > 7 ? clamp(outputs[7], 0, 1) : 0;
    const sprintImpulse = outputs.length > 8 ? outputs[8] : 0;
    const burrowImpulse = outputs.length > 9 ? outputs[9] : 0;
    const chromaShift = outputs.length > 10 ? outputs[10] : 0;

    this.isSpurred = (sprintImpulse > 0.68 && this.energy > 12);
    if (this.isSpurred) this.energy -= 0.028;

    if (Math.abs(thrust) < 0.1 && Math.abs(turn) < 0.1) {
      this._wanderAngle += (Math.random() - 0.5) * 0.4;
      thrust = 0.45; turn = Math.sin(this._wanderAngle) * 0.3;
    }

    let mat = TERRAIN_TYPES.WATER_DEEP, matProps = MATERIAL_PROPERTIES[TERRAIN_TYPES.WATER_DEEP];
    if (terrain) {
      mat = terrain.getMaterial(this.x, this.y);
      matProps = terrain.getMaterialProps(this.x, this.y);
    }

    this.isBurrowed = (burrowImpulse > 0.55 && (mat === TERRAIN_TYPES.MUD || mat === TERRAIN_TYPES.LAND));
    if (this.isBurrowed && mat === TERRAIN_TYPES.MUD) {
      this.energy = Math.min(this.maxEnergy, this.energy + 0.038);
    }

    if (chromaShift !== 0) {
      let targetHue = this.genome.hue;
      if (mat === TERRAIN_TYPES.MUD) targetHue = 35;
      else if (mat === TERRAIN_TYPES.WATER_SHALLOW) targetHue = 180;
      else if (mat === TERRAIN_TYPES.LAND) targetHue = 95;
      else if (mat === TERRAIN_TYPES.ICE) targetHue = 205;
      this.chromatophoreHue = lerp(this.chromatophoreHue, targetHue, 0.08);
    } else {
      this.chromatophoreHue = lerp(this.chromatophoreHue, this.genome.hue, 0.04);
    }

    if (mat === TERRAIN_TYPES.WATER_DEEP || mat === TERRAIN_TYPES.WATER_SHALLOW) {
      this.moisture = Math.min(100, this.moisture + matProps.moistureReplenish);
    } else if (mat === TERRAIN_TYPES.MUD) {
      this.moisture = Math.min(100, this.moisture + matProps.moistureReplenish);
      this.energy = Math.min(this.maxEnergy, this.energy + 0.035);
    } else if (mat === TERRAIN_TYPES.LAND) {
      let rainBonus = 0;
      if (weatherManager) {
        const moist = weatherManager.getMoistureAt(this.x, this.y);
        if (moist > 1.2) rainBonus = 0.28 * (moist - 1.0);
      }
      const loss = (0.14 - rainBonus) * (1.0 - (this.genome.moistureRetention || 0) * 0.86);
      if (loss > 0) this.moisture = Math.max(0, this.moisture - loss);
      else this.moisture = Math.min(100, this.moisture - loss);

      if (this.moisture <= 0) {
        this.energy -= 0.18;
        this.brain.registerPain(0.35);
        this.brain.adaptPlasticity(-0.2, this.genome.plasticity);
      }
    } else if (mat === TERRAIN_TYPES.ICE) {
      this.moisture = Math.max(0, this.moisture - 0.05);
      const coldResist = this.genome.thermalTolerance || 0;
      if (coldResist < 0.45) {
        this.energy -= 0.12 * (0.45 - coldResist);
        this.brain.registerPain(0.15);
      }
    }

    const isWater = (mat === TERRAIN_TYPES.WATER_DEEP || mat === TERRAIN_TYPES.WATER_SHALLOW);
    const crawlGene = this.genome.locomotionType || 0;
    let locoEfficiency = isWater ? (1.18 - crawlGene * 0.48) : (0.28 + crawlGene * 1.15);

    const turnRate = 0.24 * (0.8 + (1 - this.genome.size / 4) * 0.4);
    this.facingAngle = (this.facingAngle + turn * turnRate + Math.PI * 2) % (Math.PI * 2);

    const forwardSpeed = Math.max(-0.25, thrust) * this.maxSpeed * locoEfficiency;
    const ax = Math.cos(this.facingAngle) * forwardSpeed * 0.38;
    const ay = Math.sin(this.facingAngle) * forwardSpeed * 0.38;
    this.vx = (this.vx + ax) * matProps.friction;
    this.vy = (this.vy + ay) * matProps.friction;

    this.nerveSignal = clamp(attackImpulse + colonyImpulse, 0, 1);
    const REST_LENGTH = 14, STIFFNESS = 0.08, DAMPING = 0.04;

    for (let i = 0; i < this.bondedPartners.length; i++) {
      const partner = this.bondedPartners[i];
      if (!partner.alive) continue;
      const dx = partner.x - this.x, dy = partner.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const delta = dist - REST_LENGTH;
      const springF = delta * STIFFNESS;
      const nx = dx / dist, ny = dy / dist;
      const relVx = partner.vx - this.vx, relVy = partner.vy - this.vy;
      const totalF = springF + (relVx * nx + relVy * ny) * DAMPING;
      this.vx += nx * totalF; this.vy += ny * totalF;

      if (this.nerveSignal > 0.4 && partner.nerveSignal < 0.4) partner.nerveSignal = this.nerveSignal * 0.85;
      if (this.role === 'digestor' && this.energy > this.maxEnergy * 0.6 && partner.energy < partner.maxEnergy * 0.5) {
        this.energy -= 0.12; partner.energy += 0.12;
      }
    }

    if (mat === TERRAIN_TYPES.WATER_DEEP) this.vx += Math.sin(this.y * 0.01) * 0.06;

    if (terrain) {
      const col = terrain.resolveStoneCollision(this.x, this.y, this.effectiveSize, this.vx, this.vy);
      this.x = col.x; this.y = col.y; this.vx = col.vx; this.vy = col.vy;
      if (col.collided) {
        this.brain.registerPain(0.12);
        this.shellHardness = Math.min(1.0, this.shellHardness + 0.003 * (this.genome.shellMineral || 0.5));
        this.energy = Math.min(this.maxEnergy, this.energy + 0.02);
      }
    }

    this.x = (this.x + this.vx + W) % W;
    this.y = (this.y + this.vy + H) % H;

    // V6 Segment Articulated Spine Kinematics
    this._updateSegments();

    const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    this.limbPhase = (this.limbPhase + currentSpeed * 0.55 + 0.05) % (Math.PI * 2);

    if (this.endosymbionts.includes('chloroplast') && foodGrid && foodGrid.lightFactor(this.y / 40) > 0.3) {
      this.energy = Math.min(this.maxEnergy, this.energy + 0.085 * foodGrid.lightFactor(this.y / 40));
    }
    if (foodGrid && (this.role === 'toxin' || this.genome.toxinGene > 0.4) && Math.random() < 0.15) {
      foodGrid.depositToxin(this.x, this.y, 0.22 * this.genome.toxinGene);
    }

    if (floraManager && this.genome.diet < 0.45 && this.energy < this.maxEnergy * 0.96) {
      const nearbyFlora = floraManager.queryNear(this.x, this.y, this.captureRadius * 1.6);
      if (nearbyFlora.length > 0) {
        const plant = nearbyFlora[0];
        const grazed = plant.graze(0.35 + this.genome.size * 0.25);
        if (grazed > 0) {
          this.energy = Math.min(this.maxEnergy, this.energy + grazed * 2.2);
          this.brain.adaptPlasticity(0.18, this.genome.plasticity);
        }
      }
    }

    if (carcassManager && this.energy < this.maxEnergy * 0.95) {
      const nearbyCarcasses = carcassManager.queryNear(this.x, this.y, this.captureRadius * 1.8);
      if (nearbyCarcasses.length > 0) {
        const carrion = nearbyCarcasses[0];
        const meat = carrion.scavenge(0.4 + this.genome.size * 0.3);
        if (meat > 0) {
          this.energy = Math.min(this.maxEnergy, this.energy + meat * clamp(0.4 + this.genome.diet * 0.8, 0.4, 1.2));
          this.brain.adaptPlasticity(0.28, this.genome.plasticity);
        }
      }
    }

    if (foodGrid && this.energy < this.maxEnergy * 0.98) {
      const eaten = foodGrid.eat(this.x, this.y, this.eatRate);
      if (eaten > 0) {
        this.energy = Math.min(this.maxEnergy, this.energy + eaten * 44 * (1 - this.genome.diet * 0.42));
        this.brain.adaptPlasticity(0.12, this.genome.plasticity);
      }
    }

    if (attackImpulse > 0.35 && this.genome.diet > 0.12 && this.energy < this.maxEnergy * 0.95) {
      const neighbors = spatialHash.query(this.x, this.y, this.captureRadius * 2.4);
      for (let i = 0; i < neighbors.length; i++) {
        const other = neighbors[i];
        if (other === this || !other.alive) continue;
        const d2 = dist2(this.x, this.y, other.x, other.y);

        if (d2 <= Math.pow(this.captureRadius * 2.4, 2)) {
          this.harpoonTarget = { x: other.x, y: other.y, timer: 7 };
        }

        if (d2 <= this.captureRadius * this.captureRadius) {
          const sameLineage = hueDiff(this.genome.hue, other.genome.hue) < 12;
          if (!sameLineage && other.effectiveSize * 1.08 < this.effectiveSize) {
            let selfPower = this.genome.aggression * 0.4 + (this.effectiveSize - other.effectiveSize) * 0.06;
            let defenderPower = other.genome.membrane * 0.35 + other.shellHardness * 0.4 + other.genome.aggression * 0.15;
            if (other.isBurrowed) defenderPower *= 1.7;
            if (other.role === 'shield') defenderPower *= 1.8;
            if (other.role === 'toxin' || other.genome.toxinGene > 0.4) {
              this.energy *= 0.85; this.brain.registerPain(0.4);
            }

            if (other.anomaly === GENETIC_ANOMALIES.SPIKED_CARAPACE || other.shellHardness > 0.75) {
              this.energy -= 0.25 * other.effectiveSize;
              this.brain.registerPain(0.45);
            }

            if (Math.random() < clamp(0.44 + selfPower - defenderPower, 0.05, 0.92)) {
              this.energy = Math.min(this.maxEnergy, this.energy + other.energy * 0.65 * clamp(0.35 + this.genome.diet * 0.85, 0.35, 1.0));
              other.alive = false;
              other.brain.registerPain(0.8);
              other.brain.adaptPlasticity(-0.5, other.genome.plasticity);
              this.kills++;
              this.brain.adaptPlasticity(0.5, this.genome.plasticity);
            }
          }
        }
      }
    }

    this.energy -= (this.metabolismBase + currentSpeed * 0.032) * tempFactor;
    this.age++;
    if (this.reproCooldown > 0) this.reproCooldown--;
    return null;
  }
}

// =====================================================================
// 7. FOOD GRID & ENVIRONMENT
// =====================================================================

class FoodGrid {
  constructor(width, height, cellSize = 40, terrain = null) {
    this.width = width; this.height = height; this.cellSize = cellSize;
    this.cols = Math.ceil(width / cellSize); this.rows = Math.ceil(height / cellSize);
    this.density = new Float32Array(this.cols * this.rows);
    this.pheromones = new Float32Array(this.cols * this.rows);
    this.toxins = new Float32Array(this.cols * this.rows);
    this.vents = []; this.terrain = terrain;
    this.o2Level = 0.05; this.co2Level = 0.85; this.h2sLevel = 0.65;
    this.currentEra = 'Hadean Volcanic';

    for (let i = 0; i < this.density.length; i++) {
      this.density[i] = 0.18 + Math.random() * 0.22;
    }
    for (let i = 0; i < 12; i++) {
      this.vents.push({
        cx: Math.floor(Math.random() * this.cols),
        cy: Math.floor((0.55 + Math.random() * 0.4) * this.rows),
        r: 3.5 + Math.random() * 4.0,
        heat: 0.85 + Math.random() * 0.45,
      });
    }
  }

  idx(cx, cy) { return cy * this.cols + cx; }
  cellAt(x, y) {
    return {
      cx: clamp(Math.floor(x / this.cellSize), 0, this.cols - 1),
      cy: clamp(Math.floor(y / this.cellSize), 0, this.rows - 1),
    };
  }

  lightFactor(cy, tickCount = 0) {
    const iceBlock = this.currentEra === 'Proterozoic Snowball' ? 0.35 : 1.0;
    const dayNightOscillation = 0.3 + 0.7 * Math.pow(Math.sin((tickCount * Math.PI) / 120), 2);
    const depthFactor = 0.25 + 0.75 * (1 - cy / this.rows);
    return dayNightOscillation * depthFactor * iceBlock;
  }

  grow(growthRate = 0.012, tickCount = 0) {
    const { cols, rows, density, pheromones, toxins, terrain } = this;
    for (let cy = 0; cy < rows; cy++) {
      const light = this.lightFactor(cy, tickCount);
      const rowBase = cy * cols;
      for (let cx = 0; cx < cols; cx++) {
        const i = rowBase + cx;
        let d = density[i];
        let soilMult = 1.0;
        if (terrain) {
          const mat = terrain.materials[terrain.idx(
            clamp(Math.floor((cx / cols) * terrain.cols), 0, terrain.cols - 1),
            clamp(Math.floor((cy / rows) * terrain.rows), 0, terrain.rows - 1)
          )];
          if (mat === 3) soilMult = 1.8;
          else if (mat === 4) soilMult = 0.2;
          else if (mat === 2) soilMult = 1.2;
        }
        density[i] = clamp(d + growthRate * light * soilMult * d * (1 - d) + growthRate * 0.02 * light, 0, 1);
        pheromones[i] *= 0.95; toxins[i] *= 0.93;
      }
    }
    for (const v of this.vents) {
      for (let dy = -v.r; dy <= v.r; dy++) {
        for (let dx = -v.r; dx <= v.r; dx++) {
          const cx = v.cx + dx, cy = v.cy + dy;
          if (cx < 0 || cy < 0 || cx >= cols || cy >= rows) continue;
          if (dx * dx + dy * dy > v.r * v.r) continue;
          const i = this.idx(cx, cy);
          if (density[i] < 0.75) density[i] = Math.min(0.75, density[i] + 0.042 * v.heat);
        }
      }
    }
  }

  eat(x, y, amount) {
    const { cx, cy } = this.cellAt(x, y);
    const i = this.idx(cx, cy);
    const taken = Math.min(this.density[i], amount);
    this.density[i] -= taken;
    return taken;
  }
  deposit(x, y, amount) {
    const { cx, cy } = this.cellAt(x, y);
    const i = this.idx(cx, cy);
    this.density[i] = Math.min(1, this.density[i] + amount);
  }
  depositToxin(x, y, amount) {
    const { cx, cy } = this.cellAt(x, y);
    const i = this.idx(cx, cy);
    this.toxins[i] = Math.min(1.0, this.toxins[i] + amount);
  }
  toxinAt(x, y) {
    const { cx, cy } = this.cellAt(x, y);
    return this.toxins[this.idx(cx, cy)];
  }
  coverage() {
    let sum = 0;
    for (let i = 0; i < this.density.length; i++) sum += this.density[i];
    return sum / this.density.length;
  }
}

// =====================================================================
// 8. WORLD ENGINE
// =====================================================================

class SpatialHash {
  constructor(width, height, cellSize = 60) {
    this.cellSize = cellSize;
    this.cols = Math.ceil(width / cellSize); this.rows = Math.ceil(height / cellSize);
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
        if (arr) for (let i = 0; i < arr.length; i++) result.push(arr[i]);
      }
    }
    return result;
  }
}

class World {
  constructor(opts = {}) {
    this.width = opts.width || 4000; this.height = opts.height || 3000;
    this.terrain = opts.terrain || new TerrainGrid(this.width, this.height, 40);
    this.food = new FoodGrid(this.width, this.height, opts.foodCell || 40, this.terrain);

    this.flora = new FloraManager(this.width, this.height, 100);
    this.carcasses = new CarcassManager(this.width, this.height, 100);
    this.weather = new WeatherManager(this.width, this.height);
    this.flora.seedInitialFlora(this.terrain, 200);

    this.organisms = []; this.tickCount = 0; this.MULTICELLULAR_THRESHOLD = 7;
    this.cladeTree = new Map(); this.fossilRecord = [];
    this.mutagenSpots = [];
    this.params = Object.assign({
      foodGrowth: 0.012, mutationRate: 0.1, tempFactor: 1.0, maxPopulation: 450, sexualRatio: 0.35,
    }, opts.params || {});

    this.events = [];
    this.stats = {
      population: 0, species: 0, colonies: 0, multicellular: 0,
      terrestrial: 0, amphibious: 0, avgMoisture: 100,
      floraCount: 0, carcasses: 0, weatherFronts: 0,
      diurnalPhase: 0, dayNightCycle: 'Day',
      avgSegments: 1, segmentedCount: 0, deepBrains: 0, anomalies: 0, mutagenSpots: 0,
      avgSize: 0, avgSpeed: 0, herbivores: 0, carnivores: 0,
      foodCoverage: 0, maxGeneration: 1, topSpecies: 'None',
      era: 'Hadean Volcanic', o2: '5%', co2: '85%'
    };
    this.history = []; this._extinctFor = 0; this._lastNaturalistReport = 0; this._firstLandfall = false;
  }

  addMutagenSpot(x, y, radius = 140) {
    this.mutagenSpots.push({ x, y, radius, intensity: 3.2, lifetime: 900 });
    if (this.mutagenSpots.length > 8) this.mutagenSpots.shift();
  }

  getMutagenMultiplierAt(x, y) {
    let mult = 1.0;
    for (let i = 0; i < this.mutagenSpots.length; i++) {
      const spot = this.mutagenSpots[i];
      if (dist2(x, y, spot.x, spot.y) < spot.radius * spot.radius) {
        mult = Math.max(mult, spot.intensity);
      }
    }
    return mult;
  }

  get diurnalPhase() {
    return Math.sin((this.tickCount * Math.PI) / 120);
  }

  get isNight() {
    return this.diurnalPhase < 0.2;
  }

  registerSpecies(speciesName, parentName, hue) {
    if (!this.cladeTree.has(speciesName)) {
      this.cladeTree.set(speciesName, {
        name: speciesName, parentName: parentName || 'Abiogenesis',
        originTick: this.tickCount, hue: hue || 180, count: 0, totalEver: 0, extinct: false,
      });
    }
  }

  seed(count = 70) {
    const ancestorGenome = {
      size: 0.85, speed: 0.9, sense: 55, diet: 0.05, aggression: 0.08, colony: 0.15, membrane: 0.5,
      plasticity: 0.45, pheromoneRate: 0.2, toxinGene: 0.1, endoCapacity: 0.5,
      moistureRetention: 0.15, locomotionType: 0.12, thermalTolerance: 0.4,
      visionFov: 120, visionRange: 90, mutationRate: 0.1, hue: Math.random() * 360,
    };
    ancestorGenome.speciesName = generateSpeciesName(ancestorGenome);
    this.registerSpecies(ancestorGenome.speciesName, 'Abiogenesis', ancestorGenome.hue);

    for (let i = 0; i < count; i++) {
      const g = mutateGenome(ancestorGenome, 0.08);
      this.registerSpecies(g.speciesName, ancestorGenome.speciesName, g.hue);
      let x = Math.random() * this.width, y = Math.random() * this.height;
      for (let attempt = 0; attempt < 15; attempt++) {
        const mat = this.terrain.getMaterial(x, y);
        if (mat === TERRAIN_TYPES.WATER_DEEP || mat === TERRAIN_TYPES.WATER_SHALLOW || mat === TERRAIN_TYPES.MUD) break;
        x = Math.random() * this.width; y = Math.random() * this.height;
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
    for (const o of this.organisms) {
      if (Math.random() < fraction) {
        o.alive = false;
        this.carcasses.addCarcassFromOrganism(o);
      }
    }
  }

  tick() {
    const W = this.width, H = this.height, p = this.params;
    this.weather.tick();
    const netO2 = this.flora.tick(this.food, this.terrain, this.weather, this.tickCount);
    this.food.o2Level = clamp(this.food.o2Level + netO2 * 0.05, 0.02, 0.98);
    this.carcasses.tick(this.food, this.tickCount);
    this.food.grow(p.foodGrowth, this.tickCount);

    const hash = new SpatialHash(W, H, 60);
    const alive = [];
    for (let i = 0; i < this.organisms.length; i++) {
      const o = this.organisms[i];
      if (o.alive) { alive.push(o); hash.insert(o); }
    }

    // Step organisms
    const newborns = [];
    for (let i = 0; i < alive.length; i++) {
      const o = alive[i];
      const child = o.step(this.food, hash, W, H, p.tempFactor, this.terrain, this.flora, this.carcasses, this.weather);
      if (child) {
        this.registerSpecies(child.genome.speciesName, o.genome.speciesName, child.genome.hue);
        newborns.push(child);
      }
    }

    // Lifecycle & Mitosis
    for (let i = 0; i < alive.length; i++) {
      const o = alive[i];
      if (!o.alive) { this.carcasses.addCarcassFromOrganism(o); continue; }

      if (o.energy <= 0 || o.age > o.lifespan) {
        o.alive = false;
        this.carcasses.addCarcassFromOrganism(o);
        continue;
      }

      if (o.mitosisPhase === 0 && o.energy >= o.reproduceThreshold && o.reproCooldown <= 0 && (alive.length + newborns.length) < p.maxPopulation) {
        let childGenome, childBrain, isSexual = false;
        const mutagenMult = this.getMutagenMultiplierAt(o.x, o.y);

        if (Math.random() < p.sexualRatio) {
          const neighbors = hash.query(o.x, o.y, 28);
          for (let j = 0; j < neighbors.length; j++) {
            const partner = neighbors[j];
            if (partner === o || !partner.alive || partner.reproCooldown > 0) continue;
            if (partner.energy >= partner.reproduceThreshold * 0.75 && hueDiff(o.genome.hue, partner.genome.hue) < 35) {
              childGenome = crossoverGenome(o.genome, partner.genome, p.mutationRate, mutagenMult);
              childBrain = o.brain.crossover(partner.brain, p.mutationRate);
              partner.energy *= 0.65; partner.reproCooldown = 40; isSexual = true; break;
            }
          }
        }
        if (!isSexual) {
          childGenome = mutateGenome(o.genome, p.mutationRate, mutagenMult);
          childBrain = o.brain.clone();
          childBrain.mutate(p.mutationRate);
        }
        o.mitosisPhase = 1;
        o.mitosisData = { childGenome, childBrain };
      }
    }

    // Step mutagen spots
    for (let i = 0; i < this.mutagenSpots.length; i++) this.mutagenSpots[i].lifetime--;
    this.mutagenSpots = this.mutagenSpots.filter(s => s.lifetime > 0);

    this.organisms = alive.filter(o => o.alive).concat(newborns);
    this.tickCount++;

    if (this.organisms.length === 0) {
      this._extinctFor++;
      if (this._extinctFor > 80) { this.seed(35); this._extinctFor = 0; }
    } else { this._extinctFor = 0; }

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
    s.era = this.food.currentEra;
    s.o2 = (this.food.o2Level * 100).toFixed(0) + '%';
    s.co2 = (this.food.co2Level * 100).toFixed(0) + '%';
    s.floraCount = this.flora.floras.length;
    s.carcasses = this.carcasses.carcasses.length;
    s.weatherFronts = this.weather.fronts.length;
    s.diurnalPhase = this.diurnalPhase;
    s.dayNightCycle = this.isNight ? 'Night' : 'Day';

    for (const node of this.cladeTree.values()) node.count = 0;
    if (orgs.length === 0) {
      s.avgSegments = 1; s.segmentedCount = 0; s.deepBrains = 0; s.anomalies = 0;
      return;
    }

    let sumSize = 0, sumSpeed = 0, herb = 0, carn = 0, maxGen = 1;
    let terr = 0, amph = 0, sumMoist = 0;
    let sumSegments = 0, segmented = 0, deepBrains = 0, anomalyCount = 0;
    const hues = [];

    for (let i = 0; i < orgs.length; i++) {
      const o = orgs[i];
      sumSize += o.genome.size; sumSpeed += o.genome.speed; sumMoist += o.moisture;
      sumSegments += (o.segmentCount || 1);
      if ((o.segmentCount || 1) > 1) segmented++;
      if (o.brain && o.brain.hasDeepLayer) deepBrains++;
      if (o.anomaly && o.anomaly !== 'NONE') anomalyCount++;

      const mat = this.terrain.getMaterial(o.x, o.y);
      if ((mat === TERRAIN_TYPES.LAND || mat === TERRAIN_TYPES.MUD) && (o.genome.locomotionType || 0) > 0.45) terr++;
      if ((o.genome.locomotionType || 0) > 0.35 && (o.genome.moistureRetention || 0) > 0.35) amph++;
      if (o.genome.diet > 0.32) carn++; else herb++;
      if (o.generation > maxGen) maxGen = o.generation;
      hues.push(o.genome.hue);

      const sName = o.genome.speciesName || 'Unknown';
      if (!this.cladeTree.has(sName)) this.registerSpecies(sName, 'Unknown', o.genome.hue);
      this.cladeTree.get(sName).count++;
    }

    let topName = 'None', maxCount = 0;
    for (const node of this.cladeTree.values()) {
      if (node.count > maxCount) { maxCount = node.count; topName = node.name; }
    }

    hues.sort((a, b) => a - b);
    let clusters = hues.length ? 1 : 0;
    for (let i = 1; i < hues.length; i++) if (hues[i] - hues[i - 1] > 14) clusters++;

    s.species = clusters;
    s.terrestrial = terr;
    s.amphibious = amph;
    s.avgMoisture = Math.round(sumMoist / orgs.length);
    s.avgSegments = Number((sumSegments / orgs.length).toFixed(1));
    s.segmentedCount = segmented;
    s.deepBrains = deepBrains;
    s.anomalies = anomalyCount;
    s.mutagenSpots = this.mutagenSpots.length;
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
// 9. GRAPHICS & CANVAS OBSERVER LAYER
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

const world = new World({ width: 4000, height: 3000 });
world.seed(70);

let paused = false;
let ticksPerFrame = 1;
let selected = null;
let hovered = null;
let followMode = false;
let nightShaderEnabled = true;
let activeBrush = 'select'; // 'select', 'stone', 'mud', 'ice', 'land', 'water', 'kelp', 'moss', 'rain', 'food'

let camera = { x: world.width / 2, y: world.height / 2, zoom: 0.45 };
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
  const baseScale = Math.min(cw / 1200, ch / 800);
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

// Brush toolbar setup
const terrainToolbar = document.getElementById('terrainToolbar');
if (terrainToolbar) {
  terrainToolbar.addEventListener('click', (e) => {
    const btn = e.target.closest('.brush-btn');
    if (!btn) return;
    activeBrush = btn.dataset.brush;
    document.querySelectorAll('.brush-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
}

function applyBrush(wx, wy) {
  if (activeBrush === 'select') return;
  if (activeBrush === 'stone') world.terrain.addStone(wx, wy, 22 + Math.random() * 24);
  else if (activeBrush === 'mud') world.terrain.paintMaterial(wx, wy, 90, TERRAIN_TYPES.MUD);
  else if (activeBrush === 'ice') world.terrain.paintMaterial(wx, wy, 100, TERRAIN_TYPES.ICE);
  else if (activeBrush === 'land') world.terrain.paintMaterial(wx, wy, 110, TERRAIN_TYPES.LAND);
  else if (activeBrush === 'water') world.terrain.paintMaterial(wx, wy, 110, TERRAIN_TYPES.WATER_DEEP);
  else if (activeBrush === 'kelp') world.flora.addFlora(wx, wy, FLORA_TYPES.KELP, 20);
  else if (activeBrush === 'moss') world.flora.addFlora(wx, wy, FLORA_TYPES.MOSS, 16);
  else if (activeBrush === 'rain') world.weather.spawnStorm(WEATHER_TYPES.RAIN, wx, wy, 400);
  else if (activeBrush === 'food') world.food.deposit(wx, wy, 0.85);
  else if (activeBrush === 'mutagen') world.addMutagenSpot(wx, wy, 130);
}

// Stage Interactions
stage.addEventListener('mousedown', (e) => {
  if (e.target !== canvas) return;
  isDragging = true;
  dragStart = { x: e.clientX, y: e.clientY };
  if (activeBrush !== 'select') {
    const rect = canvas.getBoundingClientRect();
    const px = (e.clientX - rect.left) * (canvas.width / rect.width);
    const py = (e.clientY - rect.top) * (canvas.height / rect.height);
    const [wx, wy] = screenToWorld(px, py);
    applyBrush(wx, wy);
  }
});

stage.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const px = (e.clientX - rect.left) * (canvas.width / rect.width);
  const py = (e.clientY - rect.top) * (canvas.height / rect.height);
  const [wx, wy] = screenToWorld(px, py);

  let hBest = null, hD = 32 * 32;
  for (let i = 0; i < world.organisms.length; i++) {
    const o = world.organisms[i];
    const d2 = dist2(o.x, o.y, wx, wy);
    if (d2 < hD) { hD = d2; hBest = o; }
  }
  hovered = hBest;
  updateHoverTooltip(e.clientX, e.clientY);

  if (!isDragging) return;
  if (activeBrush !== 'select') { applyBrush(wx, wy); return; }

  const m = getMapping();
  camera.x -= (e.clientX - dragStart.x) * (canvas.width / stage.clientWidth) / m.scale;
  camera.y -= (e.clientY - dragStart.y) * (canvas.height / stage.clientHeight) / m.scale;
  dragStart = { x: e.clientX, y: e.clientY };
});

stage.addEventListener('mouseup', () => { isDragging = false; });
stage.addEventListener('mouseleave', () => { isDragging = false; hovered = null; updateHoverTooltip(); });

// Mouse wheel zoom
stage.addEventListener('wheel', (e) => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const px = (e.clientX - rect.left) * (canvas.width / rect.width);
  const py = (e.clientY - rect.top) * (canvas.height / rect.height);
  const [wxBefore, wyBefore] = screenToWorld(px, py);

  const zoomFactor = e.deltaY < 0 ? 1.18 : 0.84;
  camera.zoom = clamp(camera.zoom * zoomFactor, 0.12, 12.0);

  const mNew = getMapping();
  const [wxAfter, wyAfter] = [(px - mNew.offX) / mNew.scale, (py - mNew.offY) / mNew.scale];
  camera.x += (wxBefore - wxAfter);
  camera.y += (wyBefore - wyAfter);
  updateZoomBadge();
}, { passive: false });

function updateZoomBadge() {
  const zb = document.getElementById('zoomBadge');
  if (zb) zb.textContent = `Zoom ${camera.zoom.toFixed(1)}×`;
  const mb = document.getElementById('microscopeBadge');
  if (mb) mb.style.display = camera.zoom >= 2.8 ? 'block' : 'none';
}

document.getElementById('zoomInBtn').addEventListener('click', () => {
  camera.zoom = clamp(camera.zoom * 1.3, 0.12, 12.0); updateZoomBadge();
});
document.getElementById('zoomOutBtn').addEventListener('click', () => {
  camera.zoom = clamp(camera.zoom * 0.77, 0.12, 12.0); updateZoomBadge();
});
document.getElementById('resetCamBtn').addEventListener('click', () => {
  camera = { x: world.width / 2, y: world.height / 2, zoom: 0.45 };
  followMode = false;
  document.getElementById('followBtn').textContent = 'Follow Cell: OFF';
  document.getElementById('followBtn').classList.remove('active');
  updateZoomBadge();
});

const followBtn = document.getElementById('followBtn');
followBtn.addEventListener('click', () => {
  followMode = !followMode;
  followBtn.textContent = followMode ? 'Follow Cell: ON' : 'Follow Cell: OFF';
  if (followMode) followBtn.classList.add('active'); else followBtn.classList.remove('active');
});

const nightToggleBtn = document.getElementById('nightToggleBtn');
nightToggleBtn.addEventListener('click', () => {
  nightShaderEnabled = !nightShaderEnabled;
  nightToggleBtn.textContent = nightShaderEnabled ? 'Night Shader: ON' : 'Night Shader: OFF';
  if (nightShaderEnabled) nightToggleBtn.classList.add('active'); else nightToggleBtn.classList.remove('active');
});

const tt = document.getElementById('creatureTooltip');
function updateHoverTooltip(screenX, screenY) {
  if (!hovered || !hovered.alive) { tt.style.display = 'none'; return; }
  tt.style.display = 'block';
  tt.style.left = screenX + 'px'; tt.style.top = screenY + 'px';
  document.getElementById('ttTitle').textContent = hovered.genome.speciesName;
  const mat = world.terrain.getMaterialProps(hovered.x, hovered.y).name;
  document.getElementById('ttInfo').textContent = `${hovered.role} · ${mat} · Hydration: ${hovered.moisture.toFixed(0)}%`;
  document.getElementById('ttEnergyBar').style.width = Math.round((hovered.energy / hovered.maxEnergy) * 100) + '%';
}

// =====================================================================
// 10. RENDERING PIPELINE (BIOLUMINESCENT NIGHT SHADER & WAVE DYNAMICS)
// =====================================================================

function render() {
  if (followMode && selected && selected.alive) {
    camera.x = lerp(camera.x, selected.x, 0.1);
    camera.y = lerp(camera.y, selected.y, 0.1);
  }

  const m = getMapping();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#06090c';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(m.offX, m.offY);
  ctx.scale(m.scale, m.scale);

  const [minWx, minWy] = screenToWorld(0, 0);
  const [maxWx, maxWy] = screenToWorld(canvas.width, canvas.height);
  const pad = 120;
  const vMinX = Math.max(0, minWx - pad), vMinY = Math.max(0, minWy - pad);
  const vMaxX = Math.min(world.width, maxWx + pad), vMaxY = Math.min(world.height, maxWy + pad);

  // 1. Terrain Grid
  const terrain = world.terrain;
  const tCs = terrain.cellSize;
  const minCx = clamp(Math.floor(vMinX / tCs), 0, terrain.cols - 1);
  const maxCx = clamp(Math.floor(vMaxX / tCs), 0, terrain.cols - 1);
  const minCy = clamp(Math.floor(vMinY / tCs), 0, terrain.rows - 1);
  const maxCy = clamp(Math.floor(vMaxY / tCs), 0, terrain.rows - 1);

  for (let cy = minCy; cy <= maxCy; cy++) {
    const rowBase = cy * terrain.cols;
    const py = cy * tCs;
    for (let cx = minCx; cx <= maxCx; cx++) {
      const mat = terrain.materials[rowBase + cx];
      ctx.fillStyle = MATERIAL_PROPERTIES[mat].color;
      ctx.fillRect(cx * tCs, py, tCs + 0.6, tCs + 0.6);

      // Coastal Shoreline Wave Lapping & Foam
      if (mat === TERRAIN_TYPES.WATER_SHALLOW || mat === TERRAIN_TYPES.MUD) {
        const wave = Math.sin(world.tickCount * 0.08 + cx * 0.4) * 2;
        ctx.fillStyle = 'rgba(230, 245, 255, 0.12)';
        ctx.fillRect(cx * tCs, py + wave, tCs, 1.5);
      }
    }
  }

  // 2. Food & Toxins
  const food = world.food;
  const fCs = food.cellSize;
  const fMinCx = clamp(Math.floor(vMinX / fCs), 0, food.cols - 1);
  const fMaxCx = clamp(Math.floor(vMaxX / fCs), 0, food.cols - 1);
  const fMinCy = clamp(Math.floor(vMinY / fCs), 0, food.rows - 1);
  const fMaxCy = clamp(Math.floor(vMaxY / fCs), 0, food.rows - 1);

  for (let cy = fMinCy; cy <= fMaxCy; cy++) {
    const rowBase = cy * food.cols;
    const py = cy * fCs;
    for (let cx = fMinCx; cx <= maxCx; cx++) {
      const idx = rowBase + cx;
      const d = food.density[idx];
      const t = food.toxins[idx];
      const px = cx * fCs;
      if (d > 0.06) {
        ctx.fillStyle = `rgba(145, 195, 80, ${Math.min(0.55, d * 0.45)})`;
        ctx.fillRect(px, py, fCs + 0.5, fCs + 0.5);
      }
      if (t > 0.05) {
        ctx.fillStyle = `rgba(155, 93, 229, ${t * 0.45})`;
        ctx.fillRect(px, py, fCs + 0.5, fCs + 0.5);
      }
    }
  }

  // 3. Hydrothermal Vents
  for (let i = 0; i < food.vents.length; i++) {
    const v = food.vents[i];
    const vx = (v.cx + 0.5) * fCs, vy = (v.cy + 0.5) * fCs;
    const r = v.r * fCs * 1.8;
    if (vx + r < vMinX || vx - r > vMaxX || vy + r < vMinY || vy - r > vMaxY) continue;
    const pulse = 1.0 + Math.sin(world.tickCount * 0.08 + i) * 0.14;
    const g = ctx.createRadialGradient(vx, vy, 0, vx, vy, r * pulse);
    g.addColorStop(0, 'rgba(240, 106, 56, 0.45)');
    g.addColorStop(0.5, 'rgba(240, 106, 56, 0.15)');
    g.addColorStop(1, 'rgba(240, 106, 56, 0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(vx, vy, r * pulse, 0, Math.PI * 2); ctx.fill();
  }

  // 4. Solid Stone Boulders
  for (let i = 0; i < terrain.stones.length; i++) {
    const st = terrain.stones[i];
    if (st.x + st.r < vMinX || st.x - st.r > vMaxX || st.y + st.r < vMinY || st.y - st.r > vMaxY) continue;
    const sg = ctx.createRadialGradient(st.x - st.r * 0.35, st.y - st.r * 0.35, st.r * 0.1, st.x, st.y, st.r);
    sg.addColorStop(0, '#665d4c'); sg.addColorStop(0.7, '#423b30'); sg.addColorStop(1, '#231e17');
    ctx.fillStyle = sg;
    ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255, 209, 102, 0.25)'; ctx.lineWidth = 1.2; ctx.stroke();
  }

  // 4.5 Mutagenic Pools / Anomaly Zones
  for (let i = 0; i < world.mutagenSpots.length; i++) {
    const ms = world.mutagenSpots[i];
    if (ms.x + ms.radius < vMinX || ms.x - ms.radius > vMaxX || ms.y + ms.radius < vMinY || ms.y - ms.radius > vMaxY) continue;
    const pulse = 1.0 + Math.sin(world.tickCount * 0.06 + i) * 0.12;
    const mg = ctx.createRadialGradient(ms.x, ms.y, 2, ms.x, ms.y, ms.radius * pulse);
    mg.addColorStop(0, 'rgba(155, 93, 229, 0.45)');
    mg.addColorStop(0.6, 'rgba(112, 224, 0, 0.22)');
    mg.addColorStop(1, 'rgba(112, 224, 0, 0)');
    ctx.fillStyle = mg;
    ctx.beginPath(); ctx.arc(ms.x, ms.y, ms.radius * pulse, 0, Math.PI * 2); ctx.fill();

    // Swirling mutagenic ring
    ctx.strokeStyle = 'rgba(199, 125, 255, 0.5)';
    ctx.lineWidth = 1.4;
    const swirlAngle = world.tickCount * 0.04 + i;
    for (let p = 0; p < 4; p++) {
      const a = swirlAngle + (p * Math.PI / 2);
      const pr = ms.radius * 0.55 * pulse;
      const px = ms.x + Math.cos(a) * pr;
      const py = ms.y + Math.sin(a) * pr;
      ctx.beginPath(); ctx.arc(px, py, 2.8, 0, Math.PI * 2); ctx.stroke();
    }
  }

  // 5. Living Flora (Kelp, Moss, Coral, Fern)
  for (let i = 0; i < world.flora.floras.length; i++) {
    const f = world.flora.floras[i];
    if (!f.alive || f.x < vMinX || f.x > vMaxX || f.y < vMinY || f.y > vMaxY) continue;
    const sway = Math.sin(world.tickCount * f.swaySpeed + f.swayPhase) * (f.height * 0.35);

    if (f.type === FLORA_TYPES.KELP) {
      ctx.strokeStyle = FLORA_PROPERTIES[f.type].color;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(f.x, f.y);
      ctx.quadraticCurveTo(f.x + sway * 0.5, f.y - f.height * 0.5, f.x + sway, f.y - f.height);
      ctx.stroke();

      ctx.fillStyle = '#52b788';
      ctx.beginPath(); ctx.arc(f.x + sway, f.y - f.height, 4.0, 0, Math.PI * 2); ctx.fill();
    } else if (f.type === FLORA_TYPES.MOSS) {
      ctx.fillStyle = FLORA_PROPERTIES[f.type].color;
      ctx.beginPath(); ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#9ef01a';
      ctx.beginPath(); ctx.arc(f.x + 2, f.y - 2, 2.0, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillStyle = FLORA_PROPERTIES[f.type].color;
      ctx.beginPath(); ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2); ctx.fill();
    }
  }

  // 6. Carcasses & Skeletons
  for (let i = 0; i < world.carcasses.carcasses.length; i++) {
    const car = world.carcasses.carcasses[i];
    if (!car.alive || car.x < vMinX || car.x > vMaxX || car.y < vMinY || car.y > vMaxY) continue;

    if (car.isSkeleton) {
      // Bone Skeleton
      ctx.strokeStyle = 'rgba(230, 235, 240, 0.75)';
      ctx.lineWidth = 1.4;
      ctx.strokeRect(car.x - car.radius * 0.7, car.y - car.radius * 0.4, car.radius * 1.4, car.radius * 0.8);
      ctx.beginPath();
      ctx.moveTo(car.x - car.radius * 0.5, car.y); ctx.lineTo(car.x + car.radius * 0.5, car.y);
      ctx.stroke();
    } else {
      // Fleshy Carcass with rot haze
      ctx.fillStyle = 'rgba(180, 50, 60, 0.85)';
      ctx.beginPath(); ctx.arc(car.x, car.y, car.radius, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.0;
      ctx.stroke();
    }
  }

  // 7. Organisms & Microscope Mitosis
  const isMicroscope = camera.zoom >= 2.8;

  for (let i = 0; i < world.organisms.length; i++) {
    const o = world.organisms[i];
    if (!o.alive || o.x < vMinX || o.x > vMaxX || o.y < vMinY || o.y > vMaxY) continue;

    const r = 2.5 + o.genome.size * 2.6;
    let baseHue = o.genome.hue;
    let baseSat = 55 + o.genome.colony * 20;
    let baseLight = 42 + o.genome.diet * 12;

    if (o.anomaly === 'ALBINO') {
      baseHue = 340;
      baseSat = 15;
      baseLight = 88;
    } else if (o.anomaly === 'CHIMERA') {
      baseHue = (baseHue + world.tickCount * 1.5) % 360;
      baseSat = 95;
      baseLight = 58;
    }

    // Mud Burrowing Concealment
    if (o.isBurrowed) {
      ctx.fillStyle = 'rgba(65, 48, 30, 0.65)';
      ctx.beginPath();
      ctx.ellipse(o.x, o.y, r * 1.6, r * 1.1, o.facingAngle, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      ctx.globalAlpha = 0.45;
    }

    // Acoustic Vocalization Wave Ring
    if (o.vocalization > 0.05) {
      const vPulse = r * (1.5 + ((world.tickCount + o.id * 3) % 24) * 0.18);
      ctx.strokeStyle = `rgba(78, 205, 196, ${o.vocalization * 0.75})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(o.x, o.y, vPulse, 0, Math.PI * 2); ctx.stroke();
    }

    // Sprint Burst Wake
    if (o.isSprinting) {
      const rearAngle = o.facingAngle + Math.PI;
      ctx.fillStyle = 'rgba(255, 230, 150, 0.4)';
      ctx.beginPath();
      ctx.arc(o.x + Math.cos(rearAngle) * (r * 1.5), o.y + Math.sin(rearAngle) * (r * 1.5), r * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }

    // Bioluminescent Aura
    const auraR = o.anomaly === 'TITAN' ? r * 3.2 : r * 2.4;
    const auraG = ctx.createRadialGradient(o.x, o.y, r * 0.4, o.x, o.y, auraR);
    const auraAlpha = o.anomaly === 'TITAN' ? 0.6 : (o.anomaly === 'ALBINO' ? 0.25 : 0.45);
    auraG.addColorStop(0, `hsla(${baseHue.toFixed(0)},${baseSat}%,${baseLight + 20}%,${auraAlpha})`);
    auraG.addColorStop(1, `hsla(${baseHue.toFixed(0)},${baseSat}%,${baseLight}%,0)`);
    ctx.fillStyle = auraG;
    ctx.beginPath(); ctx.arc(o.x, o.y, auraR, 0, Math.PI * 2); ctx.fill();

    // Harpoon Strike Filament (Carnivore attack)
    if (o.harpoonTarget) {
      ctx.strokeStyle = '#e63946';
      ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(o.harpoonTarget.x, o.harpoonTarget.y); ctx.stroke();
    }

    // Articulated Multi-Segment Chain (draw back-to-front so head is on top)
    if (o.segments && o.segments.length > 1) {
      for (let s = o.segments.length - 1; s >= 1; s--) {
        const seg = o.segments[s];
        const segR = seg.r;
        const segAngle = seg.angle;
        const perp = segAngle + Math.PI / 2;

        // Appendages (Legs or Swimming Paddles attached to segment)
        if (s <= (o.appendagePairs || 0)) {
          const legReach = segR * 1.7;
          if (o.locomotionType > 0.5) {
            // Articulated walking legs with gait phase
            const swing = Math.sin((o.appendagePhase || 0) + s * 1.1) * 0.5;
            const kneeLX = seg.x + Math.cos(perp + swing) * (legReach * 0.6);
            const kneeLY = seg.y + Math.sin(perp + swing) * (legReach * 0.6);
            const footLX = kneeLX + Math.cos(perp + 0.4 + swing * 0.5) * (legReach * 0.6);
            const footLY = kneeLY + Math.sin(perp + 0.4 + swing * 0.5) * (legReach * 0.6);

            const kneeRX = seg.x + Math.cos(perp + Math.PI - swing) * (legReach * 0.6);
            const kneeRY = seg.y + Math.sin(perp + Math.PI - swing) * (legReach * 0.6);
            const footRX = kneeRX + Math.cos(perp + Math.PI - 0.4 - swing * 0.5) * (legReach * 0.6);
            const footRY = kneeRY + Math.sin(perp + Math.PI - 0.4 - swing * 0.5) * (legReach * 0.6);

            ctx.strokeStyle = `hsla(${baseHue.toFixed(0)},${baseSat}%,${Math.max(18, baseLight - 12)}%,0.9)`;
            ctx.lineWidth = Math.max(1.0, segR * 0.26);
            ctx.beginPath(); ctx.moveTo(seg.x, seg.y); ctx.lineTo(kneeLX, kneeLY); ctx.lineTo(footLX, footLY); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(seg.x, seg.y); ctx.lineTo(kneeRX, kneeRY); ctx.lineTo(footRX, footRY); ctx.stroke();
          } else {
            // Hydrodynamic swimming fins
            const finSweep = Math.sin((o.appendagePhase || 0) + s * 1.0) * 0.55;
            ctx.fillStyle = `hsla(${baseHue.toFixed(0)},${baseSat}%,${baseLight + 16}%,0.65)`;
            ctx.beginPath();
            ctx.moveTo(seg.x, seg.y);
            ctx.lineTo(seg.x + Math.cos(perp + finSweep) * legReach, seg.y + Math.sin(perp + finSweep) * legReach);
            ctx.lineTo(seg.x + Math.cos(perp + 0.35 + finSweep) * (legReach * 0.65), seg.y + Math.sin(perp + 0.35 + finSweep) * (legReach * 0.65));
            ctx.closePath(); ctx.fill();

            ctx.beginPath();
            ctx.moveTo(seg.x, seg.y);
            ctx.lineTo(seg.x + Math.cos(perp + Math.PI - finSweep) * legReach, seg.y + Math.sin(perp + Math.PI - finSweep) * legReach);
            ctx.lineTo(seg.x + Math.cos(perp + Math.PI - 0.35 - finSweep) * (legReach * 0.65), seg.y + Math.sin(perp + Math.PI - 0.35 - finSweep) * (legReach * 0.65));
            ctx.closePath(); ctx.fill();
          }
        }

        // Segment Body Plate
        const segHue = o.anomaly === 'CHIMERA' ? (baseHue + s * 45) % 360 : baseHue;
        ctx.fillStyle = `hsl(${segHue.toFixed(0)},${baseSat}%,${baseLight + 6}%)`;
        ctx.beginPath(); ctx.arc(seg.x, seg.y, segR, 0, Math.PI * 2); ctx.fill();

        // Mineral Shell Plate Edge
        if (o.shellHardness > 0.1 || (o.genome.shellMineral || 0) > 0.3) {
          ctx.strokeStyle = `rgba(245, 235, 205, ${Math.min(0.85, o.shellHardness * 0.7 + (o.genome.shellMineral || 0) * 0.3)})`;
          ctx.lineWidth = Math.max(1.0, segR * 0.24);
          ctx.stroke();
        }

        // Spiked Carapace Anomaly
        if (o.anomaly === 'SPIKED_CARAPACE') {
          const spLen = segR * 1.6;
          ctx.strokeStyle = '#e63946'; ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(seg.x, seg.y); ctx.lineTo(seg.x + Math.cos(perp) * spLen, seg.y + Math.sin(perp) * spLen);
          ctx.moveTo(seg.x, seg.y); ctx.lineTo(seg.x - Math.cos(perp) * spLen, seg.y - Math.sin(perp) * spLen);
          ctx.stroke();
        }

        // Tail Ornament on the very last segment
        if (s === o.segments.length - 1) {
          if ((o.genome.tailType || 0) < 0.5) {
            // Caudal fluke
            const tDir = segAngle + Math.PI;
            const fW = segR * 1.9;
            ctx.fillStyle = `hsla(${segHue.toFixed(0)},${baseSat}%,${baseLight + 18}%,0.75)`;
            ctx.beginPath();
            ctx.moveTo(seg.x, seg.y);
            ctx.lineTo(seg.x + Math.cos(tDir + 0.6) * fW, seg.y + Math.sin(tDir + 0.6) * fW);
            ctx.lineTo(seg.x + Math.cos(tDir) * (fW * 1.3), seg.y + Math.sin(tDir) * (fW * 1.3));
            ctx.lineTo(seg.x + Math.cos(tDir - 0.6) * fW, seg.y + Math.sin(tDir - 0.6) * fW);
            ctx.closePath(); ctx.fill();
          } else {
            // Venomous stinger
            const tDir = segAngle + Math.PI;
            const stX = seg.x + Math.cos(tDir) * (segR * 2.0);
            const stY = seg.y + Math.sin(tDir) * (segR * 2.0);
            ctx.strokeStyle = '#f4a261'; ctx.lineWidth = 2.0;
            ctx.beginPath(); ctx.moveTo(seg.x, seg.y); ctx.lineTo(stX, stY); ctx.stroke();
            ctx.fillStyle = '#e76f51'; ctx.beginPath(); ctx.arc(stX, stY, 2.2, 0, Math.PI * 2); ctx.fill();
          }
        }
      }
    }

    // Head Segment Core (Elongating during Mitosis)
    let bodyScaleX = 1.0, bodyScaleY = 1.0;
    if (o.mitosisPhase > 0) {
      const prog = o.mitosisPhase / 40;
      bodyScaleX = 1.0 + Math.sin(prog * Math.PI) * 0.45;
      bodyScaleY = 1.0 - Math.sin(prog * Math.PI) * 0.15;
    }

    ctx.save();
    ctx.translate(o.x, o.y);
    ctx.rotate(o.facingAngle);
    ctx.scale(bodyScaleX, bodyScaleY);

    // Head Disc
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = `hsl(${baseHue.toFixed(0)},${baseSat}%,${baseLight + 16}%)`;
    ctx.fill();

    // Mineral Shell Sheen on Head
    if (o.shellHardness > 0.1 || (o.genome.shellMineral || 0) > 0.3) {
      ctx.strokeStyle = `rgba(245, 235, 205, ${Math.min(0.85, o.shellHardness * 0.7 + (o.genome.shellMineral || 0) * 0.3)})`;
      ctx.lineWidth = Math.max(1.0, r * 0.22);
      ctx.stroke();
    }

    // Microscope Mode Intracellular Detail inside Head
    if (isMicroscope) {
      if (o.mitosisPhase > 0) {
        const sep = (o.mitosisPhase / 40) * (r * 0.7);
        ctx.fillStyle = '#ffd166';
        ctx.beginPath(); ctx.arc(-sep, 0, r * 0.28, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(sep, 0, r * 0.28, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillStyle = '#ffd166';
        ctx.beginPath(); ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2); ctx.fill();
      }

      if (o.endosymbionts && o.endosymbionts.includes('chloroplast')) {
        ctx.fillStyle = '#4ecdc4';
        ctx.beginPath(); ctx.arc(r * 0.4, -r * 0.3, r * 0.22, 0, Math.PI * 2); ctx.fill();
      }
      if (o.endosymbionts && o.endosymbionts.includes('mitochondria')) {
        ctx.fillStyle = '#e76f51';
        ctx.beginPath(); ctx.arc(r * 0.4, r * 0.3, r * 0.22, 0, Math.PI * 2); ctx.fill();
      }
    } else {
      if (o.endosymbionts && o.endosymbionts.includes('chloroplast')) {
        ctx.fillStyle = '#4ecdc4';
        ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.3, r * 0.25, 0, Math.PI * 2); ctx.fill();
      }
      if (o.endosymbionts && o.endosymbionts.includes('mitochondria')) {
        ctx.fillStyle = '#ffd166';
        ctx.beginPath(); ctx.arc(r * 0.3, r * 0.3, r * 0.25, 0, Math.PI * 2); ctx.fill();
      }
    }

    // Head Ornaments: Antennae or Mandibles
    if ((o.genome.headOrnament || 0) < 0.5) {
      // Tactile Antennae
      const antLen = r * 2.0;
      const antWiggle = Math.sin(world.tickCount * 0.15 + o.id) * 0.18;
      ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(r * 0.6, -r * 0.4);
      ctx.quadraticCurveTo(r + antLen * 0.5, -r * 0.8 + antWiggle * 5, r + antLen, -r * 0.6);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(r * 0.6, r * 0.4);
      ctx.quadraticCurveTo(r + antLen * 0.5, r * 0.8 - antWiggle * 5, r + antLen, r * 0.6);
      ctx.stroke();

      ctx.fillStyle = '#ffd166';
      ctx.beginPath(); ctx.arc(r + antLen, -r * 0.6, 1.8, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(r + antLen, r * 0.6, 1.8, 0, Math.PI * 2); ctx.fill();
    } else {
      // Predatory Raptorial Mandibles
      const mLen = r * 1.3;
      ctx.strokeStyle = '#e63946'; ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(r * 0.7, -r * 0.5); ctx.lineTo(r + mLen, -r * 0.2);
      ctx.moveTo(r * 0.7, r * 0.5); ctx.lineTo(r + mLen, r * 0.2);
      ctx.stroke();
    }

    // Polycephaly or Standard Eyes
    const eyeCol = o.anomaly === 'ALBINO' ? '#ff3366' : '#ffd166';
    if (o.anomaly === 'POLYCEPHALY') {
      // Twin Head Lobes
      ctx.fillStyle = `hsl(${baseHue.toFixed(0)},${baseSat}%,${baseLight + 14}%)`;
      ctx.beginPath();
      ctx.arc(r * 0.5, -r * 0.45, r * 0.55, 0, Math.PI * 2);
      ctx.arc(r * 0.5, r * 0.45, r * 0.55, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = eyeCol;
      ctx.beginPath();
      ctx.arc(r * 0.75, -r * 0.55, 2.0, 0, Math.PI * 2);
      ctx.arc(r * 0.75, -r * 0.35, 2.0, 0, Math.PI * 2);
      ctx.arc(r * 0.75, r * 0.35, 2.0, 0, Math.PI * 2);
      ctx.arc(r * 0.75, r * 0.55, 2.0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Standard Compound Eyes
      ctx.fillStyle = eyeCol;
      ctx.beginPath();
      ctx.arc(r * 0.55, -r * 0.45, Math.max(1.6, r * 0.2), 0, Math.PI * 2);
      ctx.arc(r * 0.55, r * 0.45, Math.max(1.6, r * 0.2), 0, Math.PI * 2);
      ctx.fill();

      // Pupil centers
      ctx.fillStyle = '#111';
      ctx.beginPath();
      ctx.arc(r * 0.62, -r * 0.45, Math.max(0.8, r * 0.1), 0, Math.PI * 2);
      ctx.arc(r * 0.62, r * 0.45, Math.max(0.8, r * 0.1), 0, Math.PI * 2);
      ctx.fill();
    }

    // Single segment organism tail fallback (if segmentCount <= 1)
    if (!o.segments || o.segments.length <= 1) {
      if ((o.genome.tailType || 0) < 0.5) {
        // Caudal fluke
        const fW = r * 1.5;
        ctx.fillStyle = `hsla(${baseHue.toFixed(0)},${baseSat}%,${baseLight + 18}%,0.7)`;
        ctx.beginPath();
        ctx.moveTo(-r * 0.8, 0);
        ctx.lineTo(-r - fW * 0.7, -fW * 0.6);
        ctx.lineTo(-r - fW, 0);
        ctx.lineTo(-r - fW * 0.7, fW * 0.6);
        ctx.closePath(); ctx.fill();
      } else {
        // Stinger
        ctx.strokeStyle = '#f4a261'; ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.moveTo(-r * 0.8, 0); ctx.lineTo(-r * 2.0, 0); ctx.stroke();
        ctx.fillStyle = '#e76f51'; ctx.beginPath(); ctx.arc(-r * 2.0, 0, 2.0, 0, Math.PI * 2); ctx.fill();
      }
    }

    ctx.restore();

    if (o.isBurrowed) {
      ctx.restore();
    }

    // Vision Rays (When Selected or Hovered)
    if ((o === selected || o === hovered) && o.lastVision) {
      const rays = o.lastVision.rays;
      for (let rIdx = 0; rIdx < rays.length; rIdx++) {
        const ray = rays[rIdx];
        const endX = o.x + ray.dirX * ray.dist, endY = o.y + ray.dirY * ray.dist;
        ctx.strokeStyle = ray.signature === HIT_TYPES.THREAT ? 'rgba(230,57,70,0.7)' : (ray.signature === HIT_TYPES.PREY ? 'rgba(255,209,102,0.7)' : 'rgba(78,205,196,0.4)');
        ctx.lineWidth = 1.0;
        ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(endX, endY); ctx.stroke();
      }
    }

    if (o === selected) {
      ctx.lineWidth = 2.0; ctx.strokeStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(o.x, o.y, r + 4, 0, Math.PI * 2); ctx.stroke();
    }
  }

  // 8. Atmospheric Night Lighting & Bioluminescent Radiance
  const dayPhase = Math.sin((world.tickCount * Math.PI) / 120);
  const timeBadge = document.getElementById('timeBadge');
  if (timeBadge) timeBadge.textContent = dayPhase > 0 ? '☀️ Daytime' : '🌙 Nighttime';

  if (nightShaderEnabled && dayPhase < 0.2) {
    const darkness = clamp(0.65 - dayPhase * 0.8, 0, 0.72);
    ctx.fillStyle = `rgba(3, 7, 12, ${darkness})`;
    ctx.fillRect(vMinX, vMinY, vMaxX - vMinX, vMaxY - vMinY);

    // Bioluminescent Light Cutouts
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < world.organisms.length; i++) {
      const o = world.organisms[i];
      if (!o.alive || o.x < vMinX || o.x > vMaxX || o.y < vMinY || o.y > vMaxY) continue;
      const lightR = 25 + o.genome.size * 22;
      const lg = ctx.createRadialGradient(o.x, o.y, 2, o.x, o.y, lightR);
      lg.addColorStop(0, `hsla(${o.genome.hue.toFixed(0)}, 75%, 65%, 0.35)`);
      lg.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = lg;
      ctx.beginPath(); ctx.arc(o.x, o.y, lightR, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  // 9. Weather Storm Clouds & Rainfall Particles
  for (let i = 0; i < world.weather.fronts.length; i++) {
    const f = world.weather.fronts[i];
    if (f.x + f.radius < vMinX || f.x - f.radius > vMaxX || f.y + f.radius < vMinY || f.y - f.radius > vMaxY) continue;

    const cg = ctx.createRadialGradient(f.x, f.y, f.radius * 0.2, f.x, f.y, f.radius);
    cg.addColorStop(0, f.type === WEATHER_TYPES.RAIN ? 'rgba(30, 45, 60, 0.35)' : 'rgba(200, 230, 255, 0.35)');
    cg.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = cg;
    ctx.beginPath(); ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2); ctx.fill();

    // Falling Rain streaks
    if (f.type === WEATHER_TYPES.RAIN) {
      ctx.strokeStyle = 'rgba(180, 220, 255, 0.35)';
      ctx.lineWidth = 1.0;
      for (let s = 0; s < 12; s++) {
        const rx = f.x + (Math.random() - 0.5) * f.radius * 1.4;
        const ry = f.y + (Math.random() - 0.5) * f.radius * 1.4;
        ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx + 3, ry + 12); ctx.stroke();
      }
    }
  }

  ctx.restore();
  renderMinimap();
}

// =====================================================================
// 11. MINI-MAP RADAR 2.0
// =====================================================================

function renderMinimap() {
  const mw = minimapCanvas.width, mh = minimapCanvas.height;
  minimapCtx.clearRect(0, 0, mw, mh);
  minimapCtx.fillStyle = '#08121a';
  minimapCtx.fillRect(0, 0, mw, mh);

  const scaleX = mw / world.width;
  const scaleY = mh / world.height;

  // Land silhouette
  const terrain = world.terrain;
  const step = 4;
  for (let cy = 0; cy < terrain.rows; cy += step) {
    const rowBase = cy * terrain.cols;
    const py = cy * terrain.cellSize * scaleY;
    for (let cx = 0; cx < terrain.cols; cx += step) {
      const mat = terrain.materials[rowBase + cx];
      if (mat === TERRAIN_TYPES.LAND) {
        minimapCtx.fillStyle = '#483f2e';
        minimapCtx.fillRect(cx * terrain.cellSize * scaleX, py, terrain.cellSize * step * scaleX, terrain.cellSize * step * scaleY);
      } else if (mat === TERRAIN_TYPES.ICE) {
        minimapCtx.fillStyle = '#41637a';
        minimapCtx.fillRect(cx * terrain.cellSize * scaleX, py, terrain.cellSize * step * scaleX, terrain.cellSize * step * scaleY);
      } else if (mat === TERRAIN_TYPES.MUD) {
        minimapCtx.fillStyle = '#31261a';
        minimapCtx.fillRect(cx * terrain.cellSize * scaleX, py, terrain.cellSize * step * scaleX, terrain.cellSize * step * scaleY);
      }
    }
  }

  // Living flora pips (Green)
  minimapCtx.fillStyle = '#38b000';
  for (let i = 0; i < world.flora.floras.length; i += 3) {
    const f = world.flora.floras[i];
    if (f.alive) minimapCtx.fillRect(f.x * scaleX, f.y * scaleY, 1.4, 1.4);
  }

  // Organisms
  for (let i = 0; i < world.organisms.length; i++) {
    const o = world.organisms[i];
    minimapCtx.fillStyle = `hsl(${o.genome.hue.toFixed(0)}, 70%, 60%)`;
    minimapCtx.fillRect(o.x * scaleX, o.y * scaleY, 1.8, 1.8);
  }

  // Frustum Box
  const m = getMapping();
  const vx = (-m.offX / m.scale) * scaleX, vy = (-m.offY / m.scale) * scaleY;
  const vw = (canvas.width / m.scale) * scaleX, vh = (canvas.height / m.scale) * scaleY;
  minimapCtx.strokeStyle = '#4ecdc4';
  minimapCtx.lineWidth = 1.2;
  minimapCtx.strokeRect(vx, vy, vw, vh);
}

minimapCanvas.addEventListener('click', (e) => {
  const rect = minimapCanvas.getBoundingClientRect();
  camera.x = ((e.clientX - rect.left) / rect.width) * world.width;
  camera.y = ((e.clientY - rect.top) / rect.height) * world.height;
});

// =====================================================================
// 12. BRAIN INSPECTOR & STATS
// =====================================================================

function renderBrainGraph() {
  const w = brainCanvas.width, h = brainCanvas.height;
  brainCtx.clearRect(0, 0, w, h);

  if (!selected || !selected.alive) {
    document.getElementById('brainTargetLabel').textContent = 'No cell selected';
    document.getElementById('brainActions').style.display = 'none';
    brainCtx.fillStyle = '#8b9488';
    brainCtx.font = '11px ui-monospace, monospace';
    brainCtx.textAlign = 'center';
    brainCtx.fillText('Click any cell to inspect its Cognitive Neural Network', w / 2, h / 2);
    return;
  }

  const brain = selected.brain;
  const deepStr = brain.hasDeepLayer ? `+${brain.deepHiddenSize}H2` : '';
  document.getElementById('brainTargetLabel').textContent = `Cell #${selected.id} (${selected.genome.speciesName}) [${brain.inputSize}In → ${brain.hiddenSize}H1${deepStr} → ${brain.outputSize}Out]`;
  document.getElementById('brainActions').style.display = 'block';

  const allInputLabels = [
    'R0.Eye', 'R1.Eye', 'R2.Eye', 'R3.Eye', 'R4.Eye',
    'Food.∇', 'Tox.∇', 'Hunger', 'Thirst', 'Fear', 'Mate', 'Frict',
    'M1.in', 'M2.in', 'M3.in', 'Pain',
    'Moist', 'Shell', 'Pred.∇', 'Prey.∇', 'Press', 'Burrow', 'Acoust', 'Pack'
  ];
  const allOutputLabels = [
    'Thrust', 'Turn', 'Attack', 'Colony',
    'M1.out', 'M2.out', 'M3.out',
    'Scrape', 'Burrow', 'Vocal', 'Sprint'
  ];

  const inCount = Math.min(brain.inputSize, allInputLabels.length);
  const outCount = Math.min(brain.outputSize, allOutputLabels.length);
  const h1Count = brain.hiddenSize;
  const hasDeep = brain.hasDeepLayer && brain.deepHiddenSize > 0;
  const h2Count = hasDeep ? brain.deepHiddenSize : 0;

  // Layer column X positions
  const layerX = hasDeep
    ? [36, w * 0.32, w * 0.65, w - 46]
    : [42, w * 0.50, w - 48];

  const inputY = [];
  for (let i = 0; i < inCount; i++) {
    inputY.push(10 + i * ((h - 20) / Math.max(1, inCount - 1)));
  }

  const hidden1Y = [];
  for (let i = 0; i < h1Count; i++) {
    hidden1Y.push(14 + i * ((h - 28) / Math.max(1, h1Count - 1)));
  }

  const hidden2Y = [];
  if (hasDeep) {
    for (let i = 0; i < h2Count; i++) {
      hidden2Y.push(18 + i * ((h - 36) / Math.max(1, h2Count - 1)));
    }
  }

  const outputY = [];
  for (let i = 0; i < outCount; i++) {
    outputY.push(16 + i * ((h - 32) / Math.max(1, outCount - 1)));
  }

  // 1. Synapses: Input -> Hidden 1
  for (let h1 = 0; h1 < h1Count; h1++) {
    const row = h1 * brain.inputSize;
    for (let i = 0; i < inCount; i++) {
      const wt = brain.W1[row + i];
      if (Math.abs(wt) < 0.08) continue;
      brainCtx.strokeStyle = wt > 0 ? 'rgba(78, 205, 196, 0.35)' : 'rgba(240, 106, 56, 0.35)';
      brainCtx.lineWidth = clamp(Math.abs(wt) * 0.85, 0.4, 1.8);
      brainCtx.beginPath();
      brainCtx.moveTo(layerX[0], inputY[i]);
      brainCtx.lineTo(layerX[1], hidden1Y[h1]);
      brainCtx.stroke();
    }
  }

  if (hasDeep) {
    // 2. Synapses: Hidden 1 -> Hidden 2
    for (let h2 = 0; h2 < h2Count; h2++) {
      const row = h2 * brain.maxHiddenSize;
      for (let h1 = 0; h1 < h1Count; h1++) {
        const wt = brain.W_deep[row + h1];
        if (Math.abs(wt) < 0.08) continue;
        brainCtx.strokeStyle = wt > 0 ? 'rgba(199, 125, 255, 0.4)' : 'rgba(255, 183, 3, 0.4)';
        brainCtx.lineWidth = clamp(Math.abs(wt) * 0.85, 0.4, 1.8);
        brainCtx.beginPath();
        brainCtx.moveTo(layerX[1], hidden1Y[h1]);
        brainCtx.lineTo(layerX[2], hidden2Y[h2]);
        brainCtx.stroke();
      }
    }

    // 3. Synapses: Hidden 2 -> Output
    for (let o = 0; o < outCount; o++) {
      const row = o * brain.maxHiddenSize;
      for (let h2 = 0; h2 < h2Count; h2++) {
        const wt = brain.W2[row + h2];
        if (Math.abs(wt) < 0.08) continue;
        brainCtx.strokeStyle = wt > 0 ? 'rgba(78, 205, 196, 0.35)' : 'rgba(240, 106, 56, 0.35)';
        brainCtx.lineWidth = clamp(Math.abs(wt) * 0.85, 0.4, 1.8);
        brainCtx.beginPath();
        brainCtx.moveTo(layerX[2], hidden2Y[h2]);
        brainCtx.lineTo(layerX[3], outputY[o]);
        brainCtx.stroke();
      }
    }

    // Skip connections (Residual feed-forward)
    if (brain.hasSkipConn) {
      for (let o = 0; o < outCount; o++) {
        const row = o * brain.maxHiddenSize;
        for (let h1 = 0; h1 < Math.min(4, h1Count); h1++) {
          const wt = brain.W_skip[row + h1];
          if (Math.abs(wt) < 0.1) continue;
          brainCtx.strokeStyle = 'rgba(78, 205, 196, 0.22)';
          brainCtx.setLineDash([2, 2]);
          brainCtx.beginPath();
          brainCtx.moveTo(layerX[1], hidden1Y[h1]);
          brainCtx.lineTo(layerX[3], outputY[o]);
          brainCtx.stroke();
          brainCtx.setLineDash([]);
        }
      }
    }
  } else {
    // 2. Synapses: Hidden 1 -> Output (Standard 3-layer)
    for (let o = 0; o < outCount; o++) {
      const row = o * brain.maxHiddenSize;
      for (let h1 = 0; h1 < h1Count; h1++) {
        const wt = brain.W2[row + h1];
        if (Math.abs(wt) < 0.08) continue;
        brainCtx.strokeStyle = wt > 0 ? 'rgba(78, 205, 196, 0.35)' : 'rgba(240, 106, 56, 0.35)';
        brainCtx.lineWidth = clamp(Math.abs(wt) * 0.85, 0.4, 1.8);
        brainCtx.beginPath();
        brainCtx.moveTo(layerX[1], hidden1Y[h1]);
        brainCtx.lineTo(layerX[2], outputY[o]);
        brainCtx.stroke();
      }
    }
  }

  // Draw Nodes
  // Inputs
  for (let i = 0; i < inCount; i++) {
    brainCtx.fillStyle = '#4ecdc4';
    brainCtx.beginPath(); brainCtx.arc(layerX[0], inputY[i], 2.8, 0, Math.PI * 2); brainCtx.fill();
    brainCtx.fillStyle = '#8b9488'; brainCtx.font = '7.5px ui-monospace, monospace'; brainCtx.textAlign = 'right';
    brainCtx.fillText(allInputLabels[i], layerX[0] - 5, inputY[i] + 2.5);
  }

  // Hidden 1
  for (let h1 = 0; h1 < h1Count; h1++) {
    brainCtx.fillStyle = '#9b5de5';
    brainCtx.beginPath(); brainCtx.arc(layerX[1], hidden1Y[h1], 3.4, 0, Math.PI * 2); brainCtx.fill();
  }

  // Hidden 2 (if present)
  if (hasDeep) {
    for (let h2 = 0; h2 < h2Count; h2++) {
      brainCtx.fillStyle = '#e056fd';
      brainCtx.beginPath(); brainCtx.arc(layerX[2], hidden2Y[h2], 3.4, 0, Math.PI * 2); brainCtx.fill();
    }
  }

  // Outputs
  const outColIdx = hasDeep ? 3 : 2;
  for (let o = 0; o < outCount; o++) {
    brainCtx.fillStyle = '#ffd166';
    brainCtx.beginPath(); brainCtx.arc(layerX[outColIdx], outputY[o], 3.4, 0, Math.PI * 2); brainCtx.fill();
    brainCtx.fillStyle = '#e6ebd9'; brainCtx.font = '7.5px ui-monospace, monospace'; brainCtx.textAlign = 'left';
    brainCtx.fillText(allOutputLabels[o], layerX[outColIdx] + 6, outputY[o] + 2.5);
  }
}

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
  popCtx.strokeStyle = '#4ecdc4'; popCtx.lineWidth = 1.4; popCtx.stroke();
}

const statGrid = document.getElementById('statGrid');
function renderStats() {
  const s = world.stats;
  const rows = [
    ['Geological Era', s.era, 'purple'],
    ['Oxygen (O₂)', s.o2, 'cyan'],
    ['Population', s.population],
    ['Living Flora', s.floraCount, 'emerald'],
    ['Carcasses / Bones', s.carcasses, s.carcasses > 0 ? 'ember' : ''],
    ['Weather Storms', s.weatherFronts, 'cyan'],
    ['Multicellular (Segments)', `${s.segmentedCount || 0} (avg ${s.avgSegments || '1.0'})`, (s.segmentedCount || 0) > 0 ? 'emerald' : ''],
    ['Deep Neural Brains', s.deepBrains || 0, (s.deepBrains || 0) > 0 ? 'purple' : ''],
    ['Genetic Anomalies', s.anomalies || 0, (s.anomalies || 0) > 0 ? 'ember' : ''],
    ['Terrestrial Lineages', s.terrestrial, s.terrestrial > 0 ? 'emerald' : ''],
    ['Amphibious Organisms', s.amphibious, s.amphibious > 0 ? 'cyan' : ''],
    ['Average Hydration', s.avgMoisture + '%'],
    ['Dominant Species', s.topSpecies, 'cyan'],
    ['Grazers / Hunters', `${s.herbivores} / ${s.carnivores}`],
    ['Deepest Generation', s.maxGeneration || 1, 'mineral'],
  ];
  statGrid.innerHTML = rows.map(r => `<div class="k">${r[0]}</div><div class="v ${r[2] || ''}">${r[1]}</div>`).join('');
  document.getElementById('dayLabel').textContent = `Day ${Math.floor(world.tickCount / 60)} · Tick ${world.tickCount} · Gen ${s.maxGeneration || 1}`;
  document.getElementById('eraBadge').textContent = s.era;
}

const eventLog = document.getElementById('eventLog');
const loggedEvents = [];
function flushEvents() {
  if (!world.events.length) return;
  for (let i = 0; i < world.events.length; i++) loggedEvents.unshift(world.events[i]);
  world.events = [];
  if (loggedEvents.length > 12) loggedEvents.length = 12;
  eventLog.innerHTML = loggedEvents.map(e => `<div class="row"><span class="t">t${e.tick}</span>${e.text}</div>`).join('');
}

let lastStatTime = 0;
function frame(ts) {
  if (!paused) for (let i = 0; i < ticksPerFrame; i++) world.tick();
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

// Controls
const playPauseBtn = document.getElementById('playPauseBtn');
playPauseBtn.addEventListener('click', () => {
  paused = !paused; playPauseBtn.textContent = paused ? 'Resume' : 'Pause';
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
  world.terrain = new TerrainGrid(world.width, world.height, 40);
  world.food = new FoodGrid(world.width, world.height, 40, world.terrain);
  world.flora = new FloraManager(world.width, world.height, 100);
  world.carcasses = new CarcassManager(world.width, world.height, 100);
  world.weather = new WeatherManager(world.width, world.height);
  world.flora.seedInitialFlora(world.terrain, 200);
  world.tickCount = 0;
  world.seed(70);
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

// Interventions
document.getElementById('extinctionBtn').addEventListener('click', () => {
  world.massExtinction(0.75);
  world.events.push({ tick: world.tickCount, text: 'Mass extinction: 75% of organisms perish and leave carcasses.' });
});
document.getElementById('bloomBtn').addEventListener('click', () => {
  for (let i = 0; i < world.food.density.length; i++) world.food.density[i] = Math.min(1, world.food.density[i] + 0.45);
  world.events.push({ tick: world.tickCount, text: 'Nutrient bloom surges across ocean & land.' });
});
document.getElementById('stormBtn').addEventListener('click', () => {
  const prev = world.params.mutationRate;
  world.params.mutationRate = Math.min(0.35, prev + 0.18);
  mutSlider.value = world.params.mutationRate;
  syncSliderLabels();
  world.events.push({ tick: world.tickCount, text: 'Mutation storm destabilizes genomes.' });
  setTimeout(() => { world.params.mutationRate = prev; mutSlider.value = prev; syncSliderLabels(); }, 14000);
});
document.getElementById('surgeBtn').addEventListener('click', () => {
  for (const v of world.food.vents) v.heat *= 1.8;
  world.events.push({ tick: world.tickCount, text: 'Hydrothermal vent surge erupts with mineral energy.' });
  setTimeout(() => { for (const v of world.food.vents) v.heat /= 1.8; }, 12000);
});
document.getElementById('advanceEraBtn').addEventListener('click', () => {
  world.tickCount += 1600;
  world.events.push({ tick: world.tickCount, text: 'Geological Era accelerated via observer controls!' });
});
document.getElementById('resetBrainBtn').addEventListener('click', () => {
  if (selected && selected.alive) { selected.brain.reset(); renderBrainGraph(); }
});
document.getElementById('pruneBrainBtn').addEventListener('click', () => {
  if (selected && selected.alive) { selected.brain.prune(0.15); renderBrainGraph(); }
});

// Clade Tree
const cladeModal = document.getElementById('cladeModal');
document.getElementById('cladeBtn').addEventListener('click', () => {
  renderCladeTree(); cladeModal.style.display = 'flex';
});
document.getElementById('closeCladeModal').addEventListener('click', () => { cladeModal.style.display = 'none'; });

function renderCladeTree() {
  const container = document.getElementById('cladeGraph');
  const nodes = Array.from(world.cladeTree.values());
  nodes.sort((a, b) => b.count - a.count);
  if (nodes.length === 0) { container.innerHTML = '<p class="empty-note">No species recorded yet.</p>'; return; }
  container.innerHTML = nodes.map(n => `
    <div class="clade-node" style="border-left-color: hsl(${n.hue.toFixed(0)},70%,55%)">
      <div><strong>${n.name}</strong> <span style="color:var(--foam-dim); font-size:11px;">(Ancestor: ${n.parentName}, Originated t${n.originTick})</span></div>
      <div><span class="badge ${n.count > 0 ? 'phase5' : ''}">${n.count} alive</span></div>
    </div>
  `).join('');
}

// Click selection
canvas.addEventListener('click', (e) => {
  if (activeBrush !== 'select') return;
  const rect = canvas.getBoundingClientRect();
  const px = (e.clientX - rect.left) * (canvas.width / rect.width);
  const py = (e.clientY - rect.top) * (canvas.height / rect.height);
  const [wx, wy] = screenToWorld(px, py);

  let best = null, bestD = 32 * 32;
  for (let i = 0; i < world.organisms.length; i++) {
    const o = world.organisms[i];
    const d2 = dist2(o.x, o.y, wx, wy);
    if (d2 < bestD) { bestD = d2; best = o; }
  }
  selected = best;
  renderInspector();
  renderBrainGraph();
});

// Inspector Panel
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
  return {
    size: 1, speed: 1, sense: 55, diet: 0.1, aggression: 0.15, colony: 0.2,
    membrane: 0.5, plasticity: 0.4, pheromoneRate: 0.2, toxinGene: 0.1, endoCapacity: 0.5,
    moistureRetention: 0.3, locomotionType: 0.3, thermalTolerance: 0.5,
    visionFov: 120, visionRange: 100, mutationRate: 0.1, hue: Math.random() * 360,
    segmentCount: 1, bodyAspect: 1.0, appendagePairs: 2, shellMineral: 0.2,
    headOrnament: 0.3, tailType: 0.2,
    brainInputs: 16, brainHidden1: 10, brainDeepLayers: 0, brainOutputs: 7,
    speciesName: 'Amphi-poda'
  };
}
let spawnGenome = defaultSpawnGenome();

function renderInspector() {
  if (!selected || !selected.alive) {
    inspectorTitle.textContent = 'Introduce a genome';
    inspectorBody.innerHTML = `
      <p class="empty-note">Design an organism and release it onto Primordial Earth. Click any creature to inspect its compound vision and cognitive brain.</p>
      ${Object.keys(GENE_RANGES).map(k => geneSliderHTML(k, spawnGenome[k], 'spawn')).join('')}
      <div class="field">
        <label>Lineage Hue <span class="val" id="spawn_hue_val">${spawnGenome.hue.toFixed(0)}</span></label>
        <input type="range" id="spawn_hue" min="0" max="360" step="1" value="${spawnGenome.hue}">
      </div>
      <div class="row-btns">
        <button class="btn primary" id="spawnAddBtn">Add to Earth</button>
        <button class="btn" id="spawnRandomBtn">Randomise</button>
      </div>`;

    Object.keys(GENE_RANGES).forEach(k => {
      const el = document.getElementById('spawn_' + k);
      if (el) el.addEventListener('input', (e) => {
        spawnGenome[k] = parseFloat(e.target.value);
        document.getElementById(`spawn_${k}_val`).textContent = spawnGenome[k].toFixed(2);
      });
    });
    document.getElementById('spawn_hue').addEventListener('input', (e) => {
      spawnGenome.hue = parseFloat(e.target.value);
      document.getElementById('spawn_hue_val').textContent = spawnGenome.hue.toFixed(0);
    });
    document.getElementById('spawnAddBtn').addEventListener('click', () => {
      world.spawn(spawnGenome, undefined, undefined, 0.6);
      world.events.push({ tick: world.tickCount, text: 'Custom organism introduced into Primordial Earth.' });
    });
    document.getElementById('spawnRandomBtn').addEventListener('click', () => {
      spawnGenome = defaultSpawnGenome();
      Object.assign(spawnGenome, randomGenome());
      renderInspector();
    });
    return;
  }

  const o = selected;
  const anomalyBadge = o.anomaly
    ? `<span class="anomaly-tag ${o.anomaly.toLowerCase()}">${o.anomaly.replace('_', ' ')}</span>`
    : '';
  inspectorTitle.innerHTML = `<span class="genome-swatch" style="background:hsl(${o.genome.hue.toFixed(0)},65%,58%)"></span>${o.genome.speciesName} #${o.id} ${anomalyBadge}`;
  const energyPct = Math.round((o.energy / o.maxEnergy) * 100);
  const matProps = world.terrain.getMaterialProps(o.x, o.y);
  const deepStr = o.brain.hasDeepLayer ? ` → ${o.brain.deepHiddenSize}H2` : '';

  inspectorBody.innerHTML = `
    <div class="stat-grid" style="margin-bottom:12px;">
      <div class="k">Species</div><div class="v purple">${o.genome.speciesName}</div>
      <div class="k">Morphotype</div><div class="v ember">${o.role}</div>
      <div class="k">Morphology</div><div class="v emerald">${o.segmentCount} Segments · ${o.appendagePairs * 2} Limbs</div>
      <div class="k">Shell Shield</div><div class="v">${Math.round(o.shellHardness * 100)}% (${(o.genome.shellMineral || 0) > 0.6 ? 'Mineral' : 'Chitin'})</div>
      <div class="k">Brain Network</div><div class="v purple">${o.brain.inputSize}I → ${o.brain.hiddenSize}H1${deepStr} → ${o.brain.outputSize}O</div>
      <div class="k">Locomotion</div><div class="v">${o.locomotionType > 0.5 ? 'Terrestrial Crawl' : 'Aquatic Swimming'}</div>
      <div class="k">State</div><div class="v ${o.isBurrowed ? 'ember' : (o.isSprinting ? 'cyan' : '')}">${o.isBurrowed ? 'Mud Burrowed' : (o.isSprinting ? 'Sprint Burst' : 'Surface Active')}</div>
      <div class="k">Terrain Biome</div><div class="v cyan">${matProps.name}</div>
      <div class="k">Hydration</div><div class="v ${o.moisture < 25 ? 'ember' : 'cyan'}">${o.moisture.toFixed(0)}%</div>
      <div class="k">Mitosis Status</div><div class="v ${o.mitosisPhase > 0 ? 'emerald' : ''}">${o.mitosisPhase > 0 ? `Dividing (${o.mitosisPhase}/40)` : 'Interphase'}</div>
      <div class="k">Energy</div><div class="v">${energyPct}%</div>
      <div class="k">Age / Generation</div><div class="v">${o.age} ticks / Gen ${o.generation}</div>
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
    <p class="hint">Adjusting sliders mutates this organism's genome live on Primordial Earth.</p>`;

  Object.keys(GENE_RANGES).forEach(k => {
    const el = document.getElementById('sel_' + k);
    if (el) el.addEventListener('input', (e) => {
      o.genome[k] = parseFloat(e.target.value);
      document.getElementById(`sel_${k}_val`).textContent = o.genome[k].toFixed(2);
    });
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
    world.spawn(mutateGenome(o.genome, world.params.mutationRate), o.x, o.y, 0.5, o.brain, o.id);
  });
  document.getElementById('mateBtn').addEventListener('click', () => {
    const nearby = world.organisms.filter(other => other !== o && other.alive && dist2(o.x, o.y, other.x, other.y) < 140 * 140);
    if (nearby.length > 0) {
      const partner = nearby[0];
      const childGenome = crossoverGenome(o.genome, partner.genome, world.params.mutationRate);
      const childBrain = o.brain.crossover(partner.brain, world.params.mutationRate);
      world.spawn(childGenome, (o.x + partner.x) / 2, (o.y + partner.y) / 2, 0.55, childBrain, o.id);
    }
  });
  document.getElementById('removeBtn').addEventListener('click', () => {
    o.alive = false; selected = null; renderInspector(); renderBrainGraph();
  });
}
renderInspector();

document.getElementById('beginBtn').addEventListener('click', () => {
  document.getElementById('introOverlay').remove();
});
