import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi, tasksApi } from '@/lib/api';
import { RevisionStage, RevisionItem } from '@/types';
import { Loader2, Printer, ClipboardList, MoveRight } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useAuthStore } from '@/store/authStore';

// Корректировка по ревизии: переместить часть/всё количество изделия на другой этап
const RevisionMoveControl = ({
  item,
  currentStage,
  stages,
}: {
  item: RevisionItem;
  currentStage: string;
  stages: RevisionStage[];
}) => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState<number>(item.quantity);
  const [targetStage, setTargetStage] = useState('');

  const mutation = useMutation({
    mutationFn: () => tasksApi.moveProductQuantity(item.id, qty, targetStage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revision'] });
      setOpen(false);
    },
    onError: (e: any) =>
      alert(e?.response?.data?.message || 'Не удалось переместить'),
  });

  const options = stages.filter((s) => s.stage !== currentStage);

  if (!open) {
    return (
      <button
        onClick={() => { setOpen(true); setQty(item.quantity); setTargetStage(''); }}
        className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded"
      >
        <MoveRight size={12} />
        Переместить
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1 flex-wrap justify-center">
      <input
        type="number"
        min={1}
        max={item.quantity}
        value={qty}
        onChange={(e) => setQty(Math.min(item.quantity, Math.max(1, parseInt(e.target.value) || 1)))}
        className="w-14 px-1 py-1 border rounded text-xs text-center"
      />
      <span className="text-[11px] text-muted-foreground">шт →</span>
      <select
        value={targetStage}
        onChange={(e) => setTargetStage(e.target.value)}
        className="px-1 py-1 border rounded text-xs bg-card"
      >
        <option value="">этап…</option>
        {options.map((s) => (
          <option key={s.stage} value={s.stage}>{s.name}</option>
        ))}
      </select>
      <button
        onClick={() => targetStage && mutation.mutate()}
        disabled={!targetStage || mutation.isPending}
        className="px-2 py-1 text-[11px] font-medium text-white bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 rounded"
      >
        {mutation.isPending ? '…' : 'ОК'}
      </button>
      <button
        onClick={() => setOpen(false)}
        className="px-2 py-1 text-[11px] border rounded hover:bg-muted"
      >
        ✕
      </button>
    </div>
  );
};

const esc = (v: unknown) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

