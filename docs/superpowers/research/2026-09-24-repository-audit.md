# Auditoria de origem: Nitrokats

**Inspeção:** 24/09/2026, leitura remota via conector GitHub. Não houve instalação, execução do jogo, testes, render, benchmark ou alterações remotas.

## Identidade e bases

Repositório correto: `nmarcofernandess/Nitrokats`.

| Ref | SHA observado | Relação observada |
|---|---|---|
| master | e5ac656864eca9407f21f48074ec987da9c298e8 | Base padrão; commit de 09/02/2026. |
| codex/third-person-cat-shooter | 3f49c8d3cb3df0c31b89b02331d28677b19826f5 | Dois commits à frente de master, nenhum atrás. Base proposta da reinvenção. |
| zombie-cats-mode | 4e1337608c373870ac1bfb942ed16195d7465fc9 | Ancestral de master, um commit atrás na comparação. |

A listagem de branches retornou essas três entradas; não se afirma inexistência de refs fora do resultado consultado. Refazer o fetch local na execução e registrar mudanças. A tentativa de clone no ambiente desta conversa falhou por resolução DNS; a inspeção prosseguiu pelo conector. Nenhum arquivo foi colocado no Mac do usuário.

## O que foi efetivamente lido

### master

`README.md`, `docs/GAME_MANUAL.md`, `package.json`, `src/game/store.ts`, `src/game/types.ts`, `src/game/Scene.tsx`, `src/game/Player/CatTank.tsx` (duas faixas cobrindo o arquivo), `src/game/Projectiles/LaserManager.tsx`, `src/game/Entities/EnemyManager.tsx`, `src/game/Utils/ObjectRegistry.ts`, `src/game/World/Arena.tsx`, `src/game/UI.tsx`, `src/game/Utils/AudioManager.ts`, `.agent/rules/teste.md` e resposta da árvore remota (a apresentação da árvore foi truncada).

### branch TPS

Diff estatístico completo da comparação com master; `docs/SPEC_THIRD_PERSON_SHOOTER.md`, `package.json`, `src/game/config/weapons.ts`, `src/game/config/objectives.ts`, `src/game/config/perks.ts`, `src/game/systems/MatchSystem.tsx` e `src/game/store.ts` linhas 1–240. O restante do store e todos os outros arquivos modificados da branch **não** foram lidos integralmente nesta auditoria. Esta é uma investigação suficiente para planejamento, não um review completo da branch.

A comparação mostra testes para câmera, base de movimento, input, início de modo e regras de onda. Seus resultados atuais não foram verificados. A branch já declara `vitest` e `npm test`; master não declara esses scripts.

## Achados que mudam o plano

1. **O projeto não é um jogo de corrida.** O README define arena shooter; o manual descreve modos classic/zombie. A conversa anterior sugeriu arquitetura de kart sem ter lido esses arquivos. Este pacote corrige a premissa.
2. **Não partir só de master.** A branch TPS acrescenta armas, perks, objetivos, boss, sistemas de controle/câmera e testes. Preservar esse material evita refazer concepções que já existem.
3. **A autoridade ainda é single-player.** No store TPS inspecionado, `health`, `maxHealth`, `input`, `selectedWeapon`, `runPerks`, `camera` e `aimPoint` são singulares. Adaptar isso exige contrato por PlayerId, não duplicar componente visual.
4. **Arte e lógica estão misturadas no original.** CatTank original combina listeners globais, movimento, colisão, cura, tiro, câmera e centenas de linhas de meshes. O novo pipeline separa modelo visual de entidade simulada.
5. **Objetivos de presença não provam presença.** Em `MatchSystem.tsx`, `defend_zone` e `escort` calculam progresso a partir do timer. O trecho não verifica ocupação de zona, posição de escolta ou proteção de entidade. O plano não conserva essa equivalência entre passar tempo e cumprir objetivo.
6. **Elite pode completar antes de nascer.** A lógica `eliteAlive ? 0 : 1` é avaliada antes do spawn da onda. Pela leitura, ausência inicial pode concluir o objetivo sem elite registrado. É hipótese causal forte de análise estática, não falha reproduzida. A reinvenção exige registro do encounter e do ID obrigatório.
7. **Temporizadores usam referências diferentes.** MatchSystem mistura `delta` e `state.clock.elapsedTime`. O plano centraliza timers em ticks e exige prova de pause/restart; não afirma um bug de runtime que não foi reproduzido.
8. **Perks têm semântica a corrigir.** `rapid_loader` usa multiplicador 0,82 sobre intervalo e texto “+18% fire rate”; a nova copy descreve intervalo 18% menor. `stabilizer` precisa de efeito verificável sobre dispersão no novo esquema.
9. **Áudio original inicia um AudioContext na construção do singleton.** Reescrever o ciclo de vida com inicialização após gesto e descarte explícito, sem inferir que falha em todos os navegadores.
10. **`.tmp/` da branch inclui conceitos e imagens de referência.** Não foram inspecionadas visualmente e não são tratadas como assets finais nem como material autorizado a redistribuir.

