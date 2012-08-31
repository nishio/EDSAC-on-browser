
// Handling EDSAC character codes and order formatting

// figs: #, lets: *, null: ., cr: @, sp: !, lf: &
// pound sign replaced with L

edsac.N_LETTERS = 32;
edsac.LETTERS = 'PQWERTYUIOJ#SZK*.F@D!HNM&LXGABCV';
edsac.FIGURES = '0123456789?#"+(*.$@;!L,.&)/#-?:=';

// Parse a single character
edsac.valueFromChar = function(c) {
    var num = edsac.LETTERS.indexOf(c);
    if (num == -1)
        num = edsac.FIGURES.indexOf(c);
    if (num == -1)
        throw 'unrecognized input character: '+c;
    return edsac.valueFromInteger(num, 5);
};

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
    if (this.n != 17)
        throw 'wrong value width for an order';

    var opNum = this.slice(12, 5).toInteger(false);
    var num = this.slice(1, 11).toInteger(false);
    return [edsac.LETTERS.charAt(opNum),
            num,
            this.get(0)];
};

// Print an EDSAC order.
// Warning: the encoding is one of many possible in principle,
// due to commands like P10000S with number overwriting the higher bits, e.g.
//  P10000S = R1808S
edsac.Value.prototype.printOrder = function() {
    var order = this.getOrder();
    return order[0] + (order[1] || '') + (order[2] ? 'L' : 'S');
};

edsac.Value.prototype.describeOrder = function() {
    var order = this.getOrder();

    var op = order[0];
    var addr = order[1];
    var mode = (order[2] ? 1 : 0);

    switch(order[0]) {
    case 'A':
        if (mode)
            return 'AB += w['+addr+']';
        else
            return 'A += m['+addr+']';
    case 'S':
        if (mode)
            return 'AB -= w['+addr+']';
        else
            return 'A -= m['+addr+']';
    case 'H':
        if (mode)
            return 'RS += w['+addr+']';
        else
            return 'R += m['+addr+']';
    case 'V':
        if (mode)
            return 'ABC += w['+addr+'] * RS';
        else
            return 'AB += m['+addr+'] * R';
    case 'N':
        if (mode)
            return 'ABC -= w['+addr+'] * RS';
        else
            return 'AB -= m['+addr+'] * R';
    case 'T':
        if (mode)
            return 'w['+addr+'] = AB; ABC = 0';
        else
            return 'm['+addr+'] = A; ABC = 0';
    case 'U':
        if (mode)
            return 'w['+addr+'] = AB';
        else
            return 'm['+addr+'] = A';
    case 'C':
        if (mode)
            return 'ABC += w['+addr+'] & RS';
        else
            return 'AB += m['+addr+'] & R';
    case 'R':
    case 'L': {
        var i = 0;
        while (this.get(i) == 0)
            i++;
        if (op == 'L')
            return 'ABC <<= '+(i+1);
        else
            return 'ABC >>= '+(i+1);
    }
    case 'E':
        return 'if A >= 0 goto '+addr;
    case 'G':
        return 'if A < 0 goto '+addr;
    case 'I':
        return 'm['+addr+'] = read()';
    case 'O':
        return 'write(m['+addr+'])';
    case 'F':
        return 'verify';
    case 'Y':
        return 'round ABC';
    case 'Z':
        return 'stop';
    default:
        return '';
    }
};

// Print order as grouped bits
edsac.Value.prototype.printOrderBinary = function() {
    if (this.n != 17)
        throw 'wrong value width for an order';

    var s = this.printBinary();
    return s.substr(0,5)+' '+s.substr(5,1)+' '+s.substr(6,10)+' '+s.substr(16,1);
};
