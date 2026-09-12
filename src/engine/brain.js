// ===== Primordial V6 Cognitive Brain: Multi-Layer Dynamic NEAT, Deep Topology & Hebbian Plasticity =====

function tanh(x) { return Math.tanh(x); }
function sigmoid(x) { return 1 / (1 + Math.exp(-x)); }
function gaussian() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
function lerp(a, b, t) { return a + (b - a) * t; }

const MAX_INPUTS = 24;
const MAX_HIDDEN1 = 20;
const MAX_HIDDEN2 = 12;
const MAX_OUTPUTS = 11;

class NEATBrain {
  constructor(inputSize = 16, initialHiddenSize = 10, outputSize = 7, hasDeepLayer = false, initialHidden2 = 6) {
    this.inputSize = clamp(Math.round(inputSize), 16, MAX_INPUTS);
    this.hidden1Size = clamp(Math.round(initialHiddenSize), 6, MAX_HIDDEN1);
    this.hasDeepLayer = Boolean(hasDeepLayer);
    this.hidden2Size = clamp(Math.round(initialHidden2), 4, MAX_HIDDEN2);
    this.outputSize = clamp(Math.round(outputSize), 7, MAX_OUTPUTS);

    // Max capacity bounds
    this.maxInputs = MAX_INPUTS;
    this.maxHidden1 = MAX_HIDDEN1;
    this.maxHidden2 = MAX_HIDDEN2;
    this.maxOutputs = MAX_OUTPUTS;

    // Weight matrices (dense pre-allocated Float32Array for maximum cache locality)
    // Layer 1: Inputs (max 24) -> Hidden 1 (max 20)
    this.W1 = new Float32Array(MAX_HIDDEN1 * MAX_INPUTS);
    this.B1 = new Float32Array(MAX_HIDDEN1);

    // Layer 2 (Deep): Hidden 1 (max 20) -> Hidden 2 (max 12)
    this.WDeep = new Float32Array(MAX_HIDDEN2 * MAX_HIDDEN1);
    this.BDeep = new Float32Array(MAX_HIDDEN2);

    // Layer Out: Hidden 1/2 -> Outputs (max 11)
    // Supports direct connections from Hidden 1 or Hidden 2
    this.W2 = new Float32Array(MAX_OUTPUTS * MAX_HIDDEN1);
    this.WOutDeep = new Float32Array(MAX_OUTPUTS * MAX_HIDDEN2);
    this.B2 = new Float32Array(MAX_OUTPUTS);

    // Activations
    this.inputs = new Float32Array(MAX_INPUTS);
    this.hidden1 = new Float32Array(MAX_HIDDEN1);
    this.hidden2 = new Float32Array(MAX_HIDDEN2);
    this.outputs = new Float32Array(MAX_OUTPUTS);

    // Recurrent Working Memory & Pain Traces
    this.mem1 = 0;
    this.mem2 = 0;
    this.mem3 = 0;
    this.painTrace = 0;

    // Plasticity Eligibility Traces
    this.trace1 = new Float32Array(MAX_HIDDEN1 * MAX_INPUTS);
    this.traceDeep = new Float32Array(MAX_HIDDEN2 * MAX_HIDDEN1);
    this.trace2 = new Float32Array(MAX_OUTPUTS * MAX_HIDDEN1);
    this.traceOutDeep = new Float32Array(MAX_OUTPUTS * MAX_HIDDEN2);

    this.randomize();
  }

  // Backwards compatibility getter/setter for V4/V5/V6 code
  get hiddenSize() { return this.hidden1Size; }
  set hiddenSize(v) { this.hidden1Size = clamp(Math.round(v), 6, MAX_HIDDEN1); }
  get deepHiddenSize() { return this.hidden2Size; }
  set deepHiddenSize(v) { this.hidden2Size = clamp(Math.round(v), 4, MAX_HIDDEN2); }
  get hasSkipConn() { return this.hasDeepLayer; }
  get maxHiddenSize() { return MAX_HIDDEN1; }

  applyPlasticity(reward, plasticityRate = 0.06) {
    return this.adaptPlasticity(reward, plasticityRate);
  }

