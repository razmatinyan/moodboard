'use strict';

import { ajaxRequest, ZEELalert } from './index';
import { TextEditor } from './textEditor/textEditor';
import { Emitter } from './emitter/emitter';
import { State } from './state/state';

/**
 * Prevent the addnews form from sending
 */
$('#entryform').on('submit', function (e) {
    e.preventDefault();
});

const BLUE = '#0066ff';
const WHITE = '#fff';
const BLACK = '#000';
const IMG_SIZE = 300;
const CONTAINER = '#moodboard-content';
/**
 * This option must be defined by User
 */
const CANVAS_WIDTH = 1024;
/**
 * This option must be defined by User
 */
const CANVAS_HEIGHT = 626;
/**
 * Distance to snap nodes
 */
const GUIDELINE_OFFSET = 5;
/**
 * Anchors for texts.
 * The corner elements to control size of node while it's selected
 */
const ANCHORS = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
/**
 * Anchors for texts.
 * The corner elements to control size of node while it's selected
 */
const MIDDLE_ANCHORS = ['middle-left', 'middle-right'];
/**
 * Global variable to keep some data
 */
const MB_DATA = {};

/**
 * Set from Promises to track Promises globally in App.
 * Add Promise to this variable, and remove it
 * when the Promise is resolved
 * @usage allPromises.add(your Promise...) 
 */
let allPromises = new Set();
/**
 * Variable for generating unique ID.
 * You should use it with useId() function
 * @usage useId()
 */
let id = 0;
/**
 * To track globally if CTRL or any key 
 * like these metakeys are pressed
 */
let meta = false;
/**
 * To track globally if any node is transforming
 */
let transforming = false;
/**
 * To track globally if the shape menu is opened
 */
let isMenuOpened = false;
/**
 * To keep the current target (current selected node)
 */
let currentTarget;

$(document).on('ready', function () {
    $('.shape-menu').detach().prependTo('#mb');
});

$(document).on('mouseover', (e) => {
    let target = $(e.target).attr('data-tooltip') !== undefined ?
        e.target :
        $(e.target).closest('[data-tooltip]').get(0);
    let tooltip = $(target).attr('data-tooltip');
    let position = $(target).attr('data-tooltip-position') ?? 'bottom';
    let offsetX = $(target).attr('data-tooltip-offset-x') ?? 8;
    let offsetY = $(target).attr('data-tooltip-offset-y') ?? 8;

    if (tooltip === undefined) return;
    showTooltip(target, tooltip, position, parseFloat(offsetX), parseFloat(offsetY));
});

$(document).on('mouseout', (e) => {
    hideTooltip();
});

const stage = new Konva.Stage({
    container: CONTAINER,
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
});

/**
 * Set index of container to '1'
 * to be able to delete element on click 'Delete'
 */
stage.container().tabIndex = 1;

let layer = new Konva.Layer({
    name: 'layer'
});
stage.add(layer);

const state = new State(stage, new Emitter());
const textEditor = new TextEditor(state);

state.on('add', handleStateChange);
state.on('update', async (e) => {
    handleStateChange(e);
    handleStateUpdate(e);
    await setState(e.detail);
});

/**
 * Handle state change
 * @param {Event} e - event 
 */
function handleStateChange(e) {
    if (state.canUndo) $('#undo').removeClass('disabled');
    else $('#undo').addClass('disabled');

    if (state.canRedo) $('#redo').removeClass('disabled');
    else $('#redo').addClass('disabled');
}

/**
 * Handle state update
 * @param {Event} e - event
 */
function handleStateUpdate(e) {
    hideShapeMenu();
    textEditor.hide();
    tr.nodes([]);
}

/**
 * Set new state
 * @param {object} state - object of nodes
 */
async function setState(state) {
    if (Object.keys(state).length === 0) {
        layer.find('.image, .text').forEach(node => node.destroy());
        layer.findOne('.background-color')?.fill('#ffffff');
        layer.findOne('.background-image')?.destroy();
    } else {
        let nodeIds = [];
        /**
         * Loop through new state and set node attributes
         * and add nodes that doesn't exist in layer now
         */
        for (const key in state) {
            const current = state[key];
            let currentPrototype;

            switch (current.attrs.name) {
                case 'image':
                    currentPrototype = new Konva.Image;
                    break;

                case 'text':
                    currentPrototype = new Konva.Text;
                    break;

                case 'transformer':
                    currentPrototype = new Konva.Transformer;
                    break;

                default:
                    currentPrototype = new Konva.Rect
                    break;
            }

            /**
             * Set the prototype of Konva.Node, 
             * to access current Konva type methods
             */
            Object.setPrototypeOf(current, currentPrototype);

            if (!current.hasName('transformer')) {
                const node = layer.findOne(`#${current.id()}`);
                nodeIds.push(current.id());

                if (current.hasName('background-color')) {
                    addBackgroundColor(current.attrs.fill);
                } else if (current.hasName('background-image')) {
                    // TODO: handle background-image changes 
                } else {
                    if (node) {
                        if (current.hasName('image')) editImage(current.attrs);
                        else if (current.hasName('text')) editText(current.attrs);
                    } else {
                        if (current.hasName('image')) await addImage(current.attrs, false);
                        else if (current.hasName('text')) addText(current.attrs, false);
                    }
                }
            }
        }

        const childrens = layer.children;
        /**
         * Loop through childrens and check
         * if some node is not in current state, but it
         * exists in childrens: remove it
         */
        for (const node in childrens) {
            const current = childrens[node];
            if (current.id() && !nodeIds.includes(current.id())) {
                current.destroy();
            }
        }
    }
}

// State control listeners
$('#redo').on('click', function (e) {
    if (!isPromisePending() && !$(this).hasClass('disabled')) {
        state.redo();
    }
});
$('#undo').on('click', function (e) {
    if (!isPromisePending() && !$(this).hasClass('disabled')) {
        state.undo();
    }
});

/**
 * Create new transformer for transforming
 * Width, Height, Size, Rotation of elements
 */
let tr = new Konva.Transformer({
    name: 'transformer',
    keepRatio: true,
    rotationSnaps: [0, 90, 180, 270],
    rotateAnchorCursor: 'grabbing',
    borderStroke: BLUE,
    borderStrokeWidth: 2,
    borderEnabled: false,
    anchorStroke: BLUE,
    anchorStrokeWidth: 1,
    anchorSize: 14,
    anchorCornerRadius: 20,
    ignoreStroke: true,
    enabledAnchors: ANCHORS,
    flipEnabled: false,
    useSingleNodeRotation: true,
    boundBoxFunc: (oldBox, newBox) => {
        const box = getClientRect(newBox);
        const isOut =
            box.x < 0 ||
            box.y < 0 ||
            box.x + box.width > stage.width() ||
            box.y + box.height > stage.height();

        // if new bounding box is out of visible viewport, let's just skip transforming
        // this logic can be improved by still allow some transforming if we have small available space
        if (isOut) {
            return oldBox;
        }
        return newBox;
    },
    anchorStyleFunc: (anchor) => {
        if (anchor.hasName('rotater')) {
            anchor.size({ width: 18, height: 18 });
            // Set rotater correct position
            tr.findOne('.rotater').x(tr.findOne('.rotater').x() - 1.7);
        }
    }
});

