# Nitrokats Reborn: Madrugada de Caos

**Data:** 24/09/2026. **Estado:** contrato de implementação revisado após T10; campanha solo ainda não implementada nem aprovada por playtest.

**Ruling de escopo (24/09/2026):** o primeiro release local completo é **solo, com P1**. P2, cooperação, resgate de parceiro, teclado compartilhado e combinações de dois controles ficam para uma fase futura. O código e os recibos de T01–T10 permanecem como histórico verificado, sem exigir sua remoção. Onde um trecho histórico abaixo mencionar P2, a regra deste ruling prevalece para T11–T25 e para o aceite da v1. A edição entregue deve apresentar apenas a jornada solo; nenhuma interface de produção promete dupla antes da fase futura. A reversão consiste em restaurar os gates de P2, rever balanceamento e UI e executar a matriz física/cooperativa antes de anunciar cooperação.

## 1. Resultado pretendido

Um pequeno jogo completo de ação solo: abrir, escolher um gato, jogar uma campanha curta, derrotar um chefe, ver o resultado e ter vontade de repetir. A entrega não termina em um editor, uma galeria de assets ou um protótipo sem vitória.

Pedido explícito: reinventar o projeto existente, usar Blender como centro da produção de arte e entregar um plano Superpowers. A primeira proposta considerava duas pessoas no mesmo Mac; Marco redefiniu a prioridade para concluir o jogo solo antes de adicionar P2. O alvo continua sendo navegador desktop local. Jogo online e corrida de kart não foram pedidos de forma inequívoca. O repositório real é um shooter, apesar do nome lembrado como NitroKarts.

### Decisão de gênero e câmera

**Proposta escolhida:** shooter isométrico solo de gatos em microveículos de combate, com movimentação livre e mira independente. Preserva a identidade do tanque-gato original e reaproveita armas, conceitos de objetivos e perks da branch de terceira pessoa.

A branch `codex/third-person-cat-shooter` propõe câmera sobre o ombro. Este desenho **substitui essa decisão apenas na nova edição**. A câmera isométrica já implementada fica como base da v1 solo; seu enquadramento para dois jogadores é compatibilidade futura, sem gate nesta entrega. O esforço restante vai para combate, campanha e acabamento.

Alternativas examinadas: evoluir o TPS com tela dividida preservaria sua câmera, mas duplicaria composição/HUD e exigiria validar dois pontos de vista; migrar tudo para Godot criaria outra migração antes de demonstrar diversão. Continuar em Three/R3F com câmera compartilhada é a escolha deste plano, não uma afirmação de superioridade universal da ferramenta.

## 2. Contrato global

Estas linhas são normativas e devem ser copiadas para o plano:

- G01: Entregar uma campanha local completa para P1. P2 e cooperação ficam para depois da v1; online, LAN, contas, backend, monetização e mobile também ficam fora.
- G02: Manter React + TypeScript + Vite + Three.js/R3F; Blender produz arte, não executa o jogo.
- G03: Uma única simulação em TypeScript governa o combate; React, meshes e Zustand não são escritores concorrentes do mundo.
- G04: Usar passo fixo de 1/60 s, RNG com seed, IDs locais monotônicos e timers de simulação; nenhuma regra de combate depende de Date.now, Math.random ou relógio do render.
- G05: Validar teclado/mouse de P1 no Mac real. Se a edição solo oferecer um gamepad standard a P1, validar esse perfil fisicamente antes de anunciá-lo como suportado. Combinações com P2 não são gate da v1.
- G06: Vida, arma, cooldown, perks, input e resultado de P1 são governados pelo core. O isolamento por PlayerId e friendly fire já implementados permanecem como compatibilidade futura, sem obrigar cooperação na campanha solo.
- G07: O escopo final contém 4 gatos cosméticos, 3 armas, 3 arquétipos de inimigo, 3 arenas, 1 chefe e 6 perks; nada disso exige desbloqueio por grind.
- G08: Assets finais possuem fonte editável, exportação GLB quando aplicável, proveniência e licença documentada; placeholders não satisfazem o aceite visual.
- G09: Toda a interface da v1 é PT-BR; menus e escolhas são operáveis pelo teclado/mouse de P1 e pelo gamepad de P1 quando oferecido. Controles e opções de P2 não aparecem na edição de produção.
- G10: Não instalar ou alterar configurações globais, comprar assets, usar geração paga, publicar, mergear ou sobrescrever trabalho externo sem autorização específica.
- G11: Toda tarefa de código tem teste causal vermelho e verde; arte tem validação estrutural e prova visual; sensação de jogo e controles de P1 exigem playtest humano.
- G12: Nenhum teste, build, benchmark, render ou playtest foi executado durante a elaboração deste pacote; metas de desempenho e diversão são critérios futuros.

