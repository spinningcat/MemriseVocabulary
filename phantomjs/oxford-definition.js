"use strict";
var system = require('system');
var page = require('webpage').create();
var word = system.args[1];

page.open("https://en.oxforddictionaries.com/definition/" + word, function(status) {
    if ( status === "success" ) {
      if(page.injectJs('../public/javascripts/jquery.js')) {
        var res = page.evaluate(function(word) {

          var result = { word: word, pronunciation: $('h2.hwg a.headwordAudio audio').attr('src'), definitions : [] };
          var grambs = $('section.gramb').each(function(index, item) {
            var type = $(item).find('h3.ps.pos span.pos').text().trim();
            var number = 0;

            $(item).find('> ul.semb > li').each(function(index, item) {
              var subNumber = 0;
              number++;
              result.definitions.push({
                  id: number,
                  type: type,
                  definition : $(item).find('> div.trg > p > span.ind').text().trim(),
                  example: $(item).find('> div.trg > div.examples:first > div.exg > ul > li.ex:first > em').text().trim()
                });

              $(item).find('> div.trg > ol.subSenses > li.subSense').each(function(index, item) {
                subNumber++;
                result.definitions.push({
                  id: number + '.' + subNumber,
                  type: type,
                  definition: $(item).find('> span.ind').text().trim(),
                  example: $(item).find('> div.trg > div.examples > div.exg > ul > li.ex:first > em').text().trim()
                });
              });
            });
          });
          return result;
        }, word);
        console.log(JSON.stringify(res));
      }
    }
    phantom.exit();
});