const customAnchors = {
    rotater: {
        path: '<svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><title>box-configurator-rotate</title><circle cx="8" cy="8" r="8" style="fill:#fff"/><path d="M0.9,0.5c0.1,0,0.3,0.1,0.3,0.3L1.1,2.9c1-1.4,2.6-2.4,4.5-2.4c2.9,0,5.3,2.4,5.3,5.3c0,2.9-2.4,5.3-5.3,5.3c-1.4,0-2.6-0.5-3.6-1.4c-0.1-0.1-0.1-0.3,0-0.4L2.3,9c0.1-0.1,0.3-0.1,0.4,0c0.7,0.7,1.7,1.1,2.8,1.1c2.3,0,4.2-1.9,4.2-4.2S7.8,1.7,5.5,1.7c-1.7,0-3.2,1-3.8,2.5l2.7-0.1c0.1,0,0.3,0.1,0.3,0.3v0.6c0,0.1-0.1,0.3-0.3,0.3H0.3C0.1,5.2,0,5.1,0,4.9V0.8c0-0.1,0.1-0.3,0.3-0.3H0.9z"/></svg>',
        shape: tr.findOne('.rotater')
    },
}

for (let anchor in customAnchors) {
    let shape = customAnchors[anchor].shape;
    let selector = anchor.replace('_', '-');
    let icon = new Konva.Path({
        fill: BLACK,
        data: customAnchors[anchor].path,
        name: selector + '-icon',
    });
    icon.position(shape.position());
    icon.x(shape.x() - 3.3);
    icon.y(shape.y() - 3.5);
    tr.add(icon);
}

/**
 * Set custom anchors right positions
 * This function need to be called on 
 * selecting element(s), adding element, .on('transform') event
 */
const setCustomAnchorPosition = () => {
    for (let anchor in customAnchors) {
        let selector = anchor.replace('_', '-');
        let shape = tr.findOne(`.${selector}`);
        let icon = tr.findOne(`.${selector}-icon`);
        icon.position(shape.position());
        icon.x(shape.x() - 3.3);
        icon.y(shape.y() - 3.5);
    }
}

/**
 * Enable all anchors
 */
const enableAnchors = (anchors = ANCHORS) => {
    tr.enabledAnchors(anchors);
}

/**
 * Disable all anchors
 */
const disableAnchors = () => {
    tr.enabledAnchors([]);
}

/**
 * Enable rotater
 */
const enableRotater = () => {
    tr.findOne('.rotater-icon').visible(true);
    tr.rotateEnabled(true);
}

/**
 * Disable rotater
 */
const disableRotater = () => {
    tr.findOne('.rotater-icon').visible(false);
    tr.rotateEnabled(false);
}

/**
 * Disable all anchors expect of specific one
 * @param {string} anchorName - anchor name to keep
 */
const disableAnchorsExpect = (anchorName) => {
    let anchor = anchorName === 'rotater' ? [] : [anchorName];
    tr.enabledAnchors(anchor);
}

/**
 * Determine which anchors need to be enabled
 * @param {Konva.Node} node - canvas element (text or image)
 * @return {Array} array of anchors
 */
const pickRightAnchors = (node) => node.hasName('text') ? MIDDLE_ANCHORS : ANCHORS;

tr.children.forEach(function (anchor) {
    if (!anchor.hasName('rotater') && !anchor.hasName('rotater-icon')) {
        anchor.on('mouseover', function () {
            new Konva.Tween({
                node: anchor,
                duration: 0.1,
                fill: BLUE,
            }).play();
        });

        anchor.on('mouseout', function () {
            new Konva.Tween({
                node: anchor,
                duration: 0.1,
                fill: WHITE,
            }).play();
        });
    }

    if (anchor.hasName('rotater') || anchor.hasName('rotater-icon')) {
        anchor.on('mouseenter', function () {
            setCursor('grabbing');
        });
        anchor.on('mouseout', function () {
            resetCursor();
        });
    }
});

layer.add(tr);

/**
 * Remove event listeners to avoid memory leaks
 */
$(window).on('unload', function () {
    $('.font-size-label').off('change');
    $('#undo, #redo').off('click')
    tr.off('dragmove');
    layer.off('dragmove dragend');
    stage.off('click tap dragmove mouseup touchend mousemove touchmove mousedown touchstart');
    stage.destroy();
    $(stage.container()).off('keydown');
    $(document).off('mouseover mouseout');
});

/**
 * Delete elements from board when click 'Delete' key
 */
$(stage.container()).on('keydown', (e) => {
    if (e.key === 'Delete') deleteSelectedNodes(e);
});
/**
 * Change states on click CTRL + Z or CTRL + Y
 */
$(document).on('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key) {
        switch (e.key) {
            case 'z':
                $('#undo').trigger('click');
                break;
            case 'y':
                $('#redo').trigger('click');
                break;
            default:
                break;
        }
    }
});
$('[data-menu-action="delete"]').on('click', (e) => deleteSelectedNodes(e));
$('[data-menu-action="lock"]').on('click', (e) => lockNodes(e));
$('#bg-reset').on('click', resetBackgroundColor);
$('#bg-color').on('input change', (e) => {
    addBackgroundColor(e.currentTarget.value);
    if (e.type === 'change') state.add();
});

/**
 * Stage, Layer, Transformer Events
 */

// Stage
/**
 * First stage click tap handler
 */
stage.on('click tap', function (e) {
    if (e.evt.target.parentNode.classList.contains('shape-menu')) return;

    hideShapeMenu();
    let target = e.target;

    if (tr.nodes().length && !target.hasName('image') && !target.hasName('text')) {
        tr.borderEnabled(false);
        tr.nodes([]);
        if (!e.evt.target.classList.contains('textarea-tm')) textEditor.hide();
        meta = false;
    }

    if (!e.evt.shiftKey && !e.evt.ctrlKey && !e.evt.metaKey) {
        if (target.hasName('image')) {
            textEditor.hide();
            tr.nodes([target]);
            currentTarget = target;

            disableStrokes();
            target.strokeEnabled(true);
            tr.borderEnabled(false);
        } else if (target.hasName('text')) {
            tr.nodes([target]);
            textEditor.setTextNode(target);
            textEditor.show();
            currentTarget = target;

            disableStrokes();
            tr.borderEnabled(true);
        }
        meta = false;
    }

    if (target.hasName('image') || target.hasName('text')) {
        if (currentTarget?._id !== target._id) {
            disableStrokes();
            currentTarget = target;
            target.strokeEnabled(true);
        }
        setCustomAnchorPosition();
    } else {
        disableStrokes();
        currentTarget = {};
    }
});

/**
 * Second stage click tap (and dragmove) handler
 */
