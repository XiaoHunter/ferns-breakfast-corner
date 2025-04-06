import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function HomePage() {
  const navigate = useNavigate();
  const [selectingTable, setSelectingTable] = useState(true);
  const [selectedTable, setSelectedTable] = useState("");
  const [tableNo, setTableNo] = useState("");

  const confirmTableSelection = () => {
    if (!selectedTable) return alert("⚠️ Please select a table number");
    setTableNo(selectedTable);
    setSelectingTable(false);
    navigate(`/ordermenu?table=${selectedTable}`);
  };

  if (selectingTable) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-yellow-100 relative text-center">
        <img src="/ferns-logo.png" alt="Logo" className="absolute top-10 w-full max-w-md mx-auto" />
        <h1 className="text-2xl font-bold text-yellow-900 z-10 mb-6">☕ Ferns Breakfast Corner</h1>
        <h2 className="text-xl z-10 mb-2">🪑 Please select your table</h2>
        <select
          value={selectedTable}
          onChange={(e) => setSelectedTable(e.target.value)}
          className="p-2 border rounded mb-4 z-10 text-center"
        >
          <option value="">-- Select Table --</option>
          {[...Array(12)].map((_, i) => (
            <option key={i + 1} value={i + 1}>Table {i + 1}</option>
          ))}
        </select>
        <button
          onClick={confirmTableSelection}
          className="bg-green-600 text-white px-4 py-2 rounded z-10"
        >
          Start Ordering
        </button>
      </div>
    );
  }
}

export default HomePage;
