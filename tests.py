from edsac import Edsac

class Assert(object):
    def __init__(self, value):
        self.value = value

    def equal(self, v):
        assert self.value == v, "expect %r but %r" % (v, self.value)

def _test_initial_order(edsac):
    edsac.load_initial_order()
    edsac.set_cards_from_file()

    for i in range(3):
         # put 10<<11 in R
        edsac.step()


    Assert(edsac.multiplier.high.as_number()).equal(10 << 11)

    edsac.step() # 5: goto A
    Assert(edsac.sequence_control).equal(6)

    edsac.step()
    edsac.step() # 7: read T(5) in m[A]
    Assert(edsac.get_memory(0).bits[-5:]).equal([0, 0, 1, 0, 1])
    edsac.step() # 8: A += m[0]
    Assert(edsac.get_accumulator().bits[-5:]).equal([0, 0, 1, 0, 1])
    edsac.step() # 9: ABC >>= 6
    print edsac.get_accumulator(True)
    Assert(repr(edsac.get_accumulator(True))).equal("00101000000000000 0 00000000000000000")
    edsac.step() # 10: w[0] = AB; ABC=0
    # (9, 10) Shift and store it, so that it becomes the senior 5 bit of m[0]
    Assert(repr(edsac.get_memory(0))).equal("00101 0 0000000000 0")
    # m[1] is now 0
    Assert(edsac.get_memory(1).as_number()).equal(0)

    edsac.step() # 11: read 1 into m[2]
    Assert(edsac.get_memory(2).bits[-5:]).equal([0, 0, 0, 0, 1])
    edsac.step() # 12: A+=m[2]
    Assert(edsac.get_accumulator().bits[-5:]).equal([0, 0, 0, 0, 1])
    edsac.step() # 13: A-=m[5]
    Assert(edsac.get_memory(5).as_bits_string()).equal("00000000000001010")
    edsac.step() # 14: E21S (jump to 21 if it's not a number)
    # not jump
    Assert(edsac.sequence_control).equal(15)
    # total number
    Assert(edsac.get_memory(1).as_number()).equal(0)
    # this digit
    Assert(edsac.get_memory(2).as_number()).equal(1)
    edsac.step() # 15: T3S (clear A)
    edsac.step() # 16: AB+=m[1]*R1
    Assert(edsac.get_accumulator().as_number()).equal(0)
    edsac.step()
    edsac.step()
    edsac.step()
    edsac.step() # 20
    # total number is now 1
    Assert(edsac.get_memory(1).as_number()).equal(1)
    # jumped to 11 and ready to read next digit
    Assert(edsac.sequence_control).equal(11)

    edsac.step() # 11: read 1 into m[2]
    # this digit is 2
    Assert(edsac.get_memory(2).as_number()).equal(2)
    while edsac.sequence_control != 17:
        edsac.step()

    edsac.step()
    edsac.step()
    edsac.step()
    # total number is now 12
    Assert(edsac.get_memory(1).as_number()).equal(2)

def _test(edsac):
    import doctest
    doctest.testmod()
    _test_initial_order(edsac)

if __name__ == "__main__":
    edsac = Edsac()
    _test(edsac)
