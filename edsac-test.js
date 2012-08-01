
edsac.assertEqual = function(e1, e2) {
    if (e1 != e2) {
        var err = 'Assertion failed: ' + e1 + ' != ' + e2;
        throw err;
    }
};

edsac.assertBinary = function(e1, s) {
    edsac.assertEqual(e1.printBinary(), s);
};

edsac.test = function() {
    console.log('Running tests...');

    var v = edsac.zeroValue(5);
    var B = edsac.valueFromBinary;
    var D = edsac.valueFromDecimal;

    edsac.assertBinary(v, '00000');
    edsac.assertEqual(v.get(4), 0);
    v.set(4, 1);
    edsac.assertEqual(v.get(4), 1);
    edsac.assertBinary(v, '10000');

    v = B('101010');
    edsac.assertBinary(v, '101010');

    v.add(B('011'));
    edsac.assertBinary(v, '101101');
    v.add(B('010011'));
    edsac.assertBinary(v, '000000');

    v.add(B('1')); // -1: the first bit is the sign bit
    edsac.assertBinary(v, '111111');

    v.sub(B('010'));
    edsac.assertBinary(v, '111101');

    v.sub(B('10')); // -2
    edsac.assertBinary(v, '111111');

    v.shiftLeft(2);
    edsac.assertBinary(v, '111100');

    v.shiftRight(1);
    edsac.assertBinary(v, '111110');

    edsac.assertBinary(edsac.valueMult(B('011'),
                                       B('0101')),
                      '0001111');

    v = B('00011');
    v.mult(B('0101'));
    edsac.assertBinary(v, '01111');

    edsac.assertBinary(D('2',3), '010');
    edsac.assertBinary(D('42',7), '0101010');

    console.log('All tests OK!');
};
