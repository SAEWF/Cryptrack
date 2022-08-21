import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import http from 'http';
import { handleSend, handleForward, handleTrack} from './routes/index.js';

const app = express();

const corsOption = {
    origin: '*',
    optionSuccessStatus: 200,
};

const httpServer = http.createServer(app);

app.use(cors(corsOption));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true, parameterList: 5000 }));

// app.get('/', (req, res) => {
//     res.status(200).send('Welcome to SAEWF');
// });

app.use('/send', handleSend);
app.use('/forward', handleForward);
app.use('/track', handleTrack);

const port = process.env.PORT || 8080;

httpServer.listen(port, () => {
    console.log('http server is running at ', port);
});
