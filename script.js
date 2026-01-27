document.getElementById("year").textContent = new Date().getFullYear();

document.getElementById("run-ai").onclick = async () => {
  const out = document.getElementById("output");
  out.textContent = "Running… (backend not connected yet)";

  // Later you’ll replace this with your Render backend URL, e.g.:
  // const res = await fetch("https://your-backend.onrender.com/run");
  // const data = await res.json();
  // out.textContent = JSON.stringify(data, null, 2);

  setTimeout(() => {
    out.textContent = "✅ UI working. Next: connect backend endpoint.";
  }, 600);
};
