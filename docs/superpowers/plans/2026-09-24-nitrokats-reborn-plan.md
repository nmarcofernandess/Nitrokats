# Nitrokats Reborn — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar um jogo local solo completo para P1, com três arenas, chefe, arte Blender e revanche. P2 é uma etapa futura.

**Architecture:** Preservar o projeto histórico e criar uma edição nova em `src/play/`, com simulação TypeScript por tick fixo, render R3F como projeção, input de P1 e conteúdo autorado no Blender. O core já suporta dois slots por causa de T01–T10; a distribuição v1 inicia apenas P1. A distribuição é um build web local, sem servidor multiplayer.

**Tech Stack:** React 19 / TypeScript / Vite 7 / Three 0.181 / R3F 9 / Zustand 5 / Vitest 3 conforme lock da branch; Playwright a fixar na T01; Blender 4.5.14 LTS como baseline de arte. Não é uma recomendação de atualizar dependências em massa.

**Spec:** `docs/superpowers/specs/2026-09-24-nitrokats-reborn-design.md`.

**Base:** `nmarcofernandess/Nitrokats`, `codex/third-person-cat-shooter@3f49c8d3cb3df0c31b89b02331d28677b19826f5`.

**Leitura obrigatória:** spec, este plano e `docs/superpowers/research/2026-09-24-repository-audit.md`. Conferir HEAD remoto na execução e registrar qualquer diferença. A inspeção desta proposta foi documental; não houve execução do jogo, Blender ou testes.

**Estado:** T01–T10 concluídas e revisadas no checkpoint `82b8951`; T11–T25 pendentes e redirecionadas para o release solo em 24/09/2026. Os blocos de T01–T10 preservam a especificação histórica do trabalho já entregue, inclusive P2, e seus recibos são a evidência. Nenhum gate de P2 desses blocos se transfere automaticamente para o release solo. A câmera isométrica implementada é a base atual.

**Ruling de escopo executável:** de T11 até T25, exemplos, interfaces, provas e aceite devem funcionar com `players: [{id:'p1', ...}]`. A jornada de produção não mostra “Jogar em dupla”, não cria P2 e não exige resgate, segundo gamepad, teclado dividido, escolha dupla de perk ou playtest do casal. Preservar o código existente de P2 sem ampliá-lo para o MVP. Se algum exemplo histórico abaixo conflitar com essa regra, a tarefa futura deve usar o caso solo explicitado em sua seção. P2 só volta como trabalho novo depois de a campanha solo e o pacote local passarem seus gates.

## Global Constraints

- G01: Entregar uma campanha local completa para P1; P2, cooperação, online, LAN, contas, backend, monetização e mobile ficam fora da v1.
- G02: Manter React + TypeScript + Vite + Three.js/R3F; Blender produz arte, não executa o jogo.
- G03: Uma única simulação em TypeScript governa o combate; React, meshes e Zustand não são escritores concorrentes do mundo.
- G04: Usar passo fixo de 1/60 s, RNG com seed, IDs locais monotônicos e timers de simulação; nenhuma regra de combate depende de Date.now, Math.random ou relógio do render.
- G05: Validar teclado/mouse de P1 em hardware real. Se um gamepad standard for oferecido a P1, validar esse perfil fisicamente. Dois controles e teclado compartilhado pertencem à fase futura.
- G06: Vida, arma, cooldown, perks, input e resultado de P1 pertencem ao core. O isolamento P1/P2 já entregue permanece preservado, sem gate cooperativo nesta v1.
- G07: O escopo final contém 4 gatos cosméticos, 3 armas, 3 arquétipos de inimigo, 3 arenas, 1 chefe e 6 perks; nada disso exige desbloqueio por grind.
- G08: Assets finais possuem fonte editável, exportação GLB quando aplicável, proveniência e licença documentada; placeholders não satisfazem o aceite visual.
- G09: Toda a interface da v1 é PT-BR; menus e escolhas são operáveis pelo teclado/mouse de P1 e pelo gamepad de P1 quando oferecido. P2 não aparece na edição de produção.
- G10: Não instalar ou alterar configurações globais, comprar assets, usar geração paga, publicar, mergear ou sobrescrever trabalho externo sem autorização específica.
- G11: Toda tarefa de código tem teste causal vermelho e verde; arte tem validação estrutural e prova visual; sensação de jogo e controles de P1 exigem playtest humano.
- G12: Nenhum teste, build, benchmark, render ou playtest foi executado durante a elaboração deste pacote; metas de desempenho e diversão são critérios futuros.

## Review Focus

- T23: perda de foco, tecla solta fora da janela e desconexão do gamepad de P1, quando oferecido, não podem manter tiro preso nem retomar a partida sozinhos. Os casos de dois dispositivos da T07 ficam preservados para a fase futura.
- T03/T07/T23: baixo FPS, pausa, catch-up e botão mantido não podem duplicar dash, tiro, cooldown ou progresso de objetivo.
- T12/T13: chefe/elite ainda não criado, objetivo não ocupado e inimigo contestando zona não podem produzir progresso ou vitória falsa.
- T16/T18/T25: asset faltante, licença sem evidência, GLB incompleto ou placeholder não podem passar por release final nem deixar tela preta sem saída.
- T20/T21/T22/T24: reinícios repetidos, áudio suspenso, cache compartilhado e storage corrompido não podem acumular sessões ou derrubar o jogo.

## Mapa de entregas

| Marco | Tarefas | O que fica utilizável | Gate |
|---|---|---|---|
| M0 — preservar | T01 | Original recuperável e baseline registrado | História preservada, leitura real de build/testes |
| M1 — base técnica histórica | T02–T10 | Core, inputs, treino, armas, câmera e coop greybox já entregues | Recibos e reviews de T01–T10; P2 sem gate da v1 |
| M2 — partida completa | T11–T15 | Inimigos, três objetivos/arenas greybox, perks, chefe e final | Vitória/derrota/revanche por regras reais |
| M3 — identidade Blender | T16–T19 | Quatro aparências, veículos, inimigos e cenários finais | Fontes + GLBs + manifesto + prova visual |
| M4 — acabamento | T20–T22 | Custos limitados, áudio, preferências e conforto | Soak focal, falhas recuperáveis, sem regressão de regras |
| M5 — entregar | T23–T25 | Release local solo documentada | Campanha real, controle de P1, performance e playtest solo |

```text
T01 → T02 → T03 → T04 → T05 → T06 → T07 → T08 → T09 → T10
                                                           │
T10 → T11 → T12 → T13 → T14 → T15                           │
                                 │                           │
                                 └───────── T16 ←────────────┘
                                             ↓
                                            T17 → T18 → T19
                                                           ↓
                               T20 → T21 → T22 → T23 → T24 → T25
```

O desenho mostra trilhas, não autorização para editar o mesmo arquivo em paralelo. Dependências nominais de cada tarefa prevalecem. Na primeira execução, o default seguro é sequencial T01→T25. O pipeline Blender só pode correr em paralelo à UI/áudio quando contratos da T12 estiverem fechados, em worktrees sem arquivos comuns e com um único escritor de `.blend`.

## Estrutura e proprietários

```text
src/game/                original, preservado durante migração
src/play/
  core/                  mundo, tipos, RNG, tick, ciclo de vida e métricas
  runtime/               sessão e ligação do relógio com input/render
  input/                 teclado/mouse/gamepads, bindings e diagnóstico
  movement/              movimento, dash e colisão
  combat/                armas, projéteis e dano
  coop/                  queda, resgate e derrota
  ai/                    navegação, inimigos e chefe
  campaign/              objetivos, director, perks e avanço de arena
  content/               tabelas tipadas e descritores de arenas
  assets/                catálogo, carregamento e validação
  render/                câmera, meshes, animação, efeitos e qualidade
  ui/                    lobby, HUD, opções, pausa, resultado e tutorial
  audio/                 buses e sequência musical/efeitos
  settings/              schema e persistência local
  testing/               bridge ausente da distribuição normal
art/source/              arquivos editáveis Blender/áudio
art/ASSET_MANIFEST.json   proveniência e revisão dos assets
public/assets/           exports consumidos no runtime
utils não genéricos:     não criar pasta de helpers sem dono funcional
tools/blender/           probe, exportação, validação e previews
tests/                   fixtures, integração, E2E e release
docs/proofs/reboot/      evidências reais por tarefa e marco
```

### Regras de execução e revisão

1. Ler spec e auditoria antes de propor outra engine ou outra câmera. A proposta já resolveu esses trade-offs; desviá-los exige registrar mudança de escopo.
2. Criar/validar worktree isolada. Nunca executar migração em master nem resetar trabalho local. Não inventar caminho absoluto do Mac: localizar checkout pelo remote correto; usar `~/Nitrokats` somente se estiver livre e a clonagem for autorizada.
3. Usar ledger da skill com identidade do plano. Antes de cada tarefa, conferir commits e estado registrado; depois de perda de contexto não repetir tarefa concluída.
4. Implementador recebe a tarefa completa, spec e contratos consumidos. Revisão independente verifica aderência e qualidade após cada unidade; revisão final verifica a branch inteira. Não alegar review independente quando só houve auto-revisão.
5. RED deve falhar pela regra ausente/errada; erro de instalação, import não resolvido após implementação ou teste que nunca observa resultado não é demonstração suficiente. Os exemplos abaixo são testes iniciais a incluir, não autorização para omitir os outros casos de aceite explicitados.
6. Escalar o modelo em contratos de runtime/coop/câmera e revisões. Trabalho mecânico de catálogo/markup pode usar modelo menor. Coordenador não faz polling frenético nem edita arquivos em posse de outro agente; mantém ledger e aguarda retorno usando o mecanismo nativo.
7. Um writer por arquivo compartilhado e por sessão Blender. Não iniciar testes pesados, browsers ou renders simultâneos sem orçamento medido. Runner fecha somente os seus processos.
8. Descoberta que impede o objetivo é parte da tarefa dona. Registrar `Ruling: decisão — motivo — custo se errada`; não ignorar bug porque não estava escrito literalmente. Pausar para ação destrutiva, alteração de segurança/global, custo externo/publicação ou ausência incontornável de informação.
9. Cada tarefa registra `docs/proofs/reboot/Txx.md`: base/HEAD, arquivos, comando, resultado/exit code, screenshot/log pertinente, limitações, commit e pendências humanas. Nunca fabricar resultado positivo para fechar checklist.
10. Sem subagents disponíveis, usar `executing-plans` e declarar isso no relatório. Não fingir delegação. Sem Blender ou hardware, avançar apenas tarefas independentes e manter o respectivo gate pendente.

### Contratos que atravessam tarefas

`World` só é mutado pelo core; UI envia intenção. T02 define mundo e configurações; T04 acrescenta bounds/colliders; T05 define Projectile/Hit e dano; T06 define queda/resultado; T11 define estado de navegação; T12 define Encounter e Stage; T13 acrescenta estados do chefe; T14 fecha PerkId/modifiers. Cada tarefa altera `core/model.ts` quando for proprietária de novo campo, mesmo se seu bloco Files o citar implicitamente por contrato.

`GameRuntime` coordena `InputHub` e o clock. `poll()` atualiza hardware uma vez por frame; `consumeFrame()` entrega intenção por tick e consome bordas uma vez. MenuCommand é separado de PlayerInput. `WorldView`, AudioDirector e uiStore recebem o mesmo batch de eventos; nenhum consumidor o retira antes do outro. Nenhum frame de render avança o mundo duas vezes.

`TestSnapshot` da T10 é serializável: `{tick,phase,players,enemies,projectiles,stageIndex,encounter,colliders,metrics}`. `metrics` contém runtimeCount/listenerCount/baselineListenerCount quando a T24 instrumentar. Só `setInput` escreve na fronteira de hardware. Alterar seed é permitido somente ao criar sessão, a partir de configuração E2E/lobby; nunca durante a simulação.

Paths neste plano são relativos à raiz do repositório. Arquivos em `src/play`, `tools` e `tests` são **propostos**, não arquivos existentes encontrados. Os arquivos reais inspecionados estão discriminados na auditoria.

---

## Task 01: Congelar a base e manter o jogo antigo executável

**ID:** T01 · **Marco:** M0 · **Depende de:** Nenhuma

**Files:** **Modificar:** `package.json`, `package-lock.json`, `src/App.tsx`, `.gitignore`. **Criar:** `playwright.config.ts`, `tests/e2e/legacy-smoke.spec.ts`, `docs/proofs/reboot/BASELINE.md`.

**Interfaces:** Preserva a edição legada em `src/game/`; adiciona scripts `test:unit` (vitest run), `test:e2e` (playwright test), `test:smoke` (playwright test --grep @smoke). A nova edição ainda não vira padrão.

- [ ] **Step 1: Escrever o teste causal inicial e ler as dependências.**

```ts
import { test, expect } from '@playwright/test';
test('a base ainda abre um único canvas @smoke', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  await expect(page.locator('canvas')).toHaveCount(1);
  expect(errors).toEqual([]);
});
```

- [ ] **Step 2: Executar o teste e registrar o RED real.**

```bash
npm run test:e2e -- tests/e2e/legacy-smoke.spec.ts
```

Esperado antes da implementação: falha pela capacidade ausente ou comportamento incorreto descrito no teste. Registrar a causa; corrigir o ambiente quando a falha não for do contrato.

- [ ] **Step 3: Implementar a unidade e seus casos de borda.**

Antes de mudar código, registrar `git status --short`, origem, HEAD, versões de Node/npm e resultados reais de `npm ci`, `npm test`, `npm run lint`, `npm run build`. A execução deve usar workspace isolado pela skill `using-git-worktrees`. Se já existe checkout local, preservar mudanças; não clonar por cima. Base proposta é a branch TPS, não master. Conferir avanço remoto sem resetar o checkout.

```bash
git fetch origin --prune
git rev-parse origin/codex/third-person-cat-shooter
git log --oneline 3f49c8d3cb3df0c31b89b02331d28677b19826f5..origin/codex/third-person-cat-shooter
npm ci
npm test
npm run lint
npm run build
npm install --save-dev --save-exact @playwright/test
npx playwright install chromium
```

Instalação de browser é pré-requisito local a autorizar, não uma alteração já feita. Preservar a versão de Vitest do lock da branch; não fazer upgrade geral. Configurar Playwright com baseURL `http://127.0.0.1:4173`, um worker, zero retries e webServer `npm run dev -- --host 127.0.0.1 --port 4173 --strictPort`. Capturar console, screenshot e resumo dos controles atuais. Não criar teste que deliberadamente falha sem representar contrato. Nesta tarefa de infraestrutura, o RED legítimo pode ser ausência do script/harness antes de configurá-lo; registrar separadamente de regressões do produto.

- [ ] **Step 4: Reexecutar, revisar e registrar o GREEN real.**

Repetir `npm run test:e2e -- tests/e2e/legacy-smoke.spec.ts` e os testes dos consumidores alterados. Esperado: todos os casos desta tarefa e regressões afetadas passam. Em arte, executar também export/import e registrar imagens reais; validação de metadados sozinha não atesta aparência. No fim do marco, executar `npm run test:unit`, `npm run lint`, `npm run build` e o smoke do estado implementado. Não rodar a campanha longa a cada mudança mecânica.

**Aceite da unidade:** Jogo legado abre; resultados reais e desvios da base são registrados. Nenhuma branch original é sobrescrita e nenhum ambiente global é reconfigurado.

- [ ] **Step 5: Persistir evidência e commit revisável.**

Registrar `docs/proofs/reboot/T01.md` e atualizar o ledger com arquivos/commit/resultado. Usar `git add --` apenas nos arquivos desta tarefa e seus consumidores justificados, nunca `git add .` sobre trabalho de terceiros. Depois:

```bash
git diff --cached --check
git diff --cached --stat
git commit -m "feat(nitrokats): complete T01"
```

O verbo do commit não substitui aceite: gate técnico ou humano ainda pendente permanece explícito no ledger. Nenhum push, merge ou publicação está autorizado por este passo.

---

## Task 02: Criar o mundo por jogador e fixtures causais

**ID:** T02 · **Marco:** M1 · **Depende de:** T01

**Files:** **Criar:** `src/play/core/model.ts`, `src/play/core/world.ts`, `src/play/core/rng.ts`, `src/play/core/step.ts`, `src/play/core/world.test.ts`, `tests/fixtures/world.ts`.

