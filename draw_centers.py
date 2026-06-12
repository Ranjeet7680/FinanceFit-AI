from PIL import Image, ImageDraw

img = Image.open("static/team_image_original.webp")
draw = ImageDraw.Draw(img)

# Centers found
centers = {
    "Sai": (586, 298),
    "Gaurav": (204, 332),
    "Ranjeet": (579, 381),
    "Logo": (280, 617)
}

# Draw red circles around the centers
for name, center in centers.items():
    cx, cy = center
    draw.ellipse((cx - 10, cy - 10, cx + 10, cy + 10), fill="red", outline="white")
    draw.text((cx + 15, cy - 5), name, fill="red")

img.save("static/inspected_centers.png")
print("Saved static/inspected_centers.png")
