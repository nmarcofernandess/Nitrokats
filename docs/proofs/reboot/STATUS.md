# Estado do Nitrokats Reborn

**Checkpoint local:** `codex/nitrokats-reborn-plan-20260924`, implementação até `82b8951`; revisão documental de escopo solo após esse commit.
**Atualizado:** 2026-09-24.
**Motivo da pausa:** liberar memória do Mac; a pausa ocorre entre tarefas, com a T10 commitada, revisada e a árvore limpa.

## Plano de implementação

| Tasks | Estado | Evidência |
|---|---|---|
| T01–T10 | Implementadas, verificadas e aprovadas em review independente | Recibos `T01.md` a `T10.md` nesta pasta; T10 inclui o vídeo automatizado |
| T11–T25 | Ainda não iniciadas; agora focadas na campanha solo de P1 | Seguir a spec, o plano e o aceite revisados nesta branch |

O plano contém **25 tasks**. Marco mudou o alvo do primeiro release para **P1 solo**, com P2 futuro. T01–T10 e seus testes cooperativos permanecem como histórico; o release final não depende de concluir a experiência de duas pessoas. Este checkpoint não declara o jogo completo nem pronto para release.

## Aceites que continuam pendentes

- Playtest solo de Marco, do início ao fim da campanha.
- Teste no Mac real de P1 com teclado/mouse e, se oferecido na edição de produção, um gamepad standard.
- Arte Blender editável, GLBs e arenas finais conforme T16–T19.
- Campanha, chefe, perks, estabilidade, desempenho, persistência e launcher/release local previstos nas T11–T25.

P2, resgate, teclado compartilhado e combinações de dois controles são `FUTURO_P2`, sem gate da v1. Os testes automatizados de navegador usam input virtual onde indicado nos recibos. Eles não contam como validação de controle físico, sensação ou aceitação humana. Consulte `docs/superpowers/plans/2026-09-24-acceptance.md` para os critérios completos.

## Retomada

Continue nesta branch, confira o `HEAD` remoto atual e o estado da árvore, depois inicie T11 com desenvolvimento subagent-driven, teste causal, review independente e atualização deste checkpoint após cada task. Use uma run com apenas P1 para todos os novos gates de campanha. Não publique nem faça merge; o push desta branch é apenas uma cópia de segurança para retomada.
