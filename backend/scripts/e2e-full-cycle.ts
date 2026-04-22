/**
 * E2E full-cycle smoke test for besedkiemin backend.
 * Run: cd backend && npx tsx scripts/e2e-full-cycle.ts
 *
 * Covers: customer order lifecycle, rework at QC, internal order → inventory,
 *         shipment, payroll (piece-rate + salary + penalties).
 */

import axios, { AxiosError, AxiosInstance } from "axios";

const API = process.env.API_URL || "http://localhost:3000";
const PASSWORD = "password123";

type Sev = "OK" | "WARN" | "FAIL";
const findings: { sev: Sev; step: string; detail: string }[] = [];
const record = (sev: Sev, step: string, detail: string) =>
  findings.push({ sev, step, detail });

const badge: Record<Sev, string> = { OK: "✓", WARN: "!", FAIL: "✗" };

function summarizeError(err: unknown): { code: number | "ERR"; msg: string } {
  if (err && (err as AxiosError).isAxiosError) {
    const ax = err as AxiosError<any>;
    return {
      code: ax.response?.status ?? "ERR",
      msg: JSON.stringify(ax.response?.data ?? ax.message).slice(0, 400),
    };
  }
  return { code: "ERR", msg: String(err).slice(0, 400) };
}

async function login(email: string): Promise<AxiosInstance> {
  const { data } = await axios.post(`${API}/auth/login`, {
    email,
    password: PASSWORD,
  });
  return axios.create({
    baseURL: API,
    headers: { Authorization: `Bearer ${data.access_token}` },
    validateStatus: () => true,
  });
}

type Step<T> = { step: string; data?: T; ok: boolean; code: number | "ERR"; err?: string };
async function call<T = any>(
  step: string,
  fn: () => Promise<{ status: number; data: any }>,
  expectCodes: number[] = [200, 201],
): Promise<Step<T>> {
  try {
    const res = await fn();
    const ok = expectCodes.includes(res.status);
    if (ok) {
      record("OK", step, `HTTP ${res.status}`);
      return { step, data: res.data as T, ok: true, code: res.status };
    } else {
      const msg = JSON.stringify(res.data).slice(0, 400);
      record("FAIL", step, `HTTP ${res.status} — ${msg}`);
      return { step, data: res.data as T, ok: false, code: res.status, err: msg };
    }
  } catch (e) {
    const { code, msg } = summarizeError(e);
    record("FAIL", step, `${code} — ${msg}`);
    return { step, ok: false, code, err: msg };
  }
}

function section(title: string) {
  console.log(`\n======== ${title} ========`);
}

