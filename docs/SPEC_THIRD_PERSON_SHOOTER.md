# LÓGICA DE NEGÓCIO - THIRD PERSON CAT SHOOTER (FORTNITE-LIKE)

## TL;DR EXECUTIVO
Transformar o modo principal de combate para visão em terceira pessoa atrás do personagem, com mira por retículo central e movimentação orientada pela câmera. O objetivo é aumentar skill expression, legibilidade tática e sensação de impacto sem perder a identidade arcade do jogo.

## OBJETIVO ESTRATÉGICO
- Sair de "arena top-down" para "combat shooter de posicionamento".
- Manter curva de entrada simples (WASD + mouse), mas abrir profundidade com cobertura, distância e precisão.
- Preparar base para features futuras: dash, cover, classes de arma, projétil balístico, mapas com verticalidade.

## NÃO-OBJETIVOS (AGORA)
- Multiplayer online.
- Construção estilo Fortnite.
- Inventário complexo.
- Sistema de loot procedural.

## FUNCIONALIDADES

### 1. Câmera Third Person Over-Shoulder
**O que faz:** câmera fica atrás e acima do gato, suavizada por spring/lerp, com yaw/pitch pelo mouse.
**Quando ativa:** `gameState=playing`.
**Input -> Output:**
- Input: movimento do mouse
- Output: rotação de câmera + direção de mira

### 2. Movimento Relativo à Câmera
**O que faz:** WASD move o player no plano XZ relativo ao forward/right da câmera.
**Quando ativa:** `playing` e não pausado.
**Input -> Output:**
- `W`: avança para frente da câmera
- `S`: recua
- `A/D`: strafe

### 3. Sistema de Mira Central
**O que faz:** retículo fixo no centro da tela; raycast define ponto de impacto no mundo.
**Quando ativa:** sempre em `playing`.
**Input -> Output:**
- Input: direção da câmera (ray)
- Output: ponto de mira (world hit point)

### 4. Tiro com Origem no Cano + Alvo por Raycast
**O que faz:** tiro nasce no cano do gato e segue para direção da mira central.
**Quando ativa:** mouse pressionado + cooldown respeitado.
**Input -> Output:**
- Input: posição do cano + direção de mira
- Output: projétil com direção normalizada

### 5. Aim Assist Leve (Opcional, Configurável)
**O que faz:** em pequeno cone do retículo, prioriza alvo inimigo próximo da linha de mira.
**Quando ativa:** padrão `on` no desktop, desligável.
**Input -> Output:**
- Input: raycast + lista de inimigos
- Output: direção ajustada (clamp angular)

### 6. Occlusion & Camera Collision
**O que faz:** se parede estiver entre câmera e player, aproxima câmera para não atravessar geometria.
**Quando ativa:** por frame em `playing`.
**Input -> Output:**
- Input: ray player->cameraTarget
- Output: distância efetiva da câmera

### 7. HUD Shooter
**O que faz:** retículo central, ammo visível, hit marker, feedback de dano.
**Quando ativa:** `playing`.
**Input -> Output:**
- Input: evento de hit/kill/ammo
- Output: UI feedback imediato

## REGRAS DE NEGÓCIO
- ✅ **PODE:** mirar livremente em yaw/pitch dentro de limites configuráveis.
- ✅ **PODE:** mover e atirar simultaneamente (strafing shooter).
- ❌ **NÃO PODE:** câmera atravessar parede/obstáculo sólido.
- 🔄 **SEMPRE:** movimento é relativo à câmera, não ao mundo fixo.
- 🔄 **SEMPRE:** tiro respeita rate-of-fire e ammo do modo spread.
- 🔀 **SE** houver alvo no cone de aim assist **ENTÃO** aplicar ajuste angular pequeno.
- 🔀 **SE** player entrar em `paused`/`gameover` **ENTÃO** congelar input e simulação de combate.

## ENTIDADES E RESPONSABILIDADES

### PlayerController3P
- Ler input WASD/mouse
- Atualizar rotação do corpo em função da mira
- Gerar intenção de movimento

### ThirdPersonCameraController
- Gerir yaw/pitch
- Follow com smoothing
- Resolver colisão de câmera (occlusion)

### AimSystem
- Raycast central
- Seleção de ponto de impacto
- Aim assist (opcional)

### WeaponSystem
- Cooldown, ammo, spread
- Spawn de projétil do cano

### ProjectileSystem
- Movimento, colisão, dano
- Partículas, audio, score/kill

### HUDSystem
- Crosshair fixo
- Hit marker
- Ammo e feedback visual

## FLUXO LÓGICO

```text
[Input Mouse/WASD]
        |
        v
[CameraController atualiza yaw/pitch]
        |
        v
[AimSystem raycast centro da tela]
        |
        v
[PlayerController calcula movimento relativo à câmera]
        |
        +--> [WeaponSystem verifica cooldown/ammo]
                 |
                 v
          [Spawn projectile no cano]
                 |
                 v
          [ProjectileSystem aplica colisão/dano]
                 |
                 v
               [HUD + SFX + Score]
```

## JORNADA DO USUÁRIO
1. Usuário entra em partida -> sistema ativa câmera third person.
2. Usuário move mouse -> câmera gira e retículo central define alvo.
3. Usuário pressiona WASD -> personagem se move relativo à câmera.
4. Usuário segura tiro -> projéteis seguem direção da mira.
5. Usuário acerta inimigo -> hit marker + dano + feedback sonoro.
6. Usuário elimina alvo -> score/kills/powerup atualizados.

## PARÂMETROS INICIAIS (BASELINE)
- Camera distance: `4.5`
- Camera height: `1.6`
- Pitch min/max: `-10° / +45°`
- Camera smoothing: `0.12`
- Mouse sensitivity: `0.0022`
- Aim assist cone: `3.5°`
- Aim assist strength: `0.25`

## PLANO DE EXECUÇÃO (IMPLEMENTAÇÃO)
1. Criar `ThirdPersonCameraController` desacoplado do `CatTank`.
2. Migrar `Crosshair` para UI de tela (center-fixed) + raycast de mundo no `AimSystem`.
3. Reescrever input de movimento para vetores relativos à câmera.
4. Ajustar spawn de projétil para origem no cano e direção de mira.
5. Adicionar colisão de câmera com obstáculos da arena.
6. Incluir hit marker e ajuste de HUD para modo shooter.
7. Rodar balance pass de velocidade, sensibilidade, recoil e distância de câmera.

## CRITÉRIOS DE ACEITAÇÃO
- Jogador consegue mirar com precisão usando centro da tela.
- Movimento é consistente em qualquer rotação de câmera.
- Câmera não atravessa geometrias sólidas.
- Tiros saem do cano e convergem para alvo de mira.
- `ESC` pausa totalmente input, tiro e IA.
- Build e lint verdes após migração.

## RISCOS E MITIGAÇÃO
- Risco: motion sickness por câmera brusca.
  - Mitigação: smoothing configurável + clamp de pitch + opção de sensibilidade.
- Risco: discrepância visual entre retículo e origem do tiro em curta distância.
  - Mitigação: dual-ray (camera ray + muzzle correction) com prioridade para hit plausível.
- Risco: colisão de câmera gerando clipping em cantos.
  - Mitigação: sphere cast com margem + fallback de distância mínima.

## DISCLIAMERS CRÍTICOS
- Sem desacoplamento de câmera/aim/input, o código vira monolito difícil de balancear.
- Over-aim-assist mata skill; manter assist leve e configurável.
- Sem critérios de aceitação objetivos, sensação de "ficou estranho" vira ciclo infinito de tweak.
