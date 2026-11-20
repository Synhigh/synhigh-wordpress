/**
 * Synhigh TinyMCE plugin (Classic Editor, Visual tab).
 * Adds the "Insert code block" toolbar button; the dialog itself lives in
 * the parent admin page (js/synhigh-editor.js) so it can use admin styles.
 */
( function () {
	'use strict';

	if ( typeof tinymce === 'undefined' ) {
		return;
	}

	tinymce.PluginManager.add( 'synhigh_code', function ( editor ) {
		editor.addButton( 'synhigh_code', {
			tooltip: editor.getParam( 'synhigh_tooltip', 'Insert code block' ),
			icon: 'dashicons dashicons-editor-code',
			onclick: function () {
				var api = window.parent && window.parent.SynhighEditor;
				if ( api ) {
					api.open( editor );
				} else {
					// Dialog script not present (e.g. another admin page with
					// TinyMCE): fall back to inserting an empty code block.
					editor.insertContent( '<pre><code></code></pre>' );
				}
			}
		} );
	} );
} )();