'use strict';

const DEFAULT_TEXT_NODE = {};
const DEFAULT_FONT_SIZE = 30;
const DEFAULT_LINE_HEIGHT = 1;
const DEFAULT_FONT = 'Arial';
const DEFAULT_FONT_STYLE = 'normal';
const DEFAULT_ALIGN = 'center';
const DEFAULT_TEXT_DECORATION = '';
const DEFAULT_COLOR = '#000';
const DEFAULT_BG_COLOR = 'transparent';
const FONTS = ['Arial', 'Georgia', 'Impact', 'Tahoma', 'Verdana'];
const FONT_SIZES = [8, 10, 12, 14, 16, 18, 20, 24, 28, 30, 32, 36, 42, 48, 56, 64, 72, 80, 96, 120];
const LINE_HEIGHTS = [0.5, 1, 1.5, 2];

export class TextEditor {
    static #instance;
    textNode = DEFAULT_TEXT_NODE;
    fontSize = DEFAULT_FONT_SIZE;
    lineHeight = DEFAULT_LINE_HEIGHT;
    font = DEFAULT_FONT;
    fontStyle = DEFAULT_FONT_STYLE;
    align = DEFAULT_ALIGN;
    textDecoration = DEFAULT_TEXT_DECORATION;
    color = DEFAULT_COLOR;
    bgColor = DEFAULT_BG_COLOR;
    fonts = FONTS;
    fontSizes = FONT_SIZES;
    lineHeights = LINE_HEIGHTS;

