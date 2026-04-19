/*!
 * Simple HTML Editor - Image Dialog Module
 * Image editing dialog
 *
 * https://github.com/FranBarInstance/simple-html-edit
 */

(function () {
    /**
     * Renders the image editing dialog
     * Creates and returns a dialog for editing image properties and attributes
     */
    ncSimpleHtmlEditor.prototype.renderDialogImage = function () {
        var _this = this;
        var dialogImage =
            '<dialog id="ncsedt-dialog-image" class="ncsedt-dialog">' +
            '    <div class="ncsedt-btns">' +
            '       <div class="ncsedt-btns-left">' +
            '           <button type="button" class="sbutton dragger"><img class="" src="' + this.options.draggerIcon + '" title="Move"> <span id="ncsedt-dialog-image-title">Edit image</span></button>' +
            '       </div>' +
            '       <div class="ncsedt-btns-right">' +
            '           <button type="button" class="sbutton cancel"> <b>&Cross;</b> </button>' +
            '       </div>' +
            '   </div>' +
            '   <div class="body">' +
            '       <div class="preview">' +
            '           <img class="image" src="' + this.options.buttons.image.icon + '">' +
            '           <button id="ncsedt-dialog-image-upload" type="button" class="upload sbutton">&UpArrowBar; Upload</button>' +
            '           <input id="ncsedt-dialog-image-file" class="file" accept="image/*" type="file" />' +
            '       </div>' +
            '       <label for="ncsedt-dialog-image-src">Image URL:</label>' +
            '       <input id="ncsedt-dialog-image-src" class="src sbutton" type="text">' +
            '       <div class="separator"></div>' +
            '       <label for="ncsedt-dialog-image-alt">Alt. text:</label>' +
            '       <input id="ncsedt-dialog-image-alt" class="alt sbutton" type="text">' +
            '       <div class="separator"></div>' +
            '       <input size="3" id="ncsedt-dialog-image-width" class="width sbutton" type="text" placeholder="auto">' +
            '       <button type="button" class="sbutton style-width" value="100%">&longleftrightarrow;</button>' +
            '       <button type="button" class="sbutton style-width" value="50%">50%</button>' +
            '       <button type="button" class="sbutton style-width" value="25%">25%</button>' +
            '       <button type="button" class="sbutton style-width" value="">&circlearrowleft;</button>' +
            '       <div class="separator"></div>' +
            '       <input size="3" id="ncsedt-dialog-image-height" class="height sbutton style-height" type="text" placeholder="auto">' +
            '       <button type="button" class="sbutton style-height" value="100%">&UpDownArrow;</button>' +
            '       <button type="button" class="sbutton style-height" value="">&circlearrowleft;</button>' +
            '       <div class="separator"></div>' +
            '       <input size="3" id="ncsedt-dialog-image-float" class="float sbutton style-float" type="text" placeholder="no">' +
            '       <button type="button" class="sbutton style-float" value="left">&looparrowleft;</button>' +
            '       <button type="button" class="sbutton style-float" value="right">&looparrowright;</button>' +
            '       <button type="button" class="sbutton style-float" value="">&circlearrowleft;</button>' +
            '       <div class="separator"></div>' +
            '       <input size="3" id="ncsedt-dialog-image-padding" class="padding sbutton style-padding" type="text" placeholder="no">' +
            '       <button type="button" class="sbutton style-padding" value="10px">&sdotb;</button>' +
            '       <button type="button" class="sbutton style-padding" value="">&circlearrowleft;</button>' +
            '       <div class="image-remove">' +
            '           <div class="separator"></div>' +
            '           <label for="ncsedt-dialog-image-remove">Remove image:</label>' +
            '           <input id="ncsedt-dialog-image-remove" class="remove" type="checkbox">' +
            '       </div>' +
            '   </div>' +
            '   <div class="ncsedt-btns">' +
            '       <div class="ncsedt-btns-left">' +
            '           <button type="button" class="sbutton parent" title="Find parent">&Uparrow;</button>' +
            '           <button type="button" class="sbutton child" title="Find child">&Downarrow;</button>' +
            '           <button type="button" class="sbutton code"><img class="" src="' + this.options.buttons.code.icon + '" ></button>' +
            '           <button type="button" class="sbutton link"><img class="" src="' + this.options.buttons.link.icon + '" title="Edit link"></button>' +
            '       </div>' +
            '       <div class="ncsedt-btns-right">' +
            '           <button type="button" class="sbutton ko">&Cross;</button>' +
            '           <button type="button" class="sbutton confirm">&check; Ok</button>' +
            '       </div>' +
            '   </div>' +
            '</dialog>';

        this.container.insertAdjacentHTML('beforeend', dialogImage);

        return document.getElementById('ncsedt-dialog-image');
    };

    /**
     * Sets up event handlers for the image editing dialog
     */
    ncSimpleHtmlEditor.prototype.setEventsDialogImage = function () {
        var _this = this;

        document.querySelector("#ncsedt-dialog-image .cancel").addEventListener('click', function () {
            _this.dialogImage.close();
        });

        document.querySelector("#ncsedt-dialog-image .ko").addEventListener('click', function () {
            _this.dialogImage.close();
        });

        document.querySelector("#ncsedt-dialog-image .confirm").addEventListener('click', function () {
            _this.editImageConfirm();
        });

        document.querySelector("#ncsedt-dialog-image .parent").addEventListener('click', function () {
            _this.editImageParent();
        });

        document.querySelector("#ncsedt-dialog-image .child").addEventListener('click', function () {
            _this.editImageChild();
        });

        document.querySelector("#ncsedt-dialog-image .code").addEventListener('click', function () {
            if (_this.dialogImage.open) {
                _this.dialogImage.close();
            }

            _this.command(_this.options.buttons.code)
        });

        document.querySelector("#ncsedt-dialog-image .link").addEventListener('click', function () {
            if (_this.dialogImage.open) {
                _this.dialogImage.close();
            }

            _this.command(_this.options.buttons.link)
        });

        document.querySelector("#ncsedt-dialog-image .upload").addEventListener('click', function () {
            document.querySelector("#ncsedt-dialog-image-file").dispatchEvent(new MouseEvent("click"));
        });

        document.querySelector("#ncsedt-dialog-image-file").addEventListener('change', function (e) {
            if (this.files[0].size > _this.options.maxImageSizeBytes) {
                var inMb = (_this.options.maxImageSizeBytes / 1024 / 1024).toFixed(1);
                alert("File is too big! " + inMb + "MB. max. (Use .webp format)");
                this.value = "";

                return false;
            };

            var reader = new window.FileReader();
            reader.readAsDataURL(this.files[0]);
            reader.onloadend = function () {
                _this.dialogImage.querySelector('#ncsedt-dialog-image .image').src = reader.result;
                _this.dialogImage.querySelector('#ncsedt-dialog-image .src').value = 'data:image/...';
            }
        });

        document.querySelectorAll("#ncsedt-dialog-image button.style-width").forEach(function (element) {
            element.addEventListener('click', function (evt) {
                _this.dialogImage.querySelector('#ncsedt-dialog-image-width').value = evt.target.value;
            });
        });

        document.querySelectorAll("#ncsedt-dialog-image button.style-height").forEach(function (element) {
            element.addEventListener('click', function (evt) {
                _this.dialogImage.querySelector('#ncsedt-dialog-image-height').value = evt.target.value;
            });
        });

        document.querySelectorAll("#ncsedt-dialog-image button.style-float").forEach(function (element) {
            element.addEventListener('click', function (evt) {
                _this.dialogImage.querySelector('#ncsedt-dialog-image-float').value = evt.target.value;
                if (evt.target.value) {
                    _this.dialogImage.querySelector('#ncsedt-dialog-image-padding').value = '10px';
                } else {
                    _this.dialogImage.querySelector('#ncsedt-dialog-image-padding').value = '';
                }
            });
        });

        document.querySelectorAll("#ncsedt-dialog-image button.style-padding").forEach(function (element) {
            element.addEventListener('click', function (evt) {
                _this.dialogImage.querySelector('#ncsedt-dialog-image-padding').value = evt.target.value;
            });
        });
    };

    /**
     * Opens and initializes the image editing dialog
     */
    ncSimpleHtmlEditor.prototype.editImage = function () {
        if (!this.editingEnabled) {
            return;
        }

        if (this.focusedElement.parentElement.tagName == 'IMG') {
            this.editImageParent();
        }

        if (this.focusedElement.firstElementChild && this.focusedElement.lastElementChild) {
            if (this.focusedElement.firstElementChild.tagName == 'IMG' && this.focusedElement.lastElementChild.tagName == 'IMG') {
                this.editImageChild();
            }
        }

        this.currentSelection = window.getSelection();
        this.currentRange = this.currentSelection.getRangeAt(0);
        this.dialogImage.querySelector('#ncsedt-dialog-image-remove').checked = false;

        if (this.focusedElement.tagName == 'IMG') {

            /*
                Edit existing
            */
            var style = window.getComputedStyle(this.focusedElement);

            this.dialogImage.querySelector('#ncsedt-dialog-image-title').innerHTML = 'Image (Edit)';
            this.dialogImage.querySelector('.preview img').src = this.focusedElement.src;

            if (this.focusedElement.getAttribute('src').startsWith("data:image/")) {
                this.dialogImage.querySelector('#ncsedt-dialog-image-src').value = 'data:image/...'
            } else {
                this.dialogImage.querySelector('#ncsedt-dialog-image-src').value = this.focusedElement.getAttribute('src');
            }

            this.dialogImage.querySelector('#ncsedt-dialog-image-alt').value = this.focusedElement.getAttribute('alt');
            this.dialogImage.querySelector('#ncsedt-dialog-image-width').value = this.focusedElement.style.width;
            this.dialogImage.querySelector('#ncsedt-dialog-image-height').value = this.focusedElement.style.height;
            this.dialogImage.querySelector('#ncsedt-dialog-image-float').value = this.focusedElement.style.float;
            this.dialogImage.querySelector('#ncsedt-dialog-image-padding').value = this.focusedElement.style.padding;
            this.dialogImage.querySelector('#ncsedt-dialog-image .image-remove').style.visibility = "visible";
        } else {

            /*
                Edit new
            */
            this.dialogImage.querySelector('#ncsedt-dialog-image-title').innerHTML = 'Image (CREATE)';
            this.dialogImage.querySelector('.preview img').src = this.options.buttons.image.icon;
            this.dialogImage.querySelector('#ncsedt-dialog-image-src').value = '';
            this.dialogImage.querySelector('#ncsedt-dialog-image-alt').value = '';
            this.dialogImage.querySelector('#ncsedt-dialog-image-width').value = '';
            this.dialogImage.querySelector('#ncsedt-dialog-image-height').value = '';
            this.dialogImage.querySelector('#ncsedt-dialog-image-float').value = '';
            this.dialogImage.querySelector('#ncsedt-dialog-image-padding').value = '';
            this.dialogImage.querySelector('#ncsedt-dialog-image .image-remove').style.visibility = "hidden";
        }

        if (!this.dialogImage.open) {
            this.dialogImage.showModal();
        }
    };

    /**
     * Confirms and applies changes from the image editing dialog
     */
    ncSimpleHtmlEditor.prototype.editImageConfirm = function () {
        if (this.dialogImage.open) {
            this.dialogImage.close();
        }

        if (!this.editingEnabled) {
            return;
        }

        if (!this.focusedElement.isContentEditable) {
            return;
        }

        if (this.focusedElement.tagName == 'IMG') {
            if (this.dialogImage.querySelector('#ncsedt-dialog-image-remove').checked) {
                this.focusedElement.outerHTML = this.focusedElement.innerHTML;
            } else {
                this.editImageConfirmExisting();
            }
        } else {
            this.editImageConfirmNew();
        }
    };

    /**
     * Applies changes to an existing image in the editor
     */
    ncSimpleHtmlEditor.prototype.editImageConfirmExisting = function () {
        var newsrc = this.dialogImage.querySelector('#ncsedt-dialog-image-src').value;
        var newalt = this.dialogImage.querySelector('#ncsedt-dialog-image-alt').value;
        var newwidth = this.dialogImage.querySelector('#ncsedt-dialog-image-width').value;
        var newheight = this.dialogImage.querySelector('#ncsedt-dialog-image-height').value;
        var newfloat = this.dialogImage.querySelector('#ncsedt-dialog-image-float').value;
        var newpadding = this.dialogImage.querySelector('#ncsedt-dialog-image-padding').value;
        var oldsrc = this.focusedElement.getAttribute('src');
        var oldalt = this.focusedElement.getAttribute('alt');
        var oldwidth = this.focusedElement.style.width;
        var oldheight = this.focusedElement.style.height;
        var oldfloat = this.focusedElement.style.float;
        var oldpadding = this.focusedElement.style.padding;

        if (newwidth && !isNaN(newwidth)) {
            newwidth += '%';
        }

        if (newheight && !isNaN(newheight)) {
            newheight += '%';
        }

        if (newpadding && !isNaN(newpadding)) {
            newpadding += 'px';
        }

        if (oldsrc != newsrc) {
            if (newsrc == 'data:image/...') {
                newsrc = this.dialogImage.querySelector('#ncsedt-dialog-image .image').src;
            }

            this.historyForcePush('src', newsrc);
            this.focusedElement.setAttribute('src', newsrc);
        }

        if (oldalt != newalt) {
            this.historyForcePush('alt', newalt);
            this.focusedElement.setAttribute('alt', newalt);
        }

        if (oldwidth != newwidth) {
            this.focusedElement.style.width = newwidth;
            this.historyForcePush('style', this.focusedElement.style.cssText);
        }

        if (oldheight != newheight) {
            this.focusedElement.style.height = newheight;
            this.historyForcePush('style', this.focusedElement.style.cssText);
        }

        if (oldfloat != newfloat) {
            this.focusedElement.style.float = newfloat;
            this.historyForcePush('style', this.focusedElement.style.cssText);
        }

        if (oldpadding != newpadding) {
            this.focusedElement.style.padding = newpadding;
            this.historyForcePush('style', this.focusedElement.style.cssText);
        }
    };

    /**
     * Inserts a new image into the editor
     */
    ncSimpleHtmlEditor.prototype.editImageConfirmNew = function () {
        var newsrc = this.dialogImage.querySelector('#ncsedt-dialog-image-src').value;
        var newalt = this.dialogImage.querySelector('#ncsedt-dialog-image-alt').value;
        var newwidth = this.dialogImage.querySelector('#ncsedt-dialog-image-width').value;
        var newheight = this.dialogImage.querySelector('#ncsedt-dialog-image-height').value;
        var newfloat = this.dialogImage.querySelector('#ncsedt-dialog-image-float').value;
        var newpadding = this.dialogImage.querySelector('#ncsedt-dialog-image-padding').value;

        if (!isNaN(newwidth)) {
            newwidth += '%';
        }

        if (!isNaN(newheight)) {
            newheight += '%';
        }

        if (newsrc) {
            if (newsrc == 'data:image/...') {
                newsrc = this.dialogImage.querySelector('#ncsedt-dialog-image .image').src;
            }

            var newimg = document.createElement('img');
            newimg.setAttribute('src', newsrc);
            newimg.setAttribute('alt', newalt);
            newimg.style.width = newwidth;
            newimg.style.height = newheight;
            newimg.style.float = newfloat;
            newimg.style.padding = newpadding;
            this.currentRange.surroundContents(newimg);
        }
    };

    /**
     * Moves focus to parent element in image dialog
     */
    ncSimpleHtmlEditor.prototype.editImageParent = function () {
        if (!this.editingEnabled) {
            return;
        }

        if (this.focusedElement.parentElement && this.focusedElement.parentElement.isContentEditable) {
            this.setFocus(this.focusedElement.parentElement);
            this.editImage();
        } else if (this.focusedElement.parentElement.parentElement && this.focusedElement.parentElement.parentElement.querySelector('img') && this.focusedElement.parentElement.parentElement.isContentEditable) {
            this.setFocus(this.focusedElement.parentElement.parentElement.querySelector('img'));
            this.editImage();
        } else if (this.focusedElement.previousElementSibling && this.focusedElement.previousElementSibling.tagName == 'IMG' && this.focusedElement.previousElementSibling.isContentEditable) {
            this.setFocus(this.focusedElement.previousElementSibling);
            this.editImage();
        }

    };

    /**
     * Moves focus to child element in image dialog
     */
    ncSimpleHtmlEditor.prototype.editImageChild = function () {
        if (!this.editingEnabled) {
            return;
        }

        if (this.focusedElement.querySelector('img')) {
            this.setFocus(this.focusedElement.querySelector('img'));
            this.editImage();
        } else if (this.focusedElement.nextElementSibling && this.focusedElement.nextElementSibling.tagName == 'IMG' && this.focusedElement.nextElementSibling.isContentEditable) {
            this.setFocus(this.focusedElement.nextElementSibling);
            this.editImage();
        }
    };
})();
