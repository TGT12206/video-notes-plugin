import { ArrayItemUI } from "ui-patterns/array-item-ui";
import { Note } from "./structures/note";
import { VideoNoteView } from "./video-note-view";
import { setIcon } from "obsidian";

export class NoteUI extends ArrayItemUI<Note> {
    get videoEl(): HTMLVideoElement {
        return <HTMLVideoElement> this.globalData;
    }
    set videoEl(newEl: HTMLVideoElement) {
        this.globalData = newEl;
    }
    constructor(videoEl: HTMLVideoElement) {
        super();
        this.videoEl = videoEl;
    }

    override async Render(
        view: VideoNoteView,
        div: HTMLDivElement,
        notes: Note[],
        note: Note,
        onRefresh: (() => Promise<void>),
        onSave: (() => Promise<void>)
    ) {
        this.MakeDeleteButton(view, div, notes, note, onRefresh);

        const noteInput = div.createEl('input', { type: 'text', value: note.note } );
        noteInput.className = 'fill';

        const setTime = div.createEl('button');
        const goToTime = div.createEl('button');

        setIcon(setTime, 'flag-triangle-right');
        setIcon(goToTime, 'play');

        setTime.title = 'Sync to current time';
        goToTime.title = 'Jump to this note';

        view.registerDomEvent(noteInput, 'change', async () => {
            note.note = noteInput.value;
            await onSave();
        });
        view.registerDomEvent(setTime, 'click', () => {
            note.time = this.videoEl.currentTime;
        });
        view.registerDomEvent(goToTime, 'click', () => {
            this.videoEl.currentTime = note.time;
        });
    }
}