# Views Ajax History

This module bookmarking abilities to AJAX views. It allows users to navigate
forward and backward through previously loaded views pages without reloading the page.

## Installation

1. Download and extract the module files to your Backdrop modules directory.
2. Enable the module through the Backdrop administration interface.
3. Edit the view for which you want to enable AJAX history, and under the
   "Other" section > "Use AJAX", set to "Yes" and select "Views Ajax History".
4. (Optional) Add a list of query arguments that you'd like to exclude from the
   URL, which should be loaded with a full page refresh.
5. Apply the changes, and save the view.

## Usage

Once the module is enabled and configured for a view, users can navigate through
previously loaded views pages by clicking their browser's back and forward
buttons.

## Configuration

The module provides some configuration options for controlling how AJAX history
is handled for Views pages. These options can be found under the
"Use AJAX" section in a Views administration interface.

## License

This project is GPL v2 software. See the LICENSE.txt file in this directory
for complete text.

## Maintainers

- [Alex Höbart](https://github.com/AlexHoebart-ICPDR)
- [Herb v/d Dool](https://github.com/herbdool)

## Credits

Ported to Backdrop by Alex Höbart.

Drupal maintainers:

- Théodore Biadala - [nod_](https://www.drupal.org/u/nod_)
- Andrei Mateescu - [amateescu](https://www.drupal.org/u/amateescu)
- Joël Pittet - [joelpittet](https://www.drupal.org/u/joelpittet)
- Kálmán Hosszu - [kalman.hosszu](https://www.drupal.org/u/kalmanhosszu)
- Ivan Trokhanenko - [i-trokhanenko](https://www.drupal.org/u/i-trokhanenko)
