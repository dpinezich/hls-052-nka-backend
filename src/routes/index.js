// Controllers
import Routes from './routes';
import Auth from './auth';

module.exports = app => {
    Routes(app);
    Auth(app);
};
