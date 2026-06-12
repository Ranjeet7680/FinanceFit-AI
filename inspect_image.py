import requests
from PIL import Image
import io

url = "https://storage.googleapis.com/vision-hack2skill-production/innovator/USER00666542/1781163423515-ChatGPTImageJun102026081204PM.webp"

try:
    print("Downloading image...")
    response = requests.get(url)
    response.raise_for_status()
    print("Image downloaded successfully. Size of download:", len(response.content), "bytes")
    
    img = Image.open(io.BytesIO(response.content))
    print("Image details:")
    print("Format:", img.format)
    print("Size (Width x Height):", img.size)
    print("Mode:", img.mode)
    
    # Save the original webp locally so we can reference it
    img.save("static/team_image_original.webp")
    print("Saved original image to static/team_image_original.webp")

except Exception as e:
    print("Error:", e)
