// ===== Primordial V4 Terrain & Material Engine =====
// Dual Land/Water biomes, physical materials (Stone, Mud, Ice, Water, Land),
// collision response, and raymarching occlusion.

const { clamp, dist2 } = require('./genome');

const TERRAIN_TYPES = {
  WATER_DEEP: 0,
  WATER_SHALLOW: 1,
  LAND: 2,
  MUD: 3,
  ICE: 4,
};

const MATERIAL_PROPERTIES = {
  [TERRAIN_TYPES.WATER_DEEP]: {
    name: 'Deep Ocean',
    friction: 0.94,
    buoyancy: 1.0,
    moistureReplenish: 1.2,
    viscosity: 1.0,
    temp: 0.5,
    detritus: 0.05,
    color: '#0a1e28',
  },
  [TERRAIN_TYPES.WATER_SHALLOW]: {
    name: 'Tidal Shallows',
    friction: 0.92,
    buoyancy: 0.9,
    moistureReplenish: 1.5,
    viscosity: 1.05,
    temp: 0.6,
    detritus: 0.2,
    color: '#12383c',
  },
  [TERRAIN_TYPES.LAND]: {
    name: 'Continental Land',
    friction: 0.88,
    buoyancy: 0.0,
    moistureReplenish: -0.85, // Dehydrates unadapted creatures
    viscosity: 1.1,
    temp: 0.65,
    detritus: 0.15,
    color: '#342f22',
  },
  [TERRAIN_TYPES.MUD]: {
    name: 'Detritus Mudflat',
    friction: 0.72,          // Viscous deceleration
    buoyancy: 0.3,
    moistureReplenish: 0.4,   // Damp, delays desiccation
    viscosity: 2.2,          // High resistance to swift swimming
    temp: 0.55,
    detritus: 0.85,          // Rich in grazing matter
    color: '#282015',
  },
  [TERRAIN_TYPES.ICE]: {
    name: 'Glacial Ice Sheet',
    friction: 0.985,         // Low friction, continuous sliding
    buoyancy: 0.0,
    moistureReplenish: -0.4,
    viscosity: 0.8,
    temp: -0.8,              // Severe cold shock risk
    detritus: 0.02,
    color: '#2b4458',
  },
};

class TerrainGrid {
  constructor(width = 4000, height = 3000, cellSize = 40) {
    this.width = width;
    this.height = height;
    this.cellSize = cellSize;
    this.cols = Math.ceil(width / cellSize);
    this.rows = Math.ceil(height / cellSize);

    // Byte array for material types (0: Water Deep, 1: Water Shallow, 2: Land, 3: Mud, 4: Ice)
    this.materials = new Uint8Array(this.cols * this.rows);
    // Float array for ground organic detritus / mineral nutrition
    this.detritusGrid = new Float32Array(this.cols * this.rows);

    // Stone / Boulder physical colliders: Array of { id, x, y, r, minerals }
    this.stones = [];
    this._stoneSpatialHash = new Map();
    this.stoneCellSize = 120;
    this.stoneCols = Math.ceil(width / this.stoneCellSize);
    this.stoneRows = Math.ceil(height / this.stoneCellSize);

    this.generateProceduralWorld();
  }

  idx(cx, cy) {
    return cy * this.cols + cx;
  }

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

  // --- Procedural Generation of Primordial Continental Earth ---
  generateProceduralWorld() {
    const { cols, rows, materials, detritusGrid, width, height } = this;

    // Simple pseudo-noise using trigonometric harmonics
    const fbm = (nx, ny) => {
      let val = Math.sin(nx * 1.8) * Math.cos(ny * 1.6);
      val += 0.5 * Math.sin(nx * 3.7 + 1.2) * Math.cos(ny * 3.4 + 0.8);
      val += 0.25 * Math.sin(nx * 7.5 - 0.4) * Math.cos(ny * 8.1 + 2.1);
      val += 0.125 * Math.sin(nx * 16.2) * Math.sin(ny * 15.8);
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
        // Height formula: high in center-east, low on west & borders
        const elevation = noise * 0.8 - (centerDist * 1.35) + 0.55;

        const i = cy * cols + cx;

        // Polar glacial ice (top and bottom latitudes, plus high mountain elevation)
        const isPolar = (cy < rows * 0.12 || cy > rows * 0.88);
        const isMountainIce = elevation > 1.05;

        if (isPolar || isMountainIce) {
          materials[i] = TERRAIN_TYPES.ICE;
          detritusGrid[i] = 0.05;
        } else if (elevation > 0.35) {
          // Continental interior
          materials[i] = TERRAIN_TYPES.LAND;
          detritusGrid[i] = 0.25 + Math.random() * 0.3;
        } else if (elevation > 0.08) {
          // Coastal zone: blend of mudflats and shallow tidal waters
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
          // Deep oceanic basin
          materials[i] = TERRAIN_TYPES.WATER_DEEP;
          detritusGrid[i] = 0.08;
        }
      }
    }

