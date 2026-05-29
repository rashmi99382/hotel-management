window.smartHotelServices = window.smartHotelServices || {};

window.smartHotelServices.jobs = (() => {
  let jobs = [
    { title: "Front Desk Executive", location: "Bhubaneswar", type: "Full time", applicants: 12 },
    { title: "Restaurant Steward", location: "Cuttack", type: "Full time", applicants: 8 },
    { title: "Digital Marketing Intern", location: "Remote", type: "Internship", applicants: 5 }
  ];

  function render(root) {
    const list = root.querySelector("#jobList");
    list.innerHTML = "";
    jobs.forEach((job) => {
      const row = document.createElement("article");
      row.className = "job-card";
      row.innerHTML = `
        <div>
          <strong>${job.title}</strong>
          <span>${job.location} | ${job.type} | ${job.applicants} applicants</span>
        </div>
        <button class="secondary-button" type="button">View</button>
      `;
      list.append(row);
    });
  }

  function init(root) {
    root.querySelector("#jobForm").addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      jobs.push({
        title: String(formData.get("title")),
        location: String(formData.get("location")),
        type: String(formData.get("type")),
        applicants: 0
      });
      event.currentTarget.reset();
      render(root);
    });
    render(root);
  }

  return { init };
})();
