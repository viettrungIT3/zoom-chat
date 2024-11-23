
const socket = io();
let currentRoom = null;
if (currentRoom) {
    document.getElementById('rooms-section').style.display = 'none';
    document.getElementById('chat-section').classList.add('d-flex');
} else {
    document.getElementById('rooms-section').style.display = 'block';
    document.getElementById('chat-section').classList.remove('d-flex');
}

// Update room list
socket.on('room-list-update', (rooms) => {
    const roomList = document.getElementById('room-list');
    roomList.innerHTML = '';
    rooms.forEach(room => {
        const roomBtn = document.createElement('button');
        roomBtn.className = 'btn btn-outline-primary m-2 room-btn';
        roomBtn.textContent = `${room.name} (${room.memberCount} members)`;
        roomBtn.onclick = () => joinRoom(room.name);
        roomList.appendChild(roomBtn);
    });
});

function joinRoom(roomName) {
    fetch(`/messages/${roomName}`)
        .then(response => response.json())
        .then(messages => {
            const messagesContainer = document.getElementById('messages');
            messagesContainer.innerHTML = '';
            messages.forEach(msg => {
                displayMessage(msg.userId || 'System', msg.message, msg.type);
            });
            scrollToBottom();
        });

    socket.emit('join-room', roomName);
    currentRoom = roomName;

    document.getElementById('rooms-section').style.display = 'none';
    document.getElementById('chat-section').classList.add('d-flex');
    document.getElementById('current-room').textContent = roomName;
}

function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value;
    if (message && currentRoom) {
        socket.emit('send-message', { room: currentRoom, message });
        displayMessage('You', message);
        messageInput.value = '';
        scrollToBottom();
    }
}

function leaveRoom() {
    if (currentRoom) {
        socket.emit('leave-room', currentRoom);
        currentRoom = null;

        document.getElementById('rooms-section').style.display = 'block';
        document.getElementById('chat-section').classList.remove('d-flex');

        document.getElementById('messages').innerHTML = '';
    }
}


function displayMessage(sender, message, type = 'user') {
    const messageContainer = document.getElementById('messages');
    const messageElement = document.createElement('div');
    messageElement.classList.add('user-message', 'my-2', 'p-2'); // Bootstrap classes

    if (type === 'system') {
        messageElement.classList.add('system', 'text-center', 'mx-auto');
        messageElement.innerHTML = `<em>${message}</em>`;
    } else if (sender === 'You') {
        messageElement.classList.add('right', 'text-end');
        messageElement.innerHTML = `${message}`;
    } else {
        messageElement.classList.add('left', 'text-start');
        messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
    }

    messageContainer.appendChild(messageElement);

    // Auto scroll to the newest message
    messageContainer.scrollTop = messageContainer.scrollHeight;
}



function scrollToBottom() {
    const messagesContainer = document.getElementById('messages');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

socket.on('user-joined', (data) => {
    displayMessage('System', data.message, 'system');
});

socket.on('user-left', (data) => {
    displayMessage('System', data.message, 'system');
});

socket.on('receive-message', (data) => {
    const sender = data.userId === socket.id ? 'You' : data.userId;
    displayMessage(sender, data.message);
});