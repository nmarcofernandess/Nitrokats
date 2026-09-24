# Aceite — Nitrokats Reborn

**Escopo revisado em 24/09/2026:** este aceite é da campanha local **solo para P1**. P2, cooperação, resgate de parceiro, teclado compartilhado e combinações de dois controles são futuros. T01–T10 já têm recibos históricos; seus testes cooperativos não são gate do release solo. Os itens abaixo continuam pendentes até prova específica.

## A. Revisão estática e regras

| ID | Verificação | Evidência exigida |
|---|---|---|
| A01 | Vida, arma, cooldown, perks e input de P1 corretos | Testes solo com campanha e escolha de perk reais |
| A02 | Dano de projétil e splash sem recursão ou duplicação | Unitário causal de impacto e saturação; friendly fire fica para P2 futuro |
| A03 | Movimento normalizado, dash, colisão e projétil segmentado | Testes parede fina, diagonal e impacto mais próximo |
| A04 | Pause/foco/restart sem estado preso | Replay + browser com teclas mantidas |
| A05 | P1 em zero HP perde e pode iniciar revanche limpa | Teste causal de derrota solo e restart; resgate é futuro |
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
- [ ] Screenshot de gameplay com P1 e inimigos/perigos em cada arena; preview isolado não basta.
- [ ] Interface inteira em PT-BR, perigos legíveis sem depender só de cor/bloom.

## C. Controle real de P1

Preencher cada linha oferecida na edição de produção com hardware, SO, navegador/versão, data e resultado. Não preencher PASS quando só houver injeção virtual.

| Perfil | Menu | Movimento + mira + tiro | Pausa/revanche | Perda de foco/retorno | Resultado inicial |
|---|---|---|---|---|---|
| P1 teclado/mouse | Pendente | Pendente | Pendente | Pendente | NÃO TESTADO |
| P1 gamepad standard, se oferecido | Pendente | Pendente | Pendente | Pendente | NÃO TESTADO |

Foco perdido sempre pausa e requer confirmação. Gamepad não standard só é declarado compatível se o remapeamento funcionar nele. Dois gamepads, teclado/mouse + gamepad em dupla e teclado compartilhado ficam em `FUTURO_P2`, sem gate nem selo de compatibilidade nesta v1.

## D. Sessão completa e release

- [ ] Abrir pelo launcher em pasta de release, sem dev server, com apenas a jornada solo disponível.
- [ ] P1 joga a campanha através das três arenas e chega à vitória pelas regras de combate.
- [ ] Provocar derrota legítima, voltar e iniciar outra run sem estado antigo.
- [ ] Ao pausar e reiniciar 20 vezes, não acumular listeners, runtimes, áudio ou recursos possuídos.
- [ ] GLB/sons/fontes carregam sem internet; localhost permanece ativo.
- [ ] Dados locais inválidos e falha de áudio não impedem jogar.
- [ ] Falha de asset informa o erro e permite voltar/tentar novamente, em vez de tela preta.
- [ ] Build normal não contém test bridge, setters de vitória, opção de dupla ativa ou referências comerciais de `.tmp`.
- [ ] Créditos, manifesto e guia viajam com a distribuição; fontes Blender ficam preservadas no repo.

## E. Performance

Alvo proposto: MacBook Air M4, 1920×1080, DPR1, qualidade média, perto de 60 FPS com p95 de frame <=20 ms. Registrar condições, temperatura/carga concorrente percebida, versão de browser e quantidade de entidades. Aquecer 60 s; medir 180 s em cenário de cap e durante chefe. Esses intervalos são protocolo de teste futuro, não estimativa de trabalho desta resposta.

Browser headless confirma funcionalidade, não o FPS da GPU Apple. Preset baixo pode reduzir custo visual; não pode reduzir inimigos/dano e chamar isso de otimização equivalente.

## F. Playtest solo de Marco

Uma sessão de aproximadamente 30 minutos, sem abrir código, sem ajuda do terminal após iniciar, e sem Blender. Observar:

- [ ] Marco entende o controle de P1 e consegue entrar no jogo.
- [ ] P1 permanece reconhecível e localizável nas três arenas.
- [ ] Marco entende a defesa e como evitar os ataques do chefe.
- [ ] Vitória, derrota e revanche fazem sentido sem explicação durante a partida.
- [ ] Configurações de volume, assistência e efeitos funcionam durante uma run solo.

Registrar nas palavras de Marco: o que foi divertido, o que confundiu, o que irritou e se escolheria repetir. Não reduzir a decisão a uma nota inventada pela IA. O playtest de Yasmin com P2 pertence à fase futura.

**Estados finais possíveis:**

- `BLOQUEADO_TECNICO`: alguma regra ou entrega essencial falhou.
- `CANDIDATO_TECNICO_COM_ACEITE_HUMANO_PENDENTE`: gates técnicos passaram, falta sessão real/hardware específico.
- `ACEITO_COM_AJUSTES`: sessão solo realizada, ajustes explicitamente aceitos por Marco.
- `ACEITO`: pacote e experiência solo validados por Marco.

Nenhum estado é preenchido automaticamente ao gerar este documento.
