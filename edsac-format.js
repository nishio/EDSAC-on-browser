
// Handling EDSAC character codes and order formatting

// figs: #, lets: *, null: ., cr: @, sp: !, lf: &
// pound sign replaced with L

edsac.N_LETTERS = 32;
edsac.LETTERS = 'PQWERTYUIOJ#SZK*.F@D!HNM&LXGABCV';
edsac.FIGURES = '0123456789?#"+(*.$@;!L,.&)/#-?:=';

// Parse an EDSAC order
edsac.valueFromOrder = function(s) {
    var parts = /^(.)(\d*)([LS])$/.exec(s);
    if (parts == null)
        throw 'bad order format: '+s;

    var result = edsac.zeroValue(17);

    // Find the letter (operation code)
    for (var i = 0; i < edsac.N_LETTERS; i++)
        if (edsac.LETTERS.charAt(i) == parts[1])
            break;
    if (i == 32)
        throw 'unrecognized letter: '+s;

    result.slice(12, 5).assign(edsac.valueFromInteger(i, 5));

    // The number part
    if (parts[2].length > 0) {
        var numPart = edsac.valueFromDecimal(parts[2], 16);
        result.slice(1,16).add(numPart);
    }

    // The order bit
    if (parts[3] == 'L')
        result.set(0, 1);

    return result;
};

// Print order as grouped bits
edsac.Value.prototype.printOrderBinary = function() {
    var s = this.printBinary();
    return s.substr(0,5)+' '+s.substr(5,1)+' '+s.substr(6,10)+' '+s.substr(16,1);
};