## 3. A experiência

**Nome de trabalho:** Nitrokats Reborn: Madrugada de Caos. Quatro gatos pilotam pequenos veículos improvisados para recuperar a central de comida do bairro, ocupada por máquinas descontroladas. Visual de brinquedos de oficina com sucata retrofuturista, cores legíveis, expressões felinas grandes e humor visual. Sem violência realista contra animais.

Anakin, Yang, Maya e Ivy são quatro aparências sobre o mesmo conjunto de regras. Aparência não obriga papel de suporte ou configura uma vantagem escondida. P1 escolhe qualquer gato. Marcadores de P2 existentes ficam fora da interface de produção solo.

```text
ABRIR → ESCOLHER GATO + CONTROLE → TREINO OPCIONAL
                 ↓
          GARAGEM: limpar a arena
                 ↓
             P1 escolhe 1 perk
                 ↓
        MERCADO: defender o gerador
                 ↓
             P1 escolhe 1 perk
                 ↓
          TELHADO: derrotar o chefe
                 ↓
       VITÓRIA → RESULTADO → JOGAR DE NOVO
```

Alvo de duração de uma campanha: 8–12 minutos, a ajustar pelo playtest. Não programar duração artificial para forçar esse intervalo. Uma arena de treino permite testar movimento, mira, armas e dash sem dano e sem iniciar uma campanha.

### Conteúdo fechado

| Conteúdo | Contrato |
|---|---|
| Garagem dos Gatos | Arena de eliminação, obstáculos baixos, espaços amplos; introduz runner e gunner. |
| Mercado da Madrugada | Defender uma área visível enquanto P1 controla os inimigos que a contestam. Introduz brute. |
| Telhado da Central | Arena de chefe sem quedas letais; cobertura baixa e áreas de perigo claramente marcadas. |
| Runner | Aproximação com desvio de obstáculos; contato tem cooldown e aviso legível. |
| Gunner | Mantém distância, prepara disparo e atira; sem tiro inevitável surgindo dentro do jogador. |
| Brute | Lento, prepara investida e deixa janela de recuperação. |
| MechaCat | Chefe robótico com duas fases, ataques telegrafados e morte registrada uma única vez. |

Não incluir escolta, mapas procedurais, destruição física generalizada, inventário, árvore de habilidades, editor de fases, geração 3D em runtime ou cutscenes na v1.

## 4. Controle solo e compatibilidade futura

### Dispositivos

| Perfil | Movimento | Mira | Tiro / dash / troca de arma |
|---|---|---|---|
| Teclado + mouse | WASD | Mouse no chão da arena | Mouse esquerdo / Espaço / Q |
| Gamepad standard | Analógico esquerdo | Analógico direito | RT / botão sul / botão norte |
| Teclado compartilhado P1/P2 | Implementado na base técnica | Fora do aceite da v1 | Reservado para a fase futura de cooperação |

ESC ou Start abre pausa. Usar `KeyboardEvent.code` para posições físicas e exibir o mapeamento de P1. Teclado/mouse é o caminho obrigatório da v1; a compra de controle não é requisito. Ghosting do teclado compartilhado pertence ao futuro aceite de P2.

Se o menu solo oferecer gamepad standard para P1, sua navegação, disparo, pausa, desconexão e retorno precisam de prova física. Gamepads com `mapping !== 'standard'` não são anunciados como compatíveis sem remapeamento provado. A lógica já criada para slots P1/P2 permanece no código, mas sua matriz de dois dispositivos é futura.

Zona morta radial inicial 0,18, reescalada para 0–1. Movimento diagonal normalizado. Mira do analógico de P1 mantém a última direção válida ao retornar ao centro. Assistência leve pode ser desligada para P1. O código de assistência do teclado compartilhado não integra o aceite solo.

Perda de foco ou desconexão de dispositivo em uso pausa toda a partida, zera entradas pendentes e pede retomada explícita. Segurar o botão que confirmou o menu não pode disparar ou dar dash ao voltar. Apenas reconectar não retoma o jogo.

### Derrota solo e resgate futuro

