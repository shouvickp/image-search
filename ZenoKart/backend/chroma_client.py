import chromadb
from chromadb.config import Settings

import chromadb
from chromadb.config import Settings

CHROMA_API_KEY = "ck-GqxqhrSfiPU25dyiXRzn3G5tWu1WLMwTAFxh4We991jr"
TENANT = "5eaeae41-15e3-4b13-81b8-e5eecffa1d08"
DATABASE = "PRODUCT_DB"

client = chromadb.CloudClient(
            api_key=CHROMA_API_KEY,
            tenant=TENANT,
            database=DATABASE
        )

collection = client.get_or_create_collection(
    name="products",
    metadata={"tenant": TENANT, "database": DATABASE},
)