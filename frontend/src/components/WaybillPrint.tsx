import React from 'react';

interface WaybillData {
  shipmentId: string;
  shipmentDate: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryDate?: string;
  items: {
    name: string;
    quantity: number;
    productType: string;
  }[];
  orderNumber: string;
  shippedBy: string;
  notes?: string;
}

interface WaybillPrintProps {
  data: WaybillData;
}

export const WaybillPrint: React.FC<WaybillPrintProps> = ({ data }) => {
  return (
    <div className="waybill-print" style={{
      width: '210mm',
      minHeight: '297mm',
      padding: '20mm',
      backgroundColor: 'white',
      color: 'black',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Заголовок */}
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 10px 0' }}>
          ПУТЕВОЙ ЛИСТ
        </h1>
        <p style={{ fontSize: '14px', margin: 0 }}>
          № {data.shipmentId}
        </p>
        <p style={{ fontSize: '12px', margin: '5px 0 0 0' }}>
          от {new Date(data.shipmentDate).toLocaleDateString('ru-RU')}
        </p>
      </div>

      {/* Информация о заказе */}
      <div style={{ marginBottom: '25px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px', borderBottom: '2px solid #000', paddingBottom: '5px' }}>
          Информация о заказе
        </h2>
        <table style={{ width: '100%', fontSize: '12px' }}>
          <tbody>
            <tr>
              <td style={{ padding: '5px 10px 5px 0', fontWeight: 'bold', width: '40%' }}>
                Номер заказа:
              </td>
              <td style={{ padding: '5px 0' }}>{data.orderNumber}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Информация о получателе */}
      <div style={{ marginBottom: '25px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px', borderBottom: '2px solid #000', paddingBottom: '5px' }}>
          Информация о получателе
        </h2>
        <table style={{ width: '100%', fontSize: '12px' }}>
          <tbody>
            <tr>
              <td style={{ padding: '5px 10px 5px 0', fontWeight: 'bold', width: '40%' }}>
                Получатель:
              </td>
              <td style={{ padding: '5px 0' }}>{data.customerName}</td>
            </tr>
            <tr>
              <td style={{ padding: '5px 10px 5px 0', fontWeight: 'bold' }}>
                Телефон:
              </td>
              <td style={{ padding: '5px 0' }}>{data.customerPhone}</td>
            </tr>
            <tr>
              <td style={{ padding: '5px 10px 5px 0', fontWeight: 'bold' }}>
                Адрес доставки:
              </td>
              <td style={{ padding: '5px 0' }}>{data.deliveryAddress}</td>
            </tr>
            {data.deliveryDate && (
              <tr>
                <td style={{ padding: '5px 10px 5px 0', fontWeight: 'bold' }}>
                  Дата доставки:
                </td>
                <td style={{ padding: '5px 0' }}>
                  {new Date(data.deliveryDate).toLocaleDateString('ru-RU')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Список товаров */}
      <div style={{ marginBottom: '25px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px', borderBottom: '2px solid #000', paddingBottom: '5px' }}>
          Список товаров
        </h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}>
                №
              </th>
              <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}>
                Наименование
              </th>
              <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}>
                Тип продукта
              </th>
              <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>
                Количество
              </th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, index) => (
              <tr key={index}>
                <td style={{ border: '1px solid #000', padding: '8px' }}>
                  {index + 1}
                </td>
                <td style={{ border: '1px solid #000', padding: '8px' }}>
                  {item.name}
                </td>
                <td style={{ border: '1px solid #000', padding: '8px' }}>
                  {item.productType}
                </td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>
                  {item.quantity}
                </td>
              </tr>
            ))}
            <tr style={{ fontWeight: 'bold', backgroundColor: '#f9f9f9' }}>
              <td colSpan={3} style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>
                ИТОГО:
              </td>
              <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>
                {data.items.reduce((sum, item) => sum + item.quantity, 0)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Примечания */}
      {data.notes && (
        <div style={{ marginBottom: '25px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px', borderBottom: '2px solid #000', paddingBottom: '5px' }}>
            Примечания
          </h2>
          <p style={{ fontSize: '12px', margin: 0, whiteSpace: 'pre-wrap' }}>
            {data.notes}
          </p>
        </div>
      )}

      {/* Подписи */}
      <div style={{ marginTop: '50px' }}>
        <table style={{ width: '100%', fontSize: '12px' }}>
          <tbody>
            <tr>
              <td style={{ width: '50%', paddingRight: '20px' }}>
                <div style={{ marginBottom: '40px' }}>
                  <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>
                    Отпустил (складист):
                  </p>
                  <p style={{ margin: '0 0 20px 0' }}>{data.shippedBy}</p>
                  <div style={{ borderBottom: '1px solid #000', marginBottom: '5px' }}></div>
                  <p style={{ margin: 0, fontSize: '10px', color: '#666' }}>
                    (подпись)
                  </p>
                </div>
              </td>
              <td style={{ width: '50%', paddingLeft: '20px' }}>
                <div style={{ marginBottom: '40px' }}>
                  <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>
                    Получил:
                  </p>
                  <p style={{ margin: '0 0 20px 0' }}>&nbsp;</p>
                  <div style={{ borderBottom: '1px solid #000', marginBottom: '5px' }}></div>
                  <p style={{ margin: 0, fontSize: '10px', color: '#666' }}>
                    (подпись)
                  </p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Дата получения */}
      <div style={{ marginTop: '20px' }}>
        <p style={{ fontSize: '12px', margin: 0 }}>
          Дата получения: ___________________
        </p>
      </div>
    </div>
  );
};

