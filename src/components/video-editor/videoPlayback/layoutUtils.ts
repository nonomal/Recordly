import { Application, Sprite, Graphics } from 'pixi.js';
import { computeSceneFrameLayout, type SceneFrameLayout } from '@/lib/sceneFrames';
import type { CropRegion, SceneFrameStyle } from '../types';
import { drawSquircleOnGraphics } from '@/lib/geometry/squircle';

interface LayoutParams {
  container: HTMLDivElement;
  app: Application;
  videoSprite: Sprite;
  maskGraphics: Graphics;
  videoElement: HTMLVideoElement;
  cropRegion?: CropRegion;
  lockedVideoDimensions?: { width: number; height: number } | null;
  borderRadius?: number;
  padding?: number;
  sceneFrameStyle?: SceneFrameStyle;
  sceneFrameThickness?: number;
}

interface LayoutResult {
  stageSize: { width: number; height: number };
  videoSize: { width: number; height: number };
  baseScale: number;
  baseOffset: { x: number; y: number };
  maskRect: {
    x: number;
    y: number;
    width: number;
    height: number;
    sourceCrop?: CropRegion;
  };
  cropBounds: { startX: number; endX: number; startY: number; endY: number };
  sceneFrameLayout: SceneFrameLayout;
}

export function layoutVideoContent(params: LayoutParams): LayoutResult | null {
  const {
    container,
    app,
    videoSprite,
    maskGraphics,
    videoElement,
    cropRegion,
    lockedVideoDimensions,
    borderRadius = 0,
    padding = 0,
    sceneFrameStyle = 'none',
    sceneFrameThickness = 12,
  } = params;

  const videoWidth = lockedVideoDimensions?.width || videoElement.videoWidth;
  const videoHeight = lockedVideoDimensions?.height || videoElement.videoHeight;

  if (!videoWidth || !videoHeight) {
    return null;
  }

  const width = container.clientWidth;
  const height = container.clientHeight;

  if (!width || !height) {
    return null;
  }

  app.renderer.resize(width, height);
  app.canvas.style.width = '100%';
  app.canvas.style.height = '100%';

  // Apply crop region
  const crop = cropRegion || { x: 0, y: 0, width: 1, height: 1 };
  
  // Calculate the cropped dimensions
  const croppedVideoWidth = videoWidth * crop.width;
  const croppedVideoHeight = videoHeight * crop.height;

  const cropStartX = crop.x * videoWidth;
  const cropStartY = crop.y * videoHeight;
  const cropEndX = cropStartX + croppedVideoWidth;
  const cropEndY = cropStartY + croppedVideoHeight;
  
  const contentAspectRatio = croppedVideoHeight > 0
    ? croppedVideoWidth / croppedVideoHeight
    : videoWidth / videoHeight;
  const sceneFrameLayout = computeSceneFrameLayout({
    containerWidth: width,
    containerHeight: height,
    padding,
    contentAspectRatio,
    borderRadius,
    frameStyle: sceneFrameStyle,
    frameThickness: sceneFrameThickness,
  });
  const maxDisplayWidth = sceneFrameLayout.contentRect.width;
  const maxDisplayHeight = sceneFrameLayout.contentRect.height;

  const scale = Math.min(
    maxDisplayWidth / croppedVideoWidth,
    maxDisplayHeight / croppedVideoHeight,
  );

  videoSprite.scale.set(scale);
  
  // Calculate display size of the full video at this scale
  const fullVideoDisplayWidth = videoWidth * scale;
  const fullVideoDisplayHeight = videoHeight * scale;
  
  // Calculate display size of just the cropped region
  const croppedDisplayWidth = croppedVideoWidth * scale;
  const croppedDisplayHeight = croppedVideoHeight * scale;

  // Center the cropped region in the container
  const centerOffsetX =
    sceneFrameLayout.contentRect.x +
    (sceneFrameLayout.contentRect.width - croppedDisplayWidth) / 2;
  const centerOffsetY =
    sceneFrameLayout.contentRect.y +
    (sceneFrameLayout.contentRect.height - croppedDisplayHeight) / 2;
  
  // Position the full video sprite so that when we apply the mask,
  // the cropped region appears centered
  // The crop starts at (crop.x * videoWidth, crop.y * videoHeight) in video coordinates
  // In display coordinates, that's (crop.x * fullVideoDisplayWidth, crop.y * fullVideoDisplayHeight)
  // We want that point to be at centerOffsetX, centerOffsetY
  const spriteX = centerOffsetX - (crop.x * fullVideoDisplayWidth);
  const spriteY = centerOffsetY - (crop.y * fullVideoDisplayHeight);
  
  videoSprite.position.set(spriteX, spriteY);

  // Create a mask that only shows the cropped region (centered in container)
  const maskX = centerOffsetX;
  const maskY = centerOffsetY;
  
  // Apply border radius
  maskGraphics.clear();
  drawSquircleOnGraphics(maskGraphics, {
    x: maskX,
    y: maskY,
    width: croppedDisplayWidth,
    height: croppedDisplayHeight,
    radius: sceneFrameLayout.contentRadius,
  });
  maskGraphics.fill({ color: 0xffffff });

  return {
    stageSize: { width, height },
    videoSize: { width: croppedVideoWidth, height: croppedVideoHeight },
    baseScale: scale,
    baseOffset: { x: spriteX, y: spriteY },
    maskRect: {
      x: maskX,
      y: maskY,
      width: croppedDisplayWidth,
      height: croppedDisplayHeight,
      sourceCrop: crop,
    },
    cropBounds: { startX: cropStartX, endX: cropEndX, startY: cropStartY, endY: cropEndY },
    sceneFrameLayout,
  };
}

