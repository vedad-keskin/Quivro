# Batch question review

Use this when reviewing and improving an **entire question file** (e.g. all 100 questions in a category/difficulty).

See also:
- [QUESTION_REVIEW.md](./QUESTION_REVIEW.md) — single-question review
- [ISLAM_QUESTION_REVIEW.md](./ISLAM_QUESTION_REVIEW.md) — Islam-specific rules

---

## When to use

| Scenario | Guide |
|----------|-------|
| Fix or replace **one** question | [QUESTION_REVIEW.md](./QUESTION_REVIEW.md) |
| Review **all** questions in a file | **This document** |
| Islam category (single or batch) | [ISLAM_QUESTION_REVIEW.md](./ISLAM_QUESTION_REVIEW.md) + this document |

---

## Request block (copy & paste)

```
## Batch question review

**File:** quivro_web/src/data/questions/mcq/{category}/{difficulty}.ts
**Scope:** full file | lines X–Y

(Optional notes — e.g. "focus on Bosnian translations", "many joke distractors")
```

### Minimal one-liner

```
Batch review @quivro_web/src/data/questions/mcq/biology/hard.ts
```

---

## JSON preservation rules

These fields must **never** change during a batch review:

| Field | Rule |
|-------|------|
| `id` | Keep exactly as-is |
| `type` | Keep as-is |
| `category` | Keep as-is |
| `difficulty` | Keep as-is — unless clearly wrong for the tier |
| `correctIndex` | Must remain valid (`0`–`3`) and point to the correct answer |
| JSON structure | No added/removed fields; same TypeScript shape |
| Question count | Same number of questions in the file |

---

## Code formatting rules

When formatting the question objects, split the `prompt` object into multiple lines, placing the `bs` property directly below `en` with matching indentation (aligned to the same column):

```ts
  {
    id: 'bio-hard-024',
    type: 'mcq',
    category: 'biology',
    difficulty: 'hard',
    prompt: { en: 'Which Australian bird is renowned for its extraordinary ability to mimic chainsaws, camera shutters, and other species?', 
              bs: 'Koja australska ptica je poznata po izvanrednoj sposobnosti oponašanja motornih pila, okidača fotoaparata i drugih vrsta?' },
    options: [
      { en: 'Emu', bs: 'Emu' },
      { en: 'Lyrebird', bs: 'Lirorepa ptica' },
      { en: 'Kookaburra', bs: 'Kukabara' },
      { en: 'Cockatoo', bs: 'Kakadu' },
    ],
    correctIndex: 1,
  },
```

---

## Question improvement rules

Apply to **every** question in the file.

### 1. Grammar & wording (English)

- Natural, professional trivia question phrasing.
- Complete sentences — never end with `…`, `...`, or incomplete clauses.
- Prefer direct questions (`Which…?`, `What…?`, `How…?`) over fill-in-the-blank.
- Remove unnecessary words and filler.
- Avoid vague or ambiguous prompts.

### 2. Bosnian translation quality

- Must sound natural to a native Bosnian speaker.
- Use standard Bosnian terminology (not literal word-for-word translations).
- Keep established loanwords where appropriate (e.g. scientific terms).
- Match the register of the English version.

### 3. Prompt completeness

| Bad | Good |
|-----|------|
| `Electric eels produce shocks using cells called…` | `What are the specialized cells that electric eels use to produce high-voltage shocks?` |
| `Male seahorses are unusual because they:` | `What makes male seahorses unusual among fish?` |
| `Axolotls retain larval traits, a condition called:` | `What is the biological term for retaining larval traits into adulthood, as seen in axolotls?` |

### 4. No duplicate questions

- Before finalizing, check for questions covering the **same fact** or **same topic with the same angle**.
- If a duplicate is found, replace one with a new question at the same difficulty.
- Cross-check with easy and medium files in the same category.

---

## Answer option rules

### Balanced options

- All four options should be **similar in length and grammatical style**.
- The correct answer must not be obviously longer or more detailed than the others.
- Use the same part of speech and format across all four options.

### Plausible distractors

- All wrong answers must be **related to the same topic domain**.
- A reader who doesn't know the answer should find every option believable.
- No joke answers, unrelated categories, or absurd options.

