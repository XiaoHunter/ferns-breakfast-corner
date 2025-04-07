import React, { useEffect, useState , useRef , useMemo } from "react";

const KaunterMenu = () => {
  const [token, setToken] = useState(null);
  const [input, setInput] = useState("");
  const [orders, setOrders] = useState([]);
  const [menu, setMenu] = useState([]);
  const [printedOrders, setPrintedOrders] = useState([]);
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
      const type = item.type === "HOT" ? "HOT" : item.type === "COLD" ? "COLD" : "";
      console.log("Type: ", type, " Item Type: ", item.type);
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
            }, 5000);
          };
        </script>
      </body></html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  useEffect(() => {
    if (!token) return;
    const fetchOrders = () => {
      fetch(`https://ferns-breakfast-corner.com/orders/orders-${selectedDate}.json?t=${Date.now()}`)
        .then(res => res.json())
        .then((data) => {
          setOrders(data.reverse());
        })
        .catch(() => setOrders([])); // 若 fetch 失败，避免崩溃
    };
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [token, selectedDate]);

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

  const handleManualPrint = () => {
    fetch(`https://ferns-breakfast-corner.com/orders/orders-${selectedDate}.json?t=${Date.now()}`)
      .then(res => res.json())
      .then((data) => {
        const unprinted = data.filter(order => !order.printRef && !printedOrders.includes(order.orderId));
        console.log("📦 未打印订单: ", unprinted);

        const printNext = (idx) => {
          if (idx >= unprinted.length) return;

          const order = unprinted[idx];
          printOrder(order);

          setTimeout(() => {
            const confirmPrint = window.confirm(`请问打印成功了吗？`);
            if (confirmPrint) {
              setPrintedOrders(prev => [...prev, order.orderId]);
              setOrders((prev) =>
                prev.map(o => o.orderId === order.orderId ? { ...o, printRef: true } : o)
              );

              fetch("https://ferns-breakfast-corner.com/api/mark-order-printed.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ date: selectedDate, orderId: order.orderId })
              }).then(res => res.json()).then(console.log).catch(console.error);
            }

            printNext(idx + 1); // 再继续下一个订单
          }, 3000);
        };

        printNext(0);
        setOrders(data.reverse());
      })
      .catch(() => setOrders([])); // 若 fetch 失败，避免崩溃
  };

  const handleManualPrintOrder = (order) => {
    printOrder(order);
    setPrintedOrders(prev => [...prev, order.orderId]);

    setTimeout(() => {
      const result = window.confirm("请问打印成功了吗？");
      if (result) {
        setOrders((prev) =>
          prev.map((o) =>
            o.orderId === order.orderId ? { ...o, printRef: true } : o
          )
        );
        fetch("https://ferns-breakfast-corner.com/api/mark-order-printed.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: selectedDate, orderId: order.orderId })
        });
      }
    }, 3000);
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-2">📜 Kaunter Order List - {selectedDate.split('-').reverse().join('/')}</h2>

      <div className="mb-4 flex items-center gap-2">
        <button
          className="bg-green-600 text-white px-4 py-1 rounded mb-4"
          onClick={handleManualPrint}
        >
          📥 Refresh Orders & Print
        </button>
      </div>

      {orders.map((order) => (
        <div key={order.orderId} className="border p-3 mb-4 rounded shadow">
          <div><strong>订单编号:</strong> {order.orderId}</div>
          <div><strong>Table:</strong> {order.tableNo}</div>
          <div><strong>时间:</strong> {formatMalaysiaTime(order.time)}</div>
          <div><strong>总价:</strong> RM {parseFloat(order.total || 0).toFixed(2)}</div>
          <div>
            <strong>打印状态:</strong>{" "}
            {order.printRef ? (
              <span className="text-green-600 font-semibold">✅ 已打印</span>
            ) : (
              <span className="text-red-500">❌ 未打印</span>
            )}
            {!order.printRef && (
              <button
                className="text-sm text-blue-600 underline mt-1"
                onClick={() => handleManualPrintOrder(order)}
              >
                🖨️ 补打印
              </button>
            )}
          </div>
          <ul className="mt-2">
            <li><strong>饮料：</strong></li>
            {order.items.map((item, i) => {
              const typeLabel = item.type === "HOT" ? "HOT" : item.type === "COLD" ? "COLD" : "";
              console.log("typeLabel: ", typeLabel, " Item Type: ", item.type);
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