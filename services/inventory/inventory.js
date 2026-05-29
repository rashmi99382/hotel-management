window.smartHotelServices = window.smartHotelServices || {};

window.smartHotelServices.inventory = (() => {
  let inventory = [
    { item: "Basmati rice", qty: 38, cost: 95 },
    { item: "Paneer", qty: 14, cost: 280 },
    { item: "Tomato", qty: 22, cost: 42 },
    { item: "Cooking oil", qty: 9, cost: 135 }
  ];

  function render(root) {
    const table = root.querySelector("#inventoryList");
    const total = inventory.reduce((sum, item) => sum + item.qty * item.cost, 0);
    root.querySelector("#inventoryValue").textContent = `₹${total.toLocaleString("en-IN")} total`;
    table.innerHTML = `
      <div class="data-row header"><span>Item</span><span>Qty</span><span>Unit cost</span><span>Total</span></div>
    `;
    inventory.forEach((item) => {
      const row = document.createElement("div");
      row.className = "data-row";
      row.innerHTML = `
        <span>${item.item}</span>
        <span>${item.qty}</span>
        <span>₹${item.cost}</span>
        <span>₹${(item.qty * item.cost).toLocaleString("en-IN")}</span>
      `;
      table.append(row);
    });
  }

  function init(root) {
    root.querySelector("#inventoryForm").addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      inventory.push({
        item: String(formData.get("item")),
        qty: Number(formData.get("qty")),
        cost: Number(formData.get("cost"))
      });
      event.currentTarget.reset();
      render(root);
    });
    render(root);
  }

  return { init };
})();
