// ===== Primordial V6 Organism Module: Organogenesis, Segment Kinematics, Dynamic Brain & Element Interactions =====

const { NeuralNetwork } = require('./brain');
const { clamp, lerp, dist2, hueDiff, GENETIC_ANOMALIES } = require('./genome');
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
    this.anomaly = genome.anomaly || GENETIC_ANOMALIES.NONE;

    // Titan anomaly scaling
    let sizeMultiplier = 1.0;
    if (this.anomaly === GENETIC_ANOMALIES.TITAN) sizeMultiplier = 1.9;

    this.maxEnergy = (40 + genome.size * 60) * sizeMultiplier;
    this.energy = energy !== undefined ? energy : this.maxEnergy * 0.55;
    this.moisture = 100;

    this.age = 0;
    this.generation = generation || 1;
    this.lineageId = lineageId || this.id;
    this.parentId = parentId || 0;
    this.reproCooldown = 0;
    this.alive = true;

    // Mitosis State Machine
    this.mitosisPhase = 0; // 0 = normal, 1..40 = active biological division
    this.mitosisData = null; // { childGenome, childBrain }

    // Harpoon / Nematocyst Strike Visual State
    this.harpoonTarget = null; // { x, y, timer }

    // Dynamic Extensible NEAT Brain
    if (brain) {
      this.brain = brain.clone();
    } else {
      const inCount = genome.brainInputs || 16;
      const h1Count = genome.brainHidden1 || 10;
      const deepFlag = (genome.brainDeepLayers || 0) > 0.5;
      const outCount = genome.brainOutputs || 7;
      this.brain = new NeuralNetwork(inCount, h1Count, outCount, deepFlag, 6);
    }

    // Endosymbionts
    this.endosymbionts = [];
    if (Math.random() < 0.25 || (genome.endoCapacity > 0.4 && Math.random() < 0.6)) {
      this.endosymbionts.push(Math.random() < 0.5 ? 'chloroplast' : 'mitochondria');
    }

    // Colony / Multicellular Coordination
    this.nerveSignal = 0;
    this.colonySize = 1;
    this.colonyMemberCount = 1;
    this.colonyGroupId = 0;
    this.centroidX = x; this.centroidY = y;
    this.bondedPartners = [];
    this.role = 'unicellular';

    // V6 Morphological Segments & Appendage Kinematics
    this.segmentCount = Math.max(1, Math.min(8, Math.round(genome.segmentCount || 1)));
    this.segments = [];
    const baseR = 2.5 + genome.size * 2.6 * sizeMultiplier;
    const segSpacing = (baseR * 2) * 0.72;
    for (let i = 0; i < this.segmentCount; i++) {
      const taper = 1.0 - (i / Math.max(1, this.segmentCount)) * 0.45;
      const segR = Math.max(1.8, baseR * taper);
      this.segments.push({
        x: this.x - Math.cos(this.facingAngle) * i * segSpacing,
        y: this.y - Math.sin(this.facingAngle) * i * segSpacing,
        r: segR,
        angle: this.facingAngle,
      });
    }

    // V6 Element Interaction & Adaptive States
    this.shellHardness = 0.25 + (genome.shellMineral || 0) * 0.45;
    this.mineralReserves = 0;
    this.isBurrowed = false;
    this.isSpurred = false;
    this.chromatophoreHue = genome.hue;
    this.vocalSignal = 0;
    this.limbPhase = Math.random() * Math.PI * 2;

    this.kills = 0;
    this.offspringCount = 0;
    this.lastVision = null;
    this._wanderAngle = Math.random() * Math.PI * 2;
  }

  get maxSpeed() {
    let speed = clamp(this.genome.speed / Math.sqrt(this.genome.size), 0.2, 3.4);
    if (this.role === 'motor') speed *= 1.4;
    if (this.endosymbionts.includes('mitochondria')) speed *= 1.25;
    if (this.anomaly === GENETIC_ANOMALIES.TITAN) speed *= 0.8;
    if (this.isSpurred) speed *= 1.5;
    if (this.isBurrowed) speed *= 0.25;
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
    if (this.anomaly === GENETIC_ANOMALIES.TITAN) base *= 0.75;
    if (this.isSpurred) base *= 1.4;
    return base;
  }

  get lifespan() {
    const titanBonus = this.anomaly === GENETIC_ANOMALIES.TITAN ? 400 : 0;
    return 550 + this.genome.size * 300 + titanBonus;
  }

  get reproduceThreshold() {
    let factor = 0.72;
    if (this.role === 'germ') factor = 0.55;
    return this.maxEnergy * factor;
  }

  get captureRadius() {
    let r = 3.8 + this.genome.size * 3.4;
    if (this.anomaly === GENETIC_ANOMALIES.TITAN) r *= 1.6;
    return r;
  }

  get effectiveSize() {
    let s = this.genome.size * this.colonySize;
    if (this.anomaly === GENETIC_ANOMALIES.TITAN) s *= 1.85;
    return s;
  }

  get appendagePairs() { return Math.max(0, Math.min(5, Math.round(this.genome.appendagePairs || 0))); }
  get appendagePhase() { return this.limbPhase; }
  set appendagePhase(v) { this.limbPhase = v; }
  get isSprinting() { return this.isSpurred; }
  get vocalization() { return this.vocalSignal; }

  scrapeStone(terrain) {
    if (!terrain) return;
    this.shellHardness = Math.min(1.0, this.shellHardness + 0.05 * (this.genome.shellMineral || 0.5));
    this.energy = Math.min(this.maxEnergy, this.energy + 0.05);
  }

  burrowInMud(terrain, state = true) {
    if (!terrain) {
      this.isBurrowed = state;
      return;
    }
    const mat = terrain.getMaterial(this.x, this.y);
    if (mat === TERRAIN_TYPES.MUD || mat === TERRAIN_TYPES.LAND) {
      this.isBurrowed = state;
    }
  }

  _updateSegments() {
    if (this.segments && this.segments.length > 0) {
      this.segments[0].x = this.x;
      this.segments[0].y = this.y;
      this.segments[0].angle = this.facingAngle;

      for (let s = 1; s < this.segments.length; s++) {
        const prev = this.segments[s - 1];
        const cur = this.segments[s];

        const dx = cur.x - prev.x;
        const dy = cur.y - prev.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        const targetDist = (prev.r + cur.r) * 0.72;

        cur.x = prev.x + (dx / d) * targetDist;
        cur.y = prev.y + (dy / d) * targetDist;
        cur.angle = Math.atan2(prev.y - cur.y, prev.x - cur.x);
      }
    }
  }

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

  // Sensory Perception Bus: Dynamically feeds up to 24 inputs to cognitive brain
  perceive(foodGrid, spatialHash, W, H, terrain, floraManager, carcassManager, weatherManager = null) {
    const vision = castCompoundVision(this, spatialHash, foodGrid, terrain, W, H, floraManager, carcassManager);
    this.lastVision = vision;

    const rays = vision.rays;
    let threatAlert = 0;
    for (let r = 0; r < rays.length; r++) {
      if (rays[r].signature === HIT_TYPES.THREAT) threatAlert = Math.max(threatAlert, rays[r].proximity);
    }

    const hungerDrive = clamp(1.0 - (this.energy / this.maxEnergy), 0, 1);
    const thirstDrive = clamp(1.0 - (this.moisture / 100), 0, 1);
    const matingDrive = (this.energy > this.reproduceThreshold && this.reproCooldown === 0) ? 1.0 : 0.0;

    let matFriction = 0.94;
    let currentMaterial = TERRAIN_TYPES.WATER_DEEP;
    if (terrain) {
      currentMaterial = terrain.getMaterial(this.x, this.y);
      const props = terrain.getMaterialProps(this.x, this.y);
      matFriction = props.friction;
    }

    // Baseline 16 inputs
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

    // Expanded Sensory Inputs 16..23 (if brain capacity evolved)
    if (this.brain.inputSize > 16) {
      // 16: Acoustic / Vocal Resonance (listening to nearby signals)
      let acousticResonance = 0;
      if (spatialHash) {
        const neighbors = spatialHash.query(this.x, this.y, 130);
        for (let i = 0; i < neighbors.length; i++) {
          const other = neighbors[i];
          if (other === this || !other.alive) continue;
          if (other.vocalSignal > 0.1) {
            const d = Math.sqrt(dist2(this.x, this.y, other.x, other.y)) || 1;
            acousticResonance += (other.vocalSignal * (1.0 - d / 130));
          }
        }
      }
      inputs.push(clamp(acousticResonance, 0, 1));

      // 17: Barometric / Weather Pressure
      let baro = 0;
      if (weatherManager) {
        const moist = weatherManager.getMoistureAt(this.x, this.y);
        baro = clamp(moist - 1.0, -1, 1);
      }
      inputs.push(baro);

      // 18: Thermal Gradient (Ice cold vs warm hydrothermal vents)
      let thermal = 0.2;
      if (currentMaterial === TERRAIN_TYPES.ICE) thermal = -0.9;
      else if (currentMaterial === TERRAIN_TYPES.LAND) thermal = 0.5;
      inputs.push(thermal);

      // 19: Mineral / Stone Boulder Proximity
      let stoneSense = 0;
      if (terrain) {
        const stonesNear = terrain.queryStonesNear(this.x, this.y, 90);
        if (stonesNear.length > 0) {
          const st = stonesNear[0];
          const d = Math.sqrt(dist2(this.x, this.y, st.x, st.y));
          stoneSense = clamp(1.0 - d / 90, 0, 1);
        }
      }
      inputs.push(stoneSense);

      // 20: Kin Clade Density
      let kinDensity = 0;
      if (spatialHash) {
        const near = spatialHash.query(this.x, this.y, 80);
        let kinCount = 0;
        for (let i = 0; i < near.length; i++) {
          if (near[i].genome.speciesName === this.genome.speciesName) kinCount++;
        }
        kinDensity = clamp(kinCount / 6, 0, 1);
      }
      inputs.push(kinDensity);

      // 21: Ocean Current Fluid Velocity
      const currentDrift = currentMaterial === TERRAIN_TYPES.WATER_DEEP ? Math.sin(this.y * 0.01) : 0;
      inputs.push(currentDrift);

      // 22: Flora Canopy Cover
      let floraProximity = 0;
      if (floraManager) {
        const nearFlora = floraManager.queryNear(this.x, this.y, 70);
        if (nearFlora.length > 0) floraProximity = clamp(nearFlora.length / 4, 0, 1);
      }
      inputs.push(floraProximity);

      // 23: Carcass Scent Volatiles
      let carcassScent = 0;
      if (carcassManager) {
        const nearCarcass = carcassManager.queryNear(this.x, this.y, 100);
        if (nearCarcass.length > 0) carcassScent = 0.8;
      }
      inputs.push(carcassScent);
    }

    return inputs;
  }

  tick(arg1, arg2, terrain = null, W = 4000, H = 3000, tempFactor = 1.0, floraManager = null, carcassManager = null, weatherManager = null) {
    let foodGrid = arg1;
    let spatialHash = arg2;
    if (arg1 && typeof arg1.query === 'function') {
      spatialHash = arg1;
      foodGrid = arg2;
    }
    return this.step(foodGrid, spatialHash, W, H, tempFactor, terrain, floraManager, carcassManager, weatherManager);
  }

  step(foodGrid, spatialHash, W, H, tempFactor = 1.0, terrain = null, floraManager = null, carcassManager = null, weatherManager = null) {
    if (!this.alive) return null;

    if (this.harpoonTarget) {
      this.harpoonTarget.timer--;
      if (this.harpoonTarget.timer <= 0) this.harpoonTarget = null;
    }

    // 1. Mitosis Progression State Machine
    let spawnedChild = null;
    if (this.mitosisPhase > 0) {
      this.mitosisPhase++;
      this.vx *= 0.65;
      this.vy *= 0.65;

      if (this.mitosisPhase >= 40) {
        if (this.mitosisData) {
          const angle = this.facingAngle + (Math.random() - 0.5) * 0.8;
          const distOffset = this.effectiveSize * 2.2;
          const cx = (this.x + Math.cos(angle) * distOffset + W) % W;
          const cy = (this.y + Math.sin(angle) * distOffset + H) % H;

          const energyAlloc = this.energy * 0.45;
          this.energy *= 0.52;
          this.reproCooldown = 55 + Math.floor(this.genome.size * 18);
          this.offspringCount++;

          spawnedChild = new Organism(
            cx, cy, this.mitosisData.childGenome, energyAlloc,
            this.generation + 1, this.lineageId, this.mitosisData.childBrain, this.id
          );
        }
        this.mitosisPhase = 0;
        this.mitosisData = null;
      }
      return spawnedChild;
    }

    // 2. Perception & Multi-Layer Cognitive Brain Forward Pass
    const envInputs = this.perceive(foodGrid, spatialHash, W, H, terrain, floraManager, carcassManager, weatherManager);
    const outputs = this.brain.forward(envInputs);

    let thrust = outputs[0];
    let turn = outputs[1];
    const attackImpulse = outputs[2];
    const colonyImpulse = outputs[3];

    // V6 Extended Action Outputs
    this.vocalSignal = outputs.length > 7 ? clamp(outputs[7], 0, 1) : 0;
    const sprintImpulse = outputs.length > 8 ? outputs[8] : 0;
    const burrowImpulse = outputs.length > 9 ? outputs[9] : 0;
    const chromaShift = outputs.length > 10 ? outputs[10] : 0;

    // Sprint Boost Burst
    this.isSpurred = (sprintImpulse > 0.68 && this.energy > 12);
    if (this.isSpurred) {
      this.energy -= 0.028;
    }

    if (Math.abs(thrust) < 0.1 && Math.abs(turn) < 0.1) {
      this._wanderAngle += (Math.random() - 0.5) * 0.4;
      thrust = 0.45;
      turn = Math.sin(this._wanderAngle) * 0.3;
    }

    let mat = TERRAIN_TYPES.WATER_DEEP;
    let matProps = MATERIAL_PROPERTIES[TERRAIN_TYPES.WATER_DEEP];
    if (terrain) {
      mat = terrain.getMaterial(this.x, this.y);
      matProps = terrain.getMaterialProps(this.x, this.y);
    }

    // Burrowing in Mud or Land
    this.isBurrowed = (burrowImpulse > 0.55 && (mat === TERRAIN_TYPES.MUD || mat === TERRAIN_TYPES.LAND));
    if (this.isBurrowed && mat === TERRAIN_TYPES.MUD) {
      // Passive detritus absorption while buried
      this.energy = Math.min(this.maxEnergy, this.energy + 0.038);
    }

    // Chromatophore Camouflage Adaptation
    if (chromaShift !== 0) {
      let targetHue = this.genome.hue;
      if (mat === TERRAIN_TYPES.MUD) targetHue = 35; // Earthy brown
      else if (mat === TERRAIN_TYPES.WATER_SHALLOW) targetHue = 180; // Cyan
      else if (mat === TERRAIN_TYPES.LAND) targetHue = 95; // Moss green
      else if (mat === TERRAIN_TYPES.ICE) targetHue = 205; // Pale glacial
      this.chromatophoreHue = lerp(this.chromatophoreHue, targetHue, 0.08);
    } else {
      this.chromatophoreHue = lerp(this.chromatophoreHue, this.genome.hue, 0.04);
    }

    // Moisture & Weather Hydration
    if (mat === TERRAIN_TYPES.WATER_DEEP || mat === TERRAIN_TYPES.WATER_SHALLOW) {
      this.moisture = Math.min(100, this.moisture + matProps.moistureReplenish);
    } else if (mat === TERRAIN_TYPES.MUD) {
      this.moisture = Math.min(100, this.moisture + matProps.moistureReplenish);
      this.energy = Math.min(this.maxEnergy, this.energy + 0.035);
    } else if (mat === TERRAIN_TYPES.LAND) {
      let rainBonus = 0;
      if (weatherManager) {
        const moist = weatherManager.getMoistureAt(this.x, this.y);
        if (moist > 1.2) rainBonus = 0.28 * (moist - 1.0);
      }

      const moistureLoss = (0.14 - rainBonus) * (1.0 - (this.genome.moistureRetention || 0) * 0.86);
      if (moistureLoss > 0) {
        this.moisture = Math.max(0, this.moisture - moistureLoss);
      } else {
        this.moisture = Math.min(100, this.moisture - moistureLoss);
      }

      if (this.moisture <= 0) {
        this.energy -= 0.18;
        this.brain.registerPain(0.35);
        this.brain.adaptPlasticity(-0.2, this.genome.plasticity);
      }
    } else if (mat === TERRAIN_TYPES.ICE) {
      this.moisture = Math.max(0, this.moisture - 0.05);
      const coldResist = this.genome.thermalTolerance || 0;
      if (coldResist < 0.45) {
        this.energy -= 0.12 * (0.45 - coldResist);
        this.brain.registerPain(0.15);
      }
    }

    // Locomotion (Swim Fins vs Walking Legs)
    const isWater = (mat === TERRAIN_TYPES.WATER_DEEP || mat === TERRAIN_TYPES.WATER_SHALLOW);
    const crawlGene = this.genome.locomotionType || 0;
    let locoEfficiency = isWater ? (1.18 - crawlGene * 0.48) : (0.28 + crawlGene * 1.15);

    const turnRate = 0.24 * (0.8 + (1 - this.genome.size / 4) * 0.4);
    this.facingAngle = (this.facingAngle + turn * turnRate + Math.PI * 2) % (Math.PI * 2);

    const forwardSpeed = Math.max(-0.25, thrust) * this.maxSpeed * locoEfficiency;
    const ax = Math.cos(this.facingAngle) * forwardSpeed * 0.38;
    const ay = Math.sin(this.facingAngle) * forwardSpeed * 0.38;

    this.vx = (this.vx + ax) * matProps.friction;
    this.vy = (this.vy + ay) * matProps.friction;

    // Multicellular Spring Forces
    this.nerveSignal = clamp(attackImpulse + colonyImpulse, 0, 1);
    const REST_LENGTH = 14, STIFFNESS = 0.08, DAMPING = 0.04;

    for (let i = 0; i < this.bondedPartners.length; i++) {
      const partner = this.bondedPartners[i];
      if (!partner.alive) continue;

      const dx = partner.x - this.x, dy = partner.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const delta = dist - REST_LENGTH;

      const springF = delta * STIFFNESS;
      const nx = dx / dist, ny = dy / dist;
      const relVx = partner.vx - this.vx, relVy = partner.vy - this.vy;
      const dampF = (relVx * nx + relVy * ny) * DAMPING;

      const totalF = springF + dampF;
      this.vx += nx * totalF;
      this.vy += ny * totalF;

      if (this.nerveSignal > 0.4 && partner.nerveSignal < 0.4) partner.nerveSignal = this.nerveSignal * 0.85;
      if (this.role === 'digestor' && this.energy > this.maxEnergy * 0.6 && partner.energy < partner.maxEnergy * 0.5) {
        this.energy -= 0.12; partner.energy += 0.12;
      }
    }

    if (mat === TERRAIN_TYPES.WATER_DEEP) this.vx += Math.sin(this.y * 0.01) * 0.06;

    // Stone Collisions & Mineral Grazing
    if (terrain) {
      const col = terrain.resolveStoneCollision(this.x, this.y, this.effectiveSize, this.vx, this.vy);
      this.x = col.x; this.y = col.y; this.vx = col.vx; this.vy = col.vy;
      if (col.collided) {
        this.brain.registerPain(0.12);
        // Scrape mineral calcium from boulder
        this.shellHardness = Math.min(1.0, this.shellHardness + 0.003 * (this.genome.shellMineral || 0.5));
        this.energy = Math.min(this.maxEnergy, this.energy + 0.02);
      }
    }

    this.x = (this.x + this.vx + W) % W;
    this.y = (this.y + this.vy + H) % H;

    // V6 Segment Articulated Spine Kinematics
    this._updateSegments();

    // Limb Stepping / Paddling Kinematics Phase
    const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    this.limbPhase = (this.limbPhase + currentSpeed * 0.55 + 0.05) % (Math.PI * 2);

    // Endosymbiosis Energy Generation
    if (this.endosymbionts.includes('chloroplast') && foodGrid && foodGrid.lightFactor(this.y / 40) > 0.3) {
      this.energy = Math.min(this.maxEnergy, this.energy + 0.085 * foodGrid.lightFactor(this.y / 40));
    }

    // Venom Toxin Secretion
    if (foodGrid && (this.role === 'toxin' || this.genome.toxinGene > 0.4) && Math.random() < 0.15) {
      foodGrid.depositToxin(this.x, this.y, 0.22 * this.genome.toxinGene);
    }

    // Living Flora Grazing (Herbivores)
    if (floraManager && this.genome.diet < 0.45 && this.energy < this.maxEnergy * 0.96) {
      const nearbyFlora = floraManager.queryNear(this.x, this.y, this.captureRadius * 1.6);
      if (nearbyFlora.length > 0) {
        const plant = nearbyFlora[0];
        const grazed = plant.graze(0.35 + this.genome.size * 0.25);
        if (grazed > 0) {
          this.energy = Math.min(this.maxEnergy, this.energy + grazed * 2.2);
          this.brain.adaptPlasticity(0.18, this.genome.plasticity);
        }
      }
    }

    // Carcass Scavenging
    if (carcassManager && this.energy < this.maxEnergy * 0.95) {
      const nearbyCarcasses = carcassManager.queryNear(this.x, this.y, this.captureRadius * 1.8);
      if (nearbyCarcasses.length > 0) {
        const carrion = nearbyCarcasses[0];
        const meat = carrion.scavenge(0.4 + this.genome.size * 0.3);
        if (meat > 0) {
          const scavGain = meat * clamp(0.4 + this.genome.diet * 0.8, 0.4, 1.2);
          this.energy = Math.min(this.maxEnergy, this.energy + scavGain);
          this.brain.adaptPlasticity(0.28, this.genome.plasticity);
        }
      }
    }

    // Environmental Feeding (Nutrient Grid)
    if (foodGrid && this.energy < this.maxEnergy * 0.98) {
      const eaten = foodGrid.eat(this.x, this.y, this.eatRate);
      if (eaten > 0) {
        const plantEff = 1 - this.genome.diet * 0.42;
        this.energy = Math.min(this.maxEnergy, this.energy + eaten * 44 * plantEff);
        this.brain.adaptPlasticity(0.12, this.genome.plasticity);
      }
    }

    // Predation & Harpoon Strike
    if (attackImpulse > 0.35 && this.genome.diet > 0.12 && this.energy < this.maxEnergy * 0.95) {
      const neighbors = spatialHash.query(this.x, this.y, this.captureRadius * 2.4);
      for (let i = 0; i < neighbors.length; i++) {
        const other = neighbors[i];
        if (other === this || !other.alive) continue;
        const d2 = dist2(this.x, this.y, other.x, other.y);

        if (d2 <= Math.pow(this.captureRadius * 2.4, 2)) {
          this.harpoonTarget = { x: other.x, y: other.y, timer: 7 };
        }

        if (d2 <= this.captureRadius * this.captureRadius) {
          const sameLineage = hueDiff(this.genome.hue, other.genome.hue) < 12;
          if (!sameLineage && other.effectiveSize * 1.08 < this.effectiveSize) {
            let selfPower = this.genome.aggression * 0.4 + (this.effectiveSize - other.effectiveSize) * 0.06;
            let defenderPower = other.genome.membrane * 0.35 + other.shellHardness * 0.4 + other.genome.aggression * 0.15;
            if (other.isBurrowed) defenderPower *= 1.7;
            if (other.role === 'shield') defenderPower *= 1.8;
            if (other.role === 'toxin' || other.genome.toxinGene > 0.4) {
              this.energy *= 0.85; this.brain.registerPain(0.4);
            }

            // V6 Spiked Carapace Anomaly / High Mineral Recoil
            if (other.anomaly === GENETIC_ANOMALIES.SPIKED_CARAPACE || other.shellHardness > 0.75) {
              const recoil = 0.25 * other.effectiveSize;
              this.energy -= recoil;
              this.brain.registerPain(0.45);
            }

            const successP = clamp(0.44 + selfPower - defenderPower, 0.05, 0.92);
            if (Math.random() < successP) {
              const meatGain = other.energy * 0.65 * clamp(0.35 + this.genome.diet * 0.85, 0.35, 1.0);
              this.energy = Math.min(this.maxEnergy, this.energy + meatGain);
              other.alive = false;
              other.brain.registerPain(0.8);
              other.brain.adaptPlasticity(-0.5, other.genome.plasticity);

              this.kills++;
              this.brain.adaptPlasticity(0.5, this.genome.plasticity);
            }
          }
        }
      }
    }

    const speedUsed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    this.energy -= (this.metabolismBase + speedUsed * 0.032) * tempFactor;
    this.age++;
    if (this.reproCooldown > 0) this.reproCooldown--;

    return null;
  }
}

module.exports = { Organism };
