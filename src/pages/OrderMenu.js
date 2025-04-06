import React, { useEffect, useState, useRef, useMemo } from "react";

export default function OrderMenu() {
  const [menu, setMenu] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [tableNo, setTableNo] = useState("");
  const [selectingTable, setSelectingTable] = useState(true);
  const [selectedTable, setSelectedTable] = useState("");
  const [loading, setLoading] = useState(true);

  const deviceId = useMemo(() => {
    const stored = localStorage.getItem("deviceId");
    if (stored) return stored;
    const newId = "device-" + Math.random().toString(36).substring(2, 8);
    localStorage.setItem("deviceId", newId);
    return newId;
  }, []);

  useEffect(() => {
    fetch("https://ferns-breakfast-corner.com/menu/orders-items.json")
      .then((res) => res.json())
      .then((data) => {
        const drinksOnly = data.filter((item) => item.category.includes("饮料"));
        setMenu(drinksOnly);
        setLoading(false);
      });
  }, []);

  const confirmTableSelection = () => {
    if (!selectedTable) return alert("⚠️ 请选择桌号");
    setTableNo(selectedTable);
    setSelectingTable(false);
  };

  const addToOrder = (item) => {
    setOrderItems((prev) => {
      const found = prev.find((i) => i.name === item.name);
      if (found) {
        return prev.map((i) =>
          i.name === item.name ? { ...i, qty: i.qty + 1 } : i
        );
      } else {
        return [...prev, { ...item, qty: 1 }];
      }
    });
  };

  const getTotal = () => {
    return orderItems.reduce((sum, i) => sum + i.qty * i.price, 0).toFixed(2);
  };

  const handleRequestBill = () => {
    if (!orderItems.length || !tableNo) return alert("订单或桌号为空！");
    const total = parseFloat(getTotal());
    const orderData = {
      orderId: null,
      table: tableNo,
      deviceId,
      items: orderItems,
      total,
      time: new Date().toISOString(),
      status: "completed",
      payment: "cash",
      paidAmount: total,
      change: 0,
    };

    fetch("https://ferns-breakfast-corner.com/api/send-order.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData),
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.status === "success") {
          printReceipt(orderData);
        }
      });
  };

  const printReceipt = (order) => {
    const newWindow = window.open("", "_blank", "width=400,height=600");
    const total = order.total.toFixed(2);
    const time = new Date(order.time).toLocaleString("en-MY", { hour12: false });
    const itemsHTML = order.items
      .map(
        (item) =>
          `<tr><td colspan='2'>${item.name}</td></tr><tr><td>x ${item.qty}</td><td style='text-align:right'>RM ${(item.price * item.qty).toFixed(2)}</td></tr>`
      )
      .join("");

    newWindow.document.write(`
      <html><head><style>
        body { font-family: Arial; font-size: 12px; padding: 5px; }
        img { display: block; margin: 0 auto 5px; width: 100%; max-width: 100%; }
        h2, p { text-align: center; margin: 0; font-size: 13px; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        td { padding: 2px 0; font-size: 12px; }
        hr { border: none; border-top: 1px dashed #000; margin: 8px 0; }
        .center { text-align: center; margin-top: 8px; font-size: 12px; }
      </style></head><body>
        <img src="/ferns-logo.png" />
        <h2>Ferns Breakfast Corner</h2>
        <p>桌号: ${order.table}</p>
        <p>时间: ${time}</p>
        <hr /><table>${itemsHTML}</table><hr />
        <table><tr><td>总计:</td><td style='text-align:right'>RM ${total}</td></tr></table>
        <div class='center'>谢谢光临，欢迎再次光临！</div>
      </body></html>
    `);
    newWindow.document.close();
    newWindow.print();
  };

  if (loading) return <div className="p-4">🕒 正在加载菜单...</div>;

  if (selectingTable) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-yellow-100 relative text-center">
        <img src="/ferns-logo.png" alt="Logo"  className="absolute top-10 w-full max-w-md mx-auto" />
        <h1 className="text-2xl font-bold text-yellow-900 z-10 mb-6">☕ Ferns Breakfast Corner</h1>
        <h2 className="text-xl z-10 mb-2">🪑 请选择桌号</h2>
        <select
          value={selectedTable}
          onChange={(e) => setSelectedTable(e.target.value)}
          className="p-2 border rounded mb-4 z-10"
        >
          <option value="">-- 选择桌号 --</option>
          {[...Array(12)].map((_, i) => (
            <option key={i + 1} value={i + 1}>桌号 {i + 1}</option>
          ))}
        </select>
        <button
          onClick={confirmTableSelection}
          className="bg-green-600 text-white px-4 py-2 rounded z-10"
        >
          开始点餐
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">🧃 饮料菜单（桌号: {tableNo}）</h2>
      <div className="grid grid-cols-2 gap-2">
        {menu.map((item, index) => (
          <button key={index} onClick={() => addToOrder(item)} className="border p-2 rounded shadow">
            {item.name} <br /> RM {(order.total ?? 0).toFixed(2)}
          </button>
        ))}
      </div>

      <div className="mt-6">
        <h3 className="font-bold mb-2">🛒 当前订单</h3>
        <ul>
          {orderItems.map((item, i) => (
            <li key={i}>{item.name} x {item.qty}</li>
          ))}
        </ul>
        <div className="mt-2 font-bold">总计：RM {getTotal()}</div>
        <button onClick={handleRequestBill} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded">🧾 请求账单</button>
      </div>
    </div>
  );
}
