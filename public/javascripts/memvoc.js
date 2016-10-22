var model = {
  userInfo: {
    username: '',
    password: '',
    courseList: [],
    levelList: [],
    isLoggedIn: false,
    isInLoginProcess: false
  },
  dictionary: {
    wordToAdd: '',
    selectedCourse: '',
    selectedLevel: '',
    format: 'word,definition,,example',

    selectedWordIndex: -1,
    sources: [
      {
        name: 'oxford-en',
        text: 'Oxford English',
        fetch: function(word) {
          var _this = this;
          return new Promise(function(fulfill, reject) {
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
              fulfill({data: data, source: _this.name()});
            });
          });
        }
      },
      {
        name: 'cambridge-en',
        text: 'Cambridge English',
        fetch: function(word) {
          var _this = this;
          return new Promise(function(fulfill, reject) {
            $.get('/q/cambridge/' + word.replace(/ /g, '-')).done(function(data) {
              data.definitions.forEach(function(item, index) {
                item.pronunciation = data.pronunciation;
                if(item.example) {
                  item.text = item.word + ' (' + item.type + ',' + item.type2 + ') ' + item.definition + ' (' + item.example + ')';
                } else {
                  item.text = item.word + ' (' + item.type + ',' + item.type2 + ') ' + item.definition;
                }
              });
              fulfill({data: data, source: _this.name()});
            });
          });
        }
      },
      {
        name: 'cambridge-tr',
        text: 'Cambridge Turkish',
        fetch: function(word) {
          var _this = this;
          return new Promise(function(fulfill, reject) {
            $.get('/q/cambridge-turkish/' + word.replace(/ /g, '-')).done(function(data) {
              data.definitions.forEach(function(item, index) {
                item.pronunciation = data.pronunciation;
                if(item.example) {
                  item.text = item.word + ' (' + item.type + ',' + item.type2 + ') ' + item.definition + ' (' + item.example + ')';
                } else {
                  item.text = item.word + ' (' + item.type + ',' + item.type2 + ') ' + item.definition;
                }
              });
              fulfill({data: data, source: _this.name()});
            });
          });
        }
      },
      {
        name: 'zargan-tr',
        text: 'Zargan Turkish',
        fetch: function(word) {
          var _this = this;
          return new Promise(function(fulfill, reject) {
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
              fulfill({data: data, source: _this.name()});
            });
          });
        }
      }
    ],
    wordList: []
  }
};

