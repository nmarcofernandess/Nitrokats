import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, InstancedMesh, MathUtils, Object3D } from 'three';
import { useGameStore } from '../store';

const MAX_PARTICLES = 800;

export const VFXManager = () => {
  const updateParticles = useGameStore((state) => state.updateParticles);
  const shake = useGameStore((state) => state.shake);
  const triggerShake = useGameStore((state) => state.triggerShake);

  const currentShake = useRef(0);
  const meshRef = useRef<InstancedMesh>(null);

  const dummy = useMemo(() => new Object3D(), []);
  const color = useMemo(() => new Color(), []);

  useEffect(() => {
    if (shake <= 0) {
      return;
    }

    currentShake.current = shake;
    triggerShake(0);
  }, [shake, triggerShake]);

  useFrame((_, delta) => {
    updateParticles(delta);

    const particles = useGameStore.getState().particles;
    const mesh = meshRef.current;

    if (mesh) {
      const count = Math.min(particles.length, MAX_PARTICLES);
      for (let index = 0; index < count; index += 1) {
        const particle = particles[index];

        dummy.position.copy(particle.position);
        dummy.scale.setScalar(Math.max(0.05, particle.life * 0.2));
        dummy.updateMatrix();

        mesh.setMatrixAt(index, dummy.matrix);
        color.set(particle.color);
        mesh.setColorAt(index, color);
      }

      mesh.count = count;
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) {
        mesh.instanceColor.needsUpdate = true;
      }
    }

    if (currentShake.current > 0) {
      currentShake.current = MathUtils.lerp(currentShake.current, 0, delta * 10);
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, MAX_PARTICLES]} frustumCulled={false}>
      <boxGeometry args={[0.2, 0.2, 0.2]} />
      <meshBasicMaterial vertexColors />
    </instancedMesh>
  );
};