HP inicial 100; personagens cosméticos não alteram isso. Em campanha solo, P1 chegar a zero encerra a run como derrota, com tela de resultado e caminho de revanche. O estado de queda e o resgate já implementados continuam reservados ao modo futuro de P2 e podem ser usados no treino técnico, sem requisito de aparecer na jornada solo final.

Resolver todas as mortes do tick antes do resultado: se chefe e P1 morrem no mesmo tick, derrota tem precedência. Não conceder vitória por ordem acidental de arrays. O resgate automático de 12 s e a derrota por dois jogadores caídos permanecem contratos históricos de cooperação, sem gate nesta v1.

O resultado solo mostra progresso da campanha, tempo e objetivos de P1. A ausência de friendly fire e de vazamento de perks entre slots permanece preservada no core, mas não compõe a UI de produção desta v1.

## 5. Combate e progressão

### Armas

Reaproveitar os IDs e ideias da branch TPS. Renomear `fireRate` para `shotIntervalSeconds`, pois o valor atual representa intervalo, não tiros/segundo.

| ID | Intervalo | Dano por projétil | Velocidade | Projéteis | Dispersão inicial |
|---|---:|---:|---:|---:|---:|
| pulse_rifle | 0,12 s | 16 | 36 m/s | 1 | 0,035 rad |
| scatter_cannon | 0,45 s | 12 | 28 m/s | 6 | 0,17 rad |
| arc_marksman | 0,78 s | 48 | 44 m/s | 1 | 0,01 rad |

Valores são baseline de código, não balanceamento aprovado. As três armas ficam disponíveis desde o início e usam cooldown, sem uma economia de munição adicional na v1. A arma precisa ter personalidade perceptível: precisão e cadência; cobertura de curta distância; tiro forte e espaçado.

Colisão de projétil usa segmento entre posição anterior e seguinte. Resolver o menor tempo de impacto entre parede e alvo; uma parede à frente do inimigo bloqueia o tiro. Crédito da morte é idempotente. Lifesteal usa dano efetivamente retirado, não overkill. Splash não se chama recursivamente.

### Perks

Após arenas 1 e 2, P1 recebe três opções distintas dentre os seis perks ainda não escolhidos. A partida fica congelada até P1 confirmar. Sem timeout que escolha no lugar da pessoa. O estado por jogador já previsto no core continua apto a suportar P2 futuramente, mas a UI da v1 contém uma escolha por intermission.

- `rapid_loader`: intervalo entre tiros ×0,82; texto deve dizer “intervalo 18% menor”, não confundir com exatamente +18% de tiros por segundo.
- `overcharge`: dano ×1,22.
- `fortified`: +35 HP máximo e +35 HP atual, limitado ao novo máximo.
- `vampiric_rounds`: cura de 8% do dano direto efetivo; não dispara em friendly fire ou cenário.
- `stabilizer`: recuo visual ×0,65 e dispersão ×0,8, para ter efeito verificável no novo esquema de câmera.
- `shockwave`: +12 de dano em raio de 2 m após impacto direto; uma única aplicação por alvo e impacto, sem recursão nem dano aliado.

### Objetivos verdadeiros

Garagem: eliminar 24 inimigos efetivamente registrados no encontro; máximo inicial 12 ativos. Não completar por observar um array vazio antes do primeiro spawn. Um encontro é concluído quando todos os spawns previstos foram emitidos e seus inimigos foram derrotados.

Mercado: acumular 45 s de controle. Contagem só avança com P1 ativo dentro do círculo de raio 4 m e nenhum inimigo dentro. Sair ou ser contestado congela, mas não desfaz progresso. Spawns param ao completar; eliminar sobreviventes abre a saída. O gerador não tem barra de HP nesta versão.

Telhado: spawn de um MechaCat confirmado por ID; vitória exige evento de morte daquele ID e P1 ativo. Ausência do boss no começo não é vitória. Chefe inicial: 1500 HP solo, a calibrar no playtest. O valor duo de 2250 HP fica para revisão futura, sem influenciar a v1.

Dificuldade inicial Relaxado: dano recebido ×0,65 e cadência de spawn ×1,25 no intervalo. Normal: multiplicadores 1. Vida de inimigos comuns mantém o baseline. Balancear a campanha para uma pessoa antes de rever parâmetros de cooperação.

## 6. Arquitetura de implementação

