import express from 'express';
import router from './routes/index';

const server = express();

const PORT = parseInt(process.env.PORT, 10) || 5000;
server.use(express.json());
server.use(router);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default server;
