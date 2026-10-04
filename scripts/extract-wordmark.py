"""Export the MillionAIre Club wordmark vectors from the supplied membership-card PDF.

The paths are copied verbatim from the PDF (page 1, white fills). Nothing is
redrawn: each glyph group is written as an SVG <path> in the PDF's own
coordinate space so the video can mask/animate parts independently.
Run: python3 scripts/extract-wordmark.py  (needs `pip install pymupdf`)
"""
import json, pymupdf

doc = pymupdf.open("assets/membership-card.pdf")
page = doc[0]
draws = [d for d in page.get_drawings() if d.get("fill") == (1.0, 1.0, 1.0) and d["type"] == "f"]

def fmt(p):
    return f"{p.x:.3f} {p.y:.3f}"

def to_d(d):
    out, cur, start = [], None, None
    for it in d["items"]:
        op = it[0]
        if op == "re":
            r = it[1]
            out.append(f"M{r.x0:.3f} {r.y0:.3f}H{r.x1:.3f}V{r.y1:.3f}H{r.x0:.3f}Z")
            cur = None
            continue
        if op == "qu":
            q = it[1]
            out.append(f"M{fmt(q.ul)}L{fmt(q.ur)}L{fmt(q.lr)}L{fmt(q.ll)}Z")
            cur = None
            continue
        p0 = it[1]
        if cur is None or abs(cur.x - p0.x) > 1e-3 or abs(cur.y - p0.y) > 1e-3:
            if cur is not None and d.get("closePath"):
                out.append("Z")
            out.append("M" + fmt(p0))
            start = p0
        if op == "l":
            out.append("L" + fmt(it[2])); cur = it[2]
        elif op == "c":
            out.append(f"C{fmt(it[2])} {fmt(it[3])} {fmt(it[4])}"); cur = it[4]
    out.append("Z")
    return "".join(out)

paths = []
for d in draws:
    r = d["rect"]
    paths.append({"d": to_d(d), "evenOdd": bool(d.get("even_odd")),
                  "bbox": [round(r.x0, 3), round(r.y0, 3), round(r.x1, 3), round(r.y1, 3)]})

# Group glyphs by position (PDF points). Wordmark spans x 28.5..151.1, y 35.3..67.7.
def group(p):
    x0, y0, x1, y1 = p["bbox"]
    if y0 > 56.5:
        return "byNoteai" if x1 < 121.5 else "club"
    if 101 <= x0 < 121.6 and x1 < 121.6:
        return "A"
    if x0 >= 123 and x1 < 128 and y1 < 40:
        return "star"
    if 121.6 <= x0 < 123:
        return "i"
    if x0 >= 129:
        return "re"
    return "million"

groups = {}
for p in paths:
    groups.setdefault(group(p), []).append(p)

xs = [p["bbox"][0] for p in paths] + [p["bbox"][2] for p in paths]
ys = [p["bbox"][1] for p in paths] + [p["bbox"][3] for p in paths]
out = {"viewBox": [min(xs), min(ys), max(xs) - min(xs), max(ys) - min(ys)], "groups": groups}
open("src/wordmark-paths.json", "w").write(json.dumps(out, indent=1))
print({k: len(v) for k, v in groups.items()}, out["viewBox"])
