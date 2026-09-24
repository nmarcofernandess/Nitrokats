import { Component, useEffect, useState, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import type { GameRuntime } from '../runtime/GameRuntime';
import type { HudBridge, MouseAimBridge } from './WorldView';
import type { MenuCommand } from '../input/bindings';
import type { PlayerId } from '../core/model';
import { WorldView } from './WorldView';

function WebGLFallback({ onBack }: { onBack: () => void }) {
  return (
    <div role="alert" className="absolute inset-0 z-50 grid place-items-center bg-[#131a20] p-8 text-center text-white">
      <div className="max-w-lg rounded-2xl border border-amber-300/40 bg-[#202a32] p-8 shadow-2xl">
        <h2 className="text-2xl font-bold">Não foi possível abrir a arena</h2>
        <p className="mt-3 text-slate-200">Este navegador não conseguiu iniciar o WebGL. Atualize o navegador ou ative a aceleração gráfica e tente novamente.</p>
        <button type="button" onClick={onBack} className="mt-6 rounded-lg bg-cyan-300 px-5 py-3 font-bold text-slate-950">Voltar ao menu</button>
      </div>
    </div>
  );
}

class SceneErrorBoundary extends Component<{
  children: ReactNode;
  onBack: () => void;
}, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  render() {
    return this.state.hasError ? <WebGLFallback onBack={this.props.onBack} /> : this.props.children;
  }
}

function canCreateWebGL2Context(): boolean {
  if (typeof document === 'undefined') return false;
  const canvas = document.createElement('canvas');
  try {
    const context = canvas.getContext('webgl2');
    if (!context) return false;
    context.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

export function PlayScene({ runtime, mouseAimBridge, hudBridge, onBack, onMenuCommands }: {
  runtime: GameRuntime;
  mouseAimBridge: MouseAimBridge;
  hudBridge: HudBridge;
  onBack: () => void;
  onMenuCommands: (commands: Partial<Record<PlayerId, MenuCommand>>) => void;
}) {
  const [webglAvailable, setWebglAvailable] = useState<boolean | null>(null);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setWebglAvailable(canCreateWebGL2Context()));
    return () => cancelAnimationFrame(frame);
  }, []);

  if (webglAvailable === false) return <WebGLFallback onBack={onBack} />;
  if (webglAvailable === null) {
    return <div role="status" className="absolute inset-0 grid place-items-center bg-[#19242c] text-white">Preparando a arena…</div>;
  }

  return (
    <SceneErrorBoundary onBack={onBack}>
      <Canvas
        className="absolute inset-0"
        dpr={[1, 1.25]}
        shadows
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        fallback={<WebGLFallback onBack={onBack} />}
      >
        <color attach="background" args={['#222d35']} />
        <WorldView runtime={runtime} mouseAimBridge={mouseAimBridge} hudBridge={hudBridge} onMenuCommands={onMenuCommands} />
      </Canvas>
    </SceneErrorBoundary>
  );
}
