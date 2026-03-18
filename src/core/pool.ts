// ============================================================
// Object Pool — Generic pool to prevent GC during gameplay
// ============================================================

export interface Pool<T> {
  acquire(): T;
  release(item: T): void;
  prewarm(count: number): void;
  readonly activeCount: number;
  readonly pooledCount: number;
}

export class ObjectPool<T> implements Pool<T> {
  private readonly _pool: T[] = [];
  private _activeCount = 0;

  constructor(
    private readonly _factory: () => T,
    private readonly _reset: (item: T) => void,
    private readonly _dispose?: (item: T) => void,
  ) {}

  acquire(): T {
    this._activeCount++;
    if (this._pool.length > 0) {
      return this._pool.pop()!;
    }
    return this._factory();
  }

  release(item: T): void {
    this._activeCount = Math.max(0, this._activeCount - 1);
    this._reset(item);
    this._pool.push(item);
  }

  prewarm(count: number): void {
    for (let i = 0; i < count; i++) {
      const item = this._factory();
      this._reset(item);
      this._pool.push(item);
    }
  }

  get activeCount(): number {
    return this._activeCount;
  }

  get pooledCount(): number {
    return this._pool.length;
  }

  /** Dispose all pooled items (only on full shutdown) */
  disposeAll(): void {
    if (this._dispose) {
      for (const item of this._pool) {
        this._dispose(item);
      }
    }
    this._pool.length = 0;
    this._activeCount = 0;
  }
}
