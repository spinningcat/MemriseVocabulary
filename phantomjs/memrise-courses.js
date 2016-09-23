"use strict";
var system = require('system');
var page = require('webpage').create();
var username = system.args[1];
var password = system.args[2];

function getLoginPage(page, onsuccess, onerror) {
  var settings = {
    headers: {
      "Cookie": ""
    }
  };

  page.open("https://www.memrise.com/login/", settings, function(status) {
      if ( status === "success" ) {
        if(page.injectJs('../public/javascripts/jquery.js')) {
          onsuccess('Login page of memrise is successfully opened');
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
        if(page.url.indexOf('www.memrise.com/home/') >= 0) {
          onsuccess('Login to memrise is successful');
        }
        else {
          onerror('Login to memrise is failed');
        }
      } else if(isTimedOut) {
        clearInterval(interval);
        onerror('Timeout is occured while submitting login form');
      }
    }, 250);
  } else {
    onerror('Submit form is not recognized.');
  }
}

function getCourseList(page, onsuccess, onerror) {
  page.evaluate(function() {
    var WindowScroller = (function(window, document) {
      return function() {
        var _window = window;
        var _document = document;
        var timeout = 5000;

        function scrollBottom() {
          var bodyHeight = _document.getElementsByTagName('body')[0].scrollHeight;
          _window.scrollTo(0, bodyHeight);
          return bodyHeight;
        }

        function isToGo(preHeight) {
          var bodyHeight = _document.getElementsByTagName('body')[0].scrollHeight;
          return preHeight < bodyHeight;
        }

        this.start = function(onexit) {
          var height = scrollBottom();
          var initTime = new Date().getTime();

          var interval = setInterval(function () {
            if(isToGo(height)) {
              initTime = new Date().getTime();
              height = scrollBottom();
            } else if(new Date().getTime() - initTime > timeout) {
              clearInterval(interval);

              if(onexit) {
                onexit();
              }
            }
          }, 250);
        }
      }
    })(window, document);

    var scroller = new WindowScroller(window, document);
    scroller.start(function() {
      var coursesContainer = $('.course-cards-component.js-course-cards-component').find('.course-card-container.js-course-card-container').find('.card-main-container .wrapper > .detail > .title > a');
      var courses = [];
      coursesContainer.each(function(index, item) {
        courses.push({ title: $(item).text().trim(), url: $(item).attr('href') });
      });

      onsuccess(courses);
    });
  });
}

function getDetailOFEditableCourses(page, courses, onsuccess, onerror) {

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

console.log('asdfasdf');
phantom.exit();

var flow = new Flow({
  flow : [
    { func: getLoginPage, params: [page] },
    //{ func: submitLoginInfo, params: [page, username, password] },
    //{ func: getCourseList, params: [page] },
    //{ func: getCourseList, params: function(data) { return []; } }
  ]
});

flow.start();
