/**
 * Module dependencies.
 */
const express = require('express');
const compression = require('compression');
const session = require('express-session');
const bodyParser = require('body-parser');
const logger = require('morgan');
const chalk = require('chalk');
const errorHandler = require('errorhandler');
const lusca = require('lusca');
const dotenv = require('dotenv');
const MongoStore = require('connect-mongo')(session);
const flash = require('express-flash');
const path = require('path');
const mongoose = require('mongoose');
const passport = require('passport');
const expressValidator = require('express-validator');
const expressStatusMonitor = require('express-status-monitor');
const sass = require('node-sass-middleware');
const cors = require('cors');
const moment = require('moment');
var multer = require('multer');
var fs = require('fs');
const pathModule = require('path')

let {
  PythonShell
} = require('python-shell')
const upload = multer({
  dest: path.join(__dirname, 'uploads')
});

/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 */
dotenv.load({
  path: '.env.example'
});

/**
 * Controllers (route handlers).
 */
const homeController = require('./controllers/home');
const userController = require('./controllers/user');
const apiController = require('./controllers/api');
const contactController = require('./controllers/contact');
const groupController = require('./controllers/groups');

const bookController = require('./controllers/Book');

const swig = require('swig');
/**
 * API keys and Passport configuration.
 */
const passportConfig = require('./config/passport');

/**
 * Create Express server.
 */

var app = express();
var http = require('http').Server(app);

// const httpsOptions = {
//   cert:   fs.readFileSync("./ssl/nginx.crt", 'utf8'),
//   key: fs.readFileSync("./ssl/nginx.key", 'utf8')
// }
//
// var https = require('https').Server(httpsOptions, app);

var cameras_list = []

app.use(cors())
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

/**
 * Connect to MongoDB.
 */
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useNewUrlParser', true);
mongoose.connect(process.env.MONGODB_URI);
mongoose.connection.on('error', (err) => {
  console.error(err);
  console.log('%s MongoDB connection error. Please make sure MongoDB is running.', chalk.red('✗'));
  process.exit();
});

/**
 * Express configuration.
 */
app.set('host', process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0');
app.set('port', process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8084);
app.set('views', path.join(__dirname, 'views'));
app.engine('html', swig.renderFile);
app.set('view engine', 'html');
app.use(expressStatusMonitor());
app.use(compression());
app.use(sass({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public')
}));
app.use(logger('dev'));
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({
//   extended: true
// }));

app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

app.use(expressValidator());
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: process.env.SESSION_SECRET,
  cookie: {
    maxAge: 1209600000
  }, // two weeks in milliseconds
  store: new MongoStore({
    url: process.env.MONGODB_URI,
    autoReconnect: true,
  })
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});
app.use((req, res, next) => {
  // After successful login, redirect back to the intended page
  if (!req.user &&
    req.path !== '/login' &&
    req.path !== '/signup' &&
    !req.path.match(/^\/auth/) &&
    !req.path.match(/\./)) {
    req.session.returnTo = req.originalUrl;
  } else if (req.user &&
    (req.path === '/account' || req.path.match(/^\/api/))) {
    req.session.returnTo = req.originalUrl;
  }
  next();
});

app.use('/jsp/public', express.static(path.join(__dirname, 'public')));
app.use('/jsp/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/jsp/', express.static(path.join(__dirname, 'public'), {
  maxAge: 31557600000
}));
app.use('/jsp/js/lib', express.static(path.join(__dirname, 'node_modules/chart.js/dist'), {
  maxAge: 31557600000
}));
app.use('/jsp/js/lib', express.static(path.join(__dirname, 'node_modules/popper.js/dist/umd'), {
  maxAge: 31557600000
}));
app.use('/jsp/js/lib', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/js'), {
  maxAge: 31557600000
}));
app.use('/jsp/js/lib', express.static(path.join(__dirname, 'node_modules/jquery/dist'), {
  maxAge: 31557600000
}));
app.use('/jsp/webfonts', express.static(path.join(__dirname, 'node_modules/@fortawesome/fontawesome-free/webfonts'), {
  maxAge: 31557600000
}));

/**
 * Primary app routes.
 */
app.get('/jsp/login', userController.getLogin);
app.post('/jsp/login', userController.postLogin);
app.get('/jsp/logout', userController.logout);
app.get('/jsp/forgot', userController.getForgot);
app.post('/jsp/forgot', userController.postForgot);
app.get('/jsp/reset/:token', userController.getReset);
app.get('/jsp/signup', userController.getSignup);
app.post('/jsp/reset/:token', userController.postReset);
app.post('/jsp/signup', userController.postSignup);
app.get('/jsp/contact', contactController.getContact);
app.post('/jsp/contact', contactController.postContact);
app.get('/jsp/account', passportConfig.isAuthenticated, userController.getAccount);
app.post('/jsp/account/profile', passportConfig.isAuthenticated, userController.postUpdateProfile);
app.post('/jsp/account/password', passportConfig.isAuthenticated, userController.postUpdatePassword);
app.post('/jsp/account/delete', passportConfig.isAuthenticated, userController.postDeleteAccount);
app.get('/jsp/account/unlink/:provider', passportConfig.isAuthenticated, userController.getOauthUnlink);
app.get('/jsp/user/:id', passportConfig.isAuthenticated, userController.getInfo);

/**
 * HTML Serving app routes.
 */
app.get('/jsp/', homeController.index);
app.get('/jsp/loginPage', homeController.login);
app.get('/jsp/uploadPage', homeController.upload);
app.get('/jsp/bookPage', homeController.bookPage);
/**
 * Book logic routes.
 */
app.get('/jsp/book/', bookController.getAllBooks);
app.post('/jsp/book/upload', bookController.uploadBook);

/**
 * Error Handler.
 */
if (process.env.NODE_ENV === 'development') {
  // only use in development
  app.use(errorHandler());
} else {
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).send('Server Error');
  });
}

/**
 * Start Express server.
 */
app.listen(app.get('port'), () => {
  console.log('%s Dashboard Node Cluster is running at http://localhost:%d in %s mode', chalk.green('✓'), app.get('port'), app.get('env'));
  console.log(' Press CTRL-C to stop\n');
});

module.exports = app;
