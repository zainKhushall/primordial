# Primordial Sea — Early Earth Artificial Life Simulation

## Executive Summary

**Primordial Sea** is a Node.js-based artificial life observatory simulating origin-of-life evolution in an early Earth ocean. Unicellular organisms carry evolvable genomes and neural network brains, competing for nutrients, hunting prey, forming colonies, developing specialized multicellular bodies, and adapting across deep-time geological eras.

The project is structured into three progressive iterations:
1. **Phase 1 (Root Directory)**: Baseline neural simulation, physical genes, food grid, basic colonies, and single-page observer UI (`http://localhost:3000`).
2. **Phase 2 (`phase2/`)**: Recurrent Neural Networks (RNN) with internal memory nodes, spring-joint multicellular physics, multi-biome depths, pheromone trails, camera follow mode, and phylogenetic clade trees (`http://localhost:3001`).
3. **Phase 3 (`phase3/`)**: NEAT Brain Topology Evolution, Endosymbiosis, Venom Toxin Secretion, Deep-Time Geological Eras (Hadean, Archean Oxygenation, Snowball Earth, Cambrian Explosion), Atmospheric Gas Chemistry ($\text{O}_2, \text{CO}_2, \text{H}_2\text{S}$), and an AI Automated Naturalist (`http://localhost:3002`).

---

## Directory & File Architecture

```
/home/zain/Desktop/claude_test/
├── package.json              # Phase 1 project manifest
├── server.js                 # Phase 1 zero-dependency HTTP server (Port 3000)
├── engine.js                 # Phase 1 engine module exports
├── src/engine/               # Phase 1 core engine modules
│   ├── genome.js             # Trait genes, mutations & crossover logic
│   ├── brain.js              # Feedforward Neural Network (8 inputs, 6 hidden, 4 outputs)
│   ├── organism.js           # Organism class, metabolism & perception
│   ├── environment.js        # FoodGrid, photic zone & hydrothermal vents
│   └── world.js              # World simulation tick, spatial hash & stats
├── public/                   # Phase 1 client observer dashboard
│   ├── index.html            # Observer layout
│   ├── styles.css            # Dark ocean design system
│   └── app.js                # Renderer & neural visualizer graph
│
├── phase2/                   # PHASE 2 FULL IMPLEMENTATION (Port 3001)
│   ├── package.json          # Phase 2 project manifest
│   ├── server.js             # Phase 2 HTTP server (Port 3001)
│   ├── engine.js             # Phase 2 engine entry point
│   ├── src/engine/
│   │   ├── genome.js         # Traits + Latinized species taxonomy generator
│   │   ├── brain.js          # Recurrent Neural Network (RNN 10-8-6) with memory state
│   │   ├── organism.js       # Spring-joint physics & cell morphotypes
│   │   ├── environment.js    # Multi-biome depth zones, Day/Night cycle & pheromones
│   │   └── world.js          # Clade tree, fossil record & simulation tick
│   └── public/
│       ├── index.html        # Phase 2 UI, clade modal & tooltip HUD
│       ├── styles.css        # Bioluminescent glassmorphism stylesheet
│       └── app.js            # Renderer, mini-map radar & camera follow mode
│
└── phase3/                   # PHASE 3 FULL IMPLEMENTATION (Port 3002)
    ├── package.json          # Phase 3 project manifest
    ├── server.js             # Phase 3 HTTP server (Port 3002)
    ├── engine.js             # Phase 3 engine entry point
    ├── src/engine/
    │   ├── genome.js         # Body plan genes, toxin genes & taxonomy
    │   ├── brain.js          # NEAT Evolvable Brain Topology class
    │   ├── organism.js       # NEAT perception, endosymbiosis, toxin secretion & nerve net
    │   ├── environment.js    # Geological Eras & atmospheric gas chemistry (O2, CO2, H2S)
    │   └── world.js          # AI Automated Naturalist, clade tree & simulation tick
    └── public/
        ├── index.html        # Phase 3 UI, era badges & gas chemistry gauges
        ├── styles.css        # Deep-time theme design system
        └── app.js            # Renderer, NEAT brain graph & era controls
```

---

## Technical Deep-Dive & Module Mechanics

### 1. Genome Module (`src/engine/genome.js`)
- **Heritable Trait Vector**:
  - `size` [0.4, 3.2]: Physical radius, mass, metabolism base.
  - `speed` [0.3, 2.6]: Maximum swimming velocity.
  - `sense` [15, 160]: Sensory detection radius.
  - `diet` [0, 1]: 0 = Herbivore/Photosynthesizer, 1 = Carnivore/Predator.
  - `aggression` [0, 1]: Combat drive and predatory attack power.
  - `colony` [0, 1]: Cell adhesion strength & kin attraction force.
  - `membrane` [0.2, 1.0]: Structural defense shield.
  - `plasticity` [0, 1]: Lifetime Hebbian learning rate.
  - `pheromoneRate` [0, 1]: Chemical trail deposit rate.
  - `toxinGene` [0, 1]: Venom secretion gene (Phase 3).
  - `endoCapacity` [0, 1]: Endosymbiosis organelle capacity (Phase 3).
  - `mutationRate` [0.02, 0.35]: Inherited mutation rate.
  - `hue` [0, 360]: Lineage marker color.
- **Taxonomy Generator**: Binomial species naming algorithm (e.g. *Velox-carnis*, *Phyto-morphic*, *Colonio-dermal*) mapping genome traits to latinized names.
- **Breeding Logic**:
  - Asexual Mitosis: Gaussian trait noise + 5% chance of macro-mutation.
  - Sexual Conjugation: Recombines genes from 2 parent genomes + brain crossover.

---

