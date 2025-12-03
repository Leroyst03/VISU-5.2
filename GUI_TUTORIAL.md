# Visu 5.2 – GUI Launcher

Este proyecto incluye una interfaz gráfica construida con **Electron + Express**.  
Para facilitar el lanzamiento de la aplicación sin necesidad de empaquetar en `.deb` o `.AppImage`, se utiliza un **script `.sh`** y un **archivo `.desktop`** que actúan como acceso directo con icono en Linux.

---
- **Node.js** y **npm** instalados en el sistema.
- Clonar este repositorio en tu carpeta de trabajo:
  ```bash
  git clone https://github.com/Leroyst03/VISU-5.2.git
  cd VISU-5.2
  sudo apt update
  sudo apt install npm 
  cd /home/$USER/Documents/VISU-5.2
  gedit .env
  ```
El archivo .env debe tener todas las variables de entorno que el backend necesita las cuales serian:
*   **PORT:** El puerto donde se desplegara la aplicacion.
*   **AGVS:**  La cantidad de AGVS.
*   **INPUTS:** Cantidad de leds de entrada.
*   **OUTPUTS:** Cantidad de leds de salida.
*   **NUM_BOTONES:** Cantidad de botones de la GUI
*   **OFF_SET_X:** Nivel de separacion del eje X de la imagen original con respecto al deseado
*   **OFF_SET_Y:** Nivel de separacion del eje Y de la imagen original con respecto al deseado
*   **ESCALA:** Escala a implementar

**Ejemplo:**
  ```bash
PORT=3000
AGVS=10
INPUTS=8
OUTPUTS=8
NUM_BOTONES=8
OFF_SET_X=0.9
OFF_SET_Y=4
ESCALA=0.05

  ```
  
## Lanzador con launch-visu.sh
* Modificar el archivo `launch-visu.sh` en la carpeta raiz del proyecto
*  Dar permisos de ejecucion
```bash
chmod +x /home/$USER/Documents/VISU-5.2/launch-visu.sh
```
## Acceso directo con .desktop
* Crear el archivo `visu.desktop` y hacerlo ejecutable, OJO cambia 'user' por tu usuario real, .desktop NO puede usar $USER. Debe tener rutas reales:
```bash
gedit ~/.local/share/applications/visu.desktop
[Desktop Entry]
Name=Visu
Exec=/home/user/Documents/VISU-5.2/launch-visu.sh
Icon=/home/user/Documents/VISU-5.2/assets/icon.png
Type=Application
Terminal=true
Categories=Utility;

chmod +x ~/.local/share/applications/visu.desktop
cd  ~/.local/share/applications
cp visu.desktop /home/user/Desktop/
```
* Click derecho en icono de escritorio -> Allow launching

## Resultado
*  La aplicación se puede abrir desde el escritorio de Ubuntu con su icono.
*  También se puede ejecutar directamente con:
  ```bash
  ./launch-visu.sh
  ```
## Notas
* Ajusta las rutas como `(/home/$USER/Documents/VISU-5.2)` según la ubicación real del proyecto en tu sistema. Para saberlo abre una terminal en la ubicación del proyecto y ejecuta este comando:
  ```bash
    pwd
  ```
  Deberías ver una ruta como **/home/usuario/Abisysa/VISU-5.2**, en el archivo **./launch-visu.sh** seguramente deberás ajustar la ruta también.
* El icono debe ser un archivo PNG válido (ej. 256x256) en la carpeta `assets/`.
* El .env debe contener todas las variables necesarias para que el backend arranque correctamente.
