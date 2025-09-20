import { Notice, setIcon, TextFileView, TFile, WorkspaceLeaf } from 'obsidian';

export const VIEW_TYPE_VIDEO_NOTE = 'video-note';
export const VIDEO_NOTE_EXTENSION = 'vnote';

export class VideoNoteView extends TextFileView {
	dataToSave: VideoNoteDTO;
	currentFileName: string;
	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType() {
		return VIEW_TYPE_VIDEO_NOTE;
	}

	override async onLoadFile(file: TFile): Promise<void> {
		this.currentFileName = file.basename;
		super.onLoadFile(file);
	}

	override async onRename(file: TFile): Promise<void> {
		this.currentFileName = file.basename;
	}

	getDisplayText() {
		return this.currentFileName;
	}

	override async setViewData(data: string, clear: boolean): Promise<void> {
		await this.Display(data);
	}

	getViewData(): string {
		return JSON.stringify(this.dataToSave);
	}

	clear(): void {
		return;
	}

	private async Display(data: string) {
		this.contentEl.empty();
		
		this.dataToSave = <VideoNoteDTO> JSON.parse(data);
		this.dataToSave.notes.sort((a, b) => { return a.time - b.time });
		const path = this.dataToSave.videoPath;

		const mainDiv = this.contentEl.createDiv('video-note-main-div vbox');
		const pathInput = mainDiv.createEl('input', { type: 'text', value: path } );
		const videoEl = mainDiv.createEl('video');
		this.DisplayCustomVideoControls(videoEl, mainDiv.createDiv());
		
		const tFile = this.app.vault.getFileByPath(path);
		if (tFile === null) {
			new Notice('Video was not found!');
			console.log('Video at path ' + path + ' was not found!');
		} else {
			const arrayBuffer = await this.app.vault.readBinary(tFile);
			const blob = new Blob([arrayBuffer]);
			const mediaUrl = URL.createObjectURL(blob);
			videoEl.src = mediaUrl;
		}
		videoEl.className = 'video-note-video';

		this.registerDomEvent(pathInput, 'change', () => {
			this.dataToSave.videoPath = pathInput.value;
			videoEl.src = pathInput.value;
			videoEl.currentTime = 0;
			currTime = 0;
			currentIndex = 0;
		});

		let currTime = 0;
		let currentIndex = 0;

		const notesListDiv = mainDiv.createDiv('video-notes-list-wrapper vbox');

		const refreshTextAreaHeight = (textarea: HTMLTextAreaElement) => {
			textarea.style.height = 'auto'; // Reset height to recalculate
        	textarea.style.height = (textarea.scrollHeight) + 'px';
		}

		let noteDivs: HTMLDivElement[] = [];
		const displayNotes = () => {
			notesListDiv.empty();
			noteDivs = [];
			const notesDiv = notesListDiv.createDiv('video-notes-list vbox');
			for (let i = 0; i < this.dataToSave.notes.length; i++) {
				const index = i;
				const noteDiv = notesDiv.createDiv('hbox video-note');
				if (index === currentIndex) {
					noteDiv.classList.add('video-note-highlighted');
				}

				const currNote = this.dataToSave.notes[i];

				const deleteButton = noteDiv.createEl('button');
				const noteInput = noteDiv.createEl('textarea', { text: currNote.note } );
				const setTime = noteDiv.createEl('button');
				const goToTime = noteDiv.createEl('button');

				setIcon(deleteButton, 'trash-2');
				setIcon(setTime, 'flag-triangle-right');
				setIcon(goToTime, 'play');

				deleteButton.className = 'remove-button';
				noteInput.className = 'video-note-input';

				this.registerDomEvent(deleteButton, 'click', () => {
					this.dataToSave.notes.splice(index, 1);
					displayNotes();
					if (currentIndex === index && index > 0) {
						currentIndex--;
					}
				});
				this.registerDomEvent(setTime, 'click', () => {
					this.dataToSave.notes[i].time = currTime;
				});
				this.registerDomEvent(goToTime, 'click', () => {
					videoEl.currentTime = currNote.time;
					currTime = currNote.time;
				});
				this.registerDomEvent(noteInput, 'input', () => {
					refreshTextAreaHeight(noteInput);
				});
				this.registerDomEvent(noteInput, 'change', () => {
					this.dataToSave.notes[i].note = noteInput.value;
				});
				refreshTextAreaHeight(noteInput);

				noteDivs.push(noteDiv);
			}
			const addButton = notesListDiv.createEl('button', { text: '+' } );
			addButton.className = 'add-button'
			this.registerDomEvent(addButton, 'click', () => {
				this.dataToSave.notes.push({ time: currTime, note: '' });
				this.dataToSave.notes.sort((a, b) => { return a.time - b.time });
				displayNotes();
				findCurrntNoteAndHighlight(true);
			});
		}

		const findCurrntNoteAndHighlight = (forciblyScroll: boolean) => {
			currTime = videoEl.currentTime;
			const oldIndex = currentIndex;
			let found = false;
			for (let i = this.dataToSave.notes.length - 1; !found && i >= 0; i--) {
				if (currTime >= this.dataToSave.notes[i].time) {
					currentIndex = i;
					found = true;
				}
			}
			if (!found) {
				currentIndex = 0;
			}
			if (oldIndex != currentIndex) {
				noteDivs[oldIndex].removeClass('video-note-highlighted');
				noteDivs[currentIndex].addClass('video-note-highlighted');
				noteDivs[currentIndex].scrollIntoView();
			}
		}

		this.registerDomEvent(videoEl, 'timeupdate', () => {
			findCurrntNoteAndHighlight(false);
		});

		displayNotes();
	}

