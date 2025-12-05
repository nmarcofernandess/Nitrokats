import { Canvas } from '@react-three/fiber';
import { OrthographicCamera } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { GridFloor } from './World/GridFloor';
import { CatTank } from './Player/CatTank';
import { LaserManager } from './Projectiles/LaserManager';
import { TargetManager } from './World/TargetManager';
import { VFXManager } from './World/VFXManager';
import { EnemyManager } from './Entities/EnemyTank';

export const Scene = () => {
    return (
        <Canvas shadows className="h-screen w-screen bg-black" style={{ position: 'absolute', top: 0, left: 0 }}>
            <OrthographicCamera makeDefault position={[20, 20, 20]} zoom={40} near={-50} far={200} />

            {/* Lighting */}
            <ambientLight intensity={0.2} />
            <pointLight position={[10, 10, 10]} intensity={1} castShadow />

            {/* World */}
            <GridFloor />
            <CatTank />
            <LaserManager />
            <TargetManager />
            <VFXManager />

            {/* Enemies */}
            <EnemyManager />

            {/* Post Processing */}
            <EffectComposer>
                <Bloom luminanceThreshold={0} mipmapBlur intensity={2.0} radius={0.4} />
            </EffectComposer>

            {/* Background Color */}
            <color attach="background" args={['#050505']} />
        </Canvas>
    );
};
