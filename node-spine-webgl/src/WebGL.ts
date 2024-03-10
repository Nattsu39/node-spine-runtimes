import { Restorable, BlendMode } from "@node-spine-runtimes/core-3.8.99";
import { Canvas } from "node-canvas-webgl";
import { WebGLRenderingContext } from "gl";

export class ManagedWebGLRenderingContext {
	public canvas: Canvas;
	public gl: WebGLRenderingContext;
	private restorables = new Array<Restorable>();

	constructor(
		canvasOrContext: Canvas | WebGLRenderingContext,
		contextConfig: any = { alpha: "true" },
	) {
		if (!(canvasOrContext instanceof WebGLRenderingContext)) {
			let canvas: Canvas = canvasOrContext;
			this.gl = <WebGLRenderingContext>(
				canvas.getContext("webgl2", contextConfig)
			);
			this.canvas = canvas;
			this.canvas.addEventListener("webglcontextlost", (e: any) => {
				let event = e;
				if (e) {
					e.preventDefault();
				}
			});

			this.canvas.addEventListener("webglcontextrestored", (e: any) => {
				for (let i = 0, n = this.restorables.length; i < n; i++) {
					this.restorables[i].restore();
				}
			});
		} else {
			this.gl = canvasOrContext;
			this.canvas = this.gl.canvas!;
		}
	}

	addRestorable(restorable: Restorable) {
		this.restorables.push(restorable);
	}

	removeRestorable(restorable: Restorable) {
		let index = this.restorables.indexOf(restorable);
		if (index > -1) this.restorables.splice(index, 1);
	}
}

export class WebGLBlendModeConverter {
	static ZERO = 0;
	static ONE = 1;
	static SRC_COLOR = 0x0300;
	static ONE_MINUS_SRC_COLOR = 0x0301;
	static SRC_ALPHA = 0x0302;
	static ONE_MINUS_SRC_ALPHA = 0x0303;
	static DST_ALPHA = 0x0304;
	static ONE_MINUS_DST_ALPHA = 0x0305;
	static DST_COLOR = 0x0306;

	static getDestGLBlendMode(blendMode: BlendMode) {
		switch (blendMode) {
			case BlendMode.Normal:
				return WebGLBlendModeConverter.ONE_MINUS_SRC_ALPHA;
			case BlendMode.Additive:
				return WebGLBlendModeConverter.ONE;
			case BlendMode.Multiply:
				return WebGLBlendModeConverter.ONE_MINUS_SRC_ALPHA;
			case BlendMode.Screen:
				return WebGLBlendModeConverter.ONE_MINUS_SRC_ALPHA;
			default:
				throw new Error("Unknown blend mode: " + blendMode);
		}
	}

	static getSourceGLBlendMode(
		blendMode: BlendMode,
		premultipliedAlpha: boolean = false,
	) {
		switch (blendMode) {
			case BlendMode.Normal:
				return premultipliedAlpha
					? WebGLBlendModeConverter.ONE
					: WebGLBlendModeConverter.SRC_ALPHA;
			case BlendMode.Additive:
				return premultipliedAlpha
					? WebGLBlendModeConverter.ONE
					: WebGLBlendModeConverter.SRC_ALPHA;
			case BlendMode.Multiply:
				return WebGLBlendModeConverter.DST_COLOR;
			case BlendMode.Screen:
				return WebGLBlendModeConverter.ONE;
			default:
				throw new Error("Unknown blend mode: " + blendMode);
		}
	}
}
