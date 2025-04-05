// ✅ KaunterMenu.js - 含独立付款/取消函数、状态判断、自动刷新

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

    const today = new Date().toISOString().split("T")[0];
    const url = `https://ferns-breakfast-corner.com/api/orders/orders-${today}.json`;
    
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
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
    if (!token) return;

    fetchOrders();

    // 设置每 5 秒自动刷新
    const interval = setInterval(fetchOrders, 5000);

    // 清除定时器（组件卸载时）
    return () => clearInterval(interval);
  }, [token]);

  const handlePaymentWithConfirmation = (index, method) => {
    const label = method === "cash" ? "💵 现金" : "📱 电子钱包";
    const confirmed = window.confirm(`确认使用 ${label} 付款？`);
    if (!confirmed) return;
    handlePayment(index, method);
  };

  const handleCancelPayment = (index) => {
    const confirmed = window.confirm("❌ 确定要取消付款吗？");
    if (!confirmed) return;
    handlePayment(index, "cancel");
  };

  const handlePayment = (index, method) => {
    const updatedOrder = { ...orders[index], status: method === "cancel" ? "cancelled" : "completed", payment: method };
    fetch("https://ferns-breakfast-corner.com/api/update-order.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedOrder),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          const newOrders = [...orders];
          newOrders[index] = updatedOrder;
          setOrders(newOrders);
        } else {
          alert("❌ 更新失败，请稍后重试。");
        }
      })
      .catch((err) => {
        console.error("Payment update failed:", err);
        alert("❌ 网络错误，请稍后重试！");
      });
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
            <p><strong>付款方式:</strong> {
              order.status === "pending"
                ? "未选择支付方式"
                : order.payment === "cash"
                ? "现金支付"
                : order.payment === "ewallet"
                ? "电子钱包"
                : "-"
            }</p>
            <p><strong>状态:</strong> {
              order.status === "completed"
                ? `✅ 已付款（${order.payment}）`
                : order.status === "cancelled"
                ? "❌ 已取消"
                : "⏳ 待付款"
            }</p>
            {order.status === "pending" && (
              <div>
                <button onClick={() => handlePaymentWithConfirmation(index, "cash")}>💵 现金付款</button>
                <button onClick={() => handlePaymentWithConfirmation(index, "ewallet")} style={{ marginLeft: 10 }}>📱 电子钱包付款</button>
                <button onClick={() => handleCancelPayment(index)} style={{ marginLeft: 10 }}>❌ 取消付款</button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default KaunterMenu;
