# Visu 5.2 – GUI Launcher

Este proyecto incluye una interfaz gráfica construida con **Electron + Express**.  
Para facilitar el lanzamiento de la aplicación sin necesidad de empaquetar en `.deb` o `.AppImage`, se utiliza un **script `.sh`** y un **archivo `.desktop`** que actúan como acceso directo con icono en Linux.

---

## Requisitos previos
- **Node.js** y **npm** instalados en el sistema.
- Clonar este repositorio en tu carpeta de trabajo:
  ```bash
  git clone https://github.com/<usuario>/<repo>.git
  cd <repo>
  npm install
  
El archivo .env debe tener todas las variables de entorno que el backend necesita las cuales serian:
*   **PORT:** El puerto donde se desplegara la aplicacion.
*   **AGV:**  La cantidad de AGVS.
*   **INPUTS:** Cantidad de leds de entrada.
*   **OUTPUTS:** Cantidad de leds de salida.
## Lanzador con launch-visu.sh
* Crear el archivo `launch-visu.sh` en la carpeta raiz del proyecto
```bash
#!/bin/bash
# Script para lanzar la app Visu

# Carpeta del proyecto
cd /home/$USER/Escritorio/Abisysa/VISU-5.2

# Cargar variables de entorno desde .env
export $(grep -v '^#' .env | xargs)

# Ejecutar la app
npm start
```
*  Dar permisos de ejecucion
  ```bash
  chmod +x /home/$USER/Escritorio/Abisysa/VISU-5.2/launch-visu.sh
  ```
## Acceso directo con .desktop
* Crear el archivo `visu.desktop` en `~/.local/share/applications/:`
 ```bash
  [Desktop Entry]
  Name=Visu 5.2
  Exec=/home/$USER/Escritorio/Abisysa/VISU-5.2/launch-visu.sh
  Icon=/home/$USER/Escritorio/Abisysa/VISU-5.2/assets/icon.png
  Type=Application
  Categories=Utility;
  Terminal=false
```
*  Dar permisos de ejecucion
  ```bash
  chmod +x ~/.local/share/applications/visu.desktop
```
* Actualizar la base de datos de accesos directos
  ```bash
  update-desktop-database ~/.local/share/applications/
  ```
## Resultado
*  La aplicación se puede abrir desde el menú de Ubuntu con su icono.
*  También se puede ejecutar directamente con:
  ```bash
  ./launch-visu.sh
  ```
## Notas
* Ajusta las rutas `(/home/$USER/Escritorio/Abisysa/VISU-5.2)` según la ubicación real del proyecto en tu sistema.
* El icono debe ser un archivo PNG válido (ej. 256x256) en la carpeta `assets/`.
* El .env debe contener todas las variables necesarias para que el backend arranque correctamente.
