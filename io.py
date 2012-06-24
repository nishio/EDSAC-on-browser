"""
io: convertion between edsac charset and ascii
"""


"""
Edsac character codes
some control codes are mapped as follows
figs: #, lets: *, null: ., cr: @, sp: !, lf: &
"""
LETTERS = 'PQWERTYUIOJ#SZK*.F@D!HNM&LXGABCV'
FIGURES = '0123456789?#"+(*.$@;!\xa3,.&)/#-?:='
MAX_CHAR_CODE = 32
assert len(LETTERS) == MAX_CHAR_CODE
assert len(FIGURES) == MAX_CHAR_CODE

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

def edsac_to_ascii(c):
    assert isinstance(c, int) and 0 <= c < MAX_CHAR_CODE
    # FIXME: switching letters/figures needed
    return LETTERS[c]
