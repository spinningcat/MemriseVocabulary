"use strict";
var system = require('system');
var page = require('webpage').create();
var word = system.args[1];

page.open("http://dictionary.cambridge.org/dictionary/turkish/" + word, function(status) {
    if ( status === "success" ) {
      if(page.injectJs('../public/javascripts/jquery.js')) {
        var res = page.evaluate(function() {
          var result = {
            definitions:[],
            pronunciation: $('.sound.audio_play_button.us').first().attr('data-src-mp3').trim()
          };
          var defId = 0;

          var sectionScrapper = function(index, item) {
            var section = $(item);

            var word = section.find('.di-head h2.di-title').html().trim();
            var type = section.find('.posgram .pos').html().trim();

            section.find('.pos-body .sense-block .sense-body').each(function(index, item) {
              var def = {
                id: defId++,
                word: word,
                type: type,
                definition: $(item).find('.def-body .trans').text().trim(),
                example: $(item).find('.def-body .examp:eq(0) .eg').text().trim()
              };
              result.definitions.push(def);
            });
          };


          $('#entryContent').find('.entry-body > .entry-body__el').each(sectionScrapper);

          return result;
        });
        console.log(JSON.stringify(res));
      }
    }
    phantom.exit();
});
