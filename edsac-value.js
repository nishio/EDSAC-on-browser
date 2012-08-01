edsac = {};

// A value, represented as a slice of backing bit array (array of 0s and 1s).
// The bits are 'bits[start..start+n]', from youngest to oldest.
// The value behaves as a two-complement binary word of a fixed length.
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
    return this.bits[this.start+i];
};

edsac.Value.prototype.set = function(i, b) {
    this.bits[this.start+i] = b;
};

edsac.Value.prototype.printBinary = function() {
    var s = '';
    for (var i = this.n-1; i >= 0; i--)
        s += this.get(i);

    return s;
};