  randomize(scale = 0.82) {
    for (let i = 0; i < this.W1.length; i++) this.W1[i] = gaussian() * scale;
    for (let i = 0; i < this.B1.length; i++) this.B1[i] = gaussian() * 0.2;
    for (let i = 0; i < this.WDeep.length; i++) this.WDeep[i] = gaussian() * scale;
    for (let i = 0; i < this.BDeep.length; i++) this.BDeep[i] = gaussian() * 0.2;
    for (let i = 0; i < this.W2.length; i++) this.W2[i] = gaussian() * scale;
    for (let i = 0; i < this.WOutDeep.length; i++) this.WOutDeep[i] = gaussian() * scale;
    for (let i = 0; i < this.B2.length; i++) this.B2[i] = gaussian() * 0.2;
  }

  forward(environmentInputs) {
    const inCount = Math.min(environmentInputs.length, this.inputSize);
    for (let i = 0; i < inCount; i++) {
      this.inputs[i] = environmentInputs[i] || 0;
    }
    for (let i = inCount; i < this.inputSize; i++) {
      this.inputs[i] = 0;
    }

    // Recurrent Working Memory Injection
    if (this.inputSize >= 16) {
      this.inputs[12] = this.mem1;
      this.inputs[13] = this.mem2;
      this.inputs[14] = this.mem3;
      this.inputs[15] = this.painTrace;
    }

    // 1. Evaluate Hidden Layer 1
    for (let h = 0; h < this.hidden1Size; h++) {
      let sum = this.B1[h];
      const rowOffset = h * MAX_INPUTS;
      for (let i = 0; i < this.inputSize; i++) {
        sum += this.W1[rowOffset + i] * this.inputs[i];
      }
      this.hidden1[h] = tanh(sum);
    }

    // 2. Evaluate Optional Deep Hidden Layer 2
    if (this.hasDeepLayer) {
      for (let d = 0; d < this.hidden2Size; d++) {
        let sum = this.BDeep[d];
        const rowOffset = d * MAX_HIDDEN1;
        for (let h = 0; h < this.hidden1Size; h++) {
          sum += this.WDeep[rowOffset + h] * this.hidden1[h];
        }
        this.hidden2[d] = tanh(sum);
      }
    }

    // 3. Evaluate Action Outputs
    for (let o = 0; o < this.outputSize; o++) {
      let sum = this.B2[o];

      if (this.hasDeepLayer) {
        // Output driven by Deep Layer 2 with residual skip from Layer 1
        const deepRow = o * MAX_HIDDEN2;
        for (let d = 0; d < this.hidden2Size; d++) {
          sum += this.WOutDeep[deepRow + d] * this.hidden2[d];
        }
        const skipRow = o * MAX_HIDDEN1;
        for (let h = 0; h < this.hidden1Size; h++) {
          sum += this.W2[skipRow + h] * this.hidden1[h] * 0.45;
        }
      } else {
        // Output driven directly by Hidden Layer 1
        const rowOffset = o * MAX_HIDDEN1;
        for (let h = 0; h < this.hidden1Size; h++) {
          sum += this.W2[rowOffset + h] * this.hidden1[h];
        }
      }

      // Output activation functions:
      // Outputs 0 (thrust) & 1 (turn) -> tanh [-1, 1]
      // Outputs 2 (attack) & 3 (colony bond) -> sigmoid [0, 1]
      // Outputs 4, 5, 6 (working memory) -> tanh [-1, 1]
      // Output 7 (vocalize/pulse) -> sigmoid [0, 1]
      // Output 8 (sprint boost) -> sigmoid [0, 1]
      // Output 9 (burrow/harden) -> sigmoid [0, 1]
      // Output 10 (chromatophore hue shift) -> tanh [-1, 1]
      if (o === 2 || o === 3 || o === 7 || o === 8 || o === 9) {
        this.outputs[o] = sigmoid(sum);
      } else {
        this.outputs[o] = tanh(sum);
      }
    }

    // Update Recurrent Memories with decay
    if (this.outputSize >= 6) {
      this.mem1 = lerp(this.mem1, this.outputs[4], 0.65);
      this.mem2 = lerp(this.mem2, this.outputs[5], 0.65);
      if (this.outputSize >= 7) {
        this.mem3 = lerp(this.mem3, this.outputs[6], 0.65);
      }
    }

    this.painTrace *= 0.88;

    // Update Hebbian Eligibility Traces
    for (let h = 0; h < this.hidden1Size; h++) {
      const rowOffset = h * MAX_INPUTS;
      const hAct = this.hidden1[h];
      for (let i = 0; i < this.inputSize; i++) {
        const idx = rowOffset + i;
        this.trace1[idx] = this.trace1[idx] * 0.82 + hAct * this.inputs[i];
      }
    }

    if (this.hasDeepLayer) {
      for (let d = 0; d < this.hidden2Size; d++) {
        const rowOffset = d * MAX_HIDDEN1;
        const dAct = this.hidden2[d];
        for (let h = 0; h < this.hidden1Size; h++) {
          const idx = rowOffset + h;
          this.traceDeep[idx] = this.traceDeep[idx] * 0.82 + dAct * this.hidden1[h];
        }
      }
      for (let o = 0; o < this.outputSize; o++) {
        const rowOffset = o * MAX_HIDDEN2;
        const oAct = this.outputs[o];
        for (let d = 0; d < this.hidden2Size; d++) {
          const idx = rowOffset + d;
          this.traceOutDeep[idx] = this.traceOutDeep[idx] * 0.82 + oAct * this.hidden2[d];
        }
      }
    } else {
      for (let o = 0; o < this.outputSize; o++) {
        const rowOffset = o * MAX_HIDDEN1;
        const oAct = this.outputs[o];
        for (let h = 0; h < this.hidden1Size; h++) {
          const idx = rowOffset + h;
          this.trace2[idx] = this.trace2[idx] * 0.82 + oAct * this.hidden1[h];
        }
      }
    }

    return this.outputs.subarray(0, this.outputSize);
  }

