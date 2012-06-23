from edsac import Edsac

def _test_initial_order():
    edsac = Edsac()
    edsac.load_initial_order()
    edsac.set_cards_from_file()

    for i in range(3):
         # put 10<<11 in R
        edsac.step()
    assert edsac.multiplier.high.as_number() == 10 << 11

    edsac.step() # 5: goto 6
    assert edsac.sequence_control == 6

    edsac.step()
    edsac.step() # 7: read T(5) in m[0]
    assert edsac.get_memory(0).bits[-5:] == [0, 0, 1, 0, 1]
    edsac.step() # 8: A += m[0]
    assert edsac.get_accumulator().bits[-5:] == [0, 0, 1, 0, 1]
    edsac.step() # 9: ABC >>= 6
    assert repr(edsac.get_accumulator(True)) == "00000000000000000 0 00101000000000000"
    edsac.step() # 10: w[0] = AB; ABC=0
    # (9, 10) Shift and store it, so that it becomes the senior 5 bit of m[0]
    assert repr(edsac.get_memory(0)) == "00101 0 0000000000 0"
    # m[1] is now 0
    assert edsac.get_memory(1).as_number() == 0
    edsac.step() # 11: read 1 into m[2]
    assert edsac.get_memory(2).bits[-5:] == [0, 0, 0, 0, 1]
    edsac.step() # 12: A+=m[2]
    assert edsac.get_accumulator().bits[-5:] == [0, 0, 0, 0, 1]
    edsac.step() # 13: A-=m[5]
    assert edsac.get_memory(5).as_bits_string() == "00000000000001010"
    print edsac.get_accumulator().as_bits_string()

def _test():
    import doctest
    doctest.testmod()
    _test_initial_order()


