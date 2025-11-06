// script.js - versión corregida

// Helpers
function normalizarAgvId(id) {
  return String(id).trim().toLowerCase();
}

function toCssPx(val) {
  if (typeof val === "number") return `${val}px`;
  if (typeof val === "string") {
    const s = val.trim();
    if (s.endsWith("%") || s.endsWith("px")) return s;
    if (!isNaN(Number(s))) return `${s}px`;
  }
  return val;
}

function aplicarUnidadPosicion(val) {
  return toCssPx(val);
}

// --- almacenamiento temporal y colocador de AGVs ---
const _ultimoPuntoAgv = [];
let mostrandoRuta = false; // estado global

function colocarAgvDesdeBackend(info, container) {
  const contadorInput = document.getElementById("contador-agvs");
  const maxVisible = parseInt((contadorInput?.value || "0"), 10) || 0;

  const idDom = normalizarAgvId(info.id);
  // extrae número si está presente
  const m = idDom.match(/(\d+)/);
  const index = m ? Number(m[1]) : NaN;

  let el = document.getElementById(idDom);

  // Si no existe y el contador no permite crear, no crear
  if (!el && maxVisible <= 0) {
    return; // solo actualizamos elementos existentes cuando contador = 0
  }

  // Si no existe y hay contador > 0, validar índice antes de crear
  if (!el) {
    if (!Number.isNaN(index) && index > maxVisible) return; // no crear si excede
    // crear
    el = document.createElement("img");
    el.id = idDom;
    el.className = "agv";
    el.src = `/static/images/${idDom}.svg`;
    el.style.position = "absolute";
    el.style.width = "30px";
    el.style.height = "30px";
    el.style.transformOrigin = "50% 50%";
    container.appendChild(el);
  }

  // Aplicar posiciones y rotación (robusto)
  if (info.x !== undefined && !Number.isNaN(Number(info.x))) {
    el.style.left = `${Number(info.x)}px`;
  } else if (typeof info.x === "string" && info.x.trim() !== "") {
    el.style.left = info.x.trim();
  }

  const containerH = container.clientHeight || container.offsetHeight || 0;
  if (info.y !== undefined && !Number.isNaN(Number(info.y))) {
    const yNum = Number(info.y);
    if (containerH > 0) {
      el.style.top = `${containerH - yNum}px`;
      el.style.bottom = "";
    } else {
      el.style.bottom = `${yNum}px`;
      el.style.top = "";
    }
  } else if (typeof info.y === "string" && info.y.trim() !== "") {
    el.style.top = info.y.trim();
    el.style.bottom = "";
  }

  const angleDeg = !Number.isNaN(Number(info.angle)) ? Number(info.angle) : 0;
  el.style.transform = `translate(-50%, 50%) rotate(${angleDeg}deg)`;
  el.style.display = "";
}


/* --------------------
   DOMContentLoaded - ÚNICO y centralizado
   -------------------- */
