# Assets — Чёрный вымпел

## Inventory
| asset | category | style | budget | source | status |
|---|---|---|---|---|---|
| Player Sloop (10-part hull, masts, sails, cannons, pennant) | ships | Гравюра и тушь | ~1.5k tris | procedural THREE.Group | in-progress |
| Engraved Ocean Waves + Foam | environment | Пергамент и штрих | 1 plane mesh | procedural shader / CanvasTexture | in-progress |
| Target Brig & Practice Buoys | ships/props | Гравюра и тушь | ~1.2k tris | procedural THREE.Group | in-progress |
| Cannonball / Chainshot / Grapeshot + Smoke Pool | vfx | Сургуч и тушь | 1 InstancedMesh pool | procedural | in-progress |

## Strategy by category
| category | source (pack / Blender / procedural / generation / user) | why | status |
|---|---|---|---|
| 3D Корабли и острова | procedural (`THREE.Group` 8–12 частей) | нулевые 404, мгновенное изменение пропорций по классам и штрихованный look | active |
| Текстуры штриховки и досок | procedural (`CanvasTexture` гравюрная штриховка + normal/bump) | идеальная резкость гравюры в браузере без артефактов сжатия | active |
| Звук | procedural (Web Audio API) | залп, треск дерева, свист ветра и бубенчики без внешних mp3 | active |

## Conventions
1 unit = 1 meter · Y-up · forward = `-Z` (bow), starboard = `+X`, port = `-X` · pivot корабля на ватерлинии по центру масс · цветовые карты в `SRGBColorSpace`.

## Requests to the user
- none

## License registry
| asset / pack | source (URL) | license | author | path | attribution |
|---|---|---|---|---|---|
| Procedural Engraving Assets | Generated in-project | MIT / Project | studioigor | src/scene/ | none required |
