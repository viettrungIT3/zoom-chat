# Zoom Chat

Zoom Chat is a real-time chat application built using **Node.js**, **Socket.IO**, **MongoDB**, and containerized with **Docker**. It supports multiple chat rooms with dynamic user interfaces built using **HTML**, **CSS**, and **Bootstrap**.

---

## Table of Contents

1. [Features](#features)
2. [Project Structure](#project-structure)
3. [Technologies Used](#technologies-used)
4. [How to Run](#how-to-run)
5. [Future Improvements](#future-improvements)

---

## Features

1. **Chat Rooms**:
   - Displays a list of available rooms (name + member count).
   - Join or leave a room dynamically.

2. **Real-Time Messaging**:
   - Categorized messages:
     - **Your messages**: Right-aligned.
     - **System messages**: Center-aligned.
     - **Other users' messages**: Left-aligned.
   - Auto-scrolls to the latest message.

3. **Interactive UI**:
   - Responsive interface using Bootstrap.

4. **Real-Time Communication**:
   - Powered by Socket.IO for live interactions.


### Screenshots
<div style="display: flex; flex-direction: row; justify-content: space-around;">
    <img src="https://github.com/user-attachments/assets/fb67ca5d-f2be-4437-b7b2-f3b8fb487bd5" alt="Screenshot 1" width="48%">
    <img src="https://github.com/user-attachments/assets/dcc62ee3-6a31-401e-98f6-bbf66fc7ac70" alt="Screenshot 2" width="48%">
</div>


---

## Project Structure
```
zoom-chat\
 ├──src\
 │  ├──public\
 │  │  ├──css\
 │  │  │  └──style.css
 │  │  ├──js\
 │  │  │  └──client.js
 │  │  └──index.html
 │  ├──server.js
 │  └──package.json
 ├──.env
 ├──.env.example
 ├──.gitignore
 ├──docker-compose.yml
 ├──Dockerfile
 └──README.md
 ```


## Technologies Used

### Backend
- **Node.js**: Handles server-side logic and events.
- **Socket.IO**: Enables real-time communication.
- **dotenv**: Manages environment variables.

### Frontend
- **HTML, CSS**: Basic UI structure.
- **Bootstrap**: Responsive and modern UI design.
- **JavaScript**: Implements dynamic behavior on the client-side.

### Containerization
- **Docker**: Ensures consistent runtime environments.
- **Docker Compose**: Manages multi-service configurations.

### Environment Management
- **dotenv**: Manages environment variables.

---

## How to Run

### Run with local Docker
#### Build the Docker image:
 1. Install docker and docker compose
 2. Copy the `.env.example` file to `.env` and set the required variables
 3. Run `docker compose up --build` to start the application
 4. Open your browser and navigate to `http://localhost:3000` to access the application

#### Run without local
 1. Install node.js
 2. cd to the project directory (src)
 3. Copy the `.env.example` file to `.env` and set the required variables
 4. Run `npm install` to install the dependencies
 5. Run `npm start` to start the application
 6. Open your browser and navigate to `http://localhost:3000` to access the application

#### Run with heroku
 1. Install heroku cli
 2. Run `heroku login` to login to your heroku account
 3. Run `heroku create <app-name>` to create a new heroku app
 4. Run `heroku container:push web --app <app-name>` to push the container to heroku
 5. Run `heroku container:release web --app <app-name>` to release the container
 6. Run `heroku open --app <app-name>` to open the application

### Future Improvements

1. **User Authentication**:
   - Login using accounts or email verification.
2. **Message Storage**:
   - Save messages to a database like MongoDB or MySQL.
3. **Push Notifications**:
   - Notify users of new messages.
4. **Enhanced UI**:
   - Support for media files (images, videos) and emojis.
