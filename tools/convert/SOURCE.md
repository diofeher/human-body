# Fontes

| Fonte | Commit | Baixado em |
|---|---|---|
| github.com/Z-Anatomy/Models-of-human-anatomy | d6ea5c20a343c0009a443617360c0170807cd080 | 2026-11-25 |
| github.com/LluisV/Z-Anatomy (Resources/Translations0.txt) | 6c7f9016bd5899ac8edafd31b9900c151df42ed6 | 2026-11-25 |

Documento de licença: https://docs.google.com/document/d/1peWW_7IiVgTTAwcI_auv38YSJ6qGWRuTMxzzhkRpXIk (lido em 2026-11-25).
Condição declarada pelos autores: o aplicativo que lê o modelo também precisa ter o código compartilhado.

Rode `tools/convert/fetch.sh` para baixar.

## Animação do agachamento

`Z-Biomechanics.7z` (mesmo repositório e commit dos modelos): usamos somente as posições de repouso
das articulações do quadril, joelho, tornozelo e ombro, lidas do objeto `Armature` e gravadas em
`exercise.py`. O texto de licença do arquivo cita "BodyParts3D, © The Database Center for Life Science
licensed under CC Attribution-Share Alike 2.1 Japan", modificado por Z-Anatomy. Os movimentos do
arquivo não são usados. Gere com `tools/convert/build-exercise.sh` (cerca de 5 minutos).
