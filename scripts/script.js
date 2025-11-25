function estaConectado(info) {
  return info.status === 1;
}

// --- almacenamiento temporal y colocador de AGVs ---
const _ultimoPuntoAgv = [];
let mostrandoRuta = false; 
let valorContador = 0;
let NUM_BOTONES = 0;
let NUM_INPUTS = 0; 
let NUM_OUTPUTS = 0; 
let socket;

// Al cargar la página, pedir las variables al backend
fetch("/api/variables")
  .then(res => res.json())
  .then(cfg => {
    NUM_INPUTS = Number(cfg.numInputs);
    NUM_OUTPUTS = Number(cfg.numOutputs);
    NUM_BOTONES = Number(cfg.numBotones);

    console.log("⚙️ Variables cargadas:", NUM_INPUTS, NUM_OUTPUTS, NUM_BOTONES);

    // Generar dinámicamente los LEDs y botones aquí
    const entradasContainer = document.getElementById("entradas-container");
    if (entradasContainer) {
      entradasContainer.innerHTML = "";
      for (let i = 0; i < NUM_INPUTS; i++) {
        const div = document.createElement("div");
        div.className = "led-item";
        div.innerHTML = `<span>IN${i}</span>
          <img class="entrada-bit" data-entrada="${i}" src="/static/images/punto-rojo.png" alt="IN${i}">`;
        entradasContainer.appendChild(div);
      }
    }

    const salidasContainer = document.getElementById("salidas-container");
    if (salidasContainer) {
      salidasContainer.innerHTML = "";
      for (let i = 0; i < NUM_OUTPUTS; i++) {
        const div = document.createElement("div");
        div.className = "led-item";
        div.innerHTML = `<span>OUT${i}</span>
          <img class="salida-bit" data-salida="${i}" src="/static/images/punto-rojo.png" alt="OUT${i}">`;
        salidasContainer.appendChild(div);
      }
    }

    const botonesContainer = document.getElementById("botones-acciones");
    if (botonesContainer) {
      botonesContainer.innerHTML = "";
      for (let i = 0; i < NUM_BOTONES; i++) {
        const btn = document.createElement("button");
        btn.className = "btn btn-primary m-1";
        btn.textContent = `Botón ${i}`;
        btn.dataset.index = i;
        btn.addEventListener("click", () => {
          if (socket) socket.emit("boton_pulsado", { index: i });
        });
        botonesContainer.appendChild(btn);
      }
    }
  })
  .catch(err => console.error("Error al cargar variables:", err));

function colocarAgvDesdeBackend(info, container) {
  if (!estaConectado(info)) {
    const el = document.getElementById(info.id);
    if (el) el.style.display = "none";
    return;
  }

  let el = document.getElementById(info.id);

  if (!el) {
    el = document.createElement("img");
    el.id = info.id;
    el.className = "agv";
    el.src = `/static/images/${info.imagen}`;
    el.style.position = "absolute";
    el.style.width = "30px";
    el.style.height = "30px";
    el.style.transformOrigin = "50% 50%";
    container.appendChild(el);
  }

  if (info.left) el.style.left = info.left;
  if (info.top) el.style.top = info.top;

  // Normalizar ángulo: 0 = derecha, 90 = arriba, 180 = izquierda, 270 = abajo
  const rawAngle = Number(info.angulo) || 0;
  const angleDeg = (360 - rawAngle) % 360;

  el.style.transform = `translate(-50%, 50%) rotate(${angleDeg}deg)`;
  el.style.display = "";
}


/* --------------------
   DOMContentLoaded - ÚNICO y centralizado
   -------------------- */
