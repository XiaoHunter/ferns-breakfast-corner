import React, { useState } from "react";

function KaunterMenu() {
  const [access, setAccess] = useState(false);

  React.useEffect(() => {
    const code = prompt("🔒 请输入员工密码进入 Kaunter Menu：");
    if (code === "kopitiam123") {
      setAccess(true);
    }
  }, []);

  if (!access) return <p className="text-red-600">❌ Unauthorized</p>;

  return (
    <div>
      <h2 className="text-xl font-semibold">💵 Kaunter Menu</h2>
      <p>可以查看订单，处理付款，打印小票与 E-Invoice。</p>
    </div>
  );
}

export default KaunterMenu;