"""Fetch the artist's published assets and prepare static files for GitHub Pages."""
from pathlib import Path
from urllib.request import Request, urlopen
from concurrent.futures import ThreadPoolExecutor
import re, json, html, time
from PIL import Image, ImageDraw, ImageFont, ImageOps
ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
ASSETS.mkdir(exist_ok=True)
def download(url):
    for attempt in range(3):
        try:
            with urlopen(Request(url, headers={"User-Agent": "DJD-Official-Website/1.0"}), timeout=45) as response:
                return response.read()
        except Exception:
            if attempt == 2: raise
            time.sleep(2)
sources = {
"djd-profile.jpg": "https://distrokid.imgix.net/http%3A%2F%2Fgather.fandalism.com%2Fhyperfollow-blob_image_9512381_zy5ffv1wz77ffescvtv2p_1772990337405.jpg?fm=jpg&q=75&w=800&s=8cb94918e9d8443d2fe2eb7465822e7e",
"quantum-playground.jpg": "https://distrokid.imgix.net/http%3A%2F%2Fgather.fandalism.com%2F9512381--AAF5612D-2E1D-47E4-907F363B7E3A9C12--0--1981374--AlbumCoverQuantumPlayground.png?fm=jpg&q=75&w=800&s=2dcbba42f45c12fd61528a72774d3c60",
"we-dont-do-background-music.jpg": "https://distrokid.imgix.net/http%3A%2F%2Fgather.fandalism.com%2F9512381--079CA9E9-6269-4E09-867FADF2DC66912A--0--2018032--coverart.png?fm=jpg&q=75&w=800&s=2d9bee182f811b9b12badbc5946e1da6",
"dm-sans.ttf": "https://fonts.gstatic.com/s/dmsans/v17/rP2tp2ywxg089UriI5-g4vlH9VoD8CmcqZG40F9JadbnoEwAopxhTg.ttf",
"dm-sans-bold.ttf": "https://fonts.gstatic.com/s/dmsans/v17/rP2tp2ywxg089UriI5-g4vlH9VoD8CmcqZG40F9JadbnoEwARZthTg.ttf",
"libre-caslon-display.ttf": "https://fonts.gstatic.com/s/librecaslondisplay/v18/TuGOUUFxWphYQ6YI6q9Xp61FQzxDRKmzr2lR.ttf",
"dm-sans-OFL.txt": "https://raw.githubusercontent.com/google/fonts/main/ofl/dmsans/OFL.txt",
"libre-caslon-display-OFL.txt": "https://raw.githubusercontent.com/google/fonts/main/ofl/librecaslondisplay/OFL.txt"
}
def save_asset(item):
    name, url = item
    target = ASSETS / name
    if not target.exists(): target.write_bytes(download(url))
    return name, target.stat().st_size
with ThreadPoolExecutor(max_workers=4) as pool:
    for name, size in pool.map(save_asset, sources.items()): print(f"Ready: {name} ({size} bytes)")
hero = Image.open(ASSETS / "beyond-the-clouds-source.png").convert("RGB")
hero.save(ASSETS / "beyond-the-clouds.jpg", quality=92, optimize=True)
social = ImageOps.fit(hero, (1200, 630), method=Image.Resampling.LANCZOS)
draw = ImageDraw.Draw(social)
draw.text((58, 60), "DJD.", font=ImageFont.truetype(str(ASSETS / "dm-sans-bold.ttf"), 68), fill="#f5f5ed")
serif = ImageFont.truetype(str(ASSETS / "libre-caslon-display.ttf"), 65)
draw.text((58, 165), "Turn up", font=serif, fill="#f5f5ed")
draw.text((58, 231), "tomorrow.", font=serif, fill="#d5f6f0")
social.save(ASSETS / "social-card.jpg", quality=90, optimize=True)
record = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
d = ImageDraw.Draw(record)
d.ellipse((8, 8, 504, 504), fill="#091421")
for radius in (208, 176, 144): d.ellipse((256-radius, 256-radius, 256+radius, 256+radius), outline="#466071", width=8)
d.arc((56, 56, 456, 456), 222, 256, fill="#9cb2ba", width=18)
d.arc((56, 56, 456, 456), 42, 76, fill="#9cb2ba", width=18)
d.ellipse((160, 160, 352, 352), fill="#39e6d5")
d.ellipse((232, 232, 280, 280), fill="#091421")
record.resize((180, 180), Image.Resampling.LANCZOS).save(ROOT / "apple-touch-icon.png")
record.save(ROOT / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
albums = json.loads((ROOT / "albums.json").read_text())
assert [len(a["tracks"]) for a in albums] == [17, 15]
for album in albums:
    print("Using previously verified HyperFollow metadata:", album["title"], len(album["tracks"]), "tracks")
(ROOT / "albums.json").write_text(json.dumps(albums, ensure_ascii=False, indent=2) + "\n")
index = (ROOT / "index.html").read_text()
data = json.dumps(albums, ensure_ascii=False).replace("<", "\\u003c")
index = re.sub(r'(<script id="album-data" type="application/json">).*?(</script>)', lambda m: m.group(1) + data + m.group(2), index, flags=re.S)
(ROOT / "index.html").write_text(index)
print("Prepared all static assets.")
