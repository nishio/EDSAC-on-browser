# -*- encoding: utf-8 -*-
"""
EDSAC emulator
"""
from parser import Value, _ascii_to_edsac, _number2bits
BIT_MASK_17 = (1 << 17) - 1

class Edsac(object):
    def __init__(self):
        # 35bits word * 512
        self.memory = [WideValue() for i in range(512)]
        # ABC register: 71bits accumulator
        self.accumulator = ThreeValue()
        # RC register: 35bits multiplier
        self.multiplier = WideValue()

        self.cards = []
        self.next_char = 0

        self.sequence_control = 0

    def get_multiplier(self, wide=False):
        if wide:
            return self.multiplier
        return self.multiplier.high

    def set_multiplier(self, value, wide=False):
        if wide:
            assert isinstance(value, WideValue)
            self.multiplier = value
        self.multiplier.high = value

    def set_memory(self, address, value, wide=False):
        assert 0 <= address < 1024
        if wide:
            assert isinstance(value, WideValue)
            self.memory[address / 2] = value
        else:
            assert isinstance(value, Value)
            is_high = address % 2 # m[1] is senior half of w[0]
            w = self.memory[address / 2]
            if is_high:
                w.high = value
            else:
                w.low = value

    def get_memory(self, address, wide=False):
        assert 0 <= address < 1024
        is_high = address % 2 # m[1] is senior half of w[0]
        w = self.memory[address / 2]
        if wide:
            assert is_high == 0
            return w
        else:
            if is_high:
                return w.high
            else:
                return w.low

    def clear_accumulator(self):
        self.accumulator.__init__()

    def get_accumulator(self, wide=False):
        """
        from ABC accumulator register,
        return senior 17 bit (A) or
        return senior 35 bit (AB)
        """
        if wide: # AB
            return self.accumulator.high
        return self.accumulator.high.high # A

    def set_accumulator(self, value, wide=False):
        if wide:
            assert isinstance(value, WideValue)
            self.accumulator.high = value
        else:
            assert isinstance(value, Value)
            self.accumulator.high.high = value


    def load_initial_order(self):
        i = 0
        for line in open("initial_order.txt"):
            bits_str = line[:20]
            v = Value.from_bits_string(bits_str)
            self.set_memory(i, v)
            i += 1

    def set_cards_from_file(self):
        self.cards = []
        for line in open("square_card.txt"):
            if line == "\n":
                continue # skip empty line
            self.cards.append(line[0])

        assert self.cards[0] == "T"
        self.next_char = 0

    def set_cards(self, cards):
        assert all(isinstance(c, str) and len(c) == 1
                   for c in cards)
        self.cards = cards
        self.next_char = 0

    def start(self):
        # The 10-bit sequence control register (scr) holds address of next instruction
        self.sequence_control = 0
        is_finished = False
        while not is_finished:
            is_finished = self.step()

    def step(self):
        assert 0 <= self.sequence_control < 1024
        instr = self.get_memory(self.sequence_control)
        # debug
        print self.accumulator
        print self.sequence_control, instr.as_order()
        op, addr, sl = instr.as_order()
        wide = (sl == "L")
        if self.sequence_control == 13:
            print self.get_accumulator()
        if op == "T":
            # TnS: m[n]=A; ABC=0
            # TnL: w[n]=AB; ABC=0
            self.set_memory(addr, self.get_accumulator(wide), wide)
            self.clear_accumulator()
        elif op == "H":
            # HnS: R += m[n]
            # HnL: RS += w[n]
            m = self.get_memory(addr, wide)
            r = self.get_multiplier(wide)
            r = m + r
            self.set_multiplier(r, wide)

        elif op == "E":
            # if A >= 0 goto n
            if self.sequence_control == 14:
                print self.get_accumulator()
                print self.get_accumulator().as_number()
            if self.get_accumulator().bits[0] == 0: # A >= 0
                self.sequence_control = addr - 1
        elif op == "G":
            # if A < 0 goto n
            if self.get_accumulator().bits[0] == 1: # A < 0
                self.sequence_control = addr - 1

        elif op == "I":
            # Place the next paper tape character in the least significant 5 bits of m[n].
            c = self.cards[self.next_char]
            self.next_char += 1
            v = _ascii_to_edsac(c)
            print "read", c
            bits = _number2bits(v, width=5)
            self.get_memory(addr).bits[:5] = bits

        elif op == "A":
            # AnS: A += m[n]
            # AnL: AB += w[n]
            m = self.get_memory(addr, wide)
            r = self.get_accumulator(wide)
            r = m + r
            self.set_accumulator(r, wide)
        elif op == "S":
            m = self.get_memory(addr, wide)
            r = self.get_accumulator(wide)
            r = m - r
            self.set_accumulator(r, wide)

        elif op == "V":
            m = self.get_memory(addr, wide)
            r = self.get_multiplier(wide)
            v = m.as_number() * r.as_number()
            if wide:
                a = accumulator
            else:
                a = self.get_accumulator(wide=True)
            v += a.as_number()
            a.from_number(v)
        elif op == "N":
            m = self.get_memory(addr, wide)
            r = self.get_multiplier(wide)
            v = m.as_number() * r.as_number()
            if wide:
                a = self.accumulator
            else:
                a = self.get_accumulator(wide=True)
            v -= a.as_number()
            a.from_number(v)

        elif op == "R":
            # Shift right
            num_shift = _calc_num_shift(instr)
            v = self.accumulator.as_number()
            print self.accumulator
            print v
            v = v >> num_shift
            print self.accumulator
            print v
            self.accumulator.from_number(v)
            print self.accumulator
        elif op == "L":
            # Shift left
            num_shift = _calc_num_shift(instr)
            v = self.accumulator.as_number()
            v = v << num_shift
            self.accumulator.from_number(v)

        elif op == "U":
            # UnS: m[n]=A
            # UnL: w[n]=AB
            self.set_memory(addr, self.get_accumulator(wide))

        elif op == "C":
            raise NotImplementedError
        elif op == "Y":
            raise NotImplementedError

        elif op == "O":
            # output
            print "output", self.get_memory(addr).as_character()

        elif op == "X":
            pass # no operation
        elif op == "F":
            raise NotImplementedError("Verify the last character output. What?")
        elif op == "Z":
            # finish
            return True
        else:
            raise NotImplementedError(instr.as_order())

        self.sequence_control += 1
        return False # not finished

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
            (self.high.as_number() << 18) +
            (self.padding_bit << 17) +
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

    def __repr__(self):
        return "%s %d %s" % (
            self.high.as_bits_string(),
            self.padding_bit,
            self.low.as_bits_string())


