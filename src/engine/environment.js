// ===== Primordial V4 Environment Module: Dual Biomes, Detritus Cycles & Atmospheric Chemistry =====

const { clamp } = require('./genome');

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

    // Atmospheric & Oceanic Chemistry
    this.o2Level = 0.05;
    this.co2Level = 0.85;
    this.h2sLevel = 0.65;
    this.currentEra = 'Hadean Volcanic';

    // Initialize nutrient density
    for (let i = 0; i < this.density.length; i++) {
      this.density[i] = 0.18 + Math.random() * 0.22;
      this.pheromones[i] = 0;
      this.toxins[i] = 0;
    }

    // Abyssal hydrothermal vents
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

  biomeAt(x, y) {
    if (this.terrain) {
      const mat = this.terrain.getMaterial(x, y);
      if (mat === 2) return 'land';
      if (mat === 3) return 'mud';
      if (mat === 4) return 'ice';
      if (mat === 1) return 'shallow';
      return 'abyssal';
    }
    const relY = y / (this.rows * this.cellSize);
    if (relY < 0.35) return 'photic';
    if (relY < 0.70) return 'pelagic';
    return 'abyssal';
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

        let soilMultiplier = 1.0;
        if (terrain) {
          const mat = terrain.materials[terrain.idx(
            clamp(Math.floor((cx / cols) * terrain.cols), 0, terrain.cols - 1),
            clamp(Math.floor((cy / rows) * terrain.rows), 0, terrain.rows - 1)
          )];
          if (mat === 3) soilMultiplier = 1.8; // Mud detritus blooms
          else if (mat === 4) soilMultiplier = 0.2; // Ice freezing
          else if (mat === 2) soilMultiplier = 1.2; // Land vegetation
        }

        density[i] = clamp(d + growthRate * light * soilMultiplier * d * (1 - d) + growthRate * 0.02 * light, 0, 1);
        pheromones[i] *= 0.95;
        toxins[i] *= 0.93;
      }
    }

    // Vent chemosynthesis
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

    // Fluid nutrient diffusion
    const samples = Math.floor(cols * rows * 0.04);
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
      const amt = nd * 0.05;
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

  toxinAt(x, y) {
    const { cx, cy } = this.cellAt(x, y);
    return this.toxins[this.idx(cx, cy)];
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

if (typeof module !== 'undefined') {
  module.exports = { FoodGrid };
}
