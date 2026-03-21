# Frontend Remodel — Orchestration Plan

## Vision

Transform the Aria AI Academic Advisor from a linear chat interface into a **JARVIS-style HUD canvas** where AI-generated data materializes as draggable, glassmorphic widget popups on a full-viewport dark canvas. The voice conversation remains the primary interaction — the user talks to Aria, and relevant data widgets appear on the canvas as the AI responds.

## Architecture

```
App.tsx
├── State: WebSocket, STT (useScribe), AudioPlayer, WidgetManager
├── Exposes: window.createWidget(type, data) for external invocation
│
├── <Canvas>                         ← full-viewport dark canvas
│   └── <Widget> × N                 ← draggable glassmorphic panels
│       └── <WidgetContent>          ← type-specific renderer
│           ├── AssignmentsWidget
│           ├── CourseDetailsWidget
│           ├── ProfessorWidget
│           ├── CourseRoadmapWidget
│           ├── GPAWidget
│           ├── JobListingsWidget
│           └── ScheduleWidget
│
├── <VoiceOrb>                       ← floating orb, bottom-center
│   ├── Pulsing glow (listening/processing states)
│   ├── Status text
│   └── Start session on first click
│
└── <TranscriptPanel>                ← slide-out from right edge
    ├── Full conversation history
    ├── Streaming assistant buffer
    └── Tool call results
```

## Component Inventory

| Component           | File                                  | Purpose                                             |
|---------------------|---------------------------------------|-----------------------------------------------------|
| `App`               | `App.tsx`                             | Root — voice pipeline, widget manager, layout        |
| `Widget`            | `components/Widget.tsx`               | Draggable wrapper with header, controls, glass frame |
| `VoiceOrb`          | `components/VoiceOrb.tsx`             | Floating voice assistant orb                         |
| `TranscriptPanel`   | `components/TranscriptPanel.tsx`      | Collapsible chat transcript sidebar                  |
| `AssignmentsWidget` | `components/widgets/Assignments…`     | Upcoming/past assignments list                       |
| `CourseDetailsWidget`| `components/widgets/CourseDetails…`  | Single course info card                              |
| `ProfessorWidget`   | `components/widgets/Professor…`       | Professor rating & contact                           |
| `CourseRoadmapWidget`| `components/widgets/CourseRoadmap…`  | DAG of course prerequisites                          |
| `GPAWidget`         | `components/widgets/GPA…`             | GPA trend with bar chart                             |
| `JobListingsWidget` | `components/widgets/JobListings…`     | Matching job listings                                |
| `ScheduleWidget`    | `components/widgets/Schedule…`        | Weekly timetable grid                                |

## Data Flow

```
User speaks → ElevenLabs STT (client) → transcript → WebSocket → Backend
Backend → Gemini + tools → text + audio + tool_results → WebSocket → Frontend
Frontend:
  1. Audio → StreamingAudioPlayer (TTS playback)
  2. Text  → TranscriptPanel (conversation history)
  3. Tool results → currently displayed in transcript
  4. [Future] function_call → window.createWidget(type, data) → new widget on canvas
```

### Widget Creation API

```typescript
// Exposed on window for external invocation
window.createWidget(type: WidgetType, data: WidgetData): string
// Returns the widget instance ID

// Example:
window.createWidget('professor', {
  name: 'Dr. Sarah Chen',
  department: 'Computer Science',
  rating: 4.2,
  difficulty: 3.1,
  wouldTakeAgain: 89,
  topTags: ['Caring', 'Respected', 'Tough Grader'],
});
```

## Styling Strategy

All styling follows `DESIGN.md` ("The Luminescent Scholar") adapted for a dark JARVIS canvas:

- **Canvas:** Deep navy (#0a0e1a) with subtle 40px grid overlay
- **Widgets:** Glassmorphic panels — `backdrop-filter: blur(20px)`, semi-transparent backgrounds
- **No hard borders** — separation via background shifts and ultra-low-opacity outline variants
- **Typography:** Manrope (headlines/widget titles), Inter (body/data)
- **Colors:** Primary deep blue (#001944), Secondary teal (#006a6a / #93f2f2) for highlights
- **Shadows:** Ambient only — `0 8px 32px rgba(0,0,0,0.4)`, no pure-black
- **Animations:** Widgets fade+scale in, orb pulses, drag is smooth with cursor changes

## Implementation Phases

### Phase 1: Foundation (current)
- [x] Design tokens in CSS custom properties
- [x] Widget type system (TypeScript interfaces)
- [x] `useWidgetManager` hook (CRUD, drag, z-index, minimize)
- [x] Draggable `Widget` wrapper component
- [x] Example widgets pre-populated on canvas
- [x] `window.createWidget()` exposed

### Phase 2: Voice Integration (current)
- [x] Preserve WebSocket + STT + TTS pipeline
- [x] VoiceOrb component with state-driven animations
- [x] TranscriptPanel with full conversation history

### Phase 3: AI-Driven Widgets (future — separate WebSocket)
- [ ] Backend sends `function_call` messages with widget type + data
- [ ] Frontend intercepts and calls `createWidget()`
- [ ] Widget positioning intelligence (avoid overlaps, cluster related widgets)
- [ ] Widget update/refresh when AI provides new data for existing widget

### Phase 4: Polish (future)
- [ ] Widget resize handles
- [ ] Snap-to-grid option
- [ ] Widget minimize to dock bar
- [ ] Keyboard shortcuts
- [ ] Mobile responsive layout
- [ ] Widget persistence (localStorage)
