# -*- encoding: utf-8 -*-

import re
env = {}
env['pc'] = 0

# Memory
# 512 words of 35 bits
memory = [[0] * 35 for n in range(512)]

def get_memory(a):
    assert 0 <= a < 1024
    high_low = a % 2
    w = get_memory_word(a - high_low)
    if high_low:
        # m[1] is the senior half of w[0]
        result = w[:17]
    else:
        result = w[-17:]
    return result


def set_memory(a, value):
    assert 0 <= a < 1024
    assert len(value) == 17
    high_low = a % 2
    w = get_memory_word(a - high_low)
    if high_low:
        # m[1] is the senior half of w[0]
        w[:17] = value
    else:
        w[-17:] = value


def get_memory_word(a):
    assert a % 2 == 0
    assert 0 <= a < 1024
    return memory[a / 2]


# The machine had two central registers visible to the user:
# the 71-bit accumulator and the 35-bit multiplier register.
accumlator = [0] * 71
multiplier = [0] * 35
pc = 0

def get_A():
    return accumlator[:17]

def get_AB():
    return accumlator[:35]

def set_A(value):
    assert len(value) == 17
    accumlator[:17] = value

def set_AB(value):
    assert len(value) == 35
    accumlator[:35] = value #no?, function named set_AB

def get_ABC():
    return accumlator

def clear_ABC():
    global accumlator
    accumlator = [0] * 71

def get_R():
    return multiplier[:17]

def set_R(value):
    assert len(value) == 17
    multiplier[:17] = value

def get_RS():
    return multiplier


LETTERS = 'P Q W E R T Y U I O J figs S Z K lets null F cr D sp H N M lf L X G A B C V'.split()
FIGURES = '0 1 2 3 4 5 6 7 8 9 ? figs \" + ( lets null $ cr ; sp £ , . lf ) / # - ? : ='.split()
assert len(LETTERS) == 32
assert len(FIGURES) == 32

def bits2number(bits):
    """
    >>> bits2number(number2bits(1234))
    1234
    """
    result = 0
    for v in bits:
        result *= 2
        result += v
    return result

def number2bits(number, width=17):
    """
    >>> number2bits(15)
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1]
    """
    result = []
    for i in range(width):
        result.insert(0, number & 1)
        number /= 2
    return result

def bits2order(bits):
    """
    >>> bits2order(order2bits(('R', 16, 'S')))
    ('R', 16, 'S')
    >>> bits2order(order2bits(('T', 11, 'L')))
    ('T', 11, 'L')
    """
    assert len(bits) == 17
    op = LETTERS[bits2number(bits[:5])]
    addr = bits2number(bits[6:16])
    sl = 'SL'[bits[16]]
    return (op, addr, sl)

def pretty_order_bits(bits):
    """
    >>> pretty_order_bits([0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0])
    '00100 0 0000010000 0'
    """
    return '%d%d%d%d%d %d %d%d%d%d%d%d%d%d%d%d %d' % tuple(bits)

def order2bits((op, addr, sl)):
    """
    >>> pretty_order_bits(order2bits(('R', 16, 'S')))
    '00100 0 0000010000 0'
    >>> pretty_order_bits(order2bits(('T', 11, 'L')))
    '00101 0 0000001011 1'
    """
    assert isinstance(op, str) and len(op) == 1
    assert isinstance(addr, int)
    assert sl in ['S', 'L']
    if sl == 'S':
        sl = 0
    else:
        sl = 1
    result = (
        number2bits(LETTERS.index(op), 5) +
        [0] +
        number2bits(addr, 10) +
        [sl])
    return result

ORDER_PATTERN = '([A-Z])(\d+)([SL])'

def parse(s):
    """
    >>> pretty_order_bits(parse('PS'))
    '00000 0 0000000000 0'
    >>> pretty_order_bits(parse('P10000S'))
    FIXME
    >>> pretty_order_bits(parse('QS'))
    FIXME
    >>> pretty_order_bits(parse('#S'))
    FIXME
    """
    result = [0] * 17
    if s == 'PS':
        return result

def parse_order(s):
    s = s.upper()
    m = re.match(ORDER_PATTERN, s)
    if not m:
        raise AssertionError("Can't parse: %s" % s)
    op, addr, sl = m.groups()
    addr = int(addr)
    return (op, addr, sl)

def add(x, y):
    N = len(x)
    assert len(y) == N
    result = bits2number(x) + bits2number(y)
    result = number2bits(result, N)
    return result


def negative_A():
    if accumlator[0] == 1:
        return True
    return False


def exec_step(order):
    op, addr, sl = order
    assert isinstance(addr, int)
    assert sl in 'SL'

    if op == 'A':
        if sl == 'S':
            set_A(add(get_A(), get_memory(addr)))
            return
        else:
            set_AB(add(get_AB(), get_memory_word(addr)))
            return

    if op == 'T':
        if sl == 'S':
            # m[n]=A;ABC=0
            set_memory(addr, get_A())
            clear_ABC()
            return
        else:
            set_memory_wide(addr, get_AB())
            clear_ABC()
            return

    if op == 'H':
        if sl == 'S':
            # R += m[n]
            set_R(add(get_R(), get_memory(addr)))
            return
        else:
            set_RS(get_RS(), get_memory_word(addr))
            return

    if op == 'V':
        if sl == 'S':
            # AB+=m[n]*R
            set_AB(number2bits(bits2number(get_memory(addr)) * get_R()), 35)
            return
        else:
            set_ABC(number2bits(bits2number(get_memory_word(addr)) * get_RS()), 71)
            return

    if op == 'I':
        ch = buf.pop(0)
        assert len(ch) == 5
        get_memory(addr)[-5:] = ch
        return

    if op == 'E':
        if not negative_A():
            env['pc'] = addr - 1
        return

    if op == 'G':
        if negative_A():
            env['pc'] = addr - 1
        return

    raise NotImplementedError, order

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

assert len(re.findall(ORDER_PATTERN, INITIAL_ORDER)) == 31
MEM = re.findall(ORDER_PATTERN, INITIAL_ORDER)
for i in range(len(MEM)):
    set_memory(i, order2bits((MEM[i][0], int(MEM[i][1]), MEM[i][2])))

def main():
    env['pc'] = 0
    while True:
        order = bits2order(get_memory(env['pc']))
        exec_step(order)
        env['pc'] += 1

buf = []

def _test():
    import doctest
    doctest.testmod()

if __name__ == '__main__':
    _test()
    main()
