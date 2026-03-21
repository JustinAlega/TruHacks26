# Design System Strategy: The Luminescent Scholar

## 1. Overview & Creative North Star
This design system is anchored by a Creative North Star we call **"The Digital Curator."** In a world of cluttered educational tools, this system acts as a sophisticated, quiet guide. It rejects the "standard dashboard" aesthetic in favor of a high-end editorial experience.

We break the traditional "boxed" template through **Intentional Asymmetry** and **Tonal Depth**. By utilizing overlapping elements, expansive white space (using our `24` and `20` spacing tokens), and a dramatic typographic scale, we transform a functional platform into an authoritative, premium environment. The goal is to make the student or educator feel like they are interacting with a living document rather than a rigid database.

## 2. Colors & Surface Philosophy
The palette is built on a foundation of deep, intellectual blues (`primary`) and sophisticated neutrals (`surface` variants), accented by vibrant highlights that signal action and intelligence.

*   **The "No-Line" Rule:** We do not use 1px solid borders to define sections. Layout boundaries must be achieved through **background color shifts**. For example, a sidebar using `surface-container-low` should sit against a `background` canvas without a stroke. Separation is felt, not seen.
*   **Surface Hierarchy & Nesting:** Treat the UI as a series of physical layers. Use the `surface-container` tiers to create "nested" depth.
    *   **Layer 1 (Canvas):** `surface` (#f7f9fc)
    *   **Layer 2 (Section):** `surface-container-low` (#f2f4f7)
    *   **Layer 3 (Component):** `surface-container-highest` (#e0e3e6) or `surface-container-lowest` (#ffffff) for high-contrast cards.
*   **The Glass & Gradient Rule:** To ensure a custom feel, floating elements (like the Voice Orb or high-level Modals) should use semi-transparent `surface` colors with a 20px-30px backdrop-blur. 
*   **Signature Textures:** Main CTAs and hero backgrounds should utilize a subtle linear gradient from `primary` (#001944) to `primary_container` (#002c6e) at a 135-degree angle. This adds a "soul" to the interface that flat colors cannot mimic.

## 3. Typography: The Editorial Voice
We utilize a dual-font strategy to balance authority with accessibility.

*   **Display & Headline (Manrope):** These are our "Editorial" voices. Use `display-lg` and `headline-lg` with tight letter-spacing to create a bold, modern impact. Headlines should often be placed with generous top-padding (`spacing-24`) to give the content room to breathe.
*   **Body & Labels (Inter):** Inter handles the "Functional" work. It provides maximum readability for course materials and data. Use `body-md` for standard text and `label-md` for metadata.
*   **Visual Hierarchy:** Establish a "High-Contrast" scale. Pair a `display-sm` title with a `body-sm` description to create a sophisticated, unbalanced look that feels more like a premium magazine than a software app.

## 4. Elevation & Depth
Hierarchy is conveyed through **Tonal Layering** rather than structural lines or heavy shadows.

*   **The Layering Principle:** Depth is achieved by "stacking" the surface-container tiers. Place a `surface-container-lowest` card on a `surface-container-low` background to create a soft, natural lift.
*   **Ambient Shadows:** If a floating effect is required (e.g., for the Voice Orb), use an extra-diffused shadow: `box-shadow: 0 20px 50px rgba(25, 28, 30, 0.06)`. The shadow color is derived from `on-surface` at a very low opacity to mimic natural ambient light.
*   **The "Ghost Border" Fallback:** If a border is required for accessibility, use the `outline_variant` token at **10-20% opacity**. Never use a 100% opaque border.
*   **Glassmorphism:** For the voice interaction interface, use a frosted glass container that allows the `primary` colors of the dashboard to bleed through, softening the edges of the interaction.

## 5. Components

### The Voice Assistant Orb & Waveforms
The signature element of the system.
*   **The Orb:** A floating sphere using a radial gradient of `secondary` (#006a6a) and `secondary_fixed` (#93f2f2).
*   **The Waveform:** When active, the orb emits glowing waveforms using `secondary_fixed_dim`. These are not static lines but fluid, organic shapes with a `backdrop-blur` of 12px.

### Buttons
*   **Primary:** High-gloss. Uses the `primary` to `primary_container` gradient with `on_primary` text. Radius: `md` (0.75rem).
*   **Secondary:** Ghost-style. No background. `primary` text with a "Ghost Border" that appears only on hover.
*   **Tertiary:** Amber accents (`tertiary_fixed_dim`) used sparingly for critical feedback or "Premium" features.

### Cards & Lists
*   **Cards:** Forbid divider lines. Separate content using `spacing-4` or `spacing-6` vertical gaps.
*   **Interactive Lists:** Use `surface_container_low` for the list container. On hover, the list item should shift to `surface_container_high` with a `lg` (1rem) corner radius.

### Input Fields
*   **Style:** Minimalist. No bottom line or full box. Use a `surface_container_highest` background with `none` border.
*   **Focus State:** The background stays consistent, but a `primary` "Ghost Border" (20% opacity) fades in to indicate focus.

## 6. Do's and Don'ts

### Do
*   **DO** use white space as a structural element. If a layout feels crowded, increase spacing to `spacing-12` or `spacing-16`.
*   **DO** use `tertiary_fixed` (Amber) to highlight "At Risk" students or urgent notifications, as suggested in the planning notes.
*   **DO** align typography to a rigorous baseline but allow images and cards to break the vertical grid for a more editorial feel.

### Don't
*   **DON'T** use 1px solid borders to separate segments of the page.
*   **DON'T** use pure black (#000000) for shadows. Use a low-opacity tint of `on_surface`.
*   **DON'T** use standard "Blue" links. Actions should be prompted by `secondary` (Teal) or `primary` (Deep Blue) with intentional weight.
*   **DON'T** overcrowd the Voice Interface. It should feel like an "overlay" that respects the content beneath it.