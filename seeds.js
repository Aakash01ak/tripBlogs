var mongoose = require("mongoose");
var Blog = require("./models/blog");
var Comment = require("./models/comment");

var data = [
    {
        name: "Taj Mahal",
        image: "https://www.photosforclass.com/download/pixabay-1030894?webUrl=https%3A%2F%2Fpixabay.com%2Fget%2F57e0d643425ba814f6da8c7dda793f7f1636dfe2564c704c7d287dd0914fc458_1280.jpg&user=Free-Photos",
        description: "msti msti msti........ taj mahal"
    },
    {
        name: "Eiffel Tower",
        image: "https://www.photosforclass.com/download/pixabay-3349075?webUrl=https%3A%2F%2Fpixabay.com%2Fget%2F55e3d14a4a55a914f6da8c7dda793f7f1636dfe2564c704c7d287dd0914ec258_1280.jpg&user=TheDigitalArtist",
        description: "msti msti msti.......... eiffel tower"
    },
    {
        name: "Burj Khalifa",
        image: "https://www.photosforclass.com/download/pixabay-1420494?webUrl=https%3A%2F%2Fpixabay.com%2Fget%2F57e4d7434e5ba814f6da8c7dda793f7f1636dfe2564c704c7d287dd09148cd5c_1280.jpg&user=smarko",
        description: "msti msti msti.......burj khalifa"
    }
]

function seedDB(){
Blog.remove({},function(err){
    if(err){
        console.log(err);
    }else{
        console.log("Removed all blogs");
        data.forEach(function(seed){
            Blog.create(seed,function(err,blog){
                if(err){
                    console.log(err);
                }else{
                    console.log("Added a blog");
                    Comment.create(
                        {
                            text: "Maja aaya ghum ke....maja",
                            author:"XYZ"
                        },function(err,comment){
                            if(err){
                                console.log(err);
                            }else{
                                blog.comments.push(comment);
                                blog.save();
                                console.log("Created a new comment");
                            }
                        }
                    )
                }
            });
        });
    }
});
}



module.exports = seedDB;
