import { VideoLoader } from 'ui-patterns/video-loader';
import { AbstractInputSuggest, ItemView, prepareFuzzySearch, TFile } from 'obsidian';

export class VideoPathSuggest extends AbstractInputSuggest<TFile> {
    private get vault() {
        return this.app.vault;
    }
    private renderMedia: (path: string) => Promise<void>;

    constructor(
        public inputEl: HTMLInputElement,
        public videoEl: HTMLVideoElement,
        public callback: (value: TFile) => void,
        view: ItemView
    ) {
        super(view.app, inputEl);
        this.renderMedia = async (path: string) => {
            await VideoLoader.loadVideo(this.videoEl, view, path);
        }
    }

    getSuggestions(inputStr: string): TFile[] {
        const fuzzyMatcher = prepareFuzzySearch(inputStr);
        const allFiles = this.vault.getFiles();
        return allFiles
            .filter(file => VideoLoader.isValid(file.extension))
            .map(file => {
                const result = fuzzyMatcher(file.path);
                return result ? { file, score: result.score, matches: result.matches } : null;
            })
            .filter(result => result !== null)
            .sort((a, b) => b.score - a.score)
            .map(result => result.file);
    }

    renderSuggestion(file: TFile, el: HTMLElement): void {
        el.setText(file.path);
    }

    override async selectSuggestion(file: TFile, evt: MouseEvent | KeyboardEvent): Promise<void> {
        try {
            this.callback(file);
            await this.renderMedia(file.path);
            this.inputEl.value = file.path;
        } finally {
            this.close();
        }
    }
}