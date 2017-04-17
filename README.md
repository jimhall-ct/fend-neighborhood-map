# Neighborhood Map Project

Udacity Front-End Developer Project

## Workflow with Gulp

#### Setup the environment

Requirements: [NPM](https://nodejs.org), [ImageMagick](https://www.imagemagick.org/script/download.php)

1. From the command line, navigate to the root directory containing the package.json file
```shell
cd <path-to-package.json>
```
2. Install the developer dependencies:
```shell
npm install
```
3. Run default gulp task
```shell
gulp
```
The default task is responsible for copying and minifying the css, javascript, and html files into the production directory. It will optimize and copy images into their respective production directory. It will update when new files are created or updated. A local web server is available to view production site and will automatically update (live reload) when changes are made to source files.

4. Resize Images gulp task (Optional)
```shell
gulp resize_images
```
This task will load all images (png, jpg, gif) from development directories, resize them, move them to their production directories to be used if necessary. The task by default will create images of sizes (120, 240, 360, 480, 640, 800, 1000) with a quality of 0.5, no images will be upscaled.