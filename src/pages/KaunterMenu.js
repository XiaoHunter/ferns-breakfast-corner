import React, { useEffect, useState , useRef } from "react";

const KaunterMenu = () => {
  const [token, setToken] = useState(null);
  const [input, setInput] = useState("");
  const [orders, setOrders] = useState([]);
  const [menu, setMenu] = useState([]);
  const [selectedDate, setSelectedDate] = useState(getMalaysiaToday());

  function getMalaysiaToday() {
    const now = new Date();
    const malaysiaTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    return malaysiaTime.toISOString().split("T")[0];
  }

  useEffect(() => {
    fetch("https://ferns-breakfast-corner.com/menu/orders-items.json")
      .then(res => res.json())
      .then(setMenu)
      .catch(err => {
        console.error("Failed to load menu", err);
        setMenu([]);
      });
  }, []);

  const printOrder = (order) => {
    const printWindow = window.open("", "_blank", "width=400,height=600");
    if (!printWindow) return;

    const time = formatMalaysiaTime(order.time);
    const total = order.total?.toFixed(2) || "0.00";
    const items = order.items.map((item) => {
      const type = item.type === "hot" ? "Hot" : item.type === "cold" ? "Cold" : "";
      const packed = item.packed ? "（Takeaway）" : "";
      const addons = item.addons?.length ? " + " + item.addons.map(a => a.name).join(" + ") : "";
      const flatMenu = Object.entries(menu).flatMap(([cat, items]) =>
                items.map((i) => ({ ...i, category: cat }))
              );
      const matched = flatMenu.find(m => m.name === item.name);
      const basePrice =
        item.type === "cold" ? Number(matched?.coldPrice ?? matched?.price ?? 0)
        : item.type === "hot" ? Number(matched?.hotPrice ?? matched?.price ?? 0)
        : Number(matched?.price ?? 0);
      const addonTotal = (item.addons || []).reduce((s, a) => s + a.price, 0);
      const packedFee = item.packed ? 0.2 : 0;
      const comboTotal = ((basePrice + addonTotal + packedFee) * item.qty).toFixed(2);

      return `
        <tr>
          <td>
            🍹 ${item.name} - ${type}${packed}${addons} x ${item.qty}
          </td>
          <td style="text-align:right">
            RM ${comboTotal}
          </td>
        </tr>
      `;
    }).join("");

    printWindow.document.write(`
      <html><head><style>
        body { font-family: Arial; font-size: 13px; padding: 10px; }
        h2, p { margin: 0 0 8px 0; text-align: center; }
        ul { list-style: none; padding-left: 0; }
      </style></head><body>
        <h2>🧾 Ferns Breakfast Corner</h2>
        <p>订单编号: ${order.orderId}</p>
        <p>Table: ${order.tableNo}</p>
        <p>时间: ${time}</p>
        <p>总价: RM ${total}</p>
        <p>饮料：</p>
        <ul>${items}</ul>
      </body></html>
    `);

    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    };
  };

  const lastOrderIdRef = useRef(0);

  useEffect(() => {
    if (!token) return;
    const fetchOrders = () => {
      fetch(`https://ferns-breakfast-corner.com/orders/orders-${selectedDate}.json?t=${Date.now()}`)
        .then(res => res.json())
        .then((data) => {
          const latest = [...data].sort((a, b) => b.orderId - a.orderId)[0];
          if (!latest.printRef && latest.orderId > lastOrderIdRef.current) {
            lastOrderIdRef.current = latest.orderId;
            setTimeout(() => {
              if (!menu || !menu.length) return;
              printOrder(latest);
            }, 5000);
            fetch("https://ferns-breakfast-corner.com/api/mark-order-printed.php", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                date: selectedDate,
                orderId: latest.orderId
              })
            });
          }
          setOrders(data.reverse());
        })
        .catch(() => setOrders([])); // 若 fetch 失败，避免崩溃
    };
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [token, selectedDate]);

  const login = () => {
    fetch("https://ferns-breakfast-corner.com/api/kaunter-login.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: input }),
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.status === "success") setToken(res.token);
        else alert("❌ 密码错误！");
      });
  };

  const formatMalaysiaTime = (isoTime) => {
    const date = new Date(isoTime);
    const local = new Date(date.getTime() + 8 * 60 * 60 * 1000);
    return local.toLocaleString("en-MY", { hour12: false });
  };

  const getDailyTotal = () => {
    const list = Array.isArray(orders)
      ? orders
      : Object.values(orders).filter(o => typeof o === "object");

    const total = list.reduce((sum, order) => {
      const value = parseFloat(order.total) || 0;
      return sum + value;
    }, 0);

    return total.toFixed(2);
  };

  if (!token) {
    return (
      <div className="p-4">
        <h2>🔐 Kaunter 登录</h2>
        <input
          type="password"
          placeholder="输入密码"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="border p-2 mr-2"
        />
        <button onClick={login} className="bg-blue-600 text-white px-4 py-2 rounded">登录</button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-2">📜 Kaunter Order List - {selectedDate.split('-').reverse().join('/')}</h2>

      <div className="mb-4 flex items-center gap-2">
        <label htmlFor="date" className="text-sm">📅 选择日期：</label>
        <input type="date" id="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="border px-2 py-1" />
        <span className="ml-auto font-semibold">💰 总金额：RM {getDailyTotal()}</span>
      </div>

      {orders.map((order) => (
        <div key={order.orderId} className="border p-3 mb-4 rounded shadow">
          <div><strong>订单编号:</strong> {order.orderId}</div>
          <div><strong>Table:</strong> {order.tableNo}</div>
          <div><strong>时间:</strong> {formatMalaysiaTime(order.time)}</div>
          <div><strong>总价:</strong> RM {parseFloat(order.total || 0).toFixed(2)}</div>
          <ul className="mt-2">
            <li><strong>饮料：</strong></li>
            {order.items.map((item, i) => {
              const typeLabel = item.type === "hot" ? "Hot" : item.type === "cold" ? "Cold" : "";
              const packedLabel = item.packed ? "（Takeaway）" : "";
              const addonLabel = item.addons?.length
                ? " + " + item.addons.map(a => a.name).join(" + ")
                : "";
              const flatMenu = Object.entries(menu).flatMap(([cat, items]) =>
                items.map((i) => ({ ...i, category: cat }))
              );
              const matched = flatMenu.find(m => m.name === item.name);
              const basePrice =
                item.type === "cold" ? Number(matched?.coldPrice ?? matched?.price ?? 0)
                : item.type === "hot" ? Number(matched?.hotPrice ?? matched?.price ?? 0)
                : Number(matched?.price ?? 0);
              const addonTotal = (item.addons || []).reduce((s, a) => s + a.price, 0);
              const packedFee = item.packed ? 0.2 : 0;
              const comboTotal = ((basePrice + addonTotal + packedFee) * item.qty).toFixed(2);

              return (
                <li key={i}>
                  {item.name} - {typeLabel} {packedLabel} {addonLabel} x {item.qty} = RM {comboTotal}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default KaunterMenu;