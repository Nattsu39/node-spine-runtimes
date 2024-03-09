import { BoneData } from "./BoneData.js";
import { ConstraintData } from "./ConstraintData.js";
import { SlotData } from "./SlotData.js";

/** Stores the setup pose for a {@link PathConstraint}.
 *
 * See [Path constraints](http://esotericsoftware.com/spine-path-constraints) in the Spine User Guide. */
export class PathConstraintData extends ConstraintData {
	/** The bones that will be modified by this path constraint. */
	bones = new Array<BoneData>();

	/** The slot whose path attachment will be used to constrained the bones. */
	private _target: SlotData | null = null;
	public set target(slotData: SlotData) {
		this._target = slotData;
	}
	public get target() {
		if (!this._target) throw new Error("SlotData not set.");
		else return this._target;
	}

	/** The mode for positioning the first bone on the path. */
	positionMode: PositionMode = PositionMode.Fixed;

	/** The mode for positioning the bones after the first bone on the path. */
	spacingMode: SpacingMode = SpacingMode.Fixed;

	/** The mode for adjusting the rotation of the bones. */
	rotateMode: RotateMode = RotateMode.Chain;

	/** An offset added to the constrained bone rotation. */
	offsetRotation: number = 0;

	/** The position along the path. */
	position: number = 0;

	/** The spacing between bones. */
	spacing: number = 0;

	/** A percentage (0-1) that controls the mix between the constrained and unconstrained rotations. */
	rotateMix: number = 0;

	/** A percentage (0-1) that controls the mix between the constrained and unconstrained translations. */
	translateMix: number = 0;

	constructor(name: string) {
		super(name, 0, false);
	}
}

/** Controls how the first bone is positioned along the path.
 *
 * See [Position mode](http://esotericsoftware.com/spine-path-constraints#Position-mode) in the Spine User Guide. */
export enum PositionMode {
	Fixed,
	Percent,
}

/** Controls how bones after the first bone are positioned along the path.
 *
 * [Spacing mode](http://esotericsoftware.com/spine-path-constraints#Spacing-mode) in the Spine User Guide. */
export enum SpacingMode {
	Length,
	Fixed,
	Percent,
}

/** Controls how bones are rotated, translated, and scaled to match the path.
 *
 * [Rotate mode](http://esotericsoftware.com/spine-path-constraints#Rotate-mod) in the Spine User Guide. */
export enum RotateMode {
	Tangent,
	Chain,
	ChainScale,
}
