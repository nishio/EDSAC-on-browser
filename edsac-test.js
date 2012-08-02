
edsac.assertEqual = function(e1, e2) {
    if (e1 != e2) {
        var err = 'Assertion failed: ' + e1 + ' != ' + e2;
        throw err;
    }
};

edsac.assertBinary = function(e1, s) {
    edsac.assertEqual(e1.printBinary(), s);
};

edsac.assertOrderBinary = function(e1, s) {
    edsac.assertEqual(e1.printOrderBinary(), s);
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
    var O = edsac.valueFromOrder;

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

    edsac.assertOrderBinary(O('T123S'),
                            '00101 0 0001111011 0');
    edsac.assertOrderBinary(O('P10000S'),
                            '00100 1 1100010000 0');

    edsac.assertEqual(O('T123L').printOrder(), 'T123L');
    edsac.assertEqual(O('P10000S').printOrder(), 'R1808S');

    edsac.testSquareCode();

    console.log('All tests OK!');
};

// Test if the sample code is read correctly
edsac.testSquareCode = function() {
    for (var i = 0; i < edsac.SQUARE_CODE.length; i++) {
        var line = edsac.SQUARE_CODE[i];
        var parts = /^\[([01 ]+)\] \[\d+\] (.+)$/.exec(line);

        // Parse the bits
        var v1 = edsac.valueFromBinary(parts[1].replace(/ /g, ''));
        // Parse the order
        var v2 = edsac.valueFromOrder(parts[2]);

        edsac.assertEqual(v1.printOrderBinary(), v2.printOrderBinary());
    }
};

edsac.SQUARE_CODE = [
    '[00101 0 0001111011 0] [31] T123S',
    '[00011 0 0001010100 0] [32] E84S',
    '[00000 0 0000000000 0] [33] PS',
    '[00000 0 0000000000 0] [34] PS',
    '[00100 1 1100010000 0] [35] P10000S',
    '[00000 0 1111101000 0] [36] P1000S',
    '[00000 0 0001100100 0] [37] P100S',
    '[00000 0 0000001010 0] [38] P10S',
    '[00000 0 0000000001 0] [39] P1S',
    '[00001 0 0000000000 0] [40] QS',
    '[01011 0 0000000000 0] [41] #S',
    '[11100 0 0000101000 0] [42] A40S',
    '[10100 0 0000000000 0] [43] !S',
    '[11000 0 0000000000 0] [44] &S',
    '[10010 0 0000000000 0] [45] @S',
    '[01001 0 0000101011 0] [46] O43S',
    '[01001 0 0000100001 0] [47] O33S',
    '[00000 0 0000000000 0] [48] PS',
    '[11100 0 0000101110 0] [49] A46S',
    '[00101 0 0001000001 0] [50] T65S',
    '[00101 0 0010000001 0] [51] T129S',
    '[11100 0 0000100011 0] [52] A35S',
    '[00101 0 0000100010 0] [53] T34S',
    '[00011 0 0000111101 0] [54] E61S',
    '[00101 0 0000110000 0] [55] T48S',
    '[11100 0 0000101111 0] [56] A47S',
    '[00101 0 0001000001 0] [57] T65S',
    '[11100 0 0000100001 0] [58] A33S',
    '[11100 0 0000101000 0] [59] A40S',
    '[00101 0 0000100001 0] [60] T33S',
    '[11100 0 0000110000 0] [61] A48S',
    '[01100 0 0000100010 0] [62] S34S',
    '[00011 0 0000110111 0] [63] E55S',
    '[11100 0 0000100010 0] [64] A34S',
    '[00000 0 0000000000 0] [65] PS',
    '[00101 0 0000110000 0] [66] T48S',
    '[00101 0 0000100001 0] [67] T33S',
    '[11100 0 0000110100 0] [68] A52S',
    '[11100 0 0000000100 0] [69] A4S',
    '[00111 0 0000110100 0] [70] U52S',
    '[01100 0 0000101010 0] [71] S42S',
    '[11011 0 0000110011 0] [72] G51S',
    '[11100 0 0001110101 0] [73] A117S',
    '[00101 0 0000110100 0] [74] T52S',
    '[00000 0 0000000000 0] [75] PS',
    '[00000 0 0000000000 0] [76] PS',
    '[00000 0 0000000000 0] [77] PS',
    '[00000 0 0000000000 0] [78] PS',
    '[00000 0 0000000000 0] [79] PS',
    '[00011 0 0001101110 0] [80] E110S',
    '[00011 0 0001110110 0] [81] E118S',
    '[00000 0 0001100100 0] [82] P100S',
    '[00011 0 0001011111 0] [83] E95S',
    '[01001 0 0000101001 0] [84] O41S',
    '[00101 0 0010000001 0] [85] T129S',
    '[01001 0 0000101100 0] [86] O44S',
    '[01001 0 0000101101 0] [87] O45S',
    '[11100 0 0001001100 0] [88] A76S',
    '[11100 0 0000000100 0] [89] A4S',
    '[00111 0 0001001100 0] [90] U76S',
    '[00101 0 0000110000 0] [91] T48S',
    '[11100 0 0001010011 0] [92] A83S',
    '[00101 0 0001001011 0] [93] T75S',
    '[00011 0 0000110001 0] [94] E49S',
    '[01001 0 0000101011 0] [95] O43S',
    '[01001 0 0000101011 0] [96] O43S',
    '[10101 0 0001001100 0] [97] H76S',
    '[11111 0 0001001100 0] [98] V76S',
    '[11001 0 0001000000 0] [99] L64S',
    '[11001 0 0000100000 0] [100] L32S',
    '[00111 0 0001001101 0] [101] U77S',
    '[01100 0 0001001110 0] [102] S78S',
    '[00101 0 0001001111 0] [103] T79S',
    '[11100 0 0001001101 0] [104] A77S',
    '[00111 0 0001001110 0] [105] U78S',
    '[00101 0 0000110000 0] [106] T48S',
    '[11100 0 0001010000 0] [107] A80S',
    '[00101 0 0001001011 0] [108] T75S',
    '[00011 0 0000110001 0] [109] E49S',
    '[01001 0 0000101011 0] [110] O43S',
    '[01001 0 0000101011 0] [111] O43S',
    '[11100 0 0001001111 0] [112] A79S',
    '[00101 0 0000110000 0] [113] T48S',
    '[11100 0 0001010001 0] [114] A81S',
    '[00101 0 0001001011 0] [115] T75S',
    '[00011 0 0000110001 0] [116] E49S',
    '[11100 0 0000100011 0] [117] A35S',
    '[11100 0 0001001100 0] [118] A76S',
    '[01100 0 0001010010 0] [119] S82S',
    '[11011 0 0001010101 0] [120] G85S',
    '[01001 0 0000101001 0] [121] O41S',
    '[01101 0 0000000000 0] [122] ZS'
];
