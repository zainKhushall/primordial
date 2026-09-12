// ===== Primordial V4 Cognitive Brain: NEAT Topology, Hebbian Neuroplasticity & Working Memory =====

function tanh(x) { return Math.tanh(x); }
function sigmoid(x) { return 1 / (1 + Math.exp(-x)); }
function gaussian() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

class NEATBrain {
  constructor(inputSize = 16, initialHiddenSize = 10, outputSize = 7) {
    this.inputSize = inputSize;
    this.hiddenSize = initialHiddenSize;
    this.maxHiddenSize = 22;
    this.outputSize = outputSize;

    // Synaptic weight matrices
    this.W1 = new Float32Array(this.maxHiddenSize * inputSize);
    this.B1 = new Float32Array(this.maxHiddenSize);

    this.W2 = new Float32Array(outputSize * this.maxHiddenSize);
    this.B2 = new Float32Array(outputSize);

    // Activations
    this.inputs = new Float32Array(inputSize);
    this.hidden = new Float32Array(this.maxHiddenSize);
    this.outputs = new Float32Array(outputSize);

    // Working Memory & Recurrent Leaky Traces
    this.mem1 = 0;
    this.mem2 = 0;
    this.mem3 = 0;
    this.painTrace = 0;

    // Synaptic Plasticity Eligibility Traces
    this.trace1 = new Float32Array(this.maxHiddenSize * inputSize);
    this.trace2 = new Float32Array(outputSize * this.maxHiddenSize);

    this.randomize();
  }

  randomize(scale = 0.85) {
    for (let i = 0; i < this.W1.length; i++) this.W1[i] = gaussian() * scale;
    for (let i = 0; i < this.B1.length; i++) this.B1[i] = gaussian() * 0.2;
    for (let i = 0; i < this.W2.length; i++) this.W2[i] = gaussian() * scale;
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

    // Inject recurrent memory and pain traces into final input slots
    if (this.inputSize >= 16) {
      this.inputs[12] = this.mem1;
      this.inputs[13] = this.mem2;
      this.inputs[14] = this.mem3;
      this.inputs[15] = this.painTrace;
    } else if (this.inputSize >= 10) {
      this.inputs[this.inputSize - 2] = this.mem1;
      this.inputs[this.inputSize - 1] = this.mem2;
    }

    // Evaluate dynamic hidden neurons
    for (let h = 0; h < this.hiddenSize; h++) {
      let sum = this.B1[h];
      const rowOffset = h * this.inputSize;
      for (let i = 0; i < this.inputSize; i++) {
        sum += this.W1[rowOffset + i] * this.inputs[i];
      }
      this.hidden[h] = tanh(sum);
    }

    // Evaluate action outputs
    for (let o = 0; o < this.outputSize; o++) {
      let sum = this.B2[o];
      const rowOffset = o * this.maxHiddenSize;
      for (let h = 0; h < this.hiddenSize; h++) {
        sum += this.W2[rowOffset + h] * this.hidden[h];
      }
      // Outputs 0 (thrust) & 1 (turn) use tanh [-1, 1]
      // Outputs 2 (attack) & 3 (colony) use sigmoid [0, 1]
      // Outputs 4, 5, 6 (memories) use tanh [-1, 1]
      if (o === 2 || o === 3) {
        this.outputs[o] = sigmoid(sum);
      } else {
        this.outputs[o] = tanh(sum);
      }
    }

    // Update recurrent memory nodes with decay
    if (this.outputSize >= 6) {
      this.mem1 = lerp(this.mem1, this.outputs[4], 0.7);
      this.mem2 = lerp(this.mem2, this.outputs[5], 0.7);
      if (this.outputSize >= 7) {
        this.mem3 = lerp(this.mem3, this.outputs[6], 0.7);
      }
    }

    // Decay pain trace
    this.painTrace *= 0.88;

    // Update eligibility traces for Hebbian learning
    for (let h = 0; h < this.hiddenSize; h++) {
      const rowOffset = h * this.inputSize;
      const hAct = this.hidden[h];
      for (let i = 0; i < this.inputSize; i++) {
        const idx = rowOffset + i;
        this.trace1[idx] = this.trace1[idx] * 0.8 + hAct * this.inputs[i];
      }
    }
    for (let o = 0; o < this.outputSize; o++) {
      const rowOffset = o * this.maxHiddenSize;
      const oAct = this.outputs[o];
      for (let h = 0; h < this.hiddenSize; h++) {
        const idx = rowOffset + h;
        this.trace2[idx] = this.trace2[idx] * 0.8 + oAct * this.hidden[h];
      }
    }

    return this.outputs;
  }

