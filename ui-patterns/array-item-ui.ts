import { ItemView, setIcon } from "obsidian";

export abstract class ArrayItemUI<T> {
    globalData: any;
    isVertical: boolean = false;
    abstract Render(
        view: ItemView,
        div: HTMLDivElement,
        mainArray: T[],
        itemAccess: T | { index: number },
        onRefresh: (() => Promise<void>) | null,
        onSave: (() => Promise<void>) | null
    ): Promise<void>;

    protected IsItem(itemAccess: T | { index: number }): itemAccess is T {
        return itemAccess === null ||
            !(typeof itemAccess === "object" &&
            "index" in itemAccess);
    }

    protected MakeDeleteButton(
        view: ItemView,
        div: HTMLDivElement,
        mainArray: T[],
        itemAccess: T | { index: number },
        onRefresh: () => Promise<void>
    ) {
        const deleteButton = div.createEl('button');
        deleteButton.className = 'gl-fit-content remove-button';
        setIcon(deleteButton, 'trash-2');
        view.registerDomEvent(deleteButton, 'click', async () => {
            if (this.IsItem(itemAccess)) {
                mainArray.remove(itemAccess);
            } else {
                mainArray.splice(itemAccess.index, 1);
            }
            await onRefresh();
        });
    }

    protected MakeShiftButton(
        view: ItemView,
        div: HTMLDivElement,
        mainArray: T[],
        itemAccess: { index: number },
        direction: 'left' | 'right' | 'up' | 'down',
        onRefresh: () => Promise<void>
    ) {
        const index = itemAccess.index;

        const shifToPrev = direction === 'left' || direction === 'up';
        const shiftedIndex = shifToPrev ? index - 1 : index + 1;

        const button = div.createEl('button');
        button.className = 'gl-fit-content';
        setIcon(button, 'arrow-big-' + direction);
        button.disabled = shiftedIndex < 0 || shiftedIndex >= mainArray.length;

        view.registerDomEvent(button, 'click', async () => {
            await this.moveItem(onRefresh, mainArray, index, shiftedIndex);
        });
    }

    private async moveItem(
        onRefresh: () => Promise<void>,
        mainArray: T[],
        oldIndex: number,
        newIndex: number
    ) {
        if (newIndex >= 0 && newIndex < mainArray.length) {
            const [movedItem] = mainArray.splice(oldIndex, 1);
            mainArray.splice(newIndex, 0, movedItem);
            await onRefresh();
        }
    }
}