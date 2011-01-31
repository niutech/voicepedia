/*!
 * Voicepedia Main Script
 * Copyright (c) 2011 niu tech & mgdd
 * Licensed under the GPL license:
 * http://www.gnu.org/licenses/gpl.html
 */
$(function(){

	// Variables
	var q; //q[1] - lang, q[2] - query
	var key = 'ABQIAAAApLOUdGnD4OYmcLuHE9AaUxSLYDr41SfHPbLdCa6aBi7cx_aScxRcYrCM_yFPz56GPWR-wfL4eCpzrQ'; //Google API key
	
	// Functions
	vpSubmit = function(){
		window.location.hash = $('#l').val()+','+encodeURIComponent($('#q').val());
		return false;
	}

	vpSearch = function(){
		q = window.location.hash.match(/^#([a-z]{2}),(.+)/);
		if(!q)
			return;
		$.ajax({
			url: 'http://'+q[1]+'.wikipedia.org/w/api.php',
			data: {
					action: 'parse',
					format: 'json',
					prop: 'displaytitle|text|images',
					maxlag: '5',
					page: q[2]
			},
			dataType: 'jsonp',
			jsonpCallback: 'vpResults',
			cache: true
		});
	}

	vpResults = function(data){
		$('#wikititle').html(data.parse.displaytitle);
		$('#wikitext').html(data.parse.text.*);
		$.ajax({
			url: 'http://'+q[1]+'.wikipedia.org/w/api.php',
			data: {
					action: 'query',
					format: 'json',
					prop: 'imageinfo',
					iiprop: 'url',
					iiurlwidth: '300',
					iiurlheight: '300',
					maxlag: '5',
					titles: 'File:'+data.parse.images.join('|File:')
			},
			dataType: 'jsonp',
			jsonpCallback: 'vpImResults',
			cache: true
		});
		$.ajax({
			url: 'https://ajax.googleapis.com/ajax/services/search/images',
			data: {
				v: '1.0',
				key: key,
				//as_sitesearch: q[1]+'.wikipedia.org',
				q: q[2]
			},
			dataType: 'jsonp',
			jsonpCallback: 'vpGoogleImResults',
			cache: true
		});
	}
	
	vpImResults = function(data){
		for(var i in data.query.pages)
			$('#wikiimages').append('<img src="'+data.query.pages[i].imageinfo[0].thumburl+'" />');
	}

	vpGoogleImResults = function(data){
		for(var i in data.responseData.results)
			$('#googleimages').append('<img src="'+data.responseData.results[i].url+'" />');
	}

	// Events
	$('#search').bind('submit', vpSubmit);
 	$(window).bind('hashchange', vpSearch);
	vpSearch();

 });
