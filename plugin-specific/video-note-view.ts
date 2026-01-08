import { Notice, setIcon, TextFileView, TFile, WorkspaceLeaf } from 'obsidian';
import { VideoNotes } from './structures/video-notes';
import { VideoLoader } from 'ui-patterns/video-loader';
import { HTMLHelper } from 'ui-patterns/html-helper';
import { NoteArrayEditor } from './note-array-editor';
import { VideoPathSuggest } from 'ui-patterns/video-path-suggest';

export const VIEW_TYPE_VIDEO_NOTE = 'video-note';
export const VIDEO_NOTE_EXTENSION = 'vnote';

export class VideoNoteView extends TextFileView {
	dataToSave: VideoNotes;
	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType() {
		return VIEW_TYPE_VIDEO_NOTE;
	}

	override async onLoadFile(file: TFile): Promise<void> {
		super.onLoadFile(file);
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
		
		this.dataToSave = <VideoNotes> JSON.parse(data);
		console.log(this.dataToSave);
		this.dataToSave.notes.sort((a, b) => { return a.time - b.time });
		const path = this.dataToSave.videoPath;

		const mainDiv = this.contentEl.createDiv('vnote-main outer-div vbox scroll');
		const inputDiv = mainDiv.createDiv('hbox outer-div');
		HTMLHelper.CreateNewTextDiv(inputDiv, 'Vault path to video:');
		const pathInput = inputDiv.createEl('input', { type: 'text', value: path, cls: 'fill' } );
		const saveAsVTT = inputDiv.createEl('button', { text: 'Save as VTT file' } );
		const videoDiv = mainDiv.createDiv('vnote-video-wrapper');
		const videoEl = videoDiv.createEl('video');
		this.DisplayCustomVideoControls(videoEl, mainDiv.createDiv());
		
		const selectVideo = (file: TFile) => {
			this.dataToSave.videoPath = file.path;
			this.requestSave();
		}
		new VideoPathSuggest(pathInput, videoEl, selectVideo, this)
		await VideoLoader.loadVideo(videoEl, this, path);

		let currTime = 0;

		const noteEditor = new NoteArrayEditor(this, videoEl, mainDiv.createDiv(), this.dataToSave.notes);

		this.registerDomEvent(pathInput, 'change', async () => {
			this.dataToSave.videoPath = pathInput.value;
			await VideoLoader.loadVideo(videoEl, this, path);
			videoEl.currentTime = 0;
			currTime = 0;
			noteEditor.FindCurrentNoteAndHighlight();
		});

		this.registerDomEvent(videoEl, 'timeupdate', () => {
			noteEditor.FindCurrentNoteAndHighlight();
		});

		const formatVTTTime = (seconds: number) => {
			const date = new Date(0);
			date.setMilliseconds(seconds * 1000);
			const isoString = date.toISOString();
			return isoString.substring(11, 23);
		}

		this.registerDomEvent(saveAsVTT, 'click', async () => {
			let vttContent = "WEBVTT\n\n";

			const videoNotes = this.dataToSave;
			videoNotes.notes.forEach((note, index) => {
				const startTime = formatVTTTime(note.time);
				
				const nextNote = videoNotes.notes[index + 1];
				const endTime = nextNote 
					? formatVTTTime(nextNote.time) 
					: formatVTTTime(note.time + 2);

				vttContent += `${index + 1}\n`;
				vttContent += `${startTime} --> ${endTime}\n`;
				vttContent += `${note.note}\n\n`;
			});

			const vault = this.app.vault;
    
			if (this.file === null) {
				new Notice('You don\'t have a note open!');
				return;
			}
			const currentPath = this.file.path;
			const pathParts = currentPath.split('/');
			pathParts.pop();
			const folderPath = pathParts.join('/');

			const newFileName = `${this.file.basename}.vtt`;
			const fullNewPath = folderPath ? `${folderPath}/${newFileName}` : newFileName;

			try {
				const existingFile = vault.getAbstractFileByPath(fullNewPath);
				
				if (existingFile) {
					await vault.modify(existingFile as TFile, vttContent);
				} else {
					await vault.create(fullNewPath, vttContent);
				}
			} catch (error) {
				new Notice('Failed to save VTT file');
				console.error("Failed to save VTT file:", error);
			}
		});
	}

	private DisplayCustomVideoControls(vid: HTMLVideoElement, controlsDiv: HTMLDivElement) {
		controlsDiv.className = 'vbox outer-div';
		controlsDiv.id = 'vnote-controls'

		const topControls = controlsDiv.createDiv('hbox');
		const leftControls = topControls.createDiv('hbox');
		const rightControls = topControls.createDiv('hbox');

		topControls.id = 'vnote-controls-top';
		leftControls.id = 'vnote-controls-left';
		rightControls.id = 'vnote-controls-right';

		const timeSlider = controlsDiv.createEl('input', { type: 'range' } );
		timeSlider.id = 'vnote-time-slider';
		timeSlider.min = '0';
		timeSlider.max = vid.duration + '';
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
			const shouldPlay = vid.paused;
			shouldPlay ? vid.play() : vid.pause();
			play.empty();
			setIcon(play, shouldPlay ? 'pause' : 'play');
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