#!/usr/bin/env python3
"""Generate og-image.png (1200x630) for autoeffortless.com"""
from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
img = Image.new("RGB", (W, H), "#1b1b2f")
d = ImageDraw.Draw(img)

# subtle gold radial glow top-right
for i in range(120):
    alpha = i
    r = 60 + i * 5
    x, y = W - 150, -100
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    od.ellipse([x - r, y - r, x + r, y + r], fill=(200, 163, 78, alpha // 6))
    img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
    d = ImageDraw.Draw(img)

FONT_B = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
FONT_R = "/System/Library/Fonts/Supplemental/Arial.ttf"
try:
    f_title = ImageFont.truetype(FONT_B, 84)
    f_tag = ImageFont.truetype(FONT_R, 40)
    f_sub = ImageFont.truetype(FONT_R, 30)
except Exception:
    f_title = f_tag = f_sub = ImageFont.load_default()

gold = (200, 163, 78)
white = (255, 255, 255)
muted = (180, 180, 200)

def center_text(y, text, font, fill):
    bbox = d.textbbox((0, 0), text, font=font)
    w = bbox[2] - bbox[0]
    d.text(((W - w) / 2, y), text, font=font, fill=fill)

# brand
center_text(150, "AutoEffortless", f_title, gold)
# gold divider
d.rectangle([(W / 2 - 120, 320), (W / 2 + 120, 324)], fill=gold)
# tagline
center_text(370, "Effortless Business Communication", f_tag, white)
center_text(440, "WhatsApp assistants · Website management · AI editing", f_sub, muted)

img.save("/Users/deonvandenberg/.openclaw/workspace/fred/website/og-image.png", "PNG")
print("og-image.png written")
