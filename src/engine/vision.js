// ===== Primordial V5 Compound Eye Vision & Raymarching Engine =====
// Multi-ray directional vision, obstacle occlusion, line-of-sight stealth,
// chemotaxis gradients, living flora detection, and carcass sensing.

const { clamp, dist2, hueDiff } = require('./genome');

const RAY_COUNT = 5;

// Hit classification signatures
const HIT_TYPES = {
  NONE: 0,
  FOOD: 1,
  PREY: 2,
  THREAT: -1,
  KIN: 0.5,
  OBSTACLE: -0.8,
  FLORA: 1.5,
  CARCASS: 2.2,
};

function castCompoundVision(org, spatialHash, foodGrid, terrain, W, H, floraManager = null, carcassManager = null) {
  const fov = (org.genome.visionFov || 120) * (Math.PI / 180);
  let range = org.genome.visionRange || (35 + org.genome.sense * 0.85);
  if (org.role === 'ocellus') range *= 1.5;

  const facing = org.facingAngle || 0;
  const rayHits = [];

  const nearbyOrgs = spatialHash.query(org.x, org.y, range + 20);
  const nearbyFloras = floraManager ? floraManager.queryNear(org.x, org.y, range + 20) : [];
  const nearbyCarcasses = carcassManager ? carcassManager.queryNear(org.x, org.y, range + 20) : [];

  const isPoly = org.anomaly === 'POLYCEPHALY';
  const rayCount = isPoly ? 10 : RAY_COUNT;

  for (let r = 0; r < rayCount; r++) {
    const angleOffset = fov * (r / (rayCount - 1) - 0.5);
    const rayAngle = facing + angleOffset;
    const dirX = Math.cos(rayAngle);
    const dirY = Math.sin(rayAngle);

    let closestDist = range;
    let hitSign = HIT_TYPES.NONE;

    // 1. Stone / Boulder Occlusion
    if (terrain) {
      const stoneHit = terrain.raycastStone(org.x, org.y, dirX, dirY, range);
      if (stoneHit.hit && stoneHit.dist < closestDist) {
        closestDist = stoneHit.dist;
        hitSign = HIT_TYPES.OBSTACLE;
      }
    }

    // 2. Ray-Circle Intersection with Organisms
    for (let i = 0; i < nearbyOrgs.length; i++) {
      const other = nearbyOrgs[i];
      if (other === org || !other.alive) continue;

      const toX = other.x - org.x;
      const toY = other.y - org.y;
      const proj = toX * dirX + toY * dirY;
      if (proj <= 0 || proj >= closestDist) continue;

      // Concealment stealth: Burrowed in mud or Albino camouflage
      if (other.isBurrowed && proj > range * 0.35) continue;
      if (other.anomaly === 'ALBINO' && proj > range * 0.45) continue;

      const perp2 = (toX * toX + toY * toY) - (proj * proj);
      const rad = other.effectiveSize || (other.genome.size * 5);
      if (perp2 <= rad * rad) {
        closestDist = proj;
        const isKin = hueDiff(org.genome.hue, other.genome.hue) < 16;
        const otherEff = other.effectiveSize || other.genome.size;
        const selfEff = org.effectiveSize || org.genome.size;

        if (isKin) hitSign = HIT_TYPES.KIN;
        else if (otherEff > selfEff * 1.15 && (other.genome.aggression > 0.2 || other.genome.diet > 0.2)) hitSign = HIT_TYPES.THREAT;
        else if (org.genome.diet > 0.15 && otherEff * 1.1 < selfEff) hitSign = HIT_TYPES.PREY;
        else hitSign = 0.1;
      }
    }

    // 3. Living Flora Detection (Kelp / Moss)
    for (let i = 0; i < nearbyFloras.length; i++) {
      const fl = nearbyFloras[i];
      if (!fl.alive) continue;
      const toX = fl.x - org.x, toY = fl.y - org.y;
      const proj = toX * dirX + toY * dirY;
      if (proj <= 0 || proj >= closestDist) continue;
      const perp2 = (toX * toX + toY * toY) - (proj * proj);
      if (perp2 <= fl.radius * fl.radius) {
        closestDist = proj;
        hitSign = HIT_TYPES.FLORA;
      }
    }

    // 4. Carcass Detection
    for (let i = 0; i < nearbyCarcasses.length; i++) {
      const car = nearbyCarcasses[i];
      if (!car.alive || car.meatEnergy <= 0) continue;
      const toX = car.x - org.x, toY = car.y - org.y;
      const proj = toX * dirX + toY * dirY;
      if (proj <= 0 || proj >= closestDist) continue;
      const perp2 = (toX * toX + toY * toY) - (proj * proj);
      if (perp2 <= car.radius * car.radius) {
        closestDist = proj;
        hitSign = HIT_TYPES.CARCASS;
      }
    }

    const proximity = 1.0 - (closestDist / range);
    rayHits.push({
      dirX, dirY, dist: closestDist, proximity, signature: hitSign,
      signal: proximity * hitSign,
    });
  }

  // Chemotaxis Antennas
  const probeDist = 18 + org.genome.size * 6;
  const leftAngle = facing - 0.45, rightAngle = facing + 0.45;
  const leftX = (org.x + Math.cos(leftAngle) * probeDist + W) % W;
  const leftY = (org.y + Math.sin(leftAngle) * probeDist + H) % H;
  const rightX = (org.x + Math.cos(rightAngle) * probeDist + W) % W;
  const rightY = (org.y + Math.sin(rightAngle) * probeDist + H) % H;

  let leftFood = 0, rightFood = 0, leftToxin = 0, rightToxin = 0;
  if (foodGrid) {
    const lCell = foodGrid.cellAt(leftX, leftY);
    const rCell = foodGrid.cellAt(rightX, rightY);
    leftFood = foodGrid.density[foodGrid.idx(lCell.cx, lCell.cy)] || 0;
    rightFood = foodGrid.density[foodGrid.idx(rCell.cx, rCell.cy)] || 0;
    leftToxin = foodGrid.toxinAt(leftX, leftY) || 0;
    rightToxin = foodGrid.toxinAt(rightX, rightY) || 0;
  }

  return {
    rays: rayHits,
    foodGradient: clamp((rightFood - leftFood) * 2.5, -1, 1),
    toxinGradient: clamp((rightToxin - leftToxin) * 3.0, -1, 1),
  };
}

module.exports = {
  castCompoundVision,
  RAY_COUNT,
  HIT_TYPES,
};
