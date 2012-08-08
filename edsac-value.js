edsac = {};

// A value, represented as a slice of backing bit array (array of 0s and 1s).
// The bits are 'bits[start..start+n]', from youngest to oldest.
//
// The value behaves as a two-complement binary word. To allow for operating
// on values of different widths, we assume that the sign bit extends,
// e.g. '110' = '1111110'. This will likely not be used by the EDSAC emulator,
// but makes the semantics more consistent (a negative number stays negative
// regardless of width).
edsac.Value = function(bits, start, n) {
    if (start == undefined)
        start = 0;
    if (n == undefined)
        n = bits.length;

    this.bits = bits;
    this.start = start;
    this.n = n;
};

// we'll add the methods later
edsac.Value.prototype = {};

// A 'zero' constructor
edsac.zeroValue = function(n) {
    var bits = new Array(n);
    for (var i = 0; i < n; i++)
        bits[i] = 0;
    return new edsac.Value(bits);
};

// Getter/setter for bits. This will make the code a little slower, but
// easier to write.

edsac.Value.prototype.get = function(i) {
    // Outside of the array, we replicate the oldest (sign) bit
    if (i >= this.n)
        return this.signBit();
    return this.bits[this.start+i];
};

edsac.Value.prototype.set = function(i, b) {
    this.bits[this.start+i] = b;
};

edsac.Value.prototype.signBit = function() {
    return this.bits[this.start+this.n-1];
};

edsac.Value.prototype.isZero = function() {
    for (var i = 0; i < this.n; i++)
        if (this.get(i))
            return false;
    return true;
};

// returns -1, 0, 1 (this < v, this == v, this > v)
edsac.Value.prototype.compare = function(v) {
    // First, check sign bits
    var s1 = this.signBit();
    var s2 = v.signBit();

    if (s1 == 1 && s2 == 0)
        return -1;
    if (s1 == 0 && s2 == 1)
        return 1;

    // Now compare the remaining bits. The result
    // will depend on the sign bit
    for (var i = this.n-1; i >= 0; i--) {
        var b1 = this.get(i);
        var b2 = v.get(i);

        if (b1 == 1 && b2 == 0)
            return s1 ? -1 : 1;
        if (b1 == 0 && b2 == 1)
            return s1 ? 1 : -1;
    }
    return 0;
};

// Printing and reading binary

edsac.Value.prototype.printBinary = function() {
    var s = '';
    for (var i = 0; i < this.n; i++)
        s += this.get(this.n-i-1);

    return s;
};

edsac.valueFromBinary = function(s) {
    var n = s.length;
    var bits = new Array(n);
    for (var i = 0; i < n; i++)
        bits[n-i-1] = (s.charAt(i) == '0' ? 0 : 1);
    return new edsac.Value(bits);
};

// A look-up table for the 5-bit numbers 0..10
edsac.decimalTable = [edsac.valueFromBinary('00000'),
                      edsac.valueFromBinary('00001'),
                      edsac.valueFromBinary('00010'),
                      edsac.valueFromBinary('00011'),
                      edsac.valueFromBinary('00100'),
                      edsac.valueFromBinary('00101'),
                      edsac.valueFromBinary('00110'),
                      edsac.valueFromBinary('00111'),
                      edsac.valueFromBinary('01000'),
                      edsac.valueFromBinary('01001'),
                      edsac.valueFromBinary('01010')];

// Print decimal number, signed or unsigned
edsac.Value.prototype.printDecimal = function(signed) {
    // we'll divide v by 10 until it zeroes out
    var v;
    if (signed)
        v = this.copy(this.n);
    else {
        // make an unsigned number, bigger by 1 bit
        v = this.copy(this.n+1);
        // set its sign bit to 0
        v.set(this.n, 0);
    }

    var signBit = v.signBit();
    if (signBit)
        v.negate();

    var s = '';

    while (!v.isZero()) {
        // divide the number by 10...
        var qr = edsac.valueDivRem(v, edsac.decimalTable[10]);
        // the remainder is the digit we need to print
        var r = qr[1];
        // convert from bits to a number
        var d = r.get(0) + 2*r.get(1) + 4*r.get(2) + 8*r.get(3);

        s = String(d)+s;
        // continue with the quotient
        v = qr[0];
    }
    if (s == '')
        s = '0';

    if (signBit)
        s = '-'+s;

    return s;
};

// Reading decimal - we need to specify target length
edsac.valueFromDecimal = function(s, n) {
    var signBit = 0;
    if (s.charAt(0) == '-') {
        signBit = 1;
        s = s.substr(1);
    }

    var result = edsac.zeroValue(n);

    for (var i = 0; i < s.length; i++) {
        result.mult(edsac.decimalTable[10]);
        var d = parseInt(s.charAt(i), 10);
        result.add(edsac.decimalTable[d]);
    }
    if (signBit)
        result.negate();
    return result;
};

