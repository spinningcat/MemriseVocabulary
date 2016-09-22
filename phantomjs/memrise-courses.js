"use strict";
var system = require('system');
var page = require('webpage').create();
var username = system.args[1];
var password = system.args[2];

function getCookieString(cookies) {
  var str = '';
  for(var i = 0; i < cookies.length; i++) {
    str += cookies[i].name + '=' + cookies[i].value;
    if(i < cookies.length - 1) {
      str += '; ';
    }
  }
  return str;
}

function getLoginPage(page, onsuccess, onerror) {
  var settings = {
    headers: {
      "Cookie": ""
    }
  };

  page.open("https://www.memrise.com/login/", settings, function(status) {
      if ( status === "success" ) {
        if(page.injectJs('../public/javascripts/jquery.js')) {
          onsuccess();
          return;
        }
      }
      onerror('Login page cannot be opened.');
    });
}

function submitLoginInfo(page, username, password, onsuccess, onerror) {
  var submitResult = page.evaluate(function(username, password) {
    var usernameControl = $('input[name="username"]');
    var passwordControl = $('input[name="password"]');
    var formControl = $('form[action="/login/"]');

    if(usernameControl.length == 1 && passwordControl.length == 1 && formControl.length == 1) {
      window.MemriseVocabulary = { IsFormSubmitted : true };
      usernameControl.val(username);
      passwordControl.val(password);
      formControl.submit();
      return true;
    }
    else {
      return false;
    }
  }, username, password);

  if(submitResult) {
    var timeout = 10000; // 10 sec
    var startTime = new Date().getTime();
    var interval = setInterval(function() {
      var isTimedOut = new Date().getTime() - startTime >= timeout;
      var isComplete = page.evaluate(function() {
        return (!window.MemriseVocabulary || !window.MemriseVocabulary.IsFormSubmitted) && document.readyState == 'complete';
      });

      if(isComplete) {
        clearInterval(interval);
        onsuccess({ url: page.url });
      } else if(isTimedOut) {
        clearInterval(interval);
        onerror('Timeout is occured while submitting login form');
      }
    }, 250);
  } else {
    onerror('Submit form is not recognized.');
  }
}

function getCookie(page, onsuccess, onerror) {
  var cookie = "";

  page.onResourceRequested = function(request) {
    //if(request.url.indexOf('memrise.com/') >= 0) {
      console.log('Request ' + JSON.stringify(request.headers));

    //}
  };

  page.onResourceReceived = function(request) {
    //if(request.url.indexOf('memrise.com/') >= 0) {
      console.log('Response ' + JSON.stringify(request));

    //}
  };

  page.open("http://www.memrise.com/home/", function(status) {
    //page.onResourceRequested = null;

    setTimeout(function() {
      var list = page.evaluate(function() {
        return $('.course-cards-component.js-course-cards-component').html();
      });

      console.log(list);
      phantom.exit();

    },2000);
/*
    if ( status === "success" ) {
      onsucces({ cookie: cookie });
    } else {
      onerror('Error occured while fetching cookie');
    }*/
  });
}

function getCourseList(page, cookie, onsuccess, onerror) {

  page.open("http://www.memrise.com/ajax/courses/dashboard/?courses_filter=most_recent&offset=0&limit=4&get_review_count=false", function(status) {
      if ( status === "success" ) {
        onsucces({ cookie: cookie, result: 'ds' });
      } else {
        onerror('Error occured while fetching courses');
      }
    });
}

var Flow = (function(config) {
  var list = [];
  if(config.flow) {
    list = config.flow;
  }

  function error(message) {
    console.log(JSON.stringify({ isSuccessful: false, error: message }));
    phantom.exit();
  }

  function success(data) {
    console.log(JSON.stringify({ isSuccessful: true, data: data }));
    phantom.exit();
  }

  function next(index, parameters) {

    function nextSuccess(data) {
      if(++i < list.length) {
        if(typeof list[i].params === 'function') {
          next(i, list[i].params(data));
        }
        else {
          next(i);
        }
      }
      else {
        success(data);
      }
    }

    var i = index;
    var params = parameters;
    if(!params) {
      params = list[i].params;
    }
    list[i].func.apply(this, params.concat([nextSuccess, error]));
  }

  this.start = function() {
    if(list.length > 0)
      next(0);
  }
});

var flow = new Flow({
  flow : [
    { func: getLoginPage, params: [page] },
    { func: submitLoginInfo, params: [page, username, password] },
    { func: getCookie, params: [page] }
    //{ func: getCourseList, params: function(data) {  return [page, data.cookie]; } },
  ]
});

flow.start();
