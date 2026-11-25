import * as THREE from 'three';
import type { ActId, BiomePalette } from '../game/campaign';
import type { RogueWaveState } from '../game/sailingPhysics';

export interface OceanThemeColors {
  deep: number;
  shallow: number;
  subsurface: number;
  skyReflect: number;
  sunGlint: number;
  foam: number;
}

export const ACT_OCEAN_THEMES: Record<ActId, OceanThemeColors> = {
  1: {
    deep: 0x061530,
    shallow: 0x0d3a66,
    subsurface: 0x1b738f,
    skyReflect: 0x484d7a,
    sunGlint: 0xffc078,
    foam: 0xe6f4ff,
  },
  2: {
    deep: 0x120a1c,
    shallow: 0x38192a,
    subsurface: 0x76372d,
    skyReflect: 0x8f4338,
    sunGlint: 0xff9b54,
    foam: 0xf6dfd4,
  },
  3: {
    deep: 0x051026,
    shallow: 0x0e3257,
    subsurface: 0x1e6688,
    skyReflect: 0x355982,
    sunGlint: 0xd0ecff,
    foam: 0xeaf6ff,
  },
};

export interface OceanUniforms {
  uTime: { value: number };
  uWaveHeight: { value: number };
  uWindDir: { value: THREE.Vector2 };
  uStormIntensity: { value: number };
  uSunDir: { value: THREE.Vector3 };
  uDeepColor: { value: THREE.Color };
  uShallowColor: { value: THREE.Color };
  uSubsurfaceColor: { value: THREE.Color };
  uSkyReflectColor: { value: THREE.Color };
  uSunGlintColor: { value: THREE.Color };
  uFoamColor: { value: THREE.Color };
  uHeadlands: { value: THREE.Vector3[] };
  uWhirlpools: { value: THREE.Vector3[] };
  uRogueWave: { value: THREE.Vector4 };
  uRogueWaveDir: { value: THREE.Vector2 };
  uBiolumIntensity: { value: number };
  uLightningFlash: { value: number };
}

export interface OceanSurfaceController {
  material: THREE.MeshStandardMaterial;
  uniforms: OceanUniforms;
  setActTheme: (actId: ActId, palette: BiomePalette) => void;
  setHazards: (
    headlands: ReadonlyArray<{ x: number; z: number }>,
    whirlpools: ReadonlyArray<{ x: number; z: number }>,
  ) => void;
  update: (
    time: number,
    waveHeight: number,
    windAngle: number,
    stormIntensity: number,
    rogueWave?: RogueWaveState | null,
    biolumIntensity?: number,
    lightningFlash?: number,
  ) => void;
}

const OCEAN_VERT_PARS = /* glsl */ `
uniform float uTime;
uniform float uWaveHeight;
uniform vec4 uRogueWave;
uniform vec2 uRogueWaveDir;
varying vec3 vOceanWorldPos;
varying vec2 vOceanMacroSlope;
varying float vOceanWaveNorm;
varying float vRogueCrest;

float sampleRogueVert(vec2 xz) {
  float r = uRogueWave.z;
  float amp = uRogueWave.w;
  if (r <= 0.1 || amp <= 0.01) return 0.0;
  vec2 d = xz - uRogueWave.xy;
  float distSq = dot(d, d);
  float rSq = r * r;
  if (distSq >= rSq) return 0.0;
  float along = d.x * uRogueWaveDir.x + d.y * uRogueWaveDir.y;
  float perp = -d.x * uRogueWaveDir.y + d.y * uRogueWaveDir.x;
  float radial = pow(max(0.0, 1.0 - distSq / rSq), 1.5);
  float ridge = exp(-pow(along / (r * 0.34), 2.0) - pow(perp / (r * 0.85), 2.0));
  return amp * max(radial * 0.35, ridge);
}
`;

const OCEAN_VERT_NORMAL = /* glsl */ `
#include <beginnormal_vertex>
float wx_n = position.x + modelMatrix[3][0];
float wz_n = position.z + modelMatrix[3][2];
float p1_n = wx_n * 0.082 + wz_n * 0.044 + uTime * 1.38;
float p2_n = wx_n * -0.052 + wz_n * 0.095 + uTime * 1.02;
float p3_n = (wx_n + wz_n) * 0.14 - uTime * 1.85;
float rC_n = sampleRogueVert(vec2(wx_n, wz_n));
float rX_n = sampleRogueVert(vec2(wx_n + 0.65, wz_n));
float rZ_n = sampleRogueVert(vec2(wx_n, wz_n + 0.65));
float dwdx_n = (cos(p1_n) * 0.56 * 0.082 + sin(p2_n) * 0.32 * 0.052 + cos(p3_n) * 0.12 * 0.14) * uWaveHeight + (rX_n - rC_n) / 0.65;
float dwdz_n = (cos(p1_n) * 0.56 * 0.044 - sin(p2_n) * 0.32 * 0.095 + cos(p3_n) * 0.12 * 0.14) * uWaveHeight + (rZ_n - rC_n) / 0.65;
objectNormal = normalize(vec3(-dwdx_n, 1.0, -dwdz_n));
`;

