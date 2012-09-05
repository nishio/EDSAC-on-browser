
// Canvas visualization

edsac.vis = {};

edsac.vis.COLOR_0 = '#000000';
edsac.vis.COLOR_1 = '#00ff00';

// From http://stackoverflow.com/questions/55677/how-do-i-get-the-coordinates-of-a-mouse-click-on-a-canvas-element
edsac.vis.relMouseCoords = function(event) {
    var totalOffsetX = 0;
    var totalOffsetY = 0;
    var canvasX = 0;
    var canvasY = 0;
    var currentElement = this.elt;

    do {
        totalOffsetX += currentElement.offsetLeft;
        totalOffsetY += currentElement.offsetTop;
    } while((currentElement = currentElement.offsetParent));

    canvasX = event.pageX - totalOffsetX;
    canvasY = event.pageY - totalOffsetY;

    return {x:canvasX, y:canvasY};
};

edsac.vis.init = function(prefix) {
    // DOM element, not jQuery object
    this.elt = $(prefix+'memory-canvas')[0];

    this.elt.width = 35;
    this.elt.height = edsac.machine.MEM_SIZE;
    this.ctx = this.elt.getContext('2d');

    this.ctx.fillStyle = this.COLOR_0;
    this.ctx.fillRect(0,0,35,edsac.machine.MEM_SIZE);
    for (var i = 0; i < edsac.machine.MEM_SIZE; ++i)
        this.drawMemory(i*2);

    var self = this;
    $(this.elt).click(
        function(event) {
            var pos = self.relMouseCoords(event);
            edsac.gui.scrollToMemory(Math.max(0, pos.y*2-8));
        });
};

// DrawM a 35-bit row of memory canvas
edsac.vis.drawMemory = function(addr) {
    addr = addr - addr%2;
    var val = edsac.machine.get(addr, 1);

    if (val.isZero()) {
        this.ctx.fillStyle = this.COLOR_0;
        this.ctx.fillRect(0, addr/2, 35, 1);
        return;
    }

    for (var i = 0; i < 35; ++i) {
        this.ctx.fillStyle = val.get(i) ? this.COLOR_1 : this.COLOR_0;
        this.ctx.fillRect(35-i-1, addr/2, 1, 1);
    }
};
