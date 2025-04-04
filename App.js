
import React from "react";
import OrderMenu from "./pages/OrderMenu";
import KaunterMenu from "./pages/KaunterMenu";
import MerchantMenu from "./pages/MerchantMenu";

function App() {
  const hostname = window?.location?.hostname || "";
  const subdomain = hostname.split(".")[0];

  if (subdomain === "kaunter") return <KaunterMenu />;
  if (subdomain === "merchant") return <MerchantMenu />;
  return <OrderMenu />;
}

export default App;
