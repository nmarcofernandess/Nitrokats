import { useEffect } from 'react';
import { Vector3 as ThreeVector3 } from 'three';
import { useGameStore } from '../store';
import { EnemyTank } from './EnemyTank';
import { ZombieCat } from './ZombieCat';

export const EnemyManager = () => {
    const enemies = useGameStore((state) => state.enemies);
    const addEnemy = useGameStore((state) => state.addEnemy);
    const wave = useGameStore((state) => state.wave);
    const nextWave = useGameStore((state) => state.nextWave);
    const gameState = useGameStore((state) => state.gameState);
    const gameMode = useGameStore((state) => state.gameMode);

    // Wave Logic
    useEffect(() => {
        if (gameState === 'playing' && enemies.length === 0) {
            const timeout = setTimeout(() => {
                nextWave();
            }, 1000);
            return () => clearTimeout(timeout);
        }
    }, [enemies.length, gameState, nextWave]);

    // Spawn Logic
    useEffect(() => {
        if (gameState === 'playing' && enemies.length === 0) {
            const count = 2 + wave;
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const radius = 25 + Math.random() * 10; // Slightly further out
                const x = Math.sin(angle) * radius;
                const z = Math.cos(angle) * radius;
                addEnemy(new ThreeVector3(x, 0, z));
            }
        }
    }, [wave, gameState, addEnemy, enemies.length]);

    return (
        <>
            {enemies.map(enemy => (
                gameMode === 'classic'
                    ? <EnemyTank key={enemy.id} data={enemy} />
                    : <ZombieCat key={enemy.id} data={enemy} />
            ))}
        </>
    );
};
