// Helpers
function normalizarAgvId(id) {
  return String(id).trim().toLowerCase();
}

function toCssPx(val) {
  // Si viene número -> lo tratamos como px
  if (typeof val === "number") return `${val}px`;
  // Si viene string con unidad (%) o (px) o similar -> respetamos
  if (typeof val === "string") {
    const s = val.trim();
    if (s.endsWith("%") || s.endsWith("px")) return s;
    if (!isNaN(Number(s))) return `${s}px`; // "30" -> "30px"
  }
  return val;
}

function aplicarUnidadPosicion(val) {
  // Compatibilidad: si el backend antes devolvía left/top o x/y como porcentaje
  // y ahora da números en px, preferimos px (toCssPx).
  return toCssPx(val);
}

// --- almacenamiento temporal y colocador de AGVs ---
const _ultimoPuntoAgv = [];

/**
 * colocarAgvDesdeBackend(info, container)
 * Interpreta:
 *  - info.x  => px desde la izquierda (number) o "NNpx"/"NN%"
 *  - info.y  => px desde la parte inferior (number) o "NNpx"/"NN%"
 *  - info.angle => grados
 *
 * Si el contenedor aún no tiene altura (clientHeight == 0), usa bottom como fallback.
 */
function colocarAgvDesdeBackend(info, container) {
  const idDom = normalizarAgvId(info.id);
  let el = document.getElementById(idDom);

  if (!el) {
    el = document.createElement("img");
    el.id = idDom;
    el.className = "agv";
    el.src = `/static/images/${idDom}.svg`;
    el.style.position = "absolute";
    el.style.width = "30px";
    el.style.height = "30px";
    // base: centra horizontalmente y sitúa la referencia vertical en la "base"
    el.style.transformOrigin = "50% 50%";
    // No fijamos transform aquí: lo aplicaremos tras calcular rotation
    container.appendChild(el);
  }

  // LEFT: números -> px; strings con unidad respetadas
  if (info.x !== undefined && !Number.isNaN(Number(info.x))) {
    el.style.left = `${Number(info.x)}px`;
  } else if (typeof info.x === "string") {
    el.style.left = info.x.trim();
  }

  // TOP: convertimos y (distance from bottom) a top = containerHeight - y
  const containerH = container.clientHeight || container.offsetHeight || 0;
  if (info.y !== undefined && !Number.isNaN(Number(info.y))) {
    const yNum = Number(info.y);
    if (containerH > 0) {
      el.style.top = `${containerH - yNum}px`;
      el.style.bottom = "";
    } else {
      // Si aún no sabemos la altura del contenedor usamos bottom como fallback
      el.style.bottom = `${yNum}px`;
      el.style.top = "";
    }
  } else if (typeof info.y === "string") {
    // si viene "30px" o "50%" lo respetamos (se interpreta como top)
    el.style.top = info.y.trim();
    el.style.bottom = "";
  }

  // ROTACION (angle en grados, sin offset porque el SVG apunta a la derecha)
  const angleDeg = !Number.isNaN(Number(info.angle)) ? Number(info.angle) : 0;
  // Aplicamos translate para centrar y desplazar verticalmente la referencia de la imagen,
  // y luego rotate para la orientación en grados.
  el.style.transform = `translate(-50%, 50%) rotate(${angleDeg}deg)`;
}

/* --------------------
   DOMContentLoaded
   -------------------- */
document.addEventListener("DOMContentLoaded", function () {
  const botonRuta = document.getElementById("botonRuta");
  const mapaImg = document.getElementById("mapa-img");
  const botonMas = document.getElementById("botonMas");
  const botonMenos = document.getElementById("botonMenos");
  const contador = document.getElementById("contador");
  const agvsContainer = document.getElementById("agvs-container");

  if (!botonRuta || !mapaImg || !botonMas || !botonMenos || !contador || !agvsContainer) {
    console.error("Elemento no encontrado");
    return;
  }

  let mostrandoRuta = false;
  let valorContador = parseInt(contador.textContent.trim()) || 0;

  // Botón de ruta
  botonRuta.addEventListener("click", function () {
    mostrandoRuta = !mostrandoRuta;
    mapaImg.src = mostrandoRuta ? "/static/images/mapa-ruta.png" : "/static/images/mapa.png";
  });

  // Coordenadas deseadas para nuevo AGV (X desde izquierda en px, Y desde abajo en px)
  const NUEVO_AGV_X_PX = 30; // 30 px desde la izquierda
  const NUEVO_AGV_Y_FROM_BOTTOM_PX = 50; // 50 px desde la parte inferior

  // Crear/colocar AGV en coordenadas dadas (xPxFromLeft, yPxFromBottom en números)
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
      // base para centrar horizontalmente; colocamos la referencia vertical en la base
      el.style.transform = "translate(-50%, 50%)";
      el.style.transformOrigin = "50% 50%";
      agvsContainer.appendChild(el);
    }

    // Calculamos top en px a partir de la altura del contenedor y la distancia desde bottom
    const containerH = agvsContainer.clientHeight || agvsContainer.offsetHeight || 0;
    const topPx = containerH ? (containerH - yPxFromBottom) : null;

    el.style.left = `${xPxFromLeft}px`;
    if (topPx !== null && !Number.isNaN(topPx)) {
      el.style.top = `${topPx}px`;
      // eliminar bottom si estaba presente como fallback
      el.style.bottom = "";
    } else {
      // fallback: si no conocemos altura aún, colocamos usando bottom
      el.style.bottom = `${yPxFromBottom}px`;
      el.style.top = "";
    }
  }

  // Botón +
  botonMas.addEventListener("click", function () {
    if (valorContador < 10) {
      valorContador++;
      contador.textContent = valorContador;

      // Crear AGV en X=30px desde izquierda y Y=50px desde bottom
      crearAgvEnCoordenadas(valorContador, NUEVO_AGV_X_PX, NUEVO_AGV_Y_FROM_BOTTOM_PX);
    }
  });

  // Botón −
  botonMenos.addEventListener("click", function () {
    if (valorContador > 0) {
      const ultimoAgv = document.getElementById(`agv-${valorContador}`);
      if (ultimoAgv) {
        agvsContainer.removeChild(ultimoAgv);
      }
      valorContador--;
      contador.textContent = valorContador;
    }
  });

  // Inicializar reposición al cargar mapa (convierte bottom->top cuando sea posible)
  inicializarReposicionMapa();

  // Llamadas iniciales
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
   - interpreta numeric y como distancia desde bottom (coincidente con crearAgvEnCoordenadas)
   - guarda última respuesta para reprocesar tras load/resize
   - respeta el contador: no crea AGVs cuyo índice > contador
   -------------------- */
