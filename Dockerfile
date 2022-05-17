FROM node:16-alpine
WORKDIR /app
COPY . .
RUN npm i --no-audit
CMD ["npm", "run", "start"]
EXPOSE 3000
EXPOSE 1122
