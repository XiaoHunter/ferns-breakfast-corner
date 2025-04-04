import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import OrderMenu from "./pages/OrderMenu";
import KaunterMenu from "./pages/KaunterMenu";
import MerchantMenu from "./pages/MerchantMenu";

let App;

const path = window.location.pathname;

if (path.includes("kaunter")) {
  App = KaunterMenu;
} else if (path.includes("merchant")) {
  App = MerchantMenu;
} else {
  App = OrderMenu;
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);