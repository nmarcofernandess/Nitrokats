import { Group, Vector3 } from 'three';

interface RegisteredObject {
  id: string;
  type: 'player' | 'enemy' | 'block';
  ref: Group;
  radius: number;
}

class GameRegistry {
  private player: Group | null = null;
  private enemies: Map<string, RegisteredObject> = new Map();
  private blocks: Map<string, RegisteredObject> = new Map();

  registerPlayer(ref: Group) {
    this.player = ref;
  }

  unregisterPlayer() {
    this.player = null;
  }

  registerEnemy(id: string, ref: Group) {
    this.enemies.set(id, { id, type: 'enemy', ref, radius: 1.5 });
  }

  unregisterEnemy(id: string) {
    this.enemies.delete(id);
  }

  registerBlock(id: string, ref: Group) {
    this.blocks.set(id, { id, type: 'block', ref, radius: 1.2 });
  }

  unregisterBlock(id: string) {
    this.blocks.delete(id);
  }

  clear() {
    this.player = null;
    this.enemies.clear();
    this.blocks.clear();
  }

  getPlayerPosition(): Vector3 | null {
    return this.player ? this.player.position : null;
  }

  getEnemies(): RegisteredObject[] {
    return Array.from(this.enemies.values());
  }

  getBlocks(): RegisteredObject[] {
    return Array.from(this.blocks.values());
  }
}

export const gameRegistry = new GameRegistry();
