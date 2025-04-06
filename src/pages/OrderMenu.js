import React, { useState, useEffect } from "react";

const OrderMenu = () => {
  const [menu, setMenu] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [tableNo, setTableNo] = useState("");
  const [orderId, setOrderId] = useState(null);
  const [showTableSelect, setShowTableSelect] = useState(false);
  const [selectedTable, setSelectedTable] = useState("");

  useEffect(() => {
    fetch("/menu/orders-items.json")
      .then((res) => res.json())
      .then((data) => setMenu(data.filter((item) => item.category.includes("饮料")))); // ✅ 仅饮料
  }, []);

  const startNewOrder = () => {
    setOrderItems([]);
    setOrderId(null);
    setSelectedTable(""); // 重置
    setShowTableSelect(true);
  };

  const confirmTableSelection = () => {
    if (!selectedTable) {
      alert("⚠️ 请选择一个桌号！");
      return;
    }
    setTableNo(selectedTable);
    setShowTableSelect(false);
  };

  const addToOrder = (item) => {
    setOrderItems((prev) => {
      const existing = prev.find((i) => i.name === item.name);
      if (existing) {
        return prev.map((i) =>
          i.name === item.name ? { ...i, qty: i.qty + 1 } : i
        );
      } else {
        return [...prev, { ...item, qty: 1 }];
      }
    });
  };

  const requestBill = () => {
    if (!orderItems.length || !tableNo) return alert("订单或桌号为空");
    const total = orderItems.reduce((sum, i) => sum + i.price * i.qty, 0);
    const orderData = {
      orderId: null, // 会自动生成
      table: tableNo,
      deviceId: "device-temp", // 备用字段
      items: orderItems,
      total,
      time: new Date().toISOString(),
      status: "completed",
      payment: "cash",
      paidAmount: total,
      change: 0
    };
    fetch("/api/send-order.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData),
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.status === "success") {
          setOrderId(res.orderId);
          printReceipt(res.orderId);
        }
      });
  };

  const printReceipt = (oid) => {
    const time = new Date().toLocaleString("en-MY", { hour12: false });
    const total = orderItems.reduce((sum, i) => sum + i.price * i.qty, 0).toFixed(2);
    const itemsHTML = orderItems.map(
      (item) =>
        `<tr><td colspan='2'>${item.name}</td></tr><tr><td>x ${item.qty}</td><td style='text-align:right'>RM ${(item.price * item.qty).toFixed(2)}</td></tr>`
    ).join("");
    const win = window.open("", "_blank", "width=400,height=600");
    win.document.write(`
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
        <p>桌号: ${tableNo}</p>
        <p>时间: ${time}</p>
        <hr /><table>${itemsHTML}</table><hr />
        <table><tr><td>总计:</td><td style='text-align:right'>RM ${total}</td></tr></table>
        <div class='center'>谢谢光临，欢迎再次光临！</div>
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  return (
    <div className="p-4">
      <button onClick={startNewOrder} className="bg-green-600 text-white px-4 py-2 rounded mb-4">➕ 新订单</button>
      {selectingTable && (
        <div className="mb-4">
          <label htmlFor="table" className="mr-2">🪑 选择桌号：</label>
          <select id="table" onChange={confirmTable} className="border px-2 py-1">
            <option value="">-- 选择桌号 --</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>Table {i + 1}</option>
            ))}
          </select>
        </div>
      )}
      <h2 className="text-lg font-bold mb-2">饮料菜单</h2>
      <div className="grid grid-cols-2 gap-2">
        {menu.map((item, i) => (
          <button key={i} onClick={() => addToOrder(item)} className="border p-2 rounded shadow">
            {item.name} <br />RM {item.price.toFixed(2)}
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
        <button onClick={requestBill} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded">🧾 请求账单</button>
      </div>
      {showTableSelect && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow w-80">
            <h2 className="text-lg font-bold mb-4">🪑 选择桌号</h2>
            <select
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
              className="w-full p-2 border rounded mb-4"
            >
              <option value="">请选择桌号</option>
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1}</option>
              ))}
            </select>
            <div className="flex justify-end space-x-2">
              <button onClick={() => setShowTableSelect(false)} className="px-3 py-1 bg-gray-300 rounded">取消</button>
              <button onClick={confirmTableSelection} className="px-3 py-1 bg-green-500 text-white rounded">确认</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderMenu;
