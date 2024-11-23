# Zoom Chat
A real-time chat application built with Node.js, Socket.IO, and MongoDB, containerized with Docker. This application allows users to join different chat rooms and communicate in real-time.

### Features
- Real-time messaging using Socket.IO
- Multiple chat rooms support (configurable up to 10 rooms)
- Message history persistence using MongoDB
- Rate limiting to prevent spam
- Containerized deployment with Docker and Docker Compose
- Environment-based configuration
- Scalable architecture

### Tech Stack
- **Backend**: Node.js
- **Real-time Communication**: Socket.IO
- **Database**: MongoDB
- **Containerization**: Docker & Docker Compose
- **Environment Management**: dotenv

### Prerequisites
- Docker and Docker Compose installed
- Node.js (for local development)


## Project Structure
zoom-chat\
 ├──src\
 │  ├──public\
 │  │  └──index.html
 │  ├──server.js
 │  └──package.json
 ├──.env
 ├──.env.example
 ├──.gitignore
 ├──docker-compose.yml
 ├──Dockerfile
 └──README.md