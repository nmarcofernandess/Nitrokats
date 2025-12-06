import { EntityManager, Time, Vehicle, GameEntity } from 'yuka';

class AIManager {
    entityManager: EntityManager;
    time: Time;
    playerEntity: GameEntity;

    constructor() {
        this.entityManager = new EntityManager();
        this.time = new Time();

        // Create a 'ghost' entity representing the player for enemies to target
        this.playerEntity = new GameEntity();
        this.entityManager.add(this.playerEntity);
    }

    update(delta: number) {
        this.entityManager.update(delta);
    }

    registerEnemy(vehicle: Vehicle) {
        this.entityManager.add(vehicle);
    }

    unregisterEnemy(vehicle: Vehicle) {
        this.entityManager.remove(vehicle);
    }

    updatePlayerPosition(x: number, y: number, z: number) {
        this.playerEntity.position.set(x, y, z);
    }

    getPlayerEntity() {
        return this.playerEntity;
    }
}

export const aiManager = new AIManager();
