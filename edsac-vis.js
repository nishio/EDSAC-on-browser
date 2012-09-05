
// Canvas visualization

edsac.vis = {};

edsac.vis.COLOR_0 = '#000000';
edsac.vis.COLOR_1 = '#00ff00';

edsac.vis.TANK_HEIGHT = 16;
edsac.vis.TANK_CELL_SIZE = 9;

// From http://stackoverflow.com/questions/55677/how-do-i-get-the-coordinates-of-a-mouse-click-on-a-canvas-element
edsac.vis.relMouseCoords = function(canvas, event) {
    var totalOffsetX = 0;
    var totalOffsetY = 0;
    var canvasX = 0;
    var canvasY = 0;
    var currentElement = canvas;

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
    this.memCanvas = $(prefix+'memory-canvas')[0];

    this.memCanvas.width = 35;
    this.memCanvas.height = edsac.machine.MEM_SIZE;
    this.memCtx = this.memCanvas.getContext('2d');

    this.tankCanvas = $(prefix+'tank')[0];

    this.tankCanvas.width = 35*this.TANK_CELL_SIZE;
    this.tankCanvas.height = this.TANK_HEIGHT*this.TANK_CELL_SIZE;
    this.tankCtx = this.tankCanvas.getContext('2d');

    this.tankTitle = $(prefix+'tank-title');

    this.switchToTank(0);

    this.memCtx.fillStyle = this.COLOR_0;
    this.memCtx.fillRect(0,0,35,edsac.machine.MEM_SIZE);
    for (var i = 0; i < edsac.machine.MEM_SIZE; ++i)
        this.drawMemRow(i);

    var self = this;
    $(this.memCanvas).click(
        function(event) {
            var pos = self.relMouseCoords(this, event);
            var addr = pos.y*2;

            edsac.gui.scrollToMemory(Math.max(0, addr-8));

            var tankNumber = Math.floor(addr/(self.TANK_HEIGHT*2));
            self.switchToTank(tankNumber);
        });
};

edsac.vis.switchToTank = function(num) {
    this.tankNum = num;
    this.tankStart = this.TANK_HEIGHT*2*num;
    this.tankEnd = this.tankStart + this.TANK_HEIGHT*2;

    this.tankTitle.text('Tank #'+num+
                        ' ('+this.tankStart+'-'+(this.tankEnd-1)+')');

    this.tankCtx.fillStyle = this.COLOR_0;
    this.tankCtx.fillRect(0,
                          0,
                          35*this.TANK_CELL_SIZE,
                          this.TANK_HEIGHT*this.TANK_CELL_SIZE);

    for (var i = 0; i < this.TANK_HEIGHT; ++i)
        this.drawTankRow(i);
};

edsac.vis.onSet = function(addr) {
    this.drawMemRow(Math.floor(addr/2));
    if (this.tankStart <= addr && addr < this.tankEnd)
        this.drawTankRow(Math.floor((addr-this.tankStart)/2));
};

// Draw a 35-bit row of memory canvas
edsac.vis.drawMemRow = function(n) {
    var addr = n*2;
    var val = edsac.machine.get(addr, 1);

    this.drawRow(this.memCtx, val, n, 1, 0, -1);
};

edsac.vis.drawTankRow = function(n) {
    var addr = this.tankStart + n*2;
    var val = edsac.machine.get(addr, 1);

    this.drawRow(this.tankCtx, val, n, this.TANK_CELL_SIZE, 1, 4);
};

edsac.vis.drawRow = function(ctx, val, n, size, borderBig, borderSmall) {
    ctx.fillStyle = this.COLOR_0;
    ctx.fillRect(0, n*size, 35*size, size);
    //if (val.isZero())
    //   return;

    ctx.fillStyle = this.COLOR_1;

    for (var i = 0; i < 35; ++i) {
        var b = borderBig;
        if (!val.get(i)) {
            if (borderSmall < 0)
                continue;
            else
                b = borderSmall;
        }
        ctx.fillRect((35-i-1)*size+b, n*size+b, size-2*b, size-2*b);
    }
};
