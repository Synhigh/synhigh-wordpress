<?php

defined( 'ABSPATH' ) || exit;

/**
 * Saved options merged over the defaults.
 *
 * @return array<string,mixed>
 */
function synhigh_options() {
	$saved = get_option( 'synhigh_options', array() );
	return wp_parse_args( is_array( $saved ) ? $saved : array(), synhigh_defaults() );
}
