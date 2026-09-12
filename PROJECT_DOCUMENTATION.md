# Primordial Earth — Artificial Life Observatory & Evolution Simulation

## Executive Summary

**Primordial Earth** is a high-performance, zero-external-runtime-dependency artificial life observatory simulating evolutionary biology, neural cognition, and ecological adaptation from the origin of life to the first terrestrial landfall. Unicellular and multicellular organisms carry evolvable genomes and neural brains, navigating expansive ecosystems, developing specialized cell bodies, and adapting across geological eras.

The project is structured into four progressive evolutionary iterations:
1. **Phase 1 (Root/v1)**: Baseline neural simulation, physical genes, food grid, basic colonies, and single-page observer UI (`http://localhost:3000`).
2. **Phase 2 (v2)**: Recurrent Neural Networks (RNN) with internal memory nodes, spring-joint multicellular physics, multi-biome depths, pheromone trails, camera follow mode, and phylogenetic clade trees (`http://localhost:3001`).
3. **Phase 3 (v3)**: NEAT Brain Topology Evolution, Endosymbiosis, Venom Toxin Secretion, Deep-Time Geological Eras (Hadean, Archean Oxygenation, Snowball Earth, Cambrian Explosion), Atmospheric Gas Chemistry ($\text{O}_2, \text{CO}_2, \text{H}_2\text{S}$), and an AI Automated Naturalist (`http://localhost:3002`).
4. **Phase 4 (v4 - Current)**: Sprawling Dual-Biome Continent ($4000 \times 3000$), Natural Materials (**Stones, Detritus Mud, Glacial Ice, Land, Ocean**), Multi-Scale Infinite Zoom ($0.12\times$ to $12\times$) with **Microscope Mode** (intracellular organelles, mitochondria ATP sparks, chloroplast thylakoids, membrane bilayer, synaptic firing), **Compound Raycast Vision with Obstacle Occlusion**, **Lifelong Neuroplasticity (Hebbian Learning & Reinforcement)**, **Homeostatic Cognitive Drives** (Hunger, Thirst, Fear, Mating), **Amphibious Transition Genetics**, and **Interactive Sandbox God Sculpting Tools** (`http://localhost:3002`).

---

## Directory & File Architecture

```
primordial/
├── package.json              # Project manifest (v4.0.0) with automated test suite
├── server.js                 # Zero-dependency native Node.js HTTP server (Port 3002)
├── engine.js                 # Unified engine module exports
├── test_v4.js                # Headless automated verification suite (160+ ticks/sec)
├── src/engine/               # Core simulation engine modules
│   ├── terrain.js            # Dual-biome grid, stone colliders, raycast occlusion & material physics
│   ├── vision.js             # Compound eye raycasting, line-of-sight & chemotaxis gradient sensors
│   ├── genome.js             # 16-gene continuous chromosomes & amphibious Latin taxonomy
│   ├── brain.js              # Cognitive NEAT Brain (16 inputs, Hebbian learning, working memory)
│   ├── organism.js           # Amphibious locomotion, moisture balance, multicellular springs & combat
│   ├── environment.js        # FoodGrid, detritus soils, hydrothermal vents & geological eras
│   └── world.js              # 4000x3000 world manager, spatial hashing, amphibious clade tracking & naturalist
└── public/                   # Client observer dashboard
    ├── index.html            # Observer layout, God Tools toolbar & microscope mode HUD
    ├── styles.css            # Bioluminescent design system & palette styles
    └── app.js                # Canvas rendering pipeline, frustum culling, microscope view & mini-map
```

---

## Version 4 Deep-Dive & Module Mechanics

### 1. Terrain & Material Physics (`src/engine/terrain.js`)
- **World Dimensions**: $4000 \times 3000$ coordinate space with procedural continental geography generated via harmonic pseudo-noise.
- **Natural Materials**:
  - `WATER_DEEP` & `WATER_SHALLOW`: High buoyancy, ocean currents, phytoplankton soup, hydrothermal vents.
  - `LAND`: Dry continental mainland; causes desiccation unless organisms carry moisture retention cuticles.
  - `MUD`: Viscous detritus mudflat that decelerates swift swimmers ($60\%$ drag) but rewards crawling organisms with rich organic detritus food.
  - `ICE`: Glacial polar sheets and mountain peaks with low friction ($0.985$ sliding inertia) and freezing temperatures requiring thermal tolerance genes.
  - `STONE`: Solid circular boulder colliders ($r = 14 - 48\text{px}$) with physics collision resolution and mineral nutrient leaching.

### 2. Compound Eye Vision & Raymarching (`src/engine/vision.js`)
- **Compound Rays**: Organisms project 5 directional sensory rays across their evolvable field of view (`visionFov`, $45^\circ - 240^\circ$).
- **Obstacle Occlusion**: Solid stone boulders physically block line of sight. Small organisms can break contact and hide behind boulders to escape predators.
- **Ray Signatures**:
  - Food: $+1.0$
  - Prey: $+2.0$
  - Threat predator: $-1.0$
  - Kin: $+0.5$
  - Obstacle / Stone: $-0.8$
