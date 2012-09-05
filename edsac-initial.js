edsac.INITIAL_ORDERS = [
    '[0] T0S',
    '[1] H2S',
    '[2] T0S',
    '[3] E6S',
    '[4] P1S',
    '[5] P5S',
    '[6] T0S',
    '[7] I0S',
    '[8] A0S',
    '[9] R16S',
    '[10] T0L',
    '[11] I2S',
    '[12] A2S',
    '[13] S5S',
    '[14] E21S',
    '[15] T3S',
    '[16] V1S',
    '[17] L8S',
    '[18] A2S',
    '[19] T1S',
    '[20] E11S',
    '[21] R4S',
    '[22] A1S',
    '[23] L0L',
    '[24] A0S',
    '[25] T31S',
    '[26] A25S',
    '[27] A4S',
    '[28] U25S',
    '[29] S31S',
    '[30] G6S'
];

edsac.loadInitialOrders = function() {
    for (var i = 0; i < edsac.INITIAL_ORDERS.length; i++) {
        var line = edsac.INITIAL_ORDERS[i];
        var parts = /^\[(\d+)\] (.+)$/.exec(line);

        if (i != parseInt(parts[1], 10))
            throw 'malformed initial orders';

        var v = edsac.valueFromOrder(parts[2]);
        edsac.machine.set(i, false, v);
    }
};