// Integer functions - JS floats have only ~53 bits of precision,
// so we disallow them for larger numbers

// Conversion from integer - need to specify number of bits
edsac.valueFromInteger = function(m, n) {
    if (m != Math.floor(m))
        throw 'not an integer';

    var signBit = (m < 0 ? 1 : 0);
    if (signBit)
        m = -m;

    var result = edsac.zeroValue(n);
    for (var i = 0; i < n; i++)
        if (m & (1<<i))
            result.set(i, 1);

    if (signBit)
        result.negate();

    return result;
};

// Conversion to integer, signed or unsigned
edsac.Value.prototype.toInteger = function(signed) {
    if (this.n >= 53)
        throw 'value too wide';

    var m = 0;
    for (var i = 0; i < this.n; i++)
        m += this.get(i)*(1<<i);

    if (signed)
        m -= this.signBit()*(1<<this.n);
    return m;
};

// Return an n-bit copy
edsac.Value.prototype.copy = function(n) {
    if (n == undefined)
        n = this.n;

    var bits = new Array(n);
    for (var i = 0; i < n; i++)
        bits[i] = this.get(i);
    return new edsac.Value(bits);
};

// this = v (assign bits)
edsac.Value.prototype.assign = function(v) {
    for (var i = 0; i < this.n; i++)
        this.set(i, v.get(i));
};

// Make a modifiable slice
edsac.Value.prototype.slice = function(start, n) {
    return new edsac.Value(this.bits, this.start+start, n);
};

// this <<= m
edsac.Value.prototype.shiftLeft = function(m) {
    for (var i = this.n-1; i >= 0; i--)
        this.set(i, i >= m ? this.get(i-m) : 0);
};

// this >>= m (signed)
edsac.Value.prototype.shiftRight = function(m) {
    var signBit = this.signBit();
    for (var i = 0; i < this.n; i++)
        this.set(i, i + m < this.n-1 ? this.get(i+m) : 0);
    this.set(this.n-1, signBit);
};

// this = -this
// (equivalent to this = ~this + 1)
edsac.Value.prototype.negate = function() {
    for (var i = 0; i < this.n; i++)
        this.set(i, 1-this.get(i));
    this.add(new edsac.Value([1,0]));
};

// this += v
edsac.Value.prototype.add = function(v) {
    var carry = 0;
    for (var i = 0; i < this.n; i++)
    {
        // x is in 0,1,2,3
        var x = this.get(i) + v.get(i) + carry;
        this.set(i, x % 2);
        carry = (x >= 2 ? 1 : 0);
    }
};

// this -= v
edsac.Value.prototype.sub = function(v) {
    var carry = 0;
    for (var i = 0; i < this.n; i++)
    {
        // x is in -2,-1,0,1
        var x = this.get(i) - v.get(i) - carry;
        this.set(i, (x % 2 == 0 ? 0 : 1));
        carry = (x < 0 ? 1 : 0);
    }
};

// this &= v
edsac.Value.prototype.and = function(v) {
    for (var i = 0; i < this.n; i++)
        this.set(i, this.get(i) & v.get(i));
};

// v * w
edsac.valueMult = function(v, w) {
    var signBit = 0;
    if (v.signBit()) {
        v = v.copy(); v.negate();
        signBit ^= 1;
    }
    if (w.signBit()) {
        w = w.copy(); w.negate();
        signBit ^= 1;
    }

    var n = v.n + w.n;
    var result = edsac.zeroValue(n);
    var addend = w.copy(n);

    for (var i = 0; i < v.n; i++) {
        if (v.get(i))
            result.add(addend);
        addend.shiftLeft(1);
    }
    if (signBit)
        result.negate();
    return result;
};

// this *= v
edsac.Value.prototype.mult = function(v) {
    this.assign(edsac.valueMult(this, v));
};

// [v // w, v % w]
// The algorithm is taken from
//   http://en.wikipedia.org/wiki/Division_%28digital%29
edsac.valueDivRem = function(v, w) {
    var signBit = 0;
    if (v.signBit()) {
        v = v.copy(); v.negate();
        signBit ^= 1;
    }
    if (w.signBit()) {
        w = w.copy(); w.negate();
        signBit ^= 1;
    }

    if (w.isZero())
        throw 'division by zero';

    var q = edsac.zeroValue(v.n); // quotient
    var r = edsac.zeroValue(w.n+1); // remainder
    for (var i = v.n-1; i >= 0; i--) {
        r.shiftLeft(1);
        r.set(0, v.get(i));

        if (r.compare(w) >= 0) {
            r.sub(w);
            q.set(i, 1);
        }
    }

    if (signBit) {
        q.negate();
        r.negate();
    }

    return [q, r];
};
