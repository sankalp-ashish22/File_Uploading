const { Redis } = require("ioredis");

const client = new Redis({
    host: `${process.env.REDIS_HOST}`, 
    port: process.env.REDIS_PORT,
    password: `${process.env.REDIS_PASSWORD}`,
});

client.on('error', (err) => {
    console.error('Redis connection error:', err);
});

client.on('connect', () => {
    console.log('Redis connected');
});

module.exports = client;
