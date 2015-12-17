
function Crop(canvasLiveSelector, options){
    // short functionality description
    // (image) -> (canvas) -> covert to data -> image -> (canvas with size of a crop) -> covert to data
    // -> callback(data || crop details with url)

    // temp logging fn
    var log = console.log.bind(console);

    if ( typeof canvasLiveSelector === 'undefined') {
        throw new Error('cannot init the crop module wotthout preset canvas selector');
    }


    // necessary values
    var canvasLive = document.querySelectorAll(canvasLiveSelector)[0],
        ctxLive = canvasLive.getContext('2d'),

        // temp hidden canvas
        canvasCropped = document.createElement('canvas'),
        ctxCropped = canvasCropped.getContext('2d'),

        dragging = false, // dragging event flag
        tainted = false, // we may not need it
        imgSource = new Image(),
        imgToCrop = new Image(),
        outputFormat = 'image/jpeg',
        outputQuality = 1;


    // optional values
    var inpSrcTrigger, inpSrcTriggerEvent, // selectors for url trigger
        cropTrigger, cropTriggerEvent,

        inpSrc, // url image input
        inpFile; // file image input




    // selection canvas sizes and predefined properties
    var sel = {
        x: undefined,
        y: undefined,
        w: undefined,
        h: undefined,
        lineColor: '#fff',
        lineWidth: 2,
        squareSize: 12,

        startDragShiftX: undefined,
        startDragShiftY: undefined,
    };

    // source canvas sizes
    var source = {
            x: undefined,
            y: undefined,
            w: undefined,
            h: undefined,
        };




    // core events initalisation
    (function init(){
        /******************************************************************
        * EVENT LIST
        ******************************************************************/


        // window events
        window.addEventListener('load', function() {
            resizeCanvasToParentEl(ctxLive, canvasLive);
        });

        window.addEventListener('resize', function() {
            resizeCanvasToParentEl(ctxLive, canvasLive);

            calculateSourceImagePos(imgSource, ctxLive, canvasLive);
            resetSelectionToDefault(canvasLive);
            drawCanvasLive();
        });


        // draw image if loaded
        imgSource.addEventListener('load', function() {

            calculateSourceImagePos(imgSource, ctxLive, canvasLive);
            resetSelectionToDefault(canvasLive);
            drawCanvasLive();
        });

        // imgSource.addEventListener('error', function(e) {
        //     log(e);
        // });


        // EDITING EVENTS
        // click
        canvasLive.addEventListener('click', function(e) {
            saveMouseCoordinates(e, canvasLive);
            drawCanvasLive();
        });

        // pseudo-dragging events
        canvasLive.addEventListener('mousedown', function(e) {
            dragging = true;
            saveDragShiftValues(e, canvasLive);
        });

        canvasLive.addEventListener('mousemove', function(e) {
            if (dragging) {
                saveMouseCoordinates(e, canvasLive);
                drawCanvasLive();
            }
        });

        canvasLive.addEventListener('mouseup', function() {
            dragging = false;
        });

        canvasLive.addEventListener('mouseleave', function() {
            dragging = false;
        });
    })();




    /******************************************************************
    * API FUNCTIONS
    ******************************************************************/
    // init file input
    function setImageSourceFileInput(inpFileSelector, successCallback) {
        inpFile = document.querySelectorAll(inpFileSelector)[0];

        //initalise
        inpFile.addEventListener('change', function() {
            var imageSourceFile  = new FileReader();

            imageSourceFile.addEventListener('loadend', function() {
                imgSource.src = imageSourceFile.result;
            });

            if (inpFile.files[0]) {
                imageSourceFile.readAsDataURL(inpFile.files[0]);
                successCallback();
            }
        });
    }


    //
    function setImageSourceUrlInput(inpSrcSelector, inpSrcTriggerSelector, inpSrcTriggerEventVal) {

        if ( typeof inpSrcSelector === 'undefined' || typeof inpSrcTriggerSelector === 'undefined') {
            throw new Error('wrong values in setImageSourceUrlInput');
        }

        inpSrc = document.querySelectorAll(inpSrcSelector)[0];
        inpSrcTrigger = document.querySelectorAll(inpSrcTriggerSelector)[0];
        inpSrcTriggerEvent = inpSrcTriggerEventVal || 'click';

        inpSrcTrigger.addEventListener(inpSrcTriggerEvent, function() {
            // imgSource.setAttribute('crossOrigin', 'Anonymous');
            imgSource.src = inpSrc.value;
        });
    }


    // set source from url string
    function setUrlSource(url) {
        var patt = /(https?:\/\/.*\.(?:png|jpg))/i;

        // if (!patt.test(url)) {
        //     return;
        // }
        imgSource.src = url;
    }


    // set source from base64 string
    function setBase64Source(string) {
        imgSource.src = url;
    }


    // set crop trigger dom elemnt
    function setCropTrigger(cropTriggerSelector, cropTriggerEventVal, callback) {

        if ( typeof cropTriggerSelector === 'undefined') {
            throw new Error('wrong values in setCropTrigger');
        }

        cropTrigger = document.querySelectorAll(cropTriggerSelector)[0];
        cropTriggerEvent = cropTriggerEventVal || 'click';

        // make a cropped image
        // or send crop coordinates with image link
        cropTrigger.addEventListener(cropTriggerEvent, function() {
            // draw source image without a selection
            drawSourceImage(imgSource, ctxLive, canvasLive);

            try {
                imgToCrop.src = canvasLive.toDataURL();
                resizeCanvasToSelection(ctxCropped, canvasCropped);
            } catch(e) {
                // tainted = true;

                var deScale = imgSource.width / source.w;

                callback({
                    url: imgSource.src,
                    x: (sel.x - source.x) * deScale,
                    y: (sel.y - source.y) * deScale,
                    w: source.w * deScale,
                    h: source.h * deScale,
                });
            }

            // draw selection
            drawSelection(ctxLive);
        });

        // draw image if loaded
        imgToCrop.addEventListener('load', function() {
            drawCropImage(imgToCrop, ctxCropped, canvasCropped);

            // cache
            var result = canvasCropped.toDataURL();
            callback(result);
        });

        imgToCrop.addEventListener('error', function(e) {
            log(e);
        });
    }




    /******************************************************************
    * API FUNCTIONS
    ******************************************************************/
    //reset selection to default settings
    function resetSelectionToDefault(canvas) {
        var resetVals = {
            x: source.x + source.w / 4,
            y: source.y + source.h / 4,
            w: source.w / 2,
            h: source.h / 2
        };
        // log(resetVals);
        for (prop in resetVals) {
            sel[prop] = resetVals[prop];
        }
    }


    function saveDragShiftValues(e, canvas) {
        var x = e.clientX - canvas.getBoundingClientRect().left,
            y = e.clientY - canvas.getBoundingClientRect().top;

            // shift between click and left top corner of the selection area
            sel.startDragShiftX = x - sel.x;
            sel.startDragShiftY = y - sel.y;

            log(sel);
    }

    //
    function saveMouseCoordinates(e, canvas) {
        // click coords relative to the canvas
        // @TODO shift to pageX, pageY
        var x = e.clientX - canvas.getBoundingClientRect().left,
            y = e.clientY - canvas.getBoundingClientRect().top,

            // shift between click and left top corner of the sel
            shiftX = x - sel.x,
            shiftY = y - sel.y,

            // central dividing reaction area coord lines
            centerX = sel.x + sel.w / 2,
            centerY = sel.y + sel.h / 2,
            radius = (sel.w < sel.h) ? sel.w / 2 : sel.h / 2;

        // radius-based calculation of dragging area
        // if ( Math.abs(x - centerX) < radius && Math.abs(y - centerY) < radius) {
        //     log('drag');
        //     sel.x = x - sel.startDragShiftX;
        //     sel.y = y - sel.startDragShiftY;
        //     return;
        // }

        // square-based calculation of dragging area
        if ((x > sel.x + sel.squareSize)
         && (x < (sel.x + sel.w - sel.squareSize))
         && (y > sel.y + sel.squareSize)
         && (y < (sel.y + sel.h - sel.squareSize))) {
            log('drag');
            sel.x = x - sel.startDragShiftX;
            sel.y = y - sel.startDragShiftY;
            return;
        }

        // resizing
        // top-left
        if ( x < centerX && y < centerY) {
            sel.x = x;
            sel.y = y;
            sel.w -= shiftX;
            sel.h -= shiftY;

            // top-right
        } else if ( x > centerX && y < centerY) {
            sel.y = y;
            sel.w = x - sel.x;
            sel.h -= shiftY;

            // bottom-right
        } else if ( x > centerX && y > centerY) {
            sel.w = x - sel.x;
            sel.h = y - sel.y;

            // bottom-left
        } else if ( x < centerX && y > centerY) {
            sel.x = x;
            sel.w -= shiftX;
            sel.h = y - sel.y;
        }
    }


    // resizes canvas to a parent element
    function resizeCanvasToParentEl(ctx, canvas) {
        var parentElRect = canvas.parentElement.getBoundingClientRect(),
        parentElWidth = parentElRect.width,
        parentElHeight = parentElRect.height;

        // no need in these two
        // canvas.width = parentElWidth;
        // canvas.height = parentElHeight;
        ctx.canvas.width  = parentElWidth;
        ctx.canvas.height = parentElHeight;
    }


    // resizes canvas to a particular image
    function resizeCanvasToSelection(ctx, canvas) {
        // canvas.width = sel.w;
        // canvas.height = sel.h;
        ctx.canvas.width  = sel.w;
        ctx.canvas.height = sel.h;
    }


    //  redraw function aggregator
    function drawCanvasLive() {
        clearCanvas(ctxLive, canvasLive);
        if (!source.x || !source.y || !source.w || !source.h) {
            calculateSourceImagePos(imgSource, ctxLive, canvasLive);
        }
        drawSourceImage(imgSource, ctxLive, canvasLive);
        drawSelection(ctxLive);
    }


    //
    function calculateSourceImagePos(img, ctx, canvas) {
        var x, y, w, h;

        // @TODO: override to drag the whole selection

        // scaling to live canvas
        if (canvas.height > canvas.width) {

            if (img.height > img.width) {
                // log('vertical canvas - vertical image');
                h = canvas.height;
                w = img.width * h / img.height;
                y = 0;
                x = (canvas.width - w) / 2;

            } else {
                // log('vertical canvas - horizontal image');
                w = canvas.width;
                h = img.height * w / img.width;
                x = 0;
                y = (canvas.height - h) / 2;
            }
        } else {

            if (img.height < img.width) {
                // log('horizontal canvas - horizontal image');
                h = canvas.height;
                w = img.width * h / img.height;
                y = 0;
                x = (canvas.width - w) / 2;

            } else {
                // log('horizontal canvas - vertical image');
                h = canvas.height;
                w = img.width * h / img.height;
                y = 0;
                x = (canvas.width - w) / 2;
            }
        }

        // preserve image absolute coords
        source = {
            x: x,
            y: y,
            w: w,
            h: h
        }
    }


    // draw loaded image to a canvas
    function drawSourceImage(img, ctx, canvas) {

        // drawing dark bg
        ctx.beginPath();
        ctx.drawImage(img, source.x, source.y, source.w, source.h);
        ctx.fillStyle = 'rgba(0, 0, 0, .33)';
        ctx.fillRect(source.x, source.y, source.w, source.h);

        // drawing cropping area
        ctx.save();
        ctx.rect(sel.x, sel.y, sel.w, sel.h);
        ctx.clip();

        // drawing bright selection area
        ctx.drawImage(img, source.x, source.y, source.w, source.h);
        ctx.restore();
    }


    // draw loaded image to live canvas
    function drawCropImage(img, ctx, canvas) {
        ctx.drawImage(img, -sel.x, -sel.y);
    }


    // draw sel rectangle
    // dotted = true - makes to draw dotted line without squares in the corners
    // dotted = false - solid line with squares
    function drawSelection(ctx, dotted) {
        ctx.beginPath();

        // draw squares in the corners
        ctx.fillStyle = sel.lineColor;

        // top-left
        ctx.fillRect(sel.x - sel.squareSize / 2,
                     sel.y - sel.squareSize / 2,
                     sel.squareSize,
                     sel.squareSize);

        // top-right
        ctx.fillRect(sel.x + sel.w - sel.squareSize / 2,
                     sel.y - sel.squareSize / 2,
                     sel.squareSize,
                     sel.squareSize);

        // bottom-right
        ctx.fillRect(sel.x + sel.w - sel.squareSize / 2,
                     sel.y + sel.h - sel.squareSize / 2,
                     sel.squareSize,
                     sel.squareSize);

        // bottom-left
        ctx.fillRect(sel.x - sel.squareSize / 2,
                     sel.y + sel.h - sel.squareSize / 2,
                     sel.squareSize,
                     sel.squareSize);

        // selection rectangle
        ctx.rect(sel.x, sel.y, sel.w, sel.h);

        ctx.lineWidth = sel.lineWidth;
        ctx.strokeStyle = sel.lineColor;
        ctx.stroke();
    }


    // clean canvas ctx
    function clearCanvas(ctx, canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }


    /******************************************************************
    * FACADE
    ******************************************************************/
    return {
        setFileInput: setImageSourceFileInput,
        setUrlInput: setImageSourceUrlInput,
        setUrl: setUrlSource,
        setBase64: setBase64Source,
        setCropTrigger: setCropTrigger,

    }
};
