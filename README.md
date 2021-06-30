Auckland Museum Google Chrome extension
===========

About this code
-----

This is a [Google Chrome extension](http://aucklandmuseum.com/collections-extension) that displays images from the collections of Auckland War Memorial Museum Tāmaki Paenga Hira. It's based on the [Library of Congress' "Free to Use" extension](https://blogs.loc.gov/thesignal/2018/08/explore-historical-images-through-the-library-of-congress-free-to-use-browser-extension/). The images are housed in the [Auckland Museum Collections Flickr account](https://www.flickr.com/photos/aucklandmuseum_collections/albums/with/72157713787050202).

[![Screenshot of the extension in use](https://user-images.githubusercontent.com/12046008/79305707-fe0ea680-7f47-11ea-8259-c1dc9449a7a2.jpg)](https://chrome.google.com/webstore/detail/auckland-museum-collectio/hbbhohgdcbfbjljeoflljbeiocnhdfag)

About Auckland Museum
-----

Since 1852, Auckland Museum has been amassing a world-class, encyclopaedic collection, one that now comprises some three million objects and counting—each telling a story that helps interpret, understand, and illuminate the history of Aotearoa and its people.

The Museum is a war memorial for the province of Auckland, and houses one of New Zealand's finest heritage research libraries. The social-history collection comprises more than 200,000 objects, including the world's leading collection of taonga Māori (Māori treasures), which are cared for alongside significant artefacts from throughout Polynesia and the Pacific, other ethnographic objects, and prestigious archaeological material.

Its natural-sciences collection includes thousands of important botanical, marine and land-vertebrate specimens, and its documentary-heritage collection brings to life the rich social, artistic, and commercial history of Tāmaki Makaurau Auckland through original letters and diaries, photographs and artworks, maps, ephemera, rare books, early newspapers. There is also a collection of musical instruments, an impressive and wide-ranging decorative-arts collection, and the country's leading collection of European, Asian and New Zealand applied arts, including contemporary and historic ceramics, glass, metalwork, furniture, textiles, and jewellery.

See more at [aucklandmuseum.com/collections](http://aucklandmuseum.com/collections).

Build locally
-----

### install dependencies

```
$ npm install
```

### serve with hot reload at localhost:3000

```
$ npm run dev
```

### build for production

```
$ npm run build
```

You'll need to manually increment [the version number](https://developer.chrome.com/docs/extensions/mv3/manifest/version/) in `./src/manifest.json`.
After you've built your version, it'll be in `/dist`.
Run this command to create a [zip](https://ss64.com/osx/zip.html) file on your Desktop:

```
$ npm run zip
```

Upload that file to the [Chrome Web Store Developer Console](https://chrome.google.com/webstore/devconsole/) as a new version.
