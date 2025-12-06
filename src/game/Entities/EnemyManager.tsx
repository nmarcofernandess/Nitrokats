import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 as ThreeVector3 } from 'three';
import { useGameStore } from '../store';
import { EnemyTank } from './EnemyTank';
import { ZombieRat } from './ZombieRat';
import { GameBalance } from '../Utils/GameBalance';

export const EnemyManager = () => {
    const enemies = useGameStore((state) => state.enemies);
    const addEnemy = useGameStore((state) => state.addEnemy);
    const wave = useGameStore((state) => state.wave);
    const nextWave = useGameStore((state) => state.nextWave);
    const gameState = useGameStore((state) => state.gameState);
    const gameMode = useGameStore((state) => state.gameMode);

    const enemiesSpawnedCount = useRef(0);
    const currentWaveIndex = useRef(0);
    const lastSpawnTime = useRef(0);

    const showWaveAnnouncement = useGameStore((state) => state.showWaveAnnouncement);
    const setShowWaveAnnouncement = useGameStore((state) => state.setShowWaveAnnouncement);

    // 1. Handle Announcement Timer (Visual only)
    useEffect(() => {
        if (showWaveAnnouncement) {
            const timer = setTimeout(() => {
                setShowWaveAnnouncement(false);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [showWaveAnnouncement, setShowWaveAnnouncement]);

    // 2. Wave Completion Logic (Triggers Next Wave & Announcement)
    useEffect(() => {
        const totalNeeded = GameBalance.getKillsNeededForWave(wave);

        // Win Condition: No active enemies AND we have spawned all required enemies for this wave
        // Note: currentWaveIndex.current should match wave to ensure we are tracking the current wave's progress
        if (gameState === 'playing' &&
            enemies.length === 0 &&
            currentWaveIndex.current === wave &&
            enemiesSpawnedCount.current >= totalNeeded &&
            !showWaveAnnouncement) {

            nextWave(); // Increment wave number
            setShowWaveAnnouncement(true); // Trigger wave announcement
        }
    }, [enemies.length, gameState, wave, nextWave, setShowWaveAnnouncement, showWaveAnnouncement]);

    // 3. Spawning Loop (Trickle Spawn)
    useFrame((state) => {
        if (gameState !== 'playing' || showWaveAnnouncement) return;

        // Reset for new wave
        if (currentWaveIndex.current !== wave) {
            currentWaveIndex.current = wave;
            enemiesSpawnedCount.current = 0;
            lastSpawnTime.current = 0;
        }

        const totalToSpawn = GameBalance.getKillsNeededForWave(wave);
        // Max Active Logic: 5 for wave 1, 10 for wave 2, cap at 15 for chaos
        const maxActive = wave === 1 ? 5 : (wave === 2 ? 10 : 15);

        // Spawn Condition
        if (enemies.length < maxActive && enemiesSpawnedCount.current < totalToSpawn) {
            // Rate limit: spawn every 1.5 seconds to stagger arrival slightly? 
            // Or if we are below cap, spawn faster to keep pressure? 
            // User said "repondo" (replenishing).
            // Let's do 1 second delay between spawns so they don't instant-pop.
            if (state.clock.elapsedTime - lastSpawnTime.current > 1.0) {
                spawnEnemy();
                lastSpawnTime.current = state.clock.elapsedTime;
            }
        }
    });

    const spawnEnemy = () => {
        // 4 Corners Spawn Logic
        // Arena +/- 28 safe area (approx). 
        const corners = [
            new ThreeVector3(-28, 0, -28),
            new ThreeVector3(28, 0, -28),
            new ThreeVector3(-28, 0, 28),
            new ThreeVector3(28, 0, 28)
        ];

        // Pick random corner
        const spawnPos = corners[Math.floor(Math.random() * corners.length)].clone();

        // Add small offset variance so they don't stack perfectly
        spawnPos.x += (Math.random() - 0.5) * 4;
        spawnPos.z += (Math.random() - 0.5) * 4;

        addEnemy(spawnPos);
        enemiesSpawnedCount.current++;
    };

    return (
        <>
            {enemies.map(enemy => (
                gameMode === 'classic'
                    ? <EnemyTank key={enemy.id} data={enemy} />
                    : <ZombieRat key={enemy.id} data={enemy} />
            ))}
        </>
    );
};
