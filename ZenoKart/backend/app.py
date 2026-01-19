from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Query, Form

from PIL import Image
from io import BytesIO

from chroma_client import collection
from embedder import get_image_embedding
from recommender import parse_discount, cosine_similarity, clamp01

app = FastAPI(title="Zeno Kart Product Recommendation")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"status": "200", "message": "Zeno Kart Service is Running"}

@app.post("/recommend")
async def recommend(
    file: UploadFile = File(...),
    top_k: int = 8,
    query_text: str = Form(""),   # optional user text
    min_price: float = Query(0),
    max_price: float = Query(10**9),
    min_rating: float = Query(0),
    min_discount: float = Query(0),
):
    content = await file.read()
    image = Image.open(BytesIO(content)).convert("RGB")

    # ✅ Query image embedding
    query_image_embedding = get_image_embedding(image)

    # ✅ Query text embedding (optional)
    query_text_embedding = None
    if query_text.strip():
        query_text_embedding = get_text_embedding(query_text.strip())

    # ✅ Fetch more results first (rerank later)
    raw_k = max(30, top_k * 5)

    results = collection.query(
        query_embeddings=[query_image_embedding],
        n_results=raw_k,
        include=["metadatas", "distances"]
    )

    metadatas = results["metadatas"][0]
    distances = results["distances"][0]  # smaller = closer

    reranked = []

    for rec, dist in zip(metadatas, distances):
        price = float(rec.get("price", 0))
        rating = float(rec.get("rating", 0))
        discount_percent = parse_discount(str(rec.get("discount", "0%")))

        # ✅ FILTERS
        if price < min_price or price > max_price:
            continue
        if rating < min_rating:
            continue
        if discount_percent < min_discount:
            continue

        # ✅ Image similarity (convert distance -> similarity)
        # If your distance is cosine distance: sim = 1 - dist
        image_sim = clamp01(1.0 - float(dist))

        # ✅ Text similarity
        text_sim = 0.0
        if query_text_embedding and rec.get("text_embedding"):
            text_sim = cosine_similarity(query_text_embedding, rec["text_embedding"])
            text_sim = clamp01((text_sim + 1) / 2)  # normalize [-1,1] -> [0,1]

        # ✅ Rating boost
        rating_boost = clamp01(rating / 5.0)

        # ✅ Discount boost
        discount_boost = clamp01(discount_percent / 100.0)

        # ✅ FINAL SCORE
        final_score = (
            0.65 * image_sim +
            0.20 * text_sim +
            0.10 * rating_boost +
            0.05 * discount_boost
        )

        rec["imageSim"] = round(image_sim, 4)
        rec["textSim"] = round(text_sim, 4)
        rec["ratingBoost"] = round(rating_boost, 4)
        rec["discountBoost"] = round(discount_boost, 4)
        rec["finalScore"] = round(final_score, 4)

        reranked.append(rec)

    # ✅ Sort by finalScore (highest first)
    reranked.sort(key=lambda x: x["finalScore"], reverse=True)

    # ✅ Assign rank
    output = []
    for i, rec in enumerate(reranked[:top_k]):
        rec["rank"] = i + 1
        output.append(rec)

    return {"recommendations": output}


@app.post("/admin/product")
async def add_product(
    name: str = Form(...),
    category: str = Form("general"),
    price: float = Form(...),
    mrp: float = Form(...),
    rating: float = Form(0),
    ratingTotal: int = Form(0),
    discount: str = Form("0%"),
    image: UploadFile = File(...)
):
    content = await image.read()
    img = Image.open(BytesIO(content)).convert("RGB")

    image_embedding = get_image_embedding(img)

    # ✅ Create searchable text field
    product_text = f"{name} {category}".strip()
    text_embedding = get_text_embedding(product_text)

    product_id = str(uuid.uuid4())

    collection.add(
        ids=[product_id],
        embeddings=[image_embedding],
        metadatas=[{
            "id": product_id,
            "name": name,
            "category": category,
            "price": price,
            "mrp": mrp,
            "rating": rating,
            "ratingTotal": ratingTotal,
            "discount": discount,

            # ✅ stored for hybrid reranking
            "text_embedding": text_embedding
        }]
    )

    return {"message": "✅ Product added", "id": product_id}
