from PIL import Image
import numpy as np

img = Image.open("static/team_image_original.webp")
w, h = img.size
data = np.array(img)

# We want to crop:
# 1. Sai Ashirbad Behera's avatar (Top-Right quadrant of card 1, which is top half of image)
# 2. Gaurav Gaikwad's avatar (Bottom-Left quadrant of card 1, which is top half of image)
# 3. Ranjeet Kumar's avatar (Bottom-Right quadrant of card 1, which is top half of image)
# 4. Bharatiya Veer Logo (Left part of card 2, which is bottom half of image)

# Let's inspect the active region first:
# ymin=88, ymax=887, xmin=72, xmax=951, split_y=462

# Let's find the logo in card 2 (Y: 462 to 887, X: 72 to 951)
# The logo is in the left section of card 2, around X: 100 to 300, Y: 500 to 750.
# Let's crop a reasonable box for the logo and save it.
# We can also detect colorful regions by checking std(R, G, B) > 15
rgb = data[:, :, :3]
std_dev = np.std(rgb, axis=2)
is_colorful = (std_dev > 15) & (data[:, :, 3] > 0)

# Let's write a helper to find the center of a colorful blob in a bounding box
def find_blob_center(ymin_search, ymax_search, xmin_search, xmax_search):
    region = is_colorful[ymin_search:ymax_search, xmin_search:xmax_search]
    y_idx, x_idx = np.where(region)
    if len(y_idx) == 0:
        return None
    cy = int(np.mean(y_idx)) + ymin_search
    cx = int(np.mean(x_idx)) + xmin_search
    return cx, cy

# Let's find coordinates
# 1. Sai Ashirbad Behera: top right quadrant of card 1
# Y: 88 to 462, X: 512 to 951. Let's search around Sai's card avatar.
sai_center = find_blob_center(88, 462, 512, 650)
print("Sai center:", sai_center)

# 2. Gaurav Gaikwad: bottom left quadrant of card 1
# Y: 275 to 462, X: 72 to 512.
gaurav_center = find_blob_center(275, 462, 72, 250)
print("Gaurav center:", gaurav_center)

# 3. Ranjeet Kumar: bottom right quadrant of card 1
# Y: 275 to 462, X: 512 to 951.
ranjeet_center = find_blob_center(275, 462, 512, 650)
print("Ranjeet center:", ranjeet_center)

# 4. Logo in card 2: left side
# Y: 462 to 887, X: 72 to 350.
logo_center = find_blob_center(462, 887, 72, 350)
print("Logo center:", logo_center)

# Let's crop them!
# Avatars should be square. Let's make them 128x128 or 100x100. Let's do 110x110.
# Logo can be a bit larger, say 160x160.
def crop_and_save(center, size, filename):
    if center is None:
        print(f"Skipping {filename} due to None center")
        return
    cx, cy = center
    half = size // 2
    cropped = img.crop((cx - half, cy - half, cx + half, cy + half))
    cropped.save(filename)
    print(f"Saved {filename} with size {size}x{size}")

crop_and_save(sai_center, 96, "static/avatar_sai.png")
crop_and_save(gaurav_center, 96, "static/avatar_gaurav.png")
crop_and_save(ranjeet_center, 96, "static/avatar_ranjeet.png")
crop_and_save(logo_center, 150, "static/team_logo.png")
