<?php
$dflip_header_footer = get_query_var( 'header-footer' );
$hide_header_footer = $dflip_header_footer == "false";

if ( $hide_header_footer ) {
  wp_head();
} else {
  get_header();
}

do_action( "before_dflip_single_content" );

do_action( "dflip_single_content" );

do_action( "after_dflip_single_content" );

if ( $hide_header_footer ) {
  wp_footer();
} else {
  get_footer();
}