    /**
     * @param {State} state konva.js custom state manager. check state.js file
     * @returns 
     */
    constructor(state) {
        if (TextEditor.#instance) return TextEditor.#instance;
        TextEditor.#instance = this;

        this.state = state;
        this.#createEditor();
    }

    /**
     * @param {Konva.Text} value - Konva.js text node
     */
    setTextNode(value) {
        this.textNode = value;
    }

    get textNode() {
        return this.textNode;
    }

    /**
     * @param {number} value 
     */
    setFontSize(value) {
        if (value <= 0) value = 0;
        else if (value >= 120) value = 120;

        this.fontSize = parseFloat(value);
        this.textNode.fontSize(this.fontSize);
        $('[data-font-size]').removeClass('active');
        $(`[data-font-size="${this.fontSize}"]`).addClass('active');
        $('.font-size-label').val(`${this.fontSize}`);
    }

    get fontSize() {
        return this.fontSize;
    }

    /**
     * @param {number} value 
     */
    setLineHeight(value, options = { changeState: true }) {
        value = parseFloat(value);
        if (typeof value === 'number' && !Number.isNaN(value)) {
            if (value < 0.5) value = 0.5;
            else if (value > 2) value = 2;

            this.lineHeight = parseFloat(value);
            this.textNode.lineHeight(this.lineHeight);
            $('[data-line-height]').removeClass('active');
            $(`[data-line-height="${this.lineHeight}"]`).addClass('active');
            $('.line-height-label').val(`${this.lineHeight}`);
        } else {
            $('.line-height-label').val(DEFAULT_LINE_HEIGHT);
        }
        if (options.changeState) this.#updateState();
    }

    get lineHeight() {
        return this.lineHeight;
    }

    /**
     * @param {string} value - Font
     */
    setFont(value, options = { changeState: true }) {
        this.font = value;
        this.textNode.fontFamily(this.font);
        $('.font-name').text(`${this.font}`);
        $('[data-font]').removeClass('active');
        $(`[data-font="${this.font}"]`).addClass('active');
        if (options.changeState) this.#updateState();
    }

    get font() {
        return this.font;
    }

    /**
     * @param {string} value - Font Style
     */
    setFontStyle(value, options = { changeState: true }) {
        let oldValue = this.textNode.fontStyle();
        let newValue = '';

        if (value) {
            if ($(`[data-font-style="${value}"]`).hasClass('active')) {
                $(`[data-font-style="${value}"]`).removeClass('active');
                if (oldValue.includes(value)) {
                    newValue = oldValue.replace(value, '').trim();
                }
            } else {
                $(`[data-font-style="${value}"]`).addClass('active');
                if (oldValue === 'normal') {
                    newValue = value;
                } else {
                    if (!oldValue.includes(value)) {
                        newValue = oldValue.concat(' ', value);
                    }
                }
            }
        } else {
            $('[data-font-style]').removeClass('active');
            if (oldValue) {
                oldValue.split(' ').forEach(value => $(`[data-font-style="${value}"]`).addClass('active'));
                newValue = oldValue;
            } else newValue = '';
        }

        this.fontStyle = newValue.trim();
        this.textNode.fontStyle(this.fontStyle);
        if (options.changeState) this.#updateState();
    }

    get fontStyle() {
        return this.fontStyle;
    }

    /**
     * @param {string} value 
     */
    setAlign(value, options = { changeState: true }) {
        this.align = value;
        this.textNode.align(this.align);
        $(`[data-align]`).removeClass('active');
        $(`[data-align="${this.align}"]`).addClass('active');
        if (options.changeState) this.#updateState();
    }

    get align() {
        return this.align;
    }

    /**
     * @param {string} value 
     */
    setTextDecoration(value, options = { changeState: true }) {
        let oldValue = this.textNode.textDecoration();
        let newValue = '';

        if (value) {
            if ($(`[data-text-decoration="${value}"]`).hasClass('active')) {
                $(`[data-text-decoration="${value}"]`).removeClass('active');
                if (oldValue.includes(value)) {
                    newValue = oldValue.replace(value, '').trim();
                }
            } else {
                $(`[data-text-decoration="${value}"]`).addClass('active');
                if (!oldValue.includes(value)) {
                    newValue = oldValue.concat(' ', value);
                }
            }
        } else {
            $('[data-text-decoration]').removeClass('active');
            if (oldValue) {
                oldValue.split(' ').forEach(value => $(`[data-text-decoration="${value}"]`).addClass('active'));
                newValue = oldValue;
            } else newValue = '';
        }

        this.textDecoration = newValue;
        this.textNode.textDecoration(this.textDecoration);
        if (options.changeState) this.#updateState();
    }

    get textDecoration() {
        return this.textDecoration;
    }

    /**
     * @param {string} value 
     */
    setColor(value) {
        this.color = value;
        this.textNode.fill(this.color);
        $('.text-color-picker-svg').css('fill', this.color);
        $('#text-color-picker').val(this.color);
    }

    get color() {
        return this.color;
    }

    /**
     * @param {string} value 
     */
    setBgColor(value) {
        this.bgColor = value;
        this.textNode.setBgColor(this.bgColor);
        // $('.bg-color-picker-svg').css('fill', this.bgColor);
        $('#bg-color-picker').val(this.bgColor);
    }

    get bgColor() {
        return this.bgColor;
    }

    /**
     * Increase font size
     */
    increaseFontSize() {
        let value = this.fontSize + 1;
        if (value > 120) this.setFontSize(120);
        else this.setFontSize(value);
        this.#updateState();
    }

    /**
     * Decrease font size
     */
    decreaseFontSize() {
        let value = this.fontSize - 1;
        value <= 0 ? this.setFontSize(1) : this.setFontSize(value);
        this.#updateState();
    }

    /**
     * Increase line height
     */
    increaseLineHeight() {
        let value = this.lineHeight + 0.5;
        if (value > 2) this.setLineHeight(2);
        else this.setLineHeight(value);
    }

    /**
     * Decrease line height
     */
    decreaseLineHeight() {
        let value = this.lineHeight - 0.5;
        value <= 0.5 ? this.setLineHeight(0.5) : this.setLineHeight(value);
    }

    /**
     * Set all values
     */
    setValues() {
        this.setFontSize(this.textNode.fontSize(), { changeState: false });
        this.setLineHeight(this.textNode.lineHeight(), { changeState: false });
        this.setFont(this.textNode.fontFamily(), { changeState: false });
        this.setAlign(this.textNode.align(), { changeState: false });
        this.setColor(this.textNode.fill());
        this.setBgColor(this.textNode.getAttr('backgroundColor'));

        // Will set automatically
        this.setFontStyle(false, { changeState: false });
        this.setTextDecoration(false, { changeState: false });
    }

    /**
     * Reset text editor settings
     */
    reset() {
        this.fontSize = DEFAULT_FONT_SIZE;
        this.lineHeight = DEFAULT_LINE_HEIGHT;
        this.font = DEFAULT_FONT;
        this.fontStyle = DEFAULT_FONT_STYLE;
        this.textNode = DEFAULT_TEXT_NODE;
        this.align = DEFAULT_ALIGN;
        this.textDecoration = DEFAULT_TEXT_DECORATION;
        this.color = DEFAULT_COLOR;
        this.backgroundColor = DEFAULT_BG_COLOR;
    }

    /**
     * Show text editor
     */
    show() {
        this.setValues();
        // $('html').addClass('mb-header-active');
        $('#text-editor').addClass('active');
    }

    /**
     * Hide text editor
     */
    hide() {
        // $('html').removeClass('mb-header-active');
        $('#text-editor').removeClass('active');
        this.reset();
    }

    /**
     * Update app state
     */
    #updateState() {
        if (this.state) this.state.add();
    }

