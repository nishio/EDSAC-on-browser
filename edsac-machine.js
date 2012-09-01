
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

    this.input = '';
    this.output = new edsac.Printer();

    this.running = true;
};

// Memory getters and setters: w[2n], m[2n or 2n+1]
// No other method should mutate the values acquired by get

edsac.machine.get = function(addr, wide) {
    if (Math.round(addr) != addr ||
        (wide && (addr % 2 != 0)) ||
        addr < 0 ||
        addr >= 2*this.MEM_SIZE)

        throw 'wrong memory address';

    var word = this.mem[(addr - addr % 2)/2];
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

    if (edsac.gui && edsac.gui.active) {
        edsac.gui.onSet(addr);
        if (wide)
            edsac.gui.onSet(addr+1);
    }
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

edsac.machine.setInput = function(s) {
    this.input = s;
    if (edsac.gui && edsac.gui.active)
        edsac.gui.onSetInput(s);
};

edsac.machine.read = function(s) {
    if (this.input.length == 0)
        throw 'empty input tape';
    var c = this.input.charAt(0);
    this.setInput(this.input.substr(1));
    return edsac.valueFromChar(c);
};

edsac.machine.writeNum = function(num) {
    this.output.writeNum(num);
    if (edsac.gui && edsac.gui.active)
        edsac.gui.onSetOutput(this.output.getText());
};

// for the Y order (round)
edsac.machine.BIT_35 = edsac.zeroValue('71');
edsac.machine.BIT_35.set(35, 1);

// Perform one step of execution
edsac.machine.step = function() {
    var orderVal = this.get(this.ip, 0);
    var order = orderVal.getOrder();
    var op = order[0];
    var addr = order[1];
    var mode = (order[2] ? 1 : 0);

    this.ip += 1;

    switch (op) {
    case 'A': // A/AB += mem
        this.setAccum(mode, this.getAccum(mode).add(this.get(addr, mode)));
        break;
    case 'S': // A/AB -= mem
        this.setAccum(mode, this.getAccum(mode).sub(this.get(addr, mode)));
        break;
    case 'H': // R/RS += mem
        this.setMult(mode, this.getMult(mode).add(this.get(addr, mode)));
        break;
    case 'V': // AB/ABC += mem * R/RS
        this.setAccum(mode+1, this.getAccum(mode+1).add(
                          this.get(addr, mode).mult(this.getMult(mode)).shiftLeft(2)));
        break;
    case 'N': // AB/ABC -= mem * R/RS
        this.setAccum(mode+1, this.getAccum(mode+1).sub(
                          this.get(addr, mode).mult(this.getMult(mode)).shiftLeft(2)));
        break;
    case 'U': // mem = A/AB
        this.set(addr, mode, this.getAccum(mode));
        break;
    case 'T': // mem = A/AB; ABC = 0
        this.set(addr, mode, this.getAccum(mode));
        this.setAccum(2, edsac.zeroValue(71));
        break;
    case 'C': // A/AB += mem & R/RS
        this.setAccum(mode+1, this.getAccum(mode+1).add(
                          this.get(addr, mode).and(this.getMult(mode))));
        break;
    case 'R':
    case 'L': {
        // Find rightmost 1-bit
        var i = 0;
        while (orderVal.get(i) == 0)
            i++;
        if (op == 'L')
            this.setAccum(2, this.getAccum(2).shiftLeft(i+1));
        else
            this.setAccum(2, this.getAccum(2).shiftRight(i+1));
        break;
    }
    case 'E': // if A >= 0 goto N
        if (this.getAccum(2).signBit() == 0)
            this.ip = addr;
        break;
    case 'G': // if A < 0 goto N
        if (this.getAccum(2).signBit() == 1)
            this.ip = addr;
        break;
    case 'I': { // read character into 5 lowest bits of m[N]
        var val = this.read();
        this.set(addr, 0, val.copy(17));
        break;
    }
    case 'O': { // output 5 highest bits of m[N] as character
        var val = this.get(addr, false).slice(12, 5);
        this.writeNum(val.toInteger(false));
        break;
    }
    case 'F':
        throw 'unimplemented opcode: ' + op;
    case 'X': // no operation
        break;
    case 'Y': // ABC += {1 at bit 35} (34 counting from the left)
        this.setAccum(2, this.getAccum(2).add(this.BIT_35));
        break;
    case 'Z':
        this.running = false;
        this.ip -= 1; // stay on the same IP
        break;
    default:
        throw 'malformed order: '+orderVal.printOrder();
    }
};
