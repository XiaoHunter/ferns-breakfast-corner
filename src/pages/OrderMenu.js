import React, { useEffect, useState, useRef, useMemo } from "react";

export default function OrderMenu() {
  const [menu, setMenu] = useState({});
  const [selectedCategory, setSelectedCategory] = useState("");
  const [order, setOrder] = useState({});
  const [myOrders, setMyOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectingTable, setSelectingTable] = useState(true);
  const [selectedTable, setSelectedTable] = useState("");
  const [tableNo, setTableNo] = useState("");

  const deviceId = useMemo(() => {
    const stored = localStorage.getItem("deviceId");
    if (stored) return stored;
    const newId = "device-" + Math.random().toString(36).substring(2, 8);
    localStorage.setItem("deviceId", newId);
    return newId;
  }, []);

  const confirmTableSelection = () => {
    if (!selectedTable) return alert("⚠️ Please select a table number");
    setTableNo(selectedTable);
    setSelectingTable(false);
  };

  const getMalaysiaToday = () => {
    const now = new Date();
    const malaysiaTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    return malaysiaTime.toISOString().split("T")[0];
  };

  useEffect(() => {
    fetch("https://ferns-breakfast-corner.com/menu/orders-items.json")
      .then((res) => res.json())
      .then((data) => {
        const categorized = {};
        data.forEach((entry) => {
          categorized[entry.category] = entry.items;
        });
        setMenu(categorized);
        setSelectedCategory(Object.keys(categorized)[0]);
        setLoading(false);
      });
  }, []);

  const updateQty = (item, delta) => {
    const key = item.name;
    setOrder((prev) => {
      const qty = (prev[key]?.qty || 0) + delta;
      if (qty <= 0) {
        const { [key]: _, ...rest } = prev;
        return rest;
      }
      return {
        ...prev,
        [key]: {
          name: item.name,
          qty,
        }
      };
    });
  };

  const getTotal = () => {
    let sum = 0;
    const flatMenu = Object.entries(menu).flatMap(([cat, items]) =>
      items.map((item) => ({ ...item, category: cat }))
    );

    for (const item of Object.values(order)) {
      const matched = flatMenu.find((d) => d.name === item.name);
      if (!matched) continue;
      const basePrice = Number(matched.price ?? 0);
      sum += item.qty * basePrice;
    }

    return sum.toFixed(2);
  };

  const handleRequestBill = () => {
    if (!window.confirm("是否确认送出订单？")) return;

    const items = Object.values(order).map((item) => ({
      name: item.name,
      qty: item.qty,
    }));

    const data = {
      deviceId,
      items,
      total: getTotal(),
      time: new Date().toISOString(),
      status: "pending",
      payment: "",
      tableNo
    };

    fetch("https://ferns-breakfast-corner.com/api/send-order.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.status === "success") {
          alert("✅ 已成功送出订单！");
          setOrder({});
        } else {
          alert("❌ 提交失败");
        }
      });
  };

  if (loading) return <div className="p-4">🕒 正在加载菜单...</div>;

  if (selectingTable) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-yellow-100 relative text-center">
        <img src="/ferns-logo.png" alt="Logo" className="absolute opacity-10 top-10 w-full max-w-md mx-auto" />
        <h1 className="text-2xl font-bold text-yellow-900 z-10 mb-6">☕ Ferns Breakfast Corner</h1>
        <h2 className="text-xl z-10 mb-2">🪑 Please select your table</h2>
        <select
          value={selectedTable}
          onChange={(e) => setSelectedTable(e.target.value)}
          className="p-2 border rounded mb-4 z-10 text-center"
        >
          <option value="">-- Select Table --</option>
          {[...Array(12)].map((_, i) => (
            <option key={i + 1} value={i + 1}>Table {i + 1}</option>
          ))}
        </select>
        <button
          onClick={confirmTableSelection}
          className="bg-green-600 text-white px-4 py-2 rounded z-10"
        >
          Start Ordering
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <div className="w-32 bg-yellow-200 border-r p-2 flex flex-col space-y-2 text-center text-sm">
        <div className="flex justify-center items-center p-4">
          <img
            src="/ferns-logo.png"
            alt="Fern's Logo"
            className="w-full h-auto object-contain"
          />
        </div>
        {Object.keys(menu).map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-2 py-1 rounded ${selectedCategory === cat ? "bg-yellow-400 font-bold" : "bg-white hover:bg-yellow-300"}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 p-4 bg-yellow-50">
        <h1 className="text-2xl font-bold mb-4">🧋 Order Menu - Table {tableNo}</h1>
        {selectedCategory && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-2">📂 {selectedCategory}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {menu[selectedCategory].map((item) => {
                const ordered = order[item.name];
                const price = Number(item.price || 0);
                return (
                  <div key={item.name} className="bg-white p-4 rounded shadow">
                    <h2 className="font-semibold text-lg">{item.chineseName}{item.name}</h2>
                    <p>RM {price.toFixed(2)}</p>
                    <div className="flex gap-2 mt-2">
                      <button className="px-3 py-1 bg-gray-300 rounded" onClick={() => updateQty(item, -1)}>-</button>
                      <span>{ordered?.qty || 0}</span>
                      <button className="px-3 py-1 bg-green-400 rounded" onClick={() => updateQty(item, 1)}>+</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Order Summary */}
        <div className="mt-10 p-4 bg-white rounded shadow">
          <h2 className="text-xl font-semibold mb-2">🧾 Current Order</h2>
          <ul className="mb-2">
            {Object.values(order).map((item, idx) => (
              <li key={idx}>
                {item.name} x {item.qty}
              </li>
            ))}
          </ul>
          <h2 className="text-lg font-bold">Total: RM {getTotal()}</h2>
          <div className="mt-2 flex gap-4">
            <button className="px-4 py-2 bg-red-500 text-white rounded" onClick={() => setOrder({})}>Clear</button>
            <button className="px-4 py-2 bg-blue-500 text-white rounded" onClick={handleRequestBill}>Confirm Order</button>
          </div>
        </div>
      </div>
    </div>
  );
}
