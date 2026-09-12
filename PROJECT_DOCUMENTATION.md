# Primordial Earth — Artificial Life Observatory & Evolution Simulation

## Executive Summary

**Primordial Earth** is a high-performance, zero-external-runtime-dependency artificial life observatory simulating evolutionary biology, neural cognition, and planetary ecology from the origin of life to complex multi-trophic ecosystems. Unicellular and multicellular organisms carry evolvable genomes and neural brains, navigating expansive ecosystems, developing specialized cell bodies, and adapting across geological eras.

The project is structured into five progressive evolutionary iterations:
1. **Phase 1 (Root/v1)**: Baseline neural simulation, physical genes, food grid, basic colonies, and single-page observer UI (`http://localhost:3000`).
2. **Phase 2 (v2)**: Recurrent Neural Networks (RNN) with internal memory nodes, spring-joint multicellular physics, multi-biome depths, pheromone trails, camera follow mode, and phylogenetic clade trees (`http://localhost:3001`).
3. **Phase 3 (v3)**: NEAT Brain Topology Evolution, Endosymbiosis, Venom Toxin Secretion, Deep-Time Geological Eras (Hadean, Archean Oxygenation, Snowball Earth, Cambrian Explosion), Atmospheric Gas Chemistry ($\text{O}_2, \text{CO}_2, \text{H}_2\text{S}$), and an AI Automated Naturalist (`http://localhost:3002`).
4. **Phase 4 (v4)**: Sprawling Dual-Biome Continent ($4000 \times 3000$), Natural Materials (**Stones, Detritus Mud, Glacial Ice, Land, Ocean**), Multi-Scale Infinite Zoom ($0.12\times$ to $12\times$) with **Microscope Mode** (intracellular organelles, mitochondria ATP sparks, chloroplast thylakoids, membrane bilayer, synaptic firing), **Compound Raycast Vision with Obstacle Occlusion**, **Lifelong Neuroplasticity (Hebbian Learning & Reinforcement)**, **Homeostatic Cognitive Drives** (Hunger, Thirst, Fear, Mating), and **Amphibious Transition Genetics** (`http://localhost:3002`).
5. **Phase 5 (v5 - Current)**: **Living Planet & Deep Ecology** — Atmospheric Day/Night Lighting Shader with Living Creature Bioluminescent Radiance, Dynamic Coastal Foam & Swimming Wakes, Living Autotroph Flora (Giant Kelp, Terrestrial Mosses, Tree Ferns, Reef Corals) with Fluid Swaying Physics, Persistent Decomposing Carcasses & Skeletal Fossil Beds, Dynamic Weather Systems (Rainstorms & Glacial Blizzards) generating Land Moisture Corridors, 40-Tick Intracellular Mitosis Cycle, Predatory Harpoon Nematocysts, and Expanded God Tools (`http://localhost:3002`).

---

## Directory & File Architecture

```
primordial/
├── package.json              # Project manifest (v5.0.0) with automated test suites
├── server.js                 # Zero-dependency native Node.js HTTP server (Port 3002)
├── engine.js                 # Unified engine module exports (V1–V5)
├── test_v5.js                # Headless automated verification suite for V5 (170+ TPS)
├── test_v4.js                # Headless automated verification suite for V4
├── src/engine/               # Core simulation engine modules
│   ├── flora.js              # [V5] Living flora autotrophs, swaying physics, spores & grazing
│   ├── carcass.js            # [V5] Decomposing carcasses, skeletal decay & scavenger feeding
│   ├── weather.js            # [V5] Atmospheric storm fronts, wind vectors & moisture corridors
│   ├── terrain.js            # Dual-biome continent, stone colliders & material physics
│   ├── vision.js             # Compound eye raycasting (flora, carcasses, organisms, boulders)
│   ├── genome.js             # 16-gene continuous chromosomes & amphibious Latin taxonomy
│   ├── brain.js              # Cognitive NEAT Brain (16 inputs, Hebbian learning, working memory)
│   ├── organism.js           # 40-tick mitosis, amphibious locomotion, moisture, harpoons & combat
│   ├── environment.js        # FoodGrid, detritus soils, hydrothermal vents & geological eras
│   └── world.js              # 4000x3000 world manager, spatial hashing, day/night diurnal cycle & stats
└── public/                   # Client observer dashboard
    ├── index.html            # Observer layout, Diurnal time badge, Night shader toggle & God tools
    ├── styles.css            # Bioluminescent design system, night controls & phase badges
    └── app.js                # Day/night lighting shader, living flora renderer, wakes, mitosis & UI
```

