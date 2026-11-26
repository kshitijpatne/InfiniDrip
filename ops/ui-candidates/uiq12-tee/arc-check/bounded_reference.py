"""Exact dyadic de Casteljau subdivision; enclose distances with integer square roots."""
import json
from fractions import Fraction as F
from math import isqrt
from pathlib import Path

def bounds(row, depth=14):
    c=row['c']
    coords=[tuple(F(c[key][axis]) for axis in 'xy') for key in ('start','control1','control2','end')]
    scale=max(x.denominator for p in coords for x in p)*(8**depth)*(2**24)
    pts=[tuple(int(x*scale) for x in p) for p in coords]
    def mid(a,b): return ((a[0]+b[0])//2,(a[1]+b[1])//2)
    def floor_dist(a,b): return isqrt((a[0]-b[0])**2+(a[1]-b[1])**2)
    def visit(a,b,c,d,k):
        if not k:
            return floor_dist(a,d),sum(floor_dist(p,q)+1 for p,q in ((a,b),(b,c),(c,d)))
        ab,bc,cd=mid(a,b),mid(b,c),mid(c,d)
        l,r=mid(ab,bc),mid(bc,cd)
        m=mid(l,r)
        x,y=visit(a,ab,l,m,k-1)
        u,v=visit(m,r,cd,d,k-1)
        return x+u,y+v
    lo,hi=visit(*pts,depth)
    return F(lo,scale),F(hi,scale)

