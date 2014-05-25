/*global jQuery */
/*!	
* Lettering.JS 0.6.1
*
* Copyright 2010, Dave Rupert http://daverupert.com
* Released under the WTFPL license 
* http://sam.zoy.org/wtfpl/
*
* Thanks to Paul Irish - http://paulirish.com - for the feedback.
*
* Date: Mon Sep 20 17:14:00 2010 -0600
*/
(function($){
	function injector(t, splitter, klass, after) {
		var a = t.text().split(splitter), inject = '';
		if (a.length) {
			$(a).each(function(i, item) {
				inject += '<span class="'+klass+(i+1)+'">'+item+'</span>'+after;
			});
			t.empty().append(inject);
		}
	}
	
	var methods = {
		init : function() {

			return this.each(function() {
				injector($(this), '', 'char', '');
			});

		},

		words : function() {

			return this.each(function() {
				injector($(this), ' ', 'word', ' ');
			});

		},
		
		lines : function() {

			return this.each(function() {
				var r = "eefec303079ad17405c889e092e105b0";
				// Because it's hard to split a <br/> tag consistently across browsers,
				// (*ahem* IE *ahem*), we replace all <br/> instances with an md5 hash 
				// (of the word "split").  If you're trying to use this plugin on that 
				// md5 hash string, it will fail because you're being ridiculous.
				injector($(this).children("br").replaceWith(r).end(), r, 'line', '');
			});

		},
		
		// Author: Nicholas Grant
		// Description: Well, as it says, it attempts to split into sentences. It actually works fairly well.
		//				Mind you because of the way the English language works it's pretty much impossible to
		//				perfectly split every sentence. However, it tries its best and does cover most if not
		//				all of the most common sentence structures.
		// 
		// It has support for basic abbreviations, e.g. i.e. a.b.c.d.e
		// Support for ellipsis as three regular dots, ...
		// Support for numbers inside sentences, .3 0.454e+3, whatever
		// Support for quotes outside period, Well, "Hello World." Hi. becomes <span>Well, "Hello World."</span><span> Hi.</span>
		// Support for HTML, keeps track of quotes and nested depth to ensure it doesn't accidentally cut an HTML tag off.
		// Mild support for properly nesting closing tag in group e.g.  My Text<a>.</a> becomes <span>My Text<a>.</a></span> not <span>My Text<a>.</span></a>
		// Weird nesting of tags may result in unexpected results.
		// End of sentence == '?' || '!' || '.'
		sentences : function() {
			
			return this.each(function() {
				var t = $(this);
				var text = t.html();
				var a = [];
				var startSentence = 0;
				var inTag = false;
				var inSQuotes = false;
				var inDQuotes = false;
				var openedTagDepth = 0;
				var groupingTagDepth = 0;
				var latentPush = false;
				var minimumSentenceLength = 10; // or to end
				for ( var i = 0; i < text.length; i++ )
				{
					var schar = text.charAt(i);
					if ( inTag && !inSQuotes && schar == '"' )
					{
						inDQuotes = !inDQuotes;
					}
					else if ( inTag && !inDQuotes && schar == "'" )
					{
						inSQuotes = !inSQuotes;
					}
					else if ( !(inDQuotes || inSQuotes) && schar == '<' )
					{
						inTag = true;
						if ( (i + 1) < text.length && text.charAt(i + 1) == '/' )
						{
							openedTagDepth = Math.max(openedTagDepth - 1, 0);
							groupingTagDepth = Math.max(groupingTagDepth - 1, 0);
							i += 1;
						}
						else
						{
							openedTagDepth += 1;
							groupingTagDepth += 1;
						}
					}
					else if ( !(inDQuotes || inSQuotes) && schar == '>' )
					{
						inTag = false;
						if ( (i - 1) > 0 )
						{
							if ( text.charAt(i - 1) == '/' )
							{
								openedTagDepth = Math.max(openedTagDepth - 1, 0);
								groupingTagDepth = Math.max(groupingTagDepth - 1, 0);
							}
						}
						if ( latentPush && groupingTagDepth == 0 )
						{
							if ( (i + 1) < text.length && (text.charAt(i + 1) == '"' || text.charAt(i + 1) == "'") )
								i += 1;
							a.push(text.substring(startSentence, i + 1));
							startSentence = i + 1;
							latentPush = false;
						}
					}
					else if ( schar == '\\' )
					{
						if ( inDQuotes || inSQuotes )
						{
							if ( (i + 1) < text.length )
							{
								var nchar = text.charAt(i + 1);
								if ( (inDQuotes && nchar == '"') || (inSQuotes && nchar == "'") )
									i += 1;
							}
						}
					}
					else if ( !inTag && (schar == '.' || schar == '?' || schar == '!') )
					{
						if ( (i + 1) < text.length && (text.charAt(i + 1) == '"' || text.charAt(i + 1) == "'") )
							i += 1;
						
						if ( groupingTagDepth > 0 &&
							 ((i + 1) < text.length && text.charAt(i + 1) == '<') &&
							 ((i + 2) < text.length && text.charAt(i + 2) == '/') )
						{
							latentPush = true;
							continue;
						}
						
						if ( schar == '.' )
						{
							if ( (i + 1) < text.length )
							{
								var i1char = text.charAt(i + 1);
								var i1code = text.charCodeAt(i + 1);
								
								if ( i1char == '.' && ((i + 2) < text.length && text.charAt(i + 2) == '.') )
								{
									i += 2;
									continue;
								}
								else if ( i1code >= 48 && i1code <= 57 )
								{
									i++;
									continue;
									// is a number
									// possibly a weird malformed number, but a number still ...right?
								}
								// for abbreviations
								else if ( (i1code >= 65 && i1code <= 90) || (i1code >= 97 && i1code <= 122) )
								{
									i += 2;
									continue;
								}
							}
						}
						// no sentence is less than 8 characters...
						// this also helps to cover e.g., i.e., etc. you get me?
						if ( (i - startSentence) > minimumSentenceLength || (i + 1) >= text.length )
						{
							a.push(text.substring(startSentence, i + 1));
							groupingTagDepth = 0;
							startSentence = i + 1;
						}
					}
				}
				if ( (i - startSentence) > 0 )
						a.push(text.substring(startSentence, i + 1));
				var inject = '';
				var klass = 'sentence';
				if (a.length) {
					$(a).each(function(i, item) {
						inject += '<span class="'+klass+(i+1)+'">'+item+'</span>';
					});
					t.empty().append(inject);
				}
			});
		}
	};

	$.fn.lettering = function( method ) {
		// Method calling logic
		if ( method && methods[method] ) {
			return methods[ method ].apply( this, [].slice.call( arguments, 1 ));
		} else if ( method === 'letters' || ! method ) {
			return methods.init.apply( this, [].slice.call( arguments, 0 ) ); // always pass an array
		}
		$.error( 'Method ' +  method + ' does not exist on jQuery.lettering' );
		return this;
	};

})(jQuery);