(async () => {
  section("Login all roles");
  const clients: Record<string, AxiosInstance> = {};
  for (const role of [
    "manager",
    "owner",
    "preparer",
    "painter",
    "sewer",
    "assembler",
    "warehouse",
  ]) {
    try {
      clients[role] = await login(`${role}@example.com`);
      record("OK", `login:${role}`, "authenticated");
    } catch (e) {
      const { code, msg } = summarizeError(e);
      record("FAIL", `login:${role}`, `${code} — ${msg}`);
    }
  }

  // Resolve user ids once (needed for penalty + assignments)
  const meRes = await call<any[]>("users:list", () =>
    clients.owner.get("/users"),
  );
  const users = (meRes.data as any[]) || [];
  const userIdByEmail = (email: string) =>
    users.find((u) => u.email === email)?.id as string | undefined;

  const preparerId = userIdByEmail("preparer@example.com");
  const painterId = userIdByEmail("painter@example.com");
  const assemblerId = userIdByEmail("assembler@example.com");
  const warehouseId = userIdByEmail("warehouse@example.com");

  if (!preparerId || !painterId || !assemblerId || !warehouseId) {
    record(
      "FAIL",
      "resolve-users",
      `missing userIds: preparer=${preparerId} painter=${painterId} assembler=${assemblerId} warehouse=${warehouseId}`,
    );
  }

  // Pick a product type that's already in the seed and doesn't require sewing,
  // to keep the cycle short (PREPARATION → PAINTING → ASSEMBLY → QC).
  const ptRes = await call<any[]>("product-types:list", () =>
    clients.manager.get("/product-types"),
  );
  const ptList = (ptRes.data as any[]) || [];
  const stolType =
    ptList.find((pt) => pt.name === "Стол") ||
    ptList.find((pt) => pt.requiresSewing === false) ||
    ptList[0];
  if (!stolType) {
    record("FAIL", "resolve-pt", "no product types available");
    return;
  }

  // ============================================================
  section("SCENARIO A — Customer order happy path");
  // ============================================================
  const orderA = await call<any>("A.create-order", () =>
    clients.manager.post("/orders", {
      customerName: "E2E Клиент A",
      customerPhone: "+79990000001",
      customerAddress: "Москва, Тестовая 1",
      description: "E2E happy path",
      priority: "NORMAL",
      totalAmount: 15000,
    }),
  );
  const orderAId = orderA.data?.id;

  const prodA = await call<any>("A.create-product", () =>
    clients.manager.post("/products", {
      name: `E2E продукт A ${Date.now()}`,
      productTypeId: stolType.id,
      orderId: orderAId,
      quantity: 1,
      dimensions: "100x50x70",
      requiresSewing: false,
      color: "Дуб",
      stageAssignments: {
        PREPARATION: preparerId,
        PAINTING: painterId,
        ASSEMBLY: assemblerId,
      },
    }),
  );
  const prodAId = prodA.data?.id;

  // Helper: find task for given product + stage + role (fetches that role's /tasks/my)
  async function taskFor(
    roleClient: AxiosInstance,
    productId: string,
    stage: string,
  ): Promise<any | null> {
    const endpoints = ["/tasks/my", "/tasks/department-tasks"];
    for (const ep of endpoints) {
      const res = await roleClient.get(ep);
      if (res.status !== 200) continue;
      const all: any[] = res.data;
      const match = all.find(
        (t) =>
          t.productId === productId &&
          t.stage === stage &&
          (t.status === "NEW" || t.status === "ACCEPTED" || t.status === "COMPLETED"),
      );
      if (match) return match;
    }
    return null;
  }

  async function walkStage(
    label: string,
    client: AxiosInstance,
    productId: string,
    stage: string,
  ) {
    const task = await taskFor(client, productId, stage);
    if (!task) {
      record("FAIL", `${label}:find-task`, `no ${stage} task for product ${productId}`);
      return null;
    }
    await call(`${label}:accept`, () =>
      client.post(`/tasks/${task.id}/accept`, {}),
    );
    await call(`${label}:complete`, () =>
      client.post(`/tasks/${task.id}/complete`, {
        quantity: task.quantity,
        notes: "e2e done",
      }),
    );
    // pass → advances product to next stage and spawns next task
    await call(`${label}:pass`, () =>
      client.post(`/tasks/${task.id}/pass`, {}),
    );
    return task;
  }

  await walkStage("A.preparer", clients.preparer, prodAId, "PREPARATION");
  await walkStage("A.painter", clients.painter, prodAId, "PAINTING");
  await walkStage("A.assembler", clients.assembler, prodAId, "ASSEMBLY");

  // Quality check: warehouse approves
  const qcTaskA = await taskFor(clients.warehouse, prodAId, "QUALITY_CHECK");
  if (!qcTaskA) {
    record(
      "WARN",
      "A.qc:find-task",
      "no QUALITY_CHECK task surfaced — product may auto-complete or approve endpoint differs",
    );
  } else {
    await call("A.qc:approve", () =>
      clients.warehouse.post(`/tasks/${qcTaskA.id}/approve`, {
        quantity: qcTaskA.quantity,
      }),
    );
  }

  // Verify product + order final state
  const prodAFinal = await call<any>("A.verify-product", () =>
    clients.manager.get(`/products/${prodAId}`),
  );
  if (prodAFinal.data?.stage !== "COMPLETED") {
    record(
      "WARN",
      "A.product-stage",
      `expected COMPLETED, got ${prodAFinal.data?.stage}`,
    );
  }
  const orderAFinal = await call<any>("A.verify-order", () =>
    clients.manager.get(`/orders/${orderAId}`),
  );
  if (orderAFinal.data?.status !== "COMPLETED") {
    record(
      "WARN",
      "A.order-status",
      `expected COMPLETED, got ${orderAFinal.data?.status}`,
    );
  }

  // ============================================================
  section("SCENARIO B — Rework (reject at QC → return to PAINTING)");
  // ============================================================
  const orderB = await call<any>("B.create-order", () =>
    clients.manager.post("/orders", {
      customerName: "E2E Клиент B",
      customerPhone: "+79990000002",
      customerAddress: "Москва, Тестовая 2",
      priority: "HIGH",
      totalAmount: 20000,
    }),
  );
  const orderBId = orderB.data?.id;

  const prodB = await call<any>("B.create-product", () =>
    clients.manager.post("/products", {
      name: `E2E продукт B ${Date.now()}`,
      productTypeId: stolType.id,
      orderId: orderBId,
      quantity: 1,
      requiresSewing: false,
      stageAssignments: {
        PREPARATION: preparerId,
        PAINTING: painterId,
        ASSEMBLY: assemblerId,
      },
    }),
  );
  const prodBId = prodB.data?.id;

  await walkStage("B.preparer", clients.preparer, prodBId, "PREPARATION");
  await walkStage("B.painter1", clients.painter, prodBId, "PAINTING");
  await walkStage("B.assembler1", clients.assembler, prodBId, "ASSEMBLY");

  // QC: reject back to PAINTING + create penalty
  const qcTaskB = await taskFor(clients.warehouse, prodBId, "QUALITY_CHECK");
  if (!qcTaskB) {
    record("FAIL", "B.qc:find-task", "no QC task to reject");
  } else {
    await call("B.qc:reject", () =>
      clients.warehouse.post(`/tasks/${qcTaskB.id}/reject`, {
        notes: "e2e defect: плохая покраска",
        quantity: 1,
        returnToStage: "PAINTING",
        penaltyAmount: 400,
      }),
    );
  }

  // Rework: painter redoes
  await walkStage("B.painter-rework", clients.painter, prodBId, "PAINTING");
  await walkStage("B.assembler-rework", clients.assembler, prodBId, "ASSEMBLY");

  const qcTaskB2 = await taskFor(clients.warehouse, prodBId, "QUALITY_CHECK");
  if (!qcTaskB2) {
    record("WARN", "B.qc2:find-task", "no second QC task after rework");
  } else {
    await call("B.qc2:approve", () =>
      clients.warehouse.post(`/tasks/${qcTaskB2.id}/approve`, {
        quantity: qcTaskB2.quantity,
      }),
    );
  }

  // ============================================================
  section("SCENARIO C — Internal order + inventory from-completion");
  // ============================================================
  const orderC = await call<any>("C.create-internal-order", () =>
    clients.manager.post("/orders", {
      customerName: "Внутренний заказ E2E",
      description: "E2E fill inventory",
      priority: "NORMAL",
    }),
  );
  const orderCId = orderC.data?.id;

  const uniqName = `E2E склад-позиция ${Date.now()}`;
  const prodC = await call<any>("C.create-product", () =>
    clients.manager.post("/products", {
      name: uniqName,
      productTypeId: stolType.id,
      orderId: orderCId,
      quantity: 2,
      requiresSewing: false,
      stageAssignments: {
        PREPARATION: preparerId,
        PAINTING: painterId,
        ASSEMBLY: assemblerId,
      },
    }),
  );
  const prodCId = prodC.data?.id;

  await walkStage("C.preparer", clients.preparer, prodCId, "PREPARATION");
  await walkStage("C.painter", clients.painter, prodCId, "PAINTING");
  await walkStage("C.assembler", clients.assembler, prodCId, "ASSEMBLY");

  const qcTaskC = await taskFor(clients.warehouse, prodCId, "QUALITY_CHECK");
  if (qcTaskC) {
    await call("C.qc:approve", () =>
      clients.warehouse.post(`/tasks/${qcTaskC.id}/approve`, {
        quantity: qcTaskC.quantity,
      }),
    );
  } else {
    record("WARN", "C.qc:find-task", "no QC task; inventory may not populate");
  }

  // Verify inventory now has this item
  const avail = await call<{ quantity: number }>("C.inventory-check", () =>
    clients.warehouse.get("/inventory/availability/lookup", {
      params: { productTypeId: stolType.id, name: uniqName },
    }),
  );
  const availQty = avail.data?.quantity || 0;
  if (availQty <= 0) {
    record(
      "FAIL",
      "C.inventory-populated",
      `expected >0 after completion, got ${availQty}`,
    );
  } else {
    record("OK", "C.inventory-populated", `quantity=${availQty}`);
  }

  // ============================================================
  section("SCENARIO D — createFromInventory deducts stock");
  // ============================================================
  if (availQty > 0) {
    const orderD = await call<any>("D.create-order", () =>
      clients.manager.post("/orders", {
        customerName: "E2E Клиент D (со склада)",
        customerPhone: "+79990000004",
        priority: "NORMAL",
      }),
    );
    const orderDId = orderD.data?.id;

    await call("D.create-from-inventory", () =>
      clients.manager.post("/products/from-inventory", {
        name: uniqName,
        productTypeId: stolType.id,
        orderId: orderDId,
        quantity: 1,
      }),
    );

    const avail2 = await call<{ quantity: number }>("D.inventory-deducted", () =>
      clients.warehouse.get("/inventory/availability/lookup", {
        params: { productTypeId: stolType.id, name: uniqName },
      }),
    );
    if ((avail2.data?.quantity ?? -1) !== availQty - 1) {
      record(
        "FAIL",
        "D.inventory-delta",
        `expected ${availQty - 1}, got ${avail2.data?.quantity}`,
      );
    } else {
      record("OK", "D.inventory-delta", `${availQty} → ${avail2.data?.quantity}`);
    }
  }

  // ============================================================
  section("SCENARIO E — Shipment lifecycle");
  // ============================================================
  const invList = await call<any[]>("E.inventory-list", () =>
    clients.warehouse.get("/inventory"),
  );
  const shipItem =
    (invList.data as any[])?.find((it) => it.quantity > 0) ||
    (invList.data as any[])?.[0];

  if (!shipItem) {
    record("WARN", "E.shipment", "no inventory items available for shipment");
  } else {
    const shipment = await call<any>("E.create-shipment", () =>
      clients.manager.post("/shipments", {
        items: [{ inventoryItemId: shipItem.id, quantity: 1 }],
        customerName: "E2E Получатель",
        customerPhone: "+79990000005",
        deliveryAddress: "Москва, Доставка 1",
        deliveryDate: new Date(Date.now() + 86400000).toISOString(),
      }),
    );
    const shipId = shipment.data?.id;
    if (shipId) {
      await call("E.ship:in-transit", () =>
        clients.manager.patch(`/shipments/${shipId}/status`, {
          status: "IN_TRANSIT",
        }),
      );
      await call("E.ship:delivered", () =>
        clients.manager.patch(`/shipments/${shipId}/status`, {
          status: "DELIVERED",
        }),
      );
    }
  }

  // ============================================================
  section("SCENARIO F — Penalty + payroll calculation");
  // ============================================================
  if (painterId) {
    await call("F.penalty", () =>
      clients.owner.post("/payroll/penalties", {
        userId: painterId,
        amount: 400,
        reason: "e2e defect penalty",
        notes: "added by e2e script",
      }),
    );
  }

  // Period = current month
  const now = new Date();
  const startStr = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const endStr = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];

  await call("F.payroll:calculate", () =>
    clients.owner.post("/payroll/calculate", {
      periodStart: startStr,
      periodEnd: endStr,
    }),
  );

  const periodsRes = await call<any[]>("F.payroll:periods", () =>
    clients.owner.get("/payroll/periods"),
  );
  const periods = (periodsRes.data as any[]) || [];
  if (periods.length === 0) {
    record("FAIL", "F.payroll:periods-empty", "no payroll periods after calculate");
  } else {
    const draft = periods.find((p) => p.status === "DRAFT") || periods[0];
    record(
      "OK",
      "F.payroll:period-summary",
      `id=${draft.id} status=${draft.status} user=${draft.userId} net=${draft.netAmount} penalties=${draft.penaltyAmount}`,
    );

    if (draft.status === "DRAFT") {
      await call("F.payroll:approve", () =>
        clients.owner.post(`/payroll/periods/${draft.id}/approve`, {
          notes: "e2e approve",
        }),
      );
      await call("F.payroll:pay", () =>
        clients.owner.post(`/payroll/periods/${draft.id}/pay`, {
          notes: "e2e pay",
        }),
      );
    } else {
      record("WARN", "F.payroll:period-not-draft", `period status=${draft.status}`);
    }
  }

  // ============================================================
  section("REPORT");
  // ============================================================
  const ok = findings.filter((f) => f.sev === "OK").length;
  const warn = findings.filter((f) => f.sev === "WARN").length;
  const fail = findings.filter((f) => f.sev === "FAIL").length;

  console.log(`\nTotal: ${findings.length}   OK=${ok}   WARN=${warn}   FAIL=${fail}\n`);

  if (warn > 0) {
    console.log("⚠  WARNINGS:");
    findings
      .filter((f) => f.sev === "WARN")
      .forEach((f) => console.log(`   ${badge[f.sev]} ${f.step}: ${f.detail}`));
  }
  if (fail > 0) {
    console.log("\n✗ FAILURES:");
    findings
      .filter((f) => f.sev === "FAIL")
      .forEach((f) => console.log(`   ${badge[f.sev]} ${f.step}: ${f.detail}`));
    process.exit(1);
  }
  console.log("\n✓ Full E2E cycle passed.");
})().catch((e) => {
  console.error("FATAL:", e);
  process.exit(2);
});
