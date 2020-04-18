import jquery from "jquery";
window.$ = window.jQuery = jquery;
// import "bootstrap/css/bootstrap.min.css";

$(document).ready(function() {
  console.log('client connected');
  $.getJSON(remote, function(data) {
      remoteData = data;
    })
    .fail(function() {
      useLocal();
    });
  useRemote();
});
var beingShown = false; //state of whether the ui is visible
var skipTimeOut = false; //when true, the ui will stay visible
var timeout = null;
var recentlyUsed = []; //keeps track of photos that have bee displayed and the order in which they were displayed and if they were local or remote
var recentlyRemote = []; // indices of images recently used remotely
var recentlyLocal = []; //indices of images recently used locally
var index; //index used to go back and forward through recently viewed images
var currentIndex = -1; //index of recently used
var remoteData;
const fbPrefix = 'https://www.facebook.com/sharer/sharer.php?u=';
const twPrefix = 'https://twitter.com/intent/tweet?url=';
const bgPrefix = 'rgba(0, 0, 0, 0) url("';
const bgSuffix = '") no-repeat fixed 50% 50% / cover padding-box';
const emailPrefix = "mailto:?subject=Auckland Museum collections&body=";
const remote = 'https://raw.githubusercontent.com/AucklandMuseum/ChromeNewTabExtension/master/images.json';
const local = 'local.json'

$('*').mousemove(function() {
  if (!beingShown) {
    showAll();
  }
});

$('#rightarrow').click(function() {
  if (currentIndex < recentlyUsed.length - 1) {
    goForward();
  } else {
    useRemote();
  }
});
$('#leftarrow').click(function() {
  var index = recentlyUsed[currentIndex - 1][0]; //index in remote or local file
  var type = recentlyUsed[currentIndex - 1][1]; //whether it was remote 'r', or local 'l'
  console.log(index.toString() + ' ' + type);
  goBack(index, type);
});

function goForward() {
  //moves forward through recently used to change photos
  console.log('going forward');
  index = recentlyUsed[currentIndex + 1][0];
  if (recentlyUsed[currentIndex + 1][1] === 'l') {
    $.getJSON(local, function(data) {
      $('#add-info').empty();
      $('#add-info').append(data[index]['title']);
      currentIndex++;
    })
  } else if (recentlyUsed[currentIndex + 1][1] === 'r') {
    $.getJSON(remote, function(data) {
      insertImageURL(data[index]['imageURL']);
      insertURL(data[index]['url']);
      insertTitle(data[index]['title']);
      currentIndex++;
    })
  }
}

function goBack(index, type) {
  //moves backward through recentlyUsed to change pictures
  if (type === 'l') {
    $.getJSON(local, function(data) {
      console.log('using remote');
      console.log(data[index]['imageURL']);
      insertImageURL(data[index]['imageURL']);
      $('#add-info').empty();
      $('#add-info').append(data[index]['title']);
      currentIndex--;
    })
  } else if (type === 'r') {
    $.getJSON(remote, function(data) {
      console.log('using remote');
      console.log(data[index]['imageURL']);
      insertImageURL(data[index]['imageURL']);
      insertURL(data[index]['url']);
      insertTitle(data[index]['title']);
      currentIndex--;
    })
  }
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

$(document).on('mousemove', function() {
  //hides cursor after 2 seconds of being still
  clearTimeout(timeout);
  timeout = setTimeout(function() {
    if (skipTimeOut == false) {
      console.log('Mouse idle for 2 sec');
      hideAll();
    }
  }, 2000);
});

$('#arrows').mouseenter(function() {
  //ui can't be hidden when the user's mouse is over the nav arrows
  skipTimeOut = true;
});

$('#arrows').mouseleave(function() {
  //ui can be hidden after mouse leaves nav arrows
  skipTimeOut = false;
});

function showAll() {
  //dispalys ui
  console.log('show all called');
  $('#navbar-bottom').slideDown();
  $('#arrows').fadeIn();
  showCursor();
  beingShown = true;
}

function hideAll() {
  //hides ui so that only background image is visible
  console.log('hide all called');
  $('#navbar-bottom').slideUp();
  $('#arrows').fadeOut();
  $('*').css('cursor', 'none');
  //console.log($('*').css('cursor'))
  beingShown = false;
}

function toggleText() {
  //toggels message about images being free to use and reuse
  console.log('toggling text');
  $('#free-to-use').toggle();
}

function showCursor() {
  //unhides cursor
  $("*").css("cursor", "default");
  $('img').css('cursor', 'pointer');
  $('#add-info').css('cursor', 'pointer');
  $('button').css('cursor', 'pointer');
}

function useRemote() {
  //changes background to random from remote json
  $.getJSON(remote, function(data) {
      do {
        index = Math.floor(Math.random() * data.length);
      } while (recentlyRemote.includes(index));
      testImage(data[index]['imageURL']);
    })
    .fail(function() {
      useLocal();
    });
}

function useLocal() {
  //changes background to random from local json
  $.getJSON(local, function(data) {
    console.log('using local');
    do {
      var index = Math.floor(Math.random() * data.length);
    } while (recentlyLocal.includes(index));
    hideRemoteIcons();
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

function insertImageURL(bgImage) {
  $('#dwnld').attr('href', bgImage);
  $('body').css('background', bgPrefix + bgImage + bgSuffix);
}

function insertURL(url) {
  $('#add-info').attr('href', url);
  $('#fb').attr('href', fbPrefix + url);
  $('#tw').attr('href', twPrefix + url);
  $('#email').attr('href', emailPrefix + url);
}

function insertTitle(title) {
  $('#add-info').empty();
  $('#add-info').append(title);
}

function updateState(bgImage, url, title) {
  $('#dwnld').attr('href', bgImage);
  $('body').css('background', bgPrefix + bgImage + bgSuffix);
  $('#add-info').attr('href', url);
  $('#fb').attr('href', fbPrefix + url);
  $('#tw').attr('href', twPrefix + url);
  $('#email').attr('href', emailPrefix + url);
  $('#add-info').empty();
  $('#add-info').append(title);
}

function hideRemoteIcons() {
  $('#fb').hide();
  $('#tw').hide();
  $('#email').hide();
}

function showRemoteIcons() {
  $('#fb').show();
  $('#tw').show();
  $('#email').show();
}

function testImage(URL) {
  var tester = new Image();
  tester.src = URL;
  tester.onerror = useLocal;
  tester.onload = finishRemote;
}

function finishRemote() {
  showRemoteIcons();
  insertImageURL(remoteData[index]['imageURL']);
  insertURL(remoteData[index]['url']);
  insertTitle(remoteData[index]['title']);
  recentlyUsed.push([index, 'r']);
  recentlyRemote.push(index);
  currentIndex++;
  if (recentlyRemote.length === remoteData.length) {
    recentlyRemote = [];
  }
}
