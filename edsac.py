# -*- encoding: utf-8 -*-
"""
EDSAC emulator
"""
from parser import Value, _ascii_to_edsac, _number2bits
BIT_MASK_17 = 0b11111111111111

class WideValue(object):
    "35bit words"
    def __init__(self, high=None, low=None, padding_bit=0):
        if not high: high = Value()
        if not low: low = Value()
        self.high = high
        self.low = low
        self.padding_bit = padding_bit

    def as_number(self):
        return (
            self.high.as_number() << 18 +
            self.padding_bit << 17 +
            self.low.as_number())

    @staticmethod
    def from_number(v):
        assert isinstance(v, int) or isinstance(v, long), v
        low = v & BIT_MASK_17
        padding_bit = (v >> 17) & 1
        high = v >> 18
        return WideValue(
            Value.from_number(high),
            Value.from_number(low),
            padding_bit)

    def __add__(self, v):
        assert isinstance(v, WideValue)
        return WideValue.from_number(
            self.as_number() + v.as_number())

memory = [WideValue() for i in range(512)]

def set_memory(address, value, wide=False):
    assert 0 <= address < 1024
    if wide:
        assert isinstance(value, WideValue)
        memory[address / 2] = value
    else:
        assert isinstance(value, Value)
        is_high = address % 2 # m[1] is senior half of w[0]
        w = memory[address / 2]
        if is_high:
            w.high = value
        else:
            w.low = value

def get_memory(address, wide=False):
    assert 0 <= address < 1024
    is_high = address % 2 # m[1] is senior half of w[0]
    w = memory[address / 2]
    if wide:
        assert is_high == 0
        return w
    else:
        if is_high:
            return w.high
        else:
            return w.low

# ABC register: accumulator
class ThreeValue(object):
    def __init__(self, high=None, low=None, padding_bit=0):
        if not high: high = Value()
        if not low: low = Value()
        self.high = WideValue()
        self.padding_bit = padding_bit
        self.low = Value()

    def from_number(self, v):
        assert isinstance(v, int) or isinstance(v, long), v
        low = v & BIT_MASK_17
        padding_bit = (v >> 17) & 1
        high = v >> 18
        self.high = WideValue.from_number(high)
        self.low = Value.from_number(low)
        self.padding_bit = padding_bit

    def as_number(self):
        return (
            self.high.as_number() << 18 +
            self.padding_bit << 17 +
            self.low.as_number())

def clear_accumulator():
    accumulator.__init__()

def get_accumulator(wide=False):
    """
    from ABC accumulator register,
    return senior 17 bit (A) or
    return senior 35 bit (AB)
    """
    global accumulator
    if wide: # AB
        return accumulator.high
    return accumulator.high.high # A

def set_accumulator(value, wide=False):
    if wide:
        assert isinstance(value, WideValue)
        accumulator.high = value
    else:
        assert isinstance(value, Value)
        accumulator.high.high = value

accumulator = ThreeValue()

# RC register: multiplier
multiplier = WideValue()
def get_multiplier(wide=False):
    if wide:
        return multiplier
    return multiplier.high

def set_multiplier(value, wide=False):
    global multiplier
    if wide:
        assert isinstance(value, WideValue)
        multiplier = value
    multiplier.high = value


def _test():
    import doctest
    doctest.testmod()

def load_initial_order():
    i = 0
    for line in open("initial_order.txt"):
        bits_str = line[:20]
        v = Value.from_bits_string(bits_str)
        set_memory(i, v)
        i += 1

def set_cards():
    global cards, next_char
    cards = []
    for line in open("square_card.txt"):
        if line == "\n":
            continue # skip empty line
        cards.append(line[0])

    assert cards[0] == "T"
    next_char = 0

def start():
    global sequence_control
    # The 10-bit sequence control register (scr) holds address of next instruction
    sequence_control = 0
    is_finished = False
    while not is_finished:
        is_finished = step()

def step():
    global sequence_control, next_char
    assert 0 <= sequence_control < 1024
    instr = get_memory(sequence_control)
    print instr.as_order()
    op, addr, sl = instr.as_order()
    wide = (sl == "L")

    if op == "T":
        # TnS: m[n]=A; ABC=0
        # TnL: w[n]=AB; ABC=0
        set_memory(addr, get_accumulator(wide), wide)
        clear_accumulator()
    elif op == "H":
        # HnS: R += m[n]
        # HnL: RS += w[n]
        m = get_memory(addr, wide)
        r = get_multiplier(wide)
        r = m + r
        set_multiplier(r, wide)

    elif op == "E":
        # if A >= 0 goto n
        if get_accumulator().bits[0] == 0: # A >= 0
            sequence_control = addr - 1
    elif op == "G":
        # if A < 0 goto n
        if get_accumulator().bits[0] == 1: # A < 0
            sequence_control = addr - 1

    elif op == "I":
        # Place the next paper tape character in the least significant 5 bits of m[n].
        c = cards[next_char]
        next_char += 1
        v = _ascii_to_edsac(c)
        print "read", c
        bits = _number2bits(v, width=5)
        get_memory(addr).bits[:5] = bits

    elif op == "A":
        # AnS: A += m[n]
        # AnL: AB += w[n]
        m = get_memory(addr, wide)
        r = get_accumulator(wide)
        r = m + r
        set_accumulator(r, wide)
    elif op == "S":
        m = get_memory(addr, wide)
        r = get_accumulator(wide)
        r = m - r
        set_accumulator(r, wide)
    elif op == "V":
        m = get_memory(addr, wide)
        r = get_multiplier(wide)
        v = m.as_number() * r.as_number()
        if wide:
            a = accumulator
        else:
            a = get_accumulator(wide=True)
        v += a.as_number()
        a.from_number(v)
    elif op == "N":
        m = get_memory(addr, wide)
        r = get_multiplier(wide)
        v = m.as_number() * r.as_number()
        if wide:
            a = accumulator
        else:
            a = get_accumulator(wide=True)
        v -= a.as_number()
        a.from_number(v)

    elif op == "R":
        # Shift right
        num_shift = _calc_num_shift(instr)
        v = accumulator.as_number()
        v = v >> num_shift
        accumulator.from_number(v)
    elif op == "L":
        # Shift left
        num_shift = _calc_num_shift(instr)
        v = accumulator.as_number()
        v = v << num_shift
        accumulator.from_number(v)

    elif op == "U":
        # UnS: m[n]=A
        # UnL: w[n]=AB
        set_memory(addr, get_accumulator(wide))

    elif op == "O":
        # output
        print "output", get_memory(addr).as_character()

    elif op == "X":
        pass # no operation
    elif op == "F":
        raise NotImplementedError("Verify the last character output. What?")
    else:
        raise NotImplementedError(instr.as_order())

    sequence_control += 1

def _calc_num_shift(instr):
    """
    >>> def test(s): return _calc_num_shift(Value.from_order_string(s))
    >>> test("R0L")
    1
    >>> test("R1S")
    2
    >>> test("R16S")
    6
    >>> test("R0S")
    15
    >>> test("L0L")
    1
    >>> test("L1S")
    2
    >>> test("L16S")
    6
    >>> test("L64S")
    8
    >>> test("L0S")
    13
    """
    num_shift = 1
    bits = instr.bits
    while bits[17 - num_shift] == 0:
        num_shift += 1
    return num_shift

def main():
    load_initial_order()
    set_cards()
    start()

if __name__ == '__main__':
    _test()
    main()
