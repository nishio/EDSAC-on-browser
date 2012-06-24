============================
 EDSAC Simulator on browser
============================

I think EDSAC is good to learn machine language,
because recent CPU is complex.

My goal is to make a Python version to run on console,
and a JavaScript version to run on browser.

**NOTICE**

This code is not complete yet.


Design
======

We now have plenty of memory than 1950s.
For easy learning and inspectation,
use memories in human-readable way.


TODO
====

- most high bit of tape is complemented. write test.
- complete "_test_initial_order()" (now on line 13)

- Values are treated as 5 types: list of 0/1, string of 0/1/space, unsigned integer, signed interger and real.
  Current design are too ad hoc.
- classess Value, WideValue and ThreeValue are ugly, it is because I didn't notice ABC is 1.5 words width.
- repr should return eval-able string

=======

MIT License

by NISHIO Hirokazu (c)2012


Reference
=========

- http://www.cl.cam.ac.uk/~mr/edsacposter.pdf
  code of initial order and square are come from this poster.
  "11100 0 0000100010 0 62 S34S" seems typo of "01100 ..."
- http://www.cl.cam.ac.uk/users/mr/Edsac/edsac.tgz
- http://www.cs.clemson.edu/~mark/edsac.html
- http://www.dcs.warwick.ac.uk/~edsac/Software/EdsacTG.pdf

Thanks
======

Artem Smirnov, Mustafa Karimi, Yoni Tresina Purbasari, Dariane Joy Papa