**Base de implementação proposta:** `codex/third-person-cat-shooter@3f49c8d3cb3df0c31b89b02331d28677b19826f5`. `master@e5ac656864eca9407f21f48074ec987da9c298e8` fica como referência do original. Verificar diferenças remotas na retomada. Não resetar trabalho local para fazer coincidir SHAs antigos.

Construir a nova edição em `src/play/`. `src/game/` continua disponível durante a migração, mas nunca montado simultaneamente à nova simulação. Um seletor de edição apenas em desenvolvimento permite comparação. Depois do aceite, novo jogo é o padrão; remover o legado do bundle de produção e preservar sua referência no Git.

```text
BrowserInput → InputHub → PlayerInput por PlayerId
                                ↓
                       FixedClock (60 Hz)
                                ↓
  mundo TS: movimento → AI → armas → impactos → objetivos
                                ↓
                 snapshot + eventos do tick
                     ↙                    ↘
       R3F: meshes, câmera, VFX     HUD / áudio / resultados

Blender + MCP → .blend editável → export/validate → GLB + manifesto
                                                    ↓
                                              AssetCatalog
```

`src/play/core/` não importa React, Three, Zustand, DOM ou Web Audio. Usa vetores `{x,z}` e dados simples. Um `GameRuntime` é dono do mundo atual, dos inputs e do relógio. Zustand guarda apenas projeção para HUD e estado de menus/configurações; comandos de gameplay chamam runtime, não alteram cópias paralelas de HP.

Eventos de combate são entregues a múltiplos consumidores sem que um “consuma” a fila antes do outro. Usar lote imutável por tick e números sequenciais; render e áudio controlam seu último ID processado. Descartar histórico além do necessário. Pools têm tamanho limitado.

### Contratos públicos mínimos

```ts
export type PlayerId = 'p1' | 'p2';
export type CatId = 'anakin' | 'yang' | 'maya' | 'ivy';
export type WeaponId = 'pulse_rifle' | 'scatter_cannon' | 'arc_marksman';
export type Difficulty = 'relaxed' | 'normal';
export type EnemyKind = 'runner' | 'gunner' | 'brute' | 'mechacat';
export type PerkId = 'rapid_loader' | 'overcharge' | 'fortified' | 'vampiric_rounds' | 'stabilizer' | 'shockwave';
export type RunPhase = 'playing' | 'paused' | 'intermission' | 'won' | 'lost';
export interface Vec2 { x: number; z: number }
export interface PlayerInput {
  move: Vec2; aim: Vec2; fire: boolean; dash: boolean;
  revive: boolean; nextWeapon: boolean;
}
export type InputFrame = Partial<Record<PlayerId, PlayerInput>>;
export interface PlayerConfig { id: PlayerId; catId: CatId; weaponId: WeaponId }
export interface RunConfig {
  seed: number; mode: 'training' | 'campaign'; difficulty: Difficulty;
  players: PlayerConfig[];
}
export interface PlayerState extends PlayerConfig {
  position: Vec2; velocity: Vec2; aim: Vec2;
  hp: number; maxHp: number; status: 'active' | 'down';
  shotCooldown: number; dashCooldown: number; dashRemaining: number;
  invulnerableSeconds: number; downSeconds: number; reviveProgress: number;
  perks: PerkId[];
}
```

`World` inclui config, RNG, contador de IDs, tick, tempo, phase, resumePhase, players, enemies, projectiles, stageIndex, objetivo, encounter, escolhas de perks e resultado. Os detalhes dos registros de inimigos/projéteis são definidos nas tarefas proprietárias; não usar `any` para esconder contratos. `createWorld(config): World` já valida 1–2 IDs únicos; a jornada de produção da v1 cria exatamente um P1. `stepWorld(world,input): readonly GameEvent[]` avança exatamente 1/60 s quando `phase === 'playing'`. `pauseWorld` preserva a fase anterior; `resumeWorld` restaura apenas após confirmação.

Um evento contém `{id:number, tick:number, type:string, entityId?:string, playerId?:PlayerId, position?:Vec2}` e payload discriminado por tipo, refinado na tarefa proprietária. Tipos de evento usados: `shot`, `hit`, `enemy-killed`, `player-down`, `player-revived`, `objective-complete`, `boss-phase`, `run-ended`.

### Relógio e ciclo de vida

