import { ArrayEditor } from "ui-patterns/array-editor";
import { VideoNoteView } from "./video-note-view";
import { NoteUI } from "./note-ui";
import { Note } from "./structures/note";
import { ItemView } from "obsidian";

export class NoteArrayEditor extends ArrayEditor<Note> {
    get videoEl(): HTMLVideoElement {
        return <HTMLVideoElement> this.globalData;
    }
    set videoEl(newEl: HTMLVideoElement) {
        this.globalData = newEl;
    }
    currIndex: number = 0;
    forciblyScroll: boolean;

    constructor(view: VideoNoteView, videoEl: HTMLVideoElement, div: HTMLDivElement, notes: Note[]) {
        const noteUI = new NoteUI(videoEl);
        super(div, notes, noteUI);

        this.videoEl = videoEl;

        this.makeNewItem = () => new Note(videoEl.currentTime);
        this.simpleInsertionOrder = (a, b) => { return a.time - b.time };
        
        this.onSave = async () => view.requestSave();
        
        this.isVertical = true;
        this.itemsPerLine = 1;
        this.enableAddButton = true;
        this.indexedBased = false;

        noteUI.isVertical = false;

        this.Render(view);
    }

    override async Render(view: ItemView) {
        super.Render(view);
        this.FindCurrentNoteAndHighlight();
    }
    
    FindCurrentNoteAndHighlight() {
        const notes = this.mainArray;
        const currTime = this.videoEl.currentTime;
        
        if (notes.length === 0) return;

        let low = 0;
        let high = notes.length - 1;
        let newIndex = 0;

        while (low <= high) {
            let mid = Math.floor((low + high) / 2);
            if (notes[mid].time <= currTime) {
                newIndex = mid;
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }

        if (newIndex !== this.currIndex) {
            this.HighlightCurrentNote(this.currIndex, newIndex);
            this.currIndex = newIndex;
        }
    }

    HighlightCurrentNote(oldIndex: number, newIndex: number) {
        const divs = this.itemDivs;
        const activeClass = 'bordered';

        if (divs[oldIndex]) {
            divs[oldIndex].removeClass(activeClass);
        }
        
        if (divs[newIndex]) {
            const newEl = divs[newIndex];
            newEl.addClass(activeClass);
            if (this.forciblyScroll) {
                newEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    }
}