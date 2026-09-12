// ===== Phase 2 Neural Engine: Recurrent Neural Network (RNN) with Memory Nodes & Plasticity =====

function tanh(x) { return Math.tanh(x); }
function sigmoid(x) { return 1 / (1 + Math.exp(-x)); }
function gaussian() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

class NeuralNetwork {
  constructor(inputSize = 10, hiddenSize = 8, outputSize = 6) {
    this.inputSize = inputSize;
    this.hiddenSize = hiddenSize;
    this.outputSize = outputSize;

    // Weights: W1[h][i] connects input i to hidden neuron h
    this.W1 = new Float32Array(hiddenSize * inputSize);
    this.B1 = new Float32Array(hiddenSize);

    // Weights: W2[o][h] connects hidden neuron h to output o
    this.W2 = new Float32Array(outputSize * hiddenSize);
    this.B2 = new Float32Array(outputSize);

    // Activations
    this.inputs = new Float32Array(inputSize);
    this.hidden = new Float32Array(hiddenSize);
    this.outputs = new Float32Array(outputSize);

    // Recurrent Memory Internal Feedback State
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
    // Fill first 8 external sensory inputs
    for (let i = 0; i < 8; i++) {
      this.inputs[i] = environmentInputs[i] || 0;
    }
    // Fill last 2 inputs with recurrent memory state feedback
    this.inputs[8] = this.mem1;
    this.inputs[9] = this.mem2;

    // Hidden Layer Evaluation
    for (let h = 0; h < this.hiddenSize; h++) {
      let sum = this.B1[h];
      const rowOffset = h * this.inputSize;
      for (let i = 0; i < this.inputSize; i++) {
        sum += this.W1[rowOffset + i] * this.inputs[i];
      }
      this.hidden[h] = tanh(sum);
    }

    // Output Layer Evaluation
    for (let o = 0; o < this.outputSize; o++) {
      let sum = this.B2[o];
      const rowOffset = o * this.hiddenSize;
      for (let h = 0; h < this.hiddenSize; h++) {
        sum += this.W2[rowOffset + h] * this.hidden[h];
      }
      // outputs 0 & 1 are move vectors (tanh), 2 & 3 are impulses (sigmoid), 4 & 5 are next memory state (tanh)
      if (o < 2 || o >= 4) {
        this.outputs[o] = tanh(sum);
      } else {
        this.outputs[o] = sigmoid(sum);
      }
    }

    // Write back recurrent memory state for next tick
    this.mem1 = this.outputs[4];
    this.mem2 = this.outputs[5];

    return this.outputs;
  }

  mutate(rate = 0.1) {
    const mutWeight = (w) => {
      if (Math.random() < rate) {
        let delta = gaussian() * rate * 0.5;
        if (Math.random() < 0.03) delta *= 3.0; // macro weight jump
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
      const rowOffset = o * this.hiddenSize;
      const oAct = this.outputs[o];
      for (let h = 0; h < this.hiddenSize; h++) {
        this.W2[rowOffset + h] = clamp(this.W2[rowOffset + h] + lr * oAct * this.hidden[h], -3.5, 3.5);
      }
    }
  }

  crossover(otherBrain, mutRate = 0.1) {
    const child = new NeuralNetwork(this.inputSize, this.hiddenSize, this.outputSize);
    for (let i = 0; i < this.W1.length; i++) child.W1[i] = Math.random() < 0.5 ? this.W1[i] : otherBrain.W1[i];
    for (let i = 0; i < this.B1.length; i++) child.B1[i] = Math.random() < 0.5 ? this.B1[i] : otherBrain.B1[i];
    for (let i = 0; i < this.W2.length; i++) child.W2[i] = Math.random() < 0.5 ? this.W2[i] : otherBrain.W2[i];
    for (let i = 0; i < this.B2.length; i++) child.B2[i] = Math.random() < 0.5 ? this.B2[i] : otherBrain.B2[i];
    child.mutate(mutRate);
    return child;
  }

  clone() {
    const n = new NeuralNetwork(this.inputSize, this.hiddenSize, this.outputSize);
    n.W1.set(this.W1);
    n.B1.set(this.B1);
    n.W2.set(this.W2);
    n.B2.set(this.B2);
    n.mem1 = this.mem1;
    n.mem2 = this.mem2;
    return n;
  }

  reset() {
    this.randomize(0.9);
    this.mem1 = 0;
    this.mem2 = 0;
  }

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
    this.W1.set(data.W1);
    this.B1.set(data.B1);
    this.W2.set(data.W2);
    this.B2.set(data.B2);
  }
}

if (typeof module !== 'undefined') {
  module.exports = { NeuralNetwork };
}
