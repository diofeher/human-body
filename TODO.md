# TODO

## Animações de exercícios com peso corporal

Atualizado em 2026-11-26. Agachamento implementado no branch `feat/squat-animation` (não publicado).
Design: `docs/superpowers/specs/2026-11-26-squat-animation-design.md`.

### Pendências do agachamento
- Revisão por profissional qualificado: movimento, orientações, erros comuns e papéis dos músculos.
  Não fazer merge em `main` antes disso (o push publica o site).
- Testar em um celular de verdade.
- Acabamento: pontas dos isquiotibiais atravessam o glúteo no fundo; glúteos se encontram no meio;
  dobra no topo do reto femoral; borda do glúteo irregular; palmas viradas para cima.
- A verificação automática compara músculos só com quadril, fêmur, tíbia, fíbula, patela e calcâneo.
- Antes de adicionar versões erradas do movimento, permitir mais de um movimento em `squat.json`.

## Plano original (histórico)

### Objetivo
As animações devem ensinar, em detalhe, as três coisas:
- quais músculos cada exercício trabalha;
- como as articulações se movem;
- como executar o exercício corretamente.

### Ponto de partida
- Os modelos exportados são peças separadas e estáticas; a animação foi removida na exportação.
- A inspeção de `Startup.blend` não encontrou nenhum objeto do tipo armadura (esqueleto de animação).
- `Z-Biomechanics.7z`, no repositório do Z-Anatomy, ainda não foi aberto. Verificar primeiro.

### Etapas sugeridas (a confirmar no design)
1. Agachamento apenas com o esqueleto: agrupar os ossos e definir os eixos das articulações.
2. Agachamento com os principais músculos da perna e do quadril acompanhando os ossos,
   com destaque para os que trabalham.
3. Outros exercícios, como flexão de braços e avanço.

Deformação muscular realista (volume e deslizamento) é muito mais difícil e não foi
recomendada. Decidir no design quanto detalhe é necessário.

### Antes de publicar
- Revisão dos movimentos, das instruções de execução e dos músculos destacados por um
  profissional qualificado (fisioterapeuta ou profissional de educação física).
- O destaque indica os músculos normalmente usados, não mede a ativação.
- Verificar a licença de qualquer material novo (modelos, capturas de movimento).

### Próximo passo
Ver o agachamento em `#agachamento` e providenciar a revisão.
