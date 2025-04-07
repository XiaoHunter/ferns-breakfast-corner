import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./Home";
import OrderMenu from "./pages/OrderMenu";
import KaunterMenu from "./pages/KaunterMenu";
import MerchantMenu from "./pages/MerchantMenu";
import ViewKaunterMenu from "./pages/ViewKaunterMenu";

function App() {
  return (
    <Router>
      <div className="p-4 bg-yellow-100 min-h-screen">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/ordermenu" element={<OrderMenu />} />
          <Route path="/kaunter" element={<KaunterMenu />} />
          <Route path="/merchant" element={<MerchantMenu />} />
          <Route path="/viewkaunter" element={<ViewKaunterMenu />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;