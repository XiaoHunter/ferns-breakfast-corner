// Home.js 或 App.js 首页内容
import React from "react";
import { useNavigate } from "react-router-dom";

function HomePage() {
  const navigate = useNavigate();

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <img src="/logo.png" alt="Ferns Logo" width="300" />
      <h2>🍽️ Welcome to Ferns Breakfast Corner</h2>
      <p>Please proceed to order</p>
      <button
        style={{ padding: "10px 20px", fontSize: "18px" }}
        onClick={() => navigate("/ordermenu")}
      >
        Start Ordering
      </button>
    </div>
  );
}

export default HomePage;
