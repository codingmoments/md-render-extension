"""Build dist/md-render-extension-<version>.zip for Chrome Web Store upload (manifest.json at zip root).

Run: python tools/build_zip.py
"""
import json
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
# Only what the extension loads at runtime; tooling, git and dist stay out.
INCLUDE = ["manifest.json", "background.js", "viewer.html", "viewer.css", "viewer.js", "lib", "icons"]


def main() -> None:
    manifest = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))
    for size, rel in manifest.get("icons", {}).items():
        if not (ROOT / rel).is_file():
            raise SystemExit(f"missing icon {rel} (size {size}); run tools/make_icons.py")

    files = []
    for entry in INCLUDE:
        path = ROOT / entry
        if not path.exists():
            raise SystemExit(f"missing {entry}")
        files += sorted(p for p in path.rglob("*") if p.is_file()) if path.is_dir() else [path]

    dist = ROOT / "dist"
    dist.mkdir(exist_ok=True)
    target = dist / f"md-render-extension-{manifest['version']}.zip"
    with zipfile.ZipFile(target, "w", zipfile.ZIP_DEFLATED) as zf:
        for f in files:
            zf.write(f, f.relative_to(ROOT).as_posix())
    print(f"wrote {target} ({len(files)} files, {target.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
