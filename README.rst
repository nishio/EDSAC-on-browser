============================
 EDSAC Simulator on browser
============================

I think EDSAC is good to learn machine language, because recent CPU is complex.
The 'initial order' of EDSAC reads human readable commands from punchtape and store machine readable instructions into its memory.
It is very primitive programming language.

Demo
====

Visit Here: `EDSAC on browser <repos/EDSAC-on-browser/index.html>`_

Design
======

We now have plenty of memory than 1950s.
For easy learning and inspectation,
use memories in human-readable way.


License
=======

GPLv3.
Copyright (C) 2012 NISHIO Hirokazu


Reference
=========

- http://www.cl.cam.ac.uk/~mr/edsacposter.pdf

  - code of initial order and square are come from this poster.
  - unfortunately, the poster contains some errors:

   - "11100 0 0000100010 0 62 S34S" seems typo of "01100 ..."
   - It says HnS is 'R += m[n]', however the correct semantics is 'R =
     m[n]', as confirmed by the example programs.
   - The 'verify' order (actually, load last output to memory) is not
     explained.
   - The wording of 'load input into the 5 least significant bits' is unclear, the
     order wipes all other bits.
   - The input/output/verify orders have a long mode variant, not
     mentioned in the poster.
   - The 'and' order is not "ABC += w & RS", but 'AB += w & RS'.
   - It's not explained that the 'multiply' order shifts the result
     left by 2 bits.

- http://www.cl.cam.ac.uk/conference/EDSAC99/simulators/india/download.html

  - Java emulator, with easy to read source code

- http://www.cl.cam.ac.uk/users/mr/Edsac/edsac.tgz

  - You can download simulator with source code (in BCPL)

- http://www.cs.clemson.edu/~mark/edsac.html
- http://www.dcs.warwick.ac.uk/~edsac/

  - You can download simulator
  - `Tutorial <http://www.dcs.warwick.ac.uk/~edsac/Software/EdsacTG.pdf>`_ helps our understanding.
  - EdsacDoc.pdf in EdsacLx describe about subroutine specification. If you want to know what is M3 or P6, read it.

Thanks
======

Special thanks to Paweł Marczewski, he made a massive contribution to the project.

Thanks to Artem Smirnov, Mustafa Karimi, Yoni Tresina Purbasari and Dariane Joy Papa.
