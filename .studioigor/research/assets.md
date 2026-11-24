# Assets Research — Гравюра и сургучная карта (2026-11-14)
- Style anchor: `.studioigor/ART_BIBLE.md` (Dominant `#EFE4CE`, Ink `#1A1817`, Sepia `#8C7355`, Brass `#C99A42`, Scarlet Wax `#C83228`).
- Procedural 3D craft: Three.js `ExtrudeGeometry` bevelled hulls + `EdgesGeometry` ink contour lines (`LineSegments`) + tileable procedural `CanvasTexture` crosshatching give an authentic copperplate engraving look with zero external asset 404s.
- Ocean & wake: Vertex-animated 64×64 parchment-hatched sea plane synchronized with analytical `waveElevationAt(x, z, t)` ensures hulls ride swells accurately and enables the wave-crest broadside timing mechanic (GD01).
