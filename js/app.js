/*!
 * Voicepedia Main Script
 * Copyright (c) 2014 niu tech & mgdd
 * Licensed under the GPL license:
 * http://www.gnu.org/licenses/gpl.html
 */

//Global Objects

Voicepedia = {};
Voicepedia.Model = {};
Voicepedia.View = {};
Voicepedia.Presenter = {};



/**
 * @returns {Voicepedia.Model}
 */
(function() {

    //Variables

    var self = $.observable(this);
    var images;
    var text;
    var title;

    //Methods

    /**
     * Performs Wikipedia search
     * @param {string} query
     */
    self.searchWikipedia = function(query) {
        if (!query)
            return;
        $.ajax({
            url: 'http://en.wikipedia.org/w/api.php',
            data: {
                action: 'parse',
                format: 'json',
                prop: 'text',
                maxlag: '10',
                redirects: 1,
                disabletoc: 1,
                disablepp: 1,
                page: query
            },
            dataType: 'jsonp',
            jsonpCallback: 'Voicepedia.Model.getWikiResults',
            cache: true
        });
    };

    /**
     * Handles Wikipedia response
     * @param {{parse: object}} data
     */
    self.getWikiResults = function(data) {
        if (data.error) {
            self.trigger('showError', data.error.info);
            return;
        }
        self.parseWikiResults(data.parse);
    };

    /**
     * Parses Wikipedia results and updates the model
     * @param {{text: object, title: string}} res
     */
    self.parseWikiResults = function(res) {
        var $text = $('<div>' + res.text['*'].replace(/src/g, 'data-src') + '</div>');
        var loc = $text.find('.geo').first().text().replace(/; /, ',');
        images = [];
        if (loc) {
            images.push({
                src: 'http://maps.googleapis.com/maps/api/staticmap?center=' + loc + '&size=640x480&sensor=false&zoom=1&markers=' + loc,
                alt: 'Google Maps'
            });
            images.push({
                src: 'http://maps.googleapis.com/maps/api/staticmap?center=' + loc + '&size=640x480&sensor=false&zoom=3&markers=' + loc,
                alt: 'Google Maps'
            });
            images.push({
                src: 'http://maps.googleapis.com/maps/api/staticmap?center=' + loc + '&size=640x480&sensor=false&zoom=5&markers=' + loc,
                alt: 'Google Maps'
            });
            images.push({
                src: 'http://maps.googleapis.com/maps/api/staticmap?center=' + loc + '&size=640x480&sensor=false&zoom=7&markers=' + loc,
                alt: 'Google Maps'
            });
        }
        $text.find('.infobox .image img[data-src^="//upload.wikimedia.org"], img.thumbimage[data-src^="//upload.wikimedia.org"]').each(function() {
            images.push({
                src: 'http://images2-focus-opensocial.googleusercontent.com/gadgets/proxy?container=focus&gadget=a&no_expand=1&resize_h=480&rewriteMime=image%2f*&url=' + encodeURIComponent(this.dataset.src.replace(/\/thumb/, '').replace(/\/[^\/]+$/, '')),
                alt: this.alt
            });
        });
        $text.find('.reference, span, small, a[href$="language"]').remove();
        $text = $text.children('p').first().nextUntil('h2', 'p').addBack().append(" ");
        text = $text.text();
        title = res.title;
        self.searchFlickr(title);
    };

    /**
     * Performs Flickr search
     * @param {string} query
     */
    this.searchFlickr = function(query) {
        if (!query)
            return;
        $.ajax({
            url: 'http://api.flickr.com/services/feeds/photos_public.gne',
            data: {
                format: 'json',
                lang: 'en-us',
                tags: query
            },
            dataType: 'jsonp',
            jsonp: 'jsoncallback',
            jsonpCallback: 'Voicepedia.Model.getFlickrResults',
            cache: true
        });
    };

    /**
     * Handles Flickr response and triggers the presenter
     * @param {{items: array}} data
     */
    self.getFlickrResults = function(data) {
        if (data.items.length) {
            $.each(data.items, function() {
                images.push({
                    src: this.media.m.replace(/_m/, ''),
                    alt: this.title
                });
            });
        }
        self.trigger('showResults', {title: title, text: text, images: images});
    };

}).apply(Voicepedia.Model);