document.addEventListener("DOMContentLoaded", function () {
  socket = (typeof io === "function") ? io() : null;
  const botonesContainer = document.getElementById("botones-acciones");

  // referencias DOM principales
  const botonRuta = document.getElementById("botonRuta");
  const mapaImg = document.getElementById("mapa-img");
  const botonMas = document.getElementById("botonMas");
  const botonMenos = document.getElementById("botonMenos");
  const contadorInput = document.getElementById("contador-agvs");
  const agvsContainer = document.getElementById("agvs-container");

  if (!mapaImg || !agvsContainer) {
    console.error("mapa-img o agvs-container no encontrados");
    return;
  }

  if (socket) {
    socket.on("botones_out_actualizado", (data) => {
      console.log("Estado botones_out:", data.botones_out);
    });

    socket.on("botones_out_error", (err) => {
      console.error("Error botones:", err.error);
    });
  }


  // contador inicial (si falta el input, trabajamos con 0 localmente)
  valorContador = contadorInput ? (parseInt(contadorInput.value.trim()) || 0) : 0;
  if (contadorInput) contadorInput.value = valorContador;

  if (botonRuta) {
    botonRuta.addEventListener("click", function (ev) {
      ev.stopPropagation();
      mostrandoRuta = !mostrandoRuta;

      const mapaImg = document.getElementById("mapa-img");
      if (mapaImg) {
        mapaImg.src = mostrandoRuta ? "/static/images/mapa-ruta.png" : "/static/images/mapa.png";
      }
      const mc = document.querySelector(".map-container");
      if (mc) mc.classList.toggle("ruta-activa", mostrandoRuta);

      if (mostrandoRuta) {
        const container = document.getElementById("agvs-container");

        _ultimoPuntoAgv.forEach(info => {
          if (estaConectado(info)) {
            // solo mostrar si está conectado
            colocarAgvDesdeBackend(info, container);
            console.log(`🟢 AGV ${info.id} conectado → mostrado en ruta`);
          } else {
            // ocultar si no está conectado
            const el = document.getElementById(info.id);
            if (el) {
              el.style.display = "none";
              console.warn(`🔴 AGV ${info.id} desconectado → ocultado en ruta`);
            }
          }
        });
      }
    });
  }


  // Botón +
  if (botonMas) {
    botonMas.addEventListener("click", function () {
      // Incrementar contador
      valorContador++;
      if (contadorInput) contadorInput.value = valorContador;
      console.log("Contador incrementado:", valorContador);

      // Emitir al backend el nuevo valor
      if (socket) {
        socket.emit("contador_actualizado", { numero_agvs: valorContador });
      }
    });
  }

  // Botón −
  if (botonMenos) {
    botonMenos.addEventListener("click", function () {
      if (valorContador > 0) {
        // Decrementar contador
        valorContador--;
        if (contadorInput) contadorInput.value = valorContador;
        console.log("Contador decrementado:", valorContador);

        // Emitir al backend el nuevo valor
        if (socket) {
          socket.emit("contador_actualizado", { numero_agvs: valorContador });
        }
      } else {
        console.warn("⚠️ El contador ya está en 0, no se puede decrementar más.");
      }
    });
  }

  // Inicializaciones: reposición y primeras llamadas
  inicializarReposicionMapa();
  actualizarOrdenes();
  actualizarAgvs("/api/punto_agv");
  actualizarSemaforos("/api/punto_semaforo");
  actualizarComunicaciones();
  actualizarMensaje();
  checkCom();

  // Intervalos
  setInterval(actualizarOrdenes, 1000);
  setInterval(() => actualizarAgvs("/api/punto_agv"), 1000);
  setInterval(() => actualizarSemaforos("/api/punto_semaforo"), 1000);
  setInterval(actualizarComunicaciones, 1000);
  setInterval(actualizarMensaje, 1000);
  setInterval(checkCom, 1000);
});

/* --------------------
   actualizarAgvs
   -------------------- */
function actualizarAgvs(url) {
  fetch(url)
    .then(res => res.json())
    .then(data => {
      if (!Array.isArray(data)) return;
      maxAgvsBD = data.length;
      _ultimoPuntoAgv.length = 0;
      Array.prototype.push.apply(_ultimoPuntoAgv, data);

      const container = document.getElementById("agvs-container");
      if (!container) return;

      _ultimoPuntoAgv.forEach(info => {
        if (estaConectado(info)) {
          // pintar automáticamente si está conectado
          colocarAgvDesdeBackend(info, container);
          console.log(`🟢 AGV ${info.id} conectado → mostrado automáticamente`);
        } else {
          const el = document.getElementById(info.id);
          if (el) el.style.display = "none";
          console.warn(`🔴 AGV ${info.id} desconectado → ocultado`);
        }
      });
    })
    .catch(err => console.error("Error al actualizar AGVs:", err));
}


// --- Actualizar semáforos ---
function actualizarSemaforos(url) {
  const container = document.getElementById("semaforos-container") || document.getElementById("agvs-container");
  if (!container) return;

  fetch(url)
    .then(response => response.json())
    .then(data => {
      data.forEach(info => {
        let el = document.getElementById(info.id);

        // Crear si no existe
        if (!el) {
          el = document.createElement("img");
          el.id = info.id;
          el.className = "semaforo";
          el.src = "/static/images/punto-gris.png";
          el.style.position = "absolute";
          el.style.width = "12px";
          el.style.height = "12px";
          el.style.transform = "translate(-50%, -50%)";
          container.appendChild(el);
        }

        // Posición
        if (info.left !== undefined && !Number.isNaN(Number(info.left))) {
          el.style.left = `${Number(info.left)}px`;
        } else if (typeof info.left === "string") {
          el.style.left = info.left.trim();
        }

        if (info.top !== undefined && !Number.isNaN(Number(info.top))) {
          el.style.top = `${Number(info.top)}px`;
        } else if (typeof info.top === "string") {
          el.style.top = info.top.trim();
        }

        // Color
        if (info.color === 1) el.src = "/static/images/punto-verde.png";
        else if (info.color === 0) el.src = "/static/images/punto-rojo.png";
        else el.src = "/static/images/punto-gris.png";
      });
    })
    .catch(err => console.error("Error al actualizar semáforos:", err));
}

