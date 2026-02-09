import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';
import { useGameStore } from '../store';
import { audioManager } from '../Utils/AudioManager';
import { checkCircleCollision } from '../Utils/CollisionUtils';
import { gameRegistry } from '../Utils/ObjectRegistry';
import { RUN_PERK_CONFIG } from '../config/perks';
import { WEAPON_CONFIG } from '../config/weapons';
import type { EnemyData, LaserData } from '../types';

const PLAYER_HIT_RADIUS = 1.25;
const ENEMY_HIT_RADIUS = 1.4;

interface LaserProps {
  laser: LaserData;
}

const resolveKillReward = (enemy: EnemyData | undefined) => {
  if (!enemy) {
    return 100;
  }

  if (enemy.archetype === 'miniboss_mechacat') {
    return 1200;
  }

  return enemy.isElite ? 350 : 120;
};

const Laser = ({ laser }: LaserProps) => {
  const ref = useRef<Group>(null);
  const lifeRef = useRef(laser.life);

  useFrame((_, delta) => {
    if (!ref.current) {
      return;
    }

    const game = useGameStore.getState();
    if (game.gameState !== 'playing' || game.isPaused) {
      return;
    }

    ref.current.position.addScaledVector(laser.direction, laser.speed * delta);
    lifeRef.current -= delta;

    if (lifeRef.current <= 0) {
      game.removeLaser(laser.id);
      return;
    }

    for (const target of game.targets) {
      if (!checkCircleCollision(ref.current.position, 0.5, target.position, 1.0)) {
        continue;
      }

      game.removeTarget(target.id);
      game.removeLaser(laser.id);
      game.addParticle(target.position, '#ff0000', 10);
      return;
    }

    if (laser.source === 'player') {
      const enemies = gameRegistry.getEnemies();
      for (const enemy of enemies) {
        if (ref.current.position.distanceTo(enemy.ref.position) > ENEMY_HIT_RADIUS) {
          continue;
        }

        const enemyBeforeHit = game.enemies.find((entry) => entry.id === enemy.id);

        game.removeLaser(laser.id);
        game.pushGameEvent({
          type: 'hit',
          payload: {
            weapon: laser.sourceWeapon,
            x: ref.current.position.x,
            z: ref.current.position.z,
          },
        });

        const enemyKilled = game.damageEnemy(enemy.id, laser.damage);

        const lifeSteal = game.runPerks.includes('vampiric_rounds')
          ? RUN_PERK_CONFIG.vampiric_rounds.modifiers.lifeSteal ?? 0
          : 0;

        if (lifeSteal > 0) {
          game.heal(laser.damage * lifeSteal * 2.8);
        }

        if (game.runPerks.includes('shockwave')) {
          const splashDamage = RUN_PERK_CONFIG.shockwave.modifiers.splashDamage ?? 0;

          if (splashDamage > 0) {
            for (const nearby of gameRegistry.getEnemies()) {
              if (nearby.id === enemy.id) {
                continue;
              }

              if (nearby.ref.position.distanceTo(enemy.ref.position) <= 2.2) {
                game.damageEnemy(nearby.id, splashDamage);
              }
            }
          }
        }

        if (enemyKilled) {
          game.addScore(resolveKillReward(enemyBeforeHit));
          game.incrementKills();
          game.incrementWaveKills();
          game.addParticle(enemy.ref.position.clone(), '#ff88ff', 18);
          game.spawnPowerUp(enemy.ref.position.clone());
          game.pushGameEvent({
            type: 'kill',
            payload: {
              archetype: enemyBeforeHit?.archetype ?? 'unknown',
              x: enemy.ref.position.x,
              z: enemy.ref.position.z,
            },
          });
          audioManager.playExplosion();
        } else {
          game.addParticle(enemy.ref.position.clone(), '#b284ff', 6);
        }

        return;
      }
    }

    if (laser.source === 'enemy') {
      const playerPos = gameRegistry.getPlayerPosition();
      if (!playerPos || !checkCircleCollision(ref.current.position, 0.45, playerPos, PLAYER_HIT_RADIUS)) {
        return;
      }

      game.takeDamage(laser.damage);
      game.removeLaser(laser.id);
      game.addParticle(ref.current.position.clone(), '#ff6d6d', 10);
      game.pushGameEvent({
        type: 'damage_taken',
        payload: {
          x: ref.current.position.x,
          z: ref.current.position.z,
        },
      });
      audioManager.playHit();
    }
  });

  const laserColor =
    laser.source === 'enemy'
      ? '#ff5b5b'
      : laser.sourceWeapon === 'enemy'
        ? '#ff5b5b'
        : WEAPON_CONFIG[laser.sourceWeapon].color;

  return (
    <group ref={ref} position={laser.position} rotation={laser.rotation}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.045, 0.045, 1.1, 10]} />
        <meshStandardMaterial
          color={laserColor}
          emissive={laserColor}
          emissiveIntensity={3.5}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
};

export const LaserManager = () => {
  const lasers = useGameStore((state) => state.lasers);

  return (
    <>
      {lasers.map((laser) => (
        <Laser key={laser.id} laser={laser} />
      ))}
    </>
  );
};
