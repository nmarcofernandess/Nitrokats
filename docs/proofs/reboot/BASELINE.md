# Nitrokats Reborn — baseline da edição legada

**Data da observação:** 24/09/2026
**Worktree:** `/Users/marcoantonio/Nitrokats-Reborn`
**Branch:** `codex/nitrokats-reborn-plan-20260924`
**HEAD antes da implementação:** `82a5d9e165672bcbe9fb57eb437ec6211e17b2a6`
**Origem:** `https://github.com/nmarcofernandess/Nitrokats.git`
**Base TPS observada:** `origin/codex/third-person-cat-shooter` em `3f49c8d3cb3df0c31b89b02331d28677b19826f5`, igual à base informada no pacote.

## Estado original observado

`src/App.tsx` já apontava para a edição preservada em `src/game/Scene.tsx` e `src/game/UI.tsx`. A tela inicial apresentava os modos `Play Tank` e `Play Zombie`; os controles informados na tela eram WASD para mover, botão esquerdo do mouse para atirar, mouse para mirar, ESC para pausar e clique para capturar o mouse. T01 manteve esse entry point e não tornou a edição Reborn padrão.

## Ambiente e comandos observados durante o baseline

O `npm test` de baseline **antes de criar o spec Playwright não foi executado**. Portanto, não há evidência de um baseline pré-alteração intacto para esse comando. A única execução disponível ocorreu depois de `tests/e2e/legacy-smoke.spec.ts` ter sido criado e antes de Playwright ser instalado; seu resultado abaixo é apenas um estado intermediário contaminado pela descoberta do arquivo E2E pelo Vitest.


- Node.js: `v25.6.1`
- npm: `11.9.0`
- `npm ci`: exit 0; instalou 360 pacotes antes da inclusão do Playwright.
- `npm test`: executado depois de criar o teste E2E inicial, mas antes de configurar Vitest/Playwright; exit 1 porque Vitest também descobriu `tests/e2e/legacy-smoke.spec.ts` e `@playwright/test` ainda não estava instalado. As cinco suítes legadas passaram (8 testes); somente a coleta indevida do teste Playwright falhou.
- `npm run lint`: exit 0.
- `npm run build`: exit 0; Vite reportou dados Browserslist antigos e chunk Three.js maior que 500 kB.

Esse resultado intermediário não deve ser interpretado como teste do estado pré-alteração. Ele registra a interferência causada pelo spec novo antes de configurar a fronteira entre os runners.

## Limitações observadas

`npm ci` reportou 19 vulnerabilidades na árvore instalada (1 baixa, 7 moderadas, 10 altas, 1 crítica). Não foi executado `npm audit fix` nem feita atualização geral de dependências. O build manteve os avisos de Browserslist desatualizado e chunk grande, sem falhar. Node 25.6.1 foi o runtime disponível nesta worktree; não foi alterada configuração global de Node.
