import os
from PIL import Image, ImageFilter, ImageDraw

def create_hero_composite():
    src_path = 'public/landing/v3/hero_engineer_phone.jpg'
    out_path = 'public/landing/v3/hero_engineer_perfect.jpg'
    
    if not os.path.exists(src_path):
        print(f"Source image {src_path} does not exist!")
        return

    src = Image.open(src_path)
    sw, sh = src.size # 1376 x 768
    
    # Target: 1920 x 1080 canvas
    # Layout strategy:
    # 0% to 42% (x: 0 to 820): Left text area. Clean construction environment, soft architectural gradient for 100% crisp text readability.
    # 42% to 65% (x: 820 to 1250): Engineer with yellow hardhat, navy blazer, looking at smartphone in middle gap!
    # 65% to 100% (x: 1250 to 1920): Active building under construction, yellow tower crane, rebar framework rising behind phone mockups!
    
    canvas = Image.new('RGB', (1920, 1080), (248, 250, 252))
    
    # 1. Base construction background: scale src to cover canvas height
    # Scale factor for height = 1080 / 768 = 1.40625
    scale_h = 1080.0 / sh
    scaled_w = int(sw * scale_h) # 1376 * 1.40625 = 1935
    src_scaled = src.resize((scaled_w, 1080), Image.LANCZOS)
    
    # In src_scaled:
    # Engineer was at x: 350 to 760 in original.
    # In src_scaled: engineer is at x: 350*1.40625 = 492 to 760*1.40625 = 1068.
    # If we shift the base image so the engineer is placed at x = 750 to 1320 (middle corridor):
    # Shift offset = 750 - 492 = +258 px to the right!
    offset_x = 260
    
    # Paste the scaled construction scene shifted to the right by offset_x:
    canvas.paste(src_scaled, (offset_x, 0))
    
    # 2. Fill the left side (x: 0 to 260 + text area) smoothly with the left construction environment (sky, building, railing):
    left_fill = src_scaled.crop((offset_x, 0, offset_x + 350, 1080)).transpose(Image.FLIP_LEFT_RIGHT)
    canvas.paste(left_fill, (0, 0))
    
    # Blend seam smoothly around x: 200 to 360
    seam_patch = src_scaled.crop((offset_x, 0, offset_x + 300, 1080))
    mask_seam = Image.new('L', (300, 1080), 0)
    for x in range(300):
        alpha = int(255 * (x / 300.0))
        for y in range(1080):
            mask_seam.putpixel((x, y), alpha)
    canvas.paste(seam_patch, (offset_x - 50, 0), mask_seam)
    
    # Save high quality
    canvas.save(out_path, quality=95)
    print(f"Successfully generated {out_path} with engineer in center corridor (size: {canvas.size})")

if __name__ == '__main__':
    create_hero_composite()
