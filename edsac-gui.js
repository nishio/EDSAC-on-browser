
// A jQuery GUI for the emulator.

edsac.gui = {};

edsac.gui.active = false;

// Initialize the interface. The arguments are jQuery elements.
edsac.gui.init = function(memory, status, stepButton, input) {
    var self = this;

    this.memory = memory;
    this.status = status;
    this.stepButton = stepButton;
    this.input = input;

    // For now, only show memory in 'narrow' mode
    for (var i = 0; i < 2*edsac.machine.MEM_SIZE; ++i) {
        var item = this.makeMemItem(i);
        memory.append(item);
    }

    this.updateStatus();

    this.stepButton.click(function() { self.step(); });
    this.input.change(
        function() {
            edsac.machine.setInput(self.input.val());
        });

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
    '<span class="descr">%descr%</span>' +
    '%addr0%: [%bytes%] [%order%] ' +
    '</div>';

edsac.gui.makeMemItem = function(addr) {
    var val = edsac.machine.get(addr, false);
    var code = (this.MEM_TEMPLATE
                .replace('%addr%', String(addr))
                .replace('%addr0%', edsac.formatInt(addr,4))
                .replace('%bytes%', val.printOrderBinary())
                .replace('%order%', val.printOrder())
                .replace('%descr%', val.describeOrder()));

    var elt = $(code);
    if (addr % 2 == 1)
        elt.addClass('odd');

    if (addr == edsac.machine.ip)
        elt.addClass('current');

    return elt;
};

edsac.gui.updateStatus = function() {
    var html = '';
    html += 'IP = ' + edsac.formatInt(edsac.machine.ip, 4) +
        (edsac.machine.running ? '' : ' (stopped)') + '<br>';
    html += '<br>';

    var abc = edsac.machine.getAccum(2).printBinary();
    html += 'ABC: [' + (abc.substr(0,17) + ' ' +
                         abc.substr(17,1) + ' ' +
                        abc.substr(18,17) + ' ' +
                         abc.substr(35,1) + ' ' +
                        abc.substr(36,17) + ' ' +
                         abc.substr(53,1) + ' ' +
                        abc.substr(54,17)) + ']<br>';

    html += ('ABC = ' + edsac.machine.getAccum(2).printDecimal(true) +
             ', AB = ' + edsac.machine.getAccum(1).printDecimal(true) +
             ', A = ' + edsac.machine.getAccum(0).printDecimal(true)) + '<br>';
    html += '<br>';

    var rs = edsac.machine.getMult(1).printBinary();
    html += 'RS: &nbsp;[' + (rs.substr(0,17) + ' ' +
                              rs.substr(17,1) + ' ' +
                             rs.substr(18,17)) + ']<br>';

    html += ('RS = ' + edsac.machine.getMult(1).printDecimal(true) +
             ', R = ' + edsac.machine.getMult(0).printDecimal(true)) + '<br>';

    this.status.html(html);
};

edsac.gui.updateMemory = function(addr) {
    var elt = this.memory.find('.mem-item.'+addr);
    elt.replaceWith(this.makeMemItem(addr));
};

edsac.gui.onSet = function(addr) {
    this.updateMemory(addr);
};

edsac.gui.onSetInput = function(s) {
    this.input.val(s);
};

edsac.gui.step = function() {
    var oldIp = edsac.machine.ip;
    try {
        edsac.machine.step();
    } catch (err) {
        window.alert(err);
    }
    this.updateStatus();
    if (!edsac.machine.running)
        edsac.gui.stepButton.attr('disabled', true);
    this.updateMemory(oldIp);
    this.updateMemory(edsac.machine.ip);
};
