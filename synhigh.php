<?php
/**
 * Plugin Name: Synhigh Code Highlighter
 * Plugin URI: https://github.com/Synhigh/synhigh-wordpress
 * Description: Lightweight syntax highlighting with auto language detection, line numbers, and a copy button.
 * Version: 1.0.0
 * Requires at least: 7.1
 * Requires PHP: 8.0
 * Author: Raymond Baghumian
 * License: GPL-2.0-or-later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: synhigh-code-highlighter, highlighter, code-highlighter, copy-button
 *
 * @package Synhigh
 */

defined( 'ABSPATH' ) || exit;

define( 'SYNHIGH_VERSION', '1.0.0' );
define( 'SYNHIGH_URL', plugin_dir_url( __FILE__ ) );
define( 'SYNHIGH_PATH', plugin_dir_path( __FILE__ ) );

/**
 * Default option values.
 *
 * @return array<string,mixed>
 */
function synhigh_defaults() {
	return array(
		'theme'         => 'auto',
		'line_numbers'  => 1,
		'copy_button'   => 1,
		'show_label'    => 1,
		'auto_detect'   => 1,
		'observe'       => 0,
		'load_all'      => 0,
		'custom_css'    => '',
	);
}

/**
 * Saved options merged over the defaults.
 *
 * @return array<string,mixed>
 */
function synhigh_options() {
	$saved = get_option( 'synhigh_options', array() );
	return wp_parse_args( is_array( $saved ) ? $saved : array(), synhigh_defaults() );
}