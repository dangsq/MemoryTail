# Memory Tail — Parametric Robot Dog Tail Design System

## Project Overview

This is a web-based parametric design system built with Three.js/WebGL. The project tells an emotional story about a dog owner who loses their companion and receives a robot dog with transferred memories. However, the robot dog lacks a tail — the primary way the original dog expressed emotions. The owner must use parametric design to rebuild the tail from memory.

**Technical Stack:** Vite + TypeScript + Three.js + three-bvh-csg

**Live Demo:** https://dangsq.github.io/1st/

---

## Core Concept

The project combines:
1. **Emotional Storytelling** — A narrative about memory, loss, and reconstruction
2. **Parametric Design** — A tail design system where each parameter represents a memory
3. **Interactive Experience** — Users can design their own robot dog tail in the final page

---

## Story Structure (12 Pages)

### Page 0: Cover
- **Title:** Memory Tail / 记忆之尾
- **Visual:** Darkened meeting scene
- **Purpose:** Entry point with project title

### Page 1-4: Life with the Dog
- **Page 1:** The day we met — First encounter at the shelter
- **Page 2:** Every day — Coming home routine
- **Page 3:** You were always there — Quiet companionship
- **Page 4:** The last day — Farewell moment

### Page 5: Silence
- **Visual:** Empty dog bowl in spotlight (theatrical lighting)
- **Emotion:** Loss and emptiness

### Page 6-7: Robot Dog Introduction
- **Page 6:** A new companion — Memory transfer to robot dog
- **Page 7:** It remembers — Recognition but no expression

### Page 8: Turning Point
- **Title:** Something is missing
- **Revelation:** The robot dog has no tail
- **Realization:** The tail was how the dog expressed everything

### Page 9-10: Memory and Reconstruction
- **Page 9:** I remember now — Memories of the tail flooding back
- **Page 10:** Rebuilding memory — Introduction to parametric design

### Page 11: Reunion
- **Title:** The first wag
- **Emotion:** The tail moves with the familiar rhythm

### Page 12: Free Edit Mode
- **Interactive:** Full parameter control
- **Purpose:** User creates their own memory tail

---

## Visual Style

### Theatrical Stage Lighting
- Black backgrounds with dramatic spotlights
- Inspired by stage theater aesthetics
- Creates emotional focus and atmosphere

### Art Style
- Thick impasto oil painting texture
- Warm and cool color contrast
- Emotional depth through brushwork

### Typography
- Thin, elegant fonts (font-weight: 300)
- Bilingual text (Chinese + English)
- Minimal, centered layout

---

## Technical Implementation

### Page Transition
- **Fade to black** → **Fade to next page**
- Smooth 600ms transition
- Prevents jarring cuts between emotional scenes

### Layout
- **Fullscreen background images** (story pages 0-11)
- **Fullscreen 3D canvas** (page 12 - free edit mode)
- Content overlay with centered text
- Dot navigation + arrow buttons

### Parametric System
The tail design uses 17 parameters including:
- Core form (height, width, curve)
- Shell thickness
- Leaf attachment (optional)
- Bite mark (CSG boolean subtraction)
- Rotation and segments

---

## User Experience Flow

1. **Cover Page** — User sees darkened image with title
2. **Story Pages (1-11)** — Navigate with ← → keys or buttons
3. **Each transition** — Fades to black, then fades to next scene
4. **Page 8** — Dramatic reveal: "Something is missing"
5. **Page 12** — 3D canvas appears, parameter controls revealed
6. **Free Edit** — User designs their own tail with full parameter access

---

## Parameter Design Philosophy

> "Every parameter is a memory"

Each slider in the parametric system corresponds to a specific memory:
- **Tail length** — "It reached my hand"
- **Wag amplitude** — "Crazy when I came home"
- **Curve** — "Relaxed circle when sleeping"

This transforms technical parameters into emotional anchors.

---

## Functional Requirements

### Story Mode
- Fullscreen background images
- Fade-to-black page transitions
- Keyboard navigation (← →)
- Dot navigation indicator
- Page counter display

### Free Edit Mode
- 3D canvas with orbit controls
- Parameter GUI (lil-gui)
- Real-time tail rendering
- Randomize button

### Rendering
- Bezier curve-based tail profile
- Lathe geometry for rotation
- CSG boolean operations for bite marks
- Shell/hollow structure support

---

## Technical Architecture

### Three Layers

1. **Story Engine** (`story.ts`)
   - Page definitions
   - Text content (bilingual)
   - Image URLs
   - Parameter presets

2. **Renderer** (`appleRenderer.ts`)
   - Three.js scene setup
   - Parametric geometry generation
   - Camera and lighting
   - Material system

3. **UI Controller** (`main.ts`)
   - Page navigation logic
   - Transition animations
   - GUI management
   - Event handling

---

## Success Criteria

- ✅ Emotional story arc with clear turning point (page 8)
- ✅ Smooth fade-to-black transitions between pages
- ✅ Theatrical lighting aesthetic in all story images
- ✅ Parametric system accessible in final page
- ✅ Each parameter has semantic meaning tied to memory
- ✅ Bilingual support (Chinese + English)

---

## Future Enhancements

- Animation of tail wagging in 3D
- Export tail design as 3D model
- Multiple robot dog body types
- Community gallery of user-designed tails
- VR/AR experience for emotional immersion

---

## Credits

**Design & Development:** Shengqi Dang  
**Story Concept:** Memory Tail  
**Visual Style:** Theatrical stage lighting + impasto oil painting  
**Technology:** Vite, TypeScript, Three.js, three-bvh-csg

---

## License

© 2026 Shengqi Dang. All rights reserved.
