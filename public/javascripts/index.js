var username = '';
var password = '';

var memrise = null;
var englishMeanings = null;
var turkishMeanings = null;

var wordList = [];

function AfterLogin() {
  $('#level').html('');

  var options = '<option value="-1">Please select course</option>';
  memrise.forEach(function(item, index) {
    options += '<option value="' + item.id + '">' + item.title + '</option>';
  });
  $('#course').html(options);

  $('#loginForm').hide();
  $('#searchForm').show();
  $('#wordListForm').show();
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
  $('#level').html('');
  if(course && memrise) {
    memrise.forEach(function(item, index) {
      if(item.id == course) {
        var options = '<option value="-1">Please select level</option>';
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

  $('#english').prop('checked', '');
  $('#turkish').prop('checked', '');
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

function getSelectedDefinition() {
  var meanings = null;
  if($('#english').prop('checked')) {
    meanings = englishMeanings;
  } else if($('#turkish').prop('checked')) {
    meanings = turkishMeanings;
  }

  var definition = null;
  var selectedDefinition = $('#meaning').val();
  meanings.definitions.forEach(function(item, index) {
    if(item.id == selectedDefinition) {
      definition = { definition: item.definition, example: item.example };
    }
  });

  if(definition) {
    definition.word = meanings.word;
    if(englishMeanings && englishMeanings.word == meanings.word) {
      definition.pronunciation = englishMeanings.pronunciation;
    }
  }
  return definition;
}

function renderWordList() {
  var html = '';
  wordList.forEach(function(item, index) {
    html += '<div class="container word-line">';
    html += '<div class="row">';
    html += '<div class="col-lg-2 col-xs-12 word">' + item.word + '</div>';
    html += '<div class="col-lg-10 col-xs-12">' + item.definition + '</div>';
    html += '</div>';
    html += '<div class="row">';
    html += '<div class="col-lg-2 hidden-xs"></div>';
    html += '<div class="col-lg-10 col-xs-12 example">' + item.example + '</div>';
    html += '</div>';
    html += '</div>';
  });
  $('#wordList').html(html);
}

function AddWord() {
  var definition = getSelectedDefinition();
  wordList.push(definition);
  renderWordList();
}

function showLoading() {
  $('#loadingModal').modal('show');
}

function hideLoading() {
  $('#loadingModal').modal('hide');
}

$(document).ready(function() {
  $('#loadingModal').modal({
    backdrop: 'static',
    keyboard: false,
    show: false
  });
});
