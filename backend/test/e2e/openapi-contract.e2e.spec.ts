import { INestApplication } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { PrismaClient } from '@prisma/client';
import { startTestApp, stopTestApp } from './app-harness';

describe('E2E: OpenAPI contract surface', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let doc: any;

  beforeAll(async () => {
    const boot = await startTestApp();
    app = boot.app;
    prisma = boot.prisma;

    const config = new DocumentBuilder()
      .setTitle('Besedki API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    doc = SwaggerModule.createDocument(app, config);
  }, 180000);

  afterAll(async () => {
    await stopTestApp();
  });

  it('exposes a non-empty set of paths', () => {
    expect(doc.paths).toBeTruthy();
    const pathCount = Object.keys(doc.paths).length;
    expect(pathCount).toBeGreaterThan(30);
  });

  it('includes the core business routes', () => {
    const required = [
      '/auth/login',
      '/orders',
      '/orders/{id}',
      '/products',
      '/tasks/{id}/accept',
      '/tasks/{id}/complete',
      '/tasks/{id}/approve',
      '/tasks/{id}/reject',
      '/payroll/calculate',
      '/catalog-products',
      '/catalog-categories',
      '/catalog-orders',
      '/feature-flags',
    ];
    const missing = required.filter((p) => !doc.paths[p]);
    expect(missing).toEqual([]);
    expect(prisma).toBeDefined();
  });

  it('declares bearer auth as a security scheme', () => {
    const schemes = doc.components?.securitySchemes || {};
    const bearer = Object.values(schemes).find(
      (s: any) => s.type === 'http' && s.scheme === 'bearer',
    );
    expect(bearer).toBeDefined();
  });

  it('matches a committed contract snapshot (paths + methods)', () => {
    const surface = Object.entries(doc.paths)
      .flatMap(([path, ops]: [string, any]) =>
        Object.keys(ops)
          .filter((k) => ['get', 'post', 'put', 'patch', 'delete'].includes(k))
          .map((method) => `${method.toUpperCase()} ${path}`),
      )
      .sort();
    expect(surface).toMatchSnapshot();
  });
});
