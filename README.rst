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


Usage
=====

Now we have a Python version. No JS version yet.

$ python edsac.py

will show square numbers and its difference. See edsacposter.pdf


TODO
====

- Try other sample to run (next target is WadaSieve)

  - ignore space and newline
  - Need visualization of memory pattern. (use canvas?)

    - easy method: print on console

- I made 3 classes Value, WordValue, DoubleWordValue,
  however I feel it is better to use only one class 'Bits'

- JS version

  - select sample code from a listbox: like http://jsx.github.com/try-on-web/
  - step execution

License
=======

GPLv3 by NISHIO Hirokazu (c)2012


Reference
=========

- http://www.cl.cam.ac.uk/~mr/edsacposter.pdf

  - code of initial order and square are come from this poster.
  - "11100 0 0000100010 0 62 S34S" seems typo of "01100 ..."
  - It said HnS is 'R += m[n]', however EdsacTG.pdf said it is 'R = m[n]'.
    If '+=' is correct, on '97: H76S', result is affected by value which stored on R during initial order.
    I choose 'R = m[n]'.

- http://www.cl.cam.ac.uk/users/mr/Edsac/edsac.tgz

  - You can download simulator with source code (in BCPL)

- http://www.cs.clemson.edu/~mark/edsac.html
- http://www.dcs.warwick.ac.uk/~edsac/

  - You can download simulator
  - `Tutorial <http://www.dcs.warwick.ac.uk/~edsac/Software/EdsacTG.pdf>`_ helps our understanding.
  - EdsacDoc.pdf in EdsacLx describe about subroutine specification. If you want to know what is M3 or P6, read it.

Thanks
======

Artem Smirnov, Mustafa Karimi, Yoni Tresina Purbasari, Dariane Joy Papa
