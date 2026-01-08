import { ItemView, Notice, setIcon } from "obsidian";

export class HTMLHelper {
    static AutoAdjustWidth(cleanDiv: HTMLDivElement, el: HTMLElement, text: string) {
        const tempEl = cleanDiv.createEl('div', { text: text } );
        tempEl.style.position = 'absolute';
        tempEl.style.whiteSpace = 'pre-wrap';
        tempEl.style.visibility = 'hidden';
        tempEl.style.font = el.style.font;
        tempEl.style.fontSize = el.style.fontSize;
        tempEl.style.writingMode = el.style.writingMode;
        tempEl.style.textOrientation = el.style.textOrientation;
        tempEl.style.padding = '1vh';
        const temp = tempEl.getBoundingClientRect();

        el.style.width = temp.width + 'px';

        tempEl.remove();
    }
    static AutoAdjustHeight(cleanDiv: HTMLDivElement, el: HTMLElement, text: string) {
        const tempEl = cleanDiv.createEl('div', { text: text } );
        tempEl.style.position = 'absolute';
        tempEl.style.whiteSpace = 'pre-wrap';
        tempEl.style.visibility = 'hidden';
        tempEl.style.font = el.style.font;
        tempEl.style.fontSize = el.style.fontSize;
        tempEl.style.writingMode = el.style.writingMode;
        tempEl.style.textOrientation = el.style.textOrientation;
        tempEl.style.padding = '0px';
        const temp = tempEl.getBoundingClientRect();

        el.style.height = (temp.height > 25 ? temp.height : 25) + 'px';

        tempEl.remove();
    }
    static AddTextToDiv(div: HTMLDivElement, text: string) {
        div.textContent = text;
    }
    static CreateNewTextDiv(parentDiv: HTMLDivElement, text: string, classes: string = ''): HTMLDivElement {
        const newDiv = parentDiv.createEl('div', { text: text, cls: 'text-div ' + classes } );
        return newDiv;
    }
    static async CreateList(
        div: HTMLDivElement,
        extraDivClasses: string,
        listIsVertical: boolean,
        mainArray: any[],
        objUIMaker: (
            div: HTMLDivElement,
            index: number
        ) => (void | Promise<void>)
    ) {
        div.empty();
        div.className = (listIsVertical ? 'vbox' : 'hbox') + ' scroll ' + extraDivClasses;
        for (let i = 0; i < mainArray.length; i++) {
            objUIMaker(div.createDiv(!listIsVertical ? 'vbox' : 'hbox'), i);
        }
    }
    static CreateColorSwapButton(
        parentDiv: HTMLDivElement,
        view: ItemView,
        color1: { name: string, el: HTMLInputElement },
        color2: { name: string, el: HTMLInputElement },
        isVertical: boolean = false,
        afterSwap: () => Promise<void>
    ) {
		const div = parentDiv.createDiv(isVertical ? 'vbox' : 'hbox');
        
        const obj1Name = this.CreateNewTextDiv(div, color1.name);
        const swapButton = div.createEl('button')
        const obj2Name = this.CreateNewTextDiv(div, color2.name);

		setIcon(swapButton, isVertical ? 'arrow-down-up' : 'arrow-left-right');

        obj1Name.style.writingMode = isVertical ? 'vertical-lr' : 'unset';
        obj2Name.style.writingMode = isVertical ? 'vertical-lr' : 'unset';

        obj1Name.style.textOrientation = isVertical ? 'upright' : 'unset';
        obj2Name.style.textOrientation = isVertical ? 'upright' : 'unset';

		view.registerDomEvent(swapButton, 'click', () => {
            const temp = color1.el.value;
            color1.el.value = color2.el.value;
            color2.el.value = temp;
            afterSwap();
		});
    }
    static CreateExitButton(
        div: HTMLDivElement,
        view: ItemView,
        beforeExit: () => Promise<void> = async () => {},
        afterExit: () => Promise<void> = async () => {}
    ) {
		const exitButton = div.createEl('button');
        exitButton.className = 'exit-button';
        setIcon(exitButton, 'x');
		view.registerDomEvent(exitButton, 'click', async () => {
            await beforeExit();
            div.remove();
            afterExit();
		});
    }
    static DateToDateTimeLocalString(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hour = String(date.getHours()).padStart(2, '0');
        const minute = String(date.getMinutes()).padStart(2, '0');

        return year + '-' + month + '-' + day + 'T' + hour + ':' + minute;
    }
}