- **Chemotaxis Dual-Antenna Gradient**: Left and right chemical antennas sample food and toxin differentials, enabling Braitenberg-style steering towards nutrients.

### 3. Cognitive Brain & Hebbian Neuroplasticity (`src/engine/brain.js`)
- **16 Cognitive Inputs**:
  - `Inputs 0–4`: Compound eye vision ray signals
  - `Input 5`: Food chemotaxis gradient (left vs right)
  - `Input 6`: Toxin avoidance gradient
  - `Input 7`: Hunger homeostatic drive
  - `Input 8`: Thirst / Desiccation drive
  - `Input 9`: Fear alert level (threat proximity)
  - `Input 10`: Mating readiness urge
  - `Input 11`: Terrain friction / viscosity
  - `Inputs 12–14`: Recurrent working memory nodes (`mem1`, `mem2`, `mem3`)
  - `Input 15`: Pain trace (recent damage / acid / desiccation trauma)
- **7 Action Outputs**:
  - `Outputs 0–1`: Forward thrust and turn steering torque
  - `Output 2`: Attack / Predation impulse
  - `Output 3`: Colony adhesion impulse
  - `Outputs 4–6`: Recurrent memory writes
- **Lifelong Hebbian Learning**: Synaptic connection weights adapt dynamically within the organism's lifetime based on reward and punishment:
  $$\Delta w_{ij} = \eta \cdot \text{reward} \cdot \text{trace}_{ij} - \lambda \cdot w_{ij}$$

### 4. Amphibious Transition Genetics (`src/engine/genome.js` & `organism.js`)
- **Heritable Trait Vectors**:
  - `moistureRetention` $[0, 1]$: Cuticle and mucous thickness preventing dehydration on dry land.
  - `locomotionType` $[0, 1]$: $0 = \text{Aquatic Swimming Fin/Flagella}$; $1 = \text{Terrestrial Crawling Appendages}$.
  - `thermalTolerance` $[0, 1]$: Antifreeze protein synthesis protecting against glacial cold shock.
  - `visionFov` $[45^\circ, 240^\circ]$: Compound eye angular breadth.
  - `visionRange` $[40, 220\text{px}]$: Eye sight horizon.
- **Locomotion Mechanics**:
  - In water: Swimming fins achieve full thrust; crawling limbs encounter hydrodynamic drag.
  - On land: Swimmers slip and flounder; crawling limbs grip and move efficiently.
  - In mud: Crawlers graze on organic mud detritus without requiring free-floating phytoplankton.

### 5. Multi-Scale Infinite Zoom & Microscope View (`public/app.js`)
- **Continuous Zoom ($0.12\times$ to $12.0\times$)**:
  - **Macro Continental View ($0.12\times - 0.5\times$)**: Observe migrations across ocean and continent.
  - **Ecology View ($0.5\times - 2.8\times$)**: Standard viewing of hunting, feeding, and multicellular swarms.
  - **Microscope Mode ($\ge 2.8\times$)**: Renders deep intracellular biology:
    - Phospholipid bilayer membrane shimmer
    - Pulsating nucleus with floating chromatin strands
    - Mitochondria cristae emitting golden ATP sparks
    - Chloroplast thylakoid stacks
    - Live synaptic nerve pulse sparks firing within the cell body
- **Frustum Culling**: Only terrain tiles, stones, nutrients, and organisms within the camera viewport are rendered, maintaining 60 FPS in canvas.

### 6. Sandbox God Tools
- Floating toolbar allowing the user to select:
  - 🔍 `Inspect`: Pan, zoom, and click to inspect organisms and brains.
  - 🪨 `Stone`: Spawn solid stone boulders anywhere on the map.
  - 🪵 `Mud`: Paint organic detritus mudflats.
  - ❄️ `Ice`: Paint freezing glacial sheets.
  - 🏜️ `Land`: Raise dry continental soil.
  - 🌊 `Water`: Carve ocean channels.
  - 🌿 `Food`: Seed concentrated nutrient blooms.

---

## How to Run Version 4

```bash
# Start the Version 4 server
node server.js
# Access the observatory at http://localhost:3002

# Run headless automated engine test suite
npm test
```

---

## Verification & Benchmarks

The automated test suite (`node test_v4.js`) validates:
1. Terrain grid generation and stone collision resolution.
2. Raycast stone occlusion (line-of-sight blocking).
3. 16-input cognitive brain forward inference and Hebbian reward adaptation.
4. Amphibious organism moisture physiology and desiccation differentials.
5. Headless simulation benchmark: **160+ simulation ticks per second** on the $4000 \times 3000$ map.