document.addEventListener("DOMContentLoaded", function () {
  const socket = (typeof io === "function") ? io() : null;
  const botonesContainer = document.getElementById("botones-acciones");

  // crear botones dinámicos si existe el contenedor
  if (botonesContainer) {
    const NUM_BOTONES = 8;
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

  if (socket) {
    socket.on("update_led_color_outputs", (colores) => {
      colores.forEach((color, i) => {
        const led = document.querySelector(`.salida-bit[data-salida="${i}"]`);
        if (led) led.src = `/static/images/punto-${color}.png`;
      });
    });
  }

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

  // contador inicial (si falta el input, trabajamos con 0 localmente)
  let valorContador = contadorInput ? (parseInt(contadorInput.value.trim()) || 0) : 0;
  if (contadorInput) contadorInput.value = valorContador;

 // Handler del botón Ruta -> alterna imagen y clase visual
  if (botonRuta) {
    botonRuta.addEventListener("click", function (ev) {
      ev.stopPropagation();
      mostrandoRuta = !mostrandoRuta;
      // usar siempre el mismo nodo mapaImg
      const mapaImg = document.getElementById("mapa-img");
      if (mapaImg) {
        mapaImg.src = mostrandoRuta ? "/static/images/mapa-ruta.png" : "/static/images/mapa.png";
      }
      const mc = document.querySelector(".map-container");
      if (mc) mc.classList.toggle("ruta-activa", mostrandoRuta);
    });
  }


  // creación manual de AGV (cuando se pulse +)
  const NUEVO_AGV_X_PX = 20;
  const NUEVO_AGV_Y_FROM_BOTTOM_PX = 115;

  function crearAgvEnCoordenadas(index, xPxFromLeft, yPxFromBottom) {
    const idDom = `agv-${index}`;
    let el = document.getElementById(idDom);

    if (!el) {
      el = document.createElement("img");
      el.id = idDom;
      el.className = "agv";
      el.src = `/static/images/${idDom}.svg`;
      el.style.position = "absolute";
      el.style.width = "30px";
      el.style.height = "30px";
      el.style.transform = "translate(-50%, 50%)";
      el.style.transformOrigin = "50% 50%";
      agvsContainer.appendChild(el);
    }

    const containerH = agvsContainer.clientHeight || agvsContainer.offsetHeight || 0;
    const topPx = containerH ? (containerH - yPxFromBottom) : null;

    el.style.left = `${xPxFromLeft}px`;
    if (topPx !== null && !Number.isNaN(topPx)) {
      el.style.top = `${topPx}px`;
      el.style.bottom = "";
    } else {
      el.style.bottom = `${yPxFromBottom}px`;
      el.style.top = "";
    }
    // actualizar el contador input si existe 
    if (contadorInput && `${contadorInput.value}` !== `${valorContador}`) contadorInput.value = valorContador;
  }

  // Botón +
  if (botonMas) {
    botonMas.addEventListener("click", function () {
      if (valorContador < 10) { 
        valorContador ++;
        if (contadorInput) contadorInput.value = valorContador;
        // crear AGV inmediatamente
        crearAgvEnCoordenadas(valorContador, NUEVO_AGV_X_PX, NUEVO_AGV_Y_FROM_BOTTOM_PX);
      }
    });
  }

  // Botón −
  if (botonMenos) {
    botonMenos.addEventListener("click", function () {
      if (valorContador > 0) {
        const ultimoAgv = document.getElementById(`agv-${valorContador}`);
        if (ultimoAgv && agvsContainer.contains(ultimoAgv)) {
          agvsContainer.removeChild(ultimoAgv);
        }
        valorContador--;
        if (contadorInput) contadorInput.value = valorContador;
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
  setInterval(actualizarOrdenes, 5000);
  setInterval(() => actualizarAgvs("/api/punto_agv"), 5000);
  setInterval(() => actualizarSemaforos("/api/punto_semaforo"), 5000);
  setInterval(actualizarComunicaciones, 3000);
  setInterval(actualizarMensaje, 3000);
  setInterval(checkCom, 2000);
});

/* --------------------
   actualizarAgvs
   -------------------- */
function actualizarAgvs(url) {
  const container = document.getElementById("agvs-container");
  if (!container) return;

  const contadorInput = document.getElementById("contador-agvs");
  const maxVisible = parseInt((contadorInput?.value || "0"), 10) || 0;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      if (!Array.isArray(data)) return;
      _ultimoPuntoAgv.length = 0;
      Array.prototype.push.apply(_ultimoPuntoAgv, data);

      data.forEach(info => {
        const idDomRaw = String(info.id || "");
        const idDom = normalizarAgvId(idDomRaw);
        const m = idDom.match(/(\d+)/);
        const index = m ? Number(m[1]) : NaN;

        const existing = document.getElementById(idDom);

        // Si contador = 0, solo actualizar existentes (no creamos nuevos)
        if (maxVisible <= 0) {
          if (existing) {
            colocarAgvDesdeBackend(info, container);
            existing.style.display = "";
          }
          return;
        }

        // Si hay contador >0, impide crear si el índice excede maxVisible
        if (!Number.isNaN(index) && index > maxVisible) {
          if (existing) existing.style.display = "none";
          return;
        }

        // crear/reposicionar y asegurar visibilidad
        colocarAgvDesdeBackend(info, container);
        const el = document.getElementById(idDom);
        if (el) el.style.display = "";
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
    const contadorInput = document.getElementById("contador-agvs");
    const maxVisible = parseInt((contadorInput?.value || "0"), 10) || 0;
    _ultimoPuntoAgv.forEach(info => {
      colocarAgvDesdeBackend(info, container);
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
        plc.src = data.plc === 1
          ? "/static/images/punto-verde.png"
          : "/static/images/punto-rojo.png";
      }

      const container = document.getElementById("estado-agvs");
      if (container) {
        container.innerHTML = "";
        (data.agvs || []).forEach((agv) => {
          const etiqueta = document.createElement("span");
          etiqueta.className = "etiqueta";
          etiqueta.textContent = `${agv.id}:`;

          const imagen = document.createElement("img");
          imagen.className = "entrada-bit";
          imagen.src = agv.status === 1
            ? "/static/images/punto-verde.png"
            : "/static/images/punto-rojo.png";

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
        actualizarEntradas();
        actualizarSalidas();
      } else {
        fetch("/api/inputs")
          .then(res => res.json())
          .then(bits => {
            bits.forEach((bit, index) => {
              const img = document.querySelector(`.entrada-bit[data-entrada="${index}"]`);
              if (img) img.src = "/static/images/punto-gris.png";
            });
          })
          .catch(err => console.error("Error al forzar las entradas:", err));

        document.querySelectorAll(".salida-bit").forEach(img => {
          img.src = "/static/images/punto-gris.png";
        });

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
  fetch("/api/botones")
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