**Interfaces:** Produz `World`, `createWorld(config: RunConfig): World`, `stepWorld(world: World,input: InputFrame): readonly GameEvent[]`, `nextRandom(world: World): number`, `spawnEnemy(world,{kind,position,hp}): string`. Usa os tipos da spec; IDs de inimigo têm prefixo `e:` e projéteis `b:`; jogadores são `p1`/`p2`.

- [ ] **Step 1: Escrever o teste causal inicial e ler as dependências.**

```ts
import { describe, it, expect } from 'vitest';
import { makeWorld, player } from '../../../tests/fixtures/world';
import { nextRandom } from './rng';
describe('mundo isolado', () => {
  it('não compartilha vida nem arrays entre jogadores/runs', () => {
    const a = makeWorld(); const b = makeWorld();
    player(a, 'p1').hp = 3;
    expect(player(a, 'p2').hp).toBe(100);
    expect(player(b, 'p1').hp).toBe(100);
    expect(a.players).not.toBe(b.players);
  });
  it('repete a mesma sequência de RNG com a mesma seed', () => {
    const a = makeWorld({ seed: 123 }); const b = makeWorld({ seed: 123 });
    expect(Array.from({ length: 20 }, () => nextRandom(a)))
      .toEqual(Array.from({ length: 20 }, () => nextRandom(b)));
  });
});
```

- [ ] **Step 2: Executar o teste e registrar o RED real.**

```bash
npm run test:unit -- src/play/core/world.test.ts
```

Esperado antes da implementação: falha pela capacidade ausente ou comportamento incorreto descrito no teste. Registrar a causa; corrigir o ambiente quando a falha não for do contrato.

- [ ] **Step 3: Implementar a unidade e seus casos de borda.**

Criar objetos novos por run e por jogador, sem espalhar um objeto estático com arrays mutáveis. Validar 1–2 jogadores, IDs únicos, seed finita e armas/cats conhecidos. Mundo usa apenas dados simples; nenhum Vector3/Group. `spawnEnemy` é a mesma factory usada mais tarde pelo director, não uma porta de teste separada.

Criar as fixtures abaixo; todos os testes seguintes que as usam dependem desta tarefa:
```ts
import { createWorld } from '../../src/play/core/world';
import { stepWorld } from '../../src/play/core/step';
import type { RunConfig, World, PlayerId, InputFrame, PlayerInput } from '../../src/play/core/model';
export function makeWorld(patch: Partial<RunConfig> = {}): World {
  return createWorld({ seed: 42, mode: 'training', difficulty: 'normal', players: [
    { id: 'p1', catId: 'anakin', weaponId: 'pulse_rifle' },
    { id: 'p2', catId: 'ivy', weaponId: 'pulse_rifle' },
  ], ...patch });
}
export function player(w: World, id: PlayerId) {
  const found = w.players.find(p => p.id === id);
  if (!found) throw new Error(`Jogador ausente: ${id}`);
  return found;
}
export function input(patch: Partial<PlayerInput> = {}): PlayerInput {
  return { move: { x: 0, z: 0 }, aim: { x: 0, z: 1 }, fire: false,
    dash: false, revive: false, nextWeapon: false, ...patch };
}
export function ticks(w: World, count: number, frame: InputFrame = {}): void {
  for (let i = 0; i < count; i++) stepWorld(w, frame);
}
```
`stepWorld` inicialmente só avança tick/tempo quando playing. Sistemas entram em tarefas posteriores, em ordem explícita. `World` deve declarar `players`, `enemies`, `projectiles`, `rngState`, `nextEntityId`, `tick`, `elapsed`, `phase`, `resumePhase`, `config`, `stageIndex`, `events`, `encounter` e `perkOptions`. Campos de encounter podem iniciar null no treino; nunca usar `any` para adiar modelagem.

- [ ] **Step 4: Reexecutar, revisar e registrar o GREEN real.**

Repetir `npm run test:unit -- src/play/core/world.test.ts` e os testes dos consumidores alterados. Esperado: todos os casos desta tarefa e regressões afetadas passam. Em arte, executar também export/import e registrar imagens reais; validação de metadados sozinha não atesta aparência. No fim do marco, executar `npm run test:unit`, `npm run lint`, `npm run build` e o smoke do estado implementado. Não rodar a campanha longa a cada mudança mecânica.

**Aceite da unidade:** Criação de mundo rejeita 0/3 jogadores, IDs repetidos e seed inválida. Fixtures não dependem do browser. Mesmo seed e comandos têm a mesma evolução lógica no mesmo build.

- [ ] **Step 5: Persistir evidência e commit revisável.**

Registrar `docs/proofs/reboot/T02.md` e atualizar o ledger com arquivos/commit/resultado. Usar `git add --` apenas nos arquivos desta tarefa e seus consumidores justificados, nunca `git add .` sobre trabalho de terceiros. Depois:

```bash
git diff --cached --check
git diff --cached --stat
git commit -m "feat(nitrokats): complete T02"
```

O verbo do commit não substitui aceite: gate técnico ou humano ainda pendente permanece explícito no ledger. Nenhum push, merge ou publicação está autorizado por este passo.

---

## Task 03: Centralizar relógio, pausa e descarte da sessão

**ID:** T03 · **Marco:** M1 · **Depende de:** T02

**Files:** **Criar:** `src/play/core/clock.ts`, `src/play/core/lifecycle.ts`, `src/play/core/clock.test.ts`, `src/play/runtime/GameRuntime.ts`. **Modificar:** `src/play/core/step.ts`.

**Interfaces:** Produz `createClock(onTick:()=>void): {advance(seconds:number):void; reset():void}`, `pauseWorld(world):void`, `resumeWorld(world):void`; `GameRuntime` possui `world`, `start(config)`, `advance(dt)`, `pause()`, `resume()`, `restart()`, `dispose()`. InputProvider inicial fornece frame vazio e pode ser injetado.

- [ ] **Step 1: Escrever o teste causal inicial e ler as dependências.**

```ts
import { it, expect } from 'vitest';
import { createClock } from './clock';
import { pauseWorld, resumeWorld } from './lifecycle';
import { makeWorld, ticks } from '../../../tests/fixtures/world';
it('limita catch-up e pausa o tempo de combate', () => {
  let count = 0; const clock = createClock(() => count++);
  clock.advance(10); expect(count).toBe(5);
  clock.reset(); clock.advance(1 / 60); expect(count).toBe(6);
  const w = makeWorld(); ticks(w, 60); pauseWorld(w);
  const before = w.elapsed; ticks(w, 600);
  expect(w.elapsed).toBe(before);
  resumeWorld(w); ticks(w, 1);
  expect(w.elapsed).toBeCloseTo(before + 1 / 60);
});
```

- [ ] **Step 2: Executar o teste e registrar o RED real.**

```bash
npm run test:unit -- src/play/core/clock.test.ts
```

Esperado antes da implementação: falha pela capacidade ausente ou comportamento incorreto descrito no teste. Registrar a causa; corrigir o ambiente quando a falha não for do contrato.

- [ ] **Step 3: Implementar a unidade e seus casos de borda.**

O callback do relógio é o único lugar que chama o step em produção. Pausar runtime chama `clock.reset()` e limpa input; intermission não avança combate. Recomeçar cria mundo novo e descarta referências antigas. Na camada core:
```ts
export function pauseWorld(w: World): void {
  if (w.phase !== 'playing' && w.phase !== 'intermission') return;
  w.resumePhase = w.phase; w.phase = 'paused';
}
export function resumeWorld(w: World): void {
  if (w.phase !== 'paused') return;
  w.phase = w.resumePhase ?? 'playing'; w.resumePhase = null;
}
```
Usar epsilon pequeno no acumulador para evitar perder o 60º tick por ponto flutuante. Clamp de delta não é permissão para alterar o passo fixo. Implementar fila de eventos por tick com IDs monotônicos; áudio e render recebem o mesmo lote, sem `consume` destrutivo por consumidor. Adicionar testes de pause durante intermission, repetição de pause, reset e dispose idempotente.

- [ ] **Step 4: Reexecutar, revisar e registrar o GREEN real.**

Repetir `npm run test:unit -- src/play/core/clock.test.ts` e os testes dos consumidores alterados. Esperado: todos os casos desta tarefa e regressões afetadas passam. Em arte, executar também export/import e registrar imagens reais; validação de metadados sozinha não atesta aparência. No fim do marco, executar `npm run test:unit`, `npm run lint`, `npm run build` e o smoke do estado implementado. Não rodar a campanha longa a cada mudança mecânica.

**Aceite da unidade:** 30/60/120 Hz de render produzem igual número de ticks num intervalo representável. Nenhum cooldown, timer de objetivo ou resgate anda durante pausa.

- [ ] **Step 5: Persistir evidência e commit revisável.**

Registrar `docs/proofs/reboot/T03.md` e atualizar o ledger com arquivos/commit/resultado. Usar `git add --` apenas nos arquivos desta tarefa e seus consumidores justificados, nunca `git add .` sobre trabalho de terceiros. Depois:

```bash
git diff --cached --check
git diff --cached --stat
git commit -m "feat(nitrokats): complete T03"
```

O verbo do commit não substitui aceite: gate técnico ou humano ainda pendente permanece explícito no ledger. Nenhum push, merge ou publicação está autorizado por este passo.

---

## Task 04: Mover dois jogadores com colisão e dash previsíveis

**ID:** T04 · **Marco:** M1 · **Depende de:** T03

**Files:** **Criar:** `src/play/movement/movement.ts`, `src/play/movement/collision.ts`, `src/play/movement/movement.test.ts`. **Modificar:** `src/play/core/step.ts`, `src/play/core/model.ts`.

**Interfaces:** Produz `stepMovement(world,input):void`, `sweepCircleAabb(start,end,radius,box): number|null`, `slideCircle(position,delta,radius,boxes):Vec2`. `Aabb` tem `{min:Vec2,max:Vec2}`. World possui `colliders:Aabb[]` e `bounds:Aabb`.

- [ ] **Step 1: Escrever o teste causal inicial e ler as dependências.**

```ts
import { it, expect } from 'vitest';
import { makeWorld, player, input, ticks } from '../../../tests/fixtures/world';
it('normaliza diagonais e não move o parceiro', () => {
  const a = makeWorld(); const b = makeWorld();
  player(a, 'p1').position = { x: 0, z: 0 };
  player(b, 'p1').position = { x: 0, z: 0 };
  const p2 = { ...player(a, 'p2').position };
  ticks(a, 60, { p1: input({ move: { x: 1, z: 0 } }) });
  ticks(b, 60, { p1: input({ move: { x: 1, z: 1 } }) });
  const distance = (w: typeof a) => Math.hypot(player(w, 'p1').position.x, player(w, 'p1').position.z);
  expect(distance(a)).toBeCloseTo(distance(b), 3);
  expect(player(a, 'p2').position).toEqual(p2);
});
```

- [ ] **Step 2: Executar o teste e registrar o RED real.**

```bash
npm run test:unit -- src/play/movement/movement.test.ts
```

Esperado antes da implementação: falha pela capacidade ausente ou comportamento incorreto descrito no teste. Registrar a causa; corrigir o ambiente quando a falha não for do contrato.

- [ ] **Step 3: Implementar a unidade e seus casos de borda.**

Baseline: velocidade 8 m/s, aceleração até 40 m/s², dash 18 m/s por 0,15 s, cooldown 1,4 s, raio 0,85 m. Valor inicial não equivale a sensação aprovada. Movimento em coordenadas do chão projetadas pelos eixos fixos da câmera. Normalizar input antes de aplicar aceleração. Integrar posição e resolver primeiro impacto, deslizar componente tangencial e permitir até 3 contatos por tick. Não bloquear aliados.
```ts
const length = Math.hypot(command.move.x, command.move.z);
const factor = length > 1 ? 1 / length : 1;
const desired = { x: command.move.x * factor * 8, z: command.move.z * factor * 8 };
```
Dash consome borda, não booleano repetido durante toda a sustentação do botão. Colisor varrido impede atravessar caixa fina. Acrescentar testes de parede frontal, deslizamento, quina, dash contra parede, jogador inicialmente sobreposto e input NaN sanitizado pelo boundary.

- [ ] **Step 4: Reexecutar, revisar e registrar o GREEN real.**

Repetir `npm run test:unit -- src/play/movement/movement.test.ts` e os testes dos consumidores alterados. Esperado: todos os casos desta tarefa e regressões afetadas passam. Em arte, executar também export/import e registrar imagens reais; validação de metadados sozinha não atesta aparência. No fim do marco, executar `npm run test:unit`, `npm run lint`, `npm run build` e o smoke do estado implementado. Não rodar a campanha longa a cada mudança mecânica.

**Aceite da unidade:** Dois jogadores se movem independentemente. Dash e diagonal não atravessam bordas; personagem não fica permanentemente preso em quinas.

- [ ] **Step 5: Persistir evidência e commit revisável.**

Registrar `docs/proofs/reboot/T04.md` e atualizar o ledger com arquivos/commit/resultado. Usar `git add --` apenas nos arquivos desta tarefa e seus consumidores justificados, nunca `git add .` sobre trabalho de terceiros. Depois:

```bash
git diff --cached --check
git diff --cached --stat
git commit -m "feat(nitrokats): complete T04"
```

O verbo do commit não substitui aceite: gate técnico ou humano ainda pendente permanece explícito no ledger. Nenhum push, merge ou publicação está autorizado por este passo.

---

## Task 05: Portar as três armas com dono e impactos corretos

**ID:** T05 · **Marco:** M1 · **Depende de:** T04

**Files:** **Criar:** `src/play/content/weapons.ts`, `src/play/combat/weapons.ts`, `src/play/combat/projectiles.ts`, `src/play/combat/damage.ts`, `src/play/combat/combat.test.ts`. **Modificar:** `src/play/core/model.ts`, `src/play/core/step.ts`.

**Interfaces:** Consome factories/PlayerId. Produz `applyDamage(world,targetId,amount,source): {applied:number;killed:boolean}`, `stepWeapons(world,input):void`, `stepProjectiles(world):void`. Source tem `{team:"players"|"enemies",ownerId:string}`. Projétil tem id, ownerId, team, position, previousPosition, velocity, damage e lifeSeconds.

- [ ] **Step 1: Escrever o teste causal inicial e ler as dependências.**

```ts
import { it, expect } from 'vitest';
import { applyDamage } from './damage';
import { spawnEnemy } from '../core/world';
import { makeWorld, player } from '../../../tests/fixtures/world';
it('não causa friendly fire nem credita uma morte duas vezes', () => {
  const w = makeWorld();
  const owner = { team: 'players' as const, ownerId: 'p1' };
  expect(applyDamage(w, 'p2', 40, owner).applied).toBe(0);
  expect(player(w, 'p2').hp).toBe(100);
  const id = spawnEnemy(w, { kind: 'runner', position: { x: 0, z: 4 }, hp: 10 });
  expect(applyDamage(w, id, 50, owner)).toEqual({ applied: 10, killed: true });
  expect(applyDamage(w, id, 50, owner)).toEqual({ applied: 0, killed: false });
});
```

- [ ] **Step 2: Executar o teste e registrar o RED real.**

```bash
npm run test:unit -- src/play/combat/combat.test.ts
```

Esperado antes da implementação: falha pela capacidade ausente ou comportamento incorreto descrito no teste. Registrar a causa; corrigir o ambiente quando a falha não for do contrato.

- [ ] **Step 3: Implementar a unidade e seus casos de borda.**

Copiar os valores observados de `src/game/config/weapons.ts`, trocar unidade do nome fireRate para shotIntervalSeconds e remover dependência de estado singleton. Todas as armas disponíveis via nextWeapon. Spawn de tiro usa origem do cano lógica e direção de aim; visual deve concordar depois com marcador GLB.
```ts
const hit = candidates.filter(h => h.t >= 0 && h.t <= 1)
  .sort((a, b) => a.t - b.t || a.id.localeCompare(b.id))[0];
```
`candidates` contém interseções segmento–círculo e segmento–AABB, com `t` normalizado. Parede ganha empate com alvo. Dano efetivo é `min(hpAnterior, danoAceito)` e morte só transita uma vez. Nunca dar dano novamente a entidade marcada morta no mesmo tick. Testar parede à frente do alvo, projétil rápido, colisão no primeiro tick, TTL, pausa, cooldown independente e troca de arma sem burlar cooldown. Pool máximo 256, sem alocação infinita; saturação tem contador e rejeição explícita, não NaN ou crash.

- [ ] **Step 4: Reexecutar, revisar e registrar o GREEN real.**

