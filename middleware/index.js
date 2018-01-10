// all the Middleware goes here
var Campground = require('../models/campground');
var Comment = require('../models/comment');

var middlewareObj = {};

middlewareObj.checkCampgroundOwnership = function(req, res, next) {
    // check if user is logged in
    if (req.isAuthenticated()) {
        // find the camp
        Campground.findById(req.params.id, function (err, camp) {
            if (err || !camp) {
                req.flash('error', "Campground not found");
                res.redirect('back');
            } else {
                // check if the current user owns the campground
                if (camp.author.id.equals(req.user._id) || req.user.isAdmin) {
                    next();
                } else {
                    req.flash('error', "You don't have permission to do that");
                    res.redirect('back');
                }
            }
        });

    } else {
        // not logged in then
        req.flash('error', "You need to be logged in to do that");
        res.redirect('back');
    }
}

middlewareObj.checkCommentOwnership = function(req, res, next) {
    if (req.isAuthenticated()) {
        //find the comment
        Comment.findById(req.params.comment_id, function (err, comment) {
            if (err || !comment) {
                req.flash('error', "Comment not found");
                res.redirect('back');
            } else {
                // check if the current logged user owns the comment
                if (comment.author.id.equals(req.user._id) || req.user.isAdmin) {
                    next();
                } else {
                    req.flash('error', "You don't have permission to do that");
                    res.redirect('back');
                }
            }
        });
    } else {
        req.flash('error', "You need to be logged in to do that");
        res.redirect('back');
    }
}

middlewareObj.isLoggedIn = function(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash('error', "You need to be logged in to do that");
    res.redirect('/login');
}




module.exports = middlewareObj;