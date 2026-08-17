#!/usr/bin/env python3
"""Generate og-image.png (1200x630) with the AutoEffortless brand."""
from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
img = Image.new("RGB", (W, H), "#14142a")
d = ImageDraw.Draw(img)

# gold radial glow top-right
glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
gd = ImageDraw.Draw(glow)
for i in range(140):
    r = 80 + i * 5
    gd.ellipse([W - 220 - r, -140 - r, W - 220 + r, -140 + r], fill=(200, 163, 78, 12))
img = Image.alpha_composite(img.convert("RGBA"), glow).convert("RGB")
d = ImageDraw.Draw(img)

FONT_B = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
FONT_R = "/System/Library/Fonts/Supplemental/Arial.ttf"
f_word = ImageFont.truetype(FONT_B, 96)
f_tag = ImageFont.truetype(FONT_R, 40)
f_sub = ImageFont.truetype(FONT_R, 28)

gold = (200, 163, 78)
gold_light = (233, 217, 174)
white = (255, 255, 255)
muted = (150, 150, 175)

# Mark: rounded square + AE + orbit
mx, my, ms = 110, 315, 190  # center, center, size
d.rounded_rectangle([mx - ms // 2, my - ms // 2, mx + ms // 2, my + ms // 2], radius=44, fill="#1e1e3a")
bbox = d.ellipse([mx - 76, my - 22, mx + 76, my + 22])
# orbit ellipse via scaled circle
orbit = Image.new("RGBA", (W, H), (0, 0, 0, 0))
od = ImageDraw.Draw(orbit)
od.ellipse([mx - 82, my - 30, mx + 82, my + 30], outline=(200, 163, 78, 160), width=4)
orbit = orbit.rotate(24, center=(mx, my), resample=Image.BICUBIC)
img = Image.alpha_composite(img.convert("RGBA"), orbit).convert("RGB")
d = ImageDraw.Draw(img)
d.ellipse([mx + 56 - 8, my - 78 - 8, mx + 56 + 8, my - 78 + 8], fill=gold_light)
d.text((mx, my + 22), "AE", font=ImageFont.truetype(FONT_B, 88), fill=gold, anchor="mm")

# Wordmark
tx = 340
d.text((tx, 240), "Auto", font=f_word, fill=white)
w_auto = d.textlength("Auto", font=f_word)
d.text((tx + w_auto, 240), "Effortless", font=f_word, fill=gold)
d.text((tx, 360), "AI · BUILT & MANAGED", font=f_tag, fill=gold_light)
d.text((tx, 430), "Apps · Websites · AI Email & Calendar · AI Bookings", font=f_sub, fill=muted)

img.save("/Users/deonvandenberg/.openclaw/workspace/fred/website/og-image.png", "PNG")
print("og-image.png written")

# App icon 512
ic = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
id_ = ImageDraw.Draw(ic)
id_.rounded_rectangle([16, 16, 496, 496], radius=116, fill="#14142a")
id_.text((256, 268), "AE", font=ImageFont.truetype(FONT_B, 216), fill=gold, anchor="mm")
ic.save("/Users/deonvandenberg/.openclaw/workspace/fred/website/logo-icon-512.png", "PNG")
print("logo-icon-512.png written")
