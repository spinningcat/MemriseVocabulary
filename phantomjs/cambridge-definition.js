"use strict";
var system = require('system');
var page = require('webpage').create();
var word = system.args[1];

page.open("http://dictionary.cambridge.org/dictionary/english/" + word, function(status) {
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

            var word = section.find('.pos-header h3 .headword span').html();
            var type = section.find('.posgram .pos').html();

            section.find('.pos-body .sense-block .sense-body').each(function(index, item) {
              var def = {
                id: defId++,
                word: word,
                type: type,
                type2: type2,
                definition: $(item).find('.def-head .def').text(),
                example: $(item).find('.def-body .examp:eq(0) .eg').text()
              };
              result.definitions.push(def);
            });
          };


          var britishTab = $('.tabs-entry .tabs__content[data-tab="ds-british"]')
          var americanTab = $('.tabs-entry .tabs__content[data-tab="ds-american-english"]')
          var businessTab = $('.tabs-entry .tabs__content[data-tab="ds-business-english"]')

          var type2 = 'American';
          americanTab.find('.entry-body > .entry-body__el').each(sectionScrapper);
          type2 = 'British';
          britishTab.find('.entry-body > .entry-body__el').each(sectionScrapper);
          type2 = 'Business';
          businessTab.find('.entry-body > .entry-body__el').each(sectionScrapper);

          return result;
        });
        console.log(JSON.stringify(res));
      }
    }
    phantom.exit();
});
