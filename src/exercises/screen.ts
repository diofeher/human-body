import './exercise.css'
import squat from './squat.json'
import lunge from './lunge.json'
import pushup from './pushup.json'
import type { Exercise } from './types.ts'
import { advance, depthAt, phaseAt, phaseStart } from './timeline.ts'
import { createPlayer, ROLE_COLORS, type Player } from './player.ts'

/** keyed by the URL hash */
export const EXERCISES: Record<string, Exercise> = {
  agachamento: squat as Exercise,
  avanco: lunge as Exercise,
  flexao: pushup as Exercise,
}
const ROLE_LABELS = { principal: 'Motores principais', apoio: 'Apoio' } as const
const SPEEDS = [[0.5, '0,5×'], [1, '1×']] as const

export function createExerciseScreen(root: HTMLElement, exercise: Exercise) {
  const links = Object.values(EXERCISES).map(other =>
    `<a href="#${other.id}"${other.id === exercise.id ? ' aria-current="page"' : ''}>${other.name}</a>`).join('')
  const muscles = (['principal', 'apoio'] as const).map(role => `
    <h4><span class="dot" style="background:${ROLE_COLORS[role]}"></span>${ROLE_LABELS[role]}</h4>
    <ul>${exercise.groups.filter(g => g.role === role).map(g => `<li><strong>${g.label}.</strong> ${g.note}</li>`).join('')}</ul>`).join('')

  root.innerHTML = `
    <section class="stage">
      <div class="exercise-title">
        <a href="#">← Voltar ao atlas</a>
        <h2>${exercise.name}</h2>
        ${exercise.reviewed ? '' : '<span class="badge">não revisado</span>'}
      </div>
      <nav class="exercise-nav" aria-label="Exercícios">${links}</nav>
      <div class="exercise-view"><div class="exercise-status" role="status"></div></div>
      <div class="controls">
        <button type="button" class="play" disabled>▶ Reproduzir</button>
        <span class="speeds">${SPEEDS.map(([v, text]) => `<button type="button" data-speed="${v}" aria-pressed="${v === 1}">${text}</button>`).join('')}</span>
        <label><input type="checkbox" class="hide-support"> Ocultar músculos de apoio</label>
      </div>
      <div class="phase-bar">${exercise.phases.map((p, i) => `<button type="button" data-phase="${i}" style="flex:${p.seconds}">${p.label}</button>`).join('')}</div>
    </section>
    <section class="cards">
      ${exercise.phases.map((p, i) => `
        <article class="card" data-card="${i}">
          <h3><button type="button" data-phase="${i}">${i + 1} · ${p.label}</button></h3>
          <div class="card-body">
            <ul>${p.cues.map(c => `<li>${c}</li>`).join('')}</ul>
            ${muscles}
          </div>
        </article>`).join('')}
      <details class="mistakes">
        <summary>Erros comuns</summary>
        <dl>${exercise.mistakes.map(m => `<dt>${m.title}</dt><dd>${m.text}</dd>`).join('')}</dl>
      </details>
      <p class="muted">Ângulos de flexão: 0° é a posição em pé. As cores indicam a função típica de cada músculo; não medem ativação.</p>
      <p class="muted">Material educativo. Não substitui orientação médica nem de um profissional de educação física ou fisioterapia.</p>
    </section>`

  const one = <T extends Element = HTMLElement>(selector: string) => root.querySelector(selector) as T
  const all = (selector: string) => [...root.querySelectorAll<HTMLElement>(selector)]
  const playButton = one<HTMLButtonElement>('.play')
  const hideSupport = one<HTMLInputElement>('.hide-support')
  const status = one('.exercise-status')
  const cards = one('.cards')

  let player: Player | null = null
  let loading = false
  let opened = false
  let playing = false
  let speed = 1
  let time = 0
  let shownPhase = -1
  let loop = 0
  let last = 0

  function show() {
    player?.setDepth(depthAt(exercise, time))
    const { index } = phaseAt(exercise, time)
    if (index === shownPhase) return
    shownPhase = index
    for (const element of all('.phase-bar button')) element.setAttribute('aria-current', String(Number(element.dataset.phase) === index))
    for (const card of all('.card')) card.classList.toggle('active', Number(card.dataset.card) === index)
    // scrolls only the card list, never the page
    const card = one(`[data-card="${index}"]`)
    cards.scrollTo({ top: card.offsetTop - 4, behavior: 'smooth' })
  }

  function tick(now: number) {
    time = advance(exercise, time, (now - last) / 1000, speed)
    last = now
    show()
    loop = requestAnimationFrame(tick)
  }

  function setPlaying(value: boolean) {
    playing = value && !!player && opened
    playButton.textContent = playing ? '⏸ Pausar' : '▶ Reproduzir'
    cancelAnimationFrame(loop)
    if (playing) {
      last = performance.now()
      loop = requestAnimationFrame(tick)
    }
  }

  async function load() {
    if (player || loading) return
    loading = true
    status.textContent = 'Carregando a animação…'
    try {
      player = await createPlayer(one('.exercise-view'), exercise)
      status.textContent = ''
      playButton.disabled = false
      player.setSupportVisible(!hideSupport.checked)
      player.setActive(opened)
      shownPhase = -1
      show()
    } catch (error) {
      console.error(error)
      status.innerHTML = '<p>Não foi possível carregar a animação.</p><button type="button">Tentar novamente</button>'
      status.querySelector('button')!.addEventListener('click', () => void load())
    } finally {
      loading = false
    }
  }

  playButton.addEventListener('click', () => setPlaying(!playing))
  hideSupport.addEventListener('change', () => player?.setSupportVisible(!hideSupport.checked))
  for (const button of all('[data-speed]')) {
    button.addEventListener('click', () => {
      speed = Number(button.dataset.speed)
      for (const other of all('[data-speed]')) other.setAttribute('aria-pressed', String(other === button))
    })
  }
  // jumping keeps playing or paused as it was
  for (const button of all('[data-phase]')) {
    button.addEventListener('click', () => {
      time = phaseStart(exercise, Number(button.dataset.phase))
      show()
    })
  }
  show()

  return {
    open() {
      opened = true
      player?.setActive(true)
      void load()
    },
    close() {
      opened = false
      setPlaying(false)
      player?.setActive(false)
    },
  }
}