const OCEAN_VERT_POS = /* glsl */ `
#include <begin_vertex>
float wx_p = transformed.x + modelMatrix[3][0];
float wz_p = transformed.z + modelMatrix[3][2];
float p1_p = wx_p * 0.082 + wz_p * 0.044 + uTime * 1.38;
float p2_p = wx_p * -0.052 + wz_p * 0.095 + uTime * 1.02;
float p3_p = (wx_p + wz_p) * 0.14 - uTime * 1.85;
float rawWave_p = sin(p1_p) * 0.56 + cos(p2_p) * 0.32 + sin(p3_p) * 0.12;
float rC_p = sampleRogueVert(vec2(wx_p, wz_p));
float rX_p = sampleRogueVert(vec2(wx_p + 0.65, wz_p));
float rZ_p = sampleRogueVert(vec2(wx_p, wz_p + 0.65));
transformed.y = rawWave_p * uWaveHeight + rC_p;
vOceanWorldPos = vec3(wx_p, transformed.y, wz_p);
vRogueCrest = uRogueWave.w > 0.05 ? clamp(rC_p / max(0.5, uRogueWave.w), 0.0, 1.0) : 0.0;
vOceanWaveNorm = clamp((rawWave_p + 1.0) * 0.5 + vRogueCrest * 0.45, 0.0, 1.0);
float dwdx_p = (cos(p1_p) * 0.56 * 0.082 + sin(p2_p) * 0.32 * 0.052 + cos(p3_p) * 0.12 * 0.14) * uWaveHeight + (rX_p - rC_p) / 0.65;
float dwdz_p = (cos(p1_p) * 0.56 * 0.044 - sin(p2_p) * 0.32 * 0.095 + cos(p3_p) * 0.12 * 0.14) * uWaveHeight + (rZ_p - rC_p) / 0.65;
vOceanMacroSlope = vec2(dwdx_p, dwdz_p);
`;

const OCEAN_FRAG_PARS = /* glsl */ `
uniform float uTime;
uniform float uWaveHeight;
uniform vec2 uWindDir;
uniform float uStormIntensity;
uniform vec3 uSunDir;
uniform vec3 uDeepColor;
uniform vec3 uShallowColor;
uniform vec3 uSubsurfaceColor;
uniform vec3 uSkyReflectColor;
uniform vec3 uSunGlintColor;
uniform vec3 uFoamColor;
uniform vec3 uHeadlands[4];
uniform vec3 uWhirlpools[3];
uniform float uBiolumIntensity;
uniform float uLightningFlash;
varying vec3 vOceanWorldPos;
varying vec2 vOceanMacroSlope;
varying float vOceanWaveNorm;
varying float vRogueCrest;

float oceanHash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float oceanNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = oceanHash(i);
  float b = oceanHash(i + vec2(1.0, 0.0));
  float c = oceanHash(i + vec2(0.0, 1.0));
  float d = oceanHash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float oceanFbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 rot = mat2(0.80, -0.60, 0.60, 0.80);
  for (int i = 0; i < 3; i++) {
    v += a * oceanNoise(p);
    p = rot * p * 2.04 + vec2(13.1, 7.7);
    a *= 0.5;
  }
  return v;
}

float oceanChopHeight(vec2 p, float t, vec2 wind) {
  vec2 crossWind = vec2(-wind.y, wind.x);
  float c1 = sin(dot(p, wind * 0.44 + crossWind * 0.18) - t * 2.35);
  float c2 = sin(dot(p, wind * 0.72 - crossWind * 0.48) - t * 3.15 + 1.4);
  float c3 = cos(dot(p, crossWind * 1.25 + wind * 0.28) + t * 2.75);
  float c4 = (oceanNoise(p * 0.55 - wind * (t * 0.72)) - 0.5) * 1.85;
  float c5 = (oceanNoise(p * 1.35 + crossWind * (t * 0.62) - wind * (t * 0.42)) - 0.5) * 0.95;
  return c1 * 0.28 + c2 * 0.22 + c3 * 0.16 + c4 * 0.22 + c5 * 0.16;
}
`;

