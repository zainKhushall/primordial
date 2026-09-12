// ===== Primordial V5 Carcass & Scavenger Ecology Engine =====
// Persistent carcasses, flesh decomposition, skeletal remains,
// bone fossilization, and scavenger feeding.

const { clamp, dist2 } = require('./genome');

let CARCASS_ID_COUNTER = 1;

class Carcass {
  constructor(x, y, size = 1.0, hue = 180, speciesName = 'Unknown', energy = 30) {
    this.id = CARCASS_ID_COUNTER++;
    this.x = x;
    this.y = y;
    this.size = size;
    this.hue = hue;
    this.speciesName = speciesName;

    this.maxMeat = 15 + size * 25 + Math.min(30, energy * 0.4);
    this.meatEnergy = this.maxMeat;
    this.boneIntegrity = 100; // Bone skeleton integrity [0, 100]
    this.age = 0;
    this.alive = true; // Still present in world
  }

  get isSkeleton() {
    return this.meatEnergy <= 0.5;
  }

  get radius() {
    return 3.0 + this.size * 3.2;
  }

  scavenge(amount) {
    if (this.meatEnergy <= 0) return 0;
    const taken = Math.min(this.meatEnergy, amount);
    this.meatEnergy -= taken;
    return taken;
  }

  tick(foodGrid = null) {
    this.age++;

    // Flesh Decomposition
    if (this.meatEnergy > 0) {
      const rotRate = 0.035 + this.size * 0.015;
      const rot = Math.min(this.meatEnergy, rotRate);
      this.meatEnergy -= rot;

      // Fertilize surrounding soil/water with rot nutrients
      if (foodGrid) {
        foodGrid.deposit(this.x, this.y, rot * 0.08);
      }
    } else {
      // Skeleton petrification & sinking into sediment
      this.boneIntegrity -= 0.075;
      if (this.boneIntegrity <= 0) {
        this.alive = false;
      }
    }
  }
}

class CarcassManager {
  constructor(width = 4000, height = 3000, cellSize = 100) {
    this.width = width;
    this.height = height;
    this.cellSize = cellSize;
    this.cols = Math.ceil(width / cellSize);
    this.rows = Math.ceil(height / cellSize);

    this.carcasses = [];
    this.fossilBed = []; // Deep historical records
    this.maxCarcasses = 180;
    this._spatialBuckets = new Map();
  }

  clear() {
    this.carcasses = [];
    this._spatialBuckets.clear();
  }

  _hashKey(cx, cy) {
    return `${cx},${cy}`;
  }

  rebuildSpatialHash() {
    this._spatialBuckets.clear();
    for (let i = 0; i < this.carcasses.length; i++) {
      const c = this.carcasses[i];
      if (!c.alive) continue;
      const cx = clamp(Math.floor(c.x / this.cellSize), 0, this.cols - 1);
      const cy = clamp(Math.floor(c.y / this.cellSize), 0, this.rows - 1);
      const k = this._hashKey(cx, cy);
      let arr = this._spatialBuckets.get(k);
      if (!arr) { arr = []; this._spatialBuckets.set(k, arr); }
      arr.push(c);
    }
  }

  queryNear(x, y, radius) {
    const minCx = clamp(Math.floor((x - radius) / this.cellSize), 0, this.cols - 1);
    const maxCx = clamp(Math.floor((x + radius) / this.cellSize), 0, this.cols - 1);
    const minCy = clamp(Math.floor((y - radius) / this.cellSize), 0, this.rows - 1);
    const maxCy = clamp(Math.floor((y + radius) / this.cellSize), 0, this.rows - 1);

    const result = [];
    for (let cy = minCy; cy <= maxCy; cy++) {
      for (let cx = minCx; cx <= maxCx; cx++) {
        const bucket = this._spatialBuckets.get(this._hashKey(cx, cy));
        if (bucket) {
          for (let i = 0; i < bucket.length; i++) {
            result.push(bucket[i]);
          }
        }
      }
    }
    return result;
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

  tick(foodGrid = null, tickCount = 0) {
    for (let i = 0; i < this.carcasses.length; i++) {
      const c = this.carcasses[i];
      c.tick(foodGrid);

      // Archive into fossil bed when petrifying
      if (!c.alive && c.isSkeleton) {
        this.fossilBed.push({
          x: c.x,
          y: c.y,
          size: c.size,
          speciesName: c.speciesName,
          fossilTick: tickCount,
        });
        if (this.fossilBed.length > 50) this.fossilBed.shift();
      }
    }

    if (tickCount % 25 === 0) {
      this.carcasses = this.carcasses.filter(c => c.alive);
      this.rebuildSpatialHash();
    }
  }
}

module.exports = {
  Carcass,
  CarcassManager,
};
