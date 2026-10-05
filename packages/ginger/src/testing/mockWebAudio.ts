type MockAudioContextState = AudioContextState;

class MockAudioNode {
  readonly connections: MockAudioNode[] = [];
  readonly connectCalls: MockAudioNode[] = [];
  disconnectCalls = 0;

  connect(destination?: unknown) {
    if (destination && typeof destination === "object" && "connections" in destination) {
      const node = destination as MockAudioNode;
      this.connections.push(node);
      this.connectCalls.push(node);
      return node;
    }
    return destination;
  }

  disconnect(_node?: MockAudioNode) {
    this.disconnectCalls += 1;
    this.connections.length = 0;
  }
}

export class MockAudioDestinationNode extends MockAudioNode {}

export class MockMediaElementAudioSourceNode extends MockAudioNode {
  constructor(readonly mediaElement: HTMLAudioElement) {
    super();
  }
}

export class MockAnalyserNode extends MockAudioNode {
  fftSize = 2048;
  smoothingTimeConstant = 0.8;
  minDecibels = -100;
  maxDecibels = -30;

  get frequencyBinCount() {
    return this.fftSize / 2;
  }

  getByteFrequencyData(array: Uint8Array) {
    for (let i = 0; i < array.length; i += 1) {
      array[i] = ((i + 1) * 17) % 256;
    }
  }

  getByteTimeDomainData(array: Uint8Array) {
    for (let i = 0; i < array.length; i += 1) {
      array[i] = 128 + (i % 32);
    }
  }
}

export class MockBiquadFilterNode extends MockAudioNode {
  type: BiquadFilterType = "peaking";
  readonly frequency = { value: 1000 };
  readonly gain = { value: 0 };
  readonly Q = { value: 1 };
}

class MockAudioParam {
  value = 0;
}

class MockAudioListener {
  readonly positionX = new MockAudioParam();
  readonly positionY = new MockAudioParam();
  readonly positionZ = new MockAudioParam();
}

export class MockGainNode extends MockAudioNode {
  readonly gain = {
    value: 1,
    setValueAtTime(value: number) {
      this.value = value;
    },
    linearRampToValueAtTime(value: number) {
      this.value = value;
    },
    setValueCurveAtTime() {
      // curve is applied by the real node; tests only need the call to succeed
    },
  };
}

export class MockPannerNode extends MockAudioNode {
  panningModel: PanningModelType = "HRTF";
  distanceModel: DistanceModelType = "inverse";
  refDistance = 1;
  readonly positionX = new MockAudioParam();
  readonly positionY = new MockAudioParam();
  readonly positionZ = new MockAudioParam();
}

export class MockDelayNode extends MockAudioNode {
  readonly maxDelayTime: number;
  readonly delayTime = { value: 0 };

  constructor(maxDelayTime = 1) {
    super();
    this.maxDelayTime = maxDelayTime;
  }
}

export class MockWaveShaperNode extends MockAudioNode {
  curve: Float32Array | null = null;
  oversample: OverSampleType = "none";
}

export class MockConvolverNode extends MockAudioNode {
  buffer: AudioBuffer | null = null;
  normalize = true;
}

export class MockOscillatorNode extends MockAudioNode {
  type: OscillatorType = "sine";
  readonly frequency = { value: 440 };
  startCalls = 0;
  stopCalls = 0;

  start() {
    this.startCalls += 1;
  }

  stop() {
    this.stopCalls += 1;
  }
}

function createMockAudioBuffer(
  numberOfChannels: number,
  length: number,
  sampleRate: number,
): AudioBuffer {
  const channels = Array.from({ length: numberOfChannels }, () => new Float32Array(length));
  return {
    numberOfChannels,
    length,
    sampleRate,
    duration: length / sampleRate,
    getChannelData(channel: number) {
      return channels[channel] ?? new Float32Array(length);
    },
  } as AudioBuffer;
}

export class MockAudioContext extends EventTarget {
  readonly destination = new MockAudioDestinationNode();
  readonly listener = new MockAudioListener() as unknown as AudioListener;
  readonly sources: MockMediaElementAudioSourceNode[] = [];
  readonly analysers: MockAnalyserNode[] = [];
  readonly biquadFilters: MockBiquadFilterNode[] = [];
  readonly panners: MockPannerNode[] = [];
  readonly delays: MockDelayNode[] = [];
  readonly waveShapers: MockWaveShaperNode[] = [];
  readonly convolvers: MockConvolverNode[] = [];
  readonly oscillators: MockOscillatorNode[] = [];
  readonly buffers: AudioBuffer[] = [];

  sampleRate = 44_100;
  currentTime = 0;
  state: MockAudioContextState = "running";
  closeCalls = 0;
  resumeCalls = 0;
  readonly gains: MockGainNode[] = [];

