import { create } from 'zustand';
import { Vector3, Euler } from 'three';
import { v4 as uuidv4 } from 'uuid';

interface LaserData {
    id: string;
    position: Vector3;
    rotation: Euler;
    source: 'player' | 'enemy';
}

interface TargetData {
    id: string;
    position: Vector3;
}

interface ParticleData {
    id: string;
    position: Vector3;
    color: string;
    velocity: Vector3;
    life: number;
}

interface EnemyData {
    id: string;
    position: Vector3;
    rotation: number; // Y rotation
    health: number;
}

interface PowerUpData {
    id: string;
    position: Vector3;
    type: 'spread' | 'rapid';
}

interface GameState {
    lasers: LaserData[];
    targets: TargetData[];
    enemies: EnemyData[];
    powerUps: PowerUpData[];
    particles: ParticleData[];
    addLaser: (position: Vector3, rotation: Euler, source: 'player' | 'enemy') => void;
    removeLaser: (id: string) => void;
    addTarget: (position: Vector3) => void;
    removeTarget: (id: string) => void;
    addParticle: (position: Vector3, color: string, count?: number) => void;
    updateParticles: (delta: number) => void;
    shake: number;
    triggerShake: (intensity: number) => void;
    playerPosition: Vector3;
    setPlayerPosition: (pos: Vector3) => void;
    score: number;
    kills: number;
    wave: number;
    health: number;
    gameOver: boolean;
    addScore: (points: number) => void;
    incrementKills: () => void;
    nextWave: () => void;
    takeDamage: (amount: number) => void;
    heal: (amount: number) => void;

    // Game Flow
    gameState: 'menu' | 'playing' | 'paused' | 'gameover';
    isPaused: boolean;
    startGame: () => void;
    restartGame: () => void;
    togglePause: () => void;
    goToMenu: () => void;

    addEnemy: (position: Vector3) => void;
    removeEnemy: (id: string) => void;
    updateEnemy: (id: string, position: Vector3, rotation: number) => void;

    // Weapon State
    weaponType: 'normal' | 'spread' | 'rapid';
    weaponTimer: number;
    spawnPowerUp: (position: Vector3) => void;
    collectPowerUp: (id: string, type: 'spread' | 'rapid') => void;
}

export const useGameStore = create<GameState>((set) => ({
    lasers: [],
    targets: [],
    enemies: [],
    powerUps: [],
    particles: [],
    shake: 0,
    playerPosition: new Vector3(0, 0, 0),
    score: 0,
    kills: 0,
    wave: 1,
    health: 100,
    gameOver: false,
    gameState: 'menu',
    isPaused: false,
    weaponType: 'normal',
    weaponTimer: 0,
    addLaser: (position, rotation, source) =>
        set((state) => ({
            lasers: [...state.lasers, { id: uuidv4(), position, rotation, source }],
        })),
    removeLaser: (id) =>
        set((state) => ({
            lasers: state.lasers.filter((laser) => laser.id !== id),
        })),
    addTarget: (position) =>
        set((state) => ({
            targets: [...state.targets, { id: uuidv4(), position }],
        })),
    removeTarget: (id) =>
        set((state) => ({
            targets: state.targets.filter((target) => target.id !== id),
        })),
    addParticle: (position, color, count = 5) =>
        set((state) => {
            const newParticles: ParticleData[] = [];
            for (let i = 0; i < count; i++) {
                newParticles.push({
                    id: uuidv4(),
                    position: position.clone(),
                    color,
                    velocity: new Vector3((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10),
                    life: 1.0,
                });
            }
            return { particles: [...state.particles, ...newParticles] };
        }),
    updateParticles: (delta) =>
        set((state) => ({
            particles: state.particles
                .map((p) => ({
                    ...p,
                    position: p.position.clone().add(p.velocity.clone().multiplyScalar(delta)),
                    life: p.life - delta * 2,
                }))
                .filter((p) => p.life > 0),
        })),
    triggerShake: (intensity) => set({ shake: intensity }),
    setPlayerPosition: (pos) => set({ playerPosition: pos }),
    addScore: (points) => set((state) => ({ score: state.score + points })),
    incrementKills: () => set((state) => ({ kills: state.kills + 1 })),
    nextWave: () => set((state) => ({ wave: state.wave + 1 })),
    takeDamage: (amount) => set((state) => {
        const newHealth = Math.max(0, state.health - amount);
        return {
            health: newHealth,
            gameOver: newHealth <= 0
        };
    }),
    heal: (amount) => set((state) => ({ health: Math.min(100, state.health + amount) })),
    startGame: () => set({ gameState: 'playing', isPaused: false, score: 0, kills: 0, wave: 1, health: 100, gameOver: false, enemies: [], lasers: [] }),
    restartGame: () => set({
        score: 0,
        kills: 0,
        wave: 1,
        health: 100,
        gameOver: false,
        gameState: 'playing',
        isPaused: false,
        lasers: [],
        particles: [],
        enemies: []
    }),
    togglePause: () => set((state) => ({
        isPaused: !state.isPaused,
        gameState: state.isPaused ? 'playing' : 'paused'
    })),
    goToMenu: () => set({
        gameState: 'menu',
        isPaused: false,
        score: 0,
        kills: 0,
        wave: 1,
        health: 100,
        gameOver: false,
        lasers: [],
        particles: [],
        enemies: []
    }),
    addEnemy: (position) => set((state) => ({
        enemies: [...state.enemies, { id: uuidv4(), position, rotation: 0, health: 30 }]
    })),
    removeEnemy: (id) => set((state) => ({
        enemies: state.enemies.filter(e => e.id !== id)
    })),
    updateEnemy: (id, position, rotation) => set((state) => ({
        enemies: state.enemies.map(e => e.id === id ? { ...e, position, rotation } : e)
    })),
    spawnPowerUp: (position) => set((state) => {
        // 30% chance to spawn drop
        if (Math.random() > 0.3) return {};

        const type = Math.random() > 0.5 ? 'spread' : 'rapid';
        return {
            powerUps: [...state.powerUps, { id: uuidv4(), position, type }]
        };
    }),
    collectPowerUp: (id, type) => set((state) => ({
        powerUps: state.powerUps.filter(p => p.id !== id),
        weaponType: type,
        weaponTimer: 10 // 10 seconds of powerup
    })),
}));
