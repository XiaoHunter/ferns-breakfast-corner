
import React, { useEffect, useState } from "react";

const KaunterMenu = () => {
  const [token, setToken] = useState(null);
  const [input, setInput] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState(""); // Record payment method

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
    fetch("https://ferns-breakfast-corner.com/api/orders.json")
      .then((res) => res.json())
      .then((data) => {
        setOrders(data.reverse());
        setLoading(false);  // 数据加载完成，设置loading为false
      })
      .catch((error) => {
        console.error("Failed to load orders:", error);
        setLoading(false);  // 即使出错，也要停止loading
      });
  }, []);

  // 代码修复，确保orders是一个空数组
  const ordersList = orders || [];  

  const handlePayment = (index, method) => {
    const updatedOrders = [...orders];
    updatedOrders[index].status = "completed";
    updatedOrders[index].payment = method;

    fetch("https://ferns-breakfast-corner.com/api/update-order.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedOrders),
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.status === "success") {
          alert("✅ 已完成付款！Receipt 可打印");
          setOrders(updatedOrders);
        } else {
          alert("❌ 失败：" + res.message);
        }
      });
  };

  const handlePaymentWithConfirmation = (index, paymentMethod) => {
      const updatedOrders = [...orders];
      updatedOrders[index].payment = paymentMethod;
      updatedOrders[index].status = 'completed';

      // 调用API更新订单状态
      fetch("https://ferns-breakfast-corner.com/api/update-order.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedOrders[index]),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.status === "success") {
            alert("付款成功！");
            // 刷新订单列表，重新获取数据
            fetch("https://ferns-breakfast-corner.com/api/orders.json")
              .then((res) => res.json())
              .then((data) => setOrders(data.reverse())); // 确保订单列表是最新的
          } else {
            alert("付款失败，请重试");
          }
        });
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
      {orders && orders.length === 0 ? (
        <p>📂 没有可用的订单</p>  // 没有数据时显示的提示
      ) : (
        orders.map((order, index) => (
          <div key={order.orderId} style={{ border: "1px solid #ccc", marginBottom: 20, padding: 10 }}>
            <p><strong>订单编号:</strong> {order.orderId}</p>
            <p><strong>Device:</strong> {order.deviceId}</p>
            <p><strong>时间:</strong> {order.time}</p>
            <p><strong>总价:</strong> RM {order.total ? order.total.toFixed(2) : 'N/A'}</p> {/* 防止 null 或 undefined 错误 */}
            <p><strong>餐点:</strong></p>
            <ul>
              {Array.isArray(order.items) && order.items.length > 0 && order.items.map((item, i) => (
                <li key={i}>
                  {item.name} x {item.qty} {item.packed ? "（打包）" : ""}
                </li>
              ))}
            </ul>
            {order.status === "completed" ? (
              <p style={{ color: "green" }}>✅ 已付款（{order.payment}）</p>
            ) : (
              <div>
                <button onClick={() => handlePaymentWithConfirmation(index, "cash")}>💵 现金付款</button>
                <button onClick={() => handlePaymentWithConfirmation(index, "ewallet")} style={{ marginLeft: 10 }}>
                  📱 电子钱包付款
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default KaunterMenu;