function actualizarAgvs(url) {
  const container = document.getElementById("agvs-container");
  if (!container) return;
  const maxVisible = parseInt(document.getElementById("contador").textContent) || 0;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      // Guardar datos para reposicionar cuando el mapa tenga altura conocida
      _ultimoPuntoAgv.length = 0;
      Array.prototype.push.apply(_ultimoPuntoAgv, data);

      data.forEach(info => {
        const idDom = normalizarAgvId(info.id);
        const index = Number(idDom.split('-')[1]) || 0;

        // Si el contador es 0 no creamos elementos nuevos; sólo actualizamos los ya existentes
        if (maxVisible <= 0) {
          const existing = document.getElementById(idDom);
          if (existing) colocarAgvDesdeBackend(info, container);
          return;
        }

        // Si el índice del AGV excede el contador, no lo mostramos/creamos
        if (index > maxVisible) {
          // si existe en DOM, ocultarlo
          const existing = document.getElementById(idDom);
          if (existing) existing.style.display = "none";
          return;
        }

        // Mostrar/crear y posicionar
        colocarAgvDesdeBackend(info, container);
        // asegurar visible si se había ocultado
        const el = document.getElementById(idDom);
        if (el) el.style.display = "";
      });
    })
    .catch(err => console.error("Error al actualizar AGVs:", err));
}

/* --------------------
   Semáforos (mantengo la lógica: left/top num => px; string con %/px respetado)
   -------------------- */
function actualizarSemaforos(url) {
  const container = document.getElementById("agvs-container");
  if (!container) return;

  fetch(url)
    .then(response => response.json())
    .then(data => {
      data.forEach(info => {
        let el = document.getElementById(info.id);

        if (!el) {
          el = document.createElement("img");
          el.id = info.id;
          el.className = "semaforo";
          el.style.position = "absolute";
          el.style.width = "20px";
          el.style.height = "20px";
          el.style.transform = "translate(-50%, -50%)";
          el.src = "/static/images/punto-gris.png"; // default
          container.appendChild(el);
        }

        // Posición: número -> px, string con %/px -> respetar
        if (info.left !== undefined && !Number.isNaN(Number(info.left))) el.style.left = `${Number(info.left)}px`;
        else if (typeof info.left === "string") el.style.left = info.left.trim();

        if (info.top !== undefined && !Number.isNaN(Number(info.top))) el.style.top = `${Number(info.top)}px`;
        else if (typeof info.top === "string") el.style.top = info.top.trim();

        // Imagen por estado (1=verde, 0=rojo, otro=gris)
        if (info.color === 1) {
          el.src = "/static/images/punto-verde.png";
        } else if (info.color === 0) {
          el.src = "/static/images/punto-rojo.png";
        } else {
          el.src = "/static/images/punto-gris.png";
        }
      });
    })
    .catch(err => console.error("Error al actualizar semáforos:", err));
}

/* --------------------
   Reposicionar AGVs cuando el mapa cargue o cambie de tamaño
   Convierte elementos colocados por fallback (bottom) a top correcto
   -------------------- */
function inicializarReposicionMapa() {
  const mapaImg = document.getElementById("mapa-img");
  const container = document.getElementById("agvs-container");
  if (!mapaImg || !container) return;

  function reprocesar() {
    if (_ultimoPuntoAgv.length === 0) return;
    _ultimoPuntoAgv.forEach(info => colocarAgvDesdeBackend(info, container));
  }

  if (mapaImg.complete) reprocesar();
  mapaImg.addEventListener("load", reprocesar);
  window.addEventListener("resize", () => setTimeout(reprocesar, 80));
}

/* --------------------
   Resto de funciones (se mantienen sin cambios)
   actualizarComunicaciones, actualizarOrdenes, checkCom, actualizarEntradas,
   actualizarSalidas, actualizarMensaje
   -------------------- */

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
        data.agvs.forEach((agv) => {
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
      if (ordenes.length === 0) {
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
              if (img) {
                img.src = "/static/images/punto-gris.png";
              }
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
