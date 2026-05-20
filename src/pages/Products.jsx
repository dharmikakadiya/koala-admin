import { Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api"; // ✅ FIXED (default import)
import { FaRegEdit } from "react-icons/fa";
import DataTableImport from "react-data-table-component";
import { FaEye } from "react-icons/fa";
import ViewProduct from "./ViewProduct";

const DataTable = DataTableImport.default || DataTableImport;

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

  const parsedPrice = useMemo(() => {
    const n = Number(price);
    return Number.isFinite(n) ? n : 0;
  }, [price]);

  const readFileAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });

  const categoryIndex = useMemo(() => {
    const idx = new Map();
    (categoriesData || []).forEach((main) => {
      (main.categories || []).forEach((sub) => {
        if (!sub?.slug) return;
        idx.set(sub.slug, { mainTitle: main.title, subName: sub.name });
      });
    });
    return idx;
  }, [categoriesData]);

  const syncUpsertToFeatured = async ({ product, mainTitle, subSlug }) => {
    if (!mainTitle) return;
    const main = (categoriesData || []).find((c) => c.title === mainTitle);
    if (!main?.id) return;

    const normalizeArr = (v) => (Array.isArray(v) ? v : []);
    const upsert = (arr) => {
      const list = normalizeArr(arr);
      const idx = list.findIndex((x) => String(x?.id) === String(product?.id));
      if (idx >= 0) {
        const copy = [...list];
        copy[idx] = { ...copy[idx], ...product };
        return copy;
      }
      return [product, ...list];
    };

    const nextMainProducts = upsert(main.products);
    const nextCategories = normalizeArr(main.categories).map((s) => {
      if (!subSlug || String(s?.slug) !== String(subSlug)) return s;
      return { ...s, products: upsert(s.products) };
    });

    setCategoriesData((prev) =>
      (prev || []).map((c) =>
        String(c.id) === String(main.id)
          ? { ...c, products: nextMainProducts, categories: nextCategories }
          : c
      )
    );

    await api.patch(`/featuredCategories/${main.id}`, {
      products: nextMainProducts,
      categories: nextCategories,
    });
  };

  const syncRemoveFromFeatured = async ({ productId }) => {
    const normalizeArr = (v) => (Array.isArray(v) ? v : []);
    const remove = (arr) =>
      normalizeArr(arr).filter((x) => String(x?.id) !== String(productId));

    const touched = (categoriesData || []).filter((main) => {
      const inMain = normalizeArr(main.products).some(
        (p) => String(p?.id) === String(productId)
      );
      const inSubs = normalizeArr(main.categories).some((s) =>
        normalizeArr(s?.products).some((p) => String(p?.id) === String(productId))
      );
      return inMain || inSubs;
    });

    if (touched.length === 0) return;

    setCategoriesData((prev) =>
      (prev || []).map((main) => {
        const mainProducts = remove(main.products);
        const categories = normalizeArr(main.categories).map((s) => ({
          ...s,
          products: remove(s.products),
        }));
        return { ...main, products: mainProducts, categories };
      })
    );

    await Promise.all(
      touched.map((main) =>
        api.patch(`/featuredCategories/${main.id}`, {
          products: remove(main.products),
          categories: normalizeArr(main.categories).map((s) => ({
            ...s,
            products: remove(s.products),
          })),
        })
      )
    );
  };

  const load = async () => {
    setLoading(true);
    try {
      setError("");
      const [featured, products] = await Promise.all([
        api.get("/featuredCategories"),
        api.get("/products"),
      ]);

      const featuredList = Array.isArray(featured) ? featured : [];
      const productsList = Array.isArray(products) ? products : [];

      setCategoriesData(featuredList);

      const localIndex = new Map();
      featuredList.forEach((main) => {
        (main.categories || []).forEach((sub) => {
          if (!sub?.slug) return;
          localIndex.set(sub.slug, { mainTitle: main.title, subName: sub.name });
        });
      });

      setItems(
        productsList.map((p) => {
          const catSlug = p.category || "";
          const meta = catSlug ? localIndex.get(catSlug) : null;
          return {
            ...p,
            mainCategory: p.mainCategory || meta?.mainTitle || "-",
            subCategory: p.subCategoryName || meta?.subName || catSlug || "-",
            color:
              p.color || (p.colors ? p.colors.map((c) => c.name).join(", ") : "-"),
          };
        })
      );
    } catch (e) {
      console.error(e);
      setError(e?.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const addProduct = async (e) => {
    e.preventDefault();
    const t = title.trim();
    if (!t) {
      setError("Title required");
      return;
    }

    setError("");
    try {
      const meta = categoryIndex.get(subCategory);
      const payload = {
        id: crypto?.randomUUID?.() ?? String(Date.now()),
        title: t,
        category: subCategory,
        mainCategory: mainCategory || meta?.mainTitle || "",
        subCategoryName: meta?.subName || "",
        price: parsedPrice,
        img: img || "placeholder.webp",
        color: color || "default",
      };

      const created = await api.post("/products", payload);
      await syncUpsertToFeatured({
        product: created,
        mainTitle: mainCategory || meta?.mainTitle,
        subSlug: payload.category,
      });
      setItems((prev) => [
        {
          ...created,
          mainCategory: meta?.mainTitle || mainCategory || "-",
          subCategory: meta?.subName || "-",
          color: created.color || payload.color,
        },
        ...prev,
      ]);
      resetForm();
    } catch (e) {
      setError(e?.message || "Failed to add product");
    }
  };

  const handleEdit = (p) => {
    setEditId(p.id);
    setTitle(p.title || "");
    setMainCategory(p.mainCategory || "");
    const sc =
      p.category ||
      (() => {
        const subName = p.subCategory === "-" ? "" : p.subCategory || "";
        if (!subName || !p.mainCategory) return subName;
        const main = (categoriesData || []).find((c) => c.title === p.mainCategory);
        const match = (main?.categories || []).find((s) => s.name === subName);
        return match?.slug || subName;
      })();
    setSubCategory(sc);
    setPrice(p.price || "");
    setImg(p.img || "");
    setColor(p.color || "");
  };

  const updateProduct = (e) => {
    e.preventDefault();

    const run = async () => {
      const t = title.trim();
      if (!editId) return;
      if (!t) {
        setError("Title required");
        return;
      }

      setError("");
      try {
        const patchMeta = categoryIndex.get(subCategory);
        const patch = {
          title: t,
          category: subCategory,
          mainCategory: mainCategory || patchMeta?.mainTitle || "",
          subCategoryName: patchMeta?.subName || "",
          price: parsedPrice,
          img: img || "placeholder.webp",
          color: color || "default",
        };

        const updated = await api.patch(`/products/${editId}`, patch);
        const meta = categoryIndex.get(patch.category);
        await syncUpsertToFeatured({
          product: updated,
          mainTitle: mainCategory || meta?.mainTitle,
          subSlug: patch.category,
        });

        setItems((prev) =>
          prev.map((p) =>
            String(p.id) === String(editId)
              ? {
                  ...p,
                  ...updated,
                  mainCategory: meta?.mainTitle || mainCategory || "-",
                  subCategory: meta?.subName || "-",
                }
              : p
          )
        );
        resetForm();
      } catch (e) {
        setError(e?.message || "Failed to update product");
      }
    };

    run();
  };

  const resetForm = () => {
    setEditId(null);
    setTitle("");
    setMainCategory("");
    setSubCategory("");
    setPrice("");
    setImg("");
    setColor("");
    setError("");
  };

  const removeProduct = async (id) => {
    const prev = items;
    setItems((p) => p.filter((x) => x.id !== id));

    try {
      await api.del(`/products/${id}`);
      await syncRemoveFromFeatured({ productId: id });
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
      cell: (row) =>
        row.img ? (
          <img
            src={row.img}
            alt={row.title || "product"}
            className="h-10 w-10 rounded object-cover ring-1 ring-gray-200"
          />
        ) : (
          "-"
        ),
      width: "84px",
    },
    {
      name: "Title",
      selector: (row) => row.title || "-",
      width: "150px",
    },
    {
      name: "Main",
      selector: (row) => row.mainCategory || "-",
      width: "120px",
    },
    {
      name: "Sub",
      selector: (row) => row.subCategory || "-",
      width: "120px",
    },
    {
      name: "Price",
      selector: (row) => `₹${row.price || 0}`,
      width: "90px",
    },
    {
      name: "Color",
      cell: (row) => {
        const colors = row.color ? row.color.split(", ") : [];
        return (
          <div className="flex flex-wrap gap-1 py-1">
            {colors.length > 0 ? (
              colors.map((c, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 bg-gray-200 rounded text-xs whitespace-nowrap"
                >
                  {c}
                </span>
              ))
            ) : (
              "-"
            )}
          </div>
        );
      },
      width: "110px",
    },
    {
      name: "Action",
      cell: (row) => (
        <div className="flex gap-3 text-lg">
          <FaEye
            className="cursor-pointer text-indigo-600"
            onClick={() => {
              setSelectedProduct(row);
              setViewModal(true);
            }}
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
    }
  ];

  return (
    <div className="flex flex-col xl:flex-row gap-6">
      {/* TABLE */}
      <div className="flex-1 min-w-0 bg-white p-4 sm:p-6 rounded-2xl shadow">
        <h1 className="text-xl font-bold mb-4">
          Products ({items.length})
        </h1>

        {error && <div className="text-red-500 mb-2">{error}</div>}

        {/* Horizontal scroll wrapper for mobile */}
        <div className="w-full overflow-x-auto">
          <DataTable
            columns={columns}
            data={items || []}
            progressPending={loading}
            pagination
            paginationPerPage={rowsPerPage}
            paginationRowsPerPageOptions={[5, 10, 15, 20, 30, 50]}
            onChangeRowsPerPage={(newPerPage) => setRowsPerPage(newPerPage)}
            paginationComponentOptions={{
              rowsPerPageText: "Rows per page",
              rangeSeparatorText: "of",
              noRowsPerPage: false,
              selectAllRowsItem: false,
              selectAllRowsItemText: "All",
            }}
            highlightOnHover
          />
        </div>

        <button onClick={load} className="mt-4 border px-4 py-2 rounded">
          Refresh
        </button>
      </div>

      {/* FORM */}
      <div className="w-full xl:w-80 flex-shrink-0 bg-white p-4 sm:p-6 rounded-2xl shadow">
        <h2 className="font-bold mb-3">
          {editId ? "Edit Product" : "Add Product"}
        </h2>

        <form
          onSubmit={editId ? updateProduct : addProduct}
          className="space-y-3"
        >
          <input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border p-2 rounded"
          />

          <select
            value={mainCategory}
            onChange={(e) => {
              setMainCategory(e.target.value);
              setSubCategory("");
            }}
            className="w-full border p-2 rounded"
          >
            <option value="">Select Main Category</option>
            {categoriesData.map((c) => (
              <option key={c.id} value={c.title}>
                {c.title}
              </option>
            ))}
          </select>

          <select
            value={subCategory}
            onChange={(e) => setSubCategory(e.target.value)}
            className="w-full border p-2 rounded"
          >
            <option value="">Select Sub Category</option>
            {subCategories.map((sub, i) => (
              <option key={i} value={sub.slug || sub.name}>
                {sub.name}
              </option>
            ))}
          </select>

          <input
            placeholder="Price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full border p-2 rounded"
          />

          <input
            placeholder="Color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-full border p-2 rounded"
          />

          <input
            placeholder="Image URL (optional)"
            value={img}
            onChange={(e) => setImg(e.target.value)}
            className="w-full border p-2 rounded"
          />

          <input
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                setError("");
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
              <img
                src={img}
                alt="preview"
                className="h-24 w-full rounded object-contain bg-slate-50"
              />
            </div>
          ) : null}

          <button className="w-full bg-stone-500 text-white py-2 rounded flex justify-center gap-2">
            <Plus size={16} />
            {editId ? "Update Product" : "Add Product"}
          </button>
        </form>
        {viewModal && (
          <ViewProduct
            data={selectedProduct}
            onClose={() => setViewModal(false)}
          />
        )}
      </div>
    </div>
  );
}
