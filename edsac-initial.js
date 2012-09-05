edsac.INITIAL_ORDERS_1 = [
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

edsac.INITIAL_ORDERS_2 = [
    '[0] TS',
    '[1] E20S',
    '[2] P1S',
    '[3] U2S',
    '[4] A39S',
    '[5] R4S',
    '[6] VS',
    '[7] L8S',
    '[8] TS',
    '[9] I1S',
    '[10] A1S',
    '[11] S39S',
    '[12] G4S',
    '[13] LL',
    '[14] S39S',
    '[15] E17S',
    '[16] S7S',
    '[17] A35S',
    '[18] T20S',
    '[19] AS',
    '[20] H8S',
    '[21] A40S',
    '[22] T43S',
    '[23] A22S',
    '[24] A2S',
    '[25] T22S',
    '[26] E34S',
    '[27] A43S',
    '[28] E8S',
    '[29] A42S',
    '[30] A40S',
    '[31] E25S',
    '[32] A22S',
    '[33] T42S',
    '[34] I40L',
    '[35] A40L',
    '[36] R16S',
    '[37] T40L',
    '[38] E8S',
    '[39] P5L',
    '[40] PL'
];

edsac.loadInitialOrders = function(ver) {
    if (ver == undefined)
        ver = 1;
    var orders = ver == 1 ? edsac.INITIAL_ORDERS_1 : edsac.INITIAL_ORDERS_2;

    for (var i = 0; i < orders.length; i++) {
        var line = orders[i];
        var parts = /^\[(\d+)\] (.+)$/.exec(line);

        if (i != parseInt(parts[1], 10))
            throw 'malformed initial orders';

        var v = edsac.valueFromOrder(parts[2]);
        edsac.machine.set(i, false, v);
    }
};
