import {
	WebGLShader,
	WebGLProgram,
	WebGLUniformLocation,
	WebGLRenderingContext,
} from "gl";
import { Restorable, Disposable } from "@node-spine-runtimes/core-3.8.99";
import { ManagedWebGLRenderingContext } from "./WebGL.js";

export class Shader implements Disposable, Restorable {
	public static MVP_MATRIX = "u_projTrans";
	public static POSITION = "a_position";
	public static COLOR = "a_color";
	public static COLOR2 = "a_color2";
	public static TEXCOORDS = "a_texCoords";
	public static SAMPLER = "u_texture";

	private context: ManagedWebGLRenderingContext;
	private vs: WebGLShader | null = null;
	private vsSource: string;
	private fs: WebGLShader | null = null;
	private fsSource: string;
	private program: WebGLProgram | null = null;
	private tmp2x2: Float32Array = new Float32Array(2 * 2);
	private tmp3x3: Float32Array = new Float32Array(3 * 3);
	private tmp4x4: Float32Array = new Float32Array(4 * 4);

	public getProgram() {
		return this.program;
	}
	public getVertexShader() {
		return this.vertexShader;
	}
	public getFragmentShader() {
		return this.fragmentShader;
	}
	public getVertexShaderSource() {
		return this.vsSource;
	}
	public getFragmentSource() {
		return this.fsSource;
	}

	constructor(
		context: ManagedWebGLRenderingContext | WebGLRenderingContext,
		private vertexShader: string,
		private fragmentShader: string,
	) {
		this.vsSource = vertexShader;
		this.fsSource = fragmentShader;
		this.context =
			context instanceof ManagedWebGLRenderingContext
				? context
				: new ManagedWebGLRenderingContext(context);
		this.context.addRestorable(this);
		this.compile();
	}

	private compile() {
		let gl = this.context.gl;
		try {
			this.vs = this.compileShader(gl.VERTEX_SHADER, this.vertexShader);
			if (!this.vs) throw new Error("Couldn't compile vertex shader.");
			this.fs = this.compileShader(gl.FRAGMENT_SHADER, this.fragmentShader);
			if (!this.fs) throw new Error("Couldn#t compile fragment shader.");
			this.program = this.compileProgram(this.vs, this.fs);
		} catch (e) {
			this.dispose();
			throw e;
		}
	}

