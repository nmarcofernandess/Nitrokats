# Aceite — Nitrokats Reborn

**Estado inicial:** todos os itens PENDENTES. Estes são critérios futuros, não resultados.

## A. Revisão estática e regras

| ID | Verificação | Evidência exigida |
|---|---|---|
| A01 | Vida, arma, cooldown, perks e input independentes | Testes P1/P2 com estados distintos |
| A02 | Friendly fire e splash aliados desligados | Unitário causal com dano tentado |
| A03 | Movimento normalizado, dash, colisão e projétil segmentado | Testes parede fina, diagonal e impacto mais próximo |
| A04 | Pause/foco/restart sem estado preso | Replay + browser com teclas mantidas |
| A05 | Resgate manual/automático e derrota simultânea | Testes dos limites de tempo e dois caídos |
| A06 | Eliminação/defesa/boss só concluem por ação real | Ausência de boss e zona desocupada não progridem |
| A07 | Perks individuais e descrições matematicamente corretas | Três opções únicas, escolhas independentes |
| A08 | RNG/clock estáveis em render 30/60/120 Hz | Comparação de combate após input por tick igual |

## B. Conteúdo e arte

- [ ] Quatro aparências: Anakin, Yang, Maya e Ivy, com o mesmo conjunto de regras.
- [ ] Três armas distintas, seis perks, três inimigos comuns e MechaCat em duas fases.
- [ ] Garagem, Mercado e Telhado completos, não somente nomes ou recolors de uma sala vazia.
- [ ] Fontes .blend editáveis, GLBs e JSON de colisão correspondentes à mesma revisão.
- [ ] Escala/eixos/muzzle/clips conferidos no renderer real.
- [ ] Manifesto com autoria/origem/licença/evidência/SHA e nenhum placeholder aprovado por omissão.
- [ ] Screenshot de gameplay com dois jogadores em cada arena; preview isolado não basta.
- [ ] Interface inteira em PT-BR, perigos legíveis sem depender só de cor/bloom.

## C. Controles reais

Preencher cada linha com hardware, SO, navegador/versão, data e resultado. Não preencher PASS quando só houver injeção virtual.

| Perfil | Menu | Movimento + mira + tiro | Resgate/pausa | Desconexão/retorno | Resultado inicial |
|---|---|---|---|---|---|
| Teclado/mouse + gamepad | Pendente | Pendente | Pendente | Pendente | NÃO TESTADO |
| Dois gamepads | Pendente | Pendente | Pendente | Pendente | NÃO TESTADO |
| Teclado compartilhado assistido | Pendente | Pendente | Pendente | Pendente | NÃO TESTADO |

Um controle não standard só é declarado compatível se o remapeamento funcionar nele. Foco perdido sempre pausa e requer confirmação. As combinações sem hardware disponível ficam pendentes; não eliminar o requisito silenciosamente.

## D. Sessão completa e release

- [ ] Abrir pelo launcher em pasta de release, sem dev server.
- [ ] Jogar a campanha através das três arenas e chegar à vitória pelas regras de combate.
- [ ] Provocar derrota legítima, voltar e iniciar outra run sem estado antigo.
- [ ] Ao pausar e reiniciar 20 vezes, não acumular listeners, runtimes, áudio ou recursos possuídos.
- [ ] GLB/sons/fontes carregam sem internet; localhost permanece ativo.
- [ ] Dados locais inválidos e falha de áudio não impedem jogar.
- [ ] Falha de asset informa o erro e permite voltar/tentar novamente, em vez de tela preta.
- [ ] Build normal não contém test bridge, setters de vitória ou referências comerciais de `.tmp`.
- [ ] Créditos, manifesto e guia viajam com a distribuição; fontes Blender ficam preservadas no repo.

## E. Performance

Alvo proposto: MacBook Air M4, 1920×1080, DPR1, qualidade média, perto de 60 FPS com p95 de frame <=20 ms. Registrar condições, temperatura/carga concorrente percebida, versão de browser e quantidade de entidades. Aquecer 60 s; medir 180 s em cenário de cap e durante chefe. Esses intervalos são protocolo de teste futuro, não estimativa de trabalho desta resposta.

Browser headless confirma funcionalidade, não o FPS da GPU Apple. Preset baixo pode reduzir custo visual; não pode reduzir inimigos/dano e chamar isso de otimização equivalente.

## F. Playtest Marco + Yasmin

Uma sessão de 30 minutos, sem abrir código, sem ajuda do terminal após iniciar, e sem Blender. Observar separadamente:

- [ ] Cada um entende seu controle e consegue entrar no jogo.
- [ ] Ambos reconhecem seu personagem e conseguem localizar o parceiro.
- [ ] Cada um consegue resgatar o outro pelo menos uma vez.
- [ ] Ambos entendem o que fazer na defesa e como evitar os ataques do chefe.
- [ ] Vitória, derrota e revanche fazem sentido sem explicação do desenvolvedor.
- [ ] Configurações de volume, assistência e efeitos resolvem diferenças de preferência.

Registrar em palavras dos jogadores: o que foi divertido, o que confundiu, o que irritou e se escolheriam repetir. Não reduzir a decisão a uma nota inventada pela IA. Uma pessoa gostar não representa o feedback da outra.

**Estados finais possíveis:**

- `BLOQUEADO_TECNICO`: alguma regra ou entrega essencial falhou.
- `CANDIDATO_TECNICO_COM_ACEITE_HUMANO_PENDENTE`: gates técnicos passaram, falta sessão real/hardware específico.
- `ACEITO_COM_AJUSTES`: sessão realizada, ajustes explicitamente aceitos pelos dois.
- `ACEITO`: pacote e experiência validados pelas pessoas que vão jogar.

Nenhum estado é preenchido automaticamente ao gerar este documento.