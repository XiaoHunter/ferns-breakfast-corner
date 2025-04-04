import fs from "fs";
import path from "path";

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ status: "error", message: "Method not allowed" });
  }

  try {
    const orderData = req.body;
    const ordersFile = path.join(process.cwd(), "orders.json");
    const orders = fs.existsSync(ordersFile)
      ? JSON.parse(fs.readFileSync(ordersFile))
      : [];

    const newOrder = {
      ...orderData,
      orderId: Math.floor(Math.random() * 100000),
      time: new Date().toISOString(),
    };

    orders.push(newOrder);
    fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2));

    return res.status(200).json({ status: "success", orderId: newOrder.orderId });
  } catch (err) {
    return res.status(500).json({ status: "error", message: "Server error" });
  }
}
