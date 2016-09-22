"use strict";
var system = require('system');
var page = require('webpage').create();
var word = system.args[1];

page .onError = function() { }

page.open("http://www.zargan.com/en/q/" + word, function(status) {
    if ( status === "success" ) {
      if(page.injectJs('../public/javascripts/jquery.js')) {
        var res = page.evaluate(function(word) {
          var result = { word: word, definitions : [] };

          $('#resultsContainer > .contentPane').each(function(index, item) {
            var title = $(item).find('> .contentTitle').html().trim();

            if(title.indexOf('English-Turkish Translation') >= 0) {

              $(item).find('> .contentWrapper > .numberedList > ol > li').each(function(index, item) {
                var definitionContainer = $(item);
                var type = definitionContainer.find('span.red').html().trim();
                definitionContainer.find('span.red').remove();
                var hiddenExamples = definitionContainer.find('.read-more-show').html();
                definitionContainer.find('.read-more-show').remove();
                definitionContainer.html(definitionContainer.html() + hiddenExamples);

                var containerChildren = definitionContainer.children();
                var examples = [];
                for(var i = 0; i < containerChildren.length; i++) {
                  var child = $(containerChildren[i]);
                  examples.push(child.text());
                  child.replaceWith('<br/>');
                }
                var example = ''
                if(examples.length > 0)
                  example = examples[0].trim();
                var definition = { type: type, definition: definitionContainer.html().split('<br>')[0].trim(), example: example, sub_definitions: [] };
                result.definitions.push(definition);
              });
            }
          });

          return result;
        }, word);
        console.log(JSON.stringify(res));
      }
    }
    phantom.exit();
});
