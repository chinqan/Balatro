// ============================================================
// Viewport — Full-screen adaptive scaling
// Maintains a virtual coordinate system (DESIGN_W × DESIGN_H)
// ============================================================

import { Application, Container } from 'pixi.js';

export const DESIGN_W = 1280;
export const DESIGN_H = 720;

export class Viewport {
  private readonly _root: Container;
  private _scale = 1;
  private _offsetX = 0;
  private _offsetY = 0;
  private readonly _resizeHandler: () => void;

  /**
   * @param parent - The container to add the viewport root to.
   *                 If not specified, defaults to app.stage (legacy behavior).
   */
  constructor(
    private readonly _app: Application,
    parent?: Container,
  ) {
    this._root = new Container();
    (parent ?? this._app.stage).addChild(this._root);
    this._resizeHandler = () => this._resize();
    this._resize();

    window.addEventListener('resize', this._resizeHandler);
  }

  private _resize(): void {
    const w = this._app.screen.width;
    const h = this._app.screen.height;

    this._scale = Math.min(w / DESIGN_W, h / DESIGN_H);
    this._offsetX = (w - DESIGN_W * this._scale) / 2;
    this._offsetY = (h - DESIGN_H * this._scale) / 2;

    this._root.scale.set(this._scale);
    this._root.position.set(this._offsetX, this._offsetY);
  }

  /** Clean up - remove root from parent and resize listener */
  destroy(): void {
    window.removeEventListener('resize', this._resizeHandler);
    this._root.parent?.removeChild(this._root);
    this._root.removeChildren();
  }

  get root(): Container { return this._root; }
  get scale(): number { return this._scale; }

  screenToDesign(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: (screenX - this._offsetX) / this._scale,
      y: (screenY - this._offsetY) / this._scale,
    };
  }
}
