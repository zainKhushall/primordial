// ===== Phase 3 Organism Module: NEAT Perception, Endosymbiosis, Toxin Secretion & Inter-Cell Nerve Net =====

const { NeuralNetwork } = require('./brain');
const { clamp, lerp, dist2, hueDiff } = require('./genome');

let ORG_ID_COUNTER = 1;

class Organism {
  constructor(x, y, genome, energy, generation, lineageId, brain, parentId) {
    this.id = ORG_ID_COUNTER++;
    this.x = x; this.y = y;
    this.vx = 0; this.vy = 0;

    this.genome = genome;
    this.maxEnergy = 40 + genome.size * 60;
    this.energy = energy !== undefined ? energy : this.maxEnergy * 0.55;

    this.age = 0;
    this.generation = generation || 1;
    this.lineageId = lineageId || this.id;
    this.parentId = parentId || 0;
    this.reproCooldown = 0;
    this.alive = true;

    // Phase 3 NEAT Neural Network Brain
    this.brain = brain ? brain.clone() : new NeuralNetwork(10, 8, 6);

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

  get lifespan() { return 520 + this.genome.size * 280; }

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

  perceive(foodGrid, spatialHash, W, H) {
    let senseR = this.genome.sense;
    if (this.role === 'ocellus') senseR *= 1.6;
    const senseR2 = senseR * senseR;

    const bestFoodCell = foodGrid.bestCellNear(this.x, this.y, senseR);
    let foodDx = 0, foodDy = 0;
    if (bestFoodCell) {
      const fdx = bestFoodCell.x - this.x, fdy = bestFoodCell.y - this.y;
      const fdist = Math.sqrt(fdx * fdx + fdy * fdy) || 1;
      foodDx = fdx / fdist; foodDy = fdy / fdist;
    }

    const neighbors = spatialHash.query(this.x, this.y, senseR);
    let prey = null, preyD2 = Infinity;
    let threat = null, threatD2 = Infinity;
    let kinSumX = 0, kinSumY = 0, kinCount = 0;

    for (let i = 0; i < neighbors.length; i++) {
      const other = neighbors[i];
      if (other === this || !other.alive) continue;
      const d2 = dist2(this.x, this.y, other.x, other.y);
      if (d2 > senseR2) continue;

      const sameLineage = hueDiff(this.genome.hue, other.genome.hue) < 14;
      const otherEff = other.effectiveSize;
      const selfEff = this.effectiveSize;

      if (sameLineage) {
        kinSumX += other.x; kinSumY += other.y; kinCount++;
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

    return [foodDx, foodDy, preyDx, preyDy, threatDx, threatDy, kinDx, kinDy];
  }

  step(foodGrid, spatialHash, W, H, tempFactor = 1.0) {
    if (!this.alive) return;

    // 1. Perception & NEAT Neural Pass
    const envInputs = this.perceive(foodGrid, spatialHash, W, H);
    const outputs = this.brain.forward(envInputs);

    let dirX = outputs[0], dirY = outputs[1];
    const attackImpulse = outputs[2];
    const mag = Math.sqrt(dirX * dirX + dirY * dirY);

    if (mag < 0.1) {
      this._wanderAngle += (Math.random() - 0.5) * 0.8;
      dirX = Math.cos(this._wanderAngle); dirY = Math.sin(this._wanderAngle);
    } else {
      dirX /= mag; dirY /= mag;
    }

    const targetVx = dirX * this.maxSpeed;
    const targetVy = dirY * this.maxSpeed;
    this.vx = lerp(this.vx, targetVx, 0.32);
    this.vy = lerp(this.vy, targetVy, 0.32);

    // 2. Inter-Cell Nerve Signal Sharing across Multicellular Cluster
    this.nerveSignal = clamp(outputs[2] + outputs[3], 0, 1);
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

    const biome = foodGrid.biomeAt(this.x, this.y);
    if (biome === 'pelagic') {
      this.vx += Math.sin(this.y * 0.01) * 0.08;
    }

    this.x = (this.x + this.vx + W) % W;
    this.y = (this.y + this.vy + H) % H;

    // 3. Endosymbiosis Photochemical & Metabolic Energy Generation
    if (this.endosymbionts.includes('chloroplast') && foodGrid.lightFactor(this.y / 20) > 0.3) {
      this.energy = Math.min(this.maxEnergy, this.energy + 0.08 * foodGrid.lightFactor(this.y / 20));
    }

    // 4. Venom Toxin Secretion
    if ((this.role === 'toxin' || this.genome.toxinGene > 0.4) && Math.random() < 0.15) {
      foodGrid.depositToxin(this.x, this.y, 0.22 * this.genome.toxinGene);
    }

    // 5. Environmental Feeding
    if (this.energy < this.maxEnergy * 0.98) {
      const eaten = foodGrid.eat(this.x, this.y, this.eatRate);
      if (eaten > 0) {
        const plantEff = 1 - this.genome.diet * 0.42;
        this.energy = Math.min(this.maxEnergy, this.energy + eaten * 44 * plantEff);
        this.brain.adaptPlasticity(0.08, this.genome.plasticity);
      }
    }

    // 6. Predation & Toxin Defense
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
              // Toxin defense penalizes attacker
              this.energy *= 0.85;
            }

            const successP = clamp(0.44 + selfPower - defenderPower, 0.05, 0.92);

            if (Math.random() < successP) {
              const meatGain = other.energy * 0.65 * clamp(0.35 + this.genome.diet * 0.85, 0.35, 1.0);
              this.energy = Math.min(this.maxEnergy, this.energy + meatGain);
              other.alive = false;
              this.kills++;
              foodGrid.deposit(other.x, other.y, 0.14 * other.genome.size);
              this.brain.adaptPlasticity(0.4, this.genome.plasticity);
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
