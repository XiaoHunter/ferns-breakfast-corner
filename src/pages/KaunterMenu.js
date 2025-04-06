import React, { useEffect, useState } from "react";

const KaunterMenu = () => {
  const [token, setToken] = useState(null);
  const [input, setInput] = useState("");
  const [orders, setOrders] = useState([]);
  const [selectedDate, setSelectedDate] = useState(getMalaysiaToday());

  function getMalaysiaToday() {
    const now = new Date();
    const malaysiaTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    return malaysiaTime.toISOString().split("T")[0];
  }

  useEffect(() => {
    if (!token) return;
    const fetchOrders = () => {
      fetch(`/orders/orders-${selectedDate}.json?t=${Date.now()}`)
        .then((res) => res.json())
        .then((data) => setOrders(data.reverse()));
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
    return orders.reduce((sum, order) => sum + (order.total || 0), 0).toFixed(2);
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
          <div><strong>Table:</strong> {order.table || order.deviceId}</div>
          <div><strong>时间:</strong> {formatMalaysiaTime(order.time)}</div>
          <div><strong>总价:</strong> RM {order.total?.toFixed(2)}</div>
          <ul className="mt-2">
            {order.items.map((item, i) => (
              <li key={i}>{item.name} x {item.qty}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default KaunterMenu;