from PIL import Image
import numpy as np

img = Image.open("static/team_image_original.webp")
data = np.array(img)

# Print corner colors to see the background
print("Top-left corner color:", data[0, 0])
print("Top-right corner color:", data[0, -1])
print("Bottom-left corner color:", data[-1, 0])
print("Bottom-right corner color:", data[-1, -1])

# Convert to grayscale to find bounding boxes
gray = img.convert("L")
gray_data = np.array(gray)

# The background color is a light color (near 240-255). Let's find rows/columns that differ from background.
# We can find rows where the standard deviation is significant or where min value is low.
bg_val = gray_data[0, 0]
diff = np.abs(gray_data - bg_val)
active_pixels = diff > 10

# Find bounding box of all active pixels
rows = np.any(active_pixels, axis=1)
cols = np.any(active_pixels, axis=0)
ymin, ymax = np.where(rows)[0][[0, -1]]
xmin, xmax = np.where(cols)[0][[0, -1]]

print(f"Active region: ymin={ymin}, ymax={ymax}, xmin={xmin}, xmax={xmax}")

# Let's find horizontal split point: a row inside [ymin, ymax] with minimum diff from background
middle_third_y = np.arange(ymin + (ymax - ymin)//3, ymin + 2*(ymax - ymin)//3)
row_diffs = [np.mean(diff[y]) for y in middle_third_y]
split_y = middle_third_y[np.argmin(row_diffs)]
print("Suggested horizontal split Y:", split_y)

# Let's crop the two main cards
card1 = img.crop((xmin, ymin, xmax, split_y))
card2 = img.crop((xmin, split_y, xmax, ymax))

card1.save("static/card_team_members_original.png")
card2.save("static/card_team_veer_original.png")
print("Saved card1 and card2.")

# Now let's find the boundaries of individual avatars in card 1 and card 2!
# Let's analyze card 1 (Team Members)
# It contains 4 member cards. Let's see if we can find their bounding boxes.
# Since we know the layout (2x2 grid), let's crop the 4 sub-cards or 4 avatars.
