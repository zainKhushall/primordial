// ===== Primordial V4 Compound Eye Vision & Raymarching Engine =====
// Multi-ray directional vision, obstacle occlusion, line-of-sight stealth,
// and dual-antenna chemotaxis gradient detection.

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
  LAND_EDGE: 0.3,
};

function castCompoundVision(org, spatialHash, foodGrid, terrain, W, H) {
  const fov = (org.genome.visionFov || 120) * (Math.PI / 180);
  let range = org.genome.visionRange || (35 + org.genome.sense * 0.85);
  if (org.role === 'ocellus') range *= 1.5;

  const facing = org.facingAngle || 0;
  const rayHits = [];

  // Query nearby organisms once for all rays
  const nearbyOrgs = spatialHash.query(org.x, org.y, range + 20);

  for (let r = 0; r < RAY_COUNT; r++) {
    const angleOffset = fov * (r / (RAY_COUNT - 1) - 0.5);
    const rayAngle = facing + angleOffset;
    const dirX = Math.cos(rayAngle);
    const dirY = Math.sin(rayAngle);

    let closestDist = range;
    let hitSign = HIT_TYPES.NONE;

    // 1. Check Stone / Obstacle Occlusion
    if (terrain) {
      const stoneHit = terrain.raycastStone(org.x, org.y, dirX, dirY, range);
      if (stoneHit.hit && stoneHit.dist < closestDist) {
        closestDist = stoneHit.dist;
        hitSign = HIT_TYPES.OBSTACLE;
      }
    }

    // 2. Ray-Circle Intersection with Organisms (Occluded by closer stones)
    for (let i = 0; i < nearbyOrgs.length; i++) {
      const other = nearbyOrgs[i];
      if (other === org || !other.alive) continue;

      const toX = other.x - org.x;
      const toY = other.y - org.y;

      // Project onto ray direction
      const proj = toX * dirX + toY * dirY;
      if (proj <= 0 || proj >= closestDist) continue;

      // Perpendicular distance squared
      const perp2 = (toX * toX + toY * toY) - (proj * proj);
      const rad = other.effectiveSize || (other.genome.size * 5);
      if (perp2 <= rad * rad) {
        // Hit detected!
        closestDist = proj;

        const isKin = hueDiff(org.genome.hue, other.genome.hue) < 16;
        const otherEff = other.effectiveSize || other.genome.size;
        const selfEff = org.effectiveSize || org.genome.size;

        if (isKin) {
          hitSign = HIT_TYPES.KIN;
        } else if (otherEff > selfEff * 1.15 && (other.genome.aggression > 0.2 || other.genome.diet > 0.2)) {
          hitSign = HIT_TYPES.THREAT;
        } else if (org.genome.diet > 0.15 && otherEff * 1.1 < selfEff) {
          hitSign = HIT_TYPES.PREY;
        } else {
          hitSign = 0.1; // Neutral organism
        }
      }
    }

    // Normalized proximity: 1.0 = right at eye, 0.0 = at vision horizon
    const proximity = 1.0 - (closestDist / range);
    rayHits.push({
      dirX,
      dirY,
      dist: closestDist,
      proximity,
      signature: hitSign,
      signal: proximity * hitSign, // Signed activation value
    });
  }

  // 3. Chemotaxis Dual-Antenna Sensing (Left & Right probes)
  const probeDist = 18 + org.genome.size * 6;
  const leftAngle = facing - 0.45;
  const rightAngle = facing + 0.45;

  const leftX = (org.x + Math.cos(leftAngle) * probeDist + W) % W;
  const leftY = (org.y + Math.sin(leftAngle) * probeDist + H) % H;
  const rightX = (org.x + Math.cos(rightAngle) * probeDist + W) % W;
  const rightY = (org.y + Math.sin(rightAngle) * probeDist + H) % H;

  let leftFood = 0, rightFood = 0;
  let leftToxin = 0, rightToxin = 0;

  if (foodGrid) {
    const lCell = foodGrid.cellAt(leftX, leftY);
    const rCell = foodGrid.cellAt(rightX, rightY);
    leftFood = foodGrid.density[foodGrid.idx(lCell.cx, lCell.cy)] || 0;
    rightFood = foodGrid.density[foodGrid.idx(rCell.cx, rCell.cy)] || 0;

    leftToxin = foodGrid.toxinAt(leftX, leftY) || 0;
    rightToxin = foodGrid.toxinAt(rightX, rightY) || 0;
  }

  const foodGradient = clamp((rightFood - leftFood) * 2.5, -1, 1);
  const toxinGradient = clamp((rightToxin - leftToxin) * 3.0, -1, 1);

  return {
    rays: rayHits,
    foodGradient,
    toxinGradient,
    leftFood,
    rightFood,
  };
}

module.exports = {
  castCompoundVision,
  RAY_COUNT,
  HIT_TYPES,
};