    // Generate Natural Stone Formations & Boulders
    this.stones = [];
    const stoneCount = 140;
    let stoneId = 1;

    for (let s = 0; s < stoneCount; s++) {
      const sx = 100 + Math.random() * (width - 200);
      const sy = 100 + Math.random() * (height - 200);
      const radius = 18 + Math.random() * 32;

      // Group some stones in clusters
      const clusterSize = Math.random() < 0.4 ? (2 + Math.floor(Math.random() * 4)) : 1;
      for (let c = 0; c < clusterSize; c++) {
        const ox = sx + (c > 0 ? (Math.random() - 0.5) * 80 : 0);
        const oy = sy + (c > 0 ? (Math.random() - 0.5) * 80 : 0);
        const r = clamp(radius * (0.7 + Math.random() * 0.6), 14, 48);

        if (ox > r && ox < width - r && oy > r && oy < height - r) {
          this.stones.push({
            id: stoneId++,
            x: ox,
            y: oy,
            r: r,
            minerals: 0.5 + Math.random() * 0.5,
          });
        }
      }
    }

    this.rebuildStoneSpatialHash();
  }

  // --- Stone Spatial Hash Indexing ---
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
          if (!bucket) {
            bucket = [];
            this._stoneSpatialHash.set(k, bucket);
          }
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
            if (!visited.has(st.id)) {
              visited.add(st.id);
              result.push(st);
            }
          }
        }
      }
    }
    return result;
  }

  // --- Collision Resolution with Solid Stones ---
  resolveStoneCollision(x, y, radius, vx, vy) {
    const nearby = this.queryStonesNear(x, y, radius + 50);
    let resolvedX = x;
    let resolvedY = y;
    let resolvedVx = vx;
    let resolvedVy = vy;
    let collided = false;

    for (const st of nearby) {
      const minDist = st.r + radius;
      const dx = resolvedX - st.x;
      const dy = resolvedY - st.y;
      const d2 = dx * dx + dy * dy;

      if (d2 < minDist * minDist) {
        collided = true;
        const d = Math.sqrt(d2) || 1;
        const nx = dx / d;
        const ny = dy / d;
        const overlap = minDist - d;

        // Push out
        resolvedX += nx * overlap;
        resolvedY += ny * overlap;

        // Elastic/friction bounce: reflect velocity along normal
        const dot = resolvedVx * nx + resolvedVy * ny;
        if (dot < 0) {
          resolvedVx = (resolvedVx - 1.4 * dot * nx) * 0.65;
          resolvedVy = (resolvedVy - 1.4 * dot * ny) * 0.65;
        }
      }
    }

    return {
      x: resolvedX,
      y: resolvedY,
      vx: resolvedVx,
      vy: resolvedVy,
      collided,
    };
  }

  // --- Raycast against Solid Stones (Obstacle Occlusion) ---
  raycastStone(originX, originY, dirX, dirY, maxDist) {
    const nearby = this.queryStonesNear(
      originX + dirX * maxDist * 0.5,
      originY + dirY * maxDist * 0.5,
      maxDist * 0.6 + 60
    );

    let closestDist = maxDist;
    let hitStone = null;

    for (const st of nearby) {
      // Ray-circle intersection
      const fx = originX - st.x;
      const fy = originY - st.y;

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

    return {
      hit: hitStone !== null,
      dist: closestDist,
      stone: hitStone,
    };
  }

  // --- Interactive Paint / Sculpting Tools (God Mode) ---
  paintMaterial(x, y, radius, materialType) {
    const { cols, rows, materials, cellSize } = this;
    const rCells = Math.ceil(radius / cellSize);
    const { cx: ccx, cy: ccy } = this.cellAt(x, y);

    for (let dy = -rCells; dy <= rCells; dy++) {
      for (let dx = -rCells; dx <= rCells; dx++) {
        const cx = ccx + dx;
        const cy = ccy + dy;
        if (cx < 0 || cy < 0 || cx >= cols || cy >= rows) continue;
        const px = (cx + 0.5) * cellSize;
        const py = (cy + 0.5) * cellSize;
        if (dist2(px, py, x, y) <= radius * radius) {
          materials[this.idx(cx, cy)] = materialType;
        }
      }
    }
  }

  addStone(x, y, radius = 26) {
    const id = this.stones.length + 1;
    this.stones.push({
      id,
      x,
      y,
      r: radius,
      minerals: 0.8,
    });
    this.rebuildStoneSpatialHash();
  }

  removeStone(x, y, radius = 40) {
    this.stones = this.stones.filter(st => dist2(st.x, st.y, x, y) > (st.r + radius) * (st.r + radius));
    this.rebuildStoneSpatialHash();
  }
}

if (typeof module !== 'undefined') {
  module.exports = {
    TerrainGrid,
    TERRAIN_TYPES,
    MATERIAL_PROPERTIES,
  };
}
