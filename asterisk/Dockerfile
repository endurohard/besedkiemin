FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

# Установка зависимостей
RUN apt-get update && apt-get install -y \
    build-essential \
    wget \
    libssl-dev \
    libncurses5-dev \
    libnewt-dev \
    libxml2-dev \
    linux-headers-generic \
    libsqlite3-dev \
    uuid-dev \
    libjansson-dev \
    libedit-dev \
    libsrtp2-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Скачиваем и устанавливаем Asterisk
WORKDIR /usr/src
RUN wget https://downloads.asterisk.org/pub/telephony/asterisk/asterisk-20-current.tar.gz && \
    tar -xvf asterisk-20-current.tar.gz && \
    cd asterisk-20.*/ && \
    ./configure --with-jansson-bundled && \
    make menuselect.makeopts && \
    menuselect/menuselect \
        --enable chan_pjsip \
        --enable res_pjsip \
        --enable res_pjsip_session \
        --enable res_pjsip_outbound_registration \
        --enable res_pjsip_transport_websocket \
        --enable res_http_websocket \
        menuselect.makeopts && \
    make && \
    make install && \
    make samples && \
    make config

# Создаем необходимые директории
RUN mkdir -p /var/spool/asterisk/voicemail && \
    mkdir -p /var/log/asterisk && \
    mkdir -p /var/run/asterisk

# Копируем конфигурационные файлы
COPY config/ /etc/asterisk/

# Открываем порты
# 5060 - SIP
# 8088 - HTTP/WebSocket
# 10000-20000 - RTP
EXPOSE 5060/udp 5060/tcp 8088/tcp 10000-20000/udp

# Запускаем Asterisk
CMD ["/usr/sbin/asterisk", "-f", "-vvv", "-c"]
