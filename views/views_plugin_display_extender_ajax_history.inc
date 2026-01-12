<?php
/**
 * @file
 * Views plugin to add option to preserve history in Ajax views.
 */

/**
 * Options to enable ajax history.
 */
class views_plugin_display_extender_ajax_history extends views_plugin_display_extender {

  /**
   * {@inheritdoc}
   */
  function option_definition() {
    $options = parent::option_definition();

    $options['enable_ajax_history'] = array('default' => FALSE, 'bool' => TRUE);
    $options['exclude_ajax_args'] = array('default' => '');

    return $options;
  }

  /**
   * {@inheritdoc}
   */
  function options_definition_alter(&$options) {
    $options['enable_ajax_history'] = array('default' => FALSE, 'bool' => TRUE);
    $options['exclude_ajax_args'] = array('default' => '');
  }

  /**
   * {@inheritdoc}
   */
  function options_form(&$form, &$form_state) {
    parent::options_form($form, $form_state);

    /** @var views_plugin_display $this->display */
    $display = $this->display;

    if ($form_state['section'] == 'use_ajax') {
      // Add opportunity to enable view ajax history handler for this view.
      $form['enable_ajax_history'] = [
        '#title' => t('AJAX history'),
        '#type' => 'checkbox',
        '#description' => t('Enable Views AJAX history.'),
        '#default_value' => $display->get_option('enable_ajax_history'),
        '#states' => [
          'visible' => [
            ':input[name="use_ajax"]' => ['value' => 1],
          ],
        ],
      ];
      $form['exclude_ajax_args'] = [
        '#title' => t('Exclude query arguments from the URL'),
        '#type' => 'textarea',
        '#description' => t('Add the list of query arguments that you want to exclude from the URL. You need to specify each key in a separated line and they will be excluded with a "Started by" operation.'),
        '#default_value' => $display->get_option('exclude_ajax_args'),
        '#states' => [
          'visible' => [
            ':input[name="use_ajax"]' => ['value' => 1],
            ':input[name="enable_ajax_history"]' => ['checked' => TRUE],
          ],
        ],
      ];
    }
  }

  /**
   * {@inheritdoc}
   */
  function options_validate(&$form, &$form_state) {
    if (isset($form_state['values']['use_ajax']) && !$form_state['values']['use_ajax']) {
      // Prevent use ajax history when ajax for view are disabled.
      $form_state['values']['enable_ajax_history'] = 0;
    }
  }

  /**
   * {@inheritdoc}
   */
  function options_submit(&$form, &$form_state) {
    /** @var views_plugin_display $this->display */
    $display = $this->display;

    if ($form_state['section'] == 'use_ajax') {
      $display->set_option('enable_ajax_history', (bool) $form_state['values']['enable_ajax_history']);
      $display->set_option('exclude_ajax_args', $form_state['values']['exclude_ajax_args']);
    }
  }
}