Repetir `npm run test:unit -- src/play/combat/combat.test.ts` e os testes dos consumidores alterados. Esperado: todos os casos desta tarefa e regressões afetadas passam. Em arte, executar também export/import e registrar imagens reais; validação de metadados sozinha não atesta aparência. No fim do marco, executar `npm run test:unit`, `npm run lint`, `npm run build` e o smoke do estado implementado. Não rodar a campanha longa a cada mudança mecânica.

**Aceite da unidade:** As três armas diferem de fato, cada jogador mantém seu cooldown e um projétil resolve no máximo um impacto direto.

- [ ] **Step 5: Persistir evidência e commit revisável.**

Registrar `docs/proofs/reboot/T05.md` e atualizar o ledger com arquivos/commit/resultado. Usar `git add --` apenas nos arquivos desta tarefa e seus consumidores justificados, nunca `git add .` sobre trabalho de terceiros. Depois:

```bash
git diff --cached --check
git diff --cached --stat
git commit -m "feat(nitrokats): complete T05"
```

O verbo do commit não substitui aceite: gate técnico ou humano ainda pendente permanece explícito no ledger. Nenhum push, merge ou publicação está autorizado por este passo.

---

## Task 06: Implementar queda, resgate e derrota cooperativa

**ID:** T06 · **Marco:** M1 · **Depende de:** T05

**Files:** **Criar:** `src/play/coop/revive.ts`, `src/play/coop/revive.test.ts`. **Modificar:** `src/play/combat/damage.ts`, `src/play/core/step.ts`, `src/play/core/model.ts`.

**Interfaces:** Produz `stepRevive(world,input):void` e `resolveRunOutcome(world):void`; aplica status active/down e campos downSeconds/reviveProgress da spec.

- [ ] **Step 1: Escrever o teste causal inicial e ler as dependências.**

```ts
import { it, expect } from 'vitest';
import { applyDamage } from '../combat/damage';
import { makeWorld, player, input, ticks } from '../../../tests/fixtures/world';
it('resgata o parceiro sem terminar a partida na primeira queda', () => {
  const w = makeWorld();
  player(w, 'p1').position = { x: 0, z: 0 };
  player(w, 'p2').position = { x: 1, z: 0 };
  applyDamage(w, 'p2', 100, { team: 'enemies', ownerId: 'e:test' });
  ticks(w, 1); expect(w.phase).toBe('playing');
  ticks(w, 121, { p1: input({ revive: true }) });
  expect(player(w, 'p2').status).toBe('active');
  expect(player(w, 'p2').hp).toBe(40);
});
```

- [ ] **Step 2: Executar o teste e registrar o RED real.**

```bash
npm run test:unit -- src/play/coop/revive.test.ts
```

Esperado antes da implementação: falha pela capacidade ausente ou comportamento incorreto descrito no teste. Registrar a causa; corrigir o ambiente quando a falha não for do contrato.

- [ ] **Step 3: Implementar a unidade e seus casos de borda.**

Implementar exatamente os tempos/range/HP da spec. Player caído não toma mais dano, não dispara, não atrai mira da AI como alvo ativo, mas continua no enquadramento. Movimento de arrasto 1,5 m/s. Invulnerabilidade é timer de simulação. `resolveRunOutcome` roda depois de aplicar todos os danos e resgates do tick, antes de conceder vitória.
```ts
const hasActive = world.players.some(p => p.status === 'active');
if (!hasActive) world.phase = 'lost';
```
Adicionar testes: ambos caem no mesmo tick; solo cai; resgate interrompido por distância ou soltura; resgate automático após 12 s com aliado ativo; pausa congela contagem; tiro aliado/splash não derruba; boss e último humano morrem juntos resultam em derrota. Não adicionar vidas ou moeda que não existem no design.

- [ ] **Step 4: Reexecutar, revisar e registrar o GREEN real.**

Repetir `npm run test:unit -- src/play/coop/revive.test.ts` e os testes dos consumidores alterados. Esperado: todos os casos desta tarefa e regressões afetadas passam. Em arte, executar também export/import e registrar imagens reais; validação de metadados sozinha não atesta aparência. No fim do marco, executar `npm run test:unit`, `npm run lint`, `npm run build` e o smoke do estado implementado. Não rodar a campanha longa a cada mudança mecânica.

**Aceite da unidade:** A primeira queda não transforma a partida coop em gameover. Não há espera interminável por resgate e nenhum timer usa relógio de parede.

- [ ] **Step 5: Persistir evidência e commit revisável.**

Registrar `docs/proofs/reboot/T06.md` e atualizar o ledger com arquivos/commit/resultado. Usar `git add --` apenas nos arquivos desta tarefa e seus consumidores justificados, nunca `git add .` sobre trabalho de terceiros. Depois:

```bash
git diff --cached --check
git diff --cached --stat
git commit -m "feat(nitrokats): complete T06"
```

O verbo do commit não substitui aceite: gate técnico ou humano ainda pendente permanece explícito no ledger. Nenhum push, merge ou publicação está autorizado por este passo.

---

## Task 07: Separar input físico de intenção e lidar com desconexão

**ID:** T07 · **Marco:** M1 · **Depende de:** T03,T06

**Files:** **Criar:** `src/play/input/InputHub.ts`, `src/play/input/gamepad.ts`, `src/play/input/keyboard.ts`, `src/play/input/bindings.ts`, `src/play/input/input.test.ts`. **Modificar:** `src/play/runtime/GameRuntime.ts`.

**Interfaces:** Produz `readStandardPad({axes,buttons}):PlayerInput`, `applyDeadzone(x,y,threshold):{x:number;y:number}`; InputHub tem `assign(slot,binding)`, `poll()`, `consumeFrame():InputFrame`, `clear()`, `dispose()`. Binding é discriminado entre gamepad, keyboard-mouse e keyboard-shared. Nome canônico do tipo de atribuição: `DeviceBinding`; `Binding` neste texto significa DeviceBinding. O menu recebe `MenuCommand={confirmPressed,backPressed,pausePressed,navX,navY}` separado de PlayerInput.

- [ ] **Step 1: Escrever o teste causal inicial e ler as dependências.**

```ts
import { it, expect } from 'vitest';
import { readStandardPad } from './gamepad';
it('ignora drift e não dispara sem botão', () => {
  const command = readStandardPad({ axes: [0.07, -0.05, 0, 0], buttons: [] });
  expect(command.move).toEqual({ x: 0, z: 0 });
  expect(command.fire).toBe(false);
  expect(command.dash).toBe(false);
});
```

- [ ] **Step 2: Executar o teste e registrar o RED real.**

```bash
npm run test:unit -- src/play/input/input.test.ts
```

Esperado antes da implementação: falha pela capacidade ausente ou comportamento incorreto descrito no teste. Registrar a causa; corrigir o ambiente quando a falha não for do contrato.

- [ ] **Step 3: Implementar a unidade e seus casos de borda.**

Usar os mapas de teclas da spec, não listeners por personagem. Gamepad é lido novamente por índice a cada poll; não manter snapshot do evento connected para sempre. Sanitizar eixos não finitos e buttons ausentes. `pressed` é comparação de estado anterior/atual; triggers usam valor acima de 0,25. `consumeFrame` consome bordas de dash/troca somente uma vez e mantém fire/revive sustentados.
```ts
const radius = Math.hypot(x, y);
if (!Number.isFinite(radius) || radius <= threshold) return { x: 0, y: 0 };
const scaled = Math.min(1, (radius - threshold) / (1 - threshold));
return { x: x / radius * scaled, y: y / radius * scaled };
```
A função acima é o corpo de applyDeadzone, com threshold validado no intervalo [0,1). Desconexão chama runtime.pause; novo device confirma slot antes de substituir. Blur/visibilitychange limpa teclas/mouse/edges e exige confirmação de resume. Menu aberto usa o mesmo polling, mas sua intenção não chega ao step. Testar dois devices com IDs iguais e índices distintos, índice reutilizado, gamepad já conectado ao carregar, null na lista e press/hold/release do Start.

- [ ] **Step 4: Reexecutar, revisar e registrar o GREEN real.**

Repetir `npm run test:unit -- src/play/input/input.test.ts` e os testes dos consumidores alterados. Esperado: todos os casos desta tarefa e regressões afetadas passam. Em arte, executar também export/import e registrar imagens reais; validação de metadados sozinha não atesta aparência. No fim do marco, executar `npm run test:unit`, `npm run lint`, `npm run build` e o smoke do estado implementado. Não rodar a campanha longa a cada mudança mecânica.

**Aceite da unidade:** P1 e P2 não recebem o mesmo comando por acidente. Reconnect não rouba slot nem despausa. Teclado compartilhado tem perfis reais e diagnóstico de ghosting.

- [ ] **Step 5: Persistir evidência e commit revisável.**

Registrar `docs/proofs/reboot/T07.md` e atualizar o ledger com arquivos/commit/resultado. Usar `git add --` apenas nos arquivos desta tarefa e seus consumidores justificados, nunca `git add .` sobre trabalho de terceiros. Depois:

```bash
git diff --cached --check
git diff --cached --stat
git commit -m "feat(nitrokats): complete T07"
```

O verbo do commit não substitui aceite: gate técnico ou humano ainda pendente permanece explícito no ledger. Nenhum push, merge ou publicação está autorizado por este passo.

---

## Task 08: Conectar simulação ao R3F com câmera compartilhada

**ID:** T08 · **Marco:** M1 · **Depende de:** T07

**Files:** **Criar:** `src/play/render/PlayScene.tsx`, `src/play/render/WorldView.tsx`, `src/play/render/SharedCamera.tsx`, `src/play/render/cameraMath.ts`, `src/play/render/cameraMath.test.ts`, `src/play/GameApp.tsx`. **Modificar:** `src/App.tsx`.

**Interfaces:** Produz `computeCameraFrame(points,aspect):{center:Vec2;halfHeight:number}`; GameApp monta uma sessão e um canvas. `?edition=reboot` habilita a nova edição em desenvolvimento e em build MODE=e2e durante migração.

- [ ] **Step 1: Escrever o teste causal inicial e ler as dependências.**

```ts
import { it, expect } from 'vitest';
import { computeCameraFrame, projectToFrame } from './cameraMath';
it('mantém os dois jogadores dentro da margem útil', () => {
  const points = [{ x: -10, z: -8 }, { x: 10, z: 8 }];
  for (const aspect of [16 / 9, 16 / 10, 4 / 3]) {
    const frame = computeCameraFrame(points, aspect);
    for (const point of points) {
      const ndc = projectToFrame(point, frame, aspect);
      expect(Math.abs(ndc.x)).toBeLessThanOrEqual(0.85);
      expect(Math.abs(ndc.y)).toBeLessThanOrEqual(0.85);
    }
  }
});
```

- [ ] **Step 2: Executar o teste e registrar o RED real.**

```bash
npm run test:unit -- src/play/render/cameraMath.test.ts
```

Esperado antes da implementação: falha pela capacidade ausente ou comportamento incorreto descrito no teste. Registrar a causa; corrigir o ambiente quando a falha não for do contrato.

- [ ] **Step 3: Implementar a unidade e seus casos de borda.**

`projectToFrame(point,frame,aspect):{x:number;y:number}` é também produzido nesta tarefa e usa os mesmos vetores right/up projetados do olhar isométrico fixo. Computar bounds no espaço de câmera e acrescentar raio de personagem e margem HUD. Centro suavizado com fator dependente de delta; zoom deve abrir rápido para não cortar jogador, fechar devagar.

Um único useFrame chama runtime.advance e atualiza refs/instâncias. React não recebe setState de posição por tick. Mesh é projeção, nunca posição usada para resolver dano. Fazer greybox próprio com gato geométrico, chassis e marcadores; manter os inimigos/tiros visíveis para testar interação. Montar apenas a edição escolhida para não duplicar listeners e AudioContexts. Adicionar fallback WebGL com mensagem útil e botão de voltar ao menu. Desmontagem chama dispose uma vez; StrictMode deve ser seguro.

O seletor de edição existe somente quando `import.meta.env.DEV || import.meta.env.MODE === "e2e"`; a condição deve ser estaticamente eliminável em build normal. T24 muda o default para a edição nova e remove import do legado da produção.

- [ ] **Step 4: Reexecutar, revisar e registrar o GREEN real.**

Repetir `npm run test:unit -- src/play/render/cameraMath.test.ts` e os testes dos consumidores alterados. Esperado: todos os casos desta tarefa e regressões afetadas passam. Em arte, executar também export/import e registrar imagens reais; validação de metadados sozinha não atesta aparência. No fim do marco, executar `npm run test:unit`, `npm run lint`, `npm run build` e o smoke do estado implementado. Não rodar a campanha longa a cada mudança mecânica.

**Aceite da unidade:** Câmera não é controlada por cada Player. Novo e legado nunca simulam ao mesmo tempo. O greybox mostra dois jogadores e tiros causalmente ligados ao core.

- [ ] **Step 5: Persistir evidência e commit revisável.**

Registrar `docs/proofs/reboot/T08.md` e atualizar o ledger com arquivos/commit/resultado. Usar `git add --` apenas nos arquivos desta tarefa e seus consumidores justificados, nunca `git add .` sobre trabalho de terceiros. Depois:

```bash
git diff --cached --check
git diff --cached --stat
git commit -m "feat(nitrokats): complete T08"
```

O verbo do commit não substitui aceite: gate técnico ou humano ainda pendente permanece explícito no ledger. Nenhum push, merge ou publicação está autorizado por este passo.

---

## Task 09: Construir lobby, HUD, seleção e treino utilizáveis

**ID:** T09 · **Marco:** M1 · **Depende de:** T08

**Files:** **Criar:** `src/play/ui/Lobby.tsx`, `src/play/ui/Hud.tsx`, `src/play/ui/PauseMenu.tsx`, `src/play/ui/MenuInput.ts`, `src/play/ui/uiStore.ts`, `tests/e2e/lobby.spec.ts`. **Modificar:** `src/play/GameApp.tsx`.

**Interfaces:** uiStore publica snapshot de runtime e estado de navegação; não grava HP. Lobby atribui PlayerConfig e DeviceBinding. P1 governa navegação global; cada jogador confirma seu próprio slot.

- [ ] **Step 1: Escrever o teste causal inicial e ler as dependências.**

```ts
import { test, expect } from '@playwright/test';
test('dupla entra pelo teclado compartilhado @smoke', async ({ page }) => {
  await page.goto('/?edition=reboot');
  await page.getByRole('button', { name: 'Jogar em dupla', exact: true }).click();
  await page.getByRole('button', { name: 'Teclado compartilhado', exact: true }).click();
  await page.getByRole('button', { name: 'P1 pronto', exact: true }).click();
  await page.getByRole('button', { name: 'P2 pronto', exact: true }).click();
  await page.getByRole('button', { name: 'Treinar', exact: true }).click();
  await expect(page.getByTestId('hud-p1')).toBeVisible();
  await expect(page.getByTestId('hud-p2')).toBeVisible();
});
```

- [ ] **Step 2: Executar o teste e registrar o RED real.**

```bash
npm run test:e2e -- tests/e2e/lobby.spec.ts
```

Esperado antes da implementação: falha pela capacidade ausente ou comportamento incorreto descrito no teste. Registrar a causa; corrigir o ambiente quando a falha não for do contrato.

- [ ] **Step 3: Implementar a unidade e seus casos de borda.**

Fluxo completo com opções em PT-BR. Em treino, gerar alvos e bot opcional sem dano; comandos reais são os mesmos do jogo. Os textos dos botões acima são contratos acessíveis. Cada slot mostra dispositivo, gato, arma, esquema de controles e status. Impedir iniciar com dispositivo sem confirmação ou com ambos vinculados ao mesmo gamepad. Permitir o mesmo catId para os dois.

HUD tem HP/arma/dash por slot e objetivo comum; na onda/aviso, não retornar uma UI alternativa que remove as barras. Pausa, continuar, reiniciar e menu têm foco visível e navegação por dispositivo; restart pede confirmação sem disparar no primeiro tick. Botão Voltar preserva configurações do lobby, mas não reaproveita estado de combate antigo. Aplique `aria-label` e nomes estáveis, não seletores CSS frágeis para E2E.

- [ ] **Step 4: Reexecutar, revisar e registrar o GREEN real.**

Repetir `npm run test:e2e -- tests/e2e/lobby.spec.ts` e os testes dos consumidores alterados. Esperado: todos os casos desta tarefa e regressões afetadas passam. Em arte, executar também export/import e registrar imagens reais; validação de metadados sozinha não atesta aparência. No fim do marco, executar `npm run test:unit`, `npm run lint`, `npm run build` e o smoke do estado implementado. Não rodar a campanha longa a cada mudança mecânica.

