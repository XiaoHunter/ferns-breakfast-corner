import React, { useEffect, useState } from "react";

const KaunterMenu = () => {
  const [token, setToken] = useState(null);
  const [input, setInput] = useState("");
  const [orders, setOrders] = useState([]);

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

  useEffect(() => {
    if (!token) return;
    fetch("https://ferns-breakfast-corner.com/orders/orders-" + new Date().toISOString().split("T")[0] + ".json")
      .then((res) => res.json())
      .then((data) => setOrders(data.reverse()));
  }, [token]);

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
          const today = new Date().toISOString().split("T")[0];
          fetch(`https://ferns-breakfast-corner.com/orders/orders-${today}.json`)
            .then((res) => res.json())
            .then((data) => setOrders(data.reverse()));
        } else {
          alert("❌ 更新失败: " + res.message);
        }
      });
  };

  const markAsPaid = (index, method) => {
    const updatedOrder = { ...orders[index], status: "completed", payment: method };
    updateSingleOrder(updatedOrder);
  };

  const cancelOrder = (index) => {
    if (window.confirm("是否取消该订单？")) {
      const updatedOrder = { ...orders[index], status: "cancelled" };
      updateSingleOrder(updatedOrder);
    }
  };

  const removeItem = (orderIndex, itemIndex) => {
    const updatedOrder = { ...orders[orderIndex] };
    updatedOrder.items.splice(itemIndex, 1);
    updateSingleOrder(updatedOrder);
  };

  const updateTable = (index, newTable) => {
    const updatedOrder = { ...orders[index], table: newTable };
    updateSingleOrder(updatedOrder);
  };
  
  if (!token) {
    return (
      <div className="p-4">
        <h2 className="text-xl mb-2">🔒 请输入 Kaunter 密码</h2>
        <input
          type="password"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="border p-2"
        />
        <button onClick={login} className="ml-2 bg-blue-500 text-white px-4 py-2 rounded">
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
          <p>
            <strong>订单编号:</strong> {order.orderId}
          </p>
          <p>
            <strong>Table:</strong> {order.table || order.deviceId}{" "}
            <input
              type="text"
              placeholder="修改桌号"
              onBlur={(e) => updateTable(index, e.target.value)}
              className="border px-2 ml-2"
            />
          </p>
          <p>
            <strong>时间:</strong> {order.time}
          </p>
          <p>
            <strong>总价:</strong> RM {order.total.toFixed(2)}
          </p>
          <p>
            <strong>餐点:</strong>
          </p>
          <ul>
            {order.items.map((item, i) => (
              <li key={i}>
                {item.name} x {item.qty} {item.packed ? "（打包）" : ""}{" "}
                {order.status !== "completed" && (
                  <button
                    onClick={() => removeItem(index, i)}
                    className="text-red-500 ml-2 text-sm"
                  >
                    删除
                  </button>
                )}
              </li>
            ))}
          </ul>
          {order.status === "completed" ? (
            <p style={{ color: "green" }}>✅ 已付款（{order.payment}）</p>
          ) : order.status === "cancelled" ? (
            <p style={{ color: "gray" }}>❌ 已取消</p>
          ) : (
            <div>
              <button onClick={() => markAsPaid(index, "cash")}>💵 现金付款</button>
              <button onClick={() => markAsPaid(index, "ewallet")} style={{ marginLeft: 10 }}>
                📱 电子钱包付款
              </button>
              <button
                onClick={() => cancelOrder(index)}
                style={{ marginLeft: 10, color: "red" }}
              >
                ❌ 取消订单
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default KaunterMenu;
