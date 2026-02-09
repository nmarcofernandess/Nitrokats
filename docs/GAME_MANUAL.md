# CYBERCAT ARENA - GAME MANUAL

## Controls

| Key | Action |
|-----|--------|
| `W A S D` | Move |
| `Mouse` | Aim |
| `Hold Left Click` | Fire |
| `ESC` | Pause/Resume |

## Modes

- **Classic**: tank movement and turret aiming
- **Zombie**: body follows cursor, strafing movement

## Core Systems

### Waves

- Wave starts with on-screen announcement
- Enemy count target grows per wave (`wave * 10` kills to complete)
- Active enemy cap increases with wave

### Combat

- Player shots now apply **damage** to enemy HP (no instant kill)
- Enemy damage scales with wave
- Player passive regeneration while in active gameplay

### Power-up

- Spread-shot drop every 5 kills
- Spread mode has 20 ammo
- Ammo count is shown in HUD while active

## States

- `menu`
- `playing`
- `paused`
- `gameover`

All gameplay systems (AI, movement, shooting) are gated by game state.

## Technical Notes

- Rendering: React Three Fiber + Three.js
- AI steering: Yuka
- State: Zustand
- Audio: Web Audio API (procedural)
- Particles: instanced mesh rendering path
