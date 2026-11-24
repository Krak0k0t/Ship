# Technology — Чёрный вымпел

ENGINE: web
ENGINE VERSION: Three.js + React 19 + Vite 8 + TypeScript 7
DIMENSION: 3D
LANGUAGE: TypeScript
PLATFORMS: Web Browser (Desktop & Mobile WebGL)

## Decision
- context: 3D парусная игра в стиле «Гравюра и сургучная карта» в веб-песочнице AI Studio Build (порт 3000).
- options: Godot/Unity/Unreal (требуют десктопного рантайма и недоступны в веб-контейнере) vs Web / Three.js + React + Vite (нативный WebGL, мгновенный запуск на порту 3000, полная управляемость шейдеров штриховки).
- choice and why: Web (Three.js + TypeScript) — единственная полноценная 3D-платформа в этой среде, идеально подходит для стилизованной гравюры и процедурных кораблей.
- consequences: все 3D-модели, гравюрные текстуры и Web Audio эффекты генерируются процедурно (zero-404), с обязательным `isSoftwareGl` путём для headless/SwiftShader браузера.

## Budgets
60 FPS на GPU (pixelRatio ≤ 2, ≤ 1 shadow-casting light, pooled particles, zero GC в render loop); плавная адаптация с `afterDraw()` на software WebGL.

## Project structure
- `src/game/` — чистая симуляция парусной физики, ветра, снарядов и правил (покрыта unit-тестами `node:test`)
- `src/scene/` — Three.js рендер: гравюрные материалы, океан с волнами, составной 3D-корабль, ленты ветра, частицы залпов
- `src/audio/` — процедурный Web Audio (скрип дерева, свист ветра, пушечный залп)
- `src/components/` — Game Shell, HUD, Title Screen и слайдеры джима
