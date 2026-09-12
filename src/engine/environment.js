// ===== Phase 2 Environment Module: Multi-Biome, Day/Night Cycle & Pheromone Grid =====

const { clamp } = require('./genome');

class FoodGrid {
  constructor(width, height, cellSize = 20) {
    this.cellSize = cellSize;
    this.cols = Math.ceil(width / cellSize);
    this.rows = Math.ceil(height / cellSize);
    this.density = new Float32Array(this.cols * this.rows);
    this.pheromones = new Float32Array(this.cols * this.rows); // Pheromone signal layer
    this.vents = [];

    // Initialize nutrient density
    for (let i = 0; i < this.density.length; i++) {
      this.density[i] = 0.16 + Math.random() * 0.24;
      this.pheromones[i] = 0;
    }

    // Abyssal hydrothermal vents
    const ventCount = 5;
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

  // Get environment biome type at coordinate
  biomeAt(x, y) {
    const relY = y / (this.rows * this.cellSize);
    if (relY < 0.35) return 'photic'; // Sunlit Surface
    if (relY < 0.70) return 'pelagic'; // Open Water Drift
    return 'abyssal'; // Deep Vents
  }

  // Diurnal Day/Night Cycle light multiplier
  lightFactor(cy, tickCount = 0) {
    const dayNightOscillation = 0.3 + 0.7 * Math.pow(Math.sin((tickCount * Math.PI) / 120), 2);
    const depthFactor = 0.2 + 0.8 * (1 - cy / this.rows);
    return dayNightOscillation * depthFactor;
  }

  grow(growthRate = 0.011, tickCount = 0) {
    const { cols, rows, density, pheromones } = this;

    // 1. Photic plant growth with Day/Night cycle
    for (let cy = 0; cy < rows; cy++) {
      const light = this.lightFactor(cy, tickCount);
      const rowBase = cy * cols;
      for (let cx = 0; cx < cols; cx++) {
        const i = rowBase + cx;
        const d = density[i];
        density[i] = clamp(d + growthRate * light * d * (1 - d) + growthRate * 0.022 * light, 0, 1);

        // Pheromone decay
        pheromones[i] *= 0.96;
      }
    }

    // 2. Hydrothermal vent chemosynthesis
    for (const vent of this.vents) {
      for (let dy = -vent.r; dy <= vent.r; dy++) {
        for (let dx = -vent.r; dx <= vent.r; dx++) {
          const cx = vent.cx + dx, cy = vent.cy + dy;
          if (cx < 0 || cy < 0 || cx >= cols || cy >= rows) continue;
          if (dx * dx + dy * dy > vent.r * vent.r) continue;
          const i = this.idx(cx, cy);
          if (density[i] < 0.68) {
            density[i] = Math.min(0.68, density[i] + 0.038 * vent.heat);
          }
        }
      }
    }

    // 3. Fluid nutrient diffusion
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

  pheromoneAt(x, y) {
    const { cx, cy } = this.cellAt(x, y);
    return this.pheromones[this.idx(cx, cy)];
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
        if (d > bestD) {
          bestD = d;
          best = { x: (cx + 0.5) * this.cellSize, y: (cy + 0.5) * this.cellSize, d };
        }
      }
    }
    return best;
  }
}

if (typeof module !== 'undefined') {
  module.exports = { FoodGrid };
}
