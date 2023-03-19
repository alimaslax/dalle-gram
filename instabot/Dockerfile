# Use the official lightweight Python image.
# https://hub.docker.com/_/python
FROM python:3.10-slim

RUN apt update && apt install -y --no-install-recommends \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install instabot scripts
COPY ./ /lib/instabot
WORKDIR /lib/instabot

# Install OpenAI Whisper
RUN python3 -m pip install -r requirements.txt

# Expose a PORT to access the python application
EXPOSE $PORT

CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 0 instabot:app --password $PASSWORD

# docker buildx build --platform linux/amd64 -t TAG_NAME .