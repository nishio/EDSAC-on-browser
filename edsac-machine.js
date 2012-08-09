
// Object representing the EDSAC machine. If need be, this
// can be converted into a JavaScript 'class', but right now
//  we need only one.
edsac.machine = {};

// 512 words of 35 bits
edsac.machine.MEM_SIZE = 512;

// Reset the machine state
edsac.machine.init = function() {
    this.mem = new Array(this.MEM_SIZE);

    for (var i = 0; i < this.mem.length; ++i)
        this.mem[i] = edsac.zeroValue(35);

    // Instruction pointer
    this.ip = 0;

    // 71-bit accumulator
    this.abc = edsac.zeroValue(71);
    // its senior 35 bits
    this.ab = this.abc.slice(36, 35);
    // its senior 17 bits
    this.a = this.abc.slice(54, 17);

    // 35-bit multiplier
    this.rs = edsac.zeroValue(35);
    // its senior 17 bits
    this.r = this.rs.slice(18, 17);
};

// Memory getters and setters: w[2n], m[2n or 2n+1]
// No other method should mutate the values acquired by get

edsac.machine.get = function(addr, wide) {
    if (Math.round(addr) != addr ||
        (wide && (addr % 2 != 0)) ||
        addr < 0 ||
        addr >= this.MEM_SIZE)

        throw 'wrong memory address';

    var word = this.mem[addr - addr % 2];
    if (wide)
        return word;
    else {
        if (addr % 2 == 0)
            return word.slice(0, 17);
        else
            return word.slice(18, 17);
    }
};

edsac.machine.set = function(addr, wide, value) {
    if (value.n != (wide ? 35 : 17))
        throw 'wrong value width';

    this.get(addr, wide).assign(value);
};

// Accumulator getters and setters,
// accept 0, 1, 2 for A, AB, ABC respectively

edsac.machine.getAccum = function(mode) {
    if (mode == 0)
        return this.a;
    else if (mode == 1)
        return this.ab;
    else
        return this.abc;
};

edsac.machine.setAccum = function(mode, value) {
    if (value.n != (mode == 2 ? 71 :
                    mode == 1 ? 35 :
                    17))
        throw 'wrong value width';

    this.getAccum(mode).assign(value);
};

// Multiplier getters and setters,
// accept 0 for R, 1 for RS

edsac.machine.getMult = function(mode) {
    if (mode == 0)
        return this.r;
    else
        return this.rs;
};

edsac.machine.setMult = function(mode, value) {
    if (value.n != (mode ? 35 : 17))
        throw 'wrong value width';

    this.getMult(mode).assign(value);
};
