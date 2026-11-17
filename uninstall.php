<?php
/**
 * Removes plugin data on uninstall.
 *
 * @package Synhigh
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

delete_option( 'synhigh_options' );