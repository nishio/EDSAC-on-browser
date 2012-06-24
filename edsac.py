# -*- encoding: utf-8 -*-
"""
EDSAC emulator
"""
import sys
from common import *
from values import Value, WordValue, DoubleWordValue, real_to_unsigned #, _ascii_to_edsac, _number2bits, bits_to_unsigned
from io import ascii_to_edsac  # used in "I" instraction



class Edsac(object):
    def __init__(self):
        # 35bits word * 512
        self.memory = [WordValue() for i in range(512)]
        # ABC register: 71bits accumulator
        self.accumulator = DoubleWordValue()
        # RC register: 35bits multiplier
        self.multiplier = WordValue()
        self.cards = []
        self.next_char = 0
        self.sequence_control = 0

    def get_multiplier(self, wide=False):
        if wide:
            return self.multiplier
        return self.multiplier.high

    def set_multiplier(self, value, wide=False):
        if wide:
            assert isinstance(value, WordValue)
            self.multiplier = value
        assert isinstance(value, Value)
        self.multiplier.high = value

    def set_memory(self, address, value, wide=False):
        assert 0 <= address < 1024
        if wide:
            assert isinstance(value, WordValue)
            self.memory[address / 2] = value
        else:
            assert isinstance(value, Value)
            is_high = address % 2  # m[1] is senior half of w[0]
            w = self.memory[address / 2]
            if is_high:
                w.high = value
            else:
                w.low = value

    def get_memory(self, address, wide=False):
        assert MIN_MEMORY_ADDR <= address < MAX_MEMORY_ADDR
        is_high = address % 2  # m[1] is senior half of w[0]
        word = self.memory[address / 2]
        if wide:
            assert is_high == 0
            return word
        else:
            if is_high:
                return word.high
            else:
                return word.low

    def clear_accumulator(self):
        self.accumulator.__init__()

    def get_accumulator(self, wide=False):
        """
        from ABC accumulator register,
        return senior 17 bit (A) or
        return senior 35 bit (AB)
        """
        if wide:  # AB
            return self.accumulator.high
        return self.accumulator.high.high  # A

    def set_accumulator(self, value, wide=False):
        if wide:
            assert isinstance(value, WordValue)
            self.accumulator.high = value
        else:
            assert isinstance(value, Value)
            self.accumulator.high.high = value

    def load_initial_order(self):
        for i, line in enumerate(open("initial_order.txt")):
            bits_str = line[:20]
            v = Value.from_bits_string(bits_str)
            self.set_memory(i, v)

    def set_cards_from_file(self):
        self.cards = []
        for line in open("square_card.txt"):
            if line == "\n":
                continue  # skip empty line
            self.cards.append(line[0])

        assert self.cards[0] == "T"
        self.next_char = 0

    def set_cards(self, cards):
        assert all(isinstance(c, str) and len(c) == 1
                   for c in cards)
        self.cards = cards
        self.next_char = 0

    def start(self):
        # The 10-bit sequence control register (scr)
        # holds address of next instruction
        self.sequence_control = 0
        is_finished = False
        while not is_finished:
            is_finished = self.step()

    def step(self):
        assert MIN_MEMORY_ADDR <= self.sequence_control < MAX_MEMORY_ADDR
        instr = self.get_memory(self.sequence_control)
        # debug
        print self.accumulator
        print self.sequence_control, instr.as_order()
        op, addr, sl = instr.as_order()
        wide = (sl == "L")

        if op == "T":
            # TnS: m[n]=A; ABC=0
            # TnL: w[n]=AB; ABC=0
            a = self.get_accumulator(wide)
            self.set_memory(addr, a, wide)
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
            a = self.get_accumulator()
            if not a.is_negative():  # A >= 0
                self.sequence_control = addr - 1
        elif op == "G":
            # if A < 0 goto n
            a = self.get_accumulator()
            if a.is_negative():  # A < 0
                self.sequence_control = addr - 1

        elif op == "I":
            #  Place the next paper tape character
            #  in the *least* significant 5 bits of m[n].
            c = self.cards[self.next_char]
            self.next_char += 1
            v = ascii_to_edsac(c)
            print "read", c
            self.set_memory(addr, Value.new_from_number(v))

        elif op == "A":
            # AnS: A += m[n]
            # AnL: AB += w[n]
            m = self.get_memory(addr, wide)
            r = self.get_accumulator(wide)
            r = r + m
            self.set_accumulator(r, wide)
        elif op == "S":
            m = self.get_memory(addr, wide)
            r = self.get_accumulator(wide)
            r = r - m
            self.set_accumulator(r, wide)

        elif op == "V":
            m = self.get_memory(addr, wide)
            r = self.get_multiplier(wide)
            v = m.as_real() * r.as_real()
            if wide:
                a = self.accumulator
            else:
                a = self.get_accumulator(wide=True)
            v = real_to_unsigned(v, 35) # bad idea
            v += a.as_integer()
            a.set_from_number(v)

        elif op == "N":
            m = self.get_memory(addr, wide)
            r = self.get_multiplier(wide)
            v = m.as_integer() * r.as_integer()
            if wide:
                a = self.accumulator
            else:
                a = self.get_accumulator(wide=True)
            v -= a.as_integer()
            a.set_from_number(v)

        elif op == "R":
            # Shift right
            num_shift = _calc_num_shift(instr)
            v = self.accumulator.as_integer()
            v = v >> num_shift
            self.accumulator.set_from_number(v)

        elif op == "L":
            # Shift left
            num_shift = _calc_num_shift(instr)
            v = self.accumulator.as_unsigned()
            v = v << num_shift
            self.accumulator.set_from_number(v)

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
            pass  # no operation
        elif op == "F":
            raise NotImplementedError("Verify the last character"
                                      "output. What?")
        elif op == "Z":
            # finish
            return True
        else:
            raise AssertionError("Malformed Instruction:", instr.as_order())

        self.sequence_control += 1
        return False  # not finished




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
    global edsac
    edsac = Edsac()
    edsac.load_initial_order()
    edsac.set_cards_from_file()
    edsac.start()


if __name__ == '__main__':
    if 'test' in sys.argv:
        print "Running tests..."
        from tests import _test
        edsac = Edsac()
        _test(edsac)
    elif globals().get("DEBUG"):
        # make easy debug on ipython
        print "Running tests..."
        import tests
        reload(tests)
        edsac = Edsac()
        tests._test(edsac)
    else:
        main()
