import { ItemView, setIcon } from 'obsidian';
import { ArrayItemUI } from './array-item-ui';

/**
 * Creates a visual representation of an array of items
 * 
 * Remember to use set indexed based to true if using a primitive type
 */
export class ArrayEditor<T> {
    public globalData: any;
    
    public div: HTMLDivElement;
    protected listDiv: HTMLDivElement;
    protected itemDivs: HTMLDivElement[] = [];
    public mainArray: T[];
    public itemUI: ArrayItemUI<T>;
    public indexedBased: boolean = true;
    public makeNewItem: (() => (T | Promise<T>)) | null = null;
    public onSave: (() => Promise<void>) | null = null;

    public simpleDisplayFilter: ((item: T) => boolean) | null = null;
    public simpleDisplayOrder: ((a: T, b: T) => number) | null = null;
    public complexDisplayHandler: ((results: { index: number, item: T }[]) => Promise<{ index: number, item: T }[]> | { index: number, item: T }[]) | null = null;

    public simpleInsertionFilter: ((item: T) => boolean) | null = null;
    public simpleInsertionOrder: ((a: T, b: T) => number) | null = null;
    public complexInsertionHandler: ((mainArray: T[]) => Promise<void> | void) | null = null;

    public isVertical: boolean = true;
    public itemsPerLine: number = 1;
    public enableAddButton: boolean = false;
    public extraClasses: string = '';

    get isGrid(): boolean {
        return this.itemsPerLine > 1;
    }

    constructor(div: HTMLDivElement, mainArray: T[], itemUI: ArrayItemUI<T>) {
        this.div = div;
        this.mainArray = mainArray;
        this.itemUI = itemUI;
    }

    public async Render(view: ItemView) {
        const isGrid = this.isGrid;
        const classNames = (this.isVertical ? 'vbox' : 'hbox') + ' fill scroll outer-div ' + this.extraClasses;

        this.div.empty();
        this.div.className = classNames;
        this.listDiv = this.div.createDiv(classNames + (isGrid ? ' grid' : ''));

        if (this.enableAddButton) this.CreateAddButton(view);
        await this.RefreshList(view);
    }

    public async RefreshList(view: ItemView) {
        const scrollTop = this.listDiv.scrollTop;
        this.listDiv.empty();
        this.itemDivs = [];

        const isGrid = this.isGrid;
        if (this.isVertical) {
            if (isGrid) this.listDiv.style.gridTemplateColumns = 'repeat(' + this.itemsPerLine + ', 1fr)';
        } else {
            if (isGrid) this.listDiv.style.gridTemplateRows = 'repeat(' + this.itemsPerLine + ', 1fr)';
        }

        let displayedResults = this.mainArray.map((item, index) => { return { index: index, item: item } } );

        const shouldFilter = this.simpleDisplayFilter !== null;
        const shouldSort = this.simpleDisplayOrder !== null;
        const complexHandlerNeeded = this.complexDisplayHandler !== null;
        
        if (complexHandlerNeeded) {
            const handler = <(items: { index: number, item: T }[]) => Promise<{ index: number, item: T }[]> | { index: number, item: T }[]> this.complexDisplayHandler;
            displayedResults = await handler(displayedResults);
        } else {
            if (shouldFilter) {
            const filter = <(item: T) => boolean> this.simpleDisplayFilter;
            displayedResults = displayedResults.filter(entry => filter(entry.item));
            }
            if (shouldSort) {
                const order = <(a: T, b: T) => number> this.simpleDisplayOrder;
                displayedResults = displayedResults.sort((a, b) => order(a.item, b.item));
            }
        }

        for (let i = 0; i < displayedResults.length; i++) {
            const index = displayedResults[i].index;
            const itemDiv = this.listDiv.createDiv('outer-div ' + (this.itemUI.isVertical ? 'vbox' : 'hbox'));

            this.itemDivs.push(itemDiv);
            await this.itemUI.Render(
                view,
                itemDiv,
                this.mainArray,
                this.indexedBased ? { index: index } : this.mainArray[index],
                async () => {
                    if (this.onSave !== null) {
                        await this.onSave();
                    }
                    await this.RefreshList(view);
                },
                this.onSave
            );
        }
        this.listDiv.scrollTop = scrollTop;
    }

    protected CreateAddButton(view: ItemView) {
        const isGrid = this.isGrid;
        const div = this.div;

        const addButton = div.createEl('button', { cls: 'add-button' } );
        setIcon(addButton, 'plus');
        if (isGrid) addButton.classList.add('floating');

        view.registerDomEvent(addButton, 'click', async () => {
            if (this.makeNewItem === null) return;
            const newItem = await this.makeNewItem();

            if (this.complexInsertionHandler !== null) {
                await this.complexInsertionHandler(this.mainArray);
            } else {
                if (!(this.simpleInsertionFilter === null || this.simpleInsertionFilter(newItem))) return;
            
                this.mainArray.push(newItem);
                if (this.simpleInsertionOrder !== null) this.mainArray.sort(this.simpleInsertionOrder);
            }

            if (this.onSave !== null) await this.onSave();
            await this.RefreshList(view);
        });
    }
}