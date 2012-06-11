# -*- encoding: utf-8 -*-
"""
parser
"""
import re

def _number2bits(number, width=17):
    result = []
    for i in range(width):
        result.insert(0, number & 1)
        number /= 2
    return result

def _bits2number(bits):
    result = 0
    for v in bits:
        result *= 2
        result += v
    return result

"""
Edsac character codes
some control codes are mapped as follows
figs: #, lets: *, null: ., cr: @, sp: !, lf: &
"""
LETTERS = 'PQWERTYUIOJ#SZK*.F@D!HNM&LXGABCV'
FIGURES = '0123456789?#"+(*.$@;!\xa3,.&)/#-?:='
assert len(LETTERS) == 32
assert len(FIGURES) == 32

def _ascii_to_edsac(c):
    """
    take a ascii character and return edsac code
    """
    assert isinstance(c, str) and len(c) == 1
    r = LETTERS.find(c)
    if r == -1: # not found
        r = FIGURES.find(c)

    if r == -1: # not found again
        raise RuntimeError("unknown character %r" % c)
    return r

class Value(object):
    """
    Value object hold bit pattern.
    It can construct from number, order_string, order

    >>> Value().as_number()
    0
    """
    def __init__(self, bits=None):
        if bits:
            self.bits = bits
        else:
            self.bits = [0] * 17

    @staticmethod
    def from_number(v):
        """
        >>> x = Value.from_number(1234)
        >>> x.bits
        [0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0]
        >>> x.as_number()
        1234
        """
        return Value(_number2bits(v))

    def as_number(self):
        """
        >>> x = Value.from_number(1234)
        >>> x.bits
        [0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0]
        >>> x.as_number()
        1234
        """
        return _bits2number(self.bits)

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
        (op, addr, sl) = order
        assert isinstance(op, str) and len(op) == 1
        assert isinstance(addr, int)
        assert sl in ['S', 'L']
        # #!&@
        if sl == 'S':
            sl = 0
        else:
            sl = 1
        if addr < 2 ** 10:
            result = (
                # 5 bits op
                _number2bits(_ascii_to_edsac(op), 5) +
                # 1 bit unused
                [0] +
                # 10 bits address
                _number2bits(addr, 10) +
                # 1 bit S/L
                [sl])
        else:
            # such as "P10000S"
            if op != "P":
                raise NotImplementedError(
                    "I don't know how to put %s in bits" % order)
            result = (
                # 16 bits
                _number2bits(addr, 16) +
                # 1 bit S/L
                [sl])

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
        assert len(self.bits) == 17
        op = LETTERS[_bits2number(self.bits[:5])]
        addr = _bits2number(self.bits[6:16])
        sl = 'SL'[self.bits[16]]
        return (op, addr, sl)

    @staticmethod
    def from_bits_string(s):
        """
        >>> Value.from_bits_string('00100 0 0000010000 0')
        00100 0 0000010000 0
        """
        bits = re.findall("[01]", s)
        assert len(bits) == 17
        return Value(map(int, bits))

    def as_pretty_bits_string(self):
        """
        >>> Value([0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0])
        00100 0 0000010000 0
        """
        return '%d%d%d%d%d %d %d%d%d%d%d%d%d%d%d%d %d' % tuple(self.bits)

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
        if addr == "": addr = "0"
        addr = int(addr)
        return Value.from_order((op, addr, sl))



ORDER_PATTERN = '([A-Z#!&@])(\d*)([SL])'

INITIAL_ORDER = """
T0S H2S T0S E6S P1S P5S T0S I0S A0S R16S
T0L I2S A2S S5S E21S T3S V1S L8S A2S T1S
E11S R4S A1S L0L A0S T31S A25S A4S U25S S31S
G6S
"""

IN_TAPE_BUFFER = """
T123S E84S PS PS P10000S P1000S P100S P10S P1S QS
#S A40S !S &S @S O43S O33S PS A46S T65S
T129S A35S T34S E61S T48S A47S T65S A33S A40S T33S
A48S S34S E55S A34S PS T48S T33S A52S A4S U52S
S42S G51S A117S T52S PS
"""

def _test_parser():
    for line in file("initial_order.txt"):
        bits_str = line[:20]
        order_str = line[21:].split()[1]
        assert (
            Value.from_order_string(order_str)
            .as_pretty_bits_string() == bits_str)

    for line in file("square.txt"):
        bits_str = line[:20]
        order_str = line[21:].split()[1]
        assert (
            Value.from_order_string(order_str)
            .as_pretty_bits_string() == bits_str), line

def _test():
    import doctest
    doctest.testmod()

if __name__ == '__main__':
    _test()
    _test_parser()
