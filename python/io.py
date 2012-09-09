# -*- coding: utf-8 -*-
"""
io: convertion between edsac charset and ascii
"""


"""
Edsac character codes
some control codes are mapped as follows
figs: #, lets: *, null: ., cr: @, sp: !, lf: &
FIGURES contain £ but it is not in ascii, so I replaced it with L
"""
LETTERS = 'PQWERTYUIOJ#SZK*.F@D!HNM&LXGABCV'
FIGURES = '0123456789?#"+(*.$@;!L,.&)/#-?:='
MAX_CHAR_CODE = 32
assert len(LETTERS) == MAX_CHAR_CODE
assert len(FIGURES) == MAX_CHAR_CODE


class Output(object):
    def __init__(self):
        self.is_letter = True

    def __call__(self, c):
        assert isinstance(c, int) and 0 <= c < MAX_CHAR_CODE
        if self.is_letter:
            ret = LETTERS[c]
        else:
            ret = FIGURES[c]
        if ret == "#":
            self.is_letter = False
            return ""
        elif ret == "*":
            self.is_letter = True
            return ""
        elif ret == ".":
            return ""
        elif ret == "@":
            return "\x0c"
        elif ret == "!":
            return " "
        elif ret == "&":
            return "\x0a"
        else:
            return ret


def ascii_to_edsac(c):
    """
    take a ascii character and return edsac code
    """
    assert isinstance(c, str) and len(c) == 1, c
    r = LETTERS.find(c)
    if r == -1:  # not found
        r = FIGURES.find(c)

    if r == -1:  # not found again
        raise RuntimeError("unknown character %r" % c)
    return r


def edsac_to_letter(c):
    assert isinstance(c, int) and 0 <= c < MAX_CHAR_CODE
    return LETTERS[c]


def edsac_to_figure(c):
    assert isinstance(c, int) and 0 <= c < MAX_CHAR_CODE
    return FIGURES[c]
