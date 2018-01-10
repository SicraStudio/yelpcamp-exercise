var mongoose = require('mongoose');
var Campground = require('./models/campground');
var Comment = require('./models/comment');

var data = [
    {
        name: "Happy Farm Camp",
        image: "https://farm6.staticflickr.com/5187/5623797406_ea91016ac3.jpg",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed placerat odio a odio tempus, cursus posuere ante placerat. Nulla posuere condimentum metus, vel malesuada massa feugiat ac. Aenean pulvinar dui vel pretium eleifend. Donec massa lorem, convallis id ornare nec, cursus non quam. Fusce varius gravida justo, ac egestas justo. Donec eget tellus sit amet justo sodales imperdiet vel eu urna. Quisque id ante eros. Nullam facilisis tellus in luctus sollicitudin. Fusce nec laoreet mi, quis tincidunt turpis. Fusce consequat massa id pulvinar posuere. Nunc lectus mauris, auctor et vestibulum id, auctor quis quam. Vestibulum blandit dolor eget faucibus vehicula. Vestibulum viverra cursus dui, at fringilla neque viverra sed. Sed ullamcorper pharetra enim, in rhoncus elit pharetra id. Duis euismod aliquet condimentum."
    },
    {
        name: "Tree's Fall Rest",
        image: "https://farm5.staticflickr.com/4076/4819277877_109e312af2.jpg",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed placerat odio a odio tempus, cursus posuere ante placerat. Nulla posuere condimentum metus, vel malesuada massa feugiat ac. Aenean pulvinar dui vel pretium eleifend. Donec massa lorem, convallis id ornare nec, cursus non quam. Fusce varius gravida justo, ac egestas justo. Donec eget tellus sit amet justo sodales imperdiet vel eu urna. Quisque id ante eros. Nullam facilisis tellus in luctus sollicitudin. Fusce nec laoreet mi, quis tincidunt turpis. Fusce consequat massa id pulvinar posuere. Nunc lectus mauris, auctor et vestibulum id, auctor quis quam. Vestibulum blandit dolor eget faucibus vehicula. Vestibulum viverra cursus dui, at fringilla neque viverra sed. Sed ullamcorper pharetra enim, in rhoncus elit pharetra id. Duis euismod aliquet condimentum."
    },
    {
        name: "Heaven Side Campground",
        image: "https://farm4.staticflickr.com/3832/9603531635_e348167e39.jpg",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed placerat odio a odio tempus, cursus posuere ante placerat. Nulla posuere condimentum metus, vel malesuada massa feugiat ac. Aenean pulvinar dui vel pretium eleifend. Donec massa lorem, convallis id ornare nec, cursus non quam. Fusce varius gravida justo, ac egestas justo. Donec eget tellus sit amet justo sodales imperdiet vel eu urna. Quisque id ante eros. Nullam facilisis tellus in luctus sollicitudin. Fusce nec laoreet mi, quis tincidunt turpis. Fusce consequat massa id pulvinar posuere. Nunc lectus mauris, auctor et vestibulum id, auctor quis quam. Vestibulum blandit dolor eget faucibus vehicula. Vestibulum viverra cursus dui, at fringilla neque viverra sed. Sed ullamcorper pharetra enim, in rhoncus elit pharetra id. Duis euismod aliquet condimentum."
    }
];

function seedDB() {
    // Remove all campgrounds
    Campground.remove({}, function(err) {
        if (err) {
            console.log(err);
        } else {
            console.log("removed campgrounds!!!!");
            // add a few campgrounds
            data.forEach(function(seed) {
                Campground.create(seed, function(err, campground) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log("-> added " + campground.name + " to DB");
                        // create comment for each campground
                        Comment.create(
                            {
                                text: "This place is awesome, but I wish it had internet...",
                                author: "Homer"
                            }, function(err, comment) {
                                    if (err) {
                                        console.log(err);
                                    } else {
                                        /* solution to error on adding comments by Michael */
                                        /* https://www.udemy.com/the-web-developer-bootcamp/learn/v4/questions/3296326 */
                                        Campground.findOneAndUpdate(
                                            {_id: campground._id },
                                            {$push: {comments: comment}},
                                            function(){
                                                console.log("  -> created comment 1 on " + campground.name);
                                            }
                                        );
                                        // campground.comments.push(comment);
                                        // campground.save();
                                        // console.log("  -> created comment 1 on " + campground.name);
                                    }
                        });
                    };
                })
            });
        }
    });
}

module.exports = seedDB;
