import { Suspense, lazy } from 'react';
import { UI } from './game/UI';

const Scene = lazy(() => import('./game/Scene').then((module) => ({ default: module.Scene })));
const rebootSelectorEnabled = import.meta.env.DEV || import.meta.env.MODE === 'e2e';
const GameApp = rebootSelectorEnabled
  ? lazy(() => import('./play/GameApp').then((module) => ({ default: module.GameApp })))
  : null;

function App() {
  if (rebootSelectorEnabled && GameApp) {
    if (new URLSearchParams(window.location.search).get('edition') === 'reboot') {
      return (
        <div className="relative h-screen w-screen overflow-hidden bg-black">
          <Suspense fallback={<div className="absolute inset-0 grid place-items-center bg-[#19242c] text-white">Abrindo Nitrokats Reborn…</div>}>
            <GameApp onBack={() => { window.location.href = '/' }} />
          </Suspense>
        </div>
      );
    }
  }

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
