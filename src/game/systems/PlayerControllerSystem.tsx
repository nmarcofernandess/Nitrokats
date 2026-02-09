import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Euler, Vector3 } from 'three';
import { useGameStore } from '../store';
import { gameRegistry } from '../Utils/ObjectRegistry';
import { checkCircleAABBCollision, checkCircleCollision } from '../Utils/CollisionUtils';
import { WEAPON_CONFIG } from '../config/weapons';
import { ARENA_BOUNDS } from '../config/render';
import { RUN_PERK_CONFIG } from '../config/perks';
import { audioManager } from '../Utils/AudioManager';
import { aiManager } from '../Utils/AIManager';
import { getCameraBasis, getMovementFromCamera } from './runtimeMath';
import type { RunPerkId } from '../types';
import type { WeaponConfig } from '../config/weapons';

const tmpMove = new Vector3();
const tmpNextPos = new Vector3();
const tmpForward = new Vector3();
const tmpMuzzle = new Vector3();
const tmpDir = new Vector3();
const tmpSpreadAxis = new Vector3(0, 1, 0);
const tmpBlockSize = new Vector3(2, 2, 2);
const tmpAimFallback = new Vector3();

const applyPerksToWeapon = (weapon: WeaponConfig, perks: RunPerkId[]) => {
  let fireRate = weapon.fireRate;
  let damage = weapon.damage;
  let speed = weapon.projectileSpeed;
  let recoil = weapon.recoil;

  for (const perkId of perks) {
    const modifiers = RUN_PERK_CONFIG[perkId]?.modifiers;
    if (!modifiers) {
      continue;
    }

    if (modifiers.fireRateMultiplier) fireRate *= modifiers.fireRateMultiplier;
    if (modifiers.damageMultiplier) damage *= modifiers.damageMultiplier;
    if (modifiers.projectileSpeedMultiplier) speed *= modifiers.projectileSpeedMultiplier;
    if (modifiers.recoilMultiplier) recoil *= modifiers.recoilMultiplier;
  }

  return {
    ...weapon,
    fireRate,
    damage,
    projectileSpeed: speed,
    recoil,
  };
};

export const PlayerControllerSystem = () => {
  const addLaser = useGameStore((state) => state.addLaser);
  const setSelectedWeapon = useGameStore((state) => state.setSelectedWeapon);
  const pushGameEvent = useGameStore((state) => state.pushGameEvent);
  const heal = useGameStore((state) => state.heal);

  const lastShotTimeRef = useRef(0);
  const recoilRef = useRef(0);

  useFrame((state, delta) => {
    const game = useGameStore.getState();
    if (
      game.gameState !== 'playing' ||
      game.isPaused ||
      game.matchPhase === 'perk_select' ||
      game.matchPhase === 'completed'
    ) {
      return;
    }

    const player = gameRegistry.getPlayer();
    if (!player) {
      return;
    }

    const { camera, input } = game;

    const moveForward = input.moveForward;
    const moveRight = input.moveRight;

    tmpMove.copy(getMovementFromCamera(camera.yaw, moveForward, moveRight));
    tmpForward.copy(getCameraBasis(camera.yaw).forward);

    if (tmpMove.lengthSq() > 0) {
      tmpMove.normalize().multiplyScalar(8 * delta);

      tmpNextPos.copy(player.position).add(tmpMove);

      let canMove = true;

      const enemies = gameRegistry.getEnemies();
      for (const enemy of enemies) {
        if (checkCircleCollision(tmpNextPos, 1.2, enemy.ref.position, 1.4)) {
          canMove = false;
          break;
        }
      }

      if (canMove) {
        const blocks = gameRegistry.getBlocks();
        for (const block of blocks) {
          if (checkCircleAABBCollision(tmpNextPos, 1.1, block.ref.position, tmpBlockSize)) {
            canMove = false;
            break;
          }
        }
      }

      if (canMove) {
        tmpNextPos.x = Math.max(ARENA_BOUNDS.minX, Math.min(ARENA_BOUNDS.maxX, tmpNextPos.x));
        tmpNextPos.z = Math.max(ARENA_BOUNDS.minZ, Math.min(ARENA_BOUNDS.maxZ, tmpNextPos.z));
        player.position.copy(tmpNextPos);
      }
    }

    player.rotation.y = camera.yaw;

    aiManager.updatePlayerPosition(player.position.x, player.position.y, player.position.z);

    if (game.health < game.maxHealth) {
      heal(1.2 * delta);
    }

    if (input.weaponSwap) {
      setSelectedWeapon(input.weaponSwap);
      pushGameEvent({ type: 'weapon_swap', payload: { weapon: input.weaponSwap } });
    }

    const weapon = applyPerksToWeapon(WEAPON_CONFIG[game.selectedWeapon], game.runPerks);

    if (!input.isFiring || state.clock.elapsedTime - lastShotTimeRef.current < weapon.fireRate) {
      recoilRef.current = Math.max(0, recoilRef.current - delta * 6);
      return;
    }

    const aimPoint = game.aimPoint ?? tmpAimFallback.copy(player.position).addScaledVector(tmpForward, 30);

    const weaponSocket = player.getObjectByName('weapon_socket');
    if (weaponSocket) {
      weaponSocket.getWorldPosition(tmpMuzzle);
    } else {
      tmpMuzzle.copy(player.position);
      tmpMuzzle.y += 1.15;
      tmpMuzzle.addScaledVector(tmpForward, 1.1);
    }

    for (let pelletIndex = 0; pelletIndex < weapon.pelletCount; pelletIndex += 1) {
      tmpDir.copy(aimPoint).sub(tmpMuzzle).normalize();

      if (weapon.spreadAngle > 0) {
        const spread = (Math.random() - 0.5) * weapon.spreadAngle;
        tmpDir.applyAxisAngle(tmpSpreadAxis, spread);
      }

      const yaw = Math.atan2(tmpDir.x, tmpDir.z);
      addLaser({
        position: tmpMuzzle,
        rotation: new Euler(0, yaw, 0),
        direction: tmpDir,
        source: 'player',
        sourceWeapon: game.selectedWeapon,
        damage: weapon.damage,
        speed: weapon.projectileSpeed,
        life: game.selectedWeapon === 'arc_marksman' ? 4.8 : 3.2,
      });
    }

    recoilRef.current = weapon.recoil;
    lastShotTimeRef.current = state.clock.elapsedTime;
    audioManager.playShoot();
  });

  return null;
};
