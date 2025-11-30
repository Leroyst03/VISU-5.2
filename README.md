# VISU-5.2

## Overview

This repository contains the codebase for VISU-5.2, a JavaScript-based application likely related to visualization and control systems. It utilizes Node.js for its backend and interacts with a database. The application manage AGVs (Automated Guided Vehicles), semaphores, orders, and communications, potentially within an industrial automation setting.

## Key Features & Benefits

*   **AGV Management:** Fetches and processes AGV data from a database.
*   **Real-time Communication:** Employs Socket.IO for real-time updates and interaction with a GUI.
*   **Database Integration:** Uses SQLite database to store and retrieve data related to AGVs, orders, and semaphores.
*   **Configuration Management:** Uses environment variables to configure app.
*   **PLC Communication Status:** Monitors and exposes PLC and AGV communication status.
*   **Button Control:** Provides real-time button state management using websockets.

## Prerequisites & Dependencies

Before you begin, ensure you have the following installed:

*   **Node.js:** (version specified in `package.json`, if available)
*   **sudo apt install npm** (if you don't have install npm)
*   **npm** or **yarn:** (package manager for Node.js)

## Installation & Setup Instructions

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/Leroyst03/VISU-5.2.git
    cd VISU-5.2
    ```

2.  **Install dependencies:**

    Using npm:

    ```bash
    npm install
    ```

    Or, using yarn:

    ```bash
    yarn install
    ```

3.  **Configure Environment Variables:**

    Create a `.env` file in the root directory (if it doesn't exist) and set the necessary environment variables. Consult your application configuration or codebase for required variables. A common one is likely used.

4.  **Start the application:**

    ```bash
    npm start
    ```
## Usage Examples & API Documentation

### API Endpoints

*   `/api/agvs`:  Retrieves AGV data. Example response: `[{ left: '12.05%', top: '53.26%'}, ...]
, ...]`.
*   `/api/com`: Retrieves communication status (1 for active, 0 for inactive). Example response: `{"COM": 1}`.
*   `/api/estado_comunicaciones`: Retrieves the communication status of PLC and AGVs.

### Socket.IO Events

*   `botones_out_actualizados`: Emitted when the state of the output buttons changes.

### Code Snippets

**Example: Fetching AGV data using JavaScript:**

```javascript
fetch('/api/agvs')
  .then(response => response.json())
  .then(data => {
    console.log('AGV Data:', data);
  })
  .catch(error => {
    console.error('Error fetching AGV data:', error);
  });
```

## Configuration Options

The application's behavior can be customized using environment variables. Some potential configuration options might include:

*   **Database Path:**  The location of the SQLite database file.
*   **Port Number:** The port on which the Node.js server listens.
*   **Other application-specific settings.**

Refer to the codebase or documentation for a comprehensive list of configuration options.

## Project Structure

```
├── README.md           # This file.
├── app.js              # Main Express Server (backend, APIs, sockets, DB).
├── main.js             # Electron's main process (creates the window and launches the backend).
├── launch-visu.sh      # Launcher for the GUI
├── assets/
│    ├── icon.png       # Icon for the GUI
├── controllers/        # Contains route handlers and business logic.
│   ├── agvController.js       # Handles AGV related requests.
│   ├── botonesController.js   # Handles button related requests and websocket events.
│   ├── comunicacionesController.js # Handles communication status requests.
│   ├── ioController.js         # Serve the inputs and outputs leds
│   ├── mensajeController.js    # Serve the message from the data base
│   ├── ordenesController.js    # Handles order related requests.
│   └── semaforoController.js  # Handles semaphore related requests.
├── models/             # Defines data models and database interactions.
│   ├── Conversiones.js     # Contains data conversion logic.
│   ├── DataBaseEntryGui.js # Model for 'entry_gui' table.
│   ├── DataBaseOrdenes.js  # Model for 'ordenes' table.
│   ├── DataBaseOutGui.js   # Model for 'out_gui' table.
│   └── DataBaseSemaforos.js# Model for 'semaforos' table.
├── package-lock.json   # Records the exact versions of dependencies.
├── package.json        # Lists project dependencies and scripts.
└── routes/             # Defines API routes.

```
