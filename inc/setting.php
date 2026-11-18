<?php

defined( 'ABSPATH' ) || exit;

// Setting Page
function synhigh_add_menu() {
	add_options_page(
		__( 'Code Highlighter', 'synhigh-code-highlighter' ),
		__( 'Code Highlighter', 'synhigh-code-highlighter' ),
		'manage_options',
		'synhigh-code-highlighter',
		'synhigh_render_settings'
	);
}
add_action( 'admin_menu', 'synhigh_add_menu' );