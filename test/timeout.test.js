/* Copyright (c) 2010 Richard Rodger */

var sys = require('sys');
var flat = require('flat').flat;



module.exports = {

  basic_parallel: function(assert) {
    var bars = [];
    function foo(bar) {
      bars.push(bar);
    }

    var p = flat.parallel();

    var p1 = p( function(bar){foo('1'+bar); p();} );
    var p2 = p( function(bar){foo('2'+bar); p();} );

    p( null, function() {
      assert.eql( ['1a','2b'], bars );
    });

    setTimeout(function(){p1('a');},30);
    setTimeout(function(){p2('b');},60);

  },

  /* wont work - all p or s calls need to be at same stack level
  callbacks_parallel: function(assert) {
    function foo(m,cb) {
      setTimeout( function(){cb(' foo:'+m)},100 );
    }
    function bar(m,cb) {
      setTimeout( function(){cb(' bar:'+m)},100 );
    }

    var msgs = '';

    var p = flat.parallel();
    foo('a',p(function(m){
      msgs+=m;
      bar('b',p(function(m){
	msgs+=m;
      }));
    }));

    p(null, function(){
      assert.equal(' foo:a bar:b', msgs);
    });
  },
  */

  basic_serial: function(assert) {
    var foos = [];
    function bar(foo) {
      foos.push(foo);
    }

    var s = flat.serial();
    sys.puts('CHAIN:'+s.chain);

    var s1 = s( function(foo){ bar('1'+foo); s() } );
    var s2 = s( function(foo){ bar('2'+foo); s() } );
    var s3 = s( function(foo){ bar('3'+foo); s() } );

    s(function() {
      sys.puts('done: '+JSON.stringify(foos));
      assert.eql( ['1a','2b','3c'], foos ); s();
    })();

    setTimeout(function(){s3('c');},100);
    setTimeout(function(){s2('b');},150);
    setTimeout(function(){s1('a');},200);

    s();
  },


  chain_serial: function(assert) {
    var s = flat.serial();
    var m = '';

    s.chain(
      function(){ m+='1';s();}
    )(
      function(){ m+='2';s();}
    )(
      function(){ m+='3';s();}
    )(
      function() {
	sys.puts(m);
	assert.equal('123',m);
      }
    );
  },


  sequence_serial: function(assert) {
    var foos = [];
    function bar(foo) {
      foos.push(foo);
      sys.puts('bar:'+JSON.stringify(foos));
    }

    var seqs = [[0,1,2],[0,2,1],[1,0,2], [1,2,0],[2,0,1], [2,1,0]];
    for( var seqI = 0; seqI < seqs.length; seqI++ ) {
      //if(3==seqI||40==seqI){continue}
      foos = [];
      var seq = seqs[seqI];
      sys.puts('SEQ:'+seqI+':'+JSON.stringify(seq));

      var s = flat.serial();
      var f = [];

      f.push( s( function(foo){ bar('f0'+foo); s();} ) );
      f.push( s( function(foo){ bar('f1'+foo); s();} ) );
      f.push( s( function(foo){ bar('f2'+foo); s();} ) );

      s(function() {
	sys.puts('ASSERT:'+seqI+':'+JSON.stringify(foos));
	assert.eql( ['f0s'+seqI+'i0','f1s'+seqI+'i1','f2s'+seqI+'i2'], foos );
	s(); 
      })();

      for(var fI = 0; fI < seq.length; fI++ ) {
	f[seq[fI]]('s'+seqI+'i'+seq[fI]);
      }
    }

  },

  callbacks_serial: function(assert) {

    function Foo() {
      this.foo = function(t,cb){
	sys.puts('Foo.foo');
	setTimeout(function(){
	  sys.puts('newBar');
	  var bar = new Bar(t);
	  cb(bar);
	},t);
      }
    }

    function Bar(ft) {
      var self = this;
      self.ft = ft;
      self.bar = function(bt,cb){
	sys.puts('Bar.bar');
	setTimeout(function(){
	  cb('bt:'+bt+',ft:'+self.ft);
	},bt);
      }
    }


    var f = new Foo();
    var b;
    
    var s = flat.serial(this);

    f.foo(100,s(function(bar){
      sys.puts('setBar:'+bar);
      b = bar;
      s(); 
    }));

    s(function(){
      b.bar(200,function(m){
	sys.puts(m);
	s(); 
      });
    })();
  },


  /*
  composition: function(assert) {
    var cseq = '';

    function foo(m,t,cb) {
      setTimeout( function(){cseq+=m+'-foo-'+t+' '; cb(' foo:'+m)},t );
    }
    function bar(m,t,cb) {
      setTimeout( function(){cseq+=m+'-bar-'+t+' ';cb(' bar:'+m)},t );
    }
    function zed(m,t,cb) {
      setTimeout( function(){cseq+=m+'-zed-'+t+' ';cb(' zed:'+m)},t );
    }
    
    var msgs = '';

    var sx = flat.serial();
    var s  = flat.serial();
    var p  = flat.parallel();

    foo('a',70,p(function(m){
      msgs+=m;
    }));
    foo('b',100,p(function(m){
      msgs+=m;
    }));
    p(null,s(function(){
      msgs+=' /foo'
    }));

    bar('c',50,s(function(m){
      msgs+=m;
    }));
    s(null,sx(function(){
      msgs+=' /bar';
      assert.equal(' foo:a foo:b /foo bar:c /bar',msgs);
      assert.equal('d-zed-10 c-bar-50 a-foo-70 b-foo-100 ',cseq);
    }));

    zed('d',10,sx(function(m){
      msgs+=m;
    }));
    sx(null,function(){
      msgs+=' /zed';
      assert.equal(' foo:a foo:b /foo bar:c /bar zed:d /zed',msgs);
    });

  },
  */

}
