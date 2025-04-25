## Project Overview
- Single-page interactive graph app with adjustable parameters.  
- Real-time graph updates driven by sliders; no full-page reloads.

## Technology Stack
- **Language**: TypeScript  
- **Framework**: SvelteKit  
- **Styling**: Tailwind CSS (utility-first)  
- **Charts**: Chart.js  

## Functional Requirements
1. **Real-time Updates**  
   - Graph redraws immediately when slider values change.  
2. **Responsive Design**  
   - **Mobile-first**: sliders hidden in a collapsible menu.  
   - **Desktop**: sliders and graph side-by-side.  

## Frontend Guidelines
- One component per `.svelte` file with clear, descriptive names.  
- Leverage Svelte reactivity: reactive declarations (`$:`) & stores for shared state.  
- Avoid inline styles; prefer Tailwind utility classes or scoped `<style>`.  
- Bind slider values to reactive variables to update Chart.js datasets.

## Code Quality & Structure
- Strict TypeScript typings; avoid `any`.  
- Separate concerns:  
  - `src/lib/` for shared logic  
  - `src/routes/` for pages & API endpoints  
- Write modular, reusable functions.  
- Use descriptive commit messages matching project style.
