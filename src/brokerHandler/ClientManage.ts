/* eslint-disable @typescript-eslint/no-unused-expressions */
import { SocketMessageBodyEvent, SocketClient } from '../types/Socket/SocketConnect.js';
import { EventBrokers } from './eventbroker.js';
import { ExternalConnector } from './outSocket.js';

export const ALLOW_SINGLE_KIS_SESSION = true;

const hantooCall = ['realtime'];

export class ClientManager {
  /** <uuid , socketclient> */
  public clients = new Map<string, SocketClient>();

  constructor(
    private externalConnector: ExternalConnector,
    getUserList: void
  ) {
    const broker = EventBrokers;

    broker.on('subscribe', ({ uuid, topic, detail, ws, isStock }) =>
      this.subscribe({ uuid, topic, detail, ws, isStock })
    );
    broker.on('unsubscribe', ({ uuid, topic, detail, ws, isStock }) =>
      this.unsubscribe({ uuid, topic, detail, ws, isStock })
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
    const { uuid, topic, detail, ws, isStock } = events;
    console.log('manager subscribe  ' + topic);
    // 세션 제한 검사 => isStock의 경우 기존 topic, detail 제거 로직 실행.
    if (isStock && this.clients.size > 0) {
      console.log('[세션 제한] 기존 세션 존재. 모두 제거 후 새로운 세션으로 교체.');
      console.log(uuid, topic, detail, isStock);

      for (const [existingUUID, client] of this.clients.entries()) {
        // if (existingUUID !== uuid) {
        // 외부 구독 해제
        for (const topicKey in client.subscriptions) {
          for (const detailKey of client.subscriptions[topicKey]) {
            this.externalConnector.unsubscribe(topicKey, detailKey, uuid);
          }
        }
        console.log('removeClient');
        EventBrokers.emit('removeClient', existingUUID);
        // }
      }

      this.clients.clear();
      console.log('clear');
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
    console.log('subscribe');

    if (subs[topic].length === 1) {
      this.externalConnector.subscribe(topic, detail);
    }
    console.log(this.clients.size);
  }

  unsubscribe(events: SocketMessageBodyEvent) {
    const { uuid, topic, detail, isStock } = events;
    const client = this.clients.get(uuid);
    if (!client) return;

    const subs = client.subscriptions[topic] || [];
    client.subscriptions[topic] = subs.filter((sub) => sub !== detail);

    if (client.subscriptions[topic].length === 0) {
      delete client.subscriptions[topic];
      this.externalConnector.unsubscribe(topic, detail, uuid);
    }
  }

  removeClient(uuid: string) {
    const client = this.clients.get(uuid);
    if (!client) return;

    // 이런 for 중첩문  다중 노드 트리로 만들고 깊이 우선 탐색으로 처리하면 빠를듯.
    for (const topic of Object.keys(client.subscriptions)) {
      for (const detail of client.subscriptions[topic]) {
        // 1) 다른 클라이언트 중 이 detail을 여전히 쓰는 애가 있는지 확인
        const stillUsed = Array.from(this.clients.entries()).some(
          ([otherUuid, otherClient]) =>
            otherUuid !== uuid && otherClient.subscriptions[topic]?.includes(detail)
        );
        // 2) 아무도 안 쓰면 진짜 언구독 => 아무도 사용하지 않는topic을 삭제. + detail도 삭제해야함.
        if (!stillUsed) {
          this.externalConnector.clearSubScreibe(uuid, topic);
        }
      }
    }

    /**다른 client와 겹치기때문에 uuid만 목록에서 제거. 3자 서버의 연결은 유지. */
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
    this.clients.forEach((client: SocketClient) => {
      const details = client.subscriptions[topic];
      if (details && details.includes(detail)) {
        client.ws.send(JSON.stringify({ type: 'update', topic: `${topic}`, payload }));
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
