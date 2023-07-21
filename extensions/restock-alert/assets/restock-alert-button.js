document.addEventListener("DOMContentLoaded", function() {
    var modal = document.getElementById("notify-modal");
    var sendNotificationBtn = document.getElementById("send-notification-btn");

    // Open the modal when the "Send Notification" button is clicked
    sendNotificationBtn.onclick = function() {
      modal.style.display = "block";
    };
  });
  