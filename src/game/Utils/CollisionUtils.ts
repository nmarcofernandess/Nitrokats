import { Vector3 } from 'three';

export const checkCircleCollision = (pos1: Vector3, radius1: number, pos2: Vector3, radius2: number): boolean => {
    const dx = pos1.x - pos2.x;
    const dz = pos1.z - pos2.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    return distance < (radius1 + radius2);
};

export const checkCircleAABBCollision = (circlePos: Vector3, radius: number, boxPos: Vector3, boxSize: Vector3): boolean => {
    // AABB bounds
    const minX = boxPos.x - boxSize.x / 2;
    const maxX = boxPos.x + boxSize.x / 2;
    const minZ = boxPos.z - boxSize.z / 2;
    const maxZ = boxPos.z + boxSize.z / 2;

    // Closest point on AABB to circle center
    const closestX = Math.max(minX, Math.min(circlePos.x, maxX));
    const closestZ = Math.max(minZ, Math.min(circlePos.z, maxZ));

    // Distance from closest point to circle center
    const distanceX = circlePos.x - closestX;
    const distanceZ = circlePos.z - closestZ;

    const distanceSquared = (distanceX * distanceX) + (distanceZ * distanceZ);
    return distanceSquared < (radius * radius);
};
