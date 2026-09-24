# Estado do Nitrokats Reborn

**Checkpoint local:** `codex/nitrokats-reborn-plan-20260924`, implementação até `82b8951`.
**Atualizado:** 2026-09-24.
**Motivo da pausa:** liberar memória do Mac; a pausa ocorre entre tarefas, com a T10 commitada, revisada e a árvore limpa.

## Plano de implementação

| Tasks | Estado | Evidência |
|---|---|---|
| T01–T10 | Implementadas, verificadas e aprovadas em review independente | Recibos `T01.md` a `T10.md` nesta pasta; T10 inclui o vídeo automatizado |
| T11–T25 | Ainda não iniciadas | Seguir `docs/superpowers/plans/2026-09-24-nitrokats-reborn-plan.md` na ordem definida |

O plano contém **25 tasks**. Este checkpoint não declara o jogo completo nem pronto para release.

## Aceites que continuam pendentes

- Playtest de Marco e Yasmin com duas pessoas, do início ao fim da campanha.
- Teste em hardware de teclado compartilhado, teclado/mouse + gamepad e dois gamepads.
- Arte Blender editável, GLBs e arenas finais conforme T16–T19.
- Campanha, chefe, perks, estabilidade, desempenho, persistência e launcher/release local previstos nas T11–T25.

Os testes automatizados de navegador usam input virtual onde indicado nos recibos. Eles não contam como validação de controle físico, sensação ou aceitação humana. Consulte `docs/superpowers/plans/2026-09-24-acceptance.md` para os critérios completos.

## Retomada

Continue nesta branch, confira o `HEAD` remoto atual e o estado da árvore, depois inicie T11 com desenvolvimento subagent-driven, teste causal, review independente e atualização deste checkpoint após cada task. Não publique nem faça merge; o push desta branch é apenas uma cópia de segurança para retomada.
