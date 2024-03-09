import { Matrix4 } from "./Matrix4.js";
import { Vector3 } from "./Vector3.js";

export class OrthoCamera {
	position = new Vector3(0, 0, 0);
	direction = new Vector3(0, 0, -1);
	up = new Vector3(0, 1, 0);
	near = 0;
	far = 100;
	zoom = 1;
	viewportWidth = 0;
	viewportHeight = 0;
	projectionView = new Matrix4();
	inverseProjectionView = new Matrix4();
	projection = new Matrix4();
	view = new Matrix4();

	private tmp = new Vector3();

	constructor(viewportWidth: number, viewportHeight: number) {
		this.viewportWidth = viewportWidth;
		this.viewportHeight = viewportHeight;
		this.update();
	}

	update() {
		let projection = this.projection;
		let view = this.view;
		let projectionView = this.projectionView;
		let inverseProjectionView = this.inverseProjectionView;
		let zoom = this.zoom,
			viewportWidth = this.viewportWidth,
			viewportHeight = this.viewportHeight;
		projection.ortho(
			zoom * (-viewportWidth / 2),
			zoom * (viewportWidth / 2),
			zoom * (-viewportHeight / 2),
			zoom * (viewportHeight / 2),
			this.near,
			this.far,
		);
		view.lookAt(this.position, this.direction, this.up);
		projectionView.set(projection.values);
		projectionView.multiply(view);
		inverseProjectionView.set(projectionView.values).invert();
	}

	screenToWorld(
		screenCoords: Vector3,
		screenWidth: number,
		screenHeight: number,
	) {
		let x = screenCoords.x,
			y = screenHeight - screenCoords.y - 1;
		let tmp = this.tmp;
		tmp.x = (2 * x) / screenWidth - 1;
		tmp.y = (2 * y) / screenHeight - 1;
		tmp.z = 2 * screenCoords.z - 1;
		tmp.project(this.inverseProjectionView);
		screenCoords.set(tmp.x, tmp.y, tmp.z);
		return screenCoords;
	}

	setViewport(viewportWidth: number, viewportHeight: number) {
		this.viewportWidth = viewportWidth;
		this.viewportHeight = viewportHeight;
	}
}