---

## Version 5 Core Innovations & Mechanics

### 1. Atmospheric Day/Night Lighting & Bioluminescence
- **Diurnal Astronomical Clock**: Continuous day/night sinusoidal cycle ($\tau = 240\text{ ticks}$).
- **Atmospheric Darkness Shader**: During planetary nightfall, an atmospheric ambient darkness blanket renders across the viewport ($30\% - 70\%$ opacity).
- **Living Creature Bioluminescence**: Organisms emit colored radial light gradients using Canvas `globalCompositeOperation = 'lighter'`. Predators glow with crimson bioluminescence, herbivores shimmer in emerald, and deep-water swimmers glow with cyan/violet luminescence.
- **Toggle Control**: Real-time `Night Shader: ON/OFF` button in the HUD allows observers to seamlessly toggle between atmospheric night darkness and clear daylight visibility.

### 2. Living Autotroph Flora Entities (`src/engine/flora.js`)
- **Independent Multicellular Plants**:
  - `KELP`: Aquatic kelp forests swaying gracefully in water currents, photosynthesizing under sunlight.
  - `MOSS`: Terrestrial ground cover thriving in damp soil and rain corridors.
  - `FERN`: Sprawling terrestrial vascular flora with towering stalks.
  - `CORAL`: Calcified shallow-water reef structures providing shelter.
- **Photosynthetic Ecology**: Flora consume sunlight and soil nutrients to grow biomass and synthesize planetary $\text{O}_2$, directly accelerating planetary oxygenation.
- **Current Swaying Physics**: Stems compute multi-segment cubic Bézier splines oscillating with water currents and wind forces.
- **Reproductive Spore Dispersal**: Mature flora release buoyant spores that drift across wind vectors and germinate when landing on fertile soil.
- **Herbivore Grazing**: Herbivores graze directly on living flora stalks, creating natural trophic food chains beyond ambient grid nutrients.

### 3. Persistent Decomposing Carcasses & Fossil Beds (`src/engine/carcass.js`)
- **Post-Mortem Persistence**: When creatures perish from starvation, predation, cold, or desiccation, their bodies do not simply vanish. They spawn physical `Carcass` entities.
- **Two-Stage Decomposition**:
  - **Flesh Decay**: Rotting meat slowly leaches organic nutrients into surrounding soil/water.
  - **Skeletal Decay**: Once flesh is consumed or decayed, ivory skeletal remains persist, eventually petrifying into permanent rock fossil beds.
- **Scavenger Feeding**: Carnivorous and scavenger organisms locate carcasses via compound vision and feed on carrion without expending energy on active hunts.

### 4. Dynamic Weather Systems (`src/engine/weather.js`)
- **Atmospheric Storm Fronts**: Massive circular weather fronts ($r = 300 - 450\text{px}$) that travel across the continent governed by prevailing wind vectors.
- **Rainstorms**:
  - Drench continental landmasses, elevating local ground moisture above $250\%$.
  - Create freshwater migration corridors, enabling aquatic and amphibious life to crawl inland without desiccating.
- **Glacial Blizzards**:
  - Sweep across northern ice caps and high elevations.
  - Cloud cover dims sunlight, suppressing photosynthesis and testing thermal tolerance.
- **Visual Cloud Layers & Rain Streaks**: Semi-transparent cloud shadows with directional falling raindrops and snow particles.

