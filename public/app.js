// ===== Primordial Earth V4 Observer App =====
// Sprawling 4000x3000 Continent, Multi-Scale Infinite Zoom,
// Compound Raycast Vision, Amphibious Genetics & Cognitive Hebbian Learning.

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
  visionFov: 'Vision FOV',
  visionRange: 'Sight Distance',
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
  if (genome.locomotionType > 0.65 && genome.moistureRetention > 0.45) pIndex = 11;
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
  if (genome.locomotionType > 0.6) sIndex = 10;
  else if (genome.moistureRetention > 0.7) sIndex = 11;

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

// =====================================================================
// 2. TERRAIN & NATURAL MATERIALS ENGINE
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

    // Natural Stone Formations & Boulders
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
// 3. COMPOUND EYE VISION & OCCLUSION
// =====================================================================

const RAY_COUNT = 5;
const HIT_TYPES = { NONE: 0, FOOD: 1, PREY: 2, THREAT: -1, KIN: 0.5, OBSTACLE: -0.8 };

function castCompoundVision(org, spatialHash, foodGrid, terrain, W, H) {
  const fov = (org.genome.visionFov || 120) * (Math.PI / 180);
  let range = org.genome.visionRange || (35 + org.genome.sense * 0.85);
  if (org.role === 'ocellus') range *= 1.5;

  const facing = org.facingAngle || 0;
  const rayHits = [];
  const nearbyOrgs = spatialHash.query(org.x, org.y, range + 20);

  for (let r = 0; r < RAY_COUNT; r++) {
    const angleOffset = fov * (r / (RAY_COUNT - 1) - 0.5);
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

    const proximity = 1.0 - (closestDist / range);
    rayHits.push({
      dirX, dirY, dist: closestDist, proximity, signature: hitSign,
      signal: proximity * hitSign,
    });
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
// 4. COGNITIVE NEURAL NETWORK BRAIN (HEBBIAN NEUROPLASTICITY)
// =====================================================================

class NEATBrain {
  constructor(inputSize = 16, initialHiddenSize = 10, outputSize = 7) {
    this.inputSize = inputSize;
    this.hiddenSize = initialHiddenSize;
    this.maxHiddenSize = 22;
    this.outputSize = outputSize;

    this.W1 = new Float32Array(this.maxHiddenSize * inputSize);
    this.B1 = new Float32Array(this.maxHiddenSize);
    this.W2 = new Float32Array(outputSize * this.maxHiddenSize);
    this.B2 = new Float32Array(outputSize);

    this.inputs = new Float32Array(inputSize);
    this.hidden = new Float32Array(this.maxHiddenSize);
    this.outputs = new Float32Array(outputSize);

    this.mem1 = 0; this.mem2 = 0; this.mem3 = 0;
    this.painTrace = 0;

    this.trace1 = new Float32Array(this.maxHiddenSize * inputSize);
    this.trace2 = new Float32Array(outputSize * this.maxHiddenSize);

    this.randomize();
  }

  randomize(scale = 0.85) {
    for (let i = 0; i < this.W1.length; i++) this.W1[i] = gaussian() * scale;
    for (let i = 0; i < this.B1.length; i++) this.B1[i] = gaussian() * 0.2;
    for (let i = 0; i < this.W2.length; i++) this.W2[i] = gaussian() * scale;
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
      this.outputs[o] = (o === 2 || o === 3) ? (1 / (1 + Math.exp(-sum))) : Math.tanh(sum);
    }

    this.mem1 = lerp(this.mem1, this.outputs[4] || 0, 0.7);
    this.mem2 = lerp(this.mem2, this.outputs[5] || 0, 0.7);
    this.mem3 = lerp(this.mem3, this.outputs[6] || 0, 0.7);
    this.painTrace *= 0.88;

    for (let h = 0; h < this.hiddenSize; h++) {
      const rowOffset = h * this.inputSize;
      const hAct = this.hidden[h];
      for (let i = 0; i < this.inputSize; i++) {
        const idx = rowOffset + i;
        this.trace1[idx] = this.trace1[idx] * 0.8 + hAct * this.inputs[i];
      }
    }
    for (let o = 0; o < this.outputSize; o++) {
      const rowOffset = o * this.maxHiddenSize;
      const oAct = this.outputs[o];
      for (let h = 0; h < this.hiddenSize; h++) {
        const idx = rowOffset + h;
        this.trace2[idx] = this.trace2[idx] * 0.8 + oAct * this.hidden[h];
      }
    }

    return this.outputs;
  }

  adaptPlasticity(reward, plasticityRate = 0.06) {
    if (plasticityRate <= 0.001 || Math.abs(reward) < 0.005) return;
    const lr = clamp(reward, -1.0, 1.0) * plasticityRate * 0.12;
    const decay = 0.9992;

    for (let h = 0; h < this.hiddenSize; h++) {
      const rowOffset = h * this.inputSize;
      for (let i = 0; i < this.inputSize; i++) {
        const idx = rowOffset + i;
        this.W1[idx] = clamp(this.W1[idx] * decay + lr * this.trace1[idx], -3.8, 3.8);
      }
    }
    for (let o = 0; o < this.outputSize; o++) {
      const rowOffset = o * this.maxHiddenSize;
      for (let h = 0; h < this.hiddenSize; h++) {
        const idx = rowOffset + h;
        this.W2[idx] = clamp(this.W2[idx] * decay + lr * this.trace2[idx], -3.8, 3.8);
      }
    }
  }

  registerPain(trauma = 0.4) {
    this.painTrace = clamp(this.painTrace + trauma, 0, 1);
  }

  addNeuronMutation() {
    if (this.hiddenSize < this.maxHiddenSize) {
      const newH = this.hiddenSize++;
      const row1 = newH * this.inputSize;
      for (let i = 0; i < this.inputSize; i++) this.W1[row1 + i] = gaussian() * 0.4;
      this.B1[newH] = 0;
      for (let o = 0; o < this.outputSize; o++) this.W2[o * this.maxHiddenSize + newH] = gaussian() * 0.4;
    }
  }

  mutate(rate = 0.1) {
    if (Math.random() < rate * 0.3) this.addNeuronMutation();
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
    for (let i = 0; i < this.W2.length; i++) this.W2[i] = mutWeight(this.W2[i]);
    for (let i = 0; i < this.B2.length; i++) this.B2[i] = mutWeight(this.B2[i]);
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
    n.mem1 = this.mem1; n.mem2 = this.mem2; n.mem3 = this.mem3; n.painTrace = this.painTrace;
    return n;
  }

  reset() { this.randomize(0.85); this.mem1 = 0; this.mem2 = 0; this.mem3 = 0; this.painTrace = 0; }
  prune(threshold = 0.08) {
    for (let i = 0; i < this.W1.length; i++) if (Math.abs(this.W1[i]) < threshold) this.W1[i] = 0;
    for (let i = 0; i < this.W2.length; i++) if (Math.abs(this.W2[i]) < threshold) this.W2[i] = 0;
  }
}

// =====================================================================
// 5. ORGANISM & MULTICELLULAR SPRINGS
// =====================================================================

let ORG_ID_COUNTER = 1;

class Organism {
  constructor(x, y, genome, energy, generation, lineageId, brain, parentId) {
    this.id = ORG_ID_COUNTER++;
    this.x = x; this.y = y;
    this.vx = 0; this.vy = 0;
    this.facingAngle = Math.random() * Math.PI * 2;

    this.genome = genome;
    this.maxEnergy = 40 + genome.size * 60;
    this.energy = energy !== undefined ? energy : this.maxEnergy * 0.55;
    this.moisture = 100;

    this.age = 0;
    this.generation = generation || 1;
    this.lineageId = lineageId || this.id;
    this.parentId = parentId || 0;
    this.reproCooldown = 0;
    this.alive = true;

    this.brain = brain ? brain.clone() : new NEATBrain(16, 10, 7);
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
    this.lastVision = null;
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

  get lifespan() { return 550 + this.genome.size * 300; }

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

  perceive(foodGrid, spatialHash, W, H, terrain) {
    const vision = castCompoundVision(this, spatialHash, foodGrid, terrain, W, H);
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
    if (terrain) {
      const props = terrain.getMaterialProps(this.x, this.y);
      matFriction = props.friction;
    }

    return [
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
  }

  step(foodGrid, spatialHash, W, H, tempFactor = 1.0, terrain = null) {
    if (!this.alive) return;

    const envInputs = this.perceive(foodGrid, spatialHash, W, H, terrain);
    const outputs = this.brain.forward(envInputs);

    let thrust = outputs[0];
    let turn = outputs[1];
    const attackImpulse = outputs[2];
    const colonyImpulse = outputs[3];

    if (Math.abs(thrust) < 0.1 && Math.abs(turn) < 0.1) {
      this._wanderAngle += (Math.random() - 0.5) * 0.4;
      thrust = 0.45;
      turn = Math.sin(this._wanderAngle) * 0.3;
    }

    let mat = TERRAIN_TYPES.WATER_DEEP;
    let matProps = MATERIAL_PROPERTIES[TERRAIN_TYPES.WATER_DEEP];
    if (terrain) {
      mat = terrain.getMaterial(this.x, this.y);
      matProps = terrain.getMaterialProps(this.x, this.y);
    }

    // Moisture & Material Physiology
    if (mat === TERRAIN_TYPES.WATER_DEEP || mat === TERRAIN_TYPES.WATER_SHALLOW) {
      this.moisture = Math.min(100, this.moisture + matProps.moistureReplenish);
    } else if (mat === TERRAIN_TYPES.MUD) {
      this.moisture = Math.min(100, this.moisture + matProps.moistureReplenish);
      this.energy = Math.min(this.maxEnergy, this.energy + 0.035);
    } else if (mat === TERRAIN_TYPES.LAND) {
      const moistureLoss = 0.14 * (1.0 - (this.genome.moistureRetention || 0) * 0.86);
      this.moisture = Math.max(0, this.moisture - moistureLoss);
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

    // Locomotion (Swim vs Crawl)
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

    // Multicellular Spring Forces
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
      const dampF = (relVx * nx + relVy * ny) * DAMPING;

      const totalF = springF + dampF;
      this.vx += nx * totalF;
      this.vy += ny * totalF;

      if (this.nerveSignal > 0.4 && partner.nerveSignal < 0.4) partner.nerveSignal = this.nerveSignal * 0.85;
      if (this.role === 'digestor' && this.energy > this.maxEnergy * 0.6 && partner.energy < partner.maxEnergy * 0.5) {
        this.energy -= 0.12; partner.energy += 0.12;
      }
    }

    if (mat === TERRAIN_TYPES.WATER_DEEP) this.vx += Math.sin(this.y * 0.01) * 0.06;

    if (terrain) {
      const col = terrain.resolveStoneCollision(this.x, this.y, this.effectiveSize, this.vx, this.vy);
      this.x = col.x; this.y = col.y; this.vx = col.vx; this.vy = col.vy;
      if (col.collided) this.brain.registerPain(0.12);
    }

    this.x = (this.x + this.vx + W) % W;
    this.y = (this.y + this.vy + H) % H;

    // Endosymbiosis Energy Generation
    if (this.endosymbionts.includes('chloroplast') && foodGrid && foodGrid.lightFactor(this.y / 40) > 0.3) {
      this.energy = Math.min(this.maxEnergy, this.energy + 0.085 * foodGrid.lightFactor(this.y / 40));
    }

    // Venom Toxin Secretion
    if (foodGrid && (this.role === 'toxin' || this.genome.toxinGene > 0.4) && Math.random() < 0.15) {
      foodGrid.depositToxin(this.x, this.y, 0.22 * this.genome.toxinGene);
    }

    // Environmental Feeding
    if (foodGrid && this.energy < this.maxEnergy * 0.98) {
      const eaten = foodGrid.eat(this.x, this.y, this.eatRate);
      if (eaten > 0) {
        const plantEff = 1 - this.genome.diet * 0.42;
        this.energy = Math.min(this.maxEnergy, this.energy + eaten * 44 * plantEff);
        this.brain.adaptPlasticity(0.12, this.genome.plasticity);
      }
    }

    // Predation
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
              this.energy *= 0.85; this.brain.registerPain(0.4);
            }

            const successP = clamp(0.44 + selfPower - defenderPower, 0.05, 0.92);
            if (Math.random() < successP) {
              const meatGain = other.energy * 0.65 * clamp(0.35 + this.genome.diet * 0.85, 0.35, 1.0);
              this.energy = Math.min(this.maxEnergy, this.energy + meatGain);
              other.alive = false;
              other.brain.registerPain(0.8);
              other.brain.adaptPlasticity(-0.5, other.genome.plasticity);

              this.kills++;
              if (foodGrid) foodGrid.deposit(other.x, other.y, 0.14 * other.genome.size);
              this.brain.adaptPlasticity(0.5, this.genome.plasticity);
            }
          }
        }
      }
    }

    const speedUsed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    this.energy -= (this.metabolismBase + speedUsed * 0.032) * tempFactor;
    this.age++;
    if (this.reproCooldown > 0) this.reproCooldown--;
  }
}

