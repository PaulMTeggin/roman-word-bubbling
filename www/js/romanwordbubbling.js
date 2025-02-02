/**
 *
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

const DEBUG = false;
var fontName = "apompadour_custom";

document.getElementById("textInput").addEventListener(
  "keyup",
  function() {
    renderImage();
  },
  false
);

let feedbackDialogue;

function initializeSettings() {
  const mobile = window.outerWidth < 500 ? true : false;

  if (typeof mdc == "undefined") {
    document.body.innerHTML = "Error: could not load interface compoments<br>" + 
      "Please let us know about this error by emailing us at romanwordbubbling at gmail<br>" +
      "In the meantime, you can use our <a href='https://roman-word-bubbling-stable.appspot.com'>alternate version with a simplified interface</a>";
    return;
  }

  // dialogs
  const infoDialog = new mdc.dialog.MDCDialog(
    document.getElementById("info-dialog")
  );
  document.getElementsByClassName("info")[0].addEventListener("click", () => {
    infoDialog.open();
  });
  const helpDialog = new mdc.dialog.MDCDialog(
    document.getElementById("help-dialog")
  );
  document.getElementsByClassName("help")[0].addEventListener("click", () => {
    helpDialog.open();
  });
  feedbackDialog = new mdc.dialog.MDCDialog(
    document.getElementById("feedback-dialog")
  );
  document
    .getElementsByClassName("feedback")[0]
    .addEventListener("click", () => {
      feedbackDialog.open();
    });

  //sliders
  const sliders = document.querySelectorAll(".slider-container");
  for (const slider of sliders) {
    const sliderElement = slider.getElementsByClassName("mdc-slider")[0];
    const sliderManualInput = slider.getElementsByClassName(
      "slider-manual-input"
    )[0];
    sliderManualInput.value = sliderElement.dataset.value;
    const mdcSlider = new mdc.slider.MDCSlider(sliderElement);
    mdcSlider.listen("MDCSlider:input", () => {
      sliderElement.dataset.value = mdcSlider.value;
      sliderManualInput.value = Math.floor(mdcSlider.value);
      renderImage();
    });
    sliderManualInput.addEventListener("change", () => {
      sliderElement.dataset.value = sliderManualInput.value;
      mdcSlider.value = sliderManualInput.value;
      renderImage();
    });
  }

  // colors
  const colorOptions = document.querySelectorAll(".color");
  for (const colorChoice of colorOptions) {
    colorChoice.addEventListener("click", e => {
      for (const color of colorOptions) {
        color.classList.remove("selected");
      }
      e.target.classList.add("selected");
      renderImage();
    });
  }

  // drawer controls
  const drawer = document.getElementsByClassName("mdc-drawer__container")[0];
  const controls = document.getElementsByClassName("controls")[0];
  const close = drawer.getElementsByClassName("close")[0];
  const edit = document.getElementsByClassName("edit")[0];
  close.addEventListener("click", () => {
    drawer.classList.add("collapsed");
    controls.classList.add("collapsed");
    renderImage();
  });
  edit.addEventListener("click", () => {
    drawer.classList.remove("collapsed");
    controls.classList.remove("collapsed");
    renderImage();
  });

  // More fonts
  addFontIfAvailable("Trebuchet", "'Trebuchet MS'");
  addFontIfAvailable("Comic Sans", "'Comic Sans Ms'");
}

function addFontIfAvailable(fontText, fontValue) {
  var fontDetector = new Detector();
  if (fontDetector.detect(fontValue)) {
    const fontChooser = document.getElementById("fontChooser");
    var option = document.createElement("option")
    option.text = fontText;
    option.value = fontValue;
    fontChooser.add(option, fontChooser.length - 1);
  }

}

function updateFont() {
  fileButton = document.getElementById("fontFile");
  selectedFont = document.getElementById("fontChooser").value;
  if (selectedFont === "custom") {
    fileButton.hidden = false;
  } else {
    // Hide the file picker if it isn't already.
    // Also clear it so the onchange event will fire again
    if (fileButton.hidden == false) {
      fileButton.hidden = true;
      fileButton.value = "";
    }
    fontName = selectedFont;
  }
  renderImage();
}

// Returns the colors in an array in ["r", "g", "b"] format
function getColor() {
  const colorNode = document.getElementsByClassName("selected")[0];
  rgbString = colorNode.style.backgroundColor;
  return rgbString
    .substr(4, rgbString.length - 5)
    .replace(" ", "")
    .split(",");
}

function loadCustomFont() {
  file = document.getElementById("fontFile").files[0];
  if (file) {
    var reader = new FileReader();
    reader.onload = function(event) {
      var customFont = new FontFace("userFont", event.target.result);
      customFont.load().then(function(loadedFont) {
        document.fonts.add(loadedFont);
        fontName = "userFont";
        renderImage();
      });
    };
    reader.readAsArrayBuffer(file);
  }
}

function startAnimateText() {
  let animateState = document.getElementById("animateText").value;
  if (animateState === "0") {
    document.getElementById("animateText").value = "1";
    document.getElementById("animating").style.visibility = "visible";
    renderImage();
  }
}

function renderImage() {
  let fontSize = parseInt(
    document.getElementById("fontSize").dataset.value,
    10
  );
  // Set gapWidth and outlineThickness as a percentage of the font size
  let gapWidth =
    (fontSize *
      parseInt(document.getElementById("gapWidth").dataset.value, 10)) /
    100;
  let outlineThickness =
    (fontSize *
      parseInt(document.getElementById("outlineThickness").dataset.value, 10)) /
    100;
  let padding = gapWidth + outlineThickness;
  let removeText = document.getElementById("removeText").checked;
  let animateText = document.getElementById("animateText").value === "1";
  if (animateText) removeText = true; // Want to remove text in bubbleWord because we preseve the text image directly

  let darkMode = document.getElementById("darkMode").checked;
  let text = document.getElementById("textInput").value;
  var tCtx = document.getElementById("textCanvas").getContext("2d"); //Hidden canvas
  let blurRadius = 3;

  let borderColorRgb = getColor();
  let color = null;
  r = parseInt(borderColorRgb[0], 10);
  g = parseInt(borderColorRgb[1], 10);
  b = parseInt(borderColorRgb[2], 10);

  if (darkMode) {
    document.body.style.backgroundColor = "black";
    // Invert the color for dark mode because it will get inverted back later
    // Doing it this way ensures the blurring will use the right background color
    color = new cv.Scalar(255 - r, 255 - g, 255 - b);
  } else {
    document.body.style.backgroundColor = "transparent";
    color = new cv.Scalar(r, g, b);
  }

  tCtx.font = fontSize + "px " + fontName; // Has to be set every time
  var spaceWidth = tCtx.measureText(" ").width;
  var lineHeight = 1.25 * fontSize + padding; // TODO: padding*2

  var lines = text.split('\n');
  var lineCount = 0;
  var maxLineWidth = 0;
  var images = [];
  for (var i = 0; i < lines.length; i++) {
    images[lineCount] = [];
    var words = lines[i].split(" ");
    var x = -spaceWidth; // So we don't need an if at the start of the loop
    var wordCount = 0;
    for (var j = 0; j < words.length; j++) {
      x = x + spaceWidth;
      var word = words[j];
      if (word === "") {
        continue;
      }
      // TODO: Check for special characters before measuring
      tCtx.font = fontSize + "px " + fontName; // Has to be set every time
      var wordWidth = tCtx.measureText(word).width;
      // If this isn't the first word and it overruns the line, start a new line
      const drawer = document.getElementsByClassName("mdc-drawer__container")[0];
      var drawerWidth = 256;
      if(drawer.classList.contains("collapsed")) {
        drawerWidth = 0;
      }
      if (x + wordWidth > window.innerWidth - drawerWidth && wordCount > 0) {
        // TODO: A lot of this is duplicated code, clean it up
        var lineWidth = x + padding;
        if (lineWidth > maxLineWidth) {
          maxLineWidth = lineWidth;
        }
        wordCount = 0;
        x = 0;
        lineCount++;
        images[lineCount] = [];
      }
      tCtx.canvas.height = lineHeight + padding*2;
      tCtx.canvas.width = wordWidth + padding*2;

      tCtx.fillStyle = "white";
      tCtx.fillRect(0, 0, tCtx.canvas.width, tCtx.canvas.height);
      tCtx.font = fontSize + "px " + fontName; // Has to be set every time
      tCtx.fillStyle = "black";
      tCtx.fillText(word, padding, fontSize + padding);
    
      var textImageRGBA = cv.imread("textCanvas");
      var textImage = cv.Mat.zeros(textImageRGBA.rows, textImageRGBA.cols, cv.CV_8UC3);
      cv.cvtColor(textImageRGBA, textImage, cv.COLOR_RGBA2RGB, 0);
      let borderImage = bubbleWord(textImage, color, removeText, animateText, darkMode, gapWidth, outlineThickness, blurRadius);

      if (animateText) {
        let mask = cv.Mat.zeros(textImage.rows, textImage.cols, cv.CV_8UC1);
        cv.cvtColor(textImage, mask, cv.COLOR_RGBA2GRAY, 0);
        cv.threshold(mask, mask, 254, 255, cv.THRESH_BINARY); // Only want to mask what is currently pure black
        if (darkMode) {         
          cv.bitwise_not(textImage, textImage); // Invert the colours in the text - mask has identified the correct pixels regardless of dark mode
        }
        cv.bitwise_not(mask, mask); // Invert the mask so we can write through it
        // Store the text image and mask for later animation
        images[lineCount][wordCount] = [borderImage, new cv.Rect(x, lineHeight*lineCount, tCtx.canvas.width, tCtx.canvas.height), textImage, mask];
      } else {
        // Not animating, so just store the border (bubble) and the rectangle
        images[lineCount][wordCount] = [borderImage, new cv.Rect(x, lineHeight*lineCount, tCtx.canvas.width, tCtx.canvas.height)];
      }

      x = x + wordWidth;
      wordCount++;
    }
    var lineWidth = x + padding;
    if (lineWidth > maxLineWidth) {
      maxLineWidth = lineWidth;
    }
    lineCount++;
  }
  // Reset
  tCtx.canvas.height = lineCount * lineHeight + padding*2; // extra padding for top/bottom (no overlap)
  tCtx.canvas.width = maxLineWidth + padding;
  // Clear
  let finalImage = cv.Mat.zeros(tCtx.canvas.height, tCtx.canvas.width, cv.CV_8UC3);
  
  if (!darkMode) {
    cv.bitwise_not(finalImage, finalImage);
  }

  for (var i = 0; i < images.length; i++) {
    for (var j = 0; j < images[i].length; j++) {
      var image = images[i][j][0];
      cv.imshow("textCanvas", image);
      var rect = images[i][j][1];
      let dest = finalImage.roi(rect);
      if(darkMode) {
        cv.bitwise_or(dest, image, dest);
      } else {
        cv.bitwise_and(dest, image, dest);
      }

      image.delete();
    }
  }
  debugOutline(finalImage, new cv.Scalar(255, 0, 0));

  outputImage = document.getElementById("output");
  if (animateText) {
    animateWords(finalImage, images, darkMode);
    // gif_data_url = animateWords(finalImage, images, darkMode);
    // outputImage.src = gif_data_url;
  } else {
    cv.imshow("textCanvas", finalImage);
    outputImage.src = document.getElementById("textCanvas").toDataURL();  
  }

  finalImage.delete();
}

function animateWords(finalImage, images, darkMode) {
  // Extra height is half the maximum height across all words in the first row
  let extraRows = 0;
  if (images.length > 0) {
    for (var j = 0; j < images[0].length; j++) {    
      extraRows = Math.max(extraRows, images[0][j][1].height);
    }  
  }
  extraRows = 1 + Math.floor(extraRows / 2);

  // Width of longest word to allow room for words to bounce in from the left
  let extraCols = 0;
  for (var i = 0; i < images.length; i++) {    
    for (var j = 0; j < images[i].length; j++) {    
      extraCols = Math.max(extraCols, images[i][j][1].width);
    }  
  }
  
  let workingImage = cv.Mat.zeros(finalImage.rows + extraRows, finalImage.cols + extraCols, cv.CV_8UC3);
  if (!darkMode) {
    cv.bitwise_not(workingImage, workingImage);
  }

  // Copy final image into destination rectangle
  let fiRect = new cv.Rect(extraCols, extraRows, finalImage.cols, finalImage.rows)
  let fiDest = workingImage.roi(fiRect);
  if(darkMode) {
    cv.bitwise_or(fiDest, finalImage, fiDest);
  } else {
    cv.bitwise_and(fiDest, finalImage, fiDest);
  }

  // finalImage is now the 'clean' version that is updated when a word animation finishes
  // workingImage is the version that's amended in each animation frame
  // but at this point, workImage is the correct size
  finalImage = cv.Mat.zeros(workingImage.rows, workingImage.cols, cv.CV_8UC3);
  workingImage.copyTo(finalImage);

  var encoder = new Animated_GIF({
    useQuantizer: false
  }); 

  encoder.setSize(finalImage.cols, finalImage.rows);
  encoder.setRepeat(0); // loop forever
  encoder.setDelay(1 / 50); // 50 fps

  for (var i = 0; i < images.length; i++) {
    for (var j = 0; j < images[i].length; j++) {    
      let textRect = images[i][j][1];
      let textImage = images[i][j][2];
      let mask = images[i][j][3];

      animateSingleWord(encoder, finalImage, workingImage, textRect, extraRows, extraCols, textImage, mask, darkMode);
      workingImage.copyTo(finalImage); // Preserve the final location of each word as it finishes animating
    }
  } 
  
  // Wait for two seconds at the end
  encoder.setDelay(2);
  var tCtx = document.getElementById("textCanvas").getContext("2d")
  encoder.addFrameImageData(tCtx.getImageData(0, 0, finalImage.cols, finalImage.rows));

  let downloadAnimation = document.getElementById("downloadAnimation").checked;

  if (downloadAnimation) {
    encoder.getBlobGIF(function(gif_blob) {
      document.getElementById("animateText").value = "0";
      document.getElementById("animating").style.visibility = "hidden";
  
      let text = document.getElementById("textInput").value;
      let downloadFilename = sanitizeFilename(text, '') + ".gif";

      let templink = document.createElement("a");
      templink.download = downloadFilename;
      templink.href= URL.createObjectURL(gif_blob);
      templink.click();
  
      encoder.destroy();
    });
  } else {
    encoder.getBase64GIF(function(gif_b64) {
      document.getElementById("animateText").value = "0";
      document.getElementById("animating").style.visibility = "hidden";

      outputImage = document.getElementById("output");
      outputImage.src = gif_b64;
    
      encoder.destroy();
    });
  }
  
  workingImage.delete();
}

function animateSingleWord(encoder, finalImage, workingImage, textRect, extraRows, extraCols, textImage, mask, darkMode) {
  encoder.setDelay(1 / 50); // TODO scale to number of pixels somehow so larger images take the same amount of time

  let currentRect = new cv.Rect(0, 0, textRect.width, textRect.height)
  let frames = 50;
  let x_frac = 0;
  let y_frac = 0;
  for (var frame = 0; frame <= frames; frame++) {
    finalImage.copyTo(workingImage); // Restore clean version - TODO use dirty rectangle approach to restore the part overwritten each frame

    var t = frame / frames;
    x_frac = Math.min(1.0, t / 0.8);
    if (t < 0.4) {
      y_frac = 1 - t / 0.4;
    } else if (t < 0.8) {
      y_frac = (t - 0.4) / 0.4
    } else if (t < 0.9) {
      y_frac = (0.5 - (t - 0.8)) / 0.5;
    } else {
      y_frac = (t - 0.5) / 0.5;
    }
    
    y_frac = Math.min(y_frac, 1.0) // In case of floating-point issues

    currentRect.x = extraCols - textRect.width + (x_frac * (textRect.x + textRect.width));
    currentRect.y = textRect.y + (y_frac * extraRows);
    
    let offsetDest = workingImage.roi(currentRect);
    if (darkMode) {
      cv.bitwise_or(offsetDest, textImage, offsetDest, mask);
    } else {
      cv.bitwise_and(offsetDest, textImage, offsetDest, mask);
    }       

    cv.imshow("textCanvas", workingImage);
    var tCtx = document.getElementById("textCanvas").getContext("2d")
    encoder.addFrameImageData(tCtx.getImageData(0, 0, finalImage.cols, finalImage.rows));
  }

  encoder.setDelay(0.5);
  encoder.addFrameImageData(tCtx.getImageData(0, 0, finalImage.cols, finalImage.rows));
}

function sanitizeFilename(input, replacement) {
  var illegalRe = /[\/\?<>\\:\*\|":]/g;
  var controlRe = /[\x00-\x1f\x80-\x9f]/g;
  var reservedRe = /^\.+$/;
  var windowsReservedRe = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i;

  var sanitized = input
    .replace(illegalRe, replacement)
    .replace(controlRe, replacement)
    .replace(reservedRe, replacement)
    .replace(windowsReservedRe, replacement);
  return sanitized.split("").splice(0, 255).join("");
}

function bubbleWord(textImage, color, removeText, animateText, darkMode, gapWidth, outlineThickness, blurRadius) {
  let shape = cv.Mat.zeros(textImage.rows, textImage.cols, cv.CV_8UC1);
  cv.cvtColor(textImage, shape, cv.COLOR_RGBA2GRAY, 0);
  cv.bitwise_not(shape, shape);

  // Make white image for border
  let borderImage = cv.Mat.zeros(textImage.rows, textImage.cols, cv.CV_8UC3);
  cv.bitwise_not(borderImage, borderImage);

  let contours = new cv.MatVector();
  let hierarchy = new cv.Mat();
  let contourImage = cv.Mat.zeros(textImage.rows, textImage.cols, cv.CV_8UC3);

  // Find and draw contours
  // RETR_EXTERNAL means it will fill in holes in letters like 'o' and 'a'
  // Draw thickly enough that the outside edge will be the center of the outline
  cv.findContours(
    shape,
    contours,
    hierarchy,
    cv.RETR_EXTERNAL,
    cv.CHAIN_APPROX_SIMPLE
  );
  cv.drawContours(
    contourImage,
    contours,
    -1,
    color,
    gapWidth + outlineThickness
  );

  // Flatten contour image into a grayscale image and make it white-on-black also
  cv.cvtColor(contourImage, shape, cv.COLOR_BGR2GRAY);
  cv.threshold(shape, shape, 0, 255, cv.THRESH_BINARY);

  // Find the outside edge of the contour we just drew
  // This will be the center of the outline
  cv.findContours(
    shape,
    contours,
    hierarchy,
    cv.RETR_EXTERNAL,
    cv.CHAIN_APPROX_SIMPLE
  );

  // Add outline to original image
  cv.drawContours(borderImage, contours, -1, color, outlineThickness);

  // Blur the border image to make it look less pixelated
  cv.GaussianBlur(
    borderImage,
    borderImage,
    new cv.Size(blurRadius, blurRadius),
    0,
    0,
    cv.BORDER_DEFAULT
  );

  if (!removeText) {
    // Combine the text and the border
    cv.bitwise_and(borderImage, textImage, borderImage);
  }

  if (darkMode) {
    cv.bitwise_not(borderImage, borderImage);
  }
  
  if (!animateText) {
    // Only delete the input text image if we are not animating
    textImage.delete();
  }

  shape.delete();
  contours.delete();
  hierarchy.delete();
  contourImage.delete();

  debugOutline(borderImage, new cv.Scalar(0, 0, 255));

  return borderImage;
}

function debugOutline(img, color) {
  if(DEBUG) {
    cv.rectangle(img, new cv.Point(0,0), new cv.Point(img.size().width-1, img.size().height-1), color);
  }
}

function submitFeedback() {
  const description = document.getElementById("feedbackDescription").value;
  data = {
    title: document.getElementById("feedbackTitle").value,
    email: document.getElementById("feedbackEmail").value,
    description
  };
  console.log(description);
  if (description) {
    feedbackDialog.close();
    const snackbar = document.getElementsByClassName("feedback-snackbar")[0];
    snackbar.style.bottom = 10;
    document
      .getElementsByClassName("feedback-snackbar-close")[0]
      .addEventListener("click", () => {
        snackbar.style.bottom = -100;
      });
    setTimeout(() => {
      snackbar.style.bottom = -100;
    }, 5000);
    var req = new XMLHttpRequest();
    req.open("POST", "/dG9tbXltYWx2ZWVrYXJ3Yg.html", true);
    req.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
    console.log("Submitting Feedback %s", JSON.stringify(data));
    req.send(JSON.stringify(data));
  } else {
    document
      .getElementsByClassName("feedback-error")[0]
      .classList.remove("hidden");
  }
}

function finalize() {
  document.getElementsByClassName("loader")[0].remove();
  document.getElementById("loadingBackground").remove();
  document.getElementById("animating").style.visibility = "hidden";
  renderImage();
}

window.onload = initializeSettings();
document.onload = finalize();
