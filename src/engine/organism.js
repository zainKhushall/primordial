// ===== Organism Module: Single-Cell & Multicellular Organism Implementation =====

const { NeuralNetwork } = require('./brain');
const { clamp, lerp, dist2, hueDiff } = require('./genome');

let ORG_ID_COUNTER = 1;

class Organism {
  constructor(x, y, genome, energy, generation, lineageId, brain) {
    this.id = ORG_ID_COUNTER++;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;

    this.genome = genome;
    this.maxEnergy = 40 + genome.size * 60;
    this.energy = energy !== undefined ? energy : this.maxEnergy * 0.55;

    this.age = 0;
    this.generation = generation || 1;
    this.lineageId = lineageId || this.id;
    this.reproCooldown = 0;
    this.alive = true;

    // Brain neural network initialization or inherit
    this.brain = brain ? brain.clone() : new NeuralNetwork(8, 6, 4);

    // Colony & Multicellular state
    this.colonySize = 1;
    this.colonyMemberCount = 1;
    this.colonyGroupId = 0;
    this.centroidX = x;
    this.centroidY = y;
    this.role = 'unicellular'; // 'unicellular', 'feeder', 'defender', 'reproducer', 'navigator'

    // Statistics
    this.kills = 0;
    this.offspringCount = 0;

    // Internal wander state for backup
    this._wanderAngle = Math.random() * Math.PI * 2;
  }

  get maxSpeed() {
    return clamp(this.genome.speed / Math.sqrt(this.genome.size), 0.2, 3.4);
  }
  get eatRate() {
    let rate = 0.016 + this.genome.size * 0.012;
    if (this.role === 'feeder') rate *= 1.4;
    return rate;
  }
  get metabolismBase() {
    let base = 0.01 + Math.pow(this.genome.size, 1.65) * 0.013;
    base *= (1.1 - this.genome.membrane * 0.25); // membrane reduces basal waste
    if (this.role === 'reproducer') base *= 0.85;
    return base;
  }
  get lifespan() {
    return 520 + this.genome.size * 280;
  }
  get reproduceThreshold() {
    let factor = 0.72;
    if (this.role === 'reproducer') factor = 0.58;
    return this.maxEnergy * factor;
  }
  get captureRadius() {
    return 3.8 + this.genome.size * 3.4;
  }
  get effectiveSize() {
    return this.genome.size * this.colonySize;
  }

  // Determine cell role within a multicellular cluster based on position & genes
  updateRole(clusterMembers) {
    if (!clusterMembers || clusterMembers.length < 2) {
      this.role = 'unicellular';
      return;
    }
    // Calculate distance to centroid
    const dToCenter = Math.sqrt(dist2(this.x, this.y, this.centroidX, this.centroidY));
    const g = this.genome;

    if (dToCenter < 12 && g.colony > 0.5) {
      this.role = 'reproducer';
    } else if (g.aggression > 0.4 || g.diet > 0.35) {
      this.role = 'defender';
    } else if (g.speed > 1.4) {
      this.role = 'navigator';
    } else {
      this.role = 'feeder';
    }
  }

  // Gather sensory environment inputs for neural network
  perceive(foodGrid, spatialHash, W, H) {
    const senseR = this.genome.sense;
    const senseR2 = senseR * senseR;

    // 1. Food sensor
    const bestFoodCell = foodGrid.bestCellNear(this.x, this.y, senseR);
    let foodDx = 0, foodDy = 0;
    if (bestFoodCell) {
      const fdx = bestFoodCell.x - this.x;
      const fdy = bestFoodCell.y - this.y;
      const fdist = Math.sqrt(fdx * fdx + fdy * fdy) || 1;
      foodDx = fdx / fdist;
      foodDy = fdy / fdist;
    }

    // 2. Creature sensors
    const neighbors = spatialHash.query(this.x, this.y, senseR);
    let prey = null, preyD2 = Infinity;
    let threat = null, threatD2 = Infinity;
    let kinSumX = 0, kinSumY = 0, kinCount = 0;

    for (const other of neighbors) {
      if (other === this || !other.alive) continue;
      const d2 = dist2(this.x, this.y, other.x, other.y);
      if (d2 > senseR2) continue;

      const sameLineage = hueDiff(this.genome.hue, other.genome.hue) < 14;
      const otherEff = other.effectiveSize;
      const selfEff = this.effectiveSize;

      if (sameLineage) {
        kinSumX += other.x;
        kinSumY += other.y;
        kinCount++;
      } else {
        if (otherEff > selfEff * 1.12 && (other.genome.aggression > 0.25 || other.genome.diet > 0.2)) {
          if (d2 < threatD2) { threatD2 = d2; threat = other; }
        }
        if (this.genome.diet > 0.12 && otherEff * 1.1 < selfEff) {
          if (d2 < preyD2) { preyD2 = d2; prey = other; }
        }
      }
    }

    let preyDx = 0, preyDy = 0;
    if (prey) {
      const pdx = prey.x - this.x, pdy = prey.y - this.y;
      const pdist = Math.sqrt(pdx * pdx + pdy * pdy) || 1;
      preyDx = pdx / pdist; preyDy = pdy / pdist;
    }

    let threatDx = 0, threatDy = 0;
    if (threat) {
      const tdx = threat.x - this.x, tdy = threat.y - this.y;
      const tdist = Math.sqrt(tdx * tdx + tdy * tdy) || 1;
      threatDx = tdx / tdist; threatDy = tdy / tdist;
    }

    let kinDx = 0, kinDy = 0;
    if (kinCount > 0) {
      const kcx = kinSumX / kinCount, kcy = kinSumY / kinCount;
      const kdx = kcx - this.x, kdy = kcy - this.y;
      const kdist = Math.sqrt(kdx * kdx + kdy * kdy) || 1;
      kinDx = kdx / kdist; kinDy = kdy / kdist;
    }

    const energyRatio = clamp(this.energy / this.maxEnergy, 0, 1);
    const speedRatio = clamp(Math.sqrt(this.vx * this.vx + this.vy * this.vy) / this.maxSpeed, 0, 1);

    return [foodDx, foodDy, preyDx, preyDy, threatDx, threatDy, kinDx, kinDy];
  }

