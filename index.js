const mtproxy = require('@mtproto-org/mtproxy');
const http = require('http')

mtproxy({
    port: 1122,
    secret: '11112222333344445555666677778888'
})

const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end("Hello, World!");
})

server.listen(3000, () => {
    console.log(`Server listen on 3000!`)
})