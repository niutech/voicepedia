/*!
 * Voicepedia Main Script
 * Copyright (c) 2011 niu tech & mgdd
 * Licensed under the GPL license:
 * http://www.gnu.org/licenses/gpl.html
 */
$(function(){

	/*
	 * 1. vpSubmit
	 * 2. vpSearch
	 * 3. vpResults
	 * 4. vpImResults
	 * 5. vpGoogleImResults
	 * 6. vpParseText
	 * 7. vpTTS
	 * 8. vpPlay
	 */
	
	// Variables
	var q; //query
	var key = 'ABQIAAAApLOUdGnD4OYmcLuHE9AaUxSLYDr41SfHPbLdCa6aBi7cx_aScxRcYrCM_yFPz56GPWR-wfL4eCpzrQ'; //Google API key
	
	// Functions
	vpSubmit = function(){
		window.location.hash = encodeURIComponent($('#q').val());
		return false;
	}

	vpSearch = function(){
		q = window.location.hash.replace(/^#/,'');
		if(!q)
			return;
		$('#q').val(q).addClass('ac_loading');
		$.ajax({
			url: 'http://en.wikipedia.org/w/api.php',
			data: {
					action: 'parse',
					format: 'json',
					prop: 'displaytitle|text|images',
					maxlag: '10',
					page: q
			},
			dataType: 'jsonp',
			jsonpCallback: 'vpResults',
			//success: vpResults,
			cache: true
		});
	}

	vpResults = function(data){
		if(data.error) {
			$('#title').text('Error: '+data.error.info);
			$('#q').removeClass('ac_loading');
			return;
		}
		var redir = data.parse.text['*'].match(/redirect <a(.+)title="(.+)">/i);
		if(redir && redir[2]) {
			window.location.hash = encodeURIComponent(redir[2]);
			return;
		}
		$.ajax({
			url: 'http://en.wikipedia.org/w/api.php',
			data: {
					action: 'query',
					format: 'json',
					prop: 'imageinfo',
					iiprop: 'url',
					iiurlwidth: '300',
					iiurlheight: '300',
					maxlag: '10',
					titles: 'File:'+data.parse.images.join('|File:')
			},
			dataType: 'jsonp',
			jsonpCallback: 'vpImResults',
			//success: vpImResults,
			cache: true
		});
		$.ajax({
			url: 'https://ajax.googleapis.com/ajax/services/search/images',
			data: {
				v: '1.0',
				key: key,
				//as_sitesearch: 'en.wikipedia.org',
				q: q
			},
			dataType: 'jsonp',
			jsonpCallback: 'vpGoogleImResults',
			cache: true
		});
		$('#title').html(data.parse.displaytitle);
		vpParseText(data.parse.text.*);
		
	}
	
	vpImResults = function(data){
		for(var i in data.query.pages)
			if(data.query.pages[i].imageinfo)
				$('#wikiimages').append('<img src="'+data.query.pages[i].imageinfo[0].thumburl+'" />');
	}

	vpGoogleImResults = function(data){
		for(var i in data.responseData.results)
			$('#googleimages').append('<img src="'+data.responseData.results[i].url+'" />');
	}

	vpParseText = function(text){
		$('<div id="text">'+text+'</div>').appendTo('#wikitext').children('h2, h3, p, blockquote, ul').not('h3 #References').css('background','yellow');
		$('#q').removeClass('ac_loading');
		$('#results').show();
	}
	
	
	vpTTS = function(text){
		
	}
	
	vpPlay = function(){
		
	}
	
	
	//Autocomplete
	$("#q").autocomplete('http://en.wikipedia.org/w/api.php', {
		extraParams: {
			action: 'opensearch',
			namespace: '0',
			suggest: '',
			search: function(){ return $('#q').val(); }
		},
		dataType: 'jsonp',
		parse: function(data){ 
		    var matches = data[1];
		    var rows = [];
		    for(var i=0; i<matches.length; i++){
		        rows[i] = {data:matches[i], value:matches[i], result:matches[i]}; 
		    } 
		    return rows;
		},
		max: 5,
		formatItem: function(row){ return row; }
	});
	
	// Events
	$('#search').bind('submit', vpSubmit);
 	$(window).bind('hashchange', vpSearch);
	vpSearch();

 });
