<?php

/**
 * dFlip CUSTOM POST
 *
 * Initializes and Registers the required custom post for dFlip
 *
 * @since   1.0.0
 *
 * @package dFlip
 * @author  Deepak Ghimire
 */
class DFlip_Post_Type {
  
  /**
   * Holds the singleton class object.
   *
   * @since 1.0.0
   *
   * @var object
   */
  public static $instance;
  
  /**
   * Holds the base DFlip class object.
   *
   * @since 1.0.0
   *
   * @var object
   */
  public $base;
  
  /**
   * Primary class constructor.
   *
   * @since 1.0.0
   */
  public function __construct() {
    
    // Load the base class object.
    $this->base = DFlip::get_instance();
    
    $labels = array(
        'name'               => __( 'dFlip Book', '3d-flipbook-dflip-lite' ),
        'singular_name'      => __( 'dFlip Book', '3d-flipbook-dflip-lite' ),
        'menu_name'          => __( 'dFlip Books', '3d-flipbook-dflip-lite' ),
        'name_admin_bar'     => __( 'dFlip Book', '3d-flipbook-dflip-lite' ),
        'add_new'            => __( 'Add New Book', '3d-flipbook-dflip-lite' ),
        'add_new_item'       => __( 'Add New Book', '3d-flipbook-dflip-lite' ),
        'new_item'           => __( 'New dFlip Book', '3d-flipbook-dflip-lite' ),
        'edit_item'          => __( 'Edit dFlip Book', '3d-flipbook-dflip-lite' ),
        'view_item'          => __( 'View dFlip Book', '3d-flipbook-dflip-lite' ),
        'all_items'          => __( 'All Books', '3d-flipbook-dflip-lite' ),
        'search_items'       => __( 'Search dFlip Books', '3d-flipbook-dflip-lite' ),
        'parent_item_colon'  => __( 'Parent dFlip Books:', '3d-flipbook-dflip-lite' ),
        'not_found'          => __( 'No dFlip-Books found.', '3d-flipbook-dflip-lite' ),
        'not_found_in_trash' => __( 'No dFlip Books found in Trash.', '3d-flipbook-dflip-lite' )
    );
    
    $args = array(
        'labels'             => $labels,
        'description'        => __( 'Description.', '3d-flipbook-dflip-lite' ),
        'public'             => false,  //this removes the permalink option
        'publicly_queryable' => false,
        'exclude_from_search' => true, // if not excluded, posts will be displayed in normal search. This will hide it from other archive and taxonomy listing, and needs to be fetched manually.
        'show_ui'            => true,
        'show_in_menu'       => true,
        'query_var'          => true,
        'rewrite'            => false, //array('slug' => $this->base->slug),
        'capability_type'    => 'post',
        'has_archive'        => true,
        'hierarchical'       => false,
        'menu_position'      => null,
        'menu_icon'          => 'dashicons-book',
        'supports'           => array( 'title', 'editor', 'revisions' )
    );
    
    register_post_type( 'dflip', $args );
    
    register_taxonomy( 'dflip_category', 'dflip', array(
        'hierarchical'       => true,
        'public'             => false,
        'publicly_queryable' => false,
        'show_ui'            => true, //display the category admin page
        'show_admin_column'  => true,
        'show_in_nav_menus'  => true,
	    'rewrite'            => array( 'slug' => 'book-category' ),
    ) );
    
    if ( is_admin() ){
      add_action( 'wp_ajax_hidedflipRating', array( $this, 'hidedflipRating' ));
      if(!( defined( 'DOING_AJAX' ) && DOING_AJAX ) ) {
        $this->init_admin();
      }
    } else {// Load frontend only components.
      $this->init_front();
    }
    
  }
  
