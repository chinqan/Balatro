// ============================================================
// State Machine — Generic finite state machine
// Used for: Battle flow, Scene management, Boss AI phases
// ============================================================

export interface State<TContext> {
  readonly name: string;
  onEnter?(context: TContext): void;
  onUpdate?(context: TContext, dt: number): void;
  onExit?(context: TContext): void;
}

export class StateMachine<TContext> {
  private _current: State<TContext> | null = null;
  private readonly _states = new Map<string, State<TContext>>();

  constructor(private readonly _context: TContext) {}

  /** Register a state */
  addState(state: State<TContext>): this {
    this._states.set(state.name, state);
    return this;
  }

  /** Transition to a named state */
  transitionTo(stateName: string): void {
    const next = this._states.get(stateName);
    if (!next) {
      throw new Error(`State not found: ${stateName}`);
    }

    if (this._current) {
      this._current.onExit?.(this._context);
    }

    this._current = next;
    this._current.onEnter?.(this._context);
  }

  /** Update the current state */
  update(dt: number): void {
    this._current?.onUpdate?.(this._context, dt);
  }

  /** Get the current state name */
  get currentStateName(): string | null {
    return this._current?.name ?? null;
  }

  /** Check if currently in a specific state */
  isIn(stateName: string): boolean {
    return this._current?.name === stateName;
  }
}
