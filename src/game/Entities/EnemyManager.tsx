import { useEffect, useState, useRef } from 'react';
import { Vector3 as ThreeVector3 } from 'three';
import { useGameStore } from '../store';
import { EnemyTank } from './EnemyTank';
import { ZombieCat } from './ZombieCat';
import { GameBalance } from '../Utils/GameBalance';

export const EnemyManager = () => {
    const enemies = useGameStore((state) => state.enemies);
    const addEnemy = useGameStore((state) => state.addEnemy);
    const wave = useGameStore((state) => state.wave);
    const nextWave = useGameStore((state) => state.nextWave);
    const gameState = useGameStore((state) => state.gameState);
    const gameMode = useGameStore((state) => state.gameMode);

    const [isWaitingNextWave, setIsWaitingNextWave] = useState(false);
    const spawnedWave = useRef(0);

    // Reset spawn tracker on game restart (or when wave goes back to 1)
    useEffect(() => {
        if (wave === 1 && spawnedWave.current > 1) {
            spawnedWave.current = 0;
            setIsWaitingNextWave(false);
        }
    }, [wave]);

    // Wave Completion Logic
    useEffect(() => {
        if (gameState === 'playing' && enemies.length === 0 && spawnedWave.current === wave && !isWaitingNextWave) {
            setIsWaitingNextWave(true);
            const timeout = setTimeout(() => {
                nextWave();
                setIsWaitingNextWave(false);
            }, 1000); // 1-second delay between waves
            return () => clearTimeout(timeout);
        }
    }, [enemies.length, gameState, wave, isWaitingNextWave, nextWave]);

    // Spawn Logic
    useEffect(() => {
        if (gameState === 'playing' && spawnedWave.current < wave) {
            // Spawn for new wave
            const count = GameBalance.getKillsNeededForWave(wave);
            // console.log(`Spawning Wave ${wave}: ${count} enemies`);

            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const radius = 25 + Math.random() * 10;
                const x = Math.sin(angle) * radius;
                const z = Math.cos(angle) * radius;
                addEnemy(new ThreeVector3(x, 0, z));
            }
            spawnedWave.current = wave;
        }
    }, [wave, gameState, addEnemy]);

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
