# generate Re:VIEW file from Markdown text
node ./md2re/main.js

# from https://github.com/vvakame/docker-review#%E4%BD%BF%E3%81%84%E6%96%B9
docker run --rm -v `pwd`/review:/work vvakame/review /bin/sh -c "cd /work && review-pdfmaker config.yml"

# end
mv ./review/book-of-space.pdf .
