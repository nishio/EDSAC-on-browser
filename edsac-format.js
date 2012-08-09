
// Handling EDSAC character codes and order formatting

// figs: #, lets: *, null: ., cr: @, sp: !, lf: &
// pound sign replaced with L

edsac.N_LETTERS = 32;
edsac.LETTERS = 'PQWERTYUIOJ#SZK*.F@D!HNM&LXGABCV';
edsac.FIGURES = '0123456789?#"+(*.$@;!L,.&)/#-?:=';

// Parse an EDSAC order
edsac.valueFromOrder = function(s) {
    var parts = /^([A-Z#\.@!&])(\d*)([LS])$/.exec(s);
    if (parts == null)
        throw 'bad order format: '+s;

    var result = edsac.zeroValue(17);

    // The operation name
    var opNum = edsac.LETTERS.indexOf(parts[1]);
    result.slice(12, 5).assign(edsac.valueFromInteger(opNum, 5));

    // The number part
    if (parts[2].length > 0) {
        var numPart = edsac.valueFromDecimal(parts[2], 16);
        var numVal = result.slice(1,16);
        numVal.assign(numVal.add(numPart));
    }

    // The wide bit
    if (parts[3] == 'L')
        result.set(0, 1);

    return result;
};

// Destructure the value as an order.
// Returns a list [opcode letter, number, 'S'/'L']
edsac.Value.prototype.getOrder = function() {
    var opNum = this.slice(12, 5).toInteger(false);
    var num = this.slice(1, 11).toInteger(false);
    return [edsac.LETTERS.charAt(opNum),
            (num ? num : ''),
            this.get(0)];
};

// Print an EDSAC order.
// Warning: the encoding is one of many possible in principle,
// due to commands like P10000S with number overwriting the higher bits, e.g.
//  P10000S = R1808S
edsac.Value.prototype.printOrder = function() {
    var order = this.getOrder();
    return order[0] + order[1] + (order[2] ? 'L' : 'S');
};


// Print order as grouped bits
edsac.Value.prototype.printOrderBinary = function() {
    var s = this.printBinary();
    return s.substr(0,5)+' '+s.substr(5,1)+' '+s.substr(6,10)+' '+s.substr(16,1);
};
