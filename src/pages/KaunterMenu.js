import React, { useState, useEffect } from "react";

const KaunterMenu = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [token, setToken] = useState(null); // Token for authorization

  // 登录函数：获取 Token
  const login = () => {
    fetch("https://ferns-breakfast-corner.com/api/kaunter-login.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "your_password_here" }), // 输入正确密码
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.status === "success") {
          setToken(res.token); // 获取 Token 并存储
        } else {
          alert("❌ 密码错误！");
        }
      });
  };

  // 获取订单数据
  const fetchOrders = () => {
    if (!token) return; // 如果没有 Token，停止执行

    fetch("https://ferns-breakfast-corner.com/api/orders.json", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`, // 在请求中附带 Token
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setOrders(data.reverse());
        setLoading(false); // 加载完成
      })
      .catch((error) => {
        console.error("Failed to load orders:", error);
        setLoading(false);
      });
  };

  // 每次 Token 更新时获取订单数据
  useEffect(() => {
    fetchOrders();
  }, [token]);

  // 确认付款处理函数
  const handlePaymentWithConfirmation = (index, paymentMethod) => {
    const order = orders[index];

    if (order.status === "completed" || order.status === "cancelled") {
      alert("此订单已处理，无法再次修改");
      return; // 防止已完成或已取消的订单被再次操作
    }

    if (window.confirm("确认付款？")) {
      const updatedOrder = {
        ...order,
        payment: paymentMethod,
        status: "completed",
      };

      // 更新订单状态
      const updatedOrders = [...orders];
      updatedOrders[index] = updatedOrder;
      setOrders(updatedOrders);

      // 发送更新到后端
      fetch("https://ferns-breakfast-corner.com/api/update-order.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`, // 发送 Token 进行验证
        },
        body: JSON.stringify(updatedOrders),
      })
        .then((res) => res.json())
        .then((res) => {
          if (res.status === "success") {
            alert("✅ 已完成付款！");
            fetchOrders(); // 刷新订单数据
          } else {
            alert("❌ 付款失败，请重试！");
          }
        })
        .catch((err) => {
          alert("❌ 网络错误，请稍后再试！");
        });
    }
  };

  // 取消付款处理
  const handleCancelPayment = (index) => {
    if (window.confirm("确定要取消付款吗？")) {
      const updatedOrder = { ...orders[index], status: "cancelled", payment: "" };
      const updatedOrders = [...orders];
      updatedOrders[index] = updatedOrder;
      setOrders(updatedOrders);

      // 重新获取订单数据
      fetchOrders();
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      {!token ? (
        <div>
          <h2>🔒 请登录</h2>
          <input
            type="password"
            onChange={(e) => setToken(e.target.value)} // 输入 Token
            placeholder="请输入密码"
            style={{ marginRight: "10px" }}
          />
          <button onClick={login}>登录</button>
        </div>
      ) : (
        <>
          <h1>🧾 Kaunter Order List</h1>
          {loading ? (
            <p>⏳ 数据加载中...</p>
          ) : orders.length === 0 ? (
            <p>📂 没有可用的订单</p>
          ) : (
            orders.map((order, index) => (
              <div key={order.orderId} style={{ border: "1px solid #ccc", marginBottom: 20, padding: 10 }}>
                <p><strong>订单编号:</strong> {order.orderId}</p>
                <p><strong>Device:</strong> {order.deviceId}</p>
                <p><strong>时间:</strong> {order.time}</p>
                <p><strong>总价:</strong> RM {order.total.toFixed(2)}</p>
                <p><strong>餐点:</strong></p>
                <ul>
                  {Array.isArray(order.items) && order.items.map((item, i) => (
                    <li key={i}>
                      {item.name} x {item.qty} {item.packed ? "（打包）" : ""}
                    </li>
                  ))}
                </ul>
                <p><strong>状态:</strong> 
                  {order.status === "pending" 
                    ? "待付款" 
                    : order.status === "completed" 
                    ? `已付款（${order.payment}）` 
                    : "已取消"}
                </p>

                {/* 控制按钮 */}
                {order.status === "completed" || order.status === "cancelled" ? (
                  <p style={{ color: "green" }}>✅ {order.status === "completed" ? "已付款" : "已取消"}</p>
                ) : (
                  <div>
                    <button onClick={() => handlePaymentWithConfirmation(index, "cash")} disabled={order.status === "cancelled"}>
                      💵 现金付款
                    </button>
                    <button onClick={() => handlePaymentWithConfirmation(index, "ewallet")} style={{ marginLeft: 10 }} disabled={order.status === "cancelled"}>
                      📱 电子钱包付款
                    </button>
                    <button onClick={() => handleCancelPayment(index)} style={{ marginLeft: 10 }}>
                      ❌ 取消付款
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
};

export default KaunterMenu;