class ThreeValue(object):
    def __init__(self, high=None, low=None, padding_bit=0):
        if not high: high = Value()
        if not low: low = Value()
        self.high = WideValue()
        self.padding_bit = padding_bit
        self.low = Value()

    def from_number(self, v):
        assert isinstance(v, int) or isinstance(v, long), v
        print "v", v
        low = v & BIT_MASK_17
        padding_bit = (v >> 17) & 1
        high = v >> 18
        print high, padding_bit, low
        self.high = WideValue.from_number(high)
        self.low = Value.from_number(low)
        self.padding_bit = padding_bit

    def as_number(self):
        return (
            (self.high.as_number() << 18) +
            (self.padding_bit << 17) +
            self.low.as_number())

    def __repr__(self):
        return "%r %d %s" % (
            self.high,
            self.padding_bit,
            self.low.as_bits_string())

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

def _test_initial_order():
    global edsac
    edsac = Edsac()
    edsac.load_initial_order()
    edsac.set_cards_from_file()

    for i in range(3): edsac.step() # put 10<<11 in R
    assert edsac.multiplier.high.as_number() == 10 << 11

    edsac.step() # 5: goto 6
    assert edsac.sequence_control == 6

    edsac.step()
    edsac.step() # 7: read T(5) in m[0]
    assert edsac.get_memory(0).bits[:5] == [0, 0, 1, 0, 1]
    edsac.step() # 8: A += m[0]
    assert edsac.get_accumulator().bits[:5] == [0, 0, 1, 0, 1]
    edsac.step() # 9: ABC >>= 6
    assert edsac.get_accumulator().as_bits_string() == "00000000101000000"
    edsac.step() # 10: w[0] = AB; ABC=0
    # m[0] is now 0
    assert edsac.get_memory(0).as_number() == 0
    edsac.step() # 11: read 1 into m[2]
    assert edsac.get_memory(2).bits[:5] == [0, 0, 0, 0, 1]
    edsac.step() # 12: A+=m[2]
    assert edsac.get_accumulator().bits[:5] == [0, 0, 0, 0, 1]
    edsac.step() # 13: A-=m[5]
    assert edsac.get_memory(5).as_bits_string() == "00000000000001010"
    print edsac.get_accumulator().as_bits_string()

def _test():
    import doctest
    doctest.testmod()
    _test_initial_order()

def main():
    edsac = Edsac()
    edsac.load_initial_order()
    edsac.set_cards_from_file()
    edsac.start()


if __name__ == '__main__':
    _test()
    main()
