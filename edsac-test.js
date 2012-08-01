
edsac.assertEqual = function(e1, e2) {
    if (e1 != e2) {
        var err = 'Assertion failed: ' + e1 + ' != ' + e2;
        throw err;
    }
};

edsac.test = function() {
    console.log('Running tests...');

    var v = edsac.zeroValue(5);
    edsac.assertEqual(v.printBinary(), '00000');
    edsac.assertEqual(v.get(4), 0);
    v.set(4, 1);
    edsac.assertEqual(v.get(4), 1);
    edsac.assertEqual(v.printBinary(), '10000');

    v = edsac.valueFromBinary('101010');
    edsac.assertEqual(v.printBinary(), '101010');

    v.add(edsac.valueFromBinary('011'));
    edsac.assertEqual(v.printBinary(), '101101');
    v.add(edsac.valueFromBinary('010011'));
    edsac.assertEqual(v.printBinary(), '000000');

    v.add(edsac.valueFromBinary('1')); // -1: the first bit is the sign bit
    edsac.assertEqual(v.printBinary(), '111111');

    v.sub(edsac.valueFromBinary('010'));
    edsac.assertEqual(v.printBinary(), '111101');

    v.sub(edsac.valueFromBinary('10')); // -2
    edsac.assertEqual(v.printBinary(), '111111');

    v.shiftLeft(2);
    edsac.assertEqual(v.printBinary(), '111100');

    v.shiftRight(1);
    edsac.assertEqual(v.printBinary(), '111110');

    edsac.assertEqual(edsac.valueMult(edsac.valueFromBinary('011'),
                                      edsac.valueFromBinary('0101'))
                      .printBinary(),
                      '0001111');

    v = edsac.valueFromBinary('00011');
    v.mult(edsac.valueFromBinary('0101'));
    edsac.assertEqual(v.printBinary(), '01111');

    console.log('All tests OK!');
};
