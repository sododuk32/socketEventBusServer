/* eslint-disable @typescript-eslint/no-unused-expressions */
import { SocketMessageBodyEvent, SocketClient } from '../types/Socket/SocketConnect.js';
import { EventBrokers } from './eventbroker.js';
import { ExternalConnector } from './outSocket.js';

export const ALLOW_SINGLE_KIS_SESSION = true;

// ClientManager.ts
export class ClientManager {
  public clients = new Map<string, SocketClient>();

  constructor(
    private externalConnector: ExternalConnector,
    getUserList: void
  ) {
    const broker = EventBrokers;

    broker.on('subscribe', ({ uuid, topic, detail, ws }) =>
      this.subscribe({ uuid, topic, detail, ws })
    );
    broker.on('unsubscribe', ({ uuid, topic, detail, ws }) =>
      this.unsubscribe({ uuid, topic, detail, ws })
    );
    broker.on('removeClient', (uuid) => this.removeClient(uuid));
    broker.on('giveUser', ({ topic, detail, payload }) => this.broadcast(topic, detail, payload));
  }

  addClient(client: SocketMessageBodyEvent) {
    const { uuid, ws } = client;
    if (!this.clients.has(uuid)) {
      this.clients.set(uuid, { id: uuid, ws, subscriptions: {} });
    }
  }

  getClient(uuid: string) {
    return this.clients.get(uuid);
  }

  /** 구독 처리 */
  subscribe(events: SocketMessageBodyEvent) {
    const { uuid, topic, detail, ws } = events;
    console.log('manager subscribe  ' + topic);

    // 세션 제한 검사
    if (ALLOW_SINGLE_KIS_SESSION && this.clients.size > 0) {
      console.log('[세션 제한] 기존 세션 존재. 모두 제거 후 새로운 세션으로 교체.');

      for (const [existingUUID, client] of this.clients.entries()) {
        if (existingUUID !== uuid) {
          // 외부 구독 해제
          for (const topicKey in client.subscriptions) {
            for (const detailKey of client.subscriptions[topicKey]) {
              this.externalConnector.unsubscribe(topicKey, detailKey);
            }
          }
          EventBrokers.emit('removeClient', existingUUID);
        }
      }

      this.clients.clear();
    }

    let client = this.clients.get(uuid);
    if (!client) {
      client = { id: uuid, ws, subscriptions: {} };
      this.clients.set(uuid, client);
    }

    const subs = client.subscriptions;
    if (!subs[topic]) subs[topic] = [];
    if (!subs[topic].includes(detail)) {
      subs[topic].push(detail);
    }

    if (subs[topic].length === 1) {
      this.externalConnector.subscribe(topic, detail);
    }
  }

  unsubscribe(events: SocketMessageBodyEvent) {
    const { uuid, topic, detail } = events;
    const client = this.clients.get(uuid);
    if (!client) return;

    const subs = client.subscriptions[topic] || [];
    client.subscriptions[topic] = subs.filter((sub) => sub !== detail);

    if (client.subscriptions[topic].length === 0) {
      delete client.subscriptions[topic];
      this.externalConnector.unsubscribe(topic, detail);
    }
  }

  removeClient(uuid: string) {
    const client = this.clients.get(uuid);
    if (client) {
      for (const topic of Object.keys(client.subscriptions)) {
        for (const detail of client.subscriptions[topic]) {
          this.externalConnector.unsubscribe(topic, detail);
        }
      }
    }
    this.clients.delete(uuid);
  }

  getSubscribersByTopic(topic: string): SocketClient[] {
    const out: SocketClient[] = [];
    this.clients.forEach((client: SocketClient) => {
      const details = client.subscriptions[topic];
      if (details && details.length > 0) {
        out.push(client);
      }
    });
    return out;
  }

  broadcast(topic: string, detail: string, payload: unknown) {
    console.log('manager broadcast');
    this.clients.forEach((client: SocketClient) => {
      const details = client.subscriptions[topic];
      if (details && details.includes(detail)) {
        client.ws.send(JSON.stringify({ type: `${topic}Update`, payload }));
      }
    });
  }

  count(topic: string): number {
    let cnt = 0;
    this.clients.forEach((client: SocketClient) => {
      const details = client.subscriptions[topic];
      if (details && details.length > 0) cnt++;
    });
    return cnt;
  }
}
