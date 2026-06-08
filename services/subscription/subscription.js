window.smartHotelServices = window.smartHotelServices || {};

window.smartHotelServices.subscription = {
  init(root) {
    const api = window.SmartHotelSubscription;
    const payButton = root.querySelector("#subscriptionPayButton");
    const status = root.querySelector("#subscriptionStatus");
    if (!payButton || !status) return;

    function render() {
      const active = Boolean(api?.isActive?.());
      const info = api?.getStatus?.() || {};

      if (active) {
        payButton.textContent = "Subscription active";
        payButton.disabled = true;
        status.textContent = `Active for ${info.email || "this admin"}${info.paymentId ? ` | Payment: ${info.paymentId}` : ""}`;
        status.classList.add("is-active");
        return;
      }

      payButton.textContent = `Pay ${api?.priceDisplay || "₹9"} with Razorpay`;
      payButton.disabled = false;
      status.textContent = `Not active. Live plan target ${api?.realPriceDisplay || "₹299/month"}, test checkout ${api?.priceDisplay || "₹9"}.`;
      status.classList.remove("is-active");
    }

    payButton?.addEventListener("click", () => api?.openPayment?.());
    window.addEventListener("smartHotelSubscriptionUpdated", render);
    render();
  }
};