### 5. Intracellular Mitosis Division Cycle (`src/engine/organism.js` & `public/app.js`)
- **40-Tick Biological State Machine**:
  - `Ticks 1–10 (Prophase)`: Cell body expands, chromatin fibers condense into distinct chromosomes.
  - `Ticks 11–20 (Metaphase)`: Microtubule mitotic spindle fibers align paired chromatids along the equatorial metaphase plate.
  - `Ticks 21–30 (Anaphase)`: Spindle filaments contract, pulling daughter chromosomes to opposite cellular poles.
  - `Ticks 31–40 (Cytokinesis)`: Cleavage furrow constricts cell membrane until two viable daughter cells pinch apart.
- **Microscope Magnification ($\ge 2.8\times$)**: Mitotic spindle fibers, dividing chromatin pairs, and membrane cleavage constriction are rendered in real-time detail under microscope mode.

### 6. Predatory Harpoon Nematocysts & Marine Fluidics
- **Harpoon Filaments**: Striking predators fire high-speed tensile nematocyst threads that physically latch onto prey.
- **Marine Dynamics**:
  - Dynamic shoreline foam ripples along the coastal surf zone where ocean waves lap against land.
  - Swimming wakes ripple behind fast pelagic swimmers.
  - Terrestrial mucus trails mark the crawl paths of land-dwelling pioneers.

### 7. Expanded God Sculpting Tools
- Added interactive brush tools:
  - 🌿 `Kelp`: Plant aquatic giant kelp stalks in water biomes.
  - 🪴 `Moss`: Seed terrestrial moss carpets on continental land.
  - 🌧️ `Rain`: Summon localized cyclonic rainstorm fronts.

---

## Version 6: Morphological Organogenesis, Deep Brain Evolution & Genetic Anomalies

### 1. Morphological Organogenesis & Kinematics (`src/engine/genome.js`, `src/engine/organism.js`, `public/app.js`)
- **Articulated Multi-Segment Spine Kinematics**:
  - Organisms evolve beyond single-cell vesicles into true multicellular segmented beings ($1 - 8$ body segments).
  - Segments maintain strict inter-segment spacing constraints ($d = (r_{prev} + r_{curr}) \times 0.72$), producing realistic undulating serpentine and trilobite-like bending dynamics during locomotion.
- **Jointed Crawling Legs & Undulating Swimming Fins**:
  - `appendagePairs` gene ($0 - 5$ pairs): Controls the number of lateral locomotor limbs.
  - **Terrestrial Walking**: Multi-jointed articulated walking legs step in alternating phase cycles ($l_{phase} = \sin(\phi + s \cdot 1.1)$) with knee flexure and claw footing on land surfaces.
  - **Aquatic Swimming**: Hydrodynamic swimming paddles and lateral fins sweep through water with fluid undulating thrust.
- **Cephalic & Caudal Ornaments**:
  - `headOrnament` gene: Tactile sensory antennae with wiggling bulbs ($< 0.5$) or serrated predatory raptorial mandibles ($\ge 0.5$).
  - `tailType` gene: Caudal swimming fluke ($< 0.5$) or articulated venomous stinger ($\ge 0.5$).
- **Chitinous Carapace Shell Plates**:
  - Mineralized shell plates with reflective luster highlights driven by `shellMineral` gene and ingested calcium reserves.

### 2. Dynamic Deep Neural Brain Architecture (`src/engine/brain.js`, `src/engine/organism.js`)
- **Expandable Sensory Perception Bus (16 up to 24 Inputs)**:
  - Base channels $0 - 15$: Compound vision rays ($R_0 - R_4$), nutrient/toxin gradients, hunger, thirst, fear, mating urge, surface friction, and recurrent working memories ($M_1, M_2, M_3, \text{pain}$).
  - V6 Extended channels $16 - 23$: Hydration moisture cuticle, shell mineral calcium reserve, nearby predator threat vector, prey scent gradient, barometric storm pressure, mud sediment depth, acoustic vocalization resonance, and pack alignment angle.
