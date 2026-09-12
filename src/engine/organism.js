// ===== Primordial V4 Organism Module: Directional Compound Vision, Amphibious Locomotion, & Neuroplasticity =====

const { NeuralNetwork } = require('./brain');
const { clamp, lerp, dist2, hueDiff } = require('./genome');
const { castCompoundVision, HIT_TYPES } = require('./vision');
const { TERRAIN_TYPES, MATERIAL_PROPERTIES } = require('./terrain');

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

    // V4 Moisture & Terrestrial Physiology
    this.moisture = 100; // [0, 100]

    this.age = 0;
    this.generation = generation || 1;
    this.lineageId = lineageId || this.id;
    this.parentId = parentId || 0;
    this.reproCooldown = 0;
    this.alive = true;

    // V4 Cognitive Brain (16 inputs, 10 hidden, 7 outputs)
    this.brain = brain ? brain.clone() : new NeuralNetwork(16, 10, 7);

    // Endosymbiosis & Organelles
    this.endosymbionts = []; // ['chloroplast', 'mitochondria']
    if (Math.random() < 0.25 || (genome.endoCapacity > 0.4 && Math.random() < 0.6)) {
      this.endosymbionts.push(Math.random() < 0.5 ? 'chloroplast' : 'mitochondria');
    }

    // Inter-cell Nerve Net & Multicellular state
    this.nerveSignal = 0;
    this.colonySize = 1;
    this.colonyMemberCount = 1;
    this.colonyGroupId = 0;
    this.centroidX = x; this.centroidY = y;
    this.bondedPartners = [];
    this.role = 'unicellular'; // 'unicellular', 'shield', 'motor', 'digestor', 'ocellus', 'toxin', 'germ'

    // Telemetry & Statistics
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
    // Cast V4 compound eye rays and sample chemotaxis
    const vision = castCompoundVision(this, spatialHash, foodGrid, terrain, W, H);
    this.lastVision = vision;

    const rays = vision.rays;
    let threatAlert = 0;
    for (let r = 0; r < rays.length; r++) {
      if (rays[r].signature === HIT_TYPES.THREAT) {
        threatAlert = Math.max(threatAlert, rays[r].proximity);
      }
    }

    // Homeostatic Internal Drives
    const hungerDrive = clamp(1.0 - (this.energy / this.maxEnergy), 0, 1);
    const thirstDrive = clamp(1.0 - (this.moisture / 100), 0, 1);
    const matingDrive = (this.energy > this.reproduceThreshold && this.reproCooldown === 0) ? 1.0 : 0.0;

    let matFriction = 0.94;
    if (terrain) {
      const props = terrain.getMaterialProps(this.x, this.y);
      matFriction = props.friction;
    }

    // Build 16 cognitive inputs
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

    return inputs;
  }

  step(foodGrid, spatialHash, W, H, tempFactor = 1.0, terrain = null) {
    if (!this.alive) return;

    // 1. Perception & Cognitive Brain Inference
    const envInputs = this.perceive(foodGrid, spatialHash, W, H, terrain);
    const outputs = this.brain.forward(envInputs);

    let thrust = outputs[0];
    let turn = outputs[1];
    const attackImpulse = outputs[2];
    const colonyImpulse = outputs[3];

    // Smooth wander if thrust/turn are weak
    if (Math.abs(thrust) < 0.1 && Math.abs(turn) < 0.1) {
      this._wanderAngle += (Math.random() - 0.5) * 0.4;
      thrust = 0.45;
      turn = Math.sin(this._wanderAngle) * 0.3;
    }

    // 2. Terrain Materials & Amphibious Locomotion
    let mat = TERRAIN_TYPES.WATER_DEEP;
    let matProps = MATERIAL_PROPERTIES[TERRAIN_TYPES.WATER_DEEP];

    if (terrain) {
      mat = terrain.getMaterial(this.x, this.y);
      matProps = terrain.getMaterialProps(this.x, this.y);
    }

    // Moisture Dynamics
    if (mat === TERRAIN_TYPES.WATER_DEEP || mat === TERRAIN_TYPES.WATER_SHALLOW) {
      this.moisture = Math.min(100, this.moisture + matProps.moistureReplenish);
    } else if (mat === TERRAIN_TYPES.MUD) {
      this.moisture = Math.min(100, this.moisture + matProps.moistureReplenish);
      // Detritus grazing from mudflat
      this.energy = Math.min(this.maxEnergy, this.energy + 0.035);
    } else if (mat === TERRAIN_TYPES.LAND) {
      const moistureLoss = 0.14 * (1.0 - (this.genome.moistureRetention || 0) * 0.86);
      this.moisture = Math.max(0, this.moisture - moistureLoss);
      if (this.moisture <= 0) {
        // Desiccation trauma
        this.energy -= 0.18;
        this.brain.registerPain(0.35);
        this.brain.adaptPlasticity(-0.2, this.genome.plasticity);
      }
    } else if (mat === TERRAIN_TYPES.ICE) {
      this.moisture = Math.max(0, this.moisture - 0.05);
      // Thermal cold shock
      const coldResist = this.genome.thermalTolerance || 0;
      if (coldResist < 0.45) {
        const coldLoss = 0.12 * (0.45 - coldResist);
        this.energy -= coldLoss;
        this.brain.registerPain(0.15);
      }
    }

    // Locomotion Efficiency (Swim vs Crawl)
    const isWater = (mat === TERRAIN_TYPES.WATER_DEEP || mat === TERRAIN_TYPES.WATER_SHALLOW);
    const crawlGene = this.genome.locomotionType || 0;
    let locoEfficiency = 1.0;

    if (isWater) {
      locoEfficiency = 1.18 - crawlGene * 0.48; // Fins swim fast, heavy limbs drag
    } else {
      locoEfficiency = 0.28 + crawlGene * 1.15; // Swimmers flounder on land, crawlers thrive
    }

    // Steering & Acceleration
    const turnRate = 0.24 * (0.8 + (1 - this.genome.size / 4) * 0.4);
    this.facingAngle = (this.facingAngle + turn * turnRate + Math.PI * 2) % (Math.PI * 2);

    const forwardSpeed = Math.max(-0.25, thrust) * this.maxSpeed * locoEfficiency;
    const ax = Math.cos(this.facingAngle) * forwardSpeed * 0.38;
    const ay = Math.sin(this.facingAngle) * forwardSpeed * 0.38;

    this.vx = (this.vx + ax) * matProps.friction;
    this.vy = (this.vy + ay) * matProps.friction;

    // 3. Inter-Cell Nerve Signal Sharing across Multicellular Cluster
    this.nerveSignal = clamp(attackImpulse + colonyImpulse, 0, 1);
    const REST_LENGTH = 14;
    const STIFFNESS = 0.08;
    const DAMPING = 0.04;

    for (let i = 0; i < this.bondedPartners.length; i++) {
      const partner = this.bondedPartners[i];
      if (!partner.alive) continue;

      const dx = partner.x - this.x;
      const dy = partner.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const delta = dist - REST_LENGTH;

      const springF = delta * STIFFNESS;
      const nx = dx / dist;
      const ny = dy / dist;

      const relVx = partner.vx - this.vx;
      const relVy = partner.vy - this.vy;
      const dampF = (relVx * nx + relVy * ny) * DAMPING;

      const totalF = springF + dampF;
      this.vx += nx * totalF;
      this.vy += ny * totalF;

      // Inter-cell Nerve Net pulse propagation
      if (this.nerveSignal > 0.4 && partner.nerveSignal < 0.4) {
        partner.nerveSignal = this.nerveSignal * 0.85;
      }

      // Shared energy in digestor cells
      if (this.role === 'digestor' && this.energy > this.maxEnergy * 0.6 && partner.energy < partner.maxEnergy * 0.5) {
        const transfer = 0.12;
        this.energy -= transfer;
        partner.energy += transfer;
      }
    }

    // Pelagic currents in water
    if (mat === TERRAIN_TYPES.WATER_DEEP) {
      this.vx += Math.sin(this.y * 0.01) * 0.06;
    }

    // Stone Obstacle Collision Resolution
    if (terrain) {
      const col = terrain.resolveStoneCollision(this.x, this.y, this.effectiveSize, this.vx, this.vy);
      this.x = col.x;
      this.y = col.y;
      this.vx = col.vx;
      this.vy = col.vy;
      if (col.collided) {
        this.brain.registerPain(0.12);
      }
    }

    // Toroidal / Clamp bounds
    this.x = (this.x + this.vx + W) % W;
    this.y = (this.y + this.vy + H) % H;

    // 4. Endosymbiosis Photochemical & Metabolic Energy Generation
    if (this.endosymbionts.includes('chloroplast') && foodGrid && foodGrid.lightFactor(this.y / 40) > 0.3) {
      this.energy = Math.min(this.maxEnergy, this.energy + 0.085 * foodGrid.lightFactor(this.y / 40));
    }

    // 5. Venom Toxin Secretion
    if (foodGrid && (this.role === 'toxin' || this.genome.toxinGene > 0.4) && Math.random() < 0.15) {
      foodGrid.depositToxin(this.x, this.y, 0.22 * this.genome.toxinGene);
    }

    // 6. Environmental Feeding
    if (foodGrid && this.energy < this.maxEnergy * 0.98) {
      const eaten = foodGrid.eat(this.x, this.y, this.eatRate);
      if (eaten > 0) {
        const plantEff = 1 - this.genome.diet * 0.42;
        this.energy = Math.min(this.maxEnergy, this.energy + eaten * 44 * plantEff);
        // Positive Hebbian learning reward on feeding
        this.brain.adaptPlasticity(0.12, this.genome.plasticity);
      }
    }

    // 7. Predation & Combat
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
              this.energy *= 0.85;
              this.brain.registerPain(0.4);
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
              // Major positive reward on predatory catch
              this.brain.adaptPlasticity(0.5, this.genome.plasticity);
            }
          }
        }
      }
    }

    const speedUsed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    const cost = (this.metabolismBase + speedUsed * 0.032) * tempFactor;
    this.energy -= cost;
    this.age++;

    if (this.reproCooldown > 0) this.reproCooldown--;
  }
}

if (typeof module !== 'undefined') {
  module.exports = { Organism };
}
