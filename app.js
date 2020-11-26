var express = require("express");
var app =express();
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var Blog = require("./models/blog");
var Comment = require("./models/comment");
var passport   = require("passport");
var LocalStategy= require("passport-local");
var User = require("./models/user");
var methodOverride = require("method-override");
var flash = require("connect-flash");
var expressSanitizer = require("express-sanitizer");

//seedDB = require("./seeds");
//seedDB();

// mongoose.connect("mongodb://localhost/tripblog");
mongoose.connect("mongodb+srv://Aakash:<password>@cluster0-xgxgs.mongodb.net/test?retryWrites=true&w=majority",{useNewUrlParser: true,useUnifiedTopology: true});

app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine","ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());
app.use(expressSanitizer());

//PASSPORT CONFIGURATION
app.use(require("express-session")({
   secret : "Dhruv and Kavya are best couples in the world",
   resave : false,
   saveUninitialized : false
  }));
  
  app.use(passport.initialize());
  app.use(passport.session());
  passport.use(new LocalStategy(User.authenticate()));
  passport.serializeUser(User.serializeUser());
  passport.deserializeUser(User.deserializeUser());

  app.use(function(req,res ,next){
   res.locals.currentUser = req.user;
   res.locals.error = req.flash("error");
   res.locals.success = req.flash("success");
   next();
  });

//====================
// BLOG
//====================

//HOME PAGE
app.get("/",function(req,res){
   res.render("home");
});

//INDEX
app.get("/blogs",function(req,res){
   Blog.find({},function(err,allBlogs){
      if(err){
         console.log(err);
      }else{
         res.render("Blogs/blogs",{allBlogs:allBlogs});
      }
   });
});

//FORM TO ADD NEW BLOGS
app.get("/blogs/new",isLoggedIn,function(req,res){
   res.render("Blogs/new");
});

app.post("/blogs",isLoggedIn,function(req,res){
  var name = req.body.name;
  var image = req.body.image;
  var desc = req.body.description;
//   desc = req.sanitize(desc);
  var author = {
   id: req.user._id,
   username : req.user.username
  }
  var newBlog = {name: name,image: image,description: desc,author: author}
  Blog.create(newBlog, function(err, newlyCreated){
     if(err){
        res.render("Blogs/new");
     }else{
      req.flash("success","Successfully added a blog");
        res.redirect("/blogs");
     }
  });
});



//SHOW PAGE
app.get("/blogs/:id",function(req,res){
   Blog.findById(req.params.id).populate("comments").exec(function(err,foundBlog){
      if(err){
         console.log(err);
      }else{
         res.render("Blogs/show",{blog:foundBlog});
      }
   });
});

//EDIT
app.use("/blogs/:id/edit",checkBlogOwnership,function(req,res){
   Blog.findById(req.params.id,function(err,foundBlog){
     if(err){
        console.log(err);
     }else{
      res.render("Blogs/edit",{blog : foundBlog});
     }
   });
});

app.put("/blogs/:id",checkBlogOwnership,function(req,res){
   // req.body.blog.description = req.sanitize(req.body.blog.description);
  Blog.findByIdAndUpdate(req.params.id, req.body.blog, function(err, updatedBlogs){
     if(err){
        console.log(err);
     }else{
        res.redirect("/blogs/"+ req.params.id);
     }
  });
});

app.delete("/blogs/:id",checkBlogOwnership,function(req,res){
   Blog.findByIdAndRemove(req.params.id, function(err){
      if(err){
         console.log(err);
      } else{
         res.redirect("/blogs"); 
      }
   })
});


//=======================
//COMMENTS
//=======================

app.get("/blogs/:id/comments/new", isLoggedIn, function(req,res){
  Blog.findById(req.params.id,function(err,blog){
     if(err){
        console.log(err);
     }else{
        res.render("comments/new",{blog:blog});
     }
  })
});