export function createOceanMaterial(): OceanSurfaceController {
  const uniforms: OceanUniforms = {
    uTime: { value: 0 },
    uWaveHeight: { value: 1.05 },
    uWindDir: { value: new THREE.Vector2(0.6, 0.8) },
    uStormIntensity: { value: 0 },
    uSunDir: { value: new THREE.Vector3(-0.52, 0.36, -0.84).normalize() },
    uDeepColor: { value: new THREE.Color(ACT_OCEAN_THEMES[1].deep) },
    uShallowColor: { value: new THREE.Color(ACT_OCEAN_THEMES[1].shallow) },
    uSubsurfaceColor: { value: new THREE.Color(ACT_OCEAN_THEMES[1].subsurface) },
    uSkyReflectColor: { value: new THREE.Color(ACT_OCEAN_THEMES[1].skyReflect) },
    uSunGlintColor: { value: new THREE.Color(ACT_OCEAN_THEMES[1].sunGlint) },
    uFoamColor: { value: new THREE.Color(ACT_OCEAN_THEMES[1].foam) },
    uHeadlands: {
      value: [
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
      ],
    },
    uWhirlpools: {
      value: [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()],
    },
    uRogueWave: { value: new THREE.Vector4(0, 0, 0, 0) },
    uRogueWaveDir: { value: new THREE.Vector2(1, 0) },
    uBiolumIntensity: { value: 0 },
    uLightningFlash: { value: 0 },
  };

  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.24,
    metalness: 0.04,
    envMapIntensity: 0.04,
  });

  material.customProgramCacheKey = () => 'twilight-corsair-ocean-v7';

  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);

    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${OCEAN_VERT_PARS}`)
      .replace('#include <beginnormal_vertex>', OCEAN_VERT_NORMAL)
      .replace('#include <begin_vertex>', OCEAN_VERT_POS);

    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${OCEAN_FRAG_PARS}`)
      .replace(
        '#include <color_fragment>',
        /* glsl */ `
        #include <color_fragment>
        vec2 oceanXZ = vOceanWorldPos.xz;
        float camDist = length(cameraPosition - vOceanWorldPos);
        float rippleAtten = 1.0 - smoothstep(42.0, 175.0, camDist);

        float chopC = oceanChopHeight(oceanXZ, uTime, uWindDir);
        if (uStormIntensity > 0.35 && camDist < 54.0) {
          vec2 rainUV = oceanXZ * 0.55;
          vec2 rainCell = floor(rainUV);
          float occupy = oceanHash(rainCell + 3.7);
          if (occupy > 0.42) {
            vec2 jitter = vec2(oceanHash(rainCell + 1.3), oceanHash(rainCell + 7.9)) - 0.5;
            vec2 rainLocal = fract(rainUV) - 0.5 - jitter * 0.62;
            float seed = oceanHash(rainCell + 5.1);
            float phase = fract(uTime * 1.35 + seed * 6.2831);
            float ringDist = length(rainLocal);
            float ring = sin((ringDist - phase * 0.42) * 32.0) * exp(-abs(ringDist - phase * 0.42) * 15.0);
            float stormWeight = smoothstep(0.35, 0.85, uStormIntensity);
            float rainFade = (1.0 - phase) * stormWeight * (1.0 - smoothstep(22.0, 54.0, camDist));
            chopC += ring * rainFade * 0.11;
          }
        }
        float eps = 0.24;
        float chopX = oceanChopHeight(oceanXZ + vec2(eps, 0.0), uTime, uWindDir);
        float chopZ = oceanChopHeight(oceanXZ + vec2(0.0, eps), uTime, uWindDir);
        float chopScale = (0.19 + 0.08 * uStormIntensity) * rippleAtten;
        vec2 chopSlope = vec2((chopX - chopC) / eps, (chopZ - chopC) / eps) * chopScale;

        vec3 oceanWorldN = normalize(vec3(
          -(vOceanMacroSlope.x + chopSlope.x),
          1.0,
          -(vOceanMacroSlope.y + chopSlope.y)
        ));
        vec3 oceanViewDir = normalize(cameraPosition - vOceanWorldPos);
        float oceanFresnel = pow(1.0 - clamp(dot(oceanWorldN, oceanViewDir), 0.0, 1.0), 4.4);

        // Organic frothy seafoam lace & wind-swept whitecap streaks along peak crests
        float foamNoise1 = oceanFbm(oceanXZ * 0.46 - uWindDir * (uTime * 0.68));
        float foamNoise2 = oceanNoise(oceanXZ * 1.45 - uWindDir * (uTime * 0.55) + vec2(uTime * 0.22, -uTime * 0.18));
        vec2 windPerp = vec2(-uWindDir.y, uWindDir.x);
        float windStreak = oceanNoise(vec2(dot(oceanXZ, uWindDir) * 0.18 - uTime * 0.85, dot(oceanXZ, windPerp) * 0.95));
        float foamLace = foamNoise1 * 0.54 + foamNoise2 * 0.30 + windStreak * 0.16;
        float crestHeight = vOceanWaveNorm + chopC * 0.14 + uStormIntensity * 0.14;
        float crestFoam = smoothstep(0.75, 0.97, crestHeight) * smoothstep(0.50, 0.78, foamLace);

        // Breaking surf foam rings around rocky headlands
        float reefFoam = 0.0;
        for (int i = 0; i < 4; i++) {
          vec3 hd = uHeadlands[i];
          if (hd.z > 0.5) {
            float d = length(oceanXZ - hd.xy);
            float shoreZone = smoothstep(16.2, 11.4, d) * smoothstep(9.2, 11.0, d);
            float ringWave = 0.5 + 0.5 * sin(d * 2.1 - uTime * 2.8 + foamNoise1 * 4.0);
            reefFoam = max(reefFoam, shoreZone * mix(0.35, 1.0, ringWave) * smoothstep(0.38, 0.72, foamLace));
          }
        }

        // Swirling foam around active whirlpools
        float vortexFoam = 0.0;
        for (int i = 0; i < 3; i++) {
          vec3 wp = uWhirlpools[i];
          if (wp.z > 0.5) {
            vec2 rel = oceanXZ - wp.xy;
            float d = length(rel);
            if (d < 17.5) {
              float ang = atan(rel.y, rel.x);
              float spiral = 0.5 + 0.5 * sin(ang * 4.0 + d * 0.9 - uTime * 4.4);
              float mask = smoothstep(17.5, 4.2, d) * smoothstep(1.4, 4.5, d);
              vortexFoam = max(vortexFoam, mask * spiral * smoothstep(0.38, 0.75, foamLace) * 0.82);
            }
          }
        }

        float totalFoam = clamp(crestFoam * 0.92 + reefFoam * 0.95 + vortexFoam + vRogueCrest * smoothstep(0.32, 0.72, foamLace) * 0.78, 0.0, 1.0);

        // Rich water depth & slope shading
        float depthFactor = clamp(vOceanWaveNorm + chopC * 0.11, 0.0, 1.0);
        vec3 baseWater = mix(uDeepColor, uShallowColor, smoothstep(0.18, 0.78, depthFactor));
        float crestHighlight = smoothstep(0.58, 0.96, depthFactor) * (0.42 + 0.58 * foamNoise1);
        baseWater = mix(baseWater, uSubsurfaceColor, clamp(crestHighlight * 0.56 + vRogueCrest * 0.42, 0.0, 0.85));

        // Subtle sky reflection at grazing angles + horizon atmospheric mist melt
        float horizonMist = smoothstep(138.0, 226.0, camDist);
        baseWater = mix(baseWater, uSkyReflectColor, clamp(oceanFresnel * 0.24 + horizonMist * 0.52, 0.0, 0.72));

        // Foam overlay
        diffuseColor.rgb = mix(baseWater, uFoamColor, totalFoam * 0.84 * (1.0 - horizonMist * 0.55));
        `,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        /* glsl */ `
        #include <roughnessmap_fragment>
        float microRough = mix(0.22, 0.30, chopC * 0.5 + 0.5);
        roughnessFactor = mix(microRough, 0.88, totalFoam);
        `,
      )
      .replace(
        '#include <normal_fragment_maps>',
        /* glsl */ `
        #include <normal_fragment_maps>
        normal = normalize((viewMatrix * vec4(oceanWorldN, 0.0)).xyz);
        `,
      )
      .replace(
        '#include <lights_fragment_end>',
        /* glsl */ `
        #include <lights_fragment_end>
        // Softly compress broad PBR specular sheets so directional lights sculpt ripples without blinding whiteout or HDR bloom
        reflectedLight.directSpecular = (reflectedLight.directSpecular / (vec3(1.0) + reflectedLight.directSpecular * 2.1)) * 0.32;
        reflectedLight.indirectSpecular *= 0.20;
        `,
      )
      .replace(
        '#include <emissivemap_fragment>',
        /* glsl */ `
        #include <emissivemap_fragment>
        // Backlit wave-crest subsurface translucency toward sunset horizon
        float backLit = pow(clamp(dot(-oceanViewDir, uSunDir), 0.0, 1.0), 3.2);
        float sssMask = smoothstep(0.54, 0.96, vOceanWaveNorm) * (0.24 + 0.76 * backLit);
        totalEmissiveRadiance += uSubsurfaceColor * (sssMask * 0.25 + vRogueCrest * 0.14);

        // Crisp jewel-like sun glitter pinpoints across animated wave facets
        vec3 sunHalf = normalize(uSunDir + oceanViewDir);
        float glint = pow(clamp(dot(oceanWorldN, sunHalf), 0.0, 1.0), 210.0);
        float glintCore = smoothstep(0.18, 0.75, glint) * 0.38;
        totalEmissiveRadiance += uSunGlintColor * glintCore * (1.0 - totalFoam * 0.85);

        // Subtle fresnel twilight rim
        totalEmissiveRadiance += uSkyReflectColor * oceanFresnel * 0.045;

        // Bioluminescent plankton crests & storm lightning sheet illumination
        if (uBiolumIntensity > 0.01) {
          float bioMask = clamp(crestFoam * 1.15 + vortexFoam * 0.9 + totalFoam * 0.35, 0.0, 1.0);
          float bioPulse = 0.65 + 0.35 * sin(uTime * 3.1 + foamNoise1 * 5.0);
          totalEmissiveRadiance += vec3(0.14, 0.88, 0.84) * bioMask * bioPulse * uBiolumIntensity * 0.42;
        }
        if (uLightningFlash > 0.01) {
          float sheet = (0.35 + oceanFresnel * 0.85 + totalFoam * 0.4) * uLightningFlash;
          totalEmissiveRadiance += vec3(0.68, 0.84, 1.0) * sheet * 0.36;
        }
        `,
      );
  };

  return {
    material,
    uniforms,
    setActTheme(actId: ActId, palette: BiomePalette) {
      const theme = ACT_OCEAN_THEMES[actId];
      uniforms.uDeepColor.value.setHex(theme.deep);
      uniforms.uShallowColor.value.setHex(theme.shallow);
      uniforms.uSubsurfaceColor.value.setHex(theme.subsurface);
      uniforms.uSkyReflectColor.value.setHex(theme.skyReflect);
      uniforms.uSunGlintColor.value.setHex(theme.sunGlint);
      uniforms.uFoamColor.value.setHex(theme.foam);
      // Harmonize distant sky reflection subtly with palette horizon
      const horizonTint = new THREE.Color().setRGB(
        palette.horizon[0],
        palette.horizon[1],
        palette.horizon[2],
      );
      uniforms.uSkyReflectColor.value.lerp(horizonTint, 0.25);
    },
    setHazards(headlands, whirlpools) {
      for (let i = 0; i < 4; i += 1) {
        const h = headlands[i];
        if (h) {
          uniforms.uHeadlands.value[i].set(h.x, h.z, 1);
        } else {
          uniforms.uHeadlands.value[i].set(0, 0, 0);
        }
      }
      for (let i = 0; i < 3; i += 1) {
        const w = whirlpools[i];
        if (w) {
          uniforms.uWhirlpools.value[i].set(w.x, w.z, 1);
        } else {
          uniforms.uWhirlpools.value[i].set(0, 0, 0);
        }
      }
    },
    update(
      time,
      waveHeight,
      windAngle,
      stormIntensity,
      rogueWave,
      biolumIntensity = 0,
      lightningFlash = 0,
    ) {
      uniforms.uTime.value = time;
      uniforms.uWaveHeight.value = waveHeight;
      uniforms.uWindDir.value.set(-Math.sin(windAngle), Math.cos(windAngle)).normalize();
      uniforms.uStormIntensity.value = Math.max(0, Math.min(1, stormIntensity));
      uniforms.uBiolumIntensity.value = Math.max(0, Math.min(1, biolumIntensity));
      uniforms.uLightningFlash.value = Math.max(0, Math.min(1, lightningFlash));
      if (rogueWave && rogueWave.active) {
        uniforms.uRogueWave.value.set(
          rogueWave.x,
          rogueWave.z,
          rogueWave.radius,
          rogueWave.amplitude,
        );
        uniforms.uRogueWaveDir.value.set(rogueWave.dirX, rogueWave.dirZ).normalize();
      } else {
        uniforms.uRogueWave.value.set(0, 0, 0, 0);
      }
    },
  };
}
