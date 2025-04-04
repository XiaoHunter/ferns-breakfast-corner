
import React, { useState } from "react";

const drinks = [
  { name: "Kopi O", cn: "咖啡乌", hot: 1.4, cold: 1.8 },
  { name: "Kopi", cn: "咖啡奶", hot: 1.8, cold: 2.3 },
  { name: "Teh O", cn: "茶乌", hot: 1.4, cold: 1.8 },
  { name: "Teh", cn: "茶", hot: 1.8, cold: 2.3 },
  { name: "Cham O", cn: "参乌", hot: 1.4, cold: 1.8 },
  { name: "Cham C", cn: "参丝", hot: 1.8, cold: 2.3 },
  { name: "Milo O", cn: "美禄乌", hot: 2.6, cold: 2.8 },
  { name: "Milo", cn: "美禄", hot: 2.8, cold: 3.0 },
  { name: "Nescafe O", cn: "雀巢咖啡乌", hot: 2.5, cold: 2.7 },
  { name: "Nescafe", cn: "雀巢咖啡奶", hot: 2.8, cold: 3.0 },
  { name: "Neslo", cn: "雀巢美禄", hot: 3.3, cold: 3.5 },
  { name: "Almond O", cn: "杏仁乌", hot: 2.6, cold: 2.8 },
  { name: "Almond", cn: "杏仁", hot: 2.8, cold: 3.0 },
  { name: "Hor Ka Gai", cn: "虎咬师", hot: 4.6, cold: 4.6 },
  { name: "White Coffee", cn: "白咖啡", hot: NaN, cold: NaN },
  { name: "Pat Poh", cn: "八宝", hot: 2.0, cold: 2.0 },
  { name: "Keat Poh", cn: "桔宝", hot: 3.0, cold: 3.0 },
  { name: "Chrysanthemum", cn: "菊花", hot: 2.0, cold: 2.0 },
  { name: "Barley", cn: "薏米", hot: 2.0, cold: 2.0 },
  { name: "Herbal Tea", cn: "凉茶", hot: 2.0, cold: 2.0 },
  { name: "Chinese Tea", cn: "唐茶", hot: 1.0, cold: 1.0 },
  { name: "Nutmeg (white)", cn: "白蔻", hot: 2.5, cold: 2.5 },
  { name: "Syrup", cn: "红糖", hot: 2.0, cold: 2.0 },
  { name: "Syrup Susu", cn: "红糖牛奶", hot: 2.4, cold: 2.4 },
  { name: "Mineral Water (L)", cn: "矿泉水（大）", hot: 1.3, cold: 1.3 },
  { name: "Orange Juice", cn: "橙汁", hot: 3.0, cold: 3.0 },
  { name: "Apple Juice", cn: "苹果汁", hot: 3.0, cold: 3.0 },
  { name: "Carrot Juice + Milk", cn: "萝卜汁 + 牛奶", hot: 3.5, cold: 3.5 },
  { name: "Lime Juice + Plum", cn: "柠檬酸梅", hot: 3.5, cold: 3.5 },
  { name: "Ampura Juice + Plum", cn: "安不拉加酸梅", hot: 3.5, cold: 3.5 },
  { name: "Can Drink", cn: "罐装饮料", hot: 2.6, cold: 2.8 },
  { name: "Ice Kosong", cn: "白开水", hot: 0.5, cold: 0.5 },
];

const foods = [
  { name: "Toast Bread", cn: "烤面包", price: 1.5 },
  { name: "Half Boiled Egg", cn: "半熟蛋", price: 1.5 },
];

const koayTeow = [
  { size: "Small", price: 6.0 },
  { size: "Big", price: 7.0 },
];

const wantanMee = [
  { size: "Small", price: 6.0 },
  { size: "Medium", price: 7.0 },
  { size: "Big", price: 7.5 },
  { addOn: "1 Fried Wantan", price: 0.6 },
  { addOn: "10 Fried Wantan", price: 6.0 },
];

export default function OrderMenu() {
  const [order, setOrder] = useState({});

  const updateQty = (key, delta, packed = false) => {
    setOrder((prev) => {
      const qty = (prev[key]?.qty || 0) + delta;
      if (qty <= 0) {
        const { [key]: _, ...rest } = prev;
        return rest;
      }
      return {
        ...prev,
        [key]: { ...prev[key], qty, packed },
      };
    });
  };

  const getTotal = () => {
    let packedFee = 0.2;
    let sum = 0;
    for (const [key, item] of Object.entries(order)) {
      sum += item.qty * (item.packed ? packedFee : item.hot || item.cold);
    }
    return sum;
  };

  return (
    <div>
      <h1>Drinks</h1>
      {drinks.map((drink) => (
        <div key={drink.name}>
          <p>{drink.cn}</p>
          <button onClick={() => updateQty(drink.name, 1, false)}>Add</button>
          <button onClick={() => updateQty(drink.name, 1, true)}>Add (Packed)</button>
        </div>
      ))}
      <h1>Foods</h1>
      {foods.map((food) => (
        <div key={food.name}>
          <p>{food.cn}</p>
          <button onClick={() => updateQty(food.name, 1)}>{food.cn} - {food.price}</button>
        </div>
      ))}
      <h1>Koay Teow Soup</h1>
      {koayTeow.map((item) => (
        <div key={item.size}>
          <p>{item.size} - {item.price}</p>
          <button onClick={() => updateQty(item.size, 1)}>{item.size}</button>
        </div>
      ))}
      <h1>Wantan Mee</h1>
      {wantanMee.map((item) => (
        <div key={item.size || item.addOn}>
          <p>{item.size || item.addOn} - {item.price}</p>
          <button onClick={() => updateQty(item.size || item.addOn, 1)}>{item.size || item.addOn}</button>
        </div>
      ))}
      <div>
        <h2>Total: {getTotal()}</h2>
      </div>
    </div>
  );
}
