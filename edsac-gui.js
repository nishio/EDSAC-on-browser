
// A jQuery GUI for the emulator.

edsac.gui = {};

edsac.gui.active = false;
edsac.gui.running = false;
edsac.gui.DELAY = 0;
edsac.gui.STEPS_PER_INTERVAL = 5;

// Initialize the interface. 'prefix' is a prefix for jQuery selector.
edsac.gui.init = function(prefix) {
    this.ordersVer = 2;
    edsac.machine.init();
    edsac.loadInitialOrders(this.ordersVer);

    var self = this;

    this.memory = $(prefix+'memory');
    this.status = $(prefix+'status');
    this.stepButton = $(prefix+'step'); this.stepButton.val('Step');
    this.runButton = $(prefix+'run'); this.runButton.val('Run');
    this.resetButton = $(prefix+'reset'); this.resetButton.val('Reset');
    this.loadButton = $(prefix+'load'); this.loadButton.val('Load source');
    this.input = $(prefix+'input'); this.input.val('');
    this.output = $(prefix+'output');
    this.source = $(prefix+'source');

    // TODO: make better way to choose samples
    var load_wada_sieve = $(prefix+'load_wada_sieve'); load_wada_sieve.val('Load Wada Sieve');
    load_wada_sieve.click(function(){
        $("#edsac-source").val('[Sieve of Eratosthenes by Eiiti Wada]\n..PZ\n[M3]\nPFGKIFAFRDLFUFOFE@A6FG@E8FEZPF\n@&*SIEVE!OF!ERATOSTHENES\n@&*BY!EIITI!WADA#N!*APRIL!#1N!2001\n@&@&*WATCH!THE !SIEVE!IN!LONGTANK!#31@&@&\n..PZ\nT56K\n[P6]\nGKA3FT25@H29@VFT4DA3@TFH30@S6@T1F\nV4DU4DAFG26@TFTFO5FA4DF4FS4F\nL4FT4DA1FS3@G9@EFSFO31@E20@J995FJF!F\n\nT834K\n&F\n@F\n#F\nC1024D\nH992D\nP4F\nH922D\nP6F\nP70F\nLF\nPD\nPF\nU992D\nW70F\nT1024D\nP2F\nPD\nPF\n\nT96K\nGK\nTF\nS850D\nT992D\nA2@\nA849F\nU2@\nS848F\nG@\nTF\nA1022D\nS850D\nT852D\nA850D\nU922D\nLD\nT850D\nA11@\nA849F\nU11@\nA847F\nU13@\nS846F\nG8@\nO836F\nO835F\nO834F\nTF\nA849F\nRD\nTF\nA30@\nG56F\nTF\nH922D\nC992D\nS844D\nG75@\nO836F\nO835F\nO834F\nTF\nA841F\nR1F\nTF\nA44@\nG56F\nTF\nA34@\nU71@\nS843F\nT72@\nA33@\nS842F\nA841F\nU70@\nS840F\nG69@\nTF\nA71@\nA849F\nU71@\nS843F\nU72@\nS848F\nE75@\nTF\nA70@\nS842F\nG54@\nTF\nHD\nCD\nTD\nA70@\nG53@\nTF\nA841F\nA839F\nT841F\nA33@\nA849F\nU33@\nS838F\nG32@\nA840F\nT33@\nA34@\nA849F\nU34@\nS837F\nG32@\nZF\nE96K\nPF\n\n');
    });
    // end TODO

    this.switchButton = $(prefix+'switch');
    this.switchButton.val('Switch to Initial Orders '+(3-this.ordersVer));

    // For now, only show memory in 'narrow' mode
    for (var i = 0; i < 2*edsac.machine.MEM_SIZE; ++i) {
        var item = this.makeMemItem(i);
        this.memory.append(item);
    }

    this.updateStatus();

    this.stepButton.click(
        function() {
            self.pause();
            self.step();
        });
    this.stepButton.attr('disabled', false);

    this.runButton.click(
        function() {
            if (self.running)
                self.pause();
            else
                self.start();
        });
    this.runButton.attr('disabled', false);

    this.resetButton.click(
        function() {
            self.pause();
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
            var source = self.source.val();
            // Remove whitespace and comments
            source = source.replace(/\s+/g, '');
            source = source.replace(/\[.*?\]/g, '');
            edsac.machine.setInput(source);
        });

    this.switchButton.click(
        function() {
            var newVer = 3-self.ordersVer;

            self.pause();
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
                         abc.substr(35,1) + ' ' + '<br>' +
                        '      ' + abc.substr(36,17) + ' ' +
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

edsac.gui.scrollToMemory = function(addr) {
    var elt = this.memory.find('.mem-item.'+addr);
    var elt0 = this.memory.find('.mem-item.'+0);
    var offset = elt.offset().top - elt0.offset().top;
    this.memory.scrollTop(offset);
};

edsac.gui.onSet = function(addr) {
    this.updateMemory(addr);
    edsac.vis.onSet(addr);
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
        this.pause();
    }
    this.updateStatus();
    if (!edsac.machine.running)
        this.pause();
};

edsac.gui.start = function() {
    if (this.running)
        return;
    if (!edsac.machine.running)
        edsac.machine.running = true;

    var self = this;
    this.intervalId = window.setInterval(
        function() {
            for (var i = 0; (i < self.STEPS_PER_INTERVAL) && self.running; i++)
                self.step();
        },
        this.DELAY);
    this.running = true;
    this.runButton.val('Pause');
};

edsac.gui.pause = function() {
    if (!this.running)
        return;
    window.clearInterval(this.intervalId);
    this.running = false;
    this.runButton.val('Run');
};