stage.on('click tap dragmove', function (e) {
    let target = e.target;
    // do we pressed shift or ctrl?
    const metaPressed = e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey;
    const isSelected = tr.nodes().indexOf(target) >= 0;

    preventOverflow();

    if (
        e.evt.target.parentNode.classList !== undefined &&
        e.evt.target.parentNode.classList.contains('shape-menu')
    ) return;

    if (e.type === 'dragmove') {
        if (metaPressed) return;
        setCorrectLockedClass();
        hideShapeMenu();
    }

    // if click on empty area - remove all selections
    if (target === stage) {
        if (!e.evt.target.parentNode.classList.contains('shape-menu')) {
            tr.nodes([]);
        }
        return;
    }

    // do something if clicked NOT on our rectangles
    if (!target.hasName('image') && !target.hasName('text')) {
        if (tr.nodes().length === 1 && target.hasName('image')) tr.nodes()[0].strokeEnabled(true);
        return;
    }

    if (target.getAttr('locked') === true && metaPressed) return;

    if (tr.nodes()[0]?.getAttr('locked') === true && metaPressed) {
        tr.nodes().splice(tr.nodes().indexOf(target), 1);
    }

    if (!metaPressed && !isSelected) {
        // if no key pressed and the node is not selected
        // select just one
        tr.nodes([target]);
    } else if (metaPressed && isSelected) {
        textEditor.hide();
        // if we pressed keys and node was selected
        // we need to remove it from selection:
        const nodes = tr.nodes().slice(); // use slice to have new copy of array
        // remove node from array
        nodes.splice(nodes.indexOf(target), 1);

        target.strokeEnabled(false);
        tr.nodes(nodes);

        meta = true;
        tr.borderEnabled(true);
        tr.nodes().forEach((item) => {
            if (item.hasName('image')) item.strokeEnabled(false);
        });
    } else if (metaPressed && !isSelected) {
        textEditor.hide();
        // add the node into selection
        const nodes = tr.nodes().concat([target]);
        nodes.forEach((node) => {
            if (node.hasName('text')) nodes.splice(nodes.indexOf(node), 1);
        });
        tr.nodes(nodes);

        meta = true;
        tr.borderEnabled(true);
        tr.nodes().forEach((item) => {
            if (item.hasName('image')) item.strokeEnabled(false);
        });
    }

    if (target.hasName('image') || target.hasName('text')) {
        if (metaPressed && isSelected) {
            target.zIndex(1);
            tr.nodes()?.forEach(n => n.zIndex(2));
        } else {
            target.moveToTop();
        }

        if (tr.nodes().length) {
            if (tr.nodes().length > 1) {
                if (tr.isDragging()) {
                    disableAnchors();
                } else {
                    enableAnchors(ANCHORS);
                }
            } else {
                if (target.isDragging()) {
                    disableAnchors();
                } else {
                    enableAnchors(pickRightAnchors(tr.nodes()[0]));
                }
            }
        }

        tr.moveToTop();
    }

    if (tr.nodes().length) {
        setCustomAnchorPosition();
        if (e.type !== 'dragmove') {
            if (tr.nodes()[0].getAttr('locked') === true) {
                disableRotater();
                disableAnchors();
            } else {
                enableRotater();
                enableAnchors(pickRightAnchors(tr.nodes()[0]));
            }

            setCorrectLockedClass();
            showShapeMenu();
        }
    }
});

stage.on('dragstart', function (e) {
    if (tr.nodes().length === 1) {
        meta = false;
    }

    if (!meta) {
        currentTarget = e.target;

        if (currentTarget.hasName('text')) {
            textEditor.setTextNode(currentTarget);
            textEditor.show();
            tr.borderEnabled(true);
        } else if (currentTarget.hasName('image')) {
            textEditor.hide();
            tr.borderEnabled(false);
            currentTarget.strokeEnabled(true);
        }

        tr.nodes([currentTarget]);
        setCustomAnchorPosition();
    }
    disableAnchors();
    hideShapeMenu();
});

stage.on('dragend', function () {
    if (!meta) {
        if (currentTarget.hasName('text')) {
            disableStrokes();
        } else {
            tr.nodes([currentTarget]);
            tr.borderEnabled(false);

            setCustomAnchorPosition();
            disableStrokes();
            currentTarget.strokeEnabled(true);
        }
    }
    enableAnchors(pickRightAnchors(currentTarget));
    showShapeMenu(currentTarget);
});

// Layer
layer.on('mouseover', function (e) {
    setCursor('move');
    if (!meta) {
        let shape = e.target;
        if (shape.hasName('image') && !transforming) {
            shape.strokeEnabled(true);
        }
    }
});

layer.on('mouseout', function (e) {
    resetCursor();
    if (!meta) {
        let target = e.target;
        if (target.hasName('image') && !transforming && tr.nodes().indexOf(target) !== 0) {
            target.strokeEnabled(false);
        }
    }
});

layer.on('dragmove', function (e) {
    const metaPressed = e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey;
    if (metaPressed) return;

    let target = e.target;

    // clear all previous lines on the screen
    layer.find('.guid-line').forEach((l) => l.destroy());

    // find possible snapping lines
    let lineGuideStops = getLineGuideStops(target);
    // find snapping points of current object
    let itemBounds = getObjectSnappingEdges(target);
    // now find where can we snap current object
    let guides = getGuides(lineGuideStops, itemBounds);

    // do nothing of no snapping
    if (!guides.length) {
        return;
    }
    drawGuides(guides);

    let absPos = target.absolutePosition();
    // now force object position
    guides.forEach((lg) => {
        switch (lg.snap) {
            case 'start': {
                switch (lg.orientation) {
                    case 'V': {
                        absPos.x = lg.lineGuide + lg.offset;
                        break;
                    }
                    case 'H': {
                        absPos.y = lg.lineGuide + lg.offset;
                        break;
                    }
                }
                break;
            }
            case 'center': {
                switch (lg.orientation) {
                    case 'V': {
                        absPos.x = lg.lineGuide + lg.offset;
                        break;
                    }
                    case 'H': {
                        absPos.y = lg.lineGuide + lg.offset;
                        break;
                    }
                }
                break;
            }
            case 'end': {
                switch (lg.orientation) {
                    case 'V': {
                        absPos.x = lg.lineGuide + lg.offset;
                        break;
                    }
                    case 'H': {
                        absPos.y = lg.lineGuide + lg.offset;
                        break;
                    }
                }
                break;
            }
        }
    });
    target.absolutePosition(absPos);
});

layer.on('dragend', function () {
    // clear all previous lines on the screen
    layer.find('.guid-line').forEach((l) => l.destroy());
});

// Transformer
tr.on('transformstart', function (e) {
    let target = e.target;

    if (!meta) {
        if (target.hasName('image')) {
            tr.borderEnabled(false);

            currentTarget = target;
            transforming = true;
            target.strokeEnabled(true);
        } else if (target.hasName('text')) {
            currentTarget = target;
            transforming = true;
            tr.borderEnabled(true);
        }
    }
    disableAnchorsExpect(tr.getActiveAnchor());
    hideShapeMenu();
});

tr.on('transformend', function (e) {
    let target = e.target;

    if (!meta) {
        if (target.hasName('image')) {
            transforming = false;
        } else if (target.hasName('text')) {
            transforming = false;
            tr.borderEnabled(true);
        }
    }

    showShapeMenu(target);
    enableAnchors(pickRightAnchors(target));
    setCustomAnchorPosition();
    state.add();
});

tr.on('dragmove', (e) => {
    const metaPressed = e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey;
    if (metaPressed) return;

    preventOverflow();
});

/**
 * Handle Konva.Image transform event
 */
Konva.Image.prototype.on('transform', function (e) {
    tr.update();
    if (tr.getActiveAnchor() === 'rotater') setCursor('grabbing');
    setCustomAnchorPosition();
});

/**
 * Handle Konva.Image transformend event
 */
Konva.Image.prototype.on('transformend', function () {
    resetCursor();
});

/**
 * Add Image to the board
 * @param {object} options - object of options
 * @param {boolean} updateState - update state or not
 */