// =====================================================================
// 6. FOOD GRID & ENVIRONMENT
// =====================================================================

class FoodGrid {
  constructor(width, height, cellSize = 40, terrain = null) {
    this.width = width;
    this.height = height;
    this.cellSize = cellSize;
    this.cols = Math.ceil(width / cellSize);
    this.rows = Math.ceil(height / cellSize);
    this.density = new Float32Array(this.cols * this.rows);
    this.pheromones = new Float32Array(this.cols * this.rows);
    this.toxins = new Float32Array(this.cols * this.rows);
    this.vents = [];
    this.terrain = terrain;

    this.o2Level = 0.05;
    this.co2Level = 0.85;
    this.h2sLevel = 0.65;
    this.currentEra = 'Hadean Volcanic';

    for (let i = 0; i < this.density.length; i++) {
      this.density[i] = 0.18 + Math.random() * 0.22;
      this.pheromones[i] = 0;
      this.toxins[i] = 0;
    }

    const ventCount = 12;
    for (let i = 0; i < ventCount; i++) {
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
    const cx = clamp(Math.floor(x / this.cellSize), 0, this.cols - 1);
    const cy = clamp(Math.floor(y / this.cellSize), 0, this.rows - 1);
    return { cx, cy };
  }

  updateEra(tickCount = 0, plantCoverage = 0.3) {
    if (tickCount < 1500) {
      this.currentEra = 'Hadean Volcanic';
      this.o2Level = clamp(0.04 + plantCoverage * 0.1, 0, 1);
      this.co2Level = 0.85;
      this.h2sLevel = 0.65;
    } else if (tickCount < 3500) {
      this.currentEra = 'Archean Oxygenation';
      this.o2Level = clamp(0.2 + (tickCount - 1500) * 0.0002 + plantCoverage * 0.3, 0, 1);
      this.co2Level = clamp(0.7 - (tickCount - 1500) * 0.00015, 0.1, 1);
      this.h2sLevel = clamp(0.5 - (tickCount - 1500) * 0.00015, 0.05, 1);
    } else if (tickCount < 5500) {
      this.currentEra = 'Proterozoic Snowball';
      this.o2Level = 0.45;
      this.co2Level = 0.3;
      this.h2sLevel = 0.15;
    } else {
      this.currentEra = 'Cambrian Explosion';
      this.o2Level = 0.85;
      this.co2Level = 0.35;
      this.h2sLevel = 0.08;
    }
  }

  lightFactor(cy, tickCount = 0) {
    const iceBlock = this.currentEra === 'Proterozoic Snowball' ? 0.35 : 1.0;
    const dayNightOscillation = 0.3 + 0.7 * Math.pow(Math.sin((tickCount * Math.PI) / 120), 2);
    const depthFactor = 0.25 + 0.75 * (1 - cy / this.rows);
    return dayNightOscillation * depthFactor * iceBlock;
  }

  grow(growthRate = 0.012, tickCount = 0) {
    this.updateEra(tickCount, this.coverage());
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
        pheromones[i] *= 0.95;
        toxins[i] *= 0.93;
      }
    }

