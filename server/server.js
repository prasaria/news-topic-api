require('./config/config');

const _ = require('lodash');
const {ObjectID} = require('mongodb');
const express = require('express');
const bodyParser = require('body-parser');

const {mongoose} = require('./db/mongoose');
const {News} = require('./models/news');
const {Topic} = require('./models/topic');


var app = express();
const port = process.env.PORT;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//assumption there is no duplicate for property of array of object reference in each model

//create news with its related topics and automatically updated the reference in the topics document too
app.post('/news', (req, res) => {
    var news = new News({
      title: req.body.title,
      description: req.body.description,
      _relatedTopics: req.body._relatedTopics
    });
    
    news.save().then((doc) => {
        
        news._relatedTopics.forEach((n) => {
          Topic.findById(n).then((topic) => {        
            if (!topic) {
              News.findByIdAndRemove(doc._id).then((news) => {
                if (!news) {
                  return res.status(404).send();
                }
            
                res.status(400).send();
              }).catch((e) => {
                res.status(400).send();
              });
              return res.status(404).send();
            }

            News.findById(doc._id).then((news) => {
              if (!news) {
                return res.status(404).send();
              }
          
              
              topic._relatedNews = topic._relatedNews.concat(doc._id);
            
             Topic.findByIdAndUpdate(n, {$set: topic}, {new: true}).then((topic) => {
               if (!topic) {
                return res.status(404).send();
               }
             });
            }).catch((e) => {
              res.status(400).send();
            });
            
          });
        });
        
        News.
           findById(doc._id).
           select('_id title description _relatedTopics').
           populate('_relatedTopics','title'). // only works if we pushed refs to children
           exec(function (err, doc) {
             if (err) return handleError(err);
            res.status(200).send({doc});
          });
 
    }, (e) => {
      res.status(400).send(e);
    });
});

//create topic but without any related news, because insertion always coming from news
app.post('/topics', (req, res) => {
    var topic = new Topic({
      title: req.body.title,
    });
 
    topic.save().then((topic) => {

      Topic
         .findById(topic._id)
         .select('_id title description _relatedTopics')
         .populate('_relatedTopics','title') // only works if we pushed refs to children
         .exec(function (err, doc) {
             if (err) return handleError(err);
            res.status(200).send({doc});
          });
    }, (e) => {
      res.status(400).send(e);
    });
});

//fetch all topics
app.get('/topics', (req, res) => {   
  Topic.find().select('_id title').then((topics) => {
    res.send({topics});
  }, (e) => {
    res.status(400).send(e);
  });
  
});

//fetch all news
app.get('/news', (req, res) => {
  News.find().select('_id title description').then((news) => {
    res.send({news});
  }, (e) => {
    res.status(400).send(e);
  });    
});

//fetch a news
app.get('/news/:newsid', (req, res) => {
  
  var newsid = req.params.newsid;

  if (!ObjectID.isValid(newsid)) {
    return res.status(404).send();
  }

  News.findById(newsid).then((news) => {
    if (!news) {
      return res.status(404).send();
    }

    var body = _.pick(news, ['_id', 'title', 'description']);

    res.send(body);
  }).catch((e) => {
    res.status(400).send();
  });

});

//fetch a topic
app.get('/topics/:topicsid', (req, res) => {
  
  var topicsid = req.params.topicsid;

  if (!ObjectID.isValid(topicsid)) {
    return res.status(404).send();
  }

  Topic.findById(topicsid).then((topic) => {
    if (!topic) {
      return res.status(404).send();
    }

    var body = _.pick(topic, ['_id', 'title']);

    res.send(body);
  }).catch((e) => {
    res.status(400).send();
  });
});

//Fetch a news with all of its related topics
app.get('/news/:newsid/topics', (req, res) => {
  var newsid = req.params.newsid;

  if (!ObjectID.isValid(newsid)) {
    return res.status(404).send();
  }

  News.
      findById(newsid).
      select('_id title description _relatedTopics').
      populate('_relatedTopics', 'title'). // only works if we pushed refs to children
      exec(function (err, data) {
        if (err) return res.status(400).send(err);
        res.send(data);
      });
});

//Fetch a topic with all of its related news
app.get('/topics/:topicsid/news', (req, res) => {
  var topicsid = req.params.topicsid;

  if (!ObjectID.isValid(topicsid)) {
    return res.status(404).send();
  }
  Topic.
      findById(topicsid).
      select('_id title _relatedNews').
      populate('_relatedNews', 'title description'). // only works if we pushed refs to children
      exec(function (err, data) {
        if (err) return res.status(400).send(err);
        res.send(data);
      });
});

//fetch a topic with its specific news
app.get('/topics/:topicsid/news/:newsid', (req, res) => {
   var newsid = req.params.newsid;
   var topicsid = req.params.topicsid;
  
   if(ObjectID.isValid(topicsid) && ObjectID.isValid(newsid))
   {
      Topic.
          findById(topicsid).
          select('_relatedNews').
          populate({
            path: '_relatedNews',
            match: {'_id': newsid},
            select:'title description -_id'
          }).
          exec(function (err, data) {
              if (err) return res.status(400).send(err);
              res.send(data);
          });
   }
   else {
    return res.status(404).send();
   }

});

