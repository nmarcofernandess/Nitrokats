import { Suspense, lazy } from 'react';
import { UI } from './game/UI';

const Scene = lazy(() => import('./game/Scene').then((module) => ({ default: module.Scene })));

function App() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      <Suspense fallback={<div className="absolute inset-0 bg-black" />}>
        <Scene />
      </Suspense>
      <UI />
    </div>
  );
}

export default App;
