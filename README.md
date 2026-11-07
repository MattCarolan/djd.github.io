# DJD · Beyond the Clouds

Official DJD music website at https://djd.rip. Static HTML, CSS, and JavaScript served directly from the main branch on GitHub Pages. No backend, accounts, or tracking scripts.

Both original album covers, the artist image, listening links, and 32 audio previews come from DJD’s HyperFollow releases. Preview audio loads only after a listener presses play. External music-platform links open in a new tab.

The asset preparation workflow downloads the original images and self-hosted fonts, optimizes the hero artwork, prepares vinyl-record favicons, and checks all 32 published audio previews. Generated assets are committed to main. Runtime hosting needs no build.

Typography: DM Sans and Libre Caslon Display, both SIL Open Font License 1.1. License texts are in assets/.

Validation: node --check app.js and python scripts/verify-site.py. Image packaging: python scripts/prepare-assets.py (requires Pillow).
