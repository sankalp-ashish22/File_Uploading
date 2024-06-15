const { Redis } = require("ioredis");
const client = new Redis({
    host: 'localhost',
    port: 6379,
}
);


client.on('error', (err) => {
    console.error('Redis connection error:', err);
});

client.on('connect', () => {
    console.log('Redis connected');
});
module.exports = client;
