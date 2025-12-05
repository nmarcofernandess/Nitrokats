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

interface GameState {
    lasers: LaserData[];
    targets: TargetData[];
    particles: ParticleData[];
    addLaser: (position: Vector3, rotation: Euler) => void;
    removeLaser: (id: string) => void;
    addTarget: (position: Vector3) => void;
    removeTarget: (id: string) => void;
    addParticle: (position: Vector3, color: string, count?: number) => void;
    updateParticles: (delta: number) => void;
    shake: number;
    triggerShake: (intensity: number) => void;
}

export const useGameStore = create<GameState>((set) => ({
    lasers: [],
    targets: [],
    particles: [],
    shake: 0,
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
}));
