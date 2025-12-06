import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Group } from 'three';
import { Edges } from '@react-three/drei';
import { useGameStore } from '../store';
import { gameRegistry } from '../Utils/ObjectRegistry';

export const PowerUp = ({ id, position, type }: { id: string; position: Vector3; type: 'spread' | 'health' }) => {
    const ref = useRef<Group>(null);
    // const playerPosition = useGameStore((state) => state.playerPosition); // Deprecated in favor of Registry
    const collectPowerUp = useGameStore((state) => state.collectPowerUp);

    useFrame((state, delta) => {
        if (!ref.current) return;

        // Float and Rotate
        ref.current.rotation.y += delta;
        ref.current.position.y = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.2;

        // Check Collection via Registry
        const playerPos = gameRegistry.getPlayerPosition();
        if (playerPos && ref.current.position.distanceTo(playerPos) < 2) {
            collectPowerUp(id, type);
            // Play Sound immediately
            import('../Utils/AudioManager').then(({ audioManager }) => {
                if (type === 'health') {
                    audioManager.playTone(300, 'sine', 0.1);
                    audioManager.playTone(400, 'sine', 0.1, 0.1);
                    audioManager.playTone(500, 'sine', 0.2, 0.2); // Rising happy tone
                } else {
                    audioManager.playPowerUp();
                }
            });
        }
    });

    const color = type === 'spread' ? '#ffff00' : '#00ff00'; // Yellow for Spread, Green for Health

    return (
        <group ref={ref} position={position}>
            <mesh castShadow>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color={color} transparent opacity={0.8} />
                <Edges color="#ffffff" />
            </mesh>
            {/* Letter Symbol */}
            {/* We could use Text but keeping it simple for now, color distinguishes it. 
                Yellow Box = Shotgun (S)
                Cyan Box = Machinegun (R)
            */}
            <pointLight distance={3} intensity={2} color={color} />
        </group>
    );
};
