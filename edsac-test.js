
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

    edsac.testValue();
    edsac.testSquareCode();
    edsac.testMachine();
    edsac.testStep();
    edsac.testPrinter();

    console.log('All tests OK!');
};

edsac.testValue = function() {
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
    w.assign(B('01'));
    edsac.assertBinary(w, '01');
    edsac.assertBinary(v, '10010');

    edsac.assertBinary(B('101010'), '101010');
    edsac.assertBinary(B('101010').add(B('011')), '101101');
    edsac.assertBinary(B('101101').add(B('010011')), '000000');

    edsac.assertBinary(B('000').add(B('1')), '111'); // add -1
    edsac.assertBinary(B('000').add(B('01')), '001'); // add 1
    edsac.assertBinary(B('000').sub(B('110')), '010'); // sub -2

    edsac.assertBinary(B('1111').shiftLeft(2), '1100');
    edsac.assertBinary(B('1100').shiftArithmeticRight(1), '1110');
    edsac.assertBinary(B('1100').shiftRight(1), '0110');
    edsac.assertBinary(B('0100').shiftRight(1), '0010');

    edsac.assertBinary(B('000111').and(B('111100')), '000100');

    edsac.assertBinary(B('011').mult(B('0101')), '0001111');

    edsac.assertDecimal(D('10', 5).mult(D('-2', 5)), true, '-20');
    edsac.assertDecimal(D('-10', 5).mult(D('-2', 5)), true, '20');

    edsac.assertBinary(D('2', 3), '010');
    edsac.assertBinary(I(2, 3), '010');

    edsac.assertBinary(D('-2', 3), '110');
    edsac.assertBinary(I(-2, 3), '110');
    edsac.assertBinary(D('42', 7), '0101010');
    edsac.assertBinary(I(42, 7), '0101010');
    edsac.assertBinary(D('-42', 7), '1010110');
    edsac.assertBinary(I(-42, 7), '1010110');

    edsac.assertEqual(B('01').compare(B('0')), 1); // 1 > 0
    edsac.assertEqual(B('01').compare(B('011')), -1); // 1 < 3
    edsac.assertEqual(B('11').compare(B('10')), -1); // -1 < -2
    edsac.assertEqual(B('01').compare(B('01')), 0); // 1 == 1

    var qr = B('0101010').divRem(B('0101')); // 42 div 5 = 8, rem 2
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

    edsac.assertBinary(B('000').negate(), '000');
    edsac.assertBinary(B('0101010').negate(), '1010110');

    edsac.assertOrderBinary(O('T123S'),
                            '00101 0 0001111011 0');

    edsac.assertOrderBinary(O('P10000S'),
                            '00100 1 1100010000 0');

    edsac.assertEqual(O('T123L').printOrder(), 'T123L');
    edsac.assertEqual(O('P10000S').printOrder(), 'R1808S');
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

edsac.testMachine = function() {
    edsac.machine.init();

    // We test the getters and setters, as well as their width checking

    // 17-bit 1- and 0-strings
    var s1 = '11111111111111111';
    var s0 = '00000000000000000';

    var B = edsac.valueFromBinary;

    edsac.machine.set(42, 1, B(s1 + '0' + s1));
    edsac.machine.set(42, 0, B(s0));
    edsac.assertBinary(edsac.machine.get(42, 1), s1 + '0' + s0);
    edsac.assertBinary(edsac.machine.get(42, 0), s0);
    edsac.assertBinary(edsac.machine.get(43, 0), s1);

    edsac.machine.setAccum(2, B(s1 + '0' + s1 + '0' + s1 + '0' + s1));
    edsac.machine.setAccum(1, B(s0 + '0' + s0));
    edsac.machine.setAccum(0, B(s1));
    edsac.assertBinary(
        edsac.machine.getAccum(2),
        s1 + '0' + s0 + '0' + s1 + '0' + s1);
    edsac.assertBinary(edsac.machine.getAccum(1), s1 + '0' + s0);
    edsac.assertBinary(edsac.machine.getAccum(0), s1);

    edsac.machine.setMult(1, B(s0 + '0' + s0));
    edsac.machine.setMult(0, B(s1));
    edsac.assertBinary(edsac.machine.getMult(1), s1 + '0' + s0);
    edsac.assertBinary(edsac.machine.getMult(0), s1);
};

// Test code execution
edsac.testStep = function() {
    edsac.machine.init();
    // Load the orders
    for (var i = 0; i < edsac.STEP_TEST.length; i++)
        edsac.machine.set(i, 0, edsac.valueFromOrder(edsac.STEP_TEST[i][0]));
    while (edsac.machine.running) {
        var scr = edsac.machine.sequence_control_register;
        edsac.machine.step();

        var expected = edsac.STEP_TEST[scr][1];
        if (expected != undefined) {
            expected = expected.replace(/ /g, '');
            while (expected.length < 71)
                expected += '0';
            edsac.assertEqual(edsac.machine.getAccum(2).printBinary(),
                              expected);
        }
    }
};

// A list of tuples: [instruction(, expected ABC after running it)]
// The ABC description may contain spaces, and omit as many junior bits
// as we want.
//
// The values have been hand-crafted with the help of Python. This is not
// intended to be a comprehensive test, we will use a real EDSAC program
// for that.
edsac.STEP_TEST = [
    //  0: goto 4
    ['E4S'],
    //  1: data 0
    ['P0S'],
    //  2: data 1<<1
    ['P1S'],
    //  3: data 21<<1
    ['P21S'],
    //  4: A += m[2] (A=2)
    ['A2S', '00000000000000010'],
    //  5: A -= m[3] (A=-40)
    ['S3S', '11111111111011000'],
    //  6: ABC >>= 1 (A=-20)
    ['R0L', '11111111111101100'],
    //  7: ABC <<= 2 (A=-80)
    ['L1S', '11111111110110000'],
    //  8: R += m[2] (R=2)
    ['H2S'],
    //  9: AB += m[3]*R (A,B=-80, 336)
    ['V3S', '11111111110110000 0 00000000101010000'],
    // 10: ABC -= w[2]*RS (w[2] = (42<<18)+2, RS = 2<<18)
    ['N2L', '11111111110101111 1 11111111111111111 1 11111111111110000 0 00000000000000000'],
    // 11: m[1] = A, ABC = 0 (A =0b11111111110101111)
    ['T1S', '0'],
    // 12: A += m[1] & R (R = 2, m[1] & R = 2)
    ['C1S', '00000000000000010'],
    // 13: if A < 0 goto 0 (not executed)
    ['G0S'],
    // 14: stop
    ['ZS']
];

edsac.testPrinter = function() {
    var pr = new edsac.Printer();
    pr.writeTapeChars('TEST!STRING@&SECOND!LINE');
    edsac.assertEqual(pr.getText(), 'TEST STRING\nSECOND LINE');
};
