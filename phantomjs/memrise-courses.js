"use strict";
var system = require('system');
var page = require('webpage').create();

function error(message) {
  console.log(JSON.stringify({ isSuccessful: false, error: message }));
  phantom.exit();
}

if(system.args.length < 4) {
  error('parameters are invalid');
}

var username = system.args[1];
var password = system.args[2];
var operation = system.args[3];
var data = null;
var levelId = null;
var courseId = null;
var pronunciations = null;
var soundsPath = null;

if(operation != 'courselist' && operation != 'addwords' && operation != 'justcourselist' && operation != 'addlevelandwords') {
  error('operation is invalid');
} else if(operation == 'addwords') {
  if(system.args.length == 9) {
    data = system.args[4];
    levelId = system.args[5];
    courseId = system.args[6];
    pronunciations = system.args[7];
    soundsPath = system.args[8];
  } else {
    error('parameters are invalid to add words');
  }
} else if(operation == 'addlevelandwords') {
  if(system.args.length == 8) {
    data = system.args[4];
    courseId = system.args[5];
    pronunciations = system.args[6];
    soundsPath = system.args[7];
  } else {
    error('parameters are invalid to add level and words');
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

    var scroller = new WindowScroller();
    scroller.start(function() {
      var coursesContainer = $('.course-cards-component.js-course-cards-component').find('.course-card-container.js-course-card-container');
      var courses = [];
      coursesContainer.each(function(index, item) {
        var element = $(item).find('.card-main-container .wrapper > .detail > .title > a');
        courses.push({ id: $(item).attr('id').replace('course-', ''), title: element.text().trim(), url: element.attr('href') });
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
          editableCourseList.push({ id: courseList[courseIndex].id, title: courseList[courseIndex].title, url: courseList[courseIndex].url, editUrl: editUrl });
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

    $.post('http://www.memrise.com/ajax/level/add_things_in_bulk/', { word_delimiter:'tab', data: decodeURIComponent(data), level_id : levelId }).done(function(data) {
      window.MemriseVocabulary.IsWordsAdded = true;
    });
  }, data, levelId);

  var timeout = 10000; // 10 sec
  var startTime = new Date().getTime();
  var interval = setInterval(function() {
    var isTimedOut = new Date().getTime() - startTime >= timeout;
    var isComplete = page.evaluate(function() {
      return window.MemriseVocabulary && window.MemriseVocabulary.IsWordsAdded;
    });

    if(isComplete) {
      clearInterval(interval);
      onsuccess({data: data, levelId: levelId});
    } else if(isTimedOut) {
      clearInterval(interval);
      onerror('Timeout is occured while adding words');
    }
  }, 250);
}

function addLevel(page, courseId, onsuccess, onerror) {
  page.navigate('http://www.memrise.com/course/' + courseId + '/course/edit/levels/', function(status) {
    if(status == 'success') {
      var lastLevelId = page.evaluate(function() {
        if(!window.MemriseVocabulary) {
          window.MemriseVocabulary = {};
        }
        window.MemriseVocabulary.AddLevelStarted = true;
        return $('.levels > .level:last').attr('data-level-id');
      });

      var isDbFound = page.evaluate(function() {
        var addButtons = $('a[data-role="level-add"]');
        for(var i = 0; i < addButtons.length; i++) {
          if($(addButtons[i]).text().trim().toLowerCase() == 'english') {
            $(addButtons[i]).click();
            return true;
          }
        }
        return false;
      });

      if(isDbFound === false) {
        onerror('Error occured while adding level, cannot find English database');
      } else {
        var timeout = 10000; // 10 sec
        var startTime = new Date().getTime();
        var interval = setInterval(function() {
          var isTimedOut = new Date().getTime() - startTime >= timeout;
          var isComplete = page.evaluate(function() {
            return document.readyState == 'complete' && (!window.MemriseVocabulary || !window.MemriseVocabulary.AddLevelStarted);
          });

          if(isComplete) {
            clearInterval(interval);
            var newLevelId = page.evaluate(function() {
              return $('.levels > .level:last').attr('data-level-id');
            });
            if(lastLevelId != newLevelId) {
              levelId = newLevelId;
              onsuccess(newLevelId);
            } else {
              onerror('Error occured while adding level, cannot add new level');
            }
          } else if(isTimedOut) {
            clearInterval(interval);
            onerror('Timeout is occured while adding level');
          }
        }, 250);
      }
    } else {
      onerror('Error occured while adding level');
    }
  });
}

function addPronunciations(page, onsuccess, onerror) {
  page.navigate('http://www.memrise.com/course/' + courseId + '/course/edit/levels/', function(status) {
    if(status == 'success') {
      page.evaluate(function(levelId) {
        $('#l_' + levelId).find('a[data-role="level-toggle"]').click();
        var interval = setInterval(function() {
          var wordRows = $('#l_' + levelId).find('.table-container .things .thing');
          if(wordRows.length > 0) {
            clearInterval(interval);
            wordRows.each(function(index, item) {
              var word = $(item).find('td.cell.text.column[data-key="1"] .text').text().trim().replace(/ /g, '_');
              if($(item).find('button.btn.btn-mini.dropdown-toggle').text().trim() == 'no audio file') {
                $(item).find('.add_thing_file[type="file"]').attr('id', 'upload_' + word);
              }
            });

            if(!window.MemriseVocabulary) {
              window.MemriseVocabulary = {};
            }
            window.MemriseVocabulary.UploadIDsSet = true;
          }
        }, 250);
      }, levelId);

      var timeout = 10000; // 10 sec
      var startTime = new Date().getTime();
      var interval = setInterval(function() {
        var isTimedOut = new Date().getTime() - startTime >= timeout;
        var isComplete = page.evaluate(function() {
          return window.MemriseVocabulary && window.MemriseVocabulary.UploadIDsSet;
        });

        if(isComplete) {
          clearInterval(interval);
          var prs = JSON.parse(decodeURIComponent(pronunciations));
          prs.forEach(function(item, index) {
            if(item.pronunciation && item.pronunciation.length > 0) {
              page.uploadFile('input#upload_' + item.word.replace(/ /g, '_') + '[type="file"]', soundsPath + '/' + item.word + '.mp3');
            }
          });

          interval = setInterval(function() {
            clearInterval(interval);
            onsuccess();
          }, 10000);
        } else if(isTimedOut) {
          clearInterval(interval);
          onerror('Timeout is occured while uploading pronunciations');
        }
      }, 250);
    } else {
      onerror('Error occured');
    }
  });
}

var flowArray = null;
if(operation == 'justcourselist') {
  flowArray = [
    { func: getLoginPage, params: [page] },
    { func: submitLoginInfo, params: [page, username, password] },
    { func: getCourseList, params: [page] },
    { func: getEditableCourses, params: function(courseList) { return [page, courseList]; } }
  ];
}
else if(operation == 'courselist') {
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
    { func: addPronunciations, params: [page] }
  ];
} else if(operation == 'addlevelandwords') {
  flowArray = [
    { func: getLoginPage, params: [page] },
    { func: submitLoginInfo, params: [page, username, password] },
    { func: addLevel, params: [page, courseId] },
    { func: addBulkWords, params: function(newLevelId) { return [page, data, newLevelId]; } },
    { func: addPronunciations, params: [page] }
  ];
}

var flow = new Flow({
  flow : flowArray
});

flow.start();
