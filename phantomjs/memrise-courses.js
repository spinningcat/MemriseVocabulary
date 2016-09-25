"use strict";
var system = require('system');
var page = require('webpage').create();

function error(message) {
  console.log(JSON.stringify({ isSuccessful: false, error: message }));
  phantom.exit();
}

if(system.args.length != 4 && system.args.length != 6) {
  error('parameters are invalid');
}

var username = system.args[1];
var password = system.args[2];
var operation = system.args[3];
var data = null;
var levelId = null;

if(operation != 'courselist' && operation != 'addwords') {
  error('operation is invalid');
} else if(operation == 'addwords') {
  if(system.args.length == 6) {
    data = system.args[4];
    levelId = system.args[5];
  } else {
    error('parameters are invalid to add words');
  }
}

(function(page) {
  var _page = page;
  var timeout = 10000;

  function onError() {

  }

  function onResourceError() {

  }

  function navigate(url, callback) {
    var _url = url;
    var _callback = callback;

    //console.log('page.navigate ' + _url);

    _page.evaluate(function(url) {
      if(!window.MemriseVocabulary) {
        window.MemriseVocabulary = {};
      }
      window.MemriseVocabulary.IsNavigationStarted = true;
      window.location.href = url;
    }, _url);

    var initTime = new Date().getTime();
    var interval = setInterval(function () {

      //console.log('page.navigate.interval ' + _url);

      var timeoutOccured = new Date().getTime() - initTime > timeout;
      if(_page.evaluate(function() { return (!window.MemriseVocabulary || !window.MemriseVocabulary.IsNavigationStarted) && document.readyState == 'complete'; } )) {
        clearInterval(interval);
        _callback('success');
      } else if(timeoutOccured) {
        clearInterval(interval);
        _callback('timeout');
      }
    }, 250);
  }

  _page.navigate = navigate;
  _page.onError = onError;
  _page.onResourceError = onResourceError;
})(page);

var Flow = (function(config) {
  var list = [];
  if(config.flow) {
    list = config.flow;
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

    var scroller = new WindowScroller();
    scroller.start(function() {
      var coursesContainer = $('.course-cards-component.js-course-cards-component').find('.course-card-container.js-course-card-container').find('.card-main-container .wrapper > .detail > .title > a');
      var courses = [];
      coursesContainer.each(function(index, item) {
        courses.push({ title: $(item).text().trim(), url: $(item).attr('href') });
      });
      if(!window.MemriseVocabulary) {
        window.MemriseVocabulary = {};
      }
      window.MemriseVocabulary.IsScrollFinised = true;
      window.MemriseVocabulary.CourseList = courses;
      onsuccess(courses);
    });
  });

  var timeout = 10000; // 10 sec
  var startTime = new Date().getTime();
  var interval = setInterval(function() {
    var isTimedOut = new Date().getTime() - startTime >= timeout;
    var isComplete = page.evaluate(function() {
      return window.MemriseVocabulary && window.MemriseVocabulary.IsScrollFinised;
    });

    if(isComplete) {
      clearInterval(interval);
      onsuccess(page.evaluate(function() { return window.MemriseVocabulary.CourseList; }));
    } else if(isTimedOut) {
      clearInterval(interval);
      onerror('Timeout is occured while fetching course list');
    }
  }, 250);
}

function getEditableCourses(page, courseList, onsuccess, onerror) {
  var courseIndex = 0;
  var editableCourseList = [];

  //console.log('getEditableCourses ' + JSON.stringify(courseList));

  function getDetail() {

    //console.log('getEditableCourses.getDetail ' + courseList[courseIndex].url);

    page.navigate(courseList[courseIndex].url, function(status) {

      //console.log('getEditableCourses.getDetail.callback ' + status + ' ' + courseList[courseIndex].url);

      if(status === 'success') {
        var editUrl = page.evaluate(function() {
          return $('.course-tabs-wrap > .container > .right > a.button > span:contains("Edit Course")').parent().attr('href');
        });

        if(editUrl) {
          if(editUrl.indexOf('/') == 0) {
            editUrl = 'http://www.memrise.com' + editUrl;
          }
          editableCourseList.push({ title: courseList[courseIndex].title, url: courseList[courseIndex].url, editUrl: editUrl });
        }

        courseIndex++;
        if(courseIndex < courseList.length) {
          getDetail();
        }
        else {
          onsuccess(editableCourseList);
        }
      } else {
        onerror('Error occured while fetching editable course list at ' + courseList[courseIndex].title);
      }
    });
  }

  getDetail();
}

function getDetailOfCourses(page, editableCourseList, onsuccess, onerror) {
  var courseIndex = 0;
  var editableCourseList = editableCourseList;

  //console.log('getDetailOfCourses ' + JSON.stringify(editableCourseList));

  function getCourseDetail() {

    //console.log('getDetailOfCourses.getCourseDetail ' + editableCourseList[courseIndex].editUrl);

    page.navigate(editableCourseList[courseIndex].editUrl, function(status) {

      //console.log('getDetailOfCourses.getCourseDetail.callback ' + status + ' ' + editableCourseList[courseIndex].editUrl);

      if(status === 'success') {
        var subCourses = page.evaluate(function() {
          var subCourses = [];
          $('#levels > .level').each(function(index, item) {
            var subCourse = $(item);
            subCourses.push({ name: subCourse.find('.level-header > h3.level-name').html().trim(), id: subCourse.attr('data-level-id'), dbId : subCourse.attr('data-pool-id') });
          });
          return subCourses;
        });

        var courseId = page.evaluate(function() {
          return $('body').attr('data-course-id');
        });

        editableCourseList[courseIndex].id = courseId;
        editableCourseList[courseIndex].subCourses = subCourses;
        courseIndex++;
        if(courseIndex < editableCourseList.length) {
          getCourseDetail();
        }
        else {
          onsuccess(editableCourseList);
        }
      } else {
        onerror('Error occured while fetching detail of course');
      }
    });
  }

  getCourseDetail();
}

function addBulkWords(page, data, levelId, onsuccess, onerror) {
  page.evaluate(function(data, levelId) {
    if(!window.MemriseVocabulary) {
      window.MemriseVocabulary = {};
    }
    window.MemriseVocabulary.IsWordsAdded = false;

    $.post('http://www.memrise.com/ajax/level/add_things_in_bulk/', { word_delimiter:'tab', data: data, level_id : levelId }).done(function(data) {
      window.MemriseVocabulary.IsWordsAdded = true;
    });
  }, data, levelId);
}

var flowArray = null;
if(operation == 'courselist') {
  flowArray = [
    { func: getLoginPage, params: [page] },
    { func: submitLoginInfo, params: [page, username, password] },
    { func: getCourseList, params: [page] },
    { func: getEditableCourses, params: function(courseList) { return [page, courseList]; } },
    { func: getDetailOfCourses, params: function(editableCourseList) { return [page, editableCourseList] } }
  ];
} else if(operation == 'addwords') {
  flowArray = [
    { func: getLoginPage, params: [page] },
    { func: submitLoginInfo, params: [page, username, password] },
    { func: addBulkWords, params: [page, data, levelId] },
  ];
}

var flow = new Flow({
  flow : flowArray
});

flow.start();
