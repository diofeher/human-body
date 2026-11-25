import type { Structure } from '../types.ts'
import { parseName } from '../../tools/convert/names.ts'

// Textos originais redigidos com IA. Só marque reviewed: true após revisão por pessoa qualificada.
const draft = (text: string) => ({ text, reviewed: false })

export const DESCRIPTIONS: Record<string, { text: string; reviewed: boolean }> = {
  // Esqueleto
  'Frontal bone': draft('Osso do crânio que forma a testa e o teto das órbitas. Protege os lobos frontais do cérebro e abriga os seios frontais.'),
  'Parietal bone': draft('Osso par que forma grande parte do teto e das laterais do crânio. Os dois se unem na sutura sagital.'),
  'Occipital bone': draft('Forma a parte posterior e inferior do crânio. Nele está o forame magno, por onde o sistema nervoso central se continua do encéfalo para a medula espinal.'),
  'Temporal bone': draft('Osso par na lateral do crânio. Abriga estruturas da audição e do equilíbrio e participa da articulação temporomandibular.'),
  'Mandible': draft('Osso que forma a parte inferior da face e sustenta os dentes inferiores. É o único osso móvel do crânio, além dos ossículos da audição, e participa da mastigação e da fala.'),
  'Atlas (C1)': draft('Primeira vértebra cervical. Sustenta o crânio e, com ele, permite principalmente o movimento de acenar que sim.'),
  'Axis (C2)': draft('Segunda vértebra cervical. Possui o dente do áxis, em torno do qual o atlas gira, permitindo virar a cabeça.'),
  'Body of sternum': draft('Parte central e mais longa do esterno, no meio da parede anterior do tórax. Nele se fixam cartilagens das costelas.'),
  'Clavicle': draft('Osso alongado entre o esterno e a escápula. Mantém o ombro afastado do tronco e transmite forças do membro superior ao esqueleto axial.'),
  'Scapula': draft('Osso plano e triangular na parte posterior do tórax. Articula-se com o úmero e a clavícula e serve de fixação a vários músculos do ombro.'),
  'Humerus': draft('Osso do braço, entre o ombro e o cotovelo. Articula-se com a escápula, o rádio e a ulna.'),
  'Radius': draft('Osso lateral do antebraço, do lado do polegar. Gira em torno da ulna nos movimentos de virar a palma da mão para cima e para baixo.'),
  'Ulna': draft('Osso medial do antebraço, do lado do dedo mínimo. Forma a principal parte da articulação do cotovelo.'),
  'Hip bone': draft('Osso par da pelve, formado pela fusão do ílio, do ísquio e do púbis. Recebe a cabeça do fêmur no acetábulo.'),
  'Sacrum': draft('Osso triangular formado pela fusão das vértebras sacrais. Une a coluna vertebral aos ossos do quadril.'),
  'Femur': draft('Osso da coxa, o mais longo do corpo humano. Articula-se com o quadril em cima e com a tíbia e a patela embaixo, e sustenta o peso do corpo ao ficar de pé e andar.'),
  'Patella': draft('Osso sesamoide na frente do joelho, inserido no tendão do quadríceps. Protege a articulação e melhora a alavanca da extensão do joelho.'),
  'Tibia': draft('Osso medial e mais robusto da perna. Transmite a maior parte do peso do corpo do joelho ao tornozelo.'),
  'Fibula': draft('Osso fino na parte lateral da perna. Sustenta pouco peso, serve de fixação a músculos e ajuda a estabilizar o tornozelo.'),
  'Calcaneus': draft('Osso do calcanhar e o maior osso do pé. Recebe o tendão do calcâneo e apoia o peso do corpo.'),
  // Articulações
  'Anterior cruciate ligament': draft('Ligamento no interior do joelho que limita o deslizamento da tíbia para a frente em relação ao fêmur. Também ajuda a controlar a rotação.'),
  'Posterior cruciate ligament': draft('Ligamento no interior do joelho que limita o deslizamento da tíbia para trás em relação ao fêmur.'),
  'Medial meniscus': draft('Fibrocartilagem em forma de C na parte medial do joelho. Distribui a carga e melhora o encaixe entre o fêmur e a tíbia.'),
  'Lateral meniscus': draft('Fibrocartilagem quase circular na parte lateral do joelho. Distribui a carga e contribui para a estabilidade da articulação.'),
  'Fibular collateral ligament': draft('Ligamento em forma de cordão na lateral do joelho, do fêmur à fíbula. Resiste a forças que tendem a abrir o lado lateral da articulação.'),
  // Músculos
  'Superficial part of masseter': draft('Porção superficial do masseter, um dos principais músculos da mastigação. Eleva a mandíbula, fechando a boca.'),
  'Sternocleidomastoid muscle': draft('Músculo do pescoço que vai do esterno e da clavícula ao processo mastoide. De um lado, inclina a cabeça e gira o rosto para o lado oposto; os dois juntos ajudam a flexionar o pescoço.'),
  'Latissimus dorsi muscle': draft('Músculo largo da parte inferior das costas que se insere no úmero. Estende, aduz e roda medialmente o braço.'),
  'Rectus abdominis muscle': draft('Músculo longo na parte da frente do abdome. Flexiona o tronco e ajuda a comprimir o conteúdo abdominal.'),
  'Diaphragm': draft('Músculo em forma de cúpula que separa o tórax do abdome. É o principal músculo da respiração: ao se contrair, aumenta o volume do tórax e favorece a entrada de ar.'),
  'Long head of biceps brachii': draft('Uma das duas cabeças do bíceps braquial, na frente do braço. O bíceps flexiona o cotovelo e é um forte supinador do antebraço.'),
  'Long head of triceps brachii': draft('Uma das três cabeças do tríceps braquial, atrás do braço. Estende o cotovelo e, por cruzar o ombro, também ajuda a estender o braço.'),
  'Gluteus maximus muscle': draft('Maior músculo da região glútea. Estende o quadril, com destaque ao subir escadas ou levantar-se de uma cadeira.'),
  'Sartorius muscle': draft('Músculo longo e estreito que cruza a frente da coxa. Atua no quadril e no joelho, como no movimento de cruzar as pernas.'),
  'Rectus femoris muscle': draft('Parte do quadríceps femoral que cruza o quadril e o joelho. Estende o joelho e ajuda a flexionar o quadril.'),
  'Soleus muscle': draft('Músculo largo da panturrilha, sob o gastrocnêmio. Faz a flexão plantar do tornozelo e é importante para manter a postura de pé.'),
  'Calcaneal tendon': draft('Tendão que liga os músculos da panturrilha ao calcâneo, também chamado tendão de Aquiles. Transmite a força usada para andar, correr e saltar.'),
  // Fáscias e outros tecidos
  'Fascia lata': draft('Fáscia profunda que envolve os músculos da coxa como uma manga. Ajuda a mantê-los no lugar e se espessa na lateral, formando o trato iliotibial.'),
  'Plantar aponeurosis': draft('Lâmina espessa de tecido conjuntivo na sola do pé, do calcâneo em direção aos dedos. Ajuda a sustentar o arco do pé.'),
  // Cardiovascular
  'Ascending aorta': draft('Primeiro trecho da aorta, que sai do ventrículo esquerdo. Dela se originam as artérias coronárias, que irrigam o coração.'),
  'Thoracic aorta': draft('Trecho da aorta que atravessa o tórax. Envia ramos para a parede e para órgãos torácicos antes de passar pelo diafragma.'),
  'Abdominal aorta': draft('Continuação da aorta no abdome. Fornece sangue aos órgãos abdominais e se divide nas artérias ilíacas comuns.'),
  'Pulmonary trunk': draft('Grande vaso que sai do ventrículo direito e se divide nas artérias pulmonares. Leva aos pulmões sangue pobre em oxigênio.'),
  'Superior vena cava': draft('Grande veia que leva ao átrio direito o sangue vindo da cabeça, do pescoço, dos membros superiores e de grande parte do tórax.'),
  'Left ventricle': draft('Câmara do coração que bombeia sangue rico em oxigênio para a aorta e daí para o corpo. Sua parede é a mais espessa das quatro câmaras.'),
  'Right ventricle': draft('Câmara do coração que bombeia sangue pobre em oxigênio para o tronco pulmonar, em direção aos pulmões.'),
  'Left atrium': draft('Câmara do coração que recebe pelas veias pulmonares o sangue oxigenado e o encaminha ao ventrículo esquerdo.'),
  'Right atrium': draft('Câmara do coração que recebe o sangue que retorna do corpo e do próprio coração e o encaminha ao ventrículo direito.'),
  'Internal jugular vein': draft('Principal veia que drena o sangue do encéfalo. Desce pelo pescoço e se une à veia subclávia.'),
  'Femoral artery': draft('Principal artéria que leva sangue ao membro inferior. É a continuação da artéria ilíaca externa e, perto do joelho, passa a se chamar artéria poplítea.'),
  'Great saphenous vein': draft('Veia superficial que vai do pé à virilha pelo lado medial do membro inferior. É a veia mais longa do corpo.'),
  // Nervoso
  'Pons': draft('Parte do tronco encefálico entre o mesencéfalo e o bulbo. Conecta regiões do encéfalo, em especial o cerebelo, e participa do controle da respiração.'),
  'Medulla oblongata': draft('Também chamada bulbo, é a parte inferior do tronco encefálico. Contém centros importantes para a respiração e a circulação.'),
  'Thalamus': draft('Conjunto de núcleos na região central do encéfalo. Retransmite e processa a maior parte das informações sensoriais a caminho do córtex.'),
  'Hippocampus': draft('Estrutura do lobo temporal importante para formar novas memórias e para a orientação no espaço.'),
  'Precentral gyrus': draft('Dobra do lobo frontal à frente do sulco central. Abriga o córtex motor primário, ligado aos movimentos voluntários.'),
  'Optic nerve (II)': draft('Segundo par de nervos cranianos. Leva ao encéfalo as informações visuais captadas pela retina.'),
  'Vagus nerve (X)': draft('Décimo par de nervos cranianos, que se estende até o tórax e o abdome. Participa do controle do coração, da respiração, da digestão e da voz.'),
  'Median nerve': draft('Nervo do membro superior que inerva muitos músculos da parte anterior do antebraço e alguns da mão. Sua compressão no punho causa a síndrome do túnel do carpo.'),
  'Ulnar nerve': draft('Nervo do membro superior que passa atrás do cotovelo. Inerva a maioria dos pequenos músculos da mão; uma batida nele causa a sensação de choque no cotovelo.'),
  'Radial nerve': draft('Nervo do membro superior que inerva os músculos que estendem o cotovelo, o punho e os dedos.'),
  'Sciatic nerve': draft('Nervo mais calibroso do corpo humano. Sai da pelve e desce pela parte de trás da coxa, inervando músculos da coxa e, por seus ramos, a perna e o pé.'),
  'Femoral nerve': draft('Nervo que chega à frente da coxa. Inerva os músculos que estendem o joelho e parte da pele da coxa e da perna.'),
  // Órgãos
  'Liver': draft('Maior órgão interno, na parte superior direita do abdome. Processa nutrientes, produz bile e proteínas do sangue e metaboliza diversas substâncias.'),
  'Stomach': draft('Órgão do sistema digestório entre o esôfago e o intestino delgado. Mistura o alimento ao suco gástrico e inicia a digestão das proteínas.'),
  'Pancreas': draft('Glândula situada atrás do estômago. Produz enzimas digestivas e hormônios como a insulina e o glucagon, que regulam a glicose no sangue.'),
  'Gallbladder': draft('Pequena bolsa sob o fígado que armazena e concentra a bile, liberada no intestino delgado para ajudar na digestão de gorduras.'),
  'Urinary bladder': draft('Órgão muscular na pelve que armazena a urina vinda dos ureteres até a micção.'),
  'Superior lobe of right lung': draft('Um dos três lobos do pulmão direito. Como o restante do pulmão, participa da troca de oxigênio e gás carbônico entre o ar e o sangue.'),
  'Superior lobe of left lung': draft('Um dos dois lobos do pulmão esquerdo. Participa da troca de oxigênio e gás carbônico entre o ar e o sangue.'),
  'Trachea': draft('Tubo reforçado por anéis incompletos de cartilagem que conduz o ar da laringe aos brônquios.'),
  'Oesophagus': draft('Tubo muscular que leva o alimento da faringe ao estômago por meio de contrações coordenadas.'),
  'Thyroid gland': draft('Glândula na frente do pescoço. Seus hormônios regulam o metabolismo; ela também produz calcitonina.'),
  'Suprarenal gland': draft('Glândula endócrina da região acima do rim, também chamada adrenal. Produz hormônios como o cortisol, a aldosterona e a adrenalina. Os rins não aparecem neste atlas.'),
  // Linfático
  'Spleen': draft('Órgão linfático no alto do abdome, à esquerda. Filtra o sangue, remove hemácias envelhecidas e participa da defesa do organismo.'),
  'Palatine tonsil': draft('Massa de tecido linfático de cada lado da garganta. Participa da defesa contra microrganismos que entram pela boca e pelo nariz.'),
  'Left lobe of thymus': draft('Um dos lobos do timo, órgão situado atrás do esterno. No timo amadurecem os linfócitos T; ele é mais ativo na infância.'),
  'Central axillary nodes': draft('Grupo de linfonodos na axila. Filtram a linfa vinda de outros grupos de linfonodos axilares antes que ela siga adiante.'),
}

export function describe(s: Structure): { text: string; badge: 'não revisado' | null; hasText: boolean } {
  const base = parseName(s.sourceName).base
  if (!Object.hasOwn(DESCRIPTIONS, base)) return { text: 'Descrição em preparação', badge: null, hasText: false }
  const entry = DESCRIPTIONS[base]
  return { text: entry.text, badge: entry.reviewed ? null : 'não revisado', hasText: true }
}
