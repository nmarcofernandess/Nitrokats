import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Euler, Group, Vector3 } from 'three';
import { useGameStore } from '../store';
import { audioManager } from '../Utils/AudioManager';
import { checkCircleCollision } from '../Utils/CollisionUtils';
import { gameRegistry } from '../Utils/ObjectRegistry';
import { GameBalance } from '../Utils/GameBalance';

const LASER_SPEED = 20;
const MAX_DISTANCE = 100;

interface LaserProps {
  id: string;
  position: Vector3;
  rotation: Euler;
  source: 'player' | 'enemy';
}

const Laser = ({ id, position, rotation, source }: LaserProps) => {
  const ref = useRef<Group>(null);
  const startPos = useRef(position.clone());

  useFrame((_, delta) => {
    if (!ref.current) {
      return;
    }

    const game = useGameStore.getState();
    if (game.gameState !== 'playing' || game.isPaused) {
      return;
    }

    ref.current.translateZ(LASER_SPEED * delta);

    if (ref.current.position.distanceTo(startPos.current) > MAX_DISTANCE) {
      game.removeLaser(id);
      return;
    }

    for (const target of game.targets) {
      if (!checkCircleCollision(ref.current.position, 0.5, target.position, 1.0)) {
        continue;
      }

      game.removeTarget(target.id);
      game.removeLaser(id);
      game.addParticle(target.position, '#ff0000', 10);
      return;
    }

    if (source === 'player') {
      const enemies = gameRegistry.getEnemies();
      for (const enemy of enemies) {
        if (ref.current.position.distanceTo(enemy.ref.position) >= 1.5) {
          continue;
        }

        game.removeLaser(id);

        const enemyKilled = game.damageEnemy(
          enemy.id,
          GameBalance.getPlayerDamageForWave(game.wave),
        );

        if (enemyKilled) {
          game.addScore(100);
          game.incrementKills();
          game.addParticle(enemy.ref.position.clone(), '#ff00ff', 15);
          game.spawnPowerUp(enemy.ref.position.clone());
          audioManager.playExplosion();
        } else {
          game.addParticle(enemy.ref.position.clone(), '#ff00ff', 4);
        }

        return;
      }
    }

    if (source === 'enemy') {
      const playerPos = gameRegistry.getPlayerPosition();
      if (playerPos && checkCircleCollision(ref.current.position, 0.5, playerPos, 1.5)) {
        game.takeDamage(GameBalance.getDamageForWave(game.wave));
        game.removeLaser(id);
        game.addParticle(ref.current.position.clone(), '#00ffff', 5);
        audioManager.playHit();
      }
    }
  });

  return (
    <group ref={ref} position={position} rotation={rotation}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 1]} />
        <meshStandardMaterial color="#ff00ff" emissive="#ff00ff" emissiveIntensity={5} toneMapped={false} />
      </mesh>
    </group>
  );
};

export const LaserManager = () => {
  const lasers = useGameStore((state) => state.lasers);

  return (
    <>
      {lasers.map((laser) => (
        <Laser key={laser.id} {...laser} />
      ))}
    </>
  );
};
