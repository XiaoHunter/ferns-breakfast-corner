import React from "react";
import ReactDOM from "react-dom/client";

import OrderMenu from "./pages/OrderMenu";
import KaunterMenu from "./pages/KaunterMenu";
import MerchantMenu from "./pages/MerchantMenu";

const hostname = window.location.hostname;

let App;

if (hostname.startsWith("order.")) {
  App = OrderMenu;
} else if (hostname.startsWith("kaunter.")) {
  App = KaunterMenu;
} else if (hostname.startsWith("merchant.")) {
  App = MerchantMenu;
} else {
  App = () => <div>找不到页面</div>;
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
