
edsac.assertEqual = function(e1, e2) {
    if (e1 != e2) {
        var err = 'Assertion failed: ' + e1 + ' != ' + e2;
        throw err;
    }
};

edsac.assertBinary = function(e1, s) {
    edsac.assertEqual(e1.printBinary(), s);
};

edsac.assertCommandBinary = function(e1, s) {
    edsac.assertEqual(e1.printCommandBinary(), s);
};

edsac.assertDecimal = function(e1, signed, s) {
    edsac.assertEqual(e1.printDecimal(signed), s);
};

edsac.test = function() {
    console.log('Running tests...');

    var v = edsac.zeroValue(5);
    var B = edsac.valueFromBinary;
    var D = edsac.valueFromDecimal;
    var I = edsac.valueFromInteger;
    var C = edsac.valueFromCommand;

    edsac.assertBinary(v, '00000');
    edsac.assertEqual(v.get(4), 0);
    v.set(4, 1);
    edsac.assertEqual(v.get(4), 1);
    edsac.assertBinary(v, '10000');

    var w = v.slice(1, 2);
    edsac.assertBinary(w, '00');
    w.add(B('01'));
    edsac.assertBinary(w, '01');
    edsac.assertBinary(v, '10010');

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
    edsac.assertBinary(v, '101110');

    v = B('000111');
    v.and(B('111100'));
    edsac.assertBinary(v, '000100');

    edsac.assertBinary(edsac.valueMult(B('011'),
                                       B('0101')),
                      '0001111');

    v = B('00011');
    v.mult(B('0101'));
    edsac.assertBinary(v, '01111');

    edsac.assertDecimal(edsac.valueMult(D('10',5), D('-2',5)),
                        true, '-20');
    edsac.assertDecimal(edsac.valueMult(D('-10',5), D('-2',5)),
                        true, '20');

    edsac.assertBinary(D('2',3), '010');
    edsac.assertBinary(I(2,3), '010');
    edsac.assertBinary(D('-2',3), '110');
    edsac.assertBinary(I(-2,3), '110');
    edsac.assertBinary(D('42',7), '0101010');
    edsac.assertBinary(I(42,7), '0101010');
    edsac.assertBinary(D('-42',7), '1010110');
    edsac.assertBinary(I(-42,7), '1010110');

    edsac.assertEqual(B('01').compare(B('0')), 1); // 1 > 0
    edsac.assertEqual(B('01').compare(B('011')), -1); // 1 < 3
    edsac.assertEqual(B('11').compare(B('10')), -1); // -1 < -2
    edsac.assertEqual(B('01').compare(B('01')), 0); // 1 == 1

    var qr = edsac.valueDivRem(B('0101010'), B('0101')); // 42 div 5 = 8, rem 2
    edsac.assertBinary(qr[0], '0001000');
    edsac.assertBinary(qr[1], '00010');

    edsac.assertDecimal(B('0'), true, '0');
    edsac.assertDecimal(B('0101010'), true, '42');
    edsac.assertDecimal(B('1010110'), true, '-42');
    edsac.assertDecimal(B('1010110'), false, '86');
    edsac.assertDecimal(B('0100101'), true, '37');
    edsac.assertDecimal(B('1011011'), true, '-37');
    edsac.assertDecimal(B('1011011'), false, '91');

    edsac.assertEqual(B('0101010').toInteger(true), 42);
    edsac.assertEqual(B('1010110').toInteger(true), -42);
    edsac.assertEqual(B('1010110').toInteger(false), 86);

    v = B('000');
    v.negate();
    edsac.assertBinary(v, '000');
    v = B('0101010');
    v.negate();
    edsac.assertBinary(v, '1010110');

    edsac.assertCommandBinary(C('T123S'),
                              '00101 0 0001111011 0');
    edsac.assertCommandBinary(C('P10000S'),
                              '00100 1 1100010000 0');

    console.log('All tests OK!');
};
