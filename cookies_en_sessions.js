var Sequelize = require('sequelize');
var express = require('express');
var bodyParser = require('body-parser');
var session = require('express-session');

var connectionString = 'postgres://' + process.env.POSTGRES_USER + ':' + process.env.POSTGRES_PASSWORD + '@localhost/blog';

console.log(connectionString)

var sequelize = new Sequelize('blog', process.env.POSTGRES_USER, process.env.POSTGRES_PASSWORD, {
    host: 'localhost',
    dialect: 'postgres',
    define: {
        timestamps: false
    }
});

const Cars = sequelize.define('autos', {
    kleur: Sequelize.STRING,
    prijs: Sequelize.INTEGER
});

var User = sequelize.define('user', {
    name: Sequelize.STRING,
    email: Sequelize.STRING,
    password: Sequelize.STRING
});

var Post = sequelize.define('post', {
    body: Sequelize.STRING,
    userId: Sequelize.INTEGER
});

var Comment = sequelize.define('comment', {
    body: Sequelize.STRING
});

User.hasMany(Post);
User.hasMany(Comment);
Post.hasMany(Comment);
Post.belongsTo(User);
Comment.belongsTo(User);
Comment.belongsTo(Post);

var app = express();

app.use(bodyParser.urlencoded({ extended: true })); 

//inserting middelware session, defined on top
app.use(session({
    secret: 'oh wow very secret much security', //session id made secure
    resave: true,
    saveUninitialized: false
}));

app.set('views', './src/views');
app.set('view engine', 'pug');

app.get('/', function (request, response) {
    response.render('index');
});

app.get('/signup', function (request, response) {
    response.render('signup');
});

app.get('/about', function (request, response) {
    response.render('about');
});

app.get('/home', function (request, response) {
    response.render('home');
});

app.get('/allposts', function (request, response) {
    Post.findAll({
        include: [
            User,
            { model: Comment, include: User } 
        ],
        order: [
            ['id', 'DESC'],
            [ Comment, 'id', 'ASC']
        ]
    }).then(function (all) {
        response.render('allposts', {posts: all});
    });

   // response.render('/allposts', {posts: testposts});
});


app.get('/myposts', function (request, response) {
    console.log(request.session.user)
    Post.findAll({
        where: {
            userId: request.session.user.id
        },
        include: [
            User,
            { model: Comment, include: User } 
        ],
        order: [
            ['id', 'DESC'],
            [ Comment, 'id', 'ASC']
        ]
    }).then(function (myposts) {
        response.render('allposts', {posts: myposts});
    });

   // response.render('/allposts', {posts: testposts});
});

app.post('/postblog', function (request, response) {
    Post.create({
        body: request.body.blogpost,
        userId: request.session.user.id
    }).then(function (user) {
        response.redirect('allposts');
    });
    
});

app.post('/addcomment', function (request, response) {
    Comment.create({
        body: request.body.comment,
        postId: request.body.postid,
        userId: request.session.user.id
    }).then(function (user) {
        response.redirect('allposts');
    });
    
});

app.post('/addnewuser', function(request, response) {
 //check bestaand adres, maybe.findOne?   
    //console.log("reached")
    User.create({
        name: request.body.user,
        email: request.body.email,
        password: request.body.password
    }).catch(err => {
        console.log(err)
    })
    response.redirect('/');
});


//check if user exists
app.get('/profile', function (request, response) {
    var user = request.session.user;
    if (user === undefined) {
        response.redirect('/?message=' + encodeURIComponent("Please log in to view your profile."));
    } else {
        response.render('profile', {
            user: user
        });
    }
});

app.post('/login', bodyParser.urlencoded({extended: true}), function (request, response) {
    User.findOne({
        where: {
            email: request.body.email
        }
    }).then(function (user) {
        if (user !== null && request.body.password === user.password) {
            request.session.user = user; //session starts when you log in
            response.redirect('/profile');
        } else { //! dit bericht wordt niet op het scherm gelogd, niet duidelijk wat de user verkeerd heeft gedaan
            response.redirect('/?message=' + encodeURIComponent("Invalid email or password."));
        }
    }, function (error) { //beter to use .catch ipv deze functie
        response.redirect('/?message=' + encodeURIComponent("Invalid email or password."));
    });
});

app.get('/signout', function (request, response) {
    request.session.destroy(function(error) { // finishing session
        if(error) {
            throw error;
        }
        response.redirect('/?message=' + encodeURIComponent("Successfully logged out."));
    })
});
//create the new user
app.post('/users',bodyParser.urlencoded({extended: true}), function (request, response) {
    User.create({
        name: request.body.name,
        email: request.body.email,
        password: request.body.password
    }).then(function (user) {
        response.redirect('/users/' + user.id);
    });
});

sequelize.sync({force: false}).then(function () { 
    var server = app.listen(3000, function () {
        console.log('Example app listening on port: ' + server.address().port);
    });
})
    /*
    Promise.all([
        Cars.create({
            kleur: "zwart",
            prijs: 800
        }),
        Cars.create({
            kleur: "beige",
            prijs: 120
        })
    ]).then(function(result) {
        Cars.findAll().then(function(cars) {
            console.log('showing all cars');
            console.log(cars.length);
            cars.forEach(function(car) {
                console.log(car.kleur);
                console.log(car.prijs);
            });
        });
    });
    */
