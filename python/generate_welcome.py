MSG = """
WELCOME TO EDSAC ON BROWSER
COPYRIGHT #(*C#) 2012* NISHIO HIROKAZU
"""

DEBUG_MSG = """
WR
C #(*C#) 2*N
"""

MSG = MSG.replace("\n", "@&")
MSG = MSG.replace(" ", "!")

print """
[Welcome]
T64K
GK
"""

for i, c in enumerate(MSG):
    print "O%d@" % (len(MSG) + 2 + i)
print

print "ZF"
print "*F"
for i, c in enumerate(MSG):
    print "%sF" % c

print "EZPF"
