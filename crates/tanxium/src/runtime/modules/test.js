var f = class extends Error {
  constructor(t, s) {
    (super(t, s), (this.name = 'AssertionError'));
  }
};
var ae = class {
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
  Wt = new ae();
function Oe() {
  return Wt;
}
var V = Oe();
function Se() {
  V.setAssertionCheck(!0);
}
function qe(e) {
  V.setAssertionCount(e);
}
function ke() {
  (V.setAssertionTriggered(!0), V.updateAssertionTriggerCount());
}
var je = [];
function Ae(e) {
  if (!Array.isArray(e)) throw new TypeError(`customEqualityTester expects an array of Testers. But got ${typeof e}`);
  je.push(...e);
}
function F() {
  return je;
}
var b = class {
    value;
    inverse;
    constructor(t, s = !1) {
      ((this.value = t), (this.inverse = s));
    }
  },
  ue = class extends b {
    equals(t) {
      return t != null;
    }
  };
function Ie() {
  return new ue();
}
var fe = class extends b {
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
function Pe(e) {
  return new fe(e);
}
var z = class extends b {
  constructor(t, s = !1) {
    super(t, s);
  }
  equals(t) {
    let s = Array.isArray(t) && this.value.every((r) => t.some((n) => d(r, n, { customTesters: F() })));
    return this.inverse ? !s : s;
  }
};
function Re(e) {
  return new z(e);
}
function Be(e) {
  return new z(e, !0);
}
var le = class extends b {
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
function We(e, t) {
  return new le(e, t);
}
var _ = class extends b {
  constructor(t, s = !1) {
    super(t, s);
  }
  equals(t) {
    let s = typeof t != 'string' ? !1 : t.includes(this.value);
    return this.inverse ? !s : s;
  }
};
function Le(e) {
  return new _(e);
}
function He(e) {
  return new _(e, !0);
}
var K = class extends b {
  constructor(t, s = !1) {
    super(new RegExp(t), s);
  }
  equals(t) {
    let s = typeof t != 'string' ? !1 : this.value.test(t);
    return this.inverse ? !s : s;
  }
};
function De(e) {
  return new K(e);
}
function xe(e) {
  return new K(e, !0);
}
var G = class extends b {
  constructor(t, s = !1) {
    super(t, s);
  }
  equals(t) {
    let s = Object.keys(this.value),
      r = !0;
    for (let n of s) (!Object.hasOwn(t, n) || !d(this.value[n], t[n])) && (r = !1);
    return this.inverse ? !r : r;
  }
};
function Ve(e) {
  return new G(e);
}
function Fe(e) {
  return new G(e, !0);
}
function ze(e) {
  return e instanceof Set || e instanceof Map;
}
function Ht(e, t) {
  return (
    e.constructor === t.constructor ||
    (e.constructor === Object && !t.constructor) ||
    (!e.constructor && t.constructor === Object)
  );
}
function Dt(e, t) {
  let s = e instanceof b,
    r = t instanceof b;
  if (!(s && r)) {
    if (s) return e.equals(t);
    if (r) return t.equals(e);
  }
}
function d(e, t, s) {
  let { customTesters: r = [], strictCheck: n } = s ?? {},
    o = new Map();
  return (function u(i, a) {
    let l = Dt(i, a);
    if (l !== void 0) return l;
    if (r?.length)
      for (let m of r) {
        let c = { equal: d },
          g = m.call(c, i, a, r);
        if (g !== void 0) return g;
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
      if (n && i && a && !Ht(i, a)) return !1;
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
        g = m.length,
        $ = c.length;
      if (n && g !== $) return !1;
      if (!n) {
        if (g > 0)
          for (let p = 0; p < m.length; p += 1) {
            let w = m[p];
            w in i && i[w] === void 0 && !(w in a) && (g -= 1);
          }
        if ($ > 0)
          for (let p = 0; p < c.length; p += 1) {
            let w = c[p];
            w in a && a[w] === void 0 && !(w in i) && ($ -= 1);
          }
      }
      if ((o.set(i, a), ze(i) && ze(a))) {
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
        for (let [M, D] of i.entries())
          for (let [B, x] of a.entries())
            if (u(M, B) && ((M === D && B === x) || u(D, x))) {
              v--;
              break;
            }
        return v === 0;
      }
      let y = { ...i, ...a };
      for (let p of [...Object.getOwnPropertyNames(y), ...Object.getOwnPropertySymbols(y)])
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
var ce = {};
function _e() {
  return ce;
}
function Ke(e) {
  ce = { ...ce, ...e };
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
    : Vt(e);
}
var xt = [
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
function Vt(e) {
  for (let t of xt)
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
var { Deno: Ge } = globalThis,
  Ft = typeof Ge?.noColor == 'boolean' ? Ge.noColor : !1,
  zt = !Ft;
function k(e, t) {
  return { open: `\x1B[${e.join(';')}m`, close: `\x1B[${t}m`, regexp: new RegExp(`\\x1b\\[${t}m`, 'g') };
}
function j(e, t) {
  return zt ? `${t.open}${e.replace(t.regexp, t.open)}${t.close}` : e;
}
function I(e) {
  return j(e, k([1], 22));
}
function L(e) {
  return j(e, k([31], 39));
}
function me(e) {
  return j(e, k([32], 39));
}
function U(e) {
  return j(e, k([37], 39));
}
function pe(e) {
  return _t(e);
}
function _t(e) {
  return j(e, k([90], 39));
}
function Ue(e) {
  return j(e, k([41], 49));
}
function Ye(e) {
  return j(e, k([42], 49));
}
var Kt = new RegExp(
  [
    '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
    '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TXZcf-nq-uy=><~]))',
  ].join('|'),
  'g',
);
function Y(e) {
  return e.replace(Kt, '');
}
function Je(e, t = !1) {
  switch (e) {
    case 'added':
      return (s) => (t ? Ye(U(s)) : me(I(s)));
    case 'removed':
      return (s) => (t ? Ue(U(s)) : L(I(s)));
    case 'truncation':
      return pe;
    default:
      return U;
  }
}
function Gt(e) {
  switch (e) {
    case 'added':
      return '+   ';
    case 'removed':
      return '-   ';
    default:
      return '    ';
  }
}
function J(e, t = {}, s) {
  s != null && (e = s(e, t.stringDiff ?? !1));
  let { stringDiff: r = !1 } = t,
    n = ['', '', `    ${pe(I('[Diff]'))} ${L(I('Actual'))} / ${me(I('Expected'))}`, '', ''],
    o = e.map((u) => {
      let i = Je(u.type),
        a =
          u.type === 'added' || u.type === 'removed'
            ? (u.details?.map((l) => (l.type !== 'common' ? Je(l.type, !0)(l.value) : l.value)).join('') ?? u.value)
            : u.value;
      return i(`${Gt(u.type)}${a}`);
    });
  return (n.push(...(r ? [o.join('')] : o), ''), n);
}
function Ut(e, t) {
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
function Ze(e) {
  if (e == null || typeof e != 'object' || typeof e?.y != 'number' || typeof e?.id != 'number')
    throw new Error(`Unexpected value, expected 'FarthestPoint': received ${typeof e}`);
}
function Yt(e, t, s, r, n, o) {
  let u = e.length,
    i = t.length,
    a = [],
    l = u - 1,
    h = i - 1,
    m = n[s.id],
    c = n[s.id + o];
  for (; !(!m && !c);) {
    let g = m;
    (c === 1
      ? (a.unshift({ type: r ? 'removed' : 'added', value: t[h] }), (h -= 1))
      : c === 3
        ? (a.unshift({ type: r ? 'added' : 'removed', value: e[l] }), (l -= 1))
        : (a.unshift({ type: 'common', value: e[l] }), (l -= 1), (h -= 1)),
      (m = n[g]),
      (c = n[g + o]));
  }
  return a;
}
function Jt(e, t, s, r, n, o, u) {
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
  let s = Ut(e, t);
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
  function g(p, w, v, M, D) {
    let B = w.length,
      x = v.length,
      O = Jt(p, B, h, m, c, M, D);
    for (c = O.id; O.y + p < B && O.y < x && w[O.y + p] === v[O.y];) {
      let Bt = O.id;
      (c++, (O.id = c), (O.y += 1), (h[c] = Bt), (h[c + m] = 2));
    }
    return O;
  }
  let $ = l[i + u];
  Ze($);
  let y = -1;
  for (; $.y < o;) {
    y = y + 1;
    for (let w = -y; w < i; ++w) {
      let v = w + u;
      l[v] = g(w, e, t, l[v - 1], l[v + 1]);
    }
    for (let w = i + y; w > i; --w) {
      let v = w + u;
      l[v] = g(w, e, t, l[v - 1], l[v + 1]);
    }
    let p = i + u;
    ((l[i + u] = g(i, e, t, l[p - 1], l[p + 1])), ($ = l[i + u]), Ze($));
  }
  return [...s.map((p) => ({ type: 'common', value: p })), ...Yt(e, t, $, r, h, m)];
}
function Xe(e) {
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
var Zt = /((?:\\[bftv]|[^\S\r\n])+|\\[rn\\]|[()[\]{}'"\r\n]|\b)/;
function Z(e, t = !1) {
  if (t) return e.split(Zt).filter((n) => n);
  let s = [],
    r = e.split(/(\n|\r\n)/).filter((n) => n);
  for (let [n, o] of r.entries()) n % 2 ? (s[s.length - 1] += o) : s.push(o);
  return s;
}
function Qe(e, t) {
  return t
    .filter(({ type: s }) => s === e.type || s === 'common')
    .map((s, r, n) => {
      let o = n[r - 1];
      return s.type === 'common' && o && o.type === n[r + 1]?.type && /\s+/.test(s.value) ? { ...s, type: o.type } : s;
    });
}
var Xt = /\S/;
function X(e, t) {
  let s = A(
      Z(`${Xe(e)}
`),
      Z(`${Xe(t)}
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
      let m = [Z(a.value, !0), Z(h.value, !0)];
      if ((o && m.reverse(), (l = A(m[0], m[1])), l.some(({ type: c, value: g }) => c === 'common' && Xt.test(g))))
        break;
    }
    ((a.details = Qe(a, l)), h && (h.details = Qe(h, l)));
  }
  return s;
}
function H(e, t, s) {
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

${L(i)}
`;
  } else {
    let i = typeof e == 'string' && typeof t == 'string',
      a = i
        ? X(e, t)
        : A(
            o.split(`
`),
            u.split(`
`),
          ),
      l = J(a, { stringDiff: i }, arguments[3]).join(`
`);
    n = `Values are not strictly equal${r}
${l}`;
  }
  throw new f(n);
}
function et(e, t, s = '') {
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
function he(e, t, s, r) {
  let n = r ? `${r}: ` : '';
  if (!(e instanceof Error)) throw new f(`${n}Expected "error" to be an Error object.`);
  if (t && !(e instanceof t))
    throw ((r = `${n}Expected error to be instance of "${t.name}", but was "${e?.constructor?.name}".`), new f(r));
  let o;
  if (
    (typeof s == 'string' && (o = Y(e.message).includes(Y(s))),
    s instanceof RegExp && (o = s.test(Y(e.message))),
    s && !o)
  )
    throw (
      (r = `${n}Expected error message to include ${s instanceof RegExp ? s.toString() : JSON.stringify(s)}, but got ${JSON.stringify(e?.message)}.`),
      new f(r)
    );
}
function tt(e, t = '') {
  if (e) throw new f(t);
}
function st(e, t, s) {
  let r = s ? `: ${s}` : '.';
  ((s = `Expected object to not be an instance of "${typeof t}"${r}`), tt(e instanceof t, s));
}
function rt(e, t, s) {
  if (t.test(e)) return;
  let r = s ? `: ${s}` : '.';
  throw ((s = `Expected actual: "${e}" to match: "${t}"${r}`), new f(s));
}
function nt(e, t, s) {
  if (!t.test(e)) return;
  let r = s ? `: ${s}` : '.';
  throw ((s = `Expected actual: "${e}" to not match: "${t}"${r}`), new f(s));
}
function ot(e) {
  return typeof e == 'string';
}
function Q(e, t, s = {}) {
  let { formatter: r = T, msg: n } = s,
    o = n ? `${n}: ` : '',
    u = r(e),
    i = r(t),
    a = `${o}Values are not equal.`,
    l = ot(e) && ot(t),
    h = l
      ? X(e, t)
      : A(
          u.split(`
`),
          i.split(`
`),
        ),
    m = J(h, { stringDiff: l }).join(`
`);
  return (
    (a = `${a}
${m}`),
    a
  );
}
function ee(e, t, s = {}) {
  let { formatter: r = T, msg: n } = s,
    o = r(e),
    u = r(t);
  return `${n ? `${n}: ` : ''}Expected actual: ${o} not to be: ${u}.`;
}
function te(e, t, s) {
  if (d(e, t, s)) return;
  let r = Q(e, t, s ?? {});
  throw new f(r);
}
function se(e, t, s = {}) {
  if (!d(e, t, s)) return;
  let r = ee(e, t, s ?? {});
  throw new f(r);
}
var it = Symbol.for('@MOCK');
function C(e) {
  let t = e[it];
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
function re(e) {
  let { customMessage: t, customTesters: s = [], strictCheck: r } = e ?? {},
    n = { customTesters: s };
  return (t !== void 0 && (n.msg = t), r !== void 0 && (n.strictCheck = r), n);
}
function de(e) {
  return e == null ? !1 : typeof e.then == 'function';
}
function at(e) {
  return !!(e != null && e[Symbol.iterator]);
}
function ut(e, t) {
  return Object.prototype.toString.apply(t) === `[object ${e}]`;
}
function ct(e) {
  return e !== null && typeof e == 'object';
}
function ft(e) {
  return (
    ct(e) &&
    !(e instanceof Error) &&
    !Array.isArray(e) &&
    !(e instanceof Date) &&
    !(e instanceof Set) &&
    !(e instanceof Map)
  );
}
function Qt(e) {
  return [
    ...Object.keys(e),
    ...Object.getOwnPropertySymbols(e).filter((t) => Object.getOwnPropertyDescriptor(e, t)?.enumerable),
  ];
}
function mt(e, t) {
  return !e || typeof e != 'object' || e === Object.prototype
    ? !1
    : Object.prototype.hasOwnProperty.call(e, t) || mt(Object.getPrototypeOf(e), t);
}
function lt(e) {
  return ct(e)
    ? Object.getOwnPropertySymbols(e)
        .filter((t) => t !== Symbol.iterator)
        .map((t) => [t, e[t]])
        .concat(Object.entries(e))
    : [];
}
function P(e, t, s = [], r = [], n = []) {
  if (typeof e != 'object' || typeof t != 'object' || Array.isArray(e) || Array.isArray(t) || !at(e) || !at(t)) return;
  if (e.constructor !== t.constructor) return !1;
  let o = r.length;
  for (; o--;) if (r[o] === e) return n[o] === t;
  (r.push(e), n.push(t));
  let u = (m, c) => P(m, c, [...i], [...r], [...n]),
    i = [...s.filter((m) => m !== P), u];
  if (e.size !== void 0) {
    if (e.size !== t.size) return !1;
    if (ut('Set', e)) {
      let m = !0;
      for (let c of e)
        if (!t.has(c)) {
          let g = !1;
          for (let $ of t) d(c, $, { customTesters: i }) === !0 && (g = !0);
          if (g === !1) {
            m = !1;
            break;
          }
        }
      return (r.pop(), n.pop(), m);
    } else if (ut('Map', e)) {
      let m = !0;
      for (let c of e)
        if (!t.has(c[0]) || !d(c[1], t.get(c[0]), { customTesters: i })) {
          let g = !1;
          for (let $ of t) {
            let y = d(c[0], $[0], { customTesters: i }),
              p = !1;
            (y === !0 && (p = d(c[1], $[1], { customTesters: i })), p === !0 && (g = !0));
          }
          if (g === !1) {
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
    if (c.done || !d(m, c.value, { customTesters: i })) return !1;
  }
  if (!a.next().done) return !1;
  let l = lt(e),
    h = lt(t);
  return d(l, h) ? (r.pop(), n.pop(), !0) : !1;
}
function ge(e, t, s = []) {
  let r = s.filter((o) => o !== ge),
    n =
      (o = new WeakMap()) =>
      (u, i) => {
        if (!ft(i) || o.has(i)) return;
        o.set(i, !0);
        let a = Qt(i).every((l) => {
          if (ft(i[l]) && o.has(i[l])) return d(u[l], i[l], { customTesters: r });
          let h = u != null && mt(u, l) && d(u[l], i[l], { customTesters: [...r, n(o)] });
          return (o.delete(i[l]), h);
        });
        return (o.delete(i), a);
      };
  return n()(e, t);
}
function pt(e, t) {
  e.isNot ? W(e.value, t, e.customMessage) : H(e.value, t, e.customMessage);
}
function ht(e, t) {
  let s = e.value,
    r = t,
    n = re({ ...e, customTesters: [...e.customTesters, P] });
  e.isNot ? se(s, r, n) : te(s, r, n);
}
function dt(e, t) {
  let s = re({ ...e, strictCheck: !0, customTesters: [...e.customTesters, P] });
  e.isNot ? se(e.value, t, s) : te(e.value, t, s);
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
function wt(e) {
  e.isNot ? H(e.value, void 0, e.customMessage) : W(e.value, void 0, e.customMessage);
}
function $t(e) {
  e.isNot ? W(e.value, void 0, e.customMessage) : H(e.value, void 0, e.customMessage);
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
function Mt(e) {
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
function Et(e, t) {
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
function vt(e, t) {
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
function bt(e, t) {
  e.isNot ? st(e.value, t) : et(e.value, t);
}
function Nt(e, t) {
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
function Tt(e, t) {
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
function Ct(e) {
  let t = re(e);
  e.isNot
    ? se(isNaN(Number(e.value)), !0, { ...t, msg: t.msg || `Expected ${e.value} to not be NaN` })
    : te(isNaN(Number(e.value)), !0, { ...t, msg: t.msg || `Expected ${e.value} to be NaN` });
}
function Ot(e) {
  e.isNot
    ? W(e.value, null, e.customMessage || `Expected ${e.value} to not be null`)
    : H(e.value, null, e.customMessage || `Expected ${e.value} to be null`);
}
function St(e, t) {
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
function qt(e, t, s) {
  let { value: r } = e,
    n = [];
  Array.isArray(t) ? (n = t) : (n = t.split('.'));
  let o = r;
  for (; !(o == null || n.length === 0);) {
    let a = n.shift();
    o = o[a];
  }
  let u;
  s ? (u = o !== void 0 && n.length === 0 && d(o, s, e)) : (u = o !== void 0 && n.length === 0);
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
function kt(e, t) {
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
function jt(e, t) {
  let { value: s } = e;
  es(s);
  let r = !1;
  for (let i of s)
    if (d(i, t, e)) {
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
function es(e) {
  if (e == null) throw new f('The value is null or undefined');
  if (typeof e[Symbol.iterator] != 'function') throw new f('The value is not iterable');
}
function At(e, t) {
  e.isNot ? nt(String(e.value), t, e.customMessage) : rt(String(e.value), t, e.customMessage);
}
function It(e, t) {
  let s = e.value,
    r = 'Received value must be an object';
  if (typeof s != 'object' || s === null) throw new f(e.customMessage ? `${e.customMessage}: ${r}` : r);
  if (typeof t != 'object' || t === null) throw new f(e.customMessage ? `${e.customMessage}: ${r}` : r);
  let n = d(s, t, { strictCheck: !1, customTesters: [...e.customTesters, P, ge] }),
    o = () => {
      if (e.isNot) {
        let u = ee(s, t);
        throw new f(e.customMessage ? `${e.customMessage}: ${u}` : u);
      } else {
        let u = Q(s, t);
        throw new f(e.customMessage ? `${e.customMessage}: ${u}` : u);
      }
    };
  ((e.isNot && n) || (!e.isNot && !n)) && o();
}
function we(e) {
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
function $e(e, t) {
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
    r = s.some((n) => d(n.args, t));
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
function Me(e, ...t) {
  let s = C(e.value),
    r = s.length > 0 && d(s.at(-1)?.args, t);
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
function Ee(e, t, ...s) {
  if (t < 1) throw new Error(`nth must be greater than 0: received ${t}`);
  let r = C(e.value),
    n = t - 1,
    o = r.length > n && d(r[n]?.args, s);
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
function ve(e) {
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
function be(e, t) {
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
function Ne(e, t) {
  let n = C(e.value)
    .filter((o) => o.returns)
    .some((o) => d(o.returned, t));
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
function Te(e, t) {
  let r = C(e.value).filter((o) => o.returns),
    n = r.length > 0 && d(r.at(-1)?.returned, t);
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
function Ce(e, t, s) {
  if (t < 1) throw new Error(`nth(${t}) must be greater than 0`);
  let n = C(e.value).filter((a) => a.returns),
    o = t - 1,
    u = n[o],
    i = u && d(u.returned, s);
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
function Pt(e, t) {
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
      (he(e.value, s, r, e.customMessage), (n = !0));
      let o = `Expected to NOT throw ${t}`;
      throw new f(e.customMessage ? `${e.customMessage}: ${o}` : o);
    } catch (o) {
      if (n) throw o;
      return;
    }
  }
  return he(e.value, s, r, e.customMessage);
}
var ts = [];
function Rt(e) {
  ts.unshift(e);
}
var ss = {
  lastCalledWith: Me,
  lastReturnedWith: Te,
  nthCalledWith: Ee,
  nthReturnedWith: Ce,
  toBeCalled: we,
  toBeCalledTimes: $e,
  toBeCalledWith: ye,
  toBeCloseTo: gt,
  toBeDefined: wt,
  toBeFalsy: yt,
  toBeGreaterThanOrEqual: Et,
  toBeGreaterThan: vt,
  toBeInstanceOf: bt,
  toBeLessThanOrEqual: Nt,
  toBeLessThan: Tt,
  toBeNaN: Ct,
  toBeNull: Ot,
  toBeTruthy: Mt,
  toBeUndefined: $t,
  toBe: pt,
  toContainEqual: jt,
  toContain: kt,
  toEqual: ht,
  toHaveBeenCalledTimes: $e,
  toHaveBeenCalledWith: ye,
  toHaveBeenCalled: we,
  toHaveBeenLastCalledWith: Me,
  toHaveBeenNthCalledWith: Ee,
  toHaveLength: St,
  toHaveLastReturnedWith: Te,
  toHaveNthReturnedWith: Ce,
  toHaveProperty: qt,
  toHaveReturnedTimes: be,
  toHaveReturnedWith: Ne,
  toHaveReturned: ve,
  toMatchObject: It,
  toMatch: At,
  toReturn: ve,
  toReturnTimes: be,
  toReturnWith: Ne,
  toStrictEqual: dt,
  toThrow: Pt,
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
            if (!de(e)) throw new f('Expected value must be PromiseLike');
            return ((r = !0), n);
          }
          if (u === 'rejects') {
            if (!de(e)) throw new f('Expected value must be a PromiseLike');
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
          let i = _e(),
            l = { ...ss, ...i }[u];
          if (!l) throw new TypeError(typeof u == 'string' ? `matcher not found: ${u}` : 'matcher not found');
          return (...h) => {
            function m(c, g) {
              let $ = { value: c, equal: d, isNot: !1, customMessage: t, customTesters: F() };
              if ((s && ($.isNot = !0), u in i)) {
                let y = l($, ...g);
                if ($.isNot) {
                  if (y.pass) throw new f(y.message());
                } else if (!y.pass) throw new f(y.message());
              } else l($, ...g);
              ke();
            }
            return r ? e.then((c) => m(c, h)) : m(e, h);
          };
        },
      },
    );
  return n;
}
E.addEqualityTesters = Ae;
E.extend = Ke;
E.anything = Ie;
E.any = Pe;
E.arrayContaining = Re;
E.closeTo = We;
E.stringContaining = Le;
E.stringMatching = De;
E.hasAssertions = Se;
E.assertions = qe;
E.objectContaining = Ve;
E.not = { arrayContaining: Be, objectContaining: Fe, stringContaining: He, stringMatching: xe };
E.addSnapshotSerializer = Rt;
var R,
  q = [],
  ne = class extends Error {
    constructor() {
      (super('Test skipped'), (this.name = 'SkipTestError'));
    }
  },
  oe = class extends Error {
    constructor(t) {
      (super(t ?? 'Test failed'), (this.name = 'FailTestError'));
    }
  },
  ie = class extends Error {
    constructor() {
      (super('Test passed'), (this.name = 'SucceedTestError'));
    }
  },
  rs = {
    skip() {
      throw new ne();
    },
    fail(e) {
      throw new oe(e);
    },
    succeed() {
      throw new ie();
    },
  };
function ns(e) {
  return e instanceof Error ? e.message : String(e);
}
async function os(e) {
  let t = performance.now();
  try {
    return (
      await e.fn(rs),
      {
        suite: e.suite.length > 0 ? e.suite : void 0,
        test: e.name,
        result: 'pass',
        error: null,
        duration: performance.now() - t,
      }
    );
  } catch (s) {
    return s instanceof ne
      ? {
          suite: e.suite.length > 0 ? e.suite : void 0,
          test: e.name,
          result: 'skip',
          error: null,
          duration: performance.now() - t,
        }
      : s instanceof ie
        ? {
            suite: e.suite.length > 0 ? e.suite : void 0,
            test: e.name,
            result: 'pass',
            error: null,
            duration: performance.now() - t,
          }
        : s instanceof oe
          ? {
              suite: e.suite.length > 0 ? e.suite : void 0,
              test: e.name,
              result: 'fail',
              error: s.message,
              duration: performance.now() - t,
            }
          : {
              suite: e.suite.length > 0 ? e.suite : void 0,
              test: e.name,
              result: 'fail',
              error: ns(s),
              duration: performance.now() - t,
            };
  }
}
async function zr(e) {
  let t = { tests: [], pendingSuites: [] },
    s = R,
    r = q;
  ((R = t), (q = []));
  try {
    (await e(), await Promise.all(t.pendingSuites));
    let n = [];
    for (let o of t.tests) n.push(await os(o));
    return { testResults: n };
  } finally {
    ((R = s), (q = r));
  }
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
var _r = (...e) => (R ? E(...e) : is());
function Kr(e, t) {
  let s = R;
  s && s.tests.push({ name: e, suite: [...q], fn: t });
}
function Gr(e, t) {
  let s = R;
  if (!s) return;
  let r = q;
  q = [...r, e];
  let n;
  try {
    n = t();
  } catch (u) {
    throw ((q = r), u);
  }
  if (!as(n)) {
    q = r;
    return;
  }
  let o = Promise.resolve(n).finally(() => {
    q = r;
  });
  return (o.catch(() => {}), s.pendingSuites.push(o), o);
}
function as(e) {
  return typeof e == 'object' && e !== null && 'then' in e;
}
export { Gr as describe, _r as expect, zr as runTest, Kr as test };
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiaHR0cHM6Ly9qc3IuaW8vQHN0ZC9hc3NlcnQvMS4wLjE2L2Fzc2VydGlvbl9lcnJvci50cyIsICJodHRwczovL2pzci5pby9Ac3RkL2ludGVybmFsLzEuMC4xMi9hc3NlcnRpb25fc3RhdGUudHMiLCAiaHR0cHM6Ly9qc3IuaW8vQHN0ZC9leHBlY3QvMS4wLjE3L19hc3NlcnRpb25zLnRzIiwgImh0dHBzOi8vanNyLmlvL0BzdGQvZXhwZWN0LzEuMC4xNy9fY3VzdG9tX2VxdWFsaXR5X3Rlc3Rlci50cyIsICJodHRwczovL2pzci5pby9Ac3RkL2V4cGVjdC8xLjAuMTcvX2FzeW1tZXRyaWNfbWF0Y2hlcnMudHMiLCAiaHR0cHM6Ly9qc3IuaW8vQHN0ZC9leHBlY3QvMS4wLjE3L19lcXVhbC50cyIsICJodHRwczovL2pzci5pby9Ac3RkL2V4cGVjdC8xLjAuMTcvX2V4dGVuZC50cyIsICJodHRwczovL2pzci5pby9Ac3RkL2ludGVybmFsLzEuMC4xMi9mb3JtYXQudHMiLCAiaHR0cHM6Ly9qc3IuaW8vQHN0ZC9hc3NlcnQvMS4wLjE2L25vdF9zdHJpY3RfZXF1YWxzLnRzIiwgImh0dHBzOi8vanNyLmlvL0BzdGQvaW50ZXJuYWwvMS4wLjEyL3N0eWxlcy50cyIsICJodHRwczovL2pzci5pby9Ac3RkL2ludGVybmFsLzEuMC4xMi9idWlsZF9tZXNzYWdlLnRzIiwgImh0dHBzOi8vanNyLmlvL0BzdGQvaW50ZXJuYWwvMS4wLjEyL2RpZmYudHMiLCAiaHR0cHM6Ly9qc3IuaW8vQHN0ZC9pbnRlcm5hbC8xLjAuMTIvZGlmZl9zdHIudHMiLCAiaHR0cHM6Ly9qc3IuaW8vQHN0ZC9hc3NlcnQvMS4wLjE2L3N0cmljdF9lcXVhbHMudHMiLCAiaHR0cHM6Ly9qc3IuaW8vQHN0ZC9hc3NlcnQvMS4wLjE2L2luc3RhbmNlX29mLnRzIiwgImh0dHBzOi8vanNyLmlvL0BzdGQvZXhwZWN0LzEuMC4xNy9fYXNzZXJ0X2lzX2Vycm9yLnRzIiwgImh0dHBzOi8vanNyLmlvL0BzdGQvYXNzZXJ0LzEuMC4xNi9mYWxzZS50cyIsICJodHRwczovL2pzci5pby9Ac3RkL2Fzc2VydC8xLjAuMTYvbm90X2luc3RhbmNlX29mLnRzIiwgImh0dHBzOi8vanNyLmlvL0BzdGQvYXNzZXJ0LzEuMC4xNi9tYXRjaC50cyIsICJodHRwczovL2pzci5pby9Ac3RkL2Fzc2VydC8xLjAuMTYvbm90X21hdGNoLnRzIiwgImh0dHBzOi8vanNyLmlvL0BzdGQvZXhwZWN0LzEuMC4xNy9fYnVpbGRfbWVzc2FnZS50cyIsICJodHRwczovL2pzci5pby9Ac3RkL2V4cGVjdC8xLjAuMTcvX2Fzc2VydF9lcXVhbHMudHMiLCAiaHR0cHM6Ly9qc3IuaW8vQHN0ZC9leHBlY3QvMS4wLjE3L19hc3NlcnRfbm90X2VxdWFscy50cyIsICJodHRwczovL2pzci5pby9Ac3RkL2V4cGVjdC8xLjAuMTcvX21vY2tfdXRpbC50cyIsICJodHRwczovL2pzci5pby9Ac3RkL2V4cGVjdC8xLjAuMTcvX2luc3BlY3RfYXJncy50cyIsICJodHRwczovL2pzci5pby9Ac3RkL2V4cGVjdC8xLjAuMTcvX3V0aWxzLnRzIiwgImh0dHBzOi8vanNyLmlvL0BzdGQvZXhwZWN0LzEuMC4xNy9fbWF0Y2hlcnMudHMiLCAiaHR0cHM6Ly9qc3IuaW8vQHN0ZC9leHBlY3QvMS4wLjE3L19zZXJpYWxpemVyLnRzIiwgImh0dHBzOi8vanNyLmlvL0BzdGQvZXhwZWN0LzEuMC4xNy9leHBlY3QudHMiLCAiLi4vc3JjL2luZGV4LnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyIvLyBDb3B5cmlnaHQgMjAxOC0yMDI1IHRoZSBEZW5vIGF1dGhvcnMuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG4vKipcbiAqIEVycm9yIHRocm93biB3aGVuIGFuIGFzc2VydGlvbiBmYWlscy5cbiAqXG4gKiBAZXhhbXBsZSBVc2FnZVxuICogYGBgdHMgaWdub3JlXG4gKiBpbXBvcnQgeyBBc3NlcnRpb25FcnJvciB9IGZyb20gXCJAc3RkL2Fzc2VydFwiO1xuICpcbiAqIHRyeSB7XG4gKiAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihcImZvb1wiLCB7IGNhdXNlOiBcImJhclwiIH0pO1xuICogfSBjYXRjaCAoZXJyb3IpIHtcbiAqICAgaWYgKGVycm9yIGluc3RhbmNlb2YgQXNzZXJ0aW9uRXJyb3IpIHtcbiAqICAgICBlcnJvci5tZXNzYWdlID09PSBcImZvb1wiOyAvLyB0cnVlXG4gKiAgICAgZXJyb3IuY2F1c2UgPT09IFwiYmFyXCI7IC8vIHRydWVcbiAqICAgfVxuICogfVxuICogYGBgXG4gKi9cbmV4cG9ydCBjbGFzcyBBc3NlcnRpb25FcnJvciBleHRlbmRzIEVycm9yIHtcbiAgLyoqIENvbnN0cnVjdHMgYSBuZXcgaW5zdGFuY2UuXG4gICAqXG4gICAqIEBwYXJhbSBtZXNzYWdlIFRoZSBlcnJvciBtZXNzYWdlLlxuICAgKiBAcGFyYW0gb3B0aW9ucyBBZGRpdGlvbmFsIG9wdGlvbnMuIFRoaXMgYXJndW1lbnQgaXMgc3RpbGwgdW5zdGFibGUuIEl0IG1heSBjaGFuZ2UgaW4gdGhlIGZ1dHVyZSByZWxlYXNlLlxuICAgKi9cbiAgY29uc3RydWN0b3IobWVzc2FnZTogc3RyaW5nLCBvcHRpb25zPzogRXJyb3JPcHRpb25zKSB7XG4gICAgc3VwZXIobWVzc2FnZSwgb3B0aW9ucyk7XG4gICAgdGhpcy5uYW1lID0gXCJBc3NlcnRpb25FcnJvclwiO1xuICB9XG59XG4iLCAiLy8gQ29weXJpZ2h0IDIwMTgtMjAyNSB0aGUgRGVubyBhdXRob3JzLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuLyoqXG4gKiBDaGVjayB0aGUgdGVzdCBzdWl0ZSBpbnRlcm5hbCBzdGF0ZVxuICpcbiAqIEBleGFtcGxlIFVzYWdlXG4gKiBgYGB0cyBpZ25vcmVcbiAqIGltcG9ydCB7IEFzc2VydGlvblN0YXRlIH0gZnJvbSBcIkBzdGQvaW50ZXJuYWxcIjtcbiAqXG4gKiBjb25zdCBhc3NlcnRpb25TdGF0ZSA9IG5ldyBBc3NlcnRpb25TdGF0ZSgpO1xuICogYGBgXG4gKi9cbmV4cG9ydCBjbGFzcyBBc3NlcnRpb25TdGF0ZSB7XG4gICNzdGF0ZToge1xuICAgIGFzc2VydGlvbkNvdW50OiBudW1iZXIgfCB1bmRlZmluZWQ7XG4gICAgYXNzZXJ0aW9uQ2hlY2s6IGJvb2xlYW47XG4gICAgYXNzZXJ0aW9uVHJpZ2dlcmVkOiBib29sZWFuO1xuICAgIGFzc2VydGlvblRyaWdnZXJlZENvdW50OiBudW1iZXI7XG4gIH07XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy4jc3RhdGUgPSB7XG4gICAgICBhc3NlcnRpb25Db3VudDogdW5kZWZpbmVkLFxuICAgICAgYXNzZXJ0aW9uQ2hlY2s6IGZhbHNlLFxuICAgICAgYXNzZXJ0aW9uVHJpZ2dlcmVkOiBmYWxzZSxcbiAgICAgIGFzc2VydGlvblRyaWdnZXJlZENvdW50OiAwLFxuICAgIH07XG5cbiAgICBpZiAodHlwZW9mIGdsb2JhbFRoaXM/LmFkZEV2ZW50TGlzdGVuZXIgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgZ2xvYmFsVGhpcy5hZGRFdmVudExpc3RlbmVyKFwidW5sb2FkXCIsICgpID0+IHtcbiAgICAgICAgdGhpcy4jZW5zdXJlQ2xlYW5lZFVwKCk7XG4gICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKFxuICAgICAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgICAgIHR5cGVvZiAoZ2xvYmFsVGhpcyBhcyBhbnkpPy5wcm9jZXNzPy5vbiA9PT0gXCJmdW5jdGlvblwiXG4gICAgKSB7XG4gICAgICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICAgICAgKGdsb2JhbFRoaXMgYXMgYW55KS5wcm9jZXNzLm9uKFwiZXhpdFwiLCAoKSA9PiB7XG4gICAgICAgIHRoaXMuI2Vuc3VyZUNsZWFuZWRVcCgpO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tY29uc29sZVxuICAgICAgY29uc29sZS53YXJuKFwiQXNzZXJ0aW9uQ291bnRlciBjbGVhbnVwIHN0ZXAgd2FzIG5vdCByZWdpc3RlcmVkXCIpO1xuICAgIH1cbiAgfVxuXG4gICNlbnN1cmVDbGVhbmVkVXAoKSB7XG4gICAgLy8gSWYgYW55IGNoZWNrcyB3ZXJlIHJlZ2lzdGVyZWQsIGFmdGVyIHRoZSB0ZXN0IHN1aXRlIHJ1bnMgdGhlIGNoZWNrcyxcbiAgICAvLyBgcmVzZXRBc3NlcnRpb25TdGF0ZWAgc2hvdWxkIGFsc28gaGF2ZSBiZWVuIGNhbGxlZC4gSWYgaXQgd2FzIG5vdCxcbiAgICAvLyB0aGVuIHRoZSB0ZXN0IHN1aXRlIGRpZCBub3QgcnVuIHRoZSBjaGVja3MuXG4gICAgaWYgKFxuICAgICAgdGhpcy4jc3RhdGUuYXNzZXJ0aW9uQ2hlY2sgfHxcbiAgICAgIHRoaXMuI3N0YXRlLmFzc2VydGlvbkNvdW50ICE9PSB1bmRlZmluZWRcbiAgICApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgXCJBc3NlcnRpb25Db3VudGVyIHdhcyBub3QgY2xlYW5lZCB1cDogSWYgdGVzdHMgYXJlIG5vdCBvdGhlcndpc2UgZmFpbGluZywgZW5zdXJlIGBleHBlY3QuaGFzQXNzZXJ0aW9uYCBhbmQgYGV4cGVjdC5hc3NlcnRpb25zYCBhcmUgb25seSBydW4gaW4gYmRkIHRlc3RzXCIsXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIG51bWJlciB0aGF0IHRocm91Z2ggYGV4cGVjdC5hc3NlcnRpb25zYCBhcGkgc2V0LlxuICAgKlxuICAgKiBAcmV0dXJucyB0aGUgbnVtYmVyIHRoYXQgdGhyb3VnaCBgZXhwZWN0LmFzc2VydGlvbnNgIGFwaSBzZXQuXG4gICAqXG4gICAqIEBleGFtcGxlIFVzYWdlXG4gICAqIGBgYHRzIGlnbm9yZVxuICAgKiBpbXBvcnQgeyBBc3NlcnRpb25TdGF0ZSB9IGZyb20gXCJAc3RkL2ludGVybmFsXCI7XG4gICAqXG4gICAqIGNvbnN0IGFzc2VydGlvblN0YXRlID0gbmV3IEFzc2VydGlvblN0YXRlKCk7XG4gICAqIGFzc2VydGlvblN0YXRlLmFzc2VydGlvbkNvdW50O1xuICAgKiBgYGBcbiAgICovXG4gIGdldCBhc3NlcnRpb25Db3VudCgpOiBudW1iZXIgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLiNzdGF0ZS5hc3NlcnRpb25Db3VudDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSBjZXJ0YWluIG51bWJlciB0aGF0IGFzc2VydGlvbnMgd2VyZSBjYWxsZWQgYmVmb3JlLlxuICAgKlxuICAgKiBAcmV0dXJucyByZXR1cm4gYSBjZXJ0YWluIG51bWJlciB0aGF0IGFzc2VydGlvbnMgd2VyZSBjYWxsZWQgYmVmb3JlLlxuICAgKlxuICAgKiBAZXhhbXBsZSBVc2FnZVxuICAgKiBgYGB0cyBpZ25vcmVcbiAgICogaW1wb3J0IHsgQXNzZXJ0aW9uU3RhdGUgfSBmcm9tIFwiQHN0ZC9pbnRlcm5hbFwiO1xuICAgKlxuICAgKiBjb25zdCBhc3NlcnRpb25TdGF0ZSA9IG5ldyBBc3NlcnRpb25TdGF0ZSgpO1xuICAgKiBhc3NlcnRpb25TdGF0ZS5hc3NlcnRpb25UcmlnZ2VyZWRDb3VudDtcbiAgICogYGBgXG4gICAqL1xuICBnZXQgYXNzZXJ0aW9uVHJpZ2dlcmVkQ291bnQoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy4jc3RhdGUuYXNzZXJ0aW9uVHJpZ2dlcmVkQ291bnQ7XG4gIH1cblxuICAvKipcbiAgICogSWYgYGV4cGVjdC5oYXNBc3NlcnRpb25zYCBjYWxsZWQsIHRoZW4gdGhyb3VnaCB0aGlzIG1ldGhvZCB0byB1cGRhdGUgI3N0YXRlLmFzc2VydGlvbkNoZWNrIHZhbHVlLlxuICAgKlxuICAgKiBAcGFyYW0gdmFsIFNldCAjc3RhdGUuYXNzZXJ0aW9uQ2hlY2sncyB2YWx1ZVxuICAgKlxuICAgKiBAZXhhbXBsZSBVc2FnZVxuICAgKiBgYGB0cyBpZ25vcmVcbiAgICogaW1wb3J0IHsgQXNzZXJ0aW9uU3RhdGUgfSBmcm9tIFwiQHN0ZC9pbnRlcm5hbFwiO1xuICAgKlxuICAgKiBjb25zdCBhc3NlcnRpb25TdGF0ZSA9IG5ldyBBc3NlcnRpb25TdGF0ZSgpO1xuICAgKiBhc3NlcnRpb25TdGF0ZS5zZXRBc3NlcnRpb25DaGVjayh0cnVlKTtcbiAgICogYGBgXG4gICAqL1xuICBzZXRBc3NlcnRpb25DaGVjayh2YWw6IGJvb2xlYW4pIHtcbiAgICB0aGlzLiNzdGF0ZS5hc3NlcnRpb25DaGVjayA9IHZhbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBJZiBhbnkgbWF0Y2hlcnMgd2FzIGNhbGxlZCwgYCNzdGF0ZS5hc3NlcnRpb25UcmlnZ2VyZWRgIHdpbGwgYmUgc2V0IHRocm91Z2ggdGhpcyBtZXRob2QuXG4gICAqXG4gICAqIEBwYXJhbSB2YWwgU2V0ICNzdGF0ZS5hc3NlcnRpb25UcmlnZ2VyZWQncyB2YWx1ZVxuICAgKlxuICAgKiBAZXhhbXBsZSBVc2FnZVxuICAgKiBgYGB0cyBpZ25vcmVcbiAgICogaW1wb3J0IHsgQXNzZXJ0aW9uU3RhdGUgfSBmcm9tIFwiQHN0ZC9pbnRlcm5hbFwiO1xuICAgKlxuICAgKiBjb25zdCBhc3NlcnRpb25TdGF0ZSA9IG5ldyBBc3NlcnRpb25TdGF0ZSgpO1xuICAgKiBhc3NlcnRpb25TdGF0ZS5zZXRBc3NlcnRpb25UcmlnZ2VyZWQodHJ1ZSk7XG4gICAqIGBgYFxuICAgKi9cbiAgc2V0QXNzZXJ0aW9uVHJpZ2dlcmVkKHZhbDogYm9vbGVhbikge1xuICAgIHRoaXMuI3N0YXRlLmFzc2VydGlvblRyaWdnZXJlZCA9IHZhbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBJZiBgZXhwZWN0LmFzc2VydGlvbnNgIGNhbGxlZCwgdGhlbiB0aHJvdWdoIHRoaXMgbWV0aG9kIHRvIHVwZGF0ZSAjc3RhdGUuYXNzZXJ0aW9uQ2hlY2sgdmFsdWUuXG4gICAqXG4gICAqIEBwYXJhbSBudW0gU2V0ICNzdGF0ZS5hc3NlcnRpb25Db3VudCdzIHZhbHVlLCBmb3IgZXhhbXBsZSBpZiB0aGUgdmFsdWUgaXMgc2V0IDIsIHRoYXQgbWVhbnNcbiAgICogeW91IG11c3QgaGF2ZSB0d28gYXNzZXJ0aW9uIG1hdGNoZXJzIGNhbGwgaW4geW91ciB0ZXN0IHN1aXRlLlxuICAgKlxuICAgKiBAZXhhbXBsZSBVc2FnZVxuICAgKiBgYGB0cyBpZ25vcmVcbiAgICogaW1wb3J0IHsgQXNzZXJ0aW9uU3RhdGUgfSBmcm9tIFwiQHN0ZC9pbnRlcm5hbFwiO1xuICAgKlxuICAgKiBjb25zdCBhc3NlcnRpb25TdGF0ZSA9IG5ldyBBc3NlcnRpb25TdGF0ZSgpO1xuICAgKiBhc3NlcnRpb25TdGF0ZS5zZXRBc3NlcnRpb25Db3VudCgyKTtcbiAgICogYGBgXG4gICAqL1xuICBzZXRBc3NlcnRpb25Db3VudChudW06IG51bWJlcikge1xuICAgIHRoaXMuI3N0YXRlLmFzc2VydGlvbkNvdW50ID0gbnVtO1xuICB9XG5cbiAgLyoqXG4gICAqIElmIGFueSBtYXRjaGVycyB3YXMgY2FsbGVkLCBgI3N0YXRlLmFzc2VydGlvblRyaWdnZXJlZENvdW50YCB2YWx1ZSB3aWxsIHBsdXMgb25lIGludGVybmFsbHkuXG4gICAqXG4gICAqIEBleGFtcGxlIFVzYWdlXG4gICAqIGBgYHRzIGlnbm9yZVxuICAgKiBpbXBvcnQgeyBBc3NlcnRpb25TdGF0ZSB9IGZyb20gXCJAc3RkL2ludGVybmFsXCI7XG4gICAqXG4gICAqIGNvbnN0IGFzc2VydGlvblN0YXRlID0gbmV3IEFzc2VydGlvblN0YXRlKCk7XG4gICAqIGFzc2VydGlvblN0YXRlLnVwZGF0ZUFzc2VydGlvblRyaWdnZXJDb3VudCgpO1xuICAgKiBgYGBcbiAgICovXG4gIHVwZGF0ZUFzc2VydGlvblRyaWdnZXJDb3VudCgpIHtcbiAgICBpZiAodGhpcy4jc3RhdGUuYXNzZXJ0aW9uQ291bnQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy4jc3RhdGUuYXNzZXJ0aW9uVHJpZ2dlcmVkQ291bnQgKz0gMTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgQXNzZXJ0aW9uIGludGVybmFsIHN0YXRlLCBpZiBgI3N0YXRlLmFzc2VydGlvbkNoZWNrYCBpcyBzZXQgdHJ1ZSwgYnV0XG4gICAqIGAjc3RhdGUuYXNzZXJ0aW9uVHJpZ2dlcmVkYCBpcyBzdGlsbCBmYWxzZSwgdGhlbiBzaG91bGQgdGhyb3cgYW4gQXNzZXJ0aW9uIEVycm9yLlxuICAgKlxuICAgKiBAcmV0dXJucyBhIGJvb2xlYW4gdmFsdWUsIHRoYXQgdGhlIHRlc3Qgc3VpdGUgaXMgc2F0aXNmaWVkIHdpdGggdGhlIGNoZWNrLiBJZiBub3QsXG4gICAqIGl0IHNob3VsZCB0aHJvdyBhbiBBc3NlcnRpb25FcnJvci5cbiAgICpcbiAgICogQGV4YW1wbGUgVXNhZ2VcbiAgICogYGBgdHMgaWdub3JlXG4gICAqIGltcG9ydCB7IEFzc2VydGlvblN0YXRlIH0gZnJvbSBcIkBzdGQvaW50ZXJuYWxcIjtcbiAgICpcbiAgICogY29uc3QgYXNzZXJ0aW9uU3RhdGUgPSBuZXcgQXNzZXJ0aW9uU3RhdGUoKTtcbiAgICogaWYgKGFzc2VydGlvblN0YXRlLmNoZWNrQXNzZXJ0aW9uRXJyb3JTdGF0ZSgpKSB7XG4gICAqICAgLy8gdGhyb3cgQXNzZXJ0aW9uRXJyb3IoXCJcIik7XG4gICAqIH1cbiAgICogYGBgXG4gICAqL1xuICBjaGVja0Fzc2VydGlvbkVycm9yU3RhdGUoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuI3N0YXRlLmFzc2VydGlvbkNoZWNrICYmICF0aGlzLiNzdGF0ZS5hc3NlcnRpb25UcmlnZ2VyZWQ7XG4gIH1cblxuICAvKipcbiAgICogUmVzZXQgYWxsIGFzc2VydGlvbiBzdGF0ZSB3aGVuIGV2ZXJ5IHRlc3Qgc3VpdGUgZnVuY3Rpb24gcmFuIGNvbXBsZXRlbHkuXG4gICAqXG4gICAqIEBleGFtcGxlIFVzYWdlXG4gICAqIGBgYHRzIGlnbm9yZVxuICAgKiBpbXBvcnQgeyBBc3NlcnRpb25TdGF0ZSB9IGZyb20gXCJAc3RkL2ludGVybmFsXCI7XG4gICAqXG4gICAqIGNvbnN0IGFzc2VydGlvblN0YXRlID0gbmV3IEFzc2VydGlvblN0YXRlKCk7XG4gICAqIGFzc2VydGlvblN0YXRlLnJlc2V0QXNzZXJ0aW9uU3RhdGUoKTtcbiAgICogYGBgXG4gICAqL1xuICByZXNldEFzc2VydGlvblN0YXRlKCk6IHZvaWQge1xuICAgIHRoaXMuI3N0YXRlID0ge1xuICAgICAgYXNzZXJ0aW9uQ291bnQ6IHVuZGVmaW5lZCxcbiAgICAgIGFzc2VydGlvbkNoZWNrOiBmYWxzZSxcbiAgICAgIGFzc2VydGlvblRyaWdnZXJlZDogZmFsc2UsXG4gICAgICBhc3NlcnRpb25UcmlnZ2VyZWRDb3VudDogMCxcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIEFzc2VydGlvbiBjYWxsZWQgc3RhdGUsIGlmIGAjc3RhdGUuYXNzZXJ0aW9uQ291bnRgIGlzIHNldCB0byBhIG51bWJlciB2YWx1ZSwgYnV0XG4gICAqIGAjc3RhdGUuYXNzZXJ0aW9uVHJpZ2dlcmVkQ291bnRgIGlzIGxlc3MgdGhlbiBpdCwgdGhlbiBzaG91bGQgdGhyb3cgYW4gYXNzZXJ0aW9uIGVycm9yLlxuICAgKlxuICAgKiBAcmV0dXJucyBhIGJvb2xlYW4gdmFsdWUsIHRoYXQgdGhlIHRlc3Qgc3VpdGUgaXMgc2F0aXNmaWVkIHdpdGggdGhlIGNoZWNrLiBJZiBub3QsXG4gICAqIGl0IHNob3VsZCB0aHJvdyBhbiBBc3NlcnRpb25FcnJvci5cbiAgICpcbiAgICogQGV4YW1wbGUgVXNhZ2VcbiAgICogYGBgdHMgaWdub3JlXG4gICAqIGltcG9ydCB7IEFzc2VydGlvblN0YXRlIH0gZnJvbSBcIkBzdGQvaW50ZXJuYWxcIjtcbiAgICpcbiAgICogY29uc3QgYXNzZXJ0aW9uU3RhdGUgPSBuZXcgQXNzZXJ0aW9uU3RhdGUoKTtcbiAgICogaWYgKGFzc2VydGlvblN0YXRlLmNoZWNrQXNzZXJ0aW9uQ291bnRTYXRpc2ZpZWQoKSkge1xuICAgKiAgIC8vIHRocm93IEFzc2VydGlvbkVycm9yKFwiXCIpO1xuICAgKiB9XG4gICAqIGBgYFxuICAgKi9cbiAgY2hlY2tBc3NlcnRpb25Db3VudFNhdGlzZmllZCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy4jc3RhdGUuYXNzZXJ0aW9uQ291bnQgIT09IHVuZGVmaW5lZCAmJlxuICAgICAgdGhpcy4jc3RhdGUuYXNzZXJ0aW9uQ291bnQgIT09IHRoaXMuI3N0YXRlLmFzc2VydGlvblRyaWdnZXJlZENvdW50O1xuICB9XG59XG5cbmNvbnN0IGFzc2VydGlvblN0YXRlID0gbmV3IEFzc2VydGlvblN0YXRlKCk7XG5cbi8qKlxuICogcmV0dXJuIGFuIGluc3RhbmNlIG9mIEFzc2VydGlvblN0YXRlXG4gKlxuICogQHJldHVybnMgQXNzZXJ0aW9uU3RhdGVcbiAqXG4gKiBAZXhhbXBsZSBVc2FnZVxuICogYGBgdHMgaWdub3JlXG4gKiBpbXBvcnQgeyBnZXRBc3NlcnRpb25TdGF0ZSB9IGZyb20gXCJAc3RkL2ludGVybmFsXCI7XG4gKlxuICogY29uc3QgYXNzZXJ0aW9uU3RhdGUgPSBnZXRBc3NlcnRpb25TdGF0ZSgpO1xuICogYXNzZXJ0aW9uU3RhdGUuc2V0QXNzZXJ0aW9uVHJpZ2dlcmVkKHRydWUpO1xuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRBc3NlcnRpb25TdGF0ZSgpOiBBc3NlcnRpb25TdGF0ZSB7XG4gIHJldHVybiBhc3NlcnRpb25TdGF0ZTtcbn1cbiIsICIvLyBDb3B5cmlnaHQgMjAxOC0yMDI1IHRoZSBEZW5vIGF1dGhvcnMuIE1JVCBsaWNlbnNlLlxuXG5pbXBvcnQgeyBnZXRBc3NlcnRpb25TdGF0ZSB9IGZyb20gXCJqc3I6QHN0ZC9pbnRlcm5hbEBeMS4wLjEwL2Fzc2VydGlvbi1zdGF0ZVwiO1xuXG5jb25zdCBhc3NlcnRpb25TdGF0ZSA9IGdldEFzc2VydGlvblN0YXRlKCk7XG5cbmV4cG9ydCBmdW5jdGlvbiBoYXNBc3NlcnRpb25zKCkge1xuICBhc3NlcnRpb25TdGF0ZS5zZXRBc3NlcnRpb25DaGVjayh0cnVlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydGlvbnMobnVtOiBudW1iZXIpIHtcbiAgYXNzZXJ0aW9uU3RhdGUuc2V0QXNzZXJ0aW9uQ291bnQobnVtKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGVtaXRBc3NlcnRpb25UcmlnZ2VyKCkge1xuICBhc3NlcnRpb25TdGF0ZS5zZXRBc3NlcnRpb25UcmlnZ2VyZWQodHJ1ZSk7XG4gIGFzc2VydGlvblN0YXRlLnVwZGF0ZUFzc2VydGlvblRyaWdnZXJDb3VudCgpO1xufVxuIiwgIi8vIENvcHlyaWdodCAyMDE4LTIwMjUgdGhlIERlbm8gYXV0aG9ycy4gTUlUIGxpY2Vuc2UuXG5cbmltcG9ydCB0eXBlIHsgVGVzdGVyIH0gZnJvbSBcIi4vX3R5cGVzLnRzXCI7XG5cbmNvbnN0IGN1c3RvbUVxdWFsaXR5VGVzdGVyczogVGVzdGVyW10gPSBbXTtcblxuZXhwb3J0IGZ1bmN0aW9uIGFkZEN1c3RvbUVxdWFsaXR5VGVzdGVycyhuZXdUZXN0ZXJzOiBUZXN0ZXJbXSkge1xuICBpZiAoIUFycmF5LmlzQXJyYXkobmV3VGVzdGVycykpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgYGN1c3RvbUVxdWFsaXR5VGVzdGVyIGV4cGVjdHMgYW4gYXJyYXkgb2YgVGVzdGVycy4gQnV0IGdvdCAke3R5cGVvZiBuZXdUZXN0ZXJzfWAsXG4gICAgKTtcbiAgfVxuXG4gIGN1c3RvbUVxdWFsaXR5VGVzdGVycy5wdXNoKC4uLm5ld1Rlc3RlcnMpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q3VzdG9tRXF1YWxpdHlUZXN0ZXJzKCkge1xuICByZXR1cm4gY3VzdG9tRXF1YWxpdHlUZXN0ZXJzO1xufVxuIiwgIi8vIENvcHlyaWdodCAyMDE4LTIwMjUgdGhlIERlbm8gYXV0aG9ycy4gTUlUIGxpY2Vuc2UuXG4vLyBkZW5vLWxpbnQtaWdub3JlLWZpbGUgbm8tZXhwbGljaXQtYW55XG5cbmltcG9ydCB7IGdldEN1c3RvbUVxdWFsaXR5VGVzdGVycyB9IGZyb20gXCIuL19jdXN0b21fZXF1YWxpdHlfdGVzdGVyLnRzXCI7XG5pbXBvcnQgeyBlcXVhbCB9IGZyb20gXCIuL19lcXVhbC50c1wiO1xuXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgQXN5bW1ldHJpY01hdGNoZXI8VD4ge1xuICBjb25zdHJ1Y3RvcihcbiAgICBwcm90ZWN0ZWQgdmFsdWU6IFQsXG4gICAgcHJvdGVjdGVkIGludmVyc2U6IGJvb2xlYW4gPSBmYWxzZSxcbiAgKSB7fVxuICBhYnN0cmFjdCBlcXVhbHMob3RoZXI6IHVua25vd24pOiBib29sZWFuO1xufVxuXG5leHBvcnQgY2xhc3MgQW55dGhpbmcgZXh0ZW5kcyBBc3ltbWV0cmljTWF0Y2hlcjx2b2lkPiB7XG4gIGVxdWFscyhvdGhlcjogdW5rbm93bik6IGJvb2xlYW4ge1xuICAgIHJldHVybiBvdGhlciAhPT0gbnVsbCAmJiBvdGhlciAhPT0gdW5kZWZpbmVkO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhbnl0aGluZygpOiBBbnl0aGluZyB7XG4gIHJldHVybiBuZXcgQW55dGhpbmcoKTtcbn1cblxuZXhwb3J0IGNsYXNzIEFueSBleHRlbmRzIEFzeW1tZXRyaWNNYXRjaGVyPGFueT4ge1xuICBjb25zdHJ1Y3Rvcih2YWx1ZTogdW5rbm93bikge1xuICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRXhwZWN0ZWQgYSBjb25zdHJ1Y3RvciBmdW5jdGlvblwiKTtcbiAgICB9XG4gICAgc3VwZXIodmFsdWUpO1xuICB9XG5cbiAgZXF1YWxzKG90aGVyOiB1bmtub3duKTogYm9vbGVhbiB7XG4gICAgaWYgKHR5cGVvZiBvdGhlciA9PT0gXCJvYmplY3RcIikge1xuICAgICAgcmV0dXJuIG90aGVyIGluc3RhbmNlb2YgdGhpcy52YWx1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHRoaXMudmFsdWUgPT09IE51bWJlcikge1xuICAgICAgICByZXR1cm4gdHlwZW9mIG90aGVyID09PSBcIm51bWJlclwiO1xuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy52YWx1ZSA9PT0gU3RyaW5nKSB7XG4gICAgICAgIHJldHVybiB0eXBlb2Ygb3RoZXIgPT09IFwic3RyaW5nXCI7XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLnZhbHVlID09PSBOdW1iZXIpIHtcbiAgICAgICAgcmV0dXJuIHR5cGVvZiBvdGhlciA9PT0gXCJudW1iZXJcIjtcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMudmFsdWUgPT09IEZ1bmN0aW9uKSB7XG4gICAgICAgIHJldHVybiB0eXBlb2Ygb3RoZXIgPT09IFwiZnVuY3Rpb25cIjtcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMudmFsdWUgPT09IEJvb2xlYW4pIHtcbiAgICAgICAgcmV0dXJuIHR5cGVvZiBvdGhlciA9PT0gXCJib29sZWFuXCI7XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLnZhbHVlID09PSBCaWdJbnQpIHtcbiAgICAgICAgcmV0dXJuIHR5cGVvZiBvdGhlciA9PT0gXCJiaWdpbnRcIjtcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMudmFsdWUgPT09IFN5bWJvbCkge1xuICAgICAgICByZXR1cm4gdHlwZW9mIG90aGVyID09PSBcInN5bWJvbFwiO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFueShjOiB1bmtub3duKTogQW55IHtcbiAgcmV0dXJuIG5ldyBBbnkoYyk7XG59XG5cbmV4cG9ydCBjbGFzcyBBcnJheUNvbnRhaW5pbmcgZXh0ZW5kcyBBc3ltbWV0cmljTWF0Y2hlcjxhbnlbXT4ge1xuICBjb25zdHJ1Y3RvcihhcnI6IGFueVtdLCBpbnZlcnNlID0gZmFsc2UpIHtcbiAgICBzdXBlcihhcnIsIGludmVyc2UpO1xuICB9XG5cbiAgZXF1YWxzKG90aGVyOiBhbnlbXSk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IHJlcyA9IEFycmF5LmlzQXJyYXkob3RoZXIpICYmXG4gICAgICB0aGlzLnZhbHVlLmV2ZXJ5KChlKSA9PlxuICAgICAgICBvdGhlci5zb21lKChhbm90aGVyKSA9PlxuICAgICAgICAgIGVxdWFsKGUsIGFub3RoZXIsIHsgY3VzdG9tVGVzdGVyczogZ2V0Q3VzdG9tRXF1YWxpdHlUZXN0ZXJzKCkgfSlcbiAgICAgICAgKVxuICAgICAgKTtcbiAgICByZXR1cm4gdGhpcy5pbnZlcnNlID8gIXJlcyA6IHJlcztcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gYXJyYXlDb250YWluaW5nKGM6IGFueVtdKTogQXJyYXlDb250YWluaW5nIHtcbiAgcmV0dXJuIG5ldyBBcnJheUNvbnRhaW5pbmcoYyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhcnJheU5vdENvbnRhaW5pbmcoYzogYW55W10pOiBBcnJheUNvbnRhaW5pbmcge1xuICByZXR1cm4gbmV3IEFycmF5Q29udGFpbmluZyhjLCB0cnVlKTtcbn1cblxuZXhwb3J0IGNsYXNzIENsb3NlVG8gZXh0ZW5kcyBBc3ltbWV0cmljTWF0Y2hlcjxudW1iZXI+IHtcbiAgcmVhZG9ubHkgI3ByZWNpc2lvbjogbnVtYmVyO1xuXG4gIGNvbnN0cnVjdG9yKG51bTogbnVtYmVyLCBwcmVjaXNpb246IG51bWJlciA9IDIpIHtcbiAgICBzdXBlcihudW0pO1xuICAgIHRoaXMuI3ByZWNpc2lvbiA9IHByZWNpc2lvbjtcbiAgfVxuXG4gIGVxdWFscyhvdGhlcjogbnVtYmVyKTogYm9vbGVhbiB7XG4gICAgaWYgKHR5cGVvZiBvdGhlciAhPT0gXCJudW1iZXJcIikge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGlmIChcbiAgICAgICh0aGlzLnZhbHVlID09PSBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFkgJiZcbiAgICAgICAgb3RoZXIgPT09IE51bWJlci5QT1NJVElWRV9JTkZJTklUWSkgfHxcbiAgICAgICh0aGlzLnZhbHVlID09PSBOdW1iZXIuTkVHQVRJVkVfSU5GSU5JVFkgJiZcbiAgICAgICAgb3RoZXIgPT09IE51bWJlci5ORUdBVElWRV9JTkZJTklUWSlcbiAgICApIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHJldHVybiBNYXRoLmFicyh0aGlzLnZhbHVlIC0gb3RoZXIpIDwgTWF0aC5wb3coMTAsIC10aGlzLiNwcmVjaXNpb24pIC8gMjtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY2xvc2VUbyhudW06IG51bWJlciwgbnVtRGlnaXRzPzogbnVtYmVyKTogQ2xvc2VUbyB7XG4gIHJldHVybiBuZXcgQ2xvc2VUbyhudW0sIG51bURpZ2l0cyk7XG59XG5cbmV4cG9ydCBjbGFzcyBTdHJpbmdDb250YWluaW5nIGV4dGVuZHMgQXN5bW1ldHJpY01hdGNoZXI8c3RyaW5nPiB7XG4gIGNvbnN0cnVjdG9yKHN0cjogc3RyaW5nLCBpbnZlcnNlID0gZmFsc2UpIHtcbiAgICBzdXBlcihzdHIsIGludmVyc2UpO1xuICB9XG5cbiAgZXF1YWxzKG90aGVyOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICBjb25zdCByZXMgPSB0eXBlb2Ygb3RoZXIgIT09IFwic3RyaW5nXCIgPyBmYWxzZSA6IG90aGVyLmluY2x1ZGVzKHRoaXMudmFsdWUpO1xuICAgIHJldHVybiB0aGlzLmludmVyc2UgPyAhcmVzIDogcmVzO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzdHJpbmdDb250YWluaW5nKHN0cjogc3RyaW5nKTogU3RyaW5nQ29udGFpbmluZyB7XG4gIHJldHVybiBuZXcgU3RyaW5nQ29udGFpbmluZyhzdHIpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc3RyaW5nTm90Q29udGFpbmluZyhzdHI6IHN0cmluZyk6IFN0cmluZ0NvbnRhaW5pbmcge1xuICByZXR1cm4gbmV3IFN0cmluZ0NvbnRhaW5pbmcoc3RyLCB0cnVlKTtcbn1cblxuZXhwb3J0IGNsYXNzIFN0cmluZ01hdGNoaW5nIGV4dGVuZHMgQXN5bW1ldHJpY01hdGNoZXI8UmVnRXhwPiB7XG4gIGNvbnN0cnVjdG9yKHBhdHRlcm46IHN0cmluZyB8IFJlZ0V4cCwgaW52ZXJzZSA9IGZhbHNlKSB7XG4gICAgc3VwZXIobmV3IFJlZ0V4cChwYXR0ZXJuKSwgaW52ZXJzZSk7XG4gIH1cblxuICBlcXVhbHMob3RoZXI6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IHJlcyA9IHR5cGVvZiBvdGhlciAhPT0gXCJzdHJpbmdcIiA/IGZhbHNlIDogdGhpcy52YWx1ZS50ZXN0KG90aGVyKTtcbiAgICByZXR1cm4gdGhpcy5pbnZlcnNlID8gIXJlcyA6IHJlcztcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gc3RyaW5nTWF0Y2hpbmcocGF0dGVybjogc3RyaW5nIHwgUmVnRXhwKTogU3RyaW5nTWF0Y2hpbmcge1xuICByZXR1cm4gbmV3IFN0cmluZ01hdGNoaW5nKHBhdHRlcm4pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc3RyaW5nTm90TWF0Y2hpbmcocGF0dGVybjogc3RyaW5nIHwgUmVnRXhwKTogU3RyaW5nTWF0Y2hpbmcge1xuICByZXR1cm4gbmV3IFN0cmluZ01hdGNoaW5nKHBhdHRlcm4sIHRydWUpO1xufVxuXG5leHBvcnQgY2xhc3MgT2JqZWN0Q29udGFpbmluZ1xuICBleHRlbmRzIEFzeW1tZXRyaWNNYXRjaGVyPFJlY29yZDxzdHJpbmcsIHVua25vd24+PiB7XG4gIGNvbnN0cnVjdG9yKG9iajogUmVjb3JkPHN0cmluZywgdW5rbm93bj4sIGludmVyc2UgPSBmYWxzZSkge1xuICAgIHN1cGVyKG9iaiwgaW52ZXJzZSk7XG4gIH1cblxuICBlcXVhbHMob3RoZXI6IFJlY29yZDxzdHJpbmcsIHVua25vd24+KTogYm9vbGVhbiB7XG4gICAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKHRoaXMudmFsdWUpO1xuICAgIGxldCByZXMgPSB0cnVlO1xuXG4gICAgZm9yIChjb25zdCBrZXkgb2Yga2V5cykge1xuICAgICAgaWYgKFxuICAgICAgICAhT2JqZWN0Lmhhc093bihvdGhlciwga2V5KSB8fFxuICAgICAgICAhZXF1YWwodGhpcy52YWx1ZVtrZXldLCBvdGhlcltrZXldKVxuICAgICAgKSB7XG4gICAgICAgIHJlcyA9IGZhbHNlO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmludmVyc2UgPyAhcmVzIDogcmVzO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBvYmplY3RDb250YWluaW5nKFxuICBvYmo6IFJlY29yZDxzdHJpbmcsIHVua25vd24+LFxuKTogT2JqZWN0Q29udGFpbmluZyB7XG4gIHJldHVybiBuZXcgT2JqZWN0Q29udGFpbmluZyhvYmopO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gb2JqZWN0Tm90Q29udGFpbmluZyhcbiAgb2JqOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPixcbik6IE9iamVjdENvbnRhaW5pbmcge1xuICByZXR1cm4gbmV3IE9iamVjdENvbnRhaW5pbmcob2JqLCB0cnVlKTtcbn1cbiIsICIvLyBDb3B5cmlnaHQgMjAxOC0yMDI1IHRoZSBEZW5vIGF1dGhvcnMuIE1JVCBsaWNlbnNlLlxuXG4vLyBUaGlzIGZpbGUgaXMgY29waWVkIGZyb20gYHN0ZC9hc3NlcnRgLlxuXG5pbXBvcnQgdHlwZSB7IEVxdWFsT3B0aW9ucyB9IGZyb20gXCIuL190eXBlcy50c1wiO1xuaW1wb3J0IHsgQXN5bW1ldHJpY01hdGNoZXIgfSBmcm9tIFwiLi9fYXN5bW1ldHJpY19tYXRjaGVycy50c1wiO1xuXG50eXBlIEtleWVkQ29sbGVjdGlvbiA9IFNldDx1bmtub3duPiB8IE1hcDx1bmtub3duLCB1bmtub3duPjtcbmZ1bmN0aW9uIGlzS2V5ZWRDb2xsZWN0aW9uKHg6IHVua25vd24pOiB4IGlzIEtleWVkQ29sbGVjdGlvbiB7XG4gIHJldHVybiB4IGluc3RhbmNlb2YgU2V0IHx8IHggaW5zdGFuY2VvZiBNYXA7XG59XG5cbmZ1bmN0aW9uIGNvbnN0cnVjdG9yc0VxdWFsKGE6IG9iamVjdCwgYjogb2JqZWN0KSB7XG4gIHJldHVybiBhLmNvbnN0cnVjdG9yID09PSBiLmNvbnN0cnVjdG9yIHx8XG4gICAgYS5jb25zdHJ1Y3RvciA9PT0gT2JqZWN0ICYmICFiLmNvbnN0cnVjdG9yIHx8XG4gICAgIWEuY29uc3RydWN0b3IgJiYgYi5jb25zdHJ1Y3RvciA9PT0gT2JqZWN0O1xufVxuXG5mdW5jdGlvbiBhc3ltbWV0cmljRXF1YWwoYTogdW5rbm93biwgYjogdW5rbm93bikge1xuICBjb25zdCBhc3ltbWV0cmljQSA9IGEgaW5zdGFuY2VvZiBBc3ltbWV0cmljTWF0Y2hlcjtcbiAgY29uc3QgYXN5bW1ldHJpY0IgPSBiIGluc3RhbmNlb2YgQXN5bW1ldHJpY01hdGNoZXI7XG5cbiAgaWYgKGFzeW1tZXRyaWNBICYmIGFzeW1tZXRyaWNCKSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIGlmIChhc3ltbWV0cmljQSkge1xuICAgIHJldHVybiBhLmVxdWFscyhiKTtcbiAgfVxuXG4gIGlmIChhc3ltbWV0cmljQikge1xuICAgIHJldHVybiBiLmVxdWFscyhhKTtcbiAgfVxufVxuXG4vKipcbiAqIERlZXAgZXF1YWxpdHkgY29tcGFyaXNvbiB1c2VkIGluIGFzc2VydGlvbnNcbiAqIEBwYXJhbSBjIGFjdHVhbCB2YWx1ZVxuICogQHBhcmFtIGQgZXhwZWN0ZWQgdmFsdWVcbiAqIEBwYXJhbSBvcHRpb25zIGZvciB0aGUgZXF1YWxpdHkgY2hlY2tcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVxdWFsKGM6IHVua25vd24sIGQ6IHVua25vd24sIG9wdGlvbnM/OiBFcXVhbE9wdGlvbnMpOiBib29sZWFuIHtcbiAgY29uc3QgeyBjdXN0b21UZXN0ZXJzID0gW10sIHN0cmljdENoZWNrIH0gPSBvcHRpb25zID8/IHt9O1xuICBjb25zdCBzZWVuID0gbmV3IE1hcCgpO1xuXG4gIHJldHVybiAoZnVuY3Rpb24gY29tcGFyZShhOiB1bmtub3duLCBiOiB1bmtub3duKTogYm9vbGVhbiB7XG4gICAgY29uc3QgYXN5bW1ldHJpYyA9IGFzeW1tZXRyaWNFcXVhbChhLCBiKTtcbiAgICBpZiAoYXN5bW1ldHJpYyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gYXN5bW1ldHJpYztcbiAgICB9XG5cbiAgICBpZiAoY3VzdG9tVGVzdGVycz8ubGVuZ3RoKSB7XG4gICAgICBmb3IgKGNvbnN0IGN1c3RvbVRlc3RlciBvZiBjdXN0b21UZXN0ZXJzKSB7XG4gICAgICAgIGNvbnN0IHRlc3RDb250ZXh0ID0ge1xuICAgICAgICAgIGVxdWFsLFxuICAgICAgICB9O1xuICAgICAgICBjb25zdCBwYXNzID0gY3VzdG9tVGVzdGVyLmNhbGwodGVzdENvbnRleHQsIGEsIGIsIGN1c3RvbVRlc3RlcnMpO1xuICAgICAgICBpZiAocGFzcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgcmV0dXJuIHBhc3M7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBIYXZlIHRvIHJlbmRlciBSZWdFeHAgJiBEYXRlIGZvciBzdHJpbmcgY29tcGFyaXNvblxuICAgIC8vIHVubGVzcyBpdCdzIG1pc3RyZWF0ZWQgYXMgb2JqZWN0XG4gICAgaWYgKFxuICAgICAgYSAmJlxuICAgICAgYiAmJlxuICAgICAgKChhIGluc3RhbmNlb2YgUmVnRXhwICYmIGIgaW5zdGFuY2VvZiBSZWdFeHApIHx8XG4gICAgICAgIChhIGluc3RhbmNlb2YgVVJMICYmIGIgaW5zdGFuY2VvZiBVUkwpKVxuICAgICkge1xuICAgICAgcmV0dXJuIFN0cmluZyhhKSA9PT0gU3RyaW5nKGIpO1xuICAgIH1cblxuICAgIGlmIChhIGluc3RhbmNlb2YgRGF0ZSAmJiBiIGluc3RhbmNlb2YgRGF0ZSkge1xuICAgICAgY29uc3QgYVRpbWUgPSBhLmdldFRpbWUoKTtcbiAgICAgIGNvbnN0IGJUaW1lID0gYi5nZXRUaW1lKCk7XG4gICAgICAvLyBDaGVjayBmb3IgTmFOIGVxdWFsaXR5IG1hbnVhbGx5IHNpbmNlIE5hTiBpcyBub3RcbiAgICAgIC8vIGVxdWFsIHRvIGl0c2VsZi5cbiAgICAgIGlmIChOdW1iZXIuaXNOYU4oYVRpbWUpICYmIE51bWJlci5pc05hTihiVGltZSkpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICByZXR1cm4gYVRpbWUgPT09IGJUaW1lO1xuICAgIH1cbiAgICBpZiAoYSBpbnN0YW5jZW9mIEVycm9yICYmIGIgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgcmV0dXJuIGEubWVzc2FnZSA9PT0gYi5tZXNzYWdlO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIGEgPT09IFwibnVtYmVyXCIgJiYgdHlwZW9mIGIgPT09IFwibnVtYmVyXCIpIHtcbiAgICAgIHJldHVybiBOdW1iZXIuaXNOYU4oYSkgJiYgTnVtYmVyLmlzTmFOKGIpIHx8IGEgPT09IGI7XG4gICAgfVxuICAgIGlmIChhID09PSBudWxsIHx8IGIgPT09IG51bGwpIHtcbiAgICAgIHJldHVybiBhID09PSBiO1xuICAgIH1cbiAgICBjb25zdCBjbGFzc05hbWUgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoYSk7XG4gICAgaWYgKGNsYXNzTmFtZSAhPT0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGIpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlmIChPYmplY3QuaXMoYSwgYikpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBpZiAoYSAmJiB0eXBlb2YgYSA9PT0gXCJvYmplY3RcIiAmJiBiICYmIHR5cGVvZiBiID09PSBcIm9iamVjdFwiKSB7XG4gICAgICBpZiAoc3RyaWN0Q2hlY2sgJiYgYSAmJiBiICYmICFjb25zdHJ1Y3RvcnNFcXVhbChhLCBiKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBpZiAoYSBpbnN0YW5jZW9mIFdlYWtNYXAgfHwgYiBpbnN0YW5jZW9mIFdlYWtNYXApIHtcbiAgICAgICAgaWYgKCEoYSBpbnN0YW5jZW9mIFdlYWtNYXAgJiYgYiBpbnN0YW5jZW9mIFdlYWtNYXApKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY29tcGFyZSBXZWFrTWFwIGluc3RhbmNlc1wiKTtcbiAgICAgIH1cbiAgICAgIGlmIChhIGluc3RhbmNlb2YgV2Vha1NldCB8fCBiIGluc3RhbmNlb2YgV2Vha1NldCkge1xuICAgICAgICBpZiAoIShhIGluc3RhbmNlb2YgV2Vha1NldCAmJiBiIGluc3RhbmNlb2YgV2Vha1NldCkpIHJldHVybiBmYWxzZTtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjb21wYXJlIFdlYWtTZXQgaW5zdGFuY2VzXCIpO1xuICAgICAgfVxuICAgICAgaWYgKHNlZW4uZ2V0KGEpID09PSBiKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBhS2V5cyA9IE9iamVjdC5rZXlzKGEgPz8ge30pO1xuICAgICAgY29uc3QgYktleXMgPSBPYmplY3Qua2V5cyhiID8/IHt9KTtcbiAgICAgIGxldCBhTGVuID0gYUtleXMubGVuZ3RoO1xuICAgICAgbGV0IGJMZW4gPSBiS2V5cy5sZW5ndGg7XG5cbiAgICAgIGlmIChzdHJpY3RDaGVjayAmJiBhTGVuICE9PSBiTGVuKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgaWYgKCFzdHJpY3RDaGVjaykge1xuICAgICAgICBpZiAoYUxlbiA+IDApIHtcbiAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFLZXlzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICBjb25zdCBrZXkgPSBhS2V5c1tpXSE7XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgIChrZXkgaW4gYSkgJiYgKGFba2V5IGFzIGtleW9mIHR5cGVvZiBhXSA9PT0gdW5kZWZpbmVkKSAmJlxuICAgICAgICAgICAgICAhKGtleSBpbiBiKVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIGFMZW4gLT0gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoYkxlbiA+IDApIHtcbiAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGJLZXlzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICBjb25zdCBrZXkgPSBiS2V5c1tpXSE7XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgIChrZXkgaW4gYikgJiYgKGJba2V5IGFzIGtleW9mIHR5cGVvZiBiXSA9PT0gdW5kZWZpbmVkKSAmJlxuICAgICAgICAgICAgICAhKGtleSBpbiBhKVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIGJMZW4gLT0gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgc2Vlbi5zZXQoYSwgYik7XG4gICAgICBpZiAoaXNLZXllZENvbGxlY3Rpb24oYSkgJiYgaXNLZXllZENvbGxlY3Rpb24oYikpIHtcbiAgICAgICAgaWYgKGEuc2l6ZSAhPT0gYi5zaXplKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgYUtleXMgPSBbLi4uYS5rZXlzKCldO1xuICAgICAgICBjb25zdCBwcmltaXRpdmVLZXlzRmFzdFBhdGggPSBhS2V5cy5ldmVyeSgoaykgPT4ge1xuICAgICAgICAgIHJldHVybiB0eXBlb2YgayA9PT0gXCJzdHJpbmdcIiB8fFxuICAgICAgICAgICAgdHlwZW9mIGsgPT09IFwibnVtYmVyXCIgfHxcbiAgICAgICAgICAgIHR5cGVvZiBrID09PSBcImJvb2xlYW5cIiB8fFxuICAgICAgICAgICAgdHlwZW9mIGsgPT09IFwiYmlnaW50XCIgfHxcbiAgICAgICAgICAgIHR5cGVvZiBrID09PSBcInN5bWJvbFwiIHx8XG4gICAgICAgICAgICBrID09IG51bGw7XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAocHJpbWl0aXZlS2V5c0Zhc3RQYXRoKSB7XG4gICAgICAgICAgaWYgKGEgaW5zdGFuY2VvZiBTZXQpIHtcbiAgICAgICAgICAgIHJldHVybiBhLnN5bW1ldHJpY0RpZmZlcmVuY2UoYikuc2l6ZSA9PT0gMDtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBmb3IgKGNvbnN0IGtleSBvZiBhS2V5cykge1xuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAhYi5oYXMoa2V5KSB8fFxuICAgICAgICAgICAgICAhY29tcGFyZShhLmdldChrZXkpLCAoYiBhcyBNYXA8dW5rbm93biwgdW5rbm93bj4pLmdldChrZXkpKVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgdW5tYXRjaGVkRW50cmllcyA9IGEuc2l6ZTtcblxuICAgICAgICBmb3IgKGNvbnN0IFthS2V5LCBhVmFsdWVdIG9mIGEuZW50cmllcygpKSB7XG4gICAgICAgICAgZm9yIChjb25zdCBbYktleSwgYlZhbHVlXSBvZiBiLmVudHJpZXMoKSkge1xuICAgICAgICAgICAgLyogR2l2ZW4gdGhhdCBNYXAga2V5cyBjYW4gYmUgcmVmZXJlbmNlcywgd2UgbmVlZFxuICAgICAgICAgICAgICogdG8gZW5zdXJlIHRoYXQgdGhleSBhcmUgYWxzbyBkZWVwbHkgZXF1YWwgKi9cblxuICAgICAgICAgICAgaWYgKCFjb21wYXJlKGFLZXksIGJLZXkpKSBjb250aW51ZTtcblxuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAoYUtleSA9PT0gYVZhbHVlICYmIGJLZXkgPT09IGJWYWx1ZSkgfHxcbiAgICAgICAgICAgICAgKGNvbXBhcmUoYVZhbHVlLCBiVmFsdWUpKVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIHVubWF0Y2hlZEVudHJpZXMtLTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHVubWF0Y2hlZEVudHJpZXMgPT09IDA7XG4gICAgICB9XG4gICAgICBjb25zdCBtZXJnZWQgPSB7IC4uLmEsIC4uLmIgfTtcbiAgICAgIGZvciAoXG4gICAgICAgIGNvbnN0IGtleSBvZiBbXG4gICAgICAgICAgLi4uT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMobWVyZ2VkKSxcbiAgICAgICAgICAuLi5PYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKG1lcmdlZCksXG4gICAgICAgIF1cbiAgICAgICkge1xuICAgICAgICB0eXBlIEtleSA9IGtleW9mIHR5cGVvZiBtZXJnZWQ7XG4gICAgICAgIGlmICghY29tcGFyZShhICYmIGFba2V5IGFzIEtleV0sIGIgJiYgYltrZXkgYXMgS2V5XSkpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKFxuICAgICAgICAgICgoa2V5IGluIGEpICYmIChhW2tleSBhcyBLZXldICE9PSB1bmRlZmluZWQpICYmICghKGtleSBpbiBiKSkpIHx8XG4gICAgICAgICAgKChrZXkgaW4gYikgJiYgKGJba2V5IGFzIEtleV0gIT09IHVuZGVmaW5lZCkgJiYgKCEoa2V5IGluIGEpKSlcbiAgICAgICAgKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoYSBpbnN0YW5jZW9mIFdlYWtSZWYgfHwgYiBpbnN0YW5jZW9mIFdlYWtSZWYpIHtcbiAgICAgICAgaWYgKCEoYSBpbnN0YW5jZW9mIFdlYWtSZWYgJiYgYiBpbnN0YW5jZW9mIFdlYWtSZWYpKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIHJldHVybiBjb21wYXJlKGEuZGVyZWYoKSwgYi5kZXJlZigpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH0pKGMsIGQpO1xufVxuIiwgIi8vIENvcHlyaWdodCAyMDE4LTIwMjUgdGhlIERlbm8gYXV0aG9ycy4gTUlUIGxpY2Vuc2UuXG5cbmltcG9ydCB0eXBlIHsgTWF0Y2hlcnMgfSBmcm9tIFwiLi9fdHlwZXMudHNcIjtcblxubGV0IGV4dGVuZE1hdGNoZXJzID0ge307XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRFeHRlbmRNYXRjaGVycygpIHtcbiAgcmV0dXJuIGV4dGVuZE1hdGNoZXJzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0RXh0ZW5kTWF0Y2hlcnMobmV3RXh0ZW5kTWF0Y2hlcnM6IE1hdGNoZXJzKSB7XG4gIGV4dGVuZE1hdGNoZXJzID0ge1xuICAgIC4uLmV4dGVuZE1hdGNoZXJzLFxuICAgIC4uLm5ld0V4dGVuZE1hdGNoZXJzLFxuICB9O1xufVxuIiwgIi8vIENvcHlyaWdodCAyMDE4LTIwMjUgdGhlIERlbm8gYXV0aG9ycy4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbi8qKiBBbiBpbnNwZWN0IGZ1bmN0aW9uIGNvbmZvcm1pbmcgdG8gdGhlIHNoYXBlIG9mIGBEZW5vLmluc3BlY3RgIGFuZCBgbm9kZTp1dGlsYCdzIGBpbnNwZWN0YCAqL1xuZXhwb3J0IHR5cGUgSW5zcGVjdEZuID0gKFxuICB2OiB1bmtub3duLFxuICBvcHRpb25zOiB7XG4gICAgZGVwdGg6IG51bWJlcjtcbiAgICBzb3J0ZWQ6IGJvb2xlYW47XG4gICAgdHJhaWxpbmdDb21tYTogYm9vbGVhbjtcbiAgICBjb21wYWN0OiBib29sZWFuO1xuICAgIGl0ZXJhYmxlTGltaXQ6IG51bWJlcjtcbiAgICBnZXR0ZXJzOiBib29sZWFuO1xuICAgIHN0ckFiYnJldmlhdGVTaXplOiBudW1iZXI7XG4gIH0sXG4pID0+IHN0cmluZztcblxuLyoqXG4gKiBDb252ZXJ0cyB0aGUgaW5wdXQgaW50byBhIHN0cmluZy4gT2JqZWN0cywgU2V0cyBhbmQgTWFwcyBhcmUgc29ydGVkIHNvIGFzIHRvXG4gKiBtYWtlIHRlc3RzIGxlc3MgZmxha3kuXG4gKlxuICogQHBhcmFtIHYgVmFsdWUgdG8gYmUgZm9ybWF0dGVkXG4gKlxuICogQHJldHVybnMgVGhlIGZvcm1hdHRlZCBzdHJpbmdcbiAqXG4gKiBAZXhhbXBsZSBVc2FnZVxuICogYGBgdHNcbiAqIGltcG9ydCB7IGZvcm1hdCB9IGZyb20gXCJAc3RkL2ludGVybmFsL2Zvcm1hdFwiO1xuICogaW1wb3J0IHsgYXNzZXJ0RXF1YWxzIH0gZnJvbSBcIkBzdGQvYXNzZXJ0XCI7XG4gKlxuICogYXNzZXJ0RXF1YWxzKGZvcm1hdCh7IGE6IDEsIGI6IDIgfSksIFwie1xcbiAgYTogMSxcXG4gIGI6IDIsXFxufVwiKTtcbiAqIGFzc2VydEVxdWFscyhmb3JtYXQobmV3IFNldChbMSwgMl0pKSwgXCJTZXQoMikge1xcbiAgMSxcXG4gIDIsXFxufVwiKTtcbiAqIGFzc2VydEVxdWFscyhmb3JtYXQobmV3IE1hcChbWzEsIDJdXSkpLCBcIk1hcCgxKSB7XFxuICAxID0+IDIsXFxufVwiKTtcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0KHY6IHVua25vd24pOiBzdHJpbmcge1xuICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICBjb25zdCB7IERlbm8sIHByb2Nlc3MgfSA9IGdsb2JhbFRoaXMgYXMgYW55O1xuXG4gIGNvbnN0IGluc3BlY3Q6IEluc3BlY3RGbiB8IHVuZGVmaW5lZCA9IERlbm8/Lmluc3BlY3QgPz9cbiAgICBwcm9jZXNzPy5nZXRCdWlsdGluTW9kdWxlPy4oXCJub2RlOnV0aWxcIik/Lmluc3BlY3Q7XG5cbiAgcmV0dXJuIHR5cGVvZiBpbnNwZWN0ID09PSBcImZ1bmN0aW9uXCJcbiAgICA/IGluc3BlY3Qodiwge1xuICAgICAgZGVwdGg6IEluZmluaXR5LFxuICAgICAgc29ydGVkOiB0cnVlLFxuICAgICAgdHJhaWxpbmdDb21tYTogdHJ1ZSxcbiAgICAgIGNvbXBhY3Q6IGZhbHNlLFxuICAgICAgaXRlcmFibGVMaW1pdDogSW5maW5pdHksXG4gICAgICAvLyBnZXR0ZXJzIHNob3VsZCBiZSB0cnVlIGluIGFzc2VydEVxdWFscy5cbiAgICAgIGdldHRlcnM6IHRydWUsXG4gICAgICBzdHJBYmJyZXZpYXRlU2l6ZTogSW5maW5pdHksXG4gICAgfSlcbiAgICA6IGJhc2ljSW5zcGVjdCh2KTtcbn1cblxuY29uc3QgZm9ybWF0dGVyczogKCh2OiB1bmtub3duKSA9PiBzdHJpbmcgfCB1bmRlZmluZWQpW10gPSBbXG4gICh2KSA9PiB7XG4gICAgaWYgKHR5cGVvZiB2ID09PSBcInVuZGVmaW5lZFwiKSByZXR1cm4gXCJ1bmRlZmluZWRcIjtcbiAgICBpZiAodHlwZW9mIHYgPT09IFwiYmlnaW50XCIpIHJldHVybiBgJHt2fW5gO1xuXG4gICAgaWYgKFxuICAgICAgdHlwZW9mIHYgPT09IFwic3RyaW5nXCIgfHxcbiAgICAgIHR5cGVvZiB2ID09PSBcIm51bWJlclwiIHx8XG4gICAgICB0eXBlb2YgdiA9PT0gXCJib29sZWFuXCIgfHxcbiAgICAgIHYgPT09IG51bGwgfHxcbiAgICAgIEFycmF5LmlzQXJyYXkodikgfHxcbiAgICAgIFtudWxsLCBPYmplY3QucHJvdG90eXBlXS5pbmNsdWRlcyhPYmplY3QuZ2V0UHJvdG90eXBlT2YodikpXG4gICAgKSB7XG4gICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkodiwgbnVsbCwgMik7XG4gICAgfVxuICB9LFxuICAodikgPT4gU3RyaW5nKHYpLFxuICAodikgPT4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHYpLFxuXTtcblxuLy8gZm9yIGVudmlyb25tZW50cyBsYWNraW5nIGJvdGggYERlbm8uaW5zcGVjdGAgYW5kIGBwcm9jZXNzLmluc3BlY3RgXG5mdW5jdGlvbiBiYXNpY0luc3BlY3QodjogdW5rbm93bik6IHN0cmluZyB7XG4gIGZvciAoY29uc3QgZm10IG9mIGZvcm1hdHRlcnMpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzdWx0ID0gZm10KHYpO1xuICAgICAgaWYgKHR5cGVvZiByZXN1bHQgPT09IFwic3RyaW5nXCIpIHJldHVybiByZXN1bHQ7XG4gICAgfSBjYXRjaCB7IC8qIHRyeSB0aGUgbmV4dCBvbmUgKi8gfVxuICB9XG5cbiAgcmV0dXJuIFwiW1tVbmFibGUgdG8gZm9ybWF0IHZhbHVlXV1cIjtcbn1cbiIsICIvLyBDb3B5cmlnaHQgMjAxOC0yMDI1IHRoZSBEZW5vIGF1dGhvcnMuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuaW1wb3J0IHsgQXNzZXJ0aW9uRXJyb3IgfSBmcm9tIFwiLi9hc3NlcnRpb25fZXJyb3IudHNcIjtcbmltcG9ydCB7IGZvcm1hdCB9IGZyb20gXCJqc3I6QHN0ZC9pbnRlcm5hbEBeMS4wLjEyL2Zvcm1hdFwiO1xuXG4vKipcbiAqIE1ha2UgYW4gYXNzZXJ0aW9uIHRoYXQgYGFjdHVhbGAgYW5kIGBleHBlY3RlZGAgYXJlIG5vdCBzdHJpY3RseSBlcXVhbCwgdXNpbmdcbiAqIHtAbGlua2NvZGUgT2JqZWN0LmlzfSBmb3IgZXF1YWxpdHkgY29tcGFyaXNvbi4gSWYgdGhlIHZhbHVlcyBhcmUgc3RyaWN0bHlcbiAqIGVxdWFsIHRoZW4gdGhyb3cuXG4gKlxuICogQGV4YW1wbGUgVXNhZ2VcbiAqIGBgYHRzIGlnbm9yZVxuICogaW1wb3J0IHsgYXNzZXJ0Tm90U3RyaWN0RXF1YWxzIH0gZnJvbSBcIkBzdGQvYXNzZXJ0XCI7XG4gKlxuICogYXNzZXJ0Tm90U3RyaWN0RXF1YWxzKDEsIDEpOyAvLyBUaHJvd3NcbiAqIGFzc2VydE5vdFN0cmljdEVxdWFscygxLCAyKTsgLy8gRG9lc24ndCB0aHJvd1xuICpcbiAqIGFzc2VydE5vdFN0cmljdEVxdWFscygwLCAwKTsgLy8gVGhyb3dzXG4gKiBhc3NlcnROb3RTdHJpY3RFcXVhbHMoMCwgLTApOyAvLyBEb2Vzbid0IHRocm93XG4gKiBgYGBcbiAqXG4gKiBAdHlwZVBhcmFtIFQgVGhlIHR5cGUgb2YgdGhlIHZhbHVlcyB0byBjb21wYXJlLlxuICogQHBhcmFtIGFjdHVhbCBUaGUgYWN0dWFsIHZhbHVlIHRvIGNvbXBhcmUuXG4gKiBAcGFyYW0gZXhwZWN0ZWQgVGhlIGV4cGVjdGVkIHZhbHVlIHRvIGNvbXBhcmUuXG4gKiBAcGFyYW0gbXNnIFRoZSBvcHRpb25hbCBtZXNzYWdlIHRvIGRpc3BsYXkgaWYgdGhlIGFzc2VydGlvbiBmYWlscy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydE5vdFN0cmljdEVxdWFsczxUPihcbiAgYWN0dWFsOiBULFxuICBleHBlY3RlZDogVCxcbiAgbXNnPzogc3RyaW5nLFxuKSB7XG4gIGlmICghT2JqZWN0LmlzKGFjdHVhbCwgZXhwZWN0ZWQpKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgbXNnU3VmZml4ID0gbXNnID8gYDogJHttc2d9YCA6IFwiLlwiO1xuICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IoXG4gICAgYEV4cGVjdGVkIFwiYWN0dWFsXCIgdG8gbm90IGJlIHN0cmljdGx5IGVxdWFsIHRvOiAke1xuICAgICAgZm9ybWF0KGFjdHVhbClcbiAgICB9JHttc2dTdWZmaXh9XFxuYCxcbiAgKTtcbn1cbiIsICIvLyBDb3B5cmlnaHQgMjAxOC0yMDI1IHRoZSBEZW5vIGF1dGhvcnMuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuLy8gQSBtb2R1bGUgdG8gcHJpbnQgQU5TSSB0ZXJtaW5hbCBjb2xvcnMuIEluc3BpcmVkIGJ5IGNoYWxrLCBrbGV1ciwgYW5kIGNvbG9yc1xuLy8gb24gbnBtLlxuXG4vLyBUaGlzIGNvZGUgaXMgdmVuZG9yZWQgZnJvbSBgZm10L2NvbG9ycy50c2AuXG5cbi8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG5jb25zdCB7IERlbm8gfSA9IGdsb2JhbFRoaXMgYXMgYW55O1xuY29uc3Qgbm9Db2xvciA9IHR5cGVvZiBEZW5vPy5ub0NvbG9yID09PSBcImJvb2xlYW5cIlxuICA/IERlbm8ubm9Db2xvciBhcyBib29sZWFuXG4gIDogZmFsc2U7XG5cbmludGVyZmFjZSBDb2RlIHtcbiAgb3Blbjogc3RyaW5nO1xuICBjbG9zZTogc3RyaW5nO1xuICByZWdleHA6IFJlZ0V4cDtcbn1cblxuY29uc3QgZW5hYmxlZCA9ICFub0NvbG9yO1xuXG5mdW5jdGlvbiBjb2RlKG9wZW46IG51bWJlcltdLCBjbG9zZTogbnVtYmVyKTogQ29kZSB7XG4gIHJldHVybiB7XG4gICAgb3BlbjogYFxceDFiWyR7b3Blbi5qb2luKFwiO1wiKX1tYCxcbiAgICBjbG9zZTogYFxceDFiWyR7Y2xvc2V9bWAsXG4gICAgcmVnZXhwOiBuZXcgUmVnRXhwKGBcXFxceDFiXFxcXFske2Nsb3NlfW1gLCBcImdcIiksXG4gIH07XG59XG5cbmZ1bmN0aW9uIHJ1bihzdHI6IHN0cmluZywgY29kZTogQ29kZSk6IHN0cmluZyB7XG4gIHJldHVybiBlbmFibGVkXG4gICAgPyBgJHtjb2RlLm9wZW59JHtzdHIucmVwbGFjZShjb2RlLnJlZ2V4cCwgY29kZS5vcGVuKX0ke2NvZGUuY2xvc2V9YFxuICAgIDogc3RyO1xufVxuXG4vKipcbiAqIFNldHMgdGhlIHN0eWxlIG9mIHRleHQgdG8gYmUgcHJpbnRlZCB0byBib2xkLlxuICpcbiAqIERpc2FibGUgYnkgc2V0dGluZyB0aGUgYE5PX0NPTE9SYCBlbnZpcm9ubWVudGFsIHZhcmlhYmxlLlxuICpcbiAqIEBwYXJhbSBzdHIgVGV4dCB0byBtYWtlIGJvbGRcbiAqXG4gKiBAcmV0dXJucyBCb2xkIHRleHQgZm9yIHByaW50aW5nXG4gKlxuICogQGV4YW1wbGUgVXNhZ2VcbiAqIGBgYHRzIG5vLWFzc2VydFxuICogaW1wb3J0IHsgYm9sZCB9IGZyb20gXCJAc3RkL2ludGVybmFsL3N0eWxlc1wiO1xuICpcbiAqIGNvbnNvbGUubG9nKGJvbGQoXCJIZWxsbywgd29ybGQhXCIpKTsgLy8gUHJpbnRzIFwiSGVsbG8sIHdvcmxkIVwiIGluIGJvbGRcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gYm9sZChzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBydW4oc3RyLCBjb2RlKFsxXSwgMjIpKTtcbn1cblxuLyoqXG4gKiBTZXRzIHRoZSBjb2xvciBvZiB0ZXh0IHRvIGJlIHByaW50ZWQgdG8gcmVkLlxuICpcbiAqIERpc2FibGUgYnkgc2V0dGluZyB0aGUgYE5PX0NPTE9SYCBlbnZpcm9ubWVudGFsIHZhcmlhYmxlLlxuICpcbiAqIEBwYXJhbSBzdHIgVGV4dCB0byBtYWtlIHJlZFxuICpcbiAqIEByZXR1cm5zIFJlZCB0ZXh0IGZvciBwcmludGluZ1xuICpcbiAqIEBleGFtcGxlIFVzYWdlXG4gKiBgYGB0cyBuby1hc3NlcnRcbiAqIGltcG9ydCB7IHJlZCB9IGZyb20gXCJAc3RkL2ludGVybmFsL3N0eWxlc1wiO1xuICpcbiAqIGNvbnNvbGUubG9nKHJlZChcIkhlbGxvLCB3b3JsZCFcIikpOyAvLyBQcmludHMgXCJIZWxsbywgd29ybGQhXCIgaW4gcmVkXG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZChzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBydW4oc3RyLCBjb2RlKFszMV0sIDM5KSk7XG59XG5cbi8qKlxuICogU2V0cyB0aGUgY29sb3Igb2YgdGV4dCB0byBiZSBwcmludGVkIHRvIGdyZWVuLlxuICpcbiAqIERpc2FibGUgYnkgc2V0dGluZyB0aGUgYE5PX0NPTE9SYCBlbnZpcm9ubWVudGFsIHZhcmlhYmxlLlxuICpcbiAqIEBwYXJhbSBzdHIgVGV4dCB0byBtYWtlIGdyZWVuXG4gKlxuICogQHJldHVybnMgR3JlZW4gdGV4dCBmb3IgcHJpbnRcbiAqXG4gKiBAZXhhbXBsZSBVc2FnZVxuICogYGBgdHMgbm8tYXNzZXJ0XG4gKiBpbXBvcnQgeyBncmVlbiB9IGZyb20gXCJAc3RkL2ludGVybmFsL3N0eWxlc1wiO1xuICpcbiAqIGNvbnNvbGUubG9nKGdyZWVuKFwiSGVsbG8sIHdvcmxkIVwiKSk7IC8vIFByaW50cyBcIkhlbGxvLCB3b3JsZCFcIiBpbiBncmVlblxuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBncmVlbihzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBydW4oc3RyLCBjb2RlKFszMl0sIDM5KSk7XG59XG5cbi8qKlxuICogU2V0cyB0aGUgY29sb3Igb2YgdGV4dCB0byBiZSBwcmludGVkIHRvIHllbGxvdy5cbiAqXG4gKiBEaXNhYmxlIGJ5IHNldHRpbmcgdGhlIGBOT19DT0xPUmAgZW52aXJvbm1lbnRhbCB2YXJpYWJsZS5cbiAqXG4gKiBAcGFyYW0gc3RyIFRleHQgdG8gbWFrZSB5ZWxsb3dcbiAqXG4gKiBAcmV0dXJucyBZZWxsb3cgdGV4dCBmb3IgcHJpbnRcbiAqXG4gKiBAZXhhbXBsZSBVc2FnZVxuICogYGBgdHMgbm8tYXNzZXJ0XG4gKiBpbXBvcnQgeyB5ZWxsb3cgfSBmcm9tIFwiQHN0ZC9pbnRlcm5hbC9zdHlsZXNcIjtcbiAqXG4gKiBjb25zb2xlLmxvZyh5ZWxsb3coXCJIZWxsbywgd29ybGQhXCIpKTsgLy8gUHJpbnRzIFwiSGVsbG8sIHdvcmxkIVwiIGluIHllbGxvd1xuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB5ZWxsb3coc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbMzNdLCAzOSkpO1xufVxuXG4vKipcbiAqIFNldHMgdGhlIGNvbG9yIG9mIHRleHQgdG8gYmUgcHJpbnRlZCB0byB3aGl0ZS5cbiAqXG4gKiBAcGFyYW0gc3RyIFRleHQgdG8gbWFrZSB3aGl0ZVxuICpcbiAqIEByZXR1cm5zIFdoaXRlIHRleHQgZm9yIHByaW50XG4gKlxuICogQGV4YW1wbGUgVXNhZ2VcbiAqIGBgYHRzIG5vLWFzc2VydFxuICogaW1wb3J0IHsgd2hpdGUgfSBmcm9tIFwiQHN0ZC9pbnRlcm5hbC9zdHlsZXNcIjtcbiAqXG4gKiBjb25zb2xlLmxvZyh3aGl0ZShcIkhlbGxvLCB3b3JsZCFcIikpOyAvLyBQcmludHMgXCJIZWxsbywgd29ybGQhXCIgaW4gd2hpdGVcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gd2hpdGUoc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbMzddLCAzOSkpO1xufVxuXG4vKipcbiAqIFNldHMgdGhlIGNvbG9yIG9mIHRleHQgdG8gYmUgcHJpbnRlZCB0byBncmF5LlxuICpcbiAqIEBwYXJhbSBzdHIgVGV4dCB0byBtYWtlIGdyYXlcbiAqXG4gKiBAcmV0dXJucyBHcmF5IHRleHQgZm9yIHByaW50XG4gKlxuICogQGV4YW1wbGUgVXNhZ2VcbiAqIGBgYHRzIG5vLWFzc2VydFxuICogaW1wb3J0IHsgZ3JheSB9IGZyb20gXCJAc3RkL2ludGVybmFsL3N0eWxlc1wiO1xuICpcbiAqIGNvbnNvbGUubG9nKGdyYXkoXCJIZWxsbywgd29ybGQhXCIpKTsgLy8gUHJpbnRzIFwiSGVsbG8sIHdvcmxkIVwiIGluIGdyYXlcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gZ3JheShzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBicmlnaHRCbGFjayhzdHIpO1xufVxuXG4vKipcbiAqIFNldHMgdGhlIGNvbG9yIG9mIHRleHQgdG8gYmUgcHJpbnRlZCB0byBicmlnaHQtYmxhY2suXG4gKlxuICogQHBhcmFtIHN0ciBUZXh0IHRvIG1ha2UgYnJpZ2h0LWJsYWNrXG4gKlxuICogQHJldHVybnMgQnJpZ2h0LWJsYWNrIHRleHQgZm9yIHByaW50XG4gKlxuICogQGV4YW1wbGUgVXNhZ2VcbiAqIGBgYHRzIG5vLWFzc2VydFxuICogaW1wb3J0IHsgYnJpZ2h0QmxhY2sgfSBmcm9tIFwiQHN0ZC9pbnRlcm5hbC9zdHlsZXNcIjtcbiAqXG4gKiBjb25zb2xlLmxvZyhicmlnaHRCbGFjayhcIkhlbGxvLCB3b3JsZCFcIikpOyAvLyBQcmludHMgXCJIZWxsbywgd29ybGQhXCIgaW4gYnJpZ2h0LWJsYWNrXG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJyaWdodEJsYWNrKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzkwXSwgMzkpKTtcbn1cblxuLyoqXG4gKiBTZXRzIHRoZSBiYWNrZ3JvdW5kIGNvbG9yIG9mIHRleHQgdG8gYmUgcHJpbnRlZCB0byByZWQuXG4gKlxuICogQHBhcmFtIHN0ciBUZXh0IHRvIG1ha2UgaXRzIGJhY2tncm91bmQgcmVkXG4gKlxuICogQHJldHVybnMgUmVkIGJhY2tncm91bmQgdGV4dCBmb3IgcHJpbnRcbiAqXG4gKiBAZXhhbXBsZSBVc2FnZVxuICogYGBgdHMgbm8tYXNzZXJ0XG4gKiBpbXBvcnQgeyBiZ1JlZCB9IGZyb20gXCJAc3RkL2ludGVybmFsL3N0eWxlc1wiO1xuICpcbiAqIGNvbnNvbGUubG9nKGJnUmVkKFwiSGVsbG8sIHdvcmxkIVwiKSk7IC8vIFByaW50cyBcIkhlbGxvLCB3b3JsZCFcIiB3aXRoIHJlZCBiYWNrZ3JvdW5kXG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJnUmVkKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzQxXSwgNDkpKTtcbn1cblxuLyoqXG4gKiBTZXRzIHRoZSBiYWNrZ3JvdW5kIGNvbG9yIG9mIHRleHQgdG8gYmUgcHJpbnRlZCB0byBncmVlbi5cbiAqXG4gKiBAcGFyYW0gc3RyIFRleHQgdG8gbWFrZSBpdHMgYmFja2dyb3VuZCBncmVlblxuICpcbiAqIEByZXR1cm5zIEdyZWVuIGJhY2tncm91bmQgdGV4dCBmb3IgcHJpbnRcbiAqXG4gKiBAZXhhbXBsZSBVc2FnZVxuICogYGBgdHMgbm8tYXNzZXJ0XG4gKiBpbXBvcnQgeyBiZ0dyZWVuIH0gZnJvbSBcIkBzdGQvaW50ZXJuYWwvc3R5bGVzXCI7XG4gKlxuICogY29uc29sZS5sb2coYmdHcmVlbihcIkhlbGxvLCB3b3JsZCFcIikpOyAvLyBQcmludHMgXCJIZWxsbywgd29ybGQhXCIgd2l0aCBncmVlbiBiYWNrZ3JvdW5kXG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJnR3JlZW4oc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbNDJdLCA0OSkpO1xufVxuXG4vLyBodHRwczovL2dpdGh1Yi5jb20vY2hhbGsvYW5zaS1yZWdleC9ibG9iLzAyZmE4OTNkNjE5ZDNkYTg1NDExYWNjOGZkNGUyZWVhMGU5NWE5ZDkvaW5kZXguanNcbmNvbnN0IEFOU0lfUEFUVEVSTiA9IG5ldyBSZWdFeHAoXG4gIFtcbiAgICBcIltcXFxcdTAwMUJcXFxcdTAwOUJdW1tcXFxcXSgpIzs/XSooPzooPzooPzooPzo7Wy1hLXpBLVpcXFxcZFxcXFwvIyYuOj0/JUB+X10rKSp8W2EtekEtWlxcXFxkXSsoPzo7Wy1hLXpBLVpcXFxcZFxcXFwvIyYuOj0/JUB+X10qKSopP1xcXFx1MDAwNylcIixcbiAgICBcIig/Oig/OlxcXFxkezEsNH0oPzo7XFxcXGR7MCw0fSkqKT9bXFxcXGRBLVBSLVRYWmNmLW5xLXV5PT48fl0pKVwiLFxuICBdLmpvaW4oXCJ8XCIpLFxuICBcImdcIixcbik7XG5cbi8qKlxuICogUmVtb3ZlIEFOU0kgZXNjYXBlIGNvZGVzIGZyb20gdGhlIHN0cmluZy5cbiAqXG4gKiBAcGFyYW0gc3RyaW5nIFRleHQgdG8gcmVtb3ZlIEFOU0kgZXNjYXBlIGNvZGVzIGZyb21cbiAqXG4gKiBAcmV0dXJucyBUZXh0IHdpdGhvdXQgQU5TSSBlc2NhcGUgY29kZXNcbiAqXG4gKiBAZXhhbXBsZSBVc2FnZVxuICogYGBgdHMgbm8tYXNzZXJ0XG4gKiBpbXBvcnQgeyByZWQsIHN0cmlwQW5zaUNvZGUgfSBmcm9tIFwiQHN0ZC9pbnRlcm5hbC9zdHlsZXNcIjtcbiAqXG4gKiBjb25zb2xlLmxvZyhzdHJpcEFuc2lDb2RlKHJlZChcIkhlbGxvLCB3b3JsZCFcIikpKTsgLy8gUHJpbnRzIFwiSGVsbG8sIHdvcmxkIVwiXG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0cmlwQW5zaUNvZGUoc3RyaW5nOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gc3RyaW5nLnJlcGxhY2UoQU5TSV9QQVRURVJOLCBcIlwiKTtcbn1cbiIsICIvLyBDb3B5cmlnaHQgMjAxOC0yMDI1IHRoZSBEZW5vIGF1dGhvcnMuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG5pbXBvcnQgeyBiZ0dyZWVuLCBiZ1JlZCwgYm9sZCwgZ3JheSwgZ3JlZW4sIHJlZCwgd2hpdGUgfSBmcm9tIFwiLi9zdHlsZXMudHNcIjtcbmltcG9ydCB0eXBlIHsgRGlmZlJlc3VsdCwgRGlmZlR5cGUgfSBmcm9tIFwiLi90eXBlcy50c1wiO1xuXG4vKipcbiAqIENvbG9ycyB0aGUgb3V0cHV0IG9mIGFzc2VydGlvbiBkaWZmcy5cbiAqXG4gKiBAcGFyYW0gZGlmZlR5cGUgRGlmZmVyZW5jZSB0eXBlLCBlaXRoZXIgYWRkZWQgb3IgcmVtb3ZlZC5cbiAqIEBwYXJhbSBiYWNrZ3JvdW5kIElmIHRydWUsIGNvbG9ycyB0aGUgYmFja2dyb3VuZCBpbnN0ZWFkIG9mIHRoZSB0ZXh0LlxuICpcbiAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCBjb2xvcnMgdGhlIGlucHV0IHN0cmluZy5cbiAqXG4gKiBAZXhhbXBsZSBVc2FnZVxuICogYGBgdHNcbiAqIGltcG9ydCB7IGNyZWF0ZUNvbG9yIH0gZnJvbSBcIkBzdGQvaW50ZXJuYWxcIjtcbiAqIGltcG9ydCB7IGFzc2VydEVxdWFscyB9IGZyb20gXCJAc3RkL2Fzc2VydFwiO1xuICogaW1wb3J0IHsgYm9sZCwgZ3JlZW4sIHJlZCwgd2hpdGUgfSBmcm9tIFwiQHN0ZC9mbXQvY29sb3JzXCI7XG4gKlxuICogYXNzZXJ0RXF1YWxzKGNyZWF0ZUNvbG9yKFwiYWRkZWRcIikoXCJmb29cIiksIGdyZWVuKGJvbGQoXCJmb29cIikpKTtcbiAqIGFzc2VydEVxdWFscyhjcmVhdGVDb2xvcihcInJlbW92ZWRcIikoXCJmb29cIiksIHJlZChib2xkKFwiZm9vXCIpKSk7XG4gKiBhc3NlcnRFcXVhbHMoY3JlYXRlQ29sb3IoXCJjb21tb25cIikoXCJmb29cIiksIHdoaXRlKFwiZm9vXCIpKTtcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlQ29sb3IoXG4gIGRpZmZUeXBlOiBEaWZmVHlwZSxcbiAgLyoqXG4gICAqIFRPRE8oQGxpdHRsZWRpdnkpOiBSZW1vdmUgdGhpcyB3aGVuIHdlIGNhbiBkZXRlY3QgdHJ1ZSBjb2xvciB0ZXJtaW5hbHMuIFNlZVxuICAgKiBodHRwczovL2dpdGh1Yi5jb20vZGVub2xhbmQvc3RkL2lzc3Vlcy8yNTc1LlxuICAgKi9cbiAgYmFja2dyb3VuZCA9IGZhbHNlLFxuKTogKHM6IHN0cmluZykgPT4gc3RyaW5nIHtcbiAgc3dpdGNoIChkaWZmVHlwZSkge1xuICAgIGNhc2UgXCJhZGRlZFwiOlxuICAgICAgcmV0dXJuIChzKSA9PiBiYWNrZ3JvdW5kID8gYmdHcmVlbih3aGl0ZShzKSkgOiBncmVlbihib2xkKHMpKTtcbiAgICBjYXNlIFwicmVtb3ZlZFwiOlxuICAgICAgcmV0dXJuIChzKSA9PiBiYWNrZ3JvdW5kID8gYmdSZWQod2hpdGUocykpIDogcmVkKGJvbGQocykpO1xuICAgIGNhc2UgXCJ0cnVuY2F0aW9uXCI6XG4gICAgICByZXR1cm4gZ3JheTtcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIHdoaXRlO1xuICB9XG59XG5cbi8qKlxuICogUHJlZml4ZXMgYCtgIG9yIGAtYCBpbiBkaWZmIG91dHB1dC5cbiAqXG4gKiBAcGFyYW0gZGlmZlR5cGUgRGlmZmVyZW5jZSB0eXBlLCBlaXRoZXIgYWRkZWQgb3IgcmVtb3ZlZFxuICpcbiAqIEByZXR1cm5zIEEgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgc2lnbi5cbiAqXG4gKiBAZXhhbXBsZSBVc2FnZVxuICogYGBgdHNcbiAqIGltcG9ydCB7IGNyZWF0ZVNpZ24gfSBmcm9tIFwiQHN0ZC9pbnRlcm5hbFwiO1xuICogaW1wb3J0IHsgYXNzZXJ0RXF1YWxzIH0gZnJvbSBcIkBzdGQvYXNzZXJ0XCI7XG4gKlxuICogYXNzZXJ0RXF1YWxzKGNyZWF0ZVNpZ24oXCJhZGRlZFwiKSwgXCIrICAgXCIpO1xuICogYXNzZXJ0RXF1YWxzKGNyZWF0ZVNpZ24oXCJyZW1vdmVkXCIpLCBcIi0gICBcIik7XG4gKiBhc3NlcnRFcXVhbHMoY3JlYXRlU2lnbihcImNvbW1vblwiKSwgXCIgICAgXCIpO1xuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVTaWduKGRpZmZUeXBlOiBEaWZmVHlwZSk6IHN0cmluZyB7XG4gIHN3aXRjaCAoZGlmZlR5cGUpIHtcbiAgICBjYXNlIFwiYWRkZWRcIjpcbiAgICAgIHJldHVybiBcIisgICBcIjtcbiAgICBjYXNlIFwicmVtb3ZlZFwiOlxuICAgICAgcmV0dXJuIFwiLSAgIFwiO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gXCIgICAgXCI7XG4gIH1cbn1cblxuLyoqIE9wdGlvbnMgZm9yIHtAbGlua2NvZGUgYnVpbGRNZXNzYWdlfS4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQnVpbGRNZXNzYWdlT3B0aW9ucyB7XG4gIC8qKlxuICAgKiBXaGV0aGVyIHRvIG91dHB1dCB0aGUgZGlmZiBhcyBhIHNpbmdsZSBzdHJpbmcuXG4gICAqIEBkZWZhdWx0IHtmYWxzZX1cbiAgICovXG4gIHN0cmluZ0RpZmY/OiBib29sZWFuO1xufVxuXG4vKipcbiAqIEJ1aWxkcyBhIG1lc3NhZ2UgYmFzZWQgb24gdGhlIHByb3ZpZGVkIGRpZmYgcmVzdWx0LlxuICpcbiAqIEBwYXJhbSBkaWZmUmVzdWx0IFRoZSBkaWZmIHJlc3VsdCBhcnJheS5cbiAqIEBwYXJhbSBvcHRpb25zIE9wdGlvbmFsIHBhcmFtZXRlcnMgZm9yIGN1c3RvbWl6aW5nIHRoZSBtZXNzYWdlLlxuICogQHBhcmFtIHRydW5jYXRlRGlmZiBGdW5jdGlvbiB0byB0cnVuY2F0ZSB0aGUgZGlmZiAoZGVmYXVsdCBpcyBubyB0cnVuY2F0aW9uKS5cbiAqXG4gKiBAcmV0dXJucyBBbiBhcnJheSBvZiBzdHJpbmdzIHJlcHJlc2VudGluZyB0aGUgYnVpbHQgbWVzc2FnZS5cbiAqXG4gKiBAZXhhbXBsZSBVc2FnZVxuICogYGBgdHMgbm8tYXNzZXJ0XG4gKiBpbXBvcnQgeyBkaWZmU3RyLCBidWlsZE1lc3NhZ2UgfSBmcm9tIFwiQHN0ZC9pbnRlcm5hbFwiO1xuICpcbiAqIGRpZmZTdHIoXCJIZWxsbywgd29ybGQhXCIsIFwiSGVsbG8sIHdvcmxkXCIpO1xuICogLy8gW1xuICogLy8gICBcIlwiLFxuICogLy8gICBcIlwiLFxuICogLy8gICBcIiAgICBbRGlmZl0gQWN0dWFsIC8gRXhwZWN0ZWRcIixcbiAqIC8vICAgXCJcIixcbiAqIC8vICAgXCJcIixcbiAqIC8vICAgXCItICAgSGVsbG8sIHdvcmxkIVwiLFxuICogLy8gICBcIisgICBIZWxsbywgd29ybGRcIixcbiAqIC8vICAgXCJcIixcbiAqIC8vIF1cbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRNZXNzYWdlKFxuICBkaWZmUmVzdWx0OiBSZWFkb25seUFycmF5PERpZmZSZXN1bHQ8c3RyaW5nPj4sXG4gIG9wdGlvbnM6IEJ1aWxkTWVzc2FnZU9wdGlvbnMgPSB7fSxcbiAgdHJ1bmNhdGVEaWZmPzogKFxuICAgIGRpZmZSZXN1bHQ6IFJlYWRvbmx5QXJyYXk8RGlmZlJlc3VsdDxzdHJpbmc+PixcbiAgICBzdHJpbmdEaWZmOiBib29sZWFuLFxuICAgIGNvbnRleHRMZW5ndGg/OiBudW1iZXIgfCBudWxsLFxuICApID0+IFJlYWRvbmx5QXJyYXk8RGlmZlJlc3VsdDxzdHJpbmc+Pixcbik6IHN0cmluZ1tdIHtcbiAgaWYgKHRydW5jYXRlRGlmZiAhPSBudWxsKSB7XG4gICAgZGlmZlJlc3VsdCA9IHRydW5jYXRlRGlmZihkaWZmUmVzdWx0LCBvcHRpb25zLnN0cmluZ0RpZmYgPz8gZmFsc2UpO1xuICB9XG5cbiAgY29uc3QgeyBzdHJpbmdEaWZmID0gZmFsc2UgfSA9IG9wdGlvbnM7XG4gIGNvbnN0IG1lc3NhZ2VzID0gW1xuICAgIFwiXCIsXG4gICAgXCJcIixcbiAgICBgICAgICR7Z3JheShib2xkKFwiW0RpZmZdXCIpKX0gJHtyZWQoYm9sZChcIkFjdHVhbFwiKSl9IC8gJHtcbiAgICAgIGdyZWVuKGJvbGQoXCJFeHBlY3RlZFwiKSlcbiAgICB9YCxcbiAgICBcIlwiLFxuICAgIFwiXCIsXG4gIF07XG4gIGNvbnN0IGRpZmZNZXNzYWdlcyA9IGRpZmZSZXN1bHQubWFwKChyZXN1bHQpID0+IHtcbiAgICBjb25zdCBjb2xvciA9IGNyZWF0ZUNvbG9yKHJlc3VsdC50eXBlKTtcblxuICAgIGNvbnN0IGxpbmUgPSByZXN1bHQudHlwZSA9PT0gXCJhZGRlZFwiIHx8IHJlc3VsdC50eXBlID09PSBcInJlbW92ZWRcIlxuICAgICAgPyByZXN1bHQuZGV0YWlscz8ubWFwKChkZXRhaWwpID0+XG4gICAgICAgIGRldGFpbC50eXBlICE9PSBcImNvbW1vblwiXG4gICAgICAgICAgPyBjcmVhdGVDb2xvcihkZXRhaWwudHlwZSwgdHJ1ZSkoZGV0YWlsLnZhbHVlKVxuICAgICAgICAgIDogZGV0YWlsLnZhbHVlXG4gICAgICApLmpvaW4oXCJcIikgPz8gcmVzdWx0LnZhbHVlXG4gICAgICA6IHJlc3VsdC52YWx1ZTtcblxuICAgIHJldHVybiBjb2xvcihgJHtjcmVhdGVTaWduKHJlc3VsdC50eXBlKX0ke2xpbmV9YCk7XG4gIH0pO1xuICBtZXNzYWdlcy5wdXNoKC4uLihzdHJpbmdEaWZmID8gW2RpZmZNZXNzYWdlcy5qb2luKFwiXCIpXSA6IGRpZmZNZXNzYWdlcyksIFwiXCIpO1xuICByZXR1cm4gbWVzc2FnZXM7XG59XG4iLCAiLy8gQ29weXJpZ2h0IDIwMTgtMjAyNSB0aGUgRGVubyBhdXRob3JzLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuaW1wb3J0IHR5cGUgeyBEaWZmUmVzdWx0LCBEaWZmVHlwZSB9IGZyb20gXCIuL3R5cGVzLnRzXCI7XG5cbi8qKiBSZXByZXNlbnRzIHRoZSBmYXJ0aGVzdCBwb2ludCBpbiB0aGUgZGlmZiBhbGdvcml0aG0uICovXG5leHBvcnQgaW50ZXJmYWNlIEZhcnRoZXN0UG9pbnQge1xuICAvKiogVGhlIHktY29vcmRpbmF0ZSBvZiB0aGUgcG9pbnQuICovXG4gIHk6IG51bWJlcjtcbiAgLyoqIFRoZSBpZCBvZiB0aGUgcG9pbnQuICovXG4gIGlkOiBudW1iZXI7XG59XG5cbmNvbnN0IFJFTU9WRUQgPSAxO1xuY29uc3QgQ09NTU9OID0gMjtcbmNvbnN0IEFEREVEID0gMztcblxuLyoqXG4gKiBDcmVhdGVzIGFuIGFycmF5IG9mIGNvbW1vbiBlbGVtZW50cyBiZXR3ZWVuIHR3byBhcnJheXMuXG4gKlxuICogQHR5cGVQYXJhbSBUIFRoZSB0eXBlIG9mIGVsZW1lbnRzIGluIHRoZSBhcnJheXMuXG4gKlxuICogQHBhcmFtIEEgVGhlIGZpcnN0IGFycmF5LlxuICogQHBhcmFtIEIgVGhlIHNlY29uZCBhcnJheS5cbiAqXG4gKiBAcmV0dXJucyBBbiBhcnJheSBjb250YWluaW5nIHRoZSBjb21tb24gZWxlbWVudHMgYmV0d2VlbiB0aGUgdHdvIGFycmF5cy5cbiAqXG4gKiBAZXhhbXBsZSBVc2FnZVxuICogYGBgdHNcbiAqIGltcG9ydCB7IGNyZWF0ZUNvbW1vbiB9IGZyb20gXCJAc3RkL2ludGVybmFsL2RpZmZcIjtcbiAqIGltcG9ydCB7IGFzc2VydEVxdWFscyB9IGZyb20gXCJAc3RkL2Fzc2VydFwiO1xuICpcbiAqIGNvbnN0IGEgPSBbMSwgMiwgM107XG4gKiBjb25zdCBiID0gWzEsIDIsIDRdO1xuICpcbiAqIGFzc2VydEVxdWFscyhjcmVhdGVDb21tb24oYSwgYiksIFsxLCAyXSk7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUNvbW1vbjxUPihBOiBUW10sIEI6IFRbXSk6IFRbXSB7XG4gIGNvbnN0IGNvbW1vbjogVFtdID0gW107XG4gIGlmIChBLmxlbmd0aCA9PT0gMCB8fCBCLmxlbmd0aCA9PT0gMCkgcmV0dXJuIFtdO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IE1hdGgubWluKEEubGVuZ3RoLCBCLmxlbmd0aCk7IGkgKz0gMSkge1xuICAgIGNvbnN0IGEgPSBBW2ldO1xuICAgIGNvbnN0IGIgPSBCW2ldO1xuICAgIGlmIChhICE9PSB1bmRlZmluZWQgJiYgYSA9PT0gYikge1xuICAgICAgY29tbW9uLnB1c2goYSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBjb21tb247XG4gICAgfVxuICB9XG4gIHJldHVybiBjb21tb247XG59XG5cbi8qKlxuICogQXNzZXJ0cyB0aGF0IHRoZSB2YWx1ZSBpcyBhIHtAbGlua2NvZGUgRmFydGhlc3RQb2ludH0uXG4gKiBJZiBub3QsIGFuIGVycm9yIGlzIHRocm93bi5cbiAqXG4gKiBAcGFyYW0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICpcbiAqIEByZXR1cm5zIEEgdm9pZCB2YWx1ZSB0aGF0IHJldHVybnMgb25jZSB0aGUgYXNzZXJ0aW9uIGNvbXBsZXRlcy5cbiAqXG4gKiBAZXhhbXBsZSBVc2FnZVxuICogYGBgdHNcbiAqIGltcG9ydCB7IGFzc2VydEZwIH0gZnJvbSBcIkBzdGQvaW50ZXJuYWwvZGlmZlwiO1xuICogaW1wb3J0IHsgYXNzZXJ0VGhyb3dzIH0gZnJvbSBcIkBzdGQvYXNzZXJ0XCI7XG4gKlxuICogYXNzZXJ0RnAoeyB5OiAwLCBpZDogMCB9KTtcbiAqIGFzc2VydFRocm93cygoKSA9PiBhc3NlcnRGcCh7IGlkOiAwIH0pKTtcbiAqIGFzc2VydFRocm93cygoKSA9PiBhc3NlcnRGcCh7IHk6IDAgfSkpO1xuICogYXNzZXJ0VGhyb3dzKCgpID0+IGFzc2VydEZwKHVuZGVmaW5lZCkpO1xuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRGcCh2YWx1ZTogdW5rbm93bik6IGFzc2VydHMgdmFsdWUgaXMgRmFydGhlc3RQb2ludCB7XG4gIGlmIChcbiAgICB2YWx1ZSA9PSBudWxsIHx8XG4gICAgdHlwZW9mIHZhbHVlICE9PSBcIm9iamVjdFwiIHx8XG4gICAgdHlwZW9mICh2YWx1ZSBhcyBGYXJ0aGVzdFBvaW50KT8ueSAhPT0gXCJudW1iZXJcIiB8fFxuICAgIHR5cGVvZiAodmFsdWUgYXMgRmFydGhlc3RQb2ludCk/LmlkICE9PSBcIm51bWJlclwiXG4gICkge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgIGBVbmV4cGVjdGVkIHZhbHVlLCBleHBlY3RlZCAnRmFydGhlc3RQb2ludCc6IHJlY2VpdmVkICR7dHlwZW9mIHZhbHVlfWAsXG4gICAgKTtcbiAgfVxufVxuXG4vKipcbiAqIENyZWF0ZXMgYW4gYXJyYXkgb2YgYmFja3RyYWNlZCBkaWZmZXJlbmNlcy5cbiAqXG4gKiBAdHlwZVBhcmFtIFQgVGhlIHR5cGUgb2YgZWxlbWVudHMgaW4gdGhlIGFycmF5cy5cbiAqXG4gKiBAcGFyYW0gQSBUaGUgZmlyc3QgYXJyYXkuXG4gKiBAcGFyYW0gQiBUaGUgc2Vjb25kIGFycmF5LlxuICogQHBhcmFtIGN1cnJlbnQgVGhlIGN1cnJlbnQge0BsaW5rY29kZSBGYXJ0aGVzdFBvaW50fS5cbiAqIEBwYXJhbSBzd2FwcGVkIEJvb2xlYW4gaW5kaWNhdGluZyBpZiB0aGUgYXJyYXlzIGFyZSBzd2FwcGVkLlxuICogQHBhcmFtIHJvdXRlcyBUaGUgcm91dGVzIGFycmF5LlxuICogQHBhcmFtIGRpZmZUeXBlc1B0ck9mZnNldCBUaGUgb2Zmc2V0IG9mIHRoZSBkaWZmIHR5cGVzIGluIHRoZSByb3V0ZXMgYXJyYXkuXG4gKlxuICogQHJldHVybnMgQW4gYXJyYXkgb2YgYmFja3RyYWNlZCBkaWZmZXJlbmNlcy5cbiAqXG4gKiBAZXhhbXBsZSBVc2FnZVxuICogYGBgdHNcbiAqIGltcG9ydCB7IGJhY2tUcmFjZSB9IGZyb20gXCJAc3RkL2ludGVybmFsL2RpZmZcIjtcbiAqIGltcG9ydCB7IGFzc2VydEVxdWFscyB9IGZyb20gXCJAc3RkL2Fzc2VydFwiO1xuICpcbiAqIGFzc2VydEVxdWFscyhcbiAqICAgYmFja1RyYWNlKFtdLCBbXSwgeyB5OiAwLCBpZDogMCB9LCBmYWxzZSwgbmV3IFVpbnQzMkFycmF5KDApLCAwKSxcbiAqICAgW10sXG4gKiApO1xuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiYWNrVHJhY2U8VD4oXG4gIEE6IFRbXSxcbiAgQjogVFtdLFxuICBjdXJyZW50OiBGYXJ0aGVzdFBvaW50LFxuICBzd2FwcGVkOiBib29sZWFuLFxuICByb3V0ZXM6IFVpbnQzMkFycmF5LFxuICBkaWZmVHlwZXNQdHJPZmZzZXQ6IG51bWJlcixcbik6IEFycmF5PHtcbiAgdHlwZTogRGlmZlR5cGU7XG4gIHZhbHVlOiBUO1xufT4ge1xuICBjb25zdCBNID0gQS5sZW5ndGg7XG4gIGNvbnN0IE4gPSBCLmxlbmd0aDtcbiAgY29uc3QgcmVzdWx0OiB7IHR5cGU6IERpZmZUeXBlOyB2YWx1ZTogVCB9W10gPSBbXTtcbiAgbGV0IGEgPSBNIC0gMTtcbiAgbGV0IGIgPSBOIC0gMTtcbiAgbGV0IGogPSByb3V0ZXNbY3VycmVudC5pZF07XG4gIGxldCB0eXBlID0gcm91dGVzW2N1cnJlbnQuaWQgKyBkaWZmVHlwZXNQdHJPZmZzZXRdO1xuICB3aGlsZSAodHJ1ZSkge1xuICAgIGlmICghaiAmJiAhdHlwZSkgYnJlYWs7XG4gICAgY29uc3QgcHJldiA9IGohO1xuICAgIGlmICh0eXBlID09PSBSRU1PVkVEKSB7XG4gICAgICByZXN1bHQudW5zaGlmdCh7XG4gICAgICAgIHR5cGU6IHN3YXBwZWQgPyBcInJlbW92ZWRcIiA6IFwiYWRkZWRcIixcbiAgICAgICAgdmFsdWU6IEJbYl0hLFxuICAgICAgfSk7XG4gICAgICBiIC09IDE7XG4gICAgfSBlbHNlIGlmICh0eXBlID09PSBBRERFRCkge1xuICAgICAgcmVzdWx0LnVuc2hpZnQoe1xuICAgICAgICB0eXBlOiBzd2FwcGVkID8gXCJhZGRlZFwiIDogXCJyZW1vdmVkXCIsXG4gICAgICAgIHZhbHVlOiBBW2FdISxcbiAgICAgIH0pO1xuICAgICAgYSAtPSAxO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXN1bHQudW5zaGlmdCh7IHR5cGU6IFwiY29tbW9uXCIsIHZhbHVlOiBBW2FdISB9KTtcbiAgICAgIGEgLT0gMTtcbiAgICAgIGIgLT0gMTtcbiAgICB9XG4gICAgaiA9IHJvdXRlc1twcmV2XTtcbiAgICB0eXBlID0gcm91dGVzW3ByZXYgKyBkaWZmVHlwZXNQdHJPZmZzZXRdO1xuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIHtAbGlua2NvZGUgRmFydGhlc3RQb2ludH0uXG4gKlxuICogQHBhcmFtIGsgVGhlIGN1cnJlbnQgaW5kZXguXG4gKiBAcGFyYW0gTSBUaGUgbGVuZ3RoIG9mIHRoZSBmaXJzdCBhcnJheS5cbiAqIEBwYXJhbSByb3V0ZXMgVGhlIHJvdXRlcyBhcnJheS5cbiAqIEBwYXJhbSBkaWZmVHlwZXNQdHJPZmZzZXQgVGhlIG9mZnNldCBvZiB0aGUgZGlmZiB0eXBlcyBpbiB0aGUgcm91dGVzIGFycmF5LlxuICogQHBhcmFtIHB0ciBUaGUgY3VycmVudCBwb2ludGVyLlxuICogQHBhcmFtIHNsaWRlIFRoZSBzbGlkZSB7QGxpbmtjb2RlIEZhcnRoZXN0UG9pbnR9LlxuICogQHBhcmFtIGRvd24gVGhlIGRvd24ge0BsaW5rY29kZSBGYXJ0aGVzdFBvaW50fS5cbiAqXG4gKiBAcmV0dXJucyBBIHtAbGlua2NvZGUgRmFydGhlc3RQb2ludH0uXG4gKlxuICogQGV4YW1wbGUgVXNhZ2VcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBjcmVhdGVGcCB9IGZyb20gXCJAc3RkL2ludGVybmFsL2RpZmZcIjtcbiAqIGltcG9ydCB7IGFzc2VydEVxdWFscyB9IGZyb20gXCJAc3RkL2Fzc2VydFwiO1xuICpcbiAqIGFzc2VydEVxdWFscyhcbiAqICAgY3JlYXRlRnAoXG4gKiAgICAgMCxcbiAqICAgICAwLFxuICogICAgIG5ldyBVaW50MzJBcnJheSgwKSxcbiAqICAgICAwLFxuICogICAgIDAsXG4gKiAgICAgeyB5OiAtMSwgaWQ6IDAgfSxcbiAqICAgICB7IHk6IDAsIGlkOiAwIH0sXG4gKiAgICksXG4gKiAgIHsgeTogLTEsIGlkOiAxIH0sXG4gKiApO1xuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVGcChcbiAgazogbnVtYmVyLFxuICBNOiBudW1iZXIsXG4gIHJvdXRlczogVWludDMyQXJyYXksXG4gIGRpZmZUeXBlc1B0ck9mZnNldDogbnVtYmVyLFxuICBwdHI6IG51bWJlcixcbiAgc2xpZGU/OiBGYXJ0aGVzdFBvaW50LFxuICBkb3duPzogRmFydGhlc3RQb2ludCxcbik6IEZhcnRoZXN0UG9pbnQge1xuICBpZiAoc2xpZGUgJiYgc2xpZGUueSA9PT0gLTEgJiYgZG93biAmJiBkb3duLnkgPT09IC0xKSB7XG4gICAgcmV0dXJuIHsgeTogMCwgaWQ6IDAgfTtcbiAgfVxuICBjb25zdCBpc0FkZGluZyA9IChkb3duPy55ID09PSAtMSkgfHxcbiAgICBrID09PSBNIHx8XG4gICAgKHNsaWRlPy55ID8/IDApID4gKGRvd24/LnkgPz8gMCkgKyAxO1xuICBpZiAoc2xpZGUgJiYgaXNBZGRpbmcpIHtcbiAgICBjb25zdCBwcmV2ID0gc2xpZGUuaWQ7XG4gICAgcHRyKys7XG4gICAgcm91dGVzW3B0cl0gPSBwcmV2O1xuICAgIHJvdXRlc1twdHIgKyBkaWZmVHlwZXNQdHJPZmZzZXRdID0gQURERUQ7XG4gICAgcmV0dXJuIHsgeTogc2xpZGUueSwgaWQ6IHB0ciB9O1xuICB9XG4gIGlmIChkb3duICYmICFpc0FkZGluZykge1xuICAgIGNvbnN0IHByZXYgPSBkb3duLmlkO1xuICAgIHB0cisrO1xuICAgIHJvdXRlc1twdHJdID0gcHJldjtcbiAgICByb3V0ZXNbcHRyICsgZGlmZlR5cGVzUHRyT2Zmc2V0XSA9IFJFTU9WRUQ7XG4gICAgcmV0dXJuIHsgeTogZG93bi55ICsgMSwgaWQ6IHB0ciB9O1xuICB9XG4gIHRocm93IG5ldyBFcnJvcihcIlVuZXhwZWN0ZWQgbWlzc2luZyBGYXJ0aGVzdFBvaW50XCIpO1xufVxuXG4vKipcbiAqIFJlbmRlcnMgdGhlIGRpZmZlcmVuY2VzIGJldHdlZW4gdGhlIGFjdHVhbCBhbmQgZXhwZWN0ZWQgdmFsdWVzLlxuICpcbiAqIEB0eXBlUGFyYW0gVCBUaGUgdHlwZSBvZiBlbGVtZW50cyBpbiB0aGUgYXJyYXlzLlxuICpcbiAqIEBwYXJhbSBBIEFjdHVhbCB2YWx1ZVxuICogQHBhcmFtIEIgRXhwZWN0ZWQgdmFsdWVcbiAqXG4gKiBAcmV0dXJucyBBbiBhcnJheSBvZiBkaWZmZXJlbmNlcyBiZXR3ZWVuIHRoZSBhY3R1YWwgYW5kIGV4cGVjdGVkIHZhbHVlcy5cbiAqXG4gKiBAZXhhbXBsZSBVc2FnZVxuICogYGBgdHNcbiAqIGltcG9ydCB7IGRpZmYgfSBmcm9tIFwiQHN0ZC9pbnRlcm5hbC9kaWZmXCI7XG4gKiBpbXBvcnQgeyBhc3NlcnRFcXVhbHMgfSBmcm9tIFwiQHN0ZC9hc3NlcnRcIjtcbiAqXG4gKiBjb25zdCBhID0gWzEsIDIsIDNdO1xuICogY29uc3QgYiA9IFsxLCAyLCA0XTtcbiAqXG4gKiBhc3NlcnRFcXVhbHMoZGlmZihhLCBiKSwgW1xuICogICB7IHR5cGU6IFwiY29tbW9uXCIsIHZhbHVlOiAxIH0sXG4gKiAgIHsgdHlwZTogXCJjb21tb25cIiwgdmFsdWU6IDIgfSxcbiAqICAgeyB0eXBlOiBcInJlbW92ZWRcIiwgdmFsdWU6IDMgfSxcbiAqICAgeyB0eXBlOiBcImFkZGVkXCIsIHZhbHVlOiA0IH0sXG4gKiBdKTtcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gZGlmZjxUPihBOiBUW10sIEI6IFRbXSk6IERpZmZSZXN1bHQ8VD5bXSB7XG4gIGNvbnN0IHByZWZpeENvbW1vbiA9IGNyZWF0ZUNvbW1vbihBLCBCKTtcbiAgQSA9IEEuc2xpY2UocHJlZml4Q29tbW9uLmxlbmd0aCk7XG4gIEIgPSBCLnNsaWNlKHByZWZpeENvbW1vbi5sZW5ndGgpO1xuICBjb25zdCBzd2FwcGVkID0gQi5sZW5ndGggPiBBLmxlbmd0aDtcbiAgW0EsIEJdID0gc3dhcHBlZCA/IFtCLCBBXSA6IFtBLCBCXTtcbiAgY29uc3QgTSA9IEEubGVuZ3RoO1xuICBjb25zdCBOID0gQi5sZW5ndGg7XG4gIGlmICghTSAmJiAhTiAmJiAhcHJlZml4Q29tbW9uLmxlbmd0aCkgcmV0dXJuIFtdO1xuICBpZiAoIU4pIHtcbiAgICByZXR1cm4gW1xuICAgICAgLi4ucHJlZml4Q29tbW9uLm1hcCgodmFsdWUpID0+ICh7IHR5cGU6IFwiY29tbW9uXCIsIHZhbHVlIH0pKSxcbiAgICAgIC4uLkEubWFwKCh2YWx1ZSkgPT4gKHsgdHlwZTogc3dhcHBlZCA/IFwiYWRkZWRcIiA6IFwicmVtb3ZlZFwiLCB2YWx1ZSB9KSksXG4gICAgXSBhcyBEaWZmUmVzdWx0PFQ+W107XG4gIH1cbiAgY29uc3Qgb2Zmc2V0ID0gTjtcbiAgY29uc3QgZGVsdGEgPSBNIC0gTjtcbiAgY29uc3QgbGVuZ3RoID0gTSArIE4gKyAxO1xuICBjb25zdCBmcDogRmFydGhlc3RQb2ludFtdID0gQXJyYXkuZnJvbSh7IGxlbmd0aCB9LCAoKSA9PiAoeyB5OiAtMSwgaWQ6IC0xIH0pKTtcblxuICAvKipcbiAgICogTm90ZTogdGhpcyBidWZmZXIgaXMgdXNlZCB0byBzYXZlIG1lbW9yeSBhbmQgaW1wcm92ZSBwZXJmb3JtYW5jZS4gVGhlIGZpcnN0XG4gICAqIGhhbGYgaXMgdXNlZCB0byBzYXZlIHJvdXRlIGFuZCB0aGUgbGFzdCBoYWxmIGlzIHVzZWQgdG8gc2F2ZSBkaWZmIHR5cGUuXG4gICAqL1xuICBjb25zdCByb3V0ZXMgPSBuZXcgVWludDMyQXJyYXkoKE0gKiBOICsgbGVuZ3RoICsgMSkgKiAyKTtcbiAgY29uc3QgZGlmZlR5cGVzUHRyT2Zmc2V0ID0gcm91dGVzLmxlbmd0aCAvIDI7XG4gIGxldCBwdHIgPSAwO1xuXG4gIGZ1bmN0aW9uIHNuYWtlPFQ+KFxuICAgIGs6IG51bWJlcixcbiAgICBBOiBUW10sXG4gICAgQjogVFtdLFxuICAgIHNsaWRlPzogRmFydGhlc3RQb2ludCxcbiAgICBkb3duPzogRmFydGhlc3RQb2ludCxcbiAgKTogRmFydGhlc3RQb2ludCB7XG4gICAgY29uc3QgTSA9IEEubGVuZ3RoO1xuICAgIGNvbnN0IE4gPSBCLmxlbmd0aDtcbiAgICBjb25zdCBmcCA9IGNyZWF0ZUZwKGssIE0sIHJvdXRlcywgZGlmZlR5cGVzUHRyT2Zmc2V0LCBwdHIsIHNsaWRlLCBkb3duKTtcbiAgICBwdHIgPSBmcC5pZDtcbiAgICB3aGlsZSAoZnAueSArIGsgPCBNICYmIGZwLnkgPCBOICYmIEFbZnAueSArIGtdID09PSBCW2ZwLnldKSB7XG4gICAgICBjb25zdCBwcmV2ID0gZnAuaWQ7XG4gICAgICBwdHIrKztcbiAgICAgIGZwLmlkID0gcHRyO1xuICAgICAgZnAueSArPSAxO1xuICAgICAgcm91dGVzW3B0cl0gPSBwcmV2O1xuICAgICAgcm91dGVzW3B0ciArIGRpZmZUeXBlc1B0ck9mZnNldF0gPSBDT01NT047XG4gICAgfVxuICAgIHJldHVybiBmcDtcbiAgfVxuXG4gIGxldCBjdXJyZW50RnAgPSBmcFtkZWx0YSArIG9mZnNldF07XG4gIGFzc2VydEZwKGN1cnJlbnRGcCk7XG4gIGxldCBwID0gLTE7XG4gIHdoaWxlIChjdXJyZW50RnAueSA8IE4pIHtcbiAgICBwID0gcCArIDE7XG4gICAgZm9yIChsZXQgayA9IC1wOyBrIDwgZGVsdGE7ICsraykge1xuICAgICAgY29uc3QgaW5kZXggPSBrICsgb2Zmc2V0O1xuICAgICAgZnBbaW5kZXhdID0gc25ha2UoaywgQSwgQiwgZnBbaW5kZXggLSAxXSwgZnBbaW5kZXggKyAxXSk7XG4gICAgfVxuICAgIGZvciAobGV0IGsgPSBkZWx0YSArIHA7IGsgPiBkZWx0YTsgLS1rKSB7XG4gICAgICBjb25zdCBpbmRleCA9IGsgKyBvZmZzZXQ7XG4gICAgICBmcFtpbmRleF0gPSBzbmFrZShrLCBBLCBCLCBmcFtpbmRleCAtIDFdLCBmcFtpbmRleCArIDFdKTtcbiAgICB9XG4gICAgY29uc3QgaW5kZXggPSBkZWx0YSArIG9mZnNldDtcbiAgICBmcFtkZWx0YSArIG9mZnNldF0gPSBzbmFrZShkZWx0YSwgQSwgQiwgZnBbaW5kZXggLSAxXSwgZnBbaW5kZXggKyAxXSk7XG4gICAgY3VycmVudEZwID0gZnBbZGVsdGEgKyBvZmZzZXRdO1xuICAgIGFzc2VydEZwKGN1cnJlbnRGcCk7XG4gIH1cbiAgcmV0dXJuIFtcbiAgICAuLi5wcmVmaXhDb21tb24ubWFwKCh2YWx1ZSkgPT4gKHsgdHlwZTogXCJjb21tb25cIiwgdmFsdWUgfSkpLFxuICAgIC4uLmJhY2tUcmFjZShBLCBCLCBjdXJyZW50RnAsIHN3YXBwZWQsIHJvdXRlcywgZGlmZlR5cGVzUHRyT2Zmc2V0KSxcbiAgXSBhcyBEaWZmUmVzdWx0PFQ+W107XG59XG4iLCAiLy8gQ29weXJpZ2h0IDIwMTgtMjAyNSB0aGUgRGVubyBhdXRob3JzLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuaW1wb3J0IHR5cGUgeyBDaGFuZ2VkRGlmZlJlc3VsdCwgRGlmZlJlc3VsdCB9IGZyb20gXCIuL3R5cGVzLnRzXCI7XG5pbXBvcnQgeyBkaWZmIH0gZnJvbSBcIi4vZGlmZi50c1wiO1xuXG4vKipcbiAqIFVuZXNjYXBlIGludmlzaWJsZSBjaGFyYWN0ZXJzLlxuICpcbiAqIEBzZWUge0BsaW5rIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL1N0cmluZyNlc2NhcGVfc2VxdWVuY2VzfVxuICpcbiAqIEBwYXJhbSBzdHJpbmcgU3RyaW5nIHRvIHVuZXNjYXBlLlxuICpcbiAqIEByZXR1cm5zIFVuZXNjYXBlZCBzdHJpbmcuXG4gKlxuICogQGV4YW1wbGUgVXNhZ2VcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyB1bmVzY2FwZSB9IGZyb20gXCJAc3RkL2ludGVybmFsL2RpZmYtc3RyXCI7XG4gKiBpbXBvcnQgeyBhc3NlcnRFcXVhbHMgfSBmcm9tIFwiQHN0ZC9hc3NlcnRcIjtcbiAqXG4gKiBhc3NlcnRFcXVhbHModW5lc2NhcGUoXCJIZWxsb1xcbldvcmxkXCIpLCBcIkhlbGxvXFxcXG5cXG5Xb3JsZFwiKTtcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gdW5lc2NhcGUoc3RyaW5nOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gc3RyaW5nXG4gICAgLnJlcGxhY2VBbGwoXCJcXFxcXCIsIFwiXFxcXFxcXFxcIilcbiAgICAucmVwbGFjZUFsbChcIlxcYlwiLCBcIlxcXFxiXCIpXG4gICAgLnJlcGxhY2VBbGwoXCJcXGZcIiwgXCJcXFxcZlwiKVxuICAgIC5yZXBsYWNlQWxsKFwiXFx0XCIsIFwiXFxcXHRcIilcbiAgICAucmVwbGFjZUFsbChcIlxcdlwiLCBcIlxcXFx2XCIpXG4gICAgLy8gVGhpcyBkb2VzIG5vdCByZW1vdmUgbGluZSBicmVha3NcbiAgICAucmVwbGFjZUFsbChcbiAgICAgIC9cXHJcXG58XFxyfFxcbi9nLFxuICAgICAgKHN0cikgPT4gc3RyID09PSBcIlxcclwiID8gXCJcXFxcclwiIDogc3RyID09PSBcIlxcblwiID8gXCJcXFxcblxcblwiIDogXCJcXFxcclxcXFxuXFxyXFxuXCIsXG4gICAgKTtcbn1cblxuY29uc3QgV0hJVEVTUEFDRV9TWU1CT0xTID1cbiAgLygoPzpcXFxcW2JmdHZdfFteXFxTXFxyXFxuXSkrfFxcXFxbcm5cXFxcXXxbKClbXFxde30nXCJcXHJcXG5dfFxcYikvO1xuXG4vKipcbiAqIFRva2VuaXplcyBhIHN0cmluZyBpbnRvIGFuIGFycmF5IG9mIHRva2Vucy5cbiAqXG4gKiBAcGFyYW0gc3RyaW5nIFRoZSBzdHJpbmcgdG8gdG9rZW5pemUuXG4gKiBAcGFyYW0gd29yZERpZmYgSWYgdHJ1ZSwgcGVyZm9ybXMgd29yZC1iYXNlZCB0b2tlbml6YXRpb24uIERlZmF1bHQgaXMgZmFsc2UuXG4gKlxuICogQHJldHVybnMgQW4gYXJyYXkgb2YgdG9rZW5zLlxuICpcbiAqIEBleGFtcGxlIFVzYWdlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgdG9rZW5pemUgfSBmcm9tIFwiQHN0ZC9pbnRlcm5hbC9kaWZmLXN0clwiO1xuICogaW1wb3J0IHsgYXNzZXJ0RXF1YWxzIH0gZnJvbSBcIkBzdGQvYXNzZXJ0XCI7XG4gKlxuICogYXNzZXJ0RXF1YWxzKHRva2VuaXplKFwiSGVsbG9cXG5Xb3JsZFwiKSwgW1wiSGVsbG9cXG5cIiwgXCJXb3JsZFwiXSk7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRva2VuaXplKHN0cmluZzogc3RyaW5nLCB3b3JkRGlmZiA9IGZhbHNlKTogc3RyaW5nW10ge1xuICBpZiAod29yZERpZmYpIHtcbiAgICByZXR1cm4gc3RyaW5nXG4gICAgICAuc3BsaXQoV0hJVEVTUEFDRV9TWU1CT0xTKVxuICAgICAgLmZpbHRlcigodG9rZW4pID0+IHRva2VuKTtcbiAgfVxuICBjb25zdCB0b2tlbnM6IHN0cmluZ1tdID0gW107XG4gIGNvbnN0IGxpbmVzID0gc3RyaW5nLnNwbGl0KC8oXFxufFxcclxcbikvKS5maWx0ZXIoKGxpbmUpID0+IGxpbmUpO1xuXG4gIGZvciAoY29uc3QgW2ksIGxpbmVdIG9mIGxpbmVzLmVudHJpZXMoKSkge1xuICAgIGlmIChpICUgMikge1xuICAgICAgdG9rZW5zW3Rva2Vucy5sZW5ndGggLSAxXSArPSBsaW5lO1xuICAgIH0gZWxzZSB7XG4gICAgICB0b2tlbnMucHVzaChsaW5lKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRva2Vucztcbn1cblxuLyoqXG4gKiBDcmVhdGUgZGV0YWlscyBieSBmaWx0ZXJpbmcgcmVsZXZhbnQgd29yZC1kaWZmIGZvciBjdXJyZW50IGxpbmUgYW5kIG1lcmdlXG4gKiBcInNwYWNlLWRpZmZcIiBpZiBzdXJyb3VuZGVkIGJ5IHdvcmQtZGlmZiBmb3IgY2xlYW5lciBkaXNwbGF5cy5cbiAqXG4gKiBAcGFyYW0gbGluZSBDdXJyZW50IGxpbmVcbiAqIEBwYXJhbSB0b2tlbnMgV29yZC1kaWZmIHRva2Vuc1xuICpcbiAqIEByZXR1cm5zIEFycmF5IG9mIGRpZmYgcmVzdWx0cy5cbiAqXG4gKiBAZXhhbXBsZSBVc2FnZVxuICogYGBgdHNcbiAqIGltcG9ydCB7IGNyZWF0ZURldGFpbHMgfSBmcm9tIFwiQHN0ZC9pbnRlcm5hbC9kaWZmLXN0clwiO1xuICogaW1wb3J0IHsgYXNzZXJ0RXF1YWxzIH0gZnJvbSBcIkBzdGQvYXNzZXJ0XCI7XG4gKlxuICogY29uc3QgdG9rZW5zID0gW1xuICogICB7IHR5cGU6IFwiYWRkZWRcIiwgdmFsdWU6IFwiYVwiIH0sXG4gKiAgIHsgdHlwZTogXCJyZW1vdmVkXCIsIHZhbHVlOiBcImJcIiB9LFxuICogICB7IHR5cGU6IFwiY29tbW9uXCIsIHZhbHVlOiBcImNcIiB9LFxuICogXSBhcyBjb25zdDtcbiAqIGFzc2VydEVxdWFscyhcbiAqICAgY3JlYXRlRGV0YWlscyh7IHR5cGU6IFwiYWRkZWRcIiwgdmFsdWU6IFwiYVwiIH0sIFsuLi50b2tlbnNdKSxcbiAqICAgW3sgdHlwZTogXCJhZGRlZFwiLCB2YWx1ZTogXCJhXCIgfSwgeyB0eXBlOiBcImNvbW1vblwiLCB2YWx1ZTogXCJjXCIgfV1cbiAqICk7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZURldGFpbHMoXG4gIGxpbmU6IERpZmZSZXN1bHQ8c3RyaW5nPixcbiAgdG9rZW5zOiBEaWZmUmVzdWx0PHN0cmluZz5bXSxcbik6IERpZmZSZXN1bHQ8c3RyaW5nPltdIHtcbiAgcmV0dXJuIHRva2Vucy5maWx0ZXIoKHsgdHlwZSB9KSA9PiB0eXBlID09PSBsaW5lLnR5cGUgfHwgdHlwZSA9PT0gXCJjb21tb25cIilcbiAgICAubWFwKChyZXN1bHQsIGksIHQpID0+IHtcbiAgICAgIGNvbnN0IHRva2VuID0gdFtpIC0gMV07XG4gICAgICBpZiAoXG4gICAgICAgIChyZXN1bHQudHlwZSA9PT0gXCJjb21tb25cIikgJiYgdG9rZW4gJiZcbiAgICAgICAgKHRva2VuLnR5cGUgPT09IHRbaSArIDFdPy50eXBlKSAmJiAvXFxzKy8udGVzdChyZXN1bHQudmFsdWUpXG4gICAgICApIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAuLi5yZXN1bHQsXG4gICAgICAgICAgdHlwZTogdG9rZW4udHlwZSxcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSk7XG59XG5cbmNvbnN0IE5PTl9XSElURVNQQUNFX1JFR0VYUCA9IC9cXFMvO1xuXG4vKipcbiAqIFJlbmRlcnMgdGhlIGRpZmZlcmVuY2VzIGJldHdlZW4gdGhlIGFjdHVhbCBhbmQgZXhwZWN0ZWQgc3RyaW5ncy4gUGFydGlhbGx5XG4gKiBpbnNwaXJlZCBmcm9tIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20va3BkZWNrZXIvanNkaWZmfS5cbiAqXG4gKiBAcGFyYW0gQSBBY3R1YWwgc3RyaW5nXG4gKiBAcGFyYW0gQiBFeHBlY3RlZCBzdHJpbmdcbiAqXG4gKiBAcmV0dXJucyBBcnJheSBvZiBkaWZmIHJlc3VsdHMuXG4gKlxuICogQGV4YW1wbGUgVXNhZ2VcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBkaWZmU3RyIH0gZnJvbSBcIkBzdGQvaW50ZXJuYWwvZGlmZi1zdHJcIjtcbiAqIGltcG9ydCB7IGFzc2VydEVxdWFscyB9IGZyb20gXCJAc3RkL2Fzc2VydFwiO1xuICpcbiAqIGFzc2VydEVxdWFscyhkaWZmU3RyKFwiSGVsbG8hXCIsIFwiSGVsbG9cIiksIFtcbiAqICAge1xuICogICAgIHR5cGU6IFwicmVtb3ZlZFwiLFxuICogICAgIHZhbHVlOiBcIkhlbGxvIVxcblwiLFxuICogICAgIGRldGFpbHM6IFtcbiAqICAgICAgIHsgdHlwZTogXCJjb21tb25cIiwgdmFsdWU6IFwiSGVsbG9cIiB9LFxuICogICAgICAgeyB0eXBlOiBcInJlbW92ZWRcIiwgdmFsdWU6IFwiIVwiIH0sXG4gKiAgICAgICB7IHR5cGU6IFwiY29tbW9uXCIsIHZhbHVlOiBcIlxcblwiIH1cbiAqICAgICBdXG4gKiAgIH0sXG4gKiAgIHtcbiAqICAgICB0eXBlOiBcImFkZGVkXCIsXG4gKiAgICAgdmFsdWU6IFwiSGVsbG9cXG5cIixcbiAqICAgICBkZXRhaWxzOiBbXG4gKiAgICAgICB7IHR5cGU6IFwiY29tbW9uXCIsIHZhbHVlOiBcIkhlbGxvXCIgfSxcbiAqICAgICAgIHsgdHlwZTogXCJjb21tb25cIiwgdmFsdWU6IFwiXFxuXCIgfVxuICogICAgIF1cbiAqICAgfVxuICogXSk7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRpZmZTdHIoQTogc3RyaW5nLCBCOiBzdHJpbmcpOiBEaWZmUmVzdWx0PHN0cmluZz5bXSB7XG4gIC8vIENvbXB1dGUgbXVsdGktbGluZSBkaWZmXG4gIGNvbnN0IGRpZmZSZXN1bHQgPSBkaWZmKFxuICAgIHRva2VuaXplKGAke3VuZXNjYXBlKEEpfVxcbmApLFxuICAgIHRva2VuaXplKGAke3VuZXNjYXBlKEIpfVxcbmApLFxuICApO1xuXG4gIGNvbnN0IGFkZGVkID0gW107XG4gIGNvbnN0IHJlbW92ZWQgPSBbXTtcbiAgZm9yIChjb25zdCByZXN1bHQgb2YgZGlmZlJlc3VsdCkge1xuICAgIGlmIChyZXN1bHQudHlwZSA9PT0gXCJhZGRlZFwiKSB7XG4gICAgICBhZGRlZC5wdXNoKHJlc3VsdCk7XG4gICAgfVxuICAgIGlmIChyZXN1bHQudHlwZSA9PT0gXCJyZW1vdmVkXCIpIHtcbiAgICAgIHJlbW92ZWQucHVzaChyZXN1bHQpO1xuICAgIH1cbiAgfVxuXG4gIC8vIENvbXB1dGUgd29yZC1kaWZmXG4gIGNvbnN0IGhhc01vcmVSZW1vdmVkTGluZXMgPSBhZGRlZC5sZW5ndGggPCByZW1vdmVkLmxlbmd0aDtcbiAgY29uc3QgYUxpbmVzID0gaGFzTW9yZVJlbW92ZWRMaW5lcyA/IGFkZGVkIDogcmVtb3ZlZDtcbiAgY29uc3QgYkxpbmVzID0gaGFzTW9yZVJlbW92ZWRMaW5lcyA/IHJlbW92ZWQgOiBhZGRlZDtcbiAgZm9yIChjb25zdCBhIG9mIGFMaW5lcykge1xuICAgIGxldCB0b2tlbnMgPSBbXSBhcyBBcnJheTxEaWZmUmVzdWx0PHN0cmluZz4+O1xuICAgIGxldCBiOiB1bmRlZmluZWQgfCBDaGFuZ2VkRGlmZlJlc3VsdDxzdHJpbmc+O1xuICAgIC8vIFNlYXJjaCBhbm90aGVyIGRpZmYgbGluZSB3aXRoIGF0IGxlYXN0IG9uZSBjb21tb24gdG9rZW5cbiAgICB3aGlsZSAoYkxpbmVzLmxlbmd0aCkge1xuICAgICAgYiA9IGJMaW5lcy5zaGlmdCgpO1xuICAgICAgY29uc3QgdG9rZW5pemVkID0gW1xuICAgICAgICB0b2tlbml6ZShhLnZhbHVlLCB0cnVlKSxcbiAgICAgICAgdG9rZW5pemUoYiEudmFsdWUsIHRydWUpLFxuICAgICAgXSBhcyBbc3RyaW5nW10sIHN0cmluZ1tdXTtcbiAgICAgIGlmIChoYXNNb3JlUmVtb3ZlZExpbmVzKSB0b2tlbml6ZWQucmV2ZXJzZSgpO1xuICAgICAgdG9rZW5zID0gZGlmZih0b2tlbml6ZWRbMF0sIHRva2VuaXplZFsxXSk7XG4gICAgICBpZiAoXG4gICAgICAgIHRva2Vucy5zb21lKCh7IHR5cGUsIHZhbHVlIH0pID0+XG4gICAgICAgICAgdHlwZSA9PT0gXCJjb21tb25cIiAmJiBOT05fV0hJVEVTUEFDRV9SRUdFWFAudGVzdCh2YWx1ZSlcbiAgICAgICAgKVxuICAgICAgKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICAvLyBSZWdpc3RlciB3b3JkLWRpZmYgZGV0YWlsc1xuICAgIGEuZGV0YWlscyA9IGNyZWF0ZURldGFpbHMoYSwgdG9rZW5zKTtcbiAgICBpZiAoYikge1xuICAgICAgYi5kZXRhaWxzID0gY3JlYXRlRGV0YWlscyhiLCB0b2tlbnMpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBkaWZmUmVzdWx0O1xufVxuIiwgIi8vIENvcHlyaWdodCAyMDE4LTIwMjUgdGhlIERlbm8gYXV0aG9ycy4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5pbXBvcnQgeyBidWlsZE1lc3NhZ2UgfSBmcm9tIFwianNyOkBzdGQvaW50ZXJuYWxAXjEuMC4xMi9idWlsZC1tZXNzYWdlXCI7XG5pbXBvcnQgeyBkaWZmIH0gZnJvbSBcImpzcjpAc3RkL2ludGVybmFsQF4xLjAuMTIvZGlmZlwiO1xuaW1wb3J0IHsgZGlmZlN0ciB9IGZyb20gXCJqc3I6QHN0ZC9pbnRlcm5hbEBeMS4wLjEyL2RpZmYtc3RyXCI7XG5pbXBvcnQgeyBmb3JtYXQgfSBmcm9tIFwianNyOkBzdGQvaW50ZXJuYWxAXjEuMC4xMi9mb3JtYXRcIjtcbmltcG9ydCB7IHJlZCB9IGZyb20gXCJqc3I6QHN0ZC9pbnRlcm5hbEBeMS4wLjEyL3N0eWxlc1wiO1xuaW1wb3J0IHsgQXNzZXJ0aW9uRXJyb3IgfSBmcm9tIFwiLi9hc3NlcnRpb25fZXJyb3IudHNcIjtcblxuLyoqXG4gKiBNYWtlIGFuIGFzc2VydGlvbiB0aGF0IGBhY3R1YWxgIGFuZCBgZXhwZWN0ZWRgIGFyZSBzdHJpY3RseSBlcXVhbCwgdXNpbmdcbiAqIHtAbGlua2NvZGUgT2JqZWN0LmlzfSBmb3IgZXF1YWxpdHkgY29tcGFyaXNvbi4gSWYgbm90LCB0aGVuIHRocm93LlxuICpcbiAqIEBleGFtcGxlIFVzYWdlXG4gKiBgYGB0cyBpZ25vcmVcbiAqIGltcG9ydCB7IGFzc2VydFN0cmljdEVxdWFscyB9IGZyb20gXCJAc3RkL2Fzc2VydFwiO1xuICpcbiAqIGNvbnN0IGEgPSB7fTtcbiAqIGNvbnN0IGIgPSBhO1xuICogYXNzZXJ0U3RyaWN0RXF1YWxzKGEsIGIpOyAvLyBEb2Vzbid0IHRocm93XG4gKlxuICogY29uc3QgYyA9IHt9O1xuICogY29uc3QgZCA9IHt9O1xuICogYXNzZXJ0U3RyaWN0RXF1YWxzKGMsIGQpOyAvLyBUaHJvd3NcbiAqIGBgYFxuICpcbiAqIEB0eXBlUGFyYW0gVCBUaGUgdHlwZSBvZiB0aGUgZXhwZWN0ZWQgdmFsdWUuXG4gKiBAcGFyYW0gYWN0dWFsIFRoZSBhY3R1YWwgdmFsdWUgdG8gY29tcGFyZS5cbiAqIEBwYXJhbSBleHBlY3RlZCBUaGUgZXhwZWN0ZWQgdmFsdWUgdG8gY29tcGFyZS5cbiAqIEBwYXJhbSBtc2cgVGhlIG9wdGlvbmFsIG1lc3NhZ2UgdG8gZGlzcGxheSBpZiB0aGUgYXNzZXJ0aW9uIGZhaWxzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0U3RyaWN0RXF1YWxzPFQ+KFxuICBhY3R1YWw6IHVua25vd24sXG4gIGV4cGVjdGVkOiBULFxuICBtc2c/OiBzdHJpbmcsXG4pOiBhc3NlcnRzIGFjdHVhbCBpcyBUIHtcbiAgaWYgKE9iamVjdC5pcyhhY3R1YWwsIGV4cGVjdGVkKSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IG1zZ1N1ZmZpeCA9IG1zZyA/IGA6ICR7bXNnfWAgOiBcIi5cIjtcbiAgbGV0IG1lc3NhZ2U6IHN0cmluZztcblxuICBjb25zdCBhY3R1YWxTdHJpbmcgPSBmb3JtYXQoYWN0dWFsKTtcbiAgY29uc3QgZXhwZWN0ZWRTdHJpbmcgPSBmb3JtYXQoZXhwZWN0ZWQpO1xuXG4gIGlmIChhY3R1YWxTdHJpbmcgPT09IGV4cGVjdGVkU3RyaW5nKSB7XG4gICAgY29uc3Qgd2l0aE9mZnNldCA9IGFjdHVhbFN0cmluZ1xuICAgICAgLnNwbGl0KFwiXFxuXCIpXG4gICAgICAubWFwKChsKSA9PiBgICAgICR7bH1gKVxuICAgICAgLmpvaW4oXCJcXG5cIik7XG4gICAgbWVzc2FnZSA9XG4gICAgICBgVmFsdWVzIGhhdmUgdGhlIHNhbWUgc3RydWN0dXJlIGJ1dCBhcmUgbm90IHJlZmVyZW5jZS1lcXVhbCR7bXNnU3VmZml4fVxcblxcbiR7XG4gICAgICAgIHJlZCh3aXRoT2Zmc2V0KVxuICAgICAgfVxcbmA7XG4gIH0gZWxzZSB7XG4gICAgY29uc3Qgc3RyaW5nRGlmZiA9ICh0eXBlb2YgYWN0dWFsID09PSBcInN0cmluZ1wiKSAmJlxuICAgICAgKHR5cGVvZiBleHBlY3RlZCA9PT0gXCJzdHJpbmdcIik7XG4gICAgY29uc3QgZGlmZlJlc3VsdCA9IHN0cmluZ0RpZmZcbiAgICAgID8gZGlmZlN0cihhY3R1YWwgYXMgc3RyaW5nLCBleHBlY3RlZCBhcyBzdHJpbmcpXG4gICAgICA6IGRpZmYoYWN0dWFsU3RyaW5nLnNwbGl0KFwiXFxuXCIpLCBleHBlY3RlZFN0cmluZy5zcGxpdChcIlxcblwiKSk7XG4gICAgY29uc3QgZGlmZk1zZyA9IGJ1aWxkTWVzc2FnZShkaWZmUmVzdWx0LCB7IHN0cmluZ0RpZmYgfSwgYXJndW1lbnRzWzNdKVxuICAgICAgLmpvaW4oXCJcXG5cIik7XG4gICAgbWVzc2FnZSA9IGBWYWx1ZXMgYXJlIG5vdCBzdHJpY3RseSBlcXVhbCR7bXNnU3VmZml4fVxcbiR7ZGlmZk1zZ31gO1xuICB9XG5cbiAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKG1lc3NhZ2UpO1xufVxuIiwgIi8vIENvcHlyaWdodCAyMDE4LTIwMjUgdGhlIERlbm8gYXV0aG9ycy4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5pbXBvcnQgeyBBc3NlcnRpb25FcnJvciB9IGZyb20gXCIuL2Fzc2VydGlvbl9lcnJvci50c1wiO1xuXG4vKiogQW55IGNvbnN0cnVjdG9yICovXG4vLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuZXhwb3J0IHR5cGUgQW55Q29uc3RydWN0b3IgPSBuZXcgKC4uLmFyZ3M6IGFueVtdKSA9PiBhbnk7XG4vKiogR2V0cyBjb25zdHJ1Y3RvciB0eXBlICovXG5leHBvcnQgdHlwZSBHZXRDb25zdHJ1Y3RvclR5cGU8VCBleHRlbmRzIEFueUNvbnN0cnVjdG9yPiA9IEluc3RhbmNlVHlwZTxUPjtcblxuLyoqXG4gKiBNYWtlIGFuIGFzc2VydGlvbiB0aGF0IGBvYmpgIGlzIGFuIGluc3RhbmNlIG9mIGB0eXBlYC5cbiAqIElmIG5vdCB0aGVuIHRocm93LlxuICpcbiAqIEBleGFtcGxlIFVzYWdlXG4gKiBgYGB0cyBpZ25vcmVcbiAqIGltcG9ydCB7IGFzc2VydEluc3RhbmNlT2YgfSBmcm9tIFwiQHN0ZC9hc3NlcnRcIjtcbiAqXG4gKiBhc3NlcnRJbnN0YW5jZU9mKG5ldyBEYXRlKCksIERhdGUpOyAvLyBEb2Vzbid0IHRocm93XG4gKiBhc3NlcnRJbnN0YW5jZU9mKG5ldyBEYXRlKCksIE51bWJlcik7IC8vIFRocm93c1xuICogYGBgXG4gKlxuICogQHR5cGVQYXJhbSBUIFRoZSBleHBlY3RlZCB0eXBlIG9mIHRoZSBvYmplY3QuXG4gKiBAcGFyYW0gYWN0dWFsIFRoZSBvYmplY3QgdG8gY2hlY2suXG4gKiBAcGFyYW0gZXhwZWN0ZWRUeXBlIFRoZSBleHBlY3RlZCBjbGFzcyBjb25zdHJ1Y3Rvci5cbiAqIEBwYXJhbSBtc2cgVGhlIG9wdGlvbmFsIG1lc3NhZ2UgdG8gZGlzcGxheSBpZiB0aGUgYXNzZXJ0aW9uIGZhaWxzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0SW5zdGFuY2VPZjxcbiAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgVCBleHRlbmRzIGFic3RyYWN0IG5ldyAoLi4uYXJnczogYW55W10pID0+IGFueSxcbj4oXG4gIGFjdHVhbDogdW5rbm93bixcbiAgZXhwZWN0ZWRUeXBlOiBULFxuICBtc2cgPSBcIlwiLFxuKTogYXNzZXJ0cyBhY3R1YWwgaXMgSW5zdGFuY2VUeXBlPFQ+IHtcbiAgaWYgKGFjdHVhbCBpbnN0YW5jZW9mIGV4cGVjdGVkVHlwZSkgcmV0dXJuO1xuXG4gIGNvbnN0IG1zZ1N1ZmZpeCA9IG1zZyA/IGA6ICR7bXNnfWAgOiBcIi5cIjtcbiAgY29uc3QgZXhwZWN0ZWRUeXBlU3RyID0gZXhwZWN0ZWRUeXBlLm5hbWU7XG5cbiAgbGV0IGFjdHVhbFR5cGVTdHIgPSBcIlwiO1xuICBpZiAoYWN0dWFsID09PSBudWxsKSB7XG4gICAgYWN0dWFsVHlwZVN0ciA9IFwibnVsbFwiO1xuICB9IGVsc2UgaWYgKGFjdHVhbCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgYWN0dWFsVHlwZVN0ciA9IFwidW5kZWZpbmVkXCI7XG4gIH0gZWxzZSBpZiAodHlwZW9mIGFjdHVhbCA9PT0gXCJvYmplY3RcIikge1xuICAgIGFjdHVhbFR5cGVTdHIgPSBhY3R1YWwuY29uc3RydWN0b3I/Lm5hbWUgPz8gXCJPYmplY3RcIjtcbiAgfSBlbHNlIHtcbiAgICBhY3R1YWxUeXBlU3RyID0gdHlwZW9mIGFjdHVhbDtcbiAgfVxuXG4gIGlmIChleHBlY3RlZFR5cGVTdHIgPT09IGFjdHVhbFR5cGVTdHIpIHtcbiAgICBtc2cgPVxuICAgICAgYEV4cGVjdGVkIG9iamVjdCB0byBiZSBhbiBpbnN0YW5jZSBvZiBcIiR7ZXhwZWN0ZWRUeXBlU3RyfVwiJHttc2dTdWZmaXh9YDtcbiAgfSBlbHNlIGlmIChhY3R1YWxUeXBlU3RyID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICBtc2cgPVxuICAgICAgYEV4cGVjdGVkIG9iamVjdCB0byBiZSBhbiBpbnN0YW5jZSBvZiBcIiR7ZXhwZWN0ZWRUeXBlU3RyfVwiIGJ1dCB3YXMgbm90IGFuIGluc3RhbmNlZCBvYmplY3Qke21zZ1N1ZmZpeH1gO1xuICB9IGVsc2Uge1xuICAgIG1zZyA9XG4gICAgICBgRXhwZWN0ZWQgb2JqZWN0IHRvIGJlIGFuIGluc3RhbmNlIG9mIFwiJHtleHBlY3RlZFR5cGVTdHJ9XCIgYnV0IHdhcyBcIiR7YWN0dWFsVHlwZVN0cn1cIiR7bXNnU3VmZml4fWA7XG4gIH1cblxuICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IobXNnKTtcbn1cbiIsICIvLyBDb3B5cmlnaHQgMjAxOC0yMDI1IHRoZSBEZW5vIGF1dGhvcnMuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuaW1wb3J0IHsgQXNzZXJ0aW9uRXJyb3IgfSBmcm9tIFwianNyOkBzdGQvYXNzZXJ0QF4xLjAuMTQvYXNzZXJ0aW9uLWVycm9yXCI7XG5pbXBvcnQgeyBzdHJpcEFuc2lDb2RlIH0gZnJvbSBcImpzcjpAc3RkL2ludGVybmFsQF4xLjAuMTAvc3R5bGVzXCI7XG5cbi8qKlxuICogTWFrZSBhbiBhc3NlcnRpb24gdGhhdCBgZXJyb3JgIGlzIGFuIGBFcnJvcmAuXG4gKiBJZiBub3QgdGhlbiBhbiBlcnJvciB3aWxsIGJlIHRocm93bi5cbiAqIEFuIGVycm9yIGNsYXNzIGFuZCBhIHN0cmluZyB0aGF0IHNob3VsZCBiZSBpbmNsdWRlZCBpbiB0aGVcbiAqIGVycm9yIG1lc3NhZ2UgY2FuIGFsc28gYmUgYXNzZXJ0ZWQuXG4gKlxuICogQHR5cGVQYXJhbSBFIFRoZSB0eXBlIG9mIHRoZSBlcnJvciB0byBhc3NlcnQuXG4gKiBAcGFyYW0gZXJyb3IgVGhlIGVycm9yIHRvIGFzc2VydC5cbiAqIEBwYXJhbSBFcnJvckNsYXNzIFRoZSBvcHRpb25hbCBlcnJvciBjbGFzcyB0byBhc3NlcnQuXG4gKiBAcGFyYW0gbXNnTWF0Y2hlcyBUaGUgb3B0aW9uYWwgc3RyaW5nIG9yIFJlZ0V4cCB0byBhc3NlcnQgaW4gdGhlIGVycm9yIG1lc3NhZ2UuXG4gKiBAcGFyYW0gbXNnIFRoZSBvcHRpb25hbCBtZXNzYWdlIHRvIGRpc3BsYXkgaWYgdGhlIGFzc2VydGlvbiBmYWlscy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydElzRXJyb3I8RSBleHRlbmRzIEVycm9yID0gRXJyb3I+KFxuICBlcnJvcjogdW5rbm93bixcbiAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgRXJyb3JDbGFzcz86IGFic3RyYWN0IG5ldyAoLi4uYXJnczogYW55W10pID0+IEUsXG4gIG1zZ01hdGNoZXM/OiBzdHJpbmcgfCBSZWdFeHAsXG4gIG1zZz86IHN0cmluZyxcbik6IGFzc2VydHMgZXJyb3IgaXMgRSB7XG4gIGNvbnN0IG1zZ1ByZWZpeCA9IG1zZyA/IGAke21zZ306IGAgOiBcIlwiO1xuICBpZiAoIShlcnJvciBpbnN0YW5jZW9mIEVycm9yKSkge1xuICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihcbiAgICAgIGAke21zZ1ByZWZpeH1FeHBlY3RlZCBcImVycm9yXCIgdG8gYmUgYW4gRXJyb3Igb2JqZWN0LmAsXG4gICAgKTtcbiAgfVxuICBpZiAoRXJyb3JDbGFzcyAmJiAhKGVycm9yIGluc3RhbmNlb2YgRXJyb3JDbGFzcykpIHtcbiAgICBtc2cgPVxuICAgICAgYCR7bXNnUHJlZml4fUV4cGVjdGVkIGVycm9yIHRvIGJlIGluc3RhbmNlIG9mIFwiJHtFcnJvckNsYXNzLm5hbWV9XCIsIGJ1dCB3YXMgXCIke2Vycm9yPy5jb25zdHJ1Y3Rvcj8ubmFtZX1cIi5gO1xuICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihtc2cpO1xuICB9XG4gIGxldCBtc2dDaGVjaztcbiAgaWYgKHR5cGVvZiBtc2dNYXRjaGVzID09PSBcInN0cmluZ1wiKSB7XG4gICAgbXNnQ2hlY2sgPSBzdHJpcEFuc2lDb2RlKGVycm9yLm1lc3NhZ2UpLmluY2x1ZGVzKFxuICAgICAgc3RyaXBBbnNpQ29kZShtc2dNYXRjaGVzKSxcbiAgICApO1xuICB9XG4gIGlmIChtc2dNYXRjaGVzIGluc3RhbmNlb2YgUmVnRXhwKSB7XG4gICAgbXNnQ2hlY2sgPSBtc2dNYXRjaGVzLnRlc3Qoc3RyaXBBbnNpQ29kZShlcnJvci5tZXNzYWdlKSk7XG4gIH1cblxuICBpZiAobXNnTWF0Y2hlcyAmJiAhbXNnQ2hlY2spIHtcbiAgICBtc2cgPSBgJHttc2dQcmVmaXh9RXhwZWN0ZWQgZXJyb3IgbWVzc2FnZSB0byBpbmNsdWRlICR7XG4gICAgICBtc2dNYXRjaGVzIGluc3RhbmNlb2YgUmVnRXhwXG4gICAgICAgID8gbXNnTWF0Y2hlcy50b1N0cmluZygpXG4gICAgICAgIDogSlNPTi5zdHJpbmdpZnkobXNnTWF0Y2hlcylcbiAgICB9LCBidXQgZ290ICR7SlNPTi5zdHJpbmdpZnkoZXJyb3I/Lm1lc3NhZ2UpfS5gO1xuICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihtc2cpO1xuICB9XG59XG4iLCAiLy8gQ29weXJpZ2h0IDIwMTgtMjAyNSB0aGUgRGVubyBhdXRob3JzLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cbmltcG9ydCB7IEFzc2VydGlvbkVycm9yIH0gZnJvbSBcIi4vYXNzZXJ0aW9uX2Vycm9yLnRzXCI7XG5cbi8qKiBBc3NlcnRpb24gY29uZGl0aW9uIGZvciB7QGxpbmtjb2RlIGFzc2VydEZhbHNlfS4gKi9cbmV4cG9ydCB0eXBlIEZhbHN5ID0gZmFsc2UgfCAwIHwgMG4gfCBcIlwiIHwgbnVsbCB8IHVuZGVmaW5lZDtcblxuLyoqXG4gKiBNYWtlIGFuIGFzc2VydGlvbiwgZXJyb3Igd2lsbCBiZSB0aHJvd24gaWYgYGV4cHJgIGhhdmUgdHJ1dGh5IHZhbHVlLlxuICpcbiAqIEBleGFtcGxlIFVzYWdlXG4gKiBgYGB0cyBpZ25vcmVcbiAqIGltcG9ydCB7IGFzc2VydEZhbHNlIH0gZnJvbSBcIkBzdGQvYXNzZXJ0XCI7XG4gKlxuICogYXNzZXJ0RmFsc2UoZmFsc2UpOyAvLyBEb2Vzbid0IHRocm93XG4gKiBhc3NlcnRGYWxzZSh0cnVlKTsgLy8gVGhyb3dzXG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0gZXhwciBUaGUgZXhwcmVzc2lvbiB0byB0ZXN0LlxuICogQHBhcmFtIG1zZyBUaGUgb3B0aW9uYWwgbWVzc2FnZSB0byBkaXNwbGF5IGlmIHRoZSBhc3NlcnRpb24gZmFpbHMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRGYWxzZShleHByOiB1bmtub3duLCBtc2cgPSBcIlwiKTogYXNzZXJ0cyBleHByIGlzIEZhbHN5IHtcbiAgaWYgKGV4cHIpIHtcbiAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IobXNnKTtcbiAgfVxufVxuIiwgIi8vIENvcHlyaWdodCAyMDE4LTIwMjUgdGhlIERlbm8gYXV0aG9ycy4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5pbXBvcnQgeyBhc3NlcnRGYWxzZSB9IGZyb20gXCIuL2ZhbHNlLnRzXCI7XG5cbi8qKlxuICogTWFrZSBhbiBhc3NlcnRpb24gdGhhdCBgb2JqYCBpcyBub3QgYW4gaW5zdGFuY2Ugb2YgYHR5cGVgLlxuICogSWYgc28sIHRoZW4gdGhyb3cuXG4gKlxuICogQGV4YW1wbGUgVXNhZ2VcbiAqIGBgYHRzIGlnbm9yZVxuICogaW1wb3J0IHsgYXNzZXJ0Tm90SW5zdGFuY2VPZiB9IGZyb20gXCJAc3RkL2Fzc2VydFwiO1xuICpcbiAqIGFzc2VydE5vdEluc3RhbmNlT2YobmV3IERhdGUoKSwgTnVtYmVyKTsgLy8gRG9lc24ndCB0aHJvd1xuICogYXNzZXJ0Tm90SW5zdGFuY2VPZihuZXcgRGF0ZSgpLCBEYXRlKTsgLy8gVGhyb3dzXG4gKiBgYGBcbiAqXG4gKiBAdHlwZVBhcmFtIEEgVGhlIHR5cGUgb2YgdGhlIG9iamVjdCB0byBjaGVjay5cbiAqIEB0eXBlUGFyYW0gVCBUaGUgdHlwZSBvZiB0aGUgY2xhc3MgdG8gY2hlY2sgYWdhaW5zdC5cbiAqIEBwYXJhbSBhY3R1YWwgVGhlIG9iamVjdCB0byBjaGVjay5cbiAqIEBwYXJhbSB1bmV4cGVjdGVkVHlwZSBUaGUgY2xhc3MgY29uc3RydWN0b3IgdG8gY2hlY2sgYWdhaW5zdC5cbiAqIEBwYXJhbSBtc2cgVGhlIG9wdGlvbmFsIG1lc3NhZ2UgdG8gZGlzcGxheSBpZiB0aGUgYXNzZXJ0aW9uIGZhaWxzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0Tm90SW5zdGFuY2VPZjxBLCBUPihcbiAgYWN0dWFsOiBBLFxuICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICB1bmV4cGVjdGVkVHlwZTogYWJzdHJhY3QgbmV3ICguLi5hcmdzOiBhbnlbXSkgPT4gVCxcbiAgbXNnPzogc3RyaW5nLFxuKTogYXNzZXJ0cyBhY3R1YWwgaXMgRXhjbHVkZTxBLCBUPiB7XG4gIGNvbnN0IG1zZ1N1ZmZpeCA9IG1zZyA/IGA6ICR7bXNnfWAgOiBcIi5cIjtcbiAgbXNnID1cbiAgICBgRXhwZWN0ZWQgb2JqZWN0IHRvIG5vdCBiZSBhbiBpbnN0YW5jZSBvZiBcIiR7dHlwZW9mIHVuZXhwZWN0ZWRUeXBlfVwiJHttc2dTdWZmaXh9YDtcbiAgYXNzZXJ0RmFsc2UoYWN0dWFsIGluc3RhbmNlb2YgdW5leHBlY3RlZFR5cGUsIG1zZyk7XG59XG4iLCAiLy8gQ29weXJpZ2h0IDIwMTgtMjAyNSB0aGUgRGVubyBhdXRob3JzLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cbmltcG9ydCB7IEFzc2VydGlvbkVycm9yIH0gZnJvbSBcIi4vYXNzZXJ0aW9uX2Vycm9yLnRzXCI7XG5cbi8qKlxuICogTWFrZSBhbiBhc3NlcnRpb24gdGhhdCBgYWN0dWFsYCBtYXRjaCBSZWdFeHAgYGV4cGVjdGVkYC4gSWYgbm90XG4gKiB0aGVuIHRocm93LlxuICpcbiAqIEBleGFtcGxlIFVzYWdlXG4gKiBgYGB0cyBpZ25vcmVcbiAqIGltcG9ydCB7IGFzc2VydE1hdGNoIH0gZnJvbSBcIkBzdGQvYXNzZXJ0XCI7XG4gKlxuICogYXNzZXJ0TWF0Y2goXCJSYXB0b3JcIiwgL1JhcHRvci8pOyAvLyBEb2Vzbid0IHRocm93XG4gKiBhc3NlcnRNYXRjaChcIkRlbm9zYXVydXNcIiwgL1JhcHRvci8pOyAvLyBUaHJvd3NcbiAqIGBgYFxuICpcbiAqIEBwYXJhbSBhY3R1YWwgVGhlIGFjdHVhbCB2YWx1ZSB0byBiZSBtYXRjaGVkLlxuICogQHBhcmFtIGV4cGVjdGVkIFRoZSBleHBlY3RlZCBwYXR0ZXJuIHRvIG1hdGNoLlxuICogQHBhcmFtIG1zZyBUaGUgb3B0aW9uYWwgbWVzc2FnZSB0byBkaXNwbGF5IGlmIHRoZSBhc3NlcnRpb24gZmFpbHMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRNYXRjaChcbiAgYWN0dWFsOiBzdHJpbmcsXG4gIGV4cGVjdGVkOiBSZWdFeHAsXG4gIG1zZz86IHN0cmluZyxcbikge1xuICBpZiAoZXhwZWN0ZWQudGVzdChhY3R1YWwpKSByZXR1cm47XG4gIGNvbnN0IG1zZ1N1ZmZpeCA9IG1zZyA/IGA6ICR7bXNnfWAgOiBcIi5cIjtcbiAgbXNnID0gYEV4cGVjdGVkIGFjdHVhbDogXCIke2FjdHVhbH1cIiB0byBtYXRjaDogXCIke2V4cGVjdGVkfVwiJHttc2dTdWZmaXh9YDtcbiAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKG1zZyk7XG59XG4iLCAiLy8gQ29weXJpZ2h0IDIwMTgtMjAyNSB0aGUgRGVubyBhdXRob3JzLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cbmltcG9ydCB7IEFzc2VydGlvbkVycm9yIH0gZnJvbSBcIi4vYXNzZXJ0aW9uX2Vycm9yLnRzXCI7XG5cbi8qKlxuICogTWFrZSBhbiBhc3NlcnRpb24gdGhhdCBgYWN0dWFsYCBub3QgbWF0Y2ggUmVnRXhwIGBleHBlY3RlZGAuIElmIG1hdGNoXG4gKiB0aGVuIHRocm93LlxuICpcbiAqIEBleGFtcGxlIFVzYWdlXG4gKiBgYGB0cyBpZ25vcmVcbiAqIGltcG9ydCB7IGFzc2VydE5vdE1hdGNoIH0gZnJvbSBcIkBzdGQvYXNzZXJ0XCI7XG4gKlxuICogYXNzZXJ0Tm90TWF0Y2goXCJEZW5vc2F1cnVzXCIsIC9SYXB0b3IvKTsgLy8gRG9lc24ndCB0aHJvd1xuICogYXNzZXJ0Tm90TWF0Y2goXCJSYXB0b3JcIiwgL1JhcHRvci8pOyAvLyBUaHJvd3NcbiAqIGBgYFxuICpcbiAqIEBwYXJhbSBhY3R1YWwgVGhlIGFjdHVhbCB2YWx1ZSB0byBtYXRjaC5cbiAqIEBwYXJhbSBleHBlY3RlZCBUaGUgZXhwZWN0ZWQgdmFsdWUgdG8gbm90IG1hdGNoLlxuICogQHBhcmFtIG1zZyBUaGUgb3B0aW9uYWwgbWVzc2FnZSB0byBkaXNwbGF5IGlmIHRoZSBhc3NlcnRpb24gZmFpbHMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnROb3RNYXRjaChcbiAgYWN0dWFsOiBzdHJpbmcsXG4gIGV4cGVjdGVkOiBSZWdFeHAsXG4gIG1zZz86IHN0cmluZyxcbikge1xuICBpZiAoIWV4cGVjdGVkLnRlc3QoYWN0dWFsKSkgcmV0dXJuO1xuICBjb25zdCBtc2dTdWZmaXggPSBtc2cgPyBgOiAke21zZ31gIDogXCIuXCI7XG4gIG1zZyA9IGBFeHBlY3RlZCBhY3R1YWw6IFwiJHthY3R1YWx9XCIgdG8gbm90IG1hdGNoOiBcIiR7ZXhwZWN0ZWR9XCIke21zZ1N1ZmZpeH1gO1xuICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IobXNnKTtcbn1cbiIsICIvLyBDb3B5cmlnaHQgMjAxOC0yMDI1IHRoZSBEZW5vIGF1dGhvcnMuIE1JVCBsaWNlbnNlLlxuXG5pbXBvcnQgeyBidWlsZE1lc3NhZ2UgfSBmcm9tIFwianNyOkBzdGQvaW50ZXJuYWxAXjEuMC4xMC9idWlsZC1tZXNzYWdlXCI7XG5pbXBvcnQgeyBkaWZmIH0gZnJvbSBcImpzcjpAc3RkL2ludGVybmFsQF4xLjAuMTAvZGlmZlwiO1xuaW1wb3J0IHsgZGlmZlN0ciB9IGZyb20gXCJqc3I6QHN0ZC9pbnRlcm5hbEBeMS4wLjEwL2RpZmYtc3RyXCI7XG5pbXBvcnQgeyBmb3JtYXQgfSBmcm9tIFwianNyOkBzdGQvaW50ZXJuYWxAXjEuMC4xMC9mb3JtYXRcIjtcbmltcG9ydCB0eXBlIHsgRXF1YWxPcHRpb25zIH0gZnJvbSBcIi4vX3R5cGVzLnRzXCI7XG5cbnR5cGUgRXF1YWxFcnJvck1lc3NhZ2VPcHRpb25zID0gUGljazxcbiAgRXF1YWxPcHRpb25zLFxuICBcImZvcm1hdHRlclwiIHwgXCJtc2dcIlxuPjtcblxuZnVuY3Rpb24gaXNTdHJpbmcodmFsdWU6IHVua25vd24pOiB2YWx1ZSBpcyBzdHJpbmcge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSBcInN0cmluZ1wiO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRFcXVhbEVycm9yTWVzc2FnZTxUPihcbiAgYWN0dWFsOiBULFxuICBleHBlY3RlZDogVCxcbiAgb3B0aW9uczogRXF1YWxFcnJvck1lc3NhZ2VPcHRpb25zID0ge30sXG4pOiBzdHJpbmcge1xuICBjb25zdCB7IGZvcm1hdHRlciA9IGZvcm1hdCwgbXNnIH0gPSBvcHRpb25zO1xuICBjb25zdCBtc2dQcmVmaXggPSBtc2cgPyBgJHttc2d9OiBgIDogXCJcIjtcbiAgY29uc3QgYWN0dWFsU3RyaW5nID0gZm9ybWF0dGVyKGFjdHVhbCk7XG4gIGNvbnN0IGV4cGVjdGVkU3RyaW5nID0gZm9ybWF0dGVyKGV4cGVjdGVkKTtcblxuICBsZXQgbWVzc2FnZSA9IGAke21zZ1ByZWZpeH1WYWx1ZXMgYXJlIG5vdCBlcXVhbC5gO1xuXG4gIGNvbnN0IHN0cmluZ0RpZmYgPSBpc1N0cmluZyhhY3R1YWwpICYmIGlzU3RyaW5nKGV4cGVjdGVkKTtcbiAgY29uc3QgZGlmZlJlc3VsdCA9IHN0cmluZ0RpZmZcbiAgICA/IGRpZmZTdHIoYWN0dWFsLCBleHBlY3RlZClcbiAgICA6IGRpZmYoYWN0dWFsU3RyaW5nLnNwbGl0KFwiXFxuXCIpLCBleHBlY3RlZFN0cmluZy5zcGxpdChcIlxcblwiKSk7XG4gIGNvbnN0IGRpZmZNc2cgPSBidWlsZE1lc3NhZ2UoZGlmZlJlc3VsdCwgeyBzdHJpbmdEaWZmIH0pLmpvaW4oXCJcXG5cIik7XG4gIG1lc3NhZ2UgPSBgJHttZXNzYWdlfVxcbiR7ZGlmZk1zZ31gO1xuXG4gIHJldHVybiBtZXNzYWdlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYnVpbGROb3RFcXVhbEVycm9yTWVzc2FnZTxUPihcbiAgYWN0dWFsOiBULFxuICBleHBlY3RlZDogVCxcbiAgb3B0aW9uczogRXF1YWxFcnJvck1lc3NhZ2VPcHRpb25zID0ge30sXG4pOiBzdHJpbmcge1xuICBjb25zdCB7IGZvcm1hdHRlciA9IGZvcm1hdCwgbXNnIH0gPSBvcHRpb25zO1xuICBjb25zdCBhY3R1YWxTdHJpbmcgPSBmb3JtYXR0ZXIoYWN0dWFsKTtcbiAgY29uc3QgZXhwZWN0ZWRTdHJpbmcgPSBmb3JtYXR0ZXIoZXhwZWN0ZWQpO1xuXG4gIGNvbnN0IG1zZ1ByZWZpeCA9IG1zZyA/IGAke21zZ306IGAgOiBcIlwiO1xuICByZXR1cm4gYCR7bXNnUHJlZml4fUV4cGVjdGVkIGFjdHVhbDogJHthY3R1YWxTdHJpbmd9IG5vdCB0byBiZTogJHtleHBlY3RlZFN0cmluZ30uYDtcbn1cbiIsICIvLyBDb3B5cmlnaHQgMjAxOC0yMDI1IHRoZSBEZW5vIGF1dGhvcnMuIE1JVCBsaWNlbnNlLlxuXG4vLyBUaGlzIGZpbGUgaXMgY29waWVkIGZyb20gYHN0ZC9hc3NlcnRgLlxuXG5pbXBvcnQgeyBBc3NlcnRpb25FcnJvciB9IGZyb20gXCJqc3I6QHN0ZC9hc3NlcnRAXjEuMC4xNC9hc3NlcnRpb24tZXJyb3JcIjtcbmltcG9ydCB7IGJ1aWxkRXF1YWxFcnJvck1lc3NhZ2UgfSBmcm9tIFwiLi9fYnVpbGRfbWVzc2FnZS50c1wiO1xuaW1wb3J0IHsgZXF1YWwgfSBmcm9tIFwiLi9fZXF1YWwudHNcIjtcbmltcG9ydCB0eXBlIHsgRXF1YWxPcHRpb25zIH0gZnJvbSBcIi4vX3R5cGVzLnRzXCI7XG5cbi8qKlxuICogTWFrZSBhbiBhc3NlcnRpb24gdGhhdCBgYWN0dWFsYCBhbmQgYGV4cGVjdGVkYCBhcmUgZXF1YWwsIGRlZXBseS4gSWYgbm90XG4gKiBkZWVwbHkgZXF1YWwsIHRoZW4gdGhyb3cuXG4gKlxuICogVHlwZSBwYXJhbWV0ZXIgY2FuIGJlIHNwZWNpZmllZCB0byBlbnN1cmUgdmFsdWVzIHVuZGVyIGNvbXBhcmlzb24gaGF2ZSB0aGVcbiAqIHNhbWUgdHlwZS5cbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHMgaWdub3JlXG4gKiBpbXBvcnQgeyBhc3NlcnRFcXVhbHMgfSBmcm9tIFwiQHN0ZC9hc3NlcnRcIjtcbiAqXG4gKiBhc3NlcnRFcXVhbHMoXCJ3b3JsZFwiLCBcIndvcmxkXCIpOyAvLyBEb2Vzbid0IHRocm93XG4gKiBhc3NlcnRFcXVhbHMoXCJoZWxsb1wiLCBcIndvcmxkXCIpOyAvLyBUaHJvd3NcbiAqIGBgYFxuICpcbiAqIE5vdGU6IGZvcm1hdHRlciBvcHRpb24gaXMgZXhwZXJpbWVudGFsIGFuZCBtYXkgYmUgcmVtb3ZlZCBpbiB0aGUgZnV0dXJlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0RXF1YWxzPFQ+KFxuICBhY3R1YWw6IFQsXG4gIGV4cGVjdGVkOiBULFxuICBvcHRpb25zPzogRXF1YWxPcHRpb25zLFxuKSB7XG4gIGlmIChlcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBvcHRpb25zKSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IG1lc3NhZ2UgPSBidWlsZEVxdWFsRXJyb3JNZXNzYWdlKGFjdHVhbCwgZXhwZWN0ZWQsIG9wdGlvbnMgPz8ge30pO1xuICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IobWVzc2FnZSk7XG59XG4iLCAiLy8gQ29weXJpZ2h0IDIwMTgtMjAyNSB0aGUgRGVubyBhdXRob3JzLiBNSVQgbGljZW5zZS5cblxuLy8gVGhpcyBmaWxlIGlzIGNvcGllZCBmcm9tIGBzdGQvYXNzZXJ0YC5cblxuaW1wb3J0IHsgQXNzZXJ0aW9uRXJyb3IgfSBmcm9tIFwianNyOkBzdGQvYXNzZXJ0QF4xLjAuMTQvYXNzZXJ0aW9uLWVycm9yXCI7XG5pbXBvcnQgeyBidWlsZE5vdEVxdWFsRXJyb3JNZXNzYWdlIH0gZnJvbSBcIi4vX2J1aWxkX21lc3NhZ2UudHNcIjtcbmltcG9ydCB7IGVxdWFsIH0gZnJvbSBcIi4vX2VxdWFsLnRzXCI7XG5pbXBvcnQgdHlwZSB7IEVxdWFsT3B0aW9ucyB9IGZyb20gXCIuL190eXBlcy50c1wiO1xuXG4vKipcbiAqIE1ha2UgYW4gYXNzZXJ0aW9uIHRoYXQgYGFjdHVhbGAgYW5kIGBleHBlY3RlZGAgYXJlIG5vdCBlcXVhbCwgZGVlcGx5LlxuICogSWYgbm90IHRoZW4gdGhyb3cuXG4gKlxuICogVHlwZSBwYXJhbWV0ZXIgY2FuIGJlIHNwZWNpZmllZCB0byBlbnN1cmUgdmFsdWVzIHVuZGVyIGNvbXBhcmlzb24gaGF2ZSB0aGUgc2FtZSB0eXBlLlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0cyBpZ25vcmVcbiAqIGltcG9ydCB7IGFzc2VydE5vdEVxdWFscyB9IGZyb20gXCJAc3RkL2Fzc2VydFwiO1xuICpcbiAqIGFzc2VydE5vdEVxdWFscygxLCAyKTsgLy8gRG9lc24ndCB0aHJvd1xuICogYXNzZXJ0Tm90RXF1YWxzKDEsIDEpOyAvLyBUaHJvd3NcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0Tm90RXF1YWxzPFQ+KFxuICBhY3R1YWw6IFQsXG4gIGV4cGVjdGVkOiBULFxuICBvcHRpb25zOiBFcXVhbE9wdGlvbnMgPSB7fSxcbikge1xuICBpZiAoIWVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG9wdGlvbnMpKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgbWVzc2FnZSA9IGJ1aWxkTm90RXF1YWxFcnJvck1lc3NhZ2UoYWN0dWFsLCBleHBlY3RlZCwgb3B0aW9ucyA/PyB7fSk7XG4gIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihtZXNzYWdlKTtcbn1cbiIsICIvLyBDb3B5cmlnaHQgMjAxOC0yMDI1IHRoZSBEZW5vIGF1dGhvcnMuIE1JVCBsaWNlbnNlLlxuLy8gZGVuby1saW50LWlnbm9yZS1maWxlIG5vLWV4cGxpY2l0LWFueVxuXG5leHBvcnQgY29uc3QgTU9DS19TWU1CT0wgPSBTeW1ib2wuZm9yKFwiQE1PQ0tcIik7XG5cbmV4cG9ydCB0eXBlIE1vY2tDYWxsID0ge1xuICBhcmdzOiBhbnlbXTtcbiAgcmV0dXJuZWQ/OiBhbnk7XG4gIHRocm93bj86IGFueTtcbiAgdGltZXN0YW1wOiBudW1iZXI7XG4gIHJldHVybnM6IGJvb2xlYW47XG4gIHRocm93czogYm9vbGVhbjtcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRNb2NrQ2FsbHMoZjogYW55KTogTW9ja0NhbGxbXSB7XG4gIGNvbnN0IG1vY2tJbmZvID0gZltNT0NLX1NZTUJPTF07XG4gIGlmICghbW9ja0luZm8pIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJSZWNlaXZlZCBmdW5jdGlvbiBtdXN0IGJlIGEgbW9jayBvciBzcHkgZnVuY3Rpb25cIik7XG4gIH1cblxuICByZXR1cm4gWy4uLm1vY2tJbmZvLmNhbGxzXTtcbn1cbiIsICIvLyBDb3B5cmlnaHQgMjAxOC0yMDI1IHRoZSBEZW5vIGF1dGhvcnMuIE1JVCBsaWNlbnNlLlxuLy8gZGVuby1saW50LWlnbm9yZS1maWxlXG5cbmV4cG9ydCBmdW5jdGlvbiBpbnNwZWN0QXJncyhhcmdzOiB1bmtub3duW10pOiBzdHJpbmcge1xuICByZXR1cm4gYXJncy5tYXAoaW5zcGVjdEFyZykuam9pbihcIiwgXCIpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaW5zcGVjdEFyZyhhcmc6IHVua25vd24pOiBzdHJpbmcge1xuICBjb25zdCB7IERlbm8gfSA9IGdsb2JhbFRoaXMgYXMgYW55O1xuICByZXR1cm4gdHlwZW9mIERlbm8gIT09IFwidW5kZWZpbmVkXCIgJiYgRGVuby5pbnNwZWN0XG4gICAgPyBEZW5vLmluc3BlY3QoYXJnKVxuICAgIDogU3RyaW5nKGFyZyk7XG59XG4iLCAiLy8gQ29weXJpZ2h0IDIwMTgtMjAyNSB0aGUgRGVubyBhdXRob3JzLiBNSVQgbGljZW5zZS5cbi8vIENvcHlyaWdodCAoYykgTWV0YSBQbGF0Zm9ybXMsIEluYy4gYW5kIGFmZmlsaWF0ZXMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuXG5pbXBvcnQgdHlwZSB7IEVxdWFsT3B0aW9ucywgRXF1YWxPcHRpb25VdGlsIH0gZnJvbSBcIi4vX3R5cGVzLnRzXCI7XG5pbXBvcnQgdHlwZSB7IFRlc3RlciB9IGZyb20gXCIuL190eXBlcy50c1wiO1xuaW1wb3J0IHsgZXF1YWwgfSBmcm9tIFwiLi9fZXF1YWwudHNcIjtcblxuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkRXF1YWxPcHRpb25zKG9wdGlvbnM6IEVxdWFsT3B0aW9uVXRpbCk6IEVxdWFsT3B0aW9ucyB7XG4gIGNvbnN0IHsgY3VzdG9tTWVzc2FnZSwgY3VzdG9tVGVzdGVycyA9IFtdLCBzdHJpY3RDaGVjayB9ID0gb3B0aW9ucyA/PyB7fTtcbiAgY29uc3QgcmV0OiBFcXVhbE9wdGlvbnMgPSB7XG4gICAgY3VzdG9tVGVzdGVycyxcbiAgfTtcbiAgaWYgKGN1c3RvbU1lc3NhZ2UgIT09IHVuZGVmaW5lZCkge1xuICAgIHJldC5tc2cgPSBjdXN0b21NZXNzYWdlO1xuICB9XG4gIGlmIChzdHJpY3RDaGVjayAhPT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0LnN0cmljdENoZWNrID0gc3RyaWN0Q2hlY2s7XG4gIH1cbiAgcmV0dXJuIHJldDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzUHJvbWlzZUxpa2UodmFsdWU6IHVua25vd24pOiB2YWx1ZSBpcyBQcm9taXNlTGlrZTx1bmtub3duPiB7XG4gIGlmICh2YWx1ZSA9PSBudWxsKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiB0eXBlb2YgKCh2YWx1ZSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPikudGhlbikgPT09IFwiZnVuY3Rpb25cIjtcbiAgfVxufVxuXG4vLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuZXhwb3J0IGZ1bmN0aW9uIGhhc0l0ZXJhdG9yKG9iamVjdDogYW55KSB7XG4gIHJldHVybiAhIShvYmplY3QgIT0gbnVsbCAmJiBvYmplY3RbU3ltYm9sLml0ZXJhdG9yXSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0E8VD4odHlwZU5hbWU6IHN0cmluZywgdmFsdWU6IHVua25vd24pOiB2YWx1ZSBpcyBUIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuYXBwbHkodmFsdWUpID09PSBgW29iamVjdCAke3R5cGVOYW1lfV1gO1xufVxuXG5mdW5jdGlvbiBpc09iamVjdChhOiB1bmtub3duKSB7XG4gIHJldHVybiBhICE9PSBudWxsICYmIHR5cGVvZiBhID09PSBcIm9iamVjdFwiO1xufVxuXG5mdW5jdGlvbiBpc09iamVjdFdpdGhLZXlzKGE6IHVua25vd24pIHtcbiAgcmV0dXJuIChcbiAgICBpc09iamVjdChhKSAmJlxuICAgICEoYSBpbnN0YW5jZW9mIEVycm9yKSAmJlxuICAgICFBcnJheS5pc0FycmF5KGEpICYmXG4gICAgIShhIGluc3RhbmNlb2YgRGF0ZSkgJiZcbiAgICAhKGEgaW5zdGFuY2VvZiBTZXQpICYmXG4gICAgIShhIGluc3RhbmNlb2YgTWFwKVxuICApO1xufVxuXG5mdW5jdGlvbiBnZXRPYmplY3RLZXlzKG9iamVjdDogb2JqZWN0KTogQXJyYXk8c3RyaW5nIHwgc3ltYm9sPiB7XG4gIHJldHVybiBbXG4gICAgLi4uT2JqZWN0LmtleXMob2JqZWN0KSxcbiAgICAuLi5PYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKG9iamVjdCkuZmlsdGVyKFxuICAgICAgKHMpID0+IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3Iob2JqZWN0LCBzKT8uZW51bWVyYWJsZSxcbiAgICApLFxuICBdO1xufVxuXG5mdW5jdGlvbiBoYXNQcm9wZXJ0eUluT2JqZWN0KG9iamVjdDogb2JqZWN0LCBrZXk6IHN0cmluZyB8IHN5bWJvbCk6IGJvb2xlYW4ge1xuICBjb25zdCBzaG91bGRUZXJtaW5hdGUgPSAhb2JqZWN0IHx8IHR5cGVvZiBvYmplY3QgIT09IFwib2JqZWN0XCIgfHxcbiAgICBvYmplY3QgPT09IE9iamVjdC5wcm90b3R5cGU7XG5cbiAgaWYgKHNob3VsZFRlcm1pbmF0ZSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHJldHVybiAoXG4gICAgT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iamVjdCwga2V5KSB8fFxuICAgIGhhc1Byb3BlcnR5SW5PYmplY3QoT2JqZWN0LmdldFByb3RvdHlwZU9mKG9iamVjdCksIGtleSlcbiAgKTtcbn1cblxuLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbmZ1bmN0aW9uIGVudHJpZXMob2JqOiBhbnkpIHtcbiAgaWYgKCFpc09iamVjdChvYmopKSByZXR1cm4gW107XG5cbiAgcmV0dXJuIE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMob2JqKVxuICAgIC5maWx0ZXIoKGtleSkgPT4ga2V5ICE9PSBTeW1ib2wuaXRlcmF0b3IpXG4gICAgLm1hcCgoa2V5KSA9PiBba2V5LCBvYmpba2V5IGFzIGtleW9mIHR5cGVvZiBvYmpdXSlcbiAgICAuY29uY2F0KE9iamVjdC5lbnRyaWVzKG9iaikpO1xufVxuXG4vLyBQb3J0ZWQgZnJvbSBodHRwczovL2dpdGh1Yi5jb20vamVzdGpzL2plc3QvYmxvYi80NDJjN2Y2OTJlM2E5MmYxNGEyZmI1NmMxNzM3YjI2ZmM2NjNhMGVmL3BhY2thZ2VzL2V4cGVjdC11dGlscy9zcmMvdXRpbHMudHMjTDE3M1xuZXhwb3J0IGZ1bmN0aW9uIGl0ZXJhYmxlRXF1YWxpdHkoXG4gIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gIGE6IGFueSxcbiAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgYjogYW55LFxuICBjdXN0b21UZXN0ZXJzOiBUZXN0ZXJbXSA9IFtdLFxuICBhU3RhY2s6IHVua25vd25bXSA9IFtdLFxuICBiU3RhY2s6IHVua25vd25bXSA9IFtdLFxuKTogYm9vbGVhbiB8IHVuZGVmaW5lZCB7XG4gIGlmIChcbiAgICB0eXBlb2YgYSAhPT0gXCJvYmplY3RcIiB8fFxuICAgIHR5cGVvZiBiICE9PSBcIm9iamVjdFwiIHx8XG4gICAgQXJyYXkuaXNBcnJheShhKSB8fFxuICAgIEFycmF5LmlzQXJyYXkoYikgfHxcbiAgICAhaGFzSXRlcmF0b3IoYSkgfHxcbiAgICAhaGFzSXRlcmF0b3IoYilcbiAgKSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuICBpZiAoYS5jb25zdHJ1Y3RvciAhPT0gYi5jb25zdHJ1Y3Rvcikge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBsZXQgbGVuZ3RoID0gYVN0YWNrLmxlbmd0aDtcbiAgd2hpbGUgKGxlbmd0aC0tKSB7XG4gICAgLy8gTGluZWFyIHNlYXJjaC4gUGVyZm9ybWFuY2UgaXMgaW52ZXJzZWx5IHByb3BvcnRpb25hbCB0byB0aGUgbnVtYmVyIG9mXG4gICAgLy8gdW5pcXVlIG5lc3RlZCBzdHJ1Y3R1cmVzLlxuICAgIC8vIGNpcmN1bGFyIHJlZmVyZW5jZXMgYXQgc2FtZSBkZXB0aCBhcmUgZXF1YWxcbiAgICAvLyBjaXJjdWxhciByZWZlcmVuY2UgaXMgbm90IGVxdWFsIHRvIG5vbi1jaXJjdWxhciBvbmVcbiAgICBpZiAoYVN0YWNrW2xlbmd0aF0gPT09IGEpIHtcbiAgICAgIHJldHVybiBiU3RhY2tbbGVuZ3RoXSA9PT0gYjtcbiAgICB9XG4gIH1cbiAgYVN0YWNrLnB1c2goYSk7XG4gIGJTdGFjay5wdXNoKGIpO1xuXG4gIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gIGNvbnN0IGl0ZXJhYmxlRXF1YWxpdHlXaXRoU3RhY2sgPSAoYTogYW55LCBiOiBhbnkpID0+XG4gICAgaXRlcmFibGVFcXVhbGl0eShcbiAgICAgIGEsXG4gICAgICBiLFxuICAgICAgWy4uLmZpbHRlcmVkQ3VzdG9tVGVzdGVyc10sXG4gICAgICBbLi4uYVN0YWNrXSxcbiAgICAgIFsuLi5iU3RhY2tdLFxuICAgICk7XG5cbiAgLy8gUmVwbGFjZSBhbnkgaW5zdGFuY2Ugb2YgaXRlcmFibGVFcXVhbGl0eSB3aXRoIHRoZSBuZXdcbiAgLy8gaXRlcmFibGVFcXVhbGl0eVdpdGhTdGFjayBzbyB3ZSBjYW4gZG8gY2lyY3VsYXIgZGV0ZWN0aW9uXG4gIGNvbnN0IGZpbHRlcmVkQ3VzdG9tVGVzdGVyczogVGVzdGVyW10gPSBbXG4gICAgLi4uY3VzdG9tVGVzdGVycy5maWx0ZXIoKHQpID0+IHQgIT09IGl0ZXJhYmxlRXF1YWxpdHkpLFxuICAgIGl0ZXJhYmxlRXF1YWxpdHlXaXRoU3RhY2ssXG4gIF07XG5cbiAgaWYgKGEuc2l6ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgaWYgKGEuc2l6ZSAhPT0gYi5zaXplKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSBlbHNlIGlmIChpc0E8U2V0PHVua25vd24+PihcIlNldFwiLCBhKSkge1xuICAgICAgbGV0IGFsbEZvdW5kID0gdHJ1ZTtcbiAgICAgIGZvciAoY29uc3QgYVZhbHVlIG9mIGEpIHtcbiAgICAgICAgaWYgKCFiLmhhcyhhVmFsdWUpKSB7XG4gICAgICAgICAgbGV0IGhhcyA9IGZhbHNlO1xuICAgICAgICAgIGZvciAoY29uc3QgYlZhbHVlIG9mIGIpIHtcbiAgICAgICAgICAgIGNvbnN0IGlzRXF1YWwgPSBlcXVhbChhVmFsdWUsIGJWYWx1ZSwge1xuICAgICAgICAgICAgICBjdXN0b21UZXN0ZXJzOiBmaWx0ZXJlZEN1c3RvbVRlc3RlcnMsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmIChpc0VxdWFsID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgIGhhcyA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGhhcyA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgIGFsbEZvdW5kID0gZmFsc2U7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8vIFJlbW92ZSB0aGUgZmlyc3QgdmFsdWUgZnJvbSB0aGUgc3RhY2sgb2YgdHJhdmVyc2VkIHZhbHVlcy5cbiAgICAgIGFTdGFjay5wb3AoKTtcbiAgICAgIGJTdGFjay5wb3AoKTtcbiAgICAgIHJldHVybiBhbGxGb3VuZDtcbiAgICB9IGVsc2UgaWYgKGlzQTxNYXA8dW5rbm93biwgdW5rbm93bj4+KFwiTWFwXCIsIGEpKSB7XG4gICAgICBsZXQgYWxsRm91bmQgPSB0cnVlO1xuICAgICAgZm9yIChjb25zdCBhRW50cnkgb2YgYSkge1xuICAgICAgICBpZiAoXG4gICAgICAgICAgIWIuaGFzKGFFbnRyeVswXSkgfHxcbiAgICAgICAgICAhZXF1YWwoYUVudHJ5WzFdLCBiLmdldChhRW50cnlbMF0pLCB7XG4gICAgICAgICAgICBjdXN0b21UZXN0ZXJzOiBmaWx0ZXJlZEN1c3RvbVRlc3RlcnMsXG4gICAgICAgICAgfSlcbiAgICAgICAgKSB7XG4gICAgICAgICAgbGV0IGhhcyA9IGZhbHNlO1xuICAgICAgICAgIGZvciAoY29uc3QgYkVudHJ5IG9mIGIpIHtcbiAgICAgICAgICAgIGNvbnN0IG1hdGNoZWRLZXkgPSBlcXVhbChcbiAgICAgICAgICAgICAgYUVudHJ5WzBdLFxuICAgICAgICAgICAgICBiRW50cnlbMF0sXG4gICAgICAgICAgICAgIHsgY3VzdG9tVGVzdGVyczogZmlsdGVyZWRDdXN0b21UZXN0ZXJzIH0sXG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICBsZXQgbWF0Y2hlZFZhbHVlID0gZmFsc2U7XG4gICAgICAgICAgICBpZiAobWF0Y2hlZEtleSA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICBtYXRjaGVkVmFsdWUgPSBlcXVhbChcbiAgICAgICAgICAgICAgICBhRW50cnlbMV0sXG4gICAgICAgICAgICAgICAgYkVudHJ5WzFdLFxuICAgICAgICAgICAgICAgIHsgY3VzdG9tVGVzdGVyczogZmlsdGVyZWRDdXN0b21UZXN0ZXJzIH0sXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAobWF0Y2hlZFZhbHVlID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgIGhhcyA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGhhcyA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgIGFsbEZvdW5kID0gZmFsc2U7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8vIFJlbW92ZSB0aGUgZmlyc3QgdmFsdWUgZnJvbSB0aGUgc3RhY2sgb2YgdHJhdmVyc2VkIHZhbHVlcy5cbiAgICAgIGFTdGFjay5wb3AoKTtcbiAgICAgIGJTdGFjay5wb3AoKTtcbiAgICAgIHJldHVybiBhbGxGb3VuZDtcbiAgICB9XG4gIH1cblxuICBjb25zdCBiSXRlcmF0b3IgPSBiW1N5bWJvbC5pdGVyYXRvcl0oKTtcblxuICBmb3IgKGNvbnN0IGFWYWx1ZSBvZiBhKSB7XG4gICAgY29uc3QgbmV4dEIgPSBiSXRlcmF0b3IubmV4dCgpO1xuICAgIGlmIChcbiAgICAgIG5leHRCLmRvbmUgfHxcbiAgICAgICFlcXVhbChhVmFsdWUsIG5leHRCLnZhbHVlLCB7IGN1c3RvbVRlc3RlcnM6IGZpbHRlcmVkQ3VzdG9tVGVzdGVycyB9KVxuICAgICkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICBpZiAoIWJJdGVyYXRvci5uZXh0KCkuZG9uZSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGNvbnN0IGFFbnRyaWVzID0gZW50cmllcyhhKTtcbiAgY29uc3QgYkVudHJpZXMgPSBlbnRyaWVzKGIpO1xuICBpZiAoIWVxdWFsKGFFbnRyaWVzLCBiRW50cmllcykpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvLyBSZW1vdmUgdGhlIGZpcnN0IHZhbHVlIGZyb20gdGhlIHN0YWNrIG9mIHRyYXZlcnNlZCB2YWx1ZXMuXG4gIGFTdGFjay5wb3AoKTtcbiAgYlN0YWNrLnBvcCgpO1xuICByZXR1cm4gdHJ1ZTtcbn1cblxuLy8gUG9ydGVkIGZyb20gaHR0cHM6Ly9naXRodWIuY29tL2plc3Rqcy9qZXN0L2Jsb2IvNDQyYzdmNjkyZTNhOTJmMTRhMmZiNTZjMTczN2IyNmZjNjYzYTBlZi9wYWNrYWdlcy9leHBlY3QtdXRpbHMvc3JjL3V0aWxzLnRzI0wzNDFcbmV4cG9ydCBmdW5jdGlvbiBzdWJzZXRFcXVhbGl0eShcbiAgb2JqZWN0OiB1bmtub3duLFxuICBzdWJzZXQ6IHVua25vd24sXG4gIGN1c3RvbVRlc3RlcnM6IFRlc3RlcltdID0gW10sXG4pOiBib29sZWFuIHwgdW5kZWZpbmVkIHtcbiAgY29uc3QgZmlsdGVyZWRDdXN0b21UZXN0ZXJzID0gY3VzdG9tVGVzdGVycy5maWx0ZXIoKHQpID0+XG4gICAgdCAhPT0gc3Vic2V0RXF1YWxpdHlcbiAgKTtcblxuICBjb25zdCBzdWJzZXRFcXVhbGl0eVdpdGhDb250ZXh0ID1cbiAgICAoc2VlblJlZmVyZW5jZXM6IFdlYWtNYXA8b2JqZWN0LCBib29sZWFuPiA9IG5ldyBXZWFrTWFwKCkpID0+XG4gICAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgICAob2JqZWN0OiBhbnksIHN1YnNldDogYW55KTogYm9vbGVhbiB8IHVuZGVmaW5lZCA9PiB7XG4gICAgICBpZiAoIWlzT2JqZWN0V2l0aEtleXMoc3Vic2V0KSkge1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgfVxuXG4gICAgICBpZiAoc2VlblJlZmVyZW5jZXMuaGFzKHN1YnNldCkpIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICBzZWVuUmVmZXJlbmNlcy5zZXQoc3Vic2V0LCB0cnVlKTtcblxuICAgICAgY29uc3QgbWF0Y2hSZXN1bHQgPSBnZXRPYmplY3RLZXlzKHN1YnNldCkuZXZlcnkoKGtleSkgPT4ge1xuICAgICAgICBpZiAoaXNPYmplY3RXaXRoS2V5cyhzdWJzZXRba2V5XSkpIHtcbiAgICAgICAgICBpZiAoc2VlblJlZmVyZW5jZXMuaGFzKHN1YnNldFtrZXldKSkge1xuICAgICAgICAgICAgcmV0dXJuIGVxdWFsKG9iamVjdFtrZXldLCBzdWJzZXRba2V5XSwge1xuICAgICAgICAgICAgICBjdXN0b21UZXN0ZXJzOiBmaWx0ZXJlZEN1c3RvbVRlc3RlcnMsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcmVzdWx0ID0gb2JqZWN0ICE9IG51bGwgJiZcbiAgICAgICAgICBoYXNQcm9wZXJ0eUluT2JqZWN0KG9iamVjdCwga2V5KSAmJlxuICAgICAgICAgIGVxdWFsKG9iamVjdFtrZXldLCBzdWJzZXRba2V5XSwge1xuICAgICAgICAgICAgY3VzdG9tVGVzdGVyczogW1xuICAgICAgICAgICAgICAuLi5maWx0ZXJlZEN1c3RvbVRlc3RlcnMsXG4gICAgICAgICAgICAgIHN1YnNldEVxdWFsaXR5V2l0aENvbnRleHQoc2VlblJlZmVyZW5jZXMpLFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgc2VlblJlZmVyZW5jZXMuZGVsZXRlKHN1YnNldFtrZXldKTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgIH0pO1xuICAgICAgc2VlblJlZmVyZW5jZXMuZGVsZXRlKHN1YnNldCk7XG5cbiAgICAgIHJldHVybiBtYXRjaFJlc3VsdDtcbiAgICB9O1xuXG4gIHJldHVybiBzdWJzZXRFcXVhbGl0eVdpdGhDb250ZXh0KCkob2JqZWN0LCBzdWJzZXQpO1xufVxuIiwgIi8vIENvcHlyaWdodCAyMDE4LTIwMjUgdGhlIERlbm8gYXV0aG9ycy4gTUlUIGxpY2Vuc2UuXG5cbmltcG9ydCB7IGFzc2VydE5vdFN0cmljdEVxdWFscyB9IGZyb20gXCJqc3I6QHN0ZC9hc3NlcnRAXjEuMC4xNC9ub3Qtc3RyaWN0LWVxdWFsc1wiO1xuaW1wb3J0IHsgYXNzZXJ0U3RyaWN0RXF1YWxzIH0gZnJvbSBcImpzcjpAc3RkL2Fzc2VydEBeMS4wLjE0L3N0cmljdC1lcXVhbHNcIjtcbmltcG9ydCB7IGFzc2VydEluc3RhbmNlT2YgfSBmcm9tIFwianNyOkBzdGQvYXNzZXJ0QF4xLjAuMTQvaW5zdGFuY2Utb2ZcIjtcbmltcG9ydCB7IGFzc2VydElzRXJyb3IgfSBmcm9tIFwiLi9fYXNzZXJ0X2lzX2Vycm9yLnRzXCI7XG5pbXBvcnQgeyBhc3NlcnROb3RJbnN0YW5jZU9mIH0gZnJvbSBcImpzcjpAc3RkL2Fzc2VydEBeMS4wLjE0L25vdC1pbnN0YW5jZS1vZlwiO1xuaW1wb3J0IHsgYXNzZXJ0TWF0Y2ggfSBmcm9tIFwianNyOkBzdGQvYXNzZXJ0QF4xLjAuMTQvbWF0Y2hcIjtcbmltcG9ydCB7IGFzc2VydE5vdE1hdGNoIH0gZnJvbSBcImpzcjpAc3RkL2Fzc2VydEBeMS4wLjE0L25vdC1tYXRjaFwiO1xuaW1wb3J0IHsgQXNzZXJ0aW9uRXJyb3IgfSBmcm9tIFwianNyOkBzdGQvYXNzZXJ0QF4xLjAuMTQvYXNzZXJ0aW9uLWVycm9yXCI7XG5cbmltcG9ydCB7IGFzc2VydEVxdWFscyB9IGZyb20gXCIuL19hc3NlcnRfZXF1YWxzLnRzXCI7XG5pbXBvcnQgeyBhc3NlcnROb3RFcXVhbHMgfSBmcm9tIFwiLi9fYXNzZXJ0X25vdF9lcXVhbHMudHNcIjtcbmltcG9ydCB7IGVxdWFsIH0gZnJvbSBcIi4vX2VxdWFsLnRzXCI7XG5pbXBvcnQgeyBmb3JtYXQgfSBmcm9tIFwianNyOkBzdGQvaW50ZXJuYWxAXjEuMC4xMC9mb3JtYXRcIjtcbmltcG9ydCB0eXBlIHsgQW55Q29uc3RydWN0b3IsIE1hdGNoZXJDb250ZXh0LCBNYXRjaFJlc3VsdCB9IGZyb20gXCIuL190eXBlcy50c1wiO1xuaW1wb3J0IHsgZ2V0TW9ja0NhbGxzIH0gZnJvbSBcIi4vX21vY2tfdXRpbC50c1wiO1xuaW1wb3J0IHsgaW5zcGVjdEFyZywgaW5zcGVjdEFyZ3MgfSBmcm9tIFwiLi9faW5zcGVjdF9hcmdzLnRzXCI7XG5pbXBvcnQge1xuICBidWlsZEVxdWFsT3B0aW9ucyxcbiAgaXRlcmFibGVFcXVhbGl0eSxcbiAgc3Vic2V0RXF1YWxpdHksXG59IGZyb20gXCIuL191dGlscy50c1wiO1xuaW1wb3J0IHtcbiAgYnVpbGRFcXVhbEVycm9yTWVzc2FnZSxcbiAgYnVpbGROb3RFcXVhbEVycm9yTWVzc2FnZSxcbn0gZnJvbSBcIi4vX2J1aWxkX21lc3NhZ2UudHNcIjtcblxuZXhwb3J0IGZ1bmN0aW9uIHRvQmUoY29udGV4dDogTWF0Y2hlckNvbnRleHQsIGV4cGVjdDogdW5rbm93bik6IE1hdGNoUmVzdWx0IHtcbiAgaWYgKGNvbnRleHQuaXNOb3QpIHtcbiAgICBhc3NlcnROb3RTdHJpY3RFcXVhbHMoY29udGV4dC52YWx1ZSwgZXhwZWN0LCBjb250ZXh0LmN1c3RvbU1lc3NhZ2UpO1xuICB9IGVsc2Uge1xuICAgIGFzc2VydFN0cmljdEVxdWFscyhjb250ZXh0LnZhbHVlLCBleHBlY3QsIGNvbnRleHQuY3VzdG9tTWVzc2FnZSk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRvRXF1YWwoXG4gIGNvbnRleHQ6IE1hdGNoZXJDb250ZXh0LFxuICBleHBlY3RlZDogdW5rbm93bixcbik6IE1hdGNoUmVzdWx0IHtcbiAgY29uc3QgdiA9IGNvbnRleHQudmFsdWU7XG4gIGNvbnN0IGUgPSBleHBlY3RlZDtcbiAgY29uc3QgZXF1YWxzT3B0aW9ucyA9IGJ1aWxkRXF1YWxPcHRpb25zKHtcbiAgICAuLi5jb250ZXh0LFxuICAgIGN1c3RvbVRlc3RlcnM6IFtcbiAgICAgIC4uLmNvbnRleHQuY3VzdG9tVGVzdGVycyxcbiAgICAgIGl0ZXJhYmxlRXF1YWxpdHksXG4gICAgXSxcbiAgfSk7XG5cbiAgaWYgKGNvbnRleHQuaXNOb3QpIHtcbiAgICBhc3NlcnROb3RFcXVhbHModiwgZSwgZXF1YWxzT3B0aW9ucyk7XG4gIH0gZWxzZSB7XG4gICAgYXNzZXJ0RXF1YWxzKHYsIGUsIGVxdWFsc09wdGlvbnMpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0b1N0cmljdEVxdWFsKFxuICBjb250ZXh0OiBNYXRjaGVyQ29udGV4dCxcbiAgZXhwZWN0ZWQ6IHVua25vd24sXG4pOiBNYXRjaFJlc3VsdCB7XG4gIGNvbnN0IGVxdWFsc09wdGlvbnMgPSBidWlsZEVxdWFsT3B0aW9ucyh7XG4gICAgLi4uY29udGV4dCxcbiAgICBzdHJpY3RDaGVjazogdHJ1ZSxcbiAgICBjdXN0b21UZXN0ZXJzOiBbXG4gICAgICAuLi5jb250ZXh0LmN1c3RvbVRlc3RlcnMsXG4gICAgICBpdGVyYWJsZUVxdWFsaXR5LFxuICAgIF0sXG4gIH0pO1xuXG4gIGlmIChjb250ZXh0LmlzTm90KSB7XG4gICAgYXNzZXJ0Tm90RXF1YWxzKGNvbnRleHQudmFsdWUsIGV4cGVjdGVkLCBlcXVhbHNPcHRpb25zKTtcbiAgfSBlbHNlIHtcbiAgICBhc3NlcnRFcXVhbHMoY29udGV4dC52YWx1ZSwgZXhwZWN0ZWQsIGVxdWFsc09wdGlvbnMpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0b0JlQ2xvc2VUbyhcbiAgY29udGV4dDogTWF0Y2hlckNvbnRleHQsXG4gIGV4cGVjdGVkOiBudW1iZXIsXG4gIG51bURpZ2l0cyA9IDIsXG4pOiBNYXRjaFJlc3VsdCB7XG4gIGlmIChudW1EaWdpdHMgPCAwKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgXCJ0b0JlQ2xvc2VUbyBzZWNvbmQgYXJndW1lbnQgbXVzdCBiZSBhIG5vbi1uZWdhdGl2ZSBpbnRlZ2VyLiBHb3QgXCIgK1xuICAgICAgICBudW1EaWdpdHMsXG4gICAgKTtcbiAgfVxuICBjb25zdCB0b2xlcmFuY2UgPSAwLjUgKiBNYXRoLnBvdygxMCwgLW51bURpZ2l0cyk7XG4gIGNvbnN0IHZhbHVlID0gTnVtYmVyKGNvbnRleHQudmFsdWUpO1xuICBjb25zdCBwYXNzID0gTWF0aC5hYnMoZXhwZWN0ZWQgLSB2YWx1ZSkgPCB0b2xlcmFuY2U7XG5cbiAgaWYgKGNvbnRleHQuaXNOb3QpIHtcbiAgICBpZiAocGFzcykge1xuICAgICAgY29uc3QgZGVmYXVsdE1lc3NhZ2UgPVxuICAgICAgICBgRXhwZWN0ZWQgdGhlIHZhbHVlICR7dmFsdWV9IG5vdCB0byBiZSBjbG9zZSB0byAke2V4cGVjdGVkfSAodXNpbmcgJHtudW1EaWdpdHN9IGRpZ2l0cyksIGJ1dCBpdCBpc2A7XG4gICAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IoXG4gICAgICAgIGNvbnRleHQuY3VzdG9tTWVzc2FnZVxuICAgICAgICAgID8gYCR7Y29udGV4dC5jdXN0b21NZXNzYWdlfTogJHtkZWZhdWx0TWVzc2FnZX1gXG4gICAgICAgICAgOiBkZWZhdWx0TWVzc2FnZSxcbiAgICAgICk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmICghcGFzcykge1xuICAgICAgY29uc3QgZGVmYXVsdE1lc3NhZ2UgPVxuICAgICAgICBgRXhwZWN0ZWQgdGhlIHZhbHVlICR7dmFsdWV9IHRvIGJlIGNsb3NlIHRvICR7ZXhwZWN0ZWR9ICh1c2luZyAke251bURpZ2l0c30gZGlnaXRzKSwgYnV0IGl0IGlzIG5vdGA7XG4gICAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IoXG4gICAgICAgIGNvbnRleHQuY3VzdG9tTWVzc2FnZVxuICAgICAgICAgID8gYCR7Y29udGV4dC5jdXN0b21NZXNzYWdlfTogJHtkZWZhdWx0TWVzc2FnZX1gXG4gICAgICAgICAgOiBkZWZhdWx0TWVzc2FnZSxcbiAgICAgICk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0b0JlRGVmaW5lZChjb250ZXh0OiBNYXRjaGVyQ29udGV4dCk6IE1hdGNoUmVzdWx0IHtcbiAgaWYgKGNvbnRleHQuaXNOb3QpIHtcbiAgICBhc3NlcnRTdHJpY3RFcXVhbHMoY29udGV4dC52YWx1ZSwgdW5kZWZpbmVkLCBjb250ZXh0LmN1c3RvbU1lc3NhZ2UpO1xuICB9IGVsc2Uge1xuICAgIGFzc2VydE5vdFN0cmljdEVxdWFscyhjb250ZXh0LnZhbHVlLCB1bmRlZmluZWQsIGNvbnRleHQuY3VzdG9tTWVzc2FnZSk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRvQmVVbmRlZmluZWQoY29udGV4dDogTWF0Y2hlckNvbnRleHQpOiBNYXRjaFJlc3VsdCB7XG4gIGlmIChjb250ZXh0LmlzTm90KSB7XG4gICAgYXNzZXJ0Tm90U3RyaWN0RXF1YWxzKFxuICAgICAgY29udGV4dC52YWx1ZSxcbiAgICAgIHVuZGVmaW5lZCxcbiAgICAgIGNvbnRleHQuY3VzdG9tTWVzc2FnZSxcbiAgICApO1xuICB9IGVsc2Uge1xuICAgIGFzc2VydFN0cmljdEVxdWFscyhjb250ZXh0LnZhbHVlLCB1bmRlZmluZWQsIGNvbnRleHQuY3VzdG9tTWVzc2FnZSk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRvQmVGYWxzeShcbiAgY29udGV4dDogTWF0Y2hlckNvbnRleHQsXG4pOiBNYXRjaFJlc3VsdCB7XG4gIGNvbnN0IGlzRmFsc3kgPSAhKGNvbnRleHQudmFsdWUpO1xuICBpZiAoY29udGV4dC5pc05vdCkge1xuICAgIGlmIChpc0ZhbHN5KSB7XG4gICAgICBjb25zdCBkZWZhdWx0TWVzc2FnZSA9IGBFeHBlY3RlZCAke2NvbnRleHQudmFsdWV9IHRvIE5PVCBiZSBmYWxzeWA7XG4gICAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IoXG4gICAgICAgIGNvbnRleHQuY3VzdG9tTWVzc2FnZVxuICAgICAgICAgID8gYCR7Y29udGV4dC5jdXN0b21NZXNzYWdlfTogJHtkZWZhdWx0TWVzc2FnZX1gXG4gICAgICAgICAgOiBkZWZhdWx0TWVzc2FnZSxcbiAgICAgICk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmICghaXNGYWxzeSkge1xuICAgICAgY29uc3QgZGVmYXVsdE1lc3NhZ2UgPSBgRXhwZWN0ZWQgJHtjb250ZXh0LnZhbHVlfSB0byBiZSBmYWxzeWA7XG4gICAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IoXG4gICAgICAgIGNvbnRleHQuY3VzdG9tTWVzc2FnZVxuICAgICAgICAgID8gYCR7Y29udGV4dC5jdXN0b21NZXNzYWdlfTogJHtkZWZhdWx0TWVzc2FnZX1gXG4gICAgICAgICAgOiBkZWZhdWx0TWVzc2FnZSxcbiAgICAgICk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0b0JlVHJ1dGh5KFxuICBjb250ZXh0OiBNYXRjaGVyQ29udGV4dCxcbik6IE1hdGNoUmVzdWx0IHtcbiAgY29uc3QgaXNUcnV0aHkgPSAhIShjb250ZXh0LnZhbHVlKTtcbiAgaWYgKGNvbnRleHQuaXNOb3QpIHtcbiAgICBpZiAoaXNUcnV0aHkpIHtcbiAgICAgIGNvbnN0IGRlZmF1bHRNZXNzYWdlID0gYEV4cGVjdGVkICR7Y29udGV4dC52YWx1ZX0gdG8gTk9UIGJlIHRydXRoeWA7XG4gICAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IoXG4gICAgICAgIGNvbnRleHQuY3VzdG9tTWVzc2FnZVxuICAgICAgICAgID8gYCR7Y29udGV4dC5jdXN0b21NZXNzYWdlfTogJHtkZWZhdWx0TWVzc2FnZX1gXG4gICAgICAgICAgOiBkZWZhdWx0TWVzc2FnZSxcbiAgICAgICk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmICghaXNUcnV0aHkpIHtcbiAgICAgIGNvbnN0IGRlZmF1bHRNZXNzYWdlID0gYEV4cGVjdGVkICR7Y29udGV4dC52YWx1ZX0gdG8gYmUgdHJ1dGh5YDtcbiAgICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihcbiAgICAgICAgY29udGV4dC5jdXN0b21NZXNzYWdlXG4gICAgICAgICAgPyBgJHtjb250ZXh0LmN1c3RvbU1lc3NhZ2V9OiAke2RlZmF1bHRNZXNzYWdlfWBcbiAgICAgICAgICA6IGRlZmF1bHRNZXNzYWdlLFxuICAgICAgKTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRvQmVHcmVhdGVyVGhhbk9yRXF1YWwoXG4gIGNvbnRleHQ6IE1hdGNoZXJDb250ZXh0LFxuICBleHBlY3RlZDogbnVtYmVyLFxuKTogTWF0Y2hSZXN1bHQge1xuICBjb25zdCBpc0dyZWF0ZXJPckVxdWFsID0gTnVtYmVyKGNvbnRleHQudmFsdWUpID49IE51bWJlcihleHBlY3RlZCk7XG4gIGlmIChjb250ZXh0LmlzTm90KSB7XG4gICAgaWYgKGlzR3JlYXRlck9yRXF1YWwpIHtcbiAgICAgIGNvbnN0IGRlZmF1bHRNZXNzYWdlID1cbiAgICAgICAgYEV4cGVjdGVkICR7Y29udGV4dC52YWx1ZX0gdG8gTk9UIGJlIGdyZWF0ZXIgdGhhbiBvciBlcXVhbCAke2V4cGVjdGVkfWA7XG4gICAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IoXG4gICAgICAgIGNvbnRleHQuY3VzdG9tTWVzc2FnZVxuICAgICAgICAgID8gYCR7Y29udGV4dC5jdXN0b21NZXNzYWdlfTogJHtkZWZhdWx0TWVzc2FnZX1gXG4gICAgICAgICAgOiBkZWZhdWx0TWVzc2FnZSxcbiAgICAgICk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmICghaXNHcmVhdGVyT3JFcXVhbCkge1xuICAgICAgY29uc3QgZGVmYXVsdE1lc3NhZ2UgPVxuICAgICAgICBgRXhwZWN0ZWQgJHtjb250ZXh0LnZhbHVlfSB0byBiZSBncmVhdGVyIHRoYW4gb3IgZXF1YWwgJHtleHBlY3RlZH1gO1xuICAgICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKFxuICAgICAgICBjb250ZXh0LmN1c3RvbU1lc3NhZ2VcbiAgICAgICAgICA/IGAke2NvbnRleHQuY3VzdG9tTWVzc2FnZX06ICR7ZGVmYXVsdE1lc3NhZ2V9YFxuICAgICAgICAgIDogZGVmYXVsdE1lc3NhZ2UsXG4gICAgICApO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gdG9CZUdyZWF0ZXJUaGFuKFxuICBjb250ZXh0OiBNYXRjaGVyQ29udGV4dCxcbiAgZXhwZWN0ZWQ6IG51bWJlcixcbik6IE1hdGNoUmVzdWx0IHtcbiAgY29uc3QgaXNHcmVhdGVyID0gTnVtYmVyKGNvbnRleHQudmFsdWUpID4gTnVtYmVyKGV4cGVjdGVkKTtcbiAgaWYgKGNvbnRleHQuaXNOb3QpIHtcbiAgICBpZiAoaXNHcmVhdGVyKSB7XG4gICAgICBjb25zdCBkZWZhdWx0TWVzc2FnZSA9XG4gICAgICAgIGBFeHBlY3RlZCAke2NvbnRleHQudmFsdWV9IHRvIE5PVCBiZSBncmVhdGVyIHRoYW4gJHtleHBlY3RlZH1gO1xuICAgICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKFxuICAgICAgICBjb250ZXh0LmN1c3RvbU1lc3NhZ2VcbiAgICAgICAgICA/IGAke2NvbnRleHQuY3VzdG9tTWVzc2FnZX06ICR7ZGVmYXVsdE1lc3NhZ2V9YFxuICAgICAgICAgIDogZGVmYXVsdE1lc3NhZ2UsXG4gICAgICApO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoIWlzR3JlYXRlcikge1xuICAgICAgY29uc3QgZGVmYXVsdE1lc3NhZ2UgPVxuICAgICAgICBgRXhwZWN0ZWQgJHtjb250ZXh0LnZhbHVlfSB0byBiZSBncmVhdGVyIHRoYW4gJHtleHBlY3RlZH1gO1xuICAgICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKFxuICAgICAgICBjb250ZXh0LmN1c3RvbU1lc3NhZ2VcbiAgICAgICAgICA/IGAke2NvbnRleHQuY3VzdG9tTWVzc2FnZX06ICR7ZGVmYXVsdE1lc3NhZ2V9YFxuICAgICAgICAgIDogZGVmYXVsdE1lc3NhZ2UsXG4gICAgICApO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gdG9CZUluc3RhbmNlT2Y8VCBleHRlbmRzIEFueUNvbnN0cnVjdG9yPihcbiAgY29udGV4dDogTWF0Y2hlckNvbnRleHQsXG4gIGV4cGVjdGVkOiBULFxuKTogTWF0Y2hSZXN1bHQge1xuICBpZiAoY29udGV4dC5pc05vdCkge1xuICAgIGFzc2VydE5vdEluc3RhbmNlT2YoY29udGV4dC52YWx1ZSwgZXhwZWN0ZWQpO1xuICB9IGVsc2Uge1xuICAgIGFzc2VydEluc3RhbmNlT2YoY29udGV4dC52YWx1ZSwgZXhwZWN0ZWQpO1xuICB9XG59XG5leHBvcnQgZnVuY3Rpb24gdG9CZUxlc3NUaGFuT3JFcXVhbChcbiAgY29udGV4dDogTWF0Y2hlckNvbnRleHQsXG4gIGV4cGVjdGVkOiBudW1iZXIsXG4pOiBNYXRjaFJlc3VsdCB7XG4gIGNvbnN0IGlzTG93ZXIgPSBOdW1iZXIoY29udGV4dC52YWx1ZSkgPD0gTnVtYmVyKGV4cGVjdGVkKTtcbiAgaWYgKGNvbnRleHQuaXNOb3QpIHtcbiAgICBpZiAoaXNMb3dlcikge1xuICAgICAgY29uc3QgZGVmYXVsdE1lc3NhZ2UgPVxuICAgICAgICBgRXhwZWN0ZWQgJHtjb250ZXh0LnZhbHVlfSB0byBOT1QgYmUgbG93ZXIgdGhhbiBvciBlcXVhbCAke2V4cGVjdGVkfWA7XG4gICAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IoXG4gICAgICAgIGNvbnRleHQuY3VzdG9tTWVzc2FnZVxuICAgICAgICAgID8gYCR7Y29udGV4dC5jdXN0b21NZXNzYWdlfTogJHtkZWZhdWx0TWVzc2FnZX1gXG4gICAgICAgICAgOiBkZWZhdWx0TWVzc2FnZSxcbiAgICAgICk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmICghaXNMb3dlcikge1xuICAgICAgY29uc3QgZGVmYXVsdE1lc3NhZ2UgPVxuICAgICAgICBgRXhwZWN0ZWQgJHtjb250ZXh0LnZhbHVlfSB0byBiZSBsb3dlciB0aGFuIG9yIGVxdWFsICR7ZXhwZWN0ZWR9YDtcbiAgICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihcbiAgICAgICAgY29udGV4dC5jdXN0b21NZXNzYWdlXG4gICAgICAgICAgPyBgJHtjb250ZXh0LmN1c3RvbU1lc3NhZ2V9OiAke2RlZmF1bHRNZXNzYWdlfWBcbiAgICAgICAgICA6IGRlZmF1bHRNZXNzYWdlLFxuICAgICAgKTtcbiAgICB9XG4gIH1cbn1cbmV4cG9ydCBmdW5jdGlvbiB0b0JlTGVzc1RoYW4oXG4gIGNvbnRleHQ6IE1hdGNoZXJDb250ZXh0LFxuICBleHBlY3RlZDogbnVtYmVyLFxuKTogTWF0Y2hSZXN1bHQge1xuICBjb25zdCBpc0xvd2VyID0gTnVtYmVyKGNvbnRleHQudmFsdWUpIDwgTnVtYmVyKGV4cGVjdGVkKTtcbiAgaWYgKGNvbnRleHQuaXNOb3QpIHtcbiAgICBpZiAoaXNMb3dlcikge1xuICAgICAgY29uc3QgZGVmYXVsdE1lc3NhZ2UgPVxuICAgICAgICBgRXhwZWN0ZWQgJHtjb250ZXh0LnZhbHVlfSB0byBOT1QgYmUgbG93ZXIgdGhhbiAke2V4cGVjdGVkfWA7XG4gICAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IoXG4gICAgICAgIGNvbnRleHQuY3VzdG9tTWVzc2FnZVxuICAgICAgICAgID8gYCR7Y29udGV4dC5jdXN0b21NZXNzYWdlfTogJHtkZWZhdWx0TWVzc2FnZX1gXG4gICAgICAgICAgOiBkZWZhdWx0TWVzc2FnZSxcbiAgICAgICk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmICghaXNMb3dlcikge1xuICAgICAgY29uc3QgZGVmYXVsdE1lc3NhZ2UgPVxuICAgICAgICBgRXhwZWN0ZWQgJHtjb250ZXh0LnZhbHVlfSB0byBiZSBsb3dlciB0aGFuICR7ZXhwZWN0ZWR9YDtcbiAgICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihcbiAgICAgICAgY29udGV4dC5jdXN0b21NZXNzYWdlXG4gICAgICAgICAgPyBgJHtjb250ZXh0LmN1c3RvbU1lc3NhZ2V9OiAke2RlZmF1bHRNZXNzYWdlfWBcbiAgICAgICAgICA6IGRlZmF1bHRNZXNzYWdlLFxuICAgICAgKTtcbiAgICB9XG4gIH1cbn1cbmV4cG9ydCBmdW5jdGlvbiB0b0JlTmFOKGNvbnRleHQ6IE1hdGNoZXJDb250ZXh0KTogTWF0Y2hSZXN1bHQge1xuICBjb25zdCBlcXVhbHNPcHRpb25zID0gYnVpbGRFcXVhbE9wdGlvbnMoY29udGV4dCk7XG4gIGlmIChjb250ZXh0LmlzTm90KSB7XG4gICAgYXNzZXJ0Tm90RXF1YWxzKFxuICAgICAgaXNOYU4oTnVtYmVyKGNvbnRleHQudmFsdWUpKSxcbiAgICAgIHRydWUsXG4gICAgICB7XG4gICAgICAgIC4uLmVxdWFsc09wdGlvbnMsXG4gICAgICAgIG1zZzogZXF1YWxzT3B0aW9ucy5tc2cgfHwgYEV4cGVjdGVkICR7Y29udGV4dC52YWx1ZX0gdG8gbm90IGJlIE5hTmAsXG4gICAgICB9LFxuICAgICk7XG4gIH0gZWxzZSB7XG4gICAgYXNzZXJ0RXF1YWxzKFxuICAgICAgaXNOYU4oTnVtYmVyKGNvbnRleHQudmFsdWUpKSxcbiAgICAgIHRydWUsXG4gICAgICB7XG4gICAgICAgIC4uLmVxdWFsc09wdGlvbnMsXG4gICAgICAgIG1zZzogZXF1YWxzT3B0aW9ucy5tc2cgfHwgYEV4cGVjdGVkICR7Y29udGV4dC52YWx1ZX0gdG8gYmUgTmFOYCxcbiAgICAgIH0sXG4gICAgKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gdG9CZU51bGwoY29udGV4dDogTWF0Y2hlckNvbnRleHQpOiBNYXRjaFJlc3VsdCB7XG4gIGlmIChjb250ZXh0LmlzTm90KSB7XG4gICAgYXNzZXJ0Tm90U3RyaWN0RXF1YWxzKFxuICAgICAgY29udGV4dC52YWx1ZSBhcyBudW1iZXIsXG4gICAgICBudWxsLFxuICAgICAgY29udGV4dC5jdXN0b21NZXNzYWdlIHx8IGBFeHBlY3RlZCAke2NvbnRleHQudmFsdWV9IHRvIG5vdCBiZSBudWxsYCxcbiAgICApO1xuICB9IGVsc2Uge1xuICAgIGFzc2VydFN0cmljdEVxdWFscyhcbiAgICAgIGNvbnRleHQudmFsdWUgYXMgbnVtYmVyLFxuICAgICAgbnVsbCxcbiAgICAgIGNvbnRleHQuY3VzdG9tTWVzc2FnZSB8fCBgRXhwZWN0ZWQgJHtjb250ZXh0LnZhbHVlfSB0byBiZSBudWxsYCxcbiAgICApO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0b0hhdmVMZW5ndGgoXG4gIGNvbnRleHQ6IE1hdGNoZXJDb250ZXh0LFxuICBleHBlY3RlZDogbnVtYmVyLFxuKTogTWF0Y2hSZXN1bHQge1xuICBjb25zdCB7IHZhbHVlIH0gPSBjb250ZXh0O1xuICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICBjb25zdCBtYXliZUxlbmd0aCA9ICh2YWx1ZSBhcyBhbnkpPy5sZW5ndGg7XG4gIGNvbnN0IGhhc0xlbmd0aCA9IG1heWJlTGVuZ3RoID09PSBleHBlY3RlZDtcblxuICBpZiAoY29udGV4dC5pc05vdCkge1xuICAgIGlmIChoYXNMZW5ndGgpIHtcbiAgICAgIGNvbnN0IGRlZmF1bHRNZXNzYWdlID1cbiAgICAgICAgYEV4cGVjdGVkIHZhbHVlIG5vdCB0byBoYXZlIGxlbmd0aCAke2V4cGVjdGVkfSwgYnV0IGl0IGRvZXNgO1xuICAgICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKFxuICAgICAgICBjb250ZXh0LmN1c3RvbU1lc3NhZ2VcbiAgICAgICAgICA/IGAke2NvbnRleHQuY3VzdG9tTWVzc2FnZX06ICR7ZGVmYXVsdE1lc3NhZ2V9YFxuICAgICAgICAgIDogZGVmYXVsdE1lc3NhZ2UsXG4gICAgICApO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoIWhhc0xlbmd0aCkge1xuICAgICAgY29uc3QgZGVmYXVsdE1lc3NhZ2UgPVxuICAgICAgICBgRXhwZWN0ZWQgdmFsdWUgdG8gaGF2ZSBsZW5ndGggJHtleHBlY3RlZH0sIGJ1dCBpdCBkb2VzIG5vdDogdGhlIHZhbHVlIGhhcyBsZW5ndGggJHttYXliZUxlbmd0aH1gO1xuICAgICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKFxuICAgICAgICBjb250ZXh0LmN1c3RvbU1lc3NhZ2VcbiAgICAgICAgICA/IGAke2NvbnRleHQuY3VzdG9tTWVzc2FnZX06ICR7ZGVmYXVsdE1lc3NhZ2V9YFxuICAgICAgICAgIDogZGVmYXVsdE1lc3NhZ2UsXG4gICAgICApO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gdG9IYXZlUHJvcGVydHkoXG4gIGNvbnRleHQ6IE1hdGNoZXJDb250ZXh0LFxuICBwcm9wTmFtZTogc3RyaW5nIHwgc3RyaW5nW10sXG4gIHY/OiB1bmtub3duLFxuKTogTWF0Y2hSZXN1bHQge1xuICBjb25zdCB7IHZhbHVlIH0gPSBjb250ZXh0O1xuXG4gIGxldCBwcm9wUGF0aCA9IFtdIGFzIHN0cmluZ1tdO1xuICBpZiAoQXJyYXkuaXNBcnJheShwcm9wTmFtZSkpIHtcbiAgICBwcm9wUGF0aCA9IHByb3BOYW1lO1xuICB9IGVsc2Uge1xuICAgIHByb3BQYXRoID0gcHJvcE5hbWUuc3BsaXQoXCIuXCIpO1xuICB9XG5cbiAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgbGV0IGN1cnJlbnQgPSB2YWx1ZSBhcyBhbnk7XG4gIHdoaWxlICh0cnVlKSB7XG4gICAgaWYgKGN1cnJlbnQgPT09IHVuZGVmaW5lZCB8fCBjdXJyZW50ID09PSBudWxsKSB7XG4gICAgICBicmVhaztcbiAgICB9XG4gICAgaWYgKHByb3BQYXRoLmxlbmd0aCA9PT0gMCkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGNvbnN0IHByb3AgPSBwcm9wUGF0aC5zaGlmdCgpITtcbiAgICBjdXJyZW50ID0gY3VycmVudFtwcm9wXTtcbiAgfVxuXG4gIGxldCBoYXNQcm9wZXJ0eTtcbiAgaWYgKHYpIHtcbiAgICBoYXNQcm9wZXJ0eSA9IGN1cnJlbnQgIT09IHVuZGVmaW5lZCAmJiBwcm9wUGF0aC5sZW5ndGggPT09IDAgJiZcbiAgICAgIGVxdWFsKGN1cnJlbnQsIHYsIGNvbnRleHQpO1xuICB9IGVsc2Uge1xuICAgIGhhc1Byb3BlcnR5ID0gY3VycmVudCAhPT0gdW5kZWZpbmVkICYmIHByb3BQYXRoLmxlbmd0aCA9PT0gMDtcbiAgfVxuXG4gIGxldCBvZlZhbHVlID0gXCJcIjtcbiAgaWYgKHYpIHtcbiAgICBvZlZhbHVlID0gYCBvZiB0aGUgdmFsdWUgJHtpbnNwZWN0QXJnKHYpfWA7XG4gIH1cblxuICBpZiAoY29udGV4dC5pc05vdCkge1xuICAgIGlmIChoYXNQcm9wZXJ0eSkge1xuICAgICAgY29uc3QgZGVmYXVsdE1lc3NhZ2UgPSBgRXhwZWN0ZWQgdGhlIHZhbHVlIG5vdCB0byBoYXZlIHRoZSBwcm9wZXJ0eSAke1xuICAgICAgICBwcm9wUGF0aC5qb2luKFwiLlwiKVxuICAgICAgfSR7b2ZWYWx1ZX0sIGJ1dCBpdCBkb2VzYDtcbiAgICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihcbiAgICAgICAgY29udGV4dC5jdXN0b21NZXNzYWdlXG4gICAgICAgICAgPyBgJHtjb250ZXh0LmN1c3RvbU1lc3NhZ2V9OiAke2RlZmF1bHRNZXNzYWdlfWBcbiAgICAgICAgICA6IGRlZmF1bHRNZXNzYWdlLFxuICAgICAgKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKCFoYXNQcm9wZXJ0eSkge1xuICAgICAgY29uc3QgZGVmYXVsdE1lc3NhZ2UgPSBgRXhwZWN0ZWQgdGhlIHZhbHVlIHRvIGhhdmUgdGhlIHByb3BlcnR5ICR7XG4gICAgICAgIHByb3BQYXRoLmpvaW4oXCIuXCIpXG4gICAgICB9JHtvZlZhbHVlfSwgYnV0IGl0IGRvZXMgbm90YDtcbiAgICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihcbiAgICAgICAgY29udGV4dC5jdXN0b21NZXNzYWdlXG4gICAgICAgICAgPyBgJHtjb250ZXh0LmN1c3RvbU1lc3NhZ2V9OiAke2RlZmF1bHRNZXNzYWdlfWBcbiAgICAgICAgICA6IGRlZmF1bHRNZXNzYWdlLFxuICAgICAgKTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRvQ29udGFpbihcbiAgY29udGV4dDogTWF0Y2hlckNvbnRleHQsXG4gIGV4cGVjdGVkOiB1bmtub3duLFxuKTogTWF0Y2hSZXN1bHQge1xuICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICBjb25zdCBkb2VzQ29udGFpbiA9IChjb250ZXh0LnZhbHVlIGFzIGFueSk/LmluY2x1ZGVzPy4oZXhwZWN0ZWQpO1xuXG4gIGNvbnN0IGZtdFZhbHVlID0gZm9ybWF0KGNvbnRleHQudmFsdWUpO1xuICBjb25zdCBmbXRFeHBlY3RlZCA9IGZvcm1hdChleHBlY3RlZCk7XG5cbiAgaWYgKGNvbnRleHQuaXNOb3QpIHtcbiAgICBpZiAoZG9lc0NvbnRhaW4pIHtcbiAgICAgIGNvbnN0IGRlZmF1bHRNZXNzYWdlID1cbiAgICAgICAgYFRoZSB2YWx1ZSAke2ZtdFZhbHVlfSBjb250YWlucyB0aGUgZXhwZWN0ZWQgaXRlbSAke2ZtdEV4cGVjdGVkfWA7XG4gICAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IoXG4gICAgICAgIGNvbnRleHQuY3VzdG9tTWVzc2FnZVxuICAgICAgICAgID8gYCR7Y29udGV4dC5jdXN0b21NZXNzYWdlfTogJHtkZWZhdWx0TWVzc2FnZX1gXG4gICAgICAgICAgOiBkZWZhdWx0TWVzc2FnZSxcbiAgICAgICk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmICghZG9lc0NvbnRhaW4pIHtcbiAgICAgIGNvbnN0IGRlZmF1bHRNZXNzYWdlID1cbiAgICAgICAgYFRoZSB2YWx1ZSAke2ZtdFZhbHVlfSBkb2Vzbid0IGNvbnRhaW4gdGhlIGV4cGVjdGVkIGl0ZW0gJHtmbXRFeHBlY3RlZH1gO1xuICAgICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKFxuICAgICAgICBjb250ZXh0LmN1c3RvbU1lc3NhZ2VcbiAgICAgICAgICA/IGAke2NvbnRleHQuY3VzdG9tTWVzc2FnZX06ICR7ZGVmYXVsdE1lc3NhZ2V9YFxuICAgICAgICAgIDogZGVmYXVsdE1lc3NhZ2UsXG4gICAgICApO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gdG9Db250YWluRXF1YWwoXG4gIGNvbnRleHQ6IE1hdGNoZXJDb250ZXh0LFxuICBleHBlY3RlZDogdW5rbm93bixcbik6IE1hdGNoUmVzdWx0IHtcbiAgY29uc3QgeyB2YWx1ZSB9ID0gY29udGV4dDtcbiAgYXNzZXJ0SXNJdGVyYWJsZSh2YWx1ZSk7XG4gIGxldCBkb2VzQ29udGFpbiA9IGZhbHNlO1xuXG4gIGZvciAoY29uc3QgaXRlbSBvZiB2YWx1ZSkge1xuICAgIGlmIChlcXVhbChpdGVtLCBleHBlY3RlZCwgY29udGV4dCkpIHtcbiAgICAgIGRvZXNDb250YWluID0gdHJ1ZTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IHByZXR0eVN0cmluZ2lmeSA9IChqczogdW5rbm93bikgPT5cbiAgICBKU09OLnN0cmluZ2lmeShqcywgbnVsbCwgXCJcXHRcIilcbiAgICAgIC5yZXBsYWNlKC9cXFwifFxcbnxcXHQvZywgXCJcIilcbiAgICAgIC5zbGljZSgwLCAxMDApO1xuXG4gIGNvbnN0IGZtdFZhbHVlID0gcHJldHR5U3RyaW5naWZ5KGNvbnRleHQudmFsdWUpO1xuICBjb25zdCBmbXRFeHBlY3RlZCA9IHByZXR0eVN0cmluZ2lmeShleHBlY3RlZCk7XG5cbiAgaWYgKGNvbnRleHQuaXNOb3QpIHtcbiAgICBpZiAoZG9lc0NvbnRhaW4pIHtcbiAgICAgIGNvbnN0IGRlZmF1bHRNZXNzYWdlID0gYFRoZSB2YWx1ZSBjb250YWlucyB0aGUgZXhwZWN0ZWQgaXRlbTpcblZhbHVlOiAke2ZtdFZhbHVlfVxuRXhwZWN0ZWQ6ICR7Zm10RXhwZWN0ZWR9YDtcbiAgICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihcbiAgICAgICAgY29udGV4dC5jdXN0b21NZXNzYWdlXG4gICAgICAgICAgPyBgJHtjb250ZXh0LmN1c3RvbU1lc3NhZ2V9OiAke2RlZmF1bHRNZXNzYWdlfWBcbiAgICAgICAgICA6IGRlZmF1bHRNZXNzYWdlLFxuICAgICAgKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKCFkb2VzQ29udGFpbikge1xuICAgICAgY29uc3QgZGVmYXVsdE1lc3NhZ2UgPSBgVGhlIHZhbHVlIGRvZXNuJ3QgY29udGFpbiB0aGUgZXhwZWN0ZWQgaXRlbTpcblZhbHVlOiAke2ZtdFZhbHVlfVxuRXhwZWN0ZWQ6ICR7Zm10RXhwZWN0ZWR9YDtcbiAgICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihcbiAgICAgICAgY29udGV4dC5jdXN0b21NZXNzYWdlXG4gICAgICAgICAgPyBgJHtjb250ZXh0LmN1c3RvbU1lc3NhZ2V9OiAke2RlZmF1bHRNZXNzYWdlfWBcbiAgICAgICAgICA6IGRlZmF1bHRNZXNzYWdlLFxuICAgICAgKTtcbiAgICB9XG4gIH1cbn1cblxuLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbmZ1bmN0aW9uIGFzc2VydElzSXRlcmFibGUodmFsdWU6IGFueSk6IGFzc2VydHMgdmFsdWUgaXMgSXRlcmFibGU8dW5rbm93bj4ge1xuICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihcIlRoZSB2YWx1ZSBpcyBudWxsIG9yIHVuZGVmaW5lZFwiKTtcbiAgfVxuICBpZiAodHlwZW9mIHZhbHVlW1N5bWJvbC5pdGVyYXRvcl0gIT09IFwiZnVuY3Rpb25cIikge1xuICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihcIlRoZSB2YWx1ZSBpcyBub3QgaXRlcmFibGVcIik7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRvTWF0Y2goXG4gIGNvbnRleHQ6IE1hdGNoZXJDb250ZXh0LFxuICBleHBlY3RlZDogUmVnRXhwLFxuKTogTWF0Y2hSZXN1bHQge1xuICBpZiAoY29udGV4dC5pc05vdCkge1xuICAgIGFzc2VydE5vdE1hdGNoKFxuICAgICAgU3RyaW5nKGNvbnRleHQudmFsdWUpLFxuICAgICAgZXhwZWN0ZWQsXG4gICAgICBjb250ZXh0LmN1c3RvbU1lc3NhZ2UsXG4gICAgKTtcbiAgfSBlbHNlIHtcbiAgICBhc3NlcnRNYXRjaChTdHJpbmcoY29udGV4dC52YWx1ZSksIGV4cGVjdGVkLCBjb250ZXh0LmN1c3RvbU1lc3NhZ2UpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0b01hdGNoT2JqZWN0KFxuICBjb250ZXh0OiBNYXRjaGVyQ29udGV4dCxcbiAgZXhwZWN0ZWQ6IFJlY29yZDxQcm9wZXJ0eUtleSwgdW5rbm93bj4gfCBSZWNvcmQ8UHJvcGVydHlLZXksIHVua25vd24+W10sXG4pOiBNYXRjaFJlc3VsdCB7XG4gIGNvbnN0IHJlY2VpdmVkID0gY29udGV4dC52YWx1ZTtcblxuICBjb25zdCBkZWZhdWx0TXNnID0gXCJSZWNlaXZlZCB2YWx1ZSBtdXN0IGJlIGFuIG9iamVjdFwiO1xuXG4gIGlmICh0eXBlb2YgcmVjZWl2ZWQgIT09IFwib2JqZWN0XCIgfHwgcmVjZWl2ZWQgPT09IG51bGwpIHtcbiAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IoXG4gICAgICBjb250ZXh0LmN1c3RvbU1lc3NhZ2VcbiAgICAgICAgPyBgJHtjb250ZXh0LmN1c3RvbU1lc3NhZ2V9OiAke2RlZmF1bHRNc2d9YFxuICAgICAgICA6IGRlZmF1bHRNc2csXG4gICAgKTtcbiAgfVxuXG4gIGlmICh0eXBlb2YgZXhwZWN0ZWQgIT09IFwib2JqZWN0XCIgfHwgZXhwZWN0ZWQgPT09IG51bGwpIHtcbiAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IoXG4gICAgICBjb250ZXh0LmN1c3RvbU1lc3NhZ2VcbiAgICAgICAgPyBgJHtjb250ZXh0LmN1c3RvbU1lc3NhZ2V9OiAke2RlZmF1bHRNc2d9YFxuICAgICAgICA6IGRlZmF1bHRNc2csXG4gICAgKTtcbiAgfVxuXG4gIGNvbnN0IHBhc3MgPSBlcXVhbChyZWNlaXZlZCwgZXhwZWN0ZWQsIHtcbiAgICBzdHJpY3RDaGVjazogZmFsc2UsXG4gICAgY3VzdG9tVGVzdGVyczogW1xuICAgICAgLi4uY29udGV4dC5jdXN0b21UZXN0ZXJzLFxuICAgICAgaXRlcmFibGVFcXVhbGl0eSxcbiAgICAgIHN1YnNldEVxdWFsaXR5LFxuICAgIF0sXG4gIH0pO1xuXG4gIGNvbnN0IHRyaWdnZXJFcnJvciA9ICgpID0+IHtcbiAgICBpZiAoY29udGV4dC5pc05vdCkge1xuICAgICAgY29uc3QgZGVmYXVsdE1lc3NhZ2UgPSBidWlsZE5vdEVxdWFsRXJyb3JNZXNzYWdlKHJlY2VpdmVkLCBleHBlY3RlZCk7XG4gICAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IoXG4gICAgICAgIGNvbnRleHQuY3VzdG9tTWVzc2FnZVxuICAgICAgICAgID8gYCR7Y29udGV4dC5jdXN0b21NZXNzYWdlfTogJHtkZWZhdWx0TWVzc2FnZX1gXG4gICAgICAgICAgOiBkZWZhdWx0TWVzc2FnZSxcbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGRlZmF1bHRNZXNzYWdlID0gYnVpbGRFcXVhbEVycm9yTWVzc2FnZShyZWNlaXZlZCwgZXhwZWN0ZWQpO1xuICAgICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKFxuICAgICAgICBjb250ZXh0LmN1c3RvbU1lc3NhZ2VcbiAgICAgICAgICA/IGAke2NvbnRleHQuY3VzdG9tTWVzc2FnZX06ICR7ZGVmYXVsdE1lc3NhZ2V9YFxuICAgICAgICAgIDogZGVmYXVsdE1lc3NhZ2UsXG4gICAgICApO1xuICAgIH1cbiAgfTtcblxuICBpZiAoY29udGV4dC5pc05vdCAmJiBwYXNzIHx8ICFjb250ZXh0LmlzTm90ICYmICFwYXNzKSB7XG4gICAgdHJpZ2dlckVycm9yKCk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRvSGF2ZUJlZW5DYWxsZWQoY29udGV4dDogTWF0Y2hlckNvbnRleHQpOiBNYXRjaFJlc3VsdCB7XG4gIGNvbnN0IGNhbGxzID0gZ2V0TW9ja0NhbGxzKGNvbnRleHQudmFsdWUpO1xuICBjb25zdCBoYXNCZWVuQ2FsbGVkID0gY2FsbHMubGVuZ3RoID4gMDtcblxuICBpZiAoY29udGV4dC5pc05vdCkge1xuICAgIGlmIChoYXNCZWVuQ2FsbGVkKSB7XG4gICAgICBjb25zdCBkZWZhdWx0TWVzc2FnZSA9XG4gICAgICAgIGBFeHBlY3RlZCBtb2NrIGZ1bmN0aW9uIG5vdCB0byBiZSBjYWxsZWQsIGJ1dCBpdCB3YXMgY2FsbGVkICR7Y2FsbHMubGVuZ3RofSB0aW1lKHMpYDtcbiAgICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihcbiAgICAgICAgY29udGV4dC5jdXN0b21NZXNzYWdlXG4gICAgICAgICAgPyBgJHtjb250ZXh0LmN1c3RvbU1lc3NhZ2V9OiAke2RlZmF1bHRNZXNzYWdlfWBcbiAgICAgICAgICA6IGRlZmF1bHRNZXNzYWdlLFxuICAgICAgKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKCFoYXNCZWVuQ2FsbGVkKSB7XG4gICAgICBjb25zdCBkZWZhdWx0TWVzc2FnZSA9XG4gICAgICAgIFwiRXhwZWN0ZWQgbW9jayBmdW5jdGlvbiB0byBiZSBjYWxsZWQsIGJ1dCBpdCB3YXMgbm90IGNhbGxlZFwiO1xuICAgICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKFxuICAgICAgICBjb250ZXh0LmN1c3RvbU1lc3NhZ2VcbiAgICAgICAgICA/IGAke2NvbnRleHQuY3VzdG9tTWVzc2FnZX06ICR7ZGVmYXVsdE1lc3NhZ2V9YFxuICAgICAgICAgIDogZGVmYXVsdE1lc3NhZ2UsXG4gICAgICApO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gdG9IYXZlQmVlbkNhbGxlZFRpbWVzKFxuICBjb250ZXh0OiBNYXRjaGVyQ29udGV4dCxcbiAgZXhwZWN0ZWQ6IG51bWJlcixcbik6IE1hdGNoUmVzdWx0IHtcbiAgY29uc3QgY2FsbHMgPSBnZXRNb2NrQ2FsbHMoY29udGV4dC52YWx1ZSk7XG5cbiAgaWYgKGNvbnRleHQuaXNOb3QpIHtcbiAgICBpZiAoY2FsbHMubGVuZ3RoID09PSBleHBlY3RlZCkge1xuICAgICAgY29uc3QgZGVmYXVsdE1lc3NhZ2UgPVxuICAgICAgICBgRXhwZWN0ZWQgbW9jayBmdW5jdGlvbiBub3QgdG8gYmUgY2FsbGVkICR7ZXhwZWN0ZWR9IHRpbWUocyksIGJ1dCBpdCB3YXNgO1xuICAgICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKFxuICAgICAgICBjb250ZXh0LmN1c3RvbU1lc3NhZ2VcbiAgICAgICAgICA/IGAke2NvbnRleHQuY3VzdG9tTWVzc2FnZX06ICR7ZGVmYXVsdE1lc3NhZ2V9YFxuICAgICAgICAgIDogZGVmYXVsdE1lc3NhZ2UsXG4gICAgICApO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoY2FsbHMubGVuZ3RoICE9PSBleHBlY3RlZCkge1xuICAgICAgY29uc3QgZGVmYXVsdE1lc3NhZ2UgPVxuICAgICAgICBgRXhwZWN0ZWQgbW9jayBmdW5jdGlvbiB0byBiZSBjYWxsZWQgJHtleHBlY3RlZH0gdGltZShzKSwgYnV0IGl0IHdhcyBjYWxsZWQgJHtjYWxscy5sZW5ndGh9IHRpbWUocylgO1xuICAgICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKFxuICAgICAgICBjb250ZXh0LmN1c3RvbU1lc3NhZ2VcbiAgICAgICAgICA/IGAke2NvbnRleHQuY3VzdG9tTWVzc2FnZX06ICR7ZGVmYXVsdE1lc3NhZ2V9YFxuICAgICAgICAgIDogZGVmYXVsdE1lc3NhZ2UsXG4gICAgICApO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gdG9IYXZlQmVlbkNhbGxlZFdpdGgoXG4gIGNvbnRleHQ6IE1hdGNoZXJDb250ZXh0LFxuICAuLi5leHBlY3RlZDogdW5rbm93bltdXG4pOiBNYXRjaFJlc3VsdCB7XG4gIGNvbnN0IGNhbGxzID0gZ2V0TW9ja0NhbGxzKGNvbnRleHQudmFsdWUpO1xuICBjb25zdCBoYXNCZWVuQ2FsbGVkID0gY2FsbHMuc29tZSgoY2FsbCkgPT4gZXF1YWwoY2FsbC5hcmdzLCBleHBlY3RlZCkpO1xuXG4gIGlmIChjb250ZXh0LmlzTm90KSB7XG4gICAgaWYgKGhhc0JlZW5DYWxsZWQpIHtcbiAgICAgIGNvbnN0IGRlZmF1bHRNZXNzYWdlID0gYEV4cGVjdGVkIG1vY2sgZnVuY3Rpb24gbm90IHRvIGJlIGNhbGxlZCB3aXRoICR7XG4gICAgICAgIGluc3BlY3RBcmdzKGV4cGVjdGVkKVxuICAgICAgfSwgYnV0IGl0IHdhc2A7XG4gICAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IoXG4gICAgICAgIGNvbnRleHQuY3VzdG9tTWVzc2FnZVxuICAgICAgICAgID8gYCR7Y29udGV4dC5jdXN0b21NZXNzYWdlfTogJHtkZWZhdWx0TWVzc2FnZX1gXG4gICAgICAgICAgOiBkZWZhdWx0TWVzc2FnZSxcbiAgICAgICk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmICghaGFzQmVlbkNhbGxlZCkge1xuICAgICAgbGV0IG90aGVyQ2FsbHMgPSBcIlwiO1xuICAgICAgaWYgKGNhbGxzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgb3RoZXJDYWxscyA9IGBcXG4gIE90aGVyIGNhbGxzOlxcbiAgICAgJHtcbiAgICAgICAgICBjYWxscy5tYXAoKGNhbGwpID0+IGluc3BlY3RBcmdzKGNhbGwuYXJncykpLmpvaW4oXCJcXG4gICAgXCIpXG4gICAgICAgIH1gO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBkZWZhdWx0TWVzc2FnZSA9IGBFeHBlY3RlZCBtb2NrIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCB3aXRoICR7XG4gICAgICAgIGluc3BlY3RBcmdzKGV4cGVjdGVkKVxuICAgICAgfSwgYnV0IGl0IHdhcyBub3QuJHtvdGhlckNhbGxzfWA7XG4gICAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IoXG4gICAgICAgIGNvbnRleHQuY3VzdG9tTWVzc2FnZVxuICAgICAgICAgID8gYCR7Y29udGV4dC5jdXN0b21NZXNzYWdlfTogJHtkZWZhdWx0TWVzc2FnZX1gXG4gICAgICAgICAgOiBkZWZhdWx0TWVzc2FnZSxcbiAgICAgICk7XG4gICAgfVxuICB9XG59XG5leHBvcnQgZnVuY3Rpb24gdG9IYXZlQmVlbkxhc3RDYWxsZWRXaXRoKFxuICBjb250ZXh0OiBNYXRjaGVyQ29udGV4dCxcbiAgLi4uZXhwZWN0ZWQ6IHVua25vd25bXVxuKTogTWF0Y2hSZXN1bHQge1xuICBjb25zdCBjYWxscyA9IGdldE1vY2tDYWxscyhjb250ZXh0LnZhbHVlKTtcbiAgY29uc3QgaGFzQmVlbkNhbGxlZCA9IGNhbGxzLmxlbmd0aCA+IDAgJiZcbiAgICBlcXVhbChjYWxscy5hdCgtMSk/LmFyZ3MsIGV4cGVjdGVkKTtcblxuICBpZiAoY29udGV4dC5pc05vdCkge1xuICAgIGlmIChoYXNCZWVuQ2FsbGVkKSB7XG4gICAgICBjb25zdCBkZWZhdWx0TWVzc2FnZSA9XG4gICAgICAgIGBFeHBlY3RlZCBtb2NrIGZ1bmN0aW9uIG5vdCB0byBiZSBsYXN0IGNhbGxlZCB3aXRoICR7XG4gICAgICAgICAgaW5zcGVjdEFyZ3MoZXhwZWN0ZWQpXG4gICAgICAgIH0sIGJ1dCBpdCB3YXNgO1xuICAgICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKFxuICAgICAgICBjb250ZXh0LmN1c3RvbU1lc3NhZ2VcbiAgICAgICAgICA/IGAke2NvbnRleHQuY3VzdG9tTWVzc2FnZX06ICR7ZGVmYXVsdE1lc3NhZ2V9YFxuICAgICAgICAgIDogZGVmYXVsdE1lc3NhZ2UsXG4gICAgICApO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoIWhhc0JlZW5DYWxsZWQpIHtcbiAgICAgIGNvbnN0IGxhc3RDYWxsID0gY2FsbHMuYXQoLTEpO1xuICAgICAgaWYgKCFsYXN0Q2FsbCkge1xuICAgICAgICBjb25zdCBkZWZhdWx0TWVzc2FnZSA9IGBFeHBlY3RlZCBtb2NrIGZ1bmN0aW9uIHRvIGJlIGxhc3QgY2FsbGVkIHdpdGggJHtcbiAgICAgICAgICBpbnNwZWN0QXJncyhleHBlY3RlZClcbiAgICAgICAgfSwgYnV0IGl0IHdhcyBub3RgO1xuICAgICAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IoXG4gICAgICAgICAgY29udGV4dC5jdXN0b21NZXNzYWdlXG4gICAgICAgICAgICA/IGAke2NvbnRleHQuY3VzdG9tTWVzc2FnZX06ICR7ZGVmYXVsdE1lc3NhZ2V9YFxuICAgICAgICAgICAgOiBkZWZhdWx0TWVzc2FnZSxcbiAgICAgICAgKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IGRlZmF1bHRNZXNzYWdlID0gYEV4cGVjdGVkIG1vY2sgZnVuY3Rpb24gdG8gYmUgbGFzdCBjYWxsZWQgd2l0aCAke1xuICAgICAgICAgIGluc3BlY3RBcmdzKGV4cGVjdGVkKVxuICAgICAgICB9LCBidXQgaXQgd2FzIGxhc3QgY2FsbGVkIHdpdGggJHtpbnNwZWN0QXJncyhsYXN0Q2FsbC5hcmdzKX1gO1xuICAgICAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IoXG4gICAgICAgICAgY29udGV4dC5jdXN0b21NZXNzYWdlXG4gICAgICAgICAgICA/IGAke2NvbnRleHQuY3VzdG9tTWVzc2FnZX06ICR7ZGVmYXVsdE1lc3NhZ2V9YFxuICAgICAgICAgICAgOiBkZWZhdWx0TWVzc2FnZSxcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRvSGF2ZUJlZW5OdGhDYWxsZWRXaXRoKFxuICBjb250ZXh0OiBNYXRjaGVyQ29udGV4dCxcbiAgbnRoOiBudW1iZXIsXG4gIC4uLmV4cGVjdGVkOiB1bmtub3duW11cbik6IE1hdGNoUmVzdWx0IHtcbiAgaWYgKG50aCA8IDEpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYG50aCBtdXN0IGJlIGdyZWF0ZXIgdGhhbiAwOiByZWNlaXZlZCAke250aH1gKTtcbiAgfVxuXG4gIGNvbnN0IGNhbGxzID0gZ2V0TW9ja0NhbGxzKGNvbnRleHQudmFsdWUpO1xuICBjb25zdCBjYWxsSW5kZXggPSBudGggLSAxO1xuICBjb25zdCBoYXNCZWVuQ2FsbGVkID0gY2FsbHMubGVuZ3RoID4gY2FsbEluZGV4ICYmXG4gICAgZXF1YWwoY2FsbHNbY2FsbEluZGV4XT8uYXJncywgZXhwZWN0ZWQpO1xuXG4gIGlmIChjb250ZXh0LmlzTm90KSB7XG4gICAgaWYgKGhhc0JlZW5DYWxsZWQpIHtcbiAgICAgIGNvbnN0IGRlZmF1bHRNZXNzYWdlID1cbiAgICAgICAgYEV4cGVjdGVkIHRoZSBuLXRoIGNhbGwgKG49JHtudGh9KSBvZiBtb2NrIGZ1bmN0aW9uIGlzIG5vdCB3aXRoICR7XG4gICAgICAgICAgaW5zcGVjdEFyZ3MoZXhwZWN0ZWQpXG4gICAgICAgIH0sIGJ1dCBpdCB3YXNgO1xuICAgICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKFxuICAgICAgICBjb250ZXh0LmN1c3RvbU1lc3NhZ2VcbiAgICAgICAgICA/IGAke2NvbnRleHQuY3VzdG9tTWVzc2FnZX06ICR7ZGVmYXVsdE1lc3NhZ2V9YFxuICAgICAgICAgIDogZGVmYXVsdE1lc3NhZ2UsXG4gICAgICApO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoIWhhc0JlZW5DYWxsZWQpIHtcbiAgICAgIGNvbnN0IG50aENhbGwgPSBjYWxsc1tjYWxsSW5kZXhdO1xuICAgICAgaWYgKCFudGhDYWxsKSB7XG4gICAgICAgIGNvbnN0IGRlZmF1bHRNZXNzYWdlID1cbiAgICAgICAgICBgRXhwZWN0ZWQgdGhlIG4tdGggY2FsbCAobj0ke250aH0pIG9mIG1vY2sgZnVuY3Rpb24gaXMgd2l0aCAke1xuICAgICAgICAgICAgaW5zcGVjdEFyZ3MoZXhwZWN0ZWQpXG4gICAgICAgICAgfSwgYnV0IHRoZSBuLXRoIGNhbGwgZG9lcyBub3QgZXhpc3RgO1xuICAgICAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IoXG4gICAgICAgICAgY29udGV4dC5jdXN0b21NZXNzYWdlXG4gICAgICAgICAgICA/IGAke2NvbnRleHQuY3VzdG9tTWVzc2FnZX06ICR7ZGVmYXVsdE1lc3NhZ2V9YFxuICAgICAgICAgICAgOiBkZWZhdWx0TWVzc2FnZSxcbiAgICAgICAgKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IGRlZmF1bHRNZXNzYWdlID1cbiAgICAgICAgICBgRXhwZWN0ZWQgdGhlIG4tdGggY2FsbCAobj0ke250aH0pIG9mIG1vY2sgZnVuY3Rpb24gaXMgd2l0aCAke1xuICAgICAgICAgICAgaW5zcGVjdEFyZ3MoZXhwZWN0ZWQpXG4gICAgICAgICAgfSwgYnV0IGl0IHdhcyB3aXRoICR7aW5zcGVjdEFyZ3MobnRoQ2FsbC5hcmdzKX1gO1xuICAgICAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IoXG4gICAgICAgICAgY29udGV4dC5jdXN0b21NZXNzYWdlXG4gICAgICAgICAgICA/IGAke2NvbnRleHQuY3VzdG9tTWVzc2FnZX06ICR7ZGVmYXVsdE1lc3NhZ2V9YFxuICAgICAgICAgICAgOiBkZWZhdWx0TWVzc2FnZSxcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRvSGF2ZVJldHVybmVkKGNvbnRleHQ6IE1hdGNoZXJDb250ZXh0KTogTWF0Y2hSZXN1bHQge1xuICBjb25zdCBjYWxscyA9IGdldE1vY2tDYWxscyhjb250ZXh0LnZhbHVlKTtcbiAgY29uc3QgcmV0dXJuZWQgPSBjYWxscy5maWx0ZXIoKGNhbGwpID0+IGNhbGwucmV0dXJucyk7XG5cbiAgaWYgKGNvbnRleHQuaXNOb3QpIHtcbiAgICBpZiAocmV0dXJuZWQubGVuZ3RoID4gMCkge1xuICAgICAgY29uc3QgZGVmYXVsdE1lc3NhZ2UgPVxuICAgICAgICBgRXhwZWN0ZWQgdGhlIG1vY2sgZnVuY3Rpb24gdG8gbm90IGhhdmUgcmV0dXJuZWQsIGJ1dCBpdCByZXR1cm5lZCAke3JldHVybmVkLmxlbmd0aH0gdGltZXNgO1xuICAgICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKFxuICAgICAgICBjb250ZXh0LmN1c3RvbU1lc3NhZ2VcbiAgICAgICAgICA/IGAke2NvbnRleHQuY3VzdG9tTWVzc2FnZX06ICR7ZGVmYXVsdE1lc3NhZ2V9YFxuICAgICAgICAgIDogZGVmYXVsdE1lc3NhZ2UsXG4gICAgICApO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAocmV0dXJuZWQubGVuZ3RoID09PSAwKSB7XG4gICAgICBjb25zdCBkZWZhdWx0TWVzc2FnZSA9XG4gICAgICAgIGBFeHBlY3RlZCB0aGUgbW9jayBmdW5jdGlvbiB0byBoYXZlIHJldHVybmVkLCBidXQgaXQgZGlkIG5vdCByZXR1cm5gO1xuICAgICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKFxuICAgICAgICBjb250ZXh0LmN1c3RvbU1lc3NhZ2VcbiAgICAgICAgICA/IGAke2NvbnRleHQuY3VzdG9tTWVzc2FnZX06ICR7ZGVmYXVsdE1lc3NhZ2V9YFxuICAgICAgICAgIDogZGVmYXVsdE1lc3NhZ2UsXG4gICAgICApO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gdG9IYXZlUmV0dXJuZWRUaW1lcyhcbiAgY29udGV4dDogTWF0Y2hlckNvbnRleHQsXG4gIGV4cGVjdGVkOiBudW1iZXIsXG4pOiBNYXRjaFJlc3VsdCB7XG4gIGNvbnN0IGNhbGxzID0gZ2V0TW9ja0NhbGxzKGNvbnRleHQudmFsdWUpO1xuICBjb25zdCByZXR1cm5lZCA9IGNhbGxzLmZpbHRlcigoY2FsbCkgPT4gY2FsbC5yZXR1cm5zKTtcblxuICBpZiAoY29udGV4dC5pc05vdCkge1xuICAgIGlmIChyZXR1cm5lZC5sZW5ndGggPT09IGV4cGVjdGVkKSB7XG4gICAgICBjb25zdCBkZWZhdWx0TWVzc2FnZSA9XG4gICAgICAgIGBFeHBlY3RlZCB0aGUgbW9jayBmdW5jdGlvbiB0byBub3QgaGF2ZSByZXR1cm5lZCAke2V4cGVjdGVkfSB0aW1lcywgYnV0IGl0IHJldHVybmVkICR7cmV0dXJuZWQubGVuZ3RofSB0aW1lc2A7XG4gICAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IoXG4gICAgICAgIGNvbnRleHQuY3VzdG9tTWVzc2FnZVxuICAgICAgICAgID8gYCR7Y29udGV4dC5jdXN0b21NZXNzYWdlfTogJHtkZWZhdWx0TWVzc2FnZX1gXG4gICAgICAgICAgOiBkZWZhdWx0TWVzc2FnZSxcbiAgICAgICk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmIChyZXR1cm5lZC5sZW5ndGggIT09IGV4cGVjdGVkKSB7XG4gICAgICBjb25zdCBkZWZhdWx0TWVzc2FnZSA9XG4gICAgICAgIGBFeHBlY3RlZCB0aGUgbW9jayBmdW5jdGlvbiB0byBoYXZlIHJldHVybmVkICR7ZXhwZWN0ZWR9IHRpbWVzLCBidXQgaXQgcmV0dXJuZWQgJHtyZXR1cm5lZC5sZW5ndGh9IHRpbWVzYDtcbiAgICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihcbiAgICAgICAgY29udGV4dC5jdXN0b21NZXNzYWdlXG4gICAgICAgICAgPyBgJHtjb250ZXh0LmN1c3RvbU1lc3NhZ2V9OiAke2RlZmF1bHRNZXNzYWdlfWBcbiAgICAgICAgICA6IGRlZmF1bHRNZXNzYWdlLFxuICAgICAgKTtcbiAgICB9XG4gIH1cbn1cbmV4cG9ydCBmdW5jdGlvbiB0b0hhdmVSZXR1cm5lZFdpdGgoXG4gIGNvbnRleHQ6IE1hdGNoZXJDb250ZXh0LFxuICBleHBlY3RlZDogdW5rbm93bixcbik6IE1hdGNoUmVzdWx0IHtcbiAgY29uc3QgY2FsbHMgPSBnZXRNb2NrQ2FsbHMoY29udGV4dC52YWx1ZSk7XG4gIGNvbnN0IHJldHVybmVkID0gY2FsbHMuZmlsdGVyKChjYWxsKSA9PiBjYWxsLnJldHVybnMpO1xuICBjb25zdCByZXR1cm5lZFdpdGhFeHBlY3RlZCA9IHJldHVybmVkLnNvbWUoKGNhbGwpID0+XG4gICAgZXF1YWwoY2FsbC5yZXR1cm5lZCwgZXhwZWN0ZWQpXG4gICk7XG5cbiAgaWYgKGNvbnRleHQuaXNOb3QpIHtcbiAgICBpZiAocmV0dXJuZWRXaXRoRXhwZWN0ZWQpIHtcbiAgICAgIGNvbnN0IGRlZmF1bHRNZXNzYWdlID1cbiAgICAgICAgYEV4cGVjdGVkIHRoZSBtb2NrIGZ1bmN0aW9uIHRvIG5vdCBoYXZlIHJldHVybmVkIHdpdGggJHtcbiAgICAgICAgICBpbnNwZWN0QXJnKGV4cGVjdGVkKVxuICAgICAgICB9LCBidXQgaXQgZGlkYDtcbiAgICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihcbiAgICAgICAgY29udGV4dC5jdXN0b21NZXNzYWdlXG4gICAgICAgICAgPyBgJHtjb250ZXh0LmN1c3RvbU1lc3NhZ2V9OiAke2RlZmF1bHRNZXNzYWdlfWBcbiAgICAgICAgICA6IGRlZmF1bHRNZXNzYWdlLFxuICAgICAgKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKCFyZXR1cm5lZFdpdGhFeHBlY3RlZCkge1xuICAgICAgY29uc3QgZGVmYXVsdE1lc3NhZ2UgPVxuICAgICAgICBgRXhwZWN0ZWQgdGhlIG1vY2sgZnVuY3Rpb24gdG8gaGF2ZSByZXR1cm5lZCB3aXRoICR7XG4gICAgICAgICAgaW5zcGVjdEFyZyhleHBlY3RlZClcbiAgICAgICAgfSwgYnV0IGl0IGRpZCBub3RgO1xuICAgICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKFxuICAgICAgICBjb250ZXh0LmN1c3RvbU1lc3NhZ2VcbiAgICAgICAgICA/IGAke2NvbnRleHQuY3VzdG9tTWVzc2FnZX06ICR7ZGVmYXVsdE1lc3NhZ2V9YFxuICAgICAgICAgIDogZGVmYXVsdE1lc3NhZ2UsXG4gICAgICApO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gdG9IYXZlTGFzdFJldHVybmVkV2l0aChcbiAgY29udGV4dDogTWF0Y2hlckNvbnRleHQsXG4gIGV4cGVjdGVkOiB1bmtub3duLFxuKTogTWF0Y2hSZXN1bHQge1xuICBjb25zdCBjYWxscyA9IGdldE1vY2tDYWxscyhjb250ZXh0LnZhbHVlKTtcbiAgY29uc3QgcmV0dXJuZWQgPSBjYWxscy5maWx0ZXIoKGNhbGwpID0+IGNhbGwucmV0dXJucyk7XG4gIGNvbnN0IGxhc3RSZXR1cm5lZFdpdGhFeHBlY3RlZCA9IHJldHVybmVkLmxlbmd0aCA+IDAgJiZcbiAgICBlcXVhbChyZXR1cm5lZC5hdCgtMSk/LnJldHVybmVkLCBleHBlY3RlZCk7XG5cbiAgaWYgKGNvbnRleHQuaXNOb3QpIHtcbiAgICBpZiAobGFzdFJldHVybmVkV2l0aEV4cGVjdGVkKSB7XG4gICAgICBjb25zdCBkZWZhdWx0TWVzc2FnZSA9XG4gICAgICAgIGBFeHBlY3RlZCB0aGUgbW9jayBmdW5jdGlvbiB0byBub3QgaGF2ZSBsYXN0IHJldHVybmVkIHdpdGggJHtcbiAgICAgICAgICBpbnNwZWN0QXJnKGV4cGVjdGVkKVxuICAgICAgICB9LCBidXQgaXQgZGlkYDtcbiAgICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihcbiAgICAgICAgY29udGV4dC5jdXN0b21NZXNzYWdlXG4gICAgICAgICAgPyBgJHtjb250ZXh0LmN1c3RvbU1lc3NhZ2V9OiAke2RlZmF1bHRNZXNzYWdlfWBcbiAgICAgICAgICA6IGRlZmF1bHRNZXNzYWdlLFxuICAgICAgKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKCFsYXN0UmV0dXJuZWRXaXRoRXhwZWN0ZWQpIHtcbiAgICAgIGNvbnN0IGRlZmF1bHRNZXNzYWdlID1cbiAgICAgICAgYEV4cGVjdGVkIHRoZSBtb2NrIGZ1bmN0aW9uIHRvIGhhdmUgbGFzdCByZXR1cm5lZCB3aXRoICR7XG4gICAgICAgICAgaW5zcGVjdEFyZyhleHBlY3RlZClcbiAgICAgICAgfSwgYnV0IGl0IGRpZCBub3RgO1xuICAgICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKFxuICAgICAgICBjb250ZXh0LmN1c3RvbU1lc3NhZ2VcbiAgICAgICAgICA/IGAke2NvbnRleHQuY3VzdG9tTWVzc2FnZX06ICR7ZGVmYXVsdE1lc3NhZ2V9YFxuICAgICAgICAgIDogZGVmYXVsdE1lc3NhZ2UsXG4gICAgICApO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gdG9IYXZlTnRoUmV0dXJuZWRXaXRoKFxuICBjb250ZXh0OiBNYXRjaGVyQ29udGV4dCxcbiAgbnRoOiBudW1iZXIsXG4gIGV4cGVjdGVkOiB1bmtub3duLFxuKTogTWF0Y2hSZXN1bHQge1xuICBpZiAobnRoIDwgMSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgbnRoKCR7bnRofSkgbXVzdCBiZSBncmVhdGVyIHRoYW4gMGApO1xuICB9XG5cbiAgY29uc3QgY2FsbHMgPSBnZXRNb2NrQ2FsbHMoY29udGV4dC52YWx1ZSk7XG4gIGNvbnN0IHJldHVybmVkID0gY2FsbHMuZmlsdGVyKChjYWxsKSA9PiBjYWxsLnJldHVybnMpO1xuICBjb25zdCByZXR1cm5JbmRleCA9IG50aCAtIDE7XG4gIGNvbnN0IG1heWJlTnRoUmV0dXJuZWQgPSByZXR1cm5lZFtyZXR1cm5JbmRleF07XG4gIGNvbnN0IG50aFJldHVybmVkV2l0aEV4cGVjdGVkID0gbWF5YmVOdGhSZXR1cm5lZCAmJlxuICAgIGVxdWFsKG1heWJlTnRoUmV0dXJuZWQucmV0dXJuZWQsIGV4cGVjdGVkKTtcblxuICBpZiAoY29udGV4dC5pc05vdCkge1xuICAgIGlmIChudGhSZXR1cm5lZFdpdGhFeHBlY3RlZCkge1xuICAgICAgY29uc3QgZGVmYXVsdE1lc3NhZ2UgPVxuICAgICAgICBgRXhwZWN0ZWQgdGhlIG1vY2sgZnVuY3Rpb24gdG8gbm90IGhhdmUgbi10aCAobj0ke250aH0pIHJldHVybmVkIHdpdGggJHtcbiAgICAgICAgICBpbnNwZWN0QXJnKGV4cGVjdGVkKVxuICAgICAgICB9LCBidXQgaXQgZGlkYDtcbiAgICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihcbiAgICAgICAgY29udGV4dC5jdXN0b21NZXNzYWdlXG4gICAgICAgICAgPyBgJHtjb250ZXh0LmN1c3RvbU1lc3NhZ2V9OiAke2RlZmF1bHRNZXNzYWdlfWBcbiAgICAgICAgICA6IGRlZmF1bHRNZXNzYWdlLFxuICAgICAgKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKCFudGhSZXR1cm5lZFdpdGhFeHBlY3RlZCkge1xuICAgICAgY29uc3QgZGVmYXVsdE1lc3NhZ2UgPVxuICAgICAgICBgRXhwZWN0ZWQgdGhlIG1vY2sgZnVuY3Rpb24gdG8gaGF2ZSBuLXRoIChuPSR7bnRofSkgcmV0dXJuZWQgd2l0aCAke1xuICAgICAgICAgIGluc3BlY3RBcmcoZXhwZWN0ZWQpXG4gICAgICAgIH0sIGJ1dCBpdCBkaWQgbm90YDtcbiAgICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihcbiAgICAgICAgY29udGV4dC5jdXN0b21NZXNzYWdlXG4gICAgICAgICAgPyBgJHtjb250ZXh0LmN1c3RvbU1lc3NhZ2V9OiAke2RlZmF1bHRNZXNzYWdlfWBcbiAgICAgICAgICA6IGRlZmF1bHRNZXNzYWdlLFxuICAgICAgKTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRvVGhyb3c8RSBleHRlbmRzIEVycm9yID0gRXJyb3I+KFxuICBjb250ZXh0OiBNYXRjaGVyQ29udGV4dCxcbiAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgZXhwZWN0ZWQ/OiBzdHJpbmcgfCBSZWdFeHAgfCBFIHwgKG5ldyAoLi4uYXJnczogYW55W10pID0+IEUpLFxuKTogTWF0Y2hSZXN1bHQge1xuICBpZiAodHlwZW9mIGNvbnRleHQudmFsdWUgPT09IFwiZnVuY3Rpb25cIikge1xuICAgIHRyeSB7XG4gICAgICBjb250ZXh0LnZhbHVlID0gY29udGV4dC52YWx1ZSgpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgY29udGV4dC52YWx1ZSA9IGVycjtcbiAgICB9XG4gIH1cblxuICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICB0eXBlIEVycm9yQ2xhc3MgPSBuZXcgKC4uLmFyZ3M6IGFueVtdKSA9PiBFcnJvcjtcbiAgbGV0IGV4cGVjdENsYXNzOiB1bmRlZmluZWQgfCBFcnJvckNsYXNzID0gdW5kZWZpbmVkO1xuICBsZXQgZXhwZWN0TWVzc2FnZTogdW5kZWZpbmVkIHwgc3RyaW5nIHwgUmVnRXhwID0gdW5kZWZpbmVkO1xuICBpZiAoZXhwZWN0ZWQgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgIGV4cGVjdENsYXNzID0gZXhwZWN0ZWQuY29uc3RydWN0b3IgYXMgRXJyb3JDbGFzcztcbiAgICBleHBlY3RNZXNzYWdlID0gZXhwZWN0ZWQubWVzc2FnZTtcbiAgfVxuICBpZiAoZXhwZWN0ZWQgaW5zdGFuY2VvZiBGdW5jdGlvbikge1xuICAgIGV4cGVjdENsYXNzID0gZXhwZWN0ZWQgYXMgRXJyb3JDbGFzcztcbiAgfVxuICBpZiAodHlwZW9mIGV4cGVjdGVkID09PSBcInN0cmluZ1wiIHx8IGV4cGVjdGVkIGluc3RhbmNlb2YgUmVnRXhwKSB7XG4gICAgZXhwZWN0TWVzc2FnZSA9IGV4cGVjdGVkO1xuICB9XG5cbiAgaWYgKGNvbnRleHQuaXNOb3QpIHtcbiAgICBsZXQgaXNFcnJvciA9IGZhbHNlO1xuICAgIHRyeSB7XG4gICAgICBhc3NlcnRJc0Vycm9yKFxuICAgICAgICBjb250ZXh0LnZhbHVlLFxuICAgICAgICBleHBlY3RDbGFzcyxcbiAgICAgICAgZXhwZWN0TWVzc2FnZSxcbiAgICAgICAgY29udGV4dC5jdXN0b21NZXNzYWdlLFxuICAgICAgKTtcbiAgICAgIGlzRXJyb3IgPSB0cnVlO1xuICAgICAgY29uc3QgZGVmYXVsdE1lc3NhZ2UgPSBgRXhwZWN0ZWQgdG8gTk9UIHRocm93ICR7ZXhwZWN0ZWR9YDtcbiAgICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihcbiAgICAgICAgY29udGV4dC5jdXN0b21NZXNzYWdlXG4gICAgICAgICAgPyBgJHtjb250ZXh0LmN1c3RvbU1lc3NhZ2V9OiAke2RlZmF1bHRNZXNzYWdlfWBcbiAgICAgICAgICA6IGRlZmF1bHRNZXNzYWdlLFxuICAgICAgKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBpZiAoaXNFcnJvcikge1xuICAgICAgICB0aHJvdyBlO1xuICAgICAgfVxuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfVxuICByZXR1cm4gYXNzZXJ0SXNFcnJvcihcbiAgICBjb250ZXh0LnZhbHVlLFxuICAgIGV4cGVjdENsYXNzLFxuICAgIGV4cGVjdE1lc3NhZ2UsXG4gICAgY29udGV4dC5jdXN0b21NZXNzYWdlLFxuICApO1xufVxuIiwgIi8vIENvcHlyaWdodCAyMDE4LTIwMjUgdGhlIERlbm8gYXV0aG9ycy4gTUlUIGxpY2Vuc2UuXG5cbmltcG9ydCB0eXBlIHsgU25hcHNob3RQbHVnaW4gfSBmcm9tIFwiLi9fdHlwZXMudHNcIjtcblxuY29uc3QgSU5URVJOQUxfUExVR0lOUzogU25hcHNob3RQbHVnaW5bXSA9IFtcbiAgLy8gVE9ETyhlcnl1ZTAyMjApOiBzdXBwb3J0IGludGVybmFsIHNuYXBzaG90IHNlcmlhbGl6ZXIgcGx1Z2luc1xuXTtcblxuZXhwb3J0IGZ1bmN0aW9uIGFkZFNlcmlhbGl6ZXIocGx1Z2luOiBTbmFwc2hvdFBsdWdpbikge1xuICBJTlRFUk5BTF9QTFVHSU5TLnVuc2hpZnQocGx1Z2luKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFNlcmlhbGl6ZXIoKSB7XG4gIHJldHVybiBJTlRFUk5BTF9QTFVHSU5TO1xufVxuIiwgIi8vIENvcHlyaWdodCAyMDE4LTIwMjUgdGhlIERlbm8gYXV0aG9ycy4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG4vLyBDb3B5cmlnaHQgMjAxOSBBbGxhaW4gTGFsb25kZS4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gSVNDIExpY2Vuc2UuXG4vLyBDb3B5cmlnaHQgKGMpIE1ldGEgUGxhdGZvcm1zLCBJbmMuIGFuZCBhZmZpbGlhdGVzLlxuLy8gVGhlIGRvY3VtZW50YXRpb24gaXMgZXh0cmFjdGVkIGZyb20gaHR0cHM6Ly9naXRodWIuY29tL2plc3Rqcy9qZXN0L2Jsb2IvbWFpbi93ZWJzaXRlL3ZlcnNpb25lZF9kb2NzL3ZlcnNpb24tMjkuNy9FeHBlY3RBUEkubWRcbi8vIGFuZCB1cGRhdGVkIGZvciB0aGUgRGVubyBlY29zeXN0ZW0uXG5cbmltcG9ydCB0eXBlIHtcbiAgRXhwZWN0ZWQsXG4gIEV4dGVuZE1hdGNoUmVzdWx0LFxuICBNYXRjaGVyLFxuICBNYXRjaGVyQ29udGV4dCxcbiAgTWF0Y2hlcktleSxcbiAgTWF0Y2hlcnMsXG59IGZyb20gXCIuL190eXBlcy50c1wiO1xuaW1wb3J0IHsgQXNzZXJ0aW9uRXJyb3IgfSBmcm9tIFwianNyOkBzdGQvYXNzZXJ0QF4xLjAuMTQvYXNzZXJ0aW9uLWVycm9yXCI7XG5pbXBvcnQge1xuICBhc3NlcnRpb25zLFxuICBlbWl0QXNzZXJ0aW9uVHJpZ2dlcixcbiAgaGFzQXNzZXJ0aW9ucyxcbn0gZnJvbSBcIi4vX2Fzc2VydGlvbnMudHNcIjtcbmltcG9ydCB7XG4gIGFkZEN1c3RvbUVxdWFsaXR5VGVzdGVycyxcbiAgZ2V0Q3VzdG9tRXF1YWxpdHlUZXN0ZXJzLFxufSBmcm9tIFwiLi9fY3VzdG9tX2VxdWFsaXR5X3Rlc3Rlci50c1wiO1xuaW1wb3J0IHsgZXF1YWwgfSBmcm9tIFwiLi9fZXF1YWwudHNcIjtcbmltcG9ydCB7IGdldEV4dGVuZE1hdGNoZXJzLCBzZXRFeHRlbmRNYXRjaGVycyB9IGZyb20gXCIuL19leHRlbmQudHNcIjtcbmltcG9ydCB7XG4gIHRvQmUsXG4gIHRvQmVDbG9zZVRvLFxuICB0b0JlRGVmaW5lZCxcbiAgdG9CZUZhbHN5LFxuICB0b0JlR3JlYXRlclRoYW4sXG4gIHRvQmVHcmVhdGVyVGhhbk9yRXF1YWwsXG4gIHRvQmVJbnN0YW5jZU9mLFxuICB0b0JlTGVzc1RoYW4sXG4gIHRvQmVMZXNzVGhhbk9yRXF1YWwsXG4gIHRvQmVOYU4sXG4gIHRvQmVOdWxsLFxuICB0b0JlVHJ1dGh5LFxuICB0b0JlVW5kZWZpbmVkLFxuICB0b0NvbnRhaW4sXG4gIHRvQ29udGFpbkVxdWFsLFxuICB0b0VxdWFsLFxuICB0b0hhdmVCZWVuQ2FsbGVkLFxuICB0b0hhdmVCZWVuQ2FsbGVkVGltZXMsXG4gIHRvSGF2ZUJlZW5DYWxsZWRXaXRoLFxuICB0b0hhdmVCZWVuTGFzdENhbGxlZFdpdGgsXG4gIHRvSGF2ZUJlZW5OdGhDYWxsZWRXaXRoLFxuICB0b0hhdmVMYXN0UmV0dXJuZWRXaXRoLFxuICB0b0hhdmVMZW5ndGgsXG4gIHRvSGF2ZU50aFJldHVybmVkV2l0aCxcbiAgdG9IYXZlUHJvcGVydHksXG4gIHRvSGF2ZVJldHVybmVkLFxuICB0b0hhdmVSZXR1cm5lZFRpbWVzLFxuICB0b0hhdmVSZXR1cm5lZFdpdGgsXG4gIHRvTWF0Y2gsXG4gIHRvTWF0Y2hPYmplY3QsXG4gIHRvU3RyaWN0RXF1YWwsXG4gIHRvVGhyb3csXG59IGZyb20gXCIuL19tYXRjaGVycy50c1wiO1xuaW1wb3J0IHsgYWRkU2VyaWFsaXplciB9IGZyb20gXCIuL19zZXJpYWxpemVyLnRzXCI7XG5pbXBvcnQgeyBpc1Byb21pc2VMaWtlIH0gZnJvbSBcIi4vX3V0aWxzLnRzXCI7XG5pbXBvcnQgKiBhcyBhc3ltbWV0cmljTWF0Y2hlcnMgZnJvbSBcIi4vX2FzeW1tZXRyaWNfbWF0Y2hlcnMudHNcIjtcbmltcG9ydCB0eXBlIHsgU25hcHNob3RQbHVnaW4sIFRlc3RlciB9IGZyb20gXCIuL190eXBlcy50c1wiO1xuXG5leHBvcnQgdHlwZSB7IEFueUNvbnN0cnVjdG9yLCBBc3luYywgRXhwZWN0ZWQgfSBmcm9tIFwiLi9fdHlwZXMudHNcIjtcblxuY29uc3QgbWF0Y2hlcnM6IFJlY29yZDxNYXRjaGVyS2V5LCBNYXRjaGVyPiA9IHtcbiAgbGFzdENhbGxlZFdpdGg6IHRvSGF2ZUJlZW5MYXN0Q2FsbGVkV2l0aCxcbiAgbGFzdFJldHVybmVkV2l0aDogdG9IYXZlTGFzdFJldHVybmVkV2l0aCxcbiAgbnRoQ2FsbGVkV2l0aDogdG9IYXZlQmVlbk50aENhbGxlZFdpdGgsXG4gIG50aFJldHVybmVkV2l0aDogdG9IYXZlTnRoUmV0dXJuZWRXaXRoLFxuICB0b0JlQ2FsbGVkOiB0b0hhdmVCZWVuQ2FsbGVkLFxuICB0b0JlQ2FsbGVkVGltZXM6IHRvSGF2ZUJlZW5DYWxsZWRUaW1lcyxcbiAgdG9CZUNhbGxlZFdpdGg6IHRvSGF2ZUJlZW5DYWxsZWRXaXRoLFxuICB0b0JlQ2xvc2VUbyxcbiAgdG9CZURlZmluZWQsXG4gIHRvQmVGYWxzeSxcbiAgdG9CZUdyZWF0ZXJUaGFuT3JFcXVhbCxcbiAgdG9CZUdyZWF0ZXJUaGFuLFxuICB0b0JlSW5zdGFuY2VPZixcbiAgdG9CZUxlc3NUaGFuT3JFcXVhbCxcbiAgdG9CZUxlc3NUaGFuLFxuICB0b0JlTmFOLFxuICB0b0JlTnVsbCxcbiAgdG9CZVRydXRoeSxcbiAgdG9CZVVuZGVmaW5lZCxcbiAgdG9CZSxcbiAgdG9Db250YWluRXF1YWwsXG4gIHRvQ29udGFpbixcbiAgdG9FcXVhbCxcbiAgdG9IYXZlQmVlbkNhbGxlZFRpbWVzLFxuICB0b0hhdmVCZWVuQ2FsbGVkV2l0aCxcbiAgdG9IYXZlQmVlbkNhbGxlZCxcbiAgdG9IYXZlQmVlbkxhc3RDYWxsZWRXaXRoLFxuICB0b0hhdmVCZWVuTnRoQ2FsbGVkV2l0aCxcbiAgdG9IYXZlTGVuZ3RoLFxuICB0b0hhdmVMYXN0UmV0dXJuZWRXaXRoLFxuICB0b0hhdmVOdGhSZXR1cm5lZFdpdGgsXG4gIHRvSGF2ZVByb3BlcnR5LFxuICB0b0hhdmVSZXR1cm5lZFRpbWVzLFxuICB0b0hhdmVSZXR1cm5lZFdpdGgsXG4gIHRvSGF2ZVJldHVybmVkLFxuICB0b01hdGNoT2JqZWN0LFxuICB0b01hdGNoLFxuICB0b1JldHVybjogdG9IYXZlUmV0dXJuZWQsXG4gIHRvUmV0dXJuVGltZXM6IHRvSGF2ZVJldHVybmVkVGltZXMsXG4gIHRvUmV0dXJuV2l0aDogdG9IYXZlUmV0dXJuZWRXaXRoLFxuICB0b1N0cmljdEVxdWFsLFxuICB0b1Rocm93LFxufTtcblxuLyoqXG4gKiAqKk5vdGU6KiogdGhlIGRvY3VtZW50YXRpb24gZm9yIHRoaXMgbW9kdWxlIGlzIHRha2VuIGZyb20gW0plc3RdKGh0dHBzOi8vZ2l0aHViLmNvbS9qZXN0anMvamVzdC9ibG9iL21haW4vd2Vic2l0ZS92ZXJzaW9uZWRfZG9jcy92ZXJzaW9uLTI5LjcvRXhwZWN0QVBJLm1kKVxuICogYW5kIHRoZSBleGFtcGxlcyBhcmUgdXBkYXRlZCBmb3IgRGVuby5cbiAqXG4gKiBUaGUgYGV4cGVjdGAgZnVuY3Rpb24gaXMgdXNlZCB0byB0ZXN0IGEgdmFsdWUuIFlvdSB3aWxsIHVzZSBgZXhwZWN0YCBhbG9uZyB3aXRoIGFcbiAqIFwibWF0Y2hlclwiIGZ1bmN0aW9uIHRvIGFzc2VydCBzb21ldGhpbmcgYWJvdXQgYSB2YWx1ZS5cbiAqXG4gKiBAZXhhbXBsZSBVc2FnZVxuICogYGBgdHMgbm8tYXNzZXJ0XG4gKiBpbXBvcnQgeyBleHBlY3QgfSBmcm9tIFwiQHN0ZC9leHBlY3RcIjtcbiAqXG4gKiBmdW5jdGlvbiBiZXN0TGFDcm9peEZsYXZvcigpOiBzdHJpbmcge1xuICogIHJldHVybiBcImdyYXBlZnJ1aXRcIjtcbiAqIH1cbiAqXG4gKiBEZW5vLnRlc3QoXCJ0aGUgYmVzdCBmbGF2b3IgaXMgZ3JhcGVmcnVpdFwiLCAoKSA9PiB7XG4gKiAgZXhwZWN0KGJlc3RMYUNyb2l4Rmxhdm9yKCkpLnRvQmUoXCJncmFwZWZydWl0XCIpO1xuICogfSk7XG4gKiBgYGBcbiAqXG4gKiBJbiB0aGlzIGNhc2UsIGB0b0JlYCBpcyB0aGUgbWF0Y2hlciBmdW5jdGlvbi4gVGhlcmUgYXJlIGEgbG90IG9mIGRpZmZlcmVudFxuICogbWF0Y2hlciBmdW5jdGlvbnMsIGRvY3VtZW50ZWQgaW4gdGhlIG1haW4gbW9kdWxlIGRlc2NyaXB0aW9uLlxuICpcbiAqIFRoZSBhcmd1bWVudCB0byBgZXhwZWN0YCBzaG91bGQgYmUgdGhlIHZhbHVlIHRoYXQgeW91ciBjb2RlIHByb2R1Y2VzLCBhbmQgYW55XG4gKiBhcmd1bWVudCB0byB0aGUgbWF0Y2hlciBzaG91bGQgYmUgdGhlIGNvcnJlY3QgdmFsdWUuIElmIHlvdSBtaXggdGhlbSB1cCwgeW91clxuICogdGVzdHMgd2lsbCBzdGlsbCB3b3JrLCBidXQgdGhlIGVycm9yIG1lc3NhZ2VzIG9uIGZhaWxpbmcgdGVzdHMgd2lsbCBsb29rXG4gKiBzdHJhbmdlLlxuICpcbiAqIEBwYXJhbSB2YWx1ZSBUaGUgdmFsdWUgdG8gcGVyZm9ybSBhc3NlcnRpb25zIG9uLlxuICogQHBhcmFtIGN1c3RvbU1lc3NhZ2UgQW4gb3B0aW9uYWwgY3VzdG9tIG1lc3NhZ2UgdG8gaW5jbHVkZSBpbiB0aGUgYXNzZXJ0aW9uIGVycm9yLlxuICogQHJldHVybnMgQW4gZXhwZWN0ZWQgb2JqZWN0IHRoYXQgY2FuIGJlIHVzZWQgdG8gY2hhaW4gbWF0Y2hlcnMuXG4gKlxuICogQHR5cGVQYXJhbSBUIFRoZSBpbnRlcmZhY2UgdXNlZCBmb3IgYGV4cGVjdGAuIFRoaXMgaXMgdXN1YWxseSBuZWVkZWQgb25seSBpZiB5b3Ugd2FudCB0byB1c2UgYGV4cGVjdC5leHRlbmRgIHRvIGNyZWF0ZSBjdXN0b20gbWF0Y2hlcnMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBleHBlY3Q8VCBleHRlbmRzIEV4cGVjdGVkID0gRXhwZWN0ZWQ+KFxuICB2YWx1ZTogdW5rbm93bixcbiAgY3VzdG9tTWVzc2FnZT86IHN0cmluZyxcbik6IFQge1xuICBsZXQgaXNOb3QgPSBmYWxzZTtcbiAgbGV0IGlzUHJvbWlzZWQgPSBmYWxzZTtcbiAgY29uc3Qgc2VsZjogVCA9IG5ldyBQcm94eTxUPig8VD4ge30sIHtcbiAgICBnZXQoXywgbmFtZSkge1xuICAgICAgaWYgKG5hbWUgPT09IFwibm90XCIpIHtcbiAgICAgICAgaXNOb3QgPSAhaXNOb3Q7XG4gICAgICAgIHJldHVybiBzZWxmO1xuICAgICAgfVxuXG4gICAgICBpZiAobmFtZSA9PT0gXCJyZXNvbHZlc1wiKSB7XG4gICAgICAgIGlmICghaXNQcm9taXNlTGlrZSh2YWx1ZSkpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IoXCJFeHBlY3RlZCB2YWx1ZSBtdXN0IGJlIFByb21pc2VMaWtlXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgaXNQcm9taXNlZCA9IHRydWU7XG4gICAgICAgIHJldHVybiBzZWxmO1xuICAgICAgfVxuXG4gICAgICBpZiAobmFtZSA9PT0gXCJyZWplY3RzXCIpIHtcbiAgICAgICAgaWYgKCFpc1Byb21pc2VMaWtlKHZhbHVlKSkge1xuICAgICAgICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihcIkV4cGVjdGVkIHZhbHVlIG11c3QgYmUgYSBQcm9taXNlTGlrZVwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhbHVlID0gdmFsdWUudGhlbihcbiAgICAgICAgICAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihcbiAgICAgICAgICAgICAgYFByb21pc2UgZGlkIG5vdCByZWplY3Q6IHJlc29sdmVkIHRvICR7dmFsdWV9YCxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfSxcbiAgICAgICAgICAoZXJyKSA9PiBlcnIsXG4gICAgICAgICk7XG4gICAgICAgIGlzUHJvbWlzZWQgPSB0cnVlO1xuICAgICAgICByZXR1cm4gc2VsZjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgZXh0ZW5kTWF0Y2hlcnM6IE1hdGNoZXJzID0gZ2V0RXh0ZW5kTWF0Y2hlcnMoKTtcbiAgICAgIGNvbnN0IGFsbE1hdGNoZXJzID0ge1xuICAgICAgICAuLi5tYXRjaGVycyxcbiAgICAgICAgLi4uZXh0ZW5kTWF0Y2hlcnMsXG4gICAgICB9O1xuICAgICAgY29uc3QgbWF0Y2hlciA9IGFsbE1hdGNoZXJzW25hbWUgYXMgTWF0Y2hlcktleV0gYXMgTWF0Y2hlcjtcbiAgICAgIGlmICghbWF0Y2hlcikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICAgIHR5cGVvZiBuYW1lID09PSBcInN0cmluZ1wiXG4gICAgICAgICAgICA/IGBtYXRjaGVyIG5vdCBmb3VuZDogJHtuYW1lfWBcbiAgICAgICAgICAgIDogXCJtYXRjaGVyIG5vdCBmb3VuZFwiLFxuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gKC4uLmFyZ3M6IHVua25vd25bXSkgPT4ge1xuICAgICAgICBmdW5jdGlvbiBhcHBseU1hdGNoZXIodmFsdWU6IHVua25vd24sIGFyZ3M6IHVua25vd25bXSkge1xuICAgICAgICAgIGNvbnN0IGNvbnRleHQ6IE1hdGNoZXJDb250ZXh0ID0ge1xuICAgICAgICAgICAgdmFsdWUsXG4gICAgICAgICAgICBlcXVhbCxcbiAgICAgICAgICAgIGlzTm90OiBmYWxzZSxcbiAgICAgICAgICAgIGN1c3RvbU1lc3NhZ2UsXG4gICAgICAgICAgICBjdXN0b21UZXN0ZXJzOiBnZXRDdXN0b21FcXVhbGl0eVRlc3RlcnMoKSxcbiAgICAgICAgICB9O1xuICAgICAgICAgIGlmIChpc05vdCkge1xuICAgICAgICAgICAgY29udGV4dC5pc05vdCA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChuYW1lIGluIGV4dGVuZE1hdGNoZXJzKSB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBtYXRjaGVyKGNvbnRleHQsIC4uLmFyZ3MpIGFzIEV4dGVuZE1hdGNoUmVzdWx0O1xuICAgICAgICAgICAgaWYgKGNvbnRleHQuaXNOb3QpIHtcbiAgICAgICAgICAgICAgaWYgKHJlc3VsdC5wYXNzKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKHJlc3VsdC5tZXNzYWdlKCkpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKCFyZXN1bHQucGFzcykge1xuICAgICAgICAgICAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IocmVzdWx0Lm1lc3NhZ2UoKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG1hdGNoZXIoY29udGV4dCwgLi4uYXJncyk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgZW1pdEFzc2VydGlvblRyaWdnZXIoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBpc1Byb21pc2VkXG4gICAgICAgICAgPyAodmFsdWUgYXMgUHJvbWlzZTx1bmtub3duPikudGhlbigodmFsdWU6IHVua25vd24pID0+XG4gICAgICAgICAgICBhcHBseU1hdGNoZXIodmFsdWUsIGFyZ3MpXG4gICAgICAgICAgKVxuICAgICAgICAgIDogYXBwbHlNYXRjaGVyKHZhbHVlLCBhcmdzKTtcbiAgICAgIH07XG4gICAgfSxcbiAgfSk7XG5cbiAgcmV0dXJuIHNlbGY7XG59XG5cbi8qKlxuICogWW91IGNhbiB1c2UgYGV4cGVjdC5hZGRFcXVhbGl0eVRlc3RlcnNgIHRvIGFkZCB5b3VyIG93biBtZXRob2RzIHRvIHRlc3QgaWYgdHdvXG4gKiBvYmplY3RzIGFyZSBlcXVhbC4gRm9yIGV4YW1wbGUsIGxldCdzIHNheSB5b3UgaGF2ZSBhIGNsYXNzIGluIHlvdXIgY29kZSB0aGF0XG4gKiByZXByZXNlbnRzIHZvbHVtZSBhbmQgY2FuIGRldGVybWluZSBpZiB0d28gdm9sdW1lcyB1c2luZyBkaWZmZXJlbnQgdW5pdHMgYXJlXG4gKiBlcXVhbC4gWW91IG1heSB3YW50IGB0b0VxdWFsYCAoYW5kIG90aGVyIGVxdWFsaXR5IG1hdGNoZXJzKSB0byB1c2UgdGhpcyBjdXN0b21cbiAqIGVxdWFsaXR5IG1ldGhvZCB3aGVuIGNvbXBhcmluZyB0byBWb2x1bWUgY2xhc3Nlcy4gWW91IGNhbiBhZGQgYSBjdXN0b20gZXF1YWxpdHlcbiAqIHRlc3RlciB0byBoYXZlIGB0b0VxdWFsYCBkZXRlY3QgYW5kIGFwcGx5IGN1c3RvbSBsb2dpYyB3aGVuIGNvbXBhcmluZyBWb2x1bWVcbiAqIGNsYXNzZXM6XG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBleHBlY3QgfSBmcm9tIFwiQHN0ZC9leHBlY3RcIjtcbiAqXG4gKiBjbGFzcyBWb2x1bWUge1xuICogICBhbW91bnQ6IG51bWJlcjtcbiAqICAgdW5pdDogXCJMXCIgfCBcIm1MXCI7XG4gKlxuICogICBjb25zdHJ1Y3RvcihhbW91bnQ6IG51bWJlciwgdW5pdDogXCJMXCIgfCBcIm1MXCIpIHtcbiAqICAgICB0aGlzLmFtb3VudCA9IGFtb3VudDtcbiAqICAgICB0aGlzLnVuaXQgPSB1bml0O1xuICogICB9XG4gKlxuICogICB0b1N0cmluZygpIHtcbiAqICAgICByZXR1cm4gYFtWb2x1bWUgJHt0aGlzLmFtb3VudH0ke3RoaXMudW5pdH1dYDtcbiAqICAgfVxuICpcbiAqICAgZXF1YWxzKG90aGVyOiBWb2x1bWUpIHtcbiAqICAgICBpZiAodGhpcy51bml0ID09PSBvdGhlci51bml0KSB7XG4gKiAgICAgICByZXR1cm4gdGhpcy5hbW91bnQgPT09IG90aGVyLmFtb3VudDtcbiAqICAgICB9IGVsc2UgaWYgKHRoaXMudW5pdCA9PT0gXCJMXCIgJiYgb3RoZXIudW5pdCA9PT0gXCJtTFwiKSB7XG4gKiAgICAgICByZXR1cm4gdGhpcy5hbW91bnQgKiAxMDAwID09PSBvdGhlci5hbW91bnQ7XG4gKiAgICAgfSBlbHNlIHtcbiAqICAgICAgIHJldHVybiB0aGlzLmFtb3VudCA9PT0gb3RoZXIuYW1vdW50ICogMTAwMDtcbiAqICAgICB9XG4gKiAgIH1cbiAqIH1cbiAqXG4gKiBmdW5jdGlvbiBhcmVWb2x1bWVzRXF1YWwoYTogVm9sdW1lLCBiOiBWb2x1bWUpIHtcbiAqICAgY29uc3QgaXNBVm9sdW1lID0gYSBpbnN0YW5jZW9mIFZvbHVtZTtcbiAqICAgY29uc3QgaXNCVm9sdW1lID0gYiBpbnN0YW5jZW9mIFZvbHVtZTtcbiAqICAgaWYgKGlzQVZvbHVtZSAmJiBpc0JWb2x1bWUpIHtcbiAqICAgICByZXR1cm4gYS5lcXVhbHMoYik7XG4gKiAgIH0gZWxzZSBpZiAoaXNBVm9sdW1lID09PSBpc0JWb2x1bWUpIHtcbiAqICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICogICB9IGVsc2Uge1xuICogICAgIHJldHVybiBmYWxzZTtcbiAqICAgfVxuICogfVxuICpcbiAqIGV4cGVjdC5hZGRFcXVhbGl0eVRlc3RlcnMoW2FyZVZvbHVtZXNFcXVhbF0pO1xuICpcbiAqIERlbm8udGVzdChcImFyZSBlcXVhbCB3aXRoIGRpZmZlcmVudCB1bml0c1wiLCAoKSA9PiB7XG4gKiAgIGV4cGVjdChuZXcgVm9sdW1lKDEsIFwiTFwiKSkudG9FcXVhbChuZXcgVm9sdW1lKDEwMDAsIFwibUxcIikpO1xuICogfSk7XG4gKiBgYGBcbiAqL1xuZXhwZWN0LmFkZEVxdWFsaXR5VGVzdGVycyA9IGFkZEN1c3RvbUVxdWFsaXR5VGVzdGVycyBhcyAoXG4gIG5ld1Rlc3RlcnM6IFRlc3RlcltdLFxuKSA9PiB2b2lkO1xuLyoqXG4gKiBFeHRlbmQgYGV4cGVjdCgpYCB3aXRoIGN1c3RvbSBwcm92aWRlZCBtYXRjaGVycy5cbiAqXG4gKiBUbyBkbyBzbywgeW91IHdpbGwgbmVlZCB0byBleHRlbmQgdGhlIGludGVyZmFjZSBgRXhwZWN0ZWRgIHRvIGRlZmluZSB0aGUgbmV3IHNpZ25hdHVyZSBvZiB0aGUgYGV4cGVjdGAuXG4gKlxuICogYGBgdHNcbiAqIGltcG9ydCB0eXBlIHsgQXN5bmMsIEV4cGVjdGVkIH0gZnJvbSBcIi4vZXhwZWN0LnRzXCI7XG4gKiBpbXBvcnQgeyBleHBlY3QgfSBmcm9tIFwiLi9leHBlY3QudHNcIjtcbiAqXG4gKiAvLyBFeHRlbmRzIHRoZSBgRXhwZWN0ZWRgIGludGVyZmFjZSB3aXRoIHlvdXIgbmV3IG1hdGNoZXJzIHNpZ25hdHVyZXNcbiAqIGludGVyZmFjZSBFeHRlbmRlZEV4cGVjdGVkPElzQXN5bmMgPSBmYWxzZT4gZXh0ZW5kcyBFeHBlY3RlZDxJc0FzeW5jPiB7XG4gKiAgIC8vIE1hdGNoZXIgdGhhdCBhc3NlcnRzIHZhbHVlIGlzIGEgZGlub3NhdXJcbiAqICAgdG9CZURpbm9zYXVyOiAob3B0aW9ucz86IHsgaW5jbHVkZVRyZXhzPzogYm9vbGVhbiB9KSA9PiB1bmtub3duO1xuICpcbiAqICAgLy8gTk9URTogWW91IGFsc28gbmVlZCB0byBvdmVycmlkZXMgdGhlIGZvbGxvd2luZyB0eXBpbmdzIHRvIGFsbG93IG1vZGlmaWVycyB0byBjb3JyZWN0bHkgaW5mZXIgdHlwaW5nXG4gKiAgIG5vdDogSXNBc3luYyBleHRlbmRzIHRydWUgPyBBc3luYzxFeHRlbmRlZEV4cGVjdGVkPHRydWU+PlxuICogICAgIDogRXh0ZW5kZWRFeHBlY3RlZDxmYWxzZT47XG4gKiAgIHJlc29sdmVzOiBBc3luYzxFeHRlbmRlZEV4cGVjdGVkPHRydWU+PjtcbiAqICAgcmVqZWN0czogQXN5bmM8RXh0ZW5kZWRFeHBlY3RlZDx0cnVlPj47XG4gKiB9XG4gKlxuICogLy8gQ2FsbCBgZXhwZWN0LmV4dGVuZCgpYCB3aXRoIHlvdXIgbmV3IG1hdGNoZXJzIGRlZmluaXRpb25zXG4gKiBleHBlY3QuZXh0ZW5kKHtcbiAqICAgdG9CZURpbm9zYXVyKGNvbnRleHQsIG9wdGlvbnMpIHtcbiAqICAgICBjb25zdCBkaW5vID0gYCR7Y29udGV4dC52YWx1ZX1gO1xuICogICAgIGNvbnN0IGFsbG93ZWQgPSBbXCLwn6aVXCJdO1xuICogICAgIGlmIChvcHRpb25zPy5pbmNsdWRlVHJleHMpIHtcbiAqICAgICAgIGFsbG93ZWQucHVzaChcIvCfppZcIik7XG4gKiAgICAgfVxuICogICAgIGNvbnN0IHBhc3MgPSBhbGxvd2VkLmluY2x1ZGVzKGRpbm8pO1xuICogICAgIGlmIChjb250ZXh0LmlzTm90KSB7XG4gKiAgICAgICAvLyBOb3RlOiB3aGVuIGBjb250ZXh0LmlzTm90YCBpcyBzZXQsIHRoZSB0ZXN0IGlzIGNvbnNpZGVyZWQgc3VjY2Vzc2Z1bCB3aGVuIGBwYXNzYCBpcyBmYWxzZVxuICogICAgICAgcmV0dXJuIHtcbiAqICAgICAgICAgbWVzc2FnZTogKCkgPT4gYEV4cGVjdGVkIFwiJHtkaW5vfVwiIHRvIE5PVCBiZSBhIGRpbm9zYXVyYCxcbiAqICAgICAgICAgcGFzcyxcbiAqICAgICAgIH07XG4gKiAgICAgfVxuICogICAgIHJldHVybiB7IG1lc3NhZ2U6ICgpID0+IGBFeHBlY3RlZCBcIiR7ZGlub31cIiB0byBiZSBhIGRpbm9zYXVyYCwgcGFzcyB9O1xuICogICB9LFxuICogfSk7XG4gKlxuICogLy8gQWxpYXMgZXhwZWN0IHRvIGF2b2lkIGhhdmluZyB0byBwYXNzIHRoZSBnZW5lcmljIHR5cGluZyBhcmd1bWVudCBlYWNoIHRpbWVcbiAqIC8vIFRoaXMgaXMgcHJvYmFibHkgd2hhdCB5b3Ugd2FudCB0byBleHBvcnQgYW5kIHJldXNlIGFjcm9zcyB5b3VyIHRlc3RzXG4gKiBjb25zdCBteWV4cGVjdCA9IGV4cGVjdDxFeHRlbmRlZEV4cGVjdGVkPjtcbiAqXG4gKiAvLyBQZXJmb3JtIHNvbWUgdGVzdHNcbiAqIG15ZXhwZWN0KFwi8J+mlVwiKS50b0JlRGlub3NhdXIoKTtcbiAqIG15ZXhwZWN0KFwi8J+mp1wiKS5ub3QudG9CZURpbm9zYXVyKCk7XG4gKiBhd2FpdCBteWV4cGVjdChQcm9taXNlLnJlc29sdmUoXCLwn6aVXCIpKS5yZXNvbHZlcy50b0JlRGlub3NhdXIoKTtcbiAqIGF3YWl0IG15ZXhwZWN0KFByb21pc2UucmVzb2x2ZShcIvCfpqdcIikpLnJlc29sdmVzLm5vdC50b0JlRGlub3NhdXIoKTtcbiAqXG4gKiAvLyBSZWd1bGFyIG1hdGNoZXJzIHdpbGwgc3RpbGwgYmUgYXZhaWxhYmxlXG4gKiBteWV4cGVjdChcImZvb1wiKS5ub3QudG9CZU51bGwoKVxuICogbXlleHBlY3QuYW55dGhpbmdcbiAqIGBgYFxuICovXG5leHBlY3QuZXh0ZW5kID0gc2V0RXh0ZW5kTWF0Y2hlcnMgYXMgKG5ld0V4dGVuZE1hdGNoZXJzOiBNYXRjaGVycykgPT4gdm9pZDtcbi8qKlxuICogYGV4cGVjdC5hbnl0aGluZygpYCBtYXRjaGVzIGFueXRoaW5nIGJ1dCBgbnVsbGAgb3IgYHVuZGVmaW5lZGAuIFlvdSBjYW4gdXNlIGl0XG4gKiBpbnNpZGUgYHRvRXF1YWxgIG9yIGB0b0hhdmVCZWVuQ2FsbGVkV2l0aGAgaW5zdGVhZCBvZiBhIGxpdGVyYWwgdmFsdWUuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBleHBlY3QsIGZuIH0gZnJvbSBcIkBzdGQvZXhwZWN0XCI7XG4gKlxuICogRGVuby50ZXN0KFwibWFwIGNhbGxzIGl0cyBhcmd1bWVudCB3aXRoIGEgbm9uLW51bGwgYXJndW1lbnRcIiwgKCkgPT4ge1xuICogICBjb25zdCBtb2NrID0gZm4oKTtcbiAqICAgWzFdLm1hcCgoeCkgPT4gbW9jayh4KSk7XG4gKiAgIGV4cGVjdChtb2NrKS50b0hhdmVCZWVuQ2FsbGVkV2l0aChleHBlY3QuYW55dGhpbmcoKSk7XG4gKiB9KTtcbmBgYFxuICovXG5leHBlY3QuYW55dGhpbmcgPSBhc3ltbWV0cmljTWF0Y2hlcnMuYW55dGhpbmcgYXMgKCkgPT4gUmV0dXJuVHlwZTxcbiAgdHlwZW9mIGFzeW1tZXRyaWNNYXRjaGVycy5hbnl0aGluZ1xuPjtcbi8qKlxuICogYGV4cGVjdC5hbnkoY29uc3RydWN0b3IpYCBtYXRjaGVzIGFueXRoaW5nIHRoYXQgd2FzIGNyZWF0ZWQgd2l0aCB0aGUgZ2l2ZW5cbiAqIGNvbnN0cnVjdG9yIG9yIGlmIGl0J3MgYSBwcmltaXRpdmUgdGhhdCBpcyBvZiB0aGUgcGFzc2VkIHR5cGUuIFlvdSBjYW4gdXNlIGl0XG4gKiBpbnNpZGUgYHRvRXF1YWxgIG9yIGB0b0hhdmVCZWVuQ2FsbGVkV2l0aGAgaW5zdGVhZCBvZiBhIGxpdGVyYWwgdmFsdWUuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBleHBlY3QgfSBmcm9tIFwiQHN0ZC9leHBlY3RcIjtcbiAqXG4gKiBjbGFzcyBDYXQge31cbiAqIERlbm8udGVzdChcImV4cGVjdC5hbnkoKVwiLCAoKSA9PiB7XG4gKiAgIGV4cGVjdChuZXcgQ2F0KCkpLnRvRXF1YWwoZXhwZWN0LmFueShDYXQpKTtcbiAqICAgZXhwZWN0KFwiSGVsbG9cIikudG9FcXVhbChleHBlY3QuYW55KFN0cmluZykpO1xuICogICBleHBlY3QoMSkudG9FcXVhbChleHBlY3QuYW55KE51bWJlcikpO1xuICogICBleHBlY3QoKCkgPT4ge30pLnRvRXF1YWwoZXhwZWN0LmFueShGdW5jdGlvbikpO1xuICogICBleHBlY3QoZmFsc2UpLnRvRXF1YWwoZXhwZWN0LmFueShCb29sZWFuKSk7XG4gKiAgIGV4cGVjdChCaWdJbnQoMSkpLnRvRXF1YWwoZXhwZWN0LmFueShCaWdJbnQpKTtcbiAqICAgZXhwZWN0KFN5bWJvbChcInN5bVwiKSkudG9FcXVhbChleHBlY3QuYW55KFN5bWJvbCkpO1xuICogfSk7XG4gKiBgYGBcbiAqL1xuZXhwZWN0LmFueSA9IGFzeW1tZXRyaWNNYXRjaGVycy5hbnkgYXMgKFxuICBjOiB1bmtub3duLFxuKSA9PiBSZXR1cm5UeXBlPHR5cGVvZiBhc3ltbWV0cmljTWF0Y2hlcnMuYW55Pjtcbi8qKlxuICogYGV4cGVjdC5hcnJheUNvbnRhaW5pbmcoYXJyYXkpYCBtYXRjaGVzIGEgcmVjZWl2ZWQgYXJyYXkgd2hpY2ggY29udGFpbnMgYWxsIG9mXG4gKiB0aGUgZWxlbWVudHMgaW4gdGhlIGV4cGVjdGVkIGFycmF5LiBUaGF0IGlzLCB0aGUgZXhwZWN0ZWQgYXJyYXkgaXMgYSAqKnN1YnNldCoqXG4gKiBvZiB0aGUgcmVjZWl2ZWQgYXJyYXkuIFRoZXJlZm9yZSwgaXQgbWF0Y2hlcyBhIHJlY2VpdmVkIGFycmF5IHdoaWNoIGNvbnRhaW5zXG4gKiBlbGVtZW50cyB0aGF0IGFyZSAqKm5vdCoqIGluIHRoZSBleHBlY3RlZCBhcnJheS5cbiAqXG4gKiBZb3UgY2FuIHVzZSBpdCBpbnN0ZWFkIG9mIGEgbGl0ZXJhbCB2YWx1ZTpcbiAqXG4gKiAtIGluIGB0b0VxdWFsYCBvciBgdG9IYXZlQmVlbkNhbGxlZFdpdGhgXG4gKiAtIHRvIG1hdGNoIGEgcHJvcGVydHkgaW4gYG9iamVjdENvbnRhaW5pbmdgIG9yIGB0b01hdGNoT2JqZWN0YFxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgZXhwZWN0IH0gZnJvbSBcIkBzdGQvZXhwZWN0XCI7XG4gKlxuICogRGVuby50ZXN0KFwiZXhwZWN0LmFycmF5Q29udGFpbmluZygpIHdpdGggYXJyYXkgb2YgbnVtYmVyc1wiLCAoKSA9PiB7XG4gKiAgIGNvbnN0IGFyciA9IFsxLCAyLCAzXTtcbiAqICAgZXhwZWN0KFsxLCAyLCAzLCA0XSkudG9FcXVhbChleHBlY3QuYXJyYXlDb250YWluaW5nKGFycikpO1xuICogICBleHBlY3QoWzQsIDUsIDZdKS5ub3QudG9FcXVhbChleHBlY3QuYXJyYXlDb250YWluaW5nKGFycikpO1xuICogICBleHBlY3QoWzEsIDIsIDNdKS50b0VxdWFsKGV4cGVjdC5hcnJheUNvbnRhaW5pbmcoYXJyKSk7XG4gKiB9KTtcbiAqIGBgYFxuICovXG5leHBlY3QuYXJyYXlDb250YWluaW5nID0gYXN5bW1ldHJpY01hdGNoZXJzLmFycmF5Q29udGFpbmluZyBhcyAoXG4gIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gIGM6IGFueVtdLFxuKSA9PiBSZXR1cm5UeXBlPHR5cGVvZiBhc3ltbWV0cmljTWF0Y2hlcnMuYXJyYXlDb250YWluaW5nPjtcbi8qKlxuICogYGV4cGVjdC5jbG9zZVRvKG51bWJlciwgbnVtRGlnaXRzPylgIGlzIHVzZWZ1bCB3aGVuIGNvbXBhcmluZyBmbG9hdGluZyBwb2ludFxuICogbnVtYmVycyBpbiBvYmplY3QgcHJvcGVydGllcyBvciBhcnJheSBpdGVtLiBJZiB5b3UgbmVlZCB0byBjb21wYXJlIGEgbnVtYmVyLFxuICogcGxlYXNlIHVzZSBgLnRvQmVDbG9zZVRvYCBpbnN0ZWFkLlxuICpcbiAqIFRoZSBvcHRpb25hbCBgbnVtRGlnaXRzYCBhcmd1bWVudCBsaW1pdHMgdGhlIG51bWJlciBvZiBkaWdpdHMgdG8gY2hlY2sgKiphZnRlcioqXG4gKiB0aGUgZGVjaW1hbCBwb2ludC4gRm9yIHRoZSBkZWZhdWx0IHZhbHVlIGAyYCwgdGhlIHRlc3QgY3JpdGVyaW9uIGlzXG4gKiBgTWF0aC5hYnMoZXhwZWN0ZWQgLSByZWNlaXZlZCkgPCAwLjAwNSAodGhhdCBpcywgMTAgKiogLTIgLyAyKWAuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBleHBlY3QgfSBmcm9tIFwiQHN0ZC9leHBlY3RcIjtcbiAqXG4gKiBEZW5vLnRlc3QoXCJjb21wYXJlIGZsb2F0IGluIG9iamVjdCBwcm9wZXJ0aWVzXCIsICgpID0+IHtcbiAqICAgZXhwZWN0KHtcbiAqICAgICB0aXRsZTogXCIwLjEgKyAwLjJcIixcbiAqICAgICBzdW06IDAuMSArIDAuMixcbiAqICAgfSkudG9FcXVhbCh7XG4gKiAgICAgdGl0bGU6IFwiMC4xICsgMC4yXCIsXG4gKiAgICAgc3VtOiBleHBlY3QuY2xvc2VUbygwLjMsIDUpLFxuICogICB9KTtcbiAqIH0pO1xuICogYGBgXG4gKi9cbmV4cGVjdC5jbG9zZVRvID0gYXN5bW1ldHJpY01hdGNoZXJzLmNsb3NlVG8gYXMgKFxuICBudW06IG51bWJlcixcbiAgbnVtRGlnaXRzPzogbnVtYmVyLFxuKSA9PiBSZXR1cm5UeXBlPHR5cGVvZiBhc3ltbWV0cmljTWF0Y2hlcnMuY2xvc2VUbz47XG4vKipcbiAqIGBleHBlY3Quc3RyaW5nQ29udGFpbmluZyhzdHJpbmcpYCBtYXRjaGVzIHRoZSByZWNlaXZlZCB2YWx1ZSBpZiBpdCBpcyBhIHN0cmluZ1xuICogdGhhdCBjb250YWlucyB0aGUgZXhhY3QgZXhwZWN0ZWQgc3RyaW5nLlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgZXhwZWN0IH0gZnJvbSBcIkBzdGQvZXhwZWN0XCI7XG4gKlxuICogRGVuby50ZXN0KFwiZXhwZWN0LnN0cmluZ0NvbnRhaW5pbmcoKSB3aXRoIHN0cmluZ3NcIiwgKCkgPT4ge1xuICogICBleHBlY3QoXCJodHRwczovL2Rlbm8uY29tL1wiKS50b0VxdWFsKGV4cGVjdC5zdHJpbmdDb250YWluaW5nKFwiZGVub1wiKSk7XG4gKiAgIGV4cGVjdChcImZ1bmN0aW9uXCIpLnRvRXF1YWwoZXhwZWN0LnN0cmluZ0NvbnRhaW5pbmcoXCJmdW5jXCIpKTtcbiAqXG4gKiAgIGV4cGVjdChcIkhlbGxvLCBXb3JsZFwiKS5ub3QudG9FcXVhbChleHBlY3Quc3RyaW5nQ29udGFpbmluZyhcImhlbGxvXCIpKTtcbiAqICAgZXhwZWN0KFwiZm9vYmFyXCIpLm5vdC50b0VxdWFsKGV4cGVjdC5zdHJpbmdDb250YWluaW5nKFwiYmF6elwiKSk7XG4gKiB9KTtcbiAqIGBgYFxuICovXG5leHBlY3Quc3RyaW5nQ29udGFpbmluZyA9IGFzeW1tZXRyaWNNYXRjaGVycy5zdHJpbmdDb250YWluaW5nIGFzIChcbiAgc3RyOiBzdHJpbmcsXG4pID0+IFJldHVyblR5cGU8dHlwZW9mIGFzeW1tZXRyaWNNYXRjaGVycy5zdHJpbmdDb250YWluaW5nPjtcbi8qKlxuICogYGV4cGVjdC5zdHJpbmdNYXRjaGluZyhzdHJpbmcgfCByZWdleHApYCBtYXRjaGVzIHRoZSByZWNlaXZlZCB2YWx1ZSBpZiBpdCBpcyBhXG4gKiBzdHJpbmcgdGhhdCBtYXRjaGVzIHRoZSBleHBlY3RlZCBzdHJpbmcgb3IgcmVndWxhciBleHByZXNzaW9uLlxuICpcbiAqIFlvdSBjYW4gdXNlIGl0IGluc3RlYWQgb2YgYSBsaXRlcmFsIHZhbHVlOlxuICpcbiAqIC0gaW4gYHRvRXF1YWxgIG9yIGB0b0hhdmVCZWVuQ2FsbGVkV2l0aGBcbiAqIC0gdG8gbWF0Y2ggYW4gZWxlbWVudCBpbiBgYXJyYXlDb250YWluaW5nYFxuICogLSB0byBtYXRjaCBhIHByb3BlcnR5IGluIGBvYmplY3RDb250YWluaW5nYCAobm90IGF2YWlsYWJsZSB5ZXQpIG9yIGB0b01hdGNoT2JqZWN0YFxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgZXhwZWN0IH0gZnJvbSBcIkBzdGQvZXhwZWN0XCI7XG4gKlxuICogRGVuby50ZXN0KFwiZXhhbXBsZVwiLCAoKSA9PiB7XG4gKiAgIGV4cGVjdChcImRlbm9fc3RkXCIpLnRvRXF1YWwoZXhwZWN0LnN0cmluZ01hdGNoaW5nKC9zdGQvKSk7XG4gKiAgIGV4cGVjdChcIjAxMjM0NTY3ODlcIikudG9FcXVhbChleHBlY3Quc3RyaW5nTWF0Y2hpbmcoL1xcZCsvKSk7XG4gKiAgIGV4cGVjdChcImVcIikubm90LnRvRXF1YWwoZXhwZWN0LnN0cmluZ01hdGNoaW5nKC9cXHMvKSk7XG4gKiAgIGV4cGVjdChcInF1ZXVlXCIpLm5vdC50b0VxdWFsKGV4cGVjdC5zdHJpbmdNYXRjaGluZygvZW4vKSk7XG4gKiB9KTtcbiAqIGBgYFxuICovXG5leHBlY3Quc3RyaW5nTWF0Y2hpbmcgPSBhc3ltbWV0cmljTWF0Y2hlcnMuc3RyaW5nTWF0Y2hpbmcgYXMgKFxuICBwYXR0ZXJuOiBzdHJpbmcgfCBSZWdFeHAsXG4pID0+IFJldHVyblR5cGU8dHlwZW9mIGFzeW1tZXRyaWNNYXRjaGVycy5zdHJpbmdNYXRjaGluZz47XG5cbi8qKlxuICogYGV4cGVjdC5oYXNBc3NlcnRpb25zYCB2ZXJpZmllcyB0aGF0IGF0IGxlYXN0IG9uZSBhc3NlcnRpb24gaXMgY2FsbGVkIGR1cmluZyBhIHRlc3QuXG4gKlxuICogTm90ZTogZXhwZWN0Lmhhc0Fzc2VydGlvbnMgb25seSBjYW4gdXNlIGluIGJkZCBmdW5jdGlvbiB0ZXN0IHN1aXRlLCBzdWNoIGFzIGB0ZXN0YCBvciBgaXRgLlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0c1xuICpcbiAqIGltcG9ydCB7IHRlc3QgfSBmcm9tIFwiQHN0ZC90ZXN0aW5nL2JkZFwiO1xuICogaW1wb3J0IHsgZXhwZWN0IH0gZnJvbSBcIkBzdGQvZXhwZWN0XCI7XG4gKlxuICogdGVzdChcIml0IHdvcmtzXCIsICgpID0+IHtcbiAqICAgZXhwZWN0Lmhhc0Fzc2VydGlvbnMoKTtcbiAqICAgZXhwZWN0KFwiYVwiKS5ub3QudG9CZShcImJcIik7XG4gKiB9KTtcbiAqIGBgYFxuICovXG5leHBlY3QuaGFzQXNzZXJ0aW9ucyA9IGhhc0Fzc2VydGlvbnMgYXMgKCkgPT4gdm9pZDtcblxuLyoqXG4gKiBgZXhwZWN0LmFzc2VydGlvbnNgIHZlcmlmaWVzIHRoYXQgYSBjZXJ0YWluIG51bWJlciBvZiBhc3NlcnRpb25zIGFyZSBjYWxsZWQgZHVyaW5nIGEgdGVzdC5cbiAqXG4gKiBOb3RlOiBleHBlY3QuYXNzZXJ0aW9ucyBvbmx5IGNhbiB1c2UgaW4gYmRkIGZ1bmN0aW9uIHRlc3Qgc3VpdGUsIHN1Y2ggYXMgYHRlc3RgIG9yIGBpdGAuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHRzXG4gKlxuICogaW1wb3J0IHsgdGVzdCB9IGZyb20gXCJAc3RkL3Rlc3RpbmcvYmRkXCI7XG4gKiBpbXBvcnQgeyBleHBlY3QgfSBmcm9tIFwiQHN0ZC9leHBlY3RcIjtcbiAqXG4gKiB0ZXN0KFwiaXQgd29ya3NcIiwgKCkgPT4ge1xuICogICBleHBlY3QuYXNzZXJ0aW9ucygxKTtcbiAqICAgZXhwZWN0KFwiYVwiKS5ub3QudG9CZShcImJcIik7XG4gKiB9KTtcbiAqIGBgYFxuICovXG5leHBlY3QuYXNzZXJ0aW9ucyA9IGFzc2VydGlvbnMgYXMgKG51bTogbnVtYmVyKSA9PiB2b2lkO1xuXG4vKipcbiAqIGBleHBlY3Qub2JqZWN0Q29udGFpbmluZyhvYmplY3QpYCBtYXRjaGVzIGFueSByZWNlaXZlZCBvYmplY3QgdGhhdCByZWN1cnNpdmVseSBtYXRjaGVzIHRoZSBleHBlY3RlZCBwcm9wZXJ0aWVzLlxuICogVGhhdCBpcywgdGhlIGV4cGVjdGVkIG9iamVjdCBpcyBub3QgYSBzdWJzZXQgb2YgdGhlIHJlY2VpdmVkIG9iamVjdC4gVGhlcmVmb3JlLCBpdCBtYXRjaGVzIGEgcmVjZWl2ZWQgb2JqZWN0XG4gKiB3aGljaCBjb250YWlucyBwcm9wZXJ0aWVzIHRoYXQgYXJlIG5vdCBpbiB0aGUgZXhwZWN0ZWQgb2JqZWN0LlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgZXhwZWN0IH0gZnJvbSBcIkBzdGQvZXhwZWN0XCI7XG4gKlxuICogRGVuby50ZXN0KFwiZXhhbXBsZVwiLCAoKSA9PiB7XG4gKiAgIGV4cGVjdCh7IGJhcjogJ2JheicgfSkudG9FcXVhbChleHBlY3Qub2JqZWN0Q29udGFpbmluZyh7IGJhcjogJ2Jheid9KSk7XG4gKiAgIGV4cGVjdCh7IGJhcjogJ2JheicgfSkubm90LnRvRXF1YWwoZXhwZWN0Lm9iamVjdENvbnRhaW5pbmcoeyBmb286ICdiYXInfSkpO1xuICogfSk7XG4gKiBgYGBcbiAqL1xuZXhwZWN0Lm9iamVjdENvbnRhaW5pbmcgPSBhc3ltbWV0cmljTWF0Y2hlcnMub2JqZWN0Q29udGFpbmluZyBhcyAoXG4gIG9iajogUmVjb3JkPHN0cmluZywgdW5rbm93bj4sXG4pID0+IFJldHVyblR5cGU8dHlwZW9mIGFzeW1tZXRyaWNNYXRjaGVycy5vYmplY3RDb250YWluaW5nPjtcbi8qKlxuICogYGV4cGVjdC5ub3QuYXJyYXlDb250YWluaW5nYCBtYXRjaGVzIGEgcmVjZWl2ZWQgYXJyYXkgd2hpY2ggZG9lcyBub3QgY29udGFpblxuICogYWxsIG9mIHRoZSBlbGVtZW50cyBpbiB0aGUgZXhwZWN0ZWQgYXJyYXkuIFRoYXQgaXMsIHRoZSBleHBlY3RlZCBhcnJheSBpcyBub3RcbiAqIGEgc3Vic2V0IG9mIHRoZSByZWNlaXZlZCBhcnJheS5cbiAqXG4gKiBgZXhwZWN0Lm5vdC5vYmplY3RDb250YWluaW5nYCBtYXRjaGVzIGFueSByZWNlaXZlZCBvYmplY3QgdGhhdCBkb2VzIG5vdCByZWN1cnNpdmVseVxuICogbWF0Y2ggdGhlIGV4cGVjdGVkIHByb3BlcnRpZXMuIFRoYXQgaXMsIHRoZSBleHBlY3RlZCBvYmplY3QgaXMgbm90IGEgc3Vic2V0IG9mIHRoZVxuICogcmVjZWl2ZWQgb2JqZWN0LiBUaGVyZWZvcmUsIGl0IG1hdGNoZXMgYSByZWNlaXZlZCBvYmplY3Qgd2hpY2ggY29udGFpbnMgcHJvcGVydGllc1xuICogdGhhdCBhcmUgbm90IGluIHRoZSBleHBlY3RlZCBvYmplY3QuXG4gKlxuICogYGV4cGVjdC5ub3Quc3RyaW5nQ29udGFpbmluZ2AgbWF0Y2hlcyB0aGUgcmVjZWl2ZWQgdmFsdWUgaWYgaXQgaXMgbm90IGEgc3RyaW5nXG4gKiBvciBpZiBpdCBpcyBhIHN0cmluZyB0aGF0IGRvZXMgbm90IGNvbnRhaW4gdGhlIGV4YWN0IGV4cGVjdGVkIHN0cmluZy5cbiAqXG4gKiBgZXhwZWN0Lm5vdC5zdHJpbmdNYXRjaGluZ2AgbWF0Y2hlcyB0aGUgcmVjZWl2ZWQgdmFsdWUgaWYgaXQgaXMgbm90IGEgc3RyaW5nXG4gKiBvciBpZiBpdCBpcyBhIHN0cmluZyB0aGF0IGRvZXMgbm90IG1hdGNoIHRoZSBleHBlY3RlZCBzdHJpbmcgb3IgcmVndWxhciBleHByZXNzaW9uLlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgZXhwZWN0IH0gZnJvbSBcIkBzdGQvZXhwZWN0XCI7XG4gKlxuICogRGVuby50ZXN0KFwiZXhwZWN0Lm5vdC5hcnJheUNvbnRhaW5pbmdcIiwgKCkgPT4ge1xuICogICBjb25zdCBleHBlY3RlZCA9IFtcIlNhbWFudGhhXCJdO1xuICogICBleHBlY3QoW1wiQWxpY2VcIiwgXCJCb2JcIiwgXCJFdmVcIl0pLnRvRXF1YWwoZXhwZWN0Lm5vdC5hcnJheUNvbnRhaW5pbmcoZXhwZWN0ZWQpKTtcbiAqIH0pO1xuICpcbiAqIERlbm8udGVzdChcImV4cGVjdC5ub3Qub2JqZWN0Q29udGFpbmluZ1wiLCAoKSA9PiB7XG4gKiAgIGNvbnN0IGV4cGVjdGVkID0geyBmb286IFwiYmFyXCIgfTtcbiAqICAgZXhwZWN0KHsgYmFyOiBcImJhelwiIH0pLnRvRXF1YWwoZXhwZWN0Lm5vdC5vYmplY3RDb250YWluaW5nKGV4cGVjdGVkKSk7XG4gKiB9KTtcbiAqXG4gKiBEZW5vLnRlc3QoXCJleHBlY3Qubm90LnN0cmluZ0NvbnRhaW5pbmdcIiwgKCkgPT4ge1xuICogICBjb25zdCBleHBlY3RlZCA9IFwiSGVsbG8gd29ybGQhXCI7XG4gKiAgIGV4cGVjdChcIkhvdyBhcmUgeW91P1wiKS50b0VxdWFsKGV4cGVjdC5ub3Quc3RyaW5nQ29udGFpbmluZyhleHBlY3RlZCkpO1xuICogfSk7XG4gKlxuICogRGVuby50ZXN0KFwiZXhwZWN0Lm5vdC5zdHJpbmdNYXRjaGluZ1wiLCAoKSA9PiB7XG4gKiAgIGNvbnN0IGV4cGVjdGVkID0gL0hlbGxvIHdvcmxkIS87XG4gKiAgIGV4cGVjdChcIkhvdyBhcmUgeW91P1wiKS50b0VxdWFsKGV4cGVjdC5ub3Quc3RyaW5nTWF0Y2hpbmcoZXhwZWN0ZWQpKTtcbiAqIH0pO1xuICogYGBgXG4gKi9cbmV4cGVjdC5ub3QgPSB7XG4gIGFycmF5Q29udGFpbmluZzogYXN5bW1ldHJpY01hdGNoZXJzLmFycmF5Tm90Q29udGFpbmluZyxcbiAgb2JqZWN0Q29udGFpbmluZzogYXN5bW1ldHJpY01hdGNoZXJzLm9iamVjdE5vdENvbnRhaW5pbmcsXG4gIHN0cmluZ0NvbnRhaW5pbmc6IGFzeW1tZXRyaWNNYXRjaGVycy5zdHJpbmdOb3RDb250YWluaW5nLFxuICBzdHJpbmdNYXRjaGluZzogYXN5bW1ldHJpY01hdGNoZXJzLnN0cmluZ05vdE1hdGNoaW5nLFxufTtcbi8qKlxuICogYGV4cGVjdC5hZGRTbmFwc2hvdFNlcmlhbGl6ZXJgIGFkZHMgYSBtb2R1bGUgdGhhdCBmb3JtYXRzIGFwcGxpY2F0aW9uLXNwZWNpZmljIGRhdGEgc3RydWN0dXJlcy5cbiAqXG4gKiBGb3IgYW4gaW5kaXZpZHVhbCB0ZXN0IGZpbGUsIGFuIGFkZGVkIG1vZHVsZSBwcmVjZWRlcyBhbnkgbW9kdWxlcyBmcm9tIHNuYXBzaG90U2VyaWFsaXplcnMgY29uZmlndXJhdGlvbixcbiAqIHdoaWNoIHByZWNlZGUgdGhlIGRlZmF1bHQgc25hcHNob3Qgc2VyaWFsaXplcnMgZm9yIGJ1aWx0LWluIEphdmFTY3JpcHQgdHlwZXMuXG4gKiBUaGUgbGFzdCBtb2R1bGUgYWRkZWQgaXMgdGhlIGZpcnN0IG1vZHVsZSB0ZXN0ZWQuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBleHBlY3QgfSBmcm9tIFwiQHN0ZC9leHBlY3RcIjtcbiAqIGltcG9ydCBzZXJpYWxpemVyQW5zaSBmcm9tIFwibnBtOmplc3Qtc25hcHNob3Qtc2VyaWFsaXplci1hbnNpXCI7XG4gKlxuICogZXhwZWN0LmFkZFNuYXBzaG90U2VyaWFsaXplcihzZXJpYWxpemVyQW5zaSk7XG4gKiBgYGBcbiAqL1xuZXhwZWN0LmFkZFNuYXBzaG90U2VyaWFsaXplciA9IGFkZFNlcmlhbGl6ZXIgYXMgKFxuICBwbHVnaW46IFNuYXBzaG90UGx1Z2luLFxuKSA9PiB2b2lkO1xuIiwgImltcG9ydCB7IGV4cGVjdCBhcyBzdGRFeHBlY3QgfSBmcm9tIFwiQHN0ZC9leHBlY3RcIjtcblxuZXhwb3J0IGludGVyZmFjZSBUZXN0UmVzdWx0IHtcbiAgc3VpdGU/OiBzdHJpbmdbXTtcbiAgdGVzdDogc3RyaW5nO1xuICByZXN1bHQ6IFwicGFzc1wiIHwgXCJmYWlsXCIgfCBcInNraXBcIjtcbiAgZXJyb3I6IHN0cmluZyB8IG51bGw7XG4gIGR1cmF0aW9uOiBudW1iZXI7XG59XG5cbmludGVyZmFjZSBUZXN0RW50cnkge1xuICBuYW1lOiBzdHJpbmc7XG4gIHN1aXRlOiBzdHJpbmdbXTtcbiAgZm46IFRlc3RGdW5jdGlvbjtcbn1cblxuaW50ZXJmYWNlIFRlc3RTdG9yZSB7XG4gIHRlc3RzOiBUZXN0RW50cnlbXTtcbiAgcGVuZGluZ1N1aXRlczogUHJvbWlzZTx2b2lkPltdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFRlc3RSdW5SZXN1bHQge1xuICB0ZXN0UmVzdWx0czogVGVzdFJlc3VsdFtdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFRlc3RDb250ZXh0IHtcbiAgLyoqXG4gICAqIFNraXAgdGhlIGN1cnJlbnQgdGVzdC4gVGhlIHRlc3Qgd2lsbCBiZSBtYXJrZWQgYXMgc2tpcHBlZC5cbiAgICovXG4gIHNraXAoKTogbmV2ZXI7XG4gIC8qKlxuICAgKiBFeHBsaWNpdGx5IGZhaWwgdGhlIGN1cnJlbnQgdGVzdCB3aXRoIGFuIG9wdGlvbmFsIG1lc3NhZ2UuXG4gICAqL1xuICBmYWlsKG1lc3NhZ2U/OiBzdHJpbmcpOiBuZXZlcjtcbiAgLyoqXG4gICAqIEV4cGxpY2l0bHkgcGFzcyB0aGUgY3VycmVudCB0ZXN0LiBVc2VmdWwgZm9yIGVhcmx5IGV4aXQuXG4gICAqL1xuICBzdWNjZWVkKCk6IG5ldmVyO1xufVxuXG5sZXQgYWN0aXZlVGVzdFN0b3JlOiBUZXN0U3RvcmUgfCB1bmRlZmluZWQ7XG5sZXQgYWN0aXZlVGVzdFN1aXRlOiBzdHJpbmdbXSA9IFtdO1xuXG5jbGFzcyBTa2lwVGVzdEVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcIlRlc3Qgc2tpcHBlZFwiKTtcbiAgICB0aGlzLm5hbWUgPSBcIlNraXBUZXN0RXJyb3JcIjtcbiAgfVxufVxuXG5jbGFzcyBGYWlsVGVzdEVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihtZXNzYWdlPzogc3RyaW5nKSB7XG4gICAgc3VwZXIobWVzc2FnZSA/PyBcIlRlc3QgZmFpbGVkXCIpO1xuICAgIHRoaXMubmFtZSA9IFwiRmFpbFRlc3RFcnJvclwiO1xuICB9XG59XG5cbmNsYXNzIFN1Y2NlZWRUZXN0RXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFwiVGVzdCBwYXNzZWRcIik7XG4gICAgdGhpcy5uYW1lID0gXCJTdWNjZWVkVGVzdEVycm9yXCI7XG4gIH1cbn1cblxuY29uc3QgdGVzdENvbnRleHQ6IFRlc3RDb250ZXh0ID0ge1xuICBza2lwKCk6IG5ldmVyIHtcbiAgICB0aHJvdyBuZXcgU2tpcFRlc3RFcnJvcigpO1xuICB9LFxuICBmYWlsKG1lc3NhZ2U/OiBzdHJpbmcpOiBuZXZlciB7XG4gICAgdGhyb3cgbmV3IEZhaWxUZXN0RXJyb3IobWVzc2FnZSk7XG4gIH0sXG4gIHN1Y2NlZWQoKTogbmV2ZXIge1xuICAgIHRocm93IG5ldyBTdWNjZWVkVGVzdEVycm9yKCk7XG4gIH0sXG59O1xuXG5mdW5jdGlvbiBmb3JtYXRFcnJvcihlcnI6IHVua25vd24pOiBzdHJpbmcge1xuICBpZiAoZXJyIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICByZXR1cm4gZXJyLm1lc3NhZ2U7XG4gIH1cbiAgcmV0dXJuIFN0cmluZyhlcnIpO1xufVxuXG5hc3luYyBmdW5jdGlvbiBleGVjdXRlVGVzdChlbnRyeTogVGVzdEVudHJ5KTogUHJvbWlzZTxUZXN0UmVzdWx0PiB7XG4gIGNvbnN0IHN0YXJ0ID0gcGVyZm9ybWFuY2Uubm93KCk7XG5cbiAgdHJ5IHtcbiAgICBhd2FpdCBlbnRyeS5mbih0ZXN0Q29udGV4dCk7XG4gICAgcmV0dXJuIHtcbiAgICAgIHN1aXRlOiBlbnRyeS5zdWl0ZS5sZW5ndGggPiAwID8gZW50cnkuc3VpdGUgOiB1bmRlZmluZWQsXG4gICAgICB0ZXN0OiBlbnRyeS5uYW1lLFxuICAgICAgcmVzdWx0OiBcInBhc3NcIixcbiAgICAgIGVycm9yOiBudWxsLFxuICAgICAgZHVyYXRpb246IHBlcmZvcm1hbmNlLm5vdygpIC0gc3RhcnQsXG4gICAgfTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgaWYgKGVyciBpbnN0YW5jZW9mIFNraXBUZXN0RXJyb3IpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHN1aXRlOiBlbnRyeS5zdWl0ZS5sZW5ndGggPiAwID8gZW50cnkuc3VpdGUgOiB1bmRlZmluZWQsXG4gICAgICAgIHRlc3Q6IGVudHJ5Lm5hbWUsXG4gICAgICAgIHJlc3VsdDogXCJza2lwXCIsXG4gICAgICAgIGVycm9yOiBudWxsLFxuICAgICAgICBkdXJhdGlvbjogcGVyZm9ybWFuY2Uubm93KCkgLSBzdGFydCxcbiAgICAgIH07XG4gICAgfVxuICAgIGlmIChlcnIgaW5zdGFuY2VvZiBTdWNjZWVkVGVzdEVycm9yKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdWl0ZTogZW50cnkuc3VpdGUubGVuZ3RoID4gMCA/IGVudHJ5LnN1aXRlIDogdW5kZWZpbmVkLFxuICAgICAgICB0ZXN0OiBlbnRyeS5uYW1lLFxuICAgICAgICByZXN1bHQ6IFwicGFzc1wiLFxuICAgICAgICBlcnJvcjogbnVsbCxcbiAgICAgICAgZHVyYXRpb246IHBlcmZvcm1hbmNlLm5vdygpIC0gc3RhcnQsXG4gICAgICB9O1xuICAgIH1cbiAgICBpZiAoZXJyIGluc3RhbmNlb2YgRmFpbFRlc3RFcnJvcikge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc3VpdGU6IGVudHJ5LnN1aXRlLmxlbmd0aCA+IDAgPyBlbnRyeS5zdWl0ZSA6IHVuZGVmaW5lZCxcbiAgICAgICAgdGVzdDogZW50cnkubmFtZSxcbiAgICAgICAgcmVzdWx0OiBcImZhaWxcIixcbiAgICAgICAgZXJyb3I6IGVyci5tZXNzYWdlLFxuICAgICAgICBkdXJhdGlvbjogcGVyZm9ybWFuY2Uubm93KCkgLSBzdGFydCxcbiAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICBzdWl0ZTogZW50cnkuc3VpdGUubGVuZ3RoID4gMCA/IGVudHJ5LnN1aXRlIDogdW5kZWZpbmVkLFxuICAgICAgdGVzdDogZW50cnkubmFtZSxcbiAgICAgIHJlc3VsdDogXCJmYWlsXCIsXG4gICAgICBlcnJvcjogZm9ybWF0RXJyb3IoZXJyKSxcbiAgICAgIGR1cmF0aW9uOiBwZXJmb3JtYW5jZS5ub3coKSAtIHN0YXJ0LFxuICAgIH07XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJ1blRlc3QoXG4gIGZuOiAoKSA9PiB2b2lkIHwgUHJvbWlzZTx2b2lkPixcbik6IFByb21pc2U8VGVzdFJ1blJlc3VsdD4ge1xuICBjb25zdCBzdG9yZTogVGVzdFN0b3JlID0ge1xuICAgIHRlc3RzOiBbXSxcbiAgICBwZW5kaW5nU3VpdGVzOiBbXSxcbiAgfTtcblxuICBjb25zdCBwcmV2aW91c1N0b3JlID0gYWN0aXZlVGVzdFN0b3JlO1xuICBjb25zdCBwcmV2aW91c1N1aXRlID0gYWN0aXZlVGVzdFN1aXRlO1xuICBhY3RpdmVUZXN0U3RvcmUgPSBzdG9yZTtcbiAgYWN0aXZlVGVzdFN1aXRlID0gW107XG5cbiAgdHJ5IHtcbiAgICBhd2FpdCBmbigpO1xuICAgIGF3YWl0IFByb21pc2UuYWxsKHN0b3JlLnBlbmRpbmdTdWl0ZXMpO1xuXG4gICAgY29uc3QgdGVzdFJlc3VsdHM6IFRlc3RSZXN1bHRbXSA9IFtdO1xuICAgIGZvciAoY29uc3QgZW50cnkgb2Ygc3RvcmUudGVzdHMpIHtcbiAgICAgIHRlc3RSZXN1bHRzLnB1c2goYXdhaXQgZXhlY3V0ZVRlc3QoZW50cnkpKTtcbiAgICB9XG4gICAgcmV0dXJuIHsgdGVzdFJlc3VsdHMgfTtcbiAgfSBmaW5hbGx5IHtcbiAgICBhY3RpdmVUZXN0U3RvcmUgPSBwcmV2aW91c1N0b3JlO1xuICAgIGFjdGl2ZVRlc3RTdWl0ZSA9IHByZXZpb3VzU3VpdGU7XG4gIH1cbn1cblxuZXhwb3J0IHR5cGUgVGVzdEZ1bmN0aW9uID0gKGN0eDogVGVzdENvbnRleHQpID0+IHZvaWQgfCBQcm9taXNlPHZvaWQ+O1xuXG5mdW5jdGlvbiBwcm94eUV4cGVjdFN0dWIoKTogUmV0dXJuVHlwZTx0eXBlb2Ygc3RkRXhwZWN0PiB7XG4gIGNvbnN0IGhhbmRsZXI6IFByb3h5SGFuZGxlcjxvYmplY3Q+ID0ge1xuICAgIGdldChfdGFyZ2V0LCBfcHJvcCkge1xuICAgICAgcmV0dXJuIG5ldyBQcm94eSgoKSA9PiB7fSwgaGFuZGxlcik7XG4gICAgfSxcbiAgICBhcHBseSgpIHtcbiAgICAgIHJldHVybiBuZXcgUHJveHkoKCkgPT4ge30sIGhhbmRsZXIpO1xuICAgIH0sXG4gIH07XG5cbiAgcmV0dXJuIG5ldyBQcm94eSgoKSA9PiB7fSwgaGFuZGxlcikgYXMgUmV0dXJuVHlwZTx0eXBlb2Ygc3RkRXhwZWN0Pjtcbn1cblxuZXhwb3J0IGNvbnN0IGV4cGVjdCA9ICgoLi4uYXJnczogUGFyYW1ldGVyczx0eXBlb2Ygc3RkRXhwZWN0PikgPT4ge1xuICBpZiAoIWFjdGl2ZVRlc3RTdG9yZSkgcmV0dXJuIHByb3h5RXhwZWN0U3R1YigpO1xuICByZXR1cm4gc3RkRXhwZWN0KC4uLmFyZ3MpO1xufSkgYXMgdHlwZW9mIHN0ZEV4cGVjdDtcblxuZXhwb3J0IGZ1bmN0aW9uIHRlc3QobmFtZTogc3RyaW5nLCBmbjogVGVzdEZ1bmN0aW9uKTogdm9pZCB7XG4gIGNvbnN0IHN0b3JlID0gYWN0aXZlVGVzdFN0b3JlO1xuICBpZiAoIXN0b3JlKSByZXR1cm47XG5cbiAgc3RvcmUudGVzdHMucHVzaCh7XG4gICAgbmFtZSxcbiAgICBzdWl0ZTogWy4uLmFjdGl2ZVRlc3RTdWl0ZV0sXG4gICAgZm4sXG4gIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZGVzY3JpYmUoXG4gIG5hbWU6IHN0cmluZyxcbiAgZm46ICgpID0+IHZvaWQgfCBQcm9taXNlPHZvaWQ+LFxuKTogdm9pZCB8IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCBzdG9yZSA9IGFjdGl2ZVRlc3RTdG9yZTtcbiAgaWYgKCFzdG9yZSkgcmV0dXJuO1xuXG4gIGNvbnN0IHBhcmVudFN1aXRlID0gYWN0aXZlVGVzdFN1aXRlO1xuICBhY3RpdmVUZXN0U3VpdGUgPSBbLi4ucGFyZW50U3VpdGUsIG5hbWVdO1xuXG4gIGxldCByZXN1bHQ6IHZvaWQgfCBQcm9taXNlPHZvaWQ+O1xuICB0cnkge1xuICAgIHJlc3VsdCA9IGZuKCk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgYWN0aXZlVGVzdFN1aXRlID0gcGFyZW50U3VpdGU7XG4gICAgdGhyb3cgZXJyb3I7XG4gIH1cbiAgaWYgKCFpc1Byb21pc2VMaWtlKHJlc3VsdCkpIHtcbiAgICBhY3RpdmVUZXN0U3VpdGUgPSBwYXJlbnRTdWl0ZTtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBwZW5kaW5nID0gUHJvbWlzZS5yZXNvbHZlKHJlc3VsdCkuZmluYWxseSgoKSA9PiB7XG4gICAgYWN0aXZlVGVzdFN1aXRlID0gcGFyZW50U3VpdGU7XG4gIH0pO1xuICBwZW5kaW5nLmNhdGNoKCgpID0+IHVuZGVmaW5lZCk7XG4gIHN0b3JlLnBlbmRpbmdTdWl0ZXMucHVzaChwZW5kaW5nKTtcbiAgcmV0dXJuIHBlbmRpbmc7XG59XG5cbmZ1bmN0aW9uIGlzUHJvbWlzZUxpa2UodmFsdWU6IHZvaWQgfCBQcm9taXNlPHZvaWQ+KTogdmFsdWUgaXMgUHJvbWlzZTx2b2lkPiB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCIgJiYgdmFsdWUgIT09IG51bGwgJiYgXCJ0aGVuXCIgaW4gdmFsdWU7XG59XG4iXSwKICAibWFwcGluZ3MiOiAiQUFvQk8sSUFBTUEsRUFBTixjQUE2QixLQUFBLENBTWxDLFlBQVlDLEVBQWlCQyxFQUF3QixDQUNuRCxNQUFNRCxFQUFTQyxDQUFBLEVBQ2YsS0FBSyxLQUFPLGdCQUNkLENBQ0YsRUNqQk8sSUFBTUMsR0FBTixLQUFNLENBQ1hDLEdBT0EsYUFBYyxDQUNaLEtBQUtBLEdBQVMsQ0FDWixlQUFnQixPQUNoQixlQUFnQixHQUNoQixtQkFBb0IsR0FDcEIsd0JBQXlCLENBQzNCLEVBRUksT0FBTyxZQUFZLGtCQUFxQixXQUMxQyxXQUFXLGlCQUFpQixTQUFVLElBQUEsQ0FDcEMsS0FBS0MsR0FBZ0IsQ0FDdkIsQ0FBQSxFQUVBLE9BQUEsWUFBQSxTQUFBLElBQW1DLFdBR25DLFdBQUEsUUFBQSxHQUFBLE9BQUEsSUFBQSxDQUNDLEtBQUFBLEdBQThCLElBSS9CLFFBQUEsS0FBQSxrREFBOEIsRUFHbENBLElBQUEsQ0FLRSxHQUFBLEtBQUFELEdBQUEsZ0JBQUEsS0FBQUEsR0FBOEMsaUJBQUEsT0FDOUMsTUFDTSxJQUFDLE1BQU8seUpBRVosdUJBbUJILE9BQ0csS0FBQUEsR0FBQSw2Q0FnQkgsT0FDRyxL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QU9BLEdBQVUsVUFBWUEsSUFBVSxNQUFRLFNBQVVBLENBQ2xFIiwKICAibmFtZXMiOiBbIkFzc2VydGlvbkVycm9yIiwgIm1lc3NhZ2UiLCAib3B0aW9ucyIsICJBc3NlcnRpb25TdGF0ZSIsICIjc3RhdGUiLCAiI2Vuc3VyZUNsZWFuZWRVcCIsICJ2YWwiLCAibnVtIiwgImFzc2VydGlvblN0YXRlIiwgImFzc2VydGlvblN0YXRlIiwgImdldEFzc2VydGlvblN0YXRlIiwgImhhc0Fzc2VydGlvbnMiLCAiYXNzZXJ0aW9ucyIsICJudW0iLCAiZW1pdEFzc2VydGlvblRyaWdnZXIiLCAiY3VzdG9tRXF1YWxpdHlUZXN0ZXJzIiwgImFkZEN1c3RvbUVxdWFsaXR5VGVzdGVycyIsICJuZXdUZXN0ZXJzIiwgImdldEN1c3RvbUVxdWFsaXR5VGVzdGVycyIsICJBc3ltbWV0cmljTWF0Y2hlciIsICJ2YWx1ZSIsICJpbnZlcnNlIiwgIkFueXRoaW5nIiwgIm90aGVyIiwgImFueXRoaW5nIiwgIkFueSIsICJhbnkiLCAiYyIsICJBcnJheUNvbnRhaW5pbmciLCAiYXJyIiwgInJlcyIsICJlIiwgImFub3RoZXIiLCAiZXF1YWwiLCAiZ2V0Q3VzdG9tRXF1YWxpdHlUZXN0ZXJzIiwgImFycmF5Q29udGFpbmluZyIsICJhcnJheU5vdENvbnRhaW5pbmciLCAiQ2xvc2VUbyIsICIjcHJlY2lzaW9uIiwgIm51bSIsICJwcmVjaXNpb24iLCAiY2xvc2VUbyIsICJudW1EaWdpdHMiLCAiU3RyaW5nQ29udGFpbmluZyIsICJzdHIiLCAic3RyaW5nQ29udGFpbmluZyIsICJzdHJpbmdOb3RDb250YWluaW5nIiwgIlN0cmluZ01hdGNoaW5nIiwgInBhdHRlcm4iLCAic3RyaW5nTWF0Y2hpbmciLCAic3RyaW5nTm90TWF0Y2hpbmciLCAiT2JqZWN0Q29udGFpbmluZyIsICJvYmoiLCAia2V5cyIsICJrZXkiLCAib2JqZWN0Q29udGFpbmluZyIsICJvYmplY3ROb3RDb250YWluaW5nIiwgImlzS2V5ZWRDb2xsZWN0aW9uIiwgIngiLCAiY29uc3RydWN0b3JzRXF1YWwiLCAiYSIsICJiIiwgImFzeW1tZXRyaWNFcXVhbCIsICJhc3ltbWV0cmljQSIsICJBc3ltbWV0cmljTWF0Y2hlciIsICJhc3ltbWV0cmljQiIsICJlcXVhbCIsICJjIiwgImQiLCAib3B0aW9ucyIsICJjdXN0b21UZXN0ZXJzIiwgInN0cmljdENoZWNrIiwgInNlZW4iLCAiY29tcGFyZSIsICJhc3ltbWV0cmljIiwgImN1c3RvbVRlc3RlciIsICJ0ZXN0Q29udGV4dCIsICJwYXNzIiwgImFUaW1lIiwgImJUaW1lIiwgImFLZXlzIiwgImJLZXlzIiwgImFMZW4iLCAiYkxlbiIsICJpIiwgImtleSIsICJrIiwgInVubWF0Y2hlZEVudHJpZXMiLCAiYUtleSIsICJhVmFsdWUiLCAiYktleSIsICJiVmFsdWUiLCAibWVyZ2VkIiwgImV4dGVuZE1hdGNoZXJzIiwgImdldEV4dGVuZE1hdGNoZXJzIiwgInNldEV4dGVuZE1hdGNoZXJzIiwgIm5ld0V4dGVuZE1hdGNoZXJzIiwgImZvcm1hdCIsICJ2IiwgIkRlbm8iLCAicHJvY2VzcyIsICJpbnNwZWN0IiwgImJhc2ljSW5zcGVjdCIsICJmb3JtYXR0ZXJzIiwgImZtdCIsICJyZXN1bHQiLCAiYXNzZXJ0Tm90U3RyaWN0RXF1YWxzIiwgImFjdHVhbCIsICJleHBlY3RlZCIsICJtc2ciLCAibXNnU3VmZml4IiwgIkFzc2VydGlvbkVycm9yIiwgImZvcm1hdCIsICJEZW5vIiwgIm5vQ29sb3IiLCAiZW5hYmxlZCIsICJjb2RlIiwgIm9wZW4iLCAiY2xvc2UiLCAicnVuIiwgInN0ciIsICJib2xkIiwgInJlZCIsICJncmVlbiIsICJ3aGl0ZSIsICJzdHIiLCAicnVuIiwgImNvZGUiLCAiZ3JheSIsICJicmlnaHRCbGFjayIsICJiZ1JlZCIsICJiZ0dyZWVuIiwgIkFOU0lfUEFUVEVSTiIsICJzdHJpcEFuc2lDb2RlIiwgInN0cmluZyIsICJjcmVhdGVDb2xvciIsICJkaWZmVHlwZSIsICJiYWNrZ3JvdW5kIiwgImJnR3JlZW4iLCAid2hpdGUiLCAiZ3JlZW4iLCAiYm9sZCIsICJiZ1JlZCIsICJyZWQiLCAiZ3JheSIsICJjcmVhdGVTaWduIiwgImJ1aWxkTWVzc2FnZSIsICJkaWZmUmVzdWx0IiwgIm9wdGlvbnMiLCAidHJ1bmNhdGVEaWZmIiwgInN0cmluZ0RpZmYiLCAibWVzc2FnZXMiLCAiZGlmZk1lc3NhZ2VzIiwgInJlc3VsdCIsICJjb2xvciIsICJsaW5lIiwgImRldGFpbCIsICJjcmVhdGVDb21tb24iLCAiQSIsICJCIiwgImNvbW1vbiIsICJpIiwgImEiLCAiYiIsICJhc3NlcnRGcCIsICJ2YWx1ZSIsICJiYWNrVHJhY2UiLCAiY3VycmVudCIsICJzd2FwcGVkIiwgInJvdXRlcyIsICJkaWZmVHlwZXNQdHJPZmZzZXQiLCAiTSIsICJOIiwgInJlc3VsdCIsICJqIiwgInR5cGUiLCAicHJldiIsICJjcmVhdGVGcCIsICJrIiwgInB0ciIsICJzbGlkZSIsICJkb3duIiwgImlzQWRkaW5nIiwgImRpZmYiLCAicHJlZml4Q29tbW9uIiwgIm9mZnNldCIsICJkZWx0YSIsICJsZW5ndGgiLCAiZnAiLCAic25ha2UiLCAiY3VycmVudEZwIiwgInAiLCAiaW5kZXgiLCAidW5lc2NhcGUiLCAic3RyaW5nIiwgInN0ciIsICJXSElURVNQQUNFX1NZTUJPTFMiLCAidG9rZW5pemUiLCAid29yZERpZmYiLCAidG9rZW4iLCAidG9rZW5zIiwgImxpbmVzIiwgImxpbmUiLCAiaSIsICJjcmVhdGVEZXRhaWxzIiwgInR5cGUiLCAicmVzdWx0IiwgInQiLCAiTk9OX1dISVRFU1BBQ0VfUkVHRVhQIiwgImRpZmZTdHIiLCAiQSIsICJCIiwgImRpZmZSZXN1bHQiLCAiZGlmZiIsICJhZGRlZCIsICJyZW1vdmVkIiwgImhhc01vcmVSZW1vdmVkTGluZXMiLCAiYUxpbmVzIiwgImJMaW5lcyIsICJiIiwgInRva2VuaXplZCIsICJ2YWx1ZSIsICJhc3NlcnRTdHJpY3RFcXVhbHMiLCAiYWN0dWFsIiwgImV4cGVjdGVkIiwgIm1zZyIsICJtc2dTdWZmaXgiLCAibWVzc2FnZSIsICJhY3R1YWxTdHJpbmciLCAiZm9ybWF0IiwgImV4cGVjdGVkU3RyaW5nIiwgIndpdGhPZmZzZXQiLCAibCIsICJyZWQiLCAic3RyaW5nRGlmZiIsICJkaWZmUmVzdWx0IiwgImRpZmZTdHIiLCAiZGlmZiIsICJkaWZmTXNnIiwgImJ1aWxkTWVzc2FnZSIsICJBc3NlcnRpb25FcnJvciIsICJhc3NlcnRJbnN0YW5jZU9mIiwgImFjdHVhbCIsICJleHBlY3RlZFR5cGUiLCAibXNnIiwgIm1zZ1N1ZmZpeCIsICJleHBlY3RlZFR5cGVTdHIiLCAiYWN0dWFsVHlwZVN0ciIsICJBc3NlcnRpb25FcnJvciIsICJhc3NlcnRJc0Vycm9yIiwgImVycm9yIiwgIkVycm9yQ2xhc3MiLCAibXNnTWF0Y2hlcyIsICJtc2ciLCAibXNnUHJlZml4IiwgIkFzc2VydGlvbkVycm9yIiwgIm1zZ0NoZWNrIiwgInN0cmlwQW5zaUNvZGUiLCAiYXNzZXJ0RmFsc2UiLCAiZXhwciIsICJtc2ciLCAiQXNzZXJ0aW9uRXJyb3IiLCAiYXNzZXJ0Tm90SW5zdGFuY2VPZiIsICJhY3R1YWwiLCAidW5leHBlY3RlZFR5cGUiLCAibXNnIiwgIm1zZ1N1ZmZpeCIsICJhc3NlcnRGYWxzZSIsICJhc3NlcnRNYXRjaCIsICJhY3R1YWwiLCAiZXhwZWN0ZWQiLCAibXNnIiwgIm1zZ1N1ZmZpeCIsICJBc3NlcnRpb25FcnJvciIsICJhc3NlcnROb3RNYXRjaCIsICJhY3R1YWwiLCAiZXhwZWN0ZWQiLCAibXNnIiwgIm1zZ1N1ZmZpeCIsICJBc3NlcnRpb25FcnJvciIsICJpc1N0cmluZyIsICJ2YWx1ZSIsICJidWlsZEVxdWFsRXJyb3JNZXNzYWdlIiwgImFjdHVhbCIsICJleHBlY3RlZCIsICJvcHRpb25zIiwgImZvcm1hdHRlciIsICJmb3JtYXQiLCAibXNnIiwgIm1zZ1ByZWZpeCIsICJhY3R1YWxTdHJpbmciLCAiZXhwZWN0ZWRTdHJpbmciLCAibWVzc2FnZSIsICJzdHJpbmdEaWZmIiwgImRpZmZSZXN1bHQiLCAiZGlmZlN0ciIsICJkaWZmIiwgImRpZmZNc2ciLCAiYnVpbGRNZXNzYWdlIiwgImJ1aWxkTm90RXF1YWxFcnJvck1lc3NhZ2UiLCAiYXNzZXJ0RXF1YWxzIiwgImFjdHVhbCIsICJleHBlY3RlZCIsICJvcHRpb25zIiwgImVxdWFsIiwgIm1lc3NhZ2UiLCAiYnVpbGRFcXVhbEVycm9yTWVzc2FnZSIsICJBc3NlcnRpb25FcnJvciIsICJhc3NlcnROb3RFcXVhbHMiLCAiYWN0dWFsIiwgImV4cGVjdGVkIiwgIm9wdGlvbnMiLCAiZXF1YWwiLCAibWVzc2FnZSIsICJidWlsZE5vdEVxdWFsRXJyb3JNZXNzYWdlIiwgIkFzc2VydGlvbkVycm9yIiwgIk1PQ0tfU1lNQk9MIiwgImdldE1vY2tDYWxscyIsICJmIiwgIm1vY2tJbmZvIiwgImluc3BlY3RBcmdzIiwgImFyZ3MiLCAiaW5zcGVjdEFyZyIsICJhcmciLCAiRGVubyIsICJidWlsZEVxdWFsT3B0aW9ucyIsICJvcHRpb25zIiwgImN1c3RvbU1lc3NhZ2UiLCAiY3VzdG9tVGVzdGVycyIsICJzdHJpY3RDaGVjayIsICJyZXQiLCAiaXNQcm9taXNlTGlrZSIsICJ2YWx1ZSIsICJoYXNJdGVyYXRvciIsICJvYmplY3QiLCAiaXNBIiwgInR5cGVOYW1lIiwgImlzT2JqZWN0IiwgImEiLCAiaXNPYmplY3RXaXRoS2V5cyIsICJnZXRPYmplY3RLZXlzIiwgInMiLCAiaGFzUHJvcGVydHlJbk9iamVjdCIsICJrZXkiLCAiZW50cmllcyIsICJvYmoiLCAiaXRlcmFibGVFcXVhbGl0eSIsICJiIiwgImFTdGFjayIsICJiU3RhY2siLCAibGVuZ3RoIiwgIml0ZXJhYmxlRXF1YWxpdHlXaXRoU3RhY2siLCAiZmlsdGVyZWRDdXN0b21UZXN0ZXJzIiwgInQiLCAiYWxsRm91bmQiLCAiYVZhbHVlIiwgImhhcyIsICJiVmFsdWUiLCAiZXF1YWwiLCAiYUVudHJ5IiwgImJFbnRyeSIsICJtYXRjaGVkS2V5IiwgIm1hdGNoZWRWYWx1ZSIsICJiSXRlcmF0b3IiLCAibmV4dEIiLCAiYUVudHJpZXMiLCAiYkVudHJpZXMiLCAic3Vic2V0RXF1YWxpdHkiLCAic3Vic2V0IiwgInN1YnNldEVxdWFsaXR5V2l0aENvbnRleHQiLCAic2VlblJlZmVyZW5jZXMiLCAibWF0Y2hSZXN1bHQiLCAicmVzdWx0IiwgInRvQmUiLCAiY29udGV4dCIsICJleHBlY3QiLCAiYXNzZXJ0Tm90U3RyaWN0RXF1YWxzIiwgImFzc2VydFN0cmljdEVxdWFscyIsICJ0b0VxdWFsIiwgImV4cGVjdGVkIiwgInYiLCAiZSIsICJlcXVhbHNPcHRpb25zIiwgImJ1aWxkRXF1YWxPcHRpb25zIiwgIml0ZXJhYmxlRXF1YWxpdHkiLCAiYXNzZXJ0Tm90RXF1YWxzIiwgImFzc2VydEVxdWFscyIsICJ0b1N0cmljdEVxdWFsIiwgInRvQmVDbG9zZVRvIiwgIm51bURpZ2l0cyIsICJ0b2xlcmFuY2UiLCAidmFsdWUiLCAicGFzcyIsICJkZWZhdWx0TWVzc2FnZSIsICJBc3NlcnRpb25FcnJvciIsICJ0b0JlRGVmaW5lZCIsICJ0b0JlVW5kZWZpbmVkIiwgInRvQmVGYWxzeSIsICJpc0ZhbHN5IiwgInRvQmVUcnV0aHkiLCAiaXNUcnV0aHkiLCAidG9CZUdyZWF0ZXJUaGFuT3JFcXVhbCIsICJpc0dyZWF0ZXJPckVxdWFsIiwgInRvQmVHcmVhdGVyVGhhbiIsICJpc0dyZWF0ZXIiLCAidG9CZUluc3RhbmNlT2YiLCAiYXNzZXJ0Tm90SW5zdGFuY2VPZiIsICJhc3NlcnRJbnN0YW5jZU9mIiwgInRvQmVMZXNzVGhhbk9yRXF1YWwiLCAiaXNMb3dlciIsICJ0b0JlTGVzc1RoYW4iLCAidG9CZU5hTiIsICJ0b0JlTnVsbCIsICJ0b0hhdmVMZW5ndGgiLCAibWF5YmVMZW5ndGgiLCAiaGFzTGVuZ3RoIiwgInRvSGF2ZVByb3BlcnR5IiwgInByb3BOYW1lIiwgInByb3BQYXRoIiwgImN1cnJlbnQiLCAicHJvcCIsICJoYXNQcm9wZXJ0eSIsICJlcXVhbCIsICJvZlZhbHVlIiwgImluc3BlY3RBcmciLCAidG9Db250YWluIiwgImRvZXNDb250YWluIiwgImZtdFZhbHVlIiwgImZvcm1hdCIsICJmbXRFeHBlY3RlZCIsICJ0b0NvbnRhaW5FcXVhbCIsICJhc3NlcnRJc0l0ZXJhYmxlIiwgIml0ZW0iLCAicHJldHR5U3RyaW5naWZ5IiwgImpzIiwgInRvTWF0Y2giLCAiYXNzZXJ0Tm90TWF0Y2giLCAiYXNzZXJ0TWF0Y2giLCAidG9NYXRjaE9iamVjdCIsICJyZWNlaXZlZCIsICJkZWZhdWx0TXNnIiwgInN1YnNldEVxdWFsaXR5IiwgInRyaWdnZXJFcnJvciIsICJidWlsZE5vdEVxdWFsRXJyb3JNZXNzYWdlIiwgImJ1aWxkRXF1YWxFcnJvck1lc3NhZ2UiLCAidG9IYXZlQmVlbkNhbGxlZCIsICJjYWxscyIsICJnZXRNb2NrQ2FsbHMiLCAiaGFzQmVlbkNhbGxlZCIsICJ0b0hhdmVCZWVuQ2FsbGVkVGltZXMiLCAidG9IYXZlQmVlbkNhbGxlZFdpdGgiLCAiY2FsbCIsICJpbnNwZWN0QXJncyIsICJvdGhlckNhbGxzIiwgInRvSGF2ZUJlZW5MYXN0Q2FsbGVkV2l0aCIsICJsYXN0Q2FsbCIsICJ0b0hhdmVCZWVuTnRoQ2FsbGVkV2l0aCIsICJudGgiLCAiY2FsbEluZGV4IiwgIm50aENhbGwiLCAidG9IYXZlUmV0dXJuZWQiLCAicmV0dXJuZWQiLCAidG9IYXZlUmV0dXJuZWRUaW1lcyIsICJ0b0hhdmVSZXR1cm5lZFdpdGgiLCAicmV0dXJuZWRXaXRoRXhwZWN0ZWQiLCAidG9IYXZlTGFzdFJldHVybmVkV2l0aCIsICJsYXN0UmV0dXJuZWRXaXRoRXhwZWN0ZWQiLCAidG9IYXZlTnRoUmV0dXJuZWRXaXRoIiwgInJldHVybkluZGV4IiwgIm1heWJlTnRoUmV0dXJuZWQiLCAibnRoUmV0dXJuZWRXaXRoRXhwZWN0ZWQiLCAidG9UaHJvdyIsICJlcnIiLCAiZXhwZWN0Q2xhc3MiLCAiZXhwZWN0TWVzc2FnZSIsICJpc0Vycm9yIiwgImFzc2VydElzRXJyb3IiLCAiSU5URVJOQUxfUExVR0lOUyIsICJhZGRTZXJpYWxpemVyIiwgInBsdWdpbiIsICJtYXRjaGVycyIsICJ0b0hhdmVCZWVuTGFzdENhbGxlZFdpdGgiLCAidG9IYXZlTGFzdFJldHVybmVkV2l0aCIsICJ0b0hhdmVCZWVuTnRoQ2FsbGVkV2l0aCIsICJ0b0hhdmVOdGhSZXR1cm5lZFdpdGgiLCAidG9IYXZlQmVlbkNhbGxlZCIsICJ0b0hhdmVCZWVuQ2FsbGVkVGltZXMiLCAidG9IYXZlQmVlbkNhbGxlZFdpdGgiLCAidG9CZUNsb3NlVG8iLCAidG9CZURlZmluZWQiLCAidG9CZUZhbHN5IiwgInRvQmVHcmVhdGVyVGhhbk9yRXF1YWwiLCAidG9CZUdyZWF0ZXJUaGFuIiwgInRvQmVJbnN0YW5jZU9mIiwgInRvQmVMZXNzVGhhbk9yRXF1YWwiLCAidG9CZUxlc3NUaGFuIiwgInRvQmVOYU4iLCAidG9CZU51bGwiLCAidG9CZVRydXRoeSIsICJ0b0JlVW5kZWZpbmVkIiwgInRvQmUiLCAidG9Db250YWluRXF1YWwiLCAidG9Db250YWluIiwgInRvRXF1YWwiLCAidG9IYXZlTGVuZ3RoIiwgInRvSGF2ZVByb3BlcnR5IiwgInRvSGF2ZVJldHVybmVkVGltZXMiLCAidG9IYXZlUmV0dXJuZWRXaXRoIiwgInRvSGF2ZVJldHVybmVkIiwgInRvTWF0Y2hPYmplY3QiLCAidG9NYXRjaCIsICJ0b1N0cmljdEVxdWFsIiwgInRvVGhyb3ciLCAiZXhwZWN0IiwgInZhbHVlIiwgImN1c3RvbU1lc3NhZ2UiLCAiaXNOb3QiLCAiaXNQcm9taXNlZCIsICJzZWxmIiwgIl8iLCAibmFtZSIsICJpc1Byb21pc2VMaWtlIiwgIkFzc2VydGlvbkVycm9yIiwgImVyciIsICJleHRlbmRNYXRjaGVycyIsICJnZXRFeHRlbmRNYXRjaGVycyIsICJtYXRjaGVyIiwgImFyZ3MiLCAiYXBwbHlNYXRjaGVyIiwgImNvbnRleHQiLCAiZXF1YWwiLCAiZ2V0Q3VzdG9tRXF1YWxpdHlUZXN0ZXJzIiwgInJlc3VsdCIsICJlbWl0QXNzZXJ0aW9uVHJpZ2dlciIsICJhZGRDdXN0b21FcXVhbGl0eVRlc3RlcnMiLCAic2V0RXh0ZW5kTWF0Y2hlcnMiLCAiYW55dGhpbmciLCAiYW55IiwgImFycmF5Q29udGFpbmluZyIsICJjbG9zZVRvIiwgInN0cmluZ0NvbnRhaW5pbmciLCAic3RyaW5nTWF0Y2hpbmciLCAiaGFzQXNzZXJ0aW9ucyIsICJhc3NlcnRpb25zIiwgIm9iamVjdENvbnRhaW5pbmciLCAiYXJyYXlOb3RDb250YWluaW5nIiwgIm9iamVjdE5vdENvbnRhaW5pbmciLCAic3RyaW5nTm90Q29udGFpbmluZyIsICJzdHJpbmdOb3RNYXRjaGluZyIsICJhZGRTZXJpYWxpemVyIiwgImFjdGl2ZVRlc3RTdG9yZSIsICJhY3RpdmVUZXN0U3VpdGUiLCAiU2tpcFRlc3RFcnJvciIsICJGYWlsVGVzdEVycm9yIiwgIm1lc3NhZ2UiLCAiU3VjY2VlZFRlc3RFcnJvciIsICJ0ZXN0Q29udGV4dCIsICJmb3JtYXRFcnJvciIsICJlcnIiLCAiZXhlY3V0ZVRlc3QiLCAiZW50cnkiLCAic3RhcnQiLCAicnVuVGVzdCIsICJmbiIsICJzdG9yZSIsICJwcmV2aW91c1N0b3JlIiwgInByZXZpb3VzU3VpdGUiLCAidGVzdFJlc3VsdHMiLCAicHJveHlFeHBlY3RTdHViIiwgImhhbmRsZXIiLCAiX3RhcmdldCIsICJfcHJvcCIsICJleHBlY3QiLCAiYXJncyIsICJ0ZXN0IiwgIm5hbWUiLCAiZGVzY3JpYmUiLCAicGFyZW50U3VpdGUiLCAicmVzdWx0IiwgImVycm9yIiwgImlzUHJvbWlzZUxpa2UiLCAicGVuZGluZyIsICJ2YWx1ZSJdCn0K
