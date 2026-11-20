<?php

defined( 'ABSPATH' ) || exit;
define( 'SYNHIGH_VERSION', '1.1.0' );

// Calling Files
function synhigh_enqueue() {

    if ( is_admin() || is_feed() ) {
		return;
	}

	if ( ! apply_filters( 'synhigh_should_load', synhigh_needs_assets() ) ) {
		return;
	}

	$opts = synhigh_options();
	$themes = synhigh_themes();
	$theme  = isset( $themes[ $opts['theme'] ] ) ? $opts['theme'] : 'auto';

    wp_enqueue_style(
        'synhigh_css',
        SYNHIGH_URL . 'css/synhigh.css',
        array(),
        SYNHIGH_VERSION
    );

    // Inline CSS must target the registered handle and be added after enqueue.
    if ( '' !== trim( (string) $opts['custom_css'] ) ) {
		wp_add_inline_style( 'synhigh_css', wp_strip_all_tags( $opts['custom_css'] ) );
	}

	wp_enqueue_script(
		'synhigh_js',
		SYNHIGH_URL . 'js/synhigh.js',
		array(),
		SYNHIGH_VERSION,
        array(
			'in_footer' => true,
			'strategy'  => 'defer',
		)
	);

    $config = apply_filters(
		'synhigh_js_config',
		array(
			'theme'       => $theme,
			'lineNumbers' => (bool) $opts['line_numbers'],
			'copyButton'  => (bool) $opts['copy_button'],
			'showLabel'   => (bool) $opts['show_label'],
			'autoDetect'  => (bool) $opts['auto_detect'],
			'observe'     => (bool) $opts['observe'],
			'i18n'        => array(
				'copy'     => __( 'Copy', 'synhigh-code-highlighter' ),
				'copied'   => __( 'Copied!', 'synhigh-code-highlighter' ),
				'failed'   => __( 'Failed', 'synhigh-code-highlighter' ),
				'copyAria' => __( 'Copy code to clipboard', 'synhigh-code-highlighter' ),
			),
		)
	);
	wp_add_inline_script( 'synhigh_js', 'window.SynhighConfig=' . wp_json_encode( $config ) . ';', 'before' );

}
add_action( 'wp_enqueue_scripts', 'synhigh_enqueue' );