**Aceite da unidade:** Duas pessoas entram, escolhem aparência, treinam, pausam e recomeçam sem DevTools. O teclado não é obrigatório para quem entrou com gamepad.

- [ ] **Step 5: Persistir evidência e commit revisável.**

Registrar `docs/proofs/reboot/T09.md` e atualizar o ledger com arquivos/commit/resultado. Usar `git add --` apenas nos arquivos desta tarefa e seus consumidores justificados, nunca `git add .` sobre trabalho de terceiros. Depois:

```bash
git diff --cached --check
git diff --cached --stat
git commit -m "feat(nitrokats): complete T09"
```

O verbo do commit não substitui aceite: gate técnico ou humano ainda pendente permanece explícito no ledger. Nenhum push, merge ou publicação está autorizado por este passo.

---

## Task 10: Provar o primeiro encontro cooperativo antes da arte final

**ID:** T10 · **Marco:** M1 · **Depende de:** T09

**Files:** **Criar:** `tests/e2e/coop-slice.spec.ts`, `tests/e2e/support/virtualInput.ts`, `src/play/testing/TestBridge.ts`, `docs/proofs/reboot/M1-COOP.md`. **Modificar:** `src/play/GameApp.tsx`. **Também criar:** `src/play/testing/global.d.ts`. **Também modificar:** `playwright.config.ts`, `tests/e2e/legacy-smoke.spec.ts`. **Também modificar:** `package.json`.

**Interfaces:** TestBridge, apenas em modo e2e de build, expõe `setInput(slot,command)` e `snapshot()`. Não expõe vitória/teleport/invulnerabilidade. Entrada virtual substitui só o boundary de hardware e usa InputHub/runtime reais.

- [ ] **Step 1: Escrever o teste causal inicial e ler as dependências.**

```ts
import { test, expect } from '@playwright/test';
import { enterTraining, setInput, snapshot } from './support/virtualInput';
test('dois jogadores movem independentemente @smoke', async ({ page }) => {
  await enterTraining(page);
  const before = await snapshot(page);
  await setInput(page, 'p1', { move: { x: 1, z: 0 } });
  await expect.poll(async () => (await snapshot(page)).tick).toBeGreaterThan(before.tick + 20);
  await setInput(page, 'p1', { move: { x: 0, z: 0 } });
  const after = await snapshot(page);
  expect(after.players[0].position.x).toBeGreaterThan(before.players[0].position.x);
  expect(after.players[1].position).toEqual(before.players[1].position);
});
```

- [ ] **Step 2: Executar o teste e registrar o RED real.**

```bash
npm run test:e2e -- tests/e2e/coop-slice.spec.ts
```

Esperado antes da implementação: falha pela capacidade ausente ou comportamento incorreto descrito no teste. Registrar a causa; corrigir o ambiente quando a falha não for do contrato.

- [ ] **Step 3: Implementar a unidade e seus casos de borda.**

Criar `enterTraining(page)`, `setInput(page,slot,patch)` e `snapshot(page)` no helper declarado; setInput mescla campos com input neutro, nunca acessa a regra de movimento diretamente. Expor bridge somente quando `import.meta.env.MODE === 'e2e'`, usar build próprio desse modo; adicionar testes que o build normal não tem `window.__nitrokatsTest`.

Um teste de browser verifica tiros/HP reais e pause; o unitário T06 cobre resgate causal. No treino adicionar interação legítima “Simular queda” para aprender resgate, disponível visualmente e não para adulterar campanha. Registrar vídeo de controles, feedback e revive. Playtest com duas pessoas: conseguir mover/mirar/atirar, entender P1/P2, salvar parceiro e pedir revanche. Não multiplicar arenas antes de corrigir controle desagradável. Se falta hardware/pessoas, registrar o gate específico como pendente sem fabricar aprovação.

Atualizar webServer do Playwright para `npm run build -- --mode e2e` somente se o script repassar corretamente o modo ao Vite; como build atual é `tsc -b && vite build`, criar `build:e2e: "tsc -b && vite build --mode e2e --outDir dist-e2e"` e servir dist-e2e por preview com host 127.0.0.1 e porta 4173. Declarar Window.__nitrokatsTest em global.d.ts com métodos tipados. Smoke do legado usa `/?edition=legacy`; suite da nova edição usa `/?edition=reboot`. Não produzir distribuição do usuário a partir de dist-e2e.

Comando final do webServer: `npm run build:e2e && npm run preview -- --outDir dist-e2e --host 127.0.0.1 --port 4173 --strictPort`. Não usar `npm run build -- --mode e2e` com o script encadeado atual. Type global tem interface TestBridge com setInput(slot:PlayerId,frame:PlayerInput):void e snapshot():TestSnapshot; TestSnapshot é DTO somente-leitura, sem métodos do World.

- [ ] **Step 4: Reexecutar, revisar e registrar o GREEN real.**

Repetir `npm run test:e2e -- tests/e2e/coop-slice.spec.ts` e os testes dos consumidores alterados. Esperado: todos os casos desta tarefa e regressões afetadas passam. Em arte, executar também export/import e registrar imagens reais; validação de metadados sozinha não atesta aparência. No fim do marco, executar `npm run test:unit`, `npm run lint`, `npm run build` e o smoke do estado implementado. Não rodar a campanha longa a cada mudança mecânica.

**Aceite da unidade:** Existe uma fatia jogável verificável, não só arquitetura. Gate humano de sensação é separado da suíte e o teste não injeta um resultado vencedor.

- [ ] **Step 5: Persistir evidência e commit revisável.**

Registrar `docs/proofs/reboot/T10.md` e atualizar o ledger com arquivos/commit/resultado. Usar `git add --` apenas nos arquivos desta tarefa e seus consumidores justificados, nunca `git add .` sobre trabalho de terceiros. Depois:

```bash
git diff --cached --check
git diff --cached --stat
git commit -m "feat(nitrokats): complete T10"
```

O verbo do commit não substitui aceite: gate técnico ou humano ainda pendente permanece explícito no ledger. Nenhum push, merge ou publicação está autorizado por este passo.

---

## Task 11: Dar comportamento legível aos três inimigos

**ID:** T11 · **Marco:** M2 · **Depende de:** T10

**Files:** **Criar:** `src/play/ai/navigation.ts`, `src/play/ai/enemies.ts`, `src/play/content/enemies.ts`, `src/play/ai/navigation.test.ts`. **Modificar:** `src/play/core/step.ts`.

**Interfaces:** Produz `buildNavGrid(bounds,colliders,cellSize):NavGrid`, `findPath(grid,start,end):Vec2[]`, `stepEnemies(world):void`. Na campanha solo, o alvo da AI é P1 ativo. O desempate entre jogadores da base técnica só volta a ser gate na fase de P2.

- [ ] **Step 1: Escrever o teste causal inicial e ler as dependências.**

```ts
import { it, expect } from 'vitest';
import { buildNavGrid, findPath } from './navigation';
it('contorna cobertura em vez de ficar preso atrás dela', () => {
  const grid = buildNavGrid({ min: { x: -8, z: -8 }, max: { x: 8, z: 8 } },
    [{ min: { x: -1, z: -3 }, max: { x: 1, z: 3 } }], 1);
  const path = findPath(grid, { x: -5, z: 0 }, { x: 5, z: 0 });
  expect(path.length).toBeGreaterThan(2);
  expect(path.some(p => Math.abs(p.z) > 3)).toBe(true);
  expect(path.at(-1)).toEqual({ x: 5, z: 0 });
});
```

- [ ] **Step 2: Executar o teste e registrar o RED real.**

```bash
npm run test:unit -- src/play/ai/navigation.test.ts
```

Esperado antes da implementação: falha pela capacidade ausente ou comportamento incorreto descrito no teste. Registrar a causa; corrigir o ambiente quando a falha não for do contrato.

- [ ] **Step 3: Implementar a unidade e seus casos de borda.**

Grid de 1 m, células bloqueadas expandidas pelo raio do inimigo. A* com desempate determinístico; sem diagonal atravessando duas células bloqueadas. Recalcular no máximo 5 vezes/s por entidade, escalonado por ID; só perseguir jogadores ativos. Arena sem caminho válido deve falhar validação de conteúdo, não resolver por teleport silencioso.

Runner: velocidade 4,2; contato 12 de dano com intervalo 0,8 s. Gunner: velocidade 2,5, distância desejada 8 m, aviso de 0,6 s antes de tiro. Brute: velocidade 1,8, preparação 0,8 s, investida de 0,5 s e recuperação 1 s. São parâmetros iniciais. Spawn tem aviso visual de 0,75 s, fica fora de um raio de 5 m de qualquer jogador e não atira durante materialização. Se todos pontos estiverem inválidos, adiar spawn; não surgir dentro do jogador para cumprir quota.

- [ ] **Step 4: Reexecutar, revisar e registrar o GREEN real.**

Repetir `npm run test:unit -- src/play/ai/navigation.test.ts` e os testes dos consumidores alterados. Esperado: todos os casos desta tarefa e regressões afetadas passam. Em arte, executar também export/import e registrar imagens reais; validação de metadados sozinha não atesta aparência. No fim do marco, executar `npm run test:unit`, `npm run lint`, `npm run build` e o smoke do estado implementado. Não rodar a campanha longa a cada mudança mecânica.

**Aceite da unidade:** Inimigos alcançam P1, respeitam cobertura e não atacam durante aviso/spawn. AI não continua mirando P1 após a derrota. Testar com uma run contendo apenas P1.

- [ ] **Step 5: Persistir evidência e commit revisável.**

Registrar `docs/proofs/reboot/T11.md` e atualizar o ledger com arquivos/commit/resultado. Usar `git add --` apenas nos arquivos desta tarefa e seus consumidores justificados, nunca `git add .` sobre trabalho de terceiros. Depois:

```bash
git diff --cached --check
git diff --cached --stat
git commit -m "feat(nitrokats): complete T11"
```

O verbo do commit não substitui aceite: gate técnico ou humano ainda pendente permanece explícito no ledger. Nenhum push, merge ou publicação está autorizado por este passo.

---

## Task 12: Criar campanha com objetivos que dependem do que se faz

**ID:** T12 · **Marco:** M2 · **Depende de:** T11

**Files:** **Criar:** `src/play/campaign/director.ts`, `src/play/campaign/objectives.ts`, `src/play/content/levels.ts`, `src/play/campaign/objectives.test.ts`. **Modificar:** `src/play/core/world.ts`, `src/play/core/step.ts`.

**Interfaces:** Produz `startEncounter(world,definition):void`, `stepObjective(world):void`, `advanceStage(world):void`; encounter registra IDs emitidos, quota, emitidos, derrotados e requiredBossId. `setLevel(world,levelId)` instala bounds/colliders/markers.

- [ ] **Step 1: Escrever o teste causal inicial e ler as dependências.**

```ts
import { it, expect } from 'vitest';
import { stepObjective, startEncounter } from './objectives';
import { makeWorld, player, ticks } from '../../../tests/fixtures/world';
it('não defende zona estando fora dela', () => {
  const w = makeWorld({ players: [{ id: 'p1', catId: 'anakin', weaponId: 'pulse_rifle' }] });
  startEncounter(w, { type: 'defend', center: { x: 0, z: 0 }, radius: 4, requiredSeconds: 45 });
  player(w, 'p1').position = { x: 10, z: 10 };
  ticks(w, 120); stepObjective(w);
  expect(w.encounter?.progressSeconds).toBe(0);
  player(w, 'p1').position = { x: 0, z: 0 };
  ticks(w, 120);
  expect(w.encounter?.progressSeconds).toBeCloseTo(2);
});
```

- [ ] **Step 2: Executar o teste e registrar o RED real.**

```bash
npm run test:unit -- src/play/campaign/objectives.test.ts
```

Esperado antes da implementação: falha pela capacidade ausente ou comportamento incorreto descrito no teste. Registrar a causa; corrigir o ambiente quando a falha não for do contrato.

- [ ] **Step 3: Implementar a unidade e seus casos de borda.**

`startEncounter` mora em objectives.ts e é reexportado por director.ts se necessário, nunca duas implementações. Definition é união discriminada: eliminate(total), defend(center,radius,requiredSeconds), boss(requiredKind). Apenas director emite spawns; apenas objectives muda progresso; step chama cada sistema uma vez.

Eliminação exige IDs/quota real e zero sobreviventes; defesa aplica ocupação por P1 ativo e contestação por inimigo. Sem spawn em treino. Concluir defesa para de gerar inimigos, mas mantém cleanup antes de intermission. Boss ausente com requiredBossId null nunca completa. Mudar arena limpa projéteis/encontros, reposiciona P1 e mantém HP/perks/arma. Usar layouts greybox de 32×24 m inicialmente para caberem na câmera. Bounds, colisores e spawn points vêm do mesmo LevelDefinition consumido pelo render; não duplicar números no JSX. A campanha da v1 é criada com um único P1.

Adicionar testes do bug legado: elite obrigatório ainda não nasceu; array vazio antes do primeiro spawn; timer sozinho; zona contestada; pause; sair/voltar; limpar último inimigo durante objetivo; troca de fase idempotente.

- [ ] **Step 4: Reexecutar, revisar e registrar o GREEN real.**

Repetir `npm run test:unit -- src/play/campaign/objectives.test.ts` e os testes dos consumidores alterados. Esperado: todos os casos desta tarefa e regressões afetadas passam. Em arte, executar também export/import e registrar imagens reais; validação de metadados sozinha não atesta aparência. No fim do marco, executar `npm run test:unit`, `npm run lint`, `npm run build` e o smoke do estado implementado. Não rodar a campanha longa a cada mudança mecânica.

**Aceite da unidade:** Objetivo de defesa é uma tarefa espacial real. Progressão tem começo, fim e evidência causal, sem completar por ausência inicial de inimigos.

- [ ] **Step 5: Persistir evidência e commit revisável.**

Registrar `docs/proofs/reboot/T12.md` e atualizar o ledger com arquivos/commit/resultado. Usar `git add --` apenas nos arquivos desta tarefa e seus consumidores justificados, nunca `git add .` sobre trabalho de terceiros. Depois:

```bash
git diff --cached --check
git diff --cached --stat
git commit -m "feat(nitrokats): complete T12"
```

O verbo do commit não substitui aceite: gate técnico ou humano ainda pendente permanece explícito no ledger. Nenhum push, merge ou publicação está autorizado por este passo.

---

## Task 13: Implementar chefe com duas fases e vitória verdadeira

**ID:** T13 · **Marco:** M2 · **Depende de:** T12

**Files:** **Criar:** `src/play/ai/boss.ts`, `src/play/ai/boss.test.ts`. **Modificar:** `src/play/campaign/director.ts`, `src/play/coop/revive.ts`, `src/play/render/WorldView.tsx`.

**Interfaces:** Produz `stepBoss(world,boss):void` e estado de boss `{phase:1|2,attack:"fan"|"charge"|"summon",state:"telegraph"|"active"|"recovery",seconds:number}`; requiredBossId aponta para a instância emitida.

- [ ] **Step 1: Escrever o teste causal inicial e ler as dependências.**

```ts
import { it, expect } from 'vitest';
import { makeWorld, ticks } from '../../../tests/fixtures/world';
import { startEncounter } from '../campaign/objectives';
import { spawnEnemy } from '../core/world';
import { applyDamage } from '../combat/damage';
it('ausência inicial não vence; derrotar o boss registrado vence', () => {
  const w = makeWorld({ players: [{ id: 'p1', catId: 'anakin', weaponId: 'pulse_rifle' }] }); w.stageIndex = 2;
  startEncounter(w, { type: 'boss', requiredKind: 'mechacat' });
  ticks(w, 1); expect(w.phase).not.toBe('won');
  const id = spawnEnemy(w, { kind: 'mechacat', position: { x: 0, z: 8 }, hp: 10 });
  w.encounter!.requiredBossId = id;
  applyDamage(w, id, 10, { team: 'players', ownerId: 'p1' });
  ticks(w, 1); expect(w.phase).toBe('won');
});
```

- [ ] **Step 2: Executar o teste e registrar o RED real.**

```bash
npm run test:unit -- src/play/ai/boss.test.ts
```

Esperado antes da implementação: falha pela capacidade ausente ou comportamento incorreto descrito no teste. Registrar a causa; corrigir o ambiente quando a falha não for do contrato.

