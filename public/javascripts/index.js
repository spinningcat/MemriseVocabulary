var username = '';
var password = '';

var englishMeanings = null;
var turkishMeanings = null;

function Login() {
  username = $('#username').val();
  password = $('#password').val();

  $('#loginForm').hide();
  $('#searchForm').show();
  /*
  showLoading();
  $.post('/login', { username: username, password: password }).done(function(data) {
    hideLoading();
    if(data.isSuccessful) {
      $('#loginForm').hide();
      $('#searchForm').show();
    } else {
      alert(data.error);
    }
  });*/
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
  englishMeanings = null;
  turkishMeanings = null;

  $('#searchResult').hide();
  $('#meaningResult').hide();
  $('#meaning').html('');

  showLoading();

  $.get('/q/oxford/' + $('#word').val()).done(function(data) {
    englishMeanings = data;
    AfterSearch();
  });
  $.get('/q/zargan/' + $('#word').val()).done(function(data) {
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

function showLoading() {
  $('#loadingModal').foundation('reveal','open');
}

function hideLoading() {
  $('#loadingModal').foundation('reveal','close');
}
