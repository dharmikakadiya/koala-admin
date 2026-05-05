import { X } from "lucide-react";

export default function View({ data, onClose }) {
    console.log("🚀 ~ View ~ data:", data)
    const subCategories = Array.isArray(data?.categories) ? data.categories : [];
    if (!data) return null;

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-lg">

                {/* HEADER */}
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold">
                        {subCategories.name} Subcategories
                    </h2>

                    <button onClick={onClose}>
                        <X />
                    </button>
                </div>

                {/* CONTENT */}
                <div className="mt-4 space-y-3 max-h-80 overflow-y-auto">
                    {subCategories.length === 0 ? (
                        <div className="text-center text-gray-500 py-10">
                            No subcategories yet
                        </div>
                    ) : (
                        subCategories.map((cat) => (
                            <div
                                key={cat.id}
                                className="border px-4 py-2 rounded"
                            >
                                {cat.name}
                            </div>
                        ))
                    )}
                </div>

                {/* FOOTER */}
                <div className="mt-6 text-right">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-stone-600 border rounded"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}