/**
 * @returns {Voicepedia.View}
 */
(function() {

    //Variables

    var query = $('#q');
    var form = $('#search');
    var body = $('#body');
    var resultsTmpl = $('#resultsTmpl');
    var imagesTmpl = $('#imagesTmpl');
    var pageTitle = $('title');
    var oldPageTitle = pageTitle.text();
    var images;
    var voice;

    //Methods

    /**
     * Initializes the view
     */
    this.init = function() {
        this.setupAutocomplete();
        this.setupSearch();
    };

    /**
     * Performs form autocomplete
     */
    this.setupAutocomplete = function() {
        query.autocomplete({
            serviceUrl: 'http://en.wikipedia.org/w/api.php',
            params: {
                action: 'opensearch',
                namespace: '0',
                suggest: ''
            },
            paramName: 'search',
            dataType: 'jsonp',
            transformResult: function(resp) {
                return {suggestions: $.map(resp[1], function(item) {
                        return {value: item, data: item};
                    })};
            }
        });
    };

    /**
     * Prepares the search form
     */
    this.setupSearch = function() {
        form.submit(function() {
            $.route('#' + $('#q').val());
            return false;
        });
    };

    /**
     * Performs the search
     * @param {string} title
     */
    this.startSearch = function(title) {
        pageTitle.html(title + ' - ' + oldPageTitle);
        query.val(title);
        body.empty().addClass('loading');
    };

    /**
     * Shows the final results
     * @param {{title: string, text: string, images: array}} res
     */
    this.showResults = function(res) {
        body.removeClass('loading');
        res.voice = 'http://tts-api.com/tts.mp3?q=' + encodeURIComponent(res.text);
        res.images = $.map(res.images, function(image) {
            return $.render(imagesTmpl.html(), image);
        }).join('');
        body.html($.render(resultsTmpl.html(), res));
        $('html').animate({scrollTop: body.offset().top});
        this.setupSlider();
        this.setupVoice();
    };

    /**
     * Shows the error
     * @param {string} err
     */
    this.showError = function(err) {
        body.removeClass('loading');
        body.html('<h1>' + err + '</h1>');
    };

    /**
     * Prepares the slider
     */
    this.setupSlider = function() {
        images = $('#images');
        images.cycle({
            delay: 2000,
            speed: 500,
            timeout: 2000,
            height: 480,
            fit: 1
        }).cycle('pause'); //wait for the voice
    };

    /**
     * Prepares the narration
     */
    this.setupVoice = function() {
        voice = $('#voice');
        voice.on('play pause ended', function(e) {
            images.cycle('resume');
        }).on('pause ended', function(e) {
            images.cycle('pause');
        });
    };

    /**
     * Starts the narration
     */
    this.startVoice = function() {
        var speech;
        if (window.speechSynthesis) {
            speech = new SpeechSynthesisUtterance(voice);
            speech.lang = 'en-US';
            window.speechSynthesis.speak(speech);
        }
    };

}).apply(Voicepedia.View);



/**
 * @returns {Voicepedia.Presenter}
 */
(function() {

    //Variables

    var model = Voicepedia.Model;
    var view = Voicepedia.View;

    //Methods

    /**
     * Initializes the presenter
     */
    this.init = function() {
        view.init();
        $.route(function(query) {
            query = query.substring(1); //remove #
            if (!query)
                return;
            view.startSearch(query);
            model.searchWikipedia(query);
        });
        $.route(location.hash);
    };

    model.on('showResults', function(res) {
        view.showResults(res);
    });

    model.on('showError', function(err) {
        view.showError(err);
    });

    this.init();

}).apply(Voicepedia.Presenter);
