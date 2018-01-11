var express        = require('express'),
    app            = express(),
    path           = require('path'),
    favicon        = require('serve-favicon'),
    logger         = require('morgan'),
    cookieParser   = require('cookie-parser'),
    bodyParser     = require('body-parser'),
    mongoose       = require('mongoose'),
    flash          = require('connect-flash'),
    passport       = require('passport'),
    LocalStrategy  = require('passport-local'),
    methodOverride = require('method-override'),
    Campground     = require('./models/campground'),
    Comment        = require('./models/comment'),
    User           = require('./models/user'),
    seedDB         = require('./seeds');

/** dotenv load and config --> add to .gitignore the .env file before github */
require('dotenv').config();

/* REQUIRING ALL ROUTES FILES */
var campgroundRoutes = require('./routes/campgrounds'),
    commentRoutes    = require('./routes/comments'),
    indexRoutes       = require('./routes/index');

console.log(process.env.DATABASEURL);
/* DB SETTING ------- MONGOOSE */
mongoose.Promise = global.Promise;
//mongodb://ss-david:ss-david@ds247317.mlab.com:47317/ss-yelp-camp
mongoose.connect(process.env.DATABASEURL);
//mongoose.connect('mongodb://localhost/yelp_camp_db');
// SEEDING DB ////
// seedDB();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride('_method'));
app.use(flash());

// SESSION & PASSPORT AUTH CONFIG
app.use(require('express-session')({
    secret: "keep keep sicra keep coding",
    resave: false,
    saveUninitialized: false
}));

app.locals.moment = require('moment');

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

/* GLOBAL ROUTE SCOPE VARIABLES  */
// let's say we turn the variables here declarated into a global variable for all the templates
app.use(function(req, res, next) {
    // passing the authenticated or not user to all routes
    res.locals.currentUser = req.user;
    // passing a error message to all routes for using it in flash
    res.locals.error = req.flash('error');
    // passing a success message to all routes for using it in flash
    res.locals.success = req.flash('success');
    next();
});



// USING ROUTES
app.use('/', indexRoutes);
app.use('/campgrounds', campgroundRoutes);
app.use('/campgrounds/:id/comments', commentRoutes);



// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
