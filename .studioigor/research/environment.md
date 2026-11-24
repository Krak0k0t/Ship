# Environment Setup Notes — Web Three.js (2026-11-14)
- Verified tools: `node`, `npm`, `vite` (port 3000), `tsx` (`node:test`), `tsc --noEmit`, `playwright-cli` (headless Chromium).
- Three.js conventions: `RoomEnvironment` PMREM + warm directional key + cool/sepia `HemisphereLight`, `ACESFilmicToneMapping`, zero-GC scratch vectors outside animation loop, isolated `<div ref>` mount outside React HUD.
