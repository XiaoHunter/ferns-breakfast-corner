
const getTotal = () => {
  let packedIncluded = false;
  let sum = 0;
  for (const [key, item] of Object.entries(order)) {
    const drink = drinks.find((d) => d.name === key.split("-")[0]);
    const temp = key.includes("cold") ? drink.cold : drink.hot;
    if (item.packed) packedIncluded = true;
    sum += item.qty * temp;
  }
  if (packedIncluded) sum += 0.2;
  return sum.toFixed(2);
};
// force trigger git change