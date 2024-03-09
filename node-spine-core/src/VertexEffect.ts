import { Skeleton } from "./Skeleton.js";
import { Vector2, Color } from "./Utils.js";

export interface VertexEffect {
	begin(skeleton: Skeleton): void;
	transform(position: Vector2, uv: Vector2, light: Color, dark: Color): void;
	end(): void;
}