- [ ] **Step 3: Implementar a unidade e seus casos de borda.**

Ciclo fase 1: leque de 5 tiros com preparação 0,9 s; recuperação 1,2 s; investida em linha com preparação 1 s, ataque 0,5 s e recuperação 1,5 s. Aos 50% de HP, interromper ataque com transição de 1 s, limpar projéteis perigosos do ataque anterior e iniciar fase 2. Fase 2 mantém telegraphs, aumenta leque para 7 e convoca no máximo 4 runners, respeitando cap global. Na v1 o único alvo é P1 ativo; não trocar alvo instantaneamente após telegraph travado.

Geometria de ameaça no chão deriva dos mesmos parâmetros/área que causam dano. Boss não causa dano de ataque durante telegraph. Morte emite evento uma vez; limita spawns, encerra combate e abre resultado somente depois da resolução de derrota do tick. Testar fase única aos 50%, hit repetido, boss sem alvo, maxActive, telegraph e empate boss/P1. A vitória ocorre numa run solo completa, sem P2 ou resgate.

- [ ] **Step 4: Reexecutar, revisar e registrar o GREEN real.**

Repetir `npm run test:unit -- src/play/ai/boss.test.ts` e os testes dos consumidores alterados. Esperado: todos os casos desta tarefa e regressões afetadas passam. Em arte, executar também export/import e registrar imagens reais; validação de metadados sozinha não atesta aparência. No fim do marco, executar `npm run test:unit`, `npm run lint`, `npm run build` e o smoke do estado implementado. Não rodar a campanha longa a cada mudança mecânica.

**Aceite da unidade:** O jogador consegue entender, desviar e aproveitar a recuperação. Chefe derrotado gera final, não outra onda infinita.

- [ ] **Step 5: Persistir evidência e commit revisável.**

Registrar `docs/proofs/reboot/T13.md` e atualizar o ledger com arquivos/commit/resultado. Usar `git add --` apenas nos arquivos desta tarefa e seus consumidores justificados, nunca `git add .` sobre trabalho de terceiros. Depois:

```bash
git diff --cached --check
git diff --cached --stat
git commit -m "feat(nitrokats): complete T13"
```

O verbo do commit não substitui aceite: gate técnico ou humano ainda pendente permanece explícito no ledger. Nenhum push, merge ou publicação está autorizado por este passo.

---

## Task 14: Portar perks de P1 com escolha que pausa a campanha

**ID:** T14 · **Marco:** M2 · **Depende de:** T13

**Files:** **Criar:** `src/play/content/perks.ts`, `src/play/campaign/perks.ts`, `src/play/campaign/perks.test.ts`, `src/play/ui/PerkSelection.tsx`. **Modificar:** `src/play/combat/weapons.ts`, `src/play/combat/damage.ts`, `src/play/ui/MenuInput.ts`. **Também modificar:** `src/play/core/model.ts`.

**Interfaces:** Produz `rollPerks(world,playerId):PerkId[]`, `choosePerk(world,playerId,perkId):boolean`, `getPlayerModifiers(player):Modifiers`; PerkId é união dos seis IDs da spec.

- [ ] **Step 1: Escrever o teste causal inicial e ler as dependências.**

```ts
import { it, expect } from 'vitest';
import { rollPerks, choosePerk } from './perks';
import { makeWorld, player } from '../../../tests/fixtures/world';
it('a melhoria de P1 não duplica', () => {
  const w = makeWorld({ players: [{ id: 'p1', catId: 'anakin', weaponId: 'pulse_rifle' }] }); w.phase = 'intermission';
  const options = rollPerks(w, 'p1');
  expect(new Set(options).size).toBe(3);
  const picked = options[0];
  expect(choosePerk(w, 'p1', picked)).toBe(true);
  expect(choosePerk(w, 'p1', picked)).toBe(false);
  expect(w.phase).toBe('intermission');
});
```

- [ ] **Step 2: Executar o teste e registrar o RED real.**

```bash
npm run test:unit -- src/play/campaign/perks.test.ts
```

Esperado antes da implementação: falha pela capacidade ausente ou comportamento incorreto descrito no teste. Registrar a causa; corrigir o ambiente quando a falha não for do contrato.

- [ ] **Step 3: Implementar a unidade e seus casos de borda.**

Portar os seis IDs lidos em `src/game/config/perks.ts` e aplicar exatamente a semântica da spec. Opções sorteadas sem reposição com RNG do mundo. Server não existe: a autoridade é o core local. Rejeitar perk fora das opções de P1, opção duplicada e escolha fora de intermission. A seleção solo deve funcionar sem P2 presente; manter o contrato tipado por PlayerId para uso futuro.

O painel de P1 recebe foco do dispositivo usado na campanha. Ao confirmar, `advanceStage` ocorre uma única vez; não aguardar confirmação de P2. Core continua pausado durante escolha. Testar fortified em HP parcial, vampiric em overkill, shockwave sem recursão, intervalos reais após rapid_loader e stabilizer alterando dispersão. O teste de escolhas paralelas em dois controles fica para P2 futuro.

Declarar PerkId em content/perks.ts como união literal dos seis IDs; PlayerState.perks e World.perkOptions usam PerkId, não string arbitrária. Modifiers declara shotIntervalMultiplier, damageMultiplier, projectileSpeedMultiplier, maxHealthBonus, lifeSteal, recoilMultiplier, spreadMultiplier e splashDamage com defaults explícitos 1 para multiplicadores e 0 para bônus.
- [ ] **Step 4: Reexecutar, revisar e registrar o GREEN real.**

Repetir `npm run test:unit -- src/play/campaign/perks.test.ts` e os testes dos consumidores alterados. Esperado: todos os casos desta tarefa e regressões afetadas passam. Em arte, executar também export/import e registrar imagens reais; validação de metadados sozinha não atesta aparência. No fim do marco, executar `npm run test:unit`, `npm run lint`, `npm run build` e o smoke do estado implementado. Não rodar a campanha longa a cada mudança mecânica.

**Aceite da unidade:** Perks fazem diferença mensurável, descrição coincide com matemática e a campanha solo só continua após a escolha de P1.

- [ ] **Step 5: Persistir evidência e commit revisável.**

Registrar `docs/proofs/reboot/T14.md` e atualizar o ledger com arquivos/commit/resultado. Usar `git add --` apenas nos arquivos desta tarefa e seus consumidores justificados, nunca `git add .` sobre trabalho de terceiros. Depois:

```bash
git diff --cached --check
git diff --cached --stat
git commit -m "feat(nitrokats): complete T14"
```

O verbo do commit não substitui aceite: gate técnico ou humano ainda pendente permanece explícito no ledger. Nenhum push, merge ou publicação está autorizado por este passo.

---

## Task 15: Fechar menus, acessibilidade e configuração da experiência

**ID:** T15 · **Marco:** M2 · **Depende de:** T14

**Files:** **Criar:** `src/play/ui/Settings.tsx`, `src/play/ui/Results.tsx`, `src/play/ui/Tutorial.tsx`, `src/play/settings/model.ts`, `tests/e2e/menus.spec.ts`. **Modificar:** `src/play/GameApp.tsx`, `src/play/ui/Hud.tsx`.

**Interfaces:** Produz `SettingsV1` com quality, musicVolume, effectsVolume, uiVolume, shake, bloom, hudScale, aimAssistByPlayer, bindings; a UI de produção edita apenas P1 e é navegável sem mouse se gamepad de P1 for oferecido.

- [ ] **Step 1: Escrever o teste causal inicial e ler as dependências.**

```ts
import { test, expect } from '@playwright/test';
test('pausa em solo volta ao HUD sem reiniciar @smoke', async ({ page }) => {
  await page.goto('/?edition=reboot');
  await page.getByRole('button', { name: 'Jogar', exact: true }).click();
  await page.getByRole('button', { name: 'Treinar', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'Pausado', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await expect(page.getByTestId('hud-p1')).toBeVisible();
});
```

- [ ] **Step 2: Executar o teste e registrar o RED real.**

```bash
npm run test:e2e -- tests/e2e/menus.spec.ts
```

Esperado antes da implementação: falha pela capacidade ausente ou comportamento incorreto descrito no teste. Registrar a causa; corrigir o ambiente quando a falha não for do contrato.

- [ ] **Step 3: Implementar a unidade e seus casos de borda.**

Settings ficam inicialmente em memória; persistência vem na T22. Unificar textos PT-BR, foco visível e estados disabled/loading/erro. HUD de produção mostra apenas P1 com sinais que não dependem só de cor. Pausa oferece continuar, opções, reiniciar e sair com confirmação. Resultado mostra vitória/derrota, tempo e objetivos de P1, com revanche em até duas confirmações. Remover “Jogar em dupla” e seleção de P2 da navegação de produção; preservar o caminho técnico existente só para desenvolvimento/teste futuro, sem promover coop ao release.

Treino ensina movimento → mira/tiro → dash; pode ser ignorado e repetido pelo menu. Resgate de parceiro sai do tutorial de produção. Não exigir mouse quando P1 escolheu gamepad. Testar 1280×720, 1920×1080 e 1440×900; reduzir movimento e brilho não remove sinais essenciais de perigo. Nenhuma configuração pode alterar dano/cap de inimigos exceto dificuldade escolhida antes da run.

Resultados expõem `data-testid="completed-arenas"` e o texto `3 de 3` na vitória; título exato `Vitória!`; revanche usa o botão `Jogar novamente` e abre lobby com configurações anteriores confirmáveis. O teste T23 confirma iniciar a mesma campanha a partir desse lobby antes de esperar a primeira arena. Ao entrar na arena, anunciar seu nome em heading acessível por 2 s sem remover HUD.

- [ ] **Step 4: Reexecutar, revisar e registrar o GREEN real.**

Repetir `npm run test:e2e -- tests/e2e/menus.spec.ts` e os testes dos consumidores alterados. Esperado: todos os casos desta tarefa e regressões afetadas passam. Em arte, executar também export/import e registrar imagens reais; validação de metadados sozinha não atesta aparência. No fim do marco, executar `npm run test:unit`, `npm run lint`, `npm run build` e o smoke do estado implementado. Não rodar a campanha longa a cada mudança mecânica.

**Aceite da unidade:** P1 navega sozinho por menus, campanha, resultado e revanche com o dispositivo oferecido. A UI de produção não promete dupla nem exige P2 para avançar.

- [ ] **Step 5: Persistir evidência e commit revisável.**

Registrar `docs/proofs/reboot/T15.md` e atualizar o ledger com arquivos/commit/resultado. Usar `git add --` apenas nos arquivos desta tarefa e seus consumidores justificados, nunca `git add .` sobre trabalho de terceiros. Depois:

```bash
git diff --cached --check
git diff --cached --stat
git commit -m "feat(nitrokats): complete T15"
```

O verbo do commit não substitui aceite: gate técnico ou humano ainda pendente permanece explícito no ledger. Nenhum push, merge ou publicação está autorizado por este passo.

---

## Task 16: Validar a ponte Blender, o contrato de asset e a segurança do MCP

**ID:** T16 · **Marco:** M3 · **Depende de:** T10, T12

**Files:** **Criar:** `tools/blender/scene_contract.py`, `tools/blender/test_scene_contract.py`, `tools/blender/probe_pipeline.py`, `art/ASSET_MANIFEST.json`, `docs/proofs/reboot/BLENDER-PREFLIGHT.md`.

**Interfaces:** Produz `validate_report(report:dict)->list[str]` e relatório JSON `{id,license,source,export,nodes,clips,triangles,materials,textures}`. O probe produz um GLB temporário com eixos e marcador; não escreve fontes finais.

- [ ] **Step 1: Escrever o teste causal inicial e ler as dependências.**

```python
import unittest
from scene_contract import validate_report

class SceneContractTest(unittest.TestCase):
    def report(self):
        return {"id": "cat-microkart", "license": "original",
                "source": "art/source/characters/cat-base.blend",
                "export": "public/assets/characters/cat-microkart.glb",
                "nodes": ["root", "body", "turret", "muzzle", "wheel_fl",
                          "wheel_fr", "wheel_rl", "wheel_rr"],
                "clips": ["idle", "hit", "celebrate"],
                "triangles": 11000, "materials": 4, "textures": [1024]}

    def test_missing_muzzle_is_rejected(self):
        report = self.report()
        report["nodes"].remove("muzzle")
        self.assertIn("missing-node:muzzle", validate_report(report))

    def test_missing_license_is_rejected(self):
        report = self.report()
        report["license"] = ""
        self.assertIn("missing-license", validate_report(report))

    def test_complete_report_passes(self):
        self.assertEqual(validate_report(self.report()), [])
```

- [ ] **Step 2: Executar o teste e registrar o RED real.**

```bash
python3 -m unittest discover -s tools/blender -p "test_*.py"
```

Esperado antes da implementação: falha pela capacidade ausente ou comportamento incorreto descrito no teste. Registrar a causa; corrigir o ambiente quando a falha não for do contrato.

- [ ] **Step 3: Implementar a unidade e seus casos de borda.**

Primeiro registrar executável/version do Blender existente, sem instalar por conta própria. Baseline de referência: Blender 4.5.14 LTS. Outra versão já instalada só é adotada depois de passar o mesmo probe e registrar diferenças. O pacote não presume um Blender ou MCP disponível.

O MCP comunitário verificado é `ahujasid/mcp-for-blender`. Antes de ativar: fixar commit e versão no preflight, revisar addon/servidor, limitar socket a loopback, desativar telemetria e manter apenas um escritor. Não alterar configuração global do cliente sem autorização. Não executar scripts recebidos em packs, habilitar auto-run de arquivos desconhecidos, baixar executáveis ou usar geração paga. Falta de MCP não impede a rota `bpy`/CLI quando Blender existe.

Implementar validate_report com regras explícitas: licença não vazia com evidência no manifesto; caminhos relativos sem `..`; nós/ações obrigatórios para cat-microkart; triângulos <=12000, materiais <=4, nenhuma textura >2048. Report de outros IDs usa regras da categoria, não exige muzzle de parede. Testar limites exatos e um acima; a prova de licença é documental, não inferida da string.

Probe cria somente em diretório temporário um cubo de 1 m, seta frontal e empty `muzzle`; exporta GLB e inspeciona com Three em uma página de diagnóstico. Confirmar que -Y do Blender vira +Z do runtime e +Z vira +Y. Não copiar cegamente enums de outra versão do exportador: consultar RNA local de `bpy.ops.export_scene.gltf` e guardar opções efetivamente usadas.

```bash
"$BLENDER_BIN" --background --factory-startup --disable-autoexec \
  --python tools/blender/probe_pipeline.py -- --out artifacts/blender-probe
```

`probe_pipeline.py` deve ler argumentos depois de `--`, criar o destino, falhar com exit code não zero para erro e não sobrescrever fonte externa. Registrar versões/commit/opções, screenshot com escala e teste positivo de leitura do GLB. Se Blender faltar, marcar somente esta dependência bloqueada; seguir trabalho de gameplay independente e não substituir arte final por placeholder silencioso.

No cliente MCP, fixar `BLENDER_HOST=localhost`, `BLENDER_MCP_SAFE_MODE=1` e `DISABLE_TELEMETRY=true` quando suportados pela revisão escolhida. Safe mode é defesa adicional, não sandbox completo nem permissão para abrir a porta na rede.

- [ ] **Step 4: Reexecutar, revisar e registrar o GREEN real.**

Repetir `python3 -m unittest discover -s tools/blender -p "test_*.py"` e os testes dos consumidores alterados. Esperado: todos os casos desta tarefa e regressões afetadas passam. Em arte, executar também export/import e registrar imagens reais; validação de metadados sozinha não atesta aparência. No fim do marco, executar `npm run test:unit`, `npm run lint`, `npm run build` e o smoke do estado implementado. Não rodar a campanha longa a cada mudança mecânica.

**Aceite da unidade:** Uma exportação real abre no renderer com escala, eixos e marcador corretos. Configuração MCP só é declarada pronta após conexão e operação verificadas.

- [ ] **Step 5: Persistir evidência e commit revisável.**

Registrar `docs/proofs/reboot/T16.md` e atualizar o ledger com arquivos/commit/resultado. Usar `git add --` apenas nos arquivos desta tarefa e seus consumidores justificados, nunca `git add .` sobre trabalho de terceiros. Depois:

```bash
git diff --cached --check
git diff --cached --stat
git commit -m "feat(nitrokats): complete T16"
```

