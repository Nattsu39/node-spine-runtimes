import { Skeleton } from "../Skeleton.js";
import { Vector2, Color, MathUtils } from "../Utils.js";
import { VertexEffect } from "../VertexEffect.js";

export class JitterEffect implements VertexEffect {
	jitterX = 0;
	jitterY = 0;

	constructor(jitterX: number, jitterY: number) {
		this.jitterX = jitterX;
		this.jitterY = jitterY;
	}

	begin(skeleton: Skeleton): void {}

	transform(position: Vector2, uv: Vector2, light: Color, dark: Color): void {
		position.x += MathUtils.randomTriangular(-this.jitterX, this.jitterY);
		position.y += MathUtils.randomTriangular(-this.jitterX, this.jitterY);
	}

	end(): void {}
}
