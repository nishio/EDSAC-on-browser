
// Canvas visualization

edsac.vis = {};

edsac.vis.COLOR_0 = '#000000';
edsac.vis.COLOR_1 = '#00ff00';

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
};

// DrawM a 35-bit row of memory canvas
edsac.vis.drawMemory = function(addr) {
    var val = edsac.machine.get(addr, 1);

    if (val.isZero()) {
        this.ctx.fillStyle = this.COLOR_0;
        this.ctx.fillRect(0, addr, 35, 1);
        return;
    }

    for (var i = 0; i < 35; ++i) {
        this.ctx.fillStyle = val.get(i) ? this.COLOR_1 : this.COLOR_0;
        this.ctx.fillRect(35-i-1, addr, 1, 1);
    }
};
