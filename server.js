import express from 'express';
import router from './routes/index';

const server = express();

const PORT = process.env.PORT || 5000;
server.use(express.json());
server.use(router);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default server;
