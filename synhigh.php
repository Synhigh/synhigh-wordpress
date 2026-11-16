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