  // --- Lifelong Neuroplasticity: Reward-Modulated Hebbian Learning ---
  adaptPlasticity(reward, plasticityRate = 0.06) {
    if (plasticityRate <= 0.001 || Math.abs(reward) < 0.005) return;
    const lr = clamp(reward, -1.0, 1.0) * plasticityRate * 0.12;

    // Weight decay factor to prevent runaway saturation
    const decay = 0.9992;

    for (let h = 0; h < this.hiddenSize; h++) {
      const rowOffset = h * this.inputSize;
      for (let i = 0; i < this.inputSize; i++) {
        const idx = rowOffset + i;
        this.W1[idx] = clamp(this.W1[idx] * decay + lr * this.trace1[idx], -3.8, 3.8);
      }
    }

    for (let o = 0; o < this.outputSize; o++) {
      const rowOffset = o * this.maxHiddenSize;
      for (let h = 0; h < this.hiddenSize; h++) {
        const idx = rowOffset + h;
        this.W2[idx] = clamp(this.W2[idx] * decay + lr * this.trace2[idx], -3.8, 3.8);
      }
    }
  }

  registerPain(traumaAmount = 0.5) {
    this.painTrace = clamp(this.painTrace + traumaAmount, 0, 1);
  }

  // --- Structural NEAT Mutation: Add dynamic hidden neuron node ---
  addNeuronMutation() {
    if (this.hiddenSize < this.maxHiddenSize) {
      const newH = this.hiddenSize;
      this.hiddenSize++;
      const row1 = newH * this.inputSize;
      for (let i = 0; i < this.inputSize; i++) {
        this.W1[row1 + i] = gaussian() * 0.4;
      }
      this.B1[newH] = 0;

      for (let o = 0; o < this.outputSize; o++) {
        this.W2[o * this.maxHiddenSize + newH] = gaussian() * 0.4;
      }
    }
  }

  mutate(rate = 0.1) {
    if (Math.random() < rate * 0.3) this.addNeuronMutation();

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
    for (let i = 0; i < this.W2.length; i++) this.W2[i] = mutWeight(this.W2[i]);
    for (let i = 0; i < this.B2.length; i++) this.B2[i] = mutWeight(this.B2[i]);
  }

  crossover(otherBrain, mutRate = 0.1) {
    const child = new NEATBrain(this.inputSize, Math.max(this.hiddenSize, otherBrain.hiddenSize), this.outputSize);
    child.hiddenSize = Math.random() < 0.5 ? this.hiddenSize : otherBrain.hiddenSize;

    for (let i = 0; i < this.W1.length; i++) child.W1[i] = Math.random() < 0.5 ? this.W1[i] : otherBrain.W1[i];
    for (let i = 0; i < this.B1.length; i++) child.B1[i] = Math.random() < 0.5 ? this.B1[i] : otherBrain.B1[i];
    for (let i = 0; i < this.W2.length; i++) child.W2[i] = Math.random() < 0.5 ? this.W2[i] : otherBrain.W2[i];
    for (let i = 0; i < this.B2.length; i++) child.B2[i] = Math.random() < 0.5 ? this.B2[i] : otherBrain.B2[i];

    child.mutate(mutRate);
    return child;
  }

  clone() {
    const n = new NEATBrain(this.inputSize, this.hiddenSize, this.outputSize);
    n.hiddenSize = this.hiddenSize;
    n.W1.set(this.W1); n.B1.set(this.B1); n.W2.set(this.W2); n.B2.set(this.B2);
    n.mem1 = this.mem1; n.mem2 = this.mem2; n.mem3 = this.mem3;
    n.painTrace = this.painTrace;
    return n;
  }

  reset() {
    this.randomize(0.85);
    this.mem1 = 0; this.mem2 = 0; this.mem3 = 0; this.painTrace = 0;
  }

  toJSON() {
    return {
      inputSize: this.inputSize,
      hiddenSize: this.hiddenSize,
      outputSize: this.outputSize,
      W1: Array.from(this.W1),
      B1: Array.from(this.B1),
      W2: Array.from(this.W2),
      B2: Array.from(this.B2),
    };
  }

  fromJSON(data) {
    this.hiddenSize = data.hiddenSize || 10;
    this.W1.set(data.W1);
    this.B1.set(data.B1);
    this.W2.set(data.W2);
    this.B2.set(data.B2);
  }
}

function lerp(a, b, t) { return a + (b - a) * t; }

if (typeof module !== 'undefined') {
  module.exports = { NeuralNetwork: NEATBrain };
}