  /**
   * Loads all admin related files into scope.
   *
   * @since 1.0.0
   */
  public function init_admin() {
    
    // Remove quick editing from the dFlip post type row actions.
    add_filter( 'post_row_actions', array( $this, 'remove_quick_edit' ), 10, 1 );
    
    // Manage post type columns.
    add_filter( 'manage_dflip_posts_columns', array( $this, 'dflip_columns' ) );
    add_action( 'manage_dflip_posts_custom_column', array( $this, 'dflip_columns_content' ), 10, 2 );
    
    add_filter( 'manage_edit-dflip_category_columns', array( $this, 'dflip_cat_columns' ) );
    add_filter( 'manage_dflip_category_custom_column', array( $this, 'dflip_cat_columns_content' ), 10, 3 );
    
    add_action( 'restrict_manage_posts', array( $this, 'dflip_category_filter' ), 10, 2 );
    
    add_action( 'admin_notices', array( $this, 'display_review_help' ) );
    
  }
  
  public function init_front() {
    
    add_filter( 'the_content', array( $this, 'filter_the_pdf_attachment_content' ) );
    
  }
  
  public function hidedflipRating() {
    update_option( 'dflip_showratingdiv', 'no' );
    echo wp_send_json_success();
    exit;
  }
  
  public function display_review_help() {
    global $wp_query;
    
    if ( isset( get_current_screen()->id ) && 'edit-dflip' == get_current_screen()->id ) {
      if ( $wp_query->post_count > 2 ) {
        $post = $wp_query->posts[ $wp_query->post_count - 1 ];

        $datetime1 = new DateTime( $post->post_date );
        $datetime2 = new DateTime(); // current date
        $interval = $datetime1->diff( $datetime2 );

        if ( $interval->days > 7  && get_option( 'dflip_showratingdiv' ) != "no" ) {
          echo '<div class="dflip_review_help notice is-dismissible notice-info">
        <h2>Can you Help Us? - DearFlip</h2>
        <button type="button" class="mashsbHideRating notice-dismiss" title="Close"></button>
    	<p>Awesome, thank you for using <strong>DearFlip Plugin</strong> for more than 1 week. <br> May we ask you to give it a <strong>5-star rating</strong> on Wordpress? </br>
        This will help to spread its popularity and to make this plugin a better one.
        <br><br>Your help is much appreciated. Thank you very much,<br> ~DearHive Team
        <ul>
            <li class="float:left"><a href="https://wordpress.org/support/plugin/3d-flipbook-dflip-lite/reviews/?filter=5#new-post" class="thankyou button button-primary" target="_new" style="color: #ffffff;-webkit-box-shadow: 0 1px 0 #256e34;box-shadow: 0 1px 0 #256e34;font-weight: normal;float:left;margin-right:10px;">Yes, I Like DearFlip - I will Help with a review!</a></li>
            <li><a href="javascript:void(0);" class="mashsbHideRating button" >I already rated it</a></li>
            <li><a href="javascript:void(0);" class="mashsbHideRating">No, not good enough, I do not like to rate it!</a></li>
        </ul>
    </div>
    <script>
    jQuery( document ).ready(function( $ ) {

    jQuery(\'.mashsbHideRating\').click(function(){
        var data={\'action\':\'hidedflipRating\'}
             jQuery.ajax({
        
        url: "' . admin_url( 'admin-ajax.php' ) . '",
        type: "post",
        data: data,
        dataType: "json",
        async: !0,
        success: function(e) {
            if (e.success) {
               jQuery(\'.dflip_review_help\').slideUp(\'fast\');
			   
            }
        }
         });
        })
    
    });
    </script>
    ';
        }
      }
    }
  }
  
  /**
   * Filter out unnecessary row actions dFlip post table.
   *
   * @param array $actions Default row actions.
   *
   * @return array $actions Amended row actions.
   * @since 1.0.0
   *
   */
  public function remove_quick_edit( $actions ) {
    if ( isset( get_current_screen()->post_type ) && 'dflip' == get_current_screen()->post_type ) {
      unset( $actions['inline hide-if-no-js'] );
    }
    
    return $actions;
  }
  
  /**
   * Customize the post columns for the dFlip post type.
   *
   * @return array $columns New Updated columns.
   * @since 1.0.0
   *
   */
  public function dflip_columns( $columns ) {
    
    $columns['shortcode'] = __( 'Shortcode', '3d-flipbook-dflip-lite' );
    $columns['modified'] = __( 'Last Modified', '3d-flipbook-dflip-lite' );
    
    return $columns;
  }
  
  /**
   * Customize the post columns for the dFlip post type category page
   *
   * @param array $defaults columns.
   *
   * @return array $defaults default columns.
   * @since 1.2.9
   *
   */
  public function dflip_cat_columns( $defaults ) {
    $defaults['shortcode'] = 'Shortcode';
    
    return $defaults;
  }
  
  /**
   * Add data to the custom columns added to the dFlip post type.
   *
   * @param string $column_name Name of the custom column.
   * @param int    $post_id     Current post ID.
   *
   * @since 1.0.0
   *
   */
  public function dflip_columns_content( $column_name, $post_id ) {
    $post_id = absint( $post_id );
    
    switch ( $column_name ) {
      case 'shortcode':
        echo '[dflip id="' . esc_attr( $post_id ) . '"][/dflip]';
        break;
      
      case 'modified' :
        the_modified_date();
        break;
    }
  }
  
  /**
   * Add data to the custom columns added to the dFlip post type category page.
   *
   * @param        $c
   * @param string $column_name Name of the custom column.
   * @param        $term_id
   *
   * @return string
   * @since 1.2.9
   *
   */
  public function dflip_cat_columns_content( $c, $column_name, $term_id = "" ) {
    
    return '[dflip books="' . get_term( $term_id, 'dflip_category' )->slug . '" limit="-1"][/dflip]';
    
  }
  
  
  
  public function filter_the_pdf_attachment_content( $content ) {
    global $post;
    
    
    // Check if we're inside the main loop in a single post page.
    if ( is_single() && in_the_loop() && is_main_query() && $post->post_mime_type == "application/pdf" ) {
      $html = "";
      $lightbox = $this->base->get_config( 'attachment_lightbox' );
      
      if ( $lightbox == 'true' ) {
        $html = do_shortcode( '[dflip attachment_pdf_flipbook_lightbox="true" type="link" source="' . wp_get_attachment_url( $post->ID ) . '"]Open ' . get_the_title( $post ) . '[/dflip]' );
      } else {
        $html = do_shortcode( '[dflip source="' . wp_get_attachment_url( $post->ID ) . '"][/dflip]' );
      }
      
      return $html;
    }
    
    return $content;
  }
  
	// $which (the position of the filters form) is either 'top' or 'bottom'
	function dflip_category_filter( $post_type, $which ) {
		if (( 'top' === $which && 'dflip' === $post_type) ||
          ('bar' === $which && 'attachment' === $post_type && isset($_REQUEST['page']) && $_REQUEST['page']==='dflip-pdfs') ) {
			$taxonomy = $post_type === 'dflip' ? 'dflip_category':'dflip_pdf_category';
			$tax = get_taxonomy( $taxonomy );            // get the taxonomy object/data
			$cat = filter_input( INPUT_GET, $taxonomy ); // get the selected category slug
			
			echo '<label class="screen-reader-text" for="my_tax">Filter by ' .
				esc_html( $tax->labels->singular_name ) . '</label>';
			
			wp_dropdown_categories( [
				'show_option_all' => $tax->labels->all_items,
				'hide_empty' => 0, // include categories that have no posts
				'hierarchical' => $tax->hierarchical,
				'show_count' => 0, // don't show the category's posts count
				'orderby' => 'name',
				'selected' => $cat,
				'taxonomy' => $taxonomy,
				'name' => $taxonomy,
				'value_field' => 'slug',
			] );
		}
	}
  
  /**
   * Returns the singleton instance of the class.
   *
   * @return object DFlip_Post_Type object.
   * @since 1.0.0
   *
   */
  public static function get_instance() {
    
    if ( !isset( self::$instance ) && !( self::$instance instanceof DFlip_Post_Type ) ) {
      self::$instance = new DFlip_Post_Type();
    }
    
    return self::$instance;
    
  }
}

// Load the post-type class.
$dflip_post_type = DFlip_Post_Type::get_instance();

