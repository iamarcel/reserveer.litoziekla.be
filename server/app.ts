/// <reference path="../typings/index.d.ts" />

import * as express from 'express';

const PORT = 3000;

const app = express();

app.use(express.static('../dist'));

app.listen(PORT, _ => {
    console.log('App listening in port ' + PORT + '!');
});
