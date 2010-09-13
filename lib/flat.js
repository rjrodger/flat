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

    function parallel() { 
      pars--;
      if( 0 == pars ) {
	donefn && donefn();
      }
    }

    self.define = function( fn, dfn ) {
      if( !fn ) {
	donefn = dfn;
	parallel();
      }
      else {
	++pars;
	return function() { fn.apply(this,arguments); };
      }
    }
  }


  function Serial() {
    var self = this;

    var stepI   = 0;
    var curdef  = null;
    var curact  = null;
    var running = false;

    self.serial = function() { 
      running = false;
      var act = curact;
      
      /*
      if( act && 'done' == act.state ) {
	sys.puts(' done:'+act.step);
	act = curact = curact.next;
      }

      if( act && 'applied' == act.state ) {
	sys.puts(' applied:'+act.step);
	act.state = 'done';
      }
      */

      if( act && 'invoked' == act.state ) {
	sys.puts(' invoked:'+act.step);
	act.state = 'applied';
	running = true;
	curact = curact.next;
	act.fn.apply(this,act.args);
      }
    }


    self.define = function( arglist ) {
      sys.puts('define:'+stepI+':'+arglist[0]);

      var fn  = arglist[0];
      var act = {fn:fn, next:null, step:stepI++, state:'defined'};

      if( curdef ) {
	curdef.next = act;
	curdef = act;
      }
      else {
	curdef = act;
      }

      if( !curact ) {
	curact = act;
      }

      return function() { 
	sys.puts('invoked:'+act.step);

	var args = [];
	for(var aI = 0; aI < arguments.length; aI++) {
	  args[aI] = arguments[aI];
	}

	act.args = args;
	act.state = 'invoked';

	if( !running ) {
	  self.serial();
	}
      }
    }
  }


  return {
    parallel:function(){
      var p = new Parallel();
      return function(fn,dfn){return p.define(fn,dfn)};
    },
    serial:function(refctxt){
      var sI = 0;
      var s = new Serial(refctxt);
      return function(){
	var aI = -1;
	if( 1 == arguments.length && typeof arguments[0] == 'number' ) {
	  aI = arguments[0];
	}
	sys.puts('aI='+aI);


	if( 0 == arguments.length || -1 < aI) {
	  sys.puts('s('+aI+','+(sI++)+')');
	  s.serial();
	}
	else {
	  return s.define(arguments);
	}
      };
    }};
})();


exports.flat = flat;

