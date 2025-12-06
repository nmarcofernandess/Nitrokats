declare module 'yuka' {
    export class EntityManager {
        add(entity: any): void;
        remove(entity: any): void;
        update(delta: number): void;
    }

    export class Time {
        update(): number;
        getDelta(): number;
    }

    export class GameEntity {
        position: Vector3;
        rotation: Quaternion;
        constructor();
    }

    export class Vehicle extends GameEntity {
        maxSpeed: number;
        mass: number;
        velocity: Vector3;
        steering: SteeringManager;
    }

    export class SteeringManager {
        add(behavior: SteeringBehavior): void;
    }

    export class SteeringBehavior { }

    export class ArriveBehavior extends SteeringBehavior {
        constructor(target: Vector3, deceleration?: number, tolerance?: number);
    }

    export class SeparationBehavior extends SteeringBehavior {
        constructor();
    }

    export class Vector3 {
        x: number;
        y: number;
        z: number;
        set(x: number, y: number, z: number): this;
        squaredLength(): number;
        constructor(x?: number, y?: number, z?: number);
    }

    export class Quaternion {
        // Add minimal required methods
    }
}
