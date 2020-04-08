# client.js Explained

## Variables
---
```JavaScript
var beingShown = false; //whether the ui is visible
var skipTimeOut = false; //when true, the ui will stay visible
var timeout = null; //
var recentlyUsed = []; //keeps track of photos that have bee displayed and the order in which they were displayed and if they were local or remote; used for nav arrows
var recentlyRemote = []; // indices of images recently used remotely; used to prevent repeats
var recentlyLocal = []; //indices of images recently used locally; used to prevent repeats
var index; //index used to go back and forward through recently viewed images
var currentIndex = -1; //index of recently used
const fbPrefix = 'https://www.facebook.com/sharer/sharer.php?u='; //share link on facebook button is a hyperlink with this followed by the link to the item
const twPrefix = 'https://twitter.com/home?status='; //similar to fbPrefix
const bgPrefix = 'rgba(0, 0, 0, 0) url("'; //the background image is changed by changing the css, this is the first half of the css for the body tag
const bgSuffix = '") no-repeat fixed 50% 50% / cover padding-box'; //end of the body css
const emailPrefix = "mailto:?subject=Exploring%20the%20Library's%20Collections&body=" //similar to fbPrefix
const remote = 'https://s3.us-east-2.amazonaws.com/lclabspublicdata/imgBrowserExtPilot.json'; //address of S3 bucket
const local = 'pythonEnv/local.json' //location of local JSON file
```

## Basic jQuery
---
```JavaScript
$('*').mousemove(function() {
    //when the mouse moves, the user interface(nav arrows and bottom bar) and cursor are shown
    if (!beingShown) {
        showAll();
    }
});

function showAll() {
    $('#navbar-bottom').slideDown();
    $('#arrows').fadeIn();
    showCursor();
    beingShown = true;
}

function showCursor() {
    //unhides cursor and explicitly states what type of cursor to use
    $("*").css("cursor", "default");
    $('img').css('cursor', 'pointer');
    $('#add-info').css('cursor', 'pointer');
    $('button').css('cursor', 'pointer');
}

$('#info-btn img').mouseenter(function() {
    //shows message about images being free to use and reuse
    toggleText();
    skipTimeOut = true;
});

$('#info-btn img').mouseleave(function() {
    //hides message about images being free to use and reuse
    toggleText();
    skipTimeOut = false;
});

function toggleText() {
    //toggels message about images being free to use and reuse
    console.log('toggling text');
    $('#free-to-use').toggle();
}

$(document).on('mousemove', function() {
    //hides ui and cursor after 2 seconds of being still
    clearTimeout(timeout);
    timeout = setTimeout(function() {
        if (skipTimeOut == false) {
            console.log('Mouse idle for 2 sec');
            hideAll();
        }
    }, 2000);
});

function hideAll() {
    //hides ui so that only background image is visible
    console.log('hide all called');
    $('#navbar-bottom').slideUp();
    $('#arrows').fadeOut();
    $('*').css('cursor', 'none');
    //console.log($('*').css('cursor'))
    beingShown = false;
}

$('#arrows').mouseenter(function() {
    //ui can't be hidden when the user's mouse is over the nav arrows
    skipTimeOut = true;
});

$('#arrows').mouseleave(function() {
    //ui can be hidden after mouse leaves nav arrows
    skipTimeOut = false;
});

function hideRemoteIcons() {
    //without internet connection, no need to be able to share photos
    $('#fb').hide();
    $('#tw').hide();
    $('#email').hide();
}

function showRemoteIcons() {
    //allow sharing when connected to the internet
    $('#fb').show();
    $('#tw').show();
    $('#email').show();
}

```
## Reading the JSON and changing state
---
```JavaScript
$(document).ready(function() {
  $.getJSON(remote, function(data) {
      remoteData = data;
    })
    .fail(function() {
      useLocal();
    });
  useRemote();
}); //when the document is loaded, an ajax call is made, if the json file cannot be read, useLocal is called, otherwise use remote is

function useRemote() {
    //changes background to random from remote json
    $.getJSON(remote, function(data) { //this is an ajax call that saves the json file into an array of objects called data
            do {
                index = Math.floor(Math.random() * data.length); //generates random number less than the length of data
            } while (recentlyRemote.includes(index)); //does this until it gets one that hasn't been used
            testImage(data[index]['imageURL']); //check if photo can be loaded
        })
        .fail(function() { //if the file can't be read from the S3 bucket, uses local images and info
            useLocal();
        });

function testImage(URL, data, index) {
    var tester = new Image();
    tester.onload = finishRemote; //if photo loads update state from remote
    tester.onerror = useLocal; //if photo doesn't load, there is no internet connection, use local
    tester.src = URL;
}

function finishRemote(data, index){
    showRemoteIcons(); //display email, facebook, and twitter buttons
    insertImageURL(data[index]['imageURL']);
    insertURL(data[index]['url']);
    insertTitleYear(data[index]['title'], data[index]['year']);
    recentlyUsed.push([index, 'r']); //adds the index and value and an r for 'remote' to recentlyUsed
    recentlyRemote.push(index); //adds the index to recently remote
    currentIndex++; //increment currentIndex
    if (recentlyRemote.length === data.length) { //if every object in data has been used (very unlikely someone will click through all)
        recentlyRemote = []; //clear recently remote
    }
}

function useLocal() {
    //changes background to random from local json
    $.getJSON(local, function(data) {
        console.log('using local');
        do {
            var index = Math.floor(Math.random() * data.length);
        } while (recentlyLocal.includes(index));
        hideRemoteIcons(); //hide sharing icons when offline
        insertImageURL(data[index]['imageURL']);
        $('#add-info').empty();
        $('#add-info').append(data[index]['title']);
        recentlyUsed.push([index, 'l'])
        currentIndex++;
        recentlyLocal.push(index);
        if (recentlyLocal.length === data.length) {
            recentlyLocal = [];
        }
    });
}

function updateState(bgImage, url, title, year) {
    $('#dwnld').attr('href', bgImage); //changes the link in the download button to the new photo
    $('body').css('background', bgPrefix + bgImage + bgSuffix); //changes the background to the new image by altering css
    $('#add-info').attr('href', url); //changes the hyperlink to the item on loc.gov
    $('#fb').attr('href', fbPrefix + url); //changes link for facebook button
    $('#tw').attr('href', twPrefix + url); //changes link for twitter button
    $('#email').attr('href', emailPrefix + url); //changes link for email
    $('#add-info').empty();
    $('#add-info').append(title + ' | ' + year); //puts title and year into bottom bar
}

function insertImageURL(bgImage) {
    $('#dwnld').attr('href', bgImage); //change url for image download
    $('body').css('background', bgPrefix + bgImage + bgSuffix); //change background by changing css
}

function insertURL(url) {
    $('#add-info').attr('href', url); //change url for link to loc.gov
    $('#fb').attr('href', fbPrefix + url); //change url for facebook button
    $('#tw').attr('href', twPrefix + url); //change url for twitter button
    $('#email').attr('href', emailPrefix + url); //change url for email button
}

function insertTitleYear(title, year) {
    $('#add-info').empty();
    $('#add-info').append(title + ' | ' + year); //changes title and year in bottom bar
}
```

