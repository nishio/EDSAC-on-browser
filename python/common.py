# -*- encoding: utf-8 -*-
"""
edsac common part
"""
HALF_WORD_LENGTH = 17
MIN_MEMORY_ADDR = 0
MAX_MEMORY_ADDR = 1024

ORDER_FORMAT = {
    'OP_START': None,
    'OP_END': 5,
    'ADDRESS_START': 6,
    'ADDRESS_END': 16,
    'SL': 16
}

ORDER_PATTERN = '([A-Z#!&@])(\d*)([SL])'


class Assert(object):
    def __init__(self, value):
        self.value = value

    def equal(self, v):
        if isinstance(v, str) and not isinstance(self.value, str):
            self.value = repr(self.value)
        assert self.value == v, "expect %r but %r" % (v, self.value)
