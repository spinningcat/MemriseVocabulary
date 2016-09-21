"use strict";
var system = require('system');
var page = require('webpage').create();
var word = system.args[1];

page.open("https://en.oxforddictionaries.com/definition/" + word, function(status) {
    if ( status === "success" ) {
      if(page.injectJs('../public/javascripts/jquery.js')) {
        var res = page.evaluate(function() {

          var result = { word: 'word', pronunciation: $('h2.hwg a.headwordAudio audio').attr('src'), types : [] };
          var grambs = $('section.gramb').each(function(index, item) {
            var grambItem = { type: $(item).find('h3.ps.pos span.pos').text(), definitions : [] };

            $(item).find('> ul.semb > li').each(function(index, item) {
              var defItem = { definition : $(item).find('> div.trg > p > span.ind').text(), example: $(item).find('> div.trg > div.examples:first > div.exg > ul > li.ex:first > em').text(), sub_definitions: [] };

              $(item).find('> div.trg > ol.subSenses > li.subSense').each(function(index, item) {
                var subDefItem = { definition: $(item).find('> span.ind').text(), example: $(item).find('> div.trg > div.examples > div.exg > ul > li.ex:first > em').text() };

                defItem.sub_definitions.push(subDefItem);
              });

              grambItem.definitions.push(defItem);
            });

            result.types.push(grambItem);
          });
          return result;
        });
        console.log(JSON.stringify(res));
      }
    }
    phantom.exit();
});
