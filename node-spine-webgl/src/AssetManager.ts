import { AssetManagerBase } from "node-spine-core";
import { ManagedWebGLRenderingContext } from "./WebGL.js";
import { GLTexture } from "./GLTexture.js";

import { WebGLRenderingContext } from "gl";
import { Image as HTMLImageElement } from "canvas";

export class AssetManager extends AssetManagerBase {
	constructor(
		context: ManagedWebGLRenderingContext | WebGLRenderingContext,
		pathPrefix: string = "",
	) {
		super((image: HTMLImageElement) => {
			return new GLTexture(context, image);
		}, pathPrefix);
	}
}
