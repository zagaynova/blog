var Sequelize = require('sequelize');
var express = require('express');
var bodyParser = require('body-parser');
var session = require('express-session');

var connectionString = 'postgres://' + process.env.POSTGRES_USER + ':' + process.env.POSTGRES_PASSWORD + '@localhost/bulletinboard';

console.log(connectionString)

var sequelize = new Sequelize('bulletinboard', process.env.POSTGRES_USER, process.env.POSTGRES_PASSWORD, {
    host: 'localhost',
    dialect: 'postgres',
    define: {
        timestamps: false
    }
});

var User = sequelize.define('user', {
    name: Sequelize.STRING,
    email: Sequelize.STRING,
    password: Sequelize.STRING
});

var app = express();

app.use(session({
    secret: 'oh wow very secret much security',
    resave: true,
    saveUninitialized: false
}));

app.set('views', './src/views');
app.set('view engine', 'pug');

app.get('/', function (request, response) {
    console.log(request.query.message);
    console.log(request.session.user);

    response.render('index', {
        message: 'ja', //request.query.message,
        user: request.session.user
    });
});

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
    if(request.body.email.length === 0) {
        response.redirect('/?message=' + encodeURIComponent("Please fill out your email address."));
        return;
    }

    if(request.body.password.length === 0) {
        response.redirect('/?message=' + encodeURIComponent("Please fill out your password."));
        return;
    }

    User.findOne({
        where: {
            email: request.body.email
        }
    }).then(function (user) {
        if (user !== null && request.body.password === user.password) {
            request.session.user = user;
            response.redirect('/profile');
        } else {
            response.redirect('/?message=' + encodeURIComponent("Invalid email or password."));
        }
    }, function (error) {
        response.redirect('/?message=' + encodeURIComponent("Invalid email or password."));
    });
});

app.get('/logout', function (request, response) {
    request.session.destroy(function(error) {
        if(error) {
            throw error;
        }
        response.redirect('/?message=' + encodeURIComponent("Successfully logged out."));
    })
});

sequelize.sync({force: true}).then(function () {
    User.create({
        name: "stabbins",
        email: "yes@no",
        password: "not_password"
    }).then(function () {
        var server = app.listen(3000, function () {
            console.log('Example app listening on port: ' + server.address().port);
        });
    });
}, function (error) {
    console.log('sync failed: ');
    console.log(error);
});
