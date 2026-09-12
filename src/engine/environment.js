// ===== Environment Module: Hydrothermal Vents, Photic Surface Zone & Nutrient Grid =====

const { clamp } = require('./genome');

class FoodGrid {
  constructor(width, height, cellSize = 20) {
    this.cellSize = cellSize;
    this.cols = Math.ceil(width / cellSize);
    this.rows = Math.ceil(height / cellSize);
    this.density = new Float32Array(this.cols * this.rows);
    this.vents = [];

    // Initialize initial primordial organic soup density
    for (let i = 0; i < this.density.length; i++) {
      this.density[i] = 0.16 + Math.random() * 0.24;
    }

    // Spawn deep-sea hydrothermal vents at the bottom/lower ocean region
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

  idx(cx, cy) {
    return cy * this.cols + cx;
  }

  cellAt(x, y) {
    const cx = clamp(Math.floor(x / this.cellSize), 0, this.cols - 1);
    const cy = clamp(Math.floor(y / this.cellSize), 0, this.rows - 1);
    return { cx, cy };
  }

  // Sunlight penetration: higher at the top surface, decreases with depth
  lightFactor(cy) {
    return 0.3 + 0.7 * (1 - cy / this.rows);
  }

  grow(growthRate = 0.011) {
    const { cols, rows, density } = this;

    // 1. Photic / Surface plant nutrient growth
    for (let cy = 0; cy < rows; cy++) {
      const light = this.lightFactor(cy);
      const rowBase = cy * cols;
      for (let cx = 0; cx < cols; cx++) {
        const i = rowBase + cx;
        const d = density[i];
        density[i] = clamp(d + growthRate * light * d * (1 - d) + growthRate * 0.022 * light, 0, 1);
      }
    }

    // 2. Hydrothermal vent chemosynthesis (independent of light)
    for (const vent of this.vents) {
      for (let dy = -vent.r; dy <= vent.r; dy++) {
        for (let dx = -vent.r; dx <= vent.r; dx++) {
          const cx = vent.cx + dx, cy = vent.cy + dy;
          if (cx < 0 || cy < 0 || cx >= cols || cy >= rows) continue;
          if (dx * dx + dy * dy > vent.r * vent.r) continue;
          const i = this.idx(cx, cy);
          if (density[i] < 0.65) {
            density[i] = Math.min(0.65, density[i] + 0.035 * vent.heat);
          }
        }
      }
    }

    // 3. Fluid diffusion of nutrients across adjacent cells
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