	private compileShader(type: number, source: string) {
		let gl = this.context.gl;
		let shader = gl.createShader(type);
		gl.shaderSource(shader, source);
		gl.compileShader(shader);
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			let error = "Couldn't compile shader: " + gl.getShaderInfoLog(shader);
			gl.deleteShader(shader);
			if (!gl.isContextLost()) throw new Error(error);
		}
		return shader;
	}

	private compileProgram(vs: WebGLShader, fs: WebGLShader) {
		let gl = this.context.gl;
		let program = gl.createProgram();
		gl.attachShader(program, vs);
		gl.attachShader(program, fs);
		gl.linkProgram(program);

		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
			let error =
				"Couldn't compile shader program: " + gl.getProgramInfoLog(program);
			gl.deleteProgram(program);
			if (!gl.isContextLost()) throw new Error(error);
		}
		return program;
	}

	restore() {
		this.compile();
	}

	public bind() {
		this.context.gl.useProgram(this.program);
	}

	public unbind() {
		this.context.gl.useProgram(null);
	}

	public setUniformi(uniform: string, value: number) {
		this.context.gl.uniform1i(this.getUniformLocation(uniform), value);
	}

	public setUniformf(uniform: string, value: number) {
		this.context.gl.uniform1f(this.getUniformLocation(uniform), value);
	}

	public setUniform2f(uniform: string, value: number, value2: number) {
		this.context.gl.uniform2f(this.getUniformLocation(uniform), value, value2);
	}

	public setUniform3f(
		uniform: string,
		value: number,
		value2: number,
		value3: number,
	) {
		this.context.gl.uniform3f(
			this.getUniformLocation(uniform),
			value,
			value2,
			value3,
		);
	}

	public setUniform4f(
		uniform: string,
		value: number,
		value2: number,
		value3: number,
		value4: number,
	) {
		this.context.gl.uniform4f(
			this.getUniformLocation(uniform),
			value,
			value2,
			value3,
			value4,
		);
	}

	public setUniform2x2f(uniform: string, value: ArrayLike<number>) {
		let gl = this.context.gl;
		this.tmp2x2.set(value);
		gl.uniformMatrix2fv(this.getUniformLocation(uniform), false, this.tmp2x2);
	}

	public setUniform3x3f(uniform: string, value: ArrayLike<number>) {
		let gl = this.context.gl;
		this.tmp3x3.set(value);
		gl.uniformMatrix3fv(this.getUniformLocation(uniform), false, this.tmp3x3);
	}

	public setUniform4x4f(uniform: string, value: ArrayLike<number>) {
		let gl = this.context.gl;
		this.tmp4x4.set(value);
		gl.uniformMatrix4fv(this.getUniformLocation(uniform), false, this.tmp4x4);
	}

	public getUniformLocation(uniform: string): WebGLUniformLocation {
		let gl = this.context.gl;
		let location = gl.getUniformLocation(this.program, uniform);
		if (!location && !gl.isContextLost())
			throw new Error(`Couldn't find location for uniform ${uniform}`);
		return location!;
	}

	public getAttributeLocation(attribute: string): number {
		let gl = this.context.gl;
		let location = gl.getAttribLocation(this.program, attribute);
		if (location == -1 && !gl.isContextLost())
			throw new Error(`Couldn't find location for attribute ${attribute}`);
		return location;
	}

	public dispose() {
		this.context.removeRestorable(this);

		let gl = this.context.gl;
		if (this.vs) {
			gl.deleteShader(this.vs);
			this.vs = null;
		}

		if (this.fs) {
			gl.deleteShader(this.fs);
			this.fs = null;
		}

		if (this.program) {
			gl.deleteProgram(this.program);
			this.program = null;
		}
	}

	public static newColoredTextured(
		context: ManagedWebGLRenderingContext | WebGLRenderingContext,
	): Shader {
		let vs = `
			attribute vec4 ${Shader.POSITION};
			attribute vec4 ${Shader.COLOR};
			attribute vec2 ${Shader.TEXCOORDS};
			uniform mat4 ${Shader.MVP_MATRIX};
			varying vec4 v_color;
			varying vec2 v_texCoords;

			void main () {
				v_color = ${Shader.COLOR};
				v_texCoords = ${Shader.TEXCOORDS};
				gl_Position = ${Shader.MVP_MATRIX} * ${Shader.POSITION};
			}
		`;

		let fs = `
			#ifdef GL_ES
				#define LOWP lowp
				precision mediump float;
			#else
				#define LOWP
			#endif
			varying LOWP vec4 v_color;
			varying vec2 v_texCoords;
			uniform sampler2D u_texture;

			void main () {
				gl_FragColor = v_color * texture2D(u_texture, v_texCoords);
			}
		`;

		return new Shader(context, vs, fs);
	}

	public static newTwoColoredTextured(
		context: ManagedWebGLRenderingContext | WebGLRenderingContext,
	): Shader {
		let vs = `
			attribute vec4 ${Shader.POSITION};
			attribute vec4 ${Shader.COLOR};
			attribute vec4 ${Shader.COLOR2};
			attribute vec2 ${Shader.TEXCOORDS};
			uniform mat4 ${Shader.MVP_MATRIX};
			varying vec4 v_light;
			varying vec4 v_dark;
			varying vec2 v_texCoords;

			void main () {
				v_light = ${Shader.COLOR};
				v_dark = ${Shader.COLOR2};
				v_texCoords = ${Shader.TEXCOORDS};
				gl_Position = ${Shader.MVP_MATRIX} * ${Shader.POSITION};
			}
		`;

		let fs = `
			#ifdef GL_ES
				#define LOWP lowp
				precision mediump float;
			#else
				#define LOWP
			#endif
			varying LOWP vec4 v_light;
			varying LOWP vec4 v_dark;
			varying vec2 v_texCoords;
			uniform sampler2D u_texture;

			void main () {
				vec4 texColor = texture2D(u_texture, v_texCoords);
				gl_FragColor.a = texColor.a * v_light.a;
				gl_FragColor.rgb = ((texColor.a - 1.0) * v_dark.a + 1.0 - texColor.rgb) * v_dark.rgb + texColor.rgb * v_light.rgb;
			}
		`;

		return new Shader(context, vs, fs);
	}

	public static newColored(
		context: ManagedWebGLRenderingContext | WebGLRenderingContext,
	): Shader {
		let vs = `
			attribute vec4 ${Shader.POSITION};
			attribute vec4 ${Shader.COLOR};
			uniform mat4 ${Shader.MVP_MATRIX};
			varying vec4 v_color;

			void main () {
				v_color = ${Shader.COLOR};
				gl_Position = ${Shader.MVP_MATRIX} * ${Shader.POSITION};
			}
		`;

		let fs = `
			#ifdef GL_ES
				#define LOWP lowp
				precision mediump float;
			#else
				#define LOWP
			#endif
			varying LOWP vec4 v_color;

			void main () {
				gl_FragColor = v_color;
			}
		`;

		return new Shader(context, vs, fs);
	}
}
