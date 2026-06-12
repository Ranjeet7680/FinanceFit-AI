from PIL import Image
import numpy as np

img = Image.open("static/team_image_original.webp")
data = np.array(img)

rgb = data[:, :, :3]
std_dev = np.std(rgb, axis=2)
is_colorful = (std_dev > 15) & (data[:, :, 3] > 0)

def find_blob_center(ymin, ymax, xmin, xmax):
    region = is_colorful[ymin:ymax, xmin:xmax]
    y_idx, x_idx = np.where(region)
    if len(y_idx) == 0:
        return None
    cy = int(np.mean(y_idx)) + ymin
    cx = int(np.mean(x_idx)) + xmin
    return cx, cy

# Correct ranges for 2x2 grid in Card 1 (Y: 88 to 462, split at ~275)
# Row 1 (88 to 275): Left=Manjunath, Right=Sai
# Row 2 (275 to 462): Left=Gaurav, Right=Ranjeet
# Avatar is on the left side of each card, so we limit X to the left part of each column:
# Left column (72 to 512) -> Avatar in X: 72 to 200
# Right column (512 to 951) -> Avatar in X: 512 to 640

sai_center = find_blob_center(88, 275, 512, 640)
gaurav_center = find_blob_center(275, 462, 72, 200)
ranjeet_center = find_blob_center(275, 462, 512, 640)

# Card 2 has the Logo on the left (Y: 462 to 887, X: 72 to 350)
logo_center = find_blob_center(462, 887, 72, 350)

print("Sai center:", sai_center)
print("Gaurav center:", gaurav_center)
print("Ranjeet center:", ranjeet_center)
print("Logo center:", logo_center)

def crop_and_save(center, size, filename):
    if center is None:
        print(f"Skipping {filename}")
        return
    cx, cy = center
    half = size // 2
    cropped = img.crop((cx - half, cy - half, cx + half, cy + half))
    cropped.save(filename)
    print(f"Saved {filename} with size {size}x{size}")

# Let's save them!
# The avatars are circular. Standard avatar display is round, so square crops are perfect.
crop_and_save(sai_center, 64, "static/avatar_sai.png")
crop_and_save(gaurav_center, 64, "static/avatar_gaurav.png")
crop_and_save(ranjeet_center, 64, "static/avatar_ranjeet.png")
# Logo is a shield. 140x140 or similar size is good.
crop_and_save(logo_center, 130, "static/team_logo.png")

# Let's also save the avatar row from Card 2 for "Bharatiya Veer" card
# It has 4 overlapping avatars in the center: Ranjeet, Gaurav, Sai, Manjunath.
# Let's see if we can find its center.
# The avatars row is in the middle of card 2, around X: 300 to 600, Y: 500 to 650.
avatar_row_center = find_blob_center(500, 650, 300, 600)
print("Avatar row center in card 2:", avatar_row_center)
crop_and_save(avatar_row_center, 120, "static/team_avatars_row.png")
