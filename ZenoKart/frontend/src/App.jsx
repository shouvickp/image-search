import './App.css'
import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = "http://127.0.0.1:8000";

const App = () => {
  const [tab, setTab] = useState("user"); // "admin" | "user"

  // ---------------- ADMIN STATE ----------------
  const [form, setForm] = useState({
    name: "",
    price: "",
    mrp: "",
    rating: 0,
    ratingTotal: 0,
    discount: "0%",
  });

  const [adminImageFile, setAdminImageFile] = useState(null);
  const [adminPreview, setAdminPreview] = useState(null);
  const [products, setProducts] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);

  const fetchProducts = async () => {
    const res = await axios.get(`${API_BASE}/admin/products`);
    setProducts(res.data.products || []);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const onAdminChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const onAdminImageChange = (e) => {
    const file = e.target.files?.[0];
    setAdminImageFile(file);
    if (file) setAdminPreview(URL.createObjectURL(file));
  };

  const uploadProduct = async () => {
    if (!adminImageFile) return alert("Please upload an image!");

    setAdminLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      fd.append("image", adminImageFile);

      await axios.post(`${API_BASE}/admin/product`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("✅ Product uploaded!");
      setForm({
        name: "",
        price: "",
        mrp: "",
        rating: 0,
        ratingTotal: 0,
        discount: "0%",
      });
      setAdminImageFile(null);
      setAdminPreview(null);

      fetchProducts();
    } catch (err) {
      console.log(err);
      alert("❌ Upload failed. Check backend logs.");
    }
    setAdminLoading(false);
  };

  // ---------------- USER STATE ----------------
  const [userImageFile, setUserImageFile] = useState(null);
  const [userPreview, setUserPreview] = useState(null);
  const [recoLoading, setRecoLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);

  const onUserImageChange = (e) => {
    const file = e.target.files?.[0];
    setUserImageFile(file);
    if (file) setUserPreview(URL.createObjectURL(file));
    setRecommendations([]);
  };

  const getRecommendations = async () => {
    if (!userImageFile) return alert("Please upload an image first!");

    setRecoLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", userImageFile);

      const res = await axios.post(`${API_BASE}/recommend?top_k=8`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setRecommendations(res.data.recommendations || []);
    } catch (err) {
      console.log(err);
      alert("❌ Recommendation failed. Check backend logs.");
    }
    setRecoLoading(false);
  };

  // ---------------- UI ----------------
  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h1 style={{ marginBottom: 10 }}>🧠 Image-Based AI Product Recommendation</h1>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button
          onClick={() => setTab("user")}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #ddd",
            cursor: "pointer",
            background: tab === "user" ? "#000" : "#fff",
            color: tab === "user" ? "#fff" : "#000",
          }}
        >
          👤 User Search
        </button>

        <button
          onClick={() => setTab("admin")}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #ddd",
            cursor: "pointer",
            background: tab === "admin" ? "#000" : "#fff",
            color: tab === "admin" ? "#fff" : "#000",
          }}
        >
          🛠️ Admin Panel
        </button>
      </div>

      {/* USER TAB */}
      {tab === "user" && (
        <div>
          <h2>📷 Upload Image to Find Similar Products</h2>

          <input type="file" accept="image/*" onChange={onUserImageChange} />

          {userPreview && (
            <div style={{ marginTop: 15 }}>
              <p style={{ marginBottom: 6 }}>
                <b>Uploaded/Search Image:</b>
              </p>
              <img
                src={userPreview}
                alt="user-preview"
                style={{
                  width: 240,
                  height: 240,
                  objectFit: "cover",
                  borderRadius: 16,
                  border: "1px solid #ddd",
                }}
              />
            </div>
          )}

          <div style={{ marginTop: 15 }}>
            <button
              onClick={getRecommendations}
              disabled={recoLoading}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid #ddd",
                cursor: "pointer",
              }}
            >
              {recoLoading ? "Searching..." : "🔍 Recommend Similar Products"}
            </button>
          </div>

          {/* Recommendations */}
          <div style={{ marginTop: 25 }}>
            <h2>🔥 Recommended Products</h2>

            {recommendations.length === 0 && (
              <p style={{ color: "#666" }}>
                Upload an image and click <b>Recommend Similar Products</b>.
              </p>
            )}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: 16,
                marginTop: 10,
              }}
            >
              {recommendations.map((p) => (
                <div
                  key={p.id}
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: 16,
                    overflow: "hidden",
                    boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
                    background: "#fff",
                  }}
                >
                  {/* Thumbnail */}
                  <div style={{ width: "100%", height: 180, background: "#f5f5f5" }}>
                    {/* If you store image URL in metadata later, show it here */}
                    <div
                      style={{
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#777",
                      }}
                    >
                      <img src={p.img} alt={p.name} style={{ width: "50%" }} />
                    </div>
                  </div>

                  {/* Details */}
                  <div style={{ color: "#666", padding: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: 16,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {p.name}
                      </h3>
                      <span style={{ fontSize: 12, color: "#444", marginLeft: 8, flexShrink: 0 }}>
                        #{p.rank}
                      </span>
                    </div>
                    <p style={{ margin: "6px 0", display: "flex", alignItems: "center" }}>
                      {[1, 2, 3, 4, 5].map((star) => {
                        const fill = Math.max(0, Math.min(100, (p.rating - (star - 1)) * 100));
                        return (
                          <span
                            key={star}
                            style={{
                              fontSize: 18,
                              background: `linear-gradient(90deg, #FFD700 ${fill}%, #ccc ${fill}%)`,
                              WebkitBackgroundClip: "text",
                              WebkitTextFillColor: "transparent",
                            }}
                          >
                            ★
                          </span>
                        );
                      })}
                      <span style={{ marginLeft: 6, fontSize: 13, color: "#666" }}>
                        {p.rating} ({p.ratingTotal})
                      </span>
                    </p>

                    <p style={{ margin: "8px 0" }}>
                      Price: <b>₹{p.price}</b> <span style={{ color: "#888", textDecoration: "line-through" }}>MRP ₹{p.mrp}</span>
                    </p>

                    <p style={{ margin: "6px 0" }}>
                      🏷️ Discount: <b>{(p.discount / p.mrp * 100).toFixed(0)}%</b>
                    </p>

                    <button
                      style={{
                        marginTop: 10,
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 12,
                        border: "1px solid #ddd",
                        cursor: "pointer",
                      }}
                      onClick={() => alert(`✅ Selected: ${p.name}`)}
                    >
                      View Product
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
      }

      {/* ADMIN TAB */}
      {
        tab === "admin" && (
          <div>
            <h2>🛠️ Admin Panel - Add Product</h2>

            <div style={{ display: "grid", gap: 10, maxWidth: 520 }}>
              <input name="name" value={form.name} onChange={onAdminChange} placeholder="Product name" />
              <input name="price" value={form.price} onChange={onAdminChange} placeholder="Price" />
              <input name="mrp" value={form.mrp} onChange={onAdminChange} placeholder="MRP" />
              <input name="rating" value={form.rating} onChange={onAdminChange} placeholder="Rating" />
              <input name="ratingTotal" value={form.ratingTotal} onChange={onAdminChange} placeholder="Rating Total" />
              <input name="discount" value={form.discount} onChange={onAdminChange} placeholder="Discount (ex: 30%)" />

              <input type="file" accept="image/*" onChange={onAdminImageChange} />

              {adminPreview && (
                <div>
                  <p style={{ marginBottom: 6 }}>
                    <b>Preview:</b>
                  </p>
                  <img
                    src={adminPreview}
                    alt="preview"
                    style={{
                      width: 200,
                      height: 200,
                      objectFit: "cover",
                      borderRadius: 16,
                      border: "1px solid #ddd",
                    }}
                  />
                </div>
              )}

              <button onClick={uploadProduct} disabled={adminLoading}>
                {adminLoading ? "Uploading..." : "✅ Upload Product"}
              </button>
            </div>

            <hr style={{ margin: "30px 0" }} />

            <h2>📦 Products in DB</h2>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 15 }}>
              {products.map((p) => (
                <div key={p.id} style={{ border: "1px solid #ddd", padding: 12, borderRadius: 12 }}>
                  <h4 style={{ margin: 0 }}>{p.name}</h4>
                  <p style={{ margin: "6px 0" }}>₹{p.price} (MRP ₹{p.mrp})</p>
                  <p style={{ margin: "6px 0" }}>⭐ {p.rating} ({p.ratingTotal})</p>
                  <p style={{ margin: "6px 0" }}>Discount: {p.discount}</p>
                </div>
              ))}
            </div>
          </div>
        )
      }
    </div >
  );
}


export default App;
