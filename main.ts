import { VideoNoteView, VIEW_TYPE_VIDEO_NOTE, VIDEO_NOTE_EXTENSION } from 'plugin-specific/video-note-view';
import { Notice, Plugin, WorkspaceLeaf } from 'obsidian';
import { VideoNotes } from 'plugin-specific/structures/video-notes';

export default class VideoNote extends Plugin {
	async onload() {

		this.registerView(
			VIEW_TYPE_VIDEO_NOTE,
			(leaf) => new VideoNoteView(leaf)
		);

		this.registerExtensions([VIDEO_NOTE_EXTENSION], VIEW_TYPE_VIDEO_NOTE);

		this.addCommand({
			id: 'new-video-note',
			name: 'Create new video note',
			callback: async () => {
				const newFile = await this.app.vault.create('Untitled.' + VIDEO_NOTE_EXTENSION, JSON.stringify(new VideoNotes()));
				this.app.workspace.getLeaf('tab').openFile(newFile);
			}
		});

		this.registerEvent(
            this.app.workspace.on('file-menu', (menu, file) => {
				menu.addItem((item) => {
					item.setTitle('New video note')
						.setIcon('play')
						.onClick(async () => {
							const newFile = await this.app.vault.create((file.parent === null ? '' : file.parent.path + '/') + 'Untitled.' + VIDEO_NOTE_EXTENSION, JSON.stringify(new VideoNotes()));
							this.app.workspace.getLeaf('tab').openFile(newFile);
						});
				});
            })
        );
	}

	onunload() {

	}

	async activateView(view_type: string) {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;

		leaf = workspace.getLeaf('tab');
		if (leaf === null) {
			new Notice("Failed to create view: workspace leaf was null");
			return;
		}
		await leaf.setViewState({ type: view_type, active: true });

		// "Reveal" the leaf in case it is in a collapsed sidebar
		workspace.revealLeaf(leaf);
	}
}