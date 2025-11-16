#!/bin/bash
# Script para lanzar la app Visu

# Ir a la carpeta del proyecto
cd /home/$USER/Escritorio/Abisysa/VISU-5.2

# Cargar variables de entorno desde .env
export $(grep -v '^#' .env | xargs)

# Ejecutar la app
npm start
