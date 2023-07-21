document.addEventListener("DOMContentLoaded", function () {
  var modal = document.getElementById("notify-modal");
  var close = document.getElementsByClassName("close-aler-popup")[0];
  var sendNotificationBtn = document.getElementById("send-notification-btn");
  var notifyBtn = document.getElementById("send-restock-alert");
  var notificationSuccess = document.getElementById("notification-success");
  var notificationError = document.getElementById("notification-error");
  var body = document.body;

  // Function to show the modal
  function showModal() {
    modal.style.display = "block";
    body.style.overflow = "hidden"; // Prevent scrolling
  }

  // Function to hide the modal
  function hideModal() {
    modal.style.display = "none";
    body.style.overflow = "auto"; // Enable scrolling
  }

  // Function to hide notification messages after a delay
  function hideNotifications() {
    setTimeout(function () {
      notificationSuccess.style.display = "none";
      notificationError.style.display = "none";
      hideModal()
    }, 3000); // 3 seconds delay
  }

  // Open the modal when the "Send Notification" button is clicked
  sendNotificationBtn.onclick = function () {
    showModal();
  };

  // Close the modal when the close button is clicked
  close.onclick = function () {
    hideModal();
  };

  // Close the modal when clicking outside of it
  window.onclick = function (event) {
    if (event.target == modal) {
      hideModal();
    }
  };

  // Submit the form
  notifyBtn.onclick = function (event) {
    event.preventDefault();
    var email = document.getElementById("email-input").value;
    var productId = document.getElementById("product-id").value;
    var shopId = modal.dataset.shopid;

    var selectedVariantIds = [];
    var variantSelect = document.getElementById("variant-select");
    if (variantSelect.value !== "") {
      selectedVariantIds.push(parseInt(variantSelect.value));
    }

    // Check if the "Notify me for any variant restock" checkbox is checked
    var notifyAnyVariantCheckbox = document.querySelector('input[name="notify-any-variant"]');
    if (notifyAnyVariantCheckbox.checked) {
      // Include all out-of-stock variant IDs from the <select> element
      var allOutOfStockOptions = variantSelect.querySelectorAll('option:not([value=""])');
      for (var i = 0; i < allOutOfStockOptions.length; i++) {
        var variantId = parseInt(allOutOfStockOptions[i].value);
        if (!selectedVariantIds.includes(variantId)) {
          selectedVariantIds.push(variantId);
        }
      }
    }

    // Validate email format
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("Please enter a valid email address.");
      return;
    }

    // Prepare the URL with the parameters
    var url =
      "https://settle-nurses-flickr-instruments.trycloudflare.com/api/get-restock-notified";
    url += "?email=" + encodeURIComponent(email);
    url += "&productId=" + encodeURIComponent(productId);
    url += "&variantIds=" + encodeURIComponent(JSON.stringify(selectedVariantIds));
    url += "&shopId=" + encodeURIComponent(shopId);

    // Perform the action to send the notification request
    fetch(url)
      .then(function (response) {
        if (response.ok) {
          // Show success message and hide error message
          notificationSuccess.style.display = "block";
          notificationError.style.display = "none";
          // Reset the form after successful submission
          var form = document.getElementById("notify-form");
          form.reset();
        } else {
          // Show error message and hide success message
          notificationSuccess.style.display = "none";
          notificationError.style.display = "block";
        }
        hideNotifications();
      })
      .catch(function (error) {
        console.log("Error: " + error);
      });

    return false;
  };
});
