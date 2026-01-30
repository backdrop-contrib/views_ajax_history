<?php
/**
 * @file
 * Provide views data and handlers for views_ajax_history.module.
 *
 * @ingroup views_module_handlers
 */

/**
 * Implements hook_views_plugins().
 */
function views_ajax_history_views_plugins() {
  return array(
    'display_extender' => array(
      'ajax_history' => array(
        'title' => t('Ajax history'),
        'help' => t('Enable the Ajax history feature for the current view.'),
        'handler' => 'views_plugin_display_extender_ajax_history',
        'uses options' => TRUE,
        'no_ui' => FALSE,
      ),
    ),
  );
}
