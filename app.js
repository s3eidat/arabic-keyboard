/* Arabic Keyboard — on-screen Arabic (101) layout, physical-key mapping by KeyboardEvent.code, and Arabizi. All local. */
(function () {
  "use strict";
  var $ = S3.$, $$ = S3.$$, h = S3.h;

  // ---------- the standard Arabic (101) layout: [code, normal, shift, latin label] ----------
  var ROWS = [
    [["Backquote", "ذ", "ّ", "`"], ["Digit1", "1", "!", "1"], ["Digit2", "2", "@", "2"], ["Digit3", "3", "#", "3"], ["Digit4", "4", "$", "4"],
      ["Digit5", "5", "%", "5"], ["Digit6", "6", "^", "6"], ["Digit7", "7", "&", "7"], ["Digit8", "8", "*", "8"], ["Digit9", "9", "(", "9"],
      ["Digit0", "0", ")", "0"], ["Minus", "-", "_", "-"], ["Equal", "=", "+", "="]],
    [["KeyQ", "ض", "َ", "Q"], ["KeyW", "ص", "ً", "W"], ["KeyE", "ث", "ُ", "E"], ["KeyR", "ق", "ٌ", "R"], ["KeyT", "ف", "لإ", "T"],
      ["KeyY", "غ", "إ", "Y"], ["KeyU", "ع", "‘", "U"], ["KeyI", "ه", "÷", "I"], ["KeyO", "خ", "×", "O"], ["KeyP", "ح", "؛", "P"],
      ["BracketLeft", "ج", "<", "["], ["BracketRight", "د", ">", "]"], ["Backslash", "\\", "|", "\\"]],
    [["KeyA", "ش", "ِ", "A"], ["KeyS", "س", "ٍ", "S"], ["KeyD", "ي", "]", "D"], ["KeyF", "ب", "[", "F"], ["KeyG", "ل", "لأ", "G"],
      ["KeyH", "ا", "أ", "H"], ["KeyJ", "ت", "ـ", "J"], ["KeyK", "ن", "،", "K"], ["KeyL", "م", "/", "L"], ["Semicolon", "ك", ":", ";"],
      ["Quote", "ط", "\"", "'"]],
    [["KeyZ", "ئ", "~", "Z"], ["KeyX", "ء", "ْ", "X"], ["KeyC", "ؤ", "}", "C"], ["KeyV", "ر", "{", "V"], ["KeyB", "لا", "لآ", "B"],
      ["KeyN", "ى", "آ", "N"], ["KeyM", "ة", "’", "M"], ["Comma", "و", ",", ","], ["Period", "ز", ".", "."], ["Slash", "ظ", "؟", "/"]]
  ];
  var MAP = {};
  ROWS.forEach(function (r) { r.forEach(function (k) { MAP[k[0]] = [k[1], k[2]]; }); });
  var AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
  var COMBINING = /^[ً-ٰٟ]$/;
  var MARKS = [["َ", "fatha · فتحة"], ["ُ", "damma · ضمة"], ["ِ", "kasra · كسرة"], ["ْ", "sukun · سكون"], ["ّ", "shadda · شدة"],
    ["ً", "fathatan · تنوين فتح"], ["ٌ", "dammatan · تنوين ضم"], ["ٍ", "kasratan · تنوين كسر"], ["ٰ", "dagger alef · ألف خنجرية"],
    ["ـ", "tatweel · تطويل"], ["،", "comma"], ["؛", "semicolon"], ["؟", "question mark"], ["«", "quote"], ["»", "quote"]];

  function keyChar(code, shift, digits) {
    var m = MAP[code]; if (!m) return null;
    var c = shift ? m[1] : m[0];
    if (digits === "a" && /^[0-9]$/.test(c)) c = AR_DIGITS[+c];
    return c;
  }
  // Insert s into text replacing [start, end); returns the new text and caret.
  function insertAt(text, start, end, s) { return { text: text.slice(0, start) + s + text.slice(end), caret: start + s.length }; }
  // Backspace: delete the selection, or one code point before the caret.
  function backspaceAt(text, start, end) {
    if (start !== end) return { text: text.slice(0, start) + text.slice(end), caret: start };
    if (!start) return { text: text, caret: 0 };
    var cut = start - 1, cc = text.charCodeAt(cut);
    if (cc >= 0xDC00 && cc <= 0xDFFF && cut > 0) cut--;
    return { text: text.slice(0, cut) + text.slice(start), caret: cut };
  }

  // ---------- Arabizi → Arabic (same rules as S3eidat Arabic Tools) ----------
  var CONS = { b: "ب", c: "ك", d: "د", f: "ف", g: "ج", h: "ه", j: "ج", k: "ك", l: "ل", m: "م", n: "ن", p: "ب", q: "ق", r: "ر", s: "س",
    t: "ت", v: "ف", w: "و", x: "كس", y: "ي", z: "ز", "2": "ء", "3": "ع", "5": "خ", "6": "ط", "7": "ح", "8": "ق", "9": "ص",
    "3'": "غ", "6'": "ظ", "7'": "خ", "9'": "ض", sh: "ش", ch: "ش", kh: "خ", gh: "غ", th: "ث", dh: "ذ" };
  var LONG = { aa: "ا", ee: "ي", ii: "ي", ei: "ي", ey: "ي", ai: "ي", ay: "ي", oo: "و", ou: "و", uu: "و" };
  var MULTI = ["3'", "6'", "7'", "9'", "sh", "ch", "kh", "gh", "th", "dh", "aa", "ee", "ii", "ei", "ey", "ai", "ay", "oo", "ou", "uu"];
  var VOWEL = /^[aeiou]$/;
  function word(w) {
    w = w.toLowerCase();
    if (/^\d+$/.test(w) || !/[a-z]/.test(w)) return w;
    var units = [];
    for (var i = 0; i < w.length;) { var two = w.substr(i, 2), u = MULTI.indexOf(two) >= 0 ? two : w[i]; units.push(u); i += u.length; }
    var out = "", last = "";
    units.forEach(function (u, i) {
      var first = i === 0, end = i === units.length - 1, ch;
      if (u === "'") return;
      if (LONG[u]) ch = first ? "ا" + (u[0] === "a" ? "" : LONG[u]) : LONG[u];
      else if (VOWEL.test(u)) {
        if (first) ch = "ا";
        else if (end) ch = { a: "ا", e: "ه", i: "ي", o: "و", u: "و" }[u];
        else ch = { a: "", e: "", i: "ي", o: "و", u: "" }[u];
      } else if (u === "2" && first) ch = "أ";
      else ch = CONS[u] != null ? CONS[u] : u;
      if (ch && ch === last && CONS[u] && !LONG[u]) return;
      out += ch; if (ch) last = ch;
    });
    return out;
  }
  function arabizi(text) {
    var parts = text.split(/([A-Za-z0-9']+)/), out = "";
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      if (i % 2 === 0) { out += p.replace(/,/g, "،").replace(/;/g, "؛").replace(/\?/g, "؟"); continue; }
      if (/^(el|al|il)$/i.test(p) && /^[ -]$/.test(parts[i + 1] || "") && /[a-z]/i.test(parts[i + 2] || "")) { out += "ال" + word(parts[i + 2]); i += 2; continue; }
      out += word(p);
    }
    return out;
  }
  function counts(t) {
    return {
      words: (t.match(/[\p{L}\p{N}][\p{L}\p{M}\p{N}ـ]*/gu) || []).length,
      chars: Array.from(t).length,
      letters: (t.match(/[ء-غف-يٱ-ۓۺ-ۿ]/g) || []).length
    };
  }

  // ---------- UI ----------
  var ta = $("#text"), kb = $("#kb");
  var st = { mode: "layout", shift: false, lock: false, digits: S3.store("akb.digits") === "a" ? "a" : "w" };
  // Hints are [text, [latin, arabic] pairs…, text]; pairs render inside <bdi> so bidi can't scramble them.
  var HINTS = {
    layout: ["Your physical keys now type Arabic in the standard layout:", [["H", "ا"], ["J", "ت"], ["F", "ب"], ["B", "لا"]], "Ctrl shortcuts still work."],
    arabizi: ["Write Arabic with Latin letters and numbers:", [["3", "ع"], ["7", "ح"], ["2", "ء"], ["5", "خ"], ["sh", "ش"]], "It's a best guess, so check it."],
    native: ["Your keyboard types as normal (use this if you already have an Arabic keyboard installed). The on-screen keys still work.", [], ""]
  };
  function hint(m) {
    var el = $("#modeHint"), x = HINTS[m]; el.textContent = x[0] + " ";
    x[1].forEach(function (p, i) { el.appendChild(h("bdi", { "class": "ak-pair" }, [h("b", { "class": "mono", text: p[0] }), " → ", h("span", { lang: "ar", text: p[1] })])); el.appendChild(document.createTextNode(i < x[1].length - 1 ? ", " : " ")); });
    if (x[2]) el.appendChild(document.createTextNode(x[2]));
  }

  function insert(s) {
    if (document.activeElement !== ta) ta.focus();
    // execCommand keeps the browser's own undo (Ctrl+Z); fall back to a manual splice.
    var ok = false;
    try { ok = document.execCommand("insertText", false, s); } catch (e) { ok = false; }
    if (!ok) { var r = insertAt(ta.value, ta.selectionStart, ta.selectionEnd, s); ta.value = r.text; ta.setSelectionRange(r.caret, r.caret); onText(); }
  }
  function backspace() {
    if (document.activeElement !== ta) ta.focus();
    var ok = false;
    try { ok = document.execCommand("delete", false); } catch (e) { ok = false; }
    if (!ok) { var r = backspaceAt(ta.value, ta.selectionStart, ta.selectionEnd); ta.value = r.text; ta.setSelectionRange(r.caret, r.caret); onText(); }
  }
  function show(c) { return COMBINING.test(c) ? "◌" + c : c; }

  function drawKeys() {
    kb.textContent = "";
    ROWS.forEach(function (row, ri) {
      var r = h("div", { "class": "ak-row" });
      if (ri === 3) r.appendChild(h("button", { type: "button", "class": "ak-key ak-fn ak-shift", "data-fn": "shift", "aria-pressed": String(st.shift), text: "⇧ Shift" }));
      row.forEach(function (k) {
        var main = keyChar(k[0], st.shift, st.digits), alt = keyChar(k[0], !st.shift, st.digits);
        r.appendChild(h("button", { type: "button", "class": "ak-key", "data-code": k[0], "aria-label": main + " (" + k[3] + ")" }, [
          h("span", { "class": "ak-main", lang: "ar", text: show(main) }),
          h("span", { "class": "ak-alt", lang: "ar", text: show(alt) }),
          h("span", { "class": "ak-lat", text: k[3] })
        ]));
      });
      if (ri === 0) r.appendChild(h("button", { type: "button", "class": "ak-key ak-fn ak-wide", "data-fn": "back", "aria-label": "Backspace", text: "⌫" }));
      if (ri === 2) r.appendChild(h("button", { type: "button", "class": "ak-key ak-fn ak-wide", "data-fn": "enter", "aria-label": "Enter", text: "↵" }));
      if (ri === 3) r.appendChild(h("button", { type: "button", "class": "ak-key ak-fn ak-shift", "data-fn": "shift", "aria-pressed": String(st.shift), text: "Shift ⇧" }));
      kb.appendChild(r);
    });
    kb.appendChild(h("div", { "class": "ak-row" }, [
      h("button", { type: "button", "class": "ak-key ak-fn ak-space", "data-fn": "space", "aria-label": "Space", text: "مسافة · space" })
    ]));
    $$(".ak-shift", kb).forEach(function (b) { b.classList.toggle("locked", st.lock); });
  }
  function setShift(on, lock) { st.shift = on; st.lock = !!lock && on; drawKeys(); }

  // Keep focus (and the caret) in the text area while clicking keys.
  function noFocusSteal(el) { el.addEventListener("pointerdown", function (e) { if (e.target.closest("button")) e.preventDefault(); }); }
  noFocusSteal(kb); noFocusSteal($("#marks"));
  var lastShift = 0;
  kb.addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    var fn = b.dataset.fn;
    if (fn === "shift") {
      var now = Date.now();
      if (now - lastShift < 350) setShift(true, true); else setShift(!st.shift, false);
      lastShift = now; return;
    }
    if (fn === "back") return backspace();
    if (fn === "enter") return insert("\n");
    if (fn === "space") return insert(" ");
    var c = keyChar(b.dataset.code, st.shift, st.digits);
    if (c) { insert(c); if (st.shift && !st.lock) setShift(false); }
  });
  MARKS.forEach(function (m) {
    $("#marks").appendChild(h("button", { type: "button", "class": "ak-mark", "data-c": m[0], title: m[1], "aria-label": m[1] }, [h("span", { lang: "ar", text: show(m[0]) })]));
  });
  $("#marks").addEventListener("click", function (e) { var b = e.target.closest("[data-c]"); if (b) insert(b.dataset.c); });

  function flash(code) {
    var k = $(".ak-key[data-code='" + code + "']", kb); if (!k) return;
    k.classList.add("hit"); setTimeout(function () { k.classList.remove("hit"); }, 140);
  }
  ta.addEventListener("keydown", function (e) {
    if (st.mode !== "layout" || e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return;
    var c = keyChar(e.code, e.shiftKey, st.digits);
    if (c == null) return;
    e.preventDefault(); insert(c); flash(e.code);
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Shift" && st.mode === "layout" && document.activeElement === ta && !st.shift) { st.held = true; setShift(true); } });
  document.addEventListener("keyup", function (e) { if (e.key === "Shift" && st.held) { st.held = false; setShift(false); } });

  function onText() {
    var c = counts(ta.value), el = $("#counts");
    el.textContent = "";
    [[c.words, "words", "كلمة"], [c.chars, "characters", "حرف"], [c.letters, "Arabic letters", "حرف عربي"]].forEach(function (x) {
      el.appendChild(h("span", { "class": "chip" }, [h("b", { text: x[0].toLocaleString() }), " " + x[1] + " · ", h("bdi", { lang: "ar", text: x[2] })]));
    });
    S3.store("akb.text", ta.value.length < 200000 ? ta.value : undefined);
  }
  ta.addEventListener("input", S3.debounce(onText, 120));

  // Arabizi composer
  var iziIn = $("#iziIn"), iziOut = $("#iziOut");
  function iziRender() { iziOut.textContent = arabizi(iziIn.value); }
  function iziCommit() {
    var t = arabizi(iziIn.value).trim(); if (!t) return;
    var before = ta.value.slice(0, ta.selectionStart);
    if (document.activeElement !== ta) { ta.focus(); }
    insert((before && !/\s$/.test(before) ? " " : "") + t + " ");
    iziIn.value = ""; iziRender(); iziIn.focus();
  }
  iziIn.addEventListener("input", iziRender);
  iziIn.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); iziCommit(); } });
  $("#iziAdd").addEventListener("click", iziCommit);

  function setMode(m) {
    st.mode = m; S3.store("akb.mode", m);
    hint(m);
    $("#izi").hidden = m !== "arabizi";
    if (m === "arabizi") iziIn.focus(); else ta.focus();
  }
  function seg(el, value, onPick) {
    $$("button", el).forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.v === value));
      b.addEventListener("click", function () { $$("button", el).forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); }); onPick(b.dataset.v); });
    });
  }

  function setSize(px) { ta.style.fontSize = px + "px"; $("#sizeLbl").textContent = px + " px"; S3.store("akb.size", px); }
  $("#size").addEventListener("input", function (e) { setSize(+e.target.value); });
  $("#noSys").addEventListener("change", function (e) { if (e.target.checked) ta.setAttribute("inputmode", "none"); else ta.removeAttribute("inputmode"); S3.store("akb.nosys", e.target.checked); });
  $("#copy").addEventListener("click", function () { if (!ta.value) return S3.toast("Nothing to copy yet", "error"); S3.copy(ta.value); S3.done(); });
  $("#save").addEventListener("click", function () { if (!ta.value) return S3.toast("Nothing to save yet", "error"); S3.download(ta.value, "arabic.txt", "text/plain;charset=utf-8"); S3.done(); });
  $("#clear").addEventListener("click", function () {
    if (!ta.value) return;
    var old = ta.value; ta.value = ""; onText(); ta.focus();
    var t = S3.toast("Cleared ");
    t.appendChild(h("button", { "class": "btn small", text: "Undo", onclick: function () { ta.value = old; onText(); t.remove(); } }));
  });

  // ---------- boot ----------
  var size = +S3.store("akb.size"); size = size >= 16 && size <= 56 ? size : 24;
  $("#size").value = size; setSize(size);
  if (S3.store("akb.nosys") === true) { $("#noSys").checked = true; ta.setAttribute("inputmode", "none"); }
  var saved = S3.store("akb.text"); if (typeof saved === "string") ta.value = saved;
  seg($("#digits"), st.digits, function (v) { st.digits = v; S3.store("akb.digits", v); drawKeys(); });
  var m0 = S3.store("akb.mode"); m0 = HINTS[m0] ? m0 : "layout";
  seg($("#mode"), m0, setMode);
  drawKeys(); onText(); setMode(m0);

  window.S3_DEMO = function () {
    ta.value = "السلام عليكم ورحمة الله\nكيف حالك؟ أتمنى أن تكون بخير.\nمَرْحَبًا بِكُم";
    iziIn.value = "ahlan w sahlan, shukran 7abibi"; iziRender(); onText();
    $("#mode button[data-v=layout]").click(); setShift(false); ta.blur(); flash("KeyH");
  };

  window.S3_SELFTEST = function () {
    var keys = keyChar("KeyH", false) === "ا" && keyChar("KeyJ", false) === "ت" && keyChar("KeyF", false) === "ب" && keyChar("KeyB", false) === "لا" &&
      keyChar("KeyH", true) === "أ" && keyChar("KeyY", true) === "إ" && keyChar("KeyN", true) === "آ" && keyChar("Backquote", false) === "ذ" &&
      keyChar("Backquote", true) === "ّ" && keyChar("KeyQ", true) === "َ" && keyChar("KeyX", true) === "ْ" && keyChar("Slash", true) === "؟" &&
      keyChar("KeyM", false) === "ة" && keyChar("Comma", false) === "و" && keyChar("Digit7", false, "a") === "٧" && keyChar("Digit7", false, "w") === "7" &&
      keyChar("Space", false) === null && keyChar("KeyK", true) === "،";
    // "salam" typed on the physical layout: S L A M → س ل ا م
    var typed = ["KeyS", "KeyG", "KeyH", "KeyL"].map(function (c) { return keyChar(c, false); }).join("") === "سلام";
    var ins = insertAt("abcd", 1, 3, "XY"), bs = backspaceAt("مرحبا", 5, 5), bs2 = backspaceAt("ab😀", 4, 4), bs3 = backspaceAt("abc", 0, 0);
    var edit = ins.text === "aXYd" && ins.caret === 3 && bs.text === "مرحب" && bs.caret === 4 && bs2.text === "ab" && bs3.text === "abc";
    var izi = [["mar7aba", "مرحبا"], ["7abibi", "حبيبي"], ["3arabi", "عربي"], ["kteer", "كتير"], ["5ala9", "خلص"], ["3'arb", "غرب"],
      ["yalla", "يلا"], ["el bait", "البيت"], ["shukran, kifak?", "شكرن، كيفك؟"], ["2ana", "أنا"], ["2026", "2026"]]
      .every(function (p) { return arabizi(p[0]) === p[1]; });
    var c = counts("مرحبا بكم 12");
    return keys && typed && edit && izi && c.words === 3 && c.letters === 8 && c.chars === 12;
  };
})();
