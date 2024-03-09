import { WebGLRenderingContext } from "gl";
import { GLTexture } from "./GLTexture.js";
import {
	Mesh,
	Position2Attribute,
	ColorAttribute,
	TexCoordAttribute,
	Color2Attribute,
} from "./Mesh.js";
import { Shader } from "./Shader.js";
import { ManagedWebGLRenderingContext } from "./WebGL.js";
import { Disposable } from "node-spine-core";

export class PolygonBatcher implements Disposable {
	private context: ManagedWebGLRenderingContext;
	private drawCalls: number = 0;
	private isDrawing = false;
	private mesh: Mesh;
	private shader: Shader | null = null;
	private lastTexture: GLTexture | null = null;
	private verticesLength = 0;
	private indicesLength = 0;
	private srcBlend: number;
	private dstBlend: number;

	constructor(
		context: ManagedWebGLRenderingContext | WebGLRenderingContext,
		twoColorTint: boolean = true,
		maxVertices: number = 10920,
	) {
		if (maxVertices > 10920)
			throw new Error(
				"Can't have more than 10920 triangles per batch: " + maxVertices,
			);
		this.context =
			context instanceof ManagedWebGLRenderingContext
				? context
				: new ManagedWebGLRenderingContext(context);
		let attributes = twoColorTint
			? [
					new Position2Attribute(),
					new ColorAttribute(),
					new TexCoordAttribute(),
					new Color2Attribute(),
				]
			: [
					new Position2Attribute(),
					new ColorAttribute(),
					new TexCoordAttribute(),
				];
		this.mesh = new Mesh(context, attributes, maxVertices, maxVertices * 3);
		this.srcBlend = this.context.gl.SRC_ALPHA;
		this.dstBlend = this.context.gl.ONE_MINUS_SRC_ALPHA;
	}

	begin(shader: Shader) {
		let gl = this.context.gl;
		if (this.isDrawing)
			throw new Error(
				"PolygonBatch is already drawing. Call PolygonBatch.end() before calling PolygonBatch.begin()",
			);
		this.drawCalls = 0;
		this.shader = shader;
		this.lastTexture = null;
		this.isDrawing = true;

		gl.enable(gl.BLEND);
		gl.blendFunc(this.srcBlend, this.dstBlend);
	}

	setBlendMode(srcBlend: number, dstBlend: number) {
		let gl = this.context.gl;
		this.srcBlend = srcBlend;
		this.dstBlend = dstBlend;
		if (this.isDrawing) {
			this.flush();
			gl.blendFunc(this.srcBlend, this.dstBlend);
		}
	}

	draw(
		texture: GLTexture,
		vertices: ArrayLike<number>,
		indices: Array<number>,
	) {
		if (texture != this.lastTexture) {
			this.flush();
			this.lastTexture = texture;
		} else if (
			this.verticesLength + vertices.length > this.mesh.getVertices().length ||
			this.indicesLength + indices.length > this.mesh.getIndices().length
		) {
			this.flush();
		}

		let indexStart = this.mesh.numVertices();
		this.mesh.getVertices().set(vertices, this.verticesLength);
		this.verticesLength += vertices.length;
		this.mesh.setVerticesLength(this.verticesLength);

		let indicesArray = this.mesh.getIndices();
		for (let i = this.indicesLength, j = 0; j < indices.length; i++, j++)
			indicesArray[i] = indices[j] + indexStart;
		this.indicesLength += indices.length;
		this.mesh.setIndicesLength(this.indicesLength);
	}

	private flush() {
		let gl = this.context.gl;
		if (this.verticesLength == 0) return;
		if (!this.lastTexture) throw new Error("No texture set.");
		if (!this.shader) throw new Error("No shader set.");

		this.lastTexture.bind();
		this.mesh.draw(this.shader, gl.TRIANGLES);

		this.verticesLength = 0;
		this.indicesLength = 0;
		this.mesh.setVerticesLength(0);
		this.mesh.setIndicesLength(0);
		this.drawCalls++;
	}

	end() {
		let gl = this.context.gl;
		if (!this.isDrawing)
			throw new Error(
				"PolygonBatch is not drawing. Call PolygonBatch.begin() before calling PolygonBatch.end()",
			);
		if (this.verticesLength > 0 || this.indicesLength > 0) this.flush();
		this.shader = null;
		this.lastTexture = null;
		this.isDrawing = false;

		gl.disable(gl.BLEND);
	}

	getDrawCalls() {
		return this.drawCalls;
	}

	dispose() {
		this.mesh.dispose();
	}
}