	private DisplayCustomVideoControls(vid: HTMLVideoElement, controlsDiv: HTMLDivElement) {
		controlsDiv.className = 'video-note-controls vbox';
		const topControls = controlsDiv.createDiv('video-note-top-controls hbox');
		const leftControls = topControls.createDiv('video-note-left-controls hbox');
		const rightControls = topControls.createDiv('video-note-right-controls hbox');
		const timeSlider = controlsDiv.createEl('input', { type: 'range' } );
		timeSlider.min = '0';
		timeSlider.max = vid.duration + '';
		timeSlider.className = 'video-time-slider';
		timeSlider.step = '0.01';
		vid.controls = true;
		vid.autoplay = true;
		vid.loop = true;

		let skipAmt = 1;

		const back = leftControls.createEl('button');
		const play = leftControls.createEl('button');
		const forward = leftControls.createEl('button');

		setIcon(back, 'arrow-big-left-dash');
		setIcon(play, 'pause');
		setIcon(forward, 'arrow-big-right-dash');

		this.registerDomEvent(back, 'click', () => {
			const newTime = vid.currentTime - skipAmt;
			if (newTime >= 0) {
				vid.currentTime = newTime;
			}
		});
		this.registerDomEvent(forward, 'click', () => {
			const newTime = vid.currentTime + skipAmt;
			if (newTime <= vid.duration) {
				vid.currentTime = newTime;
			}
		});
		this.registerDomEvent(play, 'click', () => {
			const nowPlaying = vid.paused; // after the next line, this boolean will actually mean what it says
			nowPlaying ? vid.play() : vid.pause();
			play.empty();
			setIcon(play, nowPlaying ? 'pause' : 'play');
		});

		const timeText = leftControls.createEl('div', { text: '0 / ' + vid.duration } );

		const skipAmtIcon = rightControls.createDiv();
		const skipAmtInput = rightControls.createEl('input', { type: 'text', value: '1' } );
		const playbackSpeedIcon = rightControls.createDiv();
		const playbackSpeedInput = rightControls.createEl('input', { type: 'text', value: '1' } );
		const loopButton = rightControls.createEl('button');
		
		setIcon(skipAmtIcon, 'arrow-left-right');
		setIcon(playbackSpeedIcon, 'gauge');
		setIcon(loopButton, 'refresh-cw-off');

		this.registerDomEvent(skipAmtInput, 'change', () => {
			skipAmt = parseFloat(skipAmtInput.value);
		});
		this.registerDomEvent(playbackSpeedInput, 'change', () => {
			vid.playbackRate = parseFloat(playbackSpeedInput.value);
		});
		this.registerDomEvent(loopButton, 'click', () => {
			vid.loop = !vid.loop;
			loopButton.empty();
			setIcon(loopButton, vid.loop ? 'refresh-cw-off' : 'repeat');
		});

		this.registerDomEvent(timeSlider, 'input', () => {
			vid.currentTime = parseFloat(timeSlider.value);
		});
		this.registerDomEvent(vid, 'timeupdate', () => {
			const currTime = vid.currentTime;
			const currDur = vid.duration;

			timeSlider.value = currTime + '';
			timeSlider.max = currDur + '';

			let roundedTime = Math.floor(currTime);
			let roundedDur = Math.floor(currDur);

			const timeDecimals = currTime - roundedTime;
			const durDecimals = currDur - roundedDur;

			const timeHrs = Math.floor(roundedTime / 3600);
			const durHrs = Math.floor(roundedDur / 3600);

			roundedTime -= timeHrs * 3600;
			roundedDur -= durHrs * 3600;

			const timeMins = Math.floor(roundedTime / 60);
			const durMins = Math.floor(roundedDur / 60);
			
			roundedTime -= timeHrs * 3600 + timeMins * 60;
			roundedDur -= durHrs * 3600 + durMins * 60;

			const timeSecs = roundedTime + timeDecimals;
			const durSecs = roundedDur + durDecimals;
			
			// display in a 00:00:00.00 / 00:00:00.00 format, dropping units if the duration is less than that unit
			const formattedTime =
				(durHrs > 0 ? (timeHrs < 10 ? '0': '') + timeHrs + ':' : '') +
				(durMins > 0 ? (timeMins < 10 ? '0': '') + timeMins + ':' : '') +
				(timeSecs < 10 ? '0': '') + timeSecs.toFixed(2) +
				' / ' +
				(durHrs > 0 ? (durHrs < 10 ? '0': '') + durHrs + ':' : '') +
				(durMins > 0 ? (durMins < 10 ? '0': '') + durMins + ':' : '') +
				(durSecs < 10 ? '0': '') + durSecs.toFixed(2);

			timeText.textContent = formattedTime;
		});
	}
}

export class VideoNoteDTO {
	/**
	 * vault path to the video file
	 */
	videoPath: string;
	/**
	 * the notes at each time stamp
	 */
	notes: note[];
	constructor() {
		this.videoPath = '';
		this.notes = [];
	}
}

type note = { time: number, note: string };