| Bad distractors | Good distractors |
|-----------------|------------------|
| `House cat`, `Rabbit`, `Koala` (for deepest-diving mammal) | `Beaked whale`, `Elephant seal`, `Blue whale` |
| `Fly`, `Photosynthesize`, `Produce silk` (for camel RBC function) | `Resist high temperatures`, `Filter toxins faster`, `Store extra oxygen` |

### Forbidden patterns

Do **not** use these answer patterns unless the question specifically requires them:

- `X only`
- `Only X`
- `X and Y only`
- `The science of X only`
- `A type of X only`
- `X for Y`

### No giveaways

- The correct answer (or an obvious substring) must not appear in the prompt.
- The correct answer must not be the only "real" option among joke answers.

---

## Difficulty calibration

| Tier | Bar | Example |
|------|-----|---------|
| **easy** | Common knowledge. A casual person should have a chance. Answer should not be instantly obvious. | "What do plants need for photosynthesis?" |
| **medium** | Requires some knowledge. Wrong answers must be believable. | "Which organelle packages and ships proteins?" |
| **hard** | Specific details. Enthusiasts or students should know. Avoid obscure facts nobody could reasonably know. | "Which enzyme is heat-stable and used in PCR?" |

### Red flags by tier

- **Easy question that's too hard:** Uses technical jargon; answer requires specialized study.
- **Hard question that's too easy:** Answer is common knowledge; distractors are absurd.
- **Any tier:** Difficulty driven by trick wording rather than knowledge depth.

---

## Fact-checking protocol

Before changing any question, verify the underlying fact.

### General

- Do not introduce new information unless confident it is correct.
- If the original question is factually correct, preserve the intended answer.
- When in doubt, keep the original fact and note the uncertainty.

### By category

| Category | Check |
|----------|-------|
| **Biology** | Taxonomy, species traits, molecular biology terms, ecological relationships |
| **History** | Dates, names, events, titles, chronological order |
| **Geography** | Capitals, borders, populations, physical features |
| **Technology** | Inventor names, dates, specifications, terminology |
| **Sports** | Records, rules, event years, athlete achievements |
| **Movies** | Director, year, cast, awards, plot facts |
| **Famous** | Biographical facts, contributions, nationalities |
| **Islam** | See [ISLAM_QUESTION_REVIEW.md](./ISLAM_QUESTION_REVIEW.md) — source PDFs required |

---

## Category consistency

All questions in the same file should feel like they were written by the same author.

Maintain across the file:

- **Wording style** — same question patterns (e.g. "Which…?", "What…?")
- **Difficulty** — no wild swings within the same tier
- **Answer formatting** — consistent capitalization, punctuation, length
- **Translation register** — same level of formality in Bosnian

---

## Final review checklist

Before returning the improved file, verify **every** question against this list:

```
✓ No question ends with "…" or "..."
✓ No incomplete sentences
✓ No "only" answer patterns (unless required)
✓ No absurd or joke distractors
✓ No obvious giveaway answers
✓ Correct answer is still factually correct
✓ correctIndex points to the right option
✓ All four options are balanced in length and style
✓ Bosnian translations sound natural
✓ No duplicate questions in the file
✓ No duplicate topics across easy/medium/hard in the same category
✓ Difficulty matches the file's tier
✓ JSON / TypeScript is valid
✓ All IDs are unchanged
```

---

## Process workflow

1. **Read** the entire file
2. **Audit** each question against the rules above
3. **Flag** issues (group by issue type for efficiency)
4. **Fix** all flagged questions in a single pass
5. **Cross-check** for duplicates within the file and across difficulty tiers
6. **Fact-check** any changed or suspicious answers
7. **Run** the final review checklist
8. **Return** the improved file with a summary of changes

---

## File locations

| Piece | Path |
|-------|------|
| MCQ banks | `quivro_web/src/data/questions/mcq/{category}/{easy\|medium\|hard}.ts` |
| Image MCQ | `quivro_web/src/data/questions/image_mcq/{category}/...` |
| Types | `quivro_web/src/data/questions/types.ts` |
| Categories | `geography`, `biology`, `technology`, `history`, `sports`, `movies`, `famous`, `islam` |
| This guide | `quivro_web/src/data/questions/BATCH_QUESTION_REVIEW.md` |
