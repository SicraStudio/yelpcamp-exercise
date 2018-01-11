var express = require('express');
var router = express.Router();
var Campground = require('../models/campground');
var middleware = require('../middleware');
var geocoder = require('geocoder');
// CLOUDINARY SET UP AND FILE
var multer = require('multer');

var storage = multer.diskStorage({
    file: function(req, file, callback) {
        callback(null, Date.now() + file.originalname);
    }
});

var imageFilter = function(req, file, cb) {
    // accept image files only
    if(!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
    
};

var upload = multer({ storage: storage, fileFilter: imageFilter });

var cloudinary = require('cloudinary');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// INDEX - show the camps
router.get('/', function (req, res) {
    console.log(req.query.search);
    if (req.query.search) {
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        Campground.find({ name: regex }, function (err, allCampgrounds) {
            if (err || allCampgrounds.length < 1) {
                console.log(err);
                req.flash('error', 'No campgrounds found!');
                Campground.find({}, function (err, allCampgrounds) {
                    if (err) {
                        console.log(err);
                    } else {
                        res.render('campgrounds/index', { campgrounds: allCampgrounds, page: 'campgrounds' });
                    }
                });
            } else {
                res.render('campgrounds/index', { campgrounds: allCampgrounds, page: 'campgrounds' });
            }
        });
    } else {
        // Get all the campgrounds of the db and render it
        Campground.find({}, function (err, allCampgrounds) {
            if (err) {
                console.log(err);
            } else {
                res.render('campgrounds/index', { campgrounds: allCampgrounds, page: 'campgrounds' });
            }
        });
    }
});

// CREATE - add a new campground to DB
router.post('/', middleware.isLoggedIn, upload.single('image'), function (req, res) {
    // get data from form and add data to the mock array
    //var name = req.body.name;
    //var image = req.body.image;
    //var price = req.body.price;
    //var description = req.body.description;
    /*var author = {
        id: req.user._id,
        username: req.user.username
    }*/
    
    cloudinary.uploader.upload(req.file.path, function(result) {
        // add cloudinary url for the image to the campground object under image property
        req.body.campground.image = result.secure_url;
        // add author
        req.body.campground.author = {
            id: req.user._id,
            username: req.user.username
        }
        // add location parsed to the campground
        console.log(req.body.location);
        geocoder.geocode(req.body.location, function(err, data) {
            console.log(data);
            if (err) {
                console.log(err);
                req.flash('error', err.message);
                return res.redirect('back');
            }
            req.body.campground.lat = data.results[0].geometry.location.lat;
            req.body.campground.lng = data.results[0].geometry.location.lng;
            req.body.campground.location = data.results[0].formatted_address;
            //var newCamp = { name: name, price: price, image: image, description: description, location: location, lat: lat, lng: lng, author: author };
            // create a new camp and save to the database
            Campground.create(req.body.campground, function (err, newCampground) {
                if (err) {
                    console.log(err);
                    req.flash('error', err.message);
                    return res.redirect('back');
                }
                res.redirect('/campgrounds/' + newCampground.id);
            });    
        });
    });
});

// NEW - show form to create camps
router.get('/new', middleware.isLoggedIn, function (req, res) {
    res.render('campgrounds/new');
});

// SHOW - show a detail page of a particular campground
router.get('/:id', function (req, res) {
    // find the campground with provided id
    Campground.findById(req.params.id).populate('comments').exec(function (err, foundCampground) {
        if (err || !foundCampground) {
            console.log(err);
            req.flash('error', "Campground not found");
            res.redirect('back');
        } else {
            // render show template with that campground
            res.render('campgrounds/show', { campground: foundCampground });
        }
    });
});

// EDIT CAMPGROUND ROUTE - shows the edit form and post info to UPDATE route
router.get('/:id/edit', middleware.checkCampgroundOwnership, function(req, res) {

    Campground.findById(req.params.id, function(err, camp) {
        res.render('campgrounds/edit', { campground: camp });
    });
    
});

// UPDATE CAMPGROUND ROUTE
router.put('/:id', middleware.checkCampgroundOwnership, function(req, res) {

    geocoder.geocode(req.body.location, function(err, data) {
        var lat = data.results[0].geometry.location.lat;
        var lng = data.results[0].geometry.location.lng;
        var location = data.results[0].formatted_address;

        var newData = {
            name: req.body.name,
            image: req.body.image,
            price: req.body.price,
            description: req.body.description,
            location: location,
            lat: lat,
            lng: lng
        };
        
        // find and update the correct campground
        Campground.findByIdAndUpdate(req.params.id, {$set: newData}, function (err, updatedCamp) {
            if (err) {
                req.flash("error", err.message);
                res.redirect('back');
            } else {
                req.flash("success", "Succesfully Updated!");
                // then... redirect somewhere (show page)
                res.redirect('/campgrounds/' + updatedCamp._id);
            }
        });
    });
});

// DESTROY CAMPGROUND ROUTE
router.delete('/:id', middleware.checkCampgroundOwnership, function(req, res) {
    Campground.findByIdAndRemove(req.params.id, function(err) {
        if (err) {
            res.redirect('/campgrounds');
        } else {
            res.redirect('/campgrounds');
        }
    })
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

module.exports = router;