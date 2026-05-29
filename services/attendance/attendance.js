window.smartHotelServices = window.smartHotelServices || {};

window.smartHotelServices.attendance = (() => {
  let staff = [
    { name: "Amit Kumar", role: "Reception", present: true, time: "09:12 AM" },
    { name: "Priya Singh", role: "Restaurant captain", present: true, time: "10:02 AM" },
    { name: "Rohit Das", role: "Housekeeping", present: false, time: "-" },
    { name: "Neha Patel", role: "Kitchen", present: true, time: "08:48 AM" },
    { name: "Imran Khan", role: "Security", present: false, time: "-" },
    { name: "Kavya Rao", role: "Billing desk", present: true, time: "09:30 AM" }
  ];

  function render(root) {
    const grid = root.querySelector("#staffGrid");
    grid.innerHTML = "";
    staff.forEach((person, index) => {
      const card = document.createElement("article");
      card.className = "staff-card";
      card.innerHTML = `
        <h3>${person.name}</h3>
        <p>${person.role} | ${person.present ? "Present" : "Not clocked in"} | ${person.time}</p>
        <button class="${person.present ? "secondary-button" : "primary-button"}" type="button" data-staff-index="${index}">
          ${person.present ? "Clock out" : "Clock in"}
        </button>
      `;
      grid.append(card);
    });
  }

  function init(root) {
    root.querySelector("#staffGrid").addEventListener("click", (event) => {
      const button = event.target.closest("[data-staff-index]");
      if (!button) return;
      const person = staff[Number(button.dataset.staffIndex)];
      person.present = !person.present;
      person.time = person.present ? new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-";
      render(root);
    });
    render(root);
  }

  return { init };
})();
