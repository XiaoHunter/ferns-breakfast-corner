import React, { useEffect, useState, useRef, useMemo } from "react";

export default function OrderMenu() {
  const [menu, setMenu] = useState({});
  const [selectedCategory, setSelectedCategory] = useState("");
  const [order, setOrder] = useState({});
  const [myOrders, setMyOrders] = useState([]);
  const [packedStatus, setPackedStatus] = useState({});
  const [addonsStatus, setAddonsStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const deviceId = useMemo(() => {
    const stored = localStorage.getItem("deviceId");
    if (stored) return stored;
    const newId = "device-" + Math.random().toString(36).substring(2, 8);
    localStorage.setItem("deviceId", newId);
    return newId;
  }, []);

  useEffect(() => {
    fetch("https://ferns-breakfast-corner.com/items/orders-items.json")
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

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    fetch(`https://ferns-breakfast-corner.com/orders/orders-${today}.json`)
      .then((res) => {
        if (!res.ok) throw new Error("订单文件不存在");
        return res.json();
      })
      .then((data) => {
        const myOrdersOnly = data.filter((o) => o.deviceId === deviceId);
        setMyOrders(myOrdersOnly);
      })
      .catch((err) => {
        console.warn("未能载入订单：", err.message);
        setMyOrders([]);
      });
  }, []);

  const updateQty = (item, type, delta) => {
    const packed = packedStatus[`${item.name}-${type}`] || false;
    const addons = addonsStatus[`${item.name}-${type}`] || [];
    const key = item.name + "-" + type + (packed ? "-packed" : "") + (addons.length ? "-addons" : "");

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
          type,
          packed,
          addons,
          qty,
        },
      };
    });
  };

  const togglePacked = (item, type) => {
    const key = `${item.name}-${type}`;
    setPackedStatus((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleAddon = (item, type, addon) => {
    const key = `${item.name}-${type}`;
    const current = addonsStatus[key] || [];
    const exists = current.find((a) => a.name === addon.name);
    const updated = exists ? current.filter((a) => a.name !== addon.name) : [...current, addon];
    setAddonsStatus((prev) => ({ ...prev, [key]: updated }));
  };

  const getTotal = () => {
    let sum = 0;
    for (const item of Object.values(order)) {
      const matched = Object.values(menu).flat().find((d) => d.name === item.name);
      if (!matched) continue;
      const basePrice = item.type === "cold" ? matched.coldPrice : matched.hotPrice || matched.price;
      const packedFee = matched.category === "饮料" && item.packed ? 0.2 : 0;
      const addonTotal = item.addons?.reduce((s, a) => s + a.price, 0) || 0;
      sum += item.qty * (basePrice + packedFee + addonTotal);
    }
    return sum.toFixed(2);
  };

  const clearOrder = () => setOrder({});

  const handleRequestBill = () => {
    if (!window.confirm("是否确认送出订单？")) return;

    const items = Object.values(order).map((item) => ({
      name: item.name,
      type: item.type.toUpperCase(),
      qty: item.qty,
      packed: item.packed,
      addons: item.addons || [],
    }));

    const today = new Date().toISOString().split("T")[0];
    const data = {
      deviceId,
      items,
      total: getTotal(),
      time: new Date().toISOString(),
      status: "pending",
      payment: "",
    };

    fetch("https://ferns-breakfast-corner.com/api/send-order.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.status === "success") {
          alert("✅ 已成功送出订单！订单编号: " + res.orderId);
          clearOrder();
        } else {
          alert("❌ 提交失败");
        }
      });
  };

  if (loading) return <div className="p-4">🕒 正在加载菜单...</div>;

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-32 bg-yellow-200 border-r p-2 flex flex-col space-y-2 text-center text-sm">
        <div className="flex justify-center items-center p-4">
          <img
            src="/ferns-logo.png" // 确保 logo 图像放在 public/logo.png
            alt="Fern's Breakfast Corner Logo"
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
        <h1 className="text-2xl font-bold mb-4">🧋 Order Menu</h1>
        {selectedCategory && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-2">📂 {selectedCategory}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {menu[selectedCategory].flatMap((item) => {
                const isDrink = selectedCategory === "饮料";
                const types = isDrink ? ["hot", "cold"] : ["standard"];

                return types.map((type) => {
                  const key = `${item.name}-${type}`;
                  const packed = packedStatus[key] || false;
                  const addons = addonsStatus[key] || [];
                  const orderKey = item.name + "-" + type + (packed ? "-packed" : "") + (addons.length ? "-addons" : "");
                  const ordered = order[orderKey];
                  const unitPrice = isDrink
                    ? (type === "hot" ? Number(item.hotPrice) : Number(item.coldPrice))
                    : Number(item.price);
                  const addonTotal = addons.reduce((sum, a) => sum + a.price, 0);
                  const price = unitPrice + (isDrink && packed ? 0.2 : 0) + addonTotal;

                  return (
                    <div key={orderKey} className="bg-white p-4 rounded shadow">
                      <h2 className="font-semibold text-lg">
                        {item.chineseName} ({item.name}){isDrink ? ` - ${type.toUpperCase()}` : ""}
                      </h2>
                      <p>RM {price.toFixed(2)}</p>
                      <label className="block mt-1">
                        <input
                          type="checkbox"
                          checked={packed}
                          onChange={() => togglePacked(item, type)}
                        /> 打包{isDrink ? " (+RM0.20)" : " (免费)"}
                      </label>
                      {item.addons?.length > 0 && (
                        <div className="mt-1">
                          {item.addons.map((addon) => (
                            <label key={addon.name} className="block text-sm">
                              <input
                                type="checkbox"
                                checked={addons.some((a) => a.name === addon.name)}
                                onChange={() => toggleAddon(item, type, addon)}
                              /> {addon.name} (+RM{addon.price.toFixed(2)})
                            </label>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2 mt-2">
                        <button className="px-3 py-1 bg-gray-300 rounded" onClick={() => updateQty(item, type, -1)}>-</button>
                        <span>{ordered?.qty || 0}</span>
                        <button className="px-3 py-1 bg-green-400 rounded" onClick={() => updateQty(item, type, 1)}>+</button>
                      </div>
                    </div>
                  );
                });
              })}
            </div>
          </div>
        )}

        {/* Order summary */}
        <div className="mt-10 p-4 bg-white rounded shadow">
          <h2 className="text-xl font-semibold mb-2">🧾 当前订单</h2>
          <ul className="mb-2">
            {Object.values(order).map((item, idx) => (
              <li key={idx}>
                {item.name} - {item.type.toUpperCase()}
                {item.packed ? "（打包）" : ""}
                {item.addons?.length ? " + " + item.addons.map((a) => a.name).join(", ") : ""} x {item.qty}
              </li>
            ))}
          </ul>
          <h2 className="text-lg font-bold">总价: RM {getTotal()}</h2>
          <div className="mt-2 flex gap-4">
            <button className="px-4 py-2 bg-red-500 text-white rounded" onClick={clearOrder}>清空</button>
            <button className="px-4 py-2 bg-blue-500 text-white rounded" onClick={handleRequestBill}>请求账单</button>
          </div>
        </div>

        {/* 我的订单 */}
        {myOrders.length > 0 && (
          <div className="mt-10 p-4 bg-white rounded shadow">
            <h2 className="text-xl font-semibold mb-2">📜 我的订单</h2>
            {myOrders.map((o, idx) => (
              <div key={idx} className="mb-2 border p-2 rounded">
                <div>订单编号: {o.orderId}</div>
                <div>时间: {new Date(o.time).toLocaleString()}</div>
                <div>总价: RM {o.total}</div>
                <div className="text-sm text-gray-600">
                  餐点:
                  <ul className="list-disc pl-5">
                    {o.items.map((i, iIdx) => (
                      <li key={iIdx}>
                        {i.name} - {i.type}{i.packed ? "（打包）" : ""} x {i.qty}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
      </div> {/* Content 结束 */}
    </div>   {/* 主 container 结束 */}
  );
}
