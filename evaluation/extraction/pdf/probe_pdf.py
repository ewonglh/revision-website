"""Dump raw PDF page structure as JSON, for the Node extractor to classify.

This script only *reports* what PyMuPDF sees. It makes no routing decisions and
applies no thresholds: all classification happens in Node, where it is unit
tested without a PDF or a Python install.

Why Python at all: `find_tables()` is the route that scored 10/10 and 16/16 rows
against arithmetic on the received pack. Reimplementing ruled-grid detection in
Node would replace measured behaviour with an unmeasured guess.

Safety: the input PDF is untrusted. Run with `-I` and treat every output string
as data. Nothing here executes content from the document.

Usage:
    python -I probe_pdf.py <file.pdf> [--max-pages N] > structure.json
"""
import argparse
import hashlib
import json
import sys

import pymupdf

# Ranges that indicate silent text-extraction loss on this course material.
# Reported as signals; deciding what they mean is the Node side's job.
PUA_RANGES = ((0xE000, 0xF8FF), (0xF000, 0xFFFD))
CMEX_BIGOP_GLYPHS = set("PXQZ")  # CMEX10 big operators decode to ASCII
REPLACEMENT_CHAR = "�"


def text_sha256(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def classify_char(ch: str) -> str | None:
    code = ord(ch)
    if ch == REPLACEMENT_CHAR:
        return "replacement-char"
    for low, high in PUA_RANGES:
        if low <= code <= high:
            return "private-use-area"
    return None


def loss_signals(text: str) -> dict:
    """Count characters that indicate the text layer lost information."""
    counts: dict[str, int] = {}
    for ch in text:
        signal = classify_char(ch)
        if signal:
            counts[signal] = counts.get(signal, 0) + 1
    return counts


def tables_of(page) -> list:
    """Report ruled grids, including how many cells are blank.

    Blank cells are reported rather than dropped: a merged header produces one,
    and silently discarding it would hide a structural defect.
    """
    found = []
    try:
        result = page.find_tables()
        tables = list(result.tables)
    except Exception as exc:  # noqa: BLE001 - report, do not crash the page
        return [{"error": f"find_tables failed: {exc}"}]
    for table in tables:
        try:
            rows = table.extract()
        except Exception as exc:  # noqa: BLE001
            found.append({"error": f"extract failed: {exc}"})
            continue
        row_count = len(rows)
        col_count = len(rows[0]) if rows else 0
        total = row_count * col_count
        filled = sum(1 for row in rows for cell in row if cell not in (None, ""))
        bbox = getattr(table, "bbox", None)
        found.append(
            {
                "rows": row_count,
                "cols": col_count,
                "cellsTotal": total,
                "cellsFilled": filled,
                "blankCells": total - filled,
                "bbox": list(bbox) if bbox else None,
                "data": rows,
            }
        )
    return found


def drawings_of(page) -> dict:
    """Summarise vector geometry, which is the only route for circuit wires."""
    try:
        drawings = page.get_drawings()
    except Exception as exc:  # noqa: BLE001
        return {"error": f"get_drawings failed: {exc}"}
    horizontal = 0
    vertical = 0
    other = 0
    for drawing in drawings:
        for item in drawing.get("items", []):
            if item[0] != "l":
                other += 1
                continue
            start, end = item[1], item[2]
            if abs(start.y - end.y) < 0.6:
                horizontal += 1
            elif abs(start.x - end.x) < 0.6:
                vertical += 1
            else:
                other += 1
    return {
        "objects": len(drawings),
        "segments": {"horizontal": horizontal, "vertical": vertical, "other": other},
    }


def images_of(page) -> dict:
    try:
        images = page.get_images(full=True)
    except Exception as exc:  # noqa: BLE001
        return {"error": f"get_images failed: {exc}"}
    return {"count": len(images)}


def annotations_of(page) -> dict:
    try:
        annots = list(page.annots() or [])
    except Exception as exc:  # noqa: BLE001
        return {"error": f"annots failed: {exc}"}
    with_text = sum(1 for a in annots if (a.info or {}).get("content"))
    return {"count": len(annots), "withText": with_text}


def probe_page(page, index: int) -> dict:
    text = page.get_text("text")
    rect = page.rect
    return {
        "page": index + 1,
        "size": {"width": round(rect.width, 2), "height": round(rect.height, 2)},
        "text": {
            "chars": len(text),
            "nonWhitespace": len("".join(text.split())),
            "sha256": text_sha256(text),
            "preview": " ".join(text.split())[:400],
        },
        "lossSignals": loss_signals(text),
        "tables": tables_of(page),
        "drawings": drawings_of(page),
        "images": images_of(page),
        "annotations": annotations_of(page),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("pdf")
    parser.add_argument("--max-pages", type=int, default=0)
    args = parser.parse_args()

    # The page text contains characters outside the platform default codepage
    # (Greek, mathematical symbols). Force UTF-8 so the JSON is not truncated
    # mid-document on a cp1252 console.
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except AttributeError:  # pragma: no cover - very old Python
        pass

    try:
        with pymupdf.open(args.pdf) as doc:
            page_count = len(doc)
            pages = []
            limit = min(page_count, args.max_pages) if args.max_pages else page_count
            for index in range(limit):
                pages.append(probe_page(doc[index], index))
            payload = {
                "kind": "pdf-structure-probe",
                "version": 1,
                "tool": f"pymupdf {pymupdf.__version__}",
                "pagesReported": len(pages),
                "pageCount": page_count,
                "pages": pages,
            }
    except Exception as exc:  # noqa: BLE001 - password/corrupt file
        print(json.dumps({"error": f"{type(exc).__name__}: {exc}"}))
        return 1

    json.dump(payload, sys.stdout, ensure_ascii=False)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
