# Assets & Mech-M01 Research — Engraving Style & Sailing Physics (2026-11-14)
- Style 02 («Гравюра и сургучная карта»): Base parchment `#EFE4CE`, charcoal ink `#1A1817`, sepia timber `#8C7355`, antique brass `#C99A42`, reserved scarlet wax `#C83228`.
- Procedural engraving craft: generate tileable ink-hatch CanvasTextures (`SRGBColorSpace`) + `EdgesGeometry(geo, 22)` ink line overlays for hull ribs, masts, yards, and islands so silhouettes read like copperplate engravings at any camera angle.
- M01 Sailing & Wind Polar curve (Sea Dogs / Sid Meier's Pirates! reference):
  - Sail states: 0% (Anchored), 50% (Battle Sails — tighter turn radius, moderate speed), 100% (Full Sails — max speed on beam/broad reach, wider turn radius).
  - Wind polar efficiency: best speed at beam reach / broad reach (60°–135° off wind, up to 1.15×), running dead downwind ~0.85×, sailing close-hauled into wind (<35° off wind head-to-wind) drops to ~0.22× ("в левентик") with sail flutter feedback!
  - Wave roll physics: sinusoidal dual-swell pitch & roll drives deck heeling AND powers GD01 («Залп по гребню волны» — firing near wave crest window grants +35% penetration & tighter spread!).
