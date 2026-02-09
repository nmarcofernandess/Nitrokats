declare module 'yuka' {
  export class Vector3 {
    x: number;
    y: number;
    z: number;

    constructor(x?: number, y?: number, z?: number);

    set(x: number, y: number, z: number): this;
    squaredLength(): number;
  }

  export class Quaternion {}

  export class GameEntity {
    position: Vector3;
    rotation: Quaternion;

    constructor();
  }

  export class SteeringBehavior {}

  export class SteeringManager {
    add(behavior: SteeringBehavior): void;
  }

  export class ArriveBehavior extends SteeringBehavior {
    constructor(target: Vector3, deceleration?: number, tolerance?: number);
  }

  export class Vehicle extends GameEntity {
    maxSpeed: number;
    mass: number;
    velocity: Vector3;
    steering: SteeringManager;
  }

  export class EntityManager {
    add(entity: GameEntity): void;
    remove(entity: GameEntity): void;
    update(delta: number): void;
  }

  export class Time {
    update(): number;
    getDelta(): number;
  }
}
