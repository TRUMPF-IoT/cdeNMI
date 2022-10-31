var dbits;
var canary = 244837814094590;
var j_lm = ((canary & 16777215) == 15715070);
function BigInteger(e, d, f) {
    if (e != null) {
        if ("number" == typeof e) {
            this.fromNumber(e, d, f);
        }
        else {
            if (d == null && "string" != typeof e) {
                this.fromString(e, 256);
            }
            else {
                this.fromString(e, d);
            }
        }
    }
}
function nbi() {
    return new BigInteger(null, null, null);
}
function am1(f, a, b, e, h, g) {
    while (--g >= 0) {
        var d = a * this[f++] + b[e] + h;
        h = Math.floor(d / 67108864);
        b[e++] = d & 67108863;
    }
    return h;
}
function am2(f, q, r, e, o, a) {
    var k = q & 32767, p = q >> 15;
    while (--a >= 0) {
        var d = this[f] & 32767;
        var g = this[f++] >> 15;
        var b = p * d + g * k;
        d = k * d + ((b & 32767) << 15) + r[e] + (o & 1073741823);
        o = (d >>> 30) + (b >>> 15) + p * g + (o >>> 30);
        r[e++] = d & 1073741823;
    }
    return o;
}
function am3(f, q, r, e, o, a) {
    var k = q & 16383, p = q >> 14;
    while (--a >= 0) {
        var d = this[f] & 16383;
        var g = this[f++] >> 14;
        var b = p * d + g * k;
        d = k * d + ((b & 16383) << 14) + r[e] + o;
        o = (d >> 28) + (b >> 14) + p * g;
        r[e++] = d & 268435455;
    }
    return o;
}
BigInteger.prototype.am = am3;
dbits = 28;
BigInteger.prototype.DB = dbits;
BigInteger.prototype.DM = ((1 << dbits) - 1);
BigInteger.prototype.DV = (1 << dbits);
var BI_FP = 52;
BigInteger.prototype.FV = Math.pow(2, BI_FP);
BigInteger.prototype.F1 = BI_FP - dbits;
BigInteger.prototype.F2 = 2 * dbits - BI_FP;
var BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
var BI_RC = new Array();
var rr, vv;
var DV;
rr = "0".charCodeAt(0);
for (vv = 0; vv <= 9; ++vv) {
    BI_RC[rr++] = vv;
}
rr = "a".charCodeAt(0);
for (vv = 10; vv < 36; ++vv) {
    BI_RC[rr++] = vv;
}
rr = "A".charCodeAt(0);
for (vv = 10; vv < 36; ++vv) {
    BI_RC[rr++] = vv;
}
function int2char(a) {
    return BI_RM.charAt(a);
}
function intAt(b, a) {
    var d = BI_RC[b.charCodeAt(a)];
    return (d == null) ? -1 : d;
}
function bnpCopyTo(b) {
    for (var a = this.t - 1; a >= 0; --a) {
        b[a] = this[a];
    }
    b.t = this.t;
    b.s = this.s;
}
function bnpFromInt(a) {
    this.t = 1;
    this.s = (a < 0) ? -1 : 0;
    if (a > 0) {
        this[0] = a;
    }
    else {
        if (a < -1) {
            this[0] = a + DV;
        }
        else {
            this.t = 0;
        }
    }
}
function nbv(a) {
    var b = nbi();
    b.fromInt(a);
    return b;
}
function bnpFromString(h, c) {
    var e;
    if (c == 16) {
        e = 4;
    }
    else {
        if (c == 8) {
            e = 3;
        }
        else {
            if (c == 256) {
                e = 8;
            }
            else {
                if (c == 2) {
                    e = 1;
                }
                else {
                    if (c == 32) {
                        e = 5;
                    }
                    else {
                        if (c == 4) {
                            e = 2;
                        }
                        else {
                            this.fromRadix(h, c);
                            return;
                        }
                    }
                }
            }
        }
    }
    this.t = 0;
    this.s = 0;
    var g = h.length, d = false, f = 0;
    while (--g >= 0) {
        var a = (e == 8) ? h[g] & 255 : intAt(h, g);
        if (a < 0) {
            if (h.charAt(g) == "-") {
                d = true;
            }
            continue;
        }
        d = false;
        if (f == 0) {
            this[this.t++] = a;
        }
        else {
            if (f + e > this.DB) {
                this[this.t - 1] |= (a & ((1 << (this.DB - f)) - 1)) << f;
                this[this.t++] = (a >> (this.DB - f));
            }
            else {
                this[this.t - 1] |= a << f;
            }
        }
        f += e;
        if (f >= this.DB) {
            f -= this.DB;
        }
    }
    if (e == 8 && (h[0] & 128) != 0) {
        this.s = -1;
        if (f > 0) {
            this[this.t - 1] |= ((1 << (this.DB - f)) - 1) << f;
        }
    }
    this.clamp();
    if (d) {
        BigInteger.prototype.ZERO.subTo(this, this);
    }
}
function bnpClamp() {
    var a = this.s & this.DM;
    while (this.t > 0 && this[this.t - 1] == a) {
        --this.t;
    }
}
function bnToString(c) {
    if (this.s < 0) {
        return "-" + this.negate().toString(c);
    }
    var e;
    if (c == 16) {
        e = 4;
    }
    else {
        if (c == 8) {
            e = 3;
        }
        else {
            if (c == 2) {
                e = 1;
            }
            else {
                if (c == 32) {
                    e = 5;
                }
                else {
                    if (c == 4) {
                        e = 2;
                    }
                    else {
                        return this.toRadix(c);
                    }
                }
            }
        }
    }
    var g = (1 << e) - 1, l, a = false, h = "", f = this.t;
    var j = this.DB - (f * this.DB) % e;
    if (f-- > 0) {
        if (j < this.DB && (l = this[f] >> j) > 0) {
            a = true;
            h = int2char(l);
        }
        while (f >= 0) {
            if (j < e) {
                l = (this[f] & ((1 << j) - 1)) << (e - j);
                l |= this[--f] >> (j += this.DB - e);
            }
            else {
                l = (this[f] >> (j -= e)) & g;
                if (j <= 0) {
                    j += this.DB;
                    --f;
                }
            }
            if (l > 0) {
                a = true;
            }
            if (a) {
                h += int2char(l);
            }
        }
    }
    return a ? h : "0";
}
function bnNegate() {
    var a = nbi();
    BigInteger.prototype.ZERO.subTo(this, a);
    return a;
}
function bnAbs() {
    return (this.s < 0) ? this.negate() : this;
}
function bnCompareTo(b) {
    var d = this.s - b.s;
    if (d != 0) {
        return d;
    }
    var c = this.t;
    d = c - b.t;
    if (d != 0) {
        return d;
    }
    while (--c >= 0) {
        if ((d = this[c] - b[c]) != 0) {
            return d;
        }
    }
    return 0;
}
function nbits(a) {
    var c = 1, b;
    if ((b = a >>> 16) != 0) {
        a = b;
        c += 16;
    }
    if ((b = a >> 8) != 0) {
        a = b;
        c += 8;
    }
    if ((b = a >> 4) != 0) {
        a = b;
        c += 4;
    }
    if ((b = a >> 2) != 0) {
        a = b;
        c += 2;
    }
    if ((b = a >> 1) != 0) {
        a = b;
        c += 1;
    }
    return c;
}
function bnBitLength() {
    if (this.t <= 0) {
        return 0;
    }
    return this.DB * (this.t - 1) + nbits(this[this.t - 1] ^ (this.s & this.DM));
}
function bnpDLShiftTo(c, b) {
    var a;
    for (a = this.t - 1; a >= 0; --a) {
        b[a + c] = this[a];
    }
    for (a = c - 1; a >= 0; --a) {
        b[a] = 0;
    }
    b.t = this.t + c;
    b.s = this.s;
}
function bnpDRShiftTo(c, b) {
    for (var a = c; a < this.t; ++a) {
        b[a - c] = this[a];
    }
    b.t = Math.max(this.t - c, 0);
    b.s = this.s;
}
function bnpLShiftTo(j, e) {
    var b = j % this.DB;
    var a = this.DB - b;
    var g = (1 << a) - 1;
    var f = Math.floor(j / this.DB), h = (this.s << b) & this.DM, d;
    for (d = this.t - 1; d >= 0; --d) {
        e[d + f + 1] = (this[d] >> a) | h;
        h = (this[d] & g) << b;
    }
    for (d = f - 1; d >= 0; --d) {
        e[d] = 0;
    }
    e[f] = h;
    e.t = this.t + f + 1;
    e.s = this.s;
    e.clamp();
}
function bnpRShiftTo(g, d) {
    d.s = this.s;
    var e = Math.floor(g / this.DB);
    if (e >= this.t) {
        d.t = 0;
        return;
    }
    var b = g % this.DB;
    var a = this.DB - b;
    var f = (1 << b) - 1;
    d[0] = this[e] >> b;
    for (var c = e + 1; c < this.t; ++c) {
        d[c - e - 1] |= (this[c] & f) << a;
        d[c - e] = this[c] >> b;
    }
    if (b > 0) {
        d[this.t - e - 1] |= (this.s & f) << a;
    }
    d.t = this.t - e;
    d.clamp();
}
function bnpSubTo(d, f) {
    var e = 0, g = 0, b = Math.min(d.t, this.t);
    while (e < b) {
        g += this[e] - d[e];
        f[e++] = g & this.DM;
        g >>= this.DB;
    }
    if (d.t < this.t) {
        g -= d.s;
        while (e < this.t) {
            g += this[e];
            f[e++] = g & this.DM;
            g >>= this.DB;
        }
        g += this.s;
    }
    else {
        g += this.s;
        while (e < d.t) {
            g -= d[e];
            f[e++] = g & this.DM;
            g >>= this.DB;
        }
        g -= d.s;
    }
    f.s = (g < 0) ? -1 : 0;
    if (g < -1) {
        f[e++] = this.DV + g;
    }
    else {
        if (g > 0) {
            f[e++] = g;
        }
    }
    f.t = e;
    f.clamp();
}
function bnpMultiplyTo(c, e) {
    var b = this.abs(), f = c.abs();
    var d = b.t;
    e.t = d + f.t;
    while (--d >= 0) {
        e[d] = 0;
    }
    for (d = 0; d < f.t; ++d) {
        e[d + b.t] = b.am(0, f[d], e, d, 0, b.t);
    }
    e.s = 0;
    e.clamp();
    if (this.s != c.s) {
        BigInteger.prototype.ZERO.subTo(e, e);
    }
}
function bnpSquareTo(d) {
    var a = this.abs();
    var b = d.t = 2 * a.t;
    while (--b >= 0) {
        d[b] = 0;
    }
    for (b = 0; b < a.t - 1; ++b) {
        var e = a.am(b, a[b], d, 2 * b, 0, 1);
        if ((d[b + a.t] += a.am(b + 1, 2 * a[b], d, 2 * b + 1, e, a.t - b - 1)) >= a.DV) {
            d[b + a.t] -= a.DV;
            d[b + a.t + 1] = 1;
        }
    }
    if (d.t > 0) {
        d[d.t - 1] += a.am(b, a[b], d, 2 * b, 0, 1);
    }
    d.s = 0;
    d.clamp();
}
function bnpDivRemTo(n, h, g) {
    var w = n.abs();
    if (w.t <= 0) {
        return;
    }
    var k = this.abs();
    if (k.t < w.t) {
        if (h != null) {
            h.fromInt(0);
        }
        if (g != null) {
            this.copyTo(g);
        }
        return;
    }
    if (g == null) {
        g = nbi();
    }
    var d = nbi(), a = this.s, l = n.s;
    var v = this.DB - nbits(w[w.t - 1]);
    if (v > 0) {
        w.lShiftTo(v, d);
        k.lShiftTo(v, g);
    }
    else {
        w.copyTo(d);
        k.copyTo(g);
    }
    var p = d.t;
    var b = d[p - 1];
    if (b == 0) {
        return;
    }
    var o = b * (1 << this.F1) + ((p > 1) ? d[p - 2] >> this.F2 : 0);
    var B = this.FV / o, A = (1 << this.F1) / o, x = 1 << this.F2;
    var u = g.t, s = u - p, f = (h == null) ? nbi() : h;
    d.dlShiftTo(s, f);
    if (g.compareTo(f) >= 0) {
        g[g.t++] = 1;
        g.subTo(f, g);
    }
    BigInteger.prototype.ONE.dlShiftTo(p, f);
    f.subTo(d, d);
    while (d.t < p) {
        d[d.t++] = 0;
    }
    while (--s >= 0) {
        var c = (g[--u] == b) ? this.DM : Math.floor(g[u] * B + (g[u - 1] + x) * A);
        if ((g[u] += d.am(0, c, g, s, 0, p)) < c) {
            d.dlShiftTo(s, f);
            g.subTo(f, g);
            while (g[u] < --c) {
                g.subTo(f, g);
            }
        }
    }
    if (h != null) {
        g.drShiftTo(p, h);
        if (a != l) {
            BigInteger.prototype.ZERO.subTo(h, h);
        }
    }
    g.t = p;
    g.clamp();
    if (v > 0) {
        g.rShiftTo(v, g);
    }
    if (a < 0) {
        BigInteger.prototype.ZERO.subTo(g, g);
    }
}
function bnMod(b) {
    var c = nbi();
    this.abs().divRemTo(b, null, c);
    if (this.s < 0 && c.compareTo(BigInteger.prototype.ZERO) > 0) {
        b.subTo(c, c);
    }
    return c;
}
function Classic(a) {
    this.m = a;
}
function cConvert(a) {
    if (a.s < 0 || a.compareTo(this.m) >= 0) {
        return a.mod(this.m);
    }
    else {
        return a;
    }
}
function cRevert(a) {
    return a;
}
function cReduce(a) {
    a.divRemTo(this.m, null, a);
}
function cMulTo(a, c, b) {
    a.multiplyTo(c, b);
    this.reduce(b);
}
function cSqrTo(a, b) {
    a.squareTo(b);
    this.reduce(b);
}
Classic.prototype.convert = cConvert;
Classic.prototype.revert = cRevert;
Classic.prototype.reduce = cReduce;
Classic.prototype.mulTo = cMulTo;
Classic.prototype.sqrTo = cSqrTo;
function bnpInvDigit() {
    if (this.t < 1) {
        return 0;
    }
    var a = this[0];
    if ((a & 1) == 0) {
        return 0;
    }
    var b = a & 3;
    b = (b * (2 - (a & 15) * b)) & 15;
    b = (b * (2 - (a & 255) * b)) & 255;
    b = (b * (2 - (((a & 65535) * b) & 65535))) & 65535;
    b = (b * (2 - a * b % this.DV)) % this.DV;
    return (b > 0) ? this.DV - b : -b;
}
function Montgomery(a) {
    this.m = a;
    this.mp = a.invDigit();
    this.mpl = this.mp & 32767;
    this.mph = this.mp >> 15;
    this.um = (1 << (a.DB - 15)) - 1;
    this.mt2 = 2 * a.t;
}
function montConvert(a) {
    var b = nbi();
    a.abs().dlShiftTo(this.m.t, b);
    b.divRemTo(this.m, null, b);
    if (a.s < 0 && b.compareTo(BigInteger.prototype.ZERO) > 0) {
        this.m.subTo(b, b);
    }
    return b;
}
function montRevert(a) {
    var b = nbi();
    a.copyTo(b);
    this.reduce(b);
    return b;
}
function montReduce(a) {
    while (a.t <= this.mt2) {
        a[a.t++] = 0;
    }
    for (var c = 0; c < this.m.t; ++c) {
        var b = a[c] & 32767;
        var d = (b * this.mpl + (((b * this.mph + (a[c] >> 15) * this.mpl) & this.um) << 15)) & a.DM;
        b = c + this.m.t;
        a[b] += this.m.am(0, d, a, c, 0, this.m.t);
        while (a[b] >= a.DV) {
            a[b] -= a.DV;
            a[++b]++;
        }
    }
    a.clamp();
    a.drShiftTo(this.m.t, a);
    if (a.compareTo(this.m) >= 0) {
        a.subTo(this.m, a);
    }
}
function montSqrTo(a, b) {
    a.squareTo(b);
    this.reduce(b);
}
function montMulTo(a, c, b) {
    a.multiplyTo(c, b);
    this.reduce(b);
}
Montgomery.prototype.convert = montConvert;
Montgomery.prototype.revert = montRevert;
Montgomery.prototype.reduce = montReduce;
Montgomery.prototype.mulTo = montMulTo;
Montgomery.prototype.sqrTo = montSqrTo;
function bnpIsEven() {
    return ((this.t > 0) ? (this[0] & 1) : this.s) == 0;
}
function bnpExp(h, j) {
    if (h > 4294967295 || h < 1) {
        return BigInteger.prototype.ONE;
    }
    var f = nbi(), a = nbi(), d = j.convert(this), c = nbits(h) - 1;
    d.copyTo(f);
    while (--c >= 0) {
        j.sqrTo(f, a);
        if ((h & (1 << c)) > 0) {
            j.mulTo(a, d, f);
        }
        else {
            var b = f;
            f = a;
            a = b;
        }
    }
    return j.revert(f);
}
function bnModPowInt(b, a) {
    var c;
    if (b < 256 || a.isEven()) {
        c = new Classic(a);
    }
    else {
        c = new Montgomery(a);
    }
    return this.exp(b, c);
}
BigInteger.prototype.copyTo = bnpCopyTo;
BigInteger.prototype.fromInt = bnpFromInt;
BigInteger.prototype.fromString = bnpFromString;
BigInteger.prototype.clamp = bnpClamp;
BigInteger.prototype.dlShiftTo = bnpDLShiftTo;
BigInteger.prototype.drShiftTo = bnpDRShiftTo;
BigInteger.prototype.lShiftTo = bnpLShiftTo;
BigInteger.prototype.rShiftTo = bnpRShiftTo;
BigInteger.prototype.subTo = bnpSubTo;
BigInteger.prototype.multiplyTo = bnpMultiplyTo;
BigInteger.prototype.squareTo = bnpSquareTo;
BigInteger.prototype.divRemTo = bnpDivRemTo;
BigInteger.prototype.invDigit = bnpInvDigit;
BigInteger.prototype.isEven = bnpIsEven;
BigInteger.prototype.exp = bnpExp;
BigInteger.prototype.toString = bnToString;
BigInteger.prototype.negate = bnNegate;
BigInteger.prototype.abs = bnAbs;
BigInteger.prototype.compareTo = bnCompareTo;
BigInteger.prototype.bitLength = bnBitLength;
BigInteger.prototype.mod = bnMod;
BigInteger.prototype.modPowInt = bnModPowInt;
BigInteger.prototype.ZERO = nbv(0);
BigInteger.prototype.ONE = nbv(1);
function Arcfour() {
    this.i = 0;
    this.j = 0;
    this.S = new Array();
}
function ARC4init(d) {
    var c, a, b;
    for (c = 0; c < 256; ++c) {
        this.S[c] = c;
    }
    a = 0;
    for (c = 0; c < 256; ++c) {
        a = (a + this.S[c] + d[c % d.length]) & 255;
        b = this.S[c];
        this.S[c] = this.S[a];
        this.S[a] = b;
    }
    this.i = 0;
    this.j = 0;
}
function ARC4next() {
    var a;
    this.i = (this.i + 1) & 255;
    this.j = (this.j + this.S[this.i]) & 255;
    a = this.S[this.i];
    this.S[this.i] = this.S[this.j];
    this.S[this.j] = a;
    return this.S[(a + this.S[this.i]) & 255];
}
Arcfour.prototype.init = ARC4init;
Arcfour.prototype.next = ARC4next;
function prng_newstate() {
    return new Arcfour();
}
var rng_psize = 256;
var rng_state;
var rng_pool;
var rng_pptr;
function rng_seed_int(a) {
    rng_pool[rng_pptr++] ^= a & 255;
    rng_pool[rng_pptr++] ^= (a >> 8) & 255;
    rng_pool[rng_pptr++] ^= (a >> 16) & 255;
    rng_pool[rng_pptr++] ^= (a >> 24) & 255;
    if (rng_pptr >= rng_psize) {
        rng_pptr -= rng_psize;
    }
}
function rng_seed_time() {
    rng_seed_int(new Date().getTime());
}
if (rng_pool == null) {
    rng_pool = new Array();
    rng_pptr = 0;
    var t;
    while (rng_pptr < rng_psize) {
        if (typeof window === typeof undefined) {
            t = Math.floor(65536 * Math.random());
        }
        else {
            const crypto = window.crypto || window.msCrypto;
            var array = new Uint32Array(1);
            t = Math.floor(65536 * crypto.getRandomValues(array));
        }
        rng_pool[rng_pptr++] = t >>> 8;
        rng_pool[rng_pptr++] = t & 255;
    }
    rng_pptr = 0;
    rng_seed_time();
}
function rng_get_byte() {
    if (rng_state == null) {
        rng_seed_time();
        rng_state = prng_newstate();
        rng_state.init(rng_pool);
        for (rng_pptr = 0; rng_pptr < rng_pool.length; ++rng_pptr) {
            rng_pool[rng_pptr] = 0;
        }
        rng_pptr = 0;
    }
    return rng_state.next();
}
function rng_get_bytes(b) {
    var a;
    for (a = 0; a < b.length; ++a) {
        b[a] = rng_get_byte();
    }
}
function SecureRandom() { }
SecureRandom.prototype.nextBytes = rng_get_bytes;
function parseBigInt(b, a) {
    return new BigInteger(b, a, null);
}
function linebrk(c, d) {
    var a = "";
    var b = 0;
    while (b + d < c.length) {
        a += c.substring(b, b + d) + "\n";
        b += d;
    }
    return a + c.substring(b, c.length);
}
function byte2Hex(a) {
    if (a < 16) {
        return "0" + a.toString(16);
    }
    else {
        return a.toString(16);
    }
}
function pkcs1pad2(e, h) {
    if (h < e.length + 11) {
        return null;
    }
    var g = new Array();
    var d = e.length - 1;
    while (d >= 0 && h > 0) {
        var f = e.charCodeAt(d--);
        if (f < 128) {
            g[--h] = f;
        }
        else {
            if ((f > 127) && (f < 2048)) {
                g[--h] = (f & 63) | 128;
                g[--h] = (f >> 6) | 192;
            }
            else {
                g[--h] = (f & 63) | 128;
                g[--h] = ((f >> 6) & 63) | 128;
                g[--h] = (f >> 12) | 224;
            }
        }
    }
    g[--h] = 0;
    var b = new SecureRandom();
    var a = new Array();
    while (h > 2) {
        a[0] = 0;
        while (a[0] == 0) {
            b.nextBytes(a);
        }
        g[--h] = a[0];
    }
    g[--h] = 2;
    g[--h] = 0;
    return new BigInteger(g, null, null);
}
function RSAKey() {
    this.n = null;
    this.e = 0;
    this.d = null;
    this.p = null;
    this.q = null;
    this.dmp1 = null;
    this.dmq1 = null;
    this.coeff = null;
}
function RSASetPublic(b, a) {
    if (b != null && a != null && b.length > 0 && a.length > 0) {
        this.n = parseBigInt(b, 16);
        this.e = parseInt(a, 16);
    }
}
function RSADoPublic(a) {
    return a.modPowInt(this.e, this.n);
}
function RSAEncrypt(d) {
    var a = pkcs1pad2(d, (this.n.bitLength() + 7) >> 3);
    if (a == null) {
        return null;
    }
    var e = this.doPublic(a);
    if (e == null) {
        return null;
    }
    var b = e.toString(16);
    if ((b.length & 1) == 0) {
        return b;
    }
    else {
        return "0" + b;
    }
}
RSAKey.prototype.doPublic = RSADoPublic;
RSAKey.prototype.setPublic = RSASetPublic;
RSAKey.prototype.encrypt = RSAEncrypt;
const MyWorkerContext = self;
var cde;
(function (cde) {
    function CInt(pInVal) {
        if (isNaN(pInVal) || !pInVal)
            return 0;
        let retVal = 0;
        try {
            retVal = parseInt(pInVal);
        }
        catch (ex) {
        }
        if (isNaN(retVal))
            return 0;
        return retVal;
    }
    cde.CInt = CInt;
    function CDbl(pInVal) {
        if (isNaN(pInVal) || !pInVal)
            return 0;
        let retVal = 0;
        try {
            retVal = parseFloat(pInVal);
        }
        catch (ex) {
        }
        if (isNaN(retVal))
            return 0;
        return retVal;
    }
    cde.CDbl = CDbl;
    function CBool(inStr) {
        if (this.IsNotSet(inStr))
            return false;
        if (typeof (inStr) === "boolean")
            return inStr;
        switch (inStr.toString().toLowerCase()) {
            case "true":
            case "yes":
            case "1":
            case "on": return true;
            default: return false;
        }
    }
    cde.CBool = CBool;
    function IsNotSet(pInVal) {
        return pInVal === undefined || pInVal === null || pInVal === "";
    }
    cde.IsNotSet = IsNotSet;
    function GetSubstringIndex(pInStr, pSubStr, pOccurance) {
        let times = 0;
        let index = 0;
        while (times < pOccurance && index !== -1) {
            index = pInStr.indexOf(pSubStr, index + pSubStr.length);
            times++;
        }
        return index;
    }
    cde.GetSubstringIndex = GetSubstringIndex;
    function DateToString(inDate) {
        const month = inDate.getMonth() + 1;
        const day = inDate.getDate();
        const year = inDate.getFullYear();
        const hours = inDate.getHours();
        const minutes = inDate.getMinutes();
        let ampm = "AM";
        if (hours > 11) {
            ampm = "PM";
        }
        return month + "/" + day + "/" + year + " " + hours + ":" + minutes + " " + ampm;
    }
    cde.DateToString = DateToString;
    class TheCoreQueueContent {
        constructor(pEng, pTopic, pMsg) {
            this.ENG = pEng;
            this.JMSG = JSON.stringify(pMsg);
            this.TOPIC = pTopic;
        }
    }
    cde.TheCoreQueueContent = TheCoreQueueContent;
    class TheISBConnect {
    }
    cde.TheISBConnect = TheISBConnect;
    class TheTimeouts {
        constructor() {
            this.HeartBeat = 30;
            this.PickupRate = 250;
            this.InitRate = 100;
            this.HeartBeatMissed = 4;
            this.PickupRateDelay = 1;
            this.WsTimeOut = 5000;
        }
        EnterAdrenalin() {
            this.HeartBeat = 5;
            this.HeartBeatMissed = 30;
        }
        NormalHeartRate() {
            this.HeartBeat = 30;
            this.HeartBeatMissed = 4;
        }
        EnterSleepMode() {
            this.HeartBeat = 100;
            this.HeartBeatMissed = 3;
        }
    }
    cde.TheTimeouts = TheTimeouts;
    class TSM {
        constructor(pEng) {
            this.ENG = pEng;
            this.TIM = new Date();
            this.ORG = "";
            this.FID = cdeWorker.MsgSendCounter++;
            this.PLB = null;
            this.QDX = 5;
            this.LVL = 4;
            this.CST = "";
            this.UID = "";
            this.OWN = "";
            this.GRO = "";
        }
        static GetOriginator(pTSM) {
            if (!pTSM.ORG)
                return "";
            const t = pTSM.ORG.split(';');
            return t[0];
        }
    }
    cde.TSM = TSM;
    class TheProcessMessage {
        constructor(pTopic, pTSM) {
            this.Topic = pTopic;
            this.Message = pTSM;
        }
    }
    cde.TheProcessMessage = TheProcessMessage;
    class TheDeviceMessage {
    }
    cde.TheDeviceMessage = TheDeviceMessage;
    class TheCDECredentials {
        constructor() {
            this.QUID = "";
            this.QPWD = "";
            this.QToken = null;
        }
    }
    cde.TheCDECredentials = TheCDECredentials;
    class TheMeshPicker {
    }
    cde.TheMeshPicker = TheMeshPicker;
    class TheUserPreferences {
        constructor() {
            this.CurrentUserName = null;
            this.PortalScreen = null;
            this.StartScreen = null;
            this.HideHeader = false;
        }
    }
    cde.TheUserPreferences = TheUserPreferences;
    class TheNV {
    }
    cde.TheNV = TheNV;
    class TheCommConfig {
        constructor(pWSTimeOut) {
            this.NoISB = false;
            this.DisableRSA = false;
            this.RequestPath = null;
            this.KeepSessionAlive = false;
            this.port = 80;
            this.host = null;
            this.Creds = null;
            this.useTLS = false;
            this.cdeTIM = new Date();
            this.IsWSHBDisabled = false;
            this.TO = new TheTimeouts();
            if (pWSTimeOut > 0)
                this.TO.WsTimeOut = pWSTimeOut;
        }
    }
    cde.TheCommConfig = TheCommConfig;
    class TheWHSI {
        constructor() {
            this.CurrentRSA = null;
            this.IsConnected = false;
            this.CallerCount = 0;
            this.InitialNPA = null;
            this.HasAutoLogin = false;
            this.FirstNodeID = '';
            this.AdminPWMustBeSet = false;
            this.AdminRole = null;
            this.LastPortalScreen = null;
            this.LastStartScreen = null;
            this.MyServiceUrl = '';
            this.IsUserLoggedIn = false;
        }
    }
    cde.TheWHSI = TheWHSI;
    class cdeWorker {
        constructor(port) {
            this.DCreds = null;
            this.MyConfig = null;
            this.MyHSI = new TheWHSI();
            this.NMIVersion = 4.0;
            this.MyStationID = "";
            this.IsPosting = false;
            this.IsRetrying = false;
            this.MyWebSockets = null;
            this.MyFallbackServiceUrl = '';
            this.IsWSConnected = false;
            this.IsConnectionDown = false;
            this.UsesWebSockets = false;
            this.mLoginSent = false;
            this.HasStarted = false;
            this.TriesTokenLogin = false;
            this.HealthCounter = 0;
            this.HBCounter = 0;
            this.DeadCounter = 0;
            this.Pre4209SID = null;
            this.MyCoreQueue = new Array();
            this.MyPorts = [];
            if (port)
                this.AddPort(port);
        }
        get IsConnected() { return this.MyHSI.IsConnected; }
        set IsConnected(value) {
            if (this.MyHSI.IsConnected !== value) {
                this.MyHSI.IsConnected = value;
                this.UpdateHSI();
                this.FireEvent(true, "CDE_CONN_CHANGED", value);
            }
        }
        UpdateHSI() {
            this.MyHSI.HasAutoLogin = (this.MyConfig && this.MyConfig.Creds !== null);
            this.MyHSI.CallerCount = this.MyPorts.length;
            this.WriteToIDB();
        }
        SetTargetRelay(pTarget) {
            if (this.MyHSI.IsConnected)
                return;
            let tParts;
            try {
                tParts = pTarget.split(';:;');
                let t = null;
                t = new URL(tParts[0]);
                let tConf = this.MyConfig;
                if (tConf === null)
                    tConf = new cde.TheCommConfig(0);
                tConf.host = t.hostname;
                tConf.cdeTIM = new Date();
                tConf.port = cde.CInt(t.port);
                if (t.protocol.indexOf("s:", t.protocol.length - 2) !== -1) {
                    tConf.useTLS = true;
                    if (tConf.port === 0)
                        tConf.port = 443;
                }
                else {
                    if (tConf.port === 0)
                        tConf.port = 80;
                }
                if (tParts.length > 1) {
                    tConf.Creds = new cde.TheCDECredentials();
                    tConf.Creds.QUID = tParts[1];
                    if (tParts.length > 2)
                        tConf.Creds.QPWD = tParts[2];
                }
                this.SetConfig(tConf);
                this.FireEvent(true, "CDE_NEW_LOGENTRY", "cdeWebComm:SetTargetRelay", "Config was set", 1);
                return true;
            }
            catch (ex) {
                const tErr = tParts[0] + " is not a valid Url";
                this.FireEvent(true, "CDE_NEW_LOGENTRY", "cdeWebComm:SetTargetRelay", tErr, 2);
                this.FireEvent(true, "CDE_SETSTATUSMSG", tErr, 2);
            }
            return false;
        }
        SetConfig(pConfig) {
            if (this.MyHSI.IsConnected)
                return;
            this.MyConfig = pConfig;
            if (!this.MyConfig)
                return;
            if (this.MyConfig.RequestPath && !this.MyHSI.InitialNPA)
                this.MyHSI.InitialNPA = this.MyConfig.RequestPath;
            if (!this.MyConfig.cdeTIM)
                this.MyConfig.cdeTIM = new Date();
            if (!this.MyConfig.TO)
                this.MyConfig.TO = new cde.TheTimeouts();
            if (!this.MyConfig.host && this.MyConfig.uri) {
                this.SetTargetRelay(this.MyConfig.uri);
            }
        }
        StartCommunication(pConfig) {
            if (this.MyHSI.IsConnected || this.HasStarted) {
                if (this.MyHSI.IsConnected && this.HasStarted)
                    this.FireEvent(true, "CDE_CONN_CHANGED", true);
                return;
            }
            this.IsConnectionDown = false;
            if (!this.MyDB) {
                const req = indexedDB.open('cdeDB', 1);
                req.onupgradeneeded = (ev) => {
                    this.FireEvent(true, "CDE_NEW_LOGENTRY", "IndexedDB:message", "In Upgrade Needed", 1);
                    this.MyDB = ev.target.result;
                    if (!this.MyDB.objectStoreNames.contains('CDEJS')) {
                        this.MyDB.createObjectStore('CDEJS', { keyPath: 'id' });
                    }
                    this.StartCommPhase2(pConfig);
                };
                req.onsuccess = (ev) => {
                    this.FireEvent(true, "CDE_NEW_LOGENTRY", "IndexedDB:message", "Open Success", 1);
                    this.MyDB = ev.target.result;
                    const transaction = this.MyDB.transaction(['CDEJS']);
                    const objectStore = transaction.objectStore('CDEJS');
                    const request = objectStore.get(1);
                    request.onerror = () => {
                        this.FireEvent(true, "CDE_NEW_LOGENTRY", "IndexedDB:message", "Read of Idx1 failed", 3);
                        this.StartCommPhase2(pConfig);
                    };
                    request.onsuccess = () => {
                        this.FireEvent(true, "CDE_NEW_LOGENTRY", "IndexedDB:message", "Read Success", 1);
                        if (request.result) {
                            const tConfig = request.result.config;
                            if (tConfig.Creds && tConfig.Creds.QToken && tConfig.Creds.QToken !== "") {
                                if (pConfig && pConfig.RequestPath) {
                                    tConfig.RequestPath = pConfig.RequestPath;
                                    if (!this.MyHSI.InitialNPA)
                                        this.MyHSI.InitialNPA = pConfig.RequestPath;
                                }
                                pConfig = tConfig;
                                this.FireEvent(true, "CDE_NEW_LOGENTRY", "IndexedDB:message", 'State Restored', 1);
                            }
                            else {
                                this.FireEvent(true, "CDE_NEW_LOGENTRY", "IndexedDB:message", 'State ignored', 1);
                                this.DeleteFromIDB();
                            }
                            this.StartCommPhase2(pConfig);
                        }
                        else {
                            this.FireEvent(true, "CDE_NEW_LOGENTRY", "IndexedDB:message", 'No data record', 2);
                            this.StartCommPhase2(pConfig);
                        }
                    };
                };
                req.onerror = (ev) => {
                    this.FireEvent(true, "CDE_NEW_LOGENTRY", "IndexedDB:error", "Error:" + ev, 3);
                    this.StartCommPhase2(pConfig);
                };
            }
            else
                this.StartCommPhase2(pConfig);
        }
        StartCommPhase2(pConfig) {
            if (pConfig) {
                this.SetConfig(pConfig);
            }
            if (this.MyConfig) {
                if (cde.CBool(this.MyConfig.NoISB) === false) {
                    this.HasStarted = true;
                    let tScheme = "http";
                    if (this.MyConfig.useTLS === true)
                        tScheme += "s";
                    this.MyHSI.MyServiceUrl = `${tScheme}://${this.MyConfig.host}:${this.MyConfig.port}`;
                    const isbEndpoint = `${this.MyHSI.MyServiceUrl}/MYISBCONNECT`;
                    this.GetGlobalResource(isbEndpoint, null, (isbEnd, isbstr) => {
                        const isb = JSON.parse(isbstr);
                        if (isb.ERR) {
                            this.FireEvent(true, "CDE_NEW_LOGENTRY", "cdeWebComm:StartCommunication", "MyISBConnect returned: " + isb.ERR, 3);
                            this.FireEvent(true, "CDE_NO_CONNECT", "ISBConnect returned " + isb.ERR + ". Verify ISBConnect is allow on relay.");
                        }
                        else {
                            if (isb.WSP > 0) {
                                let tscheme = "ws";
                                if (isb.TLS === true)
                                    tscheme += "s";
                                this.MyConfig.wsuri = `${tscheme}://${this.MyConfig.host}:${isb.WSP}`;
                            }
                            {
                                let tscheme = "http";
                                if (isb.TLS === true)
                                    tscheme += "s";
                                this.MyFallbackServiceUrl = `${tscheme}://${this.MyConfig.host}:${this.MyConfig.port}`;
                            }
                            this.MyConfig.RequestPath = isb.NPA;
                            this.MyHSI.InitialNPA = isb.NPA;
                            this.MyHSI.FirstNodeID = isb.FNI;
                            if (isb.ADR) {
                                this.MyHSI.AdminPWMustBeSet = true;
                                this.MyHSI.AdminRole = isb.ADR;
                            }
                            if (cde.CDbl(isb.VER) > 4)
                                this.NMIVersion = cde.CDbl(isb.VER);
                            else
                                this.NMIVersion = 4.0;
                            this.DoStartComm();
                        }
                    }, (isbend, error) => {
                        this.FireEvent(true, "CDE_NEW_LOGENTRY", "cdeWebComm:StartCommunication", "MyISBConnect failed! :" + error, 3);
                        this.FireEvent(true, "CDE_NO_CONNECT", "ISBConnect failed. Verify ISBConnect is allow on relay.");
                    });
                }
            }
            if (!this.HasStarted) {
                this.HasStarted = true;
                this.DoStartComm();
            }
        }
        DoStartComm() {
            let IsStillWorking = false;
            if (!this.MyConfig.TO) {
                this.MyConfig.TO = new cde.TheTimeouts();
            }
            const bStartup = this.StartupWS();
            this.FireEvent(true, "CDE_NEW_LOGENTRY", "cdeWebComm:DoStartComm", "Connect in final stage HB monitoring: " + bStartup);
            this.MyHeartBeatMonitor = setInterval(() => {
                if (IsStillWorking || this.IsConnectionDown)
                    return;
                IsStillWorking = true;
                this.HealthCounter++;
                if ((!this.UsesWebSockets || !this.MyConfig.IsWSHBDisabled) && this.HealthCounter % this.MyConfig.TO.HeartBeat === 0) {
                    if (this.MyCoreQueue.length === 0) {
                        this.PickupNextMessage();
                    }
                    if (!this.UsesWebSockets) {
                        if (this.IsConnected) {
                            if (this.HBCounter++ > this.MyConfig.TO.HeartBeatMissed) {
                                this.IsConnected = false;
                                this.IsPosting = false;
                                this.HBCounter = 0;
                            }
                        }
                        else {
                            if (this.DeadCounter++ > this.MyConfig.TO.HeartBeatMissed * 3) {
                                const reason = cde.DateToString(new Date()) + ": Connection Lost because Service is down or unreachable. Click ok to reload this page";
                                this.FireEvent(true, "CDE_NEW_LOGENTRY", "cdeNode:StartCommunication", reason, 3);
                                this.EndSession(reason);
                            }
                        }
                    }
                }
                if (this.UsesWebSockets || ((this.HealthCounter % this.MyConfig.TO.PickupRateDelay) === 0 || this.MyCoreQueue.length > 0))
                    this.SendNextMessage(null);
                IsStillWorking = false;
            }, this.MyConfig.TO.PickupRate);
            this.FireEvent(true, "CDE_COMM_STARTED", null);
        }
        SendTSM(tTSM, pTopic, pTarget, pSender) {
            if (this.MyCoreQueue.length > 0 && (pTopic === "CDE_PICKUP" || !pTopic))
                return;
            if ((tTSM.FLG & 4096) !== 0) {
                tTSM.PLS = this.RSAEncrypt(tTSM.PLS);
            }
            tTSM.ORG = this.MyStationID + (pSender ? ":" + pSender : "");
            if (pTarget && pTarget !== "") {
                pTopic = "CDE_SYSTEMWIDE";
                if (this.Pre4209SID && this.Pre4209SID !== "")
                    pTopic += "@" + this.Pre4209SID;
                pTopic += ";" + pTarget;
            }
            else if (pTopic !== "") {
                if (this.Pre4209SID && this.Pre4209SID !== "")
                    pTopic += "@" + this.Pre4209SID;
            }
            tTSM.SID = this.Pre4209SID;
            const tDevMsg = new cde.TheDeviceMessage();
            tDevMsg.TOP = pTopic ? pTopic : tTSM.ENG;
            tDevMsg.MSG = tTSM;
            this.MyCoreQueue.push(tDevMsg);
        }
        SendQueued(pOwner, pTopic, pEngineName, pTXT, pPLS, pFLG, pQDX, pLVL, pTarget, pGRO, pSender) {
            if (!pEngineName)
                return;
            if (this.MyCoreQueue.length > 0 && (pTopic === "CDE_PICKUP" || !pTopic))
                return;
            const tTSM = new cde.TSM(pEngineName);
            if (pTarget && pTarget !== "") {
                pTopic = "CDE_SYSTEMWIDE";
                if (this.Pre4209SID && this.Pre4209SID !== "")
                    pTopic += "@" + this.Pre4209SID;
                pTopic += ";" + pTarget;
            }
            else if (pTopic !== "") {
                if (this.Pre4209SID && this.Pre4209SID !== "")
                    pTopic += "@" + this.Pre4209SID;
            }
            tTSM.SID = this.Pre4209SID;
            tTSM.OWN = pOwner;
            tTSM.FLG = pFLG;
            tTSM.LVL = pLVL;
            tTSM.TXT = pTXT;
            if (pGRO)
                tTSM.GRO = pGRO;
            if ((pFLG & 4096) !== 0) {
                tTSM.PLS = this.RSAEncrypt(pPLS);
            }
            else
                tTSM.PLS = pPLS;
            tTSM.QDX = pQDX;
            tTSM.ORG = this.MyStationID + (pSender ? ":" + pSender : "");
            const tDevMsg = new cde.TheDeviceMessage();
            tDevMsg.TOP = pTopic;
            tDevMsg.MSG = tTSM;
            this.MyCoreQueue.push(tDevMsg);
        }
        Login(credentials) {
            if (this.mLoginSent === true || !credentials)
                return;
            if (!this.MyConfig)
                this.MyConfig = new cde.TheCommConfig(0);
            if (!this.MyHSI.CurrentRSA && !this.MyConfig.DisableRSA) {
                this.DCreds = new cde.TheCDECredentials;
                this.DCreds.QUID = credentials.QUID;
                this.DCreds.QPWD = credentials.QPWD;
                this.DCreds.QToken = credentials.QToken;
                this.FireEvent(true, "CDE_SETSTATUSMSG", "RSA not initialized, yet. Waiting for relay to provide...", 2);
            }
            else {
                if (this.DCreds && ((this.DCreds.QUID && this.DCreds.QPWD) || this.DCreds.QToken)) {
                    credentials.QToken = this.DCreds.QToken;
                    credentials.QUID = this.DCreds.QUID;
                    credentials.QPWD = this.DCreds.QPWD;
                }
                this.DCreds = null;
                this.FireEvent(true, "CDE_SETSTATUSMSG", "Sending credentials to Relay...", 1);
                if (credentials.QToken && credentials.QToken !== "") {
                    this.TriesTokenLogin = true;
                    this.SendQueued(null, "CDE_TLOGIN" + credentials.QToken, "ContentService", null, null, 1, 1, 1, null, null);
                }
                else if (!credentials.QUID || credentials.QUID === "") {
                    const cred = this.RSAEncrypt(credentials.QPWD, this.MyHSI.CurrentRSA);
                    this.SendQueued(null, "CDE_SETESID" + cred, "ContentService", null, null, 1, 1, 1, null, null);
                }
                else {
                    const cred = this.RSAEncrypt(`${credentials.QUID}:;:${credentials.QPWD}`, this.MyHSI.CurrentRSA);
                    this.SendQueued(null, "CDE_LOGIN" + cred, "ContentService", null, null, 1, 1, 1, null, null);
                }
                this.mLoginSent = true;
                this.MyConfig.Creds = new cde.TheCDECredentials();
            }
        }
        SelectMesh(pMeshID) {
            this.SendQueued(null, "CDE_MESHSELECT:" + pMeshID, "ContentService", null, null, 1, 1, 1, null, null);
        }
        PickupNextMessage() {
            const tDevMsg = new cde.TheDeviceMessage();
            tDevMsg.TOP = "";
            tDevMsg.MSG = null;
            this.MyCoreQueue.push(tDevMsg);
        }
        SendNextMessage(MyQueuedMsg, pRetryPath) {
            if (!MyQueuedMsg && (this.IsPosting || this.MyCoreQueue.length === 0))
                return;
            if (!this.UsesWebSockets && (!this.MyConfig.RequestPath || this.MyConfig.RequestPath === "") && !pRetryPath)
                return;
            if (this.UsesWebSockets && this.IsWSConnected === false)
                return;
            do {
                this.IsPosting = true;
                let uri;
                if (!MyQueuedMsg) {
                    let telCnt = 0;
                    const tDevList = [];
                    do {
                        tDevList[telCnt] = this.MyCoreQueue.shift();
                        telCnt++;
                    } while (this.MyCoreQueue.length > 0 && telCnt < 10);
                    MyQueuedMsg = new cde.TheCoreQueueContent("", "", tDevList);
                    const tRPath = (pRetryPath ? pRetryPath : this.MyConfig.RequestPath);
                    uri = this.MyFallbackServiceUrl + encodeURI(tRPath);
                    if (this.UsesWebSockets === false && uri.substr(uri.length - 5, 5) === ".ashx")
                        uri = uri.substr(0, uri.length - 5);
                    if (MyQueuedMsg.TOPIC !== "")
                        uri += "?" + encodeURI(MyQueuedMsg.TOPIC);
                    MyQueuedMsg.RQP = uri;
                    pRetryPath = this.MyConfig.RequestPath;
                    this.MyConfig.RequestPath = "";
                }
                else {
                    uri = MyQueuedMsg.RQP;
                }
                this.WriteToIDB();
                if (this.UsesWebSockets) {
                    this.MyWebSockets.send(MyQueuedMsg.JMSG);
                    this.IsPosting = false;
                    MyQueuedMsg = null;
                }
                else {
                    if (fetch) {
                        fetch(uri, {
                            method: "post",
                            body: MyQueuedMsg.JMSG,
                            mode: "cors",
                            cache: "no-cache",
                            redirect: "follow",
                            referrer: "no-referrer",
                            headers: {
                                "Content-Type": "application/json; charset=utf-8"
                            }
                        }).then((resp) => {
                            resp.json().then((m) => {
                                const tMsg = m;
                                this.IsPosting = false;
                                let IsPulsing = false;
                                if (tMsg.length > 0)
                                    for (let i = 0; i < tMsg.length; i++) {
                                        if (tMsg[i].CNT > 0)
                                            IsPulsing = true;
                                        this.IsPosting = !this.ProcessDeviceMessage(tMsg[i], false);
                                    }
                                if (IsPulsing)
                                    this.SendNextMessage(null);
                            });
                        }).catch((error) => {
                            this.PostError(MyQueuedMsg, error, pRetryPath);
                        });
                    }
                    else {
                        const xhr = new XMLHttpRequest();
                        xhr.open('POST', uri);
                        xhr.setRequestHeader('Content-Type', 'application/json');
                        xhr.onload = () => {
                            if (xhr.status === 200) {
                                try {
                                    const tMsg = JSON.parse(xhr.responseText);
                                    this.IsPosting = false;
                                    let IsPulsing = false;
                                    if (tMsg.length > 0)
                                        for (let i = 0; i < tMsg.length; i++) {
                                            if (tMsg[i].CNT > 0)
                                                IsPulsing = true;
                                            this.IsPosting = !this.ProcessDeviceMessage(tMsg[i], false);
                                        }
                                    if (IsPulsing)
                                        this.SendNextMessage(null);
                                }
                                catch (tErr) {
                                    this.FireEvent(true, "CDE_NEW_LOGENTRY", "cdeWebComm:SendNextMessage", "Message Parse Error:" + tErr);
                                    this.PostError(MyQueuedMsg, "parse failed", pRetryPath);
                                }
                            }
                            else if (xhr.status !== 200) {
                                const tStat = "Message returned: " + xhr.status + " msg:" + xhr.statusText;
                                this.FireEvent(true, "CDE_NEW_LOGENTRY", "cdeWebComm:SendNextMessage", tStat);
                                this.PostError(MyQueuedMsg, tStat, pRetryPath);
                            }
                        };
                        xhr.onerror = () => {
                            const tStat = "Message returned: " + xhr.status + " msg:" + xhr.statusText;
                            this.FireEvent(true, "CDE_NEW_LOGENTRY", "cdeWebComm:xhrError", tStat);
                            this.EndSession(tStat);
                        };
                        xhr.send(MyQueuedMsg.JMSG);
                    }
                    break;
                }
            } while (this.MyCoreQueue.length > 0);
        }
        StartupWS() {
            if (!this.MyConfig.wsuri)
                return false;
            let tUri = this.MyConfig.wsuri;
            this.FireEvent(true, "CDE_NEW_LOGENTRY", "cdeWebComm:StartupWS", "WS connect to: " + tUri);
            if (tUri.indexOf(".ashx") < 0)
                tUri += encodeURI(this.MyConfig.RequestPath);
            try {
                this.MyWebSockets = new WebSocket(tUri);
                if (this.MyConfig.TO.WsTimeOut > 0) {
                    setInterval(() => {
                        if (!this.IsWSConnected && this.UsesWebSockets)
                            this.UsesWebSockets = false;
                    }, this.MyConfig.TO.WsTimeOut);
                }
            }
            catch (e) {
                this.MyWebSockets = null;
                return false;
            }
            if (this.MyWebSockets) {
                this.UsesWebSockets = true;
                this.MyWebSockets.onopen = () => {
                    this.FireEvent(true, "CDE_SETSTATUSMSG", "Connecting to WS...", 2);
                    this.MyWebSockets.send("[{\"MET\":0,\"TOP\":\"CDE_INITWS\",\"CNT\":0}]");
                };
                this.MyWebSockets.onmessage = (args) => {
                    if (!this.UsesWebSockets)
                        return;
                    this.IsWSConnected = true;
                    try {
                        if (args.data.substring(0, 1) !== '[') {
                            this.FireEvent(true, "CDE_NEW_LOGENTRY", "cdeWebComm:OnMessage", "Strange Response from WServer:" + args.data);
                        }
                        else {
                            let bIsLarge = false;
                            if (args.data.length > 500000) {
                                this.FireEvent(true, "CDE_NEW_LOGENTRY", "cdeWebComm:OnMessage", "Very large Telegram received:" + args.data.length);
                                bIsLarge = true;
                            }
                            const tMsg = JSON.parse(args.data);
                            if (tMsg && tMsg.length > 0) {
                                for (let i = 0; i < tMsg.length; i++) {
                                    if (!tMsg[i].MSG && tMsg[i].TOP !== "") {
                                        this.FireEvent(true, "CDE_NEW_LOGENTRY", "StartUpWS:onMessage", tMsg[i].TOP);
                                        return;
                                    }
                                    else {
                                        const tTops = tMsg[i].TOP.split(";:;");
                                        if (tTops[0] === "CDE_CONNECT" && this.MyConfig && this.MyConfig.Creds) {
                                            this.MyHSI.CurrentRSA = tMsg[i].RSA;
                                            this.Login(this.MyConfig.Creds);
                                            continue;
                                        }
                                    }
                                    if (bIsLarge)
                                        this.FireEvent(true, "CDE_NEW_LOGENTRY", "cdeWebComm:OnMessage", "ORG:" + cde.TSM.GetOriginator(tMsg[i].MSG) + "TXT: " + tMsg[i].MSG.TXT);
                                    this.ProcessDeviceMessage(tMsg[i], true);
                                }
                            }
                        }
                    }
                    catch (e) {
                        this.FireEvent(true, "CDE_NEW_LOGENTRY", "cdeWebComm:StartWS", "Error during OnMessage:" + e);
                    }
                };
                this.MyWebSockets.onclose = () => {
                    if (this.UsesWebSockets) {
                        this.UsesWebSockets = false;
                        if (this.IsWSConnected) {
                            const tErr = cde.DateToString(new Date()) + (this.mLoginSent ? " Relay refused login and closed connection" : " WS Communication was closed. You will need to login again");
                            this.FireEvent(true, "CDE_SETSTATUSMSG", tErr, 3);
                            this.FireEvent(true, "CDE_NEW_LOGENTRY", "StartUpWS:onclose", tErr);
                            this.EndSession(tErr);
                        }
                        else {
                            const tErr = cde.DateToString(new Date()) + (this.mLoginSent ? " a connection could not be established" : " WS Communication was closed. You will need to login again");
                            this.FireEvent(true, "CDE_SETSTATUSMSG", tErr, 3);
                            this.FireEvent(true, "CDE_NEW_LOGENTRY", "StartUpWS:onclose", tErr);
                            this.EndSession(tErr);
                        }
                    }
                };
                this.MyWebSockets.onerror = () => {
                    if (this.UsesWebSockets) {
                        this.UsesWebSockets = false;
                        if (this.IsWSConnected) {
                            const tErr = cde.DateToString(new Date()) + " WS Communication was interrupted. You will need to login again";
                            this.FireEvent(true, "CDE_SETSTATUSMSG", tErr, 3);
                            this.FireEvent(true, "CDE_NEW_LOGENTRY", "StartUpWS:onerror", tErr);
                            this.EndSession(tErr);
                        }
                    }
                };
                return true;
            }
            return false;
        }
        EndSession(pReason) {
            if (cde.CBool(this.IsConnectionDown))
                return;
            clearInterval(this.MyHeartBeatMonitor);
            this.IsConnectionDown = true;
            this.IsConnected = false;
            this.MyHSI = new cde.TheWHSI();
            this.MyConfig = null;
            this.IsRetrying = false;
            this.HasStarted = false;
            this.DeleteFromIDB();
            this.FireEvent(true, "CDE_SESSION_ENDED", pReason);
        }
        PostError(MyQueuedMsg, errorText, pRetryPath) {
            this.IsPosting = false;
            if (!this.IsRetrying && errorText === "timeout") {
                this.IsRetrying = true;
                this.SendNextMessage(MyQueuedMsg, pRetryPath);
            }
            else {
                if (MyQueuedMsg.ENG !== "") {
                    this.FireEvent(true, "CDE_ENGINE_GONE", MyQueuedMsg.ENG);
                }
                const tErr = cde.DateToString(new Date()) + " Communication was lost.You will need to login again";
                this.FireEvent(true, "CDE_SETSTATUSMSG", tErr, 3);
                this.FireEvent(true, "CDE_NEW_LOGENTRY", "PostError", tErr);
                this.EndSession(tErr);
            }
        }
        ProcessDeviceMessage(tMsg, ViaWS) {
            if (tMsg.MSG)
                this.FireEvent(true, "CDE_INCOMING_MSG", new cde.TheProcessMessage(tMsg.TOP.split(":,:")[0], tMsg.MSG));
            if (ViaWS || tMsg.NPA) {
                let IsHSIDirty = false;
                this.MyConfig.RequestPath = tMsg.NPA;
                if (!this.MyHSI.InitialNPA)
                    this.MyHSI.InitialNPA = tMsg.NPA;
                if (tMsg.RSA && tMsg.RSA !== "" && !this.MyHSI.CurrentRSA) {
                    this.MyHSI.CurrentRSA = tMsg.RSA;
                    if (!this.MyHSI.FirstNodeID) {
                        this.MyHSI.FirstNodeID = cde.TSM.GetOriginator(tMsg.MSG);
                    }
                    IsHSIDirty = true;
                    if (this.DCreds) {
                        this.Login(this.DCreds);
                        this.DCreds = null;
                    }
                }
                this.DeadCounter = 0;
                if (tMsg.DID && tMsg.DID !== "" && !this.MyStationID) {
                    this.MyStationID = tMsg.DID;
                    IsHSIDirty = true;
                }
                let tIsConnected = this.IsConnected;
                let tJustLoggedIn = false;
                if (tMsg.TOP === 'ERR:CDE_LOGIN_FAILURE') {
                    this.MyHSI.IsUserLoggedIn = false;
                    this.mLoginSent = false;
                    this.MyConfig.Creds = null;
                    this.FireEvent(true, "CDE_LOGIN_EVENT", false, "Relay rejected credentials", null);
                    tJustLoggedIn = true;
                    IsHSIDirty = true;
                    this.EndSession("Relay rejected credentials - Login failed");
                }
                else if (tMsg.TOP === 'ERR:CDE_MESHSELECT_FAILURE') {
                    this.MyHSI.IsUserLoggedIn = false;
                    this.mLoginSent = false;
                    this.MyConfig.Creds = null;
                    this.FireEvent(true, "CDE_LOGIN_EVENT", false, "Mesh Picker failed", null);
                    tJustLoggedIn = true;
                    IsHSIDirty = true;
                    this.EndSession("Mesh Selection failed, please reload this page");
                }
                else if (tMsg.TOP.length > 12) {
                    const tLogParts = tMsg.TOP.split(':');
                    if (!this.MyHSI.IsUserLoggedIn) {
                        if (tLogParts[0] === 'LOGIN_SUCCESS') {
                            this.MyHSI.UserPref = new cde.TheUserPreferences();
                            let tScrParts = null;
                            if (tLogParts.length > 1) {
                                tScrParts = tLogParts[1].split(';');
                                if (tScrParts.length > 1) {
                                    this.MyHSI.LastPortalScreen = tScrParts[1];
                                    if (tScrParts.length > 2)
                                        this.MyHSI.UserPref.HideHeader = cde.CBool(tScrParts[2]);
                                }
                                if (!cde.IsNotSet(tScrParts[0])) {
                                    this.MyHSI.LastStartScreen = tScrParts[0];
                                }
                                if (tLogParts.length > 2) {
                                    this.MyHSI.UserPref.CurrentUserName = tLogParts[2];
                                    if (tLogParts.length > 3) {
                                        try {
                                            const pos = cde.GetSubstringIndex(tMsg.TOP, ':', 3);
                                            const tres = tMsg.TOP.substr(pos + 1);
                                            if (tres.length > 2 && tres.substr(0, 1) === "{")
                                                this.MyHSI.UserPref = JSON.parse(tres);
                                            else
                                                this.MyHSI.UserPref.LCID = cde.CInt(tres);
                                        }
                                        catch (ee) {
                                            this.FireEvent(true, "CDE_NEW_LOGENTRY", "Login:Illegal User Preferences received");
                                        }
                                    }
                                }
                            }
                            if (this.MyConfig["LPS"]) {
                                this.MyHSI.LastPortalScreen = this.MyConfig["LPS"];
                            }
                            if (this.MyConfig["LSSC"]) {
                                this.MyHSI.LastStartScreen = this.MyConfig["LSSC"];
                            }
                            this.MyHSI.IsUserLoggedIn = true;
                            this.MyHSI.UserPref.ScreenParts = tScrParts;
                            this.Pre4209SID = tMsg.SID;
                            if (tMsg.SID && tMsg.SID.substr(0, 2) === "UT") {
                                this.Pre4209SID = null;
                                this.MyConfig.Creds = new cde.TheCDECredentials();
                                this.MyConfig.Creds.QToken = tMsg.SID;
                            }
                            this.FireEvent(true, "CDE_LOGIN_EVENT", true, "Login Successful!", this.MyHSI.UserPref);
                            tJustLoggedIn = true;
                            IsHSIDirty = true;
                            this.mLoginSent = false;
                        }
                        else if (tLogParts[0] === 'SELECT_MESH') {
                            const tMeshPicker = tMsg.TOP.substr('SELECT_MESH:'.length);
                            const tMeshes = JSON.parse(tMeshPicker);
                            this.FireEvent(true, "CDE_SELECT_MESH", tMeshes);
                        }
                    }
                }
                if (!ViaWS && tMsg.CNT > 0 && this.MyCoreQueue.length === 0)
                    this.PickupNextMessage();
                tIsConnected = true;
                if (tIsConnected !== this.IsConnected) {
                    if (tIsConnected && !tJustLoggedIn) {
                        this.FireEvent(true, "CDE_SETSTATUSMSG", "Connected to " + this.MyHSI.MyServiceUrl + " using " + (this.UsesWebSockets ? "WS" : "REST"), 1);
                    }
                    this.IsConnected = tIsConnected;
                }
                else {
                    if (IsHSIDirty === true) {
                        this.UpdateCallerHSI("ProcessMsgDirty");
                    }
                }
                if (!this.UsesWebSockets)
                    return true;
            }
            return false;
        }
        RSAEncrypt(text, token) {
            if (this.MyConfig.DisableRSA)
                return text;
            if (!token || token.length === 0)
                token = this.MyHSI.CurrentRSA;
            if (!token || token.length === 0)
                return text;
            const keys = token.split(',');
            const key = new RSAKey();
            key.setPublic(keys[1], keys[0]);
            return key.encrypt(text);
        }
        GetResourceStringAsync(pUri, pAddHeader) {
            this.GetGlobalResource("/ClientBin/" + pUri, pAddHeader, (retMagic, res) => {
                this.FireEvent(true, "GRS_" + retMagic, res);
            }, (pMagic, err) => {
                this.FireEvent(true, "GRS_ERROR_" + pMagic, err);
            });
        }
        GetGlobalResourceAsync(pUri, pAddHeader) {
            this.GetGlobalResource(pUri, pAddHeader, (pMagic, res) => {
                this.FireEvent(true, "GGR_" + pMagic, res);
            }, (pMagic, err) => {
                this.FireEvent(true, "GGR_ERROR_" + pMagic, err);
            });
        }
        GetJSONAsync(pUri, pAddHeader) {
            this.GetGlobalResource(pUri, pAddHeader, (pMagic, res) => {
                try {
                    const tJ = JSON.parse(res);
                    this.FireEvent(true, "GJ_" + pMagic, tJ);
                }
                catch (ex) {
                    this.FireEvent(true, "GJ_ERROR_" + pMagic, ex);
                }
            }, (pMagic, err) => {
                this.FireEvent(true, "GJ_ERROR_" + pMagic, err);
            });
        }
        GetGlobalResource(pResource, pAddHeader, pCallback, pErrorCallback) {
            if (fetch) {
                const fOptions = new Headers();
                if (pAddHeader) {
                    const tHeads = pAddHeader.split(';:;');
                    for (let i = 0; i < tHeads.length; i++) {
                        const tHed = tHeads[i].split('=');
                        if (tHed.length > 1)
                            fOptions.append(tHed[0], tHed[1]);
                    }
                }
                fetch(pResource, { headers: fOptions, cache: "no-store" }).then(d => {
                    if (d.ok) {
                        d.text().then(txt => {
                            pCallback(pResource, txt);
                        });
                    }
                    else {
                        if (pErrorCallback)
                            pErrorCallback(pResource, d.statusText);
                    }
                }).catch(err => {
                    if (pErrorCallback)
                        pErrorCallback(pResource, err);
                });
            }
            else {
                const xhr = new XMLHttpRequest();
                xhr.open('GET', pResource);
                xhr.responseType = 'text';
                if (pAddHeader) {
                    const tHeads = pAddHeader.split(';:;');
                    let tHasAccept = false;
                    for (let i = 0; i < tHeads.length; i++) {
                        const tHed = tHeads[i].split('=');
                        if (tHed[0] === "Accept")
                            tHasAccept = true;
                        if (tHed.length > 1) {
                            xhr.setRequestHeader(tHed[0], tHed[1]);
                        }
                    }
                    if (!tHasAccept)
                        xhr.setRequestHeader("Accept", "*/*");
                }
                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 400) {
                        if (pCallback)
                            pCallback(pResource, xhr.responseText);
                    }
                    else {
                        if (pErrorCallback)
                            pErrorCallback(pResource, xhr.status + ":" + xhr.statusText);
                    }
                };
                xhr.onerror = () => {
                    if (pErrorCallback)
                        pErrorCallback(pResource, xhr.status + ":" + xhr.statusText);
                };
                xhr.send();
            }
        }
        UpdateCustomSettings(pValues) {
            if (this.MyConfig) {
                for (const key in pValues) {
                    this.MyConfig[key] = pValues[key];
                }
                this.WriteToIDB();
            }
        }
        OnMessage(ev) {
            try {
                const message = ev.data;
                if (message.length > 1) {
                    switch (message[0]) {
                        case "SetTargetRelay":
                            this.SetTargetRelay.apply(this, Array.prototype.slice.call(message, 1));
                            break;
                        case "SetConfig":
                            this.SetConfig.apply(this, Array.prototype.slice.call(message, 1));
                            break;
                        case "StartCommunication":
                            this.StartCommunication.apply(this, Array.prototype.slice.call(message, 1));
                            break;
                        case "SendQueued":
                            this.SendQueued.apply(this, Array.prototype.slice.call(message, 1));
                            break;
                        case "UpdateCustomSettings":
                            this.UpdateCustomSettings.apply(this, Array.prototype.slice.call(message, 1));
                            break;
                        case "Subscribe":
                            {
                                const tTSM = new cde.TSM("ContentService");
                                tTSM.TXT = "CDE_SUBSCRIBE";
                                tTSM.PLS = message[1];
                                if (this.Pre4209SID && this.Pre4209SID !== "")
                                    tTSM.PLS += "@" + this.Pre4209SID;
                                this.SendTSM(tTSM, null, this.MyHSI.FirstNodeID);
                            }
                            break;
                        case "Unsubscribe":
                            {
                                const tTSM = new cde.TSM("ContentService");
                                tTSM.TXT = "CDE_UNSUBSCRIBE";
                                tTSM.PLS = message[1];
                                if (this.Pre4209SID && this.Pre4209SID !== "")
                                    tTSM.PLS += "@" + this.Pre4209SID;
                                this.SendTSM(tTSM, null, this.MyHSI.FirstNodeID);
                            }
                            break;
                        case "SendTSM":
                            this.SendTSM.apply(this, Array.prototype.slice.call(message, 1));
                            break;
                        case "SendToFirstNode":
                            this.SendTSM(message[1], "CDE_SYSTEMWIDE", this.MyHSI.FirstNodeID);
                            break;
                        case "SendToOriginator":
                            if (message.length > 2) {
                                this.SendTSM(message[2], "CDE_SYSTEMWIDE", message[1].ORG);
                            }
                            break;
                        case "SendToNode":
                            if (message.length > 2)
                                this.SendTSM(message[2], "CDE_SYSTEMWIDE", message[1]);
                            break;
                        case "Logout":
                            this.EndSession(message[1]);
                            break;
                        case "GetWHSI":
                            this.UpdateCallerHSI("GETWHSI");
                            break;
                        case "Login":
                            this.Login.apply(this, Array.prototype.slice.call(message, 1));
                            break;
                        case "SelectMesh":
                            this.SelectMesh.apply(this, Array.prototype.slice.call(message, 1));
                            break;
                        case "GetJSON":
                            this.GetJSONAsync.apply(this, Array.prototype.slice.call(message, 1));
                            break;
                        case "GetResourceString":
                            this.GetResourceStringAsync.apply(this, Array.prototype.slice.call(message, 1));
                            break;
                        case "GetGlobalResource":
                            this.GetGlobalResourceAsync.apply(this, Array.prototype.slice.call(message, 1));
                            break;
                    }
                }
            }
            catch (ee) {
                this.FireEvent(true, "CDE_NEW_LOGENTRY", "cdeWebWorker:OnMessage", ee, 3);
            }
        }
        FireEvent(async, pEvent, ...param) {
            for (let i = 0; i < this.MyPorts.length; i++)
                this.MyPorts[i].postMessage([pEvent, this.MyHSI, ...param]);
        }
        UpdateCallerHSI(pSource) {
            this.UpdateHSI();
            this.FireEvent(true, "CDE_NEW_LOGENTRY", "UpdateHSI", pSource, 1);
            this.FireEvent(true, "CDE_UPDATE_HSI", pSource);
        }
        AddPort(newPort) {
            this.MyPorts.push(newPort);
        }
        WriteToIDB() {
            if (!this.MyDB) {
                this.FireEvent(true, "CDE_NEW_LOGENTRY", "IndexedDB:WriteToIDB", 'IDB is not ready, yet', 3);
                return;
            }
            this.MyConfig.cdeTIM = new Date();
            const request = this.MyDB.transaction(['CDEJS'], 'readwrite')
                .objectStore('CDEJS')
                .put({ id: 1, config: this.MyConfig });
            request.onsuccess = () => {
            };
            request.onerror = () => {
                this.FireEvent(true, "CDE_NEW_LOGENTRY", "IndexedDB:WriteToIDB", 'The data has been written failed', 3);
            };
        }
        DeleteFromIDB() {
            if (!this.MyDB) {
                this.FireEvent(true, "CDE_NEW_LOGENTRY", "IndexedDB:DeleteFromIDB", 'IDB is not ready, yet', 3);
                return;
            }
            const request = this.MyDB.transaction(['CDEJS'], 'readwrite')
                .objectStore('CDEJS')
                .delete(1);
            request.onsuccess = () => {
                this.FireEvent(true, "CDE_NEW_LOGENTRY", "IndexedDB:DeleteFromIDB", 'The data has been deleted', 1);
            };
        }
    }
    cdeWorker.MsgSendCounter = 0;
    cde.cdeWorker = cdeWorker;
})(cde || (cde = {}));
var MyWorker;
MyWorkerContext.onconnect = function (e) {
    const port = e.ports[0];
    port.addEventListener('message', (ev) => {
        MyWorker.OnMessage(ev);
    });
    port.start();
    if (!MyWorker) {
        MyWorker = new cde.cdeWorker(port);
    }
    else {
        MyWorker.AddPort(port);
        MyWorker.UpdateCallerHSI("startup");
    }
};
//# sourceMappingURL=cdeWorker.js.map