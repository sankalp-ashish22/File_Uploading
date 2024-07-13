const { Redis } = require("redis");
const client = redis.createClient({
    host: 'redis',  
    port: 6379,
  });


client.on('error', (err) => {
    console.error('Redis connection error:', err);
});

client.on('connect', () => {
    console.log('Redis connected');
});
module.exports = client;
