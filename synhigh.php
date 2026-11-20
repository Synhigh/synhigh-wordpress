<?php
/**
 * Plugin Name: Synhigh Code Highlighter
 * Plugin URI: https://github.com/Synhigh/synhigh-wordpress
 * Description: Lightweight syntax highlighting with auto language detection, line numbers, and a copy button.
 * Version: 1.0.0
 * Requires at least: 6.9
 * Requires PHP: 8.0
 * Author: Raymond Baghumian
 * License: GPL-2.0-or-later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: synhigh-code-highlighter
 *
 * @package Synhigh
 */

defined( 'ABSPATH' ) || exit;

define( 'SYNHIGH_URL', plugin_dir_url( __FILE__ ) );
define( 'SYNHIGH_PATH', plugin_dir_path( __FILE__ ) );

define('SYNHIGH_INC', SYNHIGH_PATH . 'inc/');

require(SYNHIGH_INC . 'enqueue.php');
require(SYNHIGH_INC . 'functions.php');
require(SYNHIGH_INC . 'setting.php');
require(SYNHIGH_INC . 'classic-editor.php');

// Load translations from the plugin's languages directory.
function synhigh_load_textdomain() {
	load_plugin_textdomain(
		'synhigh-code-highlighter',
		false,
		dirname( plugin_basename( __FILE__ ) ) . '/languages'
	);
}
add_action( 'init', 'synhigh_load_textdomain' );

// Translation files are named by locale only (e.g. fa_IR.mo), so remap the
// default {text-domain}-{locale}.mo lookup to the plain {locale}.mo file.
function synhigh_locale_mofile( $mofile, $domain ) {
	if ( 'synhigh-code-highlighter' === $domain ) {
		$custom = SYNHIGH_PATH . 'languages/' . determine_locale() . '.mo';
		if ( is_readable( $custom ) ) {
			return $custom;
		}
	}
	return $mofile;
}
add_filter( 'load_textdomain_mofile', 'synhigh_locale_mofile', 10, 2 );



