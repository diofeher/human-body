# TODO

## Animações de exercícios com peso corporal

Atualizado em 2026-11-27. Agachamento, avanço parado e flexão de braços implementados no branch
`feat/squat-animation` (não mesclados em `main`).
Design: `docs/superpowers/specs/2026-11-26-squat-animation-design.md` e
`docs/superpowers/specs/2026-11-26-lunge-pushup-design.md`.

### Pendências de todos os exercícios
- Revisão dos três exercícios aprovada (informado em 2026-11-27). Mudanças no movimento, nas
  orientações, nos erros comuns ou nos músculos pedem nova revisão.
- O push em `main` publica o site.
- Testar em um celular de verdade.
- Antes de adicionar versões erradas do movimento, permitir mais de um movimento por exercício.

### Pendências do agachamento
- Acabamento: pontas dos isquiotibiais atravessam o glúteo no fundo; glúteos se encontram no meio;
  dobra no topo do reto femoral; borda do glúteo irregular.
- A verificação automática compara músculos só com quadril, fêmur, tíbia, fíbula, patela e calcâneo.

### Pendências do avanço e da flexão
- Conferir de perto o acabamento dos músculos em vários ângulos.
- Na flexão, escápula e clavícula não se movem.
- Na flexão, a verificação automática compara músculos só com úmero, escápula, clavícula e ulna
  (não com as costelas).
- O avanço mostra só a perna direita à frente.

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
Ver `#agachamento`, `#avanco` e `#flexao` e decidir quando publicar.
