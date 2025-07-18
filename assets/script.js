document.getElementById("calculateBtn").addEventListener("click", function () {
  const area = document.getElementById("area").value;
  const tileSize = document.getElementById("tileSize").value;
  const tilePrice = document.getElementById("tilePrice").value;

  if (!area || !tileSize || !tilePrice) {
    alert("Please fill all fields.");
    return;
  }

  // Adsterra redirect in a new tab
  window.open(
    "https://www.profitableratecpm.com/kt9k1rrxm?key=de2f677dc7757f2334fea3a41a50ba74",
    "_blank"
  );

  // Optional: You can run calculation logic here
});