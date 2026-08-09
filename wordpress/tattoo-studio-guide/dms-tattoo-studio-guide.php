<?php
/**
 * Plugin Name: Dich mit Stich Tattoo-Studio-Guide
 * Description: Strukturierte Headless-CPTs und ACF-JSON-Anbindung für den Tattoo-Studio-Guide.
 * Version: 0.1.0
 */

defined('ABSPATH') || exit;

add_action('init', static function (): void {
    $shared = [
        'public' => false,
        'publicly_queryable' => false,
        'show_ui' => true,
        'show_in_menu' => true,
        'show_in_rest' => true,
        'has_archive' => false,
        'rewrite' => false,
        'supports' => ['title', 'editor', 'excerpt', 'thumbnail', 'revisions'],
    ];

    register_post_type('tattoo_studio', array_merge($shared, [
        'labels' => [
            'name' => 'Tattoo-Studios',
            'singular_name' => 'Tattoo-Studio',
            'add_new_item' => 'Tattoo-Studio hinzufügen',
            'edit_item' => 'Tattoo-Studio bearbeiten',
        ],
        'menu_icon' => 'dashicons-location-alt',
        'rest_base' => 'tattoo-studios',
    ]));

    register_post_type('tattoo_studio_city', array_merge($shared, [
        'labels' => [
            'name' => 'Studio-Stadtguides',
            'singular_name' => 'Studio-Stadtguide',
            'add_new_item' => 'Studio-Stadtguide hinzufügen',
            'edit_item' => 'Studio-Stadtguide bearbeiten',
        ],
        'menu_icon' => 'dashicons-admin-site-alt3',
        'rest_base' => 'tattoo-studio-cities',
    ]));

    register_taxonomy('tattoo_style', ['tattoo_studio'], [
        'labels' => ['name' => 'Tattoo-Stile', 'singular_name' => 'Tattoo-Stil'],
        'public' => false,
        'show_ui' => true,
        'show_in_rest' => true,
        'hierarchical' => false,
        'rest_base' => 'tattoo-styles',
        'rewrite' => false,
    ]);
});

add_filter('acf/settings/load_json', static function (array $paths): array {
    $paths[] = plugin_dir_path(__FILE__) . 'acf-json';
    return array_values(array_unique($paths));
});

add_filter('acf/settings/save_json', static function (string $path): string {
    return plugin_dir_path(__FILE__) . 'acf-json';
});
