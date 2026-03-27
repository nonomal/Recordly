import type { SceneFrameStyle } from "@/components/video-editor/types";

export interface SceneFrameRect {
	x: number;
	y: number;
	width: number;
	height: number;
}

export interface SceneFrameLayout {
	style: SceneFrameStyle;
	frameRect: SceneFrameRect;
	contentRect: SceneFrameRect;
	frameRadius: number;
	contentRadius: number;
	toolbarRect?: SceneFrameRect;
	glassStrokeWidth: number;
}

export const SCENE_FRAME_OPTIONS: Array<{ value: SceneFrameStyle; label: string }> = [
	{ value: "none", label: "None" },
	{ value: "safari", label: "Safari" },
	{ value: "glass", label: "Glass" },
];

export function computePaddingScale(padding: number): number {
	return 1 - (Math.max(0, Math.min(100, padding)) / 100) * 0.4;
}

export function computeSceneFrameLayout(params: {
	containerWidth: number;
	containerHeight: number;
	padding: number;
	contentAspectRatio: number;
	borderRadius: number;
	frameStyle: SceneFrameStyle;
	frameThickness: number;
}): SceneFrameLayout {
	const {
		containerWidth,
		containerHeight,
		padding,
		contentAspectRatio,
		borderRadius,
		frameStyle,
		frameThickness,
	} = params;
	const paddingScale = computePaddingScale(padding);
	const availableWidth = containerWidth * paddingScale;
	const availableHeight = containerHeight * paddingScale;
	const safeAspectRatio = Number.isFinite(contentAspectRatio) && contentAspectRatio > 0
		? contentAspectRatio
		: 16 / 9;

	if (frameStyle === "safari") {
		const sideInsetRatio = 0.022;
		const topInsetRatio = 0.02;
		const toolbarRatio = 0.1;
		const bottomInsetRatio = 0.022;
		const frameHeightFactor =
			(1 - sideInsetRatio * 2) / safeAspectRatio + topInsetRatio + toolbarRatio + bottomInsetRatio;

		let frameWidth = availableWidth;
		let frameHeight = frameWidth * frameHeightFactor;

		if (frameHeight > availableHeight) {
			frameHeight = availableHeight;
			frameWidth = frameHeight / frameHeightFactor;
		}

		const frameRect = {
			x: (containerWidth - frameWidth) / 2,
			y: (containerHeight - frameHeight) / 2,
			width: frameWidth,
			height: frameHeight,
		};
		const sideInset = frameWidth * sideInsetRatio;
		const topInset = frameWidth * topInsetRatio;
		const toolbarHeight = frameWidth * toolbarRatio;
		const bottomInset = frameWidth * bottomInsetRatio;
		const toolbarRect = {
			x: frameRect.x + sideInset,
			y: frameRect.y + topInset,
			width: frameRect.width - sideInset * 2,
			height: toolbarHeight,
		};
		const contentRect = {
			x: frameRect.x + sideInset,
			y: frameRect.y + topInset + toolbarHeight,
			width: frameRect.width - sideInset * 2,
			height: frameRect.height - topInset - toolbarHeight - bottomInset,
		};

		return {
			style: frameStyle,
			frameRect,
			contentRect,
			frameRadius: Math.max(14, Math.min(frameRect.width, frameRect.height) * 0.045),
			contentRadius: Math.max(10, borderRadius),
			toolbarRect,
			glassStrokeWidth: Math.max(1, frameThickness),
		};
	}

	let contentWidth = availableWidth;
	let contentHeight = contentWidth / safeAspectRatio;

	if (contentHeight > availableHeight) {
		contentHeight = availableHeight;
		contentWidth = contentHeight * safeAspectRatio;
	}

	const contentRect = {
		x: (containerWidth - contentWidth) / 2,
		y: (containerHeight - contentHeight) / 2,
		width: contentWidth,
		height: contentHeight,
	};

	return {
		style: frameStyle,
		frameRect: contentRect,
		contentRect,
		frameRadius: Math.max(0, borderRadius),
		contentRadius: Math.max(0, borderRadius),
		glassStrokeWidth: Math.max(1, frameThickness),
	};
}