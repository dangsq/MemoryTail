import GUI from 'lil-gui'
import './style.css'
import * as THREE from 'three'
import { AppleRenderer } from './appleRenderer'
import { TailRenderer } from './tailRenderer'
import { RobotDogRenderer } from './robotDogRenderer'
import { mergeTailParams, tailParamRanges, clampTailParams } from './params'
import { storyPages } from './story'
import type { TailParams } from './types'

/* ═══════════════════════════════════════════════════
   DOM scaffold
   ═══════════════════════════════════════════════════ */
const app = document.querySelector<HTMLDivElement>('#app')
if (!app) throw new Error('App root not found')

const dotButtons = storyPages.map(
  (_, i) => `<button class="dot${i === 0 ? ' active' : ''}" data-index="${i}" aria-label="Page ${i}"></button>`,
)

app.innerHTML = `
  <!-- Background Image -->
  <div class="background-image" id="bg-image"></div>
  
  <!-- Black Transition Overlay -->
  <div class="black-overlay" id="black-overlay"></div>
  
  <!-- Content Layer -->
  <div class="content-layer">
    <header class="story-header">
      <span class="project-label">Memory Tail</span>
      <span class="page-counter" id="page-counter">00 / ${String(storyPages.length - 1).padStart(2, '0')}</span>
    </header>

    <div class="story-content" id="story-content">
      <h1 class="page-title" id="page-title"></h1>
      <p class="page-text" id="page-text"></p>
    </div>

    <footer class="story-footer">
      <div class="dot-nav" id="dot-nav">
        ${dotButtons.join('')}
      </div>
      <div class="page-nav">
        <button class="nav-btn" id="prev-btn" aria-label="Previous page">
          <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <button class="nav-btn" id="next-btn" aria-label="Next page">
          <svg viewBox="0 0 24 24"><polyline points="9 6 15 12 9 18"/></svg>
        </button>
      </div>
    </footer>
  </div>

  <!-- 3D Canvas (for last page) -->
  <div class="canvas-wrap" id="canvas-wrap"></div>
  <div class="gui-host" id="gui-host"></div>
  
  <!-- Keyboard Hint -->
  <div class="keyboard-hint" id="keyboard-hint">Press ← → to navigate</div>
  
  <!-- Copyright Footer -->
  <footer class="copyright-footer">
    <p>© ${new Date().getFullYear()} Shengqi Dang. All rights reserved.</p>
  </footer>
`

/* ═══════════════════════════════════════════════════
   Element references
   ═══════════════════════════════════════════════════ */
const el = {
  bgImage: document.getElementById('bg-image') as HTMLDivElement,
  blackOverlay: document.getElementById('black-overlay') as HTMLDivElement,
  counter: document.getElementById('page-counter')!,
  title: document.getElementById('page-title')!,
  text: document.getElementById('page-text')!,
  storyContent: document.getElementById('story-content') as HTMLDivElement,
  prevBtn: document.getElementById('prev-btn') as HTMLButtonElement,
  nextBtn: document.getElementById('next-btn') as HTMLButtonElement,
  dotNav: document.getElementById('dot-nav')!,
  canvasWrap: document.getElementById('canvas-wrap') as HTMLDivElement,
  guiHost: document.getElementById('gui-host')!,
  keyboardHint: document.getElementById('keyboard-hint')!,
}

const dots = Array.from(el.dotNav.querySelectorAll<HTMLButtonElement>('.dot'))

/* ═══════════════════════════════════════════════════
   Renderer
   ═══════════════════════════════════════════════════ */
const renderer = new AppleRenderer(el.canvasWrap)
const robotDogRenderer = new RobotDogRenderer(renderer.scene)
const tailRenderer = new TailRenderer(renderer.scene)

/* ═══════════════════════════════════════════════════
   State
   ═══════════════════════════════════════════════════ */
let pageIndex = 0
let gui: GUI | null = null
let editorTailParams: TailParams = mergeTailParams()
let isTransitioning = false

