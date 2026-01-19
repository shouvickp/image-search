import torch
from PIL import Image
from transformers import CLIPProcessor, CLIPModel

device = "cuda" if torch.cuda.is_available() else "cpu"

model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32").to(device)
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

def get_image_embedding(image: Image.Image):
    inputs = processor(images=image, return_tensors="pt").to(device)
    with torch.no_grad():
        emb = model.get_image_features(**inputs)

    emb = emb / emb.norm(p=2, dim=-1, keepdim=True)
    return emb.cpu().numpy()[0].tolist()

def get_text_embedding(text: str):
    inputs = processor(text=[text], return_tensors="pt", padding=True).to(device)
    with torch.no_grad():
        emb = model.get_text_features(**inputs)

    emb = emb / emb.norm(p=2, dim=-1, keepdim=True)
    return emb.cpu().numpy()[0].tolist()