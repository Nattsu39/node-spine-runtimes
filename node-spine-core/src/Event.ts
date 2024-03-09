import { EventData } from "./EventData.js";

/** Stores the current pose values for an {@link Event}.
 *
 * See Timeline {@link Timeline#apply()},
 * AnimationStateListener {@link AnimationStateListener#event()}, and
 * [Events](http://esotericsoftware.com/spine-events) in the Spine User Guide. */
export class Event {
	data: EventData;
	intValue: number = 0;
	floatValue: number = 0;
	stringValue: string | null = null;
	time: number;
	volume: number = 0;
	balance: number = 0;

	constructor(time: number, data: EventData) {
		if (data == null) throw new Error("data cannot be null.");
		this.time = time;
		this.data = data;
	}
}
