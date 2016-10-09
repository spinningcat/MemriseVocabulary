var username = '';
var password = '';

var memrise = null;
var englishMeanings = null;
var cambridgeMeanings = null;
var cambridgeTurkishMeanings = null;
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

  memrise = [{"title":"Test","url":"http://www.memrise.com/course/1239080/test/","editUrl":"http://www.memrise.com/course/1239080/test/edit/","id":"1239080","subCourses":[{"dbId":"2210846","id":"4770141","name":"Hebele"},{"dbId":"2210846","id":"4770143","name":"Hubele"}]},{"title":"TOEFL Vocabulary","url":"http://www.memrise.com/course/1222368/toefl-vocabulary/","editUrl":"http://www.memrise.com/course/1222368/toefl-vocabulary/edit/","id":"1222368","subCourses":[{"dbId":"2193641","id":"4719043","name":"Longman Prep. Course for the TOEFL IBT Test"},{"dbId":"2193641","id":"4719053","name":"New level"}]},{"title":"GRE Vocabulary","url":"http://www.memrise.com/course/1208609/gre-vocabulary/","editUrl":"http://www.memrise.com/course/1208609/gre-vocabulary/edit/","id":"1208609","subCourses":[{"dbId":"2179500","id":"4674728","name":"The Official Guide to the GRE"},{"dbId":"2179500","id":"4719046","name":"New level"}]},{"title":"Türkiye'nin Balıkları (Resimli Anlatım)","url":"http://www.memrise.com/course/1184078/turkiyenin-baliklari-resimli-anlatim/","editUrl":"http://www.memrise.com/course/1184078/turkiyenin-baliklari-resimli-anlatim/edit/","id":"1184078","subCourses":[{"dbId":"2154428","id":"4585077","name":"Göçmen Deniz Balıkları"},{"dbId":"2154428","id":"4585078","name":"Yerli Balıklar"},{"dbId":"2154428","id":"4585081","name":"Gezici Veya Uğrayıcı Balıklar"},{"dbId":"2154428","id":"4585085","name":"Tırpanagiller"},{"dbId":"2154428","id":"4585100","name":"Yassı Balıklar veya Yanyüzergiller"},{"dbId":"2154428","id":"4585086","name":"Köpekbalıkları"},{"dbId":"2154428","id":"4585088","name":"Tatlısu Balıkları"},{"dbId":"2154428","id":"4585090","name":"Talassotok Göçmen Balıklar"},{"dbId":"2154428","id":"4585091","name":"Alabalıklar"},{"dbId":"2154428","id":"4585092","name":"Yerli Tatlısu Balıkları"},{"dbId":"2154428","id":"4585094","name":"Dişli Yerli Tatlısu Balıkları"},{"dbId":"2154428","id":"4585096","name":"Balinagiller ve İki yaşayışlılar (Amfibiler)"},{"dbId":"2154428","id":"4585098","name":"Kabuklular ve Yumuşakçalar"}]}];
  AfterLogin();
  hideLoading();

/*
  $.post('/login', { username: username, password: password }).done(function(data) {
    hideLoading();
    if(data.isSuccessful) {
      memrise = data.data;
      AfterLogin();
    } else {
      alert(data.error);
    }
  });
  */
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
  if(turkishMeanings && englishMeanings && cambridgeMeanings && cambridgeTurkishMeanings) {
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
  cambridgeMeanings = null;
  cambridgeTurkishMeanings = null;

  $('#english').prop('checked', '');
  $('#turkish').prop('checked', '');
  $('#cambridge').prop('checked', '');
  $('#cambridge-turkish').prop('checked', '');

  $('#searchResult').hide();
  $('#meaningResult').hide();
  $('#meaning').html('');

  showLoading();

  $.get('/q/oxford/' + word).done(function(data) {
    data.definitions.forEach(function(item, index) {
      item.word = data.word;
      item.pronunciation = data.pronunciation;
      if(item.example) {
        item.text = data.word + ' - ' + item.definition + ' (' + item.example + ')';
      } else {
        item.text = data.word + ' - ' + item.definition;
      }
    });
    englishMeanings = data;
    AfterSearch();
  });
  $.get('/q/zargan/' + word).done(function(data) {
    data.definitions.forEach(function(item, index) {
      item.pronunciation = '';
      item.word = data.word;
      if(item.example) {
        item.text = data.word + ' - ' + item.definition + ' (' + item.example + ')';
      } else {
        item.text = data.word + ' - ' + item.definition;
      }
    });
    turkishMeanings = data;
    AfterSearch();
  });
  $.get('/q/cambridge/' + word.replace(/ /g, '-')).done(function(data) {
    data.definitions.forEach(function(item, index) {
      item.pronunciation = data.pronunciation;
      if(item.example) {
        item.text = item.word + ' (' + item.type + ',' + item.type2 + ') ' + item.definition + ' (' + item.example + ')';
      } else {
        item.text = item.word + ' (' + item.type + ',' + item.type2 + ') ' + item.definition;
      }
    });
    cambridgeMeanings = data;
    AfterSearch();
  });
  $.get('/q/cambridge-turkish/' + word.replace(/ /g, '-')).done(function(data) {
    data.definitions.forEach(function(item, index) {
      item.pronunciation = data.pronunciation;
      if(item.example) {
        item.text = item.word + ' (' + item.type + ',' + item.type2 + ') ' + item.definition + ' (' + item.example + ')';
      } else {
        item.text = item.word + ' (' + item.type + ',' + item.type2 + ') ' + item.definition;
      }
    });
    cambridgeTurkishMeanings = data;
    AfterSearch();
  });
}