    for (const vent of this.vents) {
      for (let dy = -vent.r; dy <= vent.r; dy++) {
        for (let dx = -vent.r; dx <= vent.r; dx++) {
          const cx = vent.cx + dx, cy = vent.cy + dy;
          if (cx < 0 || cy < 0 || cx >= cols || cy >= rows) continue;
          if (dx * dx + dy * dy > vent.r * vent.r) continue;
          const i = this.idx(cx, cy);
          if (density[i] < 0.75) density[i] = Math.min(0.75, density[i] + 0.042 * vent.heat);
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
// 7. WORLD ENGINE
// =====================================================================

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

    for (let i = 0; i < count; i++) {
      const g = mutateGenome(ancestorGenome, 0.08);
      this.registerSpecies(g.speciesName, ancestorGenome.speciesName, g.hue);

      let x = Math.random() * this.width;
      let y = Math.random() * this.height;
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
    for (const o of this.organisms) if (Math.random() < fraction) o.alive = false;
  }

  generateNaturalistReport() {
    if (this.tickCount - this._lastNaturalistReport < 350) return;
    this._lastNaturalistReport = this.tickCount;

    const s = this.stats;
    const era = this.food.currentEra;
    let reportText = '';

    if (!this._firstLandfall && s.terrestrial > 2) {
      this._firstLandfall = true;
      reportText = `[AI Naturalist] Evolutionary Breakthrough: Amphibious organisms colonize the continental shores!`;
    } else if (this.tickCount === 1500) {
      reportText = `[AI Naturalist] Great Archean Oxygenation begins! O₂ levels rising across ocean & land.`;
    } else if (this.tickCount === 3500) {
      reportText = `[AI Naturalist] Proterozoic Snowball Earth: Glaciers advance across the continents.`;
    } else if (this.tickCount === 5500) {
      reportText = `[AI Naturalist] Cambrian Explosion! Optimal oxygenation sparks adaptive radiation.`;
    } else if (s.multicellular > 2 && Math.random() < 0.5) {
      reportText = `[AI Naturalist] Multicellular complexity surging: ${s.multicellular} organisms with spring tissue bodies active.`;
    } else {
      reportText = `[AI Naturalist] Species ${s.topSpecies} dominates the continental ecosystem in the ${era} era.`;
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

    const parent = new Map();
    const find = (o) => {
      let r = o;
      while (parent.get(r) && parent.get(r) !== r) r = parent.get(r);
      return r;
    };
    const union = (a, b) => { const ra = find(a), rb = find(b); if (ra !== rb) parent.set(ra, rb); };
    for (let i = 0; i < alive.length; i++) parent.set(alive[i], alive[i]);

    const BOND_R = 18, BOND_R2 = BOND_R * BOND_R;
    for (let i = 0; i < alive.length; i++) {
      const o = alive[i];
      if (o.genome.colony < 0.38) continue;
      const nearby = hash.query(o.x, o.y, BOND_R);
      for (let j = 0; j < nearby.length; j++) {
        const other = nearby[j];
        if (other === o || !other.alive || other.genome.colony < 0.38) continue;
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
        m.colonySize = arr.length > 1 ? (1 + Math.min(2.4, 0.45 * (sizeSum - m.genome.size) / m.genome.size)) : 1;
        m.updateRole(arr);
      }
    }

    for (let i = 0; i < alive.length; i++) alive[i].step(this.food, hash, W, H, p.tempFactor, this.terrain);

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
        let childGenome, childBrain, isSexual = false;

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
      if (node.count > maxCount) { maxCount = node.count; topName = node.name; }
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

// =====================================================================
// 8. GRAPHICS & CANVAS OBSERVER LAYER
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
let activeBrush = 'select'; // 'select' | 'stone' | 'mud' | 'ice' | 'land' | 'water' | 'food'

// Camera with multi-scale zoom
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
  if (activeBrush === 'stone') {
    world.terrain.addStone(wx, wy, 20 + Math.random() * 24);
    world.events.push({ tick: world.tickCount, text: 'Solid stone boulder created on seabed/mainland.' });
  } else if (activeBrush === 'mud') {
    world.terrain.paintMaterial(wx, wy, 90, TERRAIN_TYPES.MUD);
  } else if (activeBrush === 'ice') {
    world.terrain.paintMaterial(wx, wy, 100, TERRAIN_TYPES.ICE);
  } else if (activeBrush === 'land') {
    world.terrain.paintMaterial(wx, wy, 110, TERRAIN_TYPES.LAND);
  } else if (activeBrush === 'water') {
    world.terrain.paintMaterial(wx, wy, 110, TERRAIN_TYPES.WATER_DEEP);
  } else if (activeBrush === 'food') {
    world.food.deposit(wx, wy, 0.85);
    world.events.push({ tick: world.tickCount, text: 'Nutrient bloom seeded via God Tool.' });
  }
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

  if (activeBrush !== 'select') {
    applyBrush(wx, wy);
    return;
  }

  const m = getMapping();
  const dx = (e.clientX - dragStart.x) * (canvas.width / stage.clientWidth) / m.scale;
  const dy = (e.clientY - dragStart.y) * (canvas.height / stage.clientHeight) / m.scale;
  camera.x -= dx; camera.y -= dy;
  dragStart = { x: e.clientX, y: e.clientY };
});

stage.addEventListener('mouseup', () => { isDragging = false; });
stage.addEventListener('mouseleave', () => { isDragging = false; hovered = null; updateHoverTooltip(); });

// Smooth mouse-centered wheel zoom
stage.addEventListener('wheel', (e) => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const px = (e.clientX - rect.left) * (canvas.width / rect.width);
  const py = (e.clientY - rect.top) * (canvas.height / rect.height);
  const [wxBefore, wyBefore] = screenToWorld(px, py);

  const zoomFactor = e.deltaY < 0 ? 1.18 : 0.84;
  camera.zoom = clamp(camera.zoom * zoomFactor, 0.12, 12.0);

  // Re-adjust camera so mouse point stays fixed
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

// Zoom in / out buttons
document.getElementById('zoomInBtn').addEventListener('click', () => {
  camera.zoom = clamp(camera.zoom * 1.3, 0.12, 12.0);
  updateZoomBadge();
});
document.getElementById('zoomOutBtn').addEventListener('click', () => {
  camera.zoom = clamp(camera.zoom * 0.77, 0.12, 12.0);
  updateZoomBadge();
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

const tt = document.getElementById('creatureTooltip');
function updateHoverTooltip(screenX, screenY) {
  if (!hovered || !hovered.alive) { tt.style.display = 'none'; return; }
  tt.style.display = 'block';
  tt.style.left = screenX + 'px';
  tt.style.top = screenY + 'px';
  document.getElementById('ttTitle').textContent = hovered.genome.speciesName;
  const mat = world.terrain.getMaterialProps(hovered.x, hovered.y).name;
  document.getElementById('ttInfo').textContent = `${hovered.role} · ${mat} · Moisture: ${hovered.moisture.toFixed(0)}%`;
  const pct = Math.round((hovered.energy / hovered.maxEnergy) * 100);
  document.getElementById('ttEnergyBar').style.width = pct + '%';
}

// =====================================================================
// 9. RENDERING PIPELINE (WITH FRUSTUM CULLING & MICROSCOPE VIEW)
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

  // Compute Viewport Frustum Culling Box in World Coordinates
  const [minWx, minWy] = screenToWorld(0, 0);
  const [maxWx, maxWy] = screenToWorld(canvas.width, canvas.height);
  const pad = 120;
  const vMinX = Math.max(0, minWx - pad);
  const vMinY = Math.max(0, minWy - pad);
  const vMaxX = Math.min(world.width, maxWx + pad);
  const vMaxY = Math.min(world.height, maxWy + pad);

  // 1. Render Terrain Tiles within Frustum
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
    }
  }

  // 2. Render Food, Pheromone & Toxin Density within Frustum
  const food = world.food;
  const fCs = food.cellSize;
  const fMinCx = clamp(Math.floor(vMinX / fCs), 0, food.cols - 1);
  const fMaxCx = clamp(Math.floor(vMaxX / fCs), 0, food.cols - 1);
  const fMinCy = clamp(Math.floor(vMinY / fCs), 0, food.rows - 1);
  const fMaxCy = clamp(Math.floor(vMaxY / fCs), 0, food.rows - 1);

  for (let cy = fMinCy; cy <= fMaxCy; cy++) {
    const rowBase = cy * food.cols;
    const py = cy * fCs;
    for (let cx = fMinCx; cx <= fMaxCx; cx++) {
      const idx = rowBase + cx;
      const d = food.density[idx];
      const t = food.toxins[idx];
      const px = cx * fCs;

      if (d > 0.06) {
        ctx.fillStyle = `rgba(145, 195, 80, ${Math.min(0.55, d * 0.5)})`;
        ctx.fillRect(px, py, fCs + 0.5, fCs + 0.5);
      }
      if (t > 0.05) {
        ctx.fillStyle = `rgba(155, 93, 229, ${t * 0.45})`;
        ctx.fillRect(px, py, fCs + 0.5, fCs + 0.5);
      }
    }
  }

  // 3. Hydrothermal Vents within Frustum
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

  // 4. Solid Stone Boulders within Frustum
  for (let i = 0; i < terrain.stones.length; i++) {
    const st = terrain.stones[i];
    if (st.x + st.r < vMinX || st.x - st.r > vMaxX || st.y + st.r < vMinY || st.y - st.r > vMaxY) continue;

    // 3D Boulder Gradient
    const sg = ctx.createRadialGradient(st.x - st.r * 0.35, st.y - st.r * 0.35, st.r * 0.1, st.x, st.y, st.r);
    sg.addColorStop(0, '#665d4c');
    sg.addColorStop(0.7, '#423b30');
    sg.addColorStop(1, '#231e17');
    ctx.fillStyle = sg;
    ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2); ctx.fill();

    // Mineral Ring
    ctx.strokeStyle = 'rgba(255, 209, 102, 0.25)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  // 5. Multicellular Tissue Connections
  for (let i = 0; i < world.organisms.length; i++) {
    const o = world.organisms[i];
    if (!o.alive || o.colonyMemberCount <= 1) continue;
    if (o.x < vMinX || o.x > vMaxX || o.y < vMinY || o.y > vMaxY) continue;

    for (let j = 0; j < o.bondedPartners.length; j++) {
      const p = o.bondedPartners[j];
      if (p.alive) {
        ctx.strokeStyle = `hsla(${o.genome.hue.toFixed(0)}, 65%, 55%, 0.45)`;
        ctx.lineWidth = Math.min(o.genome.size, p.genome.size) * 2.2;
        ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(p.x, p.y); ctx.stroke();

        if (o.nerveSignal > 0.3) {
          const px = lerp(o.x, p.x, (world.tickCount * 0.1) % 1);
          const py = lerp(o.y, p.y, (world.tickCount * 0.1) % 1);
          ctx.fillStyle = '#ffd166';
          ctx.beginPath(); ctx.arc(px, py, 1.8, 0, Math.PI * 2); ctx.fill();
        }
      }
    }
  }

  // 6. Organisms & Microscopic Organelle Rendering
  const isMicroscope = camera.zoom >= 2.8;

  for (let i = 0; i < world.organisms.length; i++) {
    const o = world.organisms[i];
    if (!o.alive) continue;
    if (o.x < vMinX || o.x > vMaxX || o.y < vMinY || o.y > vMaxY) continue;

    const r = 2.5 + o.genome.size * 2.6;
    const light = 42 + o.genome.diet * 12;
    const sat = 55 + o.genome.colony * 20;

    // Bioluminescent Aura
    const auraG = ctx.createRadialGradient(o.x, o.y, r * 0.4, o.x, o.y, r * 2.2);
    auraG.addColorStop(0, `hsla(${o.genome.hue.toFixed(0)},${sat}%,${light + 18}%,0.4)`);
    auraG.addColorStop(1, `hsla(${o.genome.hue.toFixed(0)},${sat}%,${light}%,0)`);
    ctx.fillStyle = auraG;
    ctx.beginPath(); ctx.arc(o.x, o.y, r * 2.2, 0, Math.PI * 2); ctx.fill();

    // Locomotion Appendages (Fins or Crawling Limbs)
    const crawl = o.genome.locomotionType || 0;
    if (crawl > 0.4) {
      // Crawling limbs
      const limbCount = 4;
      ctx.strokeStyle = `hsla(${o.genome.hue.toFixed(0)},${sat}%,${light - 10}%,0.8)`;
      ctx.lineWidth = 1.4;
      for (let l = 0; l < limbCount; l++) {
        const side = l % 2 === 0 ? 1 : -1;
        const forwardBack = l < 2 ? 0.6 : -0.6;
        const wiggle = Math.sin(world.tickCount * 0.25 + l) * 3.5;
        const lAngle = o.facingAngle + (Math.PI / 2) * side * 0.75 + forwardBack * 0.4;
        const lx = o.x + Math.cos(lAngle) * (r + 4 + wiggle);
        const ly = o.y + Math.sin(lAngle) * (r + 4 + wiggle);
        ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(lx, ly); ctx.stroke();
      }
    } else {
      // Flagella tail
      const tailAngle = o.facingAngle + Math.PI + Math.sin(world.tickCount * 0.3) * 0.45;
      const tx = o.x + Math.cos(tailAngle) * (r + 6);
      const ty = o.y + Math.sin(tailAngle) * (r + 6);
      ctx.strokeStyle = `hsla(${o.genome.hue.toFixed(0)},${sat}%,${light + 10}%,0.65)`;
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(tx, ty); ctx.stroke();
    }

    // Cell Body Core
    ctx.beginPath();
    ctx.arc(o.x, o.y, r, 0, Math.PI * 2);
    ctx.fillStyle = `hsl(${o.genome.hue.toFixed(0)},${sat}%,${light + 16}%)`;
    ctx.fill();

    // ===== MICROSCOPE MODE INTRACELLULAR VISUALS (Zoom >= 2.8x) =====
    if (isMicroscope) {
      // 1. Lipid Bilayer Membrane Shimmer
      ctx.lineWidth = 0.8;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.beginPath();
      ctx.arc(o.x, o.y, r * 0.95, 0, Math.PI * 2);
      ctx.stroke();

      // 2. Pulsating Nucleus with Chromatin
      const nucR = r * 0.38;
      const nucPulse = 1.0 + Math.sin(world.tickCount * 0.08 + o.id) * 0.1;
      const nucG = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, nucR * nucPulse);
      nucG.addColorStop(0, 'rgba(255, 240, 210, 0.9)');
      nucG.addColorStop(0.7, 'rgba(200, 160, 255, 0.6)');
      nucG.addColorStop(1, 'rgba(155, 93, 229, 0.1)');
      ctx.fillStyle = nucG;
      ctx.beginPath(); ctx.arc(o.x, o.y, nucR * nucPulse, 0, Math.PI * 2); ctx.fill();

      // 3. Mitochondria Cristae & ATP Sparks
      if (o.endosymbionts.includes('mitochondria')) {
        const mx = o.x + Math.cos(o.facingAngle + 1.2) * (r * 0.48);
        const my = o.y + Math.sin(o.facingAngle + 1.2) * (r * 0.48);
        ctx.fillStyle = '#ffd166';
        ctx.beginPath(); ctx.arc(mx, my, r * 0.22, 0, Math.PI * 2); ctx.fill();
        // Golden ATP spark
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(mx + Math.sin(world.tickCount * 0.3) * 1.5, my, 0.8, 0, Math.PI * 2); ctx.fill();
      }

      // 4. Chloroplast Thylakoid Stacks
      if (o.endosymbionts.includes('chloroplast')) {
        const cx = o.x + Math.cos(o.facingAngle - 1.2) * (r * 0.48);
        const cy = o.y + Math.sin(o.facingAngle - 1.2) * (r * 0.48);
        ctx.fillStyle = '#3caea3';
        ctx.beginPath(); ctx.arc(cx, cy, r * 0.24, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#4ecdc4';
        ctx.fillRect(cx - 1, cy - 1, 2, 2);
      }

      // 5. Active Synaptic Firing Pulses (Nerve net sparks)
      if (o.nerveSignal > 0.25) {
        ctx.fillStyle = '#ffd166';
        ctx.beginPath();
        ctx.arc(o.x + (Math.random() - 0.5) * r, o.y + (Math.random() - 0.5) * r, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // Normal Organelle Dots
      if (o.endosymbionts.includes('chloroplast')) {
        ctx.fillStyle = '#4ecdc4';
        ctx.beginPath(); ctx.arc(o.x - r * 0.3, o.y - r * 0.3, r * 0.25, 0, Math.PI * 2); ctx.fill();
      }
      if (o.endosymbionts.includes('mitochondria')) {
        ctx.fillStyle = '#ffd166';
        ctx.beginPath(); ctx.arc(o.x + r * 0.3, o.y + r * 0.3, r * 0.25, 0, Math.PI * 2); ctx.fill();
      }
    }

    // Morphotype Highlights
    if (o.role === 'shield') {
      ctx.lineWidth = 1.8; ctx.strokeStyle = '#ffd166'; ctx.stroke();
    } else if (o.role === 'toxin') {
      ctx.lineWidth = 1.8; ctx.strokeStyle = '#9b5de5'; ctx.stroke();
    } else if (o.role === 'ocellus') {
      ctx.fillStyle = '#3caea3';
      ctx.beginPath(); ctx.arc(o.x + Math.cos(o.facingAngle) * (r * 0.55), o.y + Math.sin(o.facingAngle) * (r * 0.55), r * 0.3, 0, Math.PI * 2); ctx.fill();
    }

    // 7. Compound Eye Vision Rays (When selected or hovered)
    if ((o === selected || o === hovered) && o.lastVision) {
      const rays = o.lastVision.rays;
      for (let rIdx = 0; rIdx < rays.length; rIdx++) {
        const ray = rays[rIdx];
        const endX = o.x + ray.dirX * ray.dist;
        const endY = o.y + ray.dirY * ray.dist;

        let rayColor = 'rgba(78, 205, 196, 0.4)';
        if (ray.signature === HIT_TYPES.THREAT) rayColor = 'rgba(230, 57, 70, 0.7)';
        else if (ray.signature === HIT_TYPES.PREY) rayColor = 'rgba(255, 209, 102, 0.7)';
        else if (ray.signature === HIT_TYPES.OBSTACLE) rayColor = 'rgba(150, 140, 130, 0.7)';

        ctx.strokeStyle = rayColor;
        ctx.lineWidth = 1.0;
        ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(endX, endY); ctx.stroke();

        // Hit indicator circle at ray tip
        if (ray.proximity > 0.05) {
          ctx.fillStyle = rayColor;
          ctx.beginPath(); ctx.arc(endX, endY, 2.5, 0, Math.PI * 2); ctx.fill();
        }
      }
    }

    // Selection Indicator
    if (o === selected) {
      ctx.lineWidth = 2.0; ctx.strokeStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(o.x, o.y, r + 4, 0, Math.PI * 2); ctx.stroke();
    }
  }

  ctx.restore();
  renderMinimap();
}

// =====================================================================
// 10. MINI-MAP RADAR & CAMERA BOX (#minimapCanvas)
// =====================================================================

function renderMinimap() {
  const mw = minimapCanvas.width, mh = minimapCanvas.height;
  minimapCtx.clearRect(0, 0, mw, mh);

  // Background overview
  minimapCtx.fillStyle = '#08121a';
  minimapCtx.fillRect(0, 0, mw, mh);

  const scaleX = mw / world.width;
  const scaleY = mh / world.height;

  // Render Low-res Continental Land Silhouette
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

  // Draw Organisms as colored radar pips
  for (let i = 0; i < world.organisms.length; i++) {
    const o = world.organisms[i];
    minimapCtx.fillStyle = `hsl(${o.genome.hue.toFixed(0)}, 70%, 60%)`;
    minimapCtx.fillRect(o.x * scaleX, o.y * scaleY, 1.8, 1.8);
  }

  // Draw Camera Frustum Viewport Rectangle
  const m = getMapping();
  const vx = (-m.offX / m.scale) * scaleX;
  const vy = (-m.offY / m.scale) * scaleY;
  const vw = (canvas.width / m.scale) * scaleX;
  const vh = (canvas.height / m.scale) * scaleY;

  minimapCtx.strokeStyle = '#4ecdc4';
  minimapCtx.lineWidth = 1.2;
  minimapCtx.strokeRect(vx, vy, vw, vh);
}

// Mini-map click to jump camera
minimapCanvas.addEventListener('click', (e) => {
  const rect = minimapCanvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) / rect.width;
  const my = (e.clientY - rect.top) / rect.height;
  camera.x = mx * world.width;
  camera.y = my * world.height;
});

// =====================================================================
// 11. COGNITIVE BRAIN GRAPH INSPECTOR
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
    brainCtx.fillText('Click any cell to inspect its 16-input Cognitive Brain', w / 2, h / 2);
    return;
  }

  document.getElementById('brainTargetLabel').textContent = `Cell #${selected.id} (${selected.genome.speciesName})`;
  document.getElementById('brainActions').style.display = 'block';

  const brain = selected.brain;
  const inputs = brain.inputs;
  const hidden = brain.hidden;
  const outputs = brain.outputs;

  const inputLabels = [
    'R0.Eye', 'R1.Eye', 'R2.Eye', 'R3.Eye', 'R4.Eye',
    'Food.∇', 'Tox.∇', 'Hunger', 'Thirst', 'Fear',
    'Mate', 'Frict', 'M1.in', 'M2.in', 'M3.in', 'Pain'
  ];
  const outputLabels = ['Thrust', 'Turn', 'Attack', 'Colony', 'M1.out', 'M2.out', 'M3.out'];

  const layerX = [42, w / 2, w - 48];
  const inputY = [];
  const hiddenY = [];
  const outputY = [];

  for (let i = 0; i < 16; i++) inputY.push(12 + i * 11);
  for (let hIndex = 0; hIndex < brain.hiddenSize; hIndex++) hiddenY.push(16 + hIndex * (165 / brain.hiddenSize));
  for (let o = 0; o < 7; o++) outputY.push(20 + o * 24);

  // W1 Synaptic Connections
  for (let hIndex = 0; hIndex < brain.hiddenSize; hIndex++) {
    const rowOffset = hIndex * brain.inputSize;
    for (let i = 0; i < 16; i++) {
      const weight = brain.W1[rowOffset + i];
      if (Math.abs(weight) < 0.08) continue;
      const alpha = clamp(Math.abs(weight) / 2.5, 0.1, 0.85);
      brainCtx.strokeStyle = weight > 0 ? `rgba(78, 205, 196, ${alpha})` : `rgba(240, 106, 56, ${alpha})`;
      brainCtx.lineWidth = clamp(Math.abs(weight) * 0.9, 0.4, 2.0);
      brainCtx.beginPath();
      brainCtx.moveTo(layerX[0], inputY[i]);
      brainCtx.lineTo(layerX[1], hiddenY[hIndex]);
      brainCtx.stroke();
    }
  }

  // W2 Synaptic Connections
  for (let o = 0; o < 7; o++) {
    const rowOffset = o * brain.maxHiddenSize;
    for (let hIndex = 0; hIndex < brain.hiddenSize; hIndex++) {
      const weight = brain.W2[rowOffset + hIndex];
      if (Math.abs(weight) < 0.08) continue;
      const alpha = clamp(Math.abs(weight) / 2.5, 0.1, 0.85);
      brainCtx.strokeStyle = weight > 0 ? `rgba(78, 205, 196, ${alpha})` : `rgba(240, 106, 56, ${alpha})`;
      brainCtx.lineWidth = clamp(Math.abs(weight) * 0.9, 0.4, 2.0);
      brainCtx.beginPath();
      brainCtx.moveTo(layerX[1], hiddenY[hIndex]);
      brainCtx.lineTo(layerX[2], outputY[o]);
      brainCtx.stroke();
    }
  }

  // Input Nodes
  for (let i = 0; i < 16; i++) {
    const act = inputs[i] || 0;
    brainCtx.fillStyle = i >= 12 ? `rgba(255,209,102,${0.4 + Math.abs(act) * 0.6})` : `rgba(78,205,196,${0.3 + Math.abs(act) * 0.7})`;
    brainCtx.beginPath(); brainCtx.arc(layerX[0], inputY[i], 3.2, 0, Math.PI * 2); brainCtx.fill();
    brainCtx.fillStyle = '#8b9488';
    brainCtx.font = '8px ui-monospace, monospace';
    brainCtx.textAlign = 'right';
    brainCtx.fillText(inputLabels[i], layerX[0] - 5, inputY[i] + 2.5);
  }

  // Hidden Nodes
  for (let hIndex = 0; hIndex < brain.hiddenSize; hIndex++) {
    const act = hidden[hIndex] || 0;
    brainCtx.fillStyle = `rgba(155,93,229,${0.4 + Math.abs(act) * 0.6})`;
    brainCtx.beginPath(); brainCtx.arc(layerX[1], hiddenY[hIndex], 4.0, 0, Math.PI * 2); brainCtx.fill();
  }

  // Output Nodes
  for (let o = 0; o < 7; o++) {
    const act = outputs[o] || 0;
    brainCtx.fillStyle = o >= 4 ? `rgba(255,209,102,${0.4 + Math.abs(act) * 0.6})` : `rgba(240,106,56,${0.3 + Math.abs(act) * 0.7})`;
    brainCtx.beginPath(); brainCtx.arc(layerX[2], outputY[o], 4.0, 0, Math.PI * 2); brainCtx.fill();
    brainCtx.fillStyle = '#e6ebd9';
    brainCtx.font = '8px ui-monospace, monospace';
    brainCtx.textAlign = 'left';
    brainCtx.fillText(outputLabels[o], layerX[2] + 6, outputY[o] + 2.5);
  }
}

// =====================================================================
// 12. TELEMETRY, STATS & MAIN LOOP
// =====================================================================

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
  popCtx.strokeStyle = '#4ecdc4';
  popCtx.lineWidth = 1.4;
  popCtx.stroke();
}

const statGrid = document.getElementById('statGrid');
function renderStats() {
  const s = world.stats;
  const rows = [
    ['Geological Era', s.era, 'purple'],
    ['Oxygen (O₂)', s.o2, 'cyan'],
    ['Population', s.population],
    ['Distinct Species', s.species],
    ['Terrestrial Adaptations', s.terrestrial, s.terrestrial > 0 ? 'emerald' : ''],
    ['Amphibious Lineages', s.amphibious, s.amphibious > 0 ? 'cyan' : ''],
    ['Average Hydration', s.avgMoisture + '%'],
    ['Dominant Species', s.topSpecies, 'cyan'],
    ['Colonies', s.colonies],
    ['Multicellular Bodies', s.multicellular, s.multicellular > 0 ? 'ember' : ''],
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

// =====================================================================
// 13. USER CONTROLS, CLADE TREE & GENE INSPECTOR
// =====================================================================

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
  world.terrain = new TerrainGrid(world.width, world.height, 40);
  world.food = new FoodGrid(world.width, world.height, 40, world.terrain);
  world.tickCount = 0;
  world.history = [];
  world.cladeTree.clear();
  loggedEvents.length = 0;
  eventLog.innerHTML = '';
  selected = null;
  world.seed(70);
  renderInspector();
});

// Sliders
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

// Disasters
document.getElementById('extinctionBtn').addEventListener('click', () => {
  world.massExtinction(0.75);
  world.events.push({ tick: world.tickCount, text: 'Mass extinction: 75% of organisms perish.' });
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
  setTimeout(() => {
    world.params.mutationRate = prev;
    mutSlider.value = prev;
    syncSliderLabels();
  }, 14000);
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
  if (selected && selected.alive) {
    selected.brain.reset();
    world.events.push({ tick: world.tickCount, text: `Cell #${selected.id}'s cognitive brain has been reset.` });
    renderBrainGraph();
  }
});
document.getElementById('pruneBrainBtn').addEventListener('click', () => {
  if (selected && selected.alive) {
    selected.brain.prune(0.15);
    world.events.push({ tick: world.tickCount, text: `Cell #${selected.id}'s weak synapses were pruned.` });
    renderBrainGraph();
  }
});

// Clade Tree Modal
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
        <span class="badge ${n.count > 0 ? 'phase4' : ''}">${n.count} alive</span>
      </div>
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
  inspectorTitle.innerHTML = `<span class="genome-swatch" style="background:hsl(${o.genome.hue.toFixed(0)},65%,58%)"></span>${o.genome.speciesName} #${o.id}`;
  const energyPct = Math.round((o.energy / o.maxEnergy) * 100);
  const matProps = world.terrain.getMaterialProps(o.x, o.y);

  inspectorBody.innerHTML = `
    <div class="stat-grid" style="margin-bottom:12px;">
      <div class="k">Species</div><div class="v purple">${o.genome.speciesName}</div>
      <div class="k">Morphotype</div><div class="v ember">${o.role}</div>
      <div class="k">Terrain Biome</div><div class="v cyan">${matProps.name}</div>
      <div class="k">Hydration</div><div class="v ${o.moisture < 25 ? 'ember' : 'cyan'}">${o.moisture.toFixed(0)}%</div>
      <div class="k">Endosymbionts</div><div class="v">${o.endosymbionts.join(', ') || 'None'}</div>
      <div class="k">Brain Nodes</div><div class="v">${o.brain.hiddenSize} Hidden</div>
      <div class="k">Energy</div><div class="v">${energyPct}%</div>
      <div class="k">Age</div><div class="v">${o.age} ticks</div>
      <div class="k">Generation</div><div class="v">${o.generation}</div>
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
    world.spawn(mutateGenome(o.genome, world.params.mutationRate), o.x, o.y, 0.5, o.brain, o.id);
    world.events.push({ tick: world.tickCount, text: `Organism #${o.id} cloned with mutative variation.` });
  });

  document.getElementById('mateBtn').addEventListener('click', () => {
    const nearby = world.organisms.filter(other => other !== o && other.alive && dist2(o.x, o.y, other.x, other.y) < 140 * 140);
    if (nearby.length > 0) {
      const partner = nearby[0];
      const childGenome = crossoverGenome(o.genome, partner.genome, world.params.mutationRate);
      const childBrain = o.brain.crossover(partner.brain, world.params.mutationRate);
      world.spawn(childGenome, (o.x + partner.x) / 2, (o.y + partner.y) / 2, 0.55, childBrain, o.id);
      world.events.push({ tick: world.tickCount, text: `Organisms #${o.id} & #${partner.id} mated via sexual crossover.` });
    } else {
      world.events.push({ tick: world.tickCount, text: `No compatible partner nearby to mate with #${o.id}.` });
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

document.getElementById('beginBtn').addEventListener('click', () => {
  document.getElementById('introOverlay').remove();
});
