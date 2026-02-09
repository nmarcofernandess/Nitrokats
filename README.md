# Nitrokats

Arcade arena shooter built with React Three Fiber.

## Stack

- React 19 + TypeScript + Vite 7
- Three.js + @react-three/fiber + @react-three/drei
- Zustand for game state
- Yuka for lightweight steering AI
- Tailwind CSS for UI/HUD

## Run

```bash
npm install
npm run dev
```

## Quality Checks

```bash
npm run lint
npm run build
```

## Gameplay Overview

- Modes: `classic` and `zombie`
- Wave progression with scalable enemy damage/health
- Enemy HP system (player shots apply damage instead of instant kill)
- Spread-shot power-up with limited ammo
- Procedural audio (shoot/hit/explosion/music)

## Architecture Notes

- `src/game/store.ts`: authoritative gameplay state
- `src/game/Utils/ObjectRegistry.ts`: high-frequency object registry for collision checks without React re-render churn
- `src/game/World/VFXManager.tsx`: instanced particle rendering path
- `src/game/Projectiles/LaserManager.tsx`: projectile simulation and hit resolution

## Build Output

The project is split into manual chunks (`react`, `three`, `postfx`, `ai`) and lazy-loads the scene module from `App`.
