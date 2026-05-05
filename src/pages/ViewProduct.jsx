export default function ViewProduct({ data, onClose }) {
  if (!data) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-2xl w-[350px] shadow-lg">

        <h2 className="text-xl font-bold mb-4">
          {data.title}
        </h2>

        <img
          src={data.img}
          alt="product"
          className="h-40 w-full object-cover rounded mb-3"
        />

        <p><b>Price:</b> ₹{data.price}</p>
        <p><b>Main:</b> {data.mainCategory}</p>
        <p><b>Sub:</b> {data.subCategory}</p>
        <p><b>Color:</b> {data.color}</p>

        <button
          onClick={onClose}
          className="mt-4 w-full bg-stone-600 text-white py-2 rounded"
        >
          Close
        </button>

      </div>
    </div>
  );
}