import axios from "axios";
import { readFile } from "fs/promises";
import { Stream } from "stream";
import { URL } from "url";

const webProtocolType = ["http:", "https:", "ftp:"];

function isFileProtocol(url_string: string): boolean {
	try {
		let url = new URL(url_string);
		return url.protocol === "file:" || !webProtocolType.includes(url.protocol);
	} catch (TypeError) {
		return true;
	}
}

export type ResultType =
	| "arraybuffer"
	| "document"
	| "json"
	| "text"
	| "stream";

export interface IResult<T = any> {
	data: T;
	status: number;
	statusText: string;
}

export function getData<T = any>(
	url: string,
	resultType: ResultType = "json",
	encoding: BufferEncoding = "utf-8",
): Promise<IResult<T>> {
	if (isFileProtocol(url)) {
		return new Promise((resolve, reject) => {
			readFile(url)
				.then((data) => {
					let result: any = data;
					switch (resultType) {
						case "text":
							result = data.toString(encoding);
							break;
						case "json":
							result = JSON.parse(data.toString(encoding));
							break;
						case "arraybuffer":
							result = data.buffer;
							break;
						case "document":
						case "stream":
							result = Stream.Readable.from(result);
							break;
						default:
							break;
					}
					resolve({ data: result, status: 200, statusText: "OK" });
				})
				.catch((err) => {
					reject({ data: null, status: 0, statusText: err.stack });
				});
		});
	} else {
		return new Promise((resolve, reject) => {
			axios
				.get(url, { responseType: resultType, responseEncoding: encoding })
				.then((response) => {
					resolve({
						data: response.data,
						status: response.status,
						statusText: response.statusText,
					});
				})
				.catch((err) => {
					let response = err.response;
					reject({
						data: response.data,
						status: response.status,
						statusText: response.statusText,
					});
				});
		});
	}
}
