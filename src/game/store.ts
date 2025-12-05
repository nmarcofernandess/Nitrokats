import { create } from 'zustand';
import { Vector3, Euler } from 'three';
import { v4 as uuidv4 } from 'uuid';

interface LaserData {
    id: string;
    position: Vector3;
    rotation: Euler;
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

interface GameState {
    lasers: LaserData[];
    targets: TargetData[];
    enemies: EnemyData[];
    particles: ParticleData[];
    addLaser: (position: Vector3, rotation: Euler) => void;
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
    health: number;
    gameOver: boolean;
    addScore: (points: number) => void;
    takeDamage: (amount: number) => void;
    heal: (amount: number) => void;
    restartGame: () => void;
    addEnemy: (position: Vector3) => void;
    removeEnemy: (id: string) => void;
    updateEnemy: (id: string, position: Vector3, rotation: number) => void;
}

export const useGameStore = create<GameState>((set) => ({
    lasers: [],
    targets: [],
    enemies: [],
    particles: [],
    shake: 0,
    playerPosition: new Vector3(0, 0, 0),
    score: 0,
    health: 100,
    gameOver: false,
    addLaser: (position, rotation) =>
        set((state) => ({
            lasers: [...state.lasers, { id: uuidv4(), position, rotation }],
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
    takeDamage: (amount) => set((state) => {
        const newHealth = Math.max(0, state.health - amount);
        return {
            health: newHealth,
            gameOver: newHealth <= 0
        };
    }),
    heal: (amount) => set((state) => ({ health: Math.min(100, state.health + amount) })),
    restartGame: () => set({
        score: 0,
        health: 100,
        gameOver: false,
        lasers: [],
        particles: [],
        enemies: [] // Clear enemies on restart
        // Note: Targets/Enemies need to be reset too, but they are components.
        // Ideally we'd have a 'gameKey' to remount the scene or reset their state.
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
}));
