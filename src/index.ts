// ============================================================
// Game Entry Point — Initialize PixiJS + Game
// ============================================================

import { Application } from 'pixi.js';
import { Game } from './game';

async function main(): Promise<void> {
  const app = new Application();

  await app.init({
    resizeTo: window,
    backgroundColor: 0x0a0a0a,
    antialias: true,
    resolution: Math.min(window.devicePixelRatio ?? 1, 2),
    autoDensity: true,
  });

  document.body.appendChild(app.canvas);

  const game = new Game(app);
  await game.init();
  game.start();
}

main().catch(console.error);
