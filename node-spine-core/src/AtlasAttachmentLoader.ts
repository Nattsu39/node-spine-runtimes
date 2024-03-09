import { Skin } from "./Skin.js";
import { TextureAtlas } from "./TextureAtlas.js";
import { AttachmentLoader } from "./attachments/AttachmentLoader.js";
import { BoundingBoxAttachment } from "./attachments/BoundingBoxAttachment.js";
import { ClippingAttachment } from "./attachments/ClippingAttachment.js";
import { MeshAttachment } from "./attachments/MeshAttachment.js";
import { PathAttachment } from "./attachments/PathAttachment.js";
import { PointAttachment } from "./attachments/PointAttachment.js";
import { RegionAttachment } from "./attachments/RegionAttachment.js";

/** An {@link AttachmentLoader} that configures attachments using texture regions from an {@link TextureAtlas}.
 *
 * See [Loading skeleton data](http://esotericsoftware.com/spine-loading-skeleton-data#JSON-and-binary-data) in the
 * Spine Runtimes Guide. */
export class AtlasAttachmentLoader implements AttachmentLoader {
	atlas: TextureAtlas;

	constructor(atlas: TextureAtlas) {
		this.atlas = atlas;
	}

	newRegionAttachment(
		skin: Skin,
		name: string,
		path: string,
	): RegionAttachment {
		let region = this.atlas.findRegion(path);
		if (region == null)
			throw new Error(
				"Region not found in atlas: " +
					path +
					" (region attachment: " +
					name +
					")",
			);
		region.renderObject = region;
		let attachment = new RegionAttachment(name, path);
		attachment.setRegion(region);
		return attachment;
	}

	newMeshAttachment(skin: Skin, name: string, path: string): MeshAttachment {
		let region = this.atlas.findRegion(path);
		if (region == null)
			throw new Error(
				"Region not found in atlas: " +
					path +
					" (mesh attachment: " +
					name +
					")",
			);
		region.renderObject = region;
		let attachment = new MeshAttachment(name);
		attachment.region = region;
		return attachment;
	}

	newBoundingBoxAttachment(skin: Skin, name: string): BoundingBoxAttachment {
		return new BoundingBoxAttachment(name);
	}

	newPathAttachment(skin: Skin, name: string): PathAttachment {
		return new PathAttachment(name);
	}

	newPointAttachment(skin: Skin, name: string): PointAttachment {
		return new PointAttachment(name);
	}

	newClippingAttachment(skin: Skin, name: string): ClippingAttachment {
		return new ClippingAttachment(name);
	}
}
