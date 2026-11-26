# Atlas 3D do Corpo Humano

Página educativa em português com camadas anatômicas filtráveis e detalhes de cada estrutura.
Não substitui orientação médica.

## Rodar
    npm install
    npm run dev        # desenvolvimento
    npm test
    npm run build      # gera dist/

## Recriar os modelos
Requer Blender (`brew install --cask blender`).

    tools/convert/fetch.sh
    /Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup --disable-autoexec \
      .cache/template/Z-Anatomy/Startup.blend --python tools/convert/inspect.py -- "$PWD/.cache/inventory.json"
    npm run data
    tools/convert/build-models.sh

`--disable-autoexec` impede a execução de scripts contidos no arquivo baixado.

## Exercícios
`#agachamento`, `#avanco` e `#flexao` abrem as animações. Posições, tempos, orientações e músculos
ficam em `src/exercises/{squat,lunge,pushup}.json`; depois de mudar `motion`, `solids` ou músculos,
rode `tools/convert/build-exercise.sh [squat|lunge|pushup]` (requer os arquivos de `fetch.sh`).
Com `RENDERS=<pasta>`, o script também gera imagens para conferência. O conteúdo ainda não foi
revisado: marque `reviewed: true` somente após revisão por pessoa qualificada.

## Descrições
Ficam em `src/data/descriptions.ts`, redigidas com IA. Marque `reviewed: true` somente após
revisão por pessoa qualificada.

## Publicação
O workflow `.github/workflows/pages.yml` testa, gera e publica o site no GitHub Pages a cada
push em `main`: https://diofeher.github.io/human-body/

## Licenças
O projeto, incluindo o código, é compartilhado sob CC BY-SA 4.0 (arquivo `LICENSE`), como
pedem os autores do Z-Anatomy para aplicativos que leem o modelo. Atribuições dos modelos e
dados em `LICENSE-ASSETS`. Bibliotecas de terceiros mantêm suas próprias licenças.
