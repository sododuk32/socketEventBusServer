// socket-server.js
import { WebSocketServer } from 'ws';
import { setupBroker } from './brokersetup.js';

const PORT = 4433;

// 1) WebSocketServer 생성
const wss = new WebSocketServer({ port: PORT });
console.log(`▶ WebSocket server listening on ws://localhost:${PORT}`);

// 2) setupBroker로 EventBrokers · ClientManager · ExternalConnector 초기화
setupBroker(wss);
