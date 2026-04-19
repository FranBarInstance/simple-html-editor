/*!
 * Simple HTML Editor v2.0.1 - Head Dialog Module
 * Head section editing dialog
 *
 * @author FranBarInstance
 * @license MIT
 * @version 2.0.1
 */

(function () {
    /**
     * Renders the head section editing dialog
     * Creates and returns a dialog for editing HTML document head properties
     */
    ncSimpleHtmlEditor.prototype.renderDialogHead = function () {
        var dialogHead =
            '<dialog id="ncsedt-dialog-head" class="ncsedt-dialog">' +
            '    <div class="ncsedt-btns">' +
            '       <div class="ncsedt-btns-left">' +
            '           <button type="button" class="sbutton dragger"><img class="" src="' + this.options.draggerIcon + '" title="Move"> <span id="ncsedt-dialog-title">Edit head</span></button>' +
            '       </div>' +
            '       <div class="ncsedt-btns-right">' +
            '           <button type="button" class="sbutton cancel"> <b>&Cross;</b> </button>' +
            '       </div>' +
            '   </div>' +
            '   <div class="body">' +
            '       <label for="ncsedt-dialog-head-title">Title:</label>' +
            '       <input id="ncsedt-dialog-head-title" class="title sbutton" type="text">' +
            '       <div class="separator"></div>' +
            '       <label for="ncsedt-dialog-head-description">Description:</label>' +
            '       <textarea id="ncsedt-dialog-head-description" rows="3" class="description sbutton" placeholder=" ( empty ) "></textarea>' +
            '       <div class="separator"></div>' +
            '       <div class="edit-all" style="display: none">' +
            '           <label for="ncsedt-dialog-head-all">Edit source code:</label>' +
            '           <textarea id="ncsedt-dialog-head-all" rows="3" class="all sbutton" placeholder=" ( empty ) "></textarea>' +
            '       </div>' +
            '   </div>' +
            '   <div class="ncsedt-btns">' +
            '       <div class="ncsedt-btns-left">' +
            '           <button type="button" class="sbutton show-all"><img class="" src="' + this.options.buttons.code.icon + '" title="Edit code"> Edit all</button>' +
            '       </div>' +
            '       <div class="ncsedt-btns-right">' +
            '           <button type="button" class="sbutton ko">&Cross;</button>' +
            '           <button type="button" class="sbutton confirm">&check; Ok</button>' +
            '       </div>' +
            '   </div>' +
            '</dialog>';

        this.container.insertAdjacentHTML('beforeend', dialogHead);

        return document.getElementById('ncsedt-dialog-head');
    };

    /**
     * Sets up event handlers for the head editing dialog
     */
    ncSimpleHtmlEditor.prototype.setEventsDialogHead = function () {
        var _this = this;

        document.querySelector("#ncsedt-dialog-head .cancel").addEventListener('click', function () {
            _this.dialogHead.close();
        });

        document.querySelector("#ncsedt-dialog-head .ko").addEventListener('click', function () {
            _this.dialogHead.close();
        });

        document.querySelector("#ncsedt-dialog-head .show-all").addEventListener('click', function () {
            if (_this.dialogHead.querySelector('#ncsedt-dialog-head .edit-all').style.display == "none") {
                _this.dialogHead.querySelector('#ncsedt-dialog-head .edit-all').style.display = 'inline-block';
            } else {
                _this.dialogHead.querySelector('#ncsedt-dialog-head .edit-all').style.display = 'none';
            }
        });

        document.querySelector("#ncsedt-dialog-head .confirm").addEventListener('click', function () {
            _this.editHeadConfirm();
        });
    };

    /**
     * Opens and initializes the head editing dialog
     */
    ncSimpleHtmlEditor.prototype.editHead = function () {
        if (!this.editingEnabled) {
            return;
        }

        if (document.head.querySelector('meta[name="description"]')) {
            var description = document.head.querySelector('meta[name="description"]').getAttribute("content");
        } else {
            var description = '';
        }

        this.dialogHead.querySelector('#ncsedt-dialog-head-title').value = document.title || 'Untitled';
        this.dialogHead.querySelector('#ncsedt-dialog-head-description').value = description;
        this.dialogHead.querySelector('#ncsedt-dialog-head-all').value = document.head.innerHTML;

        if (!this.dialogHead.open) {
            this.dialogHead.showModal();
        }
    };

    /**
     * Confirms and applies changes from the head editing dialog
     */
    ncSimpleHtmlEditor.prototype.editHeadConfirm = function () {
        if (this.dialogHead.open) {
            this.dialogHead.close();
        }

        if (!this.editingEnabled) {
            return;
        }

        if (document.head.querySelector('meta[name="description"]')) {
            var description = document.head.querySelector('meta[name="description"]').getAttribute("content");
        } else {
            var description = '';
        }

        var newtitle = this.dialogHead.querySelector('#ncsedt-dialog-head-title').value;
        var newdescription = this.dialogHead.querySelector('#ncsedt-dialog-head-description').value;
        var newhead = this.dialogHead.querySelector('#ncsedt-dialog-head-all').value
        var oldtitle = document.title;
        var oldescription = description;
        var oldhead = document.head.innerHTML;

        if (newhead != oldhead) {
            document.head.innerHTML = newhead;
        }

        if (newtitle != oldtitle) {
            document.title = newtitle;
        }

        if (newdescription != oldescription) {
            if (!document.head.querySelector('meta[name="description"]')) {
                var meta = document.createElement('meta');
                meta.setAttribute("name", "description");
                document.head.appendChild(meta);
            }

            this.historyForcePush('content', newdescription);
            document.head.querySelector('meta[name="description"]').setAttribute("content", newdescription);
        }
    };
})();