  // Update position and evaluate neural network actions
  step(foodGrid, spatialHash, W, H, tempFactor = 1.0) {
    if (!this.alive) return;

    // 1. Neural Network Forward Pass
    const inputs = this.perceive(foodGrid, spatialHash, W, H);
    const outputs = this.brain.forward(inputs);

    const brainMoveX = outputs[0];
    const brainMoveY = outputs[1];
    const attackImpulse = outputs[2];
    const colonyImpulse = outputs[3];

    // Combine brain steering vector with wandering noise if brain outputs are near 0
    let dirX = brainMoveX;
    let dirY = brainMoveY;
    const mag = Math.sqrt(dirX * dirX + dirY * dirY);

    if (mag < 0.1) {
      this._wanderAngle += (Math.random() - 0.5) * 0.8;
      dirX = Math.cos(this._wanderAngle);
      dirY = Math.sin(this._wanderAngle);
    } else {
      dirX /= mag;
      dirY /= mag;
    }

    // Adjust velocity
    const targetVx = dirX * this.maxSpeed;
    const targetVy = dirY * this.maxSpeed;
    this.vx = lerp(this.vx, targetVx, 0.32);
    this.vy = lerp(this.vy, targetVy, 0.32);

    // Toroidal world wrapping
    this.x = (this.x + this.vx + W) % W;
    this.y = (this.y + this.vy + H) % H;

    // 2. Feeding from environment (herbivory/photosynthesis)
    if (this.energy < this.maxEnergy * 0.98) {
      const eaten = foodGrid.eat(this.x, this.y, this.eatRate);
      if (eaten > 0) {
        const plantEff = 1 - this.genome.diet * 0.42;
        const energyGain = eaten * 44 * plantEff;
        this.energy = Math.min(this.maxEnergy, this.energy + energyGain);
        // Plasticity reinforcement for eating food
        this.brain.adaptPlasticity(0.08, this.genome.plasticity);
      }
    }

    // 3. Predation (carnivory) if attack impulse activated or aggressive
    if (attackImpulse > 0.35 && this.genome.diet > 0.12 && this.energy < this.maxEnergy * 0.95) {
      const senseR = this.genome.sense;
      const neighbors = spatialHash.query(this.x, this.y, this.captureRadius * 1.5);
      for (const other of neighbors) {
        if (other === this || !other.alive) continue;
        const d2 = dist2(this.x, this.y, other.x, other.y);
        if (d2 <= this.captureRadius * this.captureRadius) {
          const sameLineage = hueDiff(this.genome.hue, other.genome.hue) < 12;
          if (!sameLineage && other.effectiveSize * 1.08 < this.effectiveSize) {
            // Predation roll
            const selfPower = this.genome.aggression * 0.4 + (this.effectiveSize - other.effectiveSize) * 0.06;
            const defenderPower = other.genome.membrane * 0.35 + other.genome.aggression * 0.15;
            const successP = clamp(0.44 + selfPower - defenderPower, 0.08, 0.92);

            if (Math.random() < successP) {
              const meatGain = other.energy * 0.65 * clamp(0.35 + this.genome.diet * 0.85, 0.35, 1.0);
              this.energy = Math.min(this.maxEnergy, this.energy + meatGain);
              other.alive = false;
              this.kills++;
              foodGrid.deposit(other.x, other.y, 0.14 * other.genome.size);
              // Plasticity reinforcement for successful hunt
              this.brain.adaptPlasticity(0.4, this.genome.plasticity);
            }
          }
        }
      }
    }

    // 4. Metabolism cost
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
