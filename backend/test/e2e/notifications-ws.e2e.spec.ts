import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { AddressInfo } from 'net';
import request from 'supertest';
import { io, Socket } from 'socket.io-client';
import { startTestApp, stopTestApp, resetDb, makeUser } from './app-harness';
import { NotificationsGateway } from '../../src/notifications/notifications.gateway';

describe('E2E: NotificationsGateway (socket.io)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let http: any;
  let baseUrl: string;
  let gateway: NotificationsGateway;

  beforeAll(async () => {
    const boot = await startTestApp();
    app = boot.app;
    prisma = boot.prisma;
    http = app.getHttpServer();
    await app.listen(0);
    const { port } = app.getHttpServer().address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${port}`;
    gateway = app.get(NotificationsGateway);
  }, 180000);

  afterAll(async () => {
    await stopTestApp();
  });

  beforeEach(async () => {
    await resetDb(prisma);
  });

  async function login(email: string, password: string): Promise<string> {
    const res = await request(http).post('/auth/login').send({ email, password }).expect(201);
    return res.body.access_token;
  }

  function connectAuthed(token: string): Promise<Socket> {
    const sock = io(`${baseUrl}/notifications`, {
      transports: ['websocket'],
      reconnection: false,
      auth: { token },
    });
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('no connect in 5s')), 5000);
      sock.once('connect', () => {
        clearTimeout(t);
        resolve(sock);
      });
      sock.once('connect_error', (err) => {
        clearTimeout(t);
        reject(err);
      });
    });
  }

  function waitForEvent<T = any>(socket: Socket, event: string, timeoutMs = 5000): Promise<T> {
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error(`Timeout waiting for "${event}"`)), timeoutMs);
      socket.once(event, (payload: T) => {
        clearTimeout(t);
        resolve(payload);
      });
    });
  }

  it('rejects WS connection without JWT (disconnects immediately)', async () => {
    const sock = io(`${baseUrl}/notifications`, { transports: ['websocket'], reconnection: false });
    await new Promise<void>((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('no disconnect')), 5000);
      sock.on('disconnect', () => {
        clearTimeout(t);
        resolve();
      });
    });
    sock.close();
  });

  it('rejects WS connection with invalid JWT', async () => {
    const sock = io(`${baseUrl}/notifications`, {
      transports: ['websocket'],
      reconnection: false,
      auth: { token: 'not.a.real.token' },
    });
    await new Promise<void>((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('no disconnect')), 5000);
      sock.on('disconnect', () => {
        clearTimeout(t);
        resolve();
      });
    });
    sock.close();
  });

  it('authed client receives orders:changed / products:changed / shipments:changed broadcasts', async () => {
    await makeUser(prisma, { email: 'mgr@x', password: 'pass1', roleCode: 'MANAGER' });
    const token = await login('mgr@x', 'pass1');
    const sock = await connectAuthed(token);

    try {
      const ordersEvt = waitForEvent(sock, 'orders:changed');
      gateway.notifyOrdersChanged();
      await ordersEvt;

      const productsEvt = waitForEvent(sock, 'products:changed');
      gateway.notifyProductsChanged();
      await productsEvt;

      const shipEvt = waitForEvent(sock, 'shipments:changed');
      gateway.notifyShipmentsChanged();
      await shipEvt;
    } finally {
      sock.close();
    }
  });

  it('tasks:changed with userId only reaches that user, not another user', async () => {
    const [a, b] = await Promise.all([
      makeUser(prisma, { email: 'a@x', password: 'pass1', roleCode: 'MANAGER' }),
      makeUser(prisma, { email: 'b@x', password: 'pass1', roleCode: 'MANAGER' }),
    ]);
    const tokenA = await login('a@x', 'pass1');
    const tokenB = await login('b@x', 'pass1');
    const sockA = await connectAuthed(tokenA);
    const sockB = await connectAuthed(tokenB);

    try {
      let bReceived = false;
      sockB.on('tasks:changed', () => { bReceived = true; });

      const aEvt = waitForEvent(sockA, 'tasks:changed');
      gateway.notifyTasksChanged(a.id);
      await aEvt;

      await new Promise((r) => setTimeout(r, 300));
      expect(bReceived).toBe(false);
      expect(b).toBeDefined();
    } finally {
      sockA.close();
      sockB.close();
    }
  });
});
