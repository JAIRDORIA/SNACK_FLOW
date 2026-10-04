/**
 * Migra estilos inline de margin/padding a clases Tailwind en archivos jsx/js dentro de src.
 *
 * Reglas:
 *  - Solo se eliminan claves margin/padding del style inline. El resto de propiedades se conserva.
 *  - Si el style inline queda vacío, se elimina el atributo style por completo.
 *  - Los valores se redondean a la escala estándar de Tailwind (sin valores arbitrarios).
 *  - Si ya existe una clase Tailwind de margin/padding en conflicto, se reemplaza
 *    (el style inline manda por especificidad).
 *  - Valores dinámicos (clamp(...), ternarios, variables, expresiones) se dejan inline.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(process.argv[2] || 'src');
const DRY = process.argv.includes('--dry');
const VERBOSE = process.argv.includes('--verbose');

/* ---------------------------------------------------------------- escala --- */

// Escala estándar de Tailwind v4 (spacing = 0.25rem = 4px). Empate -> menor.
const SCALE = [
  [0, '0'], [2, '0.5'], [4, '1'], [6, '1.5'], [8, '2'], [10, '2.5'],
  [12, '3'], [14, '3.5'], [16, '4'], [20, '5'], [24, '6'], [28, '7'],
  [32, '8'], [36, '9'], [40, '10'], [44, '11'], [48, '12'], [56, '14'],
  [64, '16'], [80, '20'], [96, '24'], [112, '28'], [128, '32'],
];

function pxToScale(px) {
  let best = SCALE[0], bestDist = Infinity;
  for (const e of SCALE) {
    const d = Math.abs(e[0] - px);
    if (d < bestDist) { bestDist = d; best = e; }
  }
  return best[1];
}

/* --------------------------------------------------------------- mapping --- */

const PROP_TO_TYPE = {
  margin: 'm', marginTop: 'mt', marginRight: 'mr', marginBottom: 'mb', marginLeft: 'ml',
  marginInlineStart: 'ms', marginInlineEnd: 'me', marginInline: 'mx', marginBlock: 'my',
  padding: 'p', paddingTop: 'pt', paddingRight: 'pr', paddingBottom: 'pb', paddingLeft: 'pl',
  paddingInlineStart: 'ps', paddingInlineEnd: 'pe', paddingInline: 'px', paddingBlock: 'py',
};

function propToType(prop) {
  return PROP_TO_TYPE[prop.replace(/\s+/g, '')] || null;
}
function isSpacingProp(prop) {
  return propToType(prop) !== null;
}

/* ------------------------------------------------------------- utilidades --- */

// Clases Tailwind de margin/padding SIN variante (las variantes se conservan).
const CLASS_RE = /^(p|px|py|pt|pr|pb|pl|ps|pe|m|mx|my|mt|mr|mb|ml|ms|me)-/;

function classGroup(cls) {
  if (cls.includes(':')) return null;
  const m = CLASS_RE.exec(cls);
  return m ? m[1] : null;
}
function classAxis(group) {
  return group[0]; // 'p' o 'm'
}

