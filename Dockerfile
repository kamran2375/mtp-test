FROM node:16-alpine
WORKDIR /app
RUN npm i --no-audit
CMD ["npm", "run", "start"]