/* ═══════════════════════════════════════════════════
   Page transition with black fade
   ═══════════════════════════════════════════════════ */
function goToPage(newIndex: number) {
  if (isTransitioning) return
  if (newIndex < 0 || newIndex >= storyPages.length) return
  if (newIndex === pageIndex) return

  isTransitioning = true

  // Fade out content
  el.storyContent.classList.add('fade-out')

  // Fade to black
  el.blackOverlay.classList.add('active')

  setTimeout(() => {
    pageIndex = newIndex
    renderPage()

    // Fade from black
    setTimeout(() => {
      el.blackOverlay.classList.remove('active')
      el.storyContent.classList.remove('fade-out')
      isTransitioning = false
    }, 100)
  }, 600)
}

/* ═══════════════════════════════════════════════════
   Render current page
   ═══════════════════════════════════════════════════ */
function renderPage() {
  const page = storyPages[pageIndex]
  
  // Update counter
  el.counter.textContent = `${String(pageIndex).padStart(2, '0')} / ${String(storyPages.length - 1).padStart(2, '0')}`

  // Update dots
  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i === pageIndex)
  })

  // Update nav buttons
  el.prevBtn.disabled = pageIndex === 0
  el.nextBtn.disabled = pageIndex === storyPages.length - 1

  // Update background image
  if (page.imageUrl) {
    el.bgImage.style.backgroundImage = `url('${page.imageUrl}')`
    
    // Cover page (page 0) should be darker
    if (pageIndex === 0) {
      el.bgImage.classList.add('cover-mode')
    } else {
      el.bgImage.classList.remove('cover-mode')
    }
  }

  // Update text content
  el.title.textContent = page.title
  el.text.textContent = page.text

  // Handle last page (free edit mode)
  const isLastPage = pageIndex === storyPages.length - 1
  
  if (isLastPage) {
    // Show canvas and GUI
    el.canvasWrap.classList.add('visible')
    el.guiHost.classList.add('visible')
    el.keyboardHint.style.display = 'none'
    
    // Hide background image and text content
    el.bgImage.style.opacity = '0'
    el.storyContent.style.display = 'none'
    
    // Enable orbit controls
    renderer.enableControls()
    
    // Build GUI if not exists
    if (!gui) {
      buildGUI()
    }
    
    // Show tail instead of apple
    renderer.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.visible = false
      }
    })
    
    // Attach tail to robot dog
    const attachPoint = robotDogRenderer.getTailAttachmentPoint()
    tailRenderer.setAttachmentPoint(attachPoint)
    tailRenderer.update(editorTailParams)
  } else {
    // Hide canvas and GUI
    el.canvasWrap.classList.remove('visible')
    el.guiHost.classList.remove('visible')
    el.keyboardHint.style.display = 'block'
    
    // Show background image and text content
    el.bgImage.style.opacity = '1'
    el.storyContent.style.display = 'flex'
    
    // Disable orbit controls
    renderer.disableControls()
  }
}

/* ═══════════════════════════════════════════════════
   Build GUI for last page
   ═══════════════════════════════════════════════════ */
