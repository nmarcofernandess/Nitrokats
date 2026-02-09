import { useGameStore } from '../store';
import { ZombieRat } from './ZombieRat';
import { ZombieCat } from './ZombieCat';
import { MechaCatBoss } from './MechaCatBoss';

export const EnemyManager = () => {
  const enemies = useGameStore((state) => state.enemies);

  return (
    <>
      {enemies.map((enemy) => {
        if (enemy.kind === 'mechaCat') {
          return <MechaCatBoss key={enemy.id} data={enemy} />;
        }

        if (enemy.kind === 'zombieCat') {
          return <ZombieCat key={enemy.id} data={enemy} />;
        }

        return <ZombieRat key={enemy.id} data={enemy} />;
      })}
    </>
  );
};