function isStaticValue(raw) {
  const v = String(raw).trim();
  if (!v) return false;
  if (v.includes('?')) return false;                 // ternarios
  if (v.includes('`') || /\$\{/.test(v)) return false; // template / interpolación
  if (/^[A-Za-z_$][\w$.]*$/.test(v)) return false;   // variable suelta
  if (v.includes('(') || v.includes(')')) return false; // clamp()/calc()/etc.
  return true;
}

function literalToCss(raw) {
  let v = String(raw).trim();
  if ((v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'")) ||
      (v.startsWith('`') && v.endsWith('`'))) {
    v = v.slice(1, -1);
  }
  return v.trim();
}

function parseSpacing(value) {
  let v = value.trim();
  if (!v || /auto/i.test(v)) return null;
  if (/^-?\d+(\.\d+)?$/.test(v)) v = v + 'px';
  const parts = v.split(/\s+/).filter(Boolean);
  if (parts.length < 1 || parts.length > 4) return null;
  const nums = parts.map(p => {
    // Acepta "12px", "12.5px", "0" (React interpreta números sueltos como px).
    const m = /^(-?\d+(?:\.\d+)?)(px)?$/.exec(p);
    return m ? parseFloat(m[1]) : null;
  });
  if (nums.some(n => n === null)) return null;
  let [t, r, b, l] = [0, 0, 0, 0];
  if (nums.length === 1) t = r = b = l = nums[0];
  else if (nums.length === 2) { t = b = nums[0]; r = l = nums[1]; }
  else if (nums.length === 3) { t = nums[0]; r = l = nums[1]; b = nums[2]; }
  else [t, r, b, l] = nums;
  return { t, r, b, l };
}

/**
 * Convierte valores de spacing que contienen `auto` (ej. "0 auto", "0 auto 16px", "auto")
 * a clases Tailwind. Devuelve null si no se puede interpretar.
 */
function classesForAuto(type, cssVal) {
  const v = cssVal.trim();
  const parts = v.split(/\s+/).filter(Boolean);
  if (parts.length < 1 || parts.length > 4) return null;

  // Validar tokens: px|0|auto
  const isNum = p => /^-?\d+(\.\d+)?(px)?$/.test(p);
  const isAuto = p => p === 'auto';
  if (!parts.every(p => isNum(p) || isAuto(p))) return null;
  if (!parts.some(isAuto)) return null;

  // Expandir a 4 lados.
  let t, r, b, l;
  if (parts.length === 1) { t = r = b = l = parts[0]; }
  else if (parts.length === 2) { t = b = parts[0]; r = l = parts[1]; }
  else if (parts.length === 3) { t = parts[0]; r = l = parts[1]; b = parts[2]; }
  else { [t, r, b, l] = parts; }

  const token = x => isAuto(x) ? 'auto' : pxToScale(parseFloat(x));
  const [T, R, B, L] = [token(t), token(r), token(b), token(l)];
  const base = type[0]; // 'm' o 'p'

  // Sólo tiene sentido para margin (padding no admite auto en CSS).
  if (base === 'p') return null;

  if (T === R && R === B && B === L) return [`m-${T}`];
  if (T === B && R === L) return [`my-${T}`, `mx-${R}`];
  return [`mt-${T}`, `mr-${R}`, `mb-${B}`, `ml-${L}`];
}

function classesFor(type, sides) {
  const base = type[0]; // 'p' o 'm'
  const { t, r, b, l } = sides;
  const S = pxToScale;

  // Propiedades de un solo lado: respetan la dirección original.
  if (type === 'mt') return [`mt-${S(t)}`];
  if (type === 'mr') return [`mr-${S(r)}`];
  if (type === 'mb') return [`mb-${S(b)}`];
  if (type === 'ml') return [`ml-${S(l)}`];
  if (type === 'pt') return [`pt-${S(t)}`];
  if (type === 'pr') return [`pr-${S(r)}`];
  if (type === 'pb') return [`pb-${S(b)}`];
  if (type === 'pl') return [`pl-${S(l)}`];
  if (type === 'ms') return [`ms-${S(l)}`];
  if (type === 'me') return [`me-${S(r)}`];
  if (type === 'px') return [`px-${S(r)}`];
  if (type === 'py') return [`py-${S(t)}`];

  // Propiedades de eje / shorthand completo.
  if (t === r && r === b && b === l) return [`${base}-${S(t)}`];
  if (t === b && r === l) return [`${base}y-${S(t)}`, `${base}x-${S(r)}`];
  return [`${base}t-${S(t)}`, `${base}r-${S(r)}`, `${base}b-${S(b)}`, `${base}l-${S(l)}`];
}

/* --------------------------------------------------------- parse de sintaxis --- */

// Encuentra `style={{ ... }}` (objeto literal) balanceando llaves, saltando strings.
function findStyleBlocks(src) {
  const blocks = [];
  const re = /style=\{\{/g;   // sólo style={{ ... }} (objeto literal), NO style={expr}
  let m;
  while ((m = re.exec(src))) {
    const attrStart = m.index;                       // inicio de "style="
    const objOpen = m.index + 'style={'.length;      // '{' del objeto literal
    let i = objOpen;
    let depth = 0;
    while (i < src.length) {
      const c = src[i];
      if (c === '"' || c === "'" || c === '`') {
        const q = c; i++;
        while (i < src.length && src[i] !== q) { if (src[i] === '\\') i++; i++; }
        i++;
        continue;
      }
      if (c === '{') depth++;
      else if (c === '}') { depth--; if (depth === 0) { i++; break; } }
      i++;
    }
    const objClose = i;                              // justo tras '}' del objeto
    const attrEnd = objClose + 1;                    // tras '}' externo de la expresión
    blocks.push({ attrStart, attrEnd, objOpen, inner: src.slice(objOpen + 1, objClose - 1) });
    re.lastIndex = attrEnd;
  }
  return blocks;
}

function splitTopLevel(content) {
  const entries = [];
  let depth = 0, start = 0;
  for (let i = 0; i < content.length; i++) {
    const c = content[i];
    if (c === '"' || c === "'" || c === '`') {
      const q = c; i++;
      while (i < content.length && content[i] !== q) { if (content[i] === '\\') i++; i++; }
      continue;
    }
    if (c === '{' || c === '[' || c === '(') depth++;
    else if (c === '}' || c === ']' || c === ')') depth--;
    else if (c === ',' && depth === 0) {
      entries.push(content.slice(start, i));
      start = i + 1;
    }
  }
  if (content.slice(start).trim()) entries.push(content.slice(start));
  return entries.map(e => e.trim()).filter(Boolean);
}

function parseEntry(text) {
  let depth = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"' || c === "'" || c === '`') {
      const q = c; i++;
      while (i < text.length && text[i] !== q) { if (text[i] === '\\') i++; i++; }
      continue;
    }
    if (c === '{' || c === '[' || c === '(') depth++;
    else if (c === '}' || c === ']' || c === ')') depth--;
    else if (c === ':' && depth === 0) {
      return { key: text.slice(0, i).trim(), value: text.slice(i + 1).trim() };
    }
  }
  return null;
}

function keyName(key) {
  return key.replace(/^["'`]|["'`]$/g, '').trim();
}

/* --------------------------------------------------- procesa bloque style --- */

/**
 * Procesa el contenido interno de un `style={{ ... }}` conservando el formato original.
 * Devuelve { styleInner, classes } con las propiedades margin/padding eliminadas in-situ,
 * o null si no hay nada que cambiar.
 */
function processStyleBlock(inner) {
  if (/\.\.\./.test(inner)) return null; // spreads -> no tocar

  // Localiza cada entrada de nivel superior con su span exacto en `inner`.
  const entries = entriesWithSpans(inner);
  const classes = [];
  const removals = []; // { start, end } a eliminar del texto original
  let changed = false;

  for (const ent of entries) {
    const parsed = parseEntry(ent.text);
    if (!parsed) continue;
    const key = keyName(parsed.key);
    if (!isSpacingProp(key)) continue;

    const rawVal = parsed.value;
    if (!isStaticValue(rawVal)) continue;

    const cssVal = literalToCss(rawVal);
    const type = propToType(key);

    if (/auto/i.test(cssVal)) {
      const autoCls = classesForAuto(type, cssVal);
      if (autoCls) { classes.push({ type, cls: autoCls }); removals.push(ent); changed = true; }
      continue;
    }

    const sides = parseSpacing(cssVal);
    if (!sides) continue;

    classes.push({ type, cls: classesFor(type, sides) });
    removals.push(ent);
    changed = true;
  }

  if (!changed) return null;

  // Eliminar los spans de las propiedades quitadas, incluyendo una coma adyacente y los
  // espacios/saltos de línea sobrantes, preservando el formato del resto.
  const styleInner = removeSpans(inner, removals);
  return { styleInner, classes };
}

/** Devuelve TODAS las entradas de nivel superior con su span (texto + posición de la coma). */
function entriesWithSpans(content) {
  const entries = [];
  let depth = 0, start = 0;
  for (let i = 0; i < content.length; i++) {
    const c = content[i];
    if (c === '"' || c === "'" || c === '`') {
      const q = c; i++;
      while (i < content.length && content[i] !== q) { if (content[i] === '\\') i++; i++; }
      continue;
    }
    if (c === '{' || c === '[' || c === '(') depth++;
    else if (c === '}' || c === ']' || c === ')') depth--;
    else if (c === ',' && depth === 0) {
      entries.push({ start, commaIndex: i, text: content.slice(start, i) });
      start = i + 1;
    }
  }
  if (content.slice(start).trim()) entries.push({ start, commaIndex: null, text: content.slice(start) });
  return entries.filter(e => e.text.trim());
}

/**
 * Elimina del texto `content` las entradas indicadas preservando el formato del resto.
 * Reconstruye respetando saltos de línea y comas originales.
 */
function removeSpans(content, removals) {
  const entries = entriesWithSpans(content);
  const removed = new Set(removals.map(r => r.start));
  const kept = entries.filter(e => !removed.has(e.start));

  // Whitespace final del contenido original (p.ej. "\n      " antes de `}}`).
  const tail = (content.match(/\s*$/) || [''])[0];

  let out = '';
  for (let i = 0; i < kept.length; i++) {
    const e = kept[i];
    const isLast = i === kept.length - 1;
    out += e.text;
    if (!isLast) out += ',';
  }
  // Quitamos el whitespace final que pudiera quedar pegado a la última entrada y
  // restauramos el original (mantiene el `\n      }}`).
  out = out.replace(/\s+$/, '');
  return out + tail;
}

/* ---------------------------------------------------------- className --- */

function flattenClasses(classes) {
  const byType = new Map();
  const flat = [];
  for (const c of classes) {
    if (!byType.has(c.type)) byType.set(c.type, []);
    byType.get(c.type).push(...c.cls);
    flat.push(...c.cls);
  }
  return { byType, flat };
}

/** Devuelve el conjunto de grupos base (sin variante) que una nueva clase reemplaza. */
function conflictingGroups(newGroup) {
  const axis = newGroup[0]; // 'p' o 'm'
  const all = [`${axis}`, `${axis}x`, `${axis}y`, `${axis}t`, `${axis}r`, `${axis}b`, `${axis}l`];

  if (newGroup === axis) return all;                       // m-/p- reemplaza todo el eje
  if (newGroup === `${axis}x`) return [`${axis}`, `${axis}x`, `${axis}r`, `${axis}l`];
  if (newGroup === `${axis}y`) return [`${axis}`, `${axis}y`, `${axis}t`, `${axis}b`];
  // lado específico (mt/mb/...) -> reemplaza el lado y el shorthand completo
  return [`${axis}`, newGroup];
}

/** Calcula los grupos base a eliminar dado el conjunto completo de clases nuevas. */
function replacedGroupsFor(flatNew) {
  const groups = new Set();
  for (const c of flatNew) {
    const g = classGroup(c);
    if (g) for (const x of conflictingGroups(g)) groups.add(x);
  }
  // Si cubrimos toda una dirección (pt+pb), el shorthand vertical (py) es redundante.
  const axis = flatNew.map(classGroup).filter(Boolean)[0]?.[0];
  if (axis) {
    const has = s => flatNew.some(c => classGroup(c) === `${axis}${s}`);
    if (has('t') && has('b')) groups.add(`${axis}y`);
    if (has('l') && has('r')) groups.add(`${axis}x`);
    if (has('t') && has('b') && has('l') && has('r')) groups.add(axis);
  }
  return groups;
}

function rewriteClassName(rawValue, flatNew) {
  // rawValue puede ser: `"..."`, `'...'`, o `` `...` `` (template)
  let quote = null, inner = rawValue;
  if ((rawValue.startsWith('"') && rawValue.endsWith('"')) ||
      (rawValue.startsWith("'") && rawValue.endsWith("'"))) {
    quote = rawValue[0]; inner = rawValue.slice(1, -1);
  } else if (rawValue.startsWith('`') && rawValue.endsWith('`')) {
    quote = '`'; inner = rawValue.slice(1, -1);
  } else {
    return null; // forma no soportada
  }

  // Grupos (sin variante) que las nuevas clases reemplazan.
  const replaced = replacedGroupsFor(flatNew);

  const removeConflicts = tokens => tokens.filter(tok => {
    const g = classGroup(tok);
    if (!g) return true;          // no es margin/padding o tiene variante -> conservar
    return !replaced.has(g);
  });

  if (quote === '`') {
    // Template literal: no tocamos los segmentos ${...}; sólo evitamos duplicar una clase
    // que ya aparezca textualmente, y añadimos al final del literal (gana por orden).
    const existing = new Set(inner.split(/\s+/).filter(Boolean));
    const toAdd = flatNew.filter(c => !existing.has(c));
    if (!toAdd.length) return '`' + inner + '`';
    const out = inner.trim() ? `${inner.trim()} ${toAdd.join(' ')}` : toAdd.join(' ');
    return '`' + out + '`';
  }

  const tokens = removeConflicts(inner.split(/\s+/).filter(Boolean));
  tokens.push(...flatNew);
  return quote + tokens.join(' ') + quote;
}

/* --------------------------------------------------------------- archivo --- */

function processFile(file) {
  const src = fs.readFileSync(file, 'utf8');
  const blocks = findStyleBlocks(src);
  if (!blocks.length) return null;

  // Recolecta ediciones { start, end, text }
  const edits = [];

  for (const b of blocks) {
    const result = processStyleBlock(b.inner);
    if (!result) continue;
    const { flat } = flattenClasses(result.classes);

    const hasNewline = result.styleInner.includes('\n');
    // Multi-línea: conservamos el formato original (`style={{` + inner + `}}`).
    // Una sola línea: normalizamos espacios (`style={{ ... }}`).
    const styleKept = result.styleInner.trim();
    const styleText = !styleKept
      ? ''
      : hasNewline
        ? `style={{${result.styleInner}}}`
        : `style={{ ${styleKept} }}`;


    // Limites de la etiqueta que contiene este style (aprox).
    const tagStart = src.lastIndexOf('<', b.attrStart);
    let tagEnd = src.indexOf('>', b.attrEnd);
    if (tagStart === -1 || tagEnd === -1) continue;
    tagEnd += 1;

    // Buscar className en la misma etiqueta (preferir el que va después del style).
    const after = src.slice(b.attrEnd, tagEnd);
    const before = src.slice(tagStart, b.attrStart);
    const CN_RE = /className=(\{(?:`[^`]*`|"[^"]*"|'[^']*')\}|"[^"]*"|'[^']*')/g;

    let chosen = null;
    let m2 = CN_RE.exec(after);
    if (m2) chosen = { index: b.attrEnd + m2.index, len: m2[0].length, val: m2[1] };
    else {
      CN_RE.lastIndex = 0;
      let m1 = null, last = null;
      while ((m1 = CN_RE.exec(before))) last = m1;
      if (last) chosen = { index: tagStart + last.index, len: last[0].length, val: last[1] };
    }

    // Caso especial: no hay className y hay clases que aplicar -> creamos el className
    // reemplazando exactamente el atributo style (conservando el espacio previo existente).
    if (!chosen && flat.length) {
      const replacement = 'className="' + flat.join(' ') + '"' + (styleKept ? ' ' + styleText : '');
      edits.push({ start: b.attrStart, end: b.attrEnd, text: replacement });
      continue;
    }

    // Si se elimina el style por completo, limpiamos el espacio en blanco sobrante.
    let attrStart = b.attrStart;
    let attrEnd = b.attrEnd;
    if (!styleKept) {
      // ¿El style está solo en su línea? (solo indentación antes y salto de línea después)
      const beforeNl = src.lastIndexOf('\n', b.attrStart - 1);
      const betweenBefore = src.slice(beforeNl + 1, b.attrStart);
      const afterNlIdx = src.indexOf('\n', b.attrEnd);
      const betweenAfter = afterNlIdx === -1 ? null : src.slice(b.attrEnd, afterNlIdx);

      const aloneOnLine =
        beforeNl !== -1 &&
        /^[ \t]*$/.test(betweenBefore) &&
        betweenAfter !== null &&
        /^[ \t]*$/.test(betweenAfter);

      if (aloneOnLine) {
        // Eliminamos toda la línea (incluyendo su salto) para no dejar línea vacía.
        attrStart = beforeNl;          // desde el \n anterior
        attrEnd = afterNlIdx;          // hasta el \n posterior (sin incluirlo)
      } else {
        // Mismo comportamiento previo: comemos espacios/tabs previos en la misma línea.
        let s = b.attrStart;
        while (s > 0 && (src[s - 1] === ' ' || src[s - 1] === '\t')) s--;
        if (beforeNl < s) {
          attrStart = s;
        }
      }
    }

    if (chosen && flat.length) {
      let valRaw = chosen.val;
      let braced = false;
      if (valRaw.startsWith('{')) { braced = true; valRaw = valRaw.slice(1, -1); }
      const rewritten = rewriteClassName(valRaw, flat);
      if (rewritten) {
        const newAttr = 'className=' + (braced ? '{' + rewritten + '}' : rewritten);
        edits.push({ start: chosen.index, end: chosen.index + chosen.len, text: newAttr });
      } else {
        continue; // no pudimos aplicar clases -> no tocar el style
      }
    }

    edits.push({ start: attrStart, end: attrEnd, text: styleText });
  }

  if (!edits.length) return null;

  // Eliminar ediciones solapadas (no deberían existir) y aplicar de atrás hacia adelante.
  edits.sort((a, b) => b.start - a.start);
  let out = src;
  let prevStart = Infinity;
  for (const e of edits) {
    if (e.end > prevStart) continue; // solapa con una edición ya aplicada -> saltar
    out = out.slice(0, e.start) + e.text + out.slice(e.end);
    prevStart = e.start;
  }

  if (out === src) return null;
  return out;
}

/* ----------------------------------------------------------------- main --- */

function walk(dir, acc) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full, acc);
    else if (/\.(jsx|js)$/.test(name)) acc.push(full);
  }
  return acc;
}

const IS_MAIN = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (IS_MAIN) {
  const files = walk(ROOT, []);
  let changedFiles = 0, changedBlocks = 0;

  for (const file of files) {
    const res = processFile(file);
    if (res == null) continue;
    changedFiles++;
    if (VERBOSE) console.log('  ~', path.relative(ROOT, file));
    if (!DRY) fs.writeFileSync(file, res, 'utf8');
  }

  console.log(`${DRY ? '[DRY] ' : ''}Archivos modificados: ${changedFiles} / ${files.length}`);
}

export { processStyleBlock, findStyleBlocks, processFile, classesFor, parseSpacing, rewriteClassName };