const addImage = async (options = {}, updateState = true) => {
    const imagePromise = new Promise(resolve => {
        const attrs = {
            id: options.id ?? `image-${useId()}`,
            x: options.x ?? stage.width() / 2 - IMG_SIZE / 2,
            y: options.y ?? stage.height() / 2 - IMG_SIZE / 2,
            rotation: options.rotation ?? 0,
            scaleX: options.scaleX ?? 1,
            scaleY: options.scaleY ?? 1,
            skewX: options.skewX ?? 0,
            skewY: options.skewY ?? 0,
            src: options.src ?? '',
            width: options.width ?? IMG_SIZE,
            height: options.height ?? IMG_SIZE,
            strokeWidth: options.strokeWidth ?? 2,
            stroke: options.stroke ?? BLUE,
            strokeEnabled: options.strokeEnabled ?? true,
            strokeScaleEnabled: options.strokeScaleEnabled ?? false,
            locked: options.locked ?? false,
            draggable: options.draggable ?? true
        }
        const image = new Image();
        image.onload = function () {
            const { id, src, x, y, rotation, scaleX, scaleY, skewX, skewY, width, height, strokeWidth, stroke, strokeEnabled, strokeScaleEnabled, locked, draggable } = attrs;
            const img = new Konva.Image({
                name: 'image',
                id,
                image,
                src,
                x,
                y,
                rotation,
                scaleX,
                scaleY,
                skewX,
                skewY,
                width,
                height,
                strokeWidth,
                stroke,
                strokeEnabled,
                strokeScaleEnabled,
                locked,
                draggable,
            });
            layer.add(img);
            textEditor.hide();

            tr.borderEnabled(false);
            tr.nodes([img]);

            img.moveToTop();
            tr.moveToTop();

            enableAnchors();
            enableRotater();
            setCustomAnchorPosition();

            setCorrectLockedClass();
            hideShapeMenu();
            showShapeMenu(img);

            currentTarget = img;
            disableStrokesExpect(currentTarget._id);

            if (updateState) {
                state.add();
            }

            img.on('dragend', function () {
                state.add();
            });

            resolve(true);
        };
        image.src = attrs.src;
    });

    allPromises.add(imagePromise);
    imagePromise.finally(() => allPromises.delete(imagePromise));

    return imagePromise;
}

/**
 * Edit Image
 * @param {object} attrs - attrs for image
 */
const editImage = (attrs) => {
    if (Object.keys(attrs).length === 0 || !layer.findOne(`#${attrs.id}`)) return false;

    const node = layer.findOne(`#${attrs.id}`);
    node.id(attrs.id);
    node.x(attrs.x);
    node.y(attrs.y);
    node.rotation(attrs.rotation);
    node.scaleX(attrs.scaleX);
    node.scaleY(attrs.scaleY);
    node.skewX(attrs.skewX);
    node.skewY(attrs.skewY);
    node.width(attrs.width);
    node.height(attrs.height);
    node.strokeWidth(attrs.strokeWidth);
    node.stroke(attrs.stroke);
    node.strokeEnabled(false);
    node.strokeScaleEnabled(attrs.strokeScaleEnabled);
    node.setAttr('locked', attrs.locked);
    node.draggable(attrs.draggable);
}

/**
 * Set background image for layer
 * @param {string} src - image source 
 */
const addBackgroundImage = async (src, updateState = true) => {
    const imagePromise = new Promise(resolve => {
        let image = new Image();
        image.onload = function () {
            showBackgroundColor(false);
            if (layer.findOne('#background-image')) {
                /**
                 * TODO: Decide what to do if background image is set 
                 * or if it need to be changed
                 */
            } else {
                const rect = new Konva.Rect({
                    name: 'rect background background-image',
                    id: 'background-image',
                    x: 0,
                    y: 0,
                    width: CANVAS_WIDTH,
                    height: CANVAS_HEIGHT,
                    src,
                    fillPatternImage: image,
                    fillPatternRepeat: 'no-repeat',
                    fillPatternScale: {
                        x: image.width / image.height,
                        y: 1
                    },
                    listening: false,
                });
                layer.add(rect);
                rect.zIndex(0);
            }

            if (updateState) state.add();

            resolve(true);
        }
        image.src = src;
    });

    allPromises.add(imagePromise);
    imagePromise.finally(() => allPromises.delete(imagePromise));

    return imagePromise;
}

/**
 * Remove background image
 */
const removeBackgroundImage = () => {
    layer.findOne('.background-image')?.destroy();
    showBackgroundColor(true);
    state.add();
}

/**
 * Set background color for layer
 * @param {string} color - background color (hex, rgb)
 */
const addBackgroundColor = (color) => {
    if (layer.findOne('.background-color')) {
        layer.findOne('.background-color').fill(color);
    } else {
        const rect = new Konva.Rect({
            name: 'rect background background-color',
            id: 'background-color',
            x: 0,
            y: 0,
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            fill: color,
            listening: false,
        });
        layer.add(rect);
        rect.zIndex(0);
    }
}

/**
 * Show background color or hide it
 * @param {boolean} value - true to show, false to hide
 */
const showBackgroundColor = (value = false) => {
    layer.findOne('.background-color')?.visible(value);
    state.add();
}

/**
 * Set background color to default
 */
function resetBackgroundColor() {
    layer.findOne('.background-color')?.fill('#fff');
    $('#bg-color').val('#ffffff');
    state.add();
}

/**
 * Add function to Konva.Text prototype
 * background color attribute to Text
 * @param {string} color - hex or rgb color 
 */
Konva.Text.prototype.setBgColor = function (value) {
    this.setAttr('backgroundColor', value);
}

/**
 * Handle all Konva.Text transform event
 */
Konva.Text.prototype.on('transform', function () {
    tr.update();
    if (tr.getActiveAnchor() === 'rotater') setCursor('grabbing');

    this.setAttrs({
        width: this.width() * this.scaleX(),
        scaleX: 1,
    });
    setCustomAnchorPosition();
});

/**
 * Handle all Konva.Text transformend event
 */
Konva.Text.prototype.on('transformend', function () {
    resetCursor();
});

/**
 * Add Text to the board
 * @param {object} options - object of options
 * @param {boolean} updateState - update state or not
 */
