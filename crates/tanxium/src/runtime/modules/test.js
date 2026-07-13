import { AsyncLocalStorage as ss } from 'node:async_hooks';
var f = class extends Error {
  constructor(t, s) {
    (super(t, s), (this.name = 'AssertionError'));
  }
};
var ie = class {
    #e;
    constructor() {
      ((this.#e = { assertionCount: void 0, assertionCheck: !1, assertionTriggered: !1, assertionTriggeredCount: 0 }),
        typeof globalThis?.addEventListener == 'function'
          ? globalThis.addEventListener('unload', () => {
              this.#t();
            })
          : typeof globalThis?.process?.on == 'function'
            ? globalThis.process.on('exit', () => {
                this.#t();
              })
            : console.warn('AssertionCounter cleanup step was not registered'));
    }
    #t() {
      if (this.#e.assertionCheck || this.#e.assertionCount !== void 0)
        throw new Error(
          'AssertionCounter was not cleaned up: If tests are not otherwise failing, ensure `expect.hasAssertion` and `expect.assertions` are only run in bdd tests',
        );
    }
    get assertionCount() {
      return this.#e.assertionCount;
    }
    get assertionTriggeredCount() {
      return this.#e.assertionTriggeredCount;
    }
    setAssertionCheck(t) {
      this.#e.assertionCheck = t;
    }
    setAssertionTriggered(t) {
      this.#e.assertionTriggered = t;
    }
    setAssertionCount(t) {
      this.#e.assertionCount = t;
    }
    updateAssertionTriggerCount() {
      this.#e.assertionCount !== void 0 && (this.#e.assertionTriggeredCount += 1);
    }
    checkAssertionErrorState() {
      return this.#e.assertionCheck && !this.#e.assertionTriggered;
    }
    resetAssertionState() {
      this.#e = { assertionCount: void 0, assertionCheck: !1, assertionTriggered: !1, assertionTriggeredCount: 0 };
    }
    checkAssertionCountSatisfied() {
      return this.#e.assertionCount !== void 0 && this.#e.assertionCount !== this.#e.assertionTriggeredCount;
    }
  },
  Bt = new ie();
function Ce() {
  return Bt;
}
var D = Ce();
function Oe() {
  D.setAssertionCheck(!0);
}
function Se(e) {
  D.setAssertionCount(e);
}
function qe() {
  (D.setAssertionTriggered(!0), D.updateAssertionTriggerCount());
}
var ke = [];
function Ae(e) {
  if (!Array.isArray(e)) throw new TypeError(`customEqualityTester expects an array of Testers. But got ${typeof e}`);
  ke.push(...e);
}
function x() {
  return ke;
}
var b = class {
    value;
    inverse;
    constructor(t, s = !1) {
      ((this.value = t), (this.inverse = s));
    }
  },
  ae = class extends b {
    equals(t) {
      return t != null;
    }
  };
function je() {
  return new ae();
}
var ue = class extends b {
  constructor(t) {
    if (t === void 0) throw new TypeError('Expected a constructor function');
    super(t);
  }
  equals(t) {
    return typeof t == 'object'
      ? t instanceof this.value
      : this.value === Number
        ? typeof t == 'number'
        : this.value === String
          ? typeof t == 'string'
          : this.value === Number
            ? typeof t == 'number'
            : this.value === Function
              ? typeof t == 'function'
              : this.value === Boolean
                ? typeof t == 'boolean'
                : this.value === BigInt
                  ? typeof t == 'bigint'
                  : this.value === Symbol
                    ? typeof t == 'symbol'
                    : !1;
  }
};
function Ie(e) {
  return new ue(e);
}
var V = class extends b {
  constructor(t, s = !1) {
    super(t, s);
  }
  equals(t) {
    let s = Array.isArray(t) && this.value.every((r) => t.some((n) => g(r, n, { customTesters: x() })));
    return this.inverse ? !s : s;
  }
};
function Re(e) {
  return new V(e);
}
function We(e) {
  return new V(e, !0);
}
var fe = class extends b {
  #e;
  constructor(t, s = 2) {
    (super(t), (this.#e = s));
  }
  equals(t) {
    return typeof t != 'number'
      ? !1
      : (this.value === Number.POSITIVE_INFINITY && t === Number.POSITIVE_INFINITY) ||
          (this.value === Number.NEGATIVE_INFINITY && t === Number.NEGATIVE_INFINITY)
        ? !0
        : Math.abs(this.value - t) < Math.pow(10, -this.#e) / 2;
  }
};
function Be(e, t) {
  return new fe(e, t);
}
var F = class extends b {
  constructor(t, s = !1) {
    super(t, s);
  }
  equals(t) {
    let s = typeof t != 'string' ? !1 : t.includes(this.value);
    return this.inverse ? !s : s;
  }
};
function Pe(e) {
  return new F(e);
}
function Le(e) {
  return new F(e, !0);
}
var z = class extends b {
  constructor(t, s = !1) {
    super(new RegExp(t), s);
  }
  equals(t) {
    let s = typeof t != 'string' ? !1 : this.value.test(t);
    return this.inverse ? !s : s;
  }
};
function He(e) {
  return new z(e);
}
function De(e) {
  return new z(e, !0);
}
var _ = class extends b {
  constructor(t, s = !1) {
    super(t, s);
  }
  equals(t) {
    let s = Object.keys(this.value),
      r = !0;
    for (let n of s) (!Object.hasOwn(t, n) || !g(this.value[n], t[n])) && (r = !1);
    return this.inverse ? !r : r;
  }
};
function xe(e) {
  return new _(e);
}
function Ve(e) {
  return new _(e, !0);
}
function Fe(e) {
  return e instanceof Set || e instanceof Map;
}
function Lt(e, t) {
  return (
    e.constructor === t.constructor ||
    (e.constructor === Object && !t.constructor) ||
    (!e.constructor && t.constructor === Object)
  );
}
function Ht(e, t) {
  let s = e instanceof b,
    r = t instanceof b;
  if (!(s && r)) {
    if (s) return e.equals(t);
    if (r) return t.equals(e);
  }
}
function g(e, t, s) {
  let { customTesters: r = [], strictCheck: n } = s ?? {},
    o = new Map();
  return (function u(i, a) {
    let l = Ht(i, a);
    if (l !== void 0) return l;
    if (r?.length)
      for (let m of r) {
        let c = { equal: g },
          d = m.call(c, i, a, r);
        if (d !== void 0) return d;
      }
    if (i && a && ((i instanceof RegExp && a instanceof RegExp) || (i instanceof URL && a instanceof URL)))
      return String(i) === String(a);
    if (i instanceof Date && a instanceof Date) {
      let m = i.getTime(),
        c = a.getTime();
      return Number.isNaN(m) && Number.isNaN(c) ? !0 : m === c;
    }
    if (i instanceof Error && a instanceof Error) return i.message === a.message;
    if (typeof i == 'number' && typeof a == 'number') return (Number.isNaN(i) && Number.isNaN(a)) || i === a;
    if (i === null || a === null) return i === a;
    if (Object.prototype.toString.call(i) !== Object.prototype.toString.call(a)) return !1;
    if (Object.is(i, a)) return !0;
    if (i && typeof i == 'object' && a && typeof a == 'object') {
      if (n && i && a && !Lt(i, a)) return !1;
      if (i instanceof WeakMap || a instanceof WeakMap) {
        if (!(i instanceof WeakMap && a instanceof WeakMap)) return !1;
        throw new TypeError('Cannot compare WeakMap instances');
      }
      if (i instanceof WeakSet || a instanceof WeakSet) {
        if (!(i instanceof WeakSet && a instanceof WeakSet)) return !1;
        throw new TypeError('Cannot compare WeakSet instances');
      }
      if (o.get(i) === a) return !0;
      let m = Object.keys(i ?? {}),
        c = Object.keys(a ?? {}),
        d = m.length,
        y = c.length;
      if (n && d !== y) return !1;
      if (!n) {
        if (d > 0)
          for (let p = 0; p < m.length; p += 1) {
            let w = m[p];
            w in i && i[w] === void 0 && !(w in a) && (d -= 1);
          }
        if (y > 0)
          for (let p = 0; p < c.length; p += 1) {
            let w = c[p];
            w in a && a[w] === void 0 && !(w in i) && (y -= 1);
          }
      }
      if ((o.set(i, a), Fe(i) && Fe(a))) {
        if (i.size !== a.size) return !1;
        let p = [...i.keys()];
        if (
          p.every(
            (M) =>
              typeof M == 'string' ||
              typeof M == 'number' ||
              typeof M == 'boolean' ||
              typeof M == 'bigint' ||
              typeof M == 'symbol' ||
              M == null,
          )
        ) {
          if (i instanceof Set) return i.symmetricDifference(a).size === 0;
          for (let M of p) if (!a.has(M) || !u(i.get(M), a.get(M))) return !1;
          return !0;
        }
        let v = i.size;
        for (let [M, L] of i.entries())
          for (let [R, H] of a.entries())
            if (u(M, R) && ((M === L && R === H) || u(L, H))) {
              v--;
              break;
            }
        return v === 0;
      }
      let $ = { ...i, ...a };
      for (let p of [...Object.getOwnPropertyNames($), ...Object.getOwnPropertySymbols($)])
        if (
          !u(i && i[p], a && a[p]) ||
          (p in i && i[p] !== void 0 && !(p in a)) ||
          (p in a && a[p] !== void 0 && !(p in i))
        )
          return !1;
      return i instanceof WeakRef || a instanceof WeakRef
        ? i instanceof WeakRef && a instanceof WeakRef
          ? u(i.deref(), a.deref())
          : !1
        : !0;
    }
    return !1;
  })(e, t);
}
var le = {};
function ze() {
  return le;
}
function _e(e) {
  le = { ...le, ...e };
}
function T(e) {
  let { Deno: t, process: s } = globalThis,
    r = t?.inspect ?? s?.getBuiltinModule?.('node:util')?.inspect;
  return typeof r == 'function'
    ? r(e, {
        depth: 1 / 0,
        sorted: !0,
        trailingComma: !0,
        compact: !1,
        iterableLimit: 1 / 0,
        getters: !0,
        strAbbreviateSize: 1 / 0,
      })
    : xt(e);
}
var Dt = [
  (e) => {
    if (typeof e > 'u') return 'undefined';
    if (typeof e == 'bigint') return `${e}n`;
    if (
      typeof e == 'string' ||
      typeof e == 'number' ||
      typeof e == 'boolean' ||
      e === null ||
      Array.isArray(e) ||
      [null, Object.prototype].includes(Object.getPrototypeOf(e))
    )
      return JSON.stringify(e, null, 2);
  },
  (e) => String(e),
  (e) => Object.prototype.toString.call(e),
];
function xt(e) {
  for (let t of Dt)
    try {
      let s = t(e);
      if (typeof s == 'string') return s;
    } catch {}
  return '[[Unable to format value]]';
}
function W(e, t, s) {
  if (!Object.is(e, t)) return;
  let r = s ? `: ${s}` : '.';
  throw new f(`Expected "actual" to not be strictly equal to: ${T(e)}${r}
`);
}
var { Deno: Ke } = globalThis,
  Vt = typeof Ke?.noColor == 'boolean' ? Ke.noColor : !1,
  Ft = !Vt;
function q(e, t) {
  return { open: `\x1B[${e.join(';')}m`, close: `\x1B[${t}m`, regexp: new RegExp(`\\x1b\\[${t}m`, 'g') };
}
function k(e, t) {
  return Ft ? `${t.open}${e.replace(t.regexp, t.open)}${t.close}` : e;
}
function j(e) {
  return k(e, q([1], 22));
}
function B(e) {
  return k(e, q([31], 39));
}
function ce(e) {
  return k(e, q([32], 39));
}
function K(e) {
  return k(e, q([37], 39));
}
function me(e) {
  return zt(e);
}
function zt(e) {
  return k(e, q([90], 39));
}
function Ge(e) {
  return k(e, q([41], 49));
}
function Ue(e) {
  return k(e, q([42], 49));
}
var _t = new RegExp(
  [
    '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
    '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TXZcf-nq-uy=><~]))',
  ].join('|'),
  'g',
);
function G(e) {
  return e.replace(_t, '');
}
function Ye(e, t = !1) {
  switch (e) {
    case 'added':
      return (s) => (t ? Ue(K(s)) : ce(j(s)));
    case 'removed':
      return (s) => (t ? Ge(K(s)) : B(j(s)));
    case 'truncation':
      return me;
    default:
      return K;
  }
}
function Kt(e) {
  switch (e) {
    case 'added':
      return '+   ';
    case 'removed':
      return '-   ';
    default:
      return '    ';
  }
}
function U(e, t = {}, s) {
  s != null && (e = s(e, t.stringDiff ?? !1));
  let { stringDiff: r = !1 } = t,
    n = ['', '', `    ${me(j('[Diff]'))} ${B(j('Actual'))} / ${ce(j('Expected'))}`, '', ''],
    o = e.map((u) => {
      let i = Ye(u.type),
        a =
          u.type === 'added' || u.type === 'removed'
            ? (u.details?.map((l) => (l.type !== 'common' ? Ye(l.type, !0)(l.value) : l.value)).join('') ?? u.value)
            : u.value;
      return i(`${Kt(u.type)}${a}`);
    });
  return (n.push(...(r ? [o.join('')] : o), ''), n);
}
function Gt(e, t) {
  let s = [];
  if (e.length === 0 || t.length === 0) return [];
  for (let r = 0; r < Math.min(e.length, t.length); r += 1) {
    let n = e[r],
      o = t[r];
    if (n !== void 0 && n === o) s.push(n);
    else return s;
  }
  return s;
}
function Je(e) {
  if (e == null || typeof e != 'object' || typeof e?.y != 'number' || typeof e?.id != 'number')
    throw new Error(`Unexpected value, expected 'FarthestPoint': received ${typeof e}`);
}
function Ut(e, t, s, r, n, o) {
  let u = e.length,
    i = t.length,
    a = [],
    l = u - 1,
    h = i - 1,
    m = n[s.id],
    c = n[s.id + o];
  for (; !(!m && !c);) {
    let d = m;
    (c === 1
      ? (a.unshift({ type: r ? 'removed' : 'added', value: t[h] }), (h -= 1))
      : c === 3
        ? (a.unshift({ type: r ? 'added' : 'removed', value: e[l] }), (l -= 1))
        : (a.unshift({ type: 'common', value: e[l] }), (l -= 1), (h -= 1)),
      (m = n[d]),
      (c = n[d + o]));
  }
  return a;
}
function Yt(e, t, s, r, n, o, u) {
  if (o && o.y === -1 && u && u.y === -1) return { y: 0, id: 0 };
  let i = u?.y === -1 || e === t || (o?.y ?? 0) > (u?.y ?? 0) + 1;
  if (o && i) {
    let a = o.id;
    return (n++, (s[n] = a), (s[n + r] = 3), { y: o.y, id: n });
  }
  if (u && !i) {
    let a = u.id;
    return (n++, (s[n] = a), (s[n + r] = 1), { y: u.y + 1, id: n });
  }
  throw new Error('Unexpected missing FarthestPoint');
}
function A(e, t) {
  let s = Gt(e, t);
  ((e = e.slice(s.length)), (t = t.slice(s.length)));
  let r = t.length > e.length;
  [e, t] = r ? [t, e] : [e, t];
  let n = e.length,
    o = t.length;
  if (!n && !o && !s.length) return [];
  if (!o)
    return [
      ...s.map((p) => ({ type: 'common', value: p })),
      ...e.map((p) => ({ type: r ? 'added' : 'removed', value: p })),
    ];
  let u = o,
    i = n - o,
    a = n + o + 1,
    l = Array.from({ length: a }, () => ({ y: -1, id: -1 })),
    h = new Uint32Array((n * o + a + 1) * 2),
    m = h.length / 2,
    c = 0;
  function d(p, w, v, M, L) {
    let R = w.length,
      H = v.length,
      O = Yt(p, R, h, m, c, M, L);
    for (c = O.id; O.y + p < R && O.y < H && w[O.y + p] === v[O.y];) {
      let Wt = O.id;
      (c++, (O.id = c), (O.y += 1), (h[c] = Wt), (h[c + m] = 2));
    }
    return O;
  }
  let y = l[i + u];
  Je(y);
  let $ = -1;
  for (; y.y < o;) {
    $ = $ + 1;
    for (let w = -$; w < i; ++w) {
      let v = w + u;
      l[v] = d(w, e, t, l[v - 1], l[v + 1]);
    }
    for (let w = i + $; w > i; --w) {
      let v = w + u;
      l[v] = d(w, e, t, l[v - 1], l[v + 1]);
    }
    let p = i + u;
    ((l[i + u] = d(i, e, t, l[p - 1], l[p + 1])), (y = l[i + u]), Je(y));
  }
  return [...s.map((p) => ({ type: 'common', value: p })), ...Ut(e, t, y, r, h, m)];
}
function Ze(e) {
  return e
    .replaceAll('\\', '\\\\')
    .replaceAll('\b', '\\b')
    .replaceAll('\f', '\\f')
    .replaceAll('	', '\\t')
    .replaceAll('\v', '\\v')
    .replaceAll(/\r\n|\r|\n/g, (t) =>
      t === '\r'
        ? '\\r'
        : t ===
            `
`
          ? `\\n
`
          : `\\r\\n\r
`,
    );
}
var Jt = /((?:\\[bftv]|[^\S\r\n])+|\\[rn\\]|[()[\]{}'"\r\n]|\b)/;
function Y(e, t = !1) {
  if (t) return e.split(Jt).filter((n) => n);
  let s = [],
    r = e.split(/(\n|\r\n)/).filter((n) => n);
  for (let [n, o] of r.entries()) n % 2 ? (s[s.length - 1] += o) : s.push(o);
  return s;
}
function Xe(e, t) {
  return t
    .filter(({ type: s }) => s === e.type || s === 'common')
    .map((s, r, n) => {
      let o = n[r - 1];
      return s.type === 'common' && o && o.type === n[r + 1]?.type && /\s+/.test(s.value) ? { ...s, type: o.type } : s;
    });
}
var Zt = /\S/;
function J(e, t) {
  let s = A(
      Y(`${Ze(e)}
`),
      Y(`${Ze(t)}
`),
    ),
    r = [],
    n = [];
  for (let a of s) (a.type === 'added' && r.push(a), a.type === 'removed' && n.push(a));
  let o = r.length < n.length,
    u = o ? r : n,
    i = o ? n : r;
  for (let a of u) {
    let l = [],
      h;
    for (; i.length;) {
      h = i.shift();
      let m = [Y(a.value, !0), Y(h.value, !0)];
      if ((o && m.reverse(), (l = A(m[0], m[1])), l.some(({ type: c, value: d }) => c === 'common' && Zt.test(d))))
        break;
    }
    ((a.details = Xe(a, l)), h && (h.details = Xe(h, l)));
  }
  return s;
}
function P(e, t, s) {
  if (Object.is(e, t)) return;
  let r = s ? `: ${s}` : '.',
    n,
    o = T(e),
    u = T(t);
  if (o === u) {
    let i = o
      .split(`
`)
      .map((a) => `    ${a}`).join(`
`);
    n = `Values have the same structure but are not reference-equal${r}

${B(i)}
`;
  } else {
    let i = typeof e == 'string' && typeof t == 'string',
      a = i
        ? J(e, t)
        : A(
            o.split(`
`),
            u.split(`
`),
          ),
      l = U(a, { stringDiff: i }, arguments[3]).join(`
`);
    n = `Values are not strictly equal${r}
${l}`;
  }
  throw new f(n);
}
function Qe(e, t, s = '') {
  if (e instanceof t) return;
  let r = s ? `: ${s}` : '.',
    n = t.name,
    o = '';
  throw (
    e === null
      ? (o = 'null')
      : e === void 0
        ? (o = 'undefined')
        : typeof e == 'object'
          ? (o = e.constructor?.name ?? 'Object')
          : (o = typeof e),
    n === o
      ? (s = `Expected object to be an instance of "${n}"${r}`)
      : o === 'function'
        ? (s = `Expected object to be an instance of "${n}" but was not an instanced object${r}`)
        : (s = `Expected object to be an instance of "${n}" but was "${o}"${r}`),
    new f(s)
  );
}
function pe(e, t, s, r) {
  let n = r ? `${r}: ` : '';
  if (!(e instanceof Error)) throw new f(`${n}Expected "error" to be an Error object.`);
  if (t && !(e instanceof t))
    throw ((r = `${n}Expected error to be instance of "${t.name}", but was "${e?.constructor?.name}".`), new f(r));
  let o;
  if (
    (typeof s == 'string' && (o = G(e.message).includes(G(s))),
    s instanceof RegExp && (o = s.test(G(e.message))),
    s && !o)
  )
    throw (
      (r = `${n}Expected error message to include ${s instanceof RegExp ? s.toString() : JSON.stringify(s)}, but got ${JSON.stringify(e?.message)}.`),
      new f(r)
    );
}
function et(e, t = '') {
  if (e) throw new f(t);
}
function tt(e, t, s) {
  let r = s ? `: ${s}` : '.';
  ((s = `Expected object to not be an instance of "${typeof t}"${r}`), et(e instanceof t, s));
}
function st(e, t, s) {
  if (t.test(e)) return;
  let r = s ? `: ${s}` : '.';
  throw ((s = `Expected actual: "${e}" to match: "${t}"${r}`), new f(s));
}
function rt(e, t, s) {
  if (!t.test(e)) return;
  let r = s ? `: ${s}` : '.';
  throw ((s = `Expected actual: "${e}" to not match: "${t}"${r}`), new f(s));
}
function nt(e) {
  return typeof e == 'string';
}
function Z(e, t, s = {}) {
  let { formatter: r = T, msg: n } = s,
    o = n ? `${n}: ` : '',
    u = r(e),
    i = r(t),
    a = `${o}Values are not equal.`,
    l = nt(e) && nt(t),
    h = l
      ? J(e, t)
      : A(
          u.split(`
`),
          i.split(`
`),
        ),
    m = U(h, { stringDiff: l }).join(`
`);
  return (
    (a = `${a}
${m}`),
    a
  );
}
function X(e, t, s = {}) {
  let { formatter: r = T, msg: n } = s,
    o = r(e),
    u = r(t);
  return `${n ? `${n}: ` : ''}Expected actual: ${o} not to be: ${u}.`;
}
function Q(e, t, s) {
  if (g(e, t, s)) return;
  let r = Z(e, t, s ?? {});
  throw new f(r);
}
function ee(e, t, s = {}) {
  if (!g(e, t, s)) return;
  let r = X(e, t, s ?? {});
  throw new f(r);
}
var ot = Symbol.for('@MOCK');
function C(e) {
  let t = e[ot];
  if (!t) throw new Error('Received function must be a mock or spy function');
  return [...t.calls];
}
function N(e) {
  return e.map(S).join(', ');
}
function S(e) {
  let { Deno: t } = globalThis;
  return typeof t < 'u' && t.inspect ? t.inspect(e) : String(e);
}
function te(e) {
  let { customMessage: t, customTesters: s = [], strictCheck: r } = e ?? {},
    n = { customTesters: s };
  return (t !== void 0 && (n.msg = t), r !== void 0 && (n.strictCheck = r), n);
}
function he(e) {
  return e == null ? !1 : typeof e.then == 'function';
}
function it(e) {
  return !!(e != null && e[Symbol.iterator]);
}
function at(e, t) {
  return Object.prototype.toString.apply(t) === `[object ${e}]`;
}
function lt(e) {
  return e !== null && typeof e == 'object';
}
function ut(e) {
  return (
    lt(e) &&
    !(e instanceof Error) &&
    !Array.isArray(e) &&
    !(e instanceof Date) &&
    !(e instanceof Set) &&
    !(e instanceof Map)
  );
}
function Xt(e) {
  return [
    ...Object.keys(e),
    ...Object.getOwnPropertySymbols(e).filter((t) => Object.getOwnPropertyDescriptor(e, t)?.enumerable),
  ];
}
function ct(e, t) {
  return !e || typeof e != 'object' || e === Object.prototype
    ? !1
    : Object.prototype.hasOwnProperty.call(e, t) || ct(Object.getPrototypeOf(e), t);
}
function ft(e) {
  return lt(e)
    ? Object.getOwnPropertySymbols(e)
        .filter((t) => t !== Symbol.iterator)
        .map((t) => [t, e[t]])
        .concat(Object.entries(e))
    : [];
}
function I(e, t, s = [], r = [], n = []) {
  if (typeof e != 'object' || typeof t != 'object' || Array.isArray(e) || Array.isArray(t) || !it(e) || !it(t)) return;
  if (e.constructor !== t.constructor) return !1;
  let o = r.length;
  for (; o--;) if (r[o] === e) return n[o] === t;
  (r.push(e), n.push(t));
  let u = (m, c) => I(m, c, [...i], [...r], [...n]),
    i = [...s.filter((m) => m !== I), u];
  if (e.size !== void 0) {
    if (e.size !== t.size) return !1;
    if (at('Set', e)) {
      let m = !0;
      for (let c of e)
        if (!t.has(c)) {
          let d = !1;
          for (let y of t) g(c, y, { customTesters: i }) === !0 && (d = !0);
          if (d === !1) {
            m = !1;
            break;
          }
        }
      return (r.pop(), n.pop(), m);
    } else if (at('Map', e)) {
      let m = !0;
      for (let c of e)
        if (!t.has(c[0]) || !g(c[1], t.get(c[0]), { customTesters: i })) {
          let d = !1;
          for (let y of t) {
            let $ = g(c[0], y[0], { customTesters: i }),
              p = !1;
            ($ === !0 && (p = g(c[1], y[1], { customTesters: i })), p === !0 && (d = !0));
          }
          if (d === !1) {
            m = !1;
            break;
          }
        }
      return (r.pop(), n.pop(), m);
    }
  }
  let a = t[Symbol.iterator]();
  for (let m of e) {
    let c = a.next();
    if (c.done || !g(m, c.value, { customTesters: i })) return !1;
  }
  if (!a.next().done) return !1;
  let l = ft(e),
    h = ft(t);
  return g(l, h) ? (r.pop(), n.pop(), !0) : !1;
}
function ge(e, t, s = []) {
  let r = s.filter((o) => o !== ge),
    n =
      (o = new WeakMap()) =>
      (u, i) => {
        if (!ut(i) || o.has(i)) return;
        o.set(i, !0);
        let a = Xt(i).every((l) => {
          if (ut(i[l]) && o.has(i[l])) return g(u[l], i[l], { customTesters: r });
          let h = u != null && ct(u, l) && g(u[l], i[l], { customTesters: [...r, n(o)] });
          return (o.delete(i[l]), h);
        });
        return (o.delete(i), a);
      };
  return n()(e, t);
}
function mt(e, t) {
  e.isNot ? W(e.value, t, e.customMessage) : P(e.value, t, e.customMessage);
}
function pt(e, t) {
  let s = e.value,
    r = t,
    n = te({ ...e, customTesters: [...e.customTesters, I] });
  e.isNot ? ee(s, r, n) : Q(s, r, n);
}
function ht(e, t) {
  let s = te({ ...e, strictCheck: !0, customTesters: [...e.customTesters, I] });
  e.isNot ? ee(e.value, t, s) : Q(e.value, t, s);
}
function gt(e, t, s = 2) {
  if (s < 0) throw new Error('toBeCloseTo second argument must be a non-negative integer. Got ' + s);
  let r = 0.5 * Math.pow(10, -s),
    n = Number(e.value),
    o = Math.abs(t - n) < r;
  if (e.isNot) {
    if (o) {
      let u = `Expected the value ${n} not to be close to ${t} (using ${s} digits), but it is`;
      throw new f(e.customMessage ? `${e.customMessage}: ${u}` : u);
    }
  } else if (!o) {
    let u = `Expected the value ${n} to be close to ${t} (using ${s} digits), but it is not`;
    throw new f(e.customMessage ? `${e.customMessage}: ${u}` : u);
  }
}
function dt(e) {
  e.isNot ? P(e.value, void 0, e.customMessage) : W(e.value, void 0, e.customMessage);
}
function wt(e) {
  e.isNot ? W(e.value, void 0, e.customMessage) : P(e.value, void 0, e.customMessage);
}
function yt(e) {
  let t = !e.value;
  if (e.isNot) {
    if (t) {
      let s = `Expected ${e.value} to NOT be falsy`;
      throw new f(e.customMessage ? `${e.customMessage}: ${s}` : s);
    }
  } else if (!t) {
    let s = `Expected ${e.value} to be falsy`;
    throw new f(e.customMessage ? `${e.customMessage}: ${s}` : s);
  }
}
function $t(e) {
  let t = !!e.value;
  if (e.isNot) {
    if (t) {
      let s = `Expected ${e.value} to NOT be truthy`;
      throw new f(e.customMessage ? `${e.customMessage}: ${s}` : s);
    }
  } else if (!t) {
    let s = `Expected ${e.value} to be truthy`;
    throw new f(e.customMessage ? `${e.customMessage}: ${s}` : s);
  }
}
function Mt(e, t) {
  let s = Number(e.value) >= Number(t);
  if (e.isNot) {
    if (s) {
      let r = `Expected ${e.value} to NOT be greater than or equal ${t}`;
      throw new f(e.customMessage ? `${e.customMessage}: ${r}` : r);
    }
  } else if (!s) {
    let r = `Expected ${e.value} to be greater than or equal ${t}`;
    throw new f(e.customMessage ? `${e.customMessage}: ${r}` : r);
  }
}
function Et(e, t) {
  let s = Number(e.value) > Number(t);
  if (e.isNot) {
    if (s) {
      let r = `Expected ${e.value} to NOT be greater than ${t}`;
      throw new f(e.customMessage ? `${e.customMessage}: ${r}` : r);
    }
  } else if (!s) {
    let r = `Expected ${e.value} to be greater than ${t}`;
    throw new f(e.customMessage ? `${e.customMessage}: ${r}` : r);
  }
}
function vt(e, t) {
  e.isNot ? tt(e.value, t) : Qe(e.value, t);
}
function bt(e, t) {
  let s = Number(e.value) <= Number(t);
  if (e.isNot) {
    if (s) {
      let r = `Expected ${e.value} to NOT be lower than or equal ${t}`;
      throw new f(e.customMessage ? `${e.customMessage}: ${r}` : r);
    }
  } else if (!s) {
    let r = `Expected ${e.value} to be lower than or equal ${t}`;
    throw new f(e.customMessage ? `${e.customMessage}: ${r}` : r);
  }
}
function Nt(e, t) {
  let s = Number(e.value) < Number(t);
  if (e.isNot) {
    if (s) {
      let r = `Expected ${e.value} to NOT be lower than ${t}`;
      throw new f(e.customMessage ? `${e.customMessage}: ${r}` : r);
    }
  } else if (!s) {
    let r = `Expected ${e.value} to be lower than ${t}`;
    throw new f(e.customMessage ? `${e.customMessage}: ${r}` : r);
  }
}
function Tt(e) {
  let t = te(e);
  e.isNot
    ? ee(isNaN(Number(e.value)), !0, { ...t, msg: t.msg || `Expected ${e.value} to not be NaN` })
    : Q(isNaN(Number(e.value)), !0, { ...t, msg: t.msg || `Expected ${e.value} to be NaN` });
}
function Ct(e) {
  e.isNot
    ? W(e.value, null, e.customMessage || `Expected ${e.value} to not be null`)
    : P(e.value, null, e.customMessage || `Expected ${e.value} to be null`);
}
function Ot(e, t) {
  let { value: s } = e,
    r = s?.length,
    n = r === t;
  if (e.isNot) {
    if (n) {
      let o = `Expected value not to have length ${t}, but it does`;
      throw new f(e.customMessage ? `${e.customMessage}: ${o}` : o);
    }
  } else if (!n) {
    let o = `Expected value to have length ${t}, but it does not: the value has length ${r}`;
    throw new f(e.customMessage ? `${e.customMessage}: ${o}` : o);
  }
}
function St(e, t, s) {
  let { value: r } = e,
    n = [];
  Array.isArray(t) ? (n = t) : (n = t.split('.'));
  let o = r;
  for (; !(o == null || n.length === 0);) {
    let a = n.shift();
    o = o[a];
  }
  let u;
  s ? (u = o !== void 0 && n.length === 0 && g(o, s, e)) : (u = o !== void 0 && n.length === 0);
  let i = '';
  if ((s && (i = ` of the value ${S(s)}`), e.isNot)) {
    if (u) {
      let a = `Expected the value not to have the property ${n.join('.')}${i}, but it does`;
      throw new f(e.customMessage ? `${e.customMessage}: ${a}` : a);
    }
  } else if (!u) {
    let a = `Expected the value to have the property ${n.join('.')}${i}, but it does not`;
    throw new f(e.customMessage ? `${e.customMessage}: ${a}` : a);
  }
}
function qt(e, t) {
  let s = e.value?.includes?.(t),
    r = T(e.value),
    n = T(t);
  if (e.isNot) {
    if (s) {
      let o = `The value ${r} contains the expected item ${n}`;
      throw new f(e.customMessage ? `${e.customMessage}: ${o}` : o);
    }
  } else if (!s) {
    let o = `The value ${r} doesn't contain the expected item ${n}`;
    throw new f(e.customMessage ? `${e.customMessage}: ${o}` : o);
  }
}
function kt(e, t) {
  let { value: s } = e;
  Qt(s);
  let r = !1;
  for (let i of s)
    if (g(i, t, e)) {
      r = !0;
      break;
    }
  let n = (i) =>
      JSON.stringify(i, null, '	')
        .replace(/\"|\n|\t/g, '')
        .slice(0, 100),
    o = n(e.value),
    u = n(t);
  if (e.isNot) {
    if (r) {
      let i = `The value contains the expected item:
Value: ${o}
Expected: ${u}`;
      throw new f(e.customMessage ? `${e.customMessage}: ${i}` : i);
    }
  } else if (!r) {
    let i = `The value doesn't contain the expected item:
Value: ${o}
Expected: ${u}`;
    throw new f(e.customMessage ? `${e.customMessage}: ${i}` : i);
  }
}
function Qt(e) {
  if (e == null) throw new f('The value is null or undefined');
  if (typeof e[Symbol.iterator] != 'function') throw new f('The value is not iterable');
}
function At(e, t) {
  e.isNot ? rt(String(e.value), t, e.customMessage) : st(String(e.value), t, e.customMessage);
}
function jt(e, t) {
  let s = e.value,
    r = 'Received value must be an object';
  if (typeof s != 'object' || s === null) throw new f(e.customMessage ? `${e.customMessage}: ${r}` : r);
  if (typeof t != 'object' || t === null) throw new f(e.customMessage ? `${e.customMessage}: ${r}` : r);
  let n = g(s, t, { strictCheck: !1, customTesters: [...e.customTesters, I, ge] }),
    o = () => {
      if (e.isNot) {
        let u = X(s, t);
        throw new f(e.customMessage ? `${e.customMessage}: ${u}` : u);
      } else {
        let u = Z(s, t);
        throw new f(e.customMessage ? `${e.customMessage}: ${u}` : u);
      }
    };
  ((e.isNot && n) || (!e.isNot && !n)) && o();
}
function de(e) {
  let t = C(e.value),
    s = t.length > 0;
  if (e.isNot) {
    if (s) {
      let r = `Expected mock function not to be called, but it was called ${t.length} time(s)`;
      throw new f(e.customMessage ? `${e.customMessage}: ${r}` : r);
    }
  } else if (!s) {
    let r = 'Expected mock function to be called, but it was not called';
    throw new f(e.customMessage ? `${e.customMessage}: ${r}` : r);
  }
}
function we(e, t) {
  let s = C(e.value);
  if (e.isNot) {
    if (s.length === t) {
      let r = `Expected mock function not to be called ${t} time(s), but it was`;
      throw new f(e.customMessage ? `${e.customMessage}: ${r}` : r);
    }
  } else if (s.length !== t) {
    let r = `Expected mock function to be called ${t} time(s), but it was called ${s.length} time(s)`;
    throw new f(e.customMessage ? `${e.customMessage}: ${r}` : r);
  }
}
function ye(e, ...t) {
  let s = C(e.value),
    r = s.some((n) => g(n.args, t));
  if (e.isNot) {
    if (r) {
      let n = `Expected mock function not to be called with ${N(t)}, but it was`;
      throw new f(e.customMessage ? `${e.customMessage}: ${n}` : n);
    }
  } else if (!r) {
    let n = '';
    s.length > 0 &&
      (n = `
  Other calls:
     ${s.map((u) => N(u.args)).join(`
    `)}`);
    let o = `Expected mock function to be called with ${N(t)}, but it was not.${n}`;
    throw new f(e.customMessage ? `${e.customMessage}: ${o}` : o);
  }
}
function $e(e, ...t) {
  let s = C(e.value),
    r = s.length > 0 && g(s.at(-1)?.args, t);
  if (e.isNot) {
    if (r) {
      let n = `Expected mock function not to be last called with ${N(t)}, but it was`;
      throw new f(e.customMessage ? `${e.customMessage}: ${n}` : n);
    }
  } else if (!r) {
    let n = s.at(-1);
    if (n) {
      let o = `Expected mock function to be last called with ${N(t)}, but it was last called with ${N(n.args)}`;
      throw new f(e.customMessage ? `${e.customMessage}: ${o}` : o);
    } else {
      let o = `Expected mock function to be last called with ${N(t)}, but it was not`;
      throw new f(e.customMessage ? `${e.customMessage}: ${o}` : o);
    }
  }
}
function Me(e, t, ...s) {
  if (t < 1) throw new Error(`nth must be greater than 0: received ${t}`);
  let r = C(e.value),
    n = t - 1,
    o = r.length > n && g(r[n]?.args, s);
  if (e.isNot) {
    if (o) {
      let u = `Expected the n-th call (n=${t}) of mock function is not with ${N(s)}, but it was`;
      throw new f(e.customMessage ? `${e.customMessage}: ${u}` : u);
    }
  } else if (!o) {
    let u = r[n];
    if (u) {
      let i = `Expected the n-th call (n=${t}) of mock function is with ${N(s)}, but it was with ${N(u.args)}`;
      throw new f(e.customMessage ? `${e.customMessage}: ${i}` : i);
    } else {
      let i = `Expected the n-th call (n=${t}) of mock function is with ${N(s)}, but the n-th call does not exist`;
      throw new f(e.customMessage ? `${e.customMessage}: ${i}` : i);
    }
  }
}
function Ee(e) {
  let s = C(e.value).filter((r) => r.returns);
  if (e.isNot) {
    if (s.length > 0) {
      let r = `Expected the mock function to not have returned, but it returned ${s.length} times`;
      throw new f(e.customMessage ? `${e.customMessage}: ${r}` : r);
    }
  } else if (s.length === 0) {
    let r = 'Expected the mock function to have returned, but it did not return';
    throw new f(e.customMessage ? `${e.customMessage}: ${r}` : r);
  }
}
function ve(e, t) {
  let r = C(e.value).filter((n) => n.returns);
  if (e.isNot) {
    if (r.length === t) {
      let n = `Expected the mock function to not have returned ${t} times, but it returned ${r.length} times`;
      throw new f(e.customMessage ? `${e.customMessage}: ${n}` : n);
    }
  } else if (r.length !== t) {
    let n = `Expected the mock function to have returned ${t} times, but it returned ${r.length} times`;
    throw new f(e.customMessage ? `${e.customMessage}: ${n}` : n);
  }
}
function be(e, t) {
  let n = C(e.value)
    .filter((o) => o.returns)
    .some((o) => g(o.returned, t));
  if (e.isNot) {
    if (n) {
      let o = `Expected the mock function to not have returned with ${S(t)}, but it did`;
      throw new f(e.customMessage ? `${e.customMessage}: ${o}` : o);
    }
  } else if (!n) {
    let o = `Expected the mock function to have returned with ${S(t)}, but it did not`;
    throw new f(e.customMessage ? `${e.customMessage}: ${o}` : o);
  }
}
function Ne(e, t) {
  let r = C(e.value).filter((o) => o.returns),
    n = r.length > 0 && g(r.at(-1)?.returned, t);
  if (e.isNot) {
    if (n) {
      let o = `Expected the mock function to not have last returned with ${S(t)}, but it did`;
      throw new f(e.customMessage ? `${e.customMessage}: ${o}` : o);
    }
  } else if (!n) {
    let o = `Expected the mock function to have last returned with ${S(t)}, but it did not`;
    throw new f(e.customMessage ? `${e.customMessage}: ${o}` : o);
  }
}
function Te(e, t, s) {
  if (t < 1) throw new Error(`nth(${t}) must be greater than 0`);
  let n = C(e.value).filter((a) => a.returns),
    o = t - 1,
    u = n[o],
    i = u && g(u.returned, s);
  if (e.isNot) {
    if (i) {
      let a = `Expected the mock function to not have n-th (n=${t}) returned with ${S(s)}, but it did`;
      throw new f(e.customMessage ? `${e.customMessage}: ${a}` : a);
    }
  } else if (!i) {
    let a = `Expected the mock function to have n-th (n=${t}) returned with ${S(s)}, but it did not`;
    throw new f(e.customMessage ? `${e.customMessage}: ${a}` : a);
  }
}
function It(e, t) {
  if (typeof e.value == 'function')
    try {
      e.value = e.value();
    } catch (n) {
      e.value = n;
    }
  let s, r;
  if (
    (t instanceof Error && ((s = t.constructor), (r = t.message)),
    t instanceof Function && (s = t),
    (typeof t == 'string' || t instanceof RegExp) && (r = t),
    e.isNot)
  ) {
    let n = !1;
    try {
      (pe(e.value, s, r, e.customMessage), (n = !0));
      let o = `Expected to NOT throw ${t}`;
      throw new f(e.customMessage ? `${e.customMessage}: ${o}` : o);
    } catch (o) {
      if (n) throw o;
      return;
    }
  }
  return pe(e.value, s, r, e.customMessage);
}
var es = [];
function Rt(e) {
  es.unshift(e);
}
var ts = {
  lastCalledWith: $e,
  lastReturnedWith: Ne,
  nthCalledWith: Me,
  nthReturnedWith: Te,
  toBeCalled: de,
  toBeCalledTimes: we,
  toBeCalledWith: ye,
  toBeCloseTo: gt,
  toBeDefined: dt,
  toBeFalsy: yt,
  toBeGreaterThanOrEqual: Mt,
  toBeGreaterThan: Et,
  toBeInstanceOf: vt,
  toBeLessThanOrEqual: bt,
  toBeLessThan: Nt,
  toBeNaN: Tt,
  toBeNull: Ct,
  toBeTruthy: $t,
  toBeUndefined: wt,
  toBe: mt,
  toContainEqual: kt,
  toContain: qt,
  toEqual: pt,
  toHaveBeenCalledTimes: we,
  toHaveBeenCalledWith: ye,
  toHaveBeenCalled: de,
  toHaveBeenLastCalledWith: $e,
  toHaveBeenNthCalledWith: Me,
  toHaveLength: Ot,
  toHaveLastReturnedWith: Ne,
  toHaveNthReturnedWith: Te,
  toHaveProperty: St,
  toHaveReturnedTimes: ve,
  toHaveReturnedWith: be,
  toHaveReturned: Ee,
  toMatchObject: jt,
  toMatch: At,
  toReturn: Ee,
  toReturnTimes: ve,
  toReturnWith: be,
  toStrictEqual: ht,
  toThrow: It,
};
function E(e, t) {
  let s = !1,
    r = !1,
    n = new Proxy(
      {},
      {
        get(o, u) {
          if (u === 'not') return ((s = !s), n);
          if (u === 'resolves') {
            if (!he(e)) throw new f('Expected value must be PromiseLike');
            return ((r = !0), n);
          }
          if (u === 'rejects') {
            if (!he(e)) throw new f('Expected value must be a PromiseLike');
            return (
              (e = e.then(
                (h) => {
                  throw new f(`Promise did not reject: resolved to ${h}`);
                },
                (h) => h,
              )),
              (r = !0),
              n
            );
          }
          let i = ze(),
            l = { ...ts, ...i }[u];
          if (!l) throw new TypeError(typeof u == 'string' ? `matcher not found: ${u}` : 'matcher not found');
          return (...h) => {
            function m(c, d) {
              let y = { value: c, equal: g, isNot: !1, customMessage: t, customTesters: x() };
              if ((s && (y.isNot = !0), u in i)) {
                let $ = l(y, ...d);
                if (y.isNot) {
                  if ($.pass) throw new f($.message());
                } else if (!$.pass) throw new f($.message());
              } else l(y, ...d);
              qe();
            }
            return r ? e.then((c) => m(c, h)) : m(e, h);
          };
        },
      },
    );
  return n;
}
E.addEqualityTesters = Ae;
E.extend = _e;
E.anything = je;
E.any = Ie;
E.arrayContaining = Re;
E.closeTo = Be;
E.stringContaining = Pe;
E.stringMatching = He;
E.hasAssertions = Oe;
E.assertions = Se;
E.objectContaining = xe;
E.not = { arrayContaining: We, objectContaining: Ve, stringContaining: Le, stringMatching: De };
E.addSnapshotSerializer = Rt;
var oe = new ss(),
  se = class extends Error {
    constructor() {
      (super('Test skipped'), (this.name = 'SkipTestError'));
    }
  },
  re = class extends Error {
    constructor(t) {
      (super(t ?? 'Test failed'), (this.name = 'FailTestError'));
    }
  },
  ne = class extends Error {
    constructor() {
      (super('Test passed'), (this.name = 'SucceedTestError'));
    }
  },
  rs = {
    skip() {
      throw new se();
    },
    fail(e) {
      throw new re(e);
    },
    succeed() {
      throw new ne();
    },
  };
function ns(e) {
  return e instanceof Error ? e.message : String(e);
}
async function os(e) {
  let t = performance.now();
  try {
    return (await e.fn(rs), { test: e.name, result: 'pass', error: null, duration: performance.now() - t });
  } catch (s) {
    return s instanceof se
      ? { test: e.name, result: 'skip', error: null, duration: performance.now() - t }
      : s instanceof ne
        ? { test: e.name, result: 'pass', error: null, duration: performance.now() - t }
        : s instanceof re
          ? { test: e.name, result: 'fail', error: s.message, duration: performance.now() - t }
          : { test: e.name, result: 'fail', error: ns(s), duration: performance.now() - t };
  }
}
async function zr(e) {
  let t = { tests: [] };
  oe.run(t, e);
  let s = [];
  for (let r of t.tests) s.push(await os(r));
  return { testResults: s };
}
function is() {
  let e = {
    get(t, s) {
      return new Proxy(() => {}, e);
    },
    apply() {
      return new Proxy(() => {}, e);
    },
  };
  return new Proxy(() => {}, e);
}
var _r = (...e) => (oe.getStore() ? E(...e) : is());
function Kr(e, t) {
  let s = oe.getStore();
  s && s.tests.push({ name: e, fn: t });
}
function Gr(e, t) {
  oe.getStore() && t();
}
export { Gr as describe, _r as expect, zr as runTest, Kr as test };
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2luZGV4LnRzIiwgImh0dHBzOi8vanNyLmlvL0BzdGQvYXNzZXJ0LzEuMC4xNi9hc3NlcnRpb25fZXJyb3IudHMiLCAiaHR0cHM6Ly9qc3IuaW8vQHN0ZC9pbnRlcm5hbC8xLjAuMTIvYXNzZXJ0aW9uX3N0YXRlLnRzIiwgImh0dHBzOi8vanNyLmlvL0BzdGQvZXhwZWN0LzEuMC4xNy9fYXNzZXJ0aW9ucy50cyIsICJodHRwczovL2pzci5pby9Ac3RkL2V4cGVjdC8xLjAuMTcvX2N1c3RvbV9lcXVhbGl0eV90ZXN0ZXIudHMiLCAiaHR0cHM6Ly9qc3IuaW8vQHN0ZC9leHBlY3QvMS4wLjE3L19hc3ltbWV0cmljX21hdGNoZXJzLnRzIiwgImh0dHBzOi8vanNyLmlvL0BzdGQvZXhwZWN0LzEuMC4xNy9fZXF1YWwudHMiLCAiaHR0cHM6Ly9qc3IuaW8vQHN0ZC9leHBlY3QvMS4wLjE3L19leHRlbmQudHMiLCAiaHR0cHM6Ly9qc3IuaW8vQHN0ZC9pbnRlcm5hbC8xLjAuMTIvZm9ybWF0LnRzIiwgImh0dHBzOi8vanNyLmlvL0BzdGQvYXNzZXJ0LzEuMC4xNi9ub3Rfc3RyaWN0X2VxdWFscy50cyIsICJodHRwczovL2pzci5pby9Ac3RkL2ludGVybmFsLzEuMC4xMi9zdHlsZXMudHMiLCAiaHR0cHM6Ly9qc3IuaW8vQHN0ZC9pbnRlcm5hbC8xLjAuMTIvYnVpbGRfbWVzc2FnZS50cyIsICJodHRwczovL2pzci5pby9Ac3RkL2ludGVybmFsLzEuMC4xMi9kaWZmLnRzIiwgImh0dHBzOi8vanNyLmlvL0BzdGQvaW50ZXJuYWwvMS4wLjEyL2RpZmZfc3RyLnRzIiwgImh0dHBzOi8vanNyLmlvL0BzdGQvYXNzZXJ0LzEuMC4xNi9zdHJpY3RfZXF1YWxzLnRzIiwgImh0dHBzOi8vanNyLmlvL0BzdGQvYXNzZXJ0LzEuMC4xNi9pbnN0YW5jZV9vZi50cyIsICJodHRwczovL2pzci5pby9Ac3RkL2V4cGVjdC8xLjAuMTcvX2Fzc2VydF9pc19lcnJvci50cyIsICJodHRwczovL2pzci5pby9Ac3RkL2Fzc2VydC8xLjAuMTYvZmFsc2UudHMiLCAiaHR0cHM6Ly9qc3IuaW8vQHN0ZC9hc3NlcnQvMS4wLjE2L25vdF9pbnN0YW5jZV9vZi50cyIsICJodHRwczovL2pzci5pby9Ac3RkL2Fzc2VydC8xLjAuMTYvbWF0Y2gudHMiLCAiaHR0cHM6Ly9qc3IuaW8vQHN0ZC9hc3NlcnQvMS4wLjE2L25vdF9tYXRjaC50cyIsICJodHRwczovL2pzci5pby9Ac3RkL2V4cGVjdC8xLjAuMTcvX2J1aWxkX21lc3NhZ2UudHMiLCAiaHR0cHM6Ly9qc3IuaW8vQHN0ZC9leHBlY3QvMS4wLjE3L19hc3NlcnRfZXF1YWxzLnRzIiwgImh0dHBzOi8vanNyLmlvL0BzdGQvZXhwZWN0LzEuMC4xNy9fYXNzZXJ0X25vdF9lcXVhbHMudHMiLCAiaHR0cHM6Ly9qc3IuaW8vQHN0ZC9leHBlY3QvMS4wLjE3L19tb2NrX3V0aWwudHMiLCAiaHR0cHM6Ly9qc3IuaW8vQHN0ZC9leHBlY3QvMS4wLjE3L19pbnNwZWN0X2FyZ3MudHMiLCAiaHR0cHM6Ly9qc3IuaW8vQHN0ZC9leHBlY3QvMS4wLjE3L191dGlscy50cyIsICJodHRwczovL2pzci5pby9Ac3RkL2V4cGVjdC8xLjAuMTcvX21hdGNoZXJzLnRzIiwgImh0dHBzOi8vanNyLmlvL0BzdGQvZXhwZWN0LzEuMC4xNy9fc2VyaWFsaXplci50cyIsICJodHRwczovL2pzci5pby9Ac3RkL2V4cGVjdC8xLjAuMTcvZXhwZWN0LnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgeyBBc3luY0xvY2FsU3RvcmFnZSB9IGZyb20gJ25vZGU6YXN5bmNfaG9va3MnO1xuXG5pbXBvcnQgeyBleHBlY3QgYXMgc3RkRXhwZWN0IH0gZnJvbSAnQHN0ZC9leHBlY3QnO1xuXG5leHBvcnQgaW50ZXJmYWNlIFRlc3RSZXN1bHQge1xuICB0ZXN0OiBzdHJpbmc7XG4gIHJlc3VsdDogJ3Bhc3MnIHwgJ2ZhaWwnIHwgJ3NraXAnO1xuICBlcnJvcjogc3RyaW5nIHwgbnVsbDtcbiAgZHVyYXRpb246IG51bWJlcjtcbn1cblxuaW50ZXJmYWNlIFRlc3RFbnRyeSB7XG4gIG5hbWU6IHN0cmluZztcbiAgZm46IFRlc3RGdW5jdGlvbjtcbn1cblxuaW50ZXJmYWNlIFRlc3RTdG9yZSB7XG4gIHRlc3RzOiBUZXN0RW50cnlbXTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBUZXN0UnVuUmVzdWx0IHtcbiAgdGVzdFJlc3VsdHM6IFRlc3RSZXN1bHRbXTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBUZXN0Q29udGV4dCB7XG4gIC8qKlxuICAgKiBTa2lwIHRoZSBjdXJyZW50IHRlc3QuIFRoZSB0ZXN0IHdpbGwgYmUgbWFya2VkIGFzIHNraXBwZWQuXG4gICAqL1xuICBza2lwKCk6IG5ldmVyO1xuICAvKipcbiAgICogRXhwbGljaXRseSBmYWlsIHRoZSBjdXJyZW50IHRlc3Qgd2l0aCBhbiBvcHRpb25hbCBtZXNzYWdlLlxuICAgKi9cbiAgZmFpbChtZXNzYWdlPzogc3RyaW5nKTogbmV2ZXI7XG4gIC8qKlxuICAgKiBFeHBsaWNpdGx5IHBhc3MgdGhlIGN1cnJlbnQgdGVzdC4gVXNlZnVsIGZvciBlYXJseSBleGl0LlxuICAgKi9cbiAgc3VjY2VlZCgpOiBuZXZlcjtcbn1cblxuY29uc3QgdGVzdFVuaXRXb3JrZXIgPSBuZXcgQXN5bmNMb2NhbFN0b3JhZ2U8VGVzdFN0b3JlPigpO1xuXG5jbGFzcyBTa2lwVGVzdEVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcignVGVzdCBza2lwcGVkJyk7XG4gICAgdGhpcy5uYW1lID0gJ1NraXBUZXN0RXJyb3InO1xuICB9XG59XG5cbmNsYXNzIEZhaWxUZXN0RXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gIGNvbnN0cnVjdG9yKG1lc3NhZ2U/OiBzdHJpbmcpIHtcbiAgICBzdXBlcihtZXNzYWdlID8/ICdUZXN0IGZhaWxlZCcpO1xuICAgIHRoaXMubmFtZSA9ICdGYWlsVGVzdEVycm9yJztcbiAgfVxufVxuXG5jbGFzcyBTdWNjZWVkVGVzdEVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcignVGVzdCBwYXNzZWQnKTtcbiAgICB0aGlzLm5hbWUgPSAnU3VjY2VlZFRlc3RFcnJvcic7XG4gIH1cbn1cblxuY29uc3QgdGVzdENvbnRleHQ6IFRlc3RDb250ZXh0ID0ge1xuICBza2lwKCk6IG5ldmVyIHtcbiAgICB0aHJvdyBuZXcgU2tpcFRlc3RFcnJvcigpO1xuICB9LFxuICBmYWlsKG1lc3NhZ2U/OiBzdHJpbmcpOiBuZXZlciB7XG4gICAgdGhyb3cgbmV3IEZhaWxUZXN0RXJyb3IobWVzc2FnZSk7XG4gIH0sXG4gIHN1Y2NlZWQoKTogbmV2ZXIge1xuICAgIHRocm93IG5ldyBTdWNjZWVkVGVzdEVycm9yKCk7XG4gIH0sXG59O1xuXG5mdW5jdGlvbiBmb3JtYXRFcnJvcihlcnI6IHVua25vd24pOiBzdHJpbmcge1xuICBpZiAoZXJyIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICByZXR1cm4gZXJyLm1lc3NhZ2U7XG4gIH1cbiAgcmV0dXJuIFN0cmluZyhlcnIpO1xufVxuXG5hc3luYyBmdW5jdGlvbiBleGVjdXRlVGVzdChlbnRyeTogVGVzdEVudHJ5KTogUHJvbWlzZTxUZXN0UmVzdWx0PiB7XG4gIGNvbnN0IHN0YXJ0ID0gcGVyZm9ybWFuY2Uubm93KCk7XG5cbiAgdHJ5IHtcbiAgICBhd2FpdCBlbnRyeS5mbih0ZXN0Q29udGV4dCk7XG4gICAgcmV0dXJuIHtcbiAgICAgIHRlc3Q6IGVudHJ5Lm5hbWUsXG4gICAgICByZXN1bHQ6ICdwYXNzJyxcbiAgICAgIGVycm9yOiBudWxsLFxuICAgICAgZHVyYXRpb246IHBlcmZvcm1hbmNlLm5vdygpIC0gc3RhcnQsXG4gICAgfTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgaWYgKGVyciBpbnN0YW5jZW9mIFNraXBUZXN0RXJyb3IpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHRlc3Q6IGVudHJ5Lm5hbWUsXG4gICAgICAgIHJlc3VsdDogJ3NraXAnLFxuICAgICAgICBlcnJvcjogbnVsbCxcbiAgICAgICAgZHVyYXRpb246IHBlcmZvcm1hbmNlLm5vdygpIC0gc3RhcnQsXG4gICAgICB9O1xuICAgIH1cbiAgICBpZiAoZXJyIGluc3RhbmNlb2YgU3VjY2VlZFRlc3RFcnJvcikge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdGVzdDogZW50cnkubmFtZSxcbiAgICAgICAgcmVzdWx0OiAncGFzcycsXG4gICAgICAgIGVycm9yOiBudWxsLFxuICAgICAgICBkdXJhdGlvbjogcGVyZm9ybWFuY2Uubm93KCkgLSBzdGFydCxcbiAgICAgIH07XG4gICAgfVxuICAgIGlmIChlcnIgaW5zdGFuY2VvZiBGYWlsVGVzdEVycm9yKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0ZXN0OiBlbnRyeS5uYW1lLFxuICAgICAgICByZXN1bHQ6ICdmYWlsJyxcbiAgICAgICAgZXJyb3I6IGVyci5tZXNzYWdlLFxuICAgICAgICBkdXJhdGlvbjogcGVyZm9ybWFuY2Uubm93KCkgLSBzdGFydCxcbiAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICB0ZXN0OiBlbnRyeS5uYW1lLFxuICAgICAgcmVzdWx0OiAnZmFpbCcsXG4gICAgICBlcnJvcjogZm9ybWF0RXJyb3IoZXJyKSxcbiAgICAgIGR1cmF0aW9uOiBwZXJmb3JtYW5jZS5ub3coKSAtIHN0YXJ0LFxuICAgIH07XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJ1blRlc3QoZm46ICgpID0+IHZvaWQpOiBQcm9taXNlPFRlc3RSdW5SZXN1bHQ+IHtcbiAgY29uc3Qgc3RvcmU6IFRlc3RTdG9yZSA9IHtcbiAgICB0ZXN0czogW10sXG4gIH07XG5cbiAgdGVzdFVuaXRXb3JrZXIucnVuKHN0b3JlLCBmbik7XG5cbiAgY29uc3QgdGVzdFJlc3VsdHM6IFRlc3RSZXN1bHRbXSA9IFtdO1xuXG4gIGZvciAoY29uc3QgZW50cnkgb2Ygc3RvcmUudGVzdHMpIHtcbiAgICB0ZXN0UmVzdWx0cy5wdXNoKGF3YWl0IGV4ZWN1dGVUZXN0KGVudHJ5KSk7XG4gIH1cblxuICByZXR1cm4geyB0ZXN0UmVzdWx0cyB9O1xufVxuXG5leHBvcnQgdHlwZSBUZXN0RnVuY3Rpb24gPSAoY3R4OiBUZXN0Q29udGV4dCkgPT4gdm9pZCB8IFByb21pc2U8dm9pZD47XG5cbmZ1bmN0aW9uIHByb3h5RXhwZWN0U3R1YigpOiBSZXR1cm5UeXBlPHR5cGVvZiBzdGRFeHBlY3Q+IHtcbiAgY29uc3QgaGFuZGxlcjogUHJveHlIYW5kbGVyPG9iamVjdD4gPSB7XG4gICAgZ2V0KF90YXJnZXQsIF9wcm9wKSB7XG4gICAgICByZXR1cm4gbmV3IFByb3h5KCgpID0+IHt9LCBoYW5kbGVyKTtcbiAgICB9LFxuICAgIGFwcGx5KCkge1xuICAgICAgcmV0dXJuIG5ldyBQcm94eSgoKSA9PiB7fSwgaGFuZGxlcik7XG4gICAgfSxcbiAgfTtcblxuICByZXR1cm4gbmV3IFByb3h5KCgpID0+IHt9LCBoYW5kbGVyKSBhcyBSZXR1cm5UeXBlPHR5cGVvZiBzdGRFeHBlY3Q+O1xufVxuXG5leHBvcnQgY29uc3QgZXhwZWN0ID0gKCguLi5hcmdzOiBQYXJhbWV0ZXJzPHR5cGVvZiBzdGRFeHBlY3Q+KSA9PiB7XG4gIGlmICghdGVzdFVuaXRXb3JrZXIuZ2V0U3RvcmUoKSkgcmV0dXJuIHByb3h5RXhwZWN0U3R1YigpO1xuICByZXR1cm4gc3RkRXhwZWN0KC4uLmFyZ3MpO1xufSkgYXMgdHlwZW9mIHN0ZEV4cGVjdDtcblxuZXhwb3J0IGZ1bmN0aW9uIHRlc3QobmFtZTogc3RyaW5nLCBmbjogVGVzdEZ1bmN0aW9uKTogdm9pZCB7XG4gIGNvbnN0IHN0b3JlID0gdGVzdFVuaXRXb3JrZXIuZ2V0U3RvcmUoKTtcbiAgaWYgKCFzdG9yZSkgcmV0dXJuO1xuXG4gIHN0b3JlLnRlc3RzLnB1c2goeyBuYW1lLCBmbiB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRlc2NyaWJlKF9uYW1lOiBzdHJpbmcsIGZuOiAoKSA9PiB2b2lkKTogdm9pZCB7XG4gIGNvbnN0IHN0b3JlID0gdGVzdFVuaXRXb3JrZXIuZ2V0U3RvcmUoKTtcbiAgaWYgKCFzdG9yZSkgcmV0dXJuO1xuXG4gIGZuKCk7XG59XG4iLCAiLy8gQ29weXJpZ2h0IDIwMTgtMjAyNSB0aGUgRGVubyBhdXRob3JzLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuLyoqXG4gKiBFcnJvciB0aHJvd24gd2hlbiBhbiBhc3NlcnRpb24gZmFpbHMuXG4gKlxuICogQGV4YW1wbGUgVXNhZ2VcbiAqIGBgYHRzIGlnbm9yZVxuICogaW1wb3J0IHsgQXNzZXJ0aW9uRXJyb3IgfSBmcm9tIFwiQHN0ZC9hc3NlcnRcIjtcbiAqXG4gKiB0cnkge1xuICogICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IoXCJmb29cIiwgeyBjYXVzZTogXCJiYXJcIiB9KTtcbiAqIH0gY2F0Y2ggKGVycm9yKSB7XG4gKiAgIGlmIChlcnJvciBpbnN0YW5jZW9mIEFzc2VydGlvbkVycm9yKSB7XG4gKiAgICAgZXJyb3IubWVzc2FnZSA9PT0gXCJmb29cIjsgLy8gdHJ1ZVxuICogICAgIGVycm9yLmNhdXNlID09PSBcImJhclwiOyAvLyB0cnVlXG4gKiAgIH1cbiAqIH1cbiAqIGBgYFxuICovXG5leHBvcnQgY2xhc3MgQXNzZXJ0aW9uRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gIC8qKiBDb25zdHJ1Y3RzIGEgbmV3IGluc3RhbmNlLlxuICAgKlxuICAgKiBAcGFyYW0gbWVzc2FnZSBUaGUgZXJyb3IgbWVzc2FnZS5cbiAgICogQHBhcmFtIG9wdGlvbnMgQWRkaXRpb25hbCBvcHRpb25zLiBUaGlzIGFyZ3VtZW50IGlzIHN0aWxsIHVuc3RhYmxlLiBJdCBtYXkgY2hhbmdlIGluIHRoZSBmdXR1cmUgcmVsZWFzZS5cbiAgICovXG4gIGNvbnN0cnVjdG9yKG1lc3NhZ2U6IHN0cmluZywgb3B0aW9ucz86IEVycm9yT3B0aW9ucykge1xuICAgIHN1cGVyKG1lc3NhZ2UsIG9wdGlvbnMpO1xuICAgIHRoaXMubmFtZSA9IFwiQXNzZXJ0aW9uRXJyb3JcIjtcbiAgfVxufVxuIiwgIi8vIENvcHlyaWdodCAyMDE4LTIwMjUgdGhlIERlbm8gYXV0aG9ycy4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbi8qKlxuICogQ2hlY2sgdGhlIHRlc3Qgc3VpdGUgaW50ZXJuYWwgc3RhdGVcbiAqXG4gKiBAZXhhbXBsZSBVc2FnZVxuICogYGBgdHMgaWdub3JlXG4gKiBpbXBvcnQgeyBBc3NlcnRpb25TdGF0ZSB9IGZyb20gXCJAc3RkL2ludGVybmFsXCI7XG4gKlxuICogY29uc3QgYXNzZXJ0aW9uU3RhdGUgPSBuZXcgQXNzZXJ0aW9uU3RhdGUoKTtcbiAqIGBgYFxuICovXG5leHBvcnQgY2xhc3MgQXNzZXJ0aW9uU3RhdGUge1xuICAjc3RhdGU6IHtcbiAgICBhc3NlcnRpb25Db3VudDogbnVtYmVyIHwgdW5kZWZpbmVkO1xuICAgIGFzc2VydGlvbkNoZWNrOiBib29sZWFuO1xuICAgIGFzc2VydGlvblRyaWdnZXJlZDogYm9vbGVhbjtcbiAgICBhc3NlcnRpb25UcmlnZ2VyZWRDb3VudDogbnVtYmVyO1xuICB9O1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuI3N0YXRlID0ge1xuICAgICAgYXNzZXJ0aW9uQ291bnQ6IHVuZGVmaW5lZCxcbiAgICAgIGFzc2VydGlvbkNoZWNrOiBmYWxzZSxcbiAgICAgIGFzc2VydGlvblRyaWdnZXJlZDogZmFsc2UsXG4gICAgICBhc3NlcnRpb25UcmlnZ2VyZWRDb3VudDogMCxcbiAgICB9O1xuXG4gICAgaWYgKHR5cGVvZiBnbG9iYWxUaGlzPy5hZGRFdmVudExpc3RlbmVyID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgIGdsb2JhbFRoaXMuYWRkRXZlbnRMaXN0ZW5lcihcInVubG9hZFwiLCAoKSA9PiB7XG4gICAgICAgIHRoaXMuI2Vuc3VyZUNsZWFuZWRVcCgpO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIGlmIChcbiAgICAgIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gICAgICB0eXBlb2YgKGdsb2JhbFRoaXMgYXMgYW55KT8ucHJvY2Vzcz8ub24gPT09IFwiZnVuY3Rpb25cIlxuICAgICkge1xuICAgICAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgICAgIChnbG9iYWxUaGlzIGFzIGFueSkucHJvY2Vzcy5vbihcImV4aXRcIiwgKCkgPT4ge1xuICAgICAgICB0aGlzLiNlbnN1cmVDbGVhbmVkVXAoKTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWNvbnNvbGVcbiAgICAgIGNvbnNvbGUud2FybihcIkFzc2VydGlvbkNvdW50ZXIgY2xlYW51cCBzdGVwIHdhcyBub3QgcmVnaXN0ZXJlZFwiKTtcbiAgICB9XG4gIH1cblxuICAjZW5zdXJlQ2xlYW5lZFVwKCkge1xuICAgIC8vIElmIGFueSBjaGVja3Mgd2VyZSByZWdpc3RlcmVkLCBhZnRlciB0aGUgdGVzdCBzdWl0ZSBydW5zIHRoZSBjaGVja3MsXG4gICAgLy8gYHJlc2V0QXNzZXJ0aW9uU3RhdGVgIHNob3VsZCBhbHNvIGhhdmUgYmVlbiBjYWxsZWQuIElmIGl0IHdhcyBub3QsXG4gICAgLy8gdGhlbiB0aGUgdGVzdCBzdWl0ZSBkaWQgbm90IHJ1biB0aGUgY2hlY2tzLlxuICAgIGlmIChcbiAgICAgIHRoaXMuI3N0YXRlLmFzc2VydGlvbkNoZWNrIHx8XG4gICAgICB0aGlzLiNzdGF0ZS5hc3NlcnRpb25Db3VudCAhPT0gdW5kZWZpbmVkXG4gICAgKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIFwiQXNzZXJ0aW9uQ291bnRlciB3YXMgbm90IGNsZWFuZWQgdXA6IElmIHRlc3RzIGFyZSBub3Qgb3RoZXJ3aXNlIGZhaWxpbmcsIGVuc3VyZSBgZXhwZWN0Lmhhc0Fzc2VydGlvbmAgYW5kIGBleHBlY3QuYXNzZXJ0aW9uc2AgYXJlIG9ubHkgcnVuIGluIGJkZCB0ZXN0c1wiLFxuICAgICAgKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBudW1iZXIgdGhhdCB0aHJvdWdoIGBleHBlY3QuYXNzZXJ0aW9uc2AgYXBpIHNldC5cbiAgICpcbiAgICogQHJldHVybnMgdGhlIG51bWJlciB0aGF0IHRocm91Z2ggYGV4cGVjdC5hc3NlcnRpb25zYCBhcGkgc2V0LlxuICAgKlxuICAgKiBAZXhhbXBsZSBVc2FnZVxuICAgKiBgYGB0cyBpZ25vcmVcbiAgICogaW1wb3J0IHsgQXNzZXJ0aW9uU3RhdGUgfSBmcm9tIFwiQHN0ZC9pbnRlcm5hbFwiO1xuICAgKlxuICAgKiBjb25zdCBhc3NlcnRpb25TdGF0ZSA9IG5ldyBBc3NlcnRpb25TdGF0ZSgpO1xuICAgKiBhc3NlcnRpb25TdGF0ZS5hc3NlcnRpb25Db3VudDtcbiAgICogYGBgXG4gICAqL1xuICBnZXQgYXNzZXJ0aW9uQ291bnQoKTogbnVtYmVyIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy4jc3RhdGUuYXNzZXJ0aW9uQ291bnQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEgY2VydGFpbiBudW1iZXIgdGhhdCBhc3NlcnRpb25zIHdlcmUgY2FsbGVkIGJlZm9yZS5cbiAgICpcbiAgICogQHJldHVybnMgcmV0dXJuIGEgY2VydGFpbiBudW1iZXIgdGhhdCBhc3NlcnRpb25zIHdlcmUgY2FsbGVkIGJlZm9yZS5cbiAgICpcbiAgICogQGV4YW1wbGUgVXNhZ2VcbiAgICogYGBgdHMgaWdub3JlXG4gICAqIGltcG9ydCB7IEFzc2VydGlvblN0YXRlIH0gZnJvbSBcIkBzdGQvaW50ZXJuYWxcIjtcbiAgICpcbiAgICogY29uc3QgYXNzZXJ0aW9uU3RhdGUgPSBuZXcgQXNzZXJ0aW9uU3RhdGUoKTtcbiAgICogYXNzZXJ0aW9uU3RhdGUuYXNzZXJ0aW9uVHJpZ2dlcmVkQ291bnQ7XG4gICAqIGBgYFxuICAgKi9cbiAgZ2V0IGFzc2VydGlvblRyaWdnZXJlZENvdW50KCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuI3N0YXRlLmFzc2VydGlvblRyaWdnZXJlZENvdW50O1xuICB9XG5cbiAgLyoqXG4gICAqIElmIGBleHBlY3QuaGFzQXNzZXJ0aW9uc2AgY2FsbGVkLCB0aGVuIHRocm91Z2ggdGhpcyBtZXRob2QgdG8gdXBkYXRlICNzdGF0ZS5hc3NlcnRpb25DaGVjayB2YWx1ZS5cbiAgICpcbiAgICogQHBhcmFtIHZhbCBTZXQgI3N0YXRlLmFzc2VydGlvbkNoZWNrJ3MgdmFsdWVcbiAgICpcbiAgICogQGV4YW1wbGUgVXNhZ2VcbiAgICogYGBgdHMgaWdub3JlXG4gICAqIGltcG9ydCB7IEFzc2VydGlvblN0YXRlIH0gZnJvbSBcIkBzdGQvaW50ZXJuYWxcIjtcbiAgICpcbiAgICogY29uc3QgYXNzZXJ0aW9uU3RhdGUgPSBuZXcgQXNzZXJ0aW9uU3RhdGUoKTtcbiAgICogYXNzZXJ0aW9uU3RhdGUuc2V0QXNzZXJ0aW9uQ2hlY2sodHJ1ZSk7XG4gICAqIGBgYFxuICAgKi9cbiAgc2V0QXNzZXJ0aW9uQ2hlY2sodmFsOiBib29sZWFuKSB7XG4gICAgdGhpcy4jc3RhdGUuYXNzZXJ0aW9uQ2hlY2sgPSB2YWw7XG4gIH1cblxuICAvKipcbiAgICogSWYgYW55IG1hdGNoZXJzIHdhcyBjYWxsZWQsIGAjc3RhdGUuYXNzZXJ0aW9uVHJpZ2dlcmVkYCB3aWxsIGJlIHNldCB0aHJvdWdoIHRoaXMgbWV0aG9kLlxuICAgKlxuICAgKiBAcGFyYW0gdmFsIFNldCAjc3RhdGUuYXNzZXJ0aW9uVHJpZ2dlcmVkJ3MgdmFsdWVcbiAgICpcbiAgICogQGV4YW1wbGUgVXNhZ2VcbiAgICogYGBgdHMgaWdub3JlXG4gICAqIGltcG9ydCB7IEFzc2VydGlvblN0YXRlIH0gZnJvbSBcIkBzdGQvaW50ZXJuYWxcIjtcbiAgICpcbiAgICogY29uc3QgYXNzZXJ0aW9uU3RhdGUgPSBuZXcgQXNzZXJ0aW9uU3RhdGUoKTtcbiAgICogYXNzZXJ0aW9uU3RhdGUuc2V0QXNzZXJ0aW9uVHJpZ2dlcmVkKHRydWUpO1xuICAgKiBgYGBcbiAgICovXG4gIHNldEFzc2VydGlvblRyaWdnZXJlZCh2YWw6IGJvb2xlYW4pIHtcbiAgICB0aGlzLiNzdGF0ZS5hc3NlcnRpb25UcmlnZ2VyZWQgPSB2YWw7XG4gIH1cblxuICAvKipcbiAgICogSWYgYGV4cGVjdC5hc3NlcnRpb25zYCBjYWxsZWQsIHRoZW4gdGhyb3VnaCB0aGlzIG1ldGhvZCB0byB1cGRhdGUgI3N0YXRlLmFzc2VydGlvbkNoZWNrIHZhbHVlLlxuICAgKlxuICAgKiBAcGFyYW0gbnVtIFNldCAjc3RhdGUuYXNzZXJ0aW9uQ291bnQncyB2YWx1ZSwgZm9yIGV4YW1wbGUgaWYgdGhlIHZhbHVlIGlzIHNldCAyLCB0aGF0IG1lYW5zXG4gICAqIHlvdSBtdXN0IGhhdmUgdHdvIGFzc2VydGlvbiBtYXRjaGVycyBjYWxsIGluIHlvdXIgdGVzdCBzdWl0ZS5cbiAgICpcbiAgICogQGV4YW1wbGUgVXNhZ2VcbiAgICogYGBgdHMgaWdub3JlXG4gICAqIGltcG9ydCB7IEFzc2VydGlvblN0YXRlIH0gZnJvbSBcIkBzdGQvaW50ZXJuYWxcIjtcbiAgICpcbiAgICogY29uc3QgYXNzZXJ0aW9uU3RhdGUgPSBuZXcgQXNzZXJ0aW9uU3RhdGUoKTtcbiAgICogYXNzZXJ0aW9uU3RhdGUuc2V0QXNzZXJ0aW9uQ291bnQoMik7XG4gICAqIGBgYFxuICAgKi9cbiAgc2V0QXNzZXJ0aW9uQ291bnQobnVtOiBudW1iZXIpIHtcbiAgICB0aGlzLiNzdGF0ZS5hc3NlcnRpb25Db3VudCA9IG51bTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJZiBhbnkgbWF0Y2hlcnMgd2FzIGNhbGxlZCwgYCNzdGF0ZS5hc3NlcnRpb25UcmlnZ2VyZWRDb3VudGAgdmFsdWUgd2lsbCBwbHVzIG9uZSBpbnRlcm5hbGx5LlxuICAgKlxuICAgKiBAZXhhbXBsZSBVc2FnZVxuICAgKiBgYGB0cyBpZ25vcmVcbiAgICogaW1wb3J0IHsgQXNzZXJ0aW9uU3RhdGUgfSBmcm9tIFwiQHN0ZC9pbnRlcm5hbFwiO1xuICAgKlxuICAgKiBjb25zdCBhc3NlcnRpb25TdGF0ZSA9IG5ldyBBc3NlcnRpb25TdGF0ZSgpO1xuICAgKiBhc3NlcnRpb25TdGF0ZS51cGRhdGVBc3NlcnRpb25UcmlnZ2VyQ291bnQoKTtcbiAgICogYGBgXG4gICAqL1xuICB1cGRhdGVBc3NlcnRpb25UcmlnZ2VyQ291bnQoKSB7XG4gICAgaWYgKHRoaXMuI3N0YXRlLmFzc2VydGlvbkNvdW50ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMuI3N0YXRlLmFzc2VydGlvblRyaWdnZXJlZENvdW50ICs9IDE7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIEFzc2VydGlvbiBpbnRlcm5hbCBzdGF0ZSwgaWYgYCNzdGF0ZS5hc3NlcnRpb25DaGVja2AgaXMgc2V0IHRydWUsIGJ1dFxuICAgKiBgI3N0YXRlLmFzc2VydGlvblRyaWdnZXJlZGAgaXMgc3RpbGwgZmFsc2UsIHRoZW4gc2hvdWxkIHRocm93IGFuIEFzc2VydGlvbiBFcnJvci5cbiAgICpcbiAgICogQHJldHVybnMgYSBib29sZWFuIHZhbHVlLCB0aGF0IHRoZSB0ZXN0IHN1aXRlIGlzIHNhdGlzZmllZCB3aXRoIHRoZSBjaGVjay4gSWYgbm90LFxuICAgKiBpdCBzaG91bGQgdGhyb3cgYW4gQXNzZXJ0aW9uRXJyb3IuXG4gICAqXG4gICAqIEBleGFtcGxlIFVzYWdlXG4gICAqIGBgYHRzIGlnbm9yZVxuICAgKiBpbXBvcnQgeyBBc3NlcnRpb25TdGF0ZSB9IGZyb20gXCJAc3RkL2ludGVybmFsXCI7XG4gICAqXG4gICAqIGNvbnN0IGFzc2VydGlvblN0YXRlID0gbmV3IEFzc2VydGlvblN0YXRlKCk7XG4gICAqIGlmIChhc3NlcnRpb25TdGF0ZS5jaGVja0Fzc2VydGlvbkVycm9yU3RhdGUoKSkge1xuICAgKiAgIC8vIHRocm93IEFzc2VydGlvbkVycm9yKFwiXCIpO1xuICAgKiB9XG4gICAqIGBgYFxuICAgKi9cbiAgY2hlY2tBc3NlcnRpb25FcnJvclN0YXRlKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLiNzdGF0ZS5hc3NlcnRpb25DaGVjayAmJiAhdGhpcy4jc3RhdGUuYXNzZXJ0aW9uVHJpZ2dlcmVkO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlc2V0IGFsbCBhc3NlcnRpb24gc3RhdGUgd2hlbiBldmVyeSB0ZXN0IHN1aXRlIGZ1bmN0aW9uIHJhbiBjb21wbGV0ZWx5LlxuICAgKlxuICAgKiBAZXhhbXBsZSBVc2FnZVxuICAgKiBgYGB0cyBpZ25vcmVcbiAgICogaW1wb3J0IHsgQXNzZXJ0aW9uU3RhdGUgfSBmcm9tIFwiQHN0ZC9pbnRlcm5hbFwiO1xuICAgKlxuICAgKiBjb25zdCBhc3NlcnRpb25TdGF0ZSA9IG5ldyBBc3NlcnRpb25TdGF0ZSgpO1xuICAgKiBhc3NlcnRpb25TdGF0ZS5yZXNldEFzc2VydGlvblN0YXRlKCk7XG4gICAqIGBgYFxuICAgKi9cbiAgcmVzZXRBc3NlcnRpb25TdGF0ZSgpOiB2b2lkIHtcbiAgICB0aGlzLiNzdGF0ZSA9IHtcbiAgICAgIGFzc2VydGlvbkNvdW50OiB1bmRlZmluZWQsXG4gICAgICBhc3NlcnRpb25DaGVjazogZmFsc2UsXG4gICAgICBhc3NlcnRpb25UcmlnZ2VyZWQ6IGZhbHNlLFxuICAgICAgYXNzZXJ0aW9uVHJpZ2dlcmVkQ291bnQ6IDAsXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayBBc3NlcnRpb24gY2FsbGVkIHN0YXRlLCBpZiBgI3N0YXRlLmFzc2VydGlvbkNvdW50YCBpcyBzZXQgdG8gYSBudW1iZXIgdmFsdWUsIGJ1dFxuICAgKiBgI3N0YXRlLmFzc2VydGlvblRyaWdnZXJlZENvdW50YCBpcyBsZXNzIHRoZW4gaXQsIHRoZW4gc2hvdWxkIHRocm93IGFuIGFzc2VydGlvbiBlcnJvci5cbiAgICpcbiAgICogQHJldHVybnMgYSBib29sZWFuIHZhbHVlLCB0aGF0IHRoZSB0ZXN0IHN1aXRlIGlzIHNhdGlzZmllZCB3aXRoIHRoZSBjaGVjay4gSWYgbm90LFxuICAgKiBpdCBzaG91bGQgdGhyb3cgYW4gQXNzZXJ0aW9uRXJyb3IuXG4gICAqXG4gICAqIEBleGFtcGxlIFVzYWdlXG4gICAqIGBgYHRzIGlnbm9yZVxuICAgKiBpbXBvcnQgeyBBc3NlcnRpb25TdGF0ZSB9IGZyb20gXCJAc3RkL2ludGVybmFsXCI7XG4gICAqXG4gICAqIGNvbnN0IGFzc2VydGlvblN0YXRlID0gbmV3IEFzc2VydGlvblN0YXRlKCk7XG4gICAqIGlmIChhc3NlcnRpb25TdGF0ZS5jaGVja0Fzc2VydGlvbkNvdW50U2F0aXNmaWVkKCkpIHtcbiAgICogICAvLyB0aHJvdyBBc3NlcnRpb25FcnJvcihcIlwiKTtcbiAgICogfVxuICAgKiBgYGBcbiAgICovXG4gIGNoZWNrQXNzZXJ0aW9uQ291bnRTYXRpc2ZpZWQoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuI3N0YXRlLmFzc2VydGlvbkNvdW50ICE9PSB1bmRlZmluZWQgJiZcbiAgICAgIHRoaXMuI3N0YXRlLmFzc2VydGlvbkNvdW50ICE9PSB0aGlzLiNzdGF0ZS5hc3NlcnRpb25UcmlnZ2VyZWRDb3VudDtcbiAgfVxufVxuXG5jb25zdCBhc3NlcnRpb25TdGF0ZSA9IG5ldyBBc3NlcnRpb25TdGF0ZSgpO1xuXG4vKipcbiAqIHJldHVybiBhbiBpbnN0YW5jZSBvZiBBc3NlcnRpb25TdGF0ZVxuICpcbiAqIEByZXR1cm5zIEFzc2VydGlvblN0YXRlXG4gKlxuICogQGV4YW1wbGUgVXNhZ2VcbiAqIGBgYHRzIGlnbm9yZVxuICogaW1wb3J0IHsgZ2V0QXNzZXJ0aW9uU3RhdGUgfSBmcm9tIFwiQHN0ZC9pbnRlcm5hbFwiO1xuICpcbiAqIGNvbnN0IGFzc2VydGlvblN0YXRlID0gZ2V0QXNzZXJ0aW9uU3RhdGUoKTtcbiAqIGFzc2VydGlvblN0YXRlLnNldEFzc2VydGlvblRyaWdnZXJlZCh0cnVlKTtcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0QXNzZXJ0aW9uU3RhdGUoKTogQXNzZXJ0aW9uU3RhdGUge1xuICByZXR1cm4gYXNzZXJ0aW9uU3RhdGU7XG59XG4iLCAiLy8gQ29weXJpZ2h0IDIwMTgtMjAyNSB0aGUgRGVubyBhdXRob3JzLiBNSVQgbGljZW5zZS5cblxuaW1wb3J0IHsgZ2V0QXNzZXJ0aW9uU3RhdGUgfSBmcm9tIFwianNyOkBzdGQvaW50ZXJuYWxAXjEuMC4xMC9hc3NlcnRpb24tc3RhdGVcIjtcblxuY29uc3QgYXNzZXJ0aW9uU3RhdGUgPSBnZXRBc3NlcnRpb25TdGF0ZSgpO1xuXG5leHBvcnQgZnVuY3Rpb24gaGFzQXNzZXJ0aW9ucygpIHtcbiAgYXNzZXJ0aW9uU3RhdGUuc2V0QXNzZXJ0aW9uQ2hlY2sodHJ1ZSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRpb25zKG51bTogbnVtYmVyKSB7XG4gIGFzc2VydGlvblN0YXRlLnNldEFzc2VydGlvbkNvdW50KG51bSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlbWl0QXNzZXJ0aW9uVHJpZ2dlcigpIHtcbiAgYXNzZXJ0aW9uU3RhdGUuc2V0QXNzZXJ0aW9uVHJpZ2dlcmVkKHRydWUpO1xuICBhc3NlcnRpb25TdGF0ZS51cGRhdGVBc3NlcnRpb25UcmlnZ2VyQ291bnQoKTtcbn1cbiIsICIvLyBDb3B5cmlnaHQgMjAxOC0yMDI1IHRoZSBEZW5vIGF1dGhvcnMuIE1JVCBsaWNlbnNlLlxuXG5pbXBvcnQgdHlwZSB7IFRlc3RlciB9IGZyb20gXCIuL190eXBlcy50c1wiO1xuXG5jb25zdCBjdXN0b21FcXVhbGl0eVRlc3RlcnM6IFRlc3RlcltdID0gW107XG5cbmV4cG9ydCBmdW5jdGlvbiBhZGRDdXN0b21FcXVhbGl0eVRlc3RlcnMobmV3VGVzdGVyczogVGVzdGVyW10pIHtcbiAgaWYgKCFBcnJheS5pc0FycmF5KG5ld1Rlc3RlcnMpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgIGBjdXN0b21FcXVhbGl0eVRlc3RlciBleHBlY3RzIGFuIGFycmF5IG9mIFRlc3RlcnMuIEJ1dCBnb3QgJHt0eXBlb2YgbmV3VGVzdGVyc31gLFxuICAgICk7XG4gIH1cblxuICBjdXN0b21FcXVhbGl0eVRlc3RlcnMucHVzaCguLi5uZXdUZXN0ZXJzKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEN1c3RvbUVxdWFsaXR5VGVzdGVycygpIHtcbiAgcmV0dXJuIGN1c3RvbUVxdWFsaXR5VGVzdGVycztcbn1cbiIsICIvLyBDb3B5cmlnaHQgMjAxOC0yMDI1IHRoZSBEZW5vIGF1dGhvcnMuIE1JVCBsaWNlbnNlLlxuLy8gZGVuby1saW50LWlnbm9yZS1maWxlIG5vLWV4cGxpY2l0LWFueVxuXG5pbXBvcnQgeyBnZXRDdXN0b21FcXVhbGl0eVRlc3RlcnMgfSBmcm9tIFwiLi9fY3VzdG9tX2VxdWFsaXR5X3Rlc3Rlci50c1wiO1xuaW1wb3J0IHsgZXF1YWwgfSBmcm9tIFwiLi9fZXF1YWwudHNcIjtcblxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIEFzeW1tZXRyaWNNYXRjaGVyPFQ+IHtcbiAgY29uc3RydWN0b3IoXG4gICAgcHJvdGVjdGVkIHZhbHVlOiBULFxuICAgIHByb3RlY3RlZCBpbnZlcnNlOiBib29sZWFuID0gZmFsc2UsXG4gICkge31cbiAgYWJzdHJhY3QgZXF1YWxzKG90aGVyOiB1bmtub3duKTogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGNsYXNzIEFueXRoaW5nIGV4dGVuZHMgQXN5bW1ldHJpY01hdGNoZXI8dm9pZD4ge1xuICBlcXVhbHMob3RoZXI6IHVua25vd24pOiBib29sZWFuIHtcbiAgICByZXR1cm4gb3RoZXIgIT09IG51bGwgJiYgb3RoZXIgIT09IHVuZGVmaW5lZDtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gYW55dGhpbmcoKTogQW55dGhpbmcge1xuICByZXR1cm4gbmV3IEFueXRoaW5nKCk7XG59XG5cbmV4cG9ydCBjbGFzcyBBbnkgZXh0ZW5kcyBBc3ltbWV0cmljTWF0Y2hlcjxhbnk+IHtcbiAgY29uc3RydWN0b3IodmFsdWU6IHVua25vd24pIHtcbiAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGEgY29uc3RydWN0b3IgZnVuY3Rpb25cIik7XG4gICAgfVxuICAgIHN1cGVyKHZhbHVlKTtcbiAgfVxuXG4gIGVxdWFscyhvdGhlcjogdW5rbm93bik6IGJvb2xlYW4ge1xuICAgIGlmICh0eXBlb2Ygb3RoZXIgPT09IFwib2JqZWN0XCIpIHtcbiAgICAgIHJldHVybiBvdGhlciBpbnN0YW5jZW9mIHRoaXMudmFsdWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICh0aGlzLnZhbHVlID09PSBOdW1iZXIpIHtcbiAgICAgICAgcmV0dXJuIHR5cGVvZiBvdGhlciA9PT0gXCJudW1iZXJcIjtcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMudmFsdWUgPT09IFN0cmluZykge1xuICAgICAgICByZXR1cm4gdHlwZW9mIG90aGVyID09PSBcInN0cmluZ1wiO1xuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy52YWx1ZSA9PT0gTnVtYmVyKSB7XG4gICAgICAgIHJldHVybiB0eXBlb2Ygb3RoZXIgPT09IFwibnVtYmVyXCI7XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLnZhbHVlID09PSBGdW5jdGlvbikge1xuICAgICAgICByZXR1cm4gdHlwZW9mIG90aGVyID09PSBcImZ1bmN0aW9uXCI7XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLnZhbHVlID09PSBCb29sZWFuKSB7XG4gICAgICAgIHJldHVybiB0eXBlb2Ygb3RoZXIgPT09IFwiYm9vbGVhblwiO1xuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy52YWx1ZSA9PT0gQmlnSW50KSB7XG4gICAgICAgIHJldHVybiB0eXBlb2Ygb3RoZXIgPT09IFwiYmlnaW50XCI7XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLnZhbHVlID09PSBTeW1ib2wpIHtcbiAgICAgICAgcmV0dXJuIHR5cGVvZiBvdGhlciA9PT0gXCJzeW1ib2xcIjtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhbnkoYzogdW5rbm93bik6IEFueSB7XG4gIHJldHVybiBuZXcgQW55KGMpO1xufVxuXG5leHBvcnQgY2xhc3MgQXJyYXlDb250YWluaW5nIGV4dGVuZHMgQXN5bW1ldHJpY01hdGNoZXI8YW55W10+IHtcbiAgY29uc3RydWN0b3IoYXJyOiBhbnlbXSwgaW52ZXJzZSA9IGZhbHNlKSB7XG4gICAgc3VwZXIoYXJyLCBpbnZlcnNlKTtcbiAgfVxuXG4gIGVxdWFscyhvdGhlcjogYW55W10pOiBib29sZWFuIHtcbiAgICBjb25zdCByZXMgPSBBcnJheS5pc0FycmF5KG90aGVyKSAmJlxuICAgICAgdGhpcy52YWx1ZS5ldmVyeSgoZSkgPT5cbiAgICAgICAgb3RoZXIuc29tZSgoYW5vdGhlcikgPT5cbiAgICAgICAgICBlcXVhbChlLCBhbm90aGVyLCB7IGN1c3RvbVRlc3RlcnM6IGdldEN1c3RvbUVxdWFsaXR5VGVzdGVycygpIH0pXG4gICAgICAgIClcbiAgICAgICk7XG4gICAgcmV0dXJuIHRoaXMuaW52ZXJzZSA/ICFyZXMgOiByZXM7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFycmF5Q29udGFpbmluZyhjOiBhbnlbXSk6IEFycmF5Q29udGFpbmluZyB7XG4gIHJldHVybiBuZXcgQXJyYXlDb250YWluaW5nKGMpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYXJyYXlOb3RDb250YWluaW5nKGM6IGFueVtdKTogQXJyYXlDb250YWluaW5nIHtcbiAgcmV0dXJuIG5ldyBBcnJheUNvbnRhaW5pbmcoYywgdHJ1ZSk7XG59XG5cbmV4cG9ydCBjbGFzcyBDbG9zZVRvIGV4dGVuZHMgQXN5bW1ldHJpY01hdGNoZXI8bnVtYmVyPiB7XG4gIHJlYWRvbmx5ICNwcmVjaXNpb246IG51bWJlcjtcblxuICBjb25zdHJ1Y3RvcihudW06IG51bWJlciwgcHJlY2lzaW9uOiBudW1iZXIgPSAyKSB7XG4gICAgc3VwZXIobnVtKTtcbiAgICB0aGlzLiNwcmVjaXNpb24gPSBwcmVjaXNpb247XG4gIH1cblxuICBlcXVhbHMob3RoZXI6IG51bWJlcik6IGJvb2xlYW4ge1xuICAgIGlmICh0eXBlb2Ygb3RoZXIgIT09IFwibnVtYmVyXCIpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBpZiAoXG4gICAgICAodGhpcy52YWx1ZSA9PT0gTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZICYmXG4gICAgICAgIG90aGVyID09PSBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFkpIHx8XG4gICAgICAodGhpcy52YWx1ZSA9PT0gTnVtYmVyLk5FR0FUSVZFX0lORklOSVRZICYmXG4gICAgICAgIG90aGVyID09PSBOdW1iZXIuTkVHQVRJVkVfSU5GSU5JVFkpXG4gICAgKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICByZXR1cm4gTWF0aC5hYnModGhpcy52YWx1ZSAtIG90aGVyKSA8IE1hdGgucG93KDEwLCAtdGhpcy4jcHJlY2lzaW9uKSAvIDI7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNsb3NlVG8obnVtOiBudW1iZXIsIG51bURpZ2l0cz86IG51bWJlcik6IENsb3NlVG8ge1xuICByZXR1cm4gbmV3IENsb3NlVG8obnVtLCBudW1EaWdpdHMpO1xufVxuXG5leHBvcnQgY2xhc3MgU3RyaW5nQ29udGFpbmluZyBleHRlbmRzIEFzeW1tZXRyaWNNYXRjaGVyPHN0cmluZz4ge1xuICBjb25zdHJ1Y3RvcihzdHI6IHN0cmluZywgaW52ZXJzZSA9IGZhbHNlKSB7XG4gICAgc3VwZXIoc3RyLCBpbnZlcnNlKTtcbiAgfVxuXG4gIGVxdWFscyhvdGhlcjogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgY29uc3QgcmVzID0gdHlwZW9mIG90aGVyICE9PSBcInN0cmluZ1wiID8gZmFsc2UgOiBvdGhlci5pbmNsdWRlcyh0aGlzLnZhbHVlKTtcbiAgICByZXR1cm4gdGhpcy5pbnZlcnNlID8gIXJlcyA6IHJlcztcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gc3RyaW5nQ29udGFpbmluZyhzdHI6IHN0cmluZyk6IFN0cmluZ0NvbnRhaW5pbmcge1xuICByZXR1cm4gbmV3IFN0cmluZ0NvbnRhaW5pbmcoc3RyKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHN0cmluZ05vdENvbnRhaW5pbmcoc3RyOiBzdHJpbmcpOiBTdHJpbmdDb250YWluaW5nIHtcbiAgcmV0dXJuIG5ldyBTdHJpbmdDb250YWluaW5nKHN0ciwgdHJ1ZSk7XG59XG5cbmV4cG9ydCBjbGFzcyBTdHJpbmdNYXRjaGluZyBleHRlbmRzIEFzeW1tZXRyaWNNYXRjaGVyPFJlZ0V4cD4ge1xuICBjb25zdHJ1Y3RvcihwYXR0ZXJuOiBzdHJpbmcgfCBSZWdFeHAsIGludmVyc2UgPSBmYWxzZSkge1xuICAgIHN1cGVyKG5ldyBSZWdFeHAocGF0dGVybiksIGludmVyc2UpO1xuICB9XG5cbiAgZXF1YWxzKG90aGVyOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICBjb25zdCByZXMgPSB0eXBlb2Ygb3RoZXIgIT09IFwic3RyaW5nXCIgPyBmYWxzZSA6IHRoaXMudmFsdWUudGVzdChvdGhlcik7XG4gICAgcmV0dXJuIHRoaXMuaW52ZXJzZSA/ICFyZXMgOiByZXM7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHN0cmluZ01hdGNoaW5nKHBhdHRlcm46IHN0cmluZyB8IFJlZ0V4cCk6IFN0cmluZ01hdGNoaW5nIHtcbiAgcmV0dXJuIG5ldyBTdHJpbmdNYXRjaGluZyhwYXR0ZXJuKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHN0cmluZ05vdE1hdGNoaW5nKHBhdHRlcm46IHN0cmluZyB8IFJlZ0V4cCk6IFN0cmluZ01hdGNoaW5nIHtcbiAgcmV0dXJuIG5ldyBTdHJpbmdNYXRjaGluZyhwYXR0ZXJuLCB0cnVlKTtcbn1cblxuZXhwb3J0IGNsYXNzIE9iamVjdENvbnRhaW5pbmdcbiAgZXh0ZW5kcyBBc3ltbWV0cmljTWF0Y2hlcjxSZWNvcmQ8c3RyaW5nLCB1bmtub3duPj4ge1xuICBjb25zdHJ1Y3RvcihvYmo6IFJlY29yZDxzdHJpbmcsIHVua25vd24+LCBpbnZlcnNlID0gZmFsc2UpIHtcbiAgICBzdXBlcihvYmosIGludmVyc2UpO1xuICB9XG5cbiAgZXF1YWxzKG90aGVyOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPik6IGJvb2xlYW4ge1xuICAgIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyh0aGlzLnZhbHVlKTtcbiAgICBsZXQgcmVzID0gdHJ1ZTtcblxuICAgIGZvciAoY29uc3Qga2V5IG9mIGtleXMpIHtcbiAgICAgIGlmIChcbiAgICAgICAgIU9iamVjdC5oYXNPd24ob3RoZXIsIGtleSkgfHxcbiAgICAgICAgIWVxdWFsKHRoaXMudmFsdWVba2V5XSwgb3RoZXJba2V5XSlcbiAgICAgICkge1xuICAgICAgICByZXMgPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5pbnZlcnNlID8gIXJlcyA6IHJlcztcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gb2JqZWN0Q29udGFpbmluZyhcbiAgb2JqOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPixcbik6IE9iamVjdENvbnRhaW5pbmcge1xuICByZXR1cm4gbmV3IE9iamVjdENvbnRhaW5pbmcob2JqKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG9iamVjdE5vdENvbnRhaW5pbmcoXG4gIG9iajogUmVjb3JkPHN0cmluZywgdW5rbm93bj4sXG4pOiBPYmplY3RDb250YWluaW5nIHtcbiAgcmV0dXJuIG5ldyBPYmplY3RDb250YWluaW5nKG9iaiwgdHJ1ZSk7XG59XG4iLCAiLy8gQ29weXJpZ2h0IDIwMTgtMjAyNSB0aGUgRGVubyBhdXRob3JzLiBNSVQgbGljZW5zZS5cblxuLy8gVGhpcyBmaWxlIGlzIGNvcGllZCBmcm9tIGBzdGQvYXNzZXJ0YC5cblxuaW1wb3J0IHR5cGUgeyBFcXVhbE9wdGlvbnMgfSBmcm9tIFwiLi9fdHlwZXMudHNcIjtcbmltcG9ydCB7IEFzeW1tZXRyaWNNYXRjaGVyIH0gZnJvbSBcIi4vX2FzeW1tZXRyaWNfbWF0Y2hlcnMudHNcIjtcblxudHlwZSBLZXllZENvbGxlY3Rpb24gPSBTZXQ8dW5rbm93bj4gfCBNYXA8dW5rbm93biwgdW5rbm93bj47XG5mdW5jdGlvbiBpc0tleWVkQ29sbGVjdGlvbih4OiB1bmtub3duKTogeCBpcyBLZXllZENvbGxlY3Rpb24ge1xuICByZXR1cm4geCBpbnN0YW5jZW9mIFNldCB8fCB4IGluc3RhbmNlb2YgTWFwO1xufVxuXG5mdW5jdGlvbiBjb25zdHJ1Y3RvcnNFcXVhbChhOiBvYmplY3QsIGI6IG9iamVjdCkge1xuICByZXR1cm4gYS5jb25zdHJ1Y3RvciA9PT0gYi5jb25zdHJ1Y3RvciB8fFxuICAgIGEuY29uc3RydWN0b3IgPT09IE9iamVjdCAmJiAhYi5jb25zdHJ1Y3RvciB8fFxuICAgICFhLmNvbnN0cnVjdG9yICYmIGIuY29uc3RydWN0b3IgPT09IE9iamVjdDtcbn1cblxuZnVuY3Rpb24gYXN5bW1ldHJpY0VxdWFsKGE6IHVua25vd24sIGI6IHVua25vd24pIHtcbiAgY29uc3QgYXN5bW1ldHJpY0EgPSBhIGluc3RhbmNlb2YgQXN5bW1ldHJpY01hdGNoZXI7XG4gIGNvbnN0IGFzeW1tZXRyaWNCID0gYiBpbnN0YW5jZW9mIEFzeW1tZXRyaWNNYXRjaGVyO1xuXG4gIGlmIChhc3ltbWV0cmljQSAmJiBhc3ltbWV0cmljQikge1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICBpZiAoYXN5bW1ldHJpY0EpIHtcbiAgICByZXR1cm4gYS5lcXVhbHMoYik7XG4gIH1cblxuICBpZiAoYXN5bW1ldHJpY0IpIHtcbiAgICByZXR1cm4gYi5lcXVhbHMoYSk7XG4gIH1cbn1cblxuLyoqXG4gKiBEZWVwIGVxdWFsaXR5IGNvbXBhcmlzb24gdXNlZCBpbiBhc3NlcnRpb25zXG4gKiBAcGFyYW0gYyBhY3R1YWwgdmFsdWVcbiAqIEBwYXJhbSBkIGV4cGVjdGVkIHZhbHVlXG4gKiBAcGFyYW0gb3B0aW9ucyBmb3IgdGhlIGVxdWFsaXR5IGNoZWNrXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlcXVhbChjOiB1bmtub3duLCBkOiB1bmtub3duLCBvcHRpb25zPzogRXF1YWxPcHRpb25zKTogYm9vbGVhbiB7XG4gIGNvbnN0IHsgY3VzdG9tVGVzdGVycyA9IFtdLCBzdHJpY3RDaGVjayB9ID0gb3B0aW9ucyA/PyB7fTtcbiAgY29uc3Qgc2VlbiA9IG5ldyBNYXAoKTtcblxuICByZXR1cm4gKGZ1bmN0aW9uIGNvbXBhcmUoYTogdW5rbm93biwgYjogdW5rbm93bik6IGJvb2xlYW4ge1xuICAgIGNvbnN0IGFzeW1tZXRyaWMgPSBhc3ltbWV0cmljRXF1YWwoYSwgYik7XG4gICAgaWYgKGFzeW1tZXRyaWMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIGFzeW1tZXRyaWM7XG4gICAgfVxuXG4gICAgaWYgKGN1c3RvbVRlc3RlcnM/Lmxlbmd0aCkge1xuICAgICAgZm9yIChjb25zdCBjdXN0b21UZXN0ZXIgb2YgY3VzdG9tVGVzdGVycykge1xuICAgICAgICBjb25zdCB0ZXN0Q29udGV4dCA9IHtcbiAgICAgICAgICBlcXVhbCxcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgcGFzcyA9IGN1c3RvbVRlc3Rlci5jYWxsKHRlc3RDb250ZXh0LCBhLCBiLCBjdXN0b21UZXN0ZXJzKTtcbiAgICAgICAgaWYgKHBhc3MgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHJldHVybiBwYXNzO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gSGF2ZSB0byByZW5kZXIgUmVnRXhwICYgRGF0ZSBmb3Igc3RyaW5nIGNvbXBhcmlzb25cbiAgICAvLyB1bmxlc3MgaXQncyBtaXN0cmVhdGVkIGFzIG9iamVjdFxuICAgIGlmIChcbiAgICAgIGEgJiZcbiAgICAgIGIgJiZcbiAgICAgICgoYSBpbnN0YW5jZW9mIFJlZ0V4cCAmJiBiIGluc3RhbmNlb2YgUmVnRXhwKSB8fFxuICAgICAgICAoYSBpbnN0YW5jZW9mIFVSTCAmJiBiIGluc3RhbmNlb2YgVVJMKSlcbiAgICApIHtcbiAgICAgIHJldHVybiBTdHJpbmcoYSkgPT09IFN0cmluZyhiKTtcbiAgICB9XG5cbiAgICBpZiAoYSBpbnN0YW5jZW9mIERhdGUgJiYgYiBpbnN0YW5jZW9mIERhdGUpIHtcbiAgICAgIGNvbnN0IGFUaW1lID0gYS5nZXRUaW1lKCk7XG4gICAgICBjb25zdCBiVGltZSA9IGIuZ2V0VGltZSgpO1xuICAgICAgLy8gQ2hlY2sgZm9yIE5hTiBlcXVhbGl0eSBtYW51YWxseSBzaW5jZSBOYU4gaXMgbm90XG4gICAgICAvLyBlcXVhbCB0byBpdHNlbGYuXG4gICAgICBpZiAoTnVtYmVyLmlzTmFOKGFUaW1lKSAmJiBOdW1iZXIuaXNOYU4oYlRpbWUpKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGFUaW1lID09PSBiVGltZTtcbiAgICB9XG4gICAgaWYgKGEgaW5zdGFuY2VvZiBFcnJvciAmJiBiIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgIHJldHVybiBhLm1lc3NhZ2UgPT09IGIubWVzc2FnZTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBhID09PSBcIm51bWJlclwiICYmIHR5cGVvZiBiID09PSBcIm51bWJlclwiKSB7XG4gICAgICByZXR1cm4gTnVtYmVyLmlzTmFOKGEpICYmIE51bWJlci5pc05hTihiKSB8fCBhID09PSBiO1xuICAgIH1cbiAgICBpZiAoYSA9PT0gbnVsbCB8fCBiID09PSBudWxsKSB7XG4gICAgICByZXR1cm4gYSA9PT0gYjtcbiAgICB9XG4gICAgY29uc3QgY2xhc3NOYW1lID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGEpO1xuICAgIGlmIChjbGFzc05hbWUgIT09IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChiKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAoT2JqZWN0LmlzKGEsIGIpKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKGEgJiYgdHlwZW9mIGEgPT09IFwib2JqZWN0XCIgJiYgYiAmJiB0eXBlb2YgYiA9PT0gXCJvYmplY3RcIikge1xuICAgICAgaWYgKHN0cmljdENoZWNrICYmIGEgJiYgYiAmJiAhY29uc3RydWN0b3JzRXF1YWwoYSwgYikpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgaWYgKGEgaW5zdGFuY2VvZiBXZWFrTWFwIHx8IGIgaW5zdGFuY2VvZiBXZWFrTWFwKSB7XG4gICAgICAgIGlmICghKGEgaW5zdGFuY2VvZiBXZWFrTWFwICYmIGIgaW5zdGFuY2VvZiBXZWFrTWFwKSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNvbXBhcmUgV2Vha01hcCBpbnN0YW5jZXNcIik7XG4gICAgICB9XG4gICAgICBpZiAoYSBpbnN0YW5jZW9mIFdlYWtTZXQgfHwgYiBpbnN0YW5jZW9mIFdlYWtTZXQpIHtcbiAgICAgICAgaWYgKCEoYSBpbnN0YW5jZW9mIFdlYWtTZXQgJiYgYiBpbnN0YW5jZW9mIFdlYWtTZXQpKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY29tcGFyZSBXZWFrU2V0IGluc3RhbmNlc1wiKTtcbiAgICAgIH1cbiAgICAgIGlmIChzZWVuLmdldChhKSA9PT0gYikge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgYUtleXMgPSBPYmplY3Qua2V5cyhhID8/IHt9KTtcbiAgICAgIGNvbnN0IGJLZXlzID0gT2JqZWN0LmtleXMoYiA/PyB7fSk7XG4gICAgICBsZXQgYUxlbiA9IGFLZXlzLmxlbmd0aDtcbiAgICAgIGxldCBiTGVuID0gYktleXMubGVuZ3RoO1xuXG4gICAgICBpZiAoc3RyaWN0Q2hlY2sgJiYgYUxlbiAhPT0gYkxlbikge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGlmICghc3RyaWN0Q2hlY2spIHtcbiAgICAgICAgaWYgKGFMZW4gPiAwKSB7XG4gICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhS2V5cy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgY29uc3Qga2V5ID0gYUtleXNbaV0hO1xuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAoa2V5IGluIGEpICYmIChhW2tleSBhcyBrZXlvZiB0eXBlb2YgYV0gPT09IHVuZGVmaW5lZCkgJiZcbiAgICAgICAgICAgICAgIShrZXkgaW4gYilcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICBhTGVuIC09IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGJMZW4gPiAwKSB7XG4gICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBiS2V5cy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgY29uc3Qga2V5ID0gYktleXNbaV0hO1xuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAoa2V5IGluIGIpICYmIChiW2tleSBhcyBrZXlvZiB0eXBlb2YgYl0gPT09IHVuZGVmaW5lZCkgJiZcbiAgICAgICAgICAgICAgIShrZXkgaW4gYSlcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICBiTGVuIC09IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHNlZW4uc2V0KGEsIGIpO1xuICAgICAgaWYgKGlzS2V5ZWRDb2xsZWN0aW9uKGEpICYmIGlzS2V5ZWRDb2xsZWN0aW9uKGIpKSB7XG4gICAgICAgIGlmIChhLnNpemUgIT09IGIuc2l6ZSkge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGFLZXlzID0gWy4uLmEua2V5cygpXTtcbiAgICAgICAgY29uc3QgcHJpbWl0aXZlS2V5c0Zhc3RQYXRoID0gYUtleXMuZXZlcnkoKGspID0+IHtcbiAgICAgICAgICByZXR1cm4gdHlwZW9mIGsgPT09IFwic3RyaW5nXCIgfHxcbiAgICAgICAgICAgIHR5cGVvZiBrID09PSBcIm51bWJlclwiIHx8XG4gICAgICAgICAgICB0eXBlb2YgayA9PT0gXCJib29sZWFuXCIgfHxcbiAgICAgICAgICAgIHR5cGVvZiBrID09PSBcImJpZ2ludFwiIHx8XG4gICAgICAgICAgICB0eXBlb2YgayA9PT0gXCJzeW1ib2xcIiB8fFxuICAgICAgICAgICAgayA9PSBudWxsO1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKHByaW1pdGl2ZUtleXNGYXN0UGF0aCkge1xuICAgICAgICAgIGlmIChhIGluc3RhbmNlb2YgU2V0KSB7XG4gICAgICAgICAgICByZXR1cm4gYS5zeW1tZXRyaWNEaWZmZXJlbmNlKGIpLnNpemUgPT09IDA7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgZm9yIChjb25zdCBrZXkgb2YgYUtleXMpIHtcbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgIWIuaGFzKGtleSkgfHxcbiAgICAgICAgICAgICAgIWNvbXBhcmUoYS5nZXQoa2V5KSwgKGIgYXMgTWFwPHVua25vd24sIHVua25vd24+KS5nZXQoa2V5KSlcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHVubWF0Y2hlZEVudHJpZXMgPSBhLnNpemU7XG5cbiAgICAgICAgZm9yIChjb25zdCBbYUtleSwgYVZhbHVlXSBvZiBhLmVudHJpZXMoKSkge1xuICAgICAgICAgIGZvciAoY29uc3QgW2JLZXksIGJWYWx1ZV0gb2YgYi5lbnRyaWVzKCkpIHtcbiAgICAgICAgICAgIC8qIEdpdmVuIHRoYXQgTWFwIGtleXMgY2FuIGJlIHJlZmVyZW5jZXMsIHdlIG5lZWRcbiAgICAgICAgICAgICAqIHRvIGVuc3VyZSB0aGF0IHRoZXkgYXJlIGFsc28gZGVlcGx5IGVxdWFsICovXG5cbiAgICAgICAgICAgIGlmICghY29tcGFyZShhS2V5LCBiS2V5KSkgY29udGludWU7XG5cbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgKGFLZXkgPT09IGFWYWx1ZSAmJiBiS2V5ID09PSBiVmFsdWUpIHx8XG4gICAgICAgICAgICAgIChjb21wYXJlKGFWYWx1ZSwgYlZhbHVlKSlcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICB1bm1hdGNoZWRFbnRyaWVzLS07XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB1bm1hdGNoZWRFbnRyaWVzID09PSAwO1xuICAgICAgfVxuICAgICAgY29uc3QgbWVyZ2VkID0geyAuLi5hLCAuLi5iIH07XG4gICAgICBmb3IgKFxuICAgICAgICBjb25zdCBrZXkgb2YgW1xuICAgICAgICAgIC4uLk9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKG1lcmdlZCksXG4gICAgICAgICAgLi4uT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhtZXJnZWQpLFxuICAgICAgICBdXG4gICAgICApIHtcbiAgICAgICAgdHlwZSBLZXkgPSBrZXlvZiB0eXBlb2YgbWVyZ2VkO1xuICAgICAgICBpZiAoIWNvbXBhcmUoYSAmJiBhW2tleSBhcyBLZXldLCBiICYmIGJba2V5IGFzIEtleV0pKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChcbiAgICAgICAgICAoKGtleSBpbiBhKSAmJiAoYVtrZXkgYXMgS2V5XSAhPT0gdW5kZWZpbmVkKSAmJiAoIShrZXkgaW4gYikpKSB8fFxuICAgICAgICAgICgoa2V5IGluIGIpICYmIChiW2tleSBhcyBLZXldICE9PSB1bmRlZmluZWQpICYmICghKGtleSBpbiBhKSkpXG4gICAgICAgICkge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKGEgaW5zdGFuY2VvZiBXZWFrUmVmIHx8IGIgaW5zdGFuY2VvZiBXZWFrUmVmKSB7XG4gICAgICAgIGlmICghKGEgaW5zdGFuY2VvZiBXZWFrUmVmICYmIGIgaW5zdGFuY2VvZiBXZWFrUmVmKSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICByZXR1cm4gY29tcGFyZShhLmRlcmVmKCksIGIuZGVyZWYoKSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9KShjLCBkKTtcbn1cbiIsICIvLyBDb3B5cmlnaHQgMjAxOC0yMDI1IHRoZSBEZW5vIGF1dGhvcnMuIE1JVCBsaWNlbnNlLlxuXG5pbXBvcnQgdHlwZSB7IE1hdGNoZXJzIH0gZnJvbSBcIi4vX3R5cGVzLnRzXCI7XG5cbmxldCBleHRlbmRNYXRjaGVycyA9IHt9O1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0RXh0ZW5kTWF0Y2hlcnMoKSB7XG4gIHJldHVybiBleHRlbmRNYXRjaGVycztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldEV4dGVuZE1hdGNoZXJzKG5ld0V4dGVuZE1hdGNoZXJzOiBNYXRjaGVycykge1xuICBleHRlbmRNYXRjaGVycyA9IHtcbiAgICAuLi5leHRlbmRNYXRjaGVycyxcbiAgICAuLi5uZXdFeHRlbmRNYXRjaGVycyxcbiAgfTtcbn1cbiIsICIvLyBDb3B5cmlnaHQgMjAxOC0yMDI1IHRoZSBEZW5vIGF1dGhvcnMuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG4vKiogQW4gaW5zcGVjdCBmdW5jdGlvbiBjb25mb3JtaW5nIHRvIHRoZSBzaGFwZSBvZiBgRGVuby5pbnNwZWN0YCBhbmQgYG5vZGU6dXRpbGAncyBgaW5zcGVjdGAgKi9cbmV4cG9ydCB0eXBlIEluc3BlY3RGbiA9IChcbiAgdjogdW5rbm93bixcbiAgb3B0aW9uczoge1xuICAgIGRlcHRoOiBudW1iZXI7XG4gICAgc29ydGVkOiBib29sZWFuO1xuICAgIHRyYWlsaW5nQ29tbWE6IGJvb2xlYW47XG4gICAgY29tcGFjdDogYm9vbGVhbjtcbiAgICBpdGVyYWJsZUxpbWl0OiBudW1iZXI7XG4gICAgZ2V0dGVyczogYm9vbGVhbjtcbiAgICBzdHJBYmJyZXZpYXRlU2l6ZTogbnVtYmVyO1xuICB9LFxuKSA9PiBzdHJpbmc7XG5cbi8qKlxuICogQ29udmVydHMgdGhlIGlucHV0IGludG8gYSBzdHJpbmcuIE9iamVjdHMsIFNldHMgYW5kIE1hcHMgYXJlIHNvcnRlZCBzbyBhcyB0b1xuICogbWFrZSB0ZXN0cyBsZXNzIGZsYWt5LlxuICpcbiAqIEBwYXJhbSB2IFZhbHVlIHRvIGJlIGZvcm1hdHRlZFxuICpcbiAqIEByZXR1cm5zIFRoZSBmb3JtYXR0ZWQgc3RyaW5nXG4gKlxuICogQGV4YW1wbGUgVXNhZ2VcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBmb3JtYXQgfSBmcm9tIFwiQHN0ZC9pbnRlcm5hbC9mb3JtYXRcIjtcbiAqIGltcG9ydCB7IGFzc2VydEVxdWFscyB9IGZyb20gXCJAc3RkL2Fzc2VydFwiO1xuICpcbiAqIGFzc2VydEVxdWFscyhmb3JtYXQoeyBhOiAxLCBiOiAyIH0pLCBcIntcXG4gIGE6IDEsXFxuICBiOiAyLFxcbn1cIik7XG4gKiBhc3NlcnRFcXVhbHMoZm9ybWF0KG5ldyBTZXQoWzEsIDJdKSksIFwiU2V0KDIpIHtcXG4gIDEsXFxuICAyLFxcbn1cIik7XG4gKiBhc3NlcnRFcXVhbHMoZm9ybWF0KG5ldyBNYXAoW1sxLCAyXV0pKSwgXCJNYXAoMSkge1xcbiAgMSA9PiAyLFxcbn1cIik7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdCh2OiB1bmtub3duKTogc3RyaW5nIHtcbiAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgY29uc3QgeyBEZW5vLCBwcm9jZXNzIH0gPSBnbG9iYWxUaGlzIGFzIGFueTtcblxuICBjb25zdCBpbnNwZWN0OiBJbnNwZWN0Rm4gfCB1bmRlZmluZWQgPSBEZW5vPy5pbnNwZWN0ID8/XG4gICAgcHJvY2Vzcz8uZ2V0QnVpbHRpbk1vZHVsZT8uKFwibm9kZTp1dGlsXCIpPy5pbnNwZWN0O1xuXG4gIHJldHVybiB0eXBlb2YgaW5zcGVjdCA9PT0gXCJmdW5jdGlvblwiXG4gICAgPyBpbnNwZWN0KHYsIHtcbiAgICAgIGRlcHRoOiBJbmZpbml0eSxcbiAgICAgIHNvcnRlZDogdHJ1ZSxcbiAgICAgIHRyYWlsaW5nQ29tbWE6IHRydWUsXG4gICAgICBjb21wYWN0OiBmYWxzZSxcbiAgICAgIGl0ZXJhYmxlTGltaXQ6IEluZmluaXR5LFxuICAgICAgLy8gZ2V0dGVycyBzaG91bGQgYmUgdHJ1ZSBpbiBhc3NlcnRFcXVhbHMuXG4gICAgICBnZXR0ZXJzOiB0cnVlLFxuICAgICAgc3RyQWJicmV2aWF0ZVNpemU6IEluZmluaXR5LFxuICAgIH0pXG4gICAgOiBiYXNpY0luc3BlY3Qodik7XG59XG5cbmNvbnN0IGZvcm1hdHRlcnM6ICgodjogdW5rbm93bikgPT4gc3RyaW5nIHwgdW5kZWZpbmVkKVtdID0gW1xuICAodikgPT4ge1xuICAgIGlmICh0eXBlb2YgdiA9PT0gXCJ1bmRlZmluZWRcIikgcmV0dXJuIFwidW5kZWZpbmVkXCI7XG4gICAgaWYgKHR5cGVvZiB2ID09PSBcImJpZ2ludFwiKSByZXR1cm4gYCR7dn1uYDtcblxuICAgIGlmIChcbiAgICAgIHR5cGVvZiB2ID09PSBcInN0cmluZ1wiIHx8XG4gICAgICB0eXBlb2YgdiA9PT0gXCJudW1iZXJcIiB8fFxuICAgICAgdHlwZW9mIHYgPT09IFwiYm9vbGVhblwiIHx8XG4gICAgICB2ID09PSBudWxsIHx8XG4gICAgICBBcnJheS5pc0FycmF5KHYpIHx8XG4gICAgICBbbnVsbCwgT2JqZWN0LnByb3RvdHlwZV0uaW5jbHVkZXMoT2JqZWN0LmdldFByb3RvdHlwZU9mKHYpKVxuICAgICkge1xuICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHYsIG51bGwsIDIpO1xuICAgIH1cbiAgfSxcbiAgKHYpID0+IFN0cmluZyh2KSxcbiAgKHYpID0+IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2KSxcbl07XG5cbi8vIGZvciBlbnZpcm9ubWVudHMgbGFja2luZyBib3RoIGBEZW5vLmluc3BlY3RgIGFuZCBgcHJvY2Vzcy5pbnNwZWN0YFxuZnVuY3Rpb24gYmFzaWNJbnNwZWN0KHY6IHVua25vd24pOiBzdHJpbmcge1xuICBmb3IgKGNvbnN0IGZtdCBvZiBmb3JtYXR0ZXJzKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGZtdCh2KTtcbiAgICAgIGlmICh0eXBlb2YgcmVzdWx0ID09PSBcInN0cmluZ1wiKSByZXR1cm4gcmVzdWx0O1xuICAgIH0gY2F0Y2ggeyAvKiB0cnkgdGhlIG5leHQgb25lICovIH1cbiAgfVxuXG4gIHJldHVybiBcIltbVW5hYmxlIHRvIGZvcm1hdCB2YWx1ZV1dXCI7XG59XG4iLCAiLy8gQ29weXJpZ2h0IDIwMTgtMjAyNSB0aGUgRGVubyBhdXRob3JzLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cbmltcG9ydCB7IEFzc2VydGlvbkVycm9yIH0gZnJvbSBcIi4vYXNzZXJ0aW9uX2Vycm9yLnRzXCI7XG5pbXBvcnQgeyBmb3JtYXQgfSBmcm9tIFwianNyOkBzdGQvaW50ZXJuYWxAXjEuMC4xMi9mb3JtYXRcIjtcblxuLyoqXG4gKiBNYWtlIGFuIGFzc2VydGlvbiB0aGF0IGBhY3R1YWxgIGFuZCBgZXhwZWN0ZWRgIGFyZSBub3Qgc3RyaWN0bHkgZXF1YWwsIHVzaW5nXG4gKiB7QGxpbmtjb2RlIE9iamVjdC5pc30gZm9yIGVxdWFsaXR5IGNvbXBhcmlzb24uIElmIHRoZSB2YWx1ZXMgYXJlIHN0cmljdGx5XG4gKiBlcXVhbCB0aGVuIHRocm93LlxuICpcbiAqIEBleGFtcGxlIFVzYWdlXG4gKiBgYGB0cyBpZ25vcmVcbiAqIGltcG9ydCB7IGFzc2VydE5vdFN0cmljdEVxdWFscyB9IGZyb20gXCJAc3RkL2Fzc2VydFwiO1xuICpcbiAqIGFzc2VydE5vdFN0cmljdEVxdWFscygxLCAxKTsgLy8gVGhyb3dzXG4gKiBhc3NlcnROb3RTdHJpY3RFcXVhbHMoMSwgMik7IC8vIERvZXNuJ3QgdGhyb3dcbiAqXG4gKiBhc3NlcnROb3RTdHJpY3RFcXVhbHMoMCwgMCk7IC8vIFRocm93c1xuICogYXNzZXJ0Tm90U3RyaWN0RXF1YWxzKDAsIC0wKTsgLy8gRG9lc24ndCB0aHJvd1xuICogYGBgXG4gKlxuICogQHR5cGVQYXJhbSBUIFRoZSB0eXBlIG9mIHRoZSB2YWx1ZXMgdG8gY29tcGFyZS5cbiAqIEBwYXJhbSBhY3R1YWwgVGhlIGFjdHVhbCB2YWx1ZSB0byBjb21wYXJlLlxuICogQHBhcmFtIGV4cGVjdGVkIFRoZSBleHBlY3RlZCB2YWx1ZSB0byBjb21wYXJlLlxuICogQHBhcmFtIG1zZyBUaGUgb3B0aW9uYWwgbWVzc2FnZSB0byBkaXNwbGF5IGlmIHRoZSBhc3NlcnRpb24gZmFpbHMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnROb3RTdHJpY3RFcXVhbHM8VD4oXG4gIGFjdHVhbDogVCxcbiAgZXhwZWN0ZWQ6IFQsXG4gIG1zZz86IHN0cmluZyxcbikge1xuICBpZiAoIU9iamVjdC5pcyhhY3R1YWwsIGV4cGVjdGVkKSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IG1zZ1N1ZmZpeCA9IG1zZyA/IGA6ICR7bXNnfWAgOiBcIi5cIjtcbiAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKFxuICAgIGBFeHBlY3RlZCBcImFjdHVhbFwiIHRvIG5vdCBiZSBzdHJpY3RseSBlcXVhbCB0bzogJHtcbiAgICAgIGZvcm1hdChhY3R1YWwpXG4gICAgfSR7bXNnU3VmZml4fVxcbmAsXG4gICk7XG59XG4iLCAiLy8gQ29weXJpZ2h0IDIwMTgtMjAyNSB0aGUgRGVubyBhdXRob3JzLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cbi8vIEEgbW9kdWxlIHRvIHByaW50IEFOU0kgdGVybWluYWwgY29sb3JzLiBJbnNwaXJlZCBieSBjaGFsaywga2xldXIsIGFuZCBjb2xvcnNcbi8vIG9uIG5wbS5cblxuLy8gVGhpcyBjb2RlIGlzIHZlbmRvcmVkIGZyb20gYGZtdC9jb2xvcnMudHNgLlxuXG4vLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuY29uc3QgeyBEZW5vIH0gPSBnbG9iYWxUaGlzIGFzIGFueTtcbmNvbnN0IG5vQ29sb3IgPSB0eXBlb2YgRGVubz8ubm9Db2xvciA9PT0gXCJib29sZWFuXCJcbiAgPyBEZW5vLm5vQ29sb3IgYXMgYm9vbGVhblxuICA6IGZhbHNlO1xuXG5pbnRlcmZhY2UgQ29kZSB7XG4gIG9wZW46IHN0cmluZztcbiAgY2xvc2U6IHN0cmluZztcbiAgcmVnZXhwOiBSZWdFeHA7XG59XG5cbmNvbnN0IGVuYWJsZWQgPSAhbm9Db2xvcjtcblxuZnVuY3Rpb24gY29kZShvcGVuOiBudW1iZXJbXSwgY2xvc2U6IG51bWJlcik6IENvZGUge1xuICByZXR1cm4ge1xuICAgIG9wZW46IGBcXHgxYlske29wZW4uam9pbihcIjtcIil9bWAsXG4gICAgY2xvc2U6IGBcXHgxYlske2Nsb3NlfW1gLFxuICAgIHJlZ2V4cDogbmV3IFJlZ0V4cChgXFxcXHgxYlxcXFxbJHtjbG9zZX1tYCwgXCJnXCIpLFxuICB9O1xufVxuXG5mdW5jdGlvbiBydW4oc3RyOiBzdHJpbmcsIGNvZGU6IENvZGUpOiBzdHJpbmcge1xuICByZXR1cm4gZW5hYmxlZFxuICAgID8gYCR7Y29kZS5vcGVufSR7c3RyLnJlcGxhY2UoY29kZS5yZWdleHAsIGNvZGUub3Blbil9JHtjb2RlLmNsb3NlfWBcbiAgICA6IHN0cjtcbn1cblxuLyoqXG4gKiBTZXRzIHRoZSBzdHlsZSBvZiB0ZXh0IHRvIGJlIHByaW50ZWQgdG8gYm9sZC5cbiAqXG4gKiBEaXNhYmxlIGJ5IHNldHRpbmcgdGhlIGBOT19DT0xPUmAgZW52aXJvbm1lbnRhbCB2YXJpYWJsZS5cbiAqXG4gKiBAcGFyYW0gc3RyIFRleHQgdG8gbWFrZSBib2xkXG4gKlxuICogQHJldHVybnMgQm9sZCB0ZXh0IGZvciBwcmludGluZ1xuICpcbiAqIEBleGFtcGxlIFVzYWdlXG4gKiBgYGB0cyBuby1hc3NlcnRcbiAqIGltcG9ydCB7IGJvbGQgfSBmcm9tIFwiQHN0ZC9pbnRlcm5hbC9zdHlsZXNcIjtcbiAqXG4gKiBjb25zb2xlLmxvZyhib2xkKFwiSGVsbG8sIHdvcmxkIVwiKSk7IC8vIFByaW50cyBcIkhlbGxvLCB3b3JsZCFcIiBpbiBib2xkXG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJvbGQoc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbMV0sIDIyKSk7XG59XG5cbi8qKlxuICogU2V0cyB0aGUgY29sb3Igb2YgdGV4dCB0byBiZSBwcmludGVkIHRvIHJlZC5cbiAqXG4gKiBEaXNhYmxlIGJ5IHNldHRpbmcgdGhlIGBOT19DT0xPUmAgZW52aXJvbm1lbnRhbCB2YXJpYWJsZS5cbiAqXG4gKiBAcGFyYW0gc3RyIFRleHQgdG8gbWFrZSByZWRcbiAqXG4gKiBAcmV0dXJucyBSZWQgdGV4dCBmb3IgcHJpbnRpbmdcbiAqXG4gKiBAZXhhbXBsZSBVc2FnZVxuICogYGBgdHMgbm8tYXNzZXJ0XG4gKiBpbXBvcnQgeyByZWQgfSBmcm9tIFwiQHN0ZC9pbnRlcm5hbC9zdHlsZXNcIjtcbiAqXG4gKiBjb25zb2xlLmxvZyhyZWQoXCJIZWxsbywgd29ybGQhXCIpKTsgLy8gUHJpbnRzIFwiSGVsbG8sIHdvcmxkIVwiIGluIHJlZFxuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWQoc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbMzFdLCAzOSkpO1xufVxuXG4vKipcbiAqIFNldHMgdGhlIGNvbG9yIG9mIHRleHQgdG8gYmUgcHJpbnRlZCB0byBncmVlbi5cbiAqXG4gKiBEaXNhYmxlIGJ5IHNldHRpbmcgdGhlIGBOT19DT0xPUmAgZW52aXJvbm1lbnRhbCB2YXJpYWJsZS5cbiAqXG4gKiBAcGFyYW0gc3RyIFRleHQgdG8gbWFrZSBncmVlblxuICpcbiAqIEByZXR1cm5zIEdyZWVuIHRleHQgZm9yIHByaW50XG4gKlxuICogQGV4YW1wbGUgVXNhZ2VcbiAqIGBgYHRzIG5vLWFzc2VydFxuICogaW1wb3J0IHsgZ3JlZW4gfSBmcm9tIFwiQHN0ZC9pbnRlcm5hbC9zdHlsZXNcIjtcbiAqXG4gKiBjb25zb2xlLmxvZyhncmVlbihcIkhlbGxvLCB3b3JsZCFcIikpOyAvLyBQcmludHMgXCJIZWxsbywgd29ybGQhXCIgaW4gZ3JlZW5cbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gZ3JlZW4oc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbMzJdLCAzOSkpO1xufVxuXG4vKipcbiAqIFNldHMgdGhlIGNvbG9yIG9mIHRleHQgdG8gYmUgcHJpbnRlZCB0byB5ZWxsb3cuXG4gKlxuICogRGlzYWJsZSBieSBzZXR0aW5nIHRoZSBgTk9fQ09MT1JgIGVudmlyb25tZW50YWwgdmFyaWFibGUuXG4gKlxuICogQHBhcmFtIHN0ciBUZXh0IHRvIG1ha2UgeWVsbG93XG4gKlxuICogQHJldHVybnMgWWVsbG93IHRleHQgZm9yIHByaW50XG4gKlxuICogQGV4YW1wbGUgVXNhZ2VcbiAqIGBgYHRzIG5vLWFzc2VydFxuICogaW1wb3J0IHsgeWVsbG93IH0gZnJvbSBcIkBzdGQvaW50ZXJuYWwvc3R5bGVzXCI7XG4gKlxuICogY29uc29sZS5sb2coeWVsbG93KFwiSGVsbG8sIHdvcmxkIVwiKSk7IC8vIFByaW50cyBcIkhlbGxvLCB3b3JsZCFcIiBpbiB5ZWxsb3dcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24geWVsbG93KHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzMzXSwgMzkpKTtcbn1cblxuLyoqXG4gKiBTZXRzIHRoZSBjb2xvciBvZiB0ZXh0IHRvIGJlIHByaW50ZWQgdG8gd2hpdGUuXG4gKlxuICogQHBhcmFtIHN0ciBUZXh0IHRvIG1ha2Ugd2hpdGVcbiAqXG4gKiBAcmV0dXJucyBXaGl0ZSB0ZXh0IGZvciBwcmludFxuICpcbiAqIEBleGFtcGxlIFVzYWdlXG4gKiBgYGB0cyBuby1hc3NlcnRcbiAqIGltcG9ydCB7IHdoaXRlIH0gZnJvbSBcIkBzdGQvaW50ZXJuYWwvc3R5bGVzXCI7XG4gKlxuICogY29uc29sZS5sb2cod2hpdGUoXCJIZWxsbywgd29ybGQhXCIpKTsgLy8gUHJpbnRzIFwiSGVsbG8sIHdvcmxkIVwiIGluIHdoaXRlXG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHdoaXRlKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzM3XSwgMzkpKTtcbn1cblxuLyoqXG4gKiBTZXRzIHRoZSBjb2xvciBvZiB0ZXh0IHRvIGJlIHByaW50ZWQgdG8gZ3JheS5cbiAqXG4gKiBAcGFyYW0gc3RyIFRleHQgdG8gbWFrZSBncmF5XG4gKlxuICogQHJldHVybnMgR3JheSB0ZXh0IGZvciBwcmludFxuICpcbiAqIEBleGFtcGxlIFVzYWdlXG4gKiBgYGB0cyBuby1hc3NlcnRcbiAqIGltcG9ydCB7IGdyYXkgfSBmcm9tIFwiQHN0ZC9pbnRlcm5hbC9zdHlsZXNcIjtcbiAqXG4gKiBjb25zb2xlLmxvZyhncmF5KFwiSGVsbG8sIHdvcmxkIVwiKSk7IC8vIFByaW50cyBcIkhlbGxvLCB3b3JsZCFcIiBpbiBncmF5XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdyYXkoc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gYnJpZ2h0QmxhY2soc3RyKTtcbn1cblxuLyoqXG4gKiBTZXRzIHRoZSBjb2xvciBvZiB0ZXh0IHRvIGJlIHByaW50ZWQgdG8gYnJpZ2h0LWJsYWNrLlxuICpcbiAqIEBwYXJhbSBzdHIgVGV4dCB0byBtYWtlIGJyaWdodC1ibGFja1xuICpcbiAqIEByZXR1cm5zIEJyaWdodC1ibGFjayB0ZXh0IGZvciBwcmludFxuICpcbiAqIEBleGFtcGxlIFVzYWdlXG4gKiBgYGB0cyBuby1hc3NlcnRcbiAqIGltcG9ydCB7IGJyaWdodEJsYWNrIH0gZnJvbSBcIkBzdGQvaW50ZXJuYWwvc3R5bGVzXCI7XG4gKlxuICogY29uc29sZS5sb2coYnJpZ2h0QmxhY2soXCJIZWxsbywgd29ybGQhXCIpKTsgLy8gUHJpbnRzIFwiSGVsbG8sIHdvcmxkIVwiIGluIGJyaWdodC1ibGFja1xuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBicmlnaHRCbGFjayhzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBydW4oc3RyLCBjb2RlKFs5MF0sIDM5KSk7XG59XG5cbi8qKlxuICogU2V0cyB0aGUgYmFja2dyb3VuZCBjb2xvciBvZiB0ZXh0IHRvIGJlIHByaW50ZWQgdG8gcmVkLlxuICpcbiAqIEBwYXJhbSBzdHIgVGV4dCB0byBtYWtlIGl0cyBiYWNrZ3JvdW5kIHJlZFxuICpcbiAqIEByZXR1cm5zIFJlZCBiYWNrZ3JvdW5kIHRleHQgZm9yIHByaW50XG4gKlxuICogQGV4YW1wbGUgVXNhZ2VcbiAqIGBgYHRzIG5vLWFzc2VydFxuICogaW1wb3J0IHsgYmdSZWQgfSBmcm9tIFwiQHN0ZC9pbnRlcm5hbC9zdHlsZXNcIjtcbiAqXG4gKiBjb25zb2xlLmxvZyhiZ1JlZChcIkhlbGxvLCB3b3JsZCFcIikpOyAvLyBQcmludHMgXCJIZWxsbywgd29ybGQhXCIgd2l0aCByZWQgYmFja2dyb3VuZFxuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiZ1JlZChzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBydW4oc3RyLCBjb2RlKFs0MV0sIDQ5KSk7XG59XG5cbi8qKlxuICogU2V0cyB0aGUgYmFja2dyb3VuZCBjb2xvciBvZiB0ZXh0IHRvIGJlIHByaW50ZWQgdG8gZ3JlZW4uXG4gKlxuICogQHBhcmFtIHN0ciBUZXh0IHRvIG1ha2UgaXRzIGJhY2tncm91bmQgZ3JlZW5cbiAqXG4gKiBAcmV0dXJucyBHcmVlbiBiYWNrZ3JvdW5kIHRleHQgZm9yIHByaW50XG4gKlxuICogQGV4YW1wbGUgVXNhZ2VcbiAqIGBgYHRzIG5vLWFzc2VydFxuICogaW1wb3J0IHsgYmdHcmVlbiB9IGZyb20gXCJAc3RkL2ludGVybmFsL3N0eWxlc1wiO1xuICpcbiAqIGNvbnNvbGUubG9nKGJnR3JlZW4oXCJIZWxsbywgd29ybGQhXCIpKTsgLy8gUHJpbnRzIFwiSGVsbG8sIHdvcmxkIVwiIHdpdGggZ3JlZW4gYmFja2dyb3VuZFxuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiZ0dyZWVuKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzQyXSwgNDkpKTtcbn1cblxuLy8gaHR0cHM6Ly9naXRodWIuY29tL2NoYWxrL2Fuc2ktcmVnZXgvYmxvYi8wMmZhODkzZDYxOWQzZGE4NTQxMWFjYzhmZDRlMmVlYTBlOTVhOWQ5L2luZGV4LmpzXG5jb25zdCBBTlNJX1BBVFRFUk4gPSBuZXcgUmVnRXhwKFxuICBbXG4gICAgXCJbXFxcXHUwMDFCXFxcXHUwMDlCXVtbXFxcXF0oKSM7P10qKD86KD86KD86KD86O1stYS16QS1aXFxcXGRcXFxcLyMmLjo9PyVAfl9dKykqfFthLXpBLVpcXFxcZF0rKD86O1stYS16QS1aXFxcXGRcXFxcLyMmLjo9PyVAfl9dKikqKT9cXFxcdTAwMDcpXCIsXG4gICAgXCIoPzooPzpcXFxcZHsxLDR9KD86O1xcXFxkezAsNH0pKik/W1xcXFxkQS1QUi1UWFpjZi1ucS11eT0+PH5dKSlcIixcbiAgXS5qb2luKFwifFwiKSxcbiAgXCJnXCIsXG4pO1xuXG4vKipcbiAqIFJlbW92ZSBBTlNJIGVzY2FwZSBjb2RlcyBmcm9tIHRoZSBzdHJpbmcuXG4gKlxuICogQHBhcmFtIHN0cmluZyBUZXh0IHRvIHJlbW92ZSBBTlNJIGVzY2FwZSBjb2RlcyBmcm9tXG4gKlxuICogQHJldHVybnMgVGV4dCB3aXRob3V0IEFOU0kgZXNjYXBlIGNvZGVzXG4gKlxuICogQGV4YW1wbGUgVXNhZ2VcbiAqIGBgYHRzIG5vLWFzc2VydFxuICogaW1wb3J0IHsgcmVkLCBzdHJpcEFuc2lDb2RlIH0gZnJvbSBcIkBzdGQvaW50ZXJuYWwvc3R5bGVzXCI7XG4gKlxuICogY29uc29sZS5sb2coc3RyaXBBbnNpQ29kZShyZWQoXCJIZWxsbywgd29ybGQhXCIpKSk7IC8vIFByaW50cyBcIkhlbGxvLCB3b3JsZCFcIlxuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdHJpcEFuc2lDb2RlKHN0cmluZzogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHN0cmluZy5yZXBsYWNlKEFOU0lfUEFUVEVSTiwgXCJcIik7XG59XG4iLCAiLy8gQ29weXJpZ2h0IDIwMTgtMjAyNSB0aGUgRGVubyBhdXRob3JzLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuaW1wb3J0IHsgYmdHcmVlbiwgYmdSZWQsIGJvbGQsIGdyYXksIGdyZWVuLCByZWQsIHdoaXRlIH0gZnJvbSBcIi4vc3R5bGVzLnRzXCI7XG5pbXBvcnQgdHlwZSB7IERpZmZSZXN1bHQsIERpZmZUeXBlIH0gZnJvbSBcIi4vdHlwZXMudHNcIjtcblxuLyoqXG4gKiBDb2xvcnMgdGhlIG91dHB1dCBvZiBhc3NlcnRpb24gZGlmZnMuXG4gKlxuICogQHBhcmFtIGRpZmZUeXBlIERpZmZlcmVuY2UgdHlwZSwgZWl0aGVyIGFkZGVkIG9yIHJlbW92ZWQuXG4gKiBAcGFyYW0gYmFja2dyb3VuZCBJZiB0cnVlLCBjb2xvcnMgdGhlIGJhY2tncm91bmQgaW5zdGVhZCBvZiB0aGUgdGV4dC5cbiAqXG4gKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgY29sb3JzIHRoZSBpbnB1dCBzdHJpbmcuXG4gKlxuICogQGV4YW1wbGUgVXNhZ2VcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBjcmVhdGVDb2xvciB9IGZyb20gXCJAc3RkL2ludGVybmFsXCI7XG4gKiBpbXBvcnQgeyBhc3NlcnRFcXVhbHMgfSBmcm9tIFwiQHN0ZC9hc3NlcnRcIjtcbiAqIGltcG9ydCB7IGJvbGQsIGdyZWVuLCByZWQsIHdoaXRlIH0gZnJvbSBcIkBzdGQvZm10L2NvbG9yc1wiO1xuICpcbiAqIGFzc2VydEVxdWFscyhjcmVhdGVDb2xvcihcImFkZGVkXCIpKFwiZm9vXCIpLCBncmVlbihib2xkKFwiZm9vXCIpKSk7XG4gKiBhc3NlcnRFcXVhbHMoY3JlYXRlQ29sb3IoXCJyZW1vdmVkXCIpKFwiZm9vXCIpLCByZWQoYm9sZChcImZvb1wiKSkpO1xuICogYXNzZXJ0RXF1YWxzKGNyZWF0ZUNvbG9yKFwiY29tbW9uXCIpKFwiZm9vXCIpLCB3aGl0ZShcImZvb1wiKSk7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUNvbG9yKFxuICBkaWZmVHlwZTogRGlmZlR5cGUsXG4gIC8qKlxuICAgKiBUT0RPKEBsaXR0bGVkaXZ5KTogUmVtb3ZlIHRoaXMgd2hlbiB3ZSBjYW4gZGV0ZWN0IHRydWUgY29sb3IgdGVybWluYWxzLiBTZWVcbiAgICogaHR0cHM6Ly9naXRodWIuY29tL2Rlbm9sYW5kL3N0ZC9pc3N1ZXMvMjU3NS5cbiAgICovXG4gIGJhY2tncm91bmQgPSBmYWxzZSxcbik6IChzOiBzdHJpbmcpID0+IHN0cmluZyB7XG4gIHN3aXRjaCAoZGlmZlR5cGUpIHtcbiAgICBjYXNlIFwiYWRkZWRcIjpcbiAgICAgIHJldHVybiAocykgPT4gYmFja2dyb3VuZCA/IGJnR3JlZW4od2hpdGUocykpIDogZ3JlZW4oYm9sZChzKSk7XG4gICAgY2FzZSBcInJlbW92ZWRcIjpcbiAgICAgIHJldHVybiAocykgPT4gYmFja2dyb3VuZCA/IGJnUmVkKHdoaXRlKHMpKSA6IHJlZChib2xkKHMpKTtcbiAgICBjYXNlIFwidHJ1bmNhdGlvblwiOlxuICAgICAgcmV0dXJuIGdyYXk7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiB3aGl0ZTtcbiAgfVxufVxuXG4vKipcbiAqIFByZWZpeGVzIGArYCBvciBgLWAgaW4gZGlmZiBvdXRwdXQuXG4gKlxuICogQHBhcmFtIGRpZmZUeXBlIERpZmZlcmVuY2UgdHlwZSwgZWl0aGVyIGFkZGVkIG9yIHJlbW92ZWRcbiAqXG4gKiBAcmV0dXJucyBBIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIHNpZ24uXG4gKlxuICogQGV4YW1wbGUgVXNhZ2VcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBjcmVhdGVTaWduIH0gZnJvbSBcIkBzdGQvaW50ZXJuYWxcIjtcbiAqIGltcG9ydCB7IGFzc2VydEVxdWFscyB9IGZyb20gXCJAc3RkL2Fzc2VydFwiO1xuICpcbiAqIGFzc2VydEVxdWFscyhjcmVhdGVTaWduKFwiYWRkZWRcIiksIFwiKyAgIFwiKTtcbiAqIGFzc2VydEVxdWFscyhjcmVhdGVTaWduKFwicmVtb3ZlZFwiKSwgXCItICAgXCIpO1xuICogYXNzZXJ0RXF1YWxzKGNyZWF0ZVNpZ24oXCJjb21tb25cIiksIFwiICAgIFwiKTtcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlU2lnbihkaWZmVHlwZTogRGlmZlR5cGUpOiBzdHJpbmcge1xuICBzd2l0Y2ggKGRpZmZUeXBlKSB7XG4gICAgY2FzZSBcImFkZGVkXCI6XG4gICAgICByZXR1cm4gXCIrICAgXCI7XG4gICAgY2FzZSBcInJlbW92ZWRcIjpcbiAgICAgIHJldHVybiBcIi0gICBcIjtcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIFwiICAgIFwiO1xuICB9XG59XG5cbi8qKiBPcHRpb25zIGZvciB7QGxpbmtjb2RlIGJ1aWxkTWVzc2FnZX0uICovXG5leHBvcnQgaW50ZXJmYWNlIEJ1aWxkTWVzc2FnZU9wdGlvbnMge1xuICAvKipcbiAgICogV2hldGhlciB0byBvdXRwdXQgdGhlIGRpZmYgYXMgYSBzaW5nbGUgc3RyaW5nLlxuICAgKiBAZGVmYXVsdCB7ZmFsc2V9XG4gICAqL1xuICBzdHJpbmdEaWZmPzogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiBCdWlsZHMgYSBtZXNzYWdlIGJhc2VkIG9uIHRoZSBwcm92aWRlZCBkaWZmIHJlc3VsdC5cbiAqXG4gKiBAcGFyYW0gZGlmZlJlc3VsdCBUaGUgZGlmZiByZXN1bHQgYXJyYXkuXG4gKiBAcGFyYW0gb3B0aW9ucyBPcHRpb25hbCBwYXJhbWV0ZXJzIGZvciBjdXN0b21pemluZyB0aGUgbWVzc2FnZS5cbiAqIEBwYXJhbSB0cnVuY2F0ZURpZmYgRnVuY3Rpb24gdG8gdHJ1bmNhdGUgdGhlIGRpZmYgKGRlZmF1bHQgaXMgbm8gdHJ1bmNhdGlvbikuXG4gKlxuICogQHJldHVybnMgQW4gYXJyYXkgb2Ygc3RyaW5ncyByZXByZXNlbnRpbmcgdGhlIGJ1aWx0IG1lc3NhZ2UuXG4gKlxuICogQGV4YW1wbGUgVXNhZ2VcbiAqIGBgYHRzIG5vLWFzc2VydFxuICogaW1wb3J0IHsgZGlmZlN0ciwgYnVpbGRNZXNzYWdlIH0gZnJvbSBcIkBzdGQvaW50ZXJuYWxcIjtcbiAqXG4gKiBkaWZmU3RyKFwiSGVsbG8sIHdvcmxkIVwiLCBcIkhlbGxvLCB3b3JsZFwiKTtcbiAqIC8vIFtcbiAqIC8vICAgXCJcIixcbiAqIC8vICAgXCJcIixcbiAqIC8vICAgXCIgICAgW0RpZmZdIEFjdHVhbCAvIEV4cGVjdGVkXCIsXG4gKiAvLyAgIFwiXCIsXG4gKiAvLyAgIFwiXCIsXG4gKiAvLyAgIFwiLSAgIEhlbGxvLCB3b3JsZCFcIixcbiAqIC8vICAgXCIrICAgSGVsbG8sIHdvcmxkXCIsXG4gKiAvLyAgIFwiXCIsXG4gKiAvLyBdXG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkTWVzc2FnZShcbiAgZGlmZlJlc3VsdDogUmVhZG9ubHlBcnJheTxEaWZmUmVzdWx0PHN0cmluZz4+LFxuICBvcHRpb25zOiBCdWlsZE1lc3NhZ2VPcHRpb25zID0ge30sXG4gIHRydW5jYXRlRGlmZj86IChcbiAgICBkaWZmUmVzdWx0OiBSZWFkb25seUFycmF5PERpZmZSZXN1bHQ8c3RyaW5nPj4sXG4gICAgc3RyaW5nRGlmZjogYm9vbGVhbixcbiAgICBjb250ZXh0TGVuZ3RoPzogbnVtYmVyIHwgbnVsbCxcbiAgKSA9PiBSZWFkb25seUFycmF5PERpZmZSZXN1bHQ8c3RyaW5nPj4sXG4pOiBzdHJpbmdbXSB7XG4gIGlmICh0cnVuY2F0ZURpZmYgIT0gbnVsbCkge1xuICAgIGRpZmZSZXN1bHQgPSB0cnVuY2F0ZURpZmYoZGlmZlJlc3VsdCwgb3B0aW9ucy5zdHJpbmdEaWZmID8/IGZhbHNlKTtcbiAgfVxuXG4gIGNvbnN0IHsgc3RyaW5nRGlmZiA9IGZhbHNlIH0gPSBvcHRpb25zO1xuICBjb25zdCBtZXNzYWdlcyA9IFtcbiAgICBcIlwiLFxuICAgIFwiXCIsXG4gICAgYCAgICAke2dyYXkoYm9sZChcIltEaWZmXVwiKSl9ICR7cmVkKGJvbGQoXCJBY3R1YWxcIikpfSAvICR7XG4gICAgICBncmVlbihib2xkKFwiRXhwZWN0ZWRcIikpXG4gICAgfWAsXG4gICAgXCJcIixcbiAgICBcIlwiLFxuICBdO1xuICBjb25zdCBkaWZmTWVzc2FnZXMgPSBkaWZmUmVzdWx0Lm1hcCgocmVzdWx0KSA9PiB7XG4gICAgY29uc3QgY29sb3IgPSBjcmVhdGVDb2xvcihyZXN1bHQudHlwZSk7XG5cbiAgICBjb25zdCBsaW5lID0gcmVzdWx0LnR5cGUgPT09IFwiYWRkZWRcIiB8fCByZXN1bHQudHlwZSA9PT0gXCJyZW1vdmVkXCJcbiAgICAgID8gcmVzdWx0LmRldGFpbHM/Lm1hcCgoZGV0YWlsKSA9PlxuICAgICAgICBkZXRhaWwudHlwZSAhPT0gXCJjb21tb25cIlxuICAgICAgICAgID8gY3JlYXRlQ29sb3IoZGV0YWlsLnR5cGUsIHRydWUpKGRldGFpbC52YWx1ZSlcbiAgICAgICAgICA6IGRldGFpbC52YWx1ZVxuICAgICAgKS5qb2luKFwiXCIpID8/IHJlc3VsdC52YWx1ZVxuICAgICAgOiByZXN1bHQudmFsdWU7XG5cbiAgICByZXR1cm4gY29sb3IoYCR7Y3JlYXRlU2lnbihyZXN1bHQudHlwZSl9JHtsaW5lfWApO1xuICB9KTtcbiAgbWVzc2FnZXMucHVzaCguLi4oc3RyaW5nRGlmZiA/IFtkaWZmTWVzc2FnZXMuam9pbihcIlwiKV0gOiBkaWZmTWVzc2FnZXMpLCBcIlwiKTtcbiAgcmV0dXJuIG1lc3NhZ2VzO1xufVxuIiwgIi8vIENvcHlyaWdodCAyMDE4LTIwMjUgdGhlIERlbm8gYXV0aG9ycy4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbmltcG9ydCB0eXBlIHsgRGlmZlJlc3VsdCwgRGlmZlR5cGUgfSBmcm9tIFwiLi90eXBlcy50c1wiO1xuXG4vKiogUmVwcmVzZW50cyB0aGUgZmFydGhlc3QgcG9pbnQgaW4gdGhlIGRpZmYgYWxnb3JpdGhtLiAqL1xuZXhwb3J0IGludGVyZmFjZSBGYXJ0aGVzdFBvaW50IHtcbiAgLyoqIFRoZSB5LWNvb3JkaW5hdGUgb2YgdGhlIHBvaW50LiAqL1xuICB5OiBudW1iZXI7XG4gIC8qKiBUaGUgaWQgb2YgdGhlIHBvaW50LiAqL1xuICBpZDogbnVtYmVyO1xufVxuXG5jb25zdCBSRU1PVkVEID0gMTtcbmNvbnN0IENPTU1PTiA9IDI7XG5jb25zdCBBRERFRCA9IDM7XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBhcnJheSBvZiBjb21tb24gZWxlbWVudHMgYmV0d2VlbiB0d28gYXJyYXlzLlxuICpcbiAqIEB0eXBlUGFyYW0gVCBUaGUgdHlwZSBvZiBlbGVtZW50cyBpbiB0aGUgYXJyYXlzLlxuICpcbiAqIEBwYXJhbSBBIFRoZSBmaXJzdCBhcnJheS5cbiAqIEBwYXJhbSBCIFRoZSBzZWNvbmQgYXJyYXkuXG4gKlxuICogQHJldHVybnMgQW4gYXJyYXkgY29udGFpbmluZyB0aGUgY29tbW9uIGVsZW1lbnRzIGJldHdlZW4gdGhlIHR3byBhcnJheXMuXG4gKlxuICogQGV4YW1wbGUgVXNhZ2VcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBjcmVhdGVDb21tb24gfSBmcm9tIFwiQHN0ZC9pbnRlcm5hbC9kaWZmXCI7XG4gKiBpbXBvcnQgeyBhc3NlcnRFcXVhbHMgfSBmcm9tIFwiQHN0ZC9hc3NlcnRcIjtcbiAqXG4gKiBjb25zdCBhID0gWzEsIDIsIDNdO1xuICogY29uc3QgYiA9IFsxLCAyLCA0XTtcbiAqXG4gKiBhc3NlcnRFcXVhbHMoY3JlYXRlQ29tbW9uKGEsIGIpLCBbMSwgMl0pO1xuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVDb21tb248VD4oQTogVFtdLCBCOiBUW10pOiBUW10ge1xuICBjb25zdCBjb21tb246IFRbXSA9IFtdO1xuICBpZiAoQS5sZW5ndGggPT09IDAgfHwgQi5sZW5ndGggPT09IDApIHJldHVybiBbXTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBNYXRoLm1pbihBLmxlbmd0aCwgQi5sZW5ndGgpOyBpICs9IDEpIHtcbiAgICBjb25zdCBhID0gQVtpXTtcbiAgICBjb25zdCBiID0gQltpXTtcbiAgICBpZiAoYSAhPT0gdW5kZWZpbmVkICYmIGEgPT09IGIpIHtcbiAgICAgIGNvbW1vbi5wdXNoKGEpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gY29tbW9uO1xuICAgIH1cbiAgfVxuICByZXR1cm4gY29tbW9uO1xufVxuXG4vKipcbiAqIEFzc2VydHMgdGhhdCB0aGUgdmFsdWUgaXMgYSB7QGxpbmtjb2RlIEZhcnRoZXN0UG9pbnR9LlxuICogSWYgbm90LCBhbiBlcnJvciBpcyB0aHJvd24uXG4gKlxuICogQHBhcmFtIHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqXG4gKiBAcmV0dXJucyBBIHZvaWQgdmFsdWUgdGhhdCByZXR1cm5zIG9uY2UgdGhlIGFzc2VydGlvbiBjb21wbGV0ZXMuXG4gKlxuICogQGV4YW1wbGUgVXNhZ2VcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBhc3NlcnRGcCB9IGZyb20gXCJAc3RkL2ludGVybmFsL2RpZmZcIjtcbiAqIGltcG9ydCB7IGFzc2VydFRocm93cyB9IGZyb20gXCJAc3RkL2Fzc2VydFwiO1xuICpcbiAqIGFzc2VydEZwKHsgeTogMCwgaWQ6IDAgfSk7XG4gKiBhc3NlcnRUaHJvd3MoKCkgPT4gYXNzZXJ0RnAoeyBpZDogMCB9KSk7XG4gKiBhc3NlcnRUaHJvd3MoKCkgPT4gYXNzZXJ0RnAoeyB5OiAwIH0pKTtcbiAqIGFzc2VydFRocm93cygoKSA9PiBhc3NlcnRGcCh1bmRlZmluZWQpKTtcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0RnAodmFsdWU6IHVua25vd24pOiBhc3NlcnRzIHZhbHVlIGlzIEZhcnRoZXN0UG9pbnQge1xuICBpZiAoXG4gICAgdmFsdWUgPT0gbnVsbCB8fFxuICAgIHR5cGVvZiB2YWx1ZSAhPT0gXCJvYmplY3RcIiB8fFxuICAgIHR5cGVvZiAodmFsdWUgYXMgRmFydGhlc3RQb2ludCk/LnkgIT09IFwibnVtYmVyXCIgfHxcbiAgICB0eXBlb2YgKHZhbHVlIGFzIEZhcnRoZXN0UG9pbnQpPy5pZCAhPT0gXCJudW1iZXJcIlxuICApIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICBgVW5leHBlY3RlZCB2YWx1ZSwgZXhwZWN0ZWQgJ0ZhcnRoZXN0UG9pbnQnOiByZWNlaXZlZCAke3R5cGVvZiB2YWx1ZX1gLFxuICAgICk7XG4gIH1cbn1cblxuLyoqXG4gKiBDcmVhdGVzIGFuIGFycmF5IG9mIGJhY2t0cmFjZWQgZGlmZmVyZW5jZXMuXG4gKlxuICogQHR5cGVQYXJhbSBUIFRoZSB0eXBlIG9mIGVsZW1lbnRzIGluIHRoZSBhcnJheXMuXG4gKlxuICogQHBhcmFtIEEgVGhlIGZpcnN0IGFycmF5LlxuICogQHBhcmFtIEIgVGhlIHNlY29uZCBhcnJheS5cbiAqIEBwYXJhbSBjdXJyZW50IFRoZSBjdXJyZW50IHtAbGlua2NvZGUgRmFydGhlc3RQb2ludH0uXG4gKiBAcGFyYW0gc3dhcHBlZCBCb29sZWFuIGluZGljYXRpbmcgaWYgdGhlIGFycmF5cyBhcmUgc3dhcHBlZC5cbiAqIEBwYXJhbSByb3V0ZXMgVGhlIHJvdXRlcyBhcnJheS5cbiAqIEBwYXJhbSBkaWZmVHlwZXNQdHJPZmZzZXQgVGhlIG9mZnNldCBvZiB0aGUgZGlmZiB0eXBlcyBpbiB0aGUgcm91dGVzIGFycmF5LlxuICpcbiAqIEByZXR1cm5zIEFuIGFycmF5IG9mIGJhY2t0cmFjZWQgZGlmZmVyZW5jZXMuXG4gKlxuICogQGV4YW1wbGUgVXNhZ2VcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBiYWNrVHJhY2UgfSBmcm9tIFwiQHN0ZC9pbnRlcm5hbC9kaWZmXCI7XG4gKiBpbXBvcnQgeyBhc3NlcnRFcXVhbHMgfSBmcm9tIFwiQHN0ZC9hc3NlcnRcIjtcbiAqXG4gKiBhc3NlcnRFcXVhbHMoXG4gKiAgIGJhY2tUcmFjZShbXSwgW10sIHsgeTogMCwgaWQ6IDAgfSwgZmFsc2UsIG5ldyBVaW50MzJBcnJheSgwKSwgMCksXG4gKiAgIFtdLFxuICogKTtcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gYmFja1RyYWNlPFQ+KFxuICBBOiBUW10sXG4gIEI6IFRbXSxcbiAgY3VycmVudDogRmFydGhlc3RQb2ludCxcbiAgc3dhcHBlZDogYm9vbGVhbixcbiAgcm91dGVzOiBVaW50MzJBcnJheSxcbiAgZGlmZlR5cGVzUHRyT2Zmc2V0OiBudW1iZXIsXG4pOiBBcnJheTx7XG4gIHR5cGU6IERpZmZUeXBlO1xuICB2YWx1ZTogVDtcbn0+IHtcbiAgY29uc3QgTSA9IEEubGVuZ3RoO1xuICBjb25zdCBOID0gQi5sZW5ndGg7XG4gIGNvbnN0IHJlc3VsdDogeyB0eXBlOiBEaWZmVHlwZTsgdmFsdWU6IFQgfVtdID0gW107XG4gIGxldCBhID0gTSAtIDE7XG4gIGxldCBiID0gTiAtIDE7XG4gIGxldCBqID0gcm91dGVzW2N1cnJlbnQuaWRdO1xuICBsZXQgdHlwZSA9IHJvdXRlc1tjdXJyZW50LmlkICsgZGlmZlR5cGVzUHRyT2Zmc2V0XTtcbiAgd2hpbGUgKHRydWUpIHtcbiAgICBpZiAoIWogJiYgIXR5cGUpIGJyZWFrO1xuICAgIGNvbnN0IHByZXYgPSBqITtcbiAgICBpZiAodHlwZSA9PT0gUkVNT1ZFRCkge1xuICAgICAgcmVzdWx0LnVuc2hpZnQoe1xuICAgICAgICB0eXBlOiBzd2FwcGVkID8gXCJyZW1vdmVkXCIgOiBcImFkZGVkXCIsXG4gICAgICAgIHZhbHVlOiBCW2JdISxcbiAgICAgIH0pO1xuICAgICAgYiAtPSAxO1xuICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gQURERUQpIHtcbiAgICAgIHJlc3VsdC51bnNoaWZ0KHtcbiAgICAgICAgdHlwZTogc3dhcHBlZCA/IFwiYWRkZWRcIiA6IFwicmVtb3ZlZFwiLFxuICAgICAgICB2YWx1ZTogQVthXSEsXG4gICAgICB9KTtcbiAgICAgIGEgLT0gMTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzdWx0LnVuc2hpZnQoeyB0eXBlOiBcImNvbW1vblwiLCB2YWx1ZTogQVthXSEgfSk7XG4gICAgICBhIC09IDE7XG4gICAgICBiIC09IDE7XG4gICAgfVxuICAgIGogPSByb3V0ZXNbcHJldl07XG4gICAgdHlwZSA9IHJvdXRlc1twcmV2ICsgZGlmZlR5cGVzUHRyT2Zmc2V0XTtcbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSB7QGxpbmtjb2RlIEZhcnRoZXN0UG9pbnR9LlxuICpcbiAqIEBwYXJhbSBrIFRoZSBjdXJyZW50IGluZGV4LlxuICogQHBhcmFtIE0gVGhlIGxlbmd0aCBvZiB0aGUgZmlyc3QgYXJyYXkuXG4gKiBAcGFyYW0gcm91dGVzIFRoZSByb3V0ZXMgYXJyYXkuXG4gKiBAcGFyYW0gZGlmZlR5cGVzUHRyT2Zmc2V0IFRoZSBvZmZzZXQgb2YgdGhlIGRpZmYgdHlwZXMgaW4gdGhlIHJvdXRlcyBhcnJheS5cbiAqIEBwYXJhbSBwdHIgVGhlIGN1cnJlbnQgcG9pbnRlci5cbiAqIEBwYXJhbSBzbGlkZSBUaGUgc2xpZGUge0BsaW5rY29kZSBGYXJ0aGVzdFBvaW50fS5cbiAqIEBwYXJhbSBkb3duIFRoZSBkb3duIHtAbGlua2NvZGUgRmFydGhlc3RQb2ludH0uXG4gKlxuICogQHJldHVybnMgQSB7QGxpbmtjb2RlIEZhcnRoZXN0UG9pbnR9LlxuICpcbiAqIEBleGFtcGxlIFVzYWdlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgY3JlYXRlRnAgfSBmcm9tIFwiQHN0ZC9pbnRlcm5hbC9kaWZmXCI7XG4gKiBpbXBvcnQgeyBhc3NlcnRFcXVhbHMgfSBmcm9tIFwiQHN0ZC9hc3NlcnRcIjtcbiAqXG4gKiBhc3NlcnRFcXVhbHMoXG4gKiAgIGNyZWF0ZUZwKFxuICogICAgIDAsXG4gKiAgICAgMCxcbiAqICAgICBuZXcgVWludDMyQXJyYXkoMCksXG4gKiAgICAgMCxcbiAqICAgICAwLFxuICogICAgIHsgeTogLTEsIGlkOiAwIH0sXG4gKiAgICAgeyB5OiAwLCBpZDogMCB9LFxuICogICApLFxuICogICB7IHk6IC0xLCBpZDogMSB9LFxuICogKTtcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRnAoXG4gIGs6IG51bWJlcixcbiAgTTogbnVtYmVyLFxuICByb3V0ZXM6IFVpbnQzMkFycmF5LFxuICBkaWZmVHlwZXNQdHJPZmZzZXQ6IG51bWJlcixcbiAgcHRyOiBudW1iZXIsXG4gIHNsaWRlPzogRmFydGhlc3RQb2ludCxcbiAgZG93bj86IEZhcnRoZXN0UG9pbnQsXG4pOiBGYXJ0aGVzdFBvaW50IHtcbiAgaWYgKHNsaWRlICYmIHNsaWRlLnkgPT09IC0xICYmIGRvd24gJiYgZG93bi55ID09PSAtMSkge1xuICAgIHJldHVybiB7IHk6IDAsIGlkOiAwIH07XG4gIH1cbiAgY29uc3QgaXNBZGRpbmcgPSAoZG93bj8ueSA9PT0gLTEpIHx8XG4gICAgayA9PT0gTSB8fFxuICAgIChzbGlkZT8ueSA/PyAwKSA+IChkb3duPy55ID8/IDApICsgMTtcbiAgaWYgKHNsaWRlICYmIGlzQWRkaW5nKSB7XG4gICAgY29uc3QgcHJldiA9IHNsaWRlLmlkO1xuICAgIHB0cisrO1xuICAgIHJvdXRlc1twdHJdID0gcHJldjtcbiAgICByb3V0ZXNbcHRyICsgZGlmZlR5cGVzUHRyT2Zmc2V0XSA9IEFEREVEO1xuICAgIHJldHVybiB7IHk6IHNsaWRlLnksIGlkOiBwdHIgfTtcbiAgfVxuICBpZiAoZG93biAmJiAhaXNBZGRpbmcpIHtcbiAgICBjb25zdCBwcmV2ID0gZG93bi5pZDtcbiAgICBwdHIrKztcbiAgICByb3V0ZXNbcHRyXSA9IHByZXY7XG4gICAgcm91dGVzW3B0ciArIGRpZmZUeXBlc1B0ck9mZnNldF0gPSBSRU1PVkVEO1xuICAgIHJldHVybiB7IHk6IGRvd24ueSArIDEsIGlkOiBwdHIgfTtcbiAgfVxuICB0aHJvdyBuZXcgRXJyb3IoXCJVbmV4cGVjdGVkIG1pc3NpbmcgRmFydGhlc3RQb2ludFwiKTtcbn1cblxuLyoqXG4gKiBSZW5kZXJzIHRoZSBkaWZmZXJlbmNlcyBiZXR3ZWVuIHRoZSBhY3R1YWwgYW5kIGV4cGVjdGVkIHZhbHVlcy5cbiAqXG4gKiBAdHlwZVBhcmFtIFQgVGhlIHR5cGUgb2YgZWxlbWVudHMgaW4gdGhlIGFycmF5cy5cbiAqXG4gKiBAcGFyYW0gQSBBY3R1YWwgdmFsdWVcbiAqIEBwYXJhbSBCIEV4cGVjdGVkIHZhbHVlXG4gKlxuICogQHJldHVybnMgQW4gYXJyYXkgb2YgZGlmZmVyZW5jZXMgYmV0d2VlbiB0aGUgYWN0dWFsIGFuZCBleHBlY3RlZCB2YWx1ZXMuXG4gKlxuICogQGV4YW1wbGUgVXNhZ2VcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBkaWZmIH0gZnJvbSBcIkBzdGQvaW50ZXJuYWwvZGlmZlwiO1xuICogaW1wb3J0IHsgYXNzZXJ0RXF1YWxzIH0gZnJvbSBcIkBzdGQvYXNzZXJ0XCI7XG4gKlxuICogY29uc3QgYSA9IFsxLCAyLCAzXTtcbiAqIGNvbnN0IGIgPSBbMSwgMiwgNF07XG4gKlxuICogYXNzZXJ0RXF1YWxzKGRpZmYoYSwgYiksIFtcbiAqICAgeyB0eXBlOiBcImNvbW1vblwiLCB2YWx1ZTogMSB9LFxuICogICB7IHR5cGU6IFwiY29tbW9uXCIsIHZhbHVlOiAyIH0sXG4gKiAgIHsgdHlwZTogXCJyZW1vdmVkXCIsIHZhbHVlOiAzIH0sXG4gKiAgIHsgdHlwZTogXCJhZGRlZFwiLCB2YWx1ZTogNCB9LFxuICogXSk7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRpZmY8VD4oQTogVFtdLCBCOiBUW10pOiBEaWZmUmVzdWx0PFQ+W10ge1xuICBjb25zdCBwcmVmaXhDb21tb24gPSBjcmVhdGVDb21tb24oQSwgQik7XG4gIEEgPSBBLnNsaWNlKHByZWZpeENvbW1vbi5sZW5ndGgpO1xuICBCID0gQi5zbGljZShwcmVmaXhDb21tb24ubGVuZ3RoKTtcbiAgY29uc3Qgc3dhcHBlZCA9IEIubGVuZ3RoID4gQS5sZW5ndGg7XG4gIFtBLCBCXSA9IHN3YXBwZWQgPyBbQiwgQV0gOiBbQSwgQl07XG4gIGNvbnN0IE0gPSBBLmxlbmd0aDtcbiAgY29uc3QgTiA9IEIubGVuZ3RoO1xuICBpZiAoIU0gJiYgIU4gJiYgIXByZWZpeENvbW1vbi5sZW5ndGgpIHJldHVybiBbXTtcbiAgaWYgKCFOKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIC4uLnByZWZpeENvbW1vbi5tYXAoKHZhbHVlKSA9PiAoeyB0eXBlOiBcImNvbW1vblwiLCB2YWx1ZSB9KSksXG4gICAgICAuLi5BLm1hcCgodmFsdWUpID0+ICh7IHR5cGU6IHN3YXBwZWQgPyBcImFkZGVkXCIgOiBcInJlbW92ZWRcIiwgdmFsdWUgfSkpLFxuICAgIF0gYXMgRGlmZlJlc3VsdDxUPltdO1xuICB9XG4gIGNvbnN0IG9mZnNldCA9IE47XG4gIGNvbnN0IGRlbHRhID0gTSAtIE47XG4gIGNvbnN0IGxlbmd0aCA9IE0gKyBOICsgMTtcbiAgY29uc3QgZnA6IEZhcnRoZXN0UG9pbnRbXSA9IEFycmF5LmZyb20oeyBsZW5ndGggfSwgKCkgPT4gKHsgeTogLTEsIGlkOiAtMSB9KSk7XG5cbiAgLyoqXG4gICAqIE5vdGU6IHRoaXMgYnVmZmVyIGlzIHVzZWQgdG8gc2F2ZSBtZW1vcnkgYW5kIGltcHJvdmUgcGVyZm9ybWFuY2UuIFRoZSBmaXJzdFxuICAgKiBoYWxmIGlzIHVzZWQgdG8gc2F2ZSByb3V0ZSBhbmQgdGhlIGxhc3QgaGFsZiBpcyB1c2VkIHRvIHNhdmUgZGlmZiB0eXBlLlxuICAgKi9cbiAgY29uc3Qgcm91dGVzID0gbmV3IFVpbnQzMkFycmF5KChNICogTiArIGxlbmd0aCArIDEpICogMik7XG4gIGNvbnN0IGRpZmZUeXBlc1B0ck9mZnNldCA9IHJvdXRlcy5sZW5ndGggLyAyO1xuICBsZXQgcHRyID0gMDtcblxuICBmdW5jdGlvbiBzbmFrZTxUPihcbiAgICBrOiBudW1iZXIsXG4gICAgQTogVFtdLFxuICAgIEI6IFRbXSxcbiAgICBzbGlkZT86IEZhcnRoZXN0UG9pbnQsXG4gICAgZG93bj86IEZhcnRoZXN0UG9pbnQsXG4gICk6IEZhcnRoZXN0UG9pbnQge1xuICAgIGNvbnN0IE0gPSBBLmxlbmd0aDtcbiAgICBjb25zdCBOID0gQi5sZW5ndGg7XG4gICAgY29uc3QgZnAgPSBjcmVhdGVGcChrLCBNLCByb3V0ZXMsIGRpZmZUeXBlc1B0ck9mZnNldCwgcHRyLCBzbGlkZSwgZG93bik7XG4gICAgcHRyID0gZnAuaWQ7XG4gICAgd2hpbGUgKGZwLnkgKyBrIDwgTSAmJiBmcC55IDwgTiAmJiBBW2ZwLnkgKyBrXSA9PT0gQltmcC55XSkge1xuICAgICAgY29uc3QgcHJldiA9IGZwLmlkO1xuICAgICAgcHRyKys7XG4gICAgICBmcC5pZCA9IHB0cjtcbiAgICAgIGZwLnkgKz0gMTtcbiAgICAgIHJvdXRlc1twdHJdID0gcHJldjtcbiAgICAgIHJvdXRlc1twdHIgKyBkaWZmVHlwZXNQdHJPZmZzZXRdID0gQ09NTU9OO1xuICAgIH1cbiAgICByZXR1cm4gZnA7XG4gIH1cblxuICBsZXQgY3VycmVudEZwID0gZnBbZGVsdGEgKyBvZmZzZXRdO1xuICBhc3NlcnRGcChjdXJyZW50RnApO1xuICBsZXQgcCA9IC0xO1xuICB3aGlsZSAoY3VycmVudEZwLnkgPCBOKSB7XG4gICAgcCA9IHAgKyAxO1xuICAgIGZvciAobGV0IGsgPSAtcDsgayA8IGRlbHRhOyArK2spIHtcbiAgICAgIGNvbnN0IGluZGV4ID0gayArIG9mZnNldDtcbiAgICAgIGZwW2luZGV4XSA9IHNuYWtlKGssIEEsIEIsIGZwW2luZGV4IC0gMV0sIGZwW2luZGV4ICsgMV0pO1xuICAgIH1cbiAgICBmb3IgKGxldCBrID0gZGVsdGEgKyBwOyBrID4gZGVsdGE7IC0taykge1xuICAgICAgY29uc3QgaW5kZXggPSBrICsgb2Zmc2V0O1xuICAgICAgZnBbaW5kZXhdID0gc25ha2UoaywgQSwgQiwgZnBbaW5kZXggLSAxXSwgZnBbaW5kZXggKyAxXSk7XG4gICAgfVxuICAgIGNvbnN0IGluZGV4ID0gZGVsdGEgKyBvZmZzZXQ7XG4gICAgZnBbZGVsdGEgKyBvZmZzZXRdID0gc25ha2UoZGVsdGEsIEEsIEIsIGZwW2luZGV4IC0gMV0sIGZwW2luZGV4ICsgMV0pO1xuICAgIGN1cnJlbnRGcCA9IGZwW2RlbHRhICsgb2Zmc2V0XTtcbiAgICBhc3NlcnRGcChjdXJyZW50RnApO1xuICB9XG4gIHJldHVybiBbXG4gICAgLi4ucHJlZml4Q29tbW9uLm1hcCgodmFsdWUpID0+ICh7IHR5cGU6IFwiY29tbW9uXCIsIHZhbHVlIH0pKSxcbiAgICAuLi5iYWNrVHJhY2UoQSwgQiwgY3VycmVudEZwLCBzd2FwcGVkLCByb3V0ZXMsIGRpZmZUeXBlc1B0ck9mZnNldCksXG4gIF0gYXMgRGlmZlJlc3VsdDxUPltdO1xufVxuIiwgIi8vIENvcHlyaWdodCAyMDE4LTIwMjUgdGhlIERlbm8gYXV0aG9ycy4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbmltcG9ydCB0eXBlIHsgQ2hhbmdlZERpZmZSZXN1bHQsIERpZmZSZXN1bHQgfSBmcm9tIFwiLi90eXBlcy50c1wiO1xuaW1wb3J0IHsgZGlmZiB9IGZyb20gXCIuL2RpZmYudHNcIjtcblxuLyoqXG4gKiBVbmVzY2FwZSBpbnZpc2libGUgY2hhcmFjdGVycy5cbiAqXG4gKiBAc2VlIHtAbGluayBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9TdHJpbmcjZXNjYXBlX3NlcXVlbmNlc31cbiAqXG4gKiBAcGFyYW0gc3RyaW5nIFN0cmluZyB0byB1bmVzY2FwZS5cbiAqXG4gKiBAcmV0dXJucyBVbmVzY2FwZWQgc3RyaW5nLlxuICpcbiAqIEBleGFtcGxlIFVzYWdlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgdW5lc2NhcGUgfSBmcm9tIFwiQHN0ZC9pbnRlcm5hbC9kaWZmLXN0clwiO1xuICogaW1wb3J0IHsgYXNzZXJ0RXF1YWxzIH0gZnJvbSBcIkBzdGQvYXNzZXJ0XCI7XG4gKlxuICogYXNzZXJ0RXF1YWxzKHVuZXNjYXBlKFwiSGVsbG9cXG5Xb3JsZFwiKSwgXCJIZWxsb1xcXFxuXFxuV29ybGRcIik7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVuZXNjYXBlKHN0cmluZzogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHN0cmluZ1xuICAgIC5yZXBsYWNlQWxsKFwiXFxcXFwiLCBcIlxcXFxcXFxcXCIpXG4gICAgLnJlcGxhY2VBbGwoXCJcXGJcIiwgXCJcXFxcYlwiKVxuICAgIC5yZXBsYWNlQWxsKFwiXFxmXCIsIFwiXFxcXGZcIilcbiAgICAucmVwbGFjZUFsbChcIlxcdFwiLCBcIlxcXFx0XCIpXG4gICAgLnJlcGxhY2VBbGwoXCJcXHZcIiwgXCJcXFxcdlwiKVxuICAgIC8vIFRoaXMgZG9lcyBub3QgcmVtb3ZlIGxpbmUgYnJlYWtzXG4gICAgLnJlcGxhY2VBbGwoXG4gICAgICAvXFxyXFxufFxccnxcXG4vZyxcbiAgICAgIChzdHIpID0+IHN0ciA9PT0gXCJcXHJcIiA/IFwiXFxcXHJcIiA6IHN0ciA9PT0gXCJcXG5cIiA/IFwiXFxcXG5cXG5cIiA6IFwiXFxcXHJcXFxcblxcclxcblwiLFxuICAgICk7XG59XG5cbmNvbnN0IFdISVRFU1BBQ0VfU1lNQk9MUyA9XG4gIC8oKD86XFxcXFtiZnR2XXxbXlxcU1xcclxcbl0pK3xcXFxcW3JuXFxcXF18WygpW1xcXXt9J1wiXFxyXFxuXXxcXGIpLztcblxuLyoqXG4gKiBUb2tlbml6ZXMgYSBzdHJpbmcgaW50byBhbiBhcnJheSBvZiB0b2tlbnMuXG4gKlxuICogQHBhcmFtIHN0cmluZyBUaGUgc3RyaW5nIHRvIHRva2VuaXplLlxuICogQHBhcmFtIHdvcmREaWZmIElmIHRydWUsIHBlcmZvcm1zIHdvcmQtYmFzZWQgdG9rZW5pemF0aW9uLiBEZWZhdWx0IGlzIGZhbHNlLlxuICpcbiAqIEByZXR1cm5zIEFuIGFycmF5IG9mIHRva2Vucy5cbiAqXG4gKiBAZXhhbXBsZSBVc2FnZVxuICogYGBgdHNcbiAqIGltcG9ydCB7IHRva2VuaXplIH0gZnJvbSBcIkBzdGQvaW50ZXJuYWwvZGlmZi1zdHJcIjtcbiAqIGltcG9ydCB7IGFzc2VydEVxdWFscyB9IGZyb20gXCJAc3RkL2Fzc2VydFwiO1xuICpcbiAqIGFzc2VydEVxdWFscyh0b2tlbml6ZShcIkhlbGxvXFxuV29ybGRcIiksIFtcIkhlbGxvXFxuXCIsIFwiV29ybGRcIl0pO1xuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0b2tlbml6ZShzdHJpbmc6IHN0cmluZywgd29yZERpZmYgPSBmYWxzZSk6IHN0cmluZ1tdIHtcbiAgaWYgKHdvcmREaWZmKSB7XG4gICAgcmV0dXJuIHN0cmluZ1xuICAgICAgLnNwbGl0KFdISVRFU1BBQ0VfU1lNQk9MUylcbiAgICAgIC5maWx0ZXIoKHRva2VuKSA9PiB0b2tlbik7XG4gIH1cbiAgY29uc3QgdG9rZW5zOiBzdHJpbmdbXSA9IFtdO1xuICBjb25zdCBsaW5lcyA9IHN0cmluZy5zcGxpdCgvKFxcbnxcXHJcXG4pLykuZmlsdGVyKChsaW5lKSA9PiBsaW5lKTtcblxuICBmb3IgKGNvbnN0IFtpLCBsaW5lXSBvZiBsaW5lcy5lbnRyaWVzKCkpIHtcbiAgICBpZiAoaSAlIDIpIHtcbiAgICAgIHRva2Vuc1t0b2tlbnMubGVuZ3RoIC0gMV0gKz0gbGluZTtcbiAgICB9IGVsc2Uge1xuICAgICAgdG9rZW5zLnB1c2gobGluZSk7XG4gICAgfVxuICB9XG4gIHJldHVybiB0b2tlbnM7XG59XG5cbi8qKlxuICogQ3JlYXRlIGRldGFpbHMgYnkgZmlsdGVyaW5nIHJlbGV2YW50IHdvcmQtZGlmZiBmb3IgY3VycmVudCBsaW5lIGFuZCBtZXJnZVxuICogXCJzcGFjZS1kaWZmXCIgaWYgc3Vycm91bmRlZCBieSB3b3JkLWRpZmYgZm9yIGNsZWFuZXIgZGlzcGxheXMuXG4gKlxuICogQHBhcmFtIGxpbmUgQ3VycmVudCBsaW5lXG4gKiBAcGFyYW0gdG9rZW5zIFdvcmQtZGlmZiB0b2tlbnNcbiAqXG4gKiBAcmV0dXJucyBBcnJheSBvZiBkaWZmIHJlc3VsdHMuXG4gKlxuICogQGV4YW1wbGUgVXNhZ2VcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBjcmVhdGVEZXRhaWxzIH0gZnJvbSBcIkBzdGQvaW50ZXJuYWwvZGlmZi1zdHJcIjtcbiAqIGltcG9ydCB7IGFzc2VydEVxdWFscyB9IGZyb20gXCJAc3RkL2Fzc2VydFwiO1xuICpcbiAqIGNvbnN0IHRva2VucyA9IFtcbiAqICAgeyB0eXBlOiBcImFkZGVkXCIsIHZhbHVlOiBcImFcIiB9LFxuICogICB7IHR5cGU6IFwicmVtb3ZlZFwiLCB2YWx1ZTogXCJiXCIgfSxcbiAqICAgeyB0eXBlOiBcImNvbW1vblwiLCB2YWx1ZTogXCJjXCIgfSxcbiAqIF0gYXMgY29uc3Q7XG4gKiBhc3NlcnRFcXVhbHMoXG4gKiAgIGNyZWF0ZURldGFpbHMoeyB0eXBlOiBcImFkZGVkXCIsIHZhbHVlOiBcImFcIiB9LCBbLi4udG9rZW5zXSksXG4gKiAgIFt7IHR5cGU6IFwiYWRkZWRcIiwgdmFsdWU6IFwiYVwiIH0sIHsgdHlwZTogXCJjb21tb25cIiwgdmFsdWU6IFwiY1wiIH1dXG4gKiApO1xuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVEZXRhaWxzKFxuICBsaW5lOiBEaWZmUmVzdWx0PHN0cmluZz4sXG4gIHRva2VuczogRGlmZlJlc3VsdDxzdHJpbmc+W10sXG4pOiBEaWZmUmVzdWx0PHN0cmluZz5bXSB7XG4gIHJldHVybiB0b2tlbnMuZmlsdGVyKCh7IHR5cGUgfSkgPT4gdHlwZSA9PT0gbGluZS50eXBlIHx8IHR5cGUgPT09IFwiY29tbW9uXCIpXG4gICAgLm1hcCgocmVzdWx0LCBpLCB0KSA9PiB7XG4gICAgICBjb25zdCB0b2tlbiA9IHRbaSAtIDFdO1xuICAgICAgaWYgKFxuICAgICAgICAocmVzdWx0LnR5cGUgPT09IFwiY29tbW9uXCIpICYmIHRva2VuICYmXG4gICAgICAgICh0b2tlbi50eXBlID09PSB0W2kgKyAxXT8udHlwZSkgJiYgL1xccysvLnRlc3QocmVzdWx0LnZhbHVlKVxuICAgICAgKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgLi4ucmVzdWx0LFxuICAgICAgICAgIHR5cGU6IHRva2VuLnR5cGUsXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0pO1xufVxuXG5jb25zdCBOT05fV0hJVEVTUEFDRV9SRUdFWFAgPSAvXFxTLztcblxuLyoqXG4gKiBSZW5kZXJzIHRoZSBkaWZmZXJlbmNlcyBiZXR3ZWVuIHRoZSBhY3R1YWwgYW5kIGV4cGVjdGVkIHN0cmluZ3MuIFBhcnRpYWxseVxuICogaW5zcGlyZWQgZnJvbSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2twZGVja2VyL2pzZGlmZn0uXG4gKlxuICogQHBhcmFtIEEgQWN0dWFsIHN0cmluZ1xuICogQHBhcmFtIEIgRXhwZWN0ZWQgc3RyaW5nXG4gKlxuICogQHJldHVybnMgQXJyYXkgb2YgZGlmZiByZXN1bHRzLlxuICpcbiAqIEBleGFtcGxlIFVzYWdlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgZGlmZlN0ciB9IGZyb20gXCJAc3RkL2ludGVybmFsL2RpZmYtc3RyXCI7XG4gKiBpbXBvcnQgeyBhc3NlcnRFcXVhbHMgfSBmcm9tIFwiQHN0ZC9hc3NlcnRcIjtcbiAqXG4gKiBhc3NlcnRFcXVhbHMoZGlmZlN0cihcIkhlbGxvIVwiLCBcIkhlbGxvXCIpLCBbXG4gKiAgIHtcbiAqICAgICB0eXBlOiBcInJlbW92ZWRcIixcbiAqICAgICB2YWx1ZTogXCJIZWxsbyFcXG5cIixcbiAqICAgICBkZXRhaWxzOiBbXG4gKiAgICAgICB7IHR5cGU6IFwiY29tbW9uXCIsIHZhbHVlOiBcIkhlbGxvXCIgfSxcbiAqICAgICAgIHsgdHlwZTogXCJyZW1vdmVkXCIsIHZhbHVlOiBcIiFcIiB9LFxuICogICAgICAgeyB0eXBlOiBcImNvbW1vblwiLCB2YWx1ZTogXCJcXG5cIiB9XG4gKiAgICAgXVxuICogICB9LFxuICogICB7XG4gKiAgICAgdHlwZTogXCJhZGRlZFwiLFxuICogICAgIHZhbHVlOiBcIkhlbGxvXFxuXCIsXG4gKiAgICAgZGV0YWlsczogW1xuICogICAgICAgeyB0eXBlOiBcImNvbW1vblwiLCB2YWx1ZTogXCJIZWxsb1wiIH0sXG4gKiAgICAgICB7IHR5cGU6IFwiY29tbW9uXCIsIHZhbHVlOiBcIlxcblwiIH1cbiAqICAgICBdXG4gKiAgIH1cbiAqIF0pO1xuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkaWZmU3RyKEE6IHN0cmluZywgQjogc3RyaW5nKTogRGlmZlJlc3VsdDxzdHJpbmc+W10ge1xuICAvLyBDb21wdXRlIG11bHRpLWxpbmUgZGlmZlxuICBjb25zdCBkaWZmUmVzdWx0ID0gZGlmZihcbiAgICB0b2tlbml6ZShgJHt1bmVzY2FwZShBKX1cXG5gKSxcbiAgICB0b2tlbml6ZShgJHt1bmVzY2FwZShCKX1cXG5gKSxcbiAgKTtcblxuICBjb25zdCBhZGRlZCA9IFtdO1xuICBjb25zdCByZW1vdmVkID0gW107XG4gIGZvciAoY29uc3QgcmVzdWx0IG9mIGRpZmZSZXN1bHQpIHtcbiAgICBpZiAocmVzdWx0LnR5cGUgPT09IFwiYWRkZWRcIikge1xuICAgICAgYWRkZWQucHVzaChyZXN1bHQpO1xuICAgIH1cbiAgICBpZiAocmVzdWx0LnR5cGUgPT09IFwicmVtb3ZlZFwiKSB7XG4gICAgICByZW1vdmVkLnB1c2gocmVzdWx0KTtcbiAgICB9XG4gIH1cblxuICAvLyBDb21wdXRlIHdvcmQtZGlmZlxuICBjb25zdCBoYXNNb3JlUmVtb3ZlZExpbmVzID0gYWRkZWQubGVuZ3RoIDwgcmVtb3ZlZC5sZW5ndGg7XG4gIGNvbnN0IGFMaW5lcyA9IGhhc01vcmVSZW1vdmVkTGluZXMgPyBhZGRlZCA6IHJlbW92ZWQ7XG4gIGNvbnN0IGJMaW5lcyA9IGhhc01vcmVSZW1vdmVkTGluZXMgPyByZW1vdmVkIDogYWRkZWQ7XG4gIGZvciAoY29uc3QgYSBvZiBhTGluZXMpIHtcbiAgICBsZXQgdG9rZW5zID0gW10gYXMgQXJyYXk8RGlmZlJlc3VsdDxzdHJpbmc+PjtcbiAgICBsZXQgYjogdW5kZWZpbmVkIHwgQ2hhbmdlZERpZmZSZXN1bHQ8c3RyaW5nPjtcbiAgICAvLyBTZWFyY2ggYW5vdGhlciBkaWZmIGxpbmUgd2l0aCBhdCBsZWFzdCBvbmUgY29tbW9uIHRva2VuXG4gICAgd2hpbGUgKGJMaW5lcy5sZW5ndGgpIHtcbiAgICAgIGIgPSBiTGluZXMuc2hpZnQoKTtcbiAgICAgIGNvbnN0IHRva2VuaXplZCA9IFtcbiAgICAgICAgdG9rZW5pemUoYS52YWx1ZSwgdHJ1ZSksXG4gICAgICAgIHRva2VuaXplKGIhLnZhbHVlLCB0cnVlKSxcbiAgICAgIF0gYXMgW3N0cmluZ1tdLCBzdHJpbmdbXV07XG4gICAgICBpZiAoaGFzTW9yZVJlbW92ZWRMaW5lcykgdG9rZW5pemVkLnJldmVyc2UoKTtcbiAgICAgIHRva2VucyA9IGRpZmYodG9rZW5pemVkWzBdLCB0b2tlbml6ZWRbMV0pO1xuICAgICAgaWYgKFxuICAgICAgICB0b2tlbnMuc29tZSgoeyB0eXBlLCB2YWx1ZSB9KSA9PlxuICAgICAgICAgIHR5cGUgPT09IFwiY29tbW9uXCIgJiYgTk9OX1dISVRFU1BBQ0VfUkVHRVhQLnRlc3QodmFsdWUpXG4gICAgICAgIClcbiAgICAgICkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gUmVnaXN0ZXIgd29yZC1kaWZmIGRldGFpbHNcbiAgICBhLmRldGFpbHMgPSBjcmVhdGVEZXRhaWxzKGEsIHRva2Vucyk7XG4gICAgaWYgKGIpIHtcbiAgICAgIGIuZGV0YWlscyA9IGNyZWF0ZURldGFpbHMoYiwgdG9rZW5zKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZGlmZlJlc3VsdDtcbn1cbiIsICIvLyBDb3B5cmlnaHQgMjAxOC0yMDI1IHRoZSBEZW5vIGF1dGhvcnMuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuaW1wb3J0IHsgYnVpbGRNZXNzYWdlIH0gZnJvbSBcImpzcjpAc3RkL2ludGVybmFsQF4xLjAuMTIvYnVpbGQtbWVzc2FnZVwiO1xuaW1wb3J0IHsgZGlmZiB9IGZyb20gXCJqc3I6QHN0ZC9pbnRlcm5hbEBeMS4wLjEyL2RpZmZcIjtcbmltcG9ydCB7IGRpZmZTdHIgfSBmcm9tIFwianNyOkBzdGQvaW50ZXJuYWxAXjEuMC4xMi9kaWZmLXN0clwiO1xuaW1wb3J0IHsgZm9ybWF0IH0gZnJvbSBcImpzcjpAc3RkL2ludGVybmFsQF4xLjAuMTIvZm9ybWF0XCI7XG5pbXBvcnQgeyByZWQgfSBmcm9tIFwianNyOkBzdGQvaW50ZXJuYWxAXjEuMC4xMi9zdHlsZXNcIjtcbmltcG9ydCB7IEFzc2VydGlvbkVycm9yIH0gZnJvbSBcIi4vYXNzZXJ0aW9uX2Vycm9yLnRzXCI7XG5cbi8qKlxuICogTWFrZSBhbiBhc3NlcnRpb24gdGhhdCBgYWN0dWFsYCBhbmQgYGV4cGVjdGVkYCBhcmUgc3RyaWN0bHkgZXF1YWwsIHVzaW5nXG4gKiB7QGxpbmtjb2RlIE9iamVjdC5pc30gZm9yIGVxdWFsaXR5IGNvbXBhcmlzb24uIElmIG5vdCwgdGhlbiB0aHJvdy5cbiAqXG4gKiBAZXhhbXBsZSBVc2FnZVxuICogYGBgdHMgaWdub3JlXG4gKiBpbXBvcnQgeyBhc3NlcnRTdHJpY3RFcXVhbHMgfSBmcm9tIFwiQHN0ZC9hc3NlcnRcIjtcbiAqXG4gKiBjb25zdCBhID0ge307XG4gKiBjb25zdCBiID0gYTtcbiAqIGFzc2VydFN0cmljdEVxdWFscyhhLCBiKTsgLy8gRG9lc24ndCB0aHJvd1xuICpcbiAqIGNvbnN0IGMgPSB7fTtcbiAqIGNvbnN0IGQgPSB7fTtcbiAqIGFzc2VydFN0cmljdEVxdWFscyhjLCBkKTsgLy8gVGhyb3dzXG4gKiBgYGBcbiAqXG4gKiBAdHlwZVBhcmFtIFQgVGhlIHR5cGUgb2YgdGhlIGV4cGVjdGVkIHZhbHVlLlxuICogQHBhcmFtIGFjdHVhbCBUaGUgYWN0dWFsIHZhbHVlIHRvIGNvbXBhcmUuXG4gKiBAcGFyYW0gZXhwZWN0ZWQgVGhlIGV4cGVjdGVkIHZhbHVlIHRvIGNvbXBhcmUuXG4gKiBAcGFyYW0gbXNnIFRoZSBvcHRpb25hbCBtZXNzYWdlIHRvIGRpc3BsYXkgaWYgdGhlIGFzc2VydGlvbiBmYWlscy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydFN0cmljdEVxdWFsczxUPihcbiAgYWN0dWFsOiB1bmtub3duLFxuICBleHBlY3RlZDogVCxcbiAgbXNnPzogc3RyaW5nLFxuKTogYXNzZXJ0cyBhY3R1YWwgaXMgVCB7XG4gIGlmIChPYmplY3QuaXMoYWN0dWFsLCBleHBlY3RlZCkpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBtc2dTdWZmaXggPSBtc2cgPyBgOiAke21zZ31gIDogXCIuXCI7XG4gIGxldCBtZXNzYWdlOiBzdHJpbmc7XG5cbiAgY29uc3QgYWN0dWFsU3RyaW5nID0gZm9ybWF0KGFjdHVhbCk7XG4gIGNvbnN0IGV4cGVjdGVkU3RyaW5nID0gZm9ybWF0KGV4cGVjdGVkKTtcblxuICBpZiAoYWN0dWFsU3RyaW5nID09PSBleHBlY3RlZFN0cmluZykge1xuICAgIGNvbnN0IHdpdGhPZmZzZXQgPSBhY3R1YWxTdHJpbmdcbiAgICAgIC5zcGxpdChcIlxcblwiKVxuICAgICAgLm1hcCgobCkgPT4gYCAgICAke2x9YClcbiAgICAgIC5qb2luKFwiXFxuXCIpO1xuICAgIG1lc3NhZ2UgPVxuICAgICAgYFZhbHVlcyBoYXZlIHRoZSBzYW1lIHN0cnVjdHVyZSBidXQgYXJlIG5vdCByZWZlcmVuY2UtZXF1YWwke21zZ1N1ZmZpeH1cXG5cXG4ke1xuICAgICAgICByZWQod2l0aE9mZnNldClcbiAgICAgIH1cXG5gO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IHN0cmluZ0RpZmYgPSAodHlwZW9mIGFjdHVhbCA9PT0gXCJzdHJpbmdcIikgJiZcbiAgICAgICh0eXBlb2YgZXhwZWN0ZWQgPT09IFwic3RyaW5nXCIpO1xuICAgIGNvbnN0IGRpZmZSZXN1bHQgPSBzdHJpbmdEaWZmXG4gICAgICA/IGRpZmZTdHIoYWN0dWFsIGFzIHN0cmluZywgZXhwZWN0ZWQgYXMgc3RyaW5nKVxuICAgICAgOiBkaWZmKGFjdHVhbFN0cmluZy5zcGxpdChcIlxcblwiKSwgZXhwZWN0ZWRTdHJpbmcuc3BsaXQoXCJcXG5cIikpO1xuICAgIGNvbnN0IGRpZmZNc2cgPSBidWlsZE1lc3NhZ2UoZGlmZlJlc3VsdCwgeyBzdHJpbmdEaWZmIH0sIGFyZ3VtZW50c1szXSlcbiAgICAgIC5qb2luKFwiXFxuXCIpO1xuICAgIG1lc3NhZ2UgPSBgVmFsdWVzIGFyZSBub3Qgc3RyaWN0bHkgZXF1YWwke21zZ1N1ZmZpeH1cXG4ke2RpZmZNc2d9YDtcbiAgfVxuXG4gIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihtZXNzYWdlKTtcbn1cbiIsICIvLyBDb3B5cmlnaHQgMjAxOC0yMDI1IHRoZSBEZW5vIGF1dGhvcnMuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuaW1wb3J0IHsgQXNzZXJ0aW9uRXJyb3IgfSBmcm9tIFwiLi9hc3NlcnRpb25fZXJyb3IudHNcIjtcblxuLyoqIEFueSBjb25zdHJ1Y3RvciAqL1xuLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbmV4cG9ydCB0eXBlIEFueUNvbnN0cnVjdG9yID0gbmV3ICguLi5hcmdzOiBhbnlbXSkgPT4gYW55O1xuLyoqIEdldHMgY29uc3RydWN0b3IgdHlwZSAqL1xuZXhwb3J0IHR5cGUgR2V0Q29uc3RydWN0b3JUeXBlPFQgZXh0ZW5kcyBBbnlDb25zdHJ1Y3Rvcj4gPSBJbnN0YW5jZVR5cGU8VD47XG5cbi8qKlxuICogTWFrZSBhbiBhc3NlcnRpb24gdGhhdCBgb2JqYCBpcyBhbiBpbnN0YW5jZSBvZiBgdHlwZWAuXG4gKiBJZiBub3QgdGhlbiB0aHJvdy5cbiAqXG4gKiBAZXhhbXBsZSBVc2FnZVxuICogYGBgdHMgaWdub3JlXG4gKiBpbXBvcnQgeyBhc3NlcnRJbnN0YW5jZU9mIH0gZnJvbSBcIkBzdGQvYXNzZXJ0XCI7XG4gKlxuICogYXNzZXJ0SW5zdGFuY2VPZihuZXcgRGF0ZSgpLCBEYXRlKTsgLy8gRG9lc24ndCB0aHJvd1xuICogYXNzZXJ0SW5zdGFuY2VPZihuZXcgRGF0ZSgpLCBOdW1iZXIpOyAvLyBUaHJvd3NcbiAqIGBgYFxuICpcbiAqIEB0eXBlUGFyYW0gVCBUaGUgZXhwZWN0ZWQgdHlwZSBvZiB0aGUgb2JqZWN0LlxuICogQHBhcmFtIGFjdHVhbCBUaGUgb2JqZWN0IHRvIGNoZWNrLlxuICogQHBhcmFtIGV4cGVjdGVkVHlwZSBUaGUgZXhwZWN0ZWQgY2xhc3MgY29uc3RydWN0b3IuXG4gKiBAcGFyYW0gbXNnIFRoZSBvcHRpb25hbCBtZXNzYWdlIHRvIGRpc3BsYXkgaWYgdGhlIGFzc2VydGlvbiBmYWlscy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydEluc3RhbmNlT2Y8XG4gIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gIFQgZXh0ZW5kcyBhYnN0cmFjdCBuZXcgKC4uLmFyZ3M6IGFueVtdKSA9PiBhbnksXG4+KFxuICBhY3R1YWw6IHVua25vd24sXG4gIGV4cGVjdGVkVHlwZTogVCxcbiAgbXNnID0gXCJcIixcbik6IGFzc2VydHMgYWN0dWFsIGlzIEluc3RhbmNlVHlwZTxUPiB7XG4gIGlmIChhY3R1YWwgaW5zdGFuY2VvZiBleHBlY3RlZFR5cGUpIHJldHVybjtcblxuICBjb25zdCBtc2dTdWZmaXggPSBtc2cgPyBgOiAke21zZ31gIDogXCIuXCI7XG4gIGNvbnN0IGV4cGVjdGVkVHlwZVN0ciA9IGV4cGVjdGVkVHlwZS5uYW1lO1xuXG4gIGxldCBhY3R1YWxUeXBlU3RyID0gXCJcIjtcbiAgaWYgKGFjdHVhbCA9PT0gbnVsbCkge1xuICAgIGFjdHVhbFR5cGVTdHIgPSBcIm51bGxcIjtcbiAgfSBlbHNlIGlmIChhY3R1YWwgPT09IHVuZGVmaW5lZCkge1xuICAgIGFjdHVhbFR5cGVTdHIgPSBcInVuZGVmaW5lZFwiO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBhY3R1YWwgPT09IFwib2JqZWN0XCIpIHtcbiAgICBhY3R1YWxUeXBlU3RyID0gYWN0dWFsLmNvbnN0cnVjdG9yPy5uYW1lID8/IFwiT2JqZWN0XCI7XG4gIH0gZWxzZSB7XG4gICAgYWN0dWFsVHlwZVN0ciA9IHR5cGVvZiBhY3R1YWw7XG4gIH1cblxuICBpZiAoZXhwZWN0ZWRUeXBlU3RyID09PSBhY3R1YWxUeXBlU3RyKSB7XG4gICAgbXNnID1cbiAgICAgIGBFeHBlY3RlZCBvYmplY3QgdG8gYmUgYW4gaW5zdGFuY2Ugb2YgXCIke2V4cGVjdGVkVHlwZVN0cn1cIiR7bXNnU3VmZml4fWA7XG4gIH0gZWxzZSBpZiAoYWN0dWFsVHlwZVN0ciA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgbXNnID1cbiAgICAgIGBFeHBlY3RlZCBvYmplY3QgdG8gYmUgYW4gaW5zdGFuY2Ugb2YgXCIke2V4cGVjdGVkVHlwZVN0cn1cIiBidXQgd2FzIG5vdCBhbiBpbnN0YW5jZWQgb2JqZWN0JHttc2dTdWZmaXh9YDtcbiAgfSBlbHNlIHtcbiAgICBtc2cgPVxuICAgICAgYEV4cGVjdGVkIG9iamVjdCB0byBiZSBhbiBpbnN0YW5jZSBvZiBcIiR7ZXhwZWN0ZWRUeXBlU3RyfVwiIGJ1dCB3YXMgXCIke2FjdHVhbFR5cGVTdHJ9XCIke21zZ1N1ZmZpeH1gO1xuICB9XG5cbiAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKG1zZyk7XG59XG4iLCAiLy8gQ29weXJpZ2h0IDIwMTgtMjAyNSB0aGUgRGVubyBhdXRob3JzLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cbmltcG9ydCB7IEFzc2VydGlvbkVycm9yIH0gZnJvbSBcImpzcjpAc3RkL2Fzc2VydEBeMS4wLjE0L2Fzc2VydGlvbi1lcnJvclwiO1xuaW1wb3J0IHsgc3RyaXBBbnNpQ29kZSB9IGZyb20gXCJqc3I6QHN0ZC9pbnRlcm5hbEBeMS4wLjEwL3N0eWxlc1wiO1xuXG4vKipcbiAqIE1ha2UgYW4gYXNzZXJ0aW9uIHRoYXQgYGVycm9yYCBpcyBhbiBgRXJyb3JgLlxuICogSWYgbm90IHRoZW4gYW4gZXJyb3Igd2lsbCBiZSB0aHJvd24uXG4gKiBBbiBlcnJvciBjbGFzcyBhbmQgYSBzdHJpbmcgdGhhdCBzaG91bGQgYmUgaW5jbHVkZWQgaW4gdGhlXG4gKiBlcnJvciBtZXNzYWdlIGNhbiBhbHNvIGJlIGFzc2VydGVkLlxuICpcbiAqIEB0eXBlUGFyYW0gRSBUaGUgdHlwZSBvZiB0aGUgZXJyb3IgdG8gYXNzZXJ0LlxuICogQHBhcmFtIGVycm9yIFRoZSBlcnJvciB0byBhc3NlcnQuXG4gKiBAcGFyYW0gRXJyb3JDbGFzcyBUaGUgb3B0aW9uYWwgZXJyb3IgY2xhc3MgdG8gYXNzZXJ0LlxuICogQHBhcmFtIG1zZ01hdGNoZXMgVGhlIG9wdGlvbmFsIHN0cmluZyBvciBSZWdFeHAgdG8gYXNzZXJ0IGluIHRoZSBlcnJvciBtZXNzYWdlLlxuICogQHBhcmFtIG1zZyBUaGUgb3B0aW9uYWwgbWVzc2FnZSB0byBkaXNwbGF5IGlmIHRoZSBhc3NlcnRpb24gZmFpbHMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRJc0Vycm9yPEUgZXh0ZW5kcyBFcnJvciA9IEVycm9yPihcbiAgZXJyb3I6IHVua25vd24sXG4gIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gIEVycm9yQ2xhc3M/OiBhYnN0cmFjdCBuZXcgKC4uLmFyZ3M6IGFueVtdKSA9PiBFLFxuICBtc2dNYXRjaGVzPzogc3RyaW5nIHwgUmVnRXhwLFxuICBtc2c/OiBzdHJpbmcsXG4pOiBhc3NlcnRzIGVycm9yIGlzIEUge1xuICBjb25zdCBtc2dQcmVmaXggPSBtc2cgPyBgJHttc2d9OiBgIDogXCJcIjtcbiAgaWYgKCEoZXJyb3IgaW5zdGFuY2VvZiBFcnJvcikpIHtcbiAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IoXG4gICAgICBgJHttc2dQcmVmaXh9RXhwZWN0ZWQgXCJlcnJvclwiIHRvIGJlIGFuIEVycm9yIG9iamVjdC5gLFxuICAgICk7XG4gIH1cbiAgaWYgKEVycm9yQ2xhc3MgJiYgIShlcnJvciBpbnN0YW5jZW9mIEVycm9yQ2xhc3MpKSB7XG4gICAgbXNnID1cbiAgICAgIGAke21zZ1ByZWZpeH1FeHBlY3RlZCBlcnJvciB0byBiZSBpbnN0YW5jZSBvZiBcIiR7RXJyb3JDbGFzcy5uYW1lfVwiLCBidXQgd2FzIFwiJHtlcnJvcj8uY29uc3RydWN0b3I/Lm5hbWV9XCIuYDtcbiAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IobXNnKTtcbiAgfVxuICBsZXQgbXNnQ2hlY2s7XG4gIGlmICh0eXBlb2YgbXNnTWF0Y2hlcyA9PT0gXCJzdHJpbmdcIikge1xuICAgIG1zZ0NoZWNrID0gc3RyaXBBbnNpQ29kZShlcnJvci5tZXNzYWdlKS5pbmNsdWRlcyhcbiAgICAgIHN0cmlwQW5zaUNvZGUobXNnTWF0Y2hlcyksXG4gICAgKTtcbiAgfVxuICBpZiAobXNnTWF0Y2hlcyBpbnN0YW5jZW9mIFJlZ0V4cCkge1xuICAgIG1zZ0NoZWNrID0gbXNnTWF0Y2hlcy50ZXN0KHN0cmlwQW5zaUNvZGUoZXJyb3IubWVzc2FnZSkpO1xuICB9XG5cbiAgaWYgKG1zZ01hdGNoZXMgJiYgIW1zZ0NoZWNrKSB7XG4gICAgbXNnID0gYCR7bXNnUHJlZml4fUV4cGVjdGVkIGVycm9yIG1lc3NhZ2UgdG8gaW5jbHVkZSAke1xuICAgICAgbXNnTWF0Y2hlcyBpbnN0YW5jZW9mIFJlZ0V4cFxuICAgICAgICA/IG1zZ01hdGNoZXMudG9TdHJpbmcoKVxuICAgICAgICA6IEpTT04uc3RyaW5naWZ5KG1zZ01hdGNoZXMpXG4gICAgfSwgYnV0IGdvdCAke0pTT04uc3RyaW5naWZ5KGVycm9yPy5tZXNzYWdlKX0uYDtcbiAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IobXNnKTtcbiAgfVxufVxuIiwgIi8vIENvcHlyaWdodCAyMDE4LTIwMjUgdGhlIERlbm8gYXV0aG9ycy4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5pbXBvcnQgeyBBc3NlcnRpb25FcnJvciB9IGZyb20gXCIuL2Fzc2VydGlvbl9lcnJvci50c1wiO1xuXG4vKiogQXNzZXJ0aW9uIGNvbmRpdGlvbiBmb3Ige0BsaW5rY29kZSBhc3NlcnRGYWxzZX0uICovXG5leHBvcnQgdHlwZSBGYWxzeSA9IGZhbHNlIHwgMCB8IDBuIHwgXCJcIiB8IG51bGwgfCB1bmRlZmluZWQ7XG5cbi8qKlxuICogTWFrZSBhbiBhc3NlcnRpb24sIGVycm9yIHdpbGwgYmUgdGhyb3duIGlmIGBleHByYCBoYXZlIHRydXRoeSB2YWx1ZS5cbiAqXG4gKiBAZXhhbXBsZSBVc2FnZVxuICogYGBgdHMgaWdub3JlXG4gKiBpbXBvcnQgeyBhc3NlcnRGYWxzZSB9IGZyb20gXCJAc3RkL2Fzc2VydFwiO1xuICpcbiAqIGFzc2VydEZhbHNlKGZhbHNlKTsgLy8gRG9lc24ndCB0aHJvd1xuICogYXNzZXJ0RmFsc2UodHJ1ZSk7IC8vIFRocm93c1xuICogYGBgXG4gKlxuICogQHBhcmFtIGV4cHIgVGhlIGV4cHJlc3Npb24gdG8gdGVzdC5cbiAqIEBwYXJhbSBtc2cgVGhlIG9wdGlvbmFsIG1lc3NhZ2UgdG8gZGlzcGxheSBpZiB0aGUgYXNzZXJ0aW9uIGZhaWxzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0RmFsc2UoZXhwcjogdW5rbm93biwgbXNnID0gXCJcIik6IGFzc2VydHMgZXhwciBpcyBGYWxzeSB7XG4gIGlmIChleHByKSB7XG4gICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKG1zZyk7XG4gIH1cbn1cbiIsICIvLyBDb3B5cmlnaHQgMjAxOC0yMDI1IHRoZSBEZW5vIGF1dGhvcnMuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuaW1wb3J0IHsgYXNzZXJ0RmFsc2UgfSBmcm9tIFwiLi9mYWxzZS50c1wiO1xuXG4vKipcbiAqIE1ha2UgYW4gYXNzZXJ0aW9uIHRoYXQgYG9iamAgaXMgbm90IGFuIGluc3RhbmNlIG9mIGB0eXBlYC5cbiAqIElmIHNvLCB0aGVuIHRocm93LlxuICpcbiAqIEBleGFtcGxlIFVzYWdlXG4gKiBgYGB0cyBpZ25vcmVcbiAqIGltcG9ydCB7IGFzc2VydE5vdEluc3RhbmNlT2YgfSBmcm9tIFwiQHN0ZC9hc3NlcnRcIjtcbiAqXG4gKiBhc3NlcnROb3RJbnN0YW5jZU9mKG5ldyBEYXRlKCksIE51bWJlcik7IC8vIERvZXNuJ3QgdGhyb3dcbiAqIGFzc2VydE5vdEluc3RhbmNlT2YobmV3IERhdGUoKSwgRGF0ZSk7IC8vIFRocm93c1xuICogYGBgXG4gKlxuICogQHR5cGVQYXJhbSBBIFRoZSB0eXBlIG9mIHRoZSBvYmplY3QgdG8gY2hlY2suXG4gKiBAdHlwZVBhcmFtIFQgVGhlIHR5cGUgb2YgdGhlIGNsYXNzIHRvIGNoZWNrIGFnYWluc3QuXG4gKiBAcGFyYW0gYWN0dWFsIFRoZSBvYmplY3QgdG8gY2hlY2suXG4gKiBAcGFyYW0gdW5leHBlY3RlZFR5cGUgVGhlIGNsYXNzIGNvbnN0cnVjdG9yIHRvIGNoZWNrIGFnYWluc3QuXG4gKiBAcGFyYW0gbXNnIFRoZSBvcHRpb25hbCBtZXNzYWdlIHRvIGRpc3BsYXkgaWYgdGhlIGFzc2VydGlvbiBmYWlscy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydE5vdEluc3RhbmNlT2Y8QSwgVD4oXG4gIGFjdHVhbDogQSxcbiAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgdW5leHBlY3RlZFR5cGU6IGFic3RyYWN0IG5ldyAoLi4uYXJnczogYW55W10pID0+IFQsXG4gIG1zZz86IHN0cmluZyxcbik6IGFzc2VydHMgYWN0dWFsIGlzIEV4Y2x1ZGU8QSwgVD4ge1xuICBjb25zdCBtc2dTdWZmaXggPSBtc2cgPyBgOiAke21zZ31gIDogXCIuXCI7XG4gIG1zZyA9XG4gICAgYEV4cGVjdGVkIG9iamVjdCB0byBub3QgYmUgYW4gaW5zdGFuY2Ugb2YgXCIke3R5cGVvZiB1bmV4cGVjdGVkVHlwZX1cIiR7bXNnU3VmZml4fWA7XG4gIGFzc2VydEZhbHNlKGFjdHVhbCBpbnN0YW5jZW9mIHVuZXhwZWN0ZWRUeXBlLCBtc2cpO1xufVxuIiwgIi8vIENvcHlyaWdodCAyMDE4LTIwMjUgdGhlIERlbm8gYXV0aG9ycy4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5pbXBvcnQgeyBBc3NlcnRpb25FcnJvciB9IGZyb20gXCIuL2Fzc2VydGlvbl9lcnJvci50c1wiO1xuXG4vKipcbiAqIE1ha2UgYW4gYXNzZXJ0aW9uIHRoYXQgYGFjdHVhbGAgbWF0Y2ggUmVnRXhwIGBleHBlY3RlZGAuIElmIG5vdFxuICogdGhlbiB0aHJvdy5cbiAqXG4gKiBAZXhhbXBsZSBVc2FnZVxuICogYGBgdHMgaWdub3JlXG4gKiBpbXBvcnQgeyBhc3NlcnRNYXRjaCB9IGZyb20gXCJAc3RkL2Fzc2VydFwiO1xuICpcbiAqIGFzc2VydE1hdGNoKFwiUmFwdG9yXCIsIC9SYXB0b3IvKTsgLy8gRG9lc24ndCB0aHJvd1xuICogYXNzZXJ0TWF0Y2goXCJEZW5vc2F1cnVzXCIsIC9SYXB0b3IvKTsgLy8gVGhyb3dzXG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0gYWN0dWFsIFRoZSBhY3R1YWwgdmFsdWUgdG8gYmUgbWF0Y2hlZC5cbiAqIEBwYXJhbSBleHBlY3RlZCBUaGUgZXhwZWN0ZWQgcGF0dGVybiB0byBtYXRjaC5cbiAqIEBwYXJhbSBtc2cgVGhlIG9wdGlvbmFsIG1lc3NhZ2UgdG8gZGlzcGxheSBpZiB0aGUgYXNzZXJ0aW9uIGZhaWxzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0TWF0Y2goXG4gIGFjdHVhbDogc3RyaW5nLFxuICBleHBlY3RlZDogUmVnRXhwLFxuICBtc2c/OiBzdHJpbmcsXG4pIHtcbiAgaWYgKGV4cGVjdGVkLnRlc3QoYWN0dWFsKSkgcmV0dXJuO1xuICBjb25zdCBtc2dTdWZmaXggPSBtc2cgPyBgOiAke21zZ31gIDogXCIuXCI7XG4gIG1zZyA9IGBFeHBlY3RlZCBhY3R1YWw6IFwiJHthY3R1YWx9XCIgdG8gbWF0Y2g6IFwiJHtleHBlY3RlZH1cIiR7bXNnU3VmZml4fWA7XG4gIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihtc2cpO1xufVxuIiwgIi8vIENvcHlyaWdodCAyMDE4LTIwMjUgdGhlIERlbm8gYXV0aG9ycy4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5pbXBvcnQgeyBBc3NlcnRpb25FcnJvciB9IGZyb20gXCIuL2Fzc2VydGlvbl9lcnJvci50c1wiO1xuXG4vKipcbiAqIE1ha2UgYW4gYXNzZXJ0aW9uIHRoYXQgYGFjdHVhbGAgbm90IG1hdGNoIFJlZ0V4cCBgZXhwZWN0ZWRgLiBJZiBtYXRjaFxuICogdGhlbiB0aHJvdy5cbiAqXG4gKiBAZXhhbXBsZSBVc2FnZVxuICogYGBgdHMgaWdub3JlXG4gKiBpbXBvcnQgeyBhc3NlcnROb3RNYXRjaCB9IGZyb20gXCJAc3RkL2Fzc2VydFwiO1xuICpcbiAqIGFzc2VydE5vdE1hdGNoKFwiRGVub3NhdXJ1c1wiLCAvUmFwdG9yLyk7IC8vIERvZXNuJ3QgdGhyb3dcbiAqIGFzc2VydE5vdE1hdGNoKFwiUmFwdG9yXCIsIC9SYXB0b3IvKTsgLy8gVGhyb3dzXG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0gYWN0dWFsIFRoZSBhY3R1YWwgdmFsdWUgdG8gbWF0Y2guXG4gKiBAcGFyYW0gZXhwZWN0ZWQgVGhlIGV4cGVjdGVkIHZhbHVlIHRvIG5vdCBtYXRjaC5cbiAqIEBwYXJhbSBtc2cgVGhlIG9wdGlvbmFsIG1lc3NhZ2UgdG8gZGlzcGxheSBpZiB0aGUgYXNzZXJ0aW9uIGZhaWxzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0Tm90TWF0Y2goXG4gIGFjdHVhbDogc3RyaW5nLFxuICBleHBlY3RlZDogUmVnRXhwLFxuICBtc2c/OiBzdHJpbmcsXG4pIHtcbiAgaWYgKCFleHBlY3RlZC50ZXN0KGFjdHVhbCkpIHJldHVybjtcbiAgY29uc3QgbXNnU3VmZml4ID0gbXNnID8gYDogJHttc2d9YCA6IFwiLlwiO1xuICBtc2cgPSBgRXhwZWN0ZWQgYWN0dWFsOiBcIiR7YWN0dWFsfVwiIHRvIG5vdCBtYXRjaDogXCIke2V4cGVjdGVkfVwiJHttc2dTdWZmaXh9YDtcbiAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKG1zZyk7XG59XG4iLCAiLy8gQ29weXJpZ2h0IDIwMTgtMjAyNSB0aGUgRGVubyBhdXRob3JzLiBNSVQgbGljZW5zZS5cblxuaW1wb3J0IHsgYnVpbGRNZXNzYWdlIH0gZnJvbSBcImpzcjpAc3RkL2ludGVybmFsQF4xLjAuMTAvYnVpbGQtbWVzc2FnZVwiO1xuaW1wb3J0IHsgZGlmZiB9IGZyb20gXCJqc3I6QHN0ZC9pbnRlcm5hbEBeMS4wLjEwL2RpZmZcIjtcbmltcG9ydCB7IGRpZmZTdHIgfSBmcm9tIFwianNyOkBzdGQvaW50ZXJuYWxAXjEuMC4xMC9kaWZmLXN0clwiO1xuaW1wb3J0IHsgZm9ybWF0IH0gZnJvbSBcImpzcjpAc3RkL2ludGVybmFsQF4xLjAuMTAvZm9ybWF0XCI7XG5pbXBvcnQgdHlwZSB7IEVxdWFsT3B0aW9ucyB9IGZyb20gXCIuL190eXBlcy50c1wiO1xuXG50eXBlIEVxdWFsRXJyb3JNZXNzYWdlT3B0aW9ucyA9IFBpY2s8XG4gIEVxdWFsT3B0aW9ucyxcbiAgXCJmb3JtYXR0ZXJcIiB8IFwibXNnXCJcbj47XG5cbmZ1bmN0aW9uIGlzU3RyaW5nKHZhbHVlOiB1bmtub3duKTogdmFsdWUgaXMgc3RyaW5nIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkRXF1YWxFcnJvck1lc3NhZ2U8VD4oXG4gIGFjdHVhbDogVCxcbiAgZXhwZWN0ZWQ6IFQsXG4gIG9wdGlvbnM6IEVxdWFsRXJyb3JNZXNzYWdlT3B0aW9ucyA9IHt9LFxuKTogc3RyaW5nIHtcbiAgY29uc3QgeyBmb3JtYXR0ZXIgPSBmb3JtYXQsIG1zZyB9ID0gb3B0aW9ucztcbiAgY29uc3QgbXNnUHJlZml4ID0gbXNnID8gYCR7bXNnfTogYCA6IFwiXCI7XG4gIGNvbnN0IGFjdHVhbFN0cmluZyA9IGZvcm1hdHRlcihhY3R1YWwpO1xuICBjb25zdCBleHBlY3RlZFN0cmluZyA9IGZvcm1hdHRlcihleHBlY3RlZCk7XG5cbiAgbGV0IG1lc3NhZ2UgPSBgJHttc2dQcmVmaXh9VmFsdWVzIGFyZSBub3QgZXF1YWwuYDtcblxuICBjb25zdCBzdHJpbmdEaWZmID0gaXNTdHJpbmcoYWN0dWFsKSAmJiBpc1N0cmluZyhleHBlY3RlZCk7XG4gIGNvbnN0IGRpZmZSZXN1bHQgPSBzdHJpbmdEaWZmXG4gICAgPyBkaWZmU3RyKGFjdHVhbCwgZXhwZWN0ZWQpXG4gICAgOiBkaWZmKGFjdHVhbFN0cmluZy5zcGxpdChcIlxcblwiKSwgZXhwZWN0ZWRTdHJpbmcuc3BsaXQoXCJcXG5cIikpO1xuICBjb25zdCBkaWZmTXNnID0gYnVpbGRNZXNzYWdlKGRpZmZSZXN1bHQsIHsgc3RyaW5nRGlmZiB9KS5qb2luKFwiXFxuXCIpO1xuICBtZXNzYWdlID0gYCR7bWVzc2FnZX1cXG4ke2RpZmZNc2d9YDtcblxuICByZXR1cm4gbWVzc2FnZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkTm90RXF1YWxFcnJvck1lc3NhZ2U8VD4oXG4gIGFjdHVhbDogVCxcbiAgZXhwZWN0ZWQ6IFQsXG4gIG9wdGlvbnM6IEVxdWFsRXJyb3JNZXNzYWdlT3B0aW9ucyA9IHt9LFxuKTogc3RyaW5nIHtcbiAgY29uc3QgeyBmb3JtYXR0ZXIgPSBmb3JtYXQsIG1zZyB9ID0gb3B0aW9ucztcbiAgY29uc3QgYWN0dWFsU3RyaW5nID0gZm9ybWF0dGVyKGFjdHVhbCk7XG4gIGNvbnN0IGV4cGVjdGVkU3RyaW5nID0gZm9ybWF0dGVyKGV4cGVjdGVkKTtcblxuICBjb25zdCBtc2dQcmVmaXggPSBtc2cgPyBgJHttc2d9OiBgIDogXCJcIjtcbiAgcmV0dXJuIGAke21zZ1ByZWZpeH1FeHBlY3RlZCBhY3R1YWw6ICR7YWN0dWFsU3RyaW5nfSBub3QgdG8gYmU6ICR7ZXhwZWN0ZWRTdHJpbmd9LmA7XG59XG4iLCAiLy8gQ29weXJpZ2h0IDIwMTgtMjAyNSB0aGUgRGVubyBhdXRob3JzLiBNSVQgbGljZW5zZS5cblxuLy8gVGhpcyBmaWxlIGlzIGNvcGllZCBmcm9tIGBzdGQvYXNzZXJ0YC5cblxuaW1wb3J0IHsgQXNzZXJ0aW9uRXJyb3IgfSBmcm9tIFwianNyOkBzdGQvYXNzZXJ0QF4xLjAuMTQvYXNzZXJ0aW9uLWVycm9yXCI7XG5pbXBvcnQgeyBidWlsZEVxdWFsRXJyb3JNZXNzYWdlIH0gZnJvbSBcIi4vX2J1aWxkX21lc3NhZ2UudHNcIjtcbmltcG9ydCB7IGVxdWFsIH0gZnJvbSBcIi4vX2VxdWFsLnRzXCI7XG5pbXBvcnQgdHlwZSB7IEVxdWFsT3B0aW9ucyB9IGZyb20gXCIuL190eXBlcy50c1wiO1xuXG4vKipcbiAqIE1ha2UgYW4gYXNzZXJ0aW9uIHRoYXQgYGFjdHVhbGAgYW5kIGBleHBlY3RlZGAgYXJlIGVxdWFsLCBkZWVwbHkuIElmIG5vdFxuICogZGVlcGx5IGVxdWFsLCB0aGVuIHRocm93LlxuICpcbiAqIFR5cGUgcGFyYW1ldGVyIGNhbiBiZSBzcGVjaWZpZWQgdG8gZW5zdXJlIHZhbHVlcyB1bmRlciBjb21wYXJpc29uIGhhdmUgdGhlXG4gKiBzYW1lIHR5cGUuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHRzIGlnbm9yZVxuICogaW1wb3J0IHsgYXNzZXJ0RXF1YWxzIH0gZnJvbSBcIkBzdGQvYXNzZXJ0XCI7XG4gKlxuICogYXNzZXJ0RXF1YWxzKFwid29ybGRcIiwgXCJ3b3JsZFwiKTsgLy8gRG9lc24ndCB0aHJvd1xuICogYXNzZXJ0RXF1YWxzKFwiaGVsbG9cIiwgXCJ3b3JsZFwiKTsgLy8gVGhyb3dzXG4gKiBgYGBcbiAqXG4gKiBOb3RlOiBmb3JtYXR0ZXIgb3B0aW9uIGlzIGV4cGVyaW1lbnRhbCBhbmQgbWF5IGJlIHJlbW92ZWQgaW4gdGhlIGZ1dHVyZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydEVxdWFsczxUPihcbiAgYWN0dWFsOiBULFxuICBleHBlY3RlZDogVCxcbiAgb3B0aW9ucz86IEVxdWFsT3B0aW9ucyxcbikge1xuICBpZiAoZXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgb3B0aW9ucykpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBtZXNzYWdlID0gYnVpbGRFcXVhbEVycm9yTWVzc2FnZShhY3R1YWwsIGV4cGVjdGVkLCBvcHRpb25zID8/IHt9KTtcbiAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKG1lc3NhZ2UpO1xufVxuIiwgIi8vIENvcHlyaWdodCAyMDE4LTIwMjUgdGhlIERlbm8gYXV0aG9ycy4gTUlUIGxpY2Vuc2UuXG5cbi8vIFRoaXMgZmlsZSBpcyBjb3BpZWQgZnJvbSBgc3RkL2Fzc2VydGAuXG5cbmltcG9ydCB7IEFzc2VydGlvbkVycm9yIH0gZnJvbSBcImpzcjpAc3RkL2Fzc2VydEBeMS4wLjE0L2Fzc2VydGlvbi1lcnJvclwiO1xuaW1wb3J0IHsgYnVpbGROb3RFcXVhbEVycm9yTWVzc2FnZSB9IGZyb20gXCIuL19idWlsZF9tZXNzYWdlLnRzXCI7XG5pbXBvcnQgeyBlcXVhbCB9IGZyb20gXCIuL19lcXVhbC50c1wiO1xuaW1wb3J0IHR5cGUgeyBFcXVhbE9wdGlvbnMgfSBmcm9tIFwiLi9fdHlwZXMudHNcIjtcblxuLyoqXG4gKiBNYWtlIGFuIGFzc2VydGlvbiB0aGF0IGBhY3R1YWxgIGFuZCBgZXhwZWN0ZWRgIGFyZSBub3QgZXF1YWwsIGRlZXBseS5cbiAqIElmIG5vdCB0aGVuIHRocm93LlxuICpcbiAqIFR5cGUgcGFyYW1ldGVyIGNhbiBiZSBzcGVjaWZpZWQgdG8gZW5zdXJlIHZhbHVlcyB1bmRlciBjb21wYXJpc29uIGhhdmUgdGhlIHNhbWUgdHlwZS5cbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHMgaWdub3JlXG4gKiBpbXBvcnQgeyBhc3NlcnROb3RFcXVhbHMgfSBmcm9tIFwiQHN0ZC9hc3NlcnRcIjtcbiAqXG4gKiBhc3NlcnROb3RFcXVhbHMoMSwgMik7IC8vIERvZXNuJ3QgdGhyb3dcbiAqIGFzc2VydE5vdEVxdWFscygxLCAxKTsgLy8gVGhyb3dzXG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydE5vdEVxdWFsczxUPihcbiAgYWN0dWFsOiBULFxuICBleHBlY3RlZDogVCxcbiAgb3B0aW9uczogRXF1YWxPcHRpb25zID0ge30sXG4pIHtcbiAgaWYgKCFlcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBvcHRpb25zKSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IG1lc3NhZ2UgPSBidWlsZE5vdEVxdWFsRXJyb3JNZXNzYWdlKGFjdHVhbCwgZXhwZWN0ZWQsIG9wdGlvbnMgPz8ge30pO1xuICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IobWVzc2FnZSk7XG59XG4iLCAiLy8gQ29weXJpZ2h0IDIwMTgtMjAyNSB0aGUgRGVubyBhdXRob3JzLiBNSVQgbGljZW5zZS5cbi8vIGRlbm8tbGludC1pZ25vcmUtZmlsZSBuby1leHBsaWNpdC1hbnlcblxuZXhwb3J0IGNvbnN0IE1PQ0tfU1lNQk9MID0gU3ltYm9sLmZvcihcIkBNT0NLXCIpO1xuXG5leHBvcnQgdHlwZSBNb2NrQ2FsbCA9IHtcbiAgYXJnczogYW55W107XG4gIHJldHVybmVkPzogYW55O1xuICB0aHJvd24/OiBhbnk7XG4gIHRpbWVzdGFtcDogbnVtYmVyO1xuICByZXR1cm5zOiBib29sZWFuO1xuICB0aHJvd3M6IGJvb2xlYW47XG59O1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TW9ja0NhbGxzKGY6IGFueSk6IE1vY2tDYWxsW10ge1xuICBjb25zdCBtb2NrSW5mbyA9IGZbTU9DS19TWU1CT0xdO1xuICBpZiAoIW1vY2tJbmZvKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiUmVjZWl2ZWQgZnVuY3Rpb24gbXVzdCBiZSBhIG1vY2sgb3Igc3B5IGZ1bmN0aW9uXCIpO1xuICB9XG5cbiAgcmV0dXJuIFsuLi5tb2NrSW5mby5jYWxsc107XG59XG4iLCAiLy8gQ29weXJpZ2h0IDIwMTgtMjAyNSB0aGUgRGVubyBhdXRob3JzLiBNSVQgbGljZW5zZS5cbi8vIGRlbm8tbGludC1pZ25vcmUtZmlsZVxuXG5leHBvcnQgZnVuY3Rpb24gaW5zcGVjdEFyZ3MoYXJnczogdW5rbm93bltdKTogc3RyaW5nIHtcbiAgcmV0dXJuIGFyZ3MubWFwKGluc3BlY3RBcmcpLmpvaW4oXCIsIFwiKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGluc3BlY3RBcmcoYXJnOiB1bmtub3duKTogc3RyaW5nIHtcbiAgY29uc3QgeyBEZW5vIH0gPSBnbG9iYWxUaGlzIGFzIGFueTtcbiAgcmV0dXJuIHR5cGVvZiBEZW5vICE9PSBcInVuZGVmaW5lZFwiICYmIERlbm8uaW5zcGVjdFxuICAgID8gRGVuby5pbnNwZWN0KGFyZylcbiAgICA6IFN0cmluZyhhcmcpO1xufVxuIiwgIi8vIENvcHlyaWdodCAyMDE4LTIwMjUgdGhlIERlbm8gYXV0aG9ycy4gTUlUIGxpY2Vuc2UuXG4vLyBDb3B5cmlnaHQgKGMpIE1ldGEgUGxhdGZvcm1zLCBJbmMuIGFuZCBhZmZpbGlhdGVzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cblxuaW1wb3J0IHR5cGUgeyBFcXVhbE9wdGlvbnMsIEVxdWFsT3B0aW9uVXRpbCB9IGZyb20gXCIuL190eXBlcy50c1wiO1xuaW1wb3J0IHR5cGUgeyBUZXN0ZXIgfSBmcm9tIFwiLi9fdHlwZXMudHNcIjtcbmltcG9ydCB7IGVxdWFsIH0gZnJvbSBcIi4vX2VxdWFsLnRzXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiBidWlsZEVxdWFsT3B0aW9ucyhvcHRpb25zOiBFcXVhbE9wdGlvblV0aWwpOiBFcXVhbE9wdGlvbnMge1xuICBjb25zdCB7IGN1c3RvbU1lc3NhZ2UsIGN1c3RvbVRlc3RlcnMgPSBbXSwgc3RyaWN0Q2hlY2sgfSA9IG9wdGlvbnMgPz8ge307XG4gIGNvbnN0IHJldDogRXF1YWxPcHRpb25zID0ge1xuICAgIGN1c3RvbVRlc3RlcnMsXG4gIH07XG4gIGlmIChjdXN0b21NZXNzYWdlICE9PSB1bmRlZmluZWQpIHtcbiAgICByZXQubXNnID0gY3VzdG9tTWVzc2FnZTtcbiAgfVxuICBpZiAoc3RyaWN0Q2hlY2sgIT09IHVuZGVmaW5lZCkge1xuICAgIHJldC5zdHJpY3RDaGVjayA9IHN0cmljdENoZWNrO1xuICB9XG4gIHJldHVybiByZXQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1Byb21pc2VMaWtlKHZhbHVlOiB1bmtub3duKTogdmFsdWUgaXMgUHJvbWlzZUxpa2U8dW5rbm93bj4ge1xuICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gdHlwZW9mICgodmFsdWUgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4pLnRoZW4pID09PSBcImZ1bmN0aW9uXCI7XG4gIH1cbn1cblxuLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbmV4cG9ydCBmdW5jdGlvbiBoYXNJdGVyYXRvcihvYmplY3Q6IGFueSkge1xuICByZXR1cm4gISEob2JqZWN0ICE9IG51bGwgJiYgb2JqZWN0W1N5bWJvbC5pdGVyYXRvcl0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNBPFQ+KHR5cGVOYW1lOiBzdHJpbmcsIHZhbHVlOiB1bmtub3duKTogdmFsdWUgaXMgVCB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmFwcGx5KHZhbHVlKSA9PT0gYFtvYmplY3QgJHt0eXBlTmFtZX1dYDtcbn1cblxuZnVuY3Rpb24gaXNPYmplY3QoYTogdW5rbm93bikge1xuICByZXR1cm4gYSAhPT0gbnVsbCAmJiB0eXBlb2YgYSA9PT0gXCJvYmplY3RcIjtcbn1cblxuZnVuY3Rpb24gaXNPYmplY3RXaXRoS2V5cyhhOiB1bmtub3duKSB7XG4gIHJldHVybiAoXG4gICAgaXNPYmplY3QoYSkgJiZcbiAgICAhKGEgaW5zdGFuY2VvZiBFcnJvcikgJiZcbiAgICAhQXJyYXkuaXNBcnJheShhKSAmJlxuICAgICEoYSBpbnN0YW5jZW9mIERhdGUpICYmXG4gICAgIShhIGluc3RhbmNlb2YgU2V0KSAmJlxuICAgICEoYSBpbnN0YW5jZW9mIE1hcClcbiAgKTtcbn1cblxuZnVuY3Rpb24gZ2V0T2JqZWN0S2V5cyhvYmplY3Q6IG9iamVjdCk6IEFycmF5PHN0cmluZyB8IHN5bWJvbD4ge1xuICByZXR1cm4gW1xuICAgIC4uLk9iamVjdC5rZXlzKG9iamVjdCksXG4gICAgLi4uT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhvYmplY3QpLmZpbHRlcihcbiAgICAgIChzKSA9PiBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKG9iamVjdCwgcyk/LmVudW1lcmFibGUsXG4gICAgKSxcbiAgXTtcbn1cblxuZnVuY3Rpb24gaGFzUHJvcGVydHlJbk9iamVjdChvYmplY3Q6IG9iamVjdCwga2V5OiBzdHJpbmcgfCBzeW1ib2wpOiBib29sZWFuIHtcbiAgY29uc3Qgc2hvdWxkVGVybWluYXRlID0gIW9iamVjdCB8fCB0eXBlb2Ygb2JqZWN0ICE9PSBcIm9iamVjdFwiIHx8XG4gICAgb2JqZWN0ID09PSBPYmplY3QucHJvdG90eXBlO1xuXG4gIGlmIChzaG91bGRUZXJtaW5hdGUpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICByZXR1cm4gKFxuICAgIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIGtleSkgfHxcbiAgICBoYXNQcm9wZXJ0eUluT2JqZWN0KE9iamVjdC5nZXRQcm90b3R5cGVPZihvYmplY3QpLCBrZXkpXG4gICk7XG59XG5cbi8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG5mdW5jdGlvbiBlbnRyaWVzKG9iajogYW55KSB7XG4gIGlmICghaXNPYmplY3Qob2JqKSkgcmV0dXJuIFtdO1xuXG4gIHJldHVybiBPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKG9iailcbiAgICAuZmlsdGVyKChrZXkpID0+IGtleSAhPT0gU3ltYm9sLml0ZXJhdG9yKVxuICAgIC5tYXAoKGtleSkgPT4gW2tleSwgb2JqW2tleSBhcyBrZXlvZiB0eXBlb2Ygb2JqXV0pXG4gICAgLmNvbmNhdChPYmplY3QuZW50cmllcyhvYmopKTtcbn1cblxuLy8gUG9ydGVkIGZyb20gaHR0cHM6Ly9naXRodWIuY29tL2plc3Rqcy9qZXN0L2Jsb2IvNDQyYzdmNjkyZTNhOTJmMTRhMmZiNTZjMTczN2IyNmZjNjYzYTBlZi9wYWNrYWdlcy9leHBlY3QtdXRpbHMvc3JjL3V0aWxzLnRzI0wxNzNcbmV4cG9ydCBmdW5jdGlvbiBpdGVyYWJsZUVxdWFsaXR5KFxuICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICBhOiBhbnksXG4gIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gIGI6IGFueSxcbiAgY3VzdG9tVGVzdGVyczogVGVzdGVyW10gPSBbXSxcbiAgYVN0YWNrOiB1bmtub3duW10gPSBbXSxcbiAgYlN0YWNrOiB1bmtub3duW10gPSBbXSxcbik6IGJvb2xlYW4gfCB1bmRlZmluZWQge1xuICBpZiAoXG4gICAgdHlwZW9mIGEgIT09IFwib2JqZWN0XCIgfHxcbiAgICB0eXBlb2YgYiAhPT0gXCJvYmplY3RcIiB8fFxuICAgIEFycmF5LmlzQXJyYXkoYSkgfHxcbiAgICBBcnJheS5pc0FycmF5KGIpIHx8XG4gICAgIWhhc0l0ZXJhdG9yKGEpIHx8XG4gICAgIWhhc0l0ZXJhdG9yKGIpXG4gICkge1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cbiAgaWYgKGEuY29uc3RydWN0b3IgIT09IGIuY29uc3RydWN0b3IpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgbGV0IGxlbmd0aCA9IGFTdGFjay5sZW5ndGg7XG4gIHdoaWxlIChsZW5ndGgtLSkge1xuICAgIC8vIExpbmVhciBzZWFyY2guIFBlcmZvcm1hbmNlIGlzIGludmVyc2VseSBwcm9wb3J0aW9uYWwgdG8gdGhlIG51bWJlciBvZlxuICAgIC8vIHVuaXF1ZSBuZXN0ZWQgc3RydWN0dXJlcy5cbiAgICAvLyBjaXJjdWxhciByZWZlcmVuY2VzIGF0IHNhbWUgZGVwdGggYXJlIGVxdWFsXG4gICAgLy8gY2lyY3VsYXIgcmVmZXJlbmNlIGlzIG5vdCBlcXVhbCB0byBub24tY2lyY3VsYXIgb25lXG4gICAgaWYgKGFTdGFja1tsZW5ndGhdID09PSBhKSB7XG4gICAgICByZXR1cm4gYlN0YWNrW2xlbmd0aF0gPT09IGI7XG4gICAgfVxuICB9XG4gIGFTdGFjay5wdXNoKGEpO1xuICBiU3RhY2sucHVzaChiKTtcblxuICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICBjb25zdCBpdGVyYWJsZUVxdWFsaXR5V2l0aFN0YWNrID0gKGE6IGFueSwgYjogYW55KSA9PlxuICAgIGl0ZXJhYmxlRXF1YWxpdHkoXG4gICAgICBhLFxuICAgICAgYixcbiAgICAgIFsuLi5maWx0ZXJlZEN1c3RvbVRlc3RlcnNdLFxuICAgICAgWy4uLmFTdGFja10sXG4gICAgICBbLi4uYlN0YWNrXSxcbiAgICApO1xuXG4gIC8vIFJlcGxhY2UgYW55IGluc3RhbmNlIG9mIGl0ZXJhYmxlRXF1YWxpdHkgd2l0aCB0aGUgbmV3XG4gIC8vIGl0ZXJhYmxlRXF1YWxpdHlXaXRoU3RhY2sgc28gd2UgY2FuIGRvIGNpcmN1bGFyIGRldGVjdGlvblxuICBjb25zdCBmaWx0ZXJlZEN1c3RvbVRlc3RlcnM6IFRlc3RlcltdID0gW1xuICAgIC4uLmN1c3RvbVRlc3RlcnMuZmlsdGVyKCh0KSA9PiB0ICE9PSBpdGVyYWJsZUVxdWFsaXR5KSxcbiAgICBpdGVyYWJsZUVxdWFsaXR5V2l0aFN0YWNrLFxuICBdO1xuXG4gIGlmIChhLnNpemUgIT09IHVuZGVmaW5lZCkge1xuICAgIGlmIChhLnNpemUgIT09IGIuc2l6ZSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0gZWxzZSBpZiAoaXNBPFNldDx1bmtub3duPj4oXCJTZXRcIiwgYSkpIHtcbiAgICAgIGxldCBhbGxGb3VuZCA9IHRydWU7XG4gICAgICBmb3IgKGNvbnN0IGFWYWx1ZSBvZiBhKSB7XG4gICAgICAgIGlmICghYi5oYXMoYVZhbHVlKSkge1xuICAgICAgICAgIGxldCBoYXMgPSBmYWxzZTtcbiAgICAgICAgICBmb3IgKGNvbnN0IGJWYWx1ZSBvZiBiKSB7XG4gICAgICAgICAgICBjb25zdCBpc0VxdWFsID0gZXF1YWwoYVZhbHVlLCBiVmFsdWUsIHtcbiAgICAgICAgICAgICAgY3VzdG9tVGVzdGVyczogZmlsdGVyZWRDdXN0b21UZXN0ZXJzLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAoaXNFcXVhbCA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICBoYXMgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChoYXMgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICBhbGxGb3VuZCA9IGZhbHNlO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICAvLyBSZW1vdmUgdGhlIGZpcnN0IHZhbHVlIGZyb20gdGhlIHN0YWNrIG9mIHRyYXZlcnNlZCB2YWx1ZXMuXG4gICAgICBhU3RhY2sucG9wKCk7XG4gICAgICBiU3RhY2sucG9wKCk7XG4gICAgICByZXR1cm4gYWxsRm91bmQ7XG4gICAgfSBlbHNlIGlmIChpc0E8TWFwPHVua25vd24sIHVua25vd24+PihcIk1hcFwiLCBhKSkge1xuICAgICAgbGV0IGFsbEZvdW5kID0gdHJ1ZTtcbiAgICAgIGZvciAoY29uc3QgYUVudHJ5IG9mIGEpIHtcbiAgICAgICAgaWYgKFxuICAgICAgICAgICFiLmhhcyhhRW50cnlbMF0pIHx8XG4gICAgICAgICAgIWVxdWFsKGFFbnRyeVsxXSwgYi5nZXQoYUVudHJ5WzBdKSwge1xuICAgICAgICAgICAgY3VzdG9tVGVzdGVyczogZmlsdGVyZWRDdXN0b21UZXN0ZXJzLFxuICAgICAgICAgIH0pXG4gICAgICAgICkge1xuICAgICAgICAgIGxldCBoYXMgPSBmYWxzZTtcbiAgICAgICAgICBmb3IgKGNvbnN0IGJFbnRyeSBvZiBiKSB7XG4gICAgICAgICAgICBjb25zdCBtYXRjaGVkS2V5ID0gZXF1YWwoXG4gICAgICAgICAgICAgIGFFbnRyeVswXSxcbiAgICAgICAgICAgICAgYkVudHJ5WzBdLFxuICAgICAgICAgICAgICB7IGN1c3RvbVRlc3RlcnM6IGZpbHRlcmVkQ3VzdG9tVGVzdGVycyB9LFxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgbGV0IG1hdGNoZWRWYWx1ZSA9IGZhbHNlO1xuICAgICAgICAgICAgaWYgKG1hdGNoZWRLZXkgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgbWF0Y2hlZFZhbHVlID0gZXF1YWwoXG4gICAgICAgICAgICAgICAgYUVudHJ5WzFdLFxuICAgICAgICAgICAgICAgIGJFbnRyeVsxXSxcbiAgICAgICAgICAgICAgICB7IGN1c3RvbVRlc3RlcnM6IGZpbHRlcmVkQ3VzdG9tVGVzdGVycyB9LFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG1hdGNoZWRWYWx1ZSA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICBoYXMgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChoYXMgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICBhbGxGb3VuZCA9IGZhbHNlO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICAvLyBSZW1vdmUgdGhlIGZpcnN0IHZhbHVlIGZyb20gdGhlIHN0YWNrIG9mIHRyYXZlcnNlZCB2YWx1ZXMuXG4gICAgICBhU3RhY2sucG9wKCk7XG4gICAgICBiU3RhY2sucG9wKCk7XG4gICAgICByZXR1cm4gYWxsRm91bmQ7XG4gICAgfVxuICB9XG5cbiAgY29uc3QgYkl0ZXJhdG9yID0gYltTeW1ib2wuaXRlcmF0b3JdKCk7XG5cbiAgZm9yIChjb25zdCBhVmFsdWUgb2YgYSkge1xuICAgIGNvbnN0IG5leHRCID0gYkl0ZXJhdG9yLm5leHQoKTtcbiAgICBpZiAoXG4gICAgICBuZXh0Qi5kb25lIHx8XG4gICAgICAhZXF1YWwoYVZhbHVlLCBuZXh0Qi52YWx1ZSwgeyBjdXN0b21UZXN0ZXJzOiBmaWx0ZXJlZEN1c3RvbVRlc3RlcnMgfSlcbiAgICApIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgaWYgKCFiSXRlcmF0b3IubmV4dCgpLmRvbmUpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBjb25zdCBhRW50cmllcyA9IGVudHJpZXMoYSk7XG4gIGNvbnN0IGJFbnRyaWVzID0gZW50cmllcyhiKTtcbiAgaWYgKCFlcXVhbChhRW50cmllcywgYkVudHJpZXMpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLy8gUmVtb3ZlIHRoZSBmaXJzdCB2YWx1ZSBmcm9tIHRoZSBzdGFjayBvZiB0cmF2ZXJzZWQgdmFsdWVzLlxuICBhU3RhY2sucG9wKCk7XG4gIGJTdGFjay5wb3AoKTtcbiAgcmV0dXJuIHRydWU7XG59XG5cbi8vIFBvcnRlZCBmcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS9qZXN0anMvamVzdC9ibG9iLzQ0MmM3ZjY5MmUzYTkyZjE0YTJmYjU2YzE3MzdiMjZmYzY2M2EwZWYvcGFja2FnZXMvZXhwZWN0LXV0aWxzL3NyYy91dGlscy50cyNMMzQxXG5leHBvcnQgZnVuY3Rpb24gc3Vic2V0RXF1YWxpdHkoXG4gIG9iamVjdDogdW5rbm93bixcbiAgc3Vic2V0OiB1bmtub3duLFxuICBjdXN0b21UZXN0ZXJzOiBUZXN0ZXJbXSA9IFtdLFxuKTogYm9vbGVhbiB8IHVuZGVmaW5lZCB7XG4gIGNvbnN0IGZpbHRlcmVkQ3VzdG9tVGVzdGVycyA9IGN1c3RvbVRlc3RlcnMuZmlsdGVyKCh0KSA9PlxuICAgIHQgIT09IHN1YnNldEVxdWFsaXR5XG4gICk7XG5cbiAgY29uc3Qgc3Vic2V0RXF1YWxpdHlXaXRoQ29udGV4dCA9XG4gICAgKHNlZW5SZWZlcmVuY2VzOiBXZWFrTWFwPG9iamVjdCwgYm9vbGVhbj4gPSBuZXcgV2Vha01hcCgpKSA9PlxuICAgIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gICAgKG9iamVjdDogYW55LCBzdWJzZXQ6IGFueSk6IGJvb2xlYW4gfCB1bmRlZmluZWQgPT4ge1xuICAgICAgaWYgKCFpc09iamVjdFdpdGhLZXlzKHN1YnNldCkpIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgIH1cblxuICAgICAgaWYgKHNlZW5SZWZlcmVuY2VzLmhhcyhzdWJzZXQpKSByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgc2VlblJlZmVyZW5jZXMuc2V0KHN1YnNldCwgdHJ1ZSk7XG5cbiAgICAgIGNvbnN0IG1hdGNoUmVzdWx0ID0gZ2V0T2JqZWN0S2V5cyhzdWJzZXQpLmV2ZXJ5KChrZXkpID0+IHtcbiAgICAgICAgaWYgKGlzT2JqZWN0V2l0aEtleXMoc3Vic2V0W2tleV0pKSB7XG4gICAgICAgICAgaWYgKHNlZW5SZWZlcmVuY2VzLmhhcyhzdWJzZXRba2V5XSkpIHtcbiAgICAgICAgICAgIHJldHVybiBlcXVhbChvYmplY3Rba2V5XSwgc3Vic2V0W2tleV0sIHtcbiAgICAgICAgICAgICAgY3VzdG9tVGVzdGVyczogZmlsdGVyZWRDdXN0b21UZXN0ZXJzLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IG9iamVjdCAhPSBudWxsICYmXG4gICAgICAgICAgaGFzUHJvcGVydHlJbk9iamVjdChvYmplY3QsIGtleSkgJiZcbiAgICAgICAgICBlcXVhbChvYmplY3Rba2V5XSwgc3Vic2V0W2tleV0sIHtcbiAgICAgICAgICAgIGN1c3RvbVRlc3RlcnM6IFtcbiAgICAgICAgICAgICAgLi4uZmlsdGVyZWRDdXN0b21UZXN0ZXJzLFxuICAgICAgICAgICAgICBzdWJzZXRFcXVhbGl0eVdpdGhDb250ZXh0KHNlZW5SZWZlcmVuY2VzKSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSk7XG4gICAgICAgIHNlZW5SZWZlcmVuY2VzLmRlbGV0ZShzdWJzZXRba2V5XSk7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICB9KTtcbiAgICAgIHNlZW5SZWZlcmVuY2VzLmRlbGV0ZShzdWJzZXQpO1xuXG4gICAgICByZXR1cm4gbWF0Y2hSZXN1bHQ7XG4gICAgfTtcblxuICByZXR1cm4gc3Vic2V0RXF1YWxpdHlXaXRoQ29udGV4dCgpKG9iamVjdCwgc3Vic2V0KTtcbn1cbiIsICIvLyBDb3B5cmlnaHQgMjAxOC0yMDI1IHRoZSBEZW5vIGF1dGhvcnMuIE1JVCBsaWNlbnNlLlxuXG5pbXBvcnQgeyBhc3NlcnROb3RTdHJpY3RFcXVhbHMgfSBmcm9tIFwianNyOkBzdGQvYXNzZXJ0QF4xLjAuMTQvbm90LXN0cmljdC1lcXVhbHNcIjtcbmltcG9ydCB7IGFzc2VydFN0cmljdEVxdWFscyB9IGZyb20gXCJqc3I6QHN0ZC9hc3NlcnRAXjEuMC4xNC9zdHJpY3QtZXF1YWxzXCI7XG5pbXBvcnQgeyBhc3NlcnRJbnN0YW5jZU9mIH0gZnJvbSBcImpzcjpAc3RkL2Fzc2VydEBeMS4wLjE0L2luc3RhbmNlLW9mXCI7XG5pbXBvcnQgeyBhc3NlcnRJc0Vycm9yIH0gZnJvbSBcIi4vX2Fzc2VydF9pc19lcnJvci50c1wiO1xuaW1wb3J0IHsgYXNzZXJ0Tm90SW5zdGFuY2VPZiB9IGZyb20gXCJqc3I6QHN0ZC9hc3NlcnRAXjEuMC4xNC9ub3QtaW5zdGFuY2Utb2ZcIjtcbmltcG9ydCB7IGFzc2VydE1hdGNoIH0gZnJvbSBcImpzcjpAc3RkL2Fzc2VydEBeMS4wLjE0L21hdGNoXCI7XG5pbXBvcnQgeyBhc3NlcnROb3RNYXRjaCB9IGZyb20gXCJqc3I6QHN0ZC9hc3NlcnRAXjEuMC4xNC9ub3QtbWF0Y2hcIjtcbmltcG9ydCB7IEFzc2VydGlvbkVycm9yIH0gZnJvbSBcImpzcjpAc3RkL2Fzc2VydEBeMS4wLjE0L2Fzc2VydGlvbi1lcnJvclwiO1xuXG5pbXBvcnQgeyBhc3NlcnRFcXVhbHMgfSBmcm9tIFwiLi9fYXNzZXJ0X2VxdWFscy50c1wiO1xuaW1wb3J0IHsgYXNzZXJ0Tm90RXF1YWxzIH0gZnJvbSBcIi4vX2Fzc2VydF9ub3RfZXF1YWxzLnRzXCI7XG5pbXBvcnQgeyBlcXVhbCB9IGZyb20gXCIuL19lcXVhbC50c1wiO1xuaW1wb3J0IHsgZm9ybWF0IH0gZnJvbSBcImpzcjpAc3RkL2ludGVybmFsQF4xLjAuMTAvZm9ybWF0XCI7XG5pbXBvcnQgdHlwZSB7IEFueUNvbnN0cnVjdG9yLCBNYXRjaGVyQ29udGV4dCwgTWF0Y2hSZXN1bHQgfSBmcm9tIFwiLi9fdHlwZXMudHNcIjtcbmltcG9ydCB7IGdldE1vY2tDYWxscyB9IGZyb20gXCIuL19tb2NrX3V0aWwudHNcIjtcbmltcG9ydCB7IGluc3BlY3RBcmcsIGluc3BlY3RBcmdzIH0gZnJvbSBcIi4vX2luc3BlY3RfYXJncy50c1wiO1xuaW1wb3J0IHtcbiAgYnVpbGRFcXVhbE9wdGlvbnMsXG4gIGl0ZXJhYmxlRXF1YWxpdHksXG4gIHN1YnNldEVxdWFsaXR5LFxufSBmcm9tIFwiLi9fdXRpbHMudHNcIjtcbmltcG9ydCB7XG4gIGJ1aWxkRXF1YWxFcnJvck1lc3NhZ2UsXG4gIGJ1aWxkTm90RXF1YWxFcnJvck1lc3NhZ2UsXG59IGZyb20gXCIuL19idWlsZF9tZXNzYWdlLnRzXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiB0b0JlKGNvbnRleHQ6IE1hdGNoZXJDb250ZXh0LCBleHBlY3Q6IHVua25vd24pOiBNYXRjaFJlc3VsdCB7XG4gIGlmIChjb250ZXh0LmlzTm90KSB7XG4gICAgYXNzZXJ0Tm90U3RyaWN0RXF1YWxzKGNvbnRleHQudmFsdWUsIGV4cGVjdCwgY29udGV4dC5jdXN0b21NZXNzYWdlKTtcbiAgfSBlbHNlIHtcbiAgICBhc3NlcnRTdHJpY3RFcXVhbHMoY29udGV4dC52YWx1ZSwgZXhwZWN0LCBjb250ZXh0LmN1c3RvbU1lc3NhZ2UpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0b0VxdWFsKFxuICBjb250ZXh0OiBNYXRjaGVyQ29udGV4dCxcbiAgZXhwZWN0ZWQ6IHVua25vd24sXG4pOiBNYXRjaFJlc3VsdCB7XG4gIGNvbnN0IHYgPSBjb250ZXh0LnZhbHVlO1xuICBjb25zdCBlID0gZXhwZWN0ZWQ7XG4gIGNvbnN0IGVxdWFsc09wdGlvbnMgPSBidWlsZEVxdWFsT3B0aW9ucyh7XG4gICAgLi4uY29udGV4dCxcbiAgICBjdXN0b21UZXN0ZXJzOiBbXG4gICAgICAuLi5jb250ZXh0LmN1c3RvbVRlc3RlcnMsXG4gICAgICBpdGVyYWJsZUVxdWFsaXR5LFxuICAgIF0sXG4gIH0pO1xuXG4gIGlmIChjb250ZXh0LmlzTm90KSB7XG4gICAgYXNzZXJ0Tm90RXF1YWxzKHYsIGUsIGVxdWFsc09wdGlvbnMpO1xuICB9IGVsc2Uge1xuICAgIGFzc2VydEVxdWFscyh2LCBlLCBlcXVhbHNPcHRpb25zKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gdG9TdHJpY3RFcXVhbChcbiAgY29udGV4dDogTWF0Y2hlckNvbnRleHQsXG4gIGV4cGVjdGVkOiB1bmtub3duLFxuKTogTWF0Y2hSZXN1bHQge1xuICBjb25zdCBlcXVhbHNPcHRpb25zID0gYnVpbGRFcXVhbE9wdGlvbnMoe1xuICAgIC4uLmNvbnRleHQsXG4gICAgc3RyaWN0Q2hlY2s6IHRydWUsXG4gICAgY3VzdG9tVGVzdGVyczogW1xuICAgICAgLi4uY29udGV4dC5jdXN0b21UZXN0ZXJzLFxuICAgICAgaXRlcmFibGVFcXVhbGl0eSxcbiAgICBdLFxuICB9KTtcblxuICBpZiAoY29udGV4dC5pc05vdCkge1xuICAgIGFzc2VydE5vdEVxdWFscyhjb250ZXh0LnZhbHVlLCBleHBlY3RlZCwgZXF1YWxzT3B0aW9ucyk7XG4gIH0gZWxzZSB7XG4gICAgYXNzZXJ0RXF1YWxzKGNvbnRleHQudmFsdWUsIGV4cGVjdGVkLCBlcXVhbHNPcHRpb25zKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gdG9CZUNsb3NlVG8oXG4gIGNvbnRleHQ6IE1hdGNoZXJDb250ZXh0LFxuICBleHBlY3RlZDogbnVtYmVyLFxuICBudW1EaWdpdHMgPSAyLFxuKTogTWF0Y2hSZXN1bHQge1xuICBpZiAobnVtRGlnaXRzIDwgMCkge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgIFwidG9CZUNsb3NlVG8gc2Vjb25kIGFyZ3VtZW50IG11c3QgYmUgYSBub24tbmVnYXRpdmUgaW50ZWdlci4gR290IFwiICtcbiAgICAgICAgbnVtRGlnaXRzLFxuICAgICk7XG4gIH1cbiAgY29uc3QgdG9sZXJhbmNlID0gMC41ICogTWF0aC5wb3coMTAsIC1udW1EaWdpdHMpO1xuICBjb25zdCB2YWx1ZSA9IE51bWJlcihjb250ZXh0LnZhbHVlKTtcbiAgY29uc3QgcGFzcyA9IE1hdGguYWJzKGV4cGVjdGVkIC0gdmFsdWUpIDwgdG9sZXJhbmNlO1xuXG4gIGlmIChjb250ZXh0LmlzTm90KSB7XG4gICAgaWYgKHBhc3MpIHtcbiAgICAgIGNvbnN0IGRlZmF1bHRNZXNzYWdlID1cbiAgICAgICAgYEV4cGVjdGVkIHRoZSB2YWx1ZSAke3ZhbHVlfSBub3QgdG8gYmUgY2xvc2UgdG8gJHtleHBlY3RlZH0gKHVzaW5nICR7bnVtRGlnaXRzfSBkaWdpdHMpLCBidXQgaXQgaXNgO1xuICAgICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKFxuICAgICAgICBjb250ZXh0LmN1c3RvbU1lc3NhZ2VcbiAgICAgICAgICA/IGAke2NvbnRleHQuY3VzdG9tTWVzc2FnZX06ICR7ZGVmYXVsdE1lc3NhZ2V9YFxuICAgICAgICAgIDogZGVmYXVsdE1lc3NhZ2UsXG4gICAgICApO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoIXBhc3MpIHtcbiAgICAgIGNvbnN0IGRlZmF1bHRNZXNzYWdlID1cbiAgICAgICAgYEV4cGVjdGVkIHRoZSB2YWx1ZSAke3ZhbHVlfSB0byBiZSBjbG9zZSB0byAke2V4cGVjdGVkfSAodXNpbmcgJHtudW1EaWdpdHN9IGRpZ2l0cyksIGJ1dCBpdCBpcyBub3RgO1xuICAgICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKFxuICAgICAgICBjb250ZXh0LmN1c3RvbU1lc3NhZ2VcbiAgICAgICAgICA/IGAke2NvbnRleHQuY3VzdG9tTWVzc2FnZX06ICR7ZGVmYXVsdE1lc3NhZ2V9YFxuICAgICAgICAgIDogZGVmYXVsdE1lc3NhZ2UsXG4gICAgICApO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gdG9CZURlZmluZWQoY29udGV4dDogTWF0Y2hlckNvbnRleHQpOiBNYXRjaFJlc3VsdCB7XG4gIGlmIChjb250ZXh0LmlzTm90KSB7XG4gICAgYXNzZXJ0U3RyaWN0RXF1YWxzKGNvbnRleHQudmFsdWUsIHVuZGVmaW5lZCwgY29udGV4dC5jdXN0b21NZXNzYWdlKTtcbiAgfSBlbHNlIHtcbiAgICBhc3NlcnROb3RTdHJpY3RFcXVhbHMoY29udGV4dC52YWx1ZSwgdW5kZWZpbmVkLCBjb250ZXh0LmN1c3RvbU1lc3NhZ2UpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0b0JlVW5kZWZpbmVkKGNvbnRleHQ6IE1hdGNoZXJDb250ZXh0KTogTWF0Y2hSZXN1bHQge1xuICBpZiAoY29udGV4dC5pc05vdCkge1xuICAgIGFzc2VydE5vdFN0cmljdEVxdWFscyhcbiAgICAgIGNvbnRleHQudmFsdWUsXG4gICAgICB1bmRlZmluZWQsXG4gICAgICBjb250ZXh0LmN1c3RvbU1lc3NhZ2UsXG4gICAgKTtcbiAgfSBlbHNlIHtcbiAgICBhc3NlcnRTdHJpY3RFcXVhbHMoY29udGV4dC52YWx1ZSwgdW5kZWZpbmVkLCBjb250ZXh0LmN1c3RvbU1lc3NhZ2UpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0b0JlRmFsc3koXG4gIGNvbnRleHQ6IE1hdGNoZXJDb250ZXh0LFxuKTogTWF0Y2hSZXN1bHQge1xuICBjb25zdCBpc0ZhbHN5ID0gIShjb250ZXh0LnZhbHVlKTtcbiAgaWYgKGNvbnRleHQuaXNOb3QpIHtcbiAgICBpZiAoaXNGYWxzeSkge1xuICAgICAgY29uc3QgZGVmYXVsdE1lc3NhZ2UgPSBgRXhwZWN0ZWQgJHtjb250ZXh0LnZhbHVlfSB0byBOT1QgYmUgZmFsc3lgO1xuICAgICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKFxuICAgICAgICBjb250ZXh0LmN1c3RvbU1lc3NhZ2VcbiAgICAgICAgICA/IGAke2NvbnRleHQuY3VzdG9tTWVzc2FnZX06ICR7ZGVmYXVsdE1lc3NhZ2V9YFxuICAgICAgICAgIDogZGVmYXVsdE1lc3NhZ2UsXG4gICAgICApO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoIWlzRmFsc3kpIHtcbiAgICAgIGNvbnN0IGRlZmF1bHRNZXNzYWdlID0gYEV4cGVjdGVkICR7Y29udGV4dC52YWx1ZX0gdG8gYmUgZmFsc3lgO1xuICAgICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKFxuICAgICAgICBjb250ZXh0LmN1c3RvbU1lc3NhZ2VcbiAgICAgICAgICA/IGAke2NvbnRleHQuY3VzdG9tTWVzc2FnZX06ICR7ZGVmYXVsdE1lc3NhZ2V9YFxuICAgICAgICAgIDogZGVmYXVsdE1lc3NhZ2UsXG4gICAgICApO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gdG9CZVRydXRoeShcbiAgY29udGV4dDogTWF0Y2hlckNvbnRleHQsXG4pOiBNYXRjaFJlc3VsdCB7XG4gIGNvbnN0IGlzVHJ1dGh5ID0gISEoY29udGV4dC52YWx1ZSk7XG4gIGlmIChjb250ZXh0LmlzTm90KSB7XG4gICAgaWYgKGlzVHJ1dGh5KSB7XG4gICAgICBjb25zdCBkZWZhdWx0TWVzc2FnZSA9IGBFeHBlY3RlZCAke2NvbnRleHQudmFsdWV9IHRvIE5PVCBiZSB0cnV0aHlgO1xuICAgICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKFxuICAgICAgICBjb250ZXh0LmN1c3RvbU1lc3NhZ2VcbiAgICAgICAgICA/IGAke2NvbnRleHQuY3VzdG9tTWVzc2FnZX06ICR7ZGVmYXVsdE1lc3NhZ2V9YFxuICAgICAgICAgIDogZGVmYXVsdE1lc3NhZ2UsXG4gICAgICApO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoIWlzVHJ1dGh5KSB7XG4gICAgICBjb25zdCBkZWZhdWx0TWVzc2FnZSA9IGBFeHBlY3RlZCAke2NvbnRleHQudmFsdWV9IHRvIGJlIHRydXRoeWA7XG4gICAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IoXG4gICAgICAgIGNvbnRleHQuY3VzdG9tTWVzc2FnZVxuICAgICAgICAgID8gYCR7Y29udGV4dC5jdXN0b21NZXNzYWdlfTogJHtkZWZhdWx0TWVzc2FnZX1gXG4gICAgICAgICAgOiBkZWZhdWx0TWVzc2FnZSxcbiAgICAgICk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0b0JlR3JlYXRlclRoYW5PckVxdWFsKFxuICBjb250ZXh0OiBNYXRjaGVyQ29udGV4dCxcbiAgZXhwZWN0ZWQ6IG51bWJlcixcbik6IE1hdGNoUmVzdWx0IHtcbiAgY29uc3QgaXNHcmVhdGVyT3JFcXVhbCA9IE51bWJlcihjb250ZXh0LnZhbHVlKSA+PSBOdW1iZXIoZXhwZWN0ZWQpO1xuICBpZiAoY29udGV4dC5pc05vdCkge1xuICAgIGlmIChpc0dyZWF0ZXJPckVxdWFsKSB7XG4gICAgICBjb25zdCBkZWZhdWx0TWVzc2FnZSA9XG4gICAgICAgIGBFeHBlY3RlZCAke2NvbnRleHQudmFsdWV9IHRvIE5PVCBiZSBncmVhdGVyIHRoYW4gb3IgZXF1YWwgJHtleHBlY3RlZH1gO1xuICAgICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKFxuICAgICAgICBjb250ZXh0LmN1c3RvbU1lc3NhZ2VcbiAgICAgICAgICA/IGAke2NvbnRleHQuY3VzdG9tTWVzc2FnZX06ICR7ZGVmYXVsdE1lc3NhZ2V9YFxuICAgICAgICAgIDogZGVmYXVsdE1lc3NhZ2UsXG4gICAgICApO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoIWlzR3JlYXRlck9yRXF1YWwpIHtcbiAgICAgIGNvbnN0IGRlZmF1bHRNZXNzYWdlID1cbiAgICAgICAgYEV4cGVjdGVkICR7Y29udGV4dC52YWx1ZX0gdG8gYmUgZ3JlYXRlciB0aGFuIG9yIGVxdWFsICR7ZXhwZWN0ZWR9YDtcbiAgICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihcbiAgICAgICAgY29udGV4dC5jdXN0b21NZXNzYWdlXG4gICAgICAgICAgPyBgJHtjb250ZXh0LmN1c3RvbU1lc3NhZ2V9OiAke2RlZmF1bHRNZXNzYWdlfWBcbiAgICAgICAgICA6IGRlZmF1bHRNZXNzYWdlLFxuICAgICAgKTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRvQmVHcmVhdGVyVGhhbihcbiAgY29udGV4dDogTWF0Y2hlckNvbnRleHQsXG4gIGV4cGVjdGVkOiBudW1iZXIsXG4pOiBNYXRjaFJlc3VsdCB7XG4gIGNvbnN0IGlzR3JlYXRlciA9IE51bWJlcihjb250ZXh0LnZhbHVlKSA+IE51bWJlcihleHBlY3RlZCk7XG4gIGlmIChjb250ZXh0LmlzTm90KSB7XG4gICAgaWYgKGlzR3JlYXRlcikge1xuICAgICAgY29uc3QgZGVmYXVsdE1lc3NhZ2UgPVxuICAgICAgICBgRXhwZWN0ZWQgJHtjb250ZXh0LnZhbHVlfSB0byBOT1QgYmUgZ3JlYXRlciB0aGFuICR7ZXhwZWN0ZWR9YDtcbiAgICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihcbiAgICAgICAgY29udGV4dC5jdXN0b21NZXNzYWdlXG4gICAgICAgICAgPyBgJHtjb250ZXh0LmN1c3RvbU1lc3NhZ2V9OiAke2RlZmF1bHRNZXNzYWdlfWBcbiAgICAgICAgICA6IGRlZmF1bHRNZXNzYWdlLFxuICAgICAgKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKCFpc0dyZWF0ZXIpIHtcbiAgICAgIGNvbnN0IGRlZmF1bHRNZXNzYWdlID1cbiAgICAgICAgYEV4cGVjdGVkICR7Y29udGV4dC52YWx1ZX0gdG8gYmUgZ3JlYXRlciB0aGFuICR7ZXhwZWN0ZWR9YDtcbiAgICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihcbiAgICAgICAgY29udGV4dC5jdXN0b21NZXNzYWdlXG4gICAgICAgICAgPyBgJHtjb250ZXh0LmN1c3RvbU1lc3NhZ2V9OiAke2RlZmF1bHRNZXNzYWdlfWBcbiAgICAgICAgICA6IGRlZmF1bHRNZXNzYWdlLFxuICAgICAgKTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRvQmVJbnN0YW5jZU9mPFQgZXh0ZW5kcyBBbnlDb25zdHJ1Y3Rvcj4oXG4gIGNvbnRleHQ6IE1hdGNoZXJDb250ZXh0LFxuICBleHBlY3RlZDogVCxcbik6IE1hdGNoUmVzdWx0IHtcbiAgaWYgKGNvbnRleHQuaXNOb3QpIHtcbiAgICBhc3NlcnROb3RJbnN0YW5jZU9mKGNvbnRleHQudmFsdWUsIGV4cGVjdGVkKTtcbiAgfSBlbHNlIHtcbiAgICBhc3NlcnRJbnN0YW5jZU9mKGNvbnRleHQudmFsdWUsIGV4cGVjdGVkKTtcbiAgfVxufVxuZXhwb3J0IGZ1bmN0aW9uIHRvQmVMZXNzVGhhbk9yRXF1YWwoXG4gIGNvbnRleHQ6IE1hdGNoZXJDb250ZXh0LFxuICBleHBlY3RlZDogbnVtYmVyLFxuKTogTWF0Y2hSZXN1bHQge1xuICBjb25zdCBpc0xvd2VyID0gTnVtYmVyKGNvbnRleHQudmFsdWUpIDw9IE51bWJlcihleHBlY3RlZCk7XG4gIGlmIChjb250ZXh0LmlzTm90KSB7XG4gICAgaWYgKGlzTG93ZXIpIHtcbiAgICAgIGNvbnN0IGRlZmF1bHRNZXNzYWdlID1cbiAgICAgICAgYEV4cGVjdGVkICR7Y29udGV4dC52YWx1ZX0gdG8gTk9UIGJlIGxvd2VyIHRoYW4gb3IgZXF1YWwgJHtleHBlY3RlZH1gO1xuICAgICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKFxuICAgICAgICBjb250ZXh0LmN1c3RvbU1lc3NhZ2VcbiAgICAgICAgICA/IGAke2NvbnRleHQuY3VzdG9tTWVzc2FnZX06ICR7ZGVmYXVsdE1lc3NhZ2V9YFxuICAgICAgICAgIDogZGVmYXVsdE1lc3NhZ2UsXG4gICAgICApO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoIWlzTG93ZXIpIHtcbiAgICAgIGNvbnN0IGRlZmF1bHRNZXNzYWdlID1cbiAgICAgICAgYEV4cGVjdGVkICR7Y29udGV4dC52YWx1ZX0gdG8gYmUgbG93ZXIgdGhhbiBvciBlcXVhbCAke2V4cGVjdGVkfWA7XG4gICAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IoXG4gICAgICAgIGNvbnRleHQuY3VzdG9tTWVzc2FnZVxuICAgICAgICAgID8gYCR7Y29udGV4dC5jdXN0b21NZXNzYWdlfTogJHtkZWZhdWx0TWVzc2FnZX1gXG4gICAgICAgICAgOiBkZWZhdWx0TWVzc2FnZSxcbiAgICAgICk7XG4gICAgfVxuICB9XG59XG5leHBvcnQgZnVuY3Rpb24gdG9CZUxlc3NUaGFuKFxuICBjb250ZXh0OiBNYXRjaGVyQ29udGV4dCxcbiAgZXhwZWN0ZWQ6IG51bWJlcixcbik6IE1hdGNoUmVzdWx0IHtcbiAgY29uc3QgaXNMb3dlciA9IE51bWJlcihjb250ZXh0LnZhbHVlKSA8IE51bWJlcihleHBlY3RlZCk7XG4gIGlmIChjb250ZXh0LmlzTm90KSB7XG4gICAgaWYgKGlzTG93ZXIpIHtcbiAgICAgIGNvbnN0IGRlZmF1bHRNZXNzYWdlID1cbiAgICAgICAgYEV4cGVjdGVkICR7Y29udGV4dC52YWx1ZX0gdG8gTk9UIGJlIGxvd2VyIHRoYW4gJHtleHBlY3RlZH1gO1xuICAgICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKFxuICAgICAgICBjb250ZXh0LmN1c3RvbU1lc3NhZ2VcbiAgICAgICAgICA/IGAke2NvbnRleHQuY3VzdG9tTWVzc2FnZX06ICR7ZGVmYXVsdE1lc3NhZ2V9YFxuICAgICAgICAgIDogZGVmYXVsdE1lc3NhZ2UsXG4gICAgICApO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoIWlzTG93ZXIpIHtcbiAgICAgIGNvbnN0IGRlZmF1bHRNZXNzYWdlID1cbiAgICAgICAgYEV4cGVjdGVkICR7Y29udGV4dC52YWx1ZX0gdG8gYmUgbG93ZXIgdGhhbiAke2V4cGVjdGVkfWA7XG4gICAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IoXG4gICAgICAgIGNvbnRleHQuY3VzdG9tTWVzc2FnZVxuICAgICAgICAgID8gYCR7Y29udGV4dC5jdXN0b21NZXNzYWdlfTogJHtkZWZhdWx0TWVzc2FnZX1gXG4gICAgICAgICAgOiBkZWZhdWx0TWVzc2FnZSxcbiAgICAgICk7XG4gICAgfVxuICB9XG59XG5leHBvcnQgZnVuY3Rpb24gdG9CZU5hTihjb250ZXh0OiBNYXRjaGVyQ29udGV4dCk6IE1hdGNoUmVzdWx0IHtcbiAgY29uc3QgZXF1YWxzT3B0aW9ucyA9IGJ1aWxkRXF1YWxPcHRpb25zKGNvbnRleHQpO1xuICBpZiAoY29udGV4dC5pc05vdCkge1xuICAgIGFzc2VydE5vdEVxdWFscyhcbiAgICAgIGlzTmFOKE51bWJlcihjb250ZXh0LnZhbHVlKSksXG4gICAgICB0cnVlLFxuICAgICAge1xuICAgICAgICAuLi5lcXVhbHNPcHRpb25zLFxuICAgICAgICBtc2c6IGVxdWFsc09wdGlvbnMubXNnIHx8IGBFeHBlY3RlZCAke2NvbnRleHQudmFsdWV9IHRvIG5vdCBiZSBOYU5gLFxuICAgICAgfSxcbiAgICApO1xuICB9IGVsc2Uge1xuICAgIGFzc2VydEVxdWFscyhcbiAgICAgIGlzTmFOKE51bWJlcihjb250ZXh0LnZhbHVlKSksXG4gICAgICB0cnVlLFxuICAgICAge1xuICAgICAgICAuLi5lcXVhbHNPcHRpb25zLFxuICAgICAgICBtc2c6IGVxdWFsc09wdGlvbnMubXNnIHx8IGBFeHBlY3RlZCAke2NvbnRleHQudmFsdWV9IHRvIGJlIE5hTmAsXG4gICAgICB9LFxuICAgICk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRvQmVOdWxsKGNvbnRleHQ6IE1hdGNoZXJDb250ZXh0KTogTWF0Y2hSZXN1bHQge1xuICBpZiAoY29udGV4dC5pc05vdCkge1xuICAgIGFzc2VydE5vdFN0cmljdEVxdWFscyhcbiAgICAgIGNvbnRleHQudmFsdWUgYXMgbnVtYmVyLFxuICAgICAgbnVsbCxcbiAgICAgIGNvbnRleHQuY3VzdG9tTWVzc2FnZSB8fCBgRXhwZWN0ZWQgJHtjb250ZXh0LnZhbHVlfSB0byBub3QgYmUgbnVsbGAsXG4gICAgKTtcbiAgfSBlbHNlIHtcbiAgICBhc3NlcnRTdHJpY3RFcXVhbHMoXG4gICAgICBjb250ZXh0LnZhbHVlIGFzIG51bWJlcixcbiAgICAgIG51bGwsXG4gICAgICBjb250ZXh0LmN1c3RvbU1lc3NhZ2UgfHwgYEV4cGVjdGVkICR7Y29udGV4dC52YWx1ZX0gdG8gYmUgbnVsbGAsXG4gICAgKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gdG9IYXZlTGVuZ3RoKFxuICBjb250ZXh0OiBNYXRjaGVyQ29udGV4dCxcbiAgZXhwZWN0ZWQ6IG51bWJlcixcbik6IE1hdGNoUmVzdWx0IHtcbiAgY29uc3QgeyB2YWx1ZSB9ID0gY29udGV4dDtcbiAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgY29uc3QgbWF5YmVMZW5ndGggPSAodmFsdWUgYXMgYW55KT8ubGVuZ3RoO1xuICBjb25zdCBoYXNMZW5ndGggPSBtYXliZUxlbmd0aCA9PT0gZXhwZWN0ZWQ7XG5cbiAgaWYgKGNvbnRleHQuaXNOb3QpIHtcbiAgICBpZiAoaGFzTGVuZ3RoKSB7XG4gICAgICBjb25zdCBkZWZhdWx0TWVzc2FnZSA9XG4gICAgICAgIGBFeHBlY3RlZCB2YWx1ZSBub3QgdG8gaGF2ZSBsZW5ndGggJHtleHBlY3RlZH0sIGJ1dCBpdCBkb2VzYDtcbiAgICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihcbiAgICAgICAgY29udGV4dC5jdXN0b21NZXNzYWdlXG4gICAgICAgICAgPyBgJHtjb250ZXh0LmN1c3RvbU1lc3NhZ2V9OiAke2RlZmF1bHRNZXNzYWdlfWBcbiAgICAgICAgICA6IGRlZmF1bHRNZXNzYWdlLFxuICAgICAgKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKCFoYXNMZW5ndGgpIHtcbiAgICAgIGNvbnN0IGRlZmF1bHRNZXNzYWdlID1cbiAgICAgICAgYEV4cGVjdGVkIHZhbHVlIHRvIGhhdmUgbGVuZ3RoICR7ZXhwZWN0ZWR9LCBidXQgaXQgZG9lcyBub3Q6IHRoZSB2YWx1ZSBoYXMgbGVuZ3RoICR7bWF5YmVMZW5ndGh9YDtcbiAgICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihcbiAgICAgICAgY29udGV4dC5jdXN0b21NZXNzYWdlXG4gICAgICAgICAgPyBgJHtjb250ZXh0LmN1c3RvbU1lc3NhZ2V9OiAke2RlZmF1bHRNZXNzYWdlfWBcbiAgICAgICAgICA6IGRlZmF1bHRNZXNzYWdlLFxuICAgICAgKTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRvSGF2ZVByb3BlcnR5KFxuICBjb250ZXh0OiBNYXRjaGVyQ29udGV4dCxcbiAgcHJvcE5hbWU6IHN0cmluZyB8IHN0cmluZ1tdLFxuICB2PzogdW5rbm93bixcbik6IE1hdGNoUmVzdWx0IHtcbiAgY29uc3QgeyB2YWx1ZSB9ID0gY29udGV4dDtcblxuICBsZXQgcHJvcFBhdGggPSBbXSBhcyBzdHJpbmdbXTtcbiAgaWYgKEFycmF5LmlzQXJyYXkocHJvcE5hbWUpKSB7XG4gICAgcHJvcFBhdGggPSBwcm9wTmFtZTtcbiAgfSBlbHNlIHtcbiAgICBwcm9wUGF0aCA9IHByb3BOYW1lLnNwbGl0KFwiLlwiKTtcbiAgfVxuXG4gIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gIGxldCBjdXJyZW50ID0gdmFsdWUgYXMgYW55O1xuICB3aGlsZSAodHJ1ZSkge1xuICAgIGlmIChjdXJyZW50ID09PSB1bmRlZmluZWQgfHwgY3VycmVudCA9PT0gbnVsbCkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGlmIChwcm9wUGF0aC5sZW5ndGggPT09IDApIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBjb25zdCBwcm9wID0gcHJvcFBhdGguc2hpZnQoKSE7XG4gICAgY3VycmVudCA9IGN1cnJlbnRbcHJvcF07XG4gIH1cblxuICBsZXQgaGFzUHJvcGVydHk7XG4gIGlmICh2KSB7XG4gICAgaGFzUHJvcGVydHkgPSBjdXJyZW50ICE9PSB1bmRlZmluZWQgJiYgcHJvcFBhdGgubGVuZ3RoID09PSAwICYmXG4gICAgICBlcXVhbChjdXJyZW50LCB2LCBjb250ZXh0KTtcbiAgfSBlbHNlIHtcbiAgICBoYXNQcm9wZXJ0eSA9IGN1cnJlbnQgIT09IHVuZGVmaW5lZCAmJiBwcm9wUGF0aC5sZW5ndGggPT09IDA7XG4gIH1cblxuICBsZXQgb2ZWYWx1ZSA9IFwiXCI7XG4gIGlmICh2KSB7XG4gICAgb2ZWYWx1ZSA9IGAgb2YgdGhlIHZhbHVlICR7aW5zcGVjdEFyZyh2KX1gO1xuICB9XG5cbiAgaWYgKGNvbnRleHQuaXNOb3QpIHtcbiAgICBpZiAoaGFzUHJvcGVydHkpIHtcbiAgICAgIGNvbnN0IGRlZmF1bHRNZXNzYWdlID0gYEV4cGVjdGVkIHRoZSB2YWx1ZSBub3QgdG8gaGF2ZSB0aGUgcHJvcGVydHkgJHtcbiAgICAgICAgcHJvcFBhdGguam9pbihcIi5cIilcbiAgICAgIH0ke29mVmFsdWV9LCBidXQgaXQgZG9lc2A7XG4gICAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IoXG4gICAgICAgIGNvbnRleHQuY3VzdG9tTWVzc2FnZVxuICAgICAgICAgID8gYCR7Y29udGV4dC5jdXN0b21NZXNzYWdlfTogJHtkZWZhdWx0TWVzc2FnZX1gXG4gICAgICAgICAgOiBkZWZhdWx0TWVzc2FnZSxcbiAgICAgICk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmICghaGFzUHJvcGVydHkpIHtcbiAgICAgIGNvbnN0IGRlZmF1bHRNZXNzYWdlID0gYEV4cGVjdGVkIHRoZSB2YWx1ZSB0byBoYXZlIHRoZSBwcm9wZXJ0eSAke1xuICAgICAgICBwcm9wUGF0aC5qb2luKFwiLlwiKVxuICAgICAgfSR7b2ZWYWx1ZX0sIGJ1dCBpdCBkb2VzIG5vdGA7XG4gICAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IoXG4gICAgICAgIGNvbnRleHQuY3VzdG9tTWVzc2FnZVxuICAgICAgICAgID8gYCR7Y29udGV4dC5jdXN0b21NZXNzYWdlfTogJHtkZWZhdWx0TWVzc2FnZX1gXG4gICAgICAgICAgOiBkZWZhdWx0TWVzc2FnZSxcbiAgICAgICk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0b0NvbnRhaW4oXG4gIGNvbnRleHQ6IE1hdGNoZXJDb250ZXh0LFxuICBleHBlY3RlZDogdW5rbm93bixcbik6IE1hdGNoUmVzdWx0IHtcbiAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgY29uc3QgZG9lc0NvbnRhaW4gPSAoY29udGV4dC52YWx1ZSBhcyBhbnkpPy5pbmNsdWRlcz8uKGV4cGVjdGVkKTtcblxuICBjb25zdCBmbXRWYWx1ZSA9IGZvcm1hdChjb250ZXh0LnZhbHVlKTtcbiAgY29uc3QgZm10RXhwZWN0ZWQgPSBmb3JtYXQoZXhwZWN0ZWQpO1xuXG4gIGlmIChjb250ZXh0LmlzTm90KSB7XG4gICAgaWYgKGRvZXNDb250YWluKSB7XG4gICAgICBjb25zdCBkZWZhdWx0TWVzc2FnZSA9XG4gICAgICAgIGBUaGUgdmFsdWUgJHtmbXRWYWx1ZX0gY29udGFpbnMgdGhlIGV4cGVjdGVkIGl0ZW0gJHtmbXRFeHBlY3RlZH1gO1xuICAgICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKFxuICAgICAgICBjb250ZXh0LmN1c3RvbU1lc3NhZ2VcbiAgICAgICAgICA/IGAke2NvbnRleHQuY3VzdG9tTWVzc2FnZX06ICR7ZGVmYXVsdE1lc3NhZ2V9YFxuICAgICAgICAgIDogZGVmYXVsdE1lc3NhZ2UsXG4gICAgICApO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoIWRvZXNDb250YWluKSB7XG4gICAgICBjb25zdCBkZWZhdWx0TWVzc2FnZSA9XG4gICAgICAgIGBUaGUgdmFsdWUgJHtmbXRWYWx1ZX0gZG9lc24ndCBjb250YWluIHRoZSBleHBlY3RlZCBpdGVtICR7Zm10RXhwZWN0ZWR9YDtcbiAgICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihcbiAgICAgICAgY29udGV4dC5jdXN0b21NZXNzYWdlXG4gICAgICAgICAgPyBgJHtjb250ZXh0LmN1c3RvbU1lc3NhZ2V9OiAke2RlZmF1bHRNZXNzYWdlfWBcbiAgICAgICAgICA6IGRlZmF1bHRNZXNzYWdlLFxuICAgICAgKTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRvQ29udGFpbkVxdWFsKFxuICBjb250ZXh0OiBNYXRjaGVyQ29udGV4dCxcbiAgZXhwZWN0ZWQ6IHVua25vd24sXG4pOiBNYXRjaFJlc3VsdCB7XG4gIGNvbnN0IHsgdmFsdWUgfSA9IGNvbnRleHQ7XG4gIGFzc2VydElzSXRlcmFibGUodmFsdWUpO1xuICBsZXQgZG9lc0NvbnRhaW4gPSBmYWxzZTtcblxuICBmb3IgKGNvbnN0IGl0ZW0gb2YgdmFsdWUpIHtcbiAgICBpZiAoZXF1YWwoaXRlbSwgZXhwZWN0ZWQsIGNvbnRleHQpKSB7XG4gICAgICBkb2VzQ29udGFpbiA9IHRydWU7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICBjb25zdCBwcmV0dHlTdHJpbmdpZnkgPSAoanM6IHVua25vd24pID0+XG4gICAgSlNPTi5zdHJpbmdpZnkoanMsIG51bGwsIFwiXFx0XCIpXG4gICAgICAucmVwbGFjZSgvXFxcInxcXG58XFx0L2csIFwiXCIpXG4gICAgICAuc2xpY2UoMCwgMTAwKTtcblxuICBjb25zdCBmbXRWYWx1ZSA9IHByZXR0eVN0cmluZ2lmeShjb250ZXh0LnZhbHVlKTtcbiAgY29uc3QgZm10RXhwZWN0ZWQgPSBwcmV0dHlTdHJpbmdpZnkoZXhwZWN0ZWQpO1xuXG4gIGlmIChjb250ZXh0LmlzTm90KSB7XG4gICAgaWYgKGRvZXNDb250YWluKSB7XG4gICAgICBjb25zdCBkZWZhdWx0TWVzc2FnZSA9IGBUaGUgdmFsdWUgY29udGFpbnMgdGhlIGV4cGVjdGVkIGl0ZW06XG5WYWx1ZTogJHtmbXRWYWx1ZX1cbkV4cGVjdGVkOiAke2ZtdEV4cGVjdGVkfWA7XG4gICAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IoXG4gICAgICAgIGNvbnRleHQuY3VzdG9tTWVzc2FnZVxuICAgICAgICAgID8gYCR7Y29udGV4dC5jdXN0b21NZXNzYWdlfTogJHtkZWZhdWx0TWVzc2FnZX1gXG4gICAgICAgICAgOiBkZWZhdWx0TWVzc2FnZSxcbiAgICAgICk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmICghZG9lc0NvbnRhaW4pIHtcbiAgICAgIGNvbnN0IGRlZmF1bHRNZXNzYWdlID0gYFRoZSB2YWx1ZSBkb2Vzbid0IGNvbnRhaW4gdGhlIGV4cGVjdGVkIGl0ZW06XG5WYWx1ZTogJHtmbXRWYWx1ZX1cbkV4cGVjdGVkOiAke2ZtdEV4cGVjdGVkfWA7XG4gICAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IoXG4gICAgICAgIGNvbnRleHQuY3VzdG9tTWVzc2FnZVxuICAgICAgICAgID8gYCR7Y29udGV4dC5jdXN0b21NZXNzYWdlfTogJHtkZWZhdWx0TWVzc2FnZX1gXG4gICAgICAgICAgOiBkZWZhdWx0TWVzc2FnZSxcbiAgICAgICk7XG4gICAgfVxuICB9XG59XG5cbi8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG5mdW5jdGlvbiBhc3NlcnRJc0l0ZXJhYmxlKHZhbHVlOiBhbnkpOiBhc3NlcnRzIHZhbHVlIGlzIEl0ZXJhYmxlPHVua25vd24+IHtcbiAgaWYgKHZhbHVlID09IG51bGwpIHtcbiAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IoXCJUaGUgdmFsdWUgaXMgbnVsbCBvciB1bmRlZmluZWRcIik7XG4gIH1cbiAgaWYgKHR5cGVvZiB2YWx1ZVtTeW1ib2wuaXRlcmF0b3JdICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IoXCJUaGUgdmFsdWUgaXMgbm90IGl0ZXJhYmxlXCIpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0b01hdGNoKFxuICBjb250ZXh0OiBNYXRjaGVyQ29udGV4dCxcbiAgZXhwZWN0ZWQ6IFJlZ0V4cCxcbik6IE1hdGNoUmVzdWx0IHtcbiAgaWYgKGNvbnRleHQuaXNOb3QpIHtcbiAgICBhc3NlcnROb3RNYXRjaChcbiAgICAgIFN0cmluZyhjb250ZXh0LnZhbHVlKSxcbiAgICAgIGV4cGVjdGVkLFxuICAgICAgY29udGV4dC5jdXN0b21NZXNzYWdlLFxuICAgICk7XG4gIH0gZWxzZSB7XG4gICAgYXNzZXJ0TWF0Y2goU3RyaW5nKGNvbnRleHQudmFsdWUpLCBleHBlY3RlZCwgY29udGV4dC5jdXN0b21NZXNzYWdlKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gdG9NYXRjaE9iamVjdChcbiAgY29udGV4dDogTWF0Y2hlckNvbnRleHQsXG4gIGV4cGVjdGVkOiBSZWNvcmQ8UHJvcGVydHlLZXksIHVua25vd24+IHwgUmVjb3JkPFByb3BlcnR5S2V5LCB1bmtub3duPltdLFxuKTogTWF0Y2hSZXN1bHQge1xuICBjb25zdCByZWNlaXZlZCA9IGNvbnRleHQudmFsdWU7XG5cbiAgY29uc3QgZGVmYXVsdE1zZyA9IFwiUmVjZWl2ZWQgdmFsdWUgbXVzdCBiZSBhbiBvYmplY3RcIjtcblxuICBpZiAodHlwZW9mIHJlY2VpdmVkICE9PSBcIm9iamVjdFwiIHx8IHJlY2VpdmVkID09PSBudWxsKSB7XG4gICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKFxuICAgICAgY29udGV4dC5jdXN0b21NZXNzYWdlXG4gICAgICAgID8gYCR7Y29udGV4dC5jdXN0b21NZXNzYWdlfTogJHtkZWZhdWx0TXNnfWBcbiAgICAgICAgOiBkZWZhdWx0TXNnLFxuICAgICk7XG4gIH1cblxuICBpZiAodHlwZW9mIGV4cGVjdGVkICE9PSBcIm9iamVjdFwiIHx8IGV4cGVjdGVkID09PSBudWxsKSB7XG4gICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKFxuICAgICAgY29udGV4dC5jdXN0b21NZXNzYWdlXG4gICAgICAgID8gYCR7Y29udGV4dC5jdXN0b21NZXNzYWdlfTogJHtkZWZhdWx0TXNnfWBcbiAgICAgICAgOiBkZWZhdWx0TXNnLFxuICAgICk7XG4gIH1cblxuICBjb25zdCBwYXNzID0gZXF1YWwocmVjZWl2ZWQsIGV4cGVjdGVkLCB7XG4gICAgc3RyaWN0Q2hlY2s6IGZhbHNlLFxuICAgIGN1c3RvbVRlc3RlcnM6IFtcbiAgICAgIC4uLmNvbnRleHQuY3VzdG9tVGVzdGVycyxcbiAgICAgIGl0ZXJhYmxlRXF1YWxpdHksXG4gICAgICBzdWJzZXRFcXVhbGl0eSxcbiAgICBdLFxuICB9KTtcblxuICBjb25zdCB0cmlnZ2VyRXJyb3IgPSAoKSA9PiB7XG4gICAgaWYgKGNvbnRleHQuaXNOb3QpIHtcbiAgICAgIGNvbnN0IGRlZmF1bHRNZXNzYWdlID0gYnVpbGROb3RFcXVhbEVycm9yTWVzc2FnZShyZWNlaXZlZCwgZXhwZWN0ZWQpO1xuICAgICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKFxuICAgICAgICBjb250ZXh0LmN1c3RvbU1lc3NhZ2VcbiAgICAgICAgICA/IGAke2NvbnRleHQuY3VzdG9tTWVzc2FnZX06ICR7ZGVmYXVsdE1lc3NhZ2V9YFxuICAgICAgICAgIDogZGVmYXVsdE1lc3NhZ2UsXG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBkZWZhdWx0TWVzc2FnZSA9IGJ1aWxkRXF1YWxFcnJvck1lc3NhZ2UocmVjZWl2ZWQsIGV4cGVjdGVkKTtcbiAgICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihcbiAgICAgICAgY29udGV4dC5jdXN0b21NZXNzYWdlXG4gICAgICAgICAgPyBgJHtjb250ZXh0LmN1c3RvbU1lc3NhZ2V9OiAke2RlZmF1bHRNZXNzYWdlfWBcbiAgICAgICAgICA6IGRlZmF1bHRNZXNzYWdlLFxuICAgICAgKTtcbiAgICB9XG4gIH07XG5cbiAgaWYgKGNvbnRleHQuaXNOb3QgJiYgcGFzcyB8fCAhY29udGV4dC5pc05vdCAmJiAhcGFzcykge1xuICAgIHRyaWdnZXJFcnJvcigpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0b0hhdmVCZWVuQ2FsbGVkKGNvbnRleHQ6IE1hdGNoZXJDb250ZXh0KTogTWF0Y2hSZXN1bHQge1xuICBjb25zdCBjYWxscyA9IGdldE1vY2tDYWxscyhjb250ZXh0LnZhbHVlKTtcbiAgY29uc3QgaGFzQmVlbkNhbGxlZCA9IGNhbGxzLmxlbmd0aCA+IDA7XG5cbiAgaWYgKGNvbnRleHQuaXNOb3QpIHtcbiAgICBpZiAoaGFzQmVlbkNhbGxlZCkge1xuICAgICAgY29uc3QgZGVmYXVsdE1lc3NhZ2UgPVxuICAgICAgICBgRXhwZWN0ZWQgbW9jayBmdW5jdGlvbiBub3QgdG8gYmUgY2FsbGVkLCBidXQgaXQgd2FzIGNhbGxlZCAke2NhbGxzLmxlbmd0aH0gdGltZShzKWA7XG4gICAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IoXG4gICAgICAgIGNvbnRleHQuY3VzdG9tTWVzc2FnZVxuICAgICAgICAgID8gYCR7Y29udGV4dC5jdXN0b21NZXNzYWdlfTogJHtkZWZhdWx0TWVzc2FnZX1gXG4gICAgICAgICAgOiBkZWZhdWx0TWVzc2FnZSxcbiAgICAgICk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmICghaGFzQmVlbkNhbGxlZCkge1xuICAgICAgY29uc3QgZGVmYXVsdE1lc3NhZ2UgPVxuICAgICAgICBcIkV4cGVjdGVkIG1vY2sgZnVuY3Rpb24gdG8gYmUgY2FsbGVkLCBidXQgaXQgd2FzIG5vdCBjYWxsZWRcIjtcbiAgICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihcbiAgICAgICAgY29udGV4dC5jdXN0b21NZXNzYWdlXG4gICAgICAgICAgPyBgJHtjb250ZXh0LmN1c3RvbU1lc3NhZ2V9OiAke2RlZmF1bHRNZXNzYWdlfWBcbiAgICAgICAgICA6IGRlZmF1bHRNZXNzYWdlLFxuICAgICAgKTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRvSGF2ZUJlZW5DYWxsZWRUaW1lcyhcbiAgY29udGV4dDogTWF0Y2hlckNvbnRleHQsXG4gIGV4cGVjdGVkOiBudW1iZXIsXG4pOiBNYXRjaFJlc3VsdCB7XG4gIGNvbnN0IGNhbGxzID0gZ2V0TW9ja0NhbGxzKGNvbnRleHQudmFsdWUpO1xuXG4gIGlmIChjb250ZXh0LmlzTm90KSB7XG4gICAgaWYgKGNhbGxzLmxlbmd0aCA9PT0gZXhwZWN0ZWQpIHtcbiAgICAgIGNvbnN0IGRlZmF1bHRNZXNzYWdlID1cbiAgICAgICAgYEV4cGVjdGVkIG1vY2sgZnVuY3Rpb24gbm90IHRvIGJlIGNhbGxlZCAke2V4cGVjdGVkfSB0aW1lKHMpLCBidXQgaXQgd2FzYDtcbiAgICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihcbiAgICAgICAgY29udGV4dC5jdXN0b21NZXNzYWdlXG4gICAgICAgICAgPyBgJHtjb250ZXh0LmN1c3RvbU1lc3NhZ2V9OiAke2RlZmF1bHRNZXNzYWdlfWBcbiAgICAgICAgICA6IGRlZmF1bHRNZXNzYWdlLFxuICAgICAgKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKGNhbGxzLmxlbmd0aCAhPT0gZXhwZWN0ZWQpIHtcbiAgICAgIGNvbnN0IGRlZmF1bHRNZXNzYWdlID1cbiAgICAgICAgYEV4cGVjdGVkIG1vY2sgZnVuY3Rpb24gdG8gYmUgY2FsbGVkICR7ZXhwZWN0ZWR9IHRpbWUocyksIGJ1dCBpdCB3YXMgY2FsbGVkICR7Y2FsbHMubGVuZ3RofSB0aW1lKHMpYDtcbiAgICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihcbiAgICAgICAgY29udGV4dC5jdXN0b21NZXNzYWdlXG4gICAgICAgICAgPyBgJHtjb250ZXh0LmN1c3RvbU1lc3NhZ2V9OiAke2RlZmF1bHRNZXNzYWdlfWBcbiAgICAgICAgICA6IGRlZmF1bHRNZXNzYWdlLFxuICAgICAgKTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRvSGF2ZUJlZW5DYWxsZWRXaXRoKFxuICBjb250ZXh0OiBNYXRjaGVyQ29udGV4dCxcbiAgLi4uZXhwZWN0ZWQ6IHVua25vd25bXVxuKTogTWF0Y2hSZXN1bHQge1xuICBjb25zdCBjYWxscyA9IGdldE1vY2tDYWxscyhjb250ZXh0LnZhbHVlKTtcbiAgY29uc3QgaGFzQmVlbkNhbGxlZCA9IGNhbGxzLnNvbWUoKGNhbGwpID0+IGVxdWFsKGNhbGwuYXJncywgZXhwZWN0ZWQpKTtcblxuICBpZiAoY29udGV4dC5pc05vdCkge1xuICAgIGlmIChoYXNCZWVuQ2FsbGVkKSB7XG4gICAgICBjb25zdCBkZWZhdWx0TWVzc2FnZSA9IGBFeHBlY3RlZCBtb2NrIGZ1bmN0aW9uIG5vdCB0byBiZSBjYWxsZWQgd2l0aCAke1xuICAgICAgICBpbnNwZWN0QXJncyhleHBlY3RlZClcbiAgICAgIH0sIGJ1dCBpdCB3YXNgO1xuICAgICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKFxuICAgICAgICBjb250ZXh0LmN1c3RvbU1lc3NhZ2VcbiAgICAgICAgICA/IGAke2NvbnRleHQuY3VzdG9tTWVzc2FnZX06ICR7ZGVmYXVsdE1lc3NhZ2V9YFxuICAgICAgICAgIDogZGVmYXVsdE1lc3NhZ2UsXG4gICAgICApO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoIWhhc0JlZW5DYWxsZWQpIHtcbiAgICAgIGxldCBvdGhlckNhbGxzID0gXCJcIjtcbiAgICAgIGlmIChjYWxscy5sZW5ndGggPiAwKSB7XG4gICAgICAgIG90aGVyQ2FsbHMgPSBgXFxuICBPdGhlciBjYWxsczpcXG4gICAgICR7XG4gICAgICAgICAgY2FsbHMubWFwKChjYWxsKSA9PiBpbnNwZWN0QXJncyhjYWxsLmFyZ3MpKS5qb2luKFwiXFxuICAgIFwiKVxuICAgICAgICB9YDtcbiAgICAgIH1cblxuICAgICAgY29uc3QgZGVmYXVsdE1lc3NhZ2UgPSBgRXhwZWN0ZWQgbW9jayBmdW5jdGlvbiB0byBiZSBjYWxsZWQgd2l0aCAke1xuICAgICAgICBpbnNwZWN0QXJncyhleHBlY3RlZClcbiAgICAgIH0sIGJ1dCBpdCB3YXMgbm90LiR7b3RoZXJDYWxsc31gO1xuICAgICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKFxuICAgICAgICBjb250ZXh0LmN1c3RvbU1lc3NhZ2VcbiAgICAgICAgICA/IGAke2NvbnRleHQuY3VzdG9tTWVzc2FnZX06ICR7ZGVmYXVsdE1lc3NhZ2V9YFxuICAgICAgICAgIDogZGVmYXVsdE1lc3NhZ2UsXG4gICAgICApO1xuICAgIH1cbiAgfVxufVxuZXhwb3J0IGZ1bmN0aW9uIHRvSGF2ZUJlZW5MYXN0Q2FsbGVkV2l0aChcbiAgY29udGV4dDogTWF0Y2hlckNvbnRleHQsXG4gIC4uLmV4cGVjdGVkOiB1bmtub3duW11cbik6IE1hdGNoUmVzdWx0IHtcbiAgY29uc3QgY2FsbHMgPSBnZXRNb2NrQ2FsbHMoY29udGV4dC52YWx1ZSk7XG4gIGNvbnN0IGhhc0JlZW5DYWxsZWQgPSBjYWxscy5sZW5ndGggPiAwICYmXG4gICAgZXF1YWwoY2FsbHMuYXQoLTEpPy5hcmdzLCBleHBlY3RlZCk7XG5cbiAgaWYgKGNvbnRleHQuaXNOb3QpIHtcbiAgICBpZiAoaGFzQmVlbkNhbGxlZCkge1xuICAgICAgY29uc3QgZGVmYXVsdE1lc3NhZ2UgPVxuICAgICAgICBgRXhwZWN0ZWQgbW9jayBmdW5jdGlvbiBub3QgdG8gYmUgbGFzdCBjYWxsZWQgd2l0aCAke1xuICAgICAgICAgIGluc3BlY3RBcmdzKGV4cGVjdGVkKVxuICAgICAgICB9LCBidXQgaXQgd2FzYDtcbiAgICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihcbiAgICAgICAgY29udGV4dC5jdXN0b21NZXNzYWdlXG4gICAgICAgICAgPyBgJHtjb250ZXh0LmN1c3RvbU1lc3NhZ2V9OiAke2RlZmF1bHRNZXNzYWdlfWBcbiAgICAgICAgICA6IGRlZmF1bHRNZXNzYWdlLFxuICAgICAgKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKCFoYXNCZWVuQ2FsbGVkKSB7XG4gICAgICBjb25zdCBsYXN0Q2FsbCA9IGNhbGxzLmF0KC0xKTtcbiAgICAgIGlmICghbGFzdENhbGwpIHtcbiAgICAgICAgY29uc3QgZGVmYXVsdE1lc3NhZ2UgPSBgRXhwZWN0ZWQgbW9jayBmdW5jdGlvbiB0byBiZSBsYXN0IGNhbGxlZCB3aXRoICR7XG4gICAgICAgICAgaW5zcGVjdEFyZ3MoZXhwZWN0ZWQpXG4gICAgICAgIH0sIGJ1dCBpdCB3YXMgbm90YDtcbiAgICAgICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKFxuICAgICAgICAgIGNvbnRleHQuY3VzdG9tTWVzc2FnZVxuICAgICAgICAgICAgPyBgJHtjb250ZXh0LmN1c3RvbU1lc3NhZ2V9OiAke2RlZmF1bHRNZXNzYWdlfWBcbiAgICAgICAgICAgIDogZGVmYXVsdE1lc3NhZ2UsXG4gICAgICAgICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBkZWZhdWx0TWVzc2FnZSA9IGBFeHBlY3RlZCBtb2NrIGZ1bmN0aW9uIHRvIGJlIGxhc3QgY2FsbGVkIHdpdGggJHtcbiAgICAgICAgICBpbnNwZWN0QXJncyhleHBlY3RlZClcbiAgICAgICAgfSwgYnV0IGl0IHdhcyBsYXN0IGNhbGxlZCB3aXRoICR7aW5zcGVjdEFyZ3MobGFzdENhbGwuYXJncyl9YDtcbiAgICAgICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKFxuICAgICAgICAgIGNvbnRleHQuY3VzdG9tTWVzc2FnZVxuICAgICAgICAgICAgPyBgJHtjb250ZXh0LmN1c3RvbU1lc3NhZ2V9OiAke2RlZmF1bHRNZXNzYWdlfWBcbiAgICAgICAgICAgIDogZGVmYXVsdE1lc3NhZ2UsXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0b0hhdmVCZWVuTnRoQ2FsbGVkV2l0aChcbiAgY29udGV4dDogTWF0Y2hlckNvbnRleHQsXG4gIG50aDogbnVtYmVyLFxuICAuLi5leHBlY3RlZDogdW5rbm93bltdXG4pOiBNYXRjaFJlc3VsdCB7XG4gIGlmIChudGggPCAxKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBudGggbXVzdCBiZSBncmVhdGVyIHRoYW4gMDogcmVjZWl2ZWQgJHtudGh9YCk7XG4gIH1cblxuICBjb25zdCBjYWxscyA9IGdldE1vY2tDYWxscyhjb250ZXh0LnZhbHVlKTtcbiAgY29uc3QgY2FsbEluZGV4ID0gbnRoIC0gMTtcbiAgY29uc3QgaGFzQmVlbkNhbGxlZCA9IGNhbGxzLmxlbmd0aCA+IGNhbGxJbmRleCAmJlxuICAgIGVxdWFsKGNhbGxzW2NhbGxJbmRleF0/LmFyZ3MsIGV4cGVjdGVkKTtcblxuICBpZiAoY29udGV4dC5pc05vdCkge1xuICAgIGlmIChoYXNCZWVuQ2FsbGVkKSB7XG4gICAgICBjb25zdCBkZWZhdWx0TWVzc2FnZSA9XG4gICAgICAgIGBFeHBlY3RlZCB0aGUgbi10aCBjYWxsIChuPSR7bnRofSkgb2YgbW9jayBmdW5jdGlvbiBpcyBub3Qgd2l0aCAke1xuICAgICAgICAgIGluc3BlY3RBcmdzKGV4cGVjdGVkKVxuICAgICAgICB9LCBidXQgaXQgd2FzYDtcbiAgICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihcbiAgICAgICAgY29udGV4dC5jdXN0b21NZXNzYWdlXG4gICAgICAgICAgPyBgJHtjb250ZXh0LmN1c3RvbU1lc3NhZ2V9OiAke2RlZmF1bHRNZXNzYWdlfWBcbiAgICAgICAgICA6IGRlZmF1bHRNZXNzYWdlLFxuICAgICAgKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKCFoYXNCZWVuQ2FsbGVkKSB7XG4gICAgICBjb25zdCBudGhDYWxsID0gY2FsbHNbY2FsbEluZGV4XTtcbiAgICAgIGlmICghbnRoQ2FsbCkge1xuICAgICAgICBjb25zdCBkZWZhdWx0TWVzc2FnZSA9XG4gICAgICAgICAgYEV4cGVjdGVkIHRoZSBuLXRoIGNhbGwgKG49JHtudGh9KSBvZiBtb2NrIGZ1bmN0aW9uIGlzIHdpdGggJHtcbiAgICAgICAgICAgIGluc3BlY3RBcmdzKGV4cGVjdGVkKVxuICAgICAgICAgIH0sIGJ1dCB0aGUgbi10aCBjYWxsIGRvZXMgbm90IGV4aXN0YDtcbiAgICAgICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKFxuICAgICAgICAgIGNvbnRleHQuY3VzdG9tTWVzc2FnZVxuICAgICAgICAgICAgPyBgJHtjb250ZXh0LmN1c3RvbU1lc3NhZ2V9OiAke2RlZmF1bHRNZXNzYWdlfWBcbiAgICAgICAgICAgIDogZGVmYXVsdE1lc3NhZ2UsXG4gICAgICAgICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBkZWZhdWx0TWVzc2FnZSA9XG4gICAgICAgICAgYEV4cGVjdGVkIHRoZSBuLXRoIGNhbGwgKG49JHtudGh9KSBvZiBtb2NrIGZ1bmN0aW9uIGlzIHdpdGggJHtcbiAgICAgICAgICAgIGluc3BlY3RBcmdzKGV4cGVjdGVkKVxuICAgICAgICAgIH0sIGJ1dCBpdCB3YXMgd2l0aCAke2luc3BlY3RBcmdzKG50aENhbGwuYXJncyl9YDtcbiAgICAgICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKFxuICAgICAgICAgIGNvbnRleHQuY3VzdG9tTWVzc2FnZVxuICAgICAgICAgICAgPyBgJHtjb250ZXh0LmN1c3RvbU1lc3NhZ2V9OiAke2RlZmF1bHRNZXNzYWdlfWBcbiAgICAgICAgICAgIDogZGVmYXVsdE1lc3NhZ2UsXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0b0hhdmVSZXR1cm5lZChjb250ZXh0OiBNYXRjaGVyQ29udGV4dCk6IE1hdGNoUmVzdWx0IHtcbiAgY29uc3QgY2FsbHMgPSBnZXRNb2NrQ2FsbHMoY29udGV4dC52YWx1ZSk7XG4gIGNvbnN0IHJldHVybmVkID0gY2FsbHMuZmlsdGVyKChjYWxsKSA9PiBjYWxsLnJldHVybnMpO1xuXG4gIGlmIChjb250ZXh0LmlzTm90KSB7XG4gICAgaWYgKHJldHVybmVkLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IGRlZmF1bHRNZXNzYWdlID1cbiAgICAgICAgYEV4cGVjdGVkIHRoZSBtb2NrIGZ1bmN0aW9uIHRvIG5vdCBoYXZlIHJldHVybmVkLCBidXQgaXQgcmV0dXJuZWQgJHtyZXR1cm5lZC5sZW5ndGh9IHRpbWVzYDtcbiAgICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihcbiAgICAgICAgY29udGV4dC5jdXN0b21NZXNzYWdlXG4gICAgICAgICAgPyBgJHtjb250ZXh0LmN1c3RvbU1lc3NhZ2V9OiAke2RlZmF1bHRNZXNzYWdlfWBcbiAgICAgICAgICA6IGRlZmF1bHRNZXNzYWdlLFxuICAgICAgKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKHJldHVybmVkLmxlbmd0aCA9PT0gMCkge1xuICAgICAgY29uc3QgZGVmYXVsdE1lc3NhZ2UgPVxuICAgICAgICBgRXhwZWN0ZWQgdGhlIG1vY2sgZnVuY3Rpb24gdG8gaGF2ZSByZXR1cm5lZCwgYnV0IGl0IGRpZCBub3QgcmV0dXJuYDtcbiAgICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihcbiAgICAgICAgY29udGV4dC5jdXN0b21NZXNzYWdlXG4gICAgICAgICAgPyBgJHtjb250ZXh0LmN1c3RvbU1lc3NhZ2V9OiAke2RlZmF1bHRNZXNzYWdlfWBcbiAgICAgICAgICA6IGRlZmF1bHRNZXNzYWdlLFxuICAgICAgKTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRvSGF2ZVJldHVybmVkVGltZXMoXG4gIGNvbnRleHQ6IE1hdGNoZXJDb250ZXh0LFxuICBleHBlY3RlZDogbnVtYmVyLFxuKTogTWF0Y2hSZXN1bHQge1xuICBjb25zdCBjYWxscyA9IGdldE1vY2tDYWxscyhjb250ZXh0LnZhbHVlKTtcbiAgY29uc3QgcmV0dXJuZWQgPSBjYWxscy5maWx0ZXIoKGNhbGwpID0+IGNhbGwucmV0dXJucyk7XG5cbiAgaWYgKGNvbnRleHQuaXNOb3QpIHtcbiAgICBpZiAocmV0dXJuZWQubGVuZ3RoID09PSBleHBlY3RlZCkge1xuICAgICAgY29uc3QgZGVmYXVsdE1lc3NhZ2UgPVxuICAgICAgICBgRXhwZWN0ZWQgdGhlIG1vY2sgZnVuY3Rpb24gdG8gbm90IGhhdmUgcmV0dXJuZWQgJHtleHBlY3RlZH0gdGltZXMsIGJ1dCBpdCByZXR1cm5lZCAke3JldHVybmVkLmxlbmd0aH0gdGltZXNgO1xuICAgICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKFxuICAgICAgICBjb250ZXh0LmN1c3RvbU1lc3NhZ2VcbiAgICAgICAgICA/IGAke2NvbnRleHQuY3VzdG9tTWVzc2FnZX06ICR7ZGVmYXVsdE1lc3NhZ2V9YFxuICAgICAgICAgIDogZGVmYXVsdE1lc3NhZ2UsXG4gICAgICApO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAocmV0dXJuZWQubGVuZ3RoICE9PSBleHBlY3RlZCkge1xuICAgICAgY29uc3QgZGVmYXVsdE1lc3NhZ2UgPVxuICAgICAgICBgRXhwZWN0ZWQgdGhlIG1vY2sgZnVuY3Rpb24gdG8gaGF2ZSByZXR1cm5lZCAke2V4cGVjdGVkfSB0aW1lcywgYnV0IGl0IHJldHVybmVkICR7cmV0dXJuZWQubGVuZ3RofSB0aW1lc2A7XG4gICAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IoXG4gICAgICAgIGNvbnRleHQuY3VzdG9tTWVzc2FnZVxuICAgICAgICAgID8gYCR7Y29udGV4dC5jdXN0b21NZXNzYWdlfTogJHtkZWZhdWx0TWVzc2FnZX1gXG4gICAgICAgICAgOiBkZWZhdWx0TWVzc2FnZSxcbiAgICAgICk7XG4gICAgfVxuICB9XG59XG5leHBvcnQgZnVuY3Rpb24gdG9IYXZlUmV0dXJuZWRXaXRoKFxuICBjb250ZXh0OiBNYXRjaGVyQ29udGV4dCxcbiAgZXhwZWN0ZWQ6IHVua25vd24sXG4pOiBNYXRjaFJlc3VsdCB7XG4gIGNvbnN0IGNhbGxzID0gZ2V0TW9ja0NhbGxzKGNvbnRleHQudmFsdWUpO1xuICBjb25zdCByZXR1cm5lZCA9IGNhbGxzLmZpbHRlcigoY2FsbCkgPT4gY2FsbC5yZXR1cm5zKTtcbiAgY29uc3QgcmV0dXJuZWRXaXRoRXhwZWN0ZWQgPSByZXR1cm5lZC5zb21lKChjYWxsKSA9PlxuICAgIGVxdWFsKGNhbGwucmV0dXJuZWQsIGV4cGVjdGVkKVxuICApO1xuXG4gIGlmIChjb250ZXh0LmlzTm90KSB7XG4gICAgaWYgKHJldHVybmVkV2l0aEV4cGVjdGVkKSB7XG4gICAgICBjb25zdCBkZWZhdWx0TWVzc2FnZSA9XG4gICAgICAgIGBFeHBlY3RlZCB0aGUgbW9jayBmdW5jdGlvbiB0byBub3QgaGF2ZSByZXR1cm5lZCB3aXRoICR7XG4gICAgICAgICAgaW5zcGVjdEFyZyhleHBlY3RlZClcbiAgICAgICAgfSwgYnV0IGl0IGRpZGA7XG4gICAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IoXG4gICAgICAgIGNvbnRleHQuY3VzdG9tTWVzc2FnZVxuICAgICAgICAgID8gYCR7Y29udGV4dC5jdXN0b21NZXNzYWdlfTogJHtkZWZhdWx0TWVzc2FnZX1gXG4gICAgICAgICAgOiBkZWZhdWx0TWVzc2FnZSxcbiAgICAgICk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmICghcmV0dXJuZWRXaXRoRXhwZWN0ZWQpIHtcbiAgICAgIGNvbnN0IGRlZmF1bHRNZXNzYWdlID1cbiAgICAgICAgYEV4cGVjdGVkIHRoZSBtb2NrIGZ1bmN0aW9uIHRvIGhhdmUgcmV0dXJuZWQgd2l0aCAke1xuICAgICAgICAgIGluc3BlY3RBcmcoZXhwZWN0ZWQpXG4gICAgICAgIH0sIGJ1dCBpdCBkaWQgbm90YDtcbiAgICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihcbiAgICAgICAgY29udGV4dC5jdXN0b21NZXNzYWdlXG4gICAgICAgICAgPyBgJHtjb250ZXh0LmN1c3RvbU1lc3NhZ2V9OiAke2RlZmF1bHRNZXNzYWdlfWBcbiAgICAgICAgICA6IGRlZmF1bHRNZXNzYWdlLFxuICAgICAgKTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRvSGF2ZUxhc3RSZXR1cm5lZFdpdGgoXG4gIGNvbnRleHQ6IE1hdGNoZXJDb250ZXh0LFxuICBleHBlY3RlZDogdW5rbm93bixcbik6IE1hdGNoUmVzdWx0IHtcbiAgY29uc3QgY2FsbHMgPSBnZXRNb2NrQ2FsbHMoY29udGV4dC52YWx1ZSk7XG4gIGNvbnN0IHJldHVybmVkID0gY2FsbHMuZmlsdGVyKChjYWxsKSA9PiBjYWxsLnJldHVybnMpO1xuICBjb25zdCBsYXN0UmV0dXJuZWRXaXRoRXhwZWN0ZWQgPSByZXR1cm5lZC5sZW5ndGggPiAwICYmXG4gICAgZXF1YWwocmV0dXJuZWQuYXQoLTEpPy5yZXR1cm5lZCwgZXhwZWN0ZWQpO1xuXG4gIGlmIChjb250ZXh0LmlzTm90KSB7XG4gICAgaWYgKGxhc3RSZXR1cm5lZFdpdGhFeHBlY3RlZCkge1xuICAgICAgY29uc3QgZGVmYXVsdE1lc3NhZ2UgPVxuICAgICAgICBgRXhwZWN0ZWQgdGhlIG1vY2sgZnVuY3Rpb24gdG8gbm90IGhhdmUgbGFzdCByZXR1cm5lZCB3aXRoICR7XG4gICAgICAgICAgaW5zcGVjdEFyZyhleHBlY3RlZClcbiAgICAgICAgfSwgYnV0IGl0IGRpZGA7XG4gICAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IoXG4gICAgICAgIGNvbnRleHQuY3VzdG9tTWVzc2FnZVxuICAgICAgICAgID8gYCR7Y29udGV4dC5jdXN0b21NZXNzYWdlfTogJHtkZWZhdWx0TWVzc2FnZX1gXG4gICAgICAgICAgOiBkZWZhdWx0TWVzc2FnZSxcbiAgICAgICk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmICghbGFzdFJldHVybmVkV2l0aEV4cGVjdGVkKSB7XG4gICAgICBjb25zdCBkZWZhdWx0TWVzc2FnZSA9XG4gICAgICAgIGBFeHBlY3RlZCB0aGUgbW9jayBmdW5jdGlvbiB0byBoYXZlIGxhc3QgcmV0dXJuZWQgd2l0aCAke1xuICAgICAgICAgIGluc3BlY3RBcmcoZXhwZWN0ZWQpXG4gICAgICAgIH0sIGJ1dCBpdCBkaWQgbm90YDtcbiAgICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihcbiAgICAgICAgY29udGV4dC5jdXN0b21NZXNzYWdlXG4gICAgICAgICAgPyBgJHtjb250ZXh0LmN1c3RvbU1lc3NhZ2V9OiAke2RlZmF1bHRNZXNzYWdlfWBcbiAgICAgICAgICA6IGRlZmF1bHRNZXNzYWdlLFxuICAgICAgKTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRvSGF2ZU50aFJldHVybmVkV2l0aChcbiAgY29udGV4dDogTWF0Y2hlckNvbnRleHQsXG4gIG50aDogbnVtYmVyLFxuICBleHBlY3RlZDogdW5rbm93bixcbik6IE1hdGNoUmVzdWx0IHtcbiAgaWYgKG50aCA8IDEpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYG50aCgke250aH0pIG11c3QgYmUgZ3JlYXRlciB0aGFuIDBgKTtcbiAgfVxuXG4gIGNvbnN0IGNhbGxzID0gZ2V0TW9ja0NhbGxzKGNvbnRleHQudmFsdWUpO1xuICBjb25zdCByZXR1cm5lZCA9IGNhbGxzLmZpbHRlcigoY2FsbCkgPT4gY2FsbC5yZXR1cm5zKTtcbiAgY29uc3QgcmV0dXJuSW5kZXggPSBudGggLSAxO1xuICBjb25zdCBtYXliZU50aFJldHVybmVkID0gcmV0dXJuZWRbcmV0dXJuSW5kZXhdO1xuICBjb25zdCBudGhSZXR1cm5lZFdpdGhFeHBlY3RlZCA9IG1heWJlTnRoUmV0dXJuZWQgJiZcbiAgICBlcXVhbChtYXliZU50aFJldHVybmVkLnJldHVybmVkLCBleHBlY3RlZCk7XG5cbiAgaWYgKGNvbnRleHQuaXNOb3QpIHtcbiAgICBpZiAobnRoUmV0dXJuZWRXaXRoRXhwZWN0ZWQpIHtcbiAgICAgIGNvbnN0IGRlZmF1bHRNZXNzYWdlID1cbiAgICAgICAgYEV4cGVjdGVkIHRoZSBtb2NrIGZ1bmN0aW9uIHRvIG5vdCBoYXZlIG4tdGggKG49JHtudGh9KSByZXR1cm5lZCB3aXRoICR7XG4gICAgICAgICAgaW5zcGVjdEFyZyhleHBlY3RlZClcbiAgICAgICAgfSwgYnV0IGl0IGRpZGA7XG4gICAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IoXG4gICAgICAgIGNvbnRleHQuY3VzdG9tTWVzc2FnZVxuICAgICAgICAgID8gYCR7Y29udGV4dC5jdXN0b21NZXNzYWdlfTogJHtkZWZhdWx0TWVzc2FnZX1gXG4gICAgICAgICAgOiBkZWZhdWx0TWVzc2FnZSxcbiAgICAgICk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmICghbnRoUmV0dXJuZWRXaXRoRXhwZWN0ZWQpIHtcbiAgICAgIGNvbnN0IGRlZmF1bHRNZXNzYWdlID1cbiAgICAgICAgYEV4cGVjdGVkIHRoZSBtb2NrIGZ1bmN0aW9uIHRvIGhhdmUgbi10aCAobj0ke250aH0pIHJldHVybmVkIHdpdGggJHtcbiAgICAgICAgICBpbnNwZWN0QXJnKGV4cGVjdGVkKVxuICAgICAgICB9LCBidXQgaXQgZGlkIG5vdGA7XG4gICAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IoXG4gICAgICAgIGNvbnRleHQuY3VzdG9tTWVzc2FnZVxuICAgICAgICAgID8gYCR7Y29udGV4dC5jdXN0b21NZXNzYWdlfTogJHtkZWZhdWx0TWVzc2FnZX1gXG4gICAgICAgICAgOiBkZWZhdWx0TWVzc2FnZSxcbiAgICAgICk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0b1Rocm93PEUgZXh0ZW5kcyBFcnJvciA9IEVycm9yPihcbiAgY29udGV4dDogTWF0Y2hlckNvbnRleHQsXG4gIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gIGV4cGVjdGVkPzogc3RyaW5nIHwgUmVnRXhwIHwgRSB8IChuZXcgKC4uLmFyZ3M6IGFueVtdKSA9PiBFKSxcbik6IE1hdGNoUmVzdWx0IHtcbiAgaWYgKHR5cGVvZiBjb250ZXh0LnZhbHVlID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICB0cnkge1xuICAgICAgY29udGV4dC52YWx1ZSA9IGNvbnRleHQudmFsdWUoKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGNvbnRleHQudmFsdWUgPSBlcnI7XG4gICAgfVxuICB9XG5cbiAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgdHlwZSBFcnJvckNsYXNzID0gbmV3ICguLi5hcmdzOiBhbnlbXSkgPT4gRXJyb3I7XG4gIGxldCBleHBlY3RDbGFzczogdW5kZWZpbmVkIHwgRXJyb3JDbGFzcyA9IHVuZGVmaW5lZDtcbiAgbGV0IGV4cGVjdE1lc3NhZ2U6IHVuZGVmaW5lZCB8IHN0cmluZyB8IFJlZ0V4cCA9IHVuZGVmaW5lZDtcbiAgaWYgKGV4cGVjdGVkIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICBleHBlY3RDbGFzcyA9IGV4cGVjdGVkLmNvbnN0cnVjdG9yIGFzIEVycm9yQ2xhc3M7XG4gICAgZXhwZWN0TWVzc2FnZSA9IGV4cGVjdGVkLm1lc3NhZ2U7XG4gIH1cbiAgaWYgKGV4cGVjdGVkIGluc3RhbmNlb2YgRnVuY3Rpb24pIHtcbiAgICBleHBlY3RDbGFzcyA9IGV4cGVjdGVkIGFzIEVycm9yQ2xhc3M7XG4gIH1cbiAgaWYgKHR5cGVvZiBleHBlY3RlZCA9PT0gXCJzdHJpbmdcIiB8fCBleHBlY3RlZCBpbnN0YW5jZW9mIFJlZ0V4cCkge1xuICAgIGV4cGVjdE1lc3NhZ2UgPSBleHBlY3RlZDtcbiAgfVxuXG4gIGlmIChjb250ZXh0LmlzTm90KSB7XG4gICAgbGV0IGlzRXJyb3IgPSBmYWxzZTtcbiAgICB0cnkge1xuICAgICAgYXNzZXJ0SXNFcnJvcihcbiAgICAgICAgY29udGV4dC52YWx1ZSxcbiAgICAgICAgZXhwZWN0Q2xhc3MsXG4gICAgICAgIGV4cGVjdE1lc3NhZ2UsXG4gICAgICAgIGNvbnRleHQuY3VzdG9tTWVzc2FnZSxcbiAgICAgICk7XG4gICAgICBpc0Vycm9yID0gdHJ1ZTtcbiAgICAgIGNvbnN0IGRlZmF1bHRNZXNzYWdlID0gYEV4cGVjdGVkIHRvIE5PVCB0aHJvdyAke2V4cGVjdGVkfWA7XG4gICAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IoXG4gICAgICAgIGNvbnRleHQuY3VzdG9tTWVzc2FnZVxuICAgICAgICAgID8gYCR7Y29udGV4dC5jdXN0b21NZXNzYWdlfTogJHtkZWZhdWx0TWVzc2FnZX1gXG4gICAgICAgICAgOiBkZWZhdWx0TWVzc2FnZSxcbiAgICAgICk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgaWYgKGlzRXJyb3IpIHtcbiAgICAgICAgdGhyb3cgZTtcbiAgICAgIH1cbiAgICAgIHJldHVybjtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGFzc2VydElzRXJyb3IoXG4gICAgY29udGV4dC52YWx1ZSxcbiAgICBleHBlY3RDbGFzcyxcbiAgICBleHBlY3RNZXNzYWdlLFxuICAgIGNvbnRleHQuY3VzdG9tTWVzc2FnZSxcbiAgKTtcbn1cbiIsICIvLyBDb3B5cmlnaHQgMjAxOC0yMDI1IHRoZSBEZW5vIGF1dGhvcnMuIE1JVCBsaWNlbnNlLlxuXG5pbXBvcnQgdHlwZSB7IFNuYXBzaG90UGx1Z2luIH0gZnJvbSBcIi4vX3R5cGVzLnRzXCI7XG5cbmNvbnN0IElOVEVSTkFMX1BMVUdJTlM6IFNuYXBzaG90UGx1Z2luW10gPSBbXG4gIC8vIFRPRE8oZXJ5dWUwMjIwKTogc3VwcG9ydCBpbnRlcm5hbCBzbmFwc2hvdCBzZXJpYWxpemVyIHBsdWdpbnNcbl07XG5cbmV4cG9ydCBmdW5jdGlvbiBhZGRTZXJpYWxpemVyKHBsdWdpbjogU25hcHNob3RQbHVnaW4pIHtcbiAgSU5URVJOQUxfUExVR0lOUy51bnNoaWZ0KHBsdWdpbik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRTZXJpYWxpemVyKCkge1xuICByZXR1cm4gSU5URVJOQUxfUExVR0lOUztcbn1cbiIsICIvLyBDb3B5cmlnaHQgMjAxOC0yMDI1IHRoZSBEZW5vIGF1dGhvcnMuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuLy8gQ29weXJpZ2h0IDIwMTkgQWxsYWluIExhbG9uZGUuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIElTQyBMaWNlbnNlLlxuLy8gQ29weXJpZ2h0IChjKSBNZXRhIFBsYXRmb3JtcywgSW5jLiBhbmQgYWZmaWxpYXRlcy5cbi8vIFRoZSBkb2N1bWVudGF0aW9uIGlzIGV4dHJhY3RlZCBmcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS9qZXN0anMvamVzdC9ibG9iL21haW4vd2Vic2l0ZS92ZXJzaW9uZWRfZG9jcy92ZXJzaW9uLTI5LjcvRXhwZWN0QVBJLm1kXG4vLyBhbmQgdXBkYXRlZCBmb3IgdGhlIERlbm8gZWNvc3lzdGVtLlxuXG5pbXBvcnQgdHlwZSB7XG4gIEV4cGVjdGVkLFxuICBFeHRlbmRNYXRjaFJlc3VsdCxcbiAgTWF0Y2hlcixcbiAgTWF0Y2hlckNvbnRleHQsXG4gIE1hdGNoZXJLZXksXG4gIE1hdGNoZXJzLFxufSBmcm9tIFwiLi9fdHlwZXMudHNcIjtcbmltcG9ydCB7IEFzc2VydGlvbkVycm9yIH0gZnJvbSBcImpzcjpAc3RkL2Fzc2VydEBeMS4wLjE0L2Fzc2VydGlvbi1lcnJvclwiO1xuaW1wb3J0IHtcbiAgYXNzZXJ0aW9ucyxcbiAgZW1pdEFzc2VydGlvblRyaWdnZXIsXG4gIGhhc0Fzc2VydGlvbnMsXG59IGZyb20gXCIuL19hc3NlcnRpb25zLnRzXCI7XG5pbXBvcnQge1xuICBhZGRDdXN0b21FcXVhbGl0eVRlc3RlcnMsXG4gIGdldEN1c3RvbUVxdWFsaXR5VGVzdGVycyxcbn0gZnJvbSBcIi4vX2N1c3RvbV9lcXVhbGl0eV90ZXN0ZXIudHNcIjtcbmltcG9ydCB7IGVxdWFsIH0gZnJvbSBcIi4vX2VxdWFsLnRzXCI7XG5pbXBvcnQgeyBnZXRFeHRlbmRNYXRjaGVycywgc2V0RXh0ZW5kTWF0Y2hlcnMgfSBmcm9tIFwiLi9fZXh0ZW5kLnRzXCI7XG5pbXBvcnQge1xuICB0b0JlLFxuICB0b0JlQ2xvc2VUbyxcbiAgdG9CZURlZmluZWQsXG4gIHRvQmVGYWxzeSxcbiAgdG9CZUdyZWF0ZXJUaGFuLFxuICB0b0JlR3JlYXRlclRoYW5PckVxdWFsLFxuICB0b0JlSW5zdGFuY2VPZixcbiAgdG9CZUxlc3NUaGFuLFxuICB0b0JlTGVzc1RoYW5PckVxdWFsLFxuICB0b0JlTmFOLFxuICB0b0JlTnVsbCxcbiAgdG9CZVRydXRoeSxcbiAgdG9CZVVuZGVmaW5lZCxcbiAgdG9Db250YWluLFxuICB0b0NvbnRhaW5FcXVhbCxcbiAgdG9FcXVhbCxcbiAgdG9IYXZlQmVlbkNhbGxlZCxcbiAgdG9IYXZlQmVlbkNhbGxlZFRpbWVzLFxuICB0b0hhdmVCZWVuQ2FsbGVkV2l0aCxcbiAgdG9IYXZlQmVlbkxhc3RDYWxsZWRXaXRoLFxuICB0b0hhdmVCZWVuTnRoQ2FsbGVkV2l0aCxcbiAgdG9IYXZlTGFzdFJldHVybmVkV2l0aCxcbiAgdG9IYXZlTGVuZ3RoLFxuICB0b0hhdmVOdGhSZXR1cm5lZFdpdGgsXG4gIHRvSGF2ZVByb3BlcnR5LFxuICB0b0hhdmVSZXR1cm5lZCxcbiAgdG9IYXZlUmV0dXJuZWRUaW1lcyxcbiAgdG9IYXZlUmV0dXJuZWRXaXRoLFxuICB0b01hdGNoLFxuICB0b01hdGNoT2JqZWN0LFxuICB0b1N0cmljdEVxdWFsLFxuICB0b1Rocm93LFxufSBmcm9tIFwiLi9fbWF0Y2hlcnMudHNcIjtcbmltcG9ydCB7IGFkZFNlcmlhbGl6ZXIgfSBmcm9tIFwiLi9fc2VyaWFsaXplci50c1wiO1xuaW1wb3J0IHsgaXNQcm9taXNlTGlrZSB9IGZyb20gXCIuL191dGlscy50c1wiO1xuaW1wb3J0ICogYXMgYXN5bW1ldHJpY01hdGNoZXJzIGZyb20gXCIuL19hc3ltbWV0cmljX21hdGNoZXJzLnRzXCI7XG5pbXBvcnQgdHlwZSB7IFNuYXBzaG90UGx1Z2luLCBUZXN0ZXIgfSBmcm9tIFwiLi9fdHlwZXMudHNcIjtcblxuZXhwb3J0IHR5cGUgeyBBbnlDb25zdHJ1Y3RvciwgQXN5bmMsIEV4cGVjdGVkIH0gZnJvbSBcIi4vX3R5cGVzLnRzXCI7XG5cbmNvbnN0IG1hdGNoZXJzOiBSZWNvcmQ8TWF0Y2hlcktleSwgTWF0Y2hlcj4gPSB7XG4gIGxhc3RDYWxsZWRXaXRoOiB0b0hhdmVCZWVuTGFzdENhbGxlZFdpdGgsXG4gIGxhc3RSZXR1cm5lZFdpdGg6IHRvSGF2ZUxhc3RSZXR1cm5lZFdpdGgsXG4gIG50aENhbGxlZFdpdGg6IHRvSGF2ZUJlZW5OdGhDYWxsZWRXaXRoLFxuICBudGhSZXR1cm5lZFdpdGg6IHRvSGF2ZU50aFJldHVybmVkV2l0aCxcbiAgdG9CZUNhbGxlZDogdG9IYXZlQmVlbkNhbGxlZCxcbiAgdG9CZUNhbGxlZFRpbWVzOiB0b0hhdmVCZWVuQ2FsbGVkVGltZXMsXG4gIHRvQmVDYWxsZWRXaXRoOiB0b0hhdmVCZWVuQ2FsbGVkV2l0aCxcbiAgdG9CZUNsb3NlVG8sXG4gIHRvQmVEZWZpbmVkLFxuICB0b0JlRmFsc3ksXG4gIHRvQmVHcmVhdGVyVGhhbk9yRXF1YWwsXG4gIHRvQmVHcmVhdGVyVGhhbixcbiAgdG9CZUluc3RhbmNlT2YsXG4gIHRvQmVMZXNzVGhhbk9yRXF1YWwsXG4gIHRvQmVMZXNzVGhhbixcbiAgdG9CZU5hTixcbiAgdG9CZU51bGwsXG4gIHRvQmVUcnV0aHksXG4gIHRvQmVVbmRlZmluZWQsXG4gIHRvQmUsXG4gIHRvQ29udGFpbkVxdWFsLFxuICB0b0NvbnRhaW4sXG4gIHRvRXF1YWwsXG4gIHRvSGF2ZUJlZW5DYWxsZWRUaW1lcyxcbiAgdG9IYXZlQmVlbkNhbGxlZFdpdGgsXG4gIHRvSGF2ZUJlZW5DYWxsZWQsXG4gIHRvSGF2ZUJlZW5MYXN0Q2FsbGVkV2l0aCxcbiAgdG9IYXZlQmVlbk50aENhbGxlZFdpdGgsXG4gIHRvSGF2ZUxlbmd0aCxcbiAgdG9IYXZlTGFzdFJldHVybmVkV2l0aCxcbiAgdG9IYXZlTnRoUmV0dXJuZWRXaXRoLFxuICB0b0hhdmVQcm9wZXJ0eSxcbiAgdG9IYXZlUmV0dXJuZWRUaW1lcyxcbiAgdG9IYXZlUmV0dXJuZWRXaXRoLFxuICB0b0hhdmVSZXR1cm5lZCxcbiAgdG9NYXRjaE9iamVjdCxcbiAgdG9NYXRjaCxcbiAgdG9SZXR1cm46IHRvSGF2ZVJldHVybmVkLFxuICB0b1JldHVyblRpbWVzOiB0b0hhdmVSZXR1cm5lZFRpbWVzLFxuICB0b1JldHVybldpdGg6IHRvSGF2ZVJldHVybmVkV2l0aCxcbiAgdG9TdHJpY3RFcXVhbCxcbiAgdG9UaHJvdyxcbn07XG5cbi8qKlxuICogKipOb3RlOioqIHRoZSBkb2N1bWVudGF0aW9uIGZvciB0aGlzIG1vZHVsZSBpcyB0YWtlbiBmcm9tIFtKZXN0XShodHRwczovL2dpdGh1Yi5jb20vamVzdGpzL2plc3QvYmxvYi9tYWluL3dlYnNpdGUvdmVyc2lvbmVkX2RvY3MvdmVyc2lvbi0yOS43L0V4cGVjdEFQSS5tZClcbiAqIGFuZCB0aGUgZXhhbXBsZXMgYXJlIHVwZGF0ZWQgZm9yIERlbm8uXG4gKlxuICogVGhlIGBleHBlY3RgIGZ1bmN0aW9uIGlzIHVzZWQgdG8gdGVzdCBhIHZhbHVlLiBZb3Ugd2lsbCB1c2UgYGV4cGVjdGAgYWxvbmcgd2l0aCBhXG4gKiBcIm1hdGNoZXJcIiBmdW5jdGlvbiB0byBhc3NlcnQgc29tZXRoaW5nIGFib3V0IGEgdmFsdWUuXG4gKlxuICogQGV4YW1wbGUgVXNhZ2VcbiAqIGBgYHRzIG5vLWFzc2VydFxuICogaW1wb3J0IHsgZXhwZWN0IH0gZnJvbSBcIkBzdGQvZXhwZWN0XCI7XG4gKlxuICogZnVuY3Rpb24gYmVzdExhQ3JvaXhGbGF2b3IoKTogc3RyaW5nIHtcbiAqICByZXR1cm4gXCJncmFwZWZydWl0XCI7XG4gKiB9XG4gKlxuICogRGVuby50ZXN0KFwidGhlIGJlc3QgZmxhdm9yIGlzIGdyYXBlZnJ1aXRcIiwgKCkgPT4ge1xuICogIGV4cGVjdChiZXN0TGFDcm9peEZsYXZvcigpKS50b0JlKFwiZ3JhcGVmcnVpdFwiKTtcbiAqIH0pO1xuICogYGBgXG4gKlxuICogSW4gdGhpcyBjYXNlLCBgdG9CZWAgaXMgdGhlIG1hdGNoZXIgZnVuY3Rpb24uIFRoZXJlIGFyZSBhIGxvdCBvZiBkaWZmZXJlbnRcbiAqIG1hdGNoZXIgZnVuY3Rpb25zLCBkb2N1bWVudGVkIGluIHRoZSBtYWluIG1vZHVsZSBkZXNjcmlwdGlvbi5cbiAqXG4gKiBUaGUgYXJndW1lbnQgdG8gYGV4cGVjdGAgc2hvdWxkIGJlIHRoZSB2YWx1ZSB0aGF0IHlvdXIgY29kZSBwcm9kdWNlcywgYW5kIGFueVxuICogYXJndW1lbnQgdG8gdGhlIG1hdGNoZXIgc2hvdWxkIGJlIHRoZSBjb3JyZWN0IHZhbHVlLiBJZiB5b3UgbWl4IHRoZW0gdXAsIHlvdXJcbiAqIHRlc3RzIHdpbGwgc3RpbGwgd29yaywgYnV0IHRoZSBlcnJvciBtZXNzYWdlcyBvbiBmYWlsaW5nIHRlc3RzIHdpbGwgbG9va1xuICogc3RyYW5nZS5cbiAqXG4gKiBAcGFyYW0gdmFsdWUgVGhlIHZhbHVlIHRvIHBlcmZvcm0gYXNzZXJ0aW9ucyBvbi5cbiAqIEBwYXJhbSBjdXN0b21NZXNzYWdlIEFuIG9wdGlvbmFsIGN1c3RvbSBtZXNzYWdlIHRvIGluY2x1ZGUgaW4gdGhlIGFzc2VydGlvbiBlcnJvci5cbiAqIEByZXR1cm5zIEFuIGV4cGVjdGVkIG9iamVjdCB0aGF0IGNhbiBiZSB1c2VkIHRvIGNoYWluIG1hdGNoZXJzLlxuICpcbiAqIEB0eXBlUGFyYW0gVCBUaGUgaW50ZXJmYWNlIHVzZWQgZm9yIGBleHBlY3RgLiBUaGlzIGlzIHVzdWFsbHkgbmVlZGVkIG9ubHkgaWYgeW91IHdhbnQgdG8gdXNlIGBleHBlY3QuZXh0ZW5kYCB0byBjcmVhdGUgY3VzdG9tIG1hdGNoZXJzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZXhwZWN0PFQgZXh0ZW5kcyBFeHBlY3RlZCA9IEV4cGVjdGVkPihcbiAgdmFsdWU6IHVua25vd24sXG4gIGN1c3RvbU1lc3NhZ2U/OiBzdHJpbmcsXG4pOiBUIHtcbiAgbGV0IGlzTm90ID0gZmFsc2U7XG4gIGxldCBpc1Byb21pc2VkID0gZmFsc2U7XG4gIGNvbnN0IHNlbGY6IFQgPSBuZXcgUHJveHk8VD4oPFQ+IHt9LCB7XG4gICAgZ2V0KF8sIG5hbWUpIHtcbiAgICAgIGlmIChuYW1lID09PSBcIm5vdFwiKSB7XG4gICAgICAgIGlzTm90ID0gIWlzTm90O1xuICAgICAgICByZXR1cm4gc2VsZjtcbiAgICAgIH1cblxuICAgICAgaWYgKG5hbWUgPT09IFwicmVzb2x2ZXNcIikge1xuICAgICAgICBpZiAoIWlzUHJvbWlzZUxpa2UodmFsdWUpKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKFwiRXhwZWN0ZWQgdmFsdWUgbXVzdCBiZSBQcm9taXNlTGlrZVwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlzUHJvbWlzZWQgPSB0cnVlO1xuICAgICAgICByZXR1cm4gc2VsZjtcbiAgICAgIH1cblxuICAgICAgaWYgKG5hbWUgPT09IFwicmVqZWN0c1wiKSB7XG4gICAgICAgIGlmICghaXNQcm9taXNlTGlrZSh2YWx1ZSkpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IoXCJFeHBlY3RlZCB2YWx1ZSBtdXN0IGJlIGEgUHJvbWlzZUxpa2VcIik7XG4gICAgICAgIH1cblxuICAgICAgICB2YWx1ZSA9IHZhbHVlLnRoZW4oXG4gICAgICAgICAgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IoXG4gICAgICAgICAgICAgIGBQcm9taXNlIGRpZCBub3QgcmVqZWN0OiByZXNvbHZlZCB0byAke3ZhbHVlfWAsXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgKGVycikgPT4gZXJyLFxuICAgICAgICApO1xuICAgICAgICBpc1Byb21pc2VkID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIHNlbGY7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGV4dGVuZE1hdGNoZXJzOiBNYXRjaGVycyA9IGdldEV4dGVuZE1hdGNoZXJzKCk7XG4gICAgICBjb25zdCBhbGxNYXRjaGVycyA9IHtcbiAgICAgICAgLi4ubWF0Y2hlcnMsXG4gICAgICAgIC4uLmV4dGVuZE1hdGNoZXJzLFxuICAgICAgfTtcbiAgICAgIGNvbnN0IG1hdGNoZXIgPSBhbGxNYXRjaGVyc1tuYW1lIGFzIE1hdGNoZXJLZXldIGFzIE1hdGNoZXI7XG4gICAgICBpZiAoIW1hdGNoZXIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICAgICB0eXBlb2YgbmFtZSA9PT0gXCJzdHJpbmdcIlxuICAgICAgICAgICAgPyBgbWF0Y2hlciBub3QgZm91bmQ6ICR7bmFtZX1gXG4gICAgICAgICAgICA6IFwibWF0Y2hlciBub3QgZm91bmRcIixcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuICguLi5hcmdzOiB1bmtub3duW10pID0+IHtcbiAgICAgICAgZnVuY3Rpb24gYXBwbHlNYXRjaGVyKHZhbHVlOiB1bmtub3duLCBhcmdzOiB1bmtub3duW10pIHtcbiAgICAgICAgICBjb25zdCBjb250ZXh0OiBNYXRjaGVyQ29udGV4dCA9IHtcbiAgICAgICAgICAgIHZhbHVlLFxuICAgICAgICAgICAgZXF1YWwsXG4gICAgICAgICAgICBpc05vdDogZmFsc2UsXG4gICAgICAgICAgICBjdXN0b21NZXNzYWdlLFxuICAgICAgICAgICAgY3VzdG9tVGVzdGVyczogZ2V0Q3VzdG9tRXF1YWxpdHlUZXN0ZXJzKCksXG4gICAgICAgICAgfTtcbiAgICAgICAgICBpZiAoaXNOb3QpIHtcbiAgICAgICAgICAgIGNvbnRleHQuaXNOb3QgPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAobmFtZSBpbiBleHRlbmRNYXRjaGVycykge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gbWF0Y2hlcihjb250ZXh0LCAuLi5hcmdzKSBhcyBFeHRlbmRNYXRjaFJlc3VsdDtcbiAgICAgICAgICAgIGlmIChjb250ZXh0LmlzTm90KSB7XG4gICAgICAgICAgICAgIGlmIChyZXN1bHQucGFzcykge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihyZXN1bHQubWVzc2FnZSgpKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmICghcmVzdWx0LnBhc3MpIHtcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKHJlc3VsdC5tZXNzYWdlKCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBtYXRjaGVyKGNvbnRleHQsIC4uLmFyZ3MpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGVtaXRBc3NlcnRpb25UcmlnZ2VyKCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gaXNQcm9taXNlZFxuICAgICAgICAgID8gKHZhbHVlIGFzIFByb21pc2U8dW5rbm93bj4pLnRoZW4oKHZhbHVlOiB1bmtub3duKSA9PlxuICAgICAgICAgICAgYXBwbHlNYXRjaGVyKHZhbHVlLCBhcmdzKVxuICAgICAgICAgIClcbiAgICAgICAgICA6IGFwcGx5TWF0Y2hlcih2YWx1ZSwgYXJncyk7XG4gICAgICB9O1xuICAgIH0sXG4gIH0pO1xuXG4gIHJldHVybiBzZWxmO1xufVxuXG4vKipcbiAqIFlvdSBjYW4gdXNlIGBleHBlY3QuYWRkRXF1YWxpdHlUZXN0ZXJzYCB0byBhZGQgeW91ciBvd24gbWV0aG9kcyB0byB0ZXN0IGlmIHR3b1xuICogb2JqZWN0cyBhcmUgZXF1YWwuIEZvciBleGFtcGxlLCBsZXQncyBzYXkgeW91IGhhdmUgYSBjbGFzcyBpbiB5b3VyIGNvZGUgdGhhdFxuICogcmVwcmVzZW50cyB2b2x1bWUgYW5kIGNhbiBkZXRlcm1pbmUgaWYgdHdvIHZvbHVtZXMgdXNpbmcgZGlmZmVyZW50IHVuaXRzIGFyZVxuICogZXF1YWwuIFlvdSBtYXkgd2FudCBgdG9FcXVhbGAgKGFuZCBvdGhlciBlcXVhbGl0eSBtYXRjaGVycykgdG8gdXNlIHRoaXMgY3VzdG9tXG4gKiBlcXVhbGl0eSBtZXRob2Qgd2hlbiBjb21wYXJpbmcgdG8gVm9sdW1lIGNsYXNzZXMuIFlvdSBjYW4gYWRkIGEgY3VzdG9tIGVxdWFsaXR5XG4gKiB0ZXN0ZXIgdG8gaGF2ZSBgdG9FcXVhbGAgZGV0ZWN0IGFuZCBhcHBseSBjdXN0b20gbG9naWMgd2hlbiBjb21wYXJpbmcgVm9sdW1lXG4gKiBjbGFzc2VzOlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgZXhwZWN0IH0gZnJvbSBcIkBzdGQvZXhwZWN0XCI7XG4gKlxuICogY2xhc3MgVm9sdW1lIHtcbiAqICAgYW1vdW50OiBudW1iZXI7XG4gKiAgIHVuaXQ6IFwiTFwiIHwgXCJtTFwiO1xuICpcbiAqICAgY29uc3RydWN0b3IoYW1vdW50OiBudW1iZXIsIHVuaXQ6IFwiTFwiIHwgXCJtTFwiKSB7XG4gKiAgICAgdGhpcy5hbW91bnQgPSBhbW91bnQ7XG4gKiAgICAgdGhpcy51bml0ID0gdW5pdDtcbiAqICAgfVxuICpcbiAqICAgdG9TdHJpbmcoKSB7XG4gKiAgICAgcmV0dXJuIGBbVm9sdW1lICR7dGhpcy5hbW91bnR9JHt0aGlzLnVuaXR9XWA7XG4gKiAgIH1cbiAqXG4gKiAgIGVxdWFscyhvdGhlcjogVm9sdW1lKSB7XG4gKiAgICAgaWYgKHRoaXMudW5pdCA9PT0gb3RoZXIudW5pdCkge1xuICogICAgICAgcmV0dXJuIHRoaXMuYW1vdW50ID09PSBvdGhlci5hbW91bnQ7XG4gKiAgICAgfSBlbHNlIGlmICh0aGlzLnVuaXQgPT09IFwiTFwiICYmIG90aGVyLnVuaXQgPT09IFwibUxcIikge1xuICogICAgICAgcmV0dXJuIHRoaXMuYW1vdW50ICogMTAwMCA9PT0gb3RoZXIuYW1vdW50O1xuICogICAgIH0gZWxzZSB7XG4gKiAgICAgICByZXR1cm4gdGhpcy5hbW91bnQgPT09IG90aGVyLmFtb3VudCAqIDEwMDA7XG4gKiAgICAgfVxuICogICB9XG4gKiB9XG4gKlxuICogZnVuY3Rpb24gYXJlVm9sdW1lc0VxdWFsKGE6IFZvbHVtZSwgYjogVm9sdW1lKSB7XG4gKiAgIGNvbnN0IGlzQVZvbHVtZSA9IGEgaW5zdGFuY2VvZiBWb2x1bWU7XG4gKiAgIGNvbnN0IGlzQlZvbHVtZSA9IGIgaW5zdGFuY2VvZiBWb2x1bWU7XG4gKiAgIGlmIChpc0FWb2x1bWUgJiYgaXNCVm9sdW1lKSB7XG4gKiAgICAgcmV0dXJuIGEuZXF1YWxzKGIpO1xuICogICB9IGVsc2UgaWYgKGlzQVZvbHVtZSA9PT0gaXNCVm9sdW1lKSB7XG4gKiAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAqICAgfSBlbHNlIHtcbiAqICAgICByZXR1cm4gZmFsc2U7XG4gKiAgIH1cbiAqIH1cbiAqXG4gKiBleHBlY3QuYWRkRXF1YWxpdHlUZXN0ZXJzKFthcmVWb2x1bWVzRXF1YWxdKTtcbiAqXG4gKiBEZW5vLnRlc3QoXCJhcmUgZXF1YWwgd2l0aCBkaWZmZXJlbnQgdW5pdHNcIiwgKCkgPT4ge1xuICogICBleHBlY3QobmV3IFZvbHVtZSgxLCBcIkxcIikpLnRvRXF1YWwobmV3IFZvbHVtZSgxMDAwLCBcIm1MXCIpKTtcbiAqIH0pO1xuICogYGBgXG4gKi9cbmV4cGVjdC5hZGRFcXVhbGl0eVRlc3RlcnMgPSBhZGRDdXN0b21FcXVhbGl0eVRlc3RlcnMgYXMgKFxuICBuZXdUZXN0ZXJzOiBUZXN0ZXJbXSxcbikgPT4gdm9pZDtcbi8qKlxuICogRXh0ZW5kIGBleHBlY3QoKWAgd2l0aCBjdXN0b20gcHJvdmlkZWQgbWF0Y2hlcnMuXG4gKlxuICogVG8gZG8gc28sIHlvdSB3aWxsIG5lZWQgdG8gZXh0ZW5kIHRoZSBpbnRlcmZhY2UgYEV4cGVjdGVkYCB0byBkZWZpbmUgdGhlIG5ldyBzaWduYXR1cmUgb2YgdGhlIGBleHBlY3RgLlxuICpcbiAqIGBgYHRzXG4gKiBpbXBvcnQgdHlwZSB7IEFzeW5jLCBFeHBlY3RlZCB9IGZyb20gXCIuL2V4cGVjdC50c1wiO1xuICogaW1wb3J0IHsgZXhwZWN0IH0gZnJvbSBcIi4vZXhwZWN0LnRzXCI7XG4gKlxuICogLy8gRXh0ZW5kcyB0aGUgYEV4cGVjdGVkYCBpbnRlcmZhY2Ugd2l0aCB5b3VyIG5ldyBtYXRjaGVycyBzaWduYXR1cmVzXG4gKiBpbnRlcmZhY2UgRXh0ZW5kZWRFeHBlY3RlZDxJc0FzeW5jID0gZmFsc2U+IGV4dGVuZHMgRXhwZWN0ZWQ8SXNBc3luYz4ge1xuICogICAvLyBNYXRjaGVyIHRoYXQgYXNzZXJ0cyB2YWx1ZSBpcyBhIGRpbm9zYXVyXG4gKiAgIHRvQmVEaW5vc2F1cjogKG9wdGlvbnM/OiB7IGluY2x1ZGVUcmV4cz86IGJvb2xlYW4gfSkgPT4gdW5rbm93bjtcbiAqXG4gKiAgIC8vIE5PVEU6IFlvdSBhbHNvIG5lZWQgdG8gb3ZlcnJpZGVzIHRoZSBmb2xsb3dpbmcgdHlwaW5ncyB0byBhbGxvdyBtb2RpZmllcnMgdG8gY29ycmVjdGx5IGluZmVyIHR5cGluZ1xuICogICBub3Q6IElzQXN5bmMgZXh0ZW5kcyB0cnVlID8gQXN5bmM8RXh0ZW5kZWRFeHBlY3RlZDx0cnVlPj5cbiAqICAgICA6IEV4dGVuZGVkRXhwZWN0ZWQ8ZmFsc2U+O1xuICogICByZXNvbHZlczogQXN5bmM8RXh0ZW5kZWRFeHBlY3RlZDx0cnVlPj47XG4gKiAgIHJlamVjdHM6IEFzeW5jPEV4dGVuZGVkRXhwZWN0ZWQ8dHJ1ZT4+O1xuICogfVxuICpcbiAqIC8vIENhbGwgYGV4cGVjdC5leHRlbmQoKWAgd2l0aCB5b3VyIG5ldyBtYXRjaGVycyBkZWZpbml0aW9uc1xuICogZXhwZWN0LmV4dGVuZCh7XG4gKiAgIHRvQmVEaW5vc2F1cihjb250ZXh0LCBvcHRpb25zKSB7XG4gKiAgICAgY29uc3QgZGlubyA9IGAke2NvbnRleHQudmFsdWV9YDtcbiAqICAgICBjb25zdCBhbGxvd2VkID0gW1wi8J+mlVwiXTtcbiAqICAgICBpZiAob3B0aW9ucz8uaW5jbHVkZVRyZXhzKSB7XG4gKiAgICAgICBhbGxvd2VkLnB1c2goXCLwn6aWXCIpO1xuICogICAgIH1cbiAqICAgICBjb25zdCBwYXNzID0gYWxsb3dlZC5pbmNsdWRlcyhkaW5vKTtcbiAqICAgICBpZiAoY29udGV4dC5pc05vdCkge1xuICogICAgICAgLy8gTm90ZTogd2hlbiBgY29udGV4dC5pc05vdGAgaXMgc2V0LCB0aGUgdGVzdCBpcyBjb25zaWRlcmVkIHN1Y2Nlc3NmdWwgd2hlbiBgcGFzc2AgaXMgZmFsc2VcbiAqICAgICAgIHJldHVybiB7XG4gKiAgICAgICAgIG1lc3NhZ2U6ICgpID0+IGBFeHBlY3RlZCBcIiR7ZGlub31cIiB0byBOT1QgYmUgYSBkaW5vc2F1cmAsXG4gKiAgICAgICAgIHBhc3MsXG4gKiAgICAgICB9O1xuICogICAgIH1cbiAqICAgICByZXR1cm4geyBtZXNzYWdlOiAoKSA9PiBgRXhwZWN0ZWQgXCIke2Rpbm99XCIgdG8gYmUgYSBkaW5vc2F1cmAsIHBhc3MgfTtcbiAqICAgfSxcbiAqIH0pO1xuICpcbiAqIC8vIEFsaWFzIGV4cGVjdCB0byBhdm9pZCBoYXZpbmcgdG8gcGFzcyB0aGUgZ2VuZXJpYyB0eXBpbmcgYXJndW1lbnQgZWFjaCB0aW1lXG4gKiAvLyBUaGlzIGlzIHByb2JhYmx5IHdoYXQgeW91IHdhbnQgdG8gZXhwb3J0IGFuZCByZXVzZSBhY3Jvc3MgeW91ciB0ZXN0c1xuICogY29uc3QgbXlleHBlY3QgPSBleHBlY3Q8RXh0ZW5kZWRFeHBlY3RlZD47XG4gKlxuICogLy8gUGVyZm9ybSBzb21lIHRlc3RzXG4gKiBteWV4cGVjdChcIvCfppVcIikudG9CZURpbm9zYXVyKCk7XG4gKiBteWV4cGVjdChcIvCfpqdcIikubm90LnRvQmVEaW5vc2F1cigpO1xuICogYXdhaXQgbXlleHBlY3QoUHJvbWlzZS5yZXNvbHZlKFwi8J+mlVwiKSkucmVzb2x2ZXMudG9CZURpbm9zYXVyKCk7XG4gKiBhd2FpdCBteWV4cGVjdChQcm9taXNlLnJlc29sdmUoXCLwn6anXCIpKS5yZXNvbHZlcy5ub3QudG9CZURpbm9zYXVyKCk7XG4gKlxuICogLy8gUmVndWxhciBtYXRjaGVycyB3aWxsIHN0aWxsIGJlIGF2YWlsYWJsZVxuICogbXlleHBlY3QoXCJmb29cIikubm90LnRvQmVOdWxsKClcbiAqIG15ZXhwZWN0LmFueXRoaW5nXG4gKiBgYGBcbiAqL1xuZXhwZWN0LmV4dGVuZCA9IHNldEV4dGVuZE1hdGNoZXJzIGFzIChuZXdFeHRlbmRNYXRjaGVyczogTWF0Y2hlcnMpID0+IHZvaWQ7XG4vKipcbiAqIGBleHBlY3QuYW55dGhpbmcoKWAgbWF0Y2hlcyBhbnl0aGluZyBidXQgYG51bGxgIG9yIGB1bmRlZmluZWRgLiBZb3UgY2FuIHVzZSBpdFxuICogaW5zaWRlIGB0b0VxdWFsYCBvciBgdG9IYXZlQmVlbkNhbGxlZFdpdGhgIGluc3RlYWQgb2YgYSBsaXRlcmFsIHZhbHVlLlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgZXhwZWN0LCBmbiB9IGZyb20gXCJAc3RkL2V4cGVjdFwiO1xuICpcbiAqIERlbm8udGVzdChcIm1hcCBjYWxscyBpdHMgYXJndW1lbnQgd2l0aCBhIG5vbi1udWxsIGFyZ3VtZW50XCIsICgpID0+IHtcbiAqICAgY29uc3QgbW9jayA9IGZuKCk7XG4gKiAgIFsxXS5tYXAoKHgpID0+IG1vY2soeCkpO1xuICogICBleHBlY3QobW9jaykudG9IYXZlQmVlbkNhbGxlZFdpdGgoZXhwZWN0LmFueXRoaW5nKCkpO1xuICogfSk7XG5gYGBcbiAqL1xuZXhwZWN0LmFueXRoaW5nID0gYXN5bW1ldHJpY01hdGNoZXJzLmFueXRoaW5nIGFzICgpID0+IFJldHVyblR5cGU8XG4gIHR5cGVvZiBhc3ltbWV0cmljTWF0Y2hlcnMuYW55dGhpbmdcbj47XG4vKipcbiAqIGBleHBlY3QuYW55KGNvbnN0cnVjdG9yKWAgbWF0Y2hlcyBhbnl0aGluZyB0aGF0IHdhcyBjcmVhdGVkIHdpdGggdGhlIGdpdmVuXG4gKiBjb25zdHJ1Y3RvciBvciBpZiBpdCdzIGEgcHJpbWl0aXZlIHRoYXQgaXMgb2YgdGhlIHBhc3NlZCB0eXBlLiBZb3UgY2FuIHVzZSBpdFxuICogaW5zaWRlIGB0b0VxdWFsYCBvciBgdG9IYXZlQmVlbkNhbGxlZFdpdGhgIGluc3RlYWQgb2YgYSBsaXRlcmFsIHZhbHVlLlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgZXhwZWN0IH0gZnJvbSBcIkBzdGQvZXhwZWN0XCI7XG4gKlxuICogY2xhc3MgQ2F0IHt9XG4gKiBEZW5vLnRlc3QoXCJleHBlY3QuYW55KClcIiwgKCkgPT4ge1xuICogICBleHBlY3QobmV3IENhdCgpKS50b0VxdWFsKGV4cGVjdC5hbnkoQ2F0KSk7XG4gKiAgIGV4cGVjdChcIkhlbGxvXCIpLnRvRXF1YWwoZXhwZWN0LmFueShTdHJpbmcpKTtcbiAqICAgZXhwZWN0KDEpLnRvRXF1YWwoZXhwZWN0LmFueShOdW1iZXIpKTtcbiAqICAgZXhwZWN0KCgpID0+IHt9KS50b0VxdWFsKGV4cGVjdC5hbnkoRnVuY3Rpb24pKTtcbiAqICAgZXhwZWN0KGZhbHNlKS50b0VxdWFsKGV4cGVjdC5hbnkoQm9vbGVhbikpO1xuICogICBleHBlY3QoQmlnSW50KDEpKS50b0VxdWFsKGV4cGVjdC5hbnkoQmlnSW50KSk7XG4gKiAgIGV4cGVjdChTeW1ib2woXCJzeW1cIikpLnRvRXF1YWwoZXhwZWN0LmFueShTeW1ib2wpKTtcbiAqIH0pO1xuICogYGBgXG4gKi9cbmV4cGVjdC5hbnkgPSBhc3ltbWV0cmljTWF0Y2hlcnMuYW55IGFzIChcbiAgYzogdW5rbm93bixcbikgPT4gUmV0dXJuVHlwZTx0eXBlb2YgYXN5bW1ldHJpY01hdGNoZXJzLmFueT47XG4vKipcbiAqIGBleHBlY3QuYXJyYXlDb250YWluaW5nKGFycmF5KWAgbWF0Y2hlcyBhIHJlY2VpdmVkIGFycmF5IHdoaWNoIGNvbnRhaW5zIGFsbCBvZlxuICogdGhlIGVsZW1lbnRzIGluIHRoZSBleHBlY3RlZCBhcnJheS4gVGhhdCBpcywgdGhlIGV4cGVjdGVkIGFycmF5IGlzIGEgKipzdWJzZXQqKlxuICogb2YgdGhlIHJlY2VpdmVkIGFycmF5LiBUaGVyZWZvcmUsIGl0IG1hdGNoZXMgYSByZWNlaXZlZCBhcnJheSB3aGljaCBjb250YWluc1xuICogZWxlbWVudHMgdGhhdCBhcmUgKipub3QqKiBpbiB0aGUgZXhwZWN0ZWQgYXJyYXkuXG4gKlxuICogWW91IGNhbiB1c2UgaXQgaW5zdGVhZCBvZiBhIGxpdGVyYWwgdmFsdWU6XG4gKlxuICogLSBpbiBgdG9FcXVhbGAgb3IgYHRvSGF2ZUJlZW5DYWxsZWRXaXRoYFxuICogLSB0byBtYXRjaCBhIHByb3BlcnR5IGluIGBvYmplY3RDb250YWluaW5nYCBvciBgdG9NYXRjaE9iamVjdGBcbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHNcbiAqIGltcG9ydCB7IGV4cGVjdCB9IGZyb20gXCJAc3RkL2V4cGVjdFwiO1xuICpcbiAqIERlbm8udGVzdChcImV4cGVjdC5hcnJheUNvbnRhaW5pbmcoKSB3aXRoIGFycmF5IG9mIG51bWJlcnNcIiwgKCkgPT4ge1xuICogICBjb25zdCBhcnIgPSBbMSwgMiwgM107XG4gKiAgIGV4cGVjdChbMSwgMiwgMywgNF0pLnRvRXF1YWwoZXhwZWN0LmFycmF5Q29udGFpbmluZyhhcnIpKTtcbiAqICAgZXhwZWN0KFs0LCA1LCA2XSkubm90LnRvRXF1YWwoZXhwZWN0LmFycmF5Q29udGFpbmluZyhhcnIpKTtcbiAqICAgZXhwZWN0KFsxLCAyLCAzXSkudG9FcXVhbChleHBlY3QuYXJyYXlDb250YWluaW5nKGFycikpO1xuICogfSk7XG4gKiBgYGBcbiAqL1xuZXhwZWN0LmFycmF5Q29udGFpbmluZyA9IGFzeW1tZXRyaWNNYXRjaGVycy5hcnJheUNvbnRhaW5pbmcgYXMgKFxuICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICBjOiBhbnlbXSxcbikgPT4gUmV0dXJuVHlwZTx0eXBlb2YgYXN5bW1ldHJpY01hdGNoZXJzLmFycmF5Q29udGFpbmluZz47XG4vKipcbiAqIGBleHBlY3QuY2xvc2VUbyhudW1iZXIsIG51bURpZ2l0cz8pYCBpcyB1c2VmdWwgd2hlbiBjb21wYXJpbmcgZmxvYXRpbmcgcG9pbnRcbiAqIG51bWJlcnMgaW4gb2JqZWN0IHByb3BlcnRpZXMgb3IgYXJyYXkgaXRlbS4gSWYgeW91IG5lZWQgdG8gY29tcGFyZSBhIG51bWJlcixcbiAqIHBsZWFzZSB1c2UgYC50b0JlQ2xvc2VUb2AgaW5zdGVhZC5cbiAqXG4gKiBUaGUgb3B0aW9uYWwgYG51bURpZ2l0c2AgYXJndW1lbnQgbGltaXRzIHRoZSBudW1iZXIgb2YgZGlnaXRzIHRvIGNoZWNrICoqYWZ0ZXIqKlxuICogdGhlIGRlY2ltYWwgcG9pbnQuIEZvciB0aGUgZGVmYXVsdCB2YWx1ZSBgMmAsIHRoZSB0ZXN0IGNyaXRlcmlvbiBpc1xuICogYE1hdGguYWJzKGV4cGVjdGVkIC0gcmVjZWl2ZWQpIDwgMC4wMDUgKHRoYXQgaXMsIDEwICoqIC0yIC8gMilgLlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgZXhwZWN0IH0gZnJvbSBcIkBzdGQvZXhwZWN0XCI7XG4gKlxuICogRGVuby50ZXN0KFwiY29tcGFyZSBmbG9hdCBpbiBvYmplY3QgcHJvcGVydGllc1wiLCAoKSA9PiB7XG4gKiAgIGV4cGVjdCh7XG4gKiAgICAgdGl0bGU6IFwiMC4xICsgMC4yXCIsXG4gKiAgICAgc3VtOiAwLjEgKyAwLjIsXG4gKiAgIH0pLnRvRXF1YWwoe1xuICogICAgIHRpdGxlOiBcIjAuMSArIDAuMlwiLFxuICogICAgIHN1bTogZXhwZWN0LmNsb3NlVG8oMC4zLCA1KSxcbiAqICAgfSk7XG4gKiB9KTtcbiAqIGBgYFxuICovXG5leHBlY3QuY2xvc2VUbyA9IGFzeW1tZXRyaWNNYXRjaGVycy5jbG9zZVRvIGFzIChcbiAgbnVtOiBudW1iZXIsXG4gIG51bURpZ2l0cz86IG51bWJlcixcbikgPT4gUmV0dXJuVHlwZTx0eXBlb2YgYXN5bW1ldHJpY01hdGNoZXJzLmNsb3NlVG8+O1xuLyoqXG4gKiBgZXhwZWN0LnN0cmluZ0NvbnRhaW5pbmcoc3RyaW5nKWAgbWF0Y2hlcyB0aGUgcmVjZWl2ZWQgdmFsdWUgaWYgaXQgaXMgYSBzdHJpbmdcbiAqIHRoYXQgY29udGFpbnMgdGhlIGV4YWN0IGV4cGVjdGVkIHN0cmluZy5cbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHNcbiAqIGltcG9ydCB7IGV4cGVjdCB9IGZyb20gXCJAc3RkL2V4cGVjdFwiO1xuICpcbiAqIERlbm8udGVzdChcImV4cGVjdC5zdHJpbmdDb250YWluaW5nKCkgd2l0aCBzdHJpbmdzXCIsICgpID0+IHtcbiAqICAgZXhwZWN0KFwiaHR0cHM6Ly9kZW5vLmNvbS9cIikudG9FcXVhbChleHBlY3Quc3RyaW5nQ29udGFpbmluZyhcImRlbm9cIikpO1xuICogICBleHBlY3QoXCJmdW5jdGlvblwiKS50b0VxdWFsKGV4cGVjdC5zdHJpbmdDb250YWluaW5nKFwiZnVuY1wiKSk7XG4gKlxuICogICBleHBlY3QoXCJIZWxsbywgV29ybGRcIikubm90LnRvRXF1YWwoZXhwZWN0LnN0cmluZ0NvbnRhaW5pbmcoXCJoZWxsb1wiKSk7XG4gKiAgIGV4cGVjdChcImZvb2JhclwiKS5ub3QudG9FcXVhbChleHBlY3Quc3RyaW5nQ29udGFpbmluZyhcImJhenpcIikpO1xuICogfSk7XG4gKiBgYGBcbiAqL1xuZXhwZWN0LnN0cmluZ0NvbnRhaW5pbmcgPSBhc3ltbWV0cmljTWF0Y2hlcnMuc3RyaW5nQ29udGFpbmluZyBhcyAoXG4gIHN0cjogc3RyaW5nLFxuKSA9PiBSZXR1cm5UeXBlPHR5cGVvZiBhc3ltbWV0cmljTWF0Y2hlcnMuc3RyaW5nQ29udGFpbmluZz47XG4vKipcbiAqIGBleHBlY3Quc3RyaW5nTWF0Y2hpbmcoc3RyaW5nIHwgcmVnZXhwKWAgbWF0Y2hlcyB0aGUgcmVjZWl2ZWQgdmFsdWUgaWYgaXQgaXMgYVxuICogc3RyaW5nIHRoYXQgbWF0Y2hlcyB0aGUgZXhwZWN0ZWQgc3RyaW5nIG9yIHJlZ3VsYXIgZXhwcmVzc2lvbi5cbiAqXG4gKiBZb3UgY2FuIHVzZSBpdCBpbnN0ZWFkIG9mIGEgbGl0ZXJhbCB2YWx1ZTpcbiAqXG4gKiAtIGluIGB0b0VxdWFsYCBvciBgdG9IYXZlQmVlbkNhbGxlZFdpdGhgXG4gKiAtIHRvIG1hdGNoIGFuIGVsZW1lbnQgaW4gYGFycmF5Q29udGFpbmluZ2BcbiAqIC0gdG8gbWF0Y2ggYSBwcm9wZXJ0eSBpbiBgb2JqZWN0Q29udGFpbmluZ2AgKG5vdCBhdmFpbGFibGUgeWV0KSBvciBgdG9NYXRjaE9iamVjdGBcbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHNcbiAqIGltcG9ydCB7IGV4cGVjdCB9IGZyb20gXCJAc3RkL2V4cGVjdFwiO1xuICpcbiAqIERlbm8udGVzdChcImV4YW1wbGVcIiwgKCkgPT4ge1xuICogICBleHBlY3QoXCJkZW5vX3N0ZFwiKS50b0VxdWFsKGV4cGVjdC5zdHJpbmdNYXRjaGluZygvc3RkLykpO1xuICogICBleHBlY3QoXCIwMTIzNDU2Nzg5XCIpLnRvRXF1YWwoZXhwZWN0LnN0cmluZ01hdGNoaW5nKC9cXGQrLykpO1xuICogICBleHBlY3QoXCJlXCIpLm5vdC50b0VxdWFsKGV4cGVjdC5zdHJpbmdNYXRjaGluZygvXFxzLykpO1xuICogICBleHBlY3QoXCJxdWV1ZVwiKS5ub3QudG9FcXVhbChleHBlY3Quc3RyaW5nTWF0Y2hpbmcoL2VuLykpO1xuICogfSk7XG4gKiBgYGBcbiAqL1xuZXhwZWN0LnN0cmluZ01hdGNoaW5nID0gYXN5bW1ldHJpY01hdGNoZXJzLnN0cmluZ01hdGNoaW5nIGFzIChcbiAgcGF0dGVybjogc3RyaW5nIHwgUmVnRXhwLFxuKSA9PiBSZXR1cm5UeXBlPHR5cGVvZiBhc3ltbWV0cmljTWF0Y2hlcnMuc3RyaW5nTWF0Y2hpbmc+O1xuXG4vKipcbiAqIGBleHBlY3QuaGFzQXNzZXJ0aW9uc2AgdmVyaWZpZXMgdGhhdCBhdCBsZWFzdCBvbmUgYXNzZXJ0aW9uIGlzIGNhbGxlZCBkdXJpbmcgYSB0ZXN0LlxuICpcbiAqIE5vdGU6IGV4cGVjdC5oYXNBc3NlcnRpb25zIG9ubHkgY2FuIHVzZSBpbiBiZGQgZnVuY3Rpb24gdGVzdCBzdWl0ZSwgc3VjaCBhcyBgdGVzdGAgb3IgYGl0YC5cbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHNcbiAqXG4gKiBpbXBvcnQgeyB0ZXN0IH0gZnJvbSBcIkBzdGQvdGVzdGluZy9iZGRcIjtcbiAqIGltcG9ydCB7IGV4cGVjdCB9IGZyb20gXCJAc3RkL2V4cGVjdFwiO1xuICpcbiAqIHRlc3QoXCJpdCB3b3Jrc1wiLCAoKSA9PiB7XG4gKiAgIGV4cGVjdC5oYXNBc3NlcnRpb25zKCk7XG4gKiAgIGV4cGVjdChcImFcIikubm90LnRvQmUoXCJiXCIpO1xuICogfSk7XG4gKiBgYGBcbiAqL1xuZXhwZWN0Lmhhc0Fzc2VydGlvbnMgPSBoYXNBc3NlcnRpb25zIGFzICgpID0+IHZvaWQ7XG5cbi8qKlxuICogYGV4cGVjdC5hc3NlcnRpb25zYCB2ZXJpZmllcyB0aGF0IGEgY2VydGFpbiBudW1iZXIgb2YgYXNzZXJ0aW9ucyBhcmUgY2FsbGVkIGR1cmluZyBhIHRlc3QuXG4gKlxuICogTm90ZTogZXhwZWN0LmFzc2VydGlvbnMgb25seSBjYW4gdXNlIGluIGJkZCBmdW5jdGlvbiB0ZXN0IHN1aXRlLCBzdWNoIGFzIGB0ZXN0YCBvciBgaXRgLlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0c1xuICpcbiAqIGltcG9ydCB7IHRlc3QgfSBmcm9tIFwiQHN0ZC90ZXN0aW5nL2JkZFwiO1xuICogaW1wb3J0IHsgZXhwZWN0IH0gZnJvbSBcIkBzdGQvZXhwZWN0XCI7XG4gKlxuICogdGVzdChcIml0IHdvcmtzXCIsICgpID0+IHtcbiAqICAgZXhwZWN0LmFzc2VydGlvbnMoMSk7XG4gKiAgIGV4cGVjdChcImFcIikubm90LnRvQmUoXCJiXCIpO1xuICogfSk7XG4gKiBgYGBcbiAqL1xuZXhwZWN0LmFzc2VydGlvbnMgPSBhc3NlcnRpb25zIGFzIChudW06IG51bWJlcikgPT4gdm9pZDtcblxuLyoqXG4gKiBgZXhwZWN0Lm9iamVjdENvbnRhaW5pbmcob2JqZWN0KWAgbWF0Y2hlcyBhbnkgcmVjZWl2ZWQgb2JqZWN0IHRoYXQgcmVjdXJzaXZlbHkgbWF0Y2hlcyB0aGUgZXhwZWN0ZWQgcHJvcGVydGllcy5cbiAqIFRoYXQgaXMsIHRoZSBleHBlY3RlZCBvYmplY3QgaXMgbm90IGEgc3Vic2V0IG9mIHRoZSByZWNlaXZlZCBvYmplY3QuIFRoZXJlZm9yZSwgaXQgbWF0Y2hlcyBhIHJlY2VpdmVkIG9iamVjdFxuICogd2hpY2ggY29udGFpbnMgcHJvcGVydGllcyB0aGF0IGFyZSBub3QgaW4gdGhlIGV4cGVjdGVkIG9iamVjdC5cbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHNcbiAqIGltcG9ydCB7IGV4cGVjdCB9IGZyb20gXCJAc3RkL2V4cGVjdFwiO1xuICpcbiAqIERlbm8udGVzdChcImV4YW1wbGVcIiwgKCkgPT4ge1xuICogICBleHBlY3QoeyBiYXI6ICdiYXonIH0pLnRvRXF1YWwoZXhwZWN0Lm9iamVjdENvbnRhaW5pbmcoeyBiYXI6ICdiYXonfSkpO1xuICogICBleHBlY3QoeyBiYXI6ICdiYXonIH0pLm5vdC50b0VxdWFsKGV4cGVjdC5vYmplY3RDb250YWluaW5nKHsgZm9vOiAnYmFyJ30pKTtcbiAqIH0pO1xuICogYGBgXG4gKi9cbmV4cGVjdC5vYmplY3RDb250YWluaW5nID0gYXN5bW1ldHJpY01hdGNoZXJzLm9iamVjdENvbnRhaW5pbmcgYXMgKFxuICBvYmo6IFJlY29yZDxzdHJpbmcsIHVua25vd24+LFxuKSA9PiBSZXR1cm5UeXBlPHR5cGVvZiBhc3ltbWV0cmljTWF0Y2hlcnMub2JqZWN0Q29udGFpbmluZz47XG4vKipcbiAqIGBleHBlY3Qubm90LmFycmF5Q29udGFpbmluZ2AgbWF0Y2hlcyBhIHJlY2VpdmVkIGFycmF5IHdoaWNoIGRvZXMgbm90IGNvbnRhaW5cbiAqIGFsbCBvZiB0aGUgZWxlbWVudHMgaW4gdGhlIGV4cGVjdGVkIGFycmF5LiBUaGF0IGlzLCB0aGUgZXhwZWN0ZWQgYXJyYXkgaXMgbm90XG4gKiBhIHN1YnNldCBvZiB0aGUgcmVjZWl2ZWQgYXJyYXkuXG4gKlxuICogYGV4cGVjdC5ub3Qub2JqZWN0Q29udGFpbmluZ2AgbWF0Y2hlcyBhbnkgcmVjZWl2ZWQgb2JqZWN0IHRoYXQgZG9lcyBub3QgcmVjdXJzaXZlbHlcbiAqIG1hdGNoIHRoZSBleHBlY3RlZCBwcm9wZXJ0aWVzLiBUaGF0IGlzLCB0aGUgZXhwZWN0ZWQgb2JqZWN0IGlzIG5vdCBhIHN1YnNldCBvZiB0aGVcbiAqIHJlY2VpdmVkIG9iamVjdC4gVGhlcmVmb3JlLCBpdCBtYXRjaGVzIGEgcmVjZWl2ZWQgb2JqZWN0IHdoaWNoIGNvbnRhaW5zIHByb3BlcnRpZXNcbiAqIHRoYXQgYXJlIG5vdCBpbiB0aGUgZXhwZWN0ZWQgb2JqZWN0LlxuICpcbiAqIGBleHBlY3Qubm90LnN0cmluZ0NvbnRhaW5pbmdgIG1hdGNoZXMgdGhlIHJlY2VpdmVkIHZhbHVlIGlmIGl0IGlzIG5vdCBhIHN0cmluZ1xuICogb3IgaWYgaXQgaXMgYSBzdHJpbmcgdGhhdCBkb2VzIG5vdCBjb250YWluIHRoZSBleGFjdCBleHBlY3RlZCBzdHJpbmcuXG4gKlxuICogYGV4cGVjdC5ub3Quc3RyaW5nTWF0Y2hpbmdgIG1hdGNoZXMgdGhlIHJlY2VpdmVkIHZhbHVlIGlmIGl0IGlzIG5vdCBhIHN0cmluZ1xuICogb3IgaWYgaXQgaXMgYSBzdHJpbmcgdGhhdCBkb2VzIG5vdCBtYXRjaCB0aGUgZXhwZWN0ZWQgc3RyaW5nIG9yIHJlZ3VsYXIgZXhwcmVzc2lvbi5cbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHNcbiAqIGltcG9ydCB7IGV4cGVjdCB9IGZyb20gXCJAc3RkL2V4cGVjdFwiO1xuICpcbiAqIERlbm8udGVzdChcImV4cGVjdC5ub3QuYXJyYXlDb250YWluaW5nXCIsICgpID0+IHtcbiAqICAgY29uc3QgZXhwZWN0ZWQgPSBbXCJTYW1hbnRoYVwiXTtcbiAqICAgZXhwZWN0KFtcIkFsaWNlXCIsIFwiQm9iXCIsIFwiRXZlXCJdKS50b0VxdWFsKGV4cGVjdC5ub3QuYXJyYXlDb250YWluaW5nKGV4cGVjdGVkKSk7XG4gKiB9KTtcbiAqXG4gKiBEZW5vLnRlc3QoXCJleHBlY3Qubm90Lm9iamVjdENvbnRhaW5pbmdcIiwgKCkgPT4ge1xuICogICBjb25zdCBleHBlY3RlZCA9IHsgZm9vOiBcImJhclwiIH07XG4gKiAgIGV4cGVjdCh7IGJhcjogXCJiYXpcIiB9KS50b0VxdWFsKGV4cGVjdC5ub3Qub2JqZWN0Q29udGFpbmluZyhleHBlY3RlZCkpO1xuICogfSk7XG4gKlxuICogRGVuby50ZXN0KFwiZXhwZWN0Lm5vdC5zdHJpbmdDb250YWluaW5nXCIsICgpID0+IHtcbiAqICAgY29uc3QgZXhwZWN0ZWQgPSBcIkhlbGxvIHdvcmxkIVwiO1xuICogICBleHBlY3QoXCJIb3cgYXJlIHlvdT9cIikudG9FcXVhbChleHBlY3Qubm90LnN0cmluZ0NvbnRhaW5pbmcoZXhwZWN0ZWQpKTtcbiAqIH0pO1xuICpcbiAqIERlbm8udGVzdChcImV4cGVjdC5ub3Quc3RyaW5nTWF0Y2hpbmdcIiwgKCkgPT4ge1xuICogICBjb25zdCBleHBlY3RlZCA9IC9IZWxsbyB3b3JsZCEvO1xuICogICBleHBlY3QoXCJIb3cgYXJlIHlvdT9cIikudG9FcXVhbChleHBlY3Qubm90LnN0cmluZ01hdGNoaW5nKGV4cGVjdGVkKSk7XG4gKiB9KTtcbiAqIGBgYFxuICovXG5leHBlY3Qubm90ID0ge1xuICBhcnJheUNvbnRhaW5pbmc6IGFzeW1tZXRyaWNNYXRjaGVycy5hcnJheU5vdENvbnRhaW5pbmcsXG4gIG9iamVjdENvbnRhaW5pbmc6IGFzeW1tZXRyaWNNYXRjaGVycy5vYmplY3ROb3RDb250YWluaW5nLFxuICBzdHJpbmdDb250YWluaW5nOiBhc3ltbWV0cmljTWF0Y2hlcnMuc3RyaW5nTm90Q29udGFpbmluZyxcbiAgc3RyaW5nTWF0Y2hpbmc6IGFzeW1tZXRyaWNNYXRjaGVycy5zdHJpbmdOb3RNYXRjaGluZyxcbn07XG4vKipcbiAqIGBleHBlY3QuYWRkU25hcHNob3RTZXJpYWxpemVyYCBhZGRzIGEgbW9kdWxlIHRoYXQgZm9ybWF0cyBhcHBsaWNhdGlvbi1zcGVjaWZpYyBkYXRhIHN0cnVjdHVyZXMuXG4gKlxuICogRm9yIGFuIGluZGl2aWR1YWwgdGVzdCBmaWxlLCBhbiBhZGRlZCBtb2R1bGUgcHJlY2VkZXMgYW55IG1vZHVsZXMgZnJvbSBzbmFwc2hvdFNlcmlhbGl6ZXJzIGNvbmZpZ3VyYXRpb24sXG4gKiB3aGljaCBwcmVjZWRlIHRoZSBkZWZhdWx0IHNuYXBzaG90IHNlcmlhbGl6ZXJzIGZvciBidWlsdC1pbiBKYXZhU2NyaXB0IHR5cGVzLlxuICogVGhlIGxhc3QgbW9kdWxlIGFkZGVkIGlzIHRoZSBmaXJzdCBtb2R1bGUgdGVzdGVkLlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgZXhwZWN0IH0gZnJvbSBcIkBzdGQvZXhwZWN0XCI7XG4gKiBpbXBvcnQgc2VyaWFsaXplckFuc2kgZnJvbSBcIm5wbTpqZXN0LXNuYXBzaG90LXNlcmlhbGl6ZXItYW5zaVwiO1xuICpcbiAqIGV4cGVjdC5hZGRTbmFwc2hvdFNlcmlhbGl6ZXIoc2VyaWFsaXplckFuc2kpO1xuICogYGBgXG4gKi9cbmV4cGVjdC5hZGRTbmFwc2hvdFNlcmlhbGl6ZXIgPSBhZGRTZXJpYWxpemVyIGFzIChcbiAgcGx1Z2luOiBTbmFwc2hvdFBsdWdpbixcbikgPT4gdm9pZDtcbiJdLAogICJtYXBwaW5ncyI6ICJBQUFBLE9BQVMscUJBQUFBLE9BQXlCLG1CQ29CM0IsSUFBTUMsRUFBTixjQUE2QixLQUFBLENBTWxDLFlBQVlDLEVBQWlCQyxFQUF3QixDQUNuRCxNQUFNRCxFQUFTQyxDQUFBLEVBQ2YsS0FBSyxLQUFPLGdCQUNkLENBQ0YsRUNqQk8sSUFBTUMsR0FBTixLQUFNLENBQ1hDLEdB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SyxNQUFNTixHQUFZQyxDQUFBLENBQUEsRUFHckMsTUFBTyxDQUFFLFlBQUFLLENBQVksQ0FDdkIsQ0FJQSxTQUFTQyxJQUFBLENBQ1AsSUFBTUMsRUFBZ0MsQ0FDcEMsSUFBSUMsRUFBU0MsRUFBSyxDQUNoQixPQUFPLElBQUksTUFBTSxJQUFBLENBQU8sRUFBR0YsQ0FBQSxDQUM3QixFQUNBLE9BQUEsQ0FDRSxPQUFPLElBQUksTUFBTSxJQUFBLENBQU8sRUFBR0EsQ0FBQSxDQUM3QixDQUNGLEVBRUEsT0FBTyxJQUFJLE1BQU0sSUFBQSxDQUFPLEVBQUdBLENBQUEsQ0FDN0IsQ0FFTyxJQUFNRyxHQUFVLElBQUlDLElBQ3BCckIsR0FBZSxTQUFRLEVBQ3JCb0IsRUFBQSxHQUFhQyxDQUFBLEVBRG1CTCxHQUFBLEVBSWxDLFNBQVNNLEdBQUtDLEVBQWNWLEVBQWdCLENBQ2pELElBQU1DLEVBQVFkLEdBQWUsU0FBUSxFQUNoQ2MsR0FFTEEsRUFBTSxNQUFNLEtBQUssQ0FBRSxLQUFBUyxFQUFNLEdBQUFWLENBQUcsQ0FBQSxDQUM5QixDQUVPLFNBQVNXLEdBQVNDLEVBQWVaLEVBQWMsQ0FDdENiLEdBQWUsU0FBUSxHQUdyQ2EsRUFBQSxDQUNGIiwKICAibmFtZXMiOiBbIkFzeW5jTG9jYWxTdG9yYWdlIiwgIkFzc2VydGlvbkVycm9yIiwgIm1lc3NhZ2UiLCAib3B0aW9ucyIsICJBc3NlcnRpb25TdGF0ZSIsICIjc3RhdGUiLCAiI2Vuc3VyZUNsZWFuZWRVcCIsICJ2YWwiLCAibnVtIiwgImFzc2VydGlvblN0YXRlIiwgImFzc2VydGlvblN0YXRlIiwgImdldEFzc2VydGlvblN0YXRlIiwgImhhc0Fzc2VydGlvbnMiLCAiYXNzZXJ0aW9ucyIsICJudW0iLCAiZW1pdEFzc2VydGlvblRyaWdnZXIiLCAiY3VzdG9tRXF1YWxpdHlUZXN0ZXJzIiwgImFkZEN1c3RvbUVxdWFsaXR5VGVzdGVycyIsICJuZXdUZXN0ZXJzIiwgImdldEN1c3RvbUVxdWFsaXR5VGVzdGVycyIsICJBc3ltbWV0cmljTWF0Y2hlciIsICJ2YWx1ZSIsICJpbnZlcnNlIiwgIkFueXRoaW5nIiwgIm90aGVyIiwgImFueXRoaW5nIiwgIkFueSIsICJhbnkiLCAiYyIsICJBcnJheUNvbnRhaW5pbmciLCAiYXJyIiwgInJlcyIsICJlIiwgImFub3RoZXIiLCAiZXF1YWwiLCAiZ2V0Q3VzdG9tRXF1YWxpdHlUZXN0ZXJzIiwgImFycmF5Q29udGFpbmluZyIsICJhcnJheU5vdENvbnRhaW5pbmciLCAiQ2xvc2VUbyIsICIjcHJlY2lzaW9uIiwgIm51bSIsICJwcmVjaXNpb24iLCAiY2xvc2VUbyIsICJudW1EaWdpdHMiLCAiU3RyaW5nQ29udGFpbmluZyIsICJzdHIiLCAic3RyaW5nQ29udGFpbmluZyIsICJzdHJpbmdOb3RDb250YWluaW5nIiwgIlN0cmluZ01hdGNoaW5nIiwgInBhdHRlcm4iLCAic3RyaW5nTWF0Y2hpbmciLCAic3RyaW5nTm90TWF0Y2hpbmciLCAiT2JqZWN0Q29udGFpbmluZyIsICJvYmoiLCAia2V5cyIsICJrZXkiLCAib2JqZWN0Q29udGFpbmluZyIsICJvYmplY3ROb3RDb250YWluaW5nIiwgImlzS2V5ZWRDb2xsZWN0aW9uIiwgIngiLCAiY29uc3RydWN0b3JzRXF1YWwiLCAiYSIsICJiIiwgImFzeW1tZXRyaWNFcXVhbCIsICJhc3ltbWV0cmljQSIsICJBc3ltbWV0cmljTWF0Y2hlciIsICJhc3ltbWV0cmljQiIsICJlcXVhbCIsICJjIiwgImQiLCAib3B0aW9ucyIsICJjdXN0b21UZXN0ZXJzIiwgInN0cmljdENoZWNrIiwgInNlZW4iLCAiY29tcGFyZSIsICJhc3ltbWV0cmljIiwgImN1c3RvbVRlc3RlciIsICJ0ZXN0Q29udGV4dCIsICJwYXNzIiwgImFUaW1lIiwgImJUaW1lIiwgImFLZXlzIiwgImJLZXlzIiwgImFMZW4iLCAiYkxlbiIsICJpIiwgImtleSIsICJrIiwgInVubWF0Y2hlZEVudHJpZXMiLCAiYUtleSIsICJhVmFsdWUiLCAiYktleSIsICJiVmFsdWUiLCAibWVyZ2VkIiwgImV4dGVuZE1hdGNoZXJzIiwgImdldEV4dGVuZE1hdGNoZXJzIiwgInNldEV4dGVuZE1hdGNoZXJzIiwgIm5ld0V4dGVuZE1hdGNoZXJzIiwgImZvcm1hdCIsICJ2IiwgIkRlbm8iLCAicHJvY2VzcyIsICJpbnNwZWN0IiwgImJhc2ljSW5zcGVjdCIsICJmb3JtYXR0ZXJzIiwgImZtdCIsICJyZXN1bHQiLCAiYXNzZXJ0Tm90U3RyaWN0RXF1YWxzIiwgImFjdHVhbCIsICJleHBlY3RlZCIsICJtc2ciLCAibXNnU3VmZml4IiwgIkFzc2VydGlvbkVycm9yIiwgImZvcm1hdCIsICJEZW5vIiwgIm5vQ29sb3IiLCAiZW5hYmxlZCIsICJjb2RlIiwgIm9wZW4iLCAiY2xvc2UiLCAicnVuIiwgInN0ciIsICJib2xkIiwgInJlZCIsICJncmVlbiIsICJ3aGl0ZSIsICJzdHIiLCAicnVuIiwgImNvZGUiLCAiZ3JheSIsICJicmlnaHRCbGFjayIsICJiZ1JlZCIsICJiZ0dyZWVuIiwgIkFOU0lfUEFUVEVSTiIsICJzdHJpcEFuc2lDb2RlIiwgInN0cmluZyIsICJjcmVhdGVDb2xvciIsICJkaWZmVHlwZSIsICJiYWNrZ3JvdW5kIiwgImJnR3JlZW4iLCAid2hpdGUiLCAiZ3JlZW4iLCAiYm9sZCIsICJiZ1JlZCIsICJyZWQiLCAiZ3JheSIsICJjcmVhdGVTaWduIiwgImJ1aWxkTWVzc2FnZSIsICJkaWZmUmVzdWx0IiwgIm9wdGlvbnMiLCAidHJ1bmNhdGVEaWZmIiwgInN0cmluZ0RpZmYiLCAibWVzc2FnZXMiLCAiZGlmZk1lc3NhZ2VzIiwgInJlc3VsdCIsICJjb2xvciIsICJsaW5lIiwgImRldGFpbCIsICJjcmVhdGVDb21tb24iLCAiQSIsICJCIiwgImNvbW1vbiIsICJpIiwgImEiLCAiYiIsICJhc3NlcnRGcCIsICJ2YWx1ZSIsICJiYWNrVHJhY2UiLCAiY3VycmVudCIsICJzd2FwcGVkIiwgInJvdXRlcyIsICJkaWZmVHlwZXNQdHJPZmZzZXQiLCAiTSIsICJOIiwgInJlc3VsdCIsICJqIiwgInR5cGUiLCAicHJldiIsICJjcmVhdGVGcCIsICJrIiwgInB0ciIsICJzbGlkZSIsICJkb3duIiwgImlzQWRkaW5nIiwgImRpZmYiLCAicHJlZml4Q29tbW9uIiwgIm9mZnNldCIsICJkZWx0YSIsICJsZW5ndGgiLCAiZnAiLCAic25ha2UiLCAiY3VycmVudEZwIiwgInAiLCAiaW5kZXgiLCAidW5lc2NhcGUiLCAic3RyaW5nIiwgInN0ciIsICJXSElURVNQQUNFX1NZTUJPTFMiLCAidG9rZW5pemUiLCAid29yZERpZmYiLCAidG9rZW4iLCAidG9rZW5zIiwgImxpbmVzIiwgImxpbmUiLCAiaSIsICJjcmVhdGVEZXRhaWxzIiwgInR5cGUiLCAicmVzdWx0IiwgInQiLCAiTk9OX1dISVRFU1BBQ0VfUkVHRVhQIiwgImRpZmZTdHIiLCAiQSIsICJCIiwgImRpZmZSZXN1bHQiLCAiZGlmZiIsICJhZGRlZCIsICJyZW1vdmVkIiwgImhhc01vcmVSZW1vdmVkTGluZXMiLCAiYUxpbmVzIiwgImJMaW5lcyIsICJiIiwgInRva2VuaXplZCIsICJ2YWx1ZSIsICJhc3NlcnRTdHJpY3RFcXVhbHMiLCAiYWN0dWFsIiwgImV4cGVjdGVkIiwgIm1zZyIsICJtc2dTdWZmaXgiLCAibWVzc2FnZSIsICJhY3R1YWxTdHJpbmciLCAiZm9ybWF0IiwgImV4cGVjdGVkU3RyaW5nIiwgIndpdGhPZmZzZXQiLCAibCIsICJyZWQiLCAic3RyaW5nRGlmZiIsICJkaWZmUmVzdWx0IiwgImRpZmZTdHIiLCAiZGlmZiIsICJkaWZmTXNnIiwgImJ1aWxkTWVzc2FnZSIsICJBc3NlcnRpb25FcnJvciIsICJhc3NlcnRJbnN0YW5jZU9mIiwgImFjdHVhbCIsICJleHBlY3RlZFR5cGUiLCAibXNnIiwgIm1zZ1N1ZmZpeCIsICJleHBlY3RlZFR5cGVTdHIiLCAiYWN0dWFsVHlwZVN0ciIsICJBc3NlcnRpb25FcnJvciIsICJhc3NlcnRJc0Vycm9yIiwgImVycm9yIiwgIkVycm9yQ2xhc3MiLCAibXNnTWF0Y2hlcyIsICJtc2ciLCAibXNnUHJlZml4IiwgIkFzc2VydGlvbkVycm9yIiwgIm1zZ0NoZWNrIiwgInN0cmlwQW5zaUNvZGUiLCAiYXNzZXJ0RmFsc2UiLCAiZXhwciIsICJtc2ciLCAiQXNzZXJ0aW9uRXJyb3IiLCAiYXNzZXJ0Tm90SW5zdGFuY2VPZiIsICJhY3R1YWwiLCAidW5leHBlY3RlZFR5cGUiLCAibXNnIiwgIm1zZ1N1ZmZpeCIsICJhc3NlcnRGYWxzZSIsICJhc3NlcnRNYXRjaCIsICJhY3R1YWwiLCAiZXhwZWN0ZWQiLCAibXNnIiwgIm1zZ1N1ZmZpeCIsICJBc3NlcnRpb25FcnJvciIsICJhc3NlcnROb3RNYXRjaCIsICJhY3R1YWwiLCAiZXhwZWN0ZWQiLCAibXNnIiwgIm1zZ1N1ZmZpeCIsICJBc3NlcnRpb25FcnJvciIsICJpc1N0cmluZyIsICJ2YWx1ZSIsICJidWlsZEVxdWFsRXJyb3JNZXNzYWdlIiwgImFjdHVhbCIsICJleHBlY3RlZCIsICJvcHRpb25zIiwgImZvcm1hdHRlciIsICJmb3JtYXQiLCAibXNnIiwgIm1zZ1ByZWZpeCIsICJhY3R1YWxTdHJpbmciLCAiZXhwZWN0ZWRTdHJpbmciLCAibWVzc2FnZSIsICJzdHJpbmdEaWZmIiwgImRpZmZSZXN1bHQiLCAiZGlmZlN0ciIsICJkaWZmIiwgImRpZmZNc2ciLCAiYnVpbGRNZXNzYWdlIiwgImJ1aWxkTm90RXF1YWxFcnJvck1lc3NhZ2UiLCAiYXNzZXJ0RXF1YWxzIiwgImFjdHVhbCIsICJleHBlY3RlZCIsICJvcHRpb25zIiwgImVxdWFsIiwgIm1lc3NhZ2UiLCAiYnVpbGRFcXVhbEVycm9yTWVzc2FnZSIsICJBc3NlcnRpb25FcnJvciIsICJhc3NlcnROb3RFcXVhbHMiLCAiYWN0dWFsIiwgImV4cGVjdGVkIiwgIm9wdGlvbnMiLCAiZXF1YWwiLCAibWVzc2FnZSIsICJidWlsZE5vdEVxdWFsRXJyb3JNZXNzYWdlIiwgIkFzc2VydGlvbkVycm9yIiwgIk1PQ0tfU1lNQk9MIiwgImdldE1vY2tDYWxscyIsICJmIiwgIm1vY2tJbmZvIiwgImluc3BlY3RBcmdzIiwgImFyZ3MiLCAiaW5zcGVjdEFyZyIsICJhcmciLCAiRGVubyIsICJidWlsZEVxdWFsT3B0aW9ucyIsICJvcHRpb25zIiwgImN1c3RvbU1lc3NhZ2UiLCAiY3VzdG9tVGVzdGVycyIsICJzdHJpY3RDaGVjayIsICJyZXQiLCAiaXNQcm9taXNlTGlrZSIsICJ2YWx1ZSIsICJoYXNJdGVyYXRvciIsICJvYmplY3QiLCAiaXNBIiwgInR5cGVOYW1lIiwgImlzT2JqZWN0IiwgImEiLCAiaXNPYmplY3RXaXRoS2V5cyIsICJnZXRPYmplY3RLZXlzIiwgInMiLCAiaGFzUHJvcGVydHlJbk9iamVjdCIsICJrZXkiLCAiZW50cmllcyIsICJvYmoiLCAiaXRlcmFibGVFcXVhbGl0eSIsICJiIiwgImFTdGFjayIsICJiU3RhY2siLCAibGVuZ3RoIiwgIml0ZXJhYmxlRXF1YWxpdHlXaXRoU3RhY2siLCAiZmlsdGVyZWRDdXN0b21UZXN0ZXJzIiwgInQiLCAiYWxsRm91bmQiLCAiYVZhbHVlIiwgImhhcyIsICJiVmFsdWUiLCAiZXF1YWwiLCAiYUVudHJ5IiwgImJFbnRyeSIsICJtYXRjaGVkS2V5IiwgIm1hdGNoZWRWYWx1ZSIsICJiSXRlcmF0b3IiLCAibmV4dEIiLCAiYUVudHJpZXMiLCAiYkVudHJpZXMiLCAic3Vic2V0RXF1YWxpdHkiLCAic3Vic2V0IiwgInN1YnNldEVxdWFsaXR5V2l0aENvbnRleHQiLCAic2VlblJlZmVyZW5jZXMiLCAibWF0Y2hSZXN1bHQiLCAicmVzdWx0IiwgInRvQmUiLCAiY29udGV4dCIsICJleHBlY3QiLCAiYXNzZXJ0Tm90U3RyaWN0RXF1YWxzIiwgImFzc2VydFN0cmljdEVxdWFscyIsICJ0b0VxdWFsIiwgImV4cGVjdGVkIiwgInYiLCAiZSIsICJlcXVhbHNPcHRpb25zIiwgImJ1aWxkRXF1YWxPcHRpb25zIiwgIml0ZXJhYmxlRXF1YWxpdHkiLCAiYXNzZXJ0Tm90RXF1YWxzIiwgImFzc2VydEVxdWFscyIsICJ0b1N0cmljdEVxdWFsIiwgInRvQmVDbG9zZVRvIiwgIm51bURpZ2l0cyIsICJ0b2xlcmFuY2UiLCAidmFsdWUiLCAicGFzcyIsICJkZWZhdWx0TWVzc2FnZSIsICJBc3NlcnRpb25FcnJvciIsICJ0b0JlRGVmaW5lZCIsICJ0b0JlVW5kZWZpbmVkIiwgInRvQmVGYWxzeSIsICJpc0ZhbHN5IiwgInRvQmVUcnV0aHkiLCAiaXNUcnV0aHkiLCAidG9CZUdyZWF0ZXJUaGFuT3JFcXVhbCIsICJpc0dyZWF0ZXJPckVxdWFsIiwgInRvQmVHcmVhdGVyVGhhbiIsICJpc0dyZWF0ZXIiLCAidG9CZUluc3RhbmNlT2YiLCAiYXNzZXJ0Tm90SW5zdGFuY2VPZiIsICJhc3NlcnRJbnN0YW5jZU9mIiwgInRvQmVMZXNzVGhhbk9yRXF1YWwiLCAiaXNMb3dlciIsICJ0b0JlTGVzc1RoYW4iLCAidG9CZU5hTiIsICJ0b0JlTnVsbCIsICJ0b0hhdmVMZW5ndGgiLCAibWF5YmVMZW5ndGgiLCAiaGFzTGVuZ3RoIiwgInRvSGF2ZVByb3BlcnR5IiwgInByb3BOYW1lIiwgInByb3BQYXRoIiwgImN1cnJlbnQiLCAicHJvcCIsICJoYXNQcm9wZXJ0eSIsICJlcXVhbCIsICJvZlZhbHVlIiwgImluc3BlY3RBcmciLCAidG9Db250YWluIiwgImRvZXNDb250YWluIiwgImZtdFZhbHVlIiwgImZvcm1hdCIsICJmbXRFeHBlY3RlZCIsICJ0b0NvbnRhaW5FcXVhbCIsICJhc3NlcnRJc0l0ZXJhYmxlIiwgIml0ZW0iLCAicHJldHR5U3RyaW5naWZ5IiwgImpzIiwgInRvTWF0Y2giLCAiYXNzZXJ0Tm90TWF0Y2giLCAiYXNzZXJ0TWF0Y2giLCAidG9NYXRjaE9iamVjdCIsICJyZWNlaXZlZCIsICJkZWZhdWx0TXNnIiwgInN1YnNldEVxdWFsaXR5IiwgInRyaWdnZXJFcnJvciIsICJidWlsZE5vdEVxdWFsRXJyb3JNZXNzYWdlIiwgImJ1aWxkRXF1YWxFcnJvck1lc3NhZ2UiLCAidG9IYXZlQmVlbkNhbGxlZCIsICJjYWxscyIsICJnZXRNb2NrQ2FsbHMiLCAiaGFzQmVlbkNhbGxlZCIsICJ0b0hhdmVCZWVuQ2FsbGVkVGltZXMiLCAidG9IYXZlQmVlbkNhbGxlZFdpdGgiLCAiY2FsbCIsICJpbnNwZWN0QXJncyIsICJvdGhlckNhbGxzIiwgInRvSGF2ZUJlZW5MYXN0Q2FsbGVkV2l0aCIsICJsYXN0Q2FsbCIsICJ0b0hhdmVCZWVuTnRoQ2FsbGVkV2l0aCIsICJudGgiLCAiY2FsbEluZGV4IiwgIm50aENhbGwiLCAidG9IYXZlUmV0dXJuZWQiLCAicmV0dXJuZWQiLCAidG9IYXZlUmV0dXJuZWRUaW1lcyIsICJ0b0hhdmVSZXR1cm5lZFdpdGgiLCAicmV0dXJuZWRXaXRoRXhwZWN0ZWQiLCAidG9IYXZlTGFzdFJldHVybmVkV2l0aCIsICJsYXN0UmV0dXJuZWRXaXRoRXhwZWN0ZWQiLCAidG9IYXZlTnRoUmV0dXJuZWRXaXRoIiwgInJldHVybkluZGV4IiwgIm1heWJlTnRoUmV0dXJuZWQiLCAibnRoUmV0dXJuZWRXaXRoRXhwZWN0ZWQiLCAidG9UaHJvdyIsICJlcnIiLCAiZXhwZWN0Q2xhc3MiLCAiZXhwZWN0TWVzc2FnZSIsICJpc0Vycm9yIiwgImFzc2VydElzRXJyb3IiLCAiSU5URVJOQUxfUExVR0lOUyIsICJhZGRTZXJpYWxpemVyIiwgInBsdWdpbiIsICJtYXRjaGVycyIsICJ0b0hhdmVCZWVuTGFzdENhbGxlZFdpdGgiLCAidG9IYXZlTGFzdFJldHVybmVkV2l0aCIsICJ0b0hhdmVCZWVuTnRoQ2FsbGVkV2l0aCIsICJ0b0hhdmVOdGhSZXR1cm5lZFdpdGgiLCAidG9IYXZlQmVlbkNhbGxlZCIsICJ0b0hhdmVCZWVuQ2FsbGVkVGltZXMiLCAidG9IYXZlQmVlbkNhbGxlZFdpdGgiLCAidG9CZUNsb3NlVG8iLCAidG9CZURlZmluZWQiLCAidG9CZUZhbHN5IiwgInRvQmVHcmVhdGVyVGhhbk9yRXF1YWwiLCAidG9CZUdyZWF0ZXJUaGFuIiwgInRvQmVJbnN0YW5jZU9mIiwgInRvQmVMZXNzVGhhbk9yRXF1YWwiLCAidG9CZUxlc3NUaGFuIiwgInRvQmVOYU4iLCAidG9CZU51bGwiLCAidG9CZVRydXRoeSIsICJ0b0JlVW5kZWZpbmVkIiwgInRvQmUiLCAidG9Db250YWluRXF1YWwiLCAidG9Db250YWluIiwgInRvRXF1YWwiLCAidG9IYXZlTGVuZ3RoIiwgInRvSGF2ZVByb3BlcnR5IiwgInRvSGF2ZVJldHVybmVkVGltZXMiLCAidG9IYXZlUmV0dXJuZWRXaXRoIiwgInRvSGF2ZVJldHVybmVkIiwgInRvTWF0Y2hPYmplY3QiLCAidG9NYXRjaCIsICJ0b1N0cmljdEVxdWFsIiwgInRvVGhyb3ciLCAiZXhwZWN0IiwgInZhbHVlIiwgImN1c3RvbU1lc3NhZ2UiLCAiaXNOb3QiLCAiaXNQcm9taXNlZCIsICJzZWxmIiwgIl8iLCAibmFtZSIsICJpc1Byb21pc2VMaWtlIiwgIkFzc2VydGlvbkVycm9yIiwgImVyciIsICJleHRlbmRNYXRjaGVycyIsICJnZXRFeHRlbmRNYXRjaGVycyIsICJtYXRjaGVyIiwgImFyZ3MiLCAiYXBwbHlNYXRjaGVyIiwgImNvbnRleHQiLCAiZXF1YWwiLCAiZ2V0Q3VzdG9tRXF1YWxpdHlUZXN0ZXJzIiwgInJlc3VsdCIsICJlbWl0QXNzZXJ0aW9uVHJpZ2dlciIsICJhZGRDdXN0b21FcXVhbGl0eVRlc3RlcnMiLCAic2V0RXh0ZW5kTWF0Y2hlcnMiLCAiYW55dGhpbmciLCAiYW55IiwgImFycmF5Q29udGFpbmluZyIsICJjbG9zZVRvIiwgInN0cmluZ0NvbnRhaW5pbmciLCAic3RyaW5nTWF0Y2hpbmciLCAiaGFzQXNzZXJ0aW9ucyIsICJhc3NlcnRpb25zIiwgIm9iamVjdENvbnRhaW5pbmciLCAiYXJyYXlOb3RDb250YWluaW5nIiwgIm9iamVjdE5vdENvbnRhaW5pbmciLCAic3RyaW5nTm90Q29udGFpbmluZyIsICJzdHJpbmdOb3RNYXRjaGluZyIsICJhZGRTZXJpYWxpemVyIiwgInRlc3RVbml0V29ya2VyIiwgIkFzeW5jTG9jYWxTdG9yYWdlIiwgIlNraXBUZXN0RXJyb3IiLCAiRmFpbFRlc3RFcnJvciIsICJtZXNzYWdlIiwgIlN1Y2NlZWRUZXN0RXJyb3IiLCAidGVzdENvbnRleHQiLCAiZm9ybWF0RXJyb3IiLCAiZXJyIiwgImV4ZWN1dGVUZXN0IiwgImVudHJ5IiwgInN0YXJ0IiwgInJ1blRlc3QiLCAiZm4iLCAic3RvcmUiLCAidGVzdFJlc3VsdHMiLCAicHJveHlFeHBlY3RTdHViIiwgImhhbmRsZXIiLCAiX3RhcmdldCIsICJfcHJvcCIsICJleHBlY3QiLCAiYXJncyIsICJ0ZXN0IiwgIm5hbWUiLCAiZGVzY3JpYmUiLCAiX25hbWUiXQp9Cg==
