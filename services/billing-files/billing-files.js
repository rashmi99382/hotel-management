window.smartHotelServices = window.smartHotelServices || {};

window.smartHotelServices.billing = (() => {
  let billItems = [
    { name: "Room 204 dinner", amount: 1260 },
    { name: "Laundry service", amount: 340 },
    { name: "Conference tea", amount: 720 }
  ];

  function render(root) {
    const table = root.querySelector("#billItems");
    const total = billItems.reduce((sum, item) => sum + item.amount, 0);
    root.querySelector("#billTotal").textContent = `₹${total.toLocaleString("en-IN")}`;
    table.innerHTML = `
      <div class="data-row header"><span>Item</span><span>Qty</span><span>Rate</span><span>Total</span></div>
    `;
    billItems.forEach((item) => {
      const row = document.createElement("div");
      row.className = "data-row";
      row.innerHTML = `
        <span>${item.name}</span>
        <span>1</span>
        <span>₹${item.amount}</span>
        <span>₹${item.amount}</span>
      `;
      table.append(row);
    });
  }

  function init(root) {
    root.querySelector("#billForm").addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      billItems.push({
        name: String(formData.get("name")),
        amount: Number(formData.get("amount"))
      });
      event.currentTarget.reset();
      render(root);
    });

    root.querySelector("#fileInput").addEventListener("change", (event) => {
      const list = root.querySelector("#fileList");
      list.innerHTML = "";
      Array.from(event.target.files).forEach((file) => {
        const row = document.createElement("article");
        row.className = "list-row";
        row.innerHTML = `<strong>${file.name}</strong><span>Ready to share through QR transfer</span>`;
        list.append(row);
      });
    });

    render(root);
  }

  return { init };
})();