    /**
     * Create Font List
     * @param {array} fonts - fonts array
     * @returns created HTML list
     */
    #createFonts(fonts) {
        let result = '';
        if (typeof fonts === 'object') {
            fonts.forEach(value => {
                result += `
                    <div 
                        class="dropdown-item" 
                        data-font="${value}" 
                        onclick="textEditor.setFont('${value}');"
                    >${value}</div>
                `
            });
        }
        return result;
    }

    /**
     * Create Font Sizes List
     * @param {array} fontSizes - font sizes array
     * @returns created HTML list
     */
    #createFontSizes(fontSizes) {
        let result = '';
        if (typeof fontSizes === 'object') {
            fontSizes.forEach(value => {
                result += `
                    <div 
                        class="dropdown-item"
                        data-font="${value}"
                        onclick="textEditor.setFontSize('${value}'); state.add();"
                    >${value}</div>
                `
            });
        }
        return result;
    }

    /**
     * Create Line Heights List
     * @param {array} lineHeights - line heights array
     * @returns created HTML list
     */
    #createLineHeights(lineHeights) {
        let result = '';
        if (typeof lineHeights === 'object') {
            lineHeights.forEach(value => {
                result += `
                    <div 
                        class="dropdown-item" 
                        data-font="${value}" 
                        onclick="textEditor.setLineHeight('${value}');"
                    >${value}</div>
                `
            });
        }
        return result;
    }

    /**
     * Add Editor to DOM
     */
    #createEditor() {
        $('.mb-header').append(`
            <div id="text-editor" class="text-editor header-section">
                <div class="editor__item font dropdown" data-editor-item="font" data-tooltip="Font" data-tooltip-position="right" data-tooltip-offset-x="8">
                    <div class="dropdown-label font-select" data-toggle="dropdown">
                        <div class="label-text font-name">Arial</div>
                        <div class="label-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><path fill="currentColor" d="m11.71 6.47-3.53 3.54c-.1.1-.26.1-.36 0L4.3 6.47a.75.75 0 1 0-1.06 1.06l3.53 3.54c.69.68 1.8.68 2.48 0l3.53-3.54a.75.75 0 0 0-1.06-1.06z"></path></svg>
                        </div>
                    </div>
                    <div class="dropdown-list font-list">${this.#createFonts(this.fonts)}</div>
                </div>
                <div class="editor__item font-size number-btn dropdown" data-editor-item="font-size" data-tooltip="Font Size" data-tooltip-position="right" data-tooltip-offset-x="8">
                    <div class="dropdown-label font-size-select" data-toggle="dropdown">
                        <input type="text" class="label-input font-size-label" value="30" maxlength="4">
                    </div>
                    
                    <span class="size-controller minus" onclick="textEditor.decreaseFontSize()">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M2 6a.75.75 0 0 1 .75-.75h6.5a.75.75 0 0 1 0 1.5h-6.5A.75.75 0 0 1 2 6Z" fill="currentColor"></path></svg>
                    </span>
                    <span class="size-controller plus" onclick="textEditor.increaseFontSize()">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M5.25 9.25a.75.75 0 0 0 1.5 0v-2.5h2.5a.75.75 0 0 0 0-1.5h-2.5v-2.5a.75.75 0 0 0-1.5 0v2.5h-2.5a.75.75 0 0 0 0 1.5h2.5v2.5Z" fill="currentColor"></path></svg>
                    </span>
                    <div class="dropdown-list font-list">${this.#createFontSizes(this.fontSizes)}</div>
                </div>
                <div class="editor__item line-height number-btn dropdown" data-editor-item="line-height" data-tooltip="Line Height" data-tooltip-position="right" data-tooltip-offset-x="8">
                    <div class="dropdown-label line-height-select" data-toggle="dropdown">
                        <input type="text" class="label-input line-height-label" value="1" maxlength="3">
                    </div>
                    
                    <span class="size-controller minus" onclick="textEditor.decreaseLineHeight()">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M2 6a.75.75 0 0 1 .75-.75h6.5a.75.75 0 0 1 0 1.5h-6.5A.75.75 0 0 1 2 6Z" fill="currentColor"></path></svg>
                    </span>
                    <span class="size-controller plus" onclick="textEditor.increaseLineHeight()">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M5.25 9.25a.75.75 0 0 0 1.5 0v-2.5h2.5a.75.75 0 0 0 0-1.5h-2.5v-2.5a.75.75 0 0 0-1.5 0v2.5h-2.5a.75.75 0 0 0 0 1.5h2.5v2.5Z" fill="currentColor"></path></svg>
                    </span>
                    <div class="dropdown-list font-list">${this.#createLineHeights(this.lineHeights)}</div>
                </div>
                
                <span class="seperator m-r-0"></span>

                <div class="item-group font-styles" data-item-groups="font-style text-decoration font-variant">
                    <label id="text-color" class="editor__item color icon-btn" data-editor-item="color" data-color data-tooltip="Text Color" onclick="toggleColorPicker(this.id);">
                        <input type="color" value="#000000" id="text-color-picker" class="color-picker">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 9 14.96"><g id="Слой_2" data-name="Слой 2"><g id="Слой_1-2" data-name="Слой 1"><path class="cls-1" d="M3.52,1.73H0V0H9V1.73H5.48V11h-2Z"/><rect class="cls-2 text-color-picker-svg" y="12.96" width="9" height="2"/></g></g></svg>
                    </label>
                    <label id="bg-color" class="editor__item bg-color icon-btn" data-editor-item="bg-color" data-bg-color data-tooltip="Text Fill" onclick="toggleColorPicker(this.id);">
                        <input type="color" value="#000000" id="bg-color-picker" class="color-picker">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-paint-bucket" viewBox="0 0 16 16"><path d="M6.192 2.78c-.458-.677-.927-1.248-1.35-1.643a2.972 2.972 0 0 0-.71-.515c-.217-.104-.56-.205-.882-.02-.367.213-.427.63-.43.896-.003.304.064.664.173 1.044.196.687.556 1.528 1.035 2.402L.752 8.22c-.277.277-.269.656-.218.918.055.283.187.593.36.903.348.627.92 1.361 1.626 2.068.707.707 1.441 1.278 2.068 1.626.31.173.62.305.903.36.262.05.64.059.918-.218l5.615-5.615c.118.257.092.512.05.939-.03.292-.068.665-.073 1.176v.123h.003a1 1 0 0 0 1.993 0H14v-.057a1.01 1.01 0 0 0-.004-.117c-.055-1.25-.7-2.738-1.86-3.494a4.322 4.322 0 0 0-.211-.434c-.349-.626-.92-1.36-1.627-2.067-.707-.707-1.441-1.279-2.068-1.627-.31-.172-.62-.304-.903-.36-.262-.05-.64-.058-.918.219l-.217.216zM4.16 1.867c.381.356.844.922 1.311 1.632l-.704.705c-.382-.727-.66-1.402-.813-1.938a3.283 3.283 0 0 1-.131-.673c.091.061.204.15.337.274m.394 3.965c.54.852 1.107 1.567 1.607 2.033a.5.5 0 1 0 .682-.732c-.453-.422-1.017-1.136-1.564-2.027l1.088-1.088c.054.12.115.243.183.365.349.627.92 1.361 1.627 2.068.706.707 1.44 1.278 2.068 1.626.122.068.244.13.365.183l-4.861 4.862a.571.571 0 0 1-.068-.01c-.137-.027-.342-.104-.608-.252-.524-.292-1.186-.8-1.846-1.46-.66-.66-1.168-1.32-1.46-1.846-.147-.265-.225-.47-.251-.607a.573.573 0 0 1-.01-.068l3.048-3.047zm2.87-1.935a2.44 2.44 0 0 1-.241-.561c.135.033.324.11.562.241.524.292 1.186.8 1.846 1.46.45.45.83.901 1.118 1.31a3.497 3.497 0 0 0-1.066.091 11.27 11.27 0 0 1-.76-.694c-.66-.66-1.167-1.322-1.458-1.847z"/></svg>
                    </label>
                    <div class="editor__item font-style icon-btn bold" data-editor-item="font-style" data-font-style="bold" data-tooltip="Bold" onclick="textEditor.setFontStyle('bold');">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-type-bold" viewBox="0 0 16 16"><path d="M8.21 13c2.106 0 3.412-1.087 3.412-2.823 0-1.306-.984-2.283-2.324-2.386v-.055a2.176 2.176 0 0 0 1.852-2.14c0-1.51-1.162-2.46-3.014-2.46H3.843V13zM5.908 4.674h1.696c.963 0 1.517.451 1.517 1.244 0 .834-.629 1.32-1.73 1.32H5.908V4.673zm0 6.788V8.598h1.73c1.217 0 1.88.492 1.88 1.415 0 .943-.643 1.449-1.832 1.449H5.907z"/></svg>
                    </div>
                    <div class="editor__item font-style icon-btn italic" data-editor-item="font-style" data-font-style="italic" data-tooltip="Italic" onclick="textEditor.setFontStyle('italic');">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-type-italic" viewBox="0 0 16 16"><path d="M7.991 11.674 9.53 4.455c.123-.595.246-.71 1.347-.807l.11-.52H7.211l-.11.52c1.06.096 1.128.212 1.005.807L6.57 11.674c-.123.595-.246.71-1.346.806l-.11.52h3.774l.11-.52c-1.06-.095-1.129-.211-1.006-.806z"/></svg>
                    </div>
                    <div class="editor__item text-decoration icon-btn underline" data-editor-item="text-decoration" data-text-decoration="underline" data-tooltip="Underline" onclick="textEditor.setTextDecoration('underline');">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-type-underline" viewBox="0 0 16 16"><path d="M5.313 3.136h-1.23V9.54c0 2.105 1.47 3.623 3.917 3.623s3.917-1.518 3.917-3.623V3.136h-1.23v6.323c0 1.49-.978 2.57-2.687 2.57-1.709 0-2.687-1.08-2.687-2.57V3.136zM12.5 15h-9v-1h9z"/></svg>
                    </div>
                    <div class="editor__item text-decoration icon-btn line-through" data-editor-item="text-decoration" data-text-decoration="line-through" data-tooltip="Line Through" onclick="textEditor.setTextDecoration('line-through');">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-type-strikethrough" viewBox="0 0 16 16"><path d="M6.333 5.686c0 .31.083.581.27.814H5.166a2.776 2.776 0 0 1-.099-.76c0-1.627 1.436-2.768 3.48-2.768 1.969 0 3.39 1.175 3.445 2.85h-1.23c-.11-1.08-.964-1.743-2.25-1.743-1.23 0-2.18.602-2.18 1.607zm2.194 7.478c-2.153 0-3.589-1.107-3.705-2.81h1.23c.144 1.06 1.129 1.703 2.544 1.703 1.34 0 2.31-.705 2.31-1.675 0-.827-.547-1.374-1.914-1.675L8.046 8.5H1v-1h14v1h-3.504c.468.437.675.994.675 1.697 0 1.826-1.436 2.967-3.644 2.967"/></svg>
                    </div>
                </div>

                <span class="seperator m-l-0 m-r-0"></span>

                <div class="item-group text-align" data-item-groups="align">
                    <div class="editor__item align icon-btn" data-editor-item="align" data-align="left" data-tooltip="Align Left" onclick="textEditor.setAlign('left');">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-text-left" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M2 12.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5m0-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5m0-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5m0-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5"/></svg>
                    </div>
                    <div class="editor__item align icon-btn" data-editor-item="align" data-align="center" data-tooltip="Align Center" onclick="textEditor.setAlign('center');">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-text-center" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M4 12.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5m-2-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5m2-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5m-2-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5"/></svg>
                    </div>
                    <div class="editor__item align icon-btn" data-editor-item="align" data-align="right" data-tooltip="Align Right" onclick="textEditor.setAlign('right');">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-text-right" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M6 12.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5m-4-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5m4-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5m-4-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5"/></svg>
                    </div>
                </div>
            </div>
        `);
    }
}