import { io } from "socket.io-client";

// In development, the socket server is on the same port as the app
const socket = io();

export default socket;
