/** Stores the setup pose values for an {@link Event}.
 *
 * See [Events](http://esotericsoftware.com/spine-events) in the Spine User Guide. */
export class EventData {
	name: string;
	intValue: number = 0;
	floatValue: number = 0;
	stringValue: string | null = null;
	audioPath: string | null = null;
	volume: number = 0;
	balance: number = 0;

	constructor(name: string) {
		this.name = name;
	}
}
