<?php
//Since the custom post is set to "exclude_from_search" WordPress normal archive search won't display any posts.

get_header();
do_action( "before_dflip_archive_content" );

do_action( "dflip_archive_content" );

do_action( "after_dflip_archive_content" );
get_footer();