O verbo do commit não substitui aceite: gate técnico ou humano ainda pendente permanece explícito no ledger. Nenhum push, merge ou publicação está autorizado por este passo.

---

## Task 17: Produzir o gato-microkart editável e as quatro aparências

**ID:** T17 · **Marco:** M3 · **Depende de:** T16

**Files:** **Criar:** `art/source/characters/cat-base.blend`, `art/source/vehicles/microkart.blend`, `tools/blender/export_assets.py`, `tools/blender/validate_scene.py`, `tools/blender/render_previews.py`, `tools/blender/test_export_policy.py`, `public/assets/characters/cat-microkart.glb`. **Modificar:** `art/ASSET_MANIFEST.json`.

**Interfaces:** Produz GLB com nós e clips exigidos, materiais `fur`, `bodywork`, `eyes`, `details`, e quatro variantes de pelagem por textura/material controladas pelo CatId. Exportação recebe `--source`, `--out`, `--report`; nenhuma transformação altera a fonte sem salvar uma revisão explícita.

- [ ] **Step 1: Escrever o teste causal inicial e ler as dependências.**

```python
import tempfile
import unittest
from pathlib import Path
from export_assets import validate_output_paths

class ExportPolicyTest(unittest.TestCase):
    def test_export_cannot_overwrite_source(self):
        with tempfile.TemporaryDirectory() as folder:
            source = Path(folder) / "cat.blend"
            source.write_bytes(b"source-preserved")
            with self.assertRaises(ValueError):
                validate_output_paths(source, source)
            self.assertEqual(source.read_bytes(), b"source-preserved")
```

- [ ] **Step 2: Executar o teste e registrar o RED real.**

```bash
python3 -m unittest discover -s tools/blender -p "test_*.py"
```

Esperado antes da implementação: falha pela capacidade ausente ou comportamento incorreto descrito no teste. Registrar a causa; corrigir o ambiente quando a falha não for do contrato.

- [ ] **Step 3: Implementar a unidade e seus casos de borda.**

Manter `export_assets.py` importável sem bpy: funções de política no topo, `import bpy` apenas no caminho executado dentro do Blender. `validate_output_paths(source,out)` compara caminhos resolvidos, exige `.blend` na fonte, `.glb` no destino e rejeita symlink que retorne à fonte. Exportar via arquivo temporário e substituir apenas o destino previsto depois de validar.

Construção artística: chassis de 2,2 m por 1,4 m, quatro rodas legíveis, gato sentado com cabeça grande, orelhas e cauda; não desenhar o herói como um cubo com textura de rosto. Origem ao nível do chão; turret separado; `muzzle` aponta para a frente do cano. Fur: laranja listrado, branco, frajola e preto, com contraste suficiente no ambiente. Não transformar diferenças cosméticas em hitboxes diferentes.

Fonte do gato e do veículo são separadas e compostas na cena de exportação sem empacotar dependência absoluta da máquina. Texturas locais e materiais PBR simples; evitar modifiers não suportados sem aplicar na cópia de export. Criar clips de animação rígida `idle`, `hit`, `celebrate`; não prometer skinning/rig de caminhada que o microkart não usa.

```bash
"$BLENDER_BIN" --background --disable-autoexec art/source/characters/cat-base.blend \
  --python tools/blender/export_assets.py -- \
  --source art/source/characters/cat-base.blend \
  --out public/assets/characters/cat-microkart.glb \
  --report artifacts/assets/cat-microkart.json
```

`validate_scene.py` extrai nomes, bounds, triângulos após avaliação, materiais, imagens e clips e chama o contrato da T16. `render_previews.py` gera frontal/lateral/3-4/traseira com uma configuração de luz neutra versionada. Exportador aplica os parâmetros confirmados pelo probe, não uma lista de flags presumidas. Repetir import/render com as quatro variantes e conferir cada uma na escala real de gameplay solo. O teste de duas instâncias simultâneas pode preservar a compatibilidade existente, mas não é gate do release P1. Comparar semanticamente nomes/dimensões/conteúdo entre exportações, não exigir bytes idênticos entre versões.

Para assets originais registrar autoria humana/assistida e ferramentas usadas, sem fabricar licença CC0. Preservar `.blend` editado manualmente; um novo script procedural nunca o substitui automaticamente.

- [ ] **Step 4: Reexecutar, revisar e registrar o GREEN real.**

Repetir `python3 -m unittest discover -s tools/blender -p "test_*.py"` e os testes dos consumidores alterados. Esperado: todos os casos desta tarefa e regressões afetadas passam. Em arte, executar também export/import e registrar imagens reais; validação de metadados sozinha não atesta aparência. No fim do marco, executar `npm run test:unit`, `npm run lint`, `npm run build` e o smoke do estado implementado. Não rodar a campanha longa a cada mudança mecânica.

**Aceite da unidade:** As quatro aparências são reconhecíveis na escala real de gameplay. Fonte editável, GLB, preview e manifesto correspondem à mesma revisão. Arte estruturalmente válida ainda exige aceite visual.

- [ ] **Step 5: Persistir evidência e commit revisável.**

Registrar `docs/proofs/reboot/T17.md` e atualizar o ledger com arquivos/commit/resultado. Usar `git add --` apenas nos arquivos desta tarefa e seus consumidores justificados, nunca `git add .` sobre trabalho de terceiros. Depois:

```bash
git diff --cached --check
git diff --cached --stat
git commit -m "feat(nitrokats): complete T17"
```

O verbo do commit não substitui aceite: gate técnico ou humano ainda pendente permanece explícito no ledger. Nenhum push, merge ou publicação está autorizado por este passo.

---

## Task 18: Integrar assets finais, inimigos e carregamento confiável

**ID:** T18 · **Marco:** M3 · **Depende de:** T17, T13

**Files:** **Criar:** `src/play/assets/catalog.ts`, `src/play/assets/loadAssets.ts`, `src/play/assets/catalog.test.ts`, `src/play/render/ActorView.tsx`, `art/source/enemies/robot-enemies.blend`, `public/assets/enemies/robots.glb`. **Modificar:** `src/play/render/WorldView.tsx`, `src/play/GameApp.tsx`, `art/ASSET_MANIFEST.json`.

**Interfaces:** Produz `validateCatalogEntry(entry):string[]`, `loadAssetSet(ids,signal):Promise<LoadedAssetSet>`, `AssetCatalog` e `ActorView({entityId,assetId,catId})`. Catálogo separa assets visuais de colliders de gameplay; LoadedAssetSet expõe `release():void` com contagem de referências.

- [ ] **Step 1: Escrever o teste causal inicial e ler as dependências.**

```ts
import { it, expect } from 'vitest';
import { validateCatalogEntry } from './catalog';
it('não aceita um GLB externo como asset final da release', () => {
  const errors = validateCatalogEntry({ id: 'cat-microkart',
    url: 'https://unknown.invalid/cat.glb', status: 'approved',
    manifestId: 'cat-microkart' });
  expect(errors).toContain('asset-must-be-local');
});
it('assinala placeholder, em vez de fingir que é arte aprovada', () => {
  const errors = validateCatalogEntry({ id: 'cat-microkart',
    url: '/assets/characters/cat-microkart.glb', status: 'placeholder',
    manifestId: 'cat-microkart' });
  expect(errors).toContain('placeholder-not-release-ready');
});
```

- [ ] **Step 2: Executar o teste e registrar o RED real.**

```bash
npm run test:unit -- src/play/assets/catalog.test.ts
```

Esperado antes da implementação: falha pela capacidade ausente ou comportamento incorreto descrito no teste. Registrar a causa; corrigir o ambiente quando a falha não for do contrato.

- [ ] **Step 3: Implementar a unidade e seus casos de borda.**

Criar três silhuetas inimigas consistentes: runner pequeno com eixo corporal baixo; gunner com torre clara; brute largo com placa frontal. MechaCat usa a mesma linguagem de sucata e um núcleo que sinaliza a segunda fase. Inimigos robóticos não imitam sofrimento de animais. Budget por instância: 6 mil triângulos inimigo, 20 mil chefe, até 4 materiais cada; detalhes pequenos demais para gameplay devem ser removidos.

Usar GLTFLoader da versão Three já instalada. Biblioteca carrega um conjunto aprovado por tela/run e caches por URL; instâncias compartilham geometria/textura, mas transformações e materiais de pelagem mutáveis são independentes. Não destruir recurso compartilhado ao desmontar um jogador. Material clone usado para variante deve ter disposal próprio.

Mostrar progresso real de carregamento e mensagem em PT-BR com tentar novamente/voltar. Abort de sessão impede atualização após desmontagem. Falha em arquivo, clip ou nó obrigatório não pode gerar tela preta nem iniciar campanha fingindo sucesso. Placeholder é opção explícita de desenvolvimento, rotulada e bloqueada pela checagem de release. `ActorView` apenas lê transformação da simulação e aplica animações; mudar mesh não altera dano, raio ou spawn.

Testar GLB 404, rede abortada, instância desmontada durante load, ausência de muzzle/clip, troca das quatro variantes de P1 e release/refcount zero. Preservar câmera/markers/HUD e comparar cena real com previews. IDs de atores são os IDs monotônicos do core, não UUIDs novos por render.

- [ ] **Step 4: Reexecutar, revisar e registrar o GREEN real.**

Repetir `npm run test:unit -- src/play/assets/catalog.test.ts` e os testes dos consumidores alterados. Esperado: todos os casos desta tarefa e regressões afetadas passam. Em arte, executar também export/import e registrar imagens reais; validação de metadados sozinha não atesta aparência. No fim do marco, executar `npm run test:unit`, `npm run lint`, `npm run build` e o smoke do estado implementado. Não rodar a campanha longa a cada mudança mecânica.

**Aceite da unidade:** P1 e os inimigos/chefe usam os GLBs finais, animam corretamente e um erro de asset tem saída utilizável. Nenhum ator final depende de geometria placeholder.

- [ ] **Step 5: Persistir evidência e commit revisável.**

Registrar `docs/proofs/reboot/T18.md` e atualizar o ledger com arquivos/commit/resultado. Usar `git add --` apenas nos arquivos desta tarefa e seus consumidores justificados, nunca `git add .` sobre trabalho de terceiros. Depois:

```bash
git diff --cached --check
git diff --cached --stat
git commit -m "feat(nitrokats): complete T18"
```

O verbo do commit não substitui aceite: gate técnico ou humano ainda pendente permanece explícito no ledger. Nenhum push, merge ou publicação está autorizado por este passo.

---

## Task 19: Construir as três arenas no Blender com colisão e navegação coerentes

**ID:** T19 · **Marco:** M3 · **Depende de:** T18, T11, T12

**Files:** **Criar:** `art/source/levels/garage.blend`, `art/source/levels/market.blend`, `art/source/levels/rooftop.blend`, `public/assets/levels/garage.glb`, `public/assets/levels/market.glb`, `public/assets/levels/rooftop.glb`, `src/play/content/levelValidation.ts`, `src/play/content/levelValidation.test.ts`. **Modificar:** `src/play/content/levels.ts`, `tools/blender/export_assets.py`, `art/ASSET_MANIFEST.json`.

**Interfaces:** Produz metadados por arena `public/assets/levels/<id>.json`: `{id,bounds,colliders,playerSpawns,enemySpawns,objective,exit}`. `validateLevel(level):string[]` e `isSpawnWalkable(level,position,radius):boolean` consomem o mesmo contrato Aabb/Vec2 da simulação.

- [ ] **Step 1: Escrever o teste causal inicial e ler as dependências.**

```ts
import { it, expect } from 'vitest';
import { validateLevel } from './levelValidation';
it('recusa spawn dentro de cobertura sólida', () => {
  const errors = validateLevel({ id: 'garage',
    bounds: { min: { x: -20, z: -16 }, max: { x: 20, z: 16 } },
    colliders: [{ min: { x: -1, z: -1 }, max: { x: 1, z: 1 } }],
    playerSpawns: [{ x: 0, z: 0 }],
    enemySpawns: [{ x: 15, z: 10 }],
    objective: { x: 0, z: 8 }, exit: { x: 0, z: 12 } });
  expect(errors).toContain('player-spawn-blocked:0');
});
```

- [ ] **Step 2: Executar o teste e registrar o RED real.**

```bash
npm run test:unit -- src/play/content/levelValidation.test.ts
```

Esperado antes da implementação: falha pela capacidade ausente ou comportamento incorreto descrito no teste. Registrar a causa; corrigir o ambiente quando a falha não for do contrato.

- [ ] **Step 3: Implementar a unidade e seus casos de borda.**

Arenas planas e compactas, com área útil de referência 40×32 m. Garagem: bancada, pneus, caixa de ferramentas, alimentação elétrica; corredores largos entre cobertura baixa. Mercado: balcões periféricos, caixas e gerador central com raio 4 m; manter anel de circulação. Telhado: perímetro protegido, antenas, tanques e núcleo central; evitar quedas letais e cobertura que esconda telegraphs.

Arte vem de um kit coeso e reutiliza materiais/props. Kenney/Quaternius podem fornecer base quando a licença do item específico for documentada, mas não tornam aquisição externa obrigatória. Evitar fotorealismo e texturas grandes que destroem a coerência e o orçamento. Referências `.tmp` da branch não são assets de produção e não são copiadas.

No Blender, empties `NK_spawn_p1`, `NK_enemy_spawn_*`, `NK_objective`, `NK_exit` e objetos `NK_collider_*` geram os metadados. `NK_spawn_p2` é opcional e não entra na validação da v1. Aplicar transformação de mundo antes de converter eixos. Colliders são caixas alinhadas ao runtime; caixa rotacionada deve ser rejeitada ou conscientemente convertida e revisada, nunca aproximada silenciosamente para uma barreira invisível. Não publicar objetos de collider como decoração.

Validar finitude, bounds min<max, spawn livre para raio 0,85, exatamente um spawn obrigatório de P1, caminho desse spawn aos objetivos alcançável no NavGrid, largura suficiente para dash e nenhuma cobertura em cima da zona. O renderer e a simulação carregam a mesma revisão de JSON. Export incluir hash do GLB e metadata no manifesto. Testar a versão inválida do fixture acima e os três arquivos reais.

Prova visual: screenshot de gameplay solo com P1 em cada arena, overlays de colisão ativados em desenvolvimento e depois desligados. Câmera deve manter P1 e os perigos legíveis nos extremos sem ampliar indefinidamente. Não usar névoa/bloom para esconder caminhos mal desenhados.

- [ ] **Step 4: Reexecutar, revisar e registrar o GREEN real.**

Repetir `npm run test:unit -- src/play/content/levelValidation.test.ts` e os testes dos consumidores alterados. Esperado: todos os casos desta tarefa e regressões afetadas passam. Em arte, executar também export/import e registrar imagens reais; validação de metadados sozinha não atesta aparência. No fim do marco, executar `npm run test:unit`, `npm run lint`, `npm run build` e o smoke do estado implementado. Não rodar a campanha longa a cada mudança mecânica.

**Aceite da unidade:** As três arenas são visualmente distintas, navegáveis e correspondem às colisões. Não há metadados de greybox obsoletos por baixo da arte final.

- [ ] **Step 5: Persistir evidência e commit revisável.**

Registrar `docs/proofs/reboot/T19.md` e atualizar o ledger com arquivos/commit/resultado. Usar `git add --` apenas nos arquivos desta tarefa e seus consumidores justificados, nunca `git add .` sobre trabalho de terceiros. Depois:

```bash
git diff --cached --check
git diff --cached --stat
git commit -m "feat(nitrokats): complete T19"
```

O verbo do commit não substitui aceite: gate técnico ou humano ainda pendente permanece explícito no ledger. Nenhum push, merge ou publicação está autorizado por este passo.

---

## Task 20: Limitar custos de simulação e render sem mudar a dificuldade

**ID:** T20 · **Marco:** M4 · **Depende de:** T19, T15

**Files:** **Criar:** `src/play/render/EffectsPool.ts`, `src/play/render/quality.ts`, `src/play/render/quality.test.ts`, `src/play/core/metrics.ts`. **Modificar:** `src/play/render/WorldView.tsx`, `src/play/render/PlayScene.tsx`, `src/play/combat/projectiles.ts`, `src/play/campaign/director.ts`, `src/play/core/model.ts`.

**Interfaces:** Produz `getQualityPreset(id):QualityPreset`, `EffectsPool(capacity)` com `spawn/update/clear/activeCount`, `readMetrics(runtime)` com contadores de entidades, eventos, pools e frames. Caps: 24 inimigos, 256 projéteis de gameplay, 512 partículas visuais.

