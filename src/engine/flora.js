// ===== Primordial V5 Living Flora & Autotroph Ecosystem Engine =====
// Physical plant entities: Kelp forests, Terrestrial Mosses, Tidal Corals,
// photosynthesis, swaying currents, spore dispersal, and herbivore grazing.

const { clamp, dist2 } = require('./genome');
const { TERRAIN_TYPES } = require('./terrain');

const FLORA_TYPES = {
  KELP: 0,
  MOSS: 1,
  CORAL: 2,
  FERN: 3,
};

const FLORA_PROPERTIES = {
  [FLORA_TYPES.KELP]: {
    name: 'Giant Kelp',
    maxHeight: 45,
    maxBiomass: 35,
    color: '#38b000',
    preferredTerrain: [TERRAIN_TYPES.WATER_DEEP, TERRAIN_TYPES.WATER_SHALLOW],
    o2Output: 0.0004,
  },
  [FLORA_TYPES.MOSS]: {
    name: 'Continental Moss',
    maxHeight: 14,
    maxBiomass: 20,
    color: '#70e000',
    preferredTerrain: [TERRAIN_TYPES.LAND, TERRAIN_TYPES.MUD],
    o2Output: 0.0003,
  },
  [FLORA_TYPES.CORAL]: {
    name: 'Tidal Coral Polyp',
    maxHeight: 22,
    maxBiomass: 28,
    color: '#ff70a6',
    preferredTerrain: [TERRAIN_TYPES.WATER_SHALLOW],
    o2Output: 0.0002,
  },
  [FLORA_TYPES.FERN]: {
    name: 'Coastal Fern',
    maxHeight: 28,
    maxBiomass: 30,
    color: '#007200',
    preferredTerrain: [TERRAIN_TYPES.LAND, TERRAIN_TYPES.MUD],
    o2Output: 0.00035,
  },
};

let FLORA_ID_COUNTER = 1;

class Flora {
  constructor(x, y, type = FLORA_TYPES.KELP, initialBiomass = 8) {
    this.id = FLORA_ID_COUNTER++;
    this.x = x;
    this.y = y;
    this.type = type;

    const props = FLORA_PROPERTIES[type] || FLORA_PROPERTIES[FLORA_TYPES.KELP];
    this.maxBiomass = props.maxBiomass;
    this.biomass = initialBiomass;
    this.height = (this.biomass / this.maxBiomass) * props.maxHeight;
    this.maxHeight = props.maxHeight;

    this.age = 0;
    this.matureAge = 120 + Math.floor(Math.random() * 80);
    this.sporeCooldown = Math.floor(Math.random() * 100);
    this.alive = true;

    this.swayPhase = Math.random() * Math.PI * 2;
    this.swaySpeed = 0.04 + Math.random() * 0.03;
  }

  get radius() {
    return Math.max(4, this.height * 0.45);
  }

  tick(lightFactor = 1.0, soilNutrient = 0.5, moisture = 1.0) {
    if (!this.alive) return null;
    this.age++;
    if (this.sporeCooldown > 0) this.sporeCooldown--;

    const props = FLORA_PROPERTIES[this.type];

    // Photosynthesis & Growth
    const growth = 0.035 * lightFactor * (0.5 + soilNutrient * 0.8) * Math.min(1.5, moisture);
    this.biomass = Math.min(this.maxBiomass, this.biomass + growth);
    this.height = (this.biomass / this.maxBiomass) * props.maxHeight;

    // Spore generation when mature and healthy
    if (this.biomass >= this.maxBiomass * 0.65 && this.sporeCooldown <= 0 && this.age > this.matureAge) {
      this.sporeCooldown = 180 + Math.floor(Math.random() * 120);
      return {
        originX: this.x,
        originY: this.y,
        type: this.type,
      };
    }

    return null;
  }

  graze(amount) {
    const taken = Math.min(this.biomass * 0.6, amount);
    this.biomass -= taken;
    this.height = (this.biomass / this.maxBiomass) * this.maxHeight;
    if (this.biomass < 1.2) {
      this.alive = false;
    }
    return taken;
  }
}

class FloraManager {
  constructor(width = 4000, height = 3000, cellSize = 100) {
    this.width = width;
    this.height = height;
    this.cellSize = cellSize;
    this.cols = Math.ceil(width / cellSize);
    this.rows = Math.ceil(height / cellSize);

    this.floras = [];
    this.maxFloraCount = 380;
    this._spatialBuckets = new Map();
  }

