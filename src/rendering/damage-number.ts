// ============================================================
// Damage Number — Floating damage popup with object pooling
// GDD Phase 4 §3.2: 數字噴射 juice
// ============================================================

import { Container, Text, TextStyle } from 'pixi.js';
import { COLORS } from '@/rendering/design-tokens';
import { ObjectPool } from '@/core/pool';

interface DamagePopup {
  text: Text;
  age: number;
  vy: number;
}

const POPUP_LIFETIME = 1.2;

export class DamageNumberSystem {
  private readonly _container: Container;
  private readonly _pool: ObjectPool<DamagePopup>;
  private readonly _active: DamagePopup[] = [];

  constructor(parent: Container) {
    this._container = new Container();
    parent.addChild(this._container);

    this._pool = new ObjectPool(
      () => ({
        text: new Text({
          text: '0',
          style: new TextStyle({ fontSize: 24, fontWeight: 'bold', fill: 0xFFFFFF }),
        }),
        age: 0,
        vy: -2,
      }),
      (popup) => {
        popup.age = 0;
        popup.vy = -2;
        popup.text.alpha = 1;
        popup.text.scale.set(1);
      },
    );
    this._pool.prewarm(10);
  }

  /**
   * Spawn a damage number popup at the given position.
   */
  spawn(x: number, y: number, value: number | string, color: number = COLORS.ATK): void {
    const popup = this._pool.acquire();
    popup.text.text = typeof value === 'number' ? value.toString() : value;
    (popup.text.style as TextStyle).fill = color;
    popup.text.position.set(x + (Math.random() - 0.5) * 30, y);
    popup.text.anchor.set(0.5);
    popup.text.alpha = 1;
    popup.text.scale.set(0.5);
    popup.vy = -1.5 - Math.random() * 1;

    this._container.addChild(popup.text);
    this._active.push(popup);
  }

  /**
   * Update all active popups (call every frame).
   */
  update(dt: number): void {
    for (let i = this._active.length - 1; i >= 0; i--) {
      const popup = this._active[i];
      popup.age += dt;

      // Rise up
      popup.text.y += popup.vy;

      // Scale in then hold
      const t = popup.age / POPUP_LIFETIME;
      if (t < 0.15) {
        popup.text.scale.set(0.5 + t * 3.3); // Scale in
      } else {
        popup.text.scale.set(1.0);
      }

      // Fade out in last 30%
      if (t > 0.7) {
        popup.text.alpha = 1 - (t - 0.7) / 0.3;
      }

      // Remove dead popups
      if (popup.age >= POPUP_LIFETIME) {
        this._container.removeChild(popup.text);
        this._active.splice(i, 1);
        this._pool.release(popup);
      }
    }
  }
}
