/*!
 * Simple HTML Editor v2.0.1 - Moveable Module
 * Draggable UI component for dialogs and toolbar
 *
 * https://github.com/FranBarInstance/simple-html-edit
 */

(function () {
    /**
     * Creates a movable element that can be dragged around the window
     */
    window.ncSimpleMoveable = function (movableSelector, draggerSelector) {
        this.movable = document.querySelector(movableSelector);
        this.dragger = document.querySelector(draggerSelector);
        var supports = document.createElement('div');

        if ('ontouchstart' in supports) {
            this.movableOnTouch();
        } else {
            this.movableOnDrag();
        }
    }

    /**
     * Initializes mouse drag functionality for movable elements
     */
    ncSimpleMoveable.prototype.movableOnDrag = function () {
        var _this = this;
        var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        this.movable.style.position = 'fixed';
        this.dragger.onmousedown = dragMouseDown;

        function dragMouseDown(e) {
            e = e || window.event;
            e.preventDefault();
            var style = window.getComputedStyle(_this.movable);
            var marginTop = parseInt(style.getPropertyValue('margin-top'));
            var marginLeft = parseInt(style.getPropertyValue('margin-left'));
            _this.movable.style.margin = '0px';
            _this.movable.style.top = (_this.movable.offsetTop + marginTop) + "px";
            _this.movable.style.left = (_this.movable.offsetLeft + marginLeft) + "px";
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            _this.movable.style.top = (_this.movable.offsetTop - pos2) + "px";
            _this.movable.style.left = (_this.movable.offsetLeft - pos1) + "px";
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
            var xDraggerOffset = _this.dragger.offsetLeft;
            var xOffset = _this.movable.offsetLeft + xDraggerOffset;
            var yDraggerOffset = _this.dragger.offsetTop;
            var yOffset = _this.movable.offsetTop + yDraggerOffset;
            var xMax = window.innerWidth - _this.dragger.offsetWidth;
            var yMax = window.innerHeight - _this.dragger.offsetHeight;
            var xMIn = 0;
            var yMin = 0;

            if (yOffset > yMax) {
                _this.movable.style.top = (yMax - yDraggerOffset) + 'px';
            }

            if (yOffset < yMin) {
                _this.movable.style.top = (yMin - yDraggerOffset) + 'px';
            }

            if (xOffset > xMax) {
                _this.movable.style.left = (xMax - xDraggerOffset) + 'px';
            }

            if (xOffset < xMIn) {
                _this.movable.style.left = (xMIn - xDraggerOffset) + 'px';
            }
        }
    };

    /**
     * Initializes touch functionality for movable elements
     */
    ncSimpleMoveable.prototype.movableOnTouch = function () {
        var _this = this;
        this.movable.style.position = 'fixed';

        this.dragger.addEventListener('touchmove', function (e) {
            e.preventDefault();
            var xOffset = _this.dragger.offsetLeft + Math.round(_this.dragger.offsetWidth / 2);
            var yOffset = _this.dragger.offsetTop + Math.round(_this.dragger.offsetHeight / 2);
            _this.movable.style.margin = '0px';
            var touchLocation = e.targetTouches[0];
            _this.movable.style.left = touchLocation.pageX - xOffset + 'px';
            _this.movable.style.top = touchLocation.pageY - window.pageYOffset - yOffset + 'px';
        });

        this.movable.addEventListener('touchend', function (e) {
            var xDraggerOffset = _this.dragger.offsetLeft;
            var xOffset = _this.movable.offsetLeft + xDraggerOffset;
            var yDraggerOffset = _this.dragger.offsetTop;
            var yOffset = _this.movable.offsetTop + yDraggerOffset;
            var xMax = window.innerWidth - _this.dragger.offsetWidth;
            var yMax = window.innerHeight - _this.dragger.offsetHeight;
            var xMIn = 0;
            var yMin = 0;

            if (yOffset > yMax) {
                _this.movable.style.top = (yMax - yDraggerOffset) + 'px';
            }

            if (yOffset < yMin) {
                _this.movable.style.top = (yMin - yDraggerOffset) + 'px';
            }

            if (xOffset > xMax) {
                _this.movable.style.left = (xMax - xDraggerOffset) + 'px';
            }

            if (xOffset < xMIn) {
                _this.movable.style.left = (xMIn - xDraggerOffset) + 'px';
            }
        });
    };
})();
