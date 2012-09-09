MSG = """
     WELCOME TO EDSAC ON BROWSER
COPYRIGHT #(*C#) 2012* NISHIO HIROKAZU
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

print "ZF"
print "E0S" # jump to head
print "*F"
for i, c in enumerate(MSG):
    print "%sF" % c

print "&F"
print "EZPF"
