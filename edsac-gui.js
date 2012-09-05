
// A jQuery GUI for the emulator.

edsac.gui = {};

edsac.gui.active = false;
edsac.gui.running = false;
edsac.gui.DELAY = 50; // delay between steps in milliseconds

// Initialize the interface. 'prefix' is a prefix for jQuery selector.
edsac.gui.init = function(prefix) {
    var self = this;

    this.memory = $(prefix+'memory');
    this.status = $(prefix+'status');
    this.stepButton = $(prefix+'step'); this.stepButton.val('Step');
    this.runButton = $(prefix+'run'); this.runButton.val('Run');
    this.resetButton = $(prefix+'reset'); this.resetButton.val('Reset');
    this.loadButton = $(prefix+'load'); this.loadButton.val('Load source');
    this.input = $(prefix+'input');
    this.output = $(prefix+'output');
    this.source = $(prefix+'source');

    this.switchButton = $(prefix+'switch');
    this.switchButton.val('Switch to Initial Orders 2');

    // For now, only show memory in 'narrow' mode
    for (var i = 0; i < 2*edsac.machine.MEM_SIZE; ++i) {
        var item = this.makeMemItem(i);
        this.memory.append(item);
    }

    this.updateStatus();

    this.stepButton.click(function() { self.step(); });
    this.stepButton.attr('disabled', false);

    this.runButton.click(
        function() {
            if (self.running)
                self.stop();
            else
                self.start();
        });
    this.runButton.attr('disabled', false);

    this.resetButton.click(
        function() {
            self.stop();
            edsac.machine.reset();
            edsac.loadInitialOrders(self.ordersVer);
            self.updateStatus();
        });

    this.input.change(
        function() {
            edsac.machine.setInput(self.input.val());
        });

    this.loadButton.click(
        function() {
            var source = self.source.text();
            // Remove whitespace and comments
            source = source.replace(/\s+/g, '');
            source = source.replace(/\[.*?\]/g, '');
            edsac.machine.setInput(source);
        });

    this.ordersVer = 1;
    this.switchButton.click(
        function() {
            var newVer = self.ordersVer == 1 ? 2 : 1;

            self.stop();
            edsac.machine.reset();
            edsac.loadInitialOrders(newVer);
            self.updateStatus();

            self.switchButton.val('Switch to Initial Orders '+self.ordersVer);
            self.ordersVer = newVer;
        }
    );

    this.active = true;
    edsac.vis.init(prefix);
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
    html += 'SCR = ' + edsac.formatInt(edsac.machine.ip, 4) +
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
    edsac.vis.drawMemory(addr - addr%2);
};

edsac.gui.onSetInput = function(s) {
    this.input.val(s);
};

edsac.gui.onSetOutput = function(s) {
    this.output.text(s+'_');
};

edsac.gui.onSetIp = function(oldIp, newIp) {
    this.updateMemory(oldIp);
    this.updateMemory(newIp);
};

edsac.gui.step = function() {
    if (!edsac.machine.running)
        edsac.machine.running = true;

    try {
        edsac.machine.step();
    } catch (err) {
        window.alert(err);
        this.stop();
    }
    this.updateStatus();
    if (!edsac.machine.running)
        this.stop();
};

edsac.gui.start = function() {
    if (this.running)
        return;
    if (!edsac.machine.running)
        edsac.machine.running = true;

    var self = this;
    this.intervalId = window.setInterval(function() { self.step(); },
                                         this.DELAY);
    this.running = true;
    this.runButton.val('Stop');
};

edsac.gui.stop = function() {
    if (!this.running)
        return;
    window.clearInterval(this.intervalId);
    this.running = false;
    this.runButton.val('Run');
};