const addText = (options = {}, updateState = true) => {
    const attrs = {
        id: options.id ?? `text-${useId()}`,
        text: options.text ?? 'Type text',
        x: options.x ?? stage.width() / 2 - 143 / 2,
        y: options.y ?? stage.height() / 2 - 50 / 2,
        rotation: options.rotation ?? 0,
        scaleX: options.scaleX ?? 1,
        scaleY: options.scaleY ?? 1,
        skewX: options.skewX ?? 0,
        skewY: options.skewY ?? 0,
        width: options.width ?? 200,
        height: options.height ?? 'auto',
        textDecoration: options.textDecoration ?? DEFAULT_TEXT_DECORATION,
        align: options.align ?? DEFAULT_ALIGN,
        fontSize: options.fontSize ?? DEFAULT_FONT_SIZE,
        fontStyle: options.fontStyle ?? DEFAULT_FONT_STYLE,
        fontFamily: options.fontFamily ?? DEFAULT_FONT,
        lineHeight: options.lineHeight ?? DEFAULT_LINE_HEIGHT,
        fill: options.fill ?? DEFAULT_COLOR,
        backgroundColor: options.backgroundColor ?? DEFAULT_BG_COLOR,
        locked: options.locked ?? false,
        draggable: options.draggable ?? true,
    }
    const { id, text: myText, x, y, rotation, scaleX, scaleY, skewX, skewY, width, height, textDecoration, align, fontSize, fontStyle, fontFamily, lineHeight, fill, backgroundColor, locked, draggable } = attrs;
    const text = new Konva.Text({
        name: 'text',
        text: myText,
        id,
        x,
        y,
        rotation,
        scaleX,
        scaleY,
        skewX,
        skewY,
        width,
        height,
        textDecoration,
        align,
        fontSize,
        fontStyle,
        fontFamily,
        lineHeight,
        fill,
        locked,
        draggable,
        padding: 10,
        sceneFunc: function (context, node) {
            context.fillStyle = node.getAttr('backgroundColor');
            context.fillRect(0, 0, node.width(), node.height());
            node._sceneFunc(context);
        },
    });
    text.setBgColor(backgroundColor); // Custom function, search setBgColor in this file

    layer.add(text);

    textEditor.setTextNode(text);
    textEditor.show();

    tr.nodes([text]);
    tr.borderEnabled(true);
    text.moveToTop();
    tr.moveToTop();

    enableAnchors(MIDDLE_ANCHORS);
    enableRotater();
    setCustomAnchorPosition();

    currentTarget = text;
    disableStrokes();

    setCorrectLockedClass();
    hideShapeMenu();
    showShapeMenu(text);

    if (updateState) {
        state.add();
    }

    text.on('dragend', function () {
        state.add();
    });

    text.on('dblclick dbltap', function () {
        if (text.getAttr('locked') === true) return;

        // hide text node and transformer:
        this.hide();
        tr.hide();
        hideShapeMenu();
        // create textarea over canvas with absolute position
        // first we need to find position for textarea
        // how to find it?

        // at first lets find position of text node relative to the stage:
        let textPosition = this.absolutePosition();
        // so position of textarea will be the sum of positions above:
        let areaPosition = {
            x: stage.container().offsetLeft + textPosition.x,
            y: stage.container().offsetTop + textPosition.y,
        };

        // create textarea and style it
        let textarea = document.createElement('textarea');
        $(textarea).addClass('textarea-tm');
        $('.mb').append(textarea);

        textarea.value = this.text();
        /**
         * Applying styles to match textarea position and look with
         * canvas Konva.Text element position
         */
        $(textarea).css({
            top: (areaPosition.y - 2) + 'px',
            left: ($('.panel-content.active').length ? areaPosition.x : areaPosition.x + 0.5) + 'px',
            width: `${this.width()}px`,
            height: `${this.height()}px`,
            fontSize: `${this.fontSize()}px`,
            padding: `${this.padding()}px`,
            lineHeight: this.lineHeight(),
            fontFamily: this.fontFamily(),
            textAlign: this.align(),
            color: this.fill(),
            backgroundColor: this.getAttr('backgroundColor'),
            textDecoration: textEditor.textDecoration,
            fontWeight: textEditor.fontStyle.includes('bold') ? 'bold' : 'normal',
            fontStyle: textEditor.fontStyle.includes('italic') ? 'italic' : 'normal',
        });

        let transform = '';
        let rotation = this.rotation();
        if (rotation) {
            transform += `rotateZ(${rotation}deg)`;
        }

        let px = 0;
        // also we need to slightly move textarea on firefox
        // because it jumps a bit
        let isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
        if (isFirefox) {
            px += 2 + Math.round(this.fontSize() / 20);
        }
        transform += `translateY(-${px}px)`;

        $(textarea).css('transform', transform);
        // reset height
        // $(textarea).css('height', 'auto');
        // after browsers resized it we can set actual value
        $(textarea).css('height', `${textarea.scrollHeight}px`);

        textarea.focus();
        textarea.addEventListener('keydown', (e) => textareaKeydownHandler(e, textarea, this));
        setTimeout(() => $(window).on('click', (e) => handleOutsideClick(e, textarea, this)));
    });
}

/**
 * Edit Text
 * @param {object} attrs - attrs for text
 */
const editText = (attrs) => {
    if (Object.keys(attrs).length === 0 || !layer.findOne(`#${attrs.id}`)) return false;

    const node = layer.findOne(`#${attrs.id}`);
    node.id(attrs.id);
    node.text(attrs.text);
    node.x(attrs.x);
    node.y(attrs.y);
    node.rotation(attrs.rotation);
    node.scaleX(attrs.scaleX);
    node.scaleY(attrs.scaleY);
    node.skewX(attrs.skewX);
    node.skewY(attrs.skewY);
    node.width(attrs.width);
    node.height(attrs.height);
    node.textDecoration(attrs.textDecoration);
    node.align(attrs.align);
    node.fontSize(attrs.fontSize);
    node.fontStyle(attrs.fontStyle);
    node.fontFamily(attrs.fontFamily);
    node.lineHeight(attrs.lineHeight);
    node.fill(attrs.fill);
    node.setBgColor(attrs.backgroundColor);
    node.setAttr('locked', attrs.locked);
    node.draggable(attrs.draggable);
}

/**
 * Text Editor font size input event handler
 * @param {Event} e - event 
 */
const onFontSizeInput = (e) => {
    $('.textarea-tm').css('font-size', parseFloat(e.currentTarget.value) + 'px');
    textEditor.setFontSize(e.currentTarget.value);
}

/**
 * Text Editor font size change event handler
 * @param {Event} e - event
 */
const onFontSizeChange = (e) => {
    if (parseFloat(e.currentTarget.value) <= 0) e.currentTarget.value = 1;
    textEditor.setFontSize(e.currentTarget.value);
    state.add();
}
$('.font-size-label').on('input', onFontSizeInput);
$('.font-size-label').on('change', onFontSizeChange);

/**
 * Text Editor line height change event handler
 * @param {Event} e - event
 */
const onLineHeightChange = (e) => {
    if (parseFloat(e.currentTarget.value) <= 0) e.currentTarget.value = 1;
    textEditor.setLineHeight(e.currentTarget.value);
}
$('.line-height-label').on('change', onLineHeightChange);

/**
 * Toggle color picker
 * @param {string} id - id of colorpicker 
 */
const toggleColorPicker = (iconBtnId) => {
    if ($(`#${iconBtnId}`).hasClass('active')) {
        $(`#${iconBtnId}`).removeClass('active');
    } else {
        $(`#${iconBtnId}`).addClass('active');
    }
}

/**
 * Handle text color picker
 * @param {Event} e - event 
 */
const onTextColorPicker = (e) => {
    textEditor.setColor(e.target.value);
    if (e.type === 'change') state.add();
}
$('#text-color-picker').on('input change', onTextColorPicker);

/**
 * Handle text color picker
 * @param {Event} e - event 
 */
const onTextBgColorPicker = (e) => {
    textEditor.setBgColor(e.target.value);
    if (e.type === 'change') state.add();
}
$('#bg-color-picker').on('input change', onTextBgColorPicker);

/**
 * Handle all textarea keydown events
 * @param {Event} e - event
 * @param {HTMLTextAreaElement} textarea - HTML Textarea to handle text writing
 * @param {Konva.Text} textNode - konva text node
 */
const textareaKeydownHandler = (e, textarea, textNode) => {
    textareaOnKeydown1(e, textarea, textNode);
    textareaOnKeydown2(e, textarea, textNode);
}

/**
 * Textarea keydown event handler 1
 * @param {Event} e - event
 * @param {HTMLTextAreaElement} textarea - HTML Textarea to handle text writing
 * @param {Konva.Text} textNode - konva text node
 */
const textareaOnKeydown1 = (e, textarea, textNode) => {
    // hide on enter
    // but don't hide on shift + enter
    if (e.keyCode === 13 && !e.shiftKey) {
        if (textarea.value.trim() === '') return deleteEmptyText(textarea, textNode);
        textNode.text(textarea.value);
        tr.show();
        removeTextarea(textarea, textNode);
        setCustomAnchorPosition();
    }
    // on esc do not set value back to node
    if (e.keyCode === 27) {
        removeTextarea(textarea, textNode);
    }
}