## Matriz de aproveitamento

| Origem | Decisão | Destino |
|---|---|---|
| React/TS/Vite/Three/R3F | Manter stack e lock como baseline; sem atualização ampla junto com gameplay. | package.json + src/play |
| Vitest da branch TPS | Manter; ampliar testes. | npm test + novas suítes |
| config/weapons.ts | Portar valores e IDs; clarificar unidade; cooldown por player. | src/play/content/weapons.ts |
| config/perks.ts | Portar seis ideias com semântica explícita e ownership. | src/play/content/perks.ts |
| config/objectives.ts / MatchSystem | Reaproveitar intenções; reescrever regras causais e progressão curta. | src/play/campaign |
| Câmera TPS / pointer lock | Preservar no legado durante migração; não usar na edição coop compartilhada. | história do Git / edição legada |
| CatTank / CatShooter | Referência de proporção/identidade; substituir visual por GLBs Blender. | src/play/render + art/source |
| ObjectRegistry baseado em Group | Substituir autoridade por estado TS. | src/play/core |
| Áudio procedural | Referência/fallback, não singleton import-time. | src/play/audio |
| Yuka / uuid / Leva | Remover apenas quando nenhum import de produção depender deles. | tarefa de limpeza final |
| screenshots e referências .tmp | Não embarcar. | fora de dist e manifesto final |

## Fontes primárias consultadas

URLs são fornecidas como rastreabilidade para o executor, não como prova de testes.

- Base original: https://github.com/nmarcofernandess/Nitrokats/tree/e5ac656864eca9407f21f48074ec987da9c298e8
- Base TPS: https://github.com/nmarcofernandess/Nitrokats/tree/3f49c8d3cb3df0c31b89b02331d28677b19826f5
- Spec TPS: https://github.com/nmarcofernandess/Nitrokats/blob/3f49c8d3cb3df0c31b89b02331d28677b19826f5/docs/SPEC_THIRD_PERSON_SHOOTER.md
- MatchSystem: https://github.com/nmarcofernandess/Nitrokats/blob/3f49c8d3cb3df0c31b89b02331d28677b19826f5/src/game/systems/MatchSystem.tsx
- Store TPS: https://github.com/nmarcofernandess/Nitrokats/blob/3f49c8d3cb3df0c31b89b02331d28677b19826f5/src/game/store.ts
- Armas: https://github.com/nmarcofernandess/Nitrokats/blob/3f49c8d3cb3df0c31b89b02331d28677b19826f5/src/game/config/weapons.ts
- Perks: https://github.com/nmarcofernandess/Nitrokats/blob/3f49c8d3cb3df0c31b89b02331d28677b19826f5/src/game/config/perks.ts
- R3F, desempenho e ciclo de render: https://r3f.docs.pmnd.rs/advanced/pitfalls
- Gamepad API, conexão/polling/mapeamento: https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API/Using_the_Gamepad_API
- Blender 4.5 LTS e revisões: https://www.blender.org/releases/4-5/
- Famílias LTS mantidas: https://www.blender.org/download/lts/
- Contrato glTF e custom properties (manual 4.0 consultado; API específica deve ser conferida no Blender fixado): https://docs.blender.org/manual/en/4.0/addons/import_export/scene_gltf2.html
- Upstream MCP comunitário: https://github.com/ahujasid/mcp-for-blender

Não foi possível recuperar a página `latest` do manual Blender pela ferramenta web. O contrato geral glTF foi conferido no manual disponível; o probe local é obrigatório antes de depender de argumentos específicos do exportador 4.5.14.