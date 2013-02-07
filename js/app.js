jQuery(function($) {
  $('form.js-load-url').submit(function(e) {
    e.preventDefault();
    var $form = $(e.target);
    var source = $form.find('input[name="source"]').val();
    var path = document.location.href.replace('/index.html', '');
    path +=  '/view/?backend=gdocs&url=' + source;
    document.location.href = path;
  });
});

// TODO: redirect for old view setup ...