/**
 * Textarea keydown event handler 2
 * @param {Event} e - event
 * @param {HTMLTextAreaElement} textarea - HTML Textarea to handle text writing
 * @param {Konva.Text} textNode - konva text node
 */
const textareaOnKeydown2 = (e, textarea, textNode) => {
    let scale = textNode.getAbsoluteScale().x;
    setTextareaWidth(textNode.width() * scale, textarea, textNode);
    $(textarea).css('height', 'auto');
    $(textarea).css('height', textarea.scrollHeight + textNode.fontSize() + 'px');
}

/**
 * Set textarea correct width
 * @param {number} newWidth - new textarea width 
 * @param {HTMLTextAreaElement} textarea - HTML Textarea to handle text writing
 * @param {Konva.Text} textNode - konva text node
 */
const setTextareaWidth = (newWidth, textarea, textNode) => {
    if (!newWidth) {
        // set width for placeholder
        newWidth = textNode.placeholder.length * textNode.fontSize();
    }
    // some extra fixes on different browsers
    let isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    let isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
    if (isSafari || isFirefox) {
        newWidth = Math.ceil(newWidth);
    }

    let isEdge = document.documentMode || /Edge/.test(navigator.userAgent);
    if (isEdge) {
        newWidth += 1;
    }
    $(textarea).css('width', newWidth + 'px');
}

/**
 * Delete empty text
 * @param {HTMLTextAreaElement} textarea - HTML Textarea to handle text writing
 * @param {Konva.Text} textNode - konva text node
 */
const deleteEmptyText = (textarea, textNode) => {
    removeTextarea(textarea, textNode);
    textNode.destroy();
    textEditor.hide();
    tr.nodes([]);
    state.add();
}

/**
 * Handle outside click from textarea
 * @param {Event} e - event
 * @param {HTMLTextAreaElement} textarea - HTML Textarea to handle text writing
 * @param {Konva.Text} textNode - konva text node
 */
const handleOutsideClick = (e, textarea, textNode) => {
    if (e.target !== textarea) {
        if (textarea.value.trim() === '') return deleteEmptyText(textarea, textNode);

        textNode.text(textarea.value);
        tr.show();
        removeTextarea(textarea, textNode);
        setCustomAnchorPosition();
    }
}

/**
 * Remove textarea
 * @param {HTMLTextAreaElement} textarea - HTML Textarea to handle text writing
 * @param {Konva.Text} textNode - konva text node
 */
const removeTextarea = (textarea, textNode) => {
    $(textarea).off('keydown');
    $(window).off('click');
    textarea.parentNode.removeChild(textarea);
    textNode.show();
    tr.show();
    tr.forceUpdate();
}

/**
 * Disable all borders of elements
 */
const disableStrokes = () => {
    layer.children.forEach((item) => {
        if (item.hasName('image')) {
            item.strokeEnabled(false);
        }
    });
}

/**
 * Disable all border expect of specific element
 * @param {number} id - id of konva.js element
 */
const disableStrokesExpect = (id) => {
    layer.children.forEach((item) => {
        if (item.hasName('image') && item._id !== id) {
            item.strokeEnabled(false);
        }
    });
}

/**
 * Reset Cursor to default
 */
const resetCursor = () => {
    stage.container().style.cursor = 'default';
}

/**
 * Set cursor
 * @param {string} cursor - css cursor name 
 */
const setCursor = (cursor) => {
    stage.container().style.cursor = cursor;
}

/**
 * Prevent canvas elements overflowing the container
 */
const preventOverflow = () => {
    const boxes = tr.nodes().map((node) => node.getClientRect());
    const box = getTotalBox(boxes);
    tr.nodes().forEach((shape) => {
        const absPos = shape.getAbsolutePosition();
        // where are shapes inside bounding box of all shapes?
        const offsetX = box.x - absPos.x;
        const offsetY = box.y - absPos.y;

        // we total box goes outside of viewport, we need to move absolute position of shape
        const newAbsPos = { ...absPos };
        if (box.x < 0) {
            newAbsPos.x = -offsetX;
        }
        if (box.y < 0) {
            newAbsPos.y = -offsetY;
        }
        if (box.x + box.width > stage.width()) {
            newAbsPos.x = stage.width() - box.width - offsetX;
        }
        if (box.y + box.height > stage.height()) {
            newAbsPos.y = stage.height() - box.height - offsetY;
        }
        shape.setAbsolutePosition(newAbsPos);
    });
}

/**
 * Line Guide Stop positions (?)
 * @param {*} skipShape - target shape to skip
 * @return {Object} - vertical and horizontal flats
 */
const getLineGuideStops = (skipShape) => {
    // we can snap to stage borders and the center of the stage
    let vertical = [0, stage.width() / 2, stage.width()];
    let horizontal = [0, stage.height() / 2, stage.height()];

    // and we snap over edges and center of each object on the canvas
    stage.find('.image, .text').forEach((guideItem) => {
        if (guideItem === skipShape) {
            return;
        }
        let box = guideItem.getClientRect();
        // and we can snap to all edges of shapes
        vertical.push([box.x, box.x + box.width, box.x + box.width / 2]);
        horizontal.push([box.y, box.y + box.height, box.y + box.height / 2]);
    });
    return {
        vertical: vertical.flat(),
        horizontal: horizontal.flat(),
    };
}

// what points of the object will trigger to snapping?
// it can be just center of the object
// but we will enable all edges and center
const getObjectSnappingEdges = (node) => {
    let box = node.getClientRect();
    let absPos = node.absolutePosition();

    return {
        vertical: [
            {
                guide: Math.round(box.x),
                offset: Math.round(absPos.x - box.x),
                snap: 'start',
            },
            {
                guide: Math.round(box.x + box.width / 2),
                offset: Math.round(absPos.x - box.x - box.width / 2),
                snap: 'center',
            },
            {
                guide: Math.round(box.x + box.width),
                offset: Math.round(absPos.x - box.x - box.width),
                snap: 'end',
            },
        ],
        horizontal: [
            {
                guide: Math.round(box.y),
                offset: Math.round(absPos.y - box.y),
                snap: 'start',
            },
            {
                guide: Math.round(box.y + box.height / 2),
                offset: Math.round(absPos.y - box.y - box.height / 2),
                snap: 'center',
            },
            {
                guide: Math.round(box.y + box.height),
                offset: Math.round(absPos.y - box.y - box.height),
                snap: 'end',
            },
        ],
    };
}

/**
 * Find all snapping possibilities
 */
const getGuides = (lineGuideStops, itemBounds) => {
    let resultV = [];
    let resultH = [];
    let guides = [];

    lineGuideStops.vertical.forEach((lineGuide) => {
        itemBounds.vertical.forEach((itemBound) => {
            let diff = Math.abs(lineGuide - itemBound.guide);
            // if the distance between guild line and object snap point is close we can consider this for snapping
            if (diff < GUIDELINE_OFFSET) {
                resultV.push({
                    lineGuide: lineGuide,
                    diff: diff,
                    snap: itemBound.snap,
                    offset: itemBound.offset,
                });
            }
        });
    });

    lineGuideStops.horizontal.forEach((lineGuide) => {
        itemBounds.horizontal.forEach((itemBound) => {
            let diff = Math.abs(lineGuide - itemBound.guide);
            if (diff < GUIDELINE_OFFSET) {
                resultH.push({
                    lineGuide: lineGuide,
                    diff: diff,
                    snap: itemBound.snap,
                    offset: itemBound.offset,
                });
            }
        });
    });

    // find closest snap
    let minV = resultV.sort((a, b) => a.diff - b.diff)[0];
    let minH = resultH.sort((a, b) => a.diff - b.diff)[0];
    if (minV) {
        guides.push({
            lineGuide: minV.lineGuide,
            offset: minV.offset,
            orientation: 'V',
            snap: minV.snap,
        });
    }
    if (minH) {
        guides.push({
            lineGuide: minH.lineGuide,
            offset: minH.offset,
            orientation: 'H',
            snap: minH.snap,
        });
    }
    return guides;
}