### 2. Neural Network Brain Module (`src/engine/brain.js`)

#### Phase 1: Fixed Feedforward Network (8-6-4)
- 8 Sensory Inputs $\rightarrow$ 6 Hidden Neurons ($\tanh$) $\rightarrow$ 4 Action Outputs.

#### Phase 2: Recurrent Neural Network (10-8-6)
- Adds 2 internal memory state nodes (`Mem1`, `Mem2`).
- Outputs 4 & 5 write internal memory values that loop back into Inputs 8 & 9 on the next tick step, giving organisms short-term spatial memory.

#### Phase 3: NEAT Evolvable Brain Topology
- Brains undergo structural mutations (`addNeuronMutation`).
- Hidden layer dynamically expands up to 16 neuron nodes as species evolve.
- Inter-cell nerve net propagates signal pulses across spring-connected multicellular bodies.

---

### 3. Organism & Multicellular Physics Module (`src/engine/organism.js`)
- **Sensory Gathering (`perceive`)**: Assembles normalized vectors toward nearest food cell, prey creature, threat predator, kin centroid, and internal energy ratio.
- **Action Execution**:
  - Steering thrust vector ($moveX, moveY$).
  - Predation strike ($attackImpulse$).
  - Kin attraction & colony adhesion ($colonyImpulse$).
- **Spring-Damper Multicellular Physics**: Connected cells in a multicellular body exert Hooke's Law spring forces ($F = -k \cdot (d - d_0) - c \cdot v_{rel}$), creating fluid organic body movement.
- **Cell Morphotypes**:
  - `shield`: Armor membrane with $1.8\times$ predator defense rating.
  - `motor`: Swimming propulsion with $1.4\times$ speed bonus.
  - `digestor`: Stomach cell with $1.5\times$ eat rate; shares energy across cluster.
  - `ocellus`: Eye-spot sensor cell with $1.6\times$ sense radius.
  - `toxin`: Secretes paralyzing venom clouds (`#9b5de5`).
  - `germ`: Core reproductive cell.
- **Endosymbiosis**: Cells engulf specialized micro-organelles (`chloroplast` for light energy generation, `mitochondria` for speed/metabolism boost).

---

### 4. Environment & Chemistry Module (`src/engine/environment.js`)
- **Photic Zone (Top 35%)**: Sunlight penetration feeding plant nutrient soup growth.
- **Pelagic Zone (Middle 35%)**: Open water drift currents ($vx += 0.08 \sin(y \cdot 0.01)$).
- **Abyssal Vents (Bottom 30%)**: Hydrothermal vent plumes driving chemosynthesis.
- **Diurnal Day/Night Cycle**: Oscillating light intensity over a 240-tick cycle.
- **Pheromone & Toxin Layer**: Float32Array grid storing chemical signal trails and venom clouds with fluid diffusion and exponential decay.
- **Geological Eras (Phase 3)**:
  - *Hadean Volcanic* (t < 1500): High sulfide, low light.
  - *Archean Oxygenation* (t 1500–3500): Photosynthesis surge, rising $\text{O}_2$.
  - *Proterozoic Snowball Earth* (t 3500–5500): Surface ice sheet, deep vent refuges.
  - *Cambrian Explosion* (t > 5500): Optimal $\text{O}_2$, explosive species diversification.

---

### 5. World Simulation Module (`src/engine/world.js`)
- **Spatial Hash Indexing**: 2D spatial hash grid with 40px cell buckets for fast $O(N)$ spatial queries.
- **Union-Find Colony Clustering**: Recomputes connected components each tick for organisms with $colony \ge 0.38$, distance $\le 18\text{px}$, and hue difference $\le 14^\circ$.
- **Phylogenetic Clade Tree**: Data structure tracking species origins, branch splits, parent-child links, active population counts, and extinction statuses.
- **Fossil Record**: Archives top 25 historical organisms based on age, kills, and offspring count.
- **AI Automated Naturalist**: Analyzes ecosystem population shifts, predator dominance, mass extinctions, and era transitions, generating naturalistic event report logs.

---

### 6. Client Observer Dashboard (`public/`)
- **Rendering Pipeline (`public/app.js`)**:
  - Bioluminescent cell body gradient fill with inner organelle dots.
  - Morphotype visual highlights (armor borders, flagella tails, eye-spots).
  - Multicellular tissue polygon mesh stretching between spring joints.
  - Mini-map radar canvas displaying world bounds, food density, vents, and camera box.
  - Real-time Neural Network Graph visualizer rendering active nodes and connection line weights.
  - Hover Creature Tooltip HUD.
  - Camera Follow Mode tracking target organism.

---

## How to Run Each Phase

### Phase 1:
```bash
node server.js
# Access at http://localhost:3000
```

### Phase 2:
```bash
cd phase2
node server.js
# Access at http://localhost:3001
```

### Phase 3:
```bash
cd phase3
node server.js
# Access at http://localhost:3002
```

---

## Developer Guidelines for Future Agents

1. **Zero External Runtime Dependencies**: The project uses Node's native `http` and `fs` modules for server execution and standard HTML5 Canvas for rendering. Do not add heavy external native dependencies.
2. **Performance Boundaries**: Spatial hashing (`SpatialHash`) keeps neighbor queries fast. When adding new features, maintain $O(N)$ simulation tick time.
3. **Extending Engine Modules**:
   - To add a new gene: Update `GENE_RANGES` and `GENE_LABELS` in `src/engine/genome.js`.
   - To add a new cell morphotype: Add role logic to `updateRole()` and `step()` in `src/engine/organism.js`, then update visual renderer in `public/app.js`.
   - To add a new environmental hazard: Add grid array in `src/engine/environment.js` and render overlay in `public/app.js`.
