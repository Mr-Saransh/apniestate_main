const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgres://961863b4a209628ca5f4cc52cd53ecd4867b8efd702f3faac442bddc8a968993:sk_HCPevs-xLS1qfZHlsrR79@db.prisma.io:5432/postgres?sslmode=require',
});

client.connect()
  .then(() => {
    console.log('Connected to PostgreSQL successfully!');
    return client.query('SELECT NOW()');
  })
  .then(res => {
    console.log('Current time from DB:', res.rows[0]);
    client.end();
  })
  .catch(err => {
    console.error('Connection error:', err);
    client.end();
  });