function buildGUI() {
  gui = new GUI({ container: el.guiHost, title: 'Tail Parameters' })

  // Memory Parameters
  const memoryFolder = gui.addFolder('Memory Parameters')
  memoryFolder.add(editorTailParams, 'tailLength', ...tailParamRanges.tailLength!).name('Length (reaches my hand)').onChange(() => updateTailFromGUI())
  memoryFolder.add(editorTailParams, 'wagAmplitude', ...tailParamRanges.wagAmplitude!).name('Wag (crazy when home)').onChange(() => updateTailFromGUI())
  memoryFolder.add(editorTailParams, 'relaxedCurve', ...tailParamRanges.relaxedCurve!).name('Curve (relaxed circle)').onChange(() => updateTailFromGUI())
  memoryFolder.add(editorTailParams, 'tailThickness', ...tailParamRanges.tailThickness!).name('Thickness (strong)').onChange(() => updateTailFromGUI())
  memoryFolder.add(editorTailParams, 'taperRatio', ...tailParamRanges.taperRatio!).name('Taper (thinner at tip)').onChange(() => updateTailFromGUI())
  memoryFolder.open()

  // Fur Parameters
  const furFolder = gui.addFolder('Fur')
  furFolder.add(editorTailParams, 'furEnabled').name('Enable Fur').onChange(() => updateTailFromGUI())
  furFolder.add(editorTailParams, 'furLength', ...tailParamRanges.furLength!).name('Fur Length').onChange(() => updateTailFromGUI())
  furFolder.add(editorTailParams, 'furDensity', ...tailParamRanges.furDensity!).name('Fur Density').onChange(() => updateTailFromGUI())
  furFolder.addColor(editorTailParams, 'furColor').name('Fur Color 1').onChange(() => updateTailFromGUI())
  furFolder.addColor(editorTailParams, 'furColor2').name('Fur Color 2').onChange(() => updateTailFromGUI())
  furFolder.add(editorTailParams, 'furColorMix', ...tailParamRanges.furColorMix!).name('Color Mix').onChange(() => updateTailFromGUI())
  furFolder.open()

  // Technical Parameters
  const techFolder = gui.addFolder('Technical')
  techFolder.add(editorTailParams, 'showJoints').name('Show Joints').onChange(() => updateTailFromGUI())
  techFolder.add(editorTailParams, 'jointSize', ...tailParamRanges.jointSize!).name('Joint Size').onChange(() => updateTailFromGUI())
  techFolder.add(editorTailParams, 'metallic', ...tailParamRanges.metallic!).name('Metallic').onChange(() => updateTailFromGUI())
  techFolder.add(editorTailParams, 'roughness', ...tailParamRanges.roughness!).name('Roughness').onChange(() => updateTailFromGUI())
  techFolder.add(editorTailParams, 'rotationY', ...tailParamRanges.rotationY!).name('Rotation Y').onChange(() => updateTailFromGUI())

  // Randomize button
  gui.add({ randomize: randomizeTail }, 'randomize').name('🎲 Randomize')
}

function updateTailFromGUI() {
  // Don't reassign, just clamp in place
  const clamped = clampTailParams(editorTailParams)
  Object.assign(editorTailParams, clamped)
  tailRenderer.update(editorTailParams)
}

function randomizeTail() {
  editorTailParams.tailLength = Math.random() * 0.7 + 0.3
  editorTailParams.wagAmplitude = Math.random()
  editorTailParams.relaxedCurve = Math.random()
  editorTailParams.tailThickness = Math.random() * 0.06 + 0.02
  editorTailParams.taperRatio = Math.random() * 0.7 + 0.3
  
  gui?.controllersRecursive().forEach((c) => c.updateDisplay())
  updateTailFromGUI()
}

/* ═══════════════════════════════════════════════════
   Navigation
   ═══════════════════════════════════════════════════ */
el.prevBtn.addEventListener('click', () => goToPage(pageIndex - 1))
el.nextBtn.addEventListener('click', () => goToPage(pageIndex + 1))

dots.forEach((dot, i) => {
  dot.addEventListener('click', () => goToPage(i))
})

// Keyboard
window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') goToPage(pageIndex - 1)
  if (e.key === 'ArrowRight') goToPage(pageIndex + 1)
})

// Wheel navigation (debounced)
let wheelCooldown = false
window.addEventListener(
  'wheel',
  (e) => {
    if ((e.target as HTMLElement).closest('.lil-gui')) return

    if (wheelCooldown) return
    if (Math.abs(e.deltaY) < 30) return

    wheelCooldown = true
    if (e.deltaY > 0) {
      goToPage(pageIndex + 1)
    } else {
      goToPage(pageIndex - 1)
    }

    setTimeout(() => {
      wheelCooldown = false
    }, 1200)
  },
  { passive: true },
)

/* ═══════════════════════════════════════════════════
   Initial render
   ═══════════════════════════════════════════════════ */
renderPage()
