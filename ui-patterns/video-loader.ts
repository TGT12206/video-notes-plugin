import { Notice, Vault, View } from "obsidian";

export class VideoLoader {
    static isValid(extension: string) {
        return this.validFileTypes.contains(extension.toLowerCase());
    }
    static validFileTypes: string[] = [
        // video
        'mp4', 'mov', 'webm', 'mkv', 'avi', 'm4v', 'flv', 'mpg', 'mpeg',

        // audio
        'mp3', 'wav', 'm4a', 'ogg', 'flac', 'aac', 'aiff', 'wma'
    ];

    static async loadVideo(videoEl: HTMLVideoElement, view: View, path: string) {
        const vault = view.app.vault;
        const src = await this.getSrc(videoEl, vault, path);
        
        const extension = path.split('.').last();

        if (extension === undefined) {
            new Notice('No extension found in ' + path);
            throw new Error('No extension found in ' + path);
        }

        if (!this.isValid(extension)) return;
        videoEl.controls = true;
        videoEl.loop = true;
        videoEl.id = 'vnote-video';
        videoEl.src = src;
    }

    static async getSrc(videoEl: HTMLVideoElement, vault: Vault, path: string) {
        videoEl.empty();
        const tFile = vault.getFileByPath(path);
        if (tFile === null) {
            new Notice('File not found at ' + path);
            throw new Error('File not found at ' + path);
        }
        const arrayBuffer = await vault.readBinary(tFile);
        const blob = new Blob([arrayBuffer]);
        return URL.createObjectURL(blob);
    }
}