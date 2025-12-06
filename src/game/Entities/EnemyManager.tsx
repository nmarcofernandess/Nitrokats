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

    const spawnedWave = useRef(0);
    const showWaveAnnouncement = useGameStore((state) => state.showWaveAnnouncement);
    const setShowWaveAnnouncement = useGameStore((state) => state.setShowWaveAnnouncement);

    // Reset spawn tracker on unexpected wave mismatch (safety fallback)
    useEffect(() => {
        if (wave === 1 && spawnedWave.current > 1) {
            spawnedWave.current = 0;
        }
    }, [wave]);

    // 1. Handle Announcement Timer
    useEffect(() => {
        if (showWaveAnnouncement) {
            const timer = setTimeout(() => {
                setShowWaveAnnouncement(false);
            }, 3000); // Show "WAVE X" for 3 seconds
            return () => clearTimeout(timer);
        }
    }, [showWaveAnnouncement, setShowWaveAnnouncement]);

    // 2. Wave Completion Logic (Triggers Next Wave & Announcement)
    useEffect(() => {
        // Check if all enemies for the current wave are defeated and no announcement is active
        if (gameState === 'playing' && enemies.length === 0 && spawnedWave.current === wave && !showWaveAnnouncement) {
            nextWave(); // Increment wave number
            setShowWaveAnnouncement(true); // Trigger wave announcement
        }
    }, [enemies.length, gameState, wave, nextWave, setShowWaveAnnouncement, showWaveAnnouncement]);

    // 3. Spawn Logic (Only when NOT announcing)
    useEffect(() => {
        // Spawn enemies if game is playing, no announcement is active, and current wave needs spawning
        if (gameState === 'playing' && !showWaveAnnouncement && spawnedWave.current < wave) {
            const count = GameBalance.getKillsNeededForWave(wave);

            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const radius = 25 + Math.random() * 10;
                const x = Math.sin(angle) * radius;
                const z = Math.cos(angle) * radius;
                addEnemy(new ThreeVector3(x, 0, z));
            }
            spawnedWave.current = wave; // Mark current wave as spawned
        }
    }, [wave, gameState, addEnemy, showWaveAnnouncement]);

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
