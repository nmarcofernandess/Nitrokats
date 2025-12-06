import { Scene } from './game/Scene';
import { UI } from './game/UI';

function App() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      {/* 3D Game Canvas - Fullscreen */}
      <Scene />

      {/* UI Overlay - Floating cards on top */}
      <UI />
    </div>
  );
}

export default App;
