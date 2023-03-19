docker build -t instabot ./
docker run -p 8080:8080 -e PORT=8080 instabot