Máximo de 5 ticks por frame; excesso é descartado e contabilizado em diagnóstico, sem simular dezenas de segundos após retomar uma aba. Pausar limpa acumulador. Input de disparo é contínuo; dash/troca/confirmar são bordas que só o primeiro tick elegível consome. Ler gamepad por frame, preservar bordas até haver tick e limpar ao perder foco.

Restart cria mundo, RNG, pools e clocks novos a partir de config/seed; não reutiliza arrays mutados do objeto inicial. Unmount limpa listeners, timers e recursos possuídos. Cache de GLB compartilhado não é descartado por cada instância. StrictMode não duplica simulação, áudio ou handlers.

## 7. Câmera, cenários e arte

Câmera ortográfica de orientação fixa, centrada suavemente em P1 na campanha solo. Arenas compactas, jogáveis sem plataformas e sem saltos. Em 16:9 e 16:10, P1 deve permanecer legível dentro de 85% da região útil. Obstáculos altos são decorativos na periferia; nenhuma parede cobre continuamente o personagem. O enquadramento compartilhado já implementado pode permanecer como compatibilidade futura, sem teste de extremos de dois jogadores na v1.

### Pipeline Blender

Blender 4.5.14 LTS é o baseline proposto verificado nas fontes em 24/09/2026. Não é apresentado como versão mais recente de toda a família Blender. Se outra versão já instalada for adotada, registrar a mudança e passar o probe de exportação antes de produzir conteúdo em escala.

MCP comunitário upstream consultado: `ahujasid/mcp-for-blender`, conhecido anteriormente como blender-mcp. Usar uma revisão fixa, após inspeção do addon, manifesto e configuração local. Não pressupor que esteja instalado ou conectado. O MCP é transporte interativo; os scripts de exportação e validação devem funcionar também via CLI do Blender. O jogo final não requer Blender, MCP ou conta de geração.

```text
art/source/characters/cat-base.blend
art/source/vehicles/microkart.blend
art/source/enemies/robot-enemies.blend
art/source/levels/garage.blend
art/source/levels/market.blend
art/source/levels/rooftop.blend
art/source/audio/
art/ASSET_MANIFEST.json
public/assets/characters/*.glb
public/assets/enemies/*.glb
public/assets/levels/*.glb
public/assets/audio/
tools/blender/export_assets.py
tools/blender/validate_scene.py
tools/blender/render_previews.py
```

Blender: 1 unidade = 1 m, +Z para cima, -Y para frente. GLB/runtime: +Y para cima, +Z para frente. Testar essa transformação com marcador no cano. Aplicar escala/rotação na exportação sem destruir a fonte. GLB usa texturas empacotadas e materiais compatíveis, sem nós procedurais cuja aparência dependa exclusivamente do Blender. Assar quando necessário.

Hero final: microkart de aproximadamente 2,2 m de comprimento ×1,4 m de largura; cabeça expressiva e orelhas reconhecíveis. Colisor de gameplay usa raio 0,85 m, não o contorno das orelhas. Nós obrigatórios: `root`, `body`, `turret`, `muzzle`, `wheel_fl`, `wheel_fr`, `wheel_rl`, `wheel_rr`. Clipes rígidos `idle`, `hit`, `celebrate`. Evitar rig facial complexo ou animação de caminhada nesta versão.

Marcadores de cena usam prefixo `NK_`: `NK_spawn_p1`, `NK_enemy_spawn_*`, `NK_objective`, `NK_exit`, `NK_collider_*`. `NK_spawn_p2` pode existir para a fase futura, mas não é obrigatório nem pode bloquear o export da v1 solo. O exportador escreve dados de gameplay em JSON e valida alinhamento com o GLB. Marcadores não aparecem como geometria no jogo.

Metas iniciais por asset: hero ≤12 mil triângulos, inimigo comum ≤6 mil, boss ≤20 mil; texturas padrão 1024 px, exceção máxima 2048 px registrada; até 4 materiais por hero/inimigo. São limites de produção propostos, a confirmar pelo benchmark. Nenhum arquivo individual precisa exceder 50 MB para esta v1.

Manifesto registra ID estável, caminho de fonte, caminho de exportação, SHA-256, autor, origem, licença, evidência da licença, versão de Blender/exportador, nós/clipes esperados e estado `placeholder` ou `approved`. “Gerado por IA” não substitui licença de um modelo externo. Priorizar criação própria e assets CC0 comprovados. Não embarcar imagens de referência de jogos comerciais em `.tmp/`.

