import React, { useEffect, useState, useRef, useMemo } from "react";

export default function OrderMenu() {
  const [menu, setMenu] = useState({});
  const [selectedCategory, setSelectedCategory] = useState("");
  const [order, setOrder] = useState({});
  const [myOrders, setMyOrders] = useState([]);
  const [typeStatus, setTypeStatus] = useState({});
  const [noodleStatus, setNoodleStatus] = useState({});
  const [flavorStatus, setFlavorStatus] = useState({});
  const [packedStatus, setPackedStatus] = useState({});
  const [addonsStatus, setAddonsStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [editingOrderId, setEditingOrderId] = useState(null);
  const deviceId = useMemo(() => {
    const stored = localStorage.getItem("deviceId");
    if (stored) return stored;
    const newId = "device-" + Math.random().toString(36).substring(2, 8);
    localStorage.setItem("deviceId", newId);
    return newId;
  }, []);

  const formatMalaysiaTime = (isoString) => {
    const date = new Date(isoString);
    const local = new Date(date.getTime() + 8 * 60 * 60 * 1000);
    return local.toLocaleString("en-MY", { hour12: false });
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get("edit");
    if (editId) {
      setEditingOrderId(Number(editId));
    }
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

  const getMalaysiaToday = () => {
    const now = new Date();
    const malaysiaTime = new Date(now.getTime() + 8 * 60 * 60 * 1000); // 加 8 小时（毫秒）
    return malaysiaTime.toISOString().split("T")[0];
  };

  useEffect(() => {
    const fetchOrders = () => {
      const today = getMalaysiaToday();
      fetch(`https://ferns-breakfast-corner.com/orders/orders-${today}.json?t=${Date.now()}`)
        .then(res => res.json())
        .then(data => {
          const myOrdersOnly = data.filter(o => o.deviceId === deviceId);
          setMyOrders(myOrdersOnly);

          const urlParams = new URLSearchParams(window.location.search);
          const editId = urlParams.get("edit");

          if (!editId) {
            const pending = myOrdersOnly.find(o => o.status === "pending");
            if (pending) {
              setEditingOrderId(pending.orderId);
            } else {
              setEditingOrderId(null);
            }
          }
        })
        .catch(() => setMyOrders([]));
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [deviceId]);

  useEffect(() => {
    if (!menu) return;

    const updated = {};
    Object.entries(menu).forEach(([category, items]) => {
      items.forEach((item) => {
        const key = `${item.name}-${item.type}`;

        // 默认口味
        if (item.flavors && flavorStatus[key]) {
          updated[key] = { ...(updated[key] || {}), flavor: flavorStatus[key] };
        }

        // 默认面粉
        if (item.noodles && noodleStatus[key]) {
          updated[key] = { ...(updated[key] || {}), noodle: noodleStatus[key] };
        }
      });
    });
  }, [menu]);

  const updateType = (itemName, newType) => {
    setTypeStatus((prev) => ({ ...prev, [itemName]: newType }));
  };

  const updateQty = (item, type, delta) => {
    const keyBase = `${item.name}-${type}`;
    const packed = packedStatus[keyBase] || false;
    const isNoodleCategory = item.category === "云吞面" || item.category === "粿条汤";
    const flavor = flavorStatus[keyBase] || (isNoodleCategory ? (item.category === "云吞面" ? "干" : "汤") : "");
    const noodle = noodleStatus[keyBase] !== undefined ? noodleStatus[keyBase] : (item.category === "云吞面" ? "Wantan Mee" : item.category === "粿条汤" ? "Koay Teow" : "");
    const addons = addonsStatus[keyBase] || [];
    const flavorPart = item.noodles || item.types ? `-${flavor}` : "";
    const noodlePart = item.noodles ? `-${noodle}` : "";
    const packedPart = packed ? "-packed" : "";
    const addonPart = addons.length ? "-addons" : "";

    const key = `${item.name}-${type}${flavorPart}${noodlePart}${packedPart}${addonPart}`;

    setOrder((prev) => {
      const qty = (prev[key]?.qty || 0) + delta;
      if (qty <= 0) {
        const { [key]: _, ...rest } = prev;
        return rest;
      }
      const isDrink = item.category?.startsWith("饮料");
      return {
        ...prev,
        [key]: {
          name: item.name,
          type,
          packed,
          addons,
          qty,
          flavor,
          noodle
        }
      };
    });
  };

  const updateOption = (item, type, value) => {
    const key = `${item.name}-${item.type}`;
    const current = order[key] || { qty: 0 };
    setOrder({
      ...order,
      [key]: {
        ...current,
        [type]: value,
      },
    });
  };

  const togglePacked = (item, type) => {
    const key = `${item.name}-${type}`;
    const newStatus = !packedStatus[key];
    setPackedStatus({ ...packedStatus, [key]: newStatus });
  };

  const toggleAddon = (item, type, addon) => {
    const key = `${item.name}-${type}`;
    const current = addonsStatus[key] || [];
    const exists = current.find((a) => a.name === addon.name);
    const updated = exists ? current.filter((a) => a.name !== addon.name) : [...current, addon];
    setAddonsStatus((prev) => ({ ...prev, [key]: updated }));
  };

  const handleFlavorChange = (item, type, flavor) => {
    const key = `${item.name}-${type}`;
    setFlavorStatus((prev) => ({ ...prev, [key]: flavor }));
  };

  const handleNoodleChange = (item, type, noodle) => {
    const key = `${item.name}-${type}`;
    setNoodleStatus((prev) => ({ ...prev, [key]: noodle }));
  };

  const getTotal = () => {
    let sum = 0;
    const flatMenu = Object.entries(menu).flatMap(([cat, items]) =>
      items.map((item) => ({ ...item, category: cat }))
    );

    for (const item of Object.values(order)) {
      const matched = flatMenu.find((d) => d.name === item.name);
      if (!matched) continue;

      const basePrice = 
        item.type === "cold" ? Number(matched.coldPrice ?? matched.price ?? 0) :
        item.type === "hot" ? Number(matched.hotPrice ?? matched.price ?? 0) :
        Number(matched.price ?? 0);

      const isDrinkCategory = matched.category && matched.category.startsWith("饮料");
      const addonTotal = (item.addons || []).reduce((s, a) => s + a.price, 0);

      const packedFee = isDrinkCategory && item.packed ? 0.2 : 0;

      sum += item.qty * (basePrice + addonTotal + packedFee);
    }

    return sum.toFixed(2);
  };

  const clearOrder = () => setOrder({});

  const handleRequestBill = () => {
    if (!window.confirm("是否确认送出订单？")) return;

    const items = Object.values(order).map((item) => ({
      name: item.name,
      type: item.type ? item.type.toUpperCase() : "STANDARD",
      qty: item.qty,
      packed: item.packed,
      flavor: item.flavor || "",
      noodle: item.noodle || "",
      addons: item.addons || [],
    }));

    const data = {
      deviceId,
      items,
      total: getTotal(),
      time: new Date().toISOString(),
      status: "pending",
      payment: "",
    };

    if (editingOrderId) {
      data.orderId = editingOrderId;
    } else {
      clearOrder(); // ✅ 只在新增订单时清空
    }

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
            src="/ferns-logo.png"
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
                const isDrink = selectedCategory.startsWith("饮料");
                const selectedType = typeStatus[item.name] || (isDrink ? "hot" : "standard");
                const types = [selectedType];

                return types.map((type) => {
                  const keyBase = `${item.name}-${type}`;
                  const packed = packedStatus[keyBase] || false;
                  const isNoodleCategory = item.category === "云吞面" || item.category === "粿条汤";
                  const flavor = flavorStatus[keyBase] || (isNoodleCategory ? (item.category === "云吞面" ? "干" : "汤") : "");
                  const noodle = noodleStatus[keyBase] || (item.category === "云吞面" ? "Wantan Mee" : item.category === "粿条汤" ? "Koay Teow" : "");
                  const addons = addonsStatus[keyBase] || [];
                  const flavorPart = item.noodles || item.types ? `-${flavor}` : "";
                  const noodlePart = item.noodles ? `-${noodle}` : "";
                  const packedPart = packed ? "-packed" : "";
                  const addonPart = addons.length ? "-addons" : "";

                  const key = `${item.name}-${type}${flavorPart}${noodlePart}${packedPart}${addonPart}`;
                  const ordered = order[key];
                  const unitPrice = isDrink
                    ? (type === "hot"
                        ? Number(item.hotPrice || item.price || 0)
                        : Number(item.coldPrice || item.price || 0))
                    : Number(item.price || 0);
                  const addonTotal = addons.reduce((sum, a) => sum + a.price, 0);
                  const price = unitPrice + (isDrink && packed ? 0.2 : 0) + addonTotal;

                  return (
                    <div key={key} className="bg-white p-4 rounded shadow">
                      <h2 className="font-semibold text-lg">
                        {item.chineseName}{item.name}
                      </h2>
                      <p>RM {price.toFixed(2)}</p>
                      <label className="block mt-1">
                        <input
                          type="checkbox"
                          checked={packed}
                          onChange={() => togglePacked(item, type)}
                        /> 打包{isDrink ? " (+RM0.20)" : "(免费)"}
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

                      {isDrink && (
                        <div className="mt-1">
                          <label>
                            <input
                              type="radio"
                              name={`type-${item.name}`}
                              value="hot"
                              checked={type === "hot"}
                              onChange={() => updateType(item.name, "hot")}
                            /> 热
                          </label>
                          <label className="ml-2">
                            <input
                              type="radio"
                              name={`type-${item.name}`}
                              value="cold"
                              checked={type === "cold"}
                              onChange={() => updateType(item.name, "cold")}
                            /> 冷
                          </label>
                        </div>
                      )}

                      {item.types && (
                        <div className="mt-2">
                          <label className="block">选择口味:</label>
                          <label>
                            <input
                              type="radio"
                              name={`flavor-${item.name}-${type}`}
                              value="dry"
                              checked={flavor === "dry"}
                              onChange={() => handleFlavorChange(item, type, "dry")}
                            /> 干
                          </label>
                          <label className="ml-2">
                            <input
                              type="radio"
                              name={`flavor-${item.name}-${type}`}
                              value="soup"
                              checked={flavor === "soup"}
                              onChange={() => handleFlavorChange(item, type, "soup")}
                            /> 汤
                          </label>
                        </div>
                      )}

                      {item.noodles && (
                        <div className="mt-2">
                          <label className="block">选择面粉:</label>
                          <select
                            value={order[key]?.noodle || noodleStatus[keyBase] || ""}
                            onChange={(e) => handleNoodleChange(item, type, e.target.value)}
                          >
                            <option value="">请选择面粉</option>
                            {item.noodles.map((n) => (
                              <option key={n.name} value={n.name}>{n.name}</option>
                            ))}
                          </select>
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
                {item.name} - {item.type?.toUpperCase() ?? "STANDARD"}
                {item.packed && "（打包）"}
                {item.addons?.length > 0 && <> + {item.addons.map((a) => a.name).join(", ")}</>} x {item.qty}
                {item.flavor && <div>口味: {item.flavor}</div>}
                {item.noodle && <div>面粉: {item.noodle}</div>}
              </li>
            ))}
          </ul>
          <h2 className="text-lg font-bold">总价: RM {getTotal()}</h2>
          <div className="mt-2 flex gap-4">
            <button className="px-4 py-2 bg-red-500 text-white rounded" onClick={clearOrder}>清空</button>
            <button className="px-4 py-2 bg-blue-500 text-white rounded" onClick={handleRequestBill}>请求账单</button>
          </div>
        </div>

        {/* View My Order */}
        {myOrders.length > 0 && (
          <div className="mt-10 p-4 bg-white rounded shadow">
            <h2 className="text-xl font-semibold mb-2">📜 我的订单</h2>
            {myOrders.map((o, idx) => (
              <div key={idx} className="mb-2 border p-2 rounded">
                <div>订单编号: {o.orderId}</div>
                <div>时间: {formatMalaysiaTime(o.time)}</div>
                <div>总价: RM {o.total}</div>
                <div className="text-sm text-gray-600">
                  餐点:
                  <ul className="list-disc pl-5">
                    {o.items.map((i, iIdx) => (
                      <li key={iIdx}>
                        {i.name} - {i.type}{i.packed ? "（打包）" : ""} x {i.qty}
                        {i.flavor && <div>口味: {i.flavor}</div>}
                        {i.noodle && <div>面粉: {i.noodle}</div>}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div> 
  );
}
