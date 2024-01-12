/**
 * Send Ajax request
 * @param {string} ajaxFileName - ajax filename in /engine/ajax/ folder
 * @param {string} type - send method (GET, POST)
 * @param {object} data - object of data to sent
 * @param {string} dataType - returned data type of "success" handler
 * @param {function} successHandler - handle success
 * @param {function} errorHandler - handle error
 * @param {function} beforeSendHanlder - handle beforeSend
 */
export async function ajaxRequest(ajaxFileName, type, data, dataType = '', successHandler = () => true, beforeSendHanlder = () => true) {
    if (!ajaxFileName || !type || !data) {
        ZEELalert('All required data need to be provided!', 'Error', 'ajax-error');
    } else {
        await $.ajax({
            url: `${dle_root}engine/ajax/controller.php?mod=${ajaxFileName}`,
            type,
            data,
            dataType,
            beforeSend: beforeSendHanlder,
            success: successHandler,
            error: (err) => {
                ZEELalert(err.responseText, 'Error', 'ajax-error');
            }
        });
    }
}

export function modal(block, width) {
    $(function () {
        $('#' + block).dialog({
            autoOpen: true,
            modal: true,
            width: width,
            show: 'fade',
            resizable: false,
            draggable: false,
            dialogClass: block,
            position: {
                my: "center center",
                at: "center center",
                of: window
            },
            open: function () {
                $('.ui-widget-overlay').on('click', function () {
                    $(".ui-dialog-titlebar-close").trigger("click");
                });
            },
        });

        $('.modalfixed.ui-dialog').css({ position: "fixed" });
        return false;
    });
}

export function ZEELalert(message, title, classname, width = 470) {
    $("#zeelpopup").remove();
    $("body").append(`<div id="zeelpopup" class="zeel-alert" title="${title}" style="display:none">${message}</div>`);

    const popup = $('#zeelpopup').dialog({
        autoOpen: true,
        modal: true,
        width,
        show: 'fade',
        resizable: false,
        draggable: false,
        dialogClass: `modalfixed zeel-popup-alert ${classname}`,
        position: {
            my: "center center",
            at: "center center",
            of: window
        },
        open: function () {
            $('.ui-widget-overlay, .close_popup').on('click', function () {
                popup.dialog('close');
            });
            $("html").addClass('overlay-open');
        },
        create: function () {
            $("html").addClass('overlay-open');
        },
        beforeClose: function () {
            $("html").removeClass('overlay-open');
            $("#zeelpopup").remove();
        }
    });

    $('.modalfixed.ui-dialog').css({ position: "fixed" });
};