- [ ] **Step 1: Escrever o teste causal inicial e ler as dependências.**

```ts
import { it, expect } from 'vitest';
import { EffectsPool } from './EffectsPool';
import { getQualityPreset } from './quality';
it('pool visual nunca cresce além do limite e é reutilizável', () => {
  const pool = new EffectsPool(4);
  for (let i = 0; i < 20; i++) pool.spawn({ x: i, z: 0 }, 0.2);
  expect(pool.activeCount).toBe(4);
  pool.update(0.3); expect(pool.activeCount).toBe(0);
  pool.spawn({ x: 1, z: 2 }, 1); expect(pool.activeCount).toBe(1);
  pool.clear(); expect(pool.activeCount).toBe(0);
});
it('qualidade não contém parâmetros de combate', () => {
  expect(Object.keys(getQualityPreset('low')).sort()).toEqual(
    ['bloom', 'dpr', 'particles', 'shadows']);
});
```

- [ ] **Step 2: Executar o teste e registrar o RED real.**

```bash
npm run test:unit -- src/play/render/quality.test.ts
```

Esperado antes da implementação: falha pela capacidade ausente ou comportamento incorreto descrito no teste. Registrar a causa; corrigir o ambiente quando a falha não for do contrato.

- [ ] **Step 3: Implementar a unidade e seus casos de borda.**

Presets fechados: low={dpr:1,shadows:false,bloom:false,particles:128}; medium={dpr:1,shadows:true,bloom:false,particles:256}; high={dpr:1.5,shadows:true,bloom:true,particles:512}. O teto de partículas permanece 512; não multiplicar DPR pela preferência duas vezes. Bloom/shake são opções visuais independentes e não obrigatórias.

EffectsPool usa slots pré-alocados com TTL; quando cheio, descartar o novo efeito visual e contabilizar. Projéteis mantêm cap 256 comum a todos os presets: se uma arma requer 6 slots e não existem 6, não emitir parcialmente nem consumir cooldown; tentar no próximo tick. Director espera espaço no cap de inimigos sem declarar spawn concluído. Nunca remover um inimigo vivo para reduzir carga visual.

Instanciar projéteis/partículas e props repetidos quando materiais permitirem; não criar Geometry/Material por tiro. Um único update de matrizes por frame, bounds válidos e contadores retornam ao baseline após reset. Eventos de simulação são batch de tick entregue a todos os consumidores antes de descarte; um consumidor não rouba eventos do outro. Medir antes de adicionar ECS/worker/octree; manter grid/AABB existentes enquanto atendem ao teste.

Adicionar testes: não emitir spread parcial no limite; despawn TTL libera slots; preset não muda resultado de replay com mesma seed/input; repetir restart não aumenta slots/material count; shader compilation não acontece toda vez que se atira. Não usar CI headless/software renderer para declarar FPS de Apple GPU.

- [ ] **Step 4: Reexecutar, revisar e registrar o GREEN real.**

Repetir `npm run test:unit -- src/play/render/quality.test.ts` e os testes dos consumidores alterados. Esperado: todos os casos desta tarefa e regressões afetadas passam. Em arte, executar também export/import e registrar imagens reais; validação de metadados sozinha não atesta aparência. No fim do marco, executar `npm run test:unit`, `npm run lint`, `npm run build` e o smoke do estado implementado. Não rodar a campanha longa a cada mudança mecânica.

**Aceite da unidade:** O jogo tem custo limitado e qualidade visual ajustável. Alterar qualidade não muda spawn, dano, RNG, objetivo ou resultado de combate.

- [ ] **Step 5: Persistir evidência e commit revisável.**

Registrar `docs/proofs/reboot/T20.md` e atualizar o ledger com arquivos/commit/resultado. Usar `git add --` apenas nos arquivos desta tarefa e seus consumidores justificados, nunca `git add .` sobre trabalho de terceiros. Depois:

```bash
git diff --cached --check
git diff --cached --stat
git commit -m "feat(nitrokats): complete T20"
```

O verbo do commit não substitui aceite: gate técnico ou humano ainda pendente permanece explícito no ledger. Nenhum push, merge ou publicação está autorizado por este passo.

---

## Task 21: Criar áudio musical e feedback sem vazamentos entre partidas

**ID:** T21 · **Marco:** M4 · **Depende de:** T20

**Files:** **Criar:** `src/play/audio/AudioBus.ts`, `src/play/audio/AudioDirector.ts`, `src/play/audio/AudioDirector.test.ts`, `art/source/audio/README.md`, `public/assets/audio/`. **Modificar:** `src/play/GameApp.tsx`, `src/play/ui/Settings.tsx`, `art/ASSET_MANIFEST.json`.

**Interfaces:** Produz `AudioDirector(bus)` com `unlock()`, `startRun()`, `pause()`, `resume()`, `stop()`, `dispose()`; bus expõe `startMusic():()=>void`, `playCue(id)`, `setVolume(busName,value)` e `dispose()`. Adaptador real usa Web Audio; teste usa spy, não atesta qualidade sonora.

- [ ] **Step 1: Escrever o teste causal inicial e ler as dependências.**

