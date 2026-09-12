// ===== Phase 3 Neural Engine: NEAT Evolvable Brain Topology with Dynamic Neurons =====

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
  constructor(inputSize = 10, initialHiddenSize = 8, outputSize = 6) {
    this.inputSize = inputSize;
    this.hiddenSize = initialHiddenSize;
    this.maxHiddenSize = 16;
    this.outputSize = outputSize;

    // Weights matrices
    this.W1 = new Float32Array(this.maxHiddenSize * inputSize);
    this.B1 = new Float32Array(this.maxHiddenSize);

    this.W2 = new Float32Array(outputSize * this.maxHiddenSize);
    this.B2 = new Float32Array(outputSize);

    // Activations
    this.inputs = new Float32Array(inputSize);
    this.hidden = new Float32Array(this.maxHiddenSize);
    this.outputs = new Float32Array(outputSize);

    // Recurrent Memory Feedback State
    this.mem1 = 0;
    this.mem2 = 0;

    this.randomize();
  }

  randomize(scale = 0.85) {
    for (let i = 0; i < this.W1.length; i++) this.W1[i] = gaussian() * scale;
    for (let i = 0; i < this.B1.length; i++) this.B1[i] = gaussian() * 0.2;
    for (let i = 0; i < this.W2.length; i++) this.W2[i] = gaussian() * scale;
    for (let i = 0; i < this.B2.length; i++) this.B2[i] = gaussian() * 0.2;
  }

  forward(environmentInputs) {
    for (let i = 0; i < 8; i++) this.inputs[i] = environmentInputs[i] || 0;
    this.inputs[8] = this.mem1;
    this.inputs[9] = this.mem2;

    // Evaluate active hidden neurons
    for (let h = 0; h < this.hiddenSize; h++) {
      let sum = this.B1[h];
      const rowOffset = h * this.inputSize;
      for (let i = 0; i < this.inputSize; i++) {
        sum += this.W1[rowOffset + i] * this.inputs[i];
      }
      this.hidden[h] = tanh(sum);
    }

    // Evaluate outputs
    for (let o = 0; o < this.outputSize; o++) {
      let sum = this.B2[o];
      const rowOffset = o * this.maxHiddenSize;
      for (let h = 0; h < this.hiddenSize; h++) {
        sum += this.W2[rowOffset + h] * this.hidden[h];
      }
      if (o < 2 || o >= 4) {
        this.outputs[o] = tanh(sum);
      } else {
        this.outputs[o] = sigmoid(sum);
      }
    }

    this.mem1 = this.outputs[4];
    this.mem2 = this.outputs[5];
    return this.outputs;
  }

  // NEAT Structural Mutation: Add new hidden neuron node
  addNeuronMutation() {
    if (this.hiddenSize < this.maxHiddenSize) {
      const newH = this.hiddenSize;
      this.hiddenSize++;
      // Initialize small connection weights for new neuron node
      const row1 = newH * this.inputSize;
      for (let i = 0; i < this.inputSize; i++) this.W1[row1 + i] = gaussian() * 0.5;
      this.B1[newH] = 0;

      for (let o = 0; o < this.outputSize; o++) {
        this.W2[o * this.maxHiddenSize + newH] = gaussian() * 0.5;
      }
    }
  }

  mutate(rate = 0.1) {
    // 1. Structural mutations
    if (Math.random() < rate * 0.25) this.addNeuronMutation();

    // 2. Synaptic weight mutations
    const mutWeight = (w) => {
      if (Math.random() < rate) {
        let delta = gaussian() * rate * 0.5;
        if (Math.random() < 0.03) delta *= 3.0;
        return clamp(w + delta, -3.5, 3.5);
      }
      return w;
    };

    for (let i = 0; i < this.W1.length; i++) this.W1[i] = mutWeight(this.W1[i]);
    for (let i = 0; i < this.B1.length; i++) this.B1[i] = mutWeight(this.B1[i]);
    for (let i = 0; i < this.W2.length; i++) this.W2[i] = mutWeight(this.W2[i]);
    for (let i = 0; i < this.B2.length; i++) this.B2[i] = mutWeight(this.B2[i]);
  }

  adaptPlasticity(reward, plasticityRate = 0.05) {
    if (plasticityRate <= 0.001 || Math.abs(reward) < 0.01) return;
    const lr = clamp(reward, -1, 1) * plasticityRate * 0.1;

    for (let h = 0; h < this.hiddenSize; h++) {
      const rowOffset = h * this.inputSize;
      const hAct = this.hidden[h];
      for (let i = 0; i < this.inputSize; i++) {
        this.W1[rowOffset + i] = clamp(this.W1[rowOffset + i] + lr * hAct * this.inputs[i], -3.5, 3.5);
      }
    }

    for (let o = 0; o < this.outputSize; o++) {
      const rowOffset = o * this.maxHiddenSize;
      const oAct = this.outputs[o];
      for (let h = 0; h < this.hiddenSize; h++) {
        this.W2[rowOffset + h] = clamp(this.W2[rowOffset + h] + lr * oAct * this.hidden[h], -3.5, 3.5);
      }
    }
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
    n.mem1 = this.mem1; n.mem2 = this.mem2;
    return n;
  }

  reset() { this.randomize(0.9); this.mem1 = 0; this.mem2 = 0; }

  prune(threshold = 0.08) {
    for (let i = 0; i < this.W1.length; i++) if (Math.abs(this.W1[i]) < threshold) this.W1[i] = 0;
    for (let i = 0; i < this.W2.length; i++) if (Math.abs(this.W2[i]) < threshold) this.W2[i] = 0;
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
    this.hiddenSize = data.hiddenSize || 8;
    this.W1.set(data.W1);
    this.B1.set(data.B1);
    this.W2.set(data.W2);
    this.B2.set(data.B2);
  }
}

if (typeof module !== 'undefined') {
  module.exports = { NeuralNetwork: NEATBrain };
}
