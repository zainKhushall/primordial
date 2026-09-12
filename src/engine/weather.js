// ===== Primordial V5 Atmospheric Weather & Climate Fronts Engine =====
// Drifting rainstorms, freshwater moisture corridors, glacial blizzards,
// and atmospheric wind vectors.

const { clamp, dist2 } = require('./genome');

const WEATHER_TYPES = {
  RAIN: 0,
  BLIZZARD: 1,
  CLEAR: 2,
};

let WEATHER_ID_COUNTER = 1;

class WeatherFront {
  constructor(x, y, type = WEATHER_TYPES.RAIN, radius = 320, vx = 0.6, vy = 0.2) {
    this.id = WEATHER_ID_COUNTER++;
    this.x = x;
    this.y = y;
    this.type = type;
    this.radius = radius;
    this.vx = vx;
    this.vy = vy;
    this.intensity = 0.75 + Math.random() * 0.25;
    this.lifetime = 1200 + Math.floor(Math.random() * 800);
    this.age = 0;
    this.alive = true;
  }

  tick(W, H) {
    this.age++;
    this.x = (this.x + this.vx + W) % W;
    this.y = (this.y + this.vy + H) % H;

    if (this.age > this.lifetime) {
      this.alive = false;
    }
  }

  affects(x, y) {
    const d2 = dist2(this.x, this.y, x, y);
    if (d2 > this.radius * this.radius) return 0;
    const d = Math.sqrt(d2);
    return (1 - d / this.radius) * this.intensity;
  }
}

class WeatherManager {
  constructor(width = 4000, height = 3000) {
    this.width = width;
    this.height = height;
    this.fronts = [];
    this.windAngle = Math.PI * 0.15;
    this.windSpeed = 0.65;

    this.spawnInitialFronts();
  }

  spawnInitialFronts() {
    this.fronts = [];
    // 2 Rainstorms across central/southern latitudes
    this.fronts.push(new WeatherFront(800, 1200, WEATHER_TYPES.RAIN, 380, 0.7, 0.2));
    this.fronts.push(new WeatherFront(2400, 2000, WEATHER_TYPES.RAIN, 420, 0.6, 0.15));
    // 1 Glacial blizzard in the northern ice cap
    this.fronts.push(new WeatherFront(1800, 300, WEATHER_TYPES.BLIZZARD, 350, 0.8, -0.1));
  }

  spawnStorm(type = WEATHER_TYPES.RAIN, x, y, radius = 380) {
    const vx = Math.cos(this.windAngle) * this.windSpeed;
    const vy = Math.sin(this.windAngle) * this.windSpeed;
    const front = new WeatherFront(
      x !== undefined ? x : Math.random() * this.width,
      y !== undefined ? y : Math.random() * this.height,
      type, radius, vx, vy
    );
    this.fronts.push(front);
    return front;
  }

  getMoistureAt(x, y) {
    let moisture = 1.0;
    for (let i = 0; i < this.fronts.length; i++) {
      const f = this.fronts[i];
      if (f.type === WEATHER_TYPES.RAIN) {
        const inf = f.affects(x, y);
        if (inf > 0) moisture += inf * 1.5;
      }
    }
    return moisture;
  }

  getLightModifierAt(x, y) {
    let mod = 1.0;
    for (let i = 0; i < this.fronts.length; i++) {
      const inf = this.fronts[i].affects(x, y);
      if (inf > 0) {
        mod *= (1.0 - inf * 0.45);
      }
    }
    return mod;
  }

  tick() {
    for (let i = 0; i < this.fronts.length; i++) {
      this.fronts[i].tick(this.width, this.height);
    }
    this.fronts = this.fronts.filter(f => f.alive);

    // Maintain 2-4 active storms drifting across the continent
    if (this.fronts.length < 2) {
      const type = Math.random() < 0.7 ? WEATHER_TYPES.RAIN : WEATHER_TYPES.BLIZZARD;
      this.spawnStorm(type);
    }
  }
}

module.exports = {
  WeatherFront,
  WeatherManager,
  WEATHER_TYPES,
};
