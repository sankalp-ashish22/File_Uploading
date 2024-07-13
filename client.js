const { Redis } = require("ioredis");
const client = redis.createClient({
    host: 'redis',  // Use the service name here
    port: 6379,
  });


client.on('error', (err) => {
    console.error('Redis connection error:', err);
});

client.on('connect', () => {
    console.log('Redis connected');
});
module.exports = client;
