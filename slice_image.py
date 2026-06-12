from PIL import Image

# Open the downloaded image
img = Image.open("static/team_image_original.webp")

# Let's save a top slice and a bottom slice to see where the cards are located
# Usually they are stacked vertically.
w, h = img.size

# Let's write a helper to save slices
img.crop((0, 0, w, h//2)).save("static/slice_top.png")
img.crop((0, h//2, w, h)).save("static/slice_bottom.png")

print("Slices saved: static/slice_top.png and static/slice_bottom.png")
