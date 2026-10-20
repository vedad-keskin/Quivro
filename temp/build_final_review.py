from __future__ import annotations

import ast
import json
import re
from collections import Counter
from pathlib import Path


ROOT = Path.cwd()
QUESTION_ROOT = ROOT / "quivro_web/src/data/questions/mcq"
REPORT = ROOT / "docs/mcq-bosanski-lektura.md"
CANVAS = Path(
    r"C:\Users\Administrator\.cursor\projects\c-Users-Administrator-Desktop-Quivro\canvases\mcq-bosanski-pregled.canvas.tsx"
)
BS = re.compile(r"\bbs:\s*(['\"])((?:\\.|(?!\1).)*)\1", re.S)
ID = re.compile(r"\bid:\s*'([^']+)'", re.S)


def source_records():
    records = {}
    coverage = {}
    for path in sorted(QUESTION_ROOT.rglob("*.ts")):
        text = path.read_text(encoding="utf-8")
        ids = list(ID.finditer(text))
        coverage[path.relative_to(QUESTION_ROOT).as_posix()] = len(ids)
        for index, match in enumerate(ids):
            end = ids[index + 1].start() if index + 1 < len(ids) else len(text)
            fields = []
            for bs in BS.finditer(text, match.start(), end):
                quote, raw = bs.groups()
                fields.append((ast.literal_eval(f"{quote}{raw}{quote}"), text.count("\n", 0, bs.start()) + 1))
            assert len(fields) == 5, (path, match.group(1), len(fields))
            assert match.group(1) not in records, match.group(1)
            records[match.group(1)] = (path.relative_to(ROOT).as_posix(), fields)
    assert len(coverage) == 30 and len(records) == 3091, (len(coverage), len(records))
    return records, coverage


def load_findings(records):
    findings = []
    for part in "abc":
        findings.extend(json.loads((ROOT / f"temp/review_{part}.json").read_text(encoding="utf-8")))
    keys = set()
    for finding in findings:
        assert set(finding) == {"id", "file", "line", "field", "original", "proposal", "reason", "certainty"}
        assert finding["id"] in records, finding["id"]
        source_file, fields = records[finding["id"]]
        assert finding["file"] == source_file, finding["id"]
        field = finding["field"]
        field_index = 0 if field == "pitanje" else int(field.rsplit(" ", 1)[1])
        assert 0 <= field_index <= 4, finding
        assert finding["original"] == fields[field_index][0], finding
        finding["line"] = fields[field_index][1]
        assert finding["proposal"] != finding["original"] and finding["reason"], finding
        assert finding["certainty"] in {"sigurno", "provjeriti"}, finding
        key = (finding["id"], finding["field"])
        assert key not in keys, key
        keys.add(key)
    return sorted(findings, key=lambda f: (f["file"], f["line"]))


def write_report(findings, coverage):
    questions = sum(coverage.values())
    answers = questions * 4
    by_category = Counter(f["file"].split("/")[5] for f in findings)
    lines = [
        "# Prijedlozi jezičkih ispravki MCQ pitanja i odgovora",
        "",
        "Pregledano je svih **30 datoteka**, **3.091 pitanje** i **12.364 ponuđena odgovora** na bosanskom jeziku u `quivro_web/src/data/questions/mcq/`. Ispod su prijedlozi za uočene pravopisne, gramatičke, padežne i jasno formulirane tekstualne greške. Izvorni podaci ovim pregledom nisu ispravljani.",
        "",
        f"**Ukupno prijedloga:** {len(findings)}. Označi kućicu uz prijedlog koji prihvataš; ID i lokacija vode do tačnog polja u izvornom kodu. Canvas prikaz omogućava pretragu i bilježenje odluke za svaki prijedlog.",
        "",
        "## Pokrivenost",
        "",
    ]
    for category in sorted({p.split("/")[0] for p in coverage}):
        levels = [f"`{category}/{level}.ts` {coverage[f'{category}/{level}.ts']}" for level in ("easy", "medium", "hard")]
        lines.append(f"- **{category}** — {', '.join(levels)}; {by_category[category]} prijedloga")
    lines += ["", "## Prijedlozi", ""]
    last_category = last_file = None
    for finding in findings:
        file = finding["file"]
        relative = file.split("mcq/", 1)[1]
        category = relative.split("/", 1)[0]
        if category != last_category:
            lines += [f"### {category}", ""]
            last_category = category
            last_file = None
        if relative != last_file:
            lines += [f"#### {relative}", ""]
            last_file = relative
        source_link = f"../{file}#L{finding['line']}"
        label = f"{finding['id']} · {finding['field']}"
        if finding["certainty"] == "provjeriti":
            label += " · provjeriti"
        lines += [
            f"- [ ] **{label}** ([izvor:{finding['line']}]({source_link}))",
            f"  - Izvorno: {finding['original']}",
            f"  - Prijedlog: {finding['proposal']}",
            f"  - Razlog: {finding['reason']}",
            "",
        ]
    REPORT.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")
    assert questions == 3091 and answers == 12364