## Navigation Arrows
```JavaScript
$('#leftarrow').click(function() {
    var index = recentlyUsed[currentIndex - 1][0]; //index in remote or local file
    var type = recentlyUsed[currentIndex - 1][1]; //whether it was remote 'r', or local 'l'
    goBack(index, type);
});

function goBack(index, type) {
    //moves backward through recentlyUsed to change pictures
    if (type === 'l') {
        $.getJSON(local, function(data) { //ajax call
            insertImageURL(data[index]['imageURL']); //uses index from recentlyUsed as index in data to get urls, title, and year
            insertURL(data[index]['url']);
            insertTitleYear(data[index]['title'], data[index]['year']);
            currentIndex--; //current index decreases by one
        })
    } else if (type === 'r') { //same function but uses recentlyRemote instead
        $.getJSON(remote, function(data) {
            insertImageURL(data[index]['imageURL']);
            insertURL(data[index]['url']);
            insertTitleYear(data[index]['title'], data[index]['year']);
            currentIndex--;
        })
    }
}

$('#rightarrow').click(function() {
    if (currentIndex < recentlyUsed.length - 1) { //when the user has gone backward
        goForward();
    } else { //if the index being used is the most last in recent
        useRemote(); //generate new random image
    }
});

function goForward() {
    //moves forward through recently used to change photos
    index = recentlyUsed[currentIndex + 1][0]; //changes index to the next index in recentlyUsed
    if (recentlyUsed[currentIndex + 1][1] === 'l') {
        $.getJSON(local, function(data) { //ajax call
            insertImageURL(data[index]['imageURL']); //uses index to change state
            insertURL(data[index]['url']);
            insertTitleYear(data[index]['title'], data[currentIndex + 1]['year']);
            currentIndex++; //increment index
        })
    } else if (recentlyUsed[currentIndex + 1][1] === 'r') { //same but with remote json
        $.getJSON(remote, function(data) {
            insertImageURL(data[index]['imageURL']);
            insertURL(data[index]['url']);
            insertTitleYear(data[index]['title'], data[currentIndex + 1]['year']);
            currentIndex++;
        })
    }
}
```