//fetch a news with its specific topics
app.get('/news/:newsid/topics/:topicsid', (req, res) => {
   var newsid = req.params.newsid;
   var topicsid = req.params.topicsid;

   if(ObjectID.isValid(topicsid) && ObjectID.isValid(newsid))
   {
      News.
        findById(newsid).
        select('_relatedTopics').
        populate({
           path: '_relatedTopics',
           match: {'_id': topicsid},
           select:'title -_id'
        }).
        exec(function (err, data) {
            if (err) return res.status(400).send(err);
            res.send(data);
        });
   }
   else {
    return res.status(404).send();
   }
});

//update a news
app.patch('/news/:newsid', (req, res) => {

  var newsid = req.params.newsid;
  var body = _.pick(req.body, ['title', 'description']);

  if (!ObjectID.isValid(newsid)) {
    return res.status(404).send();
  }

  News.findByIdAndUpdate(newsid, {$set: body}, {new: true}).select('_id title description').then((news) => {
    if (!news) {
      return res.status(404).send();
    }

    res.send({news});
  }).catch((e) => {
    res.status(400).send();
  })

});

//update a topic
app.patch('/topics/:topicsid', (req, res) => {

  var topicsid = req.params.topicsid;
  var body = _.pick(req.body, ['title']);

  if (!ObjectID.isValid(topicsid)) {
    return res.status(404).send();
  }

  Topic.findByIdAndUpdate(topicsid, {$set: body}, {new: true}).select('_id title').then((topic) => {
    if (!topic) {
      return res.status(404).send();
    }

    res.send({topic});
  }).catch((e) => {
    res.status(400).send();
  });

});

//add a single element of topics to a news
app.put('/news/:newsid/topics/:topicsid', (req, res) => {
  var topicsid = req.params.topicsid;
  var newsid = req.params.newsid;

  if(ObjectID.isValid(topicsid) && ObjectID.isValid(newsid)){
     
    News.findById(newsid).then((news) => {
      console.log(news.title);
      news._relatedTopics = news._relatedTopics.concat(topicsid);
      console.log(news._relatedTopics);
      News.findByIdAndUpdate(newsid, {$set: news}, {new: true}).then((datanews) => {
          if (!datanews)
          {
            return res.status(404).send();
          }

          Topic.findById(topicsid).then((topic) => {
            console.log(topic.title);
            topic._relatedNews = topic._relatedNews.concat(newsid);
            console.log(topic._relatedNews);
            Topic.findByIdAndUpdate(topicsid, {$set: topic}, {new: true}).then((datatopic) => {
                if (!datatopic)
                {
                  return res.status(404).send();
                }
      
                res.send(datatopic);
            });
      
          }).catch((e) => {
            res.status(400).send();
          });
          res.send(datanews);
      });

    }).catch((e) => {
      res.status(400).send();
    });
  }
  else {
    return res.status(404).send();
  }

});

//add a single element of news to a topic
app.put('/topics/:topicsid/news/:newsid', (req, res) => {
  var topicsid = req.params.topicsid;
  var newsid = req.params.newsid;

  if(ObjectID.isValid(topicsid) && ObjectID.isValid(newsid)){
     
    Topic.findById(topicsid).then((topic) => {
      console.log(topic.title);
      topic._relatedNews = topic._relatedNews.concat(newsid);
      console.log(topic._relatedNews);
      Topic.findByIdAndUpdate(topicsid, {$set: topic}, {new: true}).then((datatopic) => {
          if (!datatopic)
          {
            return res.status(404).send();
          }

          News.findById(newsid).then((news) => {
            console.log(news.title);
            news._relatedTopics = news._relatedTopics.concat(topicsid);
            console.log(news._relatedTopics);
            News.findByIdAndUpdate(newsid, {$set: news}, {new: true}).then((datanews) => {
                if (!datanews)
                {
                  return res.status(404).send();
                }
      
                res.send(datanews);
            });
      
          }).catch((e) => {
            res.status(400).send();
          });

          res.send(datatopic);
      });

    }).catch((e) => {
      res.status(400).send();
    });

  }
  else {
    return res.status(404).send();
  }

});

//delete a news and all its references
app.delete('/news/:newsid', (req, res) => {
  var newsid = req.params.newsid;

  if (!ObjectID.isValid(newsid)) {
    return res.status(404).send();
  }else{
    News.findByIdAndRemove(newsid).then((news) => {
       if(!news){
           return res.status(404).send();
       }

       res.send(news);
    }).catch((e) => {
       res.status(400).send();
    });

  }
});

//delete a topic and all its references
app.delete('/topics/:topicsid', (req, res)=> {
  var topicsid = req.params.topicsid;

  if (!ObjectID.isValid(topicsid)) {
    return res.status(404).send();
  }else{
    Topic.findByIdAndRemove(topicsid).then((topic) => {
       if(!topic){
           return res.status(404).send();
       }

       res.send(topic);
    }).catch((e) => {
       res.status(400).send();
    });

  }
});

app.listen(port, () => {
    console.log(`Started on port ${port}`);
});

module.exports = {app};