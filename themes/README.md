# Yasumu Theme Presets

This directory contains the theme presets for Yasumu. Basically, it's a collection of CSS files that is converted into the JSON format that Yasumu uses to provide the built-in themes to the users.

To generate the JSON files, execute the [`converter.ts`](./converter.ts) script with the desired mode (`--compact` or without `--compact` flag).
Yasumu uses compact mode to output everything in one file as `YasumuThemeConfig[]` format, while normal mode outputs the themes in separate files as `YasumuThemeConfig` objects.

# How to get the CSS files

You can use any shadcn/ui theme as a base for your custom theme. Just copy the CSS file and paste it into [presets](./presets) directory. The name of the file can be anything you want, but it is recommended to use `author.theme-name.css` format.