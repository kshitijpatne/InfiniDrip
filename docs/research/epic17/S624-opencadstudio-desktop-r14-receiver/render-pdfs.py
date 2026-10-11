"""Rasterize receiver-generated S624 PDFs for visual inspection; outputs stay on C:."""

from pathlib import Path

import pypdfium2 as pdfium
from PIL import Image, ImageDraw, ImageOps

ROOT = Path(r"C:\G04-CLO-DXF-Exchange\S624-opencadstudio-desktop-r14-receiver")
RENDERS = ROOT / "Renders"
FIXTURES = (
    "tee-m",
    "fitted-m",
    "polo-m",
    "woven-shirt-m",
    "tank-m",
    "trouser-m",
    "skirt-m",
    "tee-xs",
    "tee-xl",
)


def main() -> None:
    tiles = []
    for fixture in FIXTURES:
        document = pdfium.PdfDocument(RENDERS / f"{fixture}-r14.pdf")
        page = document[0]
        image = page.render(scale=2).to_pil().convert("RGB")
        image.save(RENDERS / f"{fixture}-r14.png")

        thumbnail = ImageOps.contain(image, (800, 566))
        tile = Image.new("RGB", (820, 610), "white")
        tile.paste(thumbnail, ((820 - thumbnail.width) // 2, 30))
        ImageDraw.Draw(tile).text((12, 8), fixture, fill="black")
        tiles.append(tile)

    sheet = Image.new("RGB", (2460, 1830), (225, 225, 225))
    for index, tile in enumerate(tiles):
        sheet.paste(tile, ((index % 3) * 820, (index // 3) * 610))
    sheet.save(RENDERS / "S624-r14-nine-fixture-contact-sheet.png")
    print(f"Rendered {len(FIXTURES)} PDF pages and the contact sheet under {RENDERS}")


if __name__ == "__main__":
    main()
