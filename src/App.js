import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import OrderMenu from "./pages/OrderMenu";
import KaunterMenu from "./pages/KaunterMenu";
import MerchantMenu from "./pages/MerchantMenu";

function App() {
  return (
    <Router>
      <div className="p-4 bg-yellow-100 min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Ferns Breakfast Corner</h1>
        <nav className="mb-4">
          <Link className="mr-4 text-blue-600" to="/">Order Menu</Link>
          <Link className="mr-4 text-green-600" to="/kaunter">Kaunter Menu</Link>
          <Link className="text-red-600" to="/merchant">Merchant Menu</Link>
        </nav>
        <Routes>
          <Route path="/" element={<OrderMenu />} />
          <Route path="/kaunter" element={<KaunterMenu />} />
          <Route path="/merchant" element={<MerchantMenu />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;