- **Deep Multi-Layer Topology**:
  - $H_1$ Hidden Layer: Dynamically scalable between $6$ and $20$ nodes.
  - Deep $H_2$ Layer: Optional secondary hidden layer ($4 - 12$ nodes) enabled by `brainDeepLayers` gene.
  - Residual Skip Connections: Direct feedforward connections from $H_1$ to outputs bypassing $H_2$ for fast reflex responses.
- **Expanded Action Outputs (7 up to 11 Outputs)**:
  - Base channels $0 - 6$: Forward thrust, angular steering, predatory attack, colony adhesion, and recurrent memory writes ($M_1, M_2, M_3$).
  - V6 Extended channels $7 - 10$: Stone calcium scraping, sediment mud burrowing, acoustic pack vocalization, and sprint burst acceleration.
- **Reward-Modulated Hebbian Plasticity**:
  - Synapses adapt in real-time based on life experience, feeding rewards, predatory success, and pain avoidance.

### 3. Homologous Chromosomal Crossover & Genetic Macro-Mutations (`src/engine/genome.js`)
- **Two-Point Homologous Crossover (`crossoverGenome`)**:
  - Sexual reproduction exchanges genetic intervals between parents, producing novel hybridized lineages with blended species nomenclature.
- **Genetic Anomalies (`GENETIC_ANOMALIES`)**:
  - 👑 **TITAN**: Colossal body scale ($1.8\times$), massive energy capacity ($2.0\times$), high damage resistance, and golden radiant aura.
  - 🐉 **POLYCEPHALY**: Twin head lobes with dual compound eye pairs, casting $10$ vision rays across expanded fields of view.
  - 👻 **ALBINO**: Melanin deficiency resulting in pale pearlescent coloration, glowing ruby pupils, and low-detectability stealth against predators.
  - 🛡️ **SPIKED_CARAPACE**: Radiating chitin spikes along all body segments, inflicting immediate recoil damage on attacking predators.
  - 🌈 **CHIMERA**: Split iridescent coloration shifting chromatically over time, with heightened pheromone emission and pack alignment.

### 4. Deep Element Interactions & Mutagen Radiation Zones
- **Stone Boulders & Calcium Scraping**:
  - Organisms rasp against solid stone boulders to scrape calcium minerals, hardening their shell shield up to $100\%$ and mitigating predator attacks.
- **Mudflat Sediment Burrowing**:
  - Organisms can bury themselves into mud and soil, granting concealment from hunters and passively filtering detritus nutrients from sediment.
- **Acoustic Pack Signaling**:
  - Vocalizing organisms emit expanding acoustic sonar rings ($78, 205, 196$), allowing conspecifics to align velocities and form hunting packs.
- **Mutagenic Pools & Anomaly Radiation Zones**:
  - Swirling mutagen zones on the map amplify local mutation rates by up to $3.5\times$, serving as evolutionary accelerators where new anomalies emerge.
  - Includes interactive 🧬 `Mutagen` God brush tool.

---

## How to Run & Test

```bash
# Start the Version 6 Observatory
npm start
# Opens on http://localhost:3002

# Run full V6 automated verification suite
npm test

# Run backwards-compatibility V5 test suite
npm run test:v5

# Run backwards-compatibility V4 test suite
npm run test:v4
```

---

## Verification & Performance Benchmarks

The automated test suite (`node test_v6.js`) validates:
1. **Dynamic Multi-Layer Brain Architecture**: 24-input forward passes, deep $H_2$ layer execution, residual skip connections, Hebbian plasticity, and crossover.
2. **Homologous Crossover & Genetic Anomalies**: Two-point chromosomal crossover and phenotypic macro-mutations (Titan, Polycephaly, Albino, Spiked Carapace, Chimera).
3. **Morphological Organogenesis & Kinematics**: Articulated multi-segment distance constraints, segment angle propagation, and appendage stepping gait cycles.
4. **Deep Element Interactions**: Stone calcium scraping, mud burrowing concealment, mutagen zone radiation multipliers, and Polycephaly 10-ray vision.
5. **Simulation Throughput**: **440+ simulation ticks per second** in headless Node.js on a full $4000 \times 3000$ planet with active flora, carcasses, weather, and mutagen zones.