export const RevisionPage = () => {
  const { user } = useAuthStore();
  const isOwner = user?.role?.code === 'OWNER' || user?.role?.code === 'SUPER_ADMIN';
  const { data: stages, isLoading, error, dataUpdatedAt } = useQuery({
    queryKey: ['revision'],
    queryFn: () => productsApi.getRevision(),
  });

  const list = (stages || []) as RevisionStage[];
  const printedAt = format(new Date(dataUpdatedAt || Date.now()), 'dd.MM.yyyy HH:mm', { locale: ru });

  const buildSection = (st: RevisionStage) => {
    const rows = st.items
      .map((it, i) => {
        const sub = [it.productType, it.color, it.dimensions].filter(Boolean).map(esc).join(' · ');
        const client = it.customerName ? ` · ${esc(it.customerName)}` : '';
        return `<tr>
          <td class="c">${i + 1}</td>
          <td>${esc(it.name)}${sub ? `<div class="sub">${sub}</div>` : ''}</td>
          <td>${esc(it.orderNumber || '—')}${client}</td>
          <td>${esc(it.assignee || '—')}</td>
          <td class="c b">${it.quantity}</td>
          <td class="c"></td>
        </tr>`;
      })
      .join('');
    return `<section class="dept">
      <div class="shead">Ревизия · ${esc(printedAt)}</div>
      <h2>${esc(st.name)} — ${st.count} поз. / ${st.totalQuantity} ед.</h2>
      <table>
        <colgroup>
          <col style="width:5%"><col style="width:35%"><col style="width:24%">
          <col style="width:18%"><col style="width:9%"><col style="width:9%">
        </colgroup>
        <thead><tr>
          <th class="c">№</th><th>Изделие</th><th>Заказ / клиент</th>
          <th>Исполнитель</th><th class="c">Кол-во</th><th class="c">Факт</th>
        </tr></thead>
        <tbody>${rows || '<tr><td colspan="6" class="c">Пусто</td></tr>'}
          <tr class="total"><td colspan="4">Итого по отделу «${esc(st.name)}»</td>
          <td class="c">${st.totalQuantity}</td><td></td></tr>
        </tbody>
      </table>
    </section>`;
  };

  const printStages = (toPrint: RevisionStage[]) => {
    const w = window.open('', '_blank', 'width=1000,height=760');
    if (!w) {
      alert('Разрешите всплывающие окна для этого сайта, чтобы открыть печать.');
      return;
    }
    const html = `<!doctype html><html lang="ru"><head><meta charset="utf-8">
      <title>Ревизия отделов</title>
      <style>
        @page { size: A4 portrait; margin: 8mm; }
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; }
        body { font-family: -apple-system, "Segoe UI", Arial, sans-serif; color: #111; }
        /* Каждый отдел начинается с новой страницы; большой отдел свободно
           переносится на несколько листов, шапка таблицы повторяется. */
        .dept { page-break-before: always; }
        .dept:first-child { page-break-before: auto; }
        .shead { font-size: 9px; color: #666; margin: 0 0 2px; }
        h2 { font-size: 13px; margin: 0 0 5px; }
        table { width: 100%; table-layout: fixed; border-collapse: collapse; font-size: 10px; }
        thead { display: table-header-group; }
        tr { page-break-inside: avoid; }
        th, td {
          border: 1px solid #999; padding: 3px 5px; text-align: left; vertical-align: top;
          word-break: break-word; overflow-wrap: anywhere;
        }
        th { background: #eee; font-weight: 600; }
        td.c, th.c { text-align: center; }
        td.b { font-weight: 700; }
        .sub { color: #777; font-size: 9px; margin-top: 1px; }
        .total td { background: #eee; font-weight: 700; }
      </style></head>
      <body>
        ${toPrint.map(buildSection).join('')}
        <script>
          window.onload = function () { setTimeout(function () { window.print(); }, 200); };
        <\/script>
      </body></html>`;
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-md">
          Ошибка загрузки ревизии: {(error as Error).message}
        </div>
      </div>
    );
  }

  const grandTotalItems = list.reduce((s, st) => s + st.count, 0);
  const grandTotalQty = list.reduce((s, st) => s + st.totalQuantity, 0);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <ClipboardList size={24} />
          <div>
            <h1 className="text-2xl font-bold">Ревизия отделов</h1>
            <p className="text-sm text-muted-foreground">
              По системе на {printedAt}. Колонка «Факт» — для подсчёта вручную.
            </p>
          </div>
        </div>
        <button
          onClick={() => printStages(list)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium"
        >
          <Printer size={16} />
          Печать всех
        </button>
      </div>

      <div className="text-sm text-muted-foreground">
        Всего в работе: <span className="font-semibold text-foreground">{grandTotalItems}</span> позиций,{' '}
        <span className="font-semibold text-foreground">{grandTotalQty}</span> единиц.
      </div>

      {list.map((st) => (
        <div key={st.stage} className="border rounded-lg overflow-hidden">
          <div className="flex items-center justify-between gap-2 px-4 py-2 bg-muted/50 border-b">
            <div className="flex items-baseline gap-2">
              <h2 className="font-semibold">{st.name}</h2>
              <span className="text-sm text-muted-foreground">
                {st.count} поз. · {st.totalQuantity} ед.
              </span>
            </div>
            <button
              onClick={() => printStages([st])}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md border text-xs font-medium hover:bg-muted"
              title={`Печатать только отдел «${st.name}»`}
            >
              <Printer size={13} />
              Печать отдела
            </button>
          </div>
          {st.items.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">Пусто</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground w-10">№</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Изделие</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Заказ / клиент</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Исполнитель</th>
                    <th className="px-3 py-2 text-center font-medium text-muted-foreground w-20">Кол-во</th>
                    <th className="px-3 py-2 text-center font-medium text-muted-foreground w-24">Факт</th>
                    {isOwner && (
                      <th className="px-3 py-2 text-center font-medium text-muted-foreground">Корректировка</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {st.items.map((it, idx) => (
                    <tr key={it.id} className="border-t align-top">
                      <td className="px-3 py-2 text-muted-foreground">{idx + 1}</td>
                      <td className="px-3 py-2">
                        <div className="font-medium">{it.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {[it.productType, it.color, it.dimensions].filter(Boolean).join(' · ')}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono">{it.orderNumber || '—'}</span>
                        {it.customerName && (
                          <span className="text-xs text-muted-foreground"> · {it.customerName}</span>
                        )}
                      </td>
                      <td className="px-3 py-2">{it.assignee || '—'}</td>
                      <td className="px-3 py-2 text-center font-semibold">{it.quantity}</td>
                      <td className="px-3 py-2 text-center text-muted-foreground">&nbsp;</td>
                      {isOwner && (
                        <td className="px-3 py-2 text-center">
                          <RevisionMoveControl item={it} currentStage={st.stage} stages={list} />
                        </td>
                      )}
                    </tr>
                  ))}
                  <tr className="border-t bg-muted/30 font-semibold">
                    <td className="px-3 py-2" colSpan={4}>
                      Итого по отделу «{st.name}»
                    </td>
                    <td className="px-3 py-2 text-center">{st.totalQuantity}</td>
                    <td className="px-3 py-2 text-center text-muted-foreground">&nbsp;</td>
                    {isOwner && <td className="px-3 py-2">&nbsp;</td>}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
