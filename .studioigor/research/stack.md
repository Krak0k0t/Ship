# Stack & Environment Research — Чёрный вымпел (2026-11-14)
- Environment: Google AI Studio Build container (Vite 8 + React 19 + TypeScript + Three.js).
- Decision: WebGL via Three.js (`three` + `@types/three`) is the optimal 3D engine here because desktop engines (Unity/Godot/Unreal) cannot run in the browser preview container, while Three.js supports custom crosshatch/engraving CanvasTextures, `EdgesGeometry` ink silhouettes, `FogExp2` parchment horizon blending, and `isSoftwareGl` pacing via `afterDraw()`.
- Risks & mitigations: software WebGL in headless Chromium requires pixelRatio=1, `shadowMap.enabled = !isSoftwareGl`, and `afterDraw()` pacing so frames never stall.
