import React, { useEffect, useState } from "react";

export default function OrderMenu() {
  const [menu, setMenu] = useState({});
  const [order, setOrder] = useState({});
  const [packedStatus, setPackedStatus] = useState({});
  const [addonsStatus, setAddonsStatus] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("https://ferns-breakfast-corner.com/items/orders-items.json")
      .then((res) => res.json())
      .then((data) => {
        const categorized = {};
        data.forEach((entry) => {
          categorized[entry.category] = entry.items;
        });
        setMenu(categorized);
        setLoading(false);
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
    const statusKey = `${item.name}-${type}`;
    const newStatus = !packedStatus[statusKey];
    setPackedStatus({ ...packedStatus, [statusKey]: newStatus });
  };

  const toggleAddon = (item, type, addon) => {
    const key = `${item.name}-${type}`;
    const current = addonsStatus[key] || [];
    const exists = current.find((a) => a.name === addon.name);
    const updated = exists
      ? current.filter((a) => a.name !== addon.name)
      : [...current, addon];
    setAddonsStatus({ ...addonsStatus, [key]: updated });
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
    const deviceId = "device-" + Math.random().toString(36).substring(2, 8);
    const items = Object.values(order).map((item) => ({
      name: item.name,
      type: item.type.toUpperCase(),
      qty: item.qty,
      packed: item.packed,
      addons: item.addons || [],
    }));

    const data = {
      deviceId,
      items,
      total: getTotal(),
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
    <div className="p-4 bg-yellow-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">🧋 Order Menu</h1>
      {Object.entries(menu).map(([category, items]) => (
        <div key={category} className="mb-6">
          <h2 className="text-xl font-bold mb-2">📂 {category}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {items.map((item) => {
              const isDrink = category === "饮料";
              const types = isDrink ? ["hot", "cold"] : ["standard"];

              return types.map((type) => {
                const statusKey = `${item.name}-${type}`;
                const packed = packedStatus[statusKey] || false;
                const addons = addonsStatus[statusKey] || [];
                const key = item.name + "-" + type + (packed ? "-packed" : "") + (addons.length ? "-addons" : "");
                const ordered = order[key];
                const base = isDrink ? (type === "hot" ? item.hotPrice : item.coldPrice) : item.price;
                const addonTotal = addons.reduce((sum, a) => sum + a.price, 0);
                const price = base + (isDrink && packed ? 0.2 : 0) + addonTotal;

                return (
                  <div key={key} className="bg-white p-4 rounded shadow">
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
                      <button
                        className="px-3 py-1 bg-gray-300 rounded"
                        onClick={() => updateQty(item, type, -1)}
                      >-</button>
                      <span>{ordered?.qty || 0}</span>
                      <button
                        className="px-3 py-1 bg-green-400 rounded"
                        onClick={() => updateQty(item, type, 1)}
                      >+</button>
                    </div>
                  </div>
                );
              });
            })}
          </div>
        </div>
      ))}

      <div className="mt-6 p-4 bg-white rounded shadow">
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
    </div>
  );
}