/**
 * Draw the guide lines, to snap elements
 * @param {Array} guides 
 */
const drawGuides = (guides) => {
    guides.forEach((lg) => {
        if (lg.orientation === 'H') {
            let line = new Konva.Line({
                points: [-6000, 0, 6000, 0],
                stroke: BLUE,
                strokeWidth: 1,
                name: 'guid-line',
                dash: [4, 6],
            });
            layer.add(line);
            line.absolutePosition({
                x: 0,
                y: lg.lineGuide,
            });
        } else if (lg.orientation === 'V') {
            let line = new Konva.Line({
                points: [0, -6000, 0, 6000],
                stroke: BLUE,
                strokeWidth: 1,
                name: 'guid-line',
                dash: [4, 6],
            });
            layer.add(line);
            line.absolutePosition({
                x: lg.lineGuide,
                y: 0,
            });
        }
    });
}

/**
 * ...
 * @param {number} pivotX 
 * @param {number} pivotY 
 * @param {number} diffX 
 * @param {number} diffY 
 * @param {number} angle 
 * @return {Object}
 */
const getCorner = (pivotX, pivotY, diffX, diffY, angle) => {
    const distance = Math.sqrt(diffX * diffX + diffY * diffY);

    /// find angle from pivot to corner
    angle += Math.atan2(diffY, diffX);

    /// get new x and y and round it off to integer
    const x = pivotX + distance * Math.cos(angle);
    const y = pivotY + distance * Math.sin(angle);

    return { x: x, y: y };
}

/**
 * Get client rect options
 * @param {Object} rotatedBox - Client Rect options
 * @return object with client rect options
 */
const getClientRect = (rotatedBox) => {
    const { x, y, width, height } = rotatedBox;
    const rad = rotatedBox.rotation;

    const p1 = getCorner(x, y, 0, 0, rad);
    const p2 = getCorner(x, y, width, 0, rad);
    const p3 = getCorner(x, y, width, height, rad);
    const p4 = getCorner(x, y, 0, height, rad);

    const minX = Math.min(p1.x, p2.x, p3.x, p4.x);
    const minY = Math.min(p1.y, p2.y, p3.y, p4.y);
    const maxX = Math.max(p1.x, p2.x, p3.x, p4.x);
    const maxY = Math.max(p1.y, p2.y, p3.y, p4.y);

    return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
    };
}

/**
 * Get client rects of nodes
 * @param {Array} boxes - nodes
 * @return {Object}
 */
const getTotalBox = (boxes) => {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    boxes.forEach((box) => {
        minX = Math.min(minX, box.x);
        minY = Math.min(minY, box.y);
        maxX = Math.max(maxX, box.x + box.width);
        maxY = Math.max(maxY, box.y + box.height);
    });

    return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
    };
}

/**
 * Get User Moodboards or Collections
 * @param {string} type - moodboards or collections
 */
const getUserItems = async (type) => {
    const data = {
        type,
        user_hash: dle_login_hash
    }
    const onSuccess = (data) => {
        ZEELalert(data.content, 'Information', 'user-items', 1500);
    }

    await ajaxRequest('getuseritems', 'GET', data, 'json', onSuccess);
}

/**
 * Get selected moodboard/collection
 * @param {number | string} itemId - moodboard/collection ID
 * @param {string} type - moodboards or collections
 */
const getSingleItem = async (itemId, type) => {
    const data = {
        itemId,
        type,
        user_hash: dle_login_hash
    }
    const onSuccess = (result) => {
        const { data, panel_content: panelContent, error } = result;

        if (error) {
            ZEELalert(error, 'Error', 'user-items');
            return;
        }

        // Adding news information to global MB_DATA variable
        MB_DATA.itemId = data.itemId;
        MB_DATA.title = data.title;
        MB_DATA.news = data.news;
        MB_DATA.newsIds = data.news_ids;

        buildPanelContent('#panel-models', panelContent.models);
        togglePanel('models');

        $('.addnews-menu-wrapper').remove();
        $('#moodboard').removeClass('hide');
        $('#zeelpopup').dialog('close');
    }

    await ajaxRequest('getsingleitem', 'GET', data, 'json', onSuccess);
}

/**
 * Build Panel Content
 * @param {string} panelId - Panel HTML ID
 * @param {HTMLElement} panelContent - HTML Content of panel
 */
const buildPanelContent = (panelId, panelContent) => (panelId && panelContent) ? $(panelId).append(panelContent) : ZEELalert('Panel ID or Content is not provided.', 'Error', 'panel-error');

/**
 * Toggle Panel
 * @param {string} panel - Panel Name
 */
const togglePanel = (panel) => {
    if ($(`[data-panel='${panel}']`).hasClass('active')) {
        $(`[data-panel='${panel}'], [data-panel-item='${panel}']`).removeClass('active');
    } else {
        $('[data-panel], [data-panel-item]').removeClass('active');
        $(`[data-panel='${panel}'], [data-panel-item='${panel}']`).addClass('active');
    }
}

/**
 * Calculate correct position for tooltip
 * @param {object} elementBox - element (to be applied tooltip) bounding rect
 * @param {string} position - tooltip position
 * @param {object} offset = tooltip x and y distance from element
 * @returns {object} top and left coordinates for tooltip
 */
const calculateTooltipPosition = (elementBox, position, offset = { x: 8, y: 8 }) => {
    const tooltip = $('.tooltip').get(0);
    const tooltipBox = tooltip.getBoundingClientRect();
    let top = 'auto';
    let left = 'auto';

    if (position === 'bottom') {
        top = elementBox.top + elementBox.height + offset.y;
        left = elementBox.left + window.scrollX + elementBox.width / 2 - tooltip.offsetWidth / 2;
    } else if (position === 'right') {
        top = elementBox.top + window.scrollY + elementBox.height / 2 - tooltip.offsetHeight / 2;
        left = elementBox.left + elementBox.width + offset.x;
    } else if (position === 'left') {
        top = elementBox.top + window.scrollY + elementBox.height / 2 - tooltip.offsetHeight / 2;
        left = elementBox.left - tooltipBox.width - offset.x;
    } else if (position === 'top') {
        top = elementBox.top - tooltipBox.height - offset.y;
        left = elementBox.left + window.scrollX + elementBox.width / 2 - tooltip.offsetWidth / 2;
    }

    return { top, left }
}

/**
 * Set Tooltip for element
 * @param {string} text - text for tooltip
 * @param {HTMLElement} el - HTML Element
 * @param {string} position - tooltip position
*/
const showTooltip = (el, text, position = 'bottom', offsetX = 8, offsetY = 8) => {
    $('.tooltip').attr('data-position', position);
    $('.tooltip').text(text);

    const box = $(el).get(0).getBoundingClientRect();
    const { top, left } = calculateTooltipPosition(box, position, { x: offsetX, y: offsetY });

    $('.tooltip').css({ top, left });
    delay(201).then(() => $('.tooltip').addClass('active'));
}

/**
 * Hide Tooltip
 */
const hideTooltip = () => {
    delay(201).then(() => $('.tooltip').removeClass('active'));
}

