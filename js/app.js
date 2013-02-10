jQuery(function($) {
  $('form.js-load-url').submit(function(e) {
    e.preventDefault();
    var $form = $(e.target);
    var source = $form.find('input[name="source"]').val();
    var path = window.location.href.replace('/index.html', '');
    if (path[path.length - 1] != '/') {
      path += '/';
    }
    path +=  'view/?url=' + encodeURIComponent(source);
    window.location.href = path;
  });
});

// Backwards compatability (pre Feb 2013)
// Redirect from old timeliner urls to new ones
if (window.location.search) {
  var path = window.location.href.replace(/\/index.html/, '');
  path = path.replace(/\?.*/g, '');
  if (path[path.length - 1] != '/') {
    path += '/';
  }
  path +=  'view/' + window.location.search;
  window.location.href = path;
}

