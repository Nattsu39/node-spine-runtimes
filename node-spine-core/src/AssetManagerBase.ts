import { Image } from "canvas";

import { Disposable, Map } from "./Utils.js";
import { TextureAtlas } from "./TextureAtlas.js";
import { FakeTexture } from "./Texture.js";
import { getData } from "./HttpRequest.js";

type HTMLImageElement = Image;

export class AssetManagerBase implements Disposable {
	private pathPrefix: string;
	private textureLoader: (image: HTMLImageElement) => any;
	private assets: Map<any> = {};
	private errors: Map<string> = {};
	private toLoad = 0;
	private loaded = 0;
	private rawDataUris: Map<string> = {};

	constructor(
		textureLoader: (image: HTMLImageElement) => any,
		pathPrefix: string = "",
	) {
		this.textureLoader = textureLoader;
		this.pathPrefix = pathPrefix;
	}

	private downloadText(
		url: string,
		success: (data: string) => void,
		error: (status: number, responseText: string) => void,
	) {
		if (this.rawDataUris[url]) url = this.rawDataUris[url];
		getData(url, "text")
			.then(function (response) {
				success(response.data);
			})
			.catch(function (err) {
				error(err.response.status, err.response.statusText);
			});
	}

	private downloadBinary(
		url: string,
		success: (data: Uint8Array) => void,
		error: (status: number, responseText: string) => void,
	) {
		if (this.rawDataUris[url]) url = this.rawDataUris[url];
		getData(url, "arraybuffer")
			.then(function (response) {
				if (response.status == 200) {
					success(new Uint8Array(response.data as ArrayBuffer));
				} else {
					error(response.status, response.statusText);
				}
			})
			.catch(function (err) {
				error(err.response.status, err.response.statusText);
			});
	}

	setRawDataURI(path: string, data: string) {
		this.rawDataUris[this.pathPrefix + path] = data;
	}

	loadBinary(
		path: string,
		success: ((path: string, binary: Uint8Array) => void) | null = null,
		error: ((path: string, error: string) => void) | null = null,
	) {
		path = this.pathPrefix + path;
		this.toLoad++;

		this.downloadBinary(
			path,
			(data: Uint8Array): void => {
				this.assets[path] = data;
				if (success) success(path, data);
				this.toLoad--;
				this.loaded++;
			},
			(state: number, responseText: string): void => {
				this.errors[path] =
					`Couldn't load binary ${path}: status ${state}, ${responseText}`;
				if (error)
					error(
						path,
						`Couldn't load binary ${path}: status ${state}, ${responseText}`,
					);
				this.toLoad--;
				this.loaded++;
			},
		);
	}

	loadText(
		path: string,
		success: ((path: string, text: string) => void) | null = null,
		error: ((path: string, error: string) => void) | null = null,
	) {
		path = this.pathPrefix + path;
		this.toLoad++;

		this.downloadText(
			path,
			(data: string): void => {
				this.assets[path] = data;
				if (success) success(path, data);
				this.toLoad--;
				this.loaded++;
			},
			(state: number, responseText: string): void => {
				this.errors[path] =
					`Couldn't load text ${path}: status ${state}, ${responseText}`;
				if (error)
					error(
						path,
						`Couldn't load text ${path}: status ${state}, ${responseText}`,
					);
				this.toLoad--;
				this.loaded++;
			},
		);
	}

	loadTexture(
		path: string,
		success: ((path: string, image: HTMLImageElement) => void) | null = null,
		error: ((path: string, error: string) => void) | null = null,
	) {
		path = this.pathPrefix + path;
		let storagePath = path;
		this.toLoad++;
		let img = new Image();
		img.onload = () => {
			let texture = this.textureLoader(img);
			this.assets[storagePath] = texture;
			this.toLoad--;
			this.loaded++;
			if (success) success(path, img);
		};
		img.onerror = (err) => {
			this.errors[path] = `Couldn't load image ${path}`;
			this.toLoad--;
			this.loaded++;
			if (error) error(path, `Couldn't load image ${path}`);
		};
		if (this.rawDataUris[path]) path = this.rawDataUris[path];
		img.src = path;
	}

