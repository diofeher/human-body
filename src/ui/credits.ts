export const CREDITS_HTML = `
  <h2>Créditos e licenças</h2>
  <p><strong>Material educativo. Não substitui orientação médica.</strong> O modelo representa um corpo masculino adulto, pode conter erros e está incompleto: não inclui pele, orelha interna nem rins, entre outras estruturas.</p>
  <p>Os nomes em português ainda não foram revisados. Estruturas sem tradução aparecem em inglês. As descrições marcadas como “não revisado” foram redigidas com IA.</p>
  <h3>Modelo 3D</h3>
  <ul>
    <li>“BodyParts3D - The Database Center for Life Science - <a href="https://creativecommons.org/licenses/by-sa/2.1/jp/">CC-BY-SA 2.1 Japan</a>” (<a href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html">modelo original</a>; o documento de licença mais recente do Z-Anatomy credita CC BY 4.0)</li>
    <li>“<a href="https://github.com/Z-Anatomy/Models-of-human-anatomy">Z-Anatomy - The libre 3D atlas of anatomy</a> - CC-BY-SA 4.0”</li>
  </ul>
  <p>Modelos usados como referência ou incluídos e adaptados, segundo o Z-Anatomy: “Brainder” e “White matter” (University of Washington); “Cranial Nerves and Foramina” (University of Dundee, CAHID, CC BY 4.0); “Anatomy of the Inner Ear” (University of Dundee School of Medicine, CC BY-NC-SA 4.0); “Kidney” (Lissie Cowley, CC BY-NC 4.0). Orelha interna e rins foram removidos deste atlas.</p>
  <p>Autores: Kousaku Okubo (BodyParts3D), Gauthier Kervyn, Marcin Zielinski e Lluís Vinent. Tradução dos nomes para o português: Ana Teresa Bigio.</p>
  <p>Nomes em português: arquivo Translations0.txt de <a href="https://github.com/LluisV/Z-Anatomy">github.com/LluisV/Z-Anatomy</a>, CC BY-SA 4.0. Alguns termos foram corrigidos neste atlas e os linfonodos foram renomeados.</p>
  <h3>Alterações feitas</h3>
  <p>Remoção da orelha interna, dos rins, da pelve renal, dos vasos intrarrenais, das inserções musculares, das regiões do corpo, de rótulos e de linhas de referência; conversão de curvas em malhas; redução de polígonos; remoção de materiais; separação em camadas (com fáscias e tecidos semelhantes separados dos músculos), compactação e extração dos nomes.</p>
  <h3>Licença</h3>
  <p>Os modelos convertidos e os dados adaptados são compartilhados sob <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.pt-br">CC BY-SA 4.0</a>. Os autores do Z-Anatomy pedem que o código do aplicativo também seja compartilhado; o endereço do código será publicado aqui antes de o site ir ao ar.</p>
  <form method="dialog"><button>Fechar</button></form>`

export function setupCredits(dialog: HTMLDialogElement, openButton: HTMLElement) {
  dialog.innerHTML = CREDITS_HTML
  openButton.addEventListener('click', () => dialog.showModal())
}