app.post("/blogs/:id/comments",isLoggedIn,function(req,res){
   Blog.findById(req.params.id,function(err,blog){
      if(err){
         console.log(err);
         res.redirect("/blogs");
      }else{
         //  req.body.comment.text = req.sanitize(req.body.comment.text);
         Comment.create(req.body.comment,function(err,comment){
            if(err){
               req.flash("error","Something went wrong");
               console.log(err);
            }else{
               comment.author.id=req.user._id;
               comment.author.username = req.user.username;
               comment.save();

               blog.comments.push(comment);
               blog.save();
               req.flash("success","Successfully added comment");
               res.redirect('/blogs/'+blog._id);
            }
         });
      }
   });
});

//EDIT UPDATE AND DELETE

app.get("/blogs/:id/comments/:comment_id/edit",checkCommentOwnership,function(req,res){
   Comment.findById(req.params.comment_id, function(err, foundComment){
      if(err){
         res.redirect("back");
      }else{
        res.render("comments/edit", {blog_id: req.params.id, comment:foundComment});
      }
     });
});

app.put("/blogs/:id/comments/:comment_id",checkCommentOwnership, function(req,res){
   // req.body.comment.text = req.sanitize(req.body.comment.text);
   Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updatedComment){
     if(err){
        res.redirect("back");
     }else{
      req.flash("success","Comment successfully updated");
        res.redirect("/blogs/"+ req.params.id);
     }
   });
 });

 app.delete("/blogs/:id/comments/:comment_id",checkCommentOwnership,function(req,res){
   Comment.findByIdAndRemove(req.params.comment_id,function(err){
      if(err){
         res.redirect("back");
      }else{
         req.flash("success","Comment deleted");
         res.redirect("/blogs/"+req.params.id);
      }
   })
 });

//==================
//AUTHENTICATION
//==================

app.get("/register",function(req,res){
    res.render("register");
});

app.post("/register",function(req,res){
   var newUser = new User({username : req.body.username});
   User.register(newUser, req.body.password, function(err ,user){
      if(err){
         req.flash("error", err.message);
          res.redirect("/register");
      }else
      passport.authenticate("local")(req,res, function(){
         req.flash("success","Welcome to tripBlog"+user.username);
         res.redirect("/blogs");
      });
   });
});


app.get("/login",function(req,res){
   res.render("login");
 });

 app.post("/login",passport.authenticate("local",
 {
    successRedirect : "/blogs",
    failureRedirect :"/login"
   }),function(req,res){  
 });

app.get("/logout",function(req,res){
req.logout();
req.flash("success","Logged You Out");
res.redirect("/");
});

//===============
//MIDDLEWARE
//===============

function isLoggedIn(req,res, next){
if(req.isAuthenticated()){
   return next();
}
req.flash("error","You need to be logged in to do that");
res.redirect("/login");
}

function checkBlogOwnership(req,res,next){
   if(req.isAuthenticated()){
      Blog.findById(req.params.id,function(err,blog){
         if(err){
            req.flash("error","Blog not found");
            res.redirect("/back");
         }else{
            if(blog.author.id.equals(req.user._id)){
               next();
            }else{
               req.flash("error","You don't have permission to do that");
               res.redirect("back");
            }
         }
      })
   }else{
      req.flash("error","You need to be logged in to do that")
      res.redirect("back");
   }
}

function checkCommentOwnership(req,res,next){
   if(req.isAuthenticated()){
      Comment.findById(req.params.comment_id,function(err,comment){
         if(err){
            res.redirect("/back");
         }else{
            if(comment.author.id.equals(req.user._id)){
               next();
            }else{
               req.flash("error","You don't have permission to do that");
               res.redirect("back");
            }
         }
      })
   }else{
      req.flash("error","You need to be logged in to that");
      res.redirect("back");
   }
}



app.listen(process.env.PORT,function(){
   console.log("tripBlogs Server has started...")
});