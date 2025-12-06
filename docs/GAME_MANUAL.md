# 🐱 CYBERCAT ARENA - OPERATOR MANUAL

> **SYSTEM VERSION:** 1.1.0 - "NEON PAUSE"
> **STATUS:** ONLINE
> **PILOT:** CAT-01

---

## 🕹️ CONTROLS (CONTROLES)

| Key | Action |
|-----|--------|
| `W` | Move Forward |
| `S` | Move Backward |
| `A` | Move Left |
| `D` | Move Right |
| `Mouse` | Aim Turret |
| `Left Click (Hold)` | Fire Laser |
| `ESC` | Pause/Resume Game |

---

## 🖥️ HUD & INTERFACE

The heads-up display provides real-time tactical information:

### Top Bar
- **INTEGRITY** (Left) - Cat hull health percentage (0-100%)
- **WAVE** (Center) - Current combat round number
- **HOSTILES NEUTRALIZED** - Total enemy kill count
- **SCORE** (Right) - Combat performance points

### Visual Effects
- **Vignette Border** - Cyber-optic overlay simulation
- **Neon Edges** - Cyan/Magenta outlines on all units
- **Bloom** - Glow effect on projectiles and UI

---

## ⏸️ PAUSE SYSTEM

Press `ESC` at any time during combat to access the Tactical Menu:

### Pause Menu Options
| Button | Function |
|--------|----------|
| **RESUME** | Return to combat |
| **RESTART** | Reset to Wave 1 (Score/Kills reset) |
| **QUIT TO MENU** | Return to main menu |

### Stats Display
The pause menu shows your current progress:
- Current Wave
- Total Kills
- Current Score

---

## 🎮 GAME FLOW

### Main Menu
1. Click **START MISSION** to begin
2. Instructions shown: WASD, Mouse, ESC

### Combat Loop
1. Enemies spawn around the arena perimeter
2. Destroy all enemies to advance wave
3. Collect power-ups from destroyed enemies
4. Survive as long as possible!

### Game Over
- Triggered when INTEGRITY reaches 0
- Shows final Wave, Kills, and Score
- Click **RETRY** to start again

---

## 🔫 COMBAT SYSTEM

### Weaponry
| Weapon | Fire Rate | Pattern |
|--------|-----------|---------|
| Standard Laser | 5/sec | Single shot |
| Spread Shot | 5/sec | 3-shot cone |
| Rapid Fire | 20/sec | Single shot |

### Damage
- **Player → Enemy:** Instant kill (100 damage)
- **Enemy → Player:** 10 base + 20% per wave

### Collision Detection
- Player lasers only damage enemies
- Enemy lasers only damage player
- Uses real-time position tracking for accurate hits

---

## 🤖 ENEMY INTEL

### "Red Legion" Tank
- **Visual:** Rust-red chassis, yellow cyber-eyes
- **Behavior:**
  - Chases player within 30m range
  - Stops at 5m distance
  - Fires when within 15m
  - Avoids overlapping with other enemies

### Damage Scaling
| Wave | Enemy Damage |
|------|--------------|
| 1 | 10 HP |
| 5 | 18 HP |
| 10 | 28 HP |

---

## 📦 POWER-UPS

**Drop Rate:** 30% on enemy kill

| Power-Up | Color | Effect | Duration |
|----------|-------|--------|----------|
| Spread Shot | Yellow | 3-laser cone | 10 sec |
| Rapid Fire | Cyan | 4x fire rate | 10 sec |

---

## 🔄 GAME SYSTEMS

### Wave System
- **Progression:** Infinite
- **Enemy Count:** `2 + Wave` per round
- **Spawn Delay:** 1 second between waves
- **Spawn Pattern:** Random 360° perimeter

### Health/Integrity System
- **Maximum:** 100 HP
- **Regeneration:** +2 HP per second (passive)
- **Game Over:** 0 HP = System Failure

---

## ⚙️ TECHNICAL

| Component | Technology |
|-----------|------------|
| Engine | React Three Fiber (Three.js) |
| State | Zustand |
| Audio | Web Audio API (Procedural) |
| Style | Low-Poly Cyberpunk, Bloom FX |
| UI | Tailwind CSS |

---

## 🗺️ ARENA

- Bordered combat zone with neon walls
- Grid floor for spatial orientation
- Obstacles (destructible targets)

---

*"In the neon-lit wasteland, only the fastest cat survives."*
