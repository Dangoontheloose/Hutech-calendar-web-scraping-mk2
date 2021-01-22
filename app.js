const bodyParser = require('body-parser');
const session = require('express-session');
const { MemoryStore } = require('express-session');
const fs = require('fs');
//ket noi database
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/hutech', { useNewUrlParser: true, useUnifiedTopology: true });
// mongoose.connect('mongodb+srv://Dango:concu269@testcluster.pfa84.mongodb.net/hutech?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error'));



const express = require('express');



const GG = require('./ggUtils');
const hutech = require('./hutechSync');

const app = express();
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.set('view engine', 'ejs');

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true,
    store: new MemoryStore(),
    cookie: {
        maxAge: 60 * 1000 * 3
    }
}));
app.get('/', (req, res) => {
    res.redirect('/login');
})

app.get('/login/auth/google', (req, res) => {
    res.redirect(GG.getAuthURL());
})

app.get('/api/redirect', (req, res) => {
    GG.acquireToken(req.url);
    req.session.googleLoggedIn = true;
    res.redirect('/login');

})

app.get('/login', (req, res) => {
    let studentAccVerified = false;
    let googleAccVerified = false;
    if (req.session.studentLoggedIn) {
        studentAccVerified = true;
    }
    if (req.session.googleLoggedIn) {
        googleAccVerified = true;
    }
    res.render('login', {
        studentAccVerified: studentAccVerified,
        googleAccVerified: googleAccVerified
    });
});

app.post('/login', (req, res) => {

    hutech.getSchedule(req.body.username, req.body.password)
        .then((studentID) => {
            if (studentID != null) {
                req.session.studentLoggedIn = true;
                req.session.studentID = studentID;
                console.log('Xac thuc thanh cong');
            }
            else {
                console.log("Failed");
            }
            res.redirect('/login');
        })

})

app.get('/google/get', (req, res) => {
    GG.createEvents(req.session.studentID);
    res.redirect('/login');
})
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`listening on port ${port}`));
