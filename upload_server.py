#!/usr/bin/env python3
"""Простой сервер для загрузки файлов"""

import http.server
import os
import cgi

UPLOAD_DIR = "/home/itadmin/besedkiemin/uploads"
PORT = 8888

HTML = '''<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Загрузка файла</title>
    <style>
        body { font-family: Arial; max-width: 500px; margin: 50px auto; padding: 20px; }
        h1 { color: #333; }
        input[type=file] { margin: 20px 0; }
        input[type=submit] { background: #4CAF50; color: white; padding: 10px 20px; border: none; cursor: pointer; font-size: 16px; }
        input[type=submit]:hover { background: #45a049; }
        .success { color: green; font-weight: bold; }
    </style>
</head>
<body>
    <h1>Загрузка файла на сервер</h1>
    <form method="POST" enctype="multipart/form-data">
        <input type="file" name="file" required><br>
        <input type="submit" value="Загрузить">
    </form>
    {message}
</body>
</html>
'''

class UploadHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/html; charset=utf-8')
        self.end_headers()
        self.wfile.write(HTML.format(message="").encode())

    def do_POST(self):
        ctype, pdict = cgi.parse_header(self.headers['Content-Type'])
        if ctype == 'multipart/form-data':
            pdict['boundary'] = pdict['boundary'].encode()
            fields = cgi.parse_multipart(self.rfile, pdict)

            if 'file' in fields:
                file_data = fields['file'][0]

                # Получаем имя файла из Content-Disposition
                content_disp = self.headers.get('Content-Disposition', '')
                filename = "uploaded_file"

                # Парсим multipart вручную для получения имени файла
                content_length = int(self.headers['Content-Length'])

                # Сохраняем файл
                os.makedirs(UPLOAD_DIR, exist_ok=True)

                # Используем временное имя или из формы
                import time
                filename = f"upload_{int(time.time())}.xlsx"

                filepath = os.path.join(UPLOAD_DIR, filename)
                with open(filepath, 'wb') as f:
                    f.write(file_data if isinstance(file_data, bytes) else file_data.encode())

                message = f'<p class="success">Файл загружен: {filepath}</p>'
            else:
                message = '<p style="color:red">Ошибка загрузки</p>'
        else:
            message = '<p style="color:red">Неверный формат</p>'

        self.send_response(200)
        self.send_header('Content-type', 'text/html; charset=utf-8')
        self.end_headers()
        self.wfile.write(HTML.format(message=message).encode())

if __name__ == '__main__':
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    server = http.server.HTTPServer(('0.0.0.0', PORT), UploadHandler)
    print(f"Сервер запущен: http://localhost:{PORT}")
    print(f"Файлы сохраняются в: {UPLOAD_DIR}")
    server.serve_forever()
