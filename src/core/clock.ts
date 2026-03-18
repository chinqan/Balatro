// ============================================================
// Game Clock — Independent of framerate and wall clock
// Supports pause, slow-mo, and frame stepping
// ============================================================

export interface Clock {
  /** Total game time in seconds (scaled by timeScale) */
  elapsed: number;
  /** Fixed tick duration: 1/60 second */
  delta: number;
  /** Time scale: 1.0 = normal, 0 = paused, 0.2 = slow-mo */
  scale: number;
  /** Real-world delta time (unscaled, for UI animations) */
  wallDelta: number;
  /** Real-world total elapsed time */
  wallElapsed: number;
}

export interface ClockController extends Clock {
  pause(): void;
  resume(): void;
  setScale(scale: number): void;
  /** Advance one fixed tick (for frame-stepping / debugging) */
  step(): void;
  /** Update wall-clock time; called once per frame by the game loop */
  tick(wallDeltaSeconds: number): void;
  /** Whether the clock is currently paused */
  readonly paused: boolean;
}

export const TICK_RATE = 60;
export const TICK_DURATION = 1 / TICK_RATE;
/** Max accumulated time per frame to prevent spiral of death */
const MAX_ACCUMULATION = TICK_DURATION * 5;

export function createClock(): ClockController {
  let _paused = false;
  let _scale = 1.0;
  let _elapsed = 0;
  let _wallElapsed = 0;
  let _wallDelta = 0;

  const clock: ClockController = {
    get elapsed() { return _elapsed; },
    set elapsed(v) { _elapsed = v; },
    delta: TICK_DURATION,
    get scale() { return _scale; },
    set scale(v) { _scale = Math.max(0, v); },
    get wallDelta() { return _wallDelta; },
    set wallDelta(v) { _wallDelta = v; },
    get wallElapsed() { return _wallElapsed; },
    set wallElapsed(v) { _wallElapsed = v; },
    get paused() { return _paused; },

    pause() {
      _paused = true;
    },

    resume() {
      _paused = false;
    },

    setScale(scale: number) {
      _scale = Math.max(0, scale);
    },

    step() {
      _elapsed += TICK_DURATION;
    },

    tick(wallDeltaSeconds: number) {
      _wallDelta = wallDeltaSeconds;
      _wallElapsed += wallDeltaSeconds;
    },
  };

  return clock;
}

/**
 * Runs fixed-timestep updates. Returns the interpolation alpha for rendering.
 * @param accumulator - Current accumulated time (mutated by reference via return)
 * @param clock - The game clock
 * @param wallDelta - Real-world delta from the frame
 * @param fixedUpdate - Callback invoked per fixed tick
 * @returns [newAccumulator, renderAlpha]
 */
export function runFixedTimestep(
  accumulator: number,
  clock: ClockController,
  wallDelta: number,
  fixedUpdate: () => void,
): [number, number] {
  clock.tick(wallDelta);

  if (clock.paused) {
    return [0, 0];
  }

  accumulator += wallDelta * clock.scale;
  accumulator = Math.min(accumulator, MAX_ACCUMULATION);

  while (accumulator >= TICK_DURATION) {
    clock.delta = TICK_DURATION;
    clock.elapsed += TICK_DURATION;
    fixedUpdate();
    accumulator -= TICK_DURATION;
  }

  const alpha = accumulator / TICK_DURATION;
  return [accumulator, alpha];
}
