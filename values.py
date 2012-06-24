# -*- encoding: utf-8 -*-
"""
Edsac value representation

Edsac has 17bit, 35bit and 71bit memory storage.
We use 5 types of representation: list of 0 or 1 (called 'bits'),
   string of '0' '1' or ' ' (called 'bit_string'),
   unsigned integer, signed integer and real.
Conversation between those are 20 pattern. It's not good design.
We use a mediator class 'Value' instead of storing directly.
"""
from common import *
import re
from io import ascii_to_edsac, edsac_to_ascii

def bits_to_unsigned(bits):
    """
    >>> bits_to_unsigned([1, 1, 1])
    7
    """
    result = 0
    for v in bits:
        result *= 2
        result += v
    return result


#
# Values
def _number2bits(number, width=HALF_WORD_LENGTH):
    result = []
    # round into 0 .. (1 << width) - 1
    number %= (1 << width)
    for i in xrange(width):
        result.insert(0, number & 1)
        number /= 2
    return result



def real_to_bits(v, bitwidth=17):
    """
    >>> real_to_bits(-0.5)
    [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    >>> real_to_bits(0.1875)
    [0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    """
    sign = 0
    if v < 0:
        sign = 1
        v *= -1
    buf = [sign]
    for i in range(bitwidth - 1):
        v *= 2
        if v >= 1:
            buf.append(1)
            v -= 1
        else:
            buf.append(0)
    return buf

def real_to_unsigned(v, bitwidth=17):
    return bits_to_unsigned(real_to_bits(v, bitwidth))

class Value(object):
    """
    Value object hold 17 bits.
    It can construct from number, order_string, order

    >>> Value().as_number()
    0
    """
    bitwidth = 17

    def __init__(self, bits=None):
        if bits:
            assert len(bits) == HALF_WORD_LENGTH
            self.bits = bits
        else:
            self.bits = [0] * HALF_WORD_LENGTH

    @staticmethod
    def new_from_number(v):
        """
        >>> x = Value.new_from_number(1234)
        >>> x.bits
        [0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0]
        >>> x.as_number()
        1234
        """
        return Value(_number2bits(v))

    def set_from_number(self, v):
        """
        >>> x = Value.new_from_number(1234)
        >>> x.bits
        [0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0]
        >>> x.as_number()
        1234
        """
        sign_bit = 0
        if v < 0 or v > (1 << 16):
            sign_bit = 1

        self.bits = [sign_bit] + _number2bits(v, 16)
        return self

    def as_number(self):
        """
        >>> x = Value.new_from_number(1234)
        >>> x.bits
        [0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0]
        >>> x.as_number()
        1234
        >>> Value.from_bits_string("00000000000100001").as_number()
        33
        >>> Value.from_bits_string("11111111111101111").as_number()
        -17
        """
        v = bits_to_unsigned(self.bits[1:])
        if self.bits[0] == 1:
            v -= (1 << 16)
        return v

    def as_real(self):
        """
        >>> Value.from_bits_string("00011000000000000").as_real()
        0.1875
        >>> Value.from_bits_string("11000000000000000").as_real()
        -0.5
        """
        sign = 1
        if self.bits[0] == 1:
            sign = -1

        value = bits_to_unsigned(self.bits[1:])
        return sign * value / float(1 << 16)


    @staticmethod
    def from_order(order):
        """
        >>> x = Value.from_order(('R', 16, 'S'))
        >>> x.as_pretty_bits_string()
        '00100 0 0000010000 0'
        >>> x = Value.from_order(('T', 11, 'L'))
        >>> x.as_pretty_bits_string()
        '00101 0 0000001011 1'
        """
        op, addr, sl = order
        assert isinstance(op, str) and len(op) == 1
        assert isinstance(addr, int)
        assert sl in ['S', 'L']
        if sl == 'S':
            sl = [0]
        else:
            sl = [1]
        if addr < 2 ** 10:
            # 5 bits op
            op_bit = _number2bits(ascii_to_edsac(op), 5)
            # 1 bit unused
            unused_bit = [0]
            # 10 bits address
            addr_bit = _number2bits(addr, 10)
            # 1 bit S/L
            result = op_bit + unused_bit + addr_bit + sl
        else:
            # such as "P10000S"
            if op != "P":
                raise NotImplementedError(
                    "I don't know how to put %s in bits" % order)
            # 16 bits
            result = _number2bits(addr, 16) + sl
        return Value(result)

    def as_order(self):
        """
        >>> x = Value.from_order(('R', 16, 'S'))
        >>> x.as_order()
        ('R', 16, 'S')
        >>> x = Value.from_order(('T', 11, 'L'))
        >>> x.as_order()
        ('T', 11, 'L')
        """
        assert len(self.bits) == HALF_WORD_LENGTH
        op = edsac_to_ascii(bits_to_unsigned(self.bits[:5]))
        addr = bits_to_unsigned(
            self.bits[
                ORDER_FORMAT['ADDRESS_START']: ORDER_FORMAT['ADDRESS_END']
            ]
        )  # 6:16
        sl = 'SL'[self.bits[ORDER_FORMAT['SL']]]
        return (op, addr, sl)

    @staticmethod
    def from_bits_string(s):
        """
        >>> Value.from_bits_string('00100 0 0000010000 0')
        00100 0 0000010000 0
        """
        bits = re.findall("[01]", s)
        assert len(bits) == HALF_WORD_LENGTH
        return Value([int(i) for i in bits])

    def as_pretty_bits_string(self):
        """
        >>> Value([0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0])
        00100 0 0000010000 0
        """
        return '{}{}{}{}{} {} {}{}{}{}{}{}{}{}{}{} {}'.format(*self.bits)

    def as_bits_string(self):
        return '{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}'.format(*self.bits)

    def __repr__(self):
        return self.as_pretty_bits_string()

    @staticmethod
    def from_order_string(s):
        """
        >>> Value.from_order_string('PS')
        00000 0 0000000000 0
        >>> Value.from_order_string('P10000S')
        00100 1 1100010000 0
        >>> Value.from_order_string('QS')
        00001 0 0000000000 0
        >>> Value.from_order_string('#S')
        01011 0 0000000000 0
        """
        s = s.upper()
        m = re.match(ORDER_PATTERN, s)
        if not m:
            raise AssertionError("Can't parse: %s" % s)
        op, addr, sl = m.groups()
        if addr == "":
            addr = "0"
        addr = int(addr)
        return Value.from_order((op, addr, sl))

    def _as_character(self):
        # FIXME: switching letters/figures needed
        return FIGURES[bits_to_unsigned(
            self.bits[ORDER_FORMAT['OP_START']: ORDER_FORMAT['OP_END']]
        )]

    def __add__(self, v):
        assert isinstance(v, Value)
        return Value.new_from_number(
            self.as_number() + v.as_number())

    def __sub__(self, v):
        assert isinstance(v, Value)
        return Value.new_from_number(
            self.as_number() - v.as_number())

    def is_negative(self):
        return (self.bits[0] == 1)