function inicializarReposicionMapa() {
  const mapaImg = document.getElementById("mapa-img");
  const container = document.getElementById("agvs-container");
  if (!mapaImg || !container) return;

  function reprocesar() {
    if (_ultimoPuntoAgv.length === 0) return;

    _ultimoPuntoAgv.forEach(info => {
      const m = String(info.id).match(/(\d+)/);
      const index = m ? Number(m[1]) : NaN;

      if (index <= valorContador && estaConectado(info)) {
        colocarAgvDesdeBackend(info, container);
      } else {
        const el = document.getElementById(info.id);
        if (el) el.style.display = "none";
      }
    });
  }

  if (mapaImg.complete) reprocesar();
  mapaImg.addEventListener("load", reprocesar);
  window.addEventListener("resize", () => setTimeout(reprocesar, 80));
}

function actualizarComunicaciones() {
  fetch("/api/estado_comunicaciones", { cache: "no-store" })
    .then(res => res.json())
    .then(data => {
      const plc = document.getElementById("plc-status");
      if (plc) {
        if (data.plc === 1) {
          plc.src = "/static/images/punto-verde.png";
        } else if (data.plc === 0) {
          plc.src = "/static/images/punto-rojo.png";
        } else {
          plc.src = "/static/images/punto-gris.png";
        }
      }

      const container = document.getElementById("estado-agvs");
      if (container) {
        container.innerHTML = "";
        (data.agvs || []).forEach((agv) => {
          const etiqueta = document.createElement("span");
          etiqueta.className = "etiqueta";
          etiqueta.textContent = `${agv.id}:`;

          const imagen = document.createElement("img");
          imagen.className = "estado-agv"; // clase separada para AGV

          if (agv.status === 1) {
            imagen.src = "/static/images/punto-verde.png";
          } else if (agv.status === 0) {
            imagen.src = "/static/images/punto-rojo.png";
          } else {
            imagen.src = "/static/images/punto-gris.png";
          }

          container.appendChild(etiqueta);
          container.appendChild(imagen);
        });
      }
    })
    .catch(err => console.error("Error al actualizar comunicaciones:", err));
}

function actualizarOrdenes() {
  fetch("/api/ordenes")
    .then(res => res.json())
    .then(ordenes => {
      const tbody = document.getElementById("ordenes-container");
      if (!tbody) return;

      tbody.innerHTML = "";
      if (!ordenes || ordenes.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3">No hay órdenes registradas.</td></tr>`;
        return;
      }

      ordenes.forEach(o => {
        tbody.innerHTML += `
          <tr>
            <th scope="row">${o.id}</th>
            <td>${o.origen}</td>
            <td>${o.destino}</td>
          </tr>
        `;
      });
    })
    .catch(err => console.error("Error al buscar órdenes:", err));
}

function checkCom() {
  fetch("/api/com")
    .then(res => res.json())
    .then(data => {
      const com = data.COM;

      if (com === 1) {
        // PLC activo → actualizar entradas y salidas normalmente
        actualizarEntradas();
        actualizarSalidas();
      } else {
        // PLC apagado → solo poner entradas y salidas en gris
        document.querySelectorAll(".entrada-bit").forEach(img => {
          img.src = "/static/images/punto-gris.png";
        });

        document.querySelectorAll(".salida-bit").forEach(img => {
          img.src = "/static/images/punto-gris.png";
        });

        // Estado del PLC en rojo
        const plc = document.getElementById("plc-status");
        if (plc) plc.src = "/static/images/punto-rojo.png";
      }
    })
    .catch(err => console.error("Error al verificar COM:", err));
}

function actualizarEntradas() {
  fetch("/api/inputs")
    .then(res => res.json())
    .then(bits => {
      bits.forEach((bit, index) => {
        const img = document.querySelector(`.entrada-bit[data-entrada="${index}"]`);
        if (img) {
          img.src = bit === 1
            ? "/static/images/punto-verde.png"
            : "/static/images/punto-rojo.png";
        }
      });
    })
    .catch(err => console.error("Error al actualizar entradas:", err));
}

function actualizarSalidas() {
  fetch("/api/outputs")
    .then(res => res.json())
    .then(bits => {
      bits.forEach((bit, index) => {
        const img = document.querySelector(`.salida-bit[data-salida="${index}"]`);
        if (img) {
          img.src = bit === 1
            ? "/static/images/punto-verde.png"
            : "/static/images/punto-rojo.png";
        }
      });
    })
    .catch(err => console.error("Error al actualizar salidas:", err));
}

function actualizarMensaje() {
  fetch("/api/mensaje", { cache: "no-store" })
    .then(res => res.json())
    .then(data => {
      const mensajeElemento = document.getElementById("mensaje-dinamico");
      if (mensajeElemento && data.mensaje !== undefined) {
        mensajeElemento.textContent = data.mensaje;
      }
    })
    .catch(err => console.error("Error al actualizar mensaje:", err));
}
