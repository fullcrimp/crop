# crop
## Simple fronend image cropping tool
Cropping tool to work with Cross-Origin Resource Sharing policy restricted images.

- Returns cropped base64 line or url of the image with crop coordinated `{url, x, y, w, h}`.
- Canvas needed
- Canvas is set to be responsive and fill parent element 100%
- Mobile events is in progress


##Planned API/deps
No dependencies, just a compatible with `querySelectorAll`, `FileReader` and `canvas.toDataURL`,
so the most close guess would be >ie8.

Html code prereqs
- to have a canvas

Optional ways to load:
- set src in text input
- set file input
- set src directly

```html
<canvas id="canvas-live" width="400" height="400"></canvas>
```

Javascript initialisation and API:
```javascript
var c = Crop('#canvas-live');
// canvas selector

c.setFileInput('#inp-file', function() {
    console.log('file added');
});
// file input selector
// on change event we load the image to the canvas

c.setUrlInput('#inp-src', '#btn-src', 'click');
// text input selector where to get src value
// button(or whatever)  selector on firing which we load an image to the canvas with image with src from previous text input
// event type on button selector

c.setCropTrigger('#btn-crop', 'click', function(val) {
    console.log(val);
});
// button(or whatever) selector on pushing which we crop and return result
// event
// callback function

c.setUrl(url);
// you can set the image source by passing url directly

c.setBase64(val);
// you can set the image by passing base64 string directly
```

##Tested
- MacBook Pro (Retina, Mid 2012)
- OSX El Capitan 10.11.1
- Safari Version 9.0.1
- Google Chrome 47.0.2526.73 (64-bit)
- Mozilla Firefox 35.0.1


- Windows 8
- Google Chrome 47.0.2526.80
- Internet Explorer 11.0.9600.17105

##Known issues
- No mobile support yet
- Blurry image when zooming in browser