class WordValue(Value):  # TODO: rename to WordValue
    "35bit words"
    bitwidth = 31
    def __init__(self, high=None, low=None, padding_bit=0):
        if not high:
            high = Value()
        if not low:
            low = Value()
        self.high = high
        self.low = low
        self.padding_bit = padding_bit

    def as_number(self):
        return (
            (self.high.as_number() << 18) +
            (self.padding_bit << 17) +
            self.low.as_number())

    @staticmethod
    def new_from_number(v):
        assert isinstance(v, int) or isinstance(v, long), v
        ret = WordValue()
        ret.set_from_number(v)
        return ret

    def set_from_number(self, v):
        assert isinstance(v, int) or isinstance(v, long), v
        low = v & BIT_MASK_17
        padding_bit = (v >> 17) & 1
        high = v >> 18
        self.high.set_from_number(high)
        self.low.set_from_number(low)
        self.padding_bit = padding_bit
        return self

    def __add__(self, v):
        assert isinstance(v, WordValue)
        return WordValue.new_from_number(
            self.as_number() + v.as_number())

    def __repr__(self):
        return "{} {} {}".format(
            self.high.as_bits_string(),
            self.padding_bit,
            self.low.as_bits_string())


class DoubleWordValue(Value):  #TODO rename to DoubleWordValue
    """
    71-bit register (for accumlator)
    """
    bitwidth = 71
    def __init__(self, high=None, low=None, padding_bit=0):
        if not high:
            high = WordValue()
        if not low:
            low = WordValue()
        self.high = high
        self.padding_bit = padding_bit
        self.low = low

    def set_from_number(self, v):
        assert isinstance(v, int) or isinstance(v, long), v
        low = v & BIT_MASK_17
        padding_bit = (v >> 17) & 1
        high = v >> 18
        self.high = WordValue.new_from_number(high)
        self.low = Value.new_from_number(low)
        self.padding_bit = padding_bit

    def as_number(self):
        return (
            (self.high.as_number() << 36) +
            (self.padding_bit << 35) +
            self.low.as_number())

    def __repr__(self):
        return "{} {} {}".format(
            self.high,
            self.padding_bit,
            self.low)


def _test_parser():
    MAX_BITS_LINE_LENGTH = 20
    INITIAL_ORDER_LINE_STARTS = 21

    for line in file("initial_order.txt"):
        bits_str = line[:MAX_BITS_LINE_LENGTH]
        order_str = line[INITIAL_ORDER_LINE_STARTS:].split()[1]
        assert (
            Value.from_order_string(order_str)
            .as_pretty_bits_string() == bits_str)

    for line in file("square.txt"):
        bits_str = line[:MAX_BITS_LINE_LENGTH]
        order_str = line[INITIAL_ORDER_LINE_STARTS:].split()[1]
        assert (
            Value.from_order_string(order_str)
            .as_pretty_bits_string() == bits_str), line


def _test():
    import doctest
    doctest.testmod()

if __name__ == '__main__':
    _test()
    _test_parser()
