from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
from urllib.request import Request, urlopen
from concurrent.futures import ThreadPoolExecutor
import json, re
from PIL import Image
root = Path(__file__).resolve().parents[1]
page = (root / "index.html").read_text()
class PageCheck(HTMLParser):
    def __init__(self):
        super().__init__(); self.ids=set(); self.refs=[]; self.tracks=[]; self.issues=[]
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        if "id" in a:
            if a["id"] in self.ids: self.issues.append("Duplicate id: " + a["id"])
            self.ids.add(a["id"])
        for name in ("href","src"):
            if a.get(name): self.refs.append(a[name])
        if tag=="a" and a.get("href","").startswith("https://"):
            assert a.get("target")=="_blank", a
            assert "noopener" in a.get("rel",""), a
        if tag=="img": assert "alt" in a, a
        if "data-track" in a: self.tracks.append((a["data-album"],int(a["data-track"])))
checker=PageCheck(); checker.feed(page)
assert not checker.issues, checker.issues
for ref in checker.refs:
    if ref.startswith("#"): assert ref[1:] in checker.ids, ref
    elif not urlsplit(ref).scheme: assert (root/unquote(urlsplit(ref).path)).is_file(), ref
css=(root/"styles.css").read_text()
for ref in re.findall(r"url\(([^)]+)\)", css):
    ref=ref.strip("'\"")
    if not urlsplit(ref).scheme: assert (root/ref).is_file(), ref
app=(root/"app.js").read_text()
for id_ in re.findall(r"getElementById\('([^']+)'\)",app): assert id_ in checker.ids,id_
albums=json.loads((root/"albums.json").read_text())
assert len(albums)==2 and [len(a["tracks"]) for a in albums]==[17,15]
assert len(checker.tracks)==33
for key,index in checker.tracks:
    album=next(a for a in albums if a["key"]==key); assert 0<=index<len(album["tracks"])
assert "prefers-reduced-motion:reduce" in css
assert "autoplay" not in page
assert "Turn up<br><em>tomorrow." in page
assert 'href="favicon.svg"' in page
assert Image.open(root/"favicon.ico").format=="ICO"
assert Image.open(root/"assets/social-card.jpg").size==(1200,630)
assert (root/"assets/beyond-the-clouds.jpg").stat().st_size < 500000
def check_preview(track):
    req=Request(track["preview"],headers={"Range":"bytes=0-100","User-Agent":"DJD-Official-Website/1.0"})
    with urlopen(req,timeout=30) as res:
        assert res.status in (200,206)
        assert "audio" in res.headers.get("Content-Type","")
        assert len(res.read(101))==101
    return track["title"]
with ThreadPoolExecutor(max_workers=6) as pool:
    checked=list(pool.map(check_preview,[t for a in albums for t in a["tracks"]]))
print("PASS: homepage assets, navigation anchors, external links, image accessibility, 32 verified audio previews, artwork optimization, favicon, social card, and reduced-motion support.")
