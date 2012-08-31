
// A jQuery GUI for the emulator.

edsac.gui = {};

edsac.gui.active = false;

// Initialize the interface. The arguments are jQuery elements.
edsac.gui.init = function(memory) {
    this.memory = memory;

    // For now, only show memory in 'narrow' mode
    for (var i = 0; i < 2*edsac.machine.MEM_SIZE; ++i) {
        var item = this.makeMemItem(i);
        memory.append(item);
    }

    this.active = true;
};

edsac.formatInt = function(n, width) {
    var s = String(n);
    while (s.length < width)
        s = '0' + s;
    return s;
};

edsac.gui.MEM_TEMPLATE =
    '<div class="mem-item %addr%">' +
    '%addr0%: [%bytes%] [%order%]' +
    '</div>';

edsac.gui.makeMemItem = function(addr) {
    var val = edsac.machine.get(addr, false);
    var code = (this.MEM_TEMPLATE
                .replace('%addr%', String(addr))
                .replace('%addr0%', edsac.formatInt(addr,4))
                .replace('%bytes%', val.printOrderBinary())
                .replace('%order%', val.printOrder()));

    var elt = $(code);
    if (addr % 2 == 1)
        elt.addClass('odd');

    if (addr == edsac.machine.ip)
        elt.addClass('current');

    return elt;
};
