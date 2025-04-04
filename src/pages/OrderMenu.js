
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

  const updateQty = (key, delta, packed = false) => {
    setOrder((prev) => {
      const qty = (prev[key]?.qty || 0) + delta;
      if (qty <= 0) {
        const { [key]: _, ...rest } = prev;
        return rest;
      }
      return {
        ...prev,
        [key]: { ...prev[key], qty, packed },
      };
    });
  };

  const getTotal = () => {
    let packedIncluded = false;
    let sum = Object.entries(order).reduce((total, [key, item]) => {
      const drink = drinks.find((d) => d.name === key.split("-")[0]);
      const temp = key.includes("cold") ? drink.cold : drink.hot;
      const add = 0; if (item.packed) packedIncluded = true;
      return sum + item.qty * (temp + add);
    return total + item.qty * (temp + add);
  }, 0);
  if (packedIncluded) sum += 0.2;
  return sum.toFixed(2);
}

  const clearOrder = () => setOrder({});
  const handleRequestBill = () => {
    const deviceId = "device-" + Math.random().toString(36).substring(2, 8);
    const items = Object.entries(order).map(([key, item]) => {
      const [name, type] = key.split("-");
      return {
        name,
        type: type.toUpperCase(),
        qty: item.qty,
        packed: item.packed,
      };
    });
    const data = {
      deviceId,
      items,
      total: getTotal(),
    };
    alert("✅ 订单已准备好发送：\n" + JSON.stringify(data, null, 2));
    // 之后可发送到后端或广播给其他页面
  };

  return (
    <div className="p-4 bg-yellow-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">🧋 Order Menu</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {drinks.map((drink) => (
          ["hot", "cold"].map((type) => {
            const key = drink.name + "-" + type;
            const item = order[key];
            return (
              <div key={key} className="bg-white p-4 rounded shadow">
                <h2 className="font-semibold text-lg">{drink.cn} ({drink.name}) - {type.toUpperCase()}</h2>
                <p>RM {type === "hot" ? drink.hot.toFixed(2) : drink.cold.toFixed(2)}</p>
                <label className="block my-1">
                  <input
                    type="checkbox"
                    checked={item?.packed || false}
                    onChange={(e) =>
                      setOrder((prev) => ({
                        ...prev,
                        [key]: {
                          ...(prev[key] || { qty: 1 }),
                          packed: e.target.checked,
                        },
                      }))
                    }
                  />{" "}
                  打包 (+RM0.20)
                </label>
                <div className="flex gap-2 items-center mt-2">
                  <button className="bg-red-400 px-2 text-white rounded" onClick={() => updateQty(key, -1)}>-</button>
                  <span>{item?.qty || 0}</span>
                  <button className="bg-green-400 px-2 text-white rounded" onClick={() => updateQty(key, 1)}>+</button>
                </div>
              </div>
            );
          })
        ))}
      </div>

      {/* Bill Summary */}
      {Object.keys(order).length > 0 && (
        <div className="mt-6 bg-white p-4 rounded shadow">
          <h2 className="text-lg font-bold mb-2">🧾 当前订单</h2>
          <ul className="list-disc pl-5 text-sm">
            {Object.entries(order).map(([key, item]) => {
              const [name, type] = key.split("-");
              return (
                <li key={key}>
                  {name} ({type.toUpperCase()}) x {item.qty} {item.packed ? "【打包】" : ""}
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-right font-bold">总价: RM {getTotal()}</p>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={clearOrder} className="bg-gray-400 text-white px-3 py-1 rounded">清空</button>
            <button onClick={handleRequestBill} className="bg-blue-600 text-white px-3 py-1 rounded">请求账单</button>
          </div>
        </div>
      )}
    </div>
  );
}
