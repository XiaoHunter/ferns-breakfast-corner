
import React, { useState } from "react";

const drinks = [
  { name: "Kopi O", cn: "咖啡乌", hot: 1.4, cold: 1.8 },
  { name: "Teh", cn: "茶", hot: 1.8, cold: 2.3 },
  { name: "Milo", cn: "美禄", hot: 2.8, cold: 3.0 },
  { name: "Nescafe O", cn: "雀巢咖啡乌", hot: 2.5, cold: 2.7 },
  { name: "White Coffee", cn: "白咖啡", hot: 2.0, cold: 2.0 },
  { name: "Can Drink", cn: "罐装饮料", hot: 2.6, cold: 2.8 },
  { name: "Ice Kosong", cn: "白开水", hot: 0.5, cold: 0.5 },
];

export default function OrderMenu() {
  const [order, setOrder] = useState({});
  const [packedStatus, setPackedStatus] = useState({}); // store checkbox state

  const updateQty = (drink, type, delta) => {
    const packed = packedStatus[`${drink.name}-${type}`] || false;
    const key = drink.name + "-" + type + (packed ? "-packed" : "");
    setOrder((prev) => {
      const qty = (prev[key]?.qty || 0) + delta;
      if (qty <= 0) {
        const { [key]: _, ...rest } = prev;
        return rest;
      }
      return {
        ...prev,
        [key]: { ...prev[key], qty },
      };
    });
  };

  const togglePacked = (drink, type) => {
    const statusKey = `${drink.name}-${type}`;
    const newStatus = !packedStatus[statusKey];
    setPackedStatus({ ...packedStatus, [statusKey]: newStatus });
  };

  const getTotal = () => {
    let sum = 0;
    for (const [key, item] of Object.entries(order)) {
      const [name, type, packed] = key.split("-");
      const drink = drinks.find((d) => d.name === name);
      const price = type === "cold" ? drink.cold : drink.hot;
      const packedFee = packed === "packed" ? 0.2 : 0;
      sum += item.qty * (price + packedFee);
    }
    return sum.toFixed(2);
  };

  const clearOrder = () => setOrder({});
  const handleRequestBill = () => {
    const deviceId = "device-" + Math.random().toString(36).substring(2, 8);
    const items = Object.entries(order).map(([key, item]) => {
      const [name, type, packed] = key.split("-");
      return {
        name,
        type: type.toUpperCase(),
        qty: item.qty,
        packed: packed === "packed",
      };
    });
    const data = {
      deviceId,
      items,
      total: getTotal(),
    };

    fetch("https://ferns-breakfast-corner.com/send-order.php", {
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

  return (
    <div className="p-4 bg-yellow-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">🧋 Order Menu</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {drinks.map((drink) =>
          ["hot", "cold"].map((type) => {
            const statusKey = `${drink.name}-${type}`;
            const packed = packedStatus[statusKey] || false;
            const key = drink.name + "-" + type + (packed ? "-packed" : "");
            const item = order[key];
            const price = (type === "hot" ? drink.hot : drink.cold) + (packed ? 0.2 : 0);
            return (
              <div key={key} className="bg-white p-4 rounded shadow">
                <h2 className="font-semibold text-lg">
                  {drink.cn} ({drink.name}) - {type.toUpperCase()}
                </h2>
                <p>RM {price.toFixed(2)}</p>
                <label className="block mt-1">
                  <input
                    type="checkbox"
                    checked={packed}
                    onChange={() => togglePacked(drink, type)}
                  />{" "}
                  打包 (+RM0.20)
                </label>
                <div className="flex gap-2 mt-2">
                  <button
                    className="px-3 py-1 bg-gray-300 rounded"
                    onClick={() => updateQty(drink, type, -1)}
                  >
                    -
                  </button>
                  <span>{item?.qty || 0}</span>
                  <button
                    className="px-3 py-1 bg-green-400 rounded"
                    onClick={() => updateQty(drink, type, 1)}
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-6 p-4 bg-white rounded shadow">
        <h2 className="text-xl font-semibold mb-2">🧾 当前订单</h2>
        <ul className="mb-2">
          {Object.entries(order).map(([key, item]) => (
            <li key={key}>
              {key.toUpperCase().replace(/-/g, " ").replace("PACKED", "（打包）")} x {item.qty}
            </li>
          ))}
        </ul>
        <h2 className="text-lg font-bold">总价: RM {getTotal()}</h2>
        <div className="mt-2 flex gap-4">
          <button
            className="px-4 py-2 bg-red-500 text-white rounded"
            onClick={clearOrder}
          >
            清空
          </button>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded"
            onClick={handleRequestBill}
          >
            请求账单
          </button>
        </div>
      </div>
    </div>
  );
}