Não regerar por cima de `.blend` editado manualmente. Gerador cria arquivos novos; reexportação lê a fonte atual. Uma tarefa muda a fonte, produz preview e compara no runtime antes de substituir o export aprovado. Reprodutibilidade é semântica com ferramentas fixadas, não promessa de bytes idênticos entre versões distintas.

### Segurança operacional

Um único writer por sessão Blender. Serviço escuta somente loopback; sem acesso remoto público. Desabilitar telemetria conforme configuração documentada, registrar a revisão e manter credenciais fora do Git. Downloads não autorizam executar scripts embutidos. Abrir assets de terceiros com autoexec desativado. Não habilitar geradores pagos sem orçamento autorizado. Não rodar comandos sugeridos por metadados de um asset.

## 8. UX, áudio e acabamento

Menu de produção: Jogar / Treino / Opções. A configuração solo de P1 mostra gato, dispositivo, teste de inputs, dificuldade e confirmação. P2 e “Jogar em dupla” já existem no protótipo técnico, mas ficam indisponíveis na edição de produção da v1. A escolha de perks usa apenas o foco de P1.

HUD mostra P1, HP, arma, cooldown de dash e objetivo atual. Indicadores usam texto/forma além de cor. Reduzir brilho pós-processado, tremor e flashes é configurável; não esconder tiros inimigos com bloom. Tamanho do HUD deve ser legível em 1280×720, 1920×1080 e 1440×900.

Áudio inicial só após gesto de usuário. Três buses: música, efeitos e interface. Sons de disparo/hit/objetivo precisam ser distinguíveis; som de resgate permanece opcional enquanto P2 estiver fora da v1. Música eletrônica original ou CC0 documentada, sem trechos de músicas comerciais. Falha de áudio não bloqueia a partida. Pausa e restart não criam trilhas duplicadas.

Salvar apenas configurações e melhores resultados locais com campo version=1; sem salvar a campanha em andamento nesta versão. JSON corrompido ou storage indisponível aplica defaults e mostra aviso não bloqueante. Nada exige conta ou conexão durante a partida.

## 9. Qualidade, desempenho e conclusão

Alvo: experiência próxima de 60 FPS no MacBook Air M4 do usuário, em 1080p com DPR 1 e preset médio. Não é desempenho medido. Meta de aceite: frame time p95 ≤20 ms após aquecimento, durante uma sessão representativa de chefe; não usar navegador headless como prova de GPU real. Preset baixo reduz pós-processamento, sombras e resolução, mas nunca quantidade de inimigos ou dificuldade.

Limites iniciais: 24 inimigos ativos, 256 projéteis, 512 partículas; render instanciado quando apropriado. AI recalcula caminho em frequência limitada e escalonada, não em todo frame para todo inimigo. Testar arena e pools sob saturação sem crescimento infinito.

Três classes de aceite independentes:

1. **Regras:** unitários e integração provam HP de P1, colisões, objetivos, pausa e resultado corretos.
2. **Execução real:** browser com WebGL, GLBs reais, teclado/mouse de P1, eventual gamepad de P1 oferecido, sons, desempenho e restart.
3. **Experiência:** uma pessoa consegue concluir a campanha e entende por que ganhou ou perdeu. O desejo de repetir não é substituído por um screenshot verde.

Após a primeira campanha solo completa, testar com Marco antes de declarar conforto ou diversão. Sem essa sessão, registrar gate humano pendente; continuar conteúdo previsto sem afirmar que a experiência foi aprovada. A release pode ser tecnicamente candidata, mas não “validada em jogo real” enquanto esse gate faltar.

Entregar build local de produção, `Jogar.command`, instrução curta, controles, créditos e diagnóstico. O launcher inicia servidor exclusivamente em 127.0.0.1, abre o browser e encerra somente o processo que criou. Nada de matar todos os Chromes ou Blenders da máquina. Publicação online é uma ação separada.

## 10. Autoridade e mudanças

Este design prevalece sobre o plano em divergências. O ruling solo acima veio de instrução explícita de Marco, depois de T10; afeta T11–T25 e os critérios de aceite, sem invalidar os testes históricos de T01–T10. Cada alteração de contrato registra motivo, arquivos/testes afetados e custo de reversão. Bugs descobertos que impedem o objetivo pertencem à tarefa dona do comportamento, mesmo se o sintoma não estiver escrito literalmente. Não reabrir decisões de engine ou câmera por preferência do implementador. A v1 termina quando a campanha solo e o release local estiverem comprovados.