```ts
import { it, expect, vi } from 'vitest';
import { AudioDirector } from './AudioDirector';
it('duas chamadas não duplicam música e stop libera a instância', () => {
  const stopMusic = vi.fn();
  const bus = { unlock: vi.fn(async () => true),
    startMusic: vi.fn(() => stopMusic), playCue: vi.fn(),
    setVolume: vi.fn(), dispose: vi.fn() };
  const director = new AudioDirector(bus);
  director.startRun(); director.startRun();
  expect(bus.startMusic).toHaveBeenCalledTimes(1);
  director.stop(); director.stop();
  expect(stopMusic).toHaveBeenCalledTimes(1);
  director.dispose(); expect(bus.dispose).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 2: Executar o teste e registrar o RED real.**

```bash
npm run test:unit -- src/play/audio/AudioDirector.test.ts
```

Esperado antes da implementação: falha pela capacidade ausente ou comportamento incorreto descrito no teste. Registrar a causa; corrigir o ambiente quando a falha não for do contrato.

- [ ] **Step 3: Implementar a unidade e seus casos de borda.**

Criar AudioContext somente após gesto real em iniciar/ativar áudio, não ao importar módulo. unlock retorna false quando navegador bloquear; UI informa que som está desligado e permite tentar novamente sem impedir a partida. Nunca aguardar áudio para executar simulação.

Três buses separados: música, efeitos e interface, com gain mestre limitado. Música eletrônica/house instrumental original ou CC0 comprovada, com loop limpo e trecho de tensão do chefe; não usar gravações/letras comerciais. Efeitos distinguem disparos, impacto, perigo, derrota, perk e vitória. O cue de resgate existente fica fora do aceite solo. Limitar polifonia e baixar música sob sinais essenciais. Respeitar volume zero e redução de efeitos.

O AudioDirector guarda exatamente um stop da música, interrompe fontes/timers em pause/stop/dispose e desfaz assinaturas. Se suspender contexto, considerar fontes que já estavam agendadas: ao retomar, não tocar fila de tiros antiga. AudioBus pode reaproveitar buffers carregados, nunca contextos abandonados. Eventos têm IDs; desduplicação não altera a contagem de hits do core.

Testar start/pause/resume/stop idempotentes, 20 reinícios, falha de decode, volume fora de faixa clamped e rejeição do resume do AudioContext. Registrar fontes/licenças/hashes de áudio no mesmo manifesto. Validar ouvindo no Mac durante uma campanha solo completa, não só com mocks.

- [ ] **Step 4: Reexecutar, revisar e registrar o GREEN real.**

Repetir `npm run test:unit -- src/play/audio/AudioDirector.test.ts` e os testes dos consumidores alterados. Esperado: todos os casos desta tarefa e regressões afetadas passam. Em arte, executar também export/import e registrar imagens reais; validação de metadados sozinha não atesta aparência. No fim do marco, executar `npm run test:unit`, `npm run lint`, `npm run build` e o smoke do estado implementado. Não rodar a campanha longa a cada mudança mecânica.

**Aceite da unidade:** Tiros e sinais são claros; música muda com o combate sem sobreposição. Pausar, terminar e voltar ao menu não deixam som antigo tocando.

- [ ] **Step 5: Persistir evidência e commit revisável.**

Registrar `docs/proofs/reboot/T21.md` e atualizar o ledger com arquivos/commit/resultado. Usar `git add --` apenas nos arquivos desta tarefa e seus consumidores justificados, nunca `git add .` sobre trabalho de terceiros. Depois:

```bash
git diff --cached --check
git diff --cached --stat
git commit -m "feat(nitrokats): complete T21"
```

O verbo do commit não substitui aceite: gate técnico ou humano ainda pendente permanece explícito no ledger. Nenhum push, merge ou publicação está autorizado por este passo.

---

## Task 22: Persistir preferências e histórico sem travar o jogo

**ID:** T22 · **Marco:** M4 · **Depende de:** T21

**Files:** **Criar:** `src/play/settings/storage.ts`, `src/play/settings/storage.test.ts`. **Modificar:** `src/play/settings/model.ts`, `src/play/ui/Settings.tsx`, `src/play/ui/Results.tsx`, `src/play/GameApp.tsx`.

**Interfaces:** Produz `loadPreferences(storage:StoragePort):PreferencesV1`, `savePreferences(storage,value):{ok:boolean}`, `defaults():PreferencesV1`. StoragePort tem getItem/setItem/removeItem; chave `nitrokats:preferences:v1`; PreferencesV1 contém settings e bestRuns, não World.

- [ ] **Step 1: Escrever o teste causal inicial e ler as dependências.**

```ts
import { it, expect } from 'vitest';
import { loadPreferences, savePreferences, defaults } from './storage';
it('JSON corrompido e storage bloqueado não impedem abrir', () => {
  const storage = { getItem: () => '{broken',
    setItem: () => { throw new Error('quota'); }, removeItem: () => {} };
  const loaded = loadPreferences(storage);
  expect(loaded).toEqual(defaults());
  expect(savePreferences(storage, loaded)).toEqual({ ok: false });
});
it('uma versão futura não é mesclada sem validação', () => {
  const storage = { getItem: () => JSON.stringify({ version: 99,
    settings: { musicVolume: -100 } }), setItem: () => {}, removeItem: () => {} };
  expect(loadPreferences(storage)).toEqual(defaults());
});
```

- [ ] **Step 2: Executar o teste e registrar o RED real.**

```bash
npm run test:unit -- src/play/settings/storage.test.ts
```

Esperado antes da implementação: falha pela capacidade ausente ou comportamento incorreto descrito no teste. Registrar a causa; corrigir o ambiente quando a falha não for do contrato.

- [ ] **Step 3: Implementar a unidade e seus casos de borda.**

Validar somente campos permitidos, tipos e intervalos. version=1, volumes em [0,1], hudScale em [0.8,1.5], quality no enum e booleans reais; a UI da v1 persiste apenas bindings de P1. Dados antigos de P2 podem ser ignorados de forma segura, sem bloquear a abertura da edição solo. Evitar spread de objeto desconhecido sobre defaults. Não aceitar __proto__/constructor/prototype como campos úteis. Limitar bestRuns a 20 registros finitos e não negativos com arena/campaign/difficulty reconhecidos.

Capturar exceções tanto em leitura quanto escrita. Na falha, manter sessão em memória e mostrar aviso discreto 'As preferências não puderam ser salvas neste navegador'. Não repetir aviso a cada frame. Debounce apenas escritas de interface; flush ao fechar opções sem bloquear render. Reiniciar run preserva preferências e reseta estado de combate integralmente; nenhum HP, inimigo, perk temporário ou botão segurado é restaurado do storage.

Resultados são gravados uma vez por runId ao finalizar. Re-render do Results não duplica histórico. Dados ficam locais, sem telemetria ou envio a serviço. Testar NaN representado por tipo inválido, campos desconhecidos, quotas, getItem que lança, chave vazia, repetição de resultado e reset explícito de preferências.

- [ ] **Step 4: Reexecutar, revisar e registrar o GREEN real.**

Repetir `npm run test:unit -- src/play/settings/storage.test.ts` e os testes dos consumidores alterados. Esperado: todos os casos desta tarefa e regressões afetadas passam. Em arte, executar também export/import e registrar imagens reais; validação de metadados sozinha não atesta aparência. No fim do marco, executar `npm run test:unit`, `npm run lint`, `npm run build` e o smoke do estado implementado. Não rodar a campanha longa a cada mudança mecânica.

**Aceite da unidade:** O usuário mantém suas opções ao reabrir. Navegação privada, JSON inválido ou disco cheio não derrubam a partida.

- [ ] **Step 5: Persistir evidência e commit revisável.**

Registrar `docs/proofs/reboot/T22.md` e atualizar o ledger com arquivos/commit/resultado. Usar `git add --` apenas nos arquivos desta tarefa e seus consumidores justificados, nunca `git add .` sobre trabalho de terceiros. Depois:

```bash
git diff --cached --check
git diff --cached --stat
git commit -m "feat(nitrokats): complete T22"
```

O verbo do commit não substitui aceite: gate técnico ou humano ainda pendente permanece explícito no ledger. Nenhum push, merge ou publicação está autorizado por este passo.

---

## Task 23: Provar a campanha solo completa e os controles de P1

**ID:** T23 · **Marco:** M5 · **Depende de:** T22

**Files:** **Criar:** `tests/e2e/campaign.spec.ts`, `tests/e2e/helpers/campaignBot.ts`, `tests/integration/replay.test.ts`, `docs/proofs/reboot/CONTROLS-MATRIX.md`. **Modificar:** `tests/e2e/support/virtualInput.ts`, `playwright.config.ts`.

**Interfaces:** Produz `playCampaign(page,{players:1,difficulty,seed}):Promise<void>` usando apenas InputFrame e UI de P1. Bridge pode ler snapshot contendo posições/HP/fase/colliders, nunca alterar HP, objetivo, RNG, posição ou vitória. Bot decide direção/tiro/dash/seleção com as mesmas regras do jogador.

- [ ] **Step 1: Escrever o teste causal inicial e ler as dependências.**

```ts
import { test, expect } from '@playwright/test';
import { playCampaign } from './helpers/campaignBot';
test('P1 conclui três arenas por ações de jogo', async ({ page }) => {
  test.setTimeout(15 * 60 * 1000);
  await playCampaign(page, { players: 1, difficulty: 'relaxed', seed: 42 });
  await expect(page.getByRole('heading', { name: 'Vitória!', exact: true })).toBeVisible();
  await expect(page.getByTestId('completed-arenas')).toHaveText('3 de 3');
  await page.getByRole('button', { name: 'Jogar novamente', exact: true }).click();
  await page.getByRole('button', { name: 'Começar campanha', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Garagem', exact: true })).toBeVisible();
});
```

- [ ] **Step 2: Executar o teste e registrar o RED real.**

```bash
npm run test:e2e -- tests/e2e/campaign.spec.ts
```

Esperado antes da implementação: falha pela capacidade ausente ou comportamento incorreto descrito no teste. Registrar a causa; corrigir o ambiente quando a falha não for do contrato.

- [ ] **Step 3: Implementar a unidade e seus casos de borda.**

O bot deve navegar por NavGrid a partir do snapshot, escolher o inimigo visível mais próximo, mandar vetores unitários de movimento/mira e manter fire. Na defesa P1 permanece dentro da zona e remove inimigos que a contestam. No boss evita área telegrafada e atira na recuperação. Não importa funções que escrevem World no browser. Se travar, diagnosticar regras e bot separadamente; não resolver com um setter de fase nem desativando dano no teste de campanha.

Semente de E2E é configuração de criação antes da partida, não alteração de RNG durante ela. Training e difficulty são escolhas públicas; a campanha de produção usa party size 1. Fixture interna para unitário não é vitória E2E. Estado de vitória só é observado pelo DOM e snapshot read-only. Verificar uma derrota real separada mantendo inputs neutros em campanha, reinício limpa inimigos/perks/score, e revanche mantém preferências. O teste demorado roda no gate da campanha, não em cada tarefa; smoke fica com abertura solo, movimento, tiro, pausa e derrota.

Replay em integração: mesma sequência de InputFrame de P1 por tick e seed produz mesmo estado de combate com render alimentado em 30/60/120 Hz durante 10 s; excluir métricas de render e IDs de efeitos cosméticos da comparação. Injetar 10 s de stall e verificar limite de catch-up, não exigir que relógio avance os 10 s descartados. Cobrir perda de foco, soltar tecla fora da janela e, se gamepad de P1 for oferecido, desconexão/retorno sem input preso.

Matriz física desta v1: Mac real + navegador e versão registrados; P1 com teclado/mouse deve concluir menu, campanha, pausa e revanche. Se a edição de produção oferecer gamepad standard para P1, registrar modelo e provar a mesma jornada essencial com um controle. Browser automation com pad virtual não prova Bluetooth nem mapeamento do SO. Dois gamepads, teclado/mouse + gamepad em dupla, teclado compartilhado e remap não standard ficam em uma seção `FUTURO_P2`, sem gate da v1 e sem selo de compatibilidade. Chromium é alvo primário; Safari só recebe selo após prova real reduzida.

- [ ] **Step 4: Reexecutar, revisar e registrar o GREEN real.**

Repetir `npm run test:e2e -- tests/e2e/campaign.spec.ts` e os testes dos consumidores alterados. Esperado: todos os casos desta tarefa e regressões afetadas passam. Em arte, executar também export/import e registrar imagens reais; validação de metadados sozinha não atesta aparência. No fim do marco, executar `npm run test:unit`, `npm run lint`, `npm run build` e o smoke do estado implementado. Não rodar a campanha longa a cada mudança mecânica.

**Aceite da unidade:** Uma campanha solo automatizada atravessa regras reais; teclado/mouse de P1 e eventual gamepad oferecido são testados no Mac. Nenhum screenshot isolado substitui essa prova.

- [ ] **Step 5: Persistir evidência e commit revisável.**

Registrar `docs/proofs/reboot/T23.md` e atualizar o ledger com arquivos/commit/resultado. Usar `git add --` apenas nos arquivos desta tarefa e seus consumidores justificados, nunca `git add .` sobre trabalho de terceiros. Depois:

```bash
git diff --cached --check
git diff --cached --stat
git commit -m "feat(nitrokats): complete T23"
```

O verbo do commit não substitui aceite: gate técnico ou humano ainda pendente permanece explícito no ledger. Nenhum push, merge ou publicação está autorizado por este passo.

---

## Task 24: Executar estabilidade, orçamento de desempenho e migração final

**ID:** T24 · **Marco:** M5 · **Depende de:** T23

**Files:** **Criar:** `tests/e2e/soak.spec.ts`, `docs/proofs/reboot/PERFORMANCE.md`, `docs/proofs/reboot/MIGRATION.md`. **Modificar:** `src/App.tsx`, `package.json`, `package-lock.json`, `README.md`, `docs/GAME_MANUAL.md`, `tests/e2e/legacy-smoke.spec.ts`.

**Interfaces:** Nova edição torna-se default de produção somente depois do gate técnico. Legado permanece recuperável em git; testes antigos incompatíveis são classificados, não removidos para fingir regressão verde. Métricas de desenvolvimento incluem runtimeCount, listenerCount e pools.

- [ ] **Step 1: Escrever o teste causal inicial e ler as dependências.**

```ts
import { test, expect } from '@playwright/test';
import { enterTraining, snapshot } from './helpers/virtualInput';
test('reiniciar 20 vezes não acumula sessões @soak', async ({ page }) => {
  await enterTraining(page);
  for (let i = 0; i < 20; i++) {
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Reiniciar', exact: true }).click();
    await page.getByRole('button', { name: 'Confirmar reinício', exact: true }).click();
  }
  const state = await snapshot(page);
  expect(state.metrics.runtimeCount).toBe(1);
  expect(state.metrics.listenerCount).toBe(state.metrics.baselineListenerCount);
  expect(state.projectiles.length).toBe(0);
});
```

- [ ] **Step 2: Executar o teste e registrar o RED real.**

```bash
npm run test:e2e -- tests/e2e/soak.spec.ts
```

Esperado antes da implementação: falha pela capacidade ausente ou comportamento incorreto descrito no teste. Registrar a causa; corrigir o ambiente quando a falha não for do contrato.

- [ ] **Step 3: Implementar a unidade e seus casos de borda.**

Contadores derivam de registros reais de subscribe/add/remove/dispose e são zerados na mesma operação, não números decorativos escritos pelo teste. Auditar StrictMode mount/unmount, clock, AudioContext, RAF, listener, loader e recursos GPU. rodar 20 reinícios, alternar treino/campanha e permanecer 30 minutos em jogo real. Comparar memória aquecida após coleta quando disponível; sem API de GC não declarar ausência absoluta de leak por um ponto isolado.

Benchmark no Mac-alvo: registrar chip/RAM, SO, browser/versão, resolução 1920×1080, DPR1, qualidade média e cenário de cap 24 inimigos. Aquecer 60 s, medir 180 s e reportar mediana/p95 de frame e travamentos. Meta 60 FPS e p95<=20 ms, não resultado já alcançado. HUD/câmera/áudio devem continuar usáveis. Se falhar, primeiro reduzir draw calls, sombras, transparências e alocações; não reduzir conteúdo de combate silenciosamente. Guardar screenshot do cenário e arquivo de métricas.

Depois dos gates técnicos, App default muda para GameApp e modo de desenvolvimento/e2e ainda consegue inspecionar legado enquanto necessário. O menu de produção abre somente a jornada solo; “Jogar em dupla”, seleção de P2, resgate e HUD P2 ficam indisponíveis no build distribuído, sem apagar o código histórico antes da futura fase cooperativa. Produção não inclui o caminho de import do legado nem test bridge; confirmar com busca do bundle. Remover dependência só depois de grep comprovar nenhum consumidor em código/testes/docs vigentes. Testes do TPS que descrevem comportamento substituído são marcados como arquivo histórico ou migrados com justificativa escrita. Não sobrescrever manual/art/fontes.

Atualizar README e GAME_MANUAL para regras reais novas; adicionar tabela KEEP/PORT/REPLACE/ARCHIVE com commit de origem. Apagar `.tmp` do pacote final, não reescrever histórico. Não fazer force-push/merge. Reexecutar unitário, lint, build e smoke após mudar entrypoint. Playtest humano pode permanecer pendente sem bloquear a produção do candidato, mas impede chamá-lo de entrega aceita.

- [ ] **Step 4: Reexecutar, revisar e registrar o GREEN real.**

Repetir `npm run test:e2e -- tests/e2e/soak.spec.ts` e os testes dos consumidores alterados. Esperado: todos os casos desta tarefa e regressões afetadas passam. Em arte, executar também export/import e registrar imagens reais; validação de metadados sozinha não atesta aparência. No fim do marco, executar `npm run test:unit`, `npm run lint`, `npm run build` e o smoke do estado implementado. Não rodar a campanha longa a cada mudança mecânica.

**Aceite da unidade:** Candidato de produção abre na edição nova, estável e com métricas reais. Histórico e justificativa da migração permitem recuperar o original.

- [ ] **Step 5: Persistir evidência e commit revisável.**

Registrar `docs/proofs/reboot/T24.md` e atualizar o ledger com arquivos/commit/resultado. Usar `git add --` apenas nos arquivos desta tarefa e seus consumidores justificados, nunca `git add .` sobre trabalho de terceiros. Depois:

```bash
git diff --cached --check
git diff --cached --stat
git commit -m "feat(nitrokats): complete T24"
```

O verbo do commit não substitui aceite: gate técnico ou humano ainda pendente permanece explícito no ledger. Nenhum push, merge ou publicação está autorizado por este passo.

---

## Task 25: Empacotar a versão solo jogável local e fechar o aceite de P1

**ID:** T25 · **Marco:** M5 · **Depende de:** T24

**Files:** **Criar:** `Jogar.command`, `tools/serve-release.mjs`, `tools/package-release.mjs`, `tests/release/package.test.ts`, `docs/COMO-JOGAR.md`, `docs/proofs/reboot/FINAL-ACCEPTANCE.md`. **Modificar:** `package.json`, `README.md`. **Também criar:** `tools/serve-release.d.mts`, `CREDITS.md`.

**Interfaces:** Produz `npm run package:local`, pasta/zip de release com dist, launcher e guia. `tools/serve-release.mjs` serve somente 127.0.0.1, recebe --dir/--port e usa módulos nativos do Node; launcher exige Node local verificado no preflight. Não cria um aplicativo macOS nativo nem exige Blender do jogador.

- [ ] **Step 1: Escrever o teste causal inicial e ler as dependências.**

```ts
import { it, expect } from 'vitest';
import { resolveAssetPath } from '../../tools/serve-release.mjs';
it('servidor não aceita traversal fora da pasta de release', () => {
  const root = '/tmp/nitrokats-release/dist';
  expect(() => resolveAssetPath(root, '/%2e%2e/%2e%2e/secret.txt')).toThrow();
  expect(resolveAssetPath(root, '/assets/cat.glb'))
    .toBe('/tmp/nitrokats-release/dist/assets/cat.glb');
});
```

- [ ] **Step 2: Executar o teste e registrar o RED real.**

```bash
npm run test:unit -- tests/release/package.test.ts
```

Esperado antes da implementação: falha pela capacidade ausente ou comportamento incorreto descrito no teste. Registrar a causa; corrigir o ambiente quando a falha não for do contrato.

- [ ] **Step 3: Implementar a unidade e seus casos de borda.**

`serve-release.mjs` exporta helpers para testes e só inicia servidor se for entrypoint. resolveAssetPath decodifica uma vez, rejeita null bytes, barras invertidas e segmentos `..`, normaliza e confere prefixo real da raiz. Rejeitar symlink escapando da raiz. Arquivo ausente de `/assets/` responde 404, nunca HTML; tabela MIME cobre html/js/css/json/glb/png/webp/ogg/mp3/wav. HTML inicial usa no-cache; assets com hash podem ter cache longo. Não servir listagem de diretório.

Porta inicial 4173, fallback até 4183; escolher somente porta livre, nunca matar processo alheio. Processo imprime URL 127.0.0.1, e `Jogar.command` abre navegador com `open`. Script verifica Node e pasta dist, exibe erro legível se faltar, e mantém terminal com instrução de encerramento. Encerrar apenas o próprio servidor via sinal/trap. Não tocar `/` do Mac nem criar autostart. Pré-requisito Node deve estar explícito no guia; se a meta passar a ser máquina sem Node, wrapper nativo vira nova decisão, não promessa deste pacote.

`package-release.mjs` verifica manifesto inteiro, rejeita status placeholder, licença/prova ausente, SHA divergente, asset remoto e qualquer referência à test bridge. Copia dist, servidor, launcher, CREDITS.md e COMO-JOGAR.md para destino novo dentro de artifacts/releases; nunca sobrescreve release existente sem nome versionado. Fontes .blend ficam no repositório, não são necessárias ao jogador. Runtime não precisa de MCP, internet, Blender, conta ou chave de API.

Release teste: build normal, iniciar servidor, abrir localhost, selecionar P1, jogar a campanha até vitória ou derrota e reiniciar; desconectar a internet para confirmar que todos os assets/sons/fontes são locais. Dev server não é prova de release. Executar guia literalmente a partir do diretório empacotado. Permissão executável e gate/quarentena do macOS são verificados no Mac, sem comandos para desabilitar segurança global.

Aceite final solo com Marco: sessão de aproximadamente 30 minutos, iniciada pelo launcher sem editar código ou abrir Blender. P1 conclui as três arenas e o chefe, entende objetivos, consegue provocar derrota e usar revanche. Registrar em palavras de Marco conforto de controle, leitura de perigo, o que divertiu, confundiu ou irritou, e vontade de repetir. Não inventar nota nem feedback. Se algo essencial falhar, registrar problema reproduzível e voltar à tarefa dona. Sem sessão real, entregar candidato com ACEITE_HUMANO_PENDENTE, não 'diversão comprovada'. Playtest de Yasmin com P2 pertence à fase futura. Publicação, merge e instalação externa continuam fora desta autorização de planejamento.

Adicionar declaração .d.mts do módulo .mjs para o teste TypeScript sem usar any, incluindo `resolveAssetPath(root:string,requestPath:string):string`. CREDITS.md é gerado do manifesto por package-release e auditado antes do empacotamento.

`resolveAssetPath` é validação lexical pura para os testes. O handler do servidor faz adicionalmente fs.realpath e verificação de symlinks em arquivos existentes antes da leitura; erros ENOENT viram 404. O teste lexical não cria diretórios em /tmp.

- [ ] **Step 4: Reexecutar, revisar e registrar o GREEN real.**

Repetir `npm run test:unit -- tests/release/package.test.ts` e os testes dos consumidores alterados. Esperado: todos os casos desta tarefa e regressões afetadas passam. Em arte, executar também export/import e registrar imagens reais; validação de metadados sozinha não atesta aparência. No fim do marco, executar `npm run test:unit`, `npm run lint`, `npm run build` e o smoke do estado implementado. Não rodar a campanha longa a cada mudança mecânica.

**Aceite da unidade:** Entrega é um jogo solo para P1 que abre pelo launcher e fecha uma campanha completa. O aceite técnico e o aceite humano são registros distintos.

- [ ] **Step 5: Persistir evidência e commit revisável.**

Registrar `docs/proofs/reboot/T25.md` e atualizar o ledger com arquivos/commit/resultado. Usar `git add --` apenas nos arquivos desta tarefa e seus consumidores justificados, nunca `git add .` sobre trabalho de terceiros. Depois:

```bash
git diff --cached --check
git diff --cached --stat
git commit -m "feat(nitrokats): complete T25"
```

O verbo do commit não substitui aceite: gate técnico ou humano ainda pendente permanece explícito no ledger. Nenhum push, merge ou publicação está autorizado por este passo.

---

## Cobertura do contrato

| Requisito | Tarefas proprietárias |
|---|---|
| G01 — campanha solo local, escopo sem rede | T02, T09, T12–T15, T23, T25 |
| G02 — runtime existente e Blender externo | T01, T08, T16–T19, T24–T25 |
| G03 — uma autoridade do combate | T02–T06, T08, T10, T20 |
| G04 — tick, seed, pausa e IDs | T02–T03, T05, T07, T12–T14, T23 |
| G05 — controle e prova física de P1 | T07, T09–T10 como base; T15, T23, T25 como aceite solo |
| G06 — estado e resultado de P1 | T02, T05–T06 como base; T12–T14, T23 como campanha solo |
| G07 — conteúdo final delimitado | T05, T11–T14, T17–T19 |
| G08 — arte editável e proveniência | T16–T19, T25 |
| G09 — interface PT-BR e menus | T09–T10, T14–T15, T21–T23, T25 |
| G10 — permissões e limites operacionais | T01, T16, T24–T25; aplica a todas |
| G11 — testes, visual e humanos distintos | Todas; integração T23–T25 |
| G12 — planejamento não é execução | Metadados deste pacote e todos os receipts |

### Gates que nenhuma IA pode assinar por adivinhação

- Hardware: teclado/mouse de P1 e eventual gamepad de P1 oferecido funcionam no navegador/OS reais.
- Arte: quatro gatos e cenários são legíveis no tamanho de jogo e têm fontes válidas.
- Performance: medições do Mac, resolução e cenário declarados, não FPS de CI.
- Diversão: feedback de Marco após jogar uma campanha solo completa sobre controles, clareza e vontade de repetir.

### Critério terminal

As T01–T10 históricas permanecem com seus recibos; as T11–T25 passam nos gates solo revisados. O candidato de produção executa a campanha de P1 inteira offline por localhost, com fonte Blender e documentação de licença. Marco completa a sessão solo de aceite. Sem essa sessão, o estado é **CANDIDATO_TÉCNICO_COM_ACEITE_HUMANO_PENDENTE**. P2 só entra em um plano posterior com testes de cooperação e dois controles.

Não aumentar o escopo para online, quatro jogadores, engine nova ou editor de mapas antes desse fechamento. Esses seriam outros produtos/planos, não pendências escondidas desta v1.

### Futuro P2 — fora das 25 tarefas da v1

Depois do release solo, um plano próprio deve: (1) reativar a entrada de P2 e a UI de dois slots, com confirmação por jogador; (2) rever balanceamento de spawns, chefe, defesa, câmera, HUD, resgate e escolhas de perks para cooperação; (3) executar campanha completa em dupla pelas regras reais, sem setters de vitória; (4) provar no Mac real teclado compartilhado, teclado/mouse + gamepad e dois gamepads, incluindo desconexão, ghosting e retorno; (5) fazer playtest com Marco e Yasmin antes de chamar o modo de duas pessoas de aceito. O código/testes de T01–T10 são ponto de partida técnico, não validação dessas cinco obrigações.
