import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../services/api";
import { FaRegEdit } from "react-icons/fa";
import DataTableImport from "react-data-table-component";
import { FaEye } from "react-icons/fa";
import ViewProduct from "./ViewProduct";

const DataTable = DataTableImport.default || DataTableImport;

// Helper: first image from variants
const getImg = (p) => p?.img || p?.variants?.[0]?.images?.[0] || "";
// Helper: first price from variants
const getPrice = (p) => p?.price ?? p?.variants?.[0]?.price ?? 0;
// Helper: color names from variants
const getColors = (p) => {
  if (p?.color) return p.color;
  if (Array.isArray(p?.variants) && p.variants.length > 0) {
    return p.variants.map((v) => v.colorName || v.name || "").filter(Boolean).join(", ");
  }
  return "-";
};

export default function Products() {
  const [items, setItems] = useState([]);
  const [categoriesData, setCategoriesData] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [mainCategory, setMainCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [img, setImg] = useState("");
  const [color, setColor] = useState("");

  const [editId, setEditId] = useState(null);
  const [viewModal, setViewModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const readFileAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });

  const load = async () => {
    setLoading(true);
    try {
      setError("");
      const [featured, products] = await Promise.all([
        api.get("/featuredCategories").catch(() => []),
        api.get("/products"),
      ]);

      const featuredList = Array.isArray(featured) ? featured : [];
      const productsList = Array.isArray(products) ? products : [];

      setCategoriesData(featuredList);
      setItems(productsList);
    } catch (e) {
      console.error(e);
      setError(e?.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const addProduct = async (e) => {
    e.preventDefault();
    const t = title.trim();
    if (!t) { setError("Title required"); return; }
    setError("");
    try {
      const payload = {
        id: crypto?.randomUUID?.() ?? String(Date.now()),
        title: t,
        category: subCategory,
        mainCategory: mainCategory,
        price: Number(price) || 0,
        img: img || "",
        color: color || "",
      };
      const created = await api.post("/products", payload);
      setItems((prev) => [created, ...prev]);
      resetForm();
    } catch (e) {
      setError(e?.message || "Failed to add product");
    }
  };

  const handleEdit = (p) => {
    setEditId(p.id);
    setTitle(p.title || "");
    setMainCategory(p.mainCategory || "");
    setSubCategory(p.category || "");
    setPrice(String(getPrice(p)));
    setImg(getImg(p));
    setColor(getColors(p) === "-" ? "" : getColors(p));
  };

  const updateProduct = async (e) => {
    e.preventDefault();
    const t = title.trim();
    if (!editId || !t) { setError("Title required"); return; }
    setError("");
    try {
      const patch = {
        title: t,
        category: subCategory,
        mainCategory: mainCategory,
        price: Number(price) || 0,
        img: img || "",
        color: color || "",
      };
      const updated = await api.patch(`/products/${editId}`, patch);
      setItems((prev) =>
        prev.map((p) => (String(p.id) === String(editId) ? { ...p, ...updated } : p))
      );
      resetForm();
    } catch (e) {
      setError(e?.message || "Failed to update product");
    }
  };

  const resetForm = () => {
    setEditId(null);
    setTitle(""); setMainCategory(""); setSubCategory("");
    setPrice(""); setImg(""); setColor(""); setError("");
  };

  const removeProduct = async (id) => {
    const prev = items;
    setItems((p) => p.filter((x) => String(x.id) !== String(id)));
    try {
      await api.del(`/products/${id}`);
    } catch (e) {
      setItems(prev);
      setError(e?.message || "Failed to delete product");
    }
  };

  const subCategories =
    categoriesData.find((c) => c.title === mainCategory)?.categories || [];

  const columns = [
    {
      name: "Image",
      cell: (row) => {
        const src = getImg(row);
        return src ? (
          <img
            src={src}
            alt={row.title || "product"}
            className="h-10 w-10 rounded object-cover ring-1 ring-gray-200"
          />
        ) : (
          <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center text-xs text-gray-400">
            No img
          </div>
        );
      },
      width: "80px",
    },
    {
      name: "Title",
      selector: (row) => row.title || "-",
      width: "160px",
    },
    {
      name: "Category",
      selector: (row) => row.mainCategory || row.categoryId || "-",
      width: "120px",
    },
    {
      name: "Price",
      selector: (row) => `₹${getPrice(row)}`,
      width: "90px",
    },
    {
      name: "Colors",
      cell: (row) => {
        const colorStr = getColors(row);
        const colors = colorStr !== "-" ? colorStr.split(", ") : [];
        return (
          <div className="flex flex-wrap gap-1 py-1">
            {colors.length > 0
              ? colors.map((c, i) => (
                  <span key={i} className="px-2 py-0.5 bg-gray-200 rounded text-xs whitespace-nowrap">
                    {c}
                  </span>
                ))
              : "-"}
          </div>
        );
      },
      width: "130px",
    },
    {
      name: "Rating",
      selector: (row) => row.rating ? `⭐ ${row.rating}` : "-",
      width: "90px",
    },
    {
      name: "Action",
      cell: (row) => (
        <div className="flex gap-3 text-lg">
          <FaEye
            className="cursor-pointer text-indigo-600"
            onClick={() => { setSelectedProduct(row); setViewModal(true); }}
          />
          <FaRegEdit
            className="cursor-pointer text-green-600"
            onClick={() => handleEdit(row)}
          />
          <Trash2
            size={16}
            className="cursor-pointer text-red-600"
            onClick={() => removeProduct(row.id)}
          />
        </div>
      ),
      width: "100px",
    },
  ];

  return (
    <div className="flex flex-col xl:flex-row gap-6">
      {/* TABLE */}
      <div className="flex-1 min-w-0 bg-white p-4 sm:p-6 rounded-2xl shadow">
        <h1 className="text-xl font-bold mb-4">Products ({items.length})</h1>

        {error && <div className="text-red-500 mb-2 text-sm">{error}</div>}

        <div className="w-full overflow-x-auto">
          <DataTable
            columns={columns}
            data={items || []}
            progressPending={loading}
            pagination
            paginationPerPage={rowsPerPage}
            paginationRowsPerPageOptions={[5, 10, 15, 20, 30, 50]}
            onChangeRowsPerPage={(n) => setRowsPerPage(n)}
            paginationComponentOptions={{
              rowsPerPageText: "Rows per page",
              rangeSeparatorText: "of",
            }}
            highlightOnHover
          />
        </div>

        <button onClick={load} className="mt-4 border px-4 py-2 rounded text-sm hover:bg-gray-50">
          Refresh
        </button>
      </div>

      {/* FORM */}
      <div className="w-full xl:w-80 flex-shrink-0 bg-white p-4 sm:p-6 rounded-2xl shadow">
        <h2 className="font-bold mb-3 text-base">
          {editId ? "Edit Product" : "Add Product"}
        </h2>

        <form onSubmit={editId ? updateProduct : addProduct} className="space-y-3">
          <input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border p-2 rounded text-sm"
          />

          <select
            value={mainCategory}
            onChange={(e) => { setMainCategory(e.target.value); setSubCategory(""); }}
            className="w-full border p-2 rounded text-sm"
          >
            <option value="">Select Main Category</option>
            {categoriesData.map((c) => (
              <option key={c.id} value={c.title}>{c.title}</option>
            ))}
          </select>

          <select
            value={subCategory}
            onChange={(e) => setSubCategory(e.target.value)}
            className="w-full border p-2 rounded text-sm"
          >
            <option value="">Select Sub Category</option>
            {subCategories.map((sub, i) => (
              <option key={i} value={sub.slug || sub.name}>{sub.name}</option>
            ))}
          </select>

          <input
            placeholder="Price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full border p-2 rounded text-sm"
          />

          <input
            placeholder="Color (e.g. Grey, Brown)"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-full border p-2 rounded text-sm"
          />

          <input
            placeholder="Image URL (optional)"
            value={img}
            onChange={(e) => setImg(e.target.value)}
            className="w-full border p-2 rounded text-sm"
          />

          <input
            type="file"
            accept="image/*"
            className="w-full text-sm"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                const dataUrl = await readFileAsDataUrl(file);
                setImg(dataUrl);
              } catch (err) {
                setError(err?.message || "Failed to read image");
              } finally {
                e.target.value = "";
              }
            }}
          />

          {img ? (
            <div className="rounded border p-2">
              <div className="text-xs text-slate-500 mb-2">Preview</div>
              <img src={img} alt="preview" className="h-24 w-full rounded object-contain bg-slate-50" />
            </div>
          ) : null}

          {editId && (
            <button type="button" onClick={resetForm} className="w-full border border-gray-300 py-2 rounded text-sm hover:bg-gray-50">
              Cancel Edit
            </button>
          )}

          <button className="w-full bg-stone-500 text-white py-2 rounded flex justify-center gap-2 text-sm hover:bg-stone-600">
            <Plus size={16} />
            {editId ? "Update Product" : "Add Product"}
          </button>
        </form>

        {viewModal && (
          <ViewProduct data={selectedProduct} onClose={() => setViewModal(false)} />
        )}
      </div>
    </div>
  );
}
