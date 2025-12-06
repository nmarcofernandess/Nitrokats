import { Group, Vector3 } from 'three';

// A simple static registry to hold references to game objects
// This allows high-frequency logic (collision, AI) without triggering React re-renders via Store updates.

interface RegisteredObject {
    id: string;
    type: 'player' | 'enemy' | 'block';
    ref: Group; // mesh or group ref
    radius: number;
}

class GameRegistry {
    player: Group | null = null;
    enemies: Map<string, RegisteredObject> = new Map();
    blocks: Map<string, RegisteredObject> = new Map();

    registerPlayer(ref: Group) {
        this.player = ref;
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

    // Direct Access for Logic
    getPlayerPosition(): Vector3 | null {
        return this.player ? this.player.position : null;
    }

    getEnemies() {
        return Array.from(this.enemies.values());
    }

    getBlocks() {
        return Array.from(this.blocks.values());
    }
}

export const gameRegistry = new GameRegistry();
