# DumbPin Architecture

This document outlines the architecture of the DumbPin application, explaining the key components, data flow, and technical decisions.

## System Overview

```mermaid
flowchart TD
    A[User Interface] --> B[Core Application]
    B --> C[Image Processing]
    B --> D[Data Persistence]
    C --> E[Canvas Rendering]
    D --> F[(Local Storage)]
    D --> G[(Cloud Storage)]
    style A fill:#4CAF50,stroke:#388E3C
    style B fill:#2196F3,stroke:#1976D2
    style C fill:#FF9800,stroke:#F57C00
    style D fill:#9C27B0,stroke:#7B1FA2

flowchart LR
    subgraph Frontend
        A[UI Components] --> B[State Management]
        B --> C[Routing]
        C --> D[API Communication]
    end
    D --> E[(Backend)]

sequenceDiagram
    User->>+Canvas: Upload Image
    Canvas->>+Renderer: Process Image
    Renderer->>+PinManager: Add Pin
    PinManager-->>-Renderer: Pin Coordinates
    Renderer-->>-Canvas: Update Display
    Canvas-->>-User: Show Updated Image

graph TD
    ROOT[/dumbPin/] --> COMPONENTS[/components/]
    ROOT --> CONTEXTS[/contexts/]
    ROOT --> PAGES[/pages/]
    
    COMPONENTS --> CANVAS[/canvas/]
    COMPONENTS --> PINS[/pins/]
    COMPONENTS --> UI[/ui/]
    
    CANVAS --> ImageCanvas.js
    CANVAS --> ZoomControls.js
    PINS --> PinCreator.js
    PINS --> PinEditor.js
    UI --> Button.js
    UI --> Modal.js
    
    CONTEXTS --> AppState.js
    CONTEXTS --> AuthContext.js
    
    PAGES --> _app.js
    PAGES --> index.js
    PAGES --> api[/api/]

graph LR
    DEV[Developer Machine] -->|git push| GH[GitHub]
    GH -->|Triggers| VERCEL[Vercel]
    VERCEL -->|Deploys| PROD[Production]
    VERCEL -->|Deploys| PREVIEW[Preview]
    USER[User] -->|Requests| PROD
    PROD -->|Logs| MONITOR[Monitoring]
    MONITOR --> SENTRY[Sentry]
    MONITOR --> LIGHTHOUSE[Lighthouse]

journey
    title Pin Creation Workflow
    section User Action
      Upload Image: 5: User
      Place Pin: 4: User
      Customize Pin: 3: User
    section System Process
      Validate Image: 5: System
      Store Metadata: 4: System
      Update State: 5: System
      Persist Data: 3: System
```
