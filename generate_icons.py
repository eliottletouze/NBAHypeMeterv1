from PIL import Image, ImageDraw
import math

BG = (8, 8, 15, 255)
ORANGE = (232, 99, 26, 255)
LINES = (26, 10, 0, 255)
PURPLE = (155, 127, 255)


def draw_basketball_layer(size, ball_r):
    """Retourne un layer RGBA avec uniquement le ballon (fond transparent)."""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    cx = cy = size // 2
    lw = max(2, int(ball_r * 0.03))

    # Boule orange
    draw.ellipse([cx - ball_r, cy - ball_r, cx + ball_r, cy + ball_r], fill=ORANGE)

    # Lignes noires
    draw.line([cx, cy - ball_r, cx, cy + ball_r], fill=LINES, width=lw)
    draw.line([cx - ball_r, cy, cx + ball_r, cy], fill=LINES, width=lw)

    ao = int(ball_r * 0.55)
    draw.arc([cx - ball_r - ao, cy - ball_r, cx + ao, cy + ball_r], 300, 60,  fill=LINES, width=lw)
    draw.arc([cx - ao, cy - ball_r, cx + ball_r + ao, cy + ball_r], 120, 240, fill=LINES, width=lw)

    # Masque circulaire (clippe uniquement ce layer)
    mask = Image.new('L', (size, size), 0)
    ImageDraw.Draw(mask).ellipse([cx - ball_r, cy - ball_r, cx + ball_r, cy + ball_r], fill=255)
    img.putalpha(mask)
    return img


def make_icon(size, output_path):
    # Fond arrondi
    bg = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    radius = int(size * 0.22)
    ImageDraw.Draw(bg).rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=BG)

    # Halo violet
    halo = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    hd = ImageDraw.Draw(halo)
    cx = cy = size // 2
    ball_r = int(size * 0.38)
    for i in range(4):
        r = ball_r + int(size * 0.045) + i * int(size * 0.018)
        alpha = max(8, 35 - i * 9)
        lw = max(1, int(size * 0.007))
        hd.ellipse([cx - r, cy - r, cx + r, cy + r], outline=PURPLE + (alpha,), width=lw)

    # Ballon
    ball = draw_basketball_layer(size, ball_r)

    # Composite
    out = Image.alpha_composite(bg, halo)
    out = Image.alpha_composite(out, ball)
    out.save(output_path, 'PNG')
    print(f"Saved {output_path} ({size}x{size})")
    return out


def make_splash(width, height, output_path):
    img = Image.new('RGBA', (width, height), BG)
    cx, cy = width // 2, height // 2
    ball_r = int(min(width, height) * 0.25)
    ball = draw_basketball_layer(max(width, height), ball_r)
    # Centre le layer ball
    offset_x = (width - max(width, height)) // 2
    offset_y = (height - max(width, height)) // 2
    img.paste(ball, (offset_x, offset_y), ball)
    img.save(output_path, 'PNG')
    print(f"Saved {output_path} ({width}x{height})")


def make_android_foreground(size, output_path):
    ball_r = int(size * 0.32)
    img = draw_basketball_layer(size, ball_r)
    img.save(output_path, 'PNG')
    print(f"Saved {output_path} ({size}x{size})")


def make_android_background(size, output_path):
    Image.new('RGB', (size, size), BG[:3]).save(output_path, 'PNG')
    print(f"Saved {output_path} ({size}x{size})")


def make_android_monochrome(size, output_path):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    cx = cy = size // 2
    ball_r = int(size * 0.32)
    lw = max(2, int(ball_r * 0.03))
    draw.ellipse([cx - ball_r, cy - ball_r, cx + ball_r, cy + ball_r], fill=(255, 255, 255, 255))
    draw.line([cx, cy - ball_r, cx, cy + ball_r], fill=(0, 0, 0, 255), width=lw)
    draw.line([cx - ball_r, cy, cx + ball_r, cy], fill=(0, 0, 0, 255), width=lw)
    ao = int(ball_r * 0.55)
    draw.arc([cx - ball_r - ao, cy - ball_r, cx + ao, cy + ball_r], 300, 60, fill=(0, 0, 0, 255), width=lw)
    draw.arc([cx - ao, cy - ball_r, cx + ball_r + ao, cy + ball_r], 120, 240, fill=(0, 0, 0, 255), width=lw)
    mask = Image.new('L', (size, size), 0)
    ImageDraw.Draw(mask).ellipse([cx - ball_r, cy - ball_r, cx + ball_r, cy + ball_r], fill=255)
    img.putalpha(mask)
    img.save(output_path, 'PNG')
    print(f"Saved {output_path} ({size}x{size})")


def make_favicon(size, output_path):
    make_icon(size, output_path)


base = '/Users/eliottletouze/Documents/NBAApp/NBAHypeMeter/assets'

make_icon(1024, f'{base}/icon.png')
make_splash(1242, 2436, f'{base}/splash-icon.png')
make_android_foreground(1024, f'{base}/android-icon-foreground.png')
make_android_background(1024, f'{base}/android-icon-background.png')
make_android_monochrome(1024, f'{base}/android-icon-monochrome.png')
make_favicon(48, f'{base}/favicon.png')

print("\nDone!")