(function(model) {

  function showLoading() {
    $('#loadingModal').modal('show');
  }

  function hideLoading() {
    $('#loadingModal').modal('hide');
  }

  $(document).ready(function(){
    viewModel = ko.mapping.fromJS(model);


    viewModel.WordListCount = function() {
      var setCount = 0;
      viewModel.dictionary.wordList().forEach(function(item, index) {
        if(item.selectedDefinition.isDefinitionSet() && item.selectedDefinition.isExampleSet() && item.selectedDefinition.isPronunciationSet()) {
          setCount++;
        }
      });
      return setCount + '/' + viewModel.dictionary.wordList().length
    }
    viewModel.Login = function() {
      if(!viewModel.userInfo.username() || !viewModel.userInfo.password()) {
        alert('Username and password is required');
        return;
      }
      viewModel.userInfo.isInLoginProcess(true);

      setTimeout(function () {
        viewModel.userInfo.isInLoginProcess(false);
      }, 120000);

      $.post('/newlogin', { username: viewModel.userInfo.username(), password: viewModel.userInfo.password() }).done(function(data) {
        viewModel.userInfo.isInLoginProcess(false);
        if(data.isSuccessful) {
          viewModel.userInfo.isLoggedIn(true);
          viewModel.userInfo.courseList(data.data);
        } else {
          alert(data.error);
        }
      });
    }
    viewModel.AddToMemrise = function() {
      if(!viewModel.dictionary.selectedCourse() || viewModel.dictionary.selectedCourse() == ' ') {
        alert('Select the course');
        return;
      }
      if(viewModel.dictionary.wordList().length == 0) {
        alert('Word list is empty');
        return;
      }

      showLoading();

      var result = [];
      var wordList = viewModel.dictionary.wordList();
      for(var i = 0; i < wordList.length; i++) {
        var def = wordList[i].selectedDefinition;
        if(def.isDefinitionSet() && def.isExampleSet() && def.isPronunciationSet()) {
          result.push({
            word: wordList[i].word(),
            definition: def.definition(),
            example: def.example(),
            pronunciation: def.pronunciation()
          });
        } else {
          alert('Definition, example and/or pronunciation of the word "' + wordList[i].word() + '" are/is not set');
          return;
        }
      }

      setTimeout(function () {
        hideLoading();
      }, 120000);

      $.post('/addToDB', { username: viewModel.userInfo.username(), password: viewModel.userInfo.password(), courseId: viewModel.dictionary.selectedCourse(), format: viewModel.dictionary.format(), wordList: encodeURIComponent(JSON.stringify(result)) }).done(function(result) {
        hideLoading();
        if(result.isSuccessful) {
          viewModel.dictionary.selectedWordIndex(-1);
          viewModel.dictionary.wordList.removeAll();
        } else {
          alert(result.error);
        }
      });
    };

    viewModel.GetCourseList = function() {
      var result = [];
      result.push(ko.mapping.fromJS({ id: ' ', title: 'Please Select' }));
      viewModel.userInfo.courseList().forEach(function(item, index) {
        result.push(item);
      });
      return result;
    }

    viewModel.WordItemClicked = function(data, event) {
      if(event.currentTarget && event.currentTarget.attributes && event.currentTarget.attributes['for'] && event.currentTarget.attributes['for'].value) {
        viewModel.dictionary.selectedWordIndex(parseInt(event.currentTarget.attributes['for'].value));
      }
    };

    viewModel.selectedWordID = function(index) {
      return 'selectedWord_' + index;
    };
    viewModel.GetWordList = function() {
      var result = [];
      var wordList = viewModel.dictionary.wordList();
      wordList.forEach(function(item, index) {
        var word = { word: item.word(), definition: '', example: '', pronunciation: '' };
        if(item.selectedDefinition.isDefinitionSet()) {
          word.definition = item.selectedDefinition.definition();
        }
        if(item.selectedDefinition.isExampleSet()) {
          word.example = item.selectedDefinition.example();
        }
        if(item.selectedDefinition.isPronunciationSet()) {
          word.pronunciation = item.selectedDefinition.pronunciation();
        }
        result.push(word);
      });
      return result;
    };
    viewModel.GetDefinitionOptions = function() {
      var result = [];
      var wordIndex = viewModel.dictionary.selectedWordIndex();
      if(wordIndex >= 0) {
        var dictionary = viewModel.dictionary.wordList()[wordIndex].selectedDictionary();
        if(dictionary && dictionary != ' ') {
          var definitions = viewModel.dictionary.wordList()[wordIndex].definitions[dictionary]();
          if(definitions && definitions.definitions) {
            definitions.definitions.forEach(function(item, index) {
              result.push(item);
            });
          }
        }
      }
      return result;
    }
    viewModel.GetDictionaryOptions = function() {
      var result = [];
      result.push(ko.mapping.fromJS({ name: ' ', text: 'Please Select' }));
      viewModel.dictionary.sources().forEach(function(item, index) {
        result.push(item);
      });
      return result;
    };
    viewModel.WordChecked = function(data, e) {
      var wordList = viewModel.dictionary.wordList();
      viewModel.dictionary.selectedWord = data
      wordList.forEach(function(item, index) {
        if(item.word() != data.word()) {
          item.selected(false);
        }
      });
    };
    viewModel.WordKeyPress = function(data, e) {
      if(e.keyCode == 13) {
        viewModel.dictionary.wordToAdd($('#word').val());
        data.AddWord();
      }
      return true;
    };
    viewModel.SetDefinition = function(data, event) {
      var result = viewModel.dictionary.wordList()[viewModel.dictionary.selectedWordIndex()].selectedDefinition.isDefinitionSet();
      viewModel.dictionary.wordList()[viewModel.dictionary.selectedWordIndex()].selectedDefinition.isDefinitionSet(!result);
    };
    viewModel.SetExample = function(data, event) {
      var result = viewModel.dictionary.wordList()[viewModel.dictionary.selectedWordIndex()].selectedDefinition.isExampleSet();
      viewModel.dictionary.wordList()[viewModel.dictionary.selectedWordIndex()].selectedDefinition.isExampleSet(!result);
    };
    viewModel.SetPronunciation = function(data, event) {
      var result = viewModel.dictionary.wordList()[viewModel.dictionary.selectedWordIndex()].selectedDefinition.isPronunciationSet();
      viewModel.dictionary.wordList()[viewModel.dictionary.selectedWordIndex()].selectedDefinition.isPronunciationSet(!result);
    };
    viewModel.AddWord = function() {
      var word = viewModel.dictionary.wordToAdd().trim().toLowerCase();

      if(!word) {
        alert('Enter the word to search');
        return;
      }

      var wordList = viewModel.dictionary.wordList();
      for(var i = 0; i < wordList.length; i++){
        if(word == wordList[i].word()) {
          alert('You already added the word: ' + word);
          return;
        }
      }

      var wordModel = {
        word: viewModel.dictionary.wordToAdd(),
        selectedDefinition: {
          word: '',
          definition: '',
          isDefinitionSet: false,
          example: '',
          isExampleSet: false,
          pronunciation: '',
          isPronunciationSet: false
        },
        definitions: {},
        selectedDictionary: ' ',
        selectedDefinitionIndex: -1
      };
      var sources = viewModel.dictionary.sources();
      for(var i = 0; i < sources.length;i++) {
        wordModel.definitions[sources[i].name()] = null;
      }

      var wordViewModel = ko.mapping.fromJS(wordModel);
      wordViewModel.selectedDictionary.subscribe(function() {
        wordViewModel.selectedDefinitionIndex(-1);
      }, wordViewModel);
      wordViewModel.selectedDefinitionIndex.subscribe(function(newValue) {
        if(newValue >= 0 && wordViewModel.definitions[wordViewModel.selectedDictionary()]() && wordViewModel.definitions[wordViewModel.selectedDictionary()]().definitions) {
          var definition = wordViewModel.definitions[wordViewModel.selectedDictionary()]().definitions[newValue];
          wordViewModel.selectedDefinition.word(definition.word);
          if(!wordViewModel.selectedDefinition.isDefinitionSet()) {
            wordViewModel.selectedDefinition.definition(definition.definition.toLowerCase());
          }
          if(!wordViewModel.selectedDefinition.isExampleSet()) {
            wordViewModel.selectedDefinition.example(definition.example);
          }
          if(!wordViewModel.selectedDefinition.isPronunciationSet()) {
            wordViewModel.selectedDefinition.pronunciation(definition.pronunciation);
          }
        }
      }, wordViewModel);
      var sources = viewModel.dictionary.sources();
      for(var i = 0; i < sources.length; i++) {
        sources[i].fetch(word).then(function(value) {
          wordViewModel.definitions[value.source](value.data);
        });
      }

      viewModel.dictionary.wordList.push(wordViewModel);
      $('#word').select();
    };
    viewModel.GetColorCode = function(value) {
      if(typeof value === 'function') {
        value = value();
      }
      if(value) {
        return 'green';
      } else {
        return 'red';
      }
    };
    viewModel.GetDefinitionColorCode = function(value) {
      if(typeof value === 'function') {
        value = value();
      }
      if(value && value.isDefinitionSet() && value.isExampleSet() && value.isPronunciationSet()) {
        return 'green';
      } else {
        return 'red';
      }
    }
    viewModel.GetSourcePercentage = function() {
      var perc = 100 / viewModel.dictionary.sources().length;
      return perc + '%';
    }
    ko.applyBindings(viewModel, $('body')[0]);
  });
})(model);
