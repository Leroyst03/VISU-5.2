document.addEventListener("DOMContentLoaded", function () {
  const socket = io();
  const botonesContainer = document.getElementById("botones-acciones");

  // Ahora 8 botones (0–7)
  const NUM_BOTONES = 8;

  for (let i = 0; i < NUM_BOTONES; i++) {
    const btn = document.createElement("button");
    btn.className = "btn btn-primary m-1";
    btn.textContent = `Botón ${i}`;
    btn.dataset.index = i;

    btn.addEventListener("click", () => {
      socket.emit("boton_pulsado", { index: i });
    });

    botonesContainer.appendChild(btn);
  }
});
