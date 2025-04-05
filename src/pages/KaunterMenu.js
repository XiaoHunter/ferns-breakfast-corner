// ✅ 前端 React (KaunterMenu.js) - 修改登录逻辑 + 修复状态处理 + 确保付款/取消后不重复提交

import React, { useEffect, useState } from "react";

const KaunterMenu = () => {
  const [token, setToken] = useState(null);
  const [input, setInput] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const fetchOrders = () => {
    if (!token) return;
    fetch("https://ferns-breakfast-corner.com/api/orders.json", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setOrders(data.reverse());
        setLoading(false);
      })
      .catch((err) => {
        console.error("加载订单失败", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (token) fetchOrders();
  }, [token]);

  const updateOrder = (index, paymentMethod) => {
    const order = orders[index];
    if (!order || order.status !== "pending") return; // 防止重复操作

    const confirmed = window.confirm(
      paymentMethod === "cancel" ? "确定要取消付款吗？" : "确认已收到付款？"
    );
    if (!confirmed) return;

    fetch("https://ferns-breakfast-corner.com/api/update-order.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: order.orderId,
        items: order.items,
        payment: paymentMethod,
      }),
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.status === "success") {
          fetchOrders();
        } else {
          alert("更新失败: " + res.message);
        }
      })
      .catch(() => alert("❌ 网络错误，请稍后再试！"));
  };

  if (!token) {
    return (
      <div style={{ padding: 20 }}>
        <h2>🔐 输入密码登录</h2>
        <input
          type="password"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button onClick={login}>登录</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>🧾 Kaunter Order List</h1>
      {loading ? (
        <p>⏳ 数据加载中...</p>
      ) : orders.length === 0 ? (
        <p>📂 没有可用的订单</p>
      ) : (
        orders.map((order, index) => (
          <div key={order.orderId} style={{ border: "1px solid #ccc", padding: 10, marginBottom: 20 }}>
            <p><strong>订单编号:</strong> {order.orderId}</p>
            <p><strong>Device:</strong> {order.deviceId || "-"}</p>
            <p><strong>时间:</strong> {order.time}</p>
            <p><strong>总价:</strong> RM {order.total?.toFixed(2) || "0.00"}</p>
            <p><strong>餐点:</strong></p>
            <ul>
              {Array.isArray(order.items) && order.items.map((item, i) => (
                <li key={i}>{item.name} x {item.qty} {item.packed ? "（打包）" : ""}</li>
              ))}
            </ul>
            <p><strong>付款方式:</strong> {order.status === "pending" ? "未选择支付方式" : order.payment === "cash" ? "现金支付" : order.payment === "ewallet" ? "电子钱包" : "-"}</p>
            <p><strong>状态:</strong> {order.status === "completed" ? "✅ 已付款（" + order.payment + "）" : order.status === "cancelled" ? "❌ 已取消" : "⏳ 待付款"}</p>
            {order.status === "pending" && (
              <div>
                <button onClick={() => updateOrder(index, "cash")}>💵 现金付款</button>
                <button onClick={() => updateOrder(index, "ewallet")} style={{ marginLeft: 10 }}>📱 电子钱包付款</button>
                <button onClick={() => updateOrder(index, "cancel")} style={{ marginLeft: 10 }}>❌ 取消付款</button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default KaunterMenu;
