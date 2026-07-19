import fs from 'fs';

const mdPath = 'quivro_web/src/data/questions/mcq/movies/candidate-questions.md';
const md = fs.readFileSync(mdPath, 'utf8');

const blocks = [...md.matchAll(/```typescript\r?\n([\s\S]*?)\r?\n```/g)].map((m) => m[1]);
console.log('Found', blocks.length, 'candidate question blocks');

const parsed = [];
let errors = 0;
for (let i = 0; i < blocks.length; i++) {
  try {
    const obj = new Function('return ' + blocks[i].replace(/,\s*$/, ''))();
    if (!obj.prompt?.en || !obj.prompt?.bs) {
      console.log(`Block ${i}: missing prompt en/bs`);
      errors++;
    }
    if (!Array.isArray(obj.options) || obj.options.length !== 4) {
      console.log(`Block ${i}: expected 4 options, got`, obj.options?.length);
      errors++;
    }
    if (typeof obj.correctIndex !== 'number' || obj.correctIndex < 0 || obj.correctIndex > 3) {
      console.log(`Block ${i}: bad correctIndex`, obj.correctIndex);
      errors++;
    }
    for (const opt of obj.options || []) {
      if (!opt.en || !opt.bs) {
        console.log(`Block ${i}: option missing en/bs`, opt);
        errors++;
      }
    }
    parsed.push(obj);
  } catch (e) {
    console.log(`Block ${i}: PARSE ERROR`, e.message);
    errors++;
  }
}
console.log('Parsed OK:', parsed.length, '/ Errors:', errors);

// cross-check against existing files for exact-text duplicates
function normalize(s) {
  return s.toLowerCase().replace(/[’']/g, "'").replace(/[.,?!"“”:;()]/g, '').replace(/\s+/g, ' ').trim();
}

const existingFiles = [
  'quivro_web/src/data/questions/mcq/movies/easy.ts',
  'quivro_web/src/data/questions/mcq/movies/medium.ts',
  'quivro_web/src/data/questions/mcq/movies/hard.ts',
];
const existingNorms = new Set();
for (const f of existingFiles) {
  const text = fs.readFileSync(f, 'utf8');
  const match = text.match(/=\s*(\[[\s\S]*\])\s*;\s*$/);
  const arr = new Function('return ' + match[1])();
  for (const item of arr) existingNorms.add(normalize(item.prompt.en));
}

let overlapCount = 0;
for (const q of parsed) {
  if (existingNorms.has(normalize(q.prompt.en))) {
    console.log('OVERLAP with existing DB:', q.prompt.en);
    overlapCount++;
  }
}
console.log('Overlaps with existing DB:', overlapCount);

// duplicate-within-candidates check
const seen = new Map();
let selfDupCount = 0;
for (const q of parsed) {
  const key = normalize(q.prompt.en);
  if (seen.has(key)) {
    console.log('DUPLICATE within candidates:', q.prompt.en);
    selfDupCount++;
  }
  seen.set(key, true);
}
console.log('Duplicates within candidates:', selfDupCount);
