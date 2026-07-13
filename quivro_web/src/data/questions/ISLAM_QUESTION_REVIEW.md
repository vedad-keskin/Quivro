# Islam question review

Use this when sending an Islam category question to fix, replace, or sanity-check.

See also the general rules in [QUESTION_REVIEW.md](./QUESTION_REVIEW.md).

---

## Minimal one-liner

```
Review islam-easy-042 — too obscure
```

```
@quivro_web/src/data/questions/mcq/islam/easy.ts (420-435) replace, badly written
```

---

## Request block (copy & paste)

```
## Islam question review

**Action:** fix | replace | check-only
**File:** quivro_web/src/data/questions/mcq/islam/{easy|medium|hard}.ts
**ID:** e.g. islam-easy-047

**Why:** (optional — e.g. "too obscure", "boring", "giveaway", "duplicate")

**Question:** (optional if ID is in repo)
```

**If you omit `Action`:** replace when the fact is wrong for the tier, obscure, boring, or unsourced; fix when only wording or options are bad.

---

## Islam-specific rules

### Source

- Facts must come from the 18 PDFs in [`source/`](../../../source/) (Hidaya Learning Academy textbooks).
- Stay within the ehli-sunnet vel-džemaa baseline of the sources; no sectarian framing.
- **Do not** write questions about the curriculum itself (e.g. how many hadiths are in a course, what a textbook chapter covers, Akademija islama stepeni). Use sources for Islamic facts only, not meta questions about the books or school.

### Language

- **`bs`:** Keep source terminology (tevhid, ahlak, sehur, fitra, takva, ibadet, etc.).
- **`en`:** Use standard English Islamic terms with clear wording.

### Difficulty (by obscurity, not stepen)

| Tier | Bar |
|------|-----|
| **easy** | Well-known facts — pillars, major Sira events, famous hadith messages, Fatiha basics |
| **medium** | Secondary links — comparisons, named companions in context, fiqh distinctions |
| **hard** | Niche details — terminology, specific chains, cross-topic connections |

Stepen level in the PDF (Prvi/Drugi/Treći) does **not** map 1:1 to easy/medium/hard.

### Replacement constraints

When swapping a question:

1. Keep `id`, `category: 'islam'`, `difficulty`, `type`
2. Do not change total count in the file
3. Grep all `mcq/islam/*` for duplicate topics/prompts
4. Pull replacement facts from `source/` PDFs; prefer narrative, surprising facts over dry trivia
5. Four parallel plausible options; no giveaway in prompt

---

## Verdict table

| Issue | Action |
|-------|--------|
| Too obscure for file tier | **replace** |
| Boring / weak fact | **replace** |
| Not in source PDFs | **replace** |
| Hidaya / Akademija / course / textbook meta | **replace** |
| Duplicate topic in category | **replace** |
| Wrong difficulty tier | **replace** |
| Badly written prompt | **fix** or **replace** |
| Giveaway in prompt | **fix** |
| Weak / unbalanced options | **fix** |
| OK | **keep** |

---

## Response you get

1. **Verdict** — keep | fix | replace  
2. **Issues** — bullet list  
3. **Diff** — exact change in the bank file  
4. **Conflict check** — other Islam questions on same topic  

---

## File locations

| Piece | Path |
|-------|------|
| MCQ banks | `quivro_web/src/data/questions/mcq/islam/{easy\|medium\|hard}.ts` |
| Image MCQ | `quivro_web/src/data/questions/image_mcq/islam/...` |
| Source PDFs | `source/` (repo root) |
| Types | `quivro_web/src/data/questions/types.ts` |
