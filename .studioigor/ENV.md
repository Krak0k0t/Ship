# Environment — Чёрный вымпел

VERIFIED: yes

## Installed
| tool | version | why |
|---|---|---|
| Node.js + Vite | Vite 8.3.0 | dev-сервер на порту 3000 и сборка |
| Three.js | three + @types/three | 3D WebGL-движок и процедурные меши/шейдеры |
| tsx + node:test | tsx 4.21.0 | быстрые unit-тесты игровой логики |
| playwright-cli | Chromium headless | визуальная проверка 3D-сцены и джимов |

## Agent integrations
Playwright CLI (`computer-use` skill), TypeScript (`tsc --noEmit`), Vite build (`npm run build`), `studio.py` state tracker.

## Commands
RUN: npm run dev (порт 3000)
TEST: npx --yes tsx --test src/game/*.test.ts src/utils/*.test.ts
BUILD: npm run build
CAPTURE: playwright-cli screenshot --filename=.studioigor/captures/capture.png
EDITOR: VS Code / AI Studio Build
