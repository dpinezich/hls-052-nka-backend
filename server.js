import express from 'express';
import bodyParser from 'body-parser';
import logger from 'morgan';
import cors from "cors";

const app = express();
const port = process.env.PORT || 3000;

/**
 * USES PLUGINS
 */
app.use(cors());
app.use(logger('dev'));
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({
  extended: true
})); // for parsing application/x-www-form-urlencoded

/**
 * HANDLE UNEXCEPTED ERRORS
 **/
process.on('uncaughtException', function(error) {
  console.log('uncaughtException - ', error);
});
process.on('unhandledRejection', function(reason) {
  console.log('unhandledRejection - ', reason);
});

/**
 * ROUTES
 */
import routes from './src/routes';
routes(app);

/**
 * SERVER
 */
app.listen(port, () => {
  console.log(`Server is up on port ${port}`);
});
