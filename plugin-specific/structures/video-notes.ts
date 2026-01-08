import { Note } from "./note";

export class VideoNotes {
	constructor(
		public videoPath: string = '',
		public notes: Note[] = []
	) {}
}