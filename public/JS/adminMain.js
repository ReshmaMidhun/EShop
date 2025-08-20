function updateNotificationCount() {
    fetch("/countUnreadMessages")
    .then(res => res.json())
    .then(data => {
        // data.count should return the number of unread messages
        document.getElementById("msgCount").innerText = `(${data.count})`;
    });
}