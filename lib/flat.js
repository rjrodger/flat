/* Copyright (c) 2010 Richard Rodger */


var sys = require('sys');


var flat = (function() {


  // TODO: 
  // p default should gated as well, ie req p() call
  // making gating a setting?
  // auto invoke? so s(function(){...})() not required? s(fn,false) would defer
  // allow multiple funcs in a single s call - s(fn1,fn2,...) -> s(fn1), s(fn2), ...
  // error handling
  // logging

  function Parallel() {
    var self = this;

    var donefn = null;
    var pars  = 0;

    function parallel(par) { 
      if( 0 < par ) {
	pars--;
      } 
      if( 0 == pars ) {
	donefn && donefn();
      }
    }

    self.work = function( fn, dfn ) {
      if( !fn ) {
	donefn = dfn;
	parallel(0);
      }
      else {
	var par = ++pars;
	return function() { fn.apply(this,arguments); parallel(par); };
      }
    }
  }


  function Serial(rc) {
    var self = this;
    var ctxt = rc;

    var current;
    var stepI = 0;

    self.gatelink = null;

    self.serial = function(link) { 
      sys.puts('serial:'+(link&&link.step)+' gate:'+(link&&link.gate));
      if( !link ) {
	if( self.gatelink ) {
	  link = self.gatelink;
	  self.gatelink = null;
	}
	else {
	  return;
	}
      }

      var i = 0;
      var linkI = link;
      while( linkI.callable && linkI.invoked && !self.gatelink && i < stepI ) {
	i++;
	if( !linkI.done ) {
	  sys.puts('call:'+linkI.step);

	  linkI.done = true;

	  if( linkI.gate && linkI.next ) {
	    self.gatelink = linkI.next;
	  }
	  
	  linkI.fn.apply(this, linkI.args);
	}
	sys.puts('self.gatelink='+(self.gatelink&&self.gatelink.step));

	if( linkI.next ) {
	  linkI = linkI.next;
	  linkI.callable = true;
	}
	else {
	  break;
	}
      }
    }

    self.work = function( arglist ) {
      sys.puts('work:'+stepI+':'+arglist[0]);

      var fn  = arglist[0];
      var dfn = arglist[1];
      var gate = true;

      if( 'function' != typeof fn ) {
	if( 'string' == typeof fn ) {
	  var objstr  = arglist[0];
	  var funcstr = arglist[1];
	  var args = [];
	  for(var aI = 2; aI < arglist.length; aI++) {
	    args[aI-2]=arglist[aI];
	  }
	  fn = function(){
	    var obj = ctxt[objstr];
	    var func = obj[funcstr];
	    func.apply(obj,args);
	  }
	}
	else {
	  gate = arglist[0];
	  fn = arglist[1];
	}
      }

      var link = {callable:false, invoked:false, fn:fn, next:null, step:stepI++, gate:gate};

      if( current ) {
	current.next = link;
      }
      else {
	link.callable = true;
      }

      current = link;

      return function() { 
	sys.puts('invoked:'+link.step);

	var args = [];
	for(var aI = 0; aI < arguments.length; aI++) {
	  args[aI] = arguments[aI];
	}

	link.args = args;
	link.invoked = true;

	self.serial(link); 
      };
    }
  }


  return {
    parallel:function(){
      var p = new Parallel();
      return function(fn,dfn){return p.work(fn,dfn)};
    },
    serial:function(refctxt){
      var s = new Serial(refctxt);
      return function(){
	if( 0 == arguments.length) {
	  sys.puts('ungate: '+(s.gatelink&&s.gatelink.step));
	  s.serial();
	}
	else {
	  return s.work(arguments);
	}
      };
    }};
})();


exports.flat = flat;

