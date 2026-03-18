// ============================================================
// Scene Manager — Controls screen transitions
// GDD Phase 8: TitleScreen → StakeSelection → DungeonMap →
//              Battle → Shop → ... → RunComplete/RunFailed
// ============================================================

import { Application, Container } from 'pixi.js';

export interface Scene {
  readonly name: string;
  /** Called when entering this scene. Set up containers, UI, etc. */
  init(app: Application, container: Container): void | Promise<void>;
  /** Called every frame (for animations, not gameplay logic) */
  update?(dt: number): void;
  /** Called when leaving this scene. Clean up. */
  destroy?(): void;
}

export class SceneManager {
  private readonly _scenes = new Map<string, Scene>();
  private _current: Scene | null = null;
  private readonly _container: Container;

  constructor(private readonly _app: Application) {
    this._container = new Container();
    this._app.stage.addChild(this._container);
  }

  /** Register a scene */
  register(scene: Scene): void {
    this._scenes.set(scene.name, scene);
  }

  /** Switch to a scene by name */
  async switchTo(sceneName: string): Promise<void> {
    const next = this._scenes.get(sceneName);
    if (!next) {
      throw new Error(`Scene not found: ${sceneName}`);
    }

    // Teardown current scene
    if (this._current) {
      this._current.destroy?.();
      this._container.removeChildren();
    }

    // Setup new scene
    this._current = next;
    await next.init(this._app, this._container);
  }

  /** Update the current scene */
  update(dt: number): void {
    this._current?.update?.(dt);
  }

  get currentSceneName(): string | null {
    return this._current?.name ?? null;
  }
}
