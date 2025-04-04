import React, { useState } from "react";

function MerchantMenu() {
  const [access, setAccess] = useState(false);

  React.useEffect(() => {
    const code = prompt("🔒 请输入员工密码进入 Merchant Menu：");
    if (code === "kopitiam123") {
      setAccess(true);
    }
  }, []);

  if (!access) return <p className="text-red-600">❌ Unauthorized</p>;

  return (
    <div>
      <h2 className="text-xl font-semibold">🍳 Merchant Menu</h2>
      <p>厨房页面，用于查看订单并手动点击完成。</p>
    </div>
  );
}

export default MerchantMenu;