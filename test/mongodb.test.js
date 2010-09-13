/* Copyright (c) 2010 Richard Rodger */

var sys = require('sys');
var flat = require('flat').flat;



module.exports = {

  mongodb: function(assert) {
    var Db = require('mongodb').Db;
    var Connection = require('mongodb').Connection;
    var Server = require('mongodb').Server;

    var seq = '';

    var refs = {};

    var s = flat.serial(refs);
    var db = new Db('test_flat_mongo', new Server('localhost', Connection.DEFAULT_PORT, {}), {native_parser:true});

    var dbx;

    db.open( s(function(err, db){
      sys.puts('open');
      seq+='open ';
      dbx = refs.dbx = db;
      s();
    }));

    
    s(function() { 
      dbx.dropDatabase( function(err, result) {
	seq+='dropped ';
	sys.puts('s drop');
	s();
      });
    })();

    var collection;
    var authors = {};


    s(function() { 
      dbx.collection('authors', function(err, coll) {
	if( err ) sys.puts(err);
	seq+='coll ';
	collection = coll;
	s();
      })
    })();


    s(function() { 
      collection.createIndex(["meta", ['_id', 1], ['name', 1], ['age', 1]], function(err, indexName) { 	seq+='index '; s()})
    })();


    s(function(){
      collection.insert([{'name':'AA William Shakespeare', 'email':'william@shakespeare.com', 'age':587},
			 {'name':'BB Jorge Luis Borges', 'email':'jorge@borges.com', 'age':123}], 
			function(err, docs) {
			  docs.forEach(function(doc) {
			    sys.puts(sys.inspect(doc));
			    authors[doc.name] = doc;
			  });
			  seq+='insert ';
			  s();
			})
    })();

    s(function(){
      collection.find({}, {'sort':[['age', 1]]}, function(err, cursor) {
        cursor.each(function(err, author) {
          if(author != null) {
            sys.puts("[" + author.name + "]:[" + author.email + "]:[" + author.age + "]");
          }
	});
	seq+='find ';
	sys.puts('done find');
	s();
      });
    })();

    s(function(){
      dbx.close();
      seq+='closed ';
      assert.equal('open dropped coll index insert find closed ',seq);
      s();
    })();
  }
}
