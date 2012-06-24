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
from io import ascii_to_edsac, edsac_to_letter

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


def _max_int(bitwidth):
    return (1 << (bitwidth - 1)) - 1

def _int_ubound(bitwidth):
    return 1 << (bitwidth - 1)

def _bit_mask(bitwidth):
    return (1 << bitwidth) - 1

class Value(object):
    """
    Value object hold 17 bits.
    It can construct from number, order_string, order

    >>> Value().as_integer()
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
        >>> x.as_integer()
        1234
        """
        return Value(_number2bits(v))

    def set_from_number(self, v):
        """
        >>> x = Value.new_from_number(1234)
        >>> x.bits
        [0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0]
        >>> x.as_integer()
        1234
        """
        sign_bit = 0
        if v < 0 or v > _max_int(self.bitwidth):
            sign_bit = 1

        self.bits = [sign_bit] + _number2bits(v, self.bitwidth - 1)
        return self

    def as_integer(self):
        """
        >>> x = Value.new_from_number(1234)
        >>> x.bits
        [0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0]
        >>> x.as_integer()
        1234
        >>> Value.from_bits_string("00000000000100001").as_integer()
        33
        >>> Value.from_bits_string("11111111111101111").as_integer()
        -17
        """
        v = bits_to_unsigned(self.bits[1:])
        if self.bits[0] == 1:
            v -= _int_ubound(self.bitwidth)
        return v

    def as_unsigned(self):
        """
        >>> Value.from_bits_string("11111111111101111").as_unsigned()
        131055
        """
        return bits_to_unsigned(self.bits)

    def as_real(self):
        """
        >>> Value.from_bits_string("00011000000000000").as_real()
        0.1875
        >>> Value.from_bits_string("11000000000000000").as_real()
        -0.5
        """
        return self.as_integer() / float(_int_ubound(self.bitwidth))

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
        op = edsac_to_letter(bits_to_unsigned(self.bits[:5]))
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

    def as_charcode(self):
        return bits_to_unsigned(
            self.bits[ORDER_FORMAT['OP_START']: ORDER_FORMAT['OP_END']]
        )

    def __add__(self, v):
        Assert(self.bitwidth).equal(v.bitwidth);
        return Value.new_from_number(
            self.as_integer() + v.as_integer())

    def __sub__(self, v):
        Assert(self.bitwidth).equal(v.bitwidth);
        return Value.new_from_number(
            self.as_integer() - v.as_integer())

    def is_negative(self):
        return (self.bits[0] == 1)

def _empty_storage(bitwidth):
    if bitwidth == 17:
        return Value()
    elif bitwidth == 35:
        return WordValue()
    else:
        raise AssertionError("17bit or 35bit required")

class WordValue(Value):
    "35bit words"
    bitwidth = 35
    halfwidth = 17 # (35 - 1) / 2
    def __init__(self, high=None, low=None, padding_bit=0):
        if not high:
            high = _empty_storage(self.halfwidth)
        if not low:
            low = _empty_storage(self.halfwidth)
        Assert(high.bitwidth).equal(self.halfwidth)
        Assert(low.bitwidth).equal(self.halfwidth)
        self.high = high
        self.low = low
        self.padding_bit = padding_bit

    def as_integer(self):
        return (
            (self.high.as_integer() << (self.halfwidth + 1)) +
            (self.padding_bit << self.halfwidth) +
            self.low.as_unsigned())

    def as_unsigned(self):
        return (
            (self.high.as_unsigned() << (self.halfwidth + 1)) +
            (self.padding_bit << self.halfwidth) +
            self.low.as_unsigned())
    
    @staticmethod
    def new_from_number(v):
        assert isinstance(v, int) or isinstance(v, long), v
        ret = WordValue()
        ret.set_from_number(v)
        return ret

    def set_from_number(self, v):
        assert isinstance(v, int) or isinstance(v, long), v
        low = v & _bit_mask(self.halfwidth)
        padding_bit = (v >> self.halfwidth) & 1
        high = v >> (self.halfwidth + 1)
        self.high.set_from_number(high)
        self.low.set_from_number(low)
        self.padding_bit = padding_bit
        return self

    def __repr__(self):
        return "{} {} {}".format(
            self.high.as_bits_string(),
            self.padding_bit,
            self.low.as_bits_string())


class DoubleWordValue(WordValue):
    """
    71-bit register (for accumlator)
    """
    bitwidth = 71
    halfwidth = 35 # (71 - 1) / 2

    # inherit as_integer
    # inherit set_from_number

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