  createMediaElementSource(element: HTMLAudioElement) {
    const source = new MockMediaElementAudioSourceNode(element);
    this.sources.push(source);
    return source as unknown as MediaElementAudioSourceNode;
  }

  createAnalyser() {
    const analyser = new MockAnalyserNode();
    this.analysers.push(analyser);
    return analyser as unknown as AnalyserNode;
  }

  createBiquadFilter() {
    const filter = new MockBiquadFilterNode();
    this.biquadFilters.push(filter);
    return filter as unknown as BiquadFilterNode;
  }

  createPanner() {
    const panner = new MockPannerNode();
    this.panners.push(panner);
    return panner as unknown as PannerNode;
  }

  createGain() {
    const gain = new MockGainNode();
    this.gains.push(gain);
    return gain as unknown as GainNode;
  }

  createDelay(maxDelayTime = 1) {
    const delay = new MockDelayNode(maxDelayTime);
    this.delays.push(delay);
    return delay as unknown as DelayNode;
  }

  createWaveShaper() {
    const shaper = new MockWaveShaperNode();
    this.waveShapers.push(shaper);
    return shaper as unknown as WaveShaperNode;
  }

  createConvolver() {
    const convolver = new MockConvolverNode();
    this.convolvers.push(convolver);
    return convolver as unknown as ConvolverNode;
  }

  createOscillator() {
    const oscillator = new MockOscillatorNode();
    this.oscillators.push(oscillator);
    return oscillator as unknown as OscillatorNode;
  }

  createBuffer(numberOfChannels: number, length: number, sampleRate: number) {
    const buffer = createMockAudioBuffer(numberOfChannels, length, sampleRate);
    this.buffers.push(buffer);
    return buffer;
  }

  async resume() {
    this.resumeCalls += 1;
    if (this.state === "suspended") {
      this.setStateForTest("running");
    }
  }

  async close() {
    this.closeCalls += 1;
    this.setStateForTest("closed");
  }

  setStateForTest(nextState: MockAudioContextState) {
    if (this.state === nextState) return;
    this.state = nextState;
    this.dispatchEvent(new Event("statechange"));
  }
}

export type MockWebAudioInstall = {
  contexts: MockAudioContext[];
  flushAnimationFrame: (time?: number) => void;
  flushAnimationFrames: (count: number) => void;
  pendingAnimationFrameCount: () => number;
  restore: () => void;
};

export function installMockWebAudio(): MockWebAudioInstall {
  const previousAudioContext = window.AudioContext;
  const previousWebkitAudioContext = (
    window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }
  ).webkitAudioContext;
  const previousRequestAnimationFrame = globalThis.requestAnimationFrame;
  const previousCancelAnimationFrame = globalThis.cancelAnimationFrame;

  const contexts: MockAudioContext[] = [];

  class InstalledMockAudioContext extends MockAudioContext {
    constructor() {
      super();
      contexts.push(this);
    }
  }

  let nextFrameId = 1;
  let now = 0;
  const pendingFrames = new Map<number, FrameRequestCallback>();

  Object.defineProperty(window, "AudioContext", {
    configurable: true,
    writable: true,
    value: InstalledMockAudioContext as unknown as typeof AudioContext,
  });
  Object.defineProperty(window, "webkitAudioContext", {
    configurable: true,
    writable: true,
    value: InstalledMockAudioContext as unknown as typeof AudioContext,
  });

  globalThis.requestAnimationFrame = ((callback: FrameRequestCallback) => {
    const id = nextFrameId;
    nextFrameId += 1;
    pendingFrames.set(id, callback);
    return id;
  }) as typeof requestAnimationFrame;

  globalThis.cancelAnimationFrame = ((id: number) => {
    pendingFrames.delete(id);
  }) as typeof cancelAnimationFrame;

  return {
    contexts,
    flushAnimationFrame: (time = now + 16) => {
      now = time;
      const callbacks = Array.from(pendingFrames.entries());
      pendingFrames.clear();
      for (const [, callback] of callbacks) {
        callback(now);
      }
    },
    flushAnimationFrames: (count: number) => {
      for (let i = 0; i < count; i += 1) {
        now += 16;
        const callbacks = Array.from(pendingFrames.entries());
        pendingFrames.clear();
        for (const [, callback] of callbacks) {
          callback(now);
        }
      }
    },
    pendingAnimationFrameCount: () => pendingFrames.size,
    restore: () => {
      Object.defineProperty(window, "AudioContext", {
        configurable: true,
        writable: true,
        value: previousAudioContext,
      });
      Object.defineProperty(window, "webkitAudioContext", {
        configurable: true,
        writable: true,
        value: previousWebkitAudioContext,
      });
      globalThis.requestAnimationFrame = previousRequestAnimationFrame;
      globalThis.cancelAnimationFrame = previousCancelAnimationFrame;
      pendingFrames.clear();
    },
  };
}
