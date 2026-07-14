# Question review request

Use this when sending a question to fix, replace, or sanity-check.

Copy the **Request block** below into chat, fill it in, and attach the file path (or paste the question JSON).

---

## Request block (copy & paste)

```
## Question review

**Action:** fix | replace | check-only
**File:** quivro_web/src/data/questions/mcq/{category}/{difficulty}.ts
**ID:** e.g. hist-med-047

**Why:** (optional — e.g. "giveaway", "duplicate", "weak options")

**Question:**
- prompt en:
- prompt bs:
- option A en / bs:
- option B en / bs:
- option C en / bs:
- option D en / bs:
- correctIndex: 0 | 1 | 2 | 3
```

**Action meanings**

| Action | What happens |
|--------|----------------|
| `fix` | Keep same topic/ID; rewrite prompt or options to meet rules |
| `replace` | Swap for a new question at same ID and difficulty bar |
| `check-only` | Report issues only; no file edit unless you ask |

---

## Rules (what gets fixed automatically)

### 1. No giveaways in the prompt

The correct answer (or an obvious substring) must **not** appear in the prompt.

| Bad | Why |
|-----|-----|
| Which wall did **Emperor Hadrian** order built… → **Hadrian's Wall** | Name in prompt matches answer |
| **Bill Gates** co-founded which company? → **Microsoft** | Too easy if company is strongly tied in general knowledge |
| In **Brazil**, Pelé is from which country? → **Brazil** | Answer repeated in prompt |

**Fix:** Reframe to test knowledge (purpose, era, comparison, location detail) without naming the answer.

### 2. No weak option phrasing

Avoid options that sound like jokes, hints, or half-answers:

| Avoid | Example |
|-------|---------|
| `only` | "The only wall in Britain" |
| `… for …` | "Theodore Roosevelt **for parks**" |
| `mainly` / `mostly` / `primarily` when others don't | Unbalanced hint |
| Longer correct option | Correct answer noticeably longer than distractors |
| Category words in one distractor only | "Berlin Wall" in a Roman Britain question with no other real contenders |

**Fix:** Four short, parallel options — same grammar and length where possible. All should look plausible to someone who doesn't know the answer.

### 3. No conflicts in the same category

Before keeping or replacing, check **same category**, all difficulties:

- Same **ID topic** twice (same person + same angle)
- Same **prompt** or near-duplicate wording
- Same **fact** at easy and medium (e.g. Hadrian's Wall giveaway in medium when easy already has Berlin Wall question with Hadrian as distractor)

**Allowed:** Same figure at different difficulty if the **angle** is clearly different (easy = recognition, medium = context, hard = niche link).

**Cross-category:** Light overlap is OK if angle differs (e.g. famous person vs history event).

### 4. Difficulty bar

| Tier | Bar |
|------|-----|
| **easy** | One well-known fact |
| **medium** | Secondary link (country, role, era, institution) |
| **hard** | Specific contribution, work, or niche connection |

Replacement questions must match the **file's** difficulty, not easier.

### 5. Format (code)

- Bilingual `en` and `bs` on prompt and all four options
- `correctIndex`: `0` | `1` | `2` | `3` only
- Options array closes with `],` not `},`
- Strings with apostrophes: use double quotes (`"women's rights"`) or rephrase
- Famous category: no music-industry questions

---

## Examples

### Bad → fixed (same ID, reframe)

**Before (hist-med-047 style giveaway)**

```ts
prompt: { en: 'Which wall did Emperor Hadrian order built in northern Britain?', ... }
options: [{ en: 'Hadrian's Wall', ... }, ...]
```

**After**

```ts
prompt: {
  en: 'In Roman Britain, which fortified barrier was built farther north than an earlier frontier wall but was soon abandoned?',
  bs: 'U rimskoj Britaniji, koja utvrđena prepreka je sagrađena sjevernije od ranijeg graničnog zida, ali je ubrzo napuštena?',
}
options: [
  { en: 'Antonine Wall', bs: 'Antoninov zid' },
  { en: 'Servian Wall', bs: 'Servijev zid' },
  { en: 'Aurelian Wall', bs: 'Aurelijanov zid' },
  { en: 'Limes Germanicus', bs: 'Limes Germanicus' },
]
```

### Bad options → fixed

**Before**

```ts
{ en: 'Theodore Roosevelt for parks', bs: '...' }
{ en: 'The only Roman wall', bs: '...' }
```

**After**

```ts
{ en: 'Theodore Roosevelt', bs: 'Theodore Roosevelt' }
{ en: 'Antonine Wall', bs: 'Antoninov zid' }
```

---

## Minimal one-liner requests

If the question is already in the repo, this is enough:

```
Review hist-med-047 in history/medium.ts — fix or replace (giveaway)
```

Or:

```
@quivro_web/src/data/questions/mcq/history/medium.ts (648-661) bad one, replace or fix
```

---

## After review

You will get:

1. **Verdict** — fix kept topic | replaced | OK as-is  
2. **Issues** — giveaway, weak options, duplicate, difficulty  
3. **Diff** — exact change in the bank file  
4. **Conflict check** — note if same category already covers the topic  

---

## File locations

| Piece | Path |
|-------|------|
| MCQ banks | `quivro_web/src/data/questions/mcq/{category}/{easy\|medium\|hard}.ts` |
| Image MCQ | `quivro_web/src/data/questions/image_mcq/{category}/...` |
| Types | `quivro_web/src/data/questions/types.ts` |
| Categories | `geography`, `biology`, `technology`, `history`, `sports`, `movies`, `famous`, `islam` |
