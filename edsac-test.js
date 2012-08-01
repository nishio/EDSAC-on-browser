
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

    console.log('All tests OK!');
};
