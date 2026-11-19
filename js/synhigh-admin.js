/**
 * Settings page tabs (admin only).
 * Switches panels on click, keeps the active tab in the URL hash and
 * remembers it across saves via localStorage. Without this script all
 * panels simply stay visible.
 */
( function () {
	'use strict';

	var wrap = document.querySelector( '.synhigh-tabs' );
	if ( ! wrap ) {
		return;
	}

	var tabs = Array.prototype.slice.call( wrap.querySelectorAll( '.nav-tab' ) );
	var storageKey = 'synhighActiveTab';

	function panelFor( tab ) {
		return document.getElementById( tab.getAttribute( 'href' ).slice( 1 ) );
	}

	function activate( tab, updateHash ) {
		tabs.forEach( function ( t ) {
			var active = t === tab;
			var panel = panelFor( t );
			t.classList.toggle( 'nav-tab-active', active );
			t.setAttribute( 'aria-selected', active ? 'true' : 'false' );
			if ( panel ) {
				panel.hidden = ! active;
			}
		} );
		if ( updateHash ) {
			if ( window.history && history.replaceState ) {
				history.replaceState( null, '', tab.getAttribute( 'href' ) );
			} else {
				window.location.hash = tab.getAttribute( 'href' );
			}
		}
		try {
			window.localStorage.setItem( storageKey, tab.getAttribute( 'href' ).slice( 1 ) );
		} catch ( e ) {}
	}

	function tabById( id ) {
		for ( var i = 0; i < tabs.length; i++ ) {
			if ( panelFor( tabs[i] ) && tabs[i].getAttribute( 'href' ) === '#' + id ) {
				return tabs[i];
			}
		}
		return null;
	}

	tabs.forEach( function ( tab ) {
		tab.addEventListener( 'click', function ( event ) {
			event.preventDefault();
			activate( tab, true );
		} );
	} );

	// Initial tab: URL hash first, then the last used tab, then the first one.
	var initial = tabById( window.location.hash.slice( 1 ) );
	if ( ! initial ) {
		try {
			initial = tabById( window.localStorage.getItem( storageKey ) || '' );
		} catch ( e ) {}
	}
	if ( ! initial ) {
		initial = tabs[ 0 ];
	}

	wrap.classList.add( 'synhigh-tabs-ready' );
	activate( initial, false );
} )();