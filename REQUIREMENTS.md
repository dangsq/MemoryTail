# Parameterized Apple Project Requirements

## Project Overview

This project is a web-based parameterized design system built with Three.js/WebGL.
It uses an apple as the core form language and treats the apple not as a fixed model,
but as an explainable shape grammar that can evolve from a rounded primitive into a
recognizable apple form, and then into design objects such as a cup, bowl, hat, or glove.

The first version focuses on an explainable parameter system, a rendering engine that
accepts a parameter set, and a story engine that presents fixed parameter states page by page.

## Core Goals

- Build an explainable parameter schema for apple form generation.
- Separate rendering from storytelling.
- Allow each story page to render a fixed parameter preset.
- Add a transition page that shows a randomized 3D parameter result.
- End with a free-edit mode where the user can directly manipulate parameters.
- Use real-world units for scale so the form can later become objects at different sizes.

## Conceptual Structure

The system is split into three layers:

1. Param Schema
   - Defines parameters, ranges, units, defaults, and semantic meaning.
   - Parameters must remain explainable and should not depend on low-level mesh implementation.

2. Renderer
   - Accepts a full parameter set.
   - Produces the 3D apple form and scene state in Three.js.
   - Should be reusable by story mode, random mode, and free-edit mode.

3. Story Engine
   - Defines pages, copy, page order, and fixed parameter presets.
   - Sends page-specific parameter sets to the renderer.
   - Handles navigation by keyboard and UI controls.

## User Experience Flow

The first version contains the following pages:

1. Cover
   - Project title and short introduction.

2. Story Pages
   - Each page contains text and a fixed parameter preset.
   - Navigation is available with left/right arrow keys and a bottom-right page control.

3. Random Transition Page
   - Displays one randomized but valid apple variation.
   - Bridges the fixed narrative and the open parameter system.

4. Free Edit Page
   - Reveals parameter controls.
   - Allows direct manipulation of the form.

## Story Sequence for Version 1

1. Seed
   - A near-spherical rounded volume.

2. Compression
   - Top and bottom dimples begin to form.

3. Identity
   - Belly, asymmetry, and apple recognition appear.

4. Growth
   - Stem and leaf emerge with orientation and pose.

5. Intervention
   - A bite appears on the surface.

6. Vessel
   - The form is hollowed into a shell and begins to behave like a container.

7. Variation
   - A randomized parameter set produces a new family member.

8. Playground
   - Free parameter editing.

## Parameter Design Principles

- Parameters must be interpretable in design language.
- Length values use meters internally.
- UI can display centimeters when useful.
- Angles should be user-readable and may be shown in degrees.
- Local features should prefer semantic surface positioning over raw xyz coordinates.
- Parameter naming should support interpolation and narrative explanation.

## Version 1 Parameter Schema

### Scale

- `baseRadius`: overall reference radius in meters, expected range `0.05 - 1.0`

### Global Form

- `heightScale`: vertical proportion relative to `baseRadius`
- `widthScale`: horizontal proportion relative to `baseRadius`
- `roundness`: transition between smooth sphere-like and more shaped volume
- `appleIdentity`: degree of transformation from rounded primitive to apple-like form
- `asymmetry`: amount of left/right or front/back deviation
- `belly`: mid-body fullness

### Top and Bottom Structure

- `topDimpleDepth`
- `topDimpleRadius`
- `bottomDimpleDepth`
- `bottomDimpleRadius`

### Stem

- `stemEnabled`
- `stemLength`
- `stemRadius`
- `stemBend`
- `stemAzimuth`
- `stemTilt`

### Leaf

- `leafEnabled`
- `leafSize`
- `leafWidth`
- `leafTilt`
- `leafTwist`
- `leafAzimuthOffset`

### Bite

- `biteEnabled`
- `biteRadius`
- `biteDepth`
- `biteLatitude`
- `biteLongitude`

### Hollow / Shell

- `hollowEnabled`
- `shellThickness`
- `openingScale`

### Presentation

- `rotationY`

## Functional Requirements

### Rendering

- Render the apple form from a single parameter object.
- Update the form when parameters change.
- Support a stable camera and lighting setup for story pages.
- Support orbit interaction where appropriate.

### Story Mode

- Display page title, text, and progress.
- Move between pages with keyboard arrows.
- Provide bottom-right navigation controls.
- Animate transitions between parameter states if feasible in first pass.

### Random Transition

- Generate a random but constrained parameter set.
- Preserve apple readability.
- Present the result as a bridge into free editing.

### Free Edit Mode

- Display grouped controls for the full parameter schema.
- Support direct update of the renderer.
- Include a randomize action.

## Non-Functional Requirements

- Desktop-first, but usable on mobile.
- Clean separation between data, rendering, and narrative state.
- Codebase should be extensible for future object transformations.
- Default implementation stack: Vite, TypeScript, Three.js.

## Out of Scope for Version 1

- Complex object-family transformations such as full cup, bowl, hat, or glove generators.
- Advanced export pipeline.
- Heavy boolean or full SDF modeling.
- Multi-language content system.

## Implementation Priorities

1. Project scaffold and architecture.
2. Parameter schema with defaults and ranges.
3. Apple renderer with explainable controls.
4. Story page framework.
5. Random page.
6. Free edit page.
7. Polish and build verification.

## Success Criteria for Version 1

- A user can move through the story and see distinct, explainable form states.
- The renderer uses the same parameter model in all modes.
- The random page produces believable variations.
- The free-edit page exposes the system clearly enough for experimentation.