// Функция для печати путевого листа
export const printWaybill = (data: WaybillData) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Не удалось открыть окно печати. Проверьте настройки блокировки всплывающих окон.');
    return;
  }

  const content = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Путевой лист № ${data.shipmentId}</title>
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
            <p style="font-size: 14px; margin: 0;">№ ${data.shipmentId}</p>
            <p style="font-size: 12px; margin: 5px 0 0 0;">от ${new Date(data.shipmentDate).toLocaleDateString('ru-RU')}</p>
          </div>

          <div style="margin-bottom: 25px;">
            <h2 style="font-size: 16px; font-weight: bold; margin-bottom: 10px; border-bottom: 2px solid #000; padding-bottom: 5px;">Информация о заказе</h2>
            <table style="width: 100%; font-size: 12px;">
              <tbody>
                <tr>
                  <td style="padding: 5px 10px 5px 0; font-weight: bold; width: 40%;">Номер заказа:</td>
                  <td style="padding: 5px 0;">${data.orderNumber}</td>
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
                  <td style="padding: 5px 0;">${data.customerName}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 10px 5px 0; font-weight: bold;">Телефон:</td>
                  <td style="padding: 5px 0;">${data.customerPhone}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 10px 5px 0; font-weight: bold;">Адрес доставки:</td>
                  <td style="padding: 5px 0;">${data.deliveryAddress}</td>
                </tr>
                ${data.deliveryDate ? `
                <tr>
                  <td style="padding: 5px 10px 5px 0; font-weight: bold;">Дата доставки:</td>
                  <td style="padding: 5px 0;">${new Date(data.deliveryDate).toLocaleDateString('ru-RU')}</td>
                </tr>
                ` : ''}
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
                ${data.items.map((item, index) => `
                <tr>
                  <td style="border: 1px solid #000; padding: 8px;">${index + 1}</td>
                  <td style="border: 1px solid #000; padding: 8px;">${item.name}</td>
                  <td style="border: 1px solid #000; padding: 8px;">${item.productType}</td>
                  <td style="border: 1px solid #000; padding: 8px; text-align: center;">${item.quantity}</td>
                </tr>
                `).join('')}
                <tr style="font-weight: bold; background-color: #f9f9f9;">
                  <td colspan="3" style="border: 1px solid #000; padding: 8px; text-align: right;">ИТОГО:</td>
                  <td style="border: 1px solid #000; padding: 8px; text-align: center;">
                    ${data.items.reduce((sum, item) => sum + item.quantity, 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          ${data.notes ? `
          <div style="margin-bottom: 25px;">
            <h2 style="font-size: 16px; font-weight: bold; margin-bottom: 10px; border-bottom: 2px solid #000; padding-bottom: 5px;">Примечания</h2>
            <p style="font-size: 12px; margin: 0; white-space: pre-wrap;">${data.notes}</p>
          </div>
          ` : ''}

          <div style="margin-top: 50px;">
            <table style="width: 100%; font-size: 12px;">
              <tbody>
                <tr>
                  <td style="width: 50%; padding-right: 20px;">
                    <div style="margin-bottom: 40px;">
                      <p style="margin: 0 0 5px 0; font-weight: bold;">Отпустил (складист):</p>
                      <p style="margin: 0 0 20px 0;">${data.shippedBy}</p>
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
  `;

  printWindow.document.write(content);
  printWindow.document.close();

  // Ждем загрузки и печатаем
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
      // Закрываем окно после печати (опционально)
      // printWindow.close();
    }, 250);
  };
};