def write_canvas(findings):
    data = json.dumps(findings, ensure_ascii=False, separators=(",", ":"))
    code = '''import { Button, H1, Pill, Select, Stat, Text, TextInput, useCanvasAction, useCanvasState, useHostTheme, useState } from "cursor/canvas";

type Finding = { id: string; file: string; line: number; field: string; original: string; proposal: string; reason: string; certainty: string };
const findings: Finding[] = __DATA__;
const categories = [...new Set(findings.map(f => f.file.split("/")[5]))];

export default function McqBosanskiPregled() {
  const theme = useHostTheme();
  const open = useCanvasAction();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("sve");
  const [status, setStatus] = useState("sve");
  const [limit, setLimit] = useState(80);
  const [decisions, setDecisions] = useCanvasState<Record<string, "prihvaćeno" | "odbijeno">>("mcq-bosanski-odluke-v1", {});
  const keyOf = (f: Finding) => `${f.id}|${f.field}|${f.proposal}`;
  const decide = (f: Finding, choice: "prihvaćeno" | "odbijeno") => {
    const key = keyOf(f);
    setDecisions(previous => {
      const next = { ...previous };
      if (next[key] === choice) delete next[key]; else next[key] = choice;
      return next;
    });
  };
  const query = search.toLowerCase().trim();
  const filtered = findings.filter(f => {
    const decision = decisions[keyOf(f)];
    return (category === "sve" || f.file.split("/")[5] === category)
      && (status === "sve" || (status === "neodlučeno" ? !decision : decision === status))
      && (!query || `${f.id} ${f.original} ${f.proposal} ${f.reason}`.toLowerCase().includes(query));
  });
  const accepted = findings.filter(f => decisions[keyOf(f)] === "prihvaćeno").length;
  const rejected = findings.filter(f => decisions[keyOf(f)] === "odbijeno").length;
  return <div style={{ background: theme.bg.editor, color: theme.text.primary, minHeight: "100%", padding: 24 }}>
    <div style={{ maxWidth: 1050, margin: "0 auto" }}>
      <H1>Bosanski tekst MCQ pitanja</H1>
      <Text tone="secondary">Pregled svih 30 datoteka · 3.091 pitanje · 12.364 ponuđena odgovora. Prijedlozi nisu primijenjeni na izvorni kod.</Text>
      <div style={{ display: "flex", gap: 28, flexWrap: "wrap", margin: "20px 0" }}>
        <Stat value={findings.length} label="Prijedloga" />
        <Stat value={accepted} label="Prihvaćeno" tone="success" />
        <Stat value={rejected} label="Odbijeno" />
        <Stat value={findings.length - accepted - rejected} label="Za pregled" />
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "end", marginBottom: 16 }}>
        <label style={{ display: "grid", gap: 5, minWidth: 300, flex: 1 }}><Text size="small">Pretraga</Text><TextInput value={search} onChange={setSearch} placeholder="ID, izvorni tekst ili prijedlog" /></label>
        <label style={{ display: "grid", gap: 5 }}><Text size="small">Oblast</Text><Select value={category} onChange={setCategory} options={[{ value: "sve", label: "Sve oblasti" }, ...categories.map(c => ({ value: c, label: c }))]} /></label>
        <label style={{ display: "grid", gap: 5 }}><Text size="small">Odluka</Text><Select value={status} onChange={setStatus} options={[{ value: "sve", label: "Sve odluke" }, { value: "neodlučeno", label: "Za pregled" }, { value: "prihvaćeno", label: "Prihvaćeno" }, { value: "odbijeno", label: "Odbijeno" }]} /></label>
        <Button variant="secondary" onClick={() => open({ type: "openFile", path: "docs/mcq-bosanski-lektura.md" })}>Otvori dokument</Button>
      </div>
      <Text size="small" tone="secondary">Prikazano {Math.min(filtered.length, limit)} od {filtered.length} pronađenih prijedloga. Odluke se pamte u ovom Canvasu.</Text>
      {filtered.slice(0, limit).map(f => {
        const decision = decisions[keyOf(f)];
        return <section key={keyOf(f)} style={{ borderBottom: `1px solid ${theme.stroke.secondary}`, padding: "18px 0" }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <strong>{f.id} · {f.field}</strong>
            {f.certainty === "provjeriti" && <Pill size="sm">Provjeriti</Pill>}
            <Text size="small" tone="tertiary" as="span">{f.file.split("mcq/")[1]}:{f.line}</Text>
          </div>
          <Text><Text weight="semibold">Izvorno: </Text>{f.original}</Text>
          <Text style={{ color: theme.accent.primary }}><Text weight="semibold">Prijedlog: </Text>{f.proposal}</Text>
          <Text size="small" tone="secondary">{f.reason}</Text>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
            <Button variant="ghost" onClick={() => open({ type: "openFile", path: f.file })}>Otvori izvor</Button>
            <Pill active={decision === "prihvaćeno"} onClick={() => decide(f, "prihvaćeno")}>Prihvati</Pill>
            <Pill active={decision === "odbijeno"} onClick={() => decide(f, "odbijeno")}>Odbaci</Pill>
          </div>
        </section>;
      })}
      {filtered.length > limit && <div style={{ padding: "20px 0" }}><Button variant="secondary" onClick={() => setLimit(limit + 80)}>Prikaži još</Button></div>}
    </div>
  </div>;
}
'''
    CANVAS.write_text(code.replace("__DATA__", data), encoding="utf-8")


if __name__ == "__main__":
    records, coverage = source_records()
    findings = load_findings(records)
    write_report(findings, coverage)
    write_canvas(findings)
    print(f"Validated {len(records)} questions, {sum(coverage.values()) * 5} Bosnian strings, and {len(findings)} findings")
    print(REPORT)
    print(CANVAS)