	loadTextureAtlas(
		path: string,
		success: ((path: string, atlas: TextureAtlas) => void) | null = null,
		error: ((path: string, error: string) => void) | null = null,
	) {
		let parent =
			path.lastIndexOf("/") >= 0
				? path.substring(0, path.lastIndexOf("/"))
				: "";
		path = this.pathPrefix + path;
		this.toLoad++;
		this.downloadText(
			path,
			(atlasData: string): void => {
				let pagesLoaded: any = { count: 0 };
				let atlasPages = new Array<string>();
				try {
					let atlas = new TextureAtlas(atlasData, (path: string) => {
						atlasPages.push(parent == "" ? path : parent + "/" + path);
						let image = new Image();
						image.width = 16;
						image.height = 16;
						return new FakeTexture(image);
					});
				} catch (e) {
					let ex = e as Error;
					this.errors[path] =
						`Couldn't load texture atlas ${path}: ${ex.message}`;
					if (error)
						error(path, `Couldn't load texture atlas ${path}: ${ex.message}`);
					this.toLoad--;
					this.loaded++;
					return;
				}

				for (let atlasPage of atlasPages) {
					let pageLoadError = false;
					this.loadTexture(
						atlasPage,
						(imagePath: string, image: HTMLImageElement) => {
							pagesLoaded.count++;

							if (pagesLoaded.count == atlasPages.length) {
								if (!pageLoadError) {
									try {
										let atlas = new TextureAtlas(atlasData, (path: string) => {
											return this.get(
												parent == "" ? path : parent + "/" + path,
											);
										});
										this.assets[path] = atlas;
										if (success) success(path, atlas);
										this.toLoad--;
										this.loaded++;
									} catch (e) {
										let ex = e as Error;
										this.errors[path] =
											`Couldn't load texture atlas ${path}: ${ex.message}`;
										if (error)
											error(
												path,
												`Couldn't load texture atlas ${path}: ${ex.message}`,
											);
										this.toLoad--;
										this.loaded++;
									}
								} else {
									this.errors[path] =
										`Couldn't load texture atlas page ${imagePath}} of atlas ${path}`;
									if (error)
										error(
											path,
											`Couldn't load texture atlas page ${imagePath} of atlas ${path}`,
										);
									this.toLoad--;
									this.loaded++;
								}
							}
						},
						(imagePath: string, errorMessage: string) => {
							pageLoadError = true;
							pagesLoaded.count++;

							if (pagesLoaded.count == atlasPages.length) {
								this.errors[path] =
									`Couldn't load texture atlas page ${imagePath}} of atlas ${path}`;
								if (error)
									error(
										path,
										`Couldn't load texture atlas page ${imagePath} of atlas ${path}`,
									);
								this.toLoad--;
								this.loaded++;
							}
						},
					);
				}
			},
			(state: number, responseText: string): void => {
				this.errors[path] =
					`Couldn't load texture atlas ${path}: status ${state}, ${responseText}`;
				if (error)
					error(
						path,
						`Couldn't load texture atlas ${path}: status ${state}, ${responseText}`,
					);
				this.toLoad--;
				this.loaded++;
			},
		);
	}

	get(path: string) {
		path = this.pathPrefix + path;
		return this.assets[path];
	}

	remove(path: string) {
		path = this.pathPrefix + path;
		let asset = this.assets[path];
		if ((<any>asset).dispose) (<any>asset).dispose();
		this.assets[path] = null;
	}

	removeAll() {
		for (let key in this.assets) {
			let asset = this.assets[key];
			if ((<any>asset).dispose) (<any>asset).dispose();
		}
		this.assets = {};
	}

	isLoadingComplete(): boolean {
		return this.toLoad == 0;
	}

	getToLoad(): number {
		return this.toLoad;
	}

	getLoaded(): number {
		return this.loaded;
	}

	dispose() {
		this.removeAll();
	}

	hasErrors() {
		return Object.keys(this.errors).length > 0;
	}

	getErrors() {
		return this.errors;
	}
}
