from edsac import Edsac

def _test_initial_order(edsac):
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
    edsac.step() # 14: E21S (jump to 21 if it's not a number)
    assert edsac.sequence_control == 15 # not jump
    assert edsac.get_memory(1).as_number() == 0 # total number
    assert edsac.get_memory(2).as_number() == 1 # this digit
    edsac.step() # 15: T3S (clear A)
    edsac.step() # 16: AB+=m[1]*R1
    assert edsac.get_accumulator().as_number() == 0
    edsac.step()
    edsac.step()
    edsac.step()
    edsac.step() # 20
    assert edsac.get_memory(1).as_number() == 1 # total number is now 1
    assert edsac.sequence_control == 11 # jumped to 11 and ready to read next digit

    edsac.step() # 11: read 1 into m[2]
    assert edsac.get_memory(2).as_number() == 2 # this digit is 2
    while edsac.sequence_control != 17:
        edsac.step()

    edsac.step()
    edsac.step()
    edsac.step()

    print edsac.get_memory(1).as_number() # total number is now 12
    assert edsac.get_memory(1).as_number() ==12 # total number is now 12

def _test(edsac):
    import doctest
    doctest.testmod()
    _test_initial_order(edsac)


