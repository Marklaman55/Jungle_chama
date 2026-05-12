import { io } from 'socket.io-client';

const API_URL = (import.meta as any).env.VITE_API_URL || '';
const socket = io(API_URL);

export default socket;
