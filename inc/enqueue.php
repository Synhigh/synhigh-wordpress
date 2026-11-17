<?php

defined( 'ABSPATH' ) || exit;
define( 'SYNHIGH_VERSION', '1.0.0' );

// Calling Files
function synhigh_enqueue() {
	
    wp_enqueue_style( 
        'synhigh', 
        SYNHIGH_URL . 'css/synhigh.css', 
        array(), 
        SYNHIGH_VERSION 
    );

	wp_enqueue_script(
		'synhigh',
		SYNHIGH_URL . 'js/synhigh.js',
		array(),
		SYNHIGH_VERSION,
	);

}
add_action( 'wp_enqueue_scripts', 'synhigh_enqueue' );