  clear() {
    this.floras = [];
    this._spatialBuckets.clear();
  }

  _hashKey(cx, cy) {
    return `${cx},${cy}`;
  }

  rebuildSpatialHash() {
    this._spatialBuckets.clear();
    for (let i = 0; i < this.floras.length; i++) {
      const f = this.floras[i];
      if (!f.alive) continue;
      const cx = clamp(Math.floor(f.x / this.cellSize), 0, this.cols - 1);
      const cy = clamp(Math.floor(f.y / this.cellSize), 0, this.rows - 1);
      const k = this._hashKey(cx, cy);
      let arr = this._spatialBuckets.get(k);
      if (!arr) { arr = []; this._spatialBuckets.set(k, arr); }
      arr.push(f);
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

  addFlora(x, y, type = FLORA_TYPES.KELP, initialBiomass = 8) {
    if (this.floras.length >= this.maxFloraCount) {
      // Clean dead floras
      this.floras = this.floras.filter(f => f.alive);
      if (this.floras.length >= this.maxFloraCount) return null;
    }
    const flora = new Flora(x, y, type, initialBiomass);
    this.floras.push(flora);
    return flora;
  }

  seedInitialFlora(terrain, count = 180) {
    this.clear();
    for (let i = 0; i < count; i++) {
      const x = 80 + Math.random() * (this.width - 160);
      const y = 80 + Math.random() * (this.height - 160);
      const mat = terrain.getMaterial(x, y);

      let type = FLORA_TYPES.KELP;
      if (mat === TERRAIN_TYPES.LAND) {
        type = Math.random() < 0.6 ? FLORA_TYPES.MOSS : FLORA_TYPES.FERN;
      } else if (mat === TERRAIN_TYPES.MUD) {
        type = Math.random() < 0.5 ? FLORA_TYPES.MOSS : FLORA_TYPES.KELP;
      } else if (mat === TERRAIN_TYPES.WATER_SHALLOW) {
        type = Math.random() < 0.4 ? FLORA_TYPES.CORAL : FLORA_TYPES.KELP;
      } else if (mat === TERRAIN_TYPES.WATER_DEEP) {
        type = FLORA_TYPES.KELP;
      } else {
        continue; // Don't seed on ice
      }

      this.addFlora(x, y, type, 10 + Math.random() * 15);
    }
    this.rebuildSpatialHash();
  }

  tick(foodGrid, terrain, weatherManager = null, tickCount = 0) {
    const sporesToPlant = [];
    let netO2Generation = 0;

    for (let i = 0; i < this.floras.length; i++) {
      const f = this.floras[i];
      if (!f.alive) continue;

      const light = foodGrid ? foodGrid.lightFactor(f.y / 40, tickCount) : 1.0;
      let soilNutrient = 0.4;
      if (foodGrid) {
        const cell = foodGrid.cellAt(f.x, f.y);
        soilNutrient = foodGrid.density[foodGrid.idx(cell.cx, cell.cy)] || 0.4;
      }

      let moisture = 1.0;
      if (weatherManager) {
        moisture = weatherManager.getMoistureAt(f.x, f.y);
      }

      const spore = f.tick(light, soilNutrient, moisture);
      if (spore) sporesToPlant.push(spore);

      const props = FLORA_PROPERTIES[f.type];
      netO2Generation += props.o2Output;
    }

    // Germinate Spores
    if (this.floras.length < this.maxFloraCount && sporesToPlant.length > 0) {
      for (const spore of sporesToPlant) {
        if (this.floras.length >= this.maxFloraCount) break;
        const driftDist = 30 + Math.random() * 90;
        const driftAngle = Math.random() * Math.PI * 2;
        const nx = clamp(spore.originX + Math.cos(driftAngle) * driftDist, 40, this.width - 40);
        const ny = clamp(spore.originY + Math.sin(driftAngle) * driftDist, 40, this.height - 40);

        const mat = terrain.getMaterial(nx, ny);
        const props = FLORA_PROPERTIES[spore.type];
        if (props.preferredTerrain.includes(mat)) {
          this.addFlora(nx, ny, spore.type, 5);
        }
      }
    }

    // Periodic prune of dead floras and spatial hash rebuild
    if (tickCount % 20 === 0) {
      this.floras = this.floras.filter(f => f.alive);
      this.rebuildSpatialHash();
    }

    return netO2Generation;
  }
}

module.exports = {
  Flora,
  FloraManager,
  FLORA_TYPES,
  FLORA_PROPERTIES,
};
