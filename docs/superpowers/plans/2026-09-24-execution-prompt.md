# Prompt de execução — Nitrokats Reborn

Copie o bloco abaixo para a IA local depois de colocar `docs/superpowers` deste pacote no repositório. O envio do prompt adota a proposta de design para execução; este pacote, por si só, não executou nem alterou o projeto.

```text
Trabalhe em nmarcofernandess/Nitrokats. Quero implementar o Nitrokats Reborn descrito neste pacote, até uma versão cooperativa local completa para duas pessoas. Esta execução adota a câmera isométrica compartilhada e o escopo fechado da spec; não é um kart de corrida nem a continuação da câmera TPS.

Leia inteiros:
1. docs/superpowers/research/2026-09-24-repository-audit.md
2. docs/superpowers/specs/2026-09-24-nitrokats-reborn-design.md
3. docs/superpowers/plans/2026-09-24-nitrokats-reborn-plan.md
4. docs/superpowers/plans/2026-09-24-acceptance.md

Use Superpowers: using-git-worktrees e subagent-driven-development, com implementador por unidade, review de contrato/qualidade e review final. Sem mecanismo de subagents, use executing-plans e registre que foi execução inline. Não finja agentes nem testes.

Primeiro localize o checkout pelo remote correto e preserve qualquer trabalho local. A base planejada é codex/third-person-cat-shooter@3f49c8d3cb3df0c31b89b02331d28677b19826f5, dois commits à frente do master observado. Faça fetch, compare o HEAD atual e registre diferenças antes de escolher a base. Não resete, faça force-push ou sobrescreva uma pasta existente. Trabalhe em worktree/branch isolada, por exemplo codex/nitrokats-reborn.

Leia as regras locais realmente existentes e seus alvos antes de editar. Registre preflight de interfaces e dependências entre as 25 tarefas. O plano é argumento da spec; resolva contradições pela spec e registre Ruling com decisão, motivo e impacto. Não reabra engine/câmera/escopo por preferência estética do implementador.

Execute T01–T25 com ledger persistente. Depois de compaction, retome pela última tarefa não concluída e commits reais, não pela memória. Não peça confirmação depois de cada tarefa. A falta de uma linha literal no plano não autoriza deixar quebrado um comportamento necessário ao objetivo: investigue e corrija dentro da tarefa dona.

Comece pelo jogo para duas pessoas em greybox. Reaproveite armas/perks/conceitos da branch TPS e preserve o histórico, mas substitua o estado global single-player por simulação com PlayerId, tick fixo, RNG e lifecycle único. Não duplique CatTank nem deixe mesh/Zustand/React concorrerem como escritores do combate.

Blender é a fonte de arte; GLB é o runtime. Faça probe real de versão/eixos/exportação e use MCP comunitário revisado/pinado somente se estiver configurado com segurança. CLI/bpy também deve funcionar. Não sobrescreva fontes .blend editadas manualmente. Um writer de Blender; nenhum gerador pago, instalação/configuração global ou publicação sem autorização específica.

Para cada tarefa: teste causal RED, implementação, GREEN, regressões focais, prova visual quando aplicável, revisão e commit com escopo. Guarde receipts em docs/proofs/reboot e o ledger da skill. Não rode campanha longa/full render a cada ajuste de texto; use os gates definidos. Coordenador aguarda agentes sem polling frenético e não altera arquivos em posse deles.

Saída final obrigatória: build local de produção + Jogar.command + COMO-JOGAR.md + créditos/manifesto + fontes Blender + evidências de campanha, controles, estabilidade e desempenho. Sem online/LAN/backend, sem nova engine, sem editor de mapas e sem placeholders passando por arte final.

O aceite inclui três arenas, quatro gatos cosméticos, três armas, seis perks, três arquétipos de inimigo, um chefe, resgate cooperativo, opções acessíveis e revanche. Não encerre em 'o build passou'. Prepare candidato jogável e registre a sessão de Marco e Yasmin como gate humano. Sem pessoas/hardware disponíveis, deixe o gate pendente e conclua o trabalho técnico independente; não invente feedback, FPS ou compatibilidade.

Não mergeie nem publique automaticamente. Entregue no relatório o que foi executado de fato, caminho real da release, comandos, resultados, commits, pendências e limitações. Toda conclusão deve apontar para evidência.
```