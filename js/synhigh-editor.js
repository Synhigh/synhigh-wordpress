/**
 * Synhigh Classic Editor dialog (admin page).
 * Opens from the TinyMCE toolbar button (Visual tab) or the "code" quicktag
 * (Text tab) and inserts a <pre><code class="language-..."> block that the
 * front-end highlighter picks up. Exposed as window.SynhighEditor so the
 * TinyMCE plugin inside the editor iframe can reach it.
 */
( function () {
	'use strict';

	var cfg = window.SynhighEditorConfig || {};
	var i18n = cfg.i18n || {};
	var overlay = null;
	var langSelect = null;
	var codeArea = null;
	var codeGutter = null;
	var activeEditor = null;
	var lastFocus = null;

	function t( key, fallback ) {
		return i18n[ key ] || fallback;
	}

	function escapeHtml( text ) {
		return text
			.replace( /&/g, '&amp;' )
			.replace( /</g, '&lt;' )
			.replace( />/g, '&gt;' )
			.replace( /"/g, '&quot;' );
	}

	function buildBlock( lang, code ) {
		var cls = lang ? ' class="language-' + lang + '"' : '';
		return '<pre><code' + cls + '>' + escapeHtml( code ) + '</code></pre>';
	}

	function selectedText() {
		if ( activeEditor ) {
			return activeEditor.selection.getContent( { format: 'text' } );
		}
		var canvas = document.getElementById( 'content' );
		if ( canvas && canvas.selectionStart !== canvas.selectionEnd ) {
			return canvas.value.substring( canvas.selectionStart, canvas.selectionEnd );
		}
		return '';
	}

	function insertBlock( html ) {
		if ( activeEditor ) {
			activeEditor.insertContent( html );
			activeEditor.focus();
			return;
		}
		// Text tab: let quicktags handle the active textarea when available.
		if ( window.QTags && window.QTags.insertContent ) {
			window.QTags.insertContent( html );
			return;
		}
		var canvas = document.getElementById( 'content' );
		if ( canvas ) {
			var start = canvas.selectionStart || 0;
			var end = canvas.selectionEnd || 0;
			canvas.value = canvas.value.slice( 0, start ) + html + canvas.value.slice( end );
			canvas.selectionStart = canvas.selectionEnd = start + html.length;
			canvas.focus();
		}
	}

	function close() {
		if ( overlay ) {
			overlay.hidden = true;
		}
		document.removeEventListener( 'keydown', onKeydown );
		if ( lastFocus && lastFocus.focus ) {
			lastFocus.focus();
		}
		activeEditor = null;
	}

	function onKeydown( event ) {
		if ( event.key === 'Escape' ) {
			event.preventDefault();
			close();
		}
	}

	// Rebuild the line-number column and keep it aligned with the textarea.
	function updateLineNumbers() {
		if ( ! codeGutter || ! codeArea ) {
			return;
		}
		var count = codeArea.value.split( '\n' ).length;
		var numbers = [];
		for ( var i = 1; i <= count; i++ ) {
			numbers.push( i );
		}
		codeGutter.textContent = numbers.join( '\n' );
		codeGutter.scrollTop = codeArea.scrollTop;
	}

	function build() {
		overlay = document.createElement( 'div' );
		overlay.className = 'synhigh-editor-overlay';
		overlay.hidden = true;

		var dialog = document.createElement( 'div' );
		dialog.className = 'synhigh-editor-dialog';
		dialog.setAttribute( 'role', 'dialog' );
		dialog.setAttribute( 'aria-modal', 'true' );
		dialog.setAttribute( 'aria-label', t( 'title', 'Insert code block' ) );

		var title = document.createElement( 'h2' );
		title.className = 'synhigh-editor-title';
		title.textContent = t( 'title', 'Insert code block' );
		dialog.appendChild( title );

		var langLabel = document.createElement( 'label' );
		langLabel.className = 'synhigh-editor-label';
		langLabel.textContent = t( 'language', 'Language' );
		langSelect = document.createElement( 'select' );
		langSelect.className = 'synhigh-editor-language';
		langLabel.appendChild( langSelect );
		dialog.appendChild( langLabel );

		var languages = cfg.languages || {};
		Object.keys( languages ).forEach( function ( slug ) {
			var option = document.createElement( 'option' );
			option.value = slug;
			option.textContent = languages[ slug ];
			langSelect.appendChild( option );
		} );

		var codeLabel = document.createElement( 'label' );
		codeLabel.className = 'synhigh-editor-label';
		codeLabel.textContent = t( 'code', 'Code' );

		var codeWrap = document.createElement( 'div' );
		codeWrap.className = 'synhigh-editor-code-wrap';

		codeGutter = document.createElement( 'div' );
		codeGutter.className = 'synhigh-editor-gutter';
		codeGutter.setAttribute( 'aria-hidden', 'true' );
		codeGutter.textContent = '1';

		codeArea = document.createElement( 'textarea' );
		codeArea.className = 'synhigh-editor-code';
		codeArea.rows = 12;
		codeArea.spellcheck = false;
		codeArea.setAttribute( 'wrap', 'off' );
		codeArea.setAttribute( 'autocomplete', 'off' );
		codeArea.setAttribute( 'autocapitalize', 'off' );
		codeArea.setAttribute( 'autocorrect', 'off' );
		codeArea.placeholder = t( 'placeholder', 'Paste or type your code here.' );

		codeArea.addEventListener( 'input', updateLineNumbers );
		codeArea.addEventListener( 'scroll', function () {
			codeGutter.scrollTop = codeArea.scrollTop;
		} );

		codeWrap.appendChild( codeGutter );
		codeWrap.appendChild( codeArea );
		codeLabel.appendChild( codeWrap );
		dialog.appendChild( codeLabel );

		// Keep tabs inside the code instead of moving focus.
		codeArea.addEventListener( 'keydown', function ( event ) {
			if ( event.key !== 'Tab' ) {
				return;
			}
			event.preventDefault();
			var start = codeArea.selectionStart;
			var end = codeArea.selectionEnd;
			codeArea.value = codeArea.value.slice( 0, start ) + '\t' + codeArea.value.slice( end );
			codeArea.selectionStart = codeArea.selectionEnd = start + 1;
			updateLineNumbers();
		} );

		var actions = document.createElement( 'div' );
		actions.className = 'synhigh-editor-actions';

		var cancel = document.createElement( 'button' );
		cancel.type = 'button';
		cancel.className = 'button';
		cancel.textContent = t( 'cancel', 'Cancel' );
		cancel.addEventListener( 'click', close );

		var insert = document.createElement( 'button' );
		insert.type = 'button';
		insert.className = 'button button-primary';
		insert.textContent = t( 'insert', 'Insert' );
		insert.addEventListener( 'click', function () {
			var code = codeArea.value.replace( /\s+$/, '' );
			if ( ! code ) {
				codeArea.focus();
				return;
			}
			insertBlock( buildBlock( langSelect.value, code ) );
			close();
		} );

		actions.appendChild( cancel );
		actions.appendChild( insert );
		dialog.appendChild( actions );
		overlay.appendChild( dialog );

		overlay.addEventListener( 'click', function ( event ) {
			if ( event.target === overlay ) {
				close();
			}
		} );

		document.body.appendChild( overlay );
	}

	function open( editor ) {
		if ( ! overlay ) {
			build();
		}
		activeEditor = editor || null;
		lastFocus = document.activeElement;
		codeArea.value = selectedText();
		updateLineNumbers();
		codeArea.scrollTop = 0;
		codeGutter.scrollTop = 0;
		overlay.hidden = false;
		document.addEventListener( 'keydown', onKeydown );
		codeArea.focus();
	}

	window.SynhighEditor = { open: open };

	// Text tab: add a "code" quicktag that opens the same dialog.
	if ( window.QTags && window.QTags.addButton ) {
		window.QTags.addButton( 'synhigh_code', t( 'quicktag', 'code' ), function () {
			open( null );
		} );
	}
} )();