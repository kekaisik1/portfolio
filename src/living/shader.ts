/**
 * The living photo's shader: one triangle over the stage that samples the photograph and moves its pixels.
 * Where nothing moves the output is transparent, so the real <img> underneath shows, sharp and untouched; with
 * uAmp at 0 every moving part is exactly the photograph too, which is how a world fades from still to alive.
 */

export const VERTEX = `#version 300 es
in vec2 aPos;
/* stage -> photo: x scale, x offset, y scale, y offset (object-fit: cover, as src/worlds/cover.ts works it out) */
uniform vec4 uCover;
out vec2 vUv;
void main() {
  vec2 s = aPos * 0.5 + 0.5;
  vUv = vec2(s.x * uCover.x + uCover.y, (1.0 - s.y) * uCover.z + uCover.w);
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

export const FRAGMENT = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 o;

uniform sampler2D uPhoto;
uniform sampler2D uMaskA;   /* rg flow, b mist, a shimmer */
uniform sampler2D uMaskB;   /* rg sway, b stars */
uniform sampler2D uNoise;
uniform vec2 uLand;         /* landscape u = uLand.x + u * uLand.y (the upright crop is a slice of the landscape) */
uniform float uTime;
uniform float uAmp;
uniform float uCycle;
uniform vec2 uScale;        /* what a full byte of flow / sway stands for */
uniform vec3 uSway;         /* rate, wave u, wave v */
uniform vec3 uMist;         /* drift u, drift v, scale */
uniform vec3 uMistRgb;
uniform vec2 uShimmer;      /* size, speed */
uniform int uLightN;
uniform vec4 uLightA[6];    /* u, v, radius, amount */
uniform vec4 uLightB[6];    /* speed, seed, kind (0 flicker, 1 breathe), - */

const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);
const vec2 ASPECT = vec2(1.5, 1.0);

float flicker(float t) {
  return 0.5 * sin(t) + 0.3 * sin(t * 2.31 + 1.3) + 0.2 * sin(t * 5.17 + 4.1);
}
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

void main() {
  vec2 L = vec2(uLand.x + vUv.x * uLand.y, vUv.y);
  vec4 a = texture(uMaskA, L);
  vec4 b = texture(uMaskB, L);
  vec2 toImg = vec2(1.0 / uLand.y, 1.0);
  vec2 flow = (a.rg * 255.0 - 128.0) / 127.0;
  vec2 sway = (b.rg * 255.0 - 128.0) / 127.0;
  vec4 n = texture(uNoise, L * vec2(3.0, 2.0));
  vec2 uv = vUv;
  float cover = 0.0;

  /* sway: a wave travelling through the region, in gusts */
  float sw = length(sway);
  if (sw > 0.0) {
    float wave = sin(uTime * uSway.x - dot(L, uSway.yz) + n.r * 3.0);
    float gust = 0.55 + 0.45 * sin(uTime * 0.37 + L.x * 5.0 + n.g * 4.0);
    uv += sway * uScale.y * toImg * (wave * gust * uAmp);
    cover += sw;
  }

  /* shimmer: two layers of noise sliding against each other */
  if (a.a > 0.0) {
    vec2 r = texture(uNoise, L * vec2(12.0, 8.0) + vec2(uTime * 0.011, uTime * uShimmer.y)).ba;
    r += texture(uNoise, L * vec2(27.0, 18.0) - vec2(uTime * 0.017, uTime * uShimmer.y * 1.7)).rg;
    uv += (r - 1.0) * toImg * (a.a * uShimmer.x * uAmp);
    cover += a.a;
  }

  /* flow: two copies of the photo carried along, each fading out as the other fades in, so the loop has no seam */
  float ph = uTime / uCycle + n.b * 0.4;
  float p0 = fract(ph);
  float p1 = fract(ph + 0.5);
  vec2 f = flow * uScale.x * toImg * uAmp;
  vec3 c0 = texture(uPhoto, uv - f * (p0 - 0.5)).rgb;
  vec3 c1 = texture(uPhoto, uv - f * (p1 - 0.5)).rgb;
  vec3 col = mix(c0, c1, abs(2.0 * p0 - 1.0));
  cover += length(flow);

  /* mist: soft noise drifting over the photo */
  if (a.b > 0.0) {
    /* wider than tall: fog lies in layers */
    vec2 q = vec2(L.x * 0.8, L.y * 2.2) * uMist.z;
    float f1 = texture(uNoise, q + uTime * uMist.xy).g;
    float f2 = texture(uNoise, q * 2.7 + uTime * uMist.xy * 1.9 + 0.37).b;
    float fog = smoothstep(0.32, 0.72, f1 * 0.7 + f2 * 0.3);
    col = mix(col, uMistRgb, a.b * fog * uAmp);
    cover += a.b;
  }

  /* stars: a pixel brighter than its surroundings is a star; each twinkles at its own pace */
  if (b.b > 0.0) {
    float around = dot(textureLod(uPhoto, uv, 3.5).rgb, LUMA);
    float star = smoothstep(0.035, 0.14, dot(col, LUMA) - around) * b.b;
    float h = hash(floor(L * vec2(256.0, 171.0)));
    float tw = sin(uTime * (1.2 + 2.6 * h) + h * 50.0);
    col *= 1.0 + star * 0.55 * tw * uAmp;
    cover += star;
  }

  /* lights: the photo's own light gets brighter and darker */
  float gain = 0.0;
  for (int i = 0; i < 6; i++) {
    if (i >= uLightN) break;
    vec2 d = (L - uLightA[i].xy) * ASPECT;
    float fall = max(0.0, 1.0 - dot(d, d) / (uLightA[i].z * uLightA[i].z));
    fall *= fall;
    float t = uTime * uLightB[i].x + uLightB[i].y;
    float s = uLightB[i].z < 0.5 ? flicker(t) : sin(t);
    gain += fall * uLightA[i].w * s;
    cover += fall;
  }
  col *= 1.0 + gain * uAmp;

  float alpha = clamp(cover * 6.0, 0.0, 1.0);
  o = vec4(col * alpha, alpha);
}`;
