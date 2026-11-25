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

## Descrições
Ficam em `src/data/descriptions.ts`, redigidas com IA. Marque `reviewed: true` somente após
revisão por pessoa qualificada.

## Licenças
- Modelos e dados (`public/models`, `public/data`): CC BY-SA 4.0, veja `LICENSE-ASSETS`.
- Código: **ainda sem arquivo de licença**. Os autores do Z-Anatomy pedem que o código de um
  aplicativo que lê o modelo também seja compartilhado. Antes de publicar o site, defina a
  licença do código, torne o repositório público e coloque o link na tela de créditos.
