import type { Page } from '@playwright/test';

/**
 * Is a real GPU drawing? The living photo is WebGL; on a software renderer (a CI runner without a GPU) the page
 * rightly gives the motion up after a few seconds and shows stills, so the tests that watch it move, or that watch
 * particles drawn from the same frame loop, need hardware.
 */
export const hasGpu = (page: Page): Promise<boolean> =>
  page.evaluate(() => {
    const gl = document.createElement('canvas').getContext('webgl2');
    const info = gl?.getExtension('WEBGL_debug_renderer_info');
    if (!gl || !info) return false;
    return !/swiftshader|llvmpipe|software/i.test(String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)));
  });

export const NEEDS_GPU = 'the living photo needs a GPU: on a software renderer the page shows stills';