function LanguageChange() {
  var meanings = null;
  if($('#english').prop('checked')) {
    meanings = englishMeanings;
  } else if($('#turkish').prop('checked')) {
    meanings = turkishMeanings;
  } else if($('#cambridge').prop('checked')) {
    meanings = cambridgeMeanings;
  } else if($('#cambridge-turkish').prop('checked')) {
    meanings = cambridgeTurkishMeanings;
  }

  if(meanings) {
    var options = '';
    meanings.definitions.forEach(function(item, index) {
      options += '<option value="' + item.id + '">' + item.text + '</option>';
    });
    $('#meaning').html(options);
    $('#meaningResult').show();

    var definition = getSelectedDefinition();
    $('#definition').val(meanings.definitions[0].definition);
    $('#example').val(meanings.definitions[0].example);
  }
}

function getSelectedDefinition() {
  var meanings = null;
  if($('#english').prop('checked')) {
    meanings = englishMeanings;
  } else if($('#turkish').prop('checked')) {
    meanings = turkishMeanings;
  } else if($('#cambridge').prop('checked')) {
    meanings = cambridgeMeanings;
  } else if($('#cambridge-turkish').prop('checked')) {
    meanings = cambridgeTurkishMeanings;
  }

  var definition = null;
  var selectedDefinition = $('#meaning').val();
  meanings.definitions.forEach(function(item, index) {
    if(item.id == selectedDefinition) {
      definition = { word: item.word, definition: item.definition, example: item.example, pronunciation: item.pronunciation };
    }
  });
  
  return definition;
}

function renderWordList() {
  var html = '';
  wordList.reverse().forEach(function(item, index) {
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

function WordSelected() {
  var definition = getSelectedDefinition();
  $('#definition').val(definition.definition);
  $('#example').val(definition.example);
}

function AddWord() {
  var def = getSelectedDefinition();
  var definition = {
    word: def.word,
    definition: $('#definition').val(),
    example: $('#example').val(),
    pronunciation: def.pronunciation
  };
  if(definition.definition) {
    var isExists = false;
    wordList.forEach(function(item, index) {
      if(item.word == definition.word) {
        isExists = true;
        item.definition = definition.definition;
        item.example = definition.example;
        item.pronunciation = definition.pronunciation;
      }
    });
    if(!isExists) {
      wordList.push(definition);
    }
    renderWordList();
  }
  else {
    alert('Enter at least definition');
  }
}

function AddToMemrise() {
  var levelId = $('#level').val();
  var courseId = $('#course').val();
  var format = $('#format').val();
  var data = '';
  var pronunciations = [];

  showLoading();

  wordList.forEach(function(item, index) {
    data += format.toLowerCase().replace(/,/g, '\t').replace(/word/g, item.word).replace(/example/g, item.example).replace(/definition/g, item.definition) + '\n';
    pronunciations.push({
      word: item.word,
      pronunciation: item.pronunciation
    });
  });

  $.post('/addtomemrise', { username: username, password: password, data: encodeURIComponent(data), pronunciations: encodeURIComponent(JSON.stringify(pronunciations)), levelId: levelId, courseId: courseId }).done(function(result) {
    if(result.isSuccessful) {
      $('#searchResult').hide();
      wordList = [];
      renderWordList();
    } else {
      alert(result.error);
    }
    hideLoading();
  });
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