  // Lifelong Neuroplasticity: Reward-Modulated Hebbian Learning
  adaptPlasticity(reward, plasticityRate = 0.06) {
    if (plasticityRate <= 0.001 || Math.abs(reward) < 0.005) return;
    const lr = clamp(reward, -1.0, 1.0) * plasticityRate * 0.12;
    const decay = 0.9992;

    for (let h = 0; h < this.hidden1Size; h++) {
      const rowOffset = h * MAX_INPUTS;
      for (let i = 0; i < this.inputSize; i++) {
        const idx = rowOffset + i;
        this.W1[idx] = clamp(this.W1[idx] * decay + lr * this.trace1[idx], -3.8, 3.8);
      }
    }

    if (this.hasDeepLayer) {
      for (let d = 0; d < this.hidden2Size; d++) {
        const rowOffset = d * MAX_HIDDEN1;
        for (let h = 0; h < this.hidden1Size; h++) {
          const idx = rowOffset + h;
          this.WDeep[idx] = clamp(this.WDeep[idx] * decay + lr * this.traceDeep[idx], -3.8, 3.8);
        }
      }
      for (let o = 0; o < this.outputSize; o++) {
        const rowOffset = o * MAX_HIDDEN2;
        for (let d = 0; d < this.hidden2Size; d++) {
          const idx = rowOffset + d;
          this.WOutDeep[idx] = clamp(this.WOutDeep[idx] * decay + lr * this.traceOutDeep[idx], -3.8, 3.8);
        }
      }
    } else {
      for (let o = 0; o < this.outputSize; o++) {
        const rowOffset = o * MAX_HIDDEN1;
        for (let h = 0; h < this.hidden1Size; h++) {
          const idx = rowOffset + h;
          this.W2[idx] = clamp(this.W2[idx] * decay + lr * this.trace2[idx], -3.8, 3.8);
        }
      }
    }
  }

  registerPain(traumaAmount = 0.5) {
    this.painTrace = clamp(this.painTrace + traumaAmount, 0, 1);
  }

  // Structural Topology Mutation: Expand hidden neurons or activate deep layer
  addNeuronMutation() {
    if (this.hidden1Size < MAX_HIDDEN1) {
      this.hidden1Size++;
    } else if (!this.hasDeepLayer) {
      this.hasDeepLayer = true;
      this.hidden2Size = 6;
    } else if (this.hidden2Size < MAX_HIDDEN2) {
      this.hidden2Size++;
    }
  }

  mutate(rate = 0.1) {
    if (Math.random() < rate * 0.35) this.addNeuronMutation();

    const mutWeight = (w) => {
      if (Math.random() < rate) {
        let delta = gaussian() * rate * 0.55;
        if (Math.random() < 0.04) delta *= 3.2;
        return clamp(w + delta, -3.8, 3.8);
      }
      return w;
    };

    for (let i = 0; i < this.W1.length; i++) this.W1[i] = mutWeight(this.W1[i]);
    for (let i = 0; i < this.B1.length; i++) this.B1[i] = mutWeight(this.B1[i]);
    for (let i = 0; i < this.WDeep.length; i++) this.WDeep[i] = mutWeight(this.WDeep[i]);
    for (let i = 0; i < this.BDeep.length; i++) this.BDeep[i] = mutWeight(this.BDeep[i]);
    for (let i = 0; i < this.W2.length; i++) this.W2[i] = mutWeight(this.W2[i]);
    for (let i = 0; i < this.WOutDeep.length; i++) this.WOutDeep[i] = mutWeight(this.WOutDeep[i]);
    for (let i = 0; i < this.B2.length; i++) this.B2[i] = mutWeight(this.B2[i]);
  }

