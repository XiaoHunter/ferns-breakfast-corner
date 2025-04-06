import React, { useEffect, useState } from "react";

const KaunterMenu = () => {
  const [token, setToken] = useState(null);
  const [input, setInput] = useState("");
  const [orders, setOrders] = useState([]);
  const [editingTable, setEditingTable] = useState(null);
  const [tableInputs, setTableInputs] = useState({});
  
  const getMalaysiaToday = () => {
    const now = new Date();
    const malaysiaTime = new Date(now.getTime() + 8 * 60 * 60 * 1000); // 加 8 小时（毫秒）
    return malaysiaTime.toISOString().split("T")[0];
  };

  useEffect(() => {
    if (!token) return;

    const fetchOrders = () => {
      const today = getMalaysiaToday();
      console.log("📦 Fetching", `orders-${today}.json`);
      fetch(`https://ferns-breakfast-corner.com/orders/orders-${today}.json?t=${Date.now()}`)
        .then((res) => res.json())
        .then((data) => setOrders(data.reverse()));
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [token]);

  const login = () => {
    fetch("https://ferns-breakfast-corner.com/api/kaunter-login.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: input }),
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.status === "success") {
          setToken(res.token);
        } else {
          alert("❌ 密码错误！");
        }
      });
  };

  const formatMalaysiaTime = (isoTime) => {
    const date = new Date(isoTime);
    const local = new Date(date.getTime() + 8 * 60 * 60 * 1000);
    return local.toLocaleString("en-MY", { hour12: false });
  };

  const printReceipt = (order) => {
    const newWindow = window.open("", "_blank", "width=400,height=600");
    if (!newWindow) return;

    const total = order.total?.toFixed(2) || "0.00";
    const time = formatMalaysiaTime(order.time);

    const items = order.items
      .map(
        (item) =>
          `<tr><td colspan="2">${item.name}</td></tr>
           <tr><td>x ${item.qty}</td><td style="text-align:right">RM ${(item.price || 0).toFixed(2)}</td></tr>`
      )
      .join("");

    newWindow.document.write(`
      <html>
      <head>
        <style>
          body { font-family: Arial; font-size: 12px; padding: 10px; }
          img { display: block; margin: 0 auto 10px; width: 80px; }
          h2, p { text-align: center; margin: 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          td { padding: 2px 0; }
          hr { border: none; border-top: 1px dashed #000; margin: 10px 0; }
          .center { text-align: center; margin-top: 10px; }
        </style>
      </head>
      <body>
        <img src="/ferns-logo.png" alt="Fern's Kafe" />
        <h2>KAFE FERN'S</h2>
        <p>桌号: ${order.table || order.deviceId}</p>
        <p>时间: ${time}</p>
        <hr />
        <table>${items}</table>
        <hr />
        <table>
          <tr><td>总计:</td><td style="text-align:right">RM ${total}</td></tr>
        </table>
        <div class="center">谢谢光临，欢迎再次光临！</div>
      </body>
      </html>
    `);
    newWindow.document.close();
    newWindow.print();
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">📜 Kaunter Order List</h2>
      {orders.map((order) => (
        <div key={order.orderId} className="border p-3 mb-4 rounded shadow">
          <div><strong>订单编号:</strong> {order.orderId}</div>
          <div><strong>Table:</strong> {order.table || order.deviceId}</div>
          <div><strong>时间:</strong> {formatMalaysiaTime(order.time)}</div>
          <div><strong>总价:</strong> RM {order.total?.toFixed(2)}</div>
          <div className="mt-2">
            <Button onClick={() => printReceipt(order)}>🖨️ 打印收据</Button>
          </div>
        </div>
      ))}
    </div>
  );

  const updateSingleOrder = (order) => {
    fetch("https://ferns-breakfast-corner.com/api/update-order.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order),
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.status === "success") {
          alert("✅ 更新成功");
        } else {
          alert("❌ 更新失败: " + res.message);
        }
      });
  };

  const markAsPaid = (index, method) => {
    const order = orders[index];
    
    if (method === "cash") {
      const input = prompt(`💵 顾客总共付款多少？（订单金额 RM${order.total.toFixed(2)}）`);
      if (!input) return;

      const paid = parseFloat(input);
      if (isNaN(paid) || paid < order.total) {
        alert("❌ 输入无效或付款金额不足！");
        return;
      }//D

      const change = (paid - order.total).toFixed(2);
      if (!window.confirm(`✅ 顾客付款 RM${paid.toFixed(2)}\n应找零 RM${change}\n\n确认完成付款？`)) return;

      const updatedOrder = {
        ...order,
        status: "completed",
        payment: "cash",
        paidAmount: paid,
        change: Number(change),
      };

      updateSingleOrder(updatedOrder);
      setOrders((prevOrders) => {
        const newOrders = [...prevOrders];
        newOrders[index] = updatedOrder;
        return newOrders;
      });
    } else {
      if (!window.confirm(`确认要进行电子钱包付款？`)) return;

      const updatedOrder = {
        ...order,
        status: "completed",
        payment: "ewallet"
      };

      updateSingleOrder(updatedOrder);
      setOrders((prevOrders) => {
        const newOrders = [...prevOrders];
        newOrders[index] = updatedOrder;
        return newOrders;
      });
    }
  };

  const cancelOrder = (index) => {
    if (window.confirm("是否取消该订单？")) {
      const updatedOrder = { ...orders[index], status: "cancelled" };
      updateSingleOrder(updatedOrder);
    }
  };

  const updateItemQty = (orderIndex, itemIndex, delta) => {
    const updatedOrder = { ...orders[orderIndex] };
    updatedOrder.items = [...updatedOrder.items];
    const item = { ...updatedOrder.items[itemIndex] };
    item.qty = Math.max(0, item.qty + delta);
    updatedOrder.items[itemIndex] = item;

    let newTotal = 0;
    updatedOrder.items.forEach((item) => {
      const base = item.type === "cold" ? (item.coldPrice ?? 0)
                  : item.type === "hot" ? (item.hotPrice ?? 0)
                  : (item.price ?? 0);
      const packedFee = item.packed ? 0.2 : 0;
      const addonTotal = (item.addons || []).reduce((sum, a) => sum + (a.price || 0), 0);
      newTotal += item.qty * (base + packedFee + addonTotal);
    });
    updatedOrder.total = Number(newTotal.toFixed(2));

    updateSingleOrder(updatedOrder);
    setOrders((prevOrders) => {
      const newOrders = [...prevOrders];
      newOrders[orderIndex] = updatedOrder;
      return newOrders;
    });
  };

  const startEditingTable = (orderId, current) => {
    setEditingTable(orderId);
    setTableInputs((prev) => ({ ...prev, [orderId]: current || "" }));
  };

  const confirmTableEdit = (index, orderId) => {
    const order = orders[index];
    const updatedOrder = {
      ...order,
      table: tableInputs[orderId] || order.deviceId
    };
    updateSingleOrder(updatedOrder);
    setEditingTable(null);
  };

  const cancelTableEdit = (orderId) => {
    setEditingTable(null);
    setTableInputs((prev) => ({ ...prev, [orderId]: "" }));
  };

  const goToAddItems = (orderId) => {
    window.location.href = `/order?edit=${orderId}`;
  };

  if (!token) {
    return (
      <div style={{ padding: "20px" }}>
        <h2>🔐 Kaunter 登录</h2>
        <input
          type="password"
          placeholder="输入密码"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{ padding: "8px", marginRight: "10px" }}
        />
        <button onClick={login} style={{ padding: "8px" }}>
          登录
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>🧾 Kaunter Order List</h1>
      {orders.map((order, index) => (
        <div key={order.orderId} style={{ border: "1px solid #ccc", marginBottom: 20, padding: 10 }}>
          <p><strong>订单编号:</strong> {order.orderId}</p>
          <p><strong>Table:</strong> {
            editingTable === order.orderId ? (
              <>
                <input type="text" value={tableInputs[order.orderId] || ""} onChange={(e) => setTableInputs((prev) => ({ ...prev, [order.orderId]: e.target.value }))} className="border px-2 ml-2" />
                <button onClick={() => confirmTableEdit(index, order.orderId)} className="ml-1 text-green-600">✅</button>
                <button onClick={() => cancelTableEdit(order.orderId)} className="ml-1 text-red-600">❌</button>
              </>
            ) : (
              <>
                {order.table || order.deviceId}
                <button onClick={() => startEditingTable(order.orderId, order.table)} className="ml-2 text-blue-600">✏️</button>
              </>
            )
          }</p>
          <p><strong>时间:</strong> {formatMalaysiaTime(order.time)}</p>
          <p><strong>总价:</strong> RM {order.total.toFixed(2)}</p>
          <p><strong>餐点:</strong></p>
          <ul>
            {order.items.map((item, i) => (
              <li key={i}>
                {item.name} x {item.qty} {item.packed ? "（打包）" : ""}
                {order.status !== "completed" && order.status !== "cancelled" && (
                  <>
                    <button onClick={() => updateItemQty(index, i, -1)} className="ml-2 px-2">➖</button>
                    <button onClick={() => updateItemQty(index, i, 1)} className="ml-1 px-2">➕</button>
                  </>
                )}
              </li>
            ))}
          </ul>
          {(order.status !== "completed" && order.status !== "cancelled") && (
            <div className="mt-2">
              <button onClick={() => goToAddItems(order.orderId)} className="text-blue-600 underline">🛒 添加餐点</button>
            </div>
          )}
          {order.status === "completed" ? (
            <>
              <p style={{ color: "green" }}>✅ 已付款（{order.payment}）</p>
              <button onClick={() => printReceipt(order)} className="text-blue-600 underline mt-2">🖨️ 打印收据</button>
            </>
          ) : order.status === "cancelled" ? (
            <p style={{ color: "gray" }}>❌ 已取消</p>
          ) : (
            <div>
              <button onClick={() => markAsPaid(index, "cash")}>💵 现金付款</button>
              <button onClick={() => markAsPaid(index, "ewallet")} style={{ marginLeft: 10 }}>📱 电子钱包付款</button>
              <button onClick={() => cancelOrder(index)} style={{ marginLeft: 10, color: "red" }}>❌ 取消订单</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default KaunterMenu;
