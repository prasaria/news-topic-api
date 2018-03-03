require('./config/config');

const _ = require('lodash');
const {ObjectID} = require('mongodb');
const express = require('express');
const bodyParser = require('body-parser');

const {mongoose} = require('./db/mongoose');
const {News} = require('./models/news');


var app = express();
const port = process.env.PORT;

app.use(bodyParser.json());

app.post('/news', (req, res) => {
    var news = new News({
      title: req.body.title,
      description: req.body.description
    });
 
    news.save().then((doc) => {
      res.send(doc);
    }, (e) => {
      res.status(400).send(e);
    });
  });

app.listen(port, () => {
    console.log(`Started on port ${port}`);
});



module.exports = {app};