  crossover(otherBrain, mutRate = 0.1) {
    const inputCount = Math.max(this.inputSize, otherBrain.inputSize);
    const h1Count = Math.random() < 0.5 ? this.hidden1Size : otherBrain.hidden1Size;
    const outCount = Math.max(this.outputSize, otherBrain.outputSize);
    const deepFlag = (this.hasDeepLayer || otherBrain.hasDeepLayer) ? (Math.random() < 0.7) : false;
    const h2Count = Math.max(this.hidden2Size, otherBrain.hidden2Size);

    const child = new NEATBrain(inputCount, h1Count, outCount, deepFlag, h2Count);

    for (let i = 0; i < this.W1.length; i++) child.W1[i] = Math.random() < 0.5 ? this.W1[i] : otherBrain.W1[i];
    for (let i = 0; i < this.B1.length; i++) child.B1[i] = Math.random() < 0.5 ? this.B1[i] : otherBrain.B1[i];
    for (let i = 0; i < this.WDeep.length; i++) child.WDeep[i] = Math.random() < 0.5 ? this.WDeep[i] : otherBrain.WDeep[i];
    for (let i = 0; i < this.BDeep.length; i++) child.BDeep[i] = Math.random() < 0.5 ? this.BDeep[i] : otherBrain.BDeep[i];
    for (let i = 0; i < this.W2.length; i++) child.W2[i] = Math.random() < 0.5 ? this.W2[i] : otherBrain.W2[i];
    for (let i = 0; i < this.WOutDeep.length; i++) child.WOutDeep[i] = Math.random() < 0.5 ? this.WOutDeep[i] : otherBrain.WOutDeep[i];
    for (let i = 0; i < this.B2.length; i++) child.B2[i] = Math.random() < 0.5 ? this.B2[i] : otherBrain.B2[i];

    child.mutate(mutRate);
    return child;
  }

  clone() {
    const n = new NEATBrain(this.inputSize, this.hidden1Size, this.outputSize, this.hasDeepLayer, this.hidden2Size);
    n.W1.set(this.W1); n.B1.set(this.B1);
    n.WDeep.set(this.WDeep); n.BDeep.set(this.BDeep);
    n.W2.set(this.W2); n.WOutDeep.set(this.WOutDeep); n.B2.set(this.B2);
    n.mem1 = this.mem1; n.mem2 = this.mem2; n.mem3 = this.mem3;
    n.painTrace = this.painTrace;
    return n;
  }

  reset() {
    this.randomize(0.82);
    this.mem1 = 0; this.mem2 = 0; this.mem3 = 0; this.painTrace = 0;
  }

  toJSON() {
    return {
      inputSize: this.inputSize,
      hidden1Size: this.hidden1Size,
      hasDeepLayer: this.hasDeepLayer,
      hidden2Size: this.hidden2Size,
      outputSize: this.outputSize,
      W1: Array.from(this.W1),
      B1: Array.from(this.B1),
      WDeep: Array.from(this.WDeep),
      BDeep: Array.from(this.BDeep),
      W2: Array.from(this.W2),
      WOutDeep: Array.from(this.WOutDeep),
      B2: Array.from(this.B2),
    };
  }

  fromJSON(data) {
    this.inputSize = data.inputSize || 16;
    this.hidden1Size = data.hidden1Size || 10;
    this.hasDeepLayer = Boolean(data.hasDeepLayer);
    this.hidden2Size = data.hidden2Size || 6;
    this.outputSize = data.outputSize || 7;
    if (data.W1) this.W1.set(data.W1);
    if (data.B1) this.B1.set(data.B1);
    if (data.WDeep) this.WDeep.set(data.WDeep);
    if (data.BDeep) this.BDeep.set(data.BDeep);
    if (data.W2) this.W2.set(data.W2);
    if (data.WOutDeep) this.WOutDeep.set(data.WOutDeep);
    if (data.B2) this.B2.set(data.B2);
  }
}

if (typeof module !== 'undefined') {
  module.exports = { NeuralNetwork: NEATBrain };
}
