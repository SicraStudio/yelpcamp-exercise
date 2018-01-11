var express = require('express');
var router = express.Router();
var passport = require('passport');
var User = require('../models/user');
var Campground = require('../models/campground');
var async = require('async');
var nodemailer = require('nodemailer');
var crypto = require('crypto');

// landing page
router.get('/', function (req, res) {
    res.render('landing');
});

// ========================================
// AUTH ROUTES
// ========================================

// SHOW THE REGISTER FORM
router.get('/register', function (req, res) {
    res.render('register', { page: 'register' });
});

// HANDLE SIGN UP LOGIC
router.post('/register', function (req, res) {
    var newUser = new User({
        username: req.body.username,
        avatar: req.body.avatar,
        firstName: req.body.first_name,
        lastName: req.body.last_name,
        email: req.body.email
     });
    var pass = req.body.password;

    if (req.body.admin_code === process.env.ADMINSECRETCODE) {
        newUser.isAdmin = true;
    }

    User.register(newUser, pass, function (err, user) {
        if (err) {
            console.log(err);
            return res.render('register', { error: err.message });
        }
        passport.authenticate('local')(req, res, function () {
            req.flash('success', "Successfully Signed Up! Nice to meet you " + user.username);
            res.redirect('/campgrounds');
        });
    });
});

// SHOW THE LOGIN FORM
router.get('/login', function (req, res) {
    res.render('login', { page: 'login' });
});

// HANDLE LOGIN LOGIC
router.post('/login', passport.authenticate('local',
    {
        successRedirect: '/campgrounds',
        failureRedirect: '/login'
    }), function (req, res) {
});

// LOGOUT LOGIC
router.get('/logout', function (req, res) {
    req.logout();
    req.flash('success', "Logged you out!");
    res.redirect('/campgrounds');
});

// FORGOT PASSWORD
router.get('/forgot', function(req, res) {
    res.render('forgot');
});

router.post('/forgot', function(req, res) {

    async.waterfall([
        function(done) {
            crypto.randomBytes(20, function(err, buf) {
                var token = buf.toString('hex');
                done(err, token);
            });
        },
        function(token, done) {
            User.findOne({ email: req.body.email}, function(err, user) {
                if (!user) {
                    req.flash('error', 'no account with that email address exists.');
                    return res.redirect('/forgot');
                }

                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

                user.save(function(err) {
                    done(err, token, user);
                });
            });
        },
        function(token, user, done) {
            var stmpTransport = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: process.env.MAIL_ADDRESS,
                    pass: process.env.GMAILPW
                }
            });
            var mailOptions = {
                to: user.email,
                from: process.env.MAIL_ADDRESS,
                subject: 'YelpCamp Password Reset',
                text: 'You are receiving this because you (or someone else) have requested the reset of your password in our site.' + '\n\n' +
                    'Please, click on the following link, or paste this into your web browser to complete the process: ' +'\n' +
                    'http://' + req.headers.host + '/reset/' + token + '\n\n' +
                    'If you did not request this, please ignore this email and your password will remain unchanged.'
            };
            stmpTransport.sendMail(mailOptions, function(err) {
                console.log('--> mail sent');
                req.flash('success', 'An email has been sent to ' + user.email + ' with further instructions.');
                done(err, 'done');
            });
        }
    ], function(err){
        if (err) return next(err); // TODO: check if is 'done' instead of 'next'
        res.redirect('/forgot');
    });


});

router.get('/reset/:token', function(req, res) {
    User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if(!user) {
            req.flash('error', 'Password reset token is invalid or has expired.');
            return res.redirect('/forgot');
        }
        res.render('reset', {token: req.params.token});
    });
});

router.post('/reset/:token', function(req, res) {

    async.waterfall([
        function(done) {
            User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function (err, user) {
                if (!user) {
                    req.flash('error', 'Password reset token is invalid or has expired.');
                    return res.redirect('back');
                }
                if (req.body.password === req.body.confirm) {
                    user.setPassword(req.body.password, function(err) {
                        user.resetPasswordToken = undefined;
                        user.resetPasswordExpires = undefined;

                        user.save(function(err) {
                            req.logIn(user, function(err) {
                                done(err, user);
                            });
                        });
                    });
                } else {
                    req.flash('error', 'Passwords do not match.');
                    return res.redirect('back');
                }
            });
        },
        function (user, done) {
            var stmpTransport = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: process.env.MAIL_ADDRESS,
                    pass: process.env.GMAILPW
                }
            });
            var mailOptions = {
                to: user.email,
                from: process.env.MAIL_ADDRESS,
                subject: 'Your Password in YelpCamp has been changed',
                text: 'Hello,\n\n' + 
                    'This is a confirmation that the password for your account ' + user.email + ' has just been cahnged.\n\n' + 
                    'Best Regards,\n' +
                    'YelpCamp Team'
            };
            stmpTransport.sendMail(mailOptions, function (err) {
                console.log('--> confirmation mail sent');
                req.flash('success', 'Success! Your password has been changed');
                done(err);
            });
        }
    ], function(err) {
        res.redirect('/campgrounds');
    });


});


// USER PROFILE
router.get('/users/:id', function(req, res) {
    User.findById(req.params.id, function(err, foundUser) {
        if (err) {
            req.flash('error', err.message);
            res.redirect('/');
        } else {
            Campground.find().where('author.id').equals(foundUser._id).exec(function (err, campgrounds) {
                if (err) {
                    req.flash('error', err.message);
                    res.redirect('/');
                } else {
                    res.render('users/show', { user: foundUser, campgrounds: campgrounds });
                }
            });
        }
    });
});

module.exports = router;