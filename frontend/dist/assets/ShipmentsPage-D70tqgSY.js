import{c as $,u as R,k as T,r as g,a as q,b as M,j as e,h as f,C as I,q as L,I as G,B as c,S as i,P as A,M as C,v as D,N}from"./index-CdS602xk.js";import{S as F}from"./search-BAE9997W.js";import{X as Q}from"./x-circle-CITMzJ8S.js";import{f as _,r as E}from"./ru-3osNYxol.js";/**
 * @license lucide-react v0.309.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const U=$("Printer",[["polyline",{points:"6 9 6 2 18 2 18 9",key:"1306q4"}],["path",{d:"M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2",key:"143wyd"}],["rect",{width:"12",height:"8",x:"6",y:"14",key:"5ipwut"}]]),W=s=>{const a=window.open("","_blank");if(!a){alert("Не удалось открыть окно печати. Проверьте настройки блокировки всплывающих окон.");return}const h=`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Путевой лист № ${s.shipmentId}</title>
        <style>
          @page {
            size: A4;
            margin: 0;
          }

          body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
          }

          @media print {
            .waybill-print {
              page-break-after: always;
            }
          }
        </style>
      </head>
      <body>
        <div class="waybill-print" style="width: 210mm; min-height: 297mm; padding: 20mm; background-color: white; color: black; font-family: Arial, sans-serif;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="font-size: 24px; font-weight: bold; margin: 0 0 10px 0;">ПУТЕВОЙ ЛИСТ</h1>
            <p style="font-size: 14px; margin: 0;">№ ${s.shipmentId}</p>
            <p style="font-size: 12px; margin: 5px 0 0 0;">от ${new Date(s.shipmentDate).toLocaleDateString("ru-RU")}</p>
          </div>

          <div style="margin-bottom: 25px;">
            <h2 style="font-size: 16px; font-weight: bold; margin-bottom: 10px; border-bottom: 2px solid #000; padding-bottom: 5px;">Информация о заказе</h2>
            <table style="width: 100%; font-size: 12px;">
              <tbody>
                <tr>
                  <td style="padding: 5px 10px 5px 0; font-weight: bold; width: 40%;">Номер заказа:</td>
                  <td style="padding: 5px 0;">${s.orderNumber}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style="margin-bottom: 25px;">
            <h2 style="font-size: 16px; font-weight: bold; margin-bottom: 10px; border-bottom: 2px solid #000; padding-bottom: 5px;">Информация о получателе</h2>
            <table style="width: 100%; font-size: 12px;">
              <tbody>
                <tr>
                  <td style="padding: 5px 10px 5px 0; font-weight: bold; width: 40%;">Получатель:</td>
                  <td style="padding: 5px 0;">${s.customerName}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 10px 5px 0; font-weight: bold;">Телефон:</td>
                  <td style="padding: 5px 0;">${s.customerPhone}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 10px 5px 0; font-weight: bold;">Адрес доставки:</td>
                  <td style="padding: 5px 0;">${s.deliveryAddress}</td>
                </tr>
                ${s.deliveryDate?`
                <tr>
                  <td style="padding: 5px 10px 5px 0; font-weight: bold;">Дата доставки:</td>
                  <td style="padding: 5px 0;">${new Date(s.deliveryDate).toLocaleDateString("ru-RU")}</td>
                </tr>
                `:""}
              </tbody>
            </table>
          </div>

          <div style="margin-bottom: 25px;">
            <h2 style="font-size: 16px; font-weight: bold; margin-bottom: 10px; border-bottom: 2px solid #000; padding-bottom: 5px;">Список товаров</h2>
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
              <thead>
                <tr style="background-color: #f0f0f0;">
                  <th style="border: 1px solid #000; padding: 8px; text-align: left;">№</th>
                  <th style="border: 1px solid #000; padding: 8px; text-align: left;">Наименование</th>
                  <th style="border: 1px solid #000; padding: 8px; text-align: left;">Тип продукта</th>
                  <th style="border: 1px solid #000; padding: 8px; text-align: center;">Количество</th>
                </tr>
              </thead>
              <tbody>
                ${s.items.map((n,l)=>`
                <tr>
                  <td style="border: 1px solid #000; padding: 8px;">${l+1}</td>
                  <td style="border: 1px solid #000; padding: 8px;">${n.name}</td>
                  <td style="border: 1px solid #000; padding: 8px;">${n.productType}</td>
                  <td style="border: 1px solid #000; padding: 8px; text-align: center;">${n.quantity}</td>
                </tr>
                `).join("")}
                <tr style="font-weight: bold; background-color: #f9f9f9;">
                  <td colspan="3" style="border: 1px solid #000; padding: 8px; text-align: right;">ИТОГО:</td>
                  <td style="border: 1px solid #000; padding: 8px; text-align: center;">
                    ${s.items.reduce((n,l)=>n+l.quantity,0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          ${s.notes?`
          <div style="margin-bottom: 25px;">
            <h2 style="font-size: 16px; font-weight: bold; margin-bottom: 10px; border-bottom: 2px solid #000; padding-bottom: 5px;">Примечания</h2>
            <p style="font-size: 12px; margin: 0; white-space: pre-wrap;">${s.notes}</p>
          </div>
          `:""}

          <div style="margin-top: 50px;">
            <table style="width: 100%; font-size: 12px;">
              <tbody>
                <tr>
                  <td style="width: 50%; padding-right: 20px;">
                    <div style="margin-bottom: 40px;">
                      <p style="margin: 0 0 5px 0; font-weight: bold;">Отпустил (складист):</p>
                      <p style="margin: 0 0 20px 0;">${s.shippedBy}</p>
                      <div style="border-bottom: 1px solid #000; margin-bottom: 5px;"></div>
                      <p style="margin: 0; font-size: 10px; color: #666;">(подпись)</p>
                    </div>
                  </td>
                  <td style="width: 50%; padding-left: 20px;">
                    <div style="margin-bottom: 40px;">
                      <p style="margin: 0 0 5px 0; font-weight: bold;">Получил:</p>
                      <p style="margin: 0 0 20px 0;">&nbsp;</p>
                      <div style="border-bottom: 1px solid #000; margin-bottom: 5px;"></div>
                      <p style="margin: 0; font-size: 10px; color: #666;">(подпись)</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style="margin-top: 20px;">
            <p style="font-size: 12px; margin: 0;">Дата получения: ___________________</p>
          </div>
        </div>
      </body>
    </html>
  `;a.document.write(h),a.document.close(),a.onload=()=>{setTimeout(()=>{a.print()},250)}},O=()=>{const s=R(),{user:a}=T(),[h,n]=g.useState(null),[l,z]=g.useState(""),[r,u]=g.useState("ALL"),{data:m,isLoading:j,error:w}=q({queryKey:["shipments"],queryFn:N.getAll,refetchInterval:15e3}),b=M({mutationFn:({id:t,status:d})=>N.updateStatus(t,{status:d}),onSuccess:()=>{s.invalidateQueries({queryKey:["shipments"]})}}),y=g.useMemo(()=>m?m.filter(t=>{const d=l===""||t.customerName.toLowerCase().includes(l.toLowerCase())||t.customerPhone.includes(l)||t.deliveryAddress.toLowerCase().includes(l.toLowerCase())||t.items.some(x=>{var p;return(((p=x.inventoryItem)==null?void 0:p.name)||"").toLowerCase().includes(l.toLowerCase())}),o=r==="ALL"||t.status===r;return d&&o}):[],[m,l,r]),k=async t=>{try{n(t);const d=await N.getWaybillData(t);W(d)}catch(d){console.error("Ошибка при получении данных путевого листа:",d),alert("Не удалось загрузить данные для печати")}finally{n(null)}},v=(t,d)=>{confirm("Изменить статус отгрузки?")&&b.mutate({id:t,status:d})},P=t=>{const d={PENDING:{label:"Ожидает",color:"bg-yellow-100 text-yellow-800",icon:A},IN_TRANSIT:{label:"В пути",color:"bg-primary/20 text-primary/90",icon:C},DELIVERED:{label:"Доставлено",color:"bg-green-100 text-green-800",icon:D},CANCELLED:{label:"Отменено",color:"bg-red-100 text-red-800",icon:Q}},o=d[t]||d.PENDING,x=o.icon;return e.jsxs("span",{className:`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${o.color}`,children:[e.jsx(x,{className:"w-3 h-3"}),o.label]})};return j?e.jsx("div",{className:"flex items-center justify-center h-64",children:e.jsx(f,{className:"w-8 h-8 animate-spin"})}):w?e.jsx("div",{className:"p-4 bg-red-50 text-red-800 rounded-lg",children:"Ошибка загрузки отгрузок"}):e.jsxs("div",{className:"space-y-4 p-4",children:[e.jsxs("div",{children:[e.jsx("h1",{className:"text-2xl font-bold",children:"Отгрузки со склада"}),e.jsx("p",{className:"text-sm text-muted-foreground",children:"Управление отгрузками и печать путевых листов"})]}),e.jsx(I,{children:e.jsx(L,{className:"p-4",children:e.jsxs("div",{className:"flex flex-wrap gap-3",children:[e.jsx("div",{className:"flex-1 min-w-[250px]",children:e.jsxs("div",{className:"relative",children:[e.jsx(F,{className:"absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4"}),e.jsx(G,{placeholder:"Поиск по клиенту, адресу, товару...",value:l,onChange:t=>z(t.target.value),className:"pl-9"})]})}),e.jsxs("div",{className:"flex gap-2",children:[e.jsx(c,{variant:r==="ALL"?"default":"outline",onClick:()=>u("ALL"),size:"sm",children:"Все"}),e.jsx(c,{variant:r===i.PENDING?"default":"outline",onClick:()=>u(i.PENDING),size:"sm",children:"Ожидает"}),e.jsx(c,{variant:r===i.IN_TRANSIT?"default":"outline",onClick:()=>u(i.IN_TRANSIT),size:"sm",children:"В пути"}),e.jsx(c,{variant:r===i.DELIVERED?"default":"outline",onClick:()=>u(i.DELIVERED),size:"sm",children:"Доставлено"})]})]})})}),e.jsx(I,{children:e.jsxs(L,{className:"p-0",children:[e.jsx("div",{className:"overflow-x-auto",children:e.jsxs("table",{className:"w-full text-sm",children:[e.jsx("thead",{className:"bg-muted/50 border-b",children:e.jsxs("tr",{children:[e.jsx("th",{className:"px-4 py-3 text-left font-medium text-muted-foreground",children:"Дата"}),e.jsx("th",{className:"px-4 py-3 text-left font-medium text-muted-foreground",children:"Заказ"}),e.jsx("th",{className:"px-4 py-3 text-left font-medium text-muted-foreground",children:"Статус"}),e.jsx("th",{className:"px-4 py-3 text-left font-medium text-muted-foreground",children:"Клиент"}),e.jsx("th",{className:"px-4 py-3 text-left font-medium text-muted-foreground",children:"Телефон"}),e.jsx("th",{className:"px-4 py-3 text-left font-medium text-muted-foreground",children:"Адрес"}),e.jsx("th",{className:"px-4 py-3 text-left font-medium text-muted-foreground",children:"Товары"}),e.jsx("th",{className:"px-4 py-3 text-center font-medium text-muted-foreground",children:"Действия"})]})}),e.jsx("tbody",{children:j?e.jsx("tr",{children:e.jsx("td",{colSpan:8,className:"px-4 py-12 text-center",children:e.jsx(f,{className:"w-8 h-8 animate-spin mx-auto"})})}):w?e.jsx("tr",{children:e.jsx("td",{colSpan:8,className:"px-4 py-12 text-center text-red-600",children:"Ошибка загрузки отгрузок"})}):y.length===0?e.jsx("tr",{children:e.jsxs("td",{colSpan:8,className:"px-4 py-12 text-center text-muted-foreground",children:[e.jsx(A,{className:"w-12 h-12 mx-auto mb-2 opacity-50"}),e.jsx("p",{children:l||r!=="ALL"?"Ничего не найдено":"Отгрузок пока нет"})]})}):y.map(t=>{var d,o,x;return e.jsxs("tr",{className:"border-b hover:bg-muted/50",children:[e.jsx("td",{className:"px-4 py-3 whitespace-nowrap",children:e.jsxs("div",{className:"text-xs",children:[_(new Date(t.createdAt),"dd.MM.yyyy",{locale:E}),e.jsx("br",{}),e.jsx("span",{className:"text-muted-foreground",children:_(new Date(t.createdAt),"HH:mm",{locale:E})})]})}),e.jsx("td",{className:"px-4 py-3 whitespace-nowrap",children:t.orderNumber?e.jsx("span",{className:"px-2 py-1 bg-primary/20 text-primary/90 rounded text-xs font-medium",children:t.orderNumber}):e.jsx("span",{className:"text-muted-foreground text-xs",children:"—"})}),e.jsx("td",{className:"px-4 py-3 whitespace-nowrap",children:P(t.status)}),e.jsx("td",{className:"px-4 py-3",children:e.jsx("div",{className:"max-w-[150px] truncate",title:t.customerName,children:t.customerName})}),e.jsx("td",{className:"px-4 py-3 whitespace-nowrap",children:t.customerPhone}),e.jsx("td",{className:"px-4 py-3",children:e.jsx("div",{className:"max-w-[200px] truncate",title:t.deliveryAddress,children:t.deliveryAddress})}),e.jsx("td",{className:"px-4 py-3",children:e.jsx("div",{className:"space-y-1",children:t.items.map(p=>{var S;return e.jsxs("div",{className:"text-xs",children:[e.jsx("span",{className:"font-medium",children:((S=p.inventoryItem)==null?void 0:S.name)||"—"}),e.jsxs("span",{className:"text-muted-foreground",children:[" × ",p.quantity]})]},p.id)})})}),e.jsx("td",{className:"px-4 py-3",children:e.jsxs("div",{className:"flex items-center justify-center gap-1",children:[e.jsx(c,{onClick:()=>k(t.id),disabled:h===t.id,size:"sm",variant:"outline",className:"gap-1",title:"Печать путевого листа",children:h===t.id?e.jsx(f,{className:"w-3 h-3 animate-spin"}):e.jsx(U,{className:"w-3 h-3"})}),t.status===i.PENDING&&e.jsxs(c,{onClick:()=>v(t.id,i.IN_TRANSIT),disabled:b.isPending,size:"sm",className:"gap-1 bg-blue-600 hover:bg-blue-700",title:"Отправить в путь",children:[e.jsx(C,{className:"w-3 h-3"}),e.jsx("span",{className:"hidden sm:inline",children:"В путь"})]}),t.status===i.IN_TRANSIT&&(((d=a==null?void 0:a.role)==null?void 0:d.code)==="MANAGER"||((o=a==null?void 0:a.role)==null?void 0:o.code)==="OWNER"||((x=a==null?void 0:a.role)==null?void 0:x.code)==="SUPER_ADMIN")&&e.jsxs(c,{onClick:()=>v(t.id,i.DELIVERED),disabled:b.isPending,size:"sm",className:"gap-1 bg-green-600 hover:bg-green-700",title:"Отметить как доставлено",children:[e.jsx(D,{className:"w-3 h-3"}),e.jsx("span",{className:"hidden sm:inline",children:"Доставлено"})]})]})})]},t.id)})})]})}),y.length>0&&e.jsxs("div",{className:"px-4 py-3 bg-muted/50 border-t text-sm text-muted-foreground",children:["Показано отгрузок: ",e.jsx("span",{className:"font-semibold",children:y.length}),(l||r!=="ALL")&&m&&e.jsxs("span",{className:"ml-2",children:["из ",m.length]})]})]})})]})};export{O as ShipmentsPage};
