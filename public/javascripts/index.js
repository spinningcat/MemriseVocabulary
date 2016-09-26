var username = '';
var password = '';

var memrise = null;
var englishMeanings = null;
var turkishMeanings = null;

function AfterLogin() {
  $('#level').html('');

  var options = '';
  memrise.forEach(function(item, index) {
    options += '<option value="' + item.id + '">' + item.title + '</option>';
  });
  $('#course').html(options);

  $('#loginForm').hide();
  $('#searchForm').show();
}

function Login() {
  username = $('#username').val();
  password = $('#password').val();

  if(!username || !password) {
    alert('Username and password is required');
    return;
  }
  showLoading();
  $.post('/login', { username: username, password: password }).done(function(data) {
    hideLoading();
    if(data.isSuccessful) {
      memrise = data.data;
      AfterLogin();
    } else {
      alert(data.error);
    }
  });
}

function CourseSelected() {
  var course = $('#course').val();
  if(course && memrise) {
    memrise.forEach(function(item, index) {
      if(item.id == course) {
        var options = '';
        item.subCourses.forEach(function(item, index) {
          options += '<option value="' + item.id + '">' + item.name + '</option>';
        });
        $('#level').html(options);
      }
    });
  }
}

function AfterSearch() {
  if(turkishMeanings && englishMeanings) {
    $('#meaningResult').hide();
    $('#meaning').html('');
    $('#searchResult').show();

    hideLoading();
  }
}

function Search() {
  var word = $('#word').val();
  if(!word) {
    alert('Enter word to search');
    return;
  }

  englishMeanings = null;
  turkishMeanings = null;

  $('#searchResult').hide();
  $('#meaningResult').hide();
  $('#meaning').html('');

  showLoading();

  $.get('/q/oxford/' + word).done(function(data) {
    englishMeanings = data;
    AfterSearch();
  });
  $.get('/q/zargan/' + word).done(function(data) {
    turkishMeanings = data;
    AfterSearch();
  });
}

function LanguageChange() {
  var meanings = null;
  if($('#english').prop('checked')) {
    meanings = englishMeanings;
  } else if($('#turkish').prop('checked')) {
    meanings = turkishMeanings;
  }

  if(meanings) {
    var options = '';
    meanings.definitions.forEach(function(item, index) {
      if(item.example)
        options += '<option value="' + item.id + '">' + item.id + ' - ' + item.definition + ' (' + item.example + ')' + '</option>';
      else
        options += '<option value="' + item.id + '">' + item.id + ' - ' + item.definition + '</option>';
    });
    $('#meaning').html(options);
    $('#meaningResult').show();
  }
}

function AddWord() {
  var level = $('#level').val();
  var format= $('#format').val();
  var meaning = $('#meaning').val();

  if(!level || !format || !meaning) {
    alert('course, format and meaning is required');
    return;
  }
}

function showLoading() {
  $('#loadingModal').foundation('reveal','open');
}

function hideLoading() {
  $('#loadingModal').foundation('reveal','close');
}
