# -*- encoding: utf-8 -*-
"""
edsac common part
"""
HALF_WORD_LENGTH = 17
ORDER_FORMAT = {
    'OP_START': None,
    'OP_END': 5,
    'ADDRESS_START': 6,
    'ADDRESS_END': 16,
    'SL': 16
}


ORDER_PATTERN = '([A-Z#!&@])(\d*)([SL])'