/**
 * Calculate correct position for menu options
 * @param {Konva.Shape} node - Konva Image or Text
 */
const calculateMenuPosition = (node) => {
    let nodeProps = { ...node.size(), ...node.getAbsolutePosition(), rotation: node.getRotation() };
    let menuType = node.name();
    let rotater = tr.findOne('.rotater-icon');
    let { x, y } = rotater.getAbsolutePosition();
    let top =
        nodeProps.rotation > 90 ||
            (nodeProps.rotation < -90 && nodeProps.rotation >= -180)
            ? y + 50
            : y - 50;
    let left =
        Math.floor(nodeProps.rotation) === -180
            ? nodeProps.x - (nodeProps.width / 2)
            : x + (18 / 2) - 3;

    $(`#${menuType}-menu`).css({ top, left });

    // Get the dimensions of the canvas
    const canvasSizes = {
        width: $('canvas').get(0).width,
        height: $('canvas').get(0).height,
    }
    const menuBox = {
        top: $(`#${menuType}-menu`).get(0).offsetTop,
        left: $(`#${menuType}-menu`).get(0).offsetLeft,
        width: $(`#${menuType}-menu`).get(0).offsetWidth,
        height: $(`#${menuType}-menu`).get(0).offsetHeight
    }

    if (
        menuBox.left < 0 ||
        menuBox.top < 0 ||
        menuBox.left + menuBox.width > canvasSizes.width ||
        menuBox.top + menuBox.height > canvasSizes.height
    ) selectCalculationStrategy(menuType, nodeProps, canvasSizes, menuBox);
}

/**
 * Decide which function need to be used for calculation
 * @param {string} menuType - image or text
 * @param {object} nodeProps - node width, height etc...
 * @param {object} canvasSizes - canvas sizes
 * @param {object} menuBox - client rect of menu
 */
const selectCalculationStrategy = (menuType, nodeProps, canvasSizes, menuBox) =>
    menuType === 'image'
        ? calculateImageMenuOverflow(menuType, nodeProps, canvasSizes, menuBox)
        : calculateTextMenuOverflow(menuType, nodeProps, canvasSizes, menuBox);

/**
 * Calculate Image Menu Overflow
 * @param {string} menuType - image or text
 * @param {object} nodeProps - node width, height etc...
 * @param {object} canvasSizes - canvas sizes
 * @param {object} menuBox - client rect of menu
 */
const calculateImageMenuOverflow = (menuType, nodeProps, canvasSizes, menuBox) => {
    let top, left, isOverflowed = false;

    if (nodeProps.width !== nodeProps.height) nodeProps.height = nodeProps.width;

    if (tr.nodes().length > 1) {
        nodeProps = {
            width: tr.width(),
            height: tr.height(),
            x: tr.x(),
            y: tr.y(),
        }
    }

    if (menuBox.left < 0) {
        // Overflowing from left
        top = nodeProps.y - (nodeProps.height / 2);
        left = nodeProps.x + (nodeProps.width + 50);
        isOverflowed = true;
    } else if (menuBox.top < 0) {
        // Overflowing from top
        top = nodeProps.y + (nodeProps.height + 50);
        left = nodeProps.x + (nodeProps.width / 2);
        isOverflowed = true;
    } else if (menuBox.left + menuBox.width > canvasSizes.width) {
        // Overflowing from right
        top = nodeProps.y + (nodeProps.height / 2);
        left = nodeProps.x - (nodeProps.width + 50);
        isOverflowed = true;
    } else if (menuBox.top + menuBox.height > canvasSizes.height) {
        // Overflowing from bottom
        top = nodeProps.y - (nodeProps.height + 50);
        left = nodeProps.x - (nodeProps.width / 2);
        isOverflowed = true;
    }

    if (isOverflowed) $(`#${menuType}-menu`).css({ top, left });
}

/**
 * Calculate Text Menu Overflow
 * @param {string} menuType - image or text
 * @param {object} nodeProps - node width, height etc...
 * @param {object} canvasSizes - canvas sizes
 * @param {object} menuBox - client rect of menu
 */
const calculateTextMenuOverflow = (menuType, nodeProps, canvasSizes, menuBox) => {
    let top, left, isOverflowed = false;
    if (menuBox.left < 0) {
        // Overflowing from left
        top = nodeProps.y - (nodeProps.width / 2);
        left = nodeProps.x + (nodeProps.height + 50);
        isOverflowed = true;
    } else if (menuBox.top < 0) {
        // Overflowing from top
        top = nodeProps.y + (nodeProps.height + 50);
        left = nodeProps.x + (nodeProps.width / 2);
        isOverflowed = true;
    } else if (menuBox.left + menuBox.width > canvasSizes.width) {
        // Overflowing from right
        top = nodeProps.y + (nodeProps.width / 2);
        left = nodeProps.x - (nodeProps.height + 50);
        isOverflowed = true;
    } else if (menuBox.top + menuBox.height > canvasSizes.height) {
        // Overflowing from bottom
        top = nodeProps.y - (nodeProps.height + 50);
        left = nodeProps.x - (nodeProps.width / 2);
        isOverflowed = true;
    }

    if (isOverflowed) $(`#${menuType}-menu`).css({ top, left });
}

/**
 * Show Shape Menu
 * @param {Konva.Shape} node - Konva shape
 */
const showShapeMenu = (node = tr.nodes()[0]) => {
    if (!node) return false;

    let menuType = node.name();
    $(`#${menuType}-menu`).addClass('active');
    calculateMenuPosition(node);
    isMenuOpened = true;
}

/**
 * Hide Shape Menu
 */
const hideShapeMenu = () => {
    isMenuOpened = false;
    $('.shape-menu').removeClass('active');
}

/**
 * Delete selected nodes
 * @param {Event} e
 */
const deleteSelectedNodes = (e) => {
    e.stopPropagation();

    if (tr.nodes().length) {
        tr.nodes().forEach(node => node.destroy());
        textEditor.hide();
        hideShapeMenu();
        tr.nodes([]);
        tr.forceUpdate();
        resetCursor();
        state.add();
    }
}

/**
 * Lock Node
 * @param {Event} e
 */
const lockNodes = (e) => {
    e.stopPropagation();

    if (tr.nodes().length) {
        tr.nodes().forEach(node => {
            if (node?.getAttr('locked') === true) {
                node.draggable(true);
                node.setAttr('locked', false);
            } else {
                node.draggable(false);
                node.setAttr('locked', true);
            }
        });
        setCorrectLockedClass();

        if (tr.nodes()[0].getAttr('locked') === true) {
            disableRotater();
            disableAnchors();
        } else {
            enableRotater();
            enableAnchors(pickRightAnchors(tr.nodes()[0]));
        }
        state.add();
    }
}

/**
 * Set active class if the chosen nodes are locked
 */
const setCorrectLockedClass = () => {
    const menuElems = $('[data-menu-action="lock"]');
    if (tr.nodes()[0]?.getAttr('locked') === true) {
        $(menuElems).addClass('active')
    } else {
        $(menuElems).removeClass('active');
    }
}

/**
 * Set delay for doing anything
 * @param {number} ms - miliseconds
 * @return {Promise}
 * @usage - delay(300).then(() => { your code... })
 * OR use it with async/await
 */
const delay = (ms = 500) => new Promise(resolve => setTimeout(() => resolve(), ms));

/**
 * Create new unique id
 * @returns {number} new id
 */
const useId = _ => ++id;

/**
 * Check if any promise is pending
 * @returns {boolean} - if any promise is pending
 */
const isPromisePending = () => allPromises.size !== 0;