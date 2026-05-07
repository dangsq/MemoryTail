import './style.css'
import { SceneRenderer } from './sceneRenderer'
import { RobotDogRenderer } from './robotDogRenderer'
import { storyPages } from './story'
import { CableDrivenTailRenderer, defaultTailConfig } from './cableDrivenTail'
import { TailGUI } from './tailGUI'

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
const sceneRenderer = new SceneRenderer(el.canvasWrap)
const robotDogRenderer = new RobotDogRenderer(sceneRenderer.scene)

// Cable-driven tail renderer
let cableTailRenderer: CableDrivenTailRenderer | null = null
let tailGUI: TailGUI | null = null

/* ═══════════════════════════════════════════════════
   State
   ═══════════════════════════════════════════════════ */
let pageIndex = 0
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
  
  // Hide empty elements (remove background/border styling)
  if (!page.title || page.title.trim() === '') {
    el.title.style.display = 'none'
  } else {
    el.title.style.display = 'block'
  }
  
  if (!page.text || page.text.trim() === '') {
    el.text.style.display = 'none'
  } else {
    el.text.style.display = 'block'
  }

  // Handle interactive pages (freeEdit mode)
  const isFreeEditPage = page.freeEdit === true
  
  if (isFreeEditPage) {
    // Show canvas and GUI
    el.canvasWrap.classList.add('visible')
    el.guiHost.classList.add('visible')
    el.keyboardHint.style.display = 'none'
    
    // Hide background image (but keep text content visible for instructions)
    el.bgImage.style.opacity = '0'
    el.storyContent.style.display = 'flex'
    
    // Enable orbit controls
    sceneRenderer.enableControls()
    
    // Determine which page we're on
    if (page.id === 'design_shape') {
      // Page 11: Design shape with cable-driven tail
      buildCableTailGUI()
      robotDogRenderer.show()
      
      // Initialize cable tail if not exists
      if (!cableTailRenderer) {
        cableTailRenderer = new CableDrivenTailRenderer(sceneRenderer.scene, defaultTailConfig)
        // Position tail at robot dog's attachment point
        const attachPoint = robotDogRenderer.getTailAttachmentPoint()
        cableTailRenderer.setPosition(attachPoint.x, attachPoint.y, attachPoint.z)
      }
      cableTailRenderer.setVisible(true)
      
    } else if (page.id === 'design_emotions') {
      // Page 17: Design emotions (future implementation)
      buildCableTailGUI()
      robotDogRenderer.show()
      if (cableTailRenderer) {
        cableTailRenderer.setVisible(true)
      }
    }
    
  } else {
    // Hide canvas and GUI
    el.canvasWrap.classList.remove('visible')
    el.guiHost.classList.remove('visible')
    el.keyboardHint.style.display = 'block'
    
    // Show background image and text content
    el.bgImage.style.opacity = '1'
    el.storyContent.style.display = 'flex'
    
    // Disable orbit controls
    sceneRenderer.disableControls()
    
    // Hide cable tail on non-interactive pages
    if (cableTailRenderer) {
      cableTailRenderer.setVisible(false)
    }
  }
}

/* ═══════════════════════════════════════════════════
   Build GUI for cable-driven tail
   ═══════════════════════════════════════════════════ */
function buildCableTailGUI() {
  // Destroy old GUI if exists
  if (tailGUI) {
    tailGUI.dispose()
    tailGUI = null
  }
  
  // Create cable tail renderer if not exists
  if (!cableTailRenderer) {
    cableTailRenderer = new CableDrivenTailRenderer(sceneRenderer.scene, defaultTailConfig)
    const attachPoint = robotDogRenderer.getTailAttachmentPoint()
    cableTailRenderer.setPosition(attachPoint.x, attachPoint.y, attachPoint.z)
  }
  
  // Create new GUI
  tailGUI = new TailGUI(cableTailRenderer, el.guiHost)
}

/* ═══════════════════════════════════════════════════
   Build GUI for last page (old implementation - removed, using cable tail now)
   ═══════════════════════════════════════════════════ */
// Removed buildGUI() and related functions - now using buildCableTailGUI() instead

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
