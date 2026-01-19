import math

def parse_discount(discount_str: str):
    # "22%" -> 22
    try:
        return float(discount_str.replace("%", "").strip())
    except:
        return 0.0

def cosine_similarity(a, b):
    # both list[float]
    dot = sum(x*y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x*x for x in a))
    norm_b = math.sqrt(sum(y*y for y in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)

def clamp01(x: float):
    return max(0.0, min(1.0, x))