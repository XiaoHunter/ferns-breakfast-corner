import React, { useEffect, useState , useRef , useMemo } from "react";

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
      .then(data => setMenu(data))
      .catch(err => {
        console.error("Failed to load menu", err);
        setMenu([]);
      });
  }, []);

  const flatMenu = useMemo(() => {
    if (!Array.isArray(menu)) {
      console.warn("⚠️ menu is not array", menu);
      return [];
    }

    const result = menu.flatMap(({ category, items }) =>
      items.map(i => ({ ...i, category }))
    );

    console.log("📋 flatMenu:", result);
    return result;
  }, [menu]);

  const printOrder = (order) => {
    const printWindow = window.open("", "_blank", "width=400,height=600");
    if (!printWindow) return;

    const time = formatMalaysiaTime(order.time);
    const total = Number(order.total || 0).toFixed(2);
    const items = order.items.map((item) => {
      const type = item.type === "hot" ? "Hot" : item.type === "cold" ? "Cold" : "";
      const packed = item.packed ? "（Takeaway）" : "";
      const addons = item.addons?.length ? " + " + item.addons.map(a => a.name).join(" + ") : "";
      const matched = flatMenu.find(m => m.name === item.name);
      const basePrice =
        item.type?.toLowerCase() === "cold"
          ? Number(matched?.coldPrice ?? matched?.price ?? 0)
          : item.type?.toLowerCase() === "hot"
          ? Number(matched?.hotPrice ?? matched?.price ?? 0)
          : Number(matched?.price ?? 0);
      const addonTotal = (item.addons || []).reduce((s, a) => s + a.price, 0);
      const packedFee = item.packed ? 0.2 : 0;
      const comboTotal = ((basePrice + addonTotal + packedFee) * item.qty).toFixed(2);

      return `
        <tr>
          <td>
            ${item.name} - ${type}${packed}${addons} x ${item.qty}
          </td>
          <td style="text-align:right">
            RM ${comboTotal}
          </td>
        </tr>
      `;
    }).join("");

    const html = `
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
        <table>${items}</table>
        <script>
          window.onload = function () {
            setTimeout(() => {
              window.print();

              // 打印后再等待 3 秒关闭窗口
              setTimeout(() => window.close(), 3000);
            }, 2000); // 延迟 2 秒才执行 print
          };
        </script>
      </body></html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
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
            console.log("👀 正在打印订单", latest);
            console.log("📦 menu 是", menu);
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
            })
            .then(res => res.json())
            .then(console.log) // ✅ 成功或错误都看得见
            .catch(console.error); // 🚨 网络失败就会显示出来
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
              const matched = flatMenu.find((m) => {
                console.log("🟡 Checking item: ", item.name, " vs ", m.name);
                return m.name === item.name;
              });
              const basePrice =
                item.type?.toLowerCase() === "cold"
                  ? Number(matched?.coldPrice ?? matched?.price ?? 0)
                  : item.type?.toLowerCase() === "hot"
                  ? Number(matched?.hotPrice ?? matched?.price ?? 0)
                  : Number(matched?.price ?? 0);

                console.log("👉 basePrice:", basePrice);
                console.log("👉 matched:", matched);

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