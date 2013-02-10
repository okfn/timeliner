var localStorageKey = 'timeliner-creator';
var myList = localStorage.getItem(localStorageKey);
myList = myList ? JSON.parse(myList) : [];
var backupList = [];
renderList();
setDownloadData();

jQuery(function($) {
  $('.wp-search').typeahead({
    source: function(query, process) {
      queryWPTitles(query, process);
    },
    updater: function(item) {
      $('.loading').show();
      WIKIPEDIA.getData(item, function(data) {
        $('.loading').hide();
        addToList(data);
      });

      return item;
    },
    minLength: 3
  });

  $('.js-remove-all').on('click', function(e) {
    e.preventDefault();
    backupList = JSON.parse(JSON.stringify(myList));
    myList = [];
    save();
    renderList();
  });

});

function queryWPTitles(query, cb) {
  var data = {
    format: 'json',
    action: 'opensearch',
    search: query
  }
  var url = 'http://en.wikipedia.org/w/api.php';
  $.ajax({
    url: url,
    data: data,
    dataType: 'jsonp',
    success: function(data) {
      cb(data[1]);
    }
  });
}

function addToList(item) {
  delete item.raw;
  myList.push(item);
  save();
  renderList();
}

function save() {
  localStorage.setItem(localStorageKey, JSON.stringify(myList));
  localStorage.setItem(localStorageKey + '-backup', JSON.stringify(backupList));
  setDownloadData();
}

function renderList() {
  $('.selected').empty();
  $.each(myList, function(idx, item) {
    var $el = renderItem(item);
    $('.selected').append($el);
  });
};

function setDownloadData() {
  $('.js-download-all').attr('href', 'data:text/csv,xyz,abc');
}

function renderItem(info) {
  var $el = $('.results').clone();
  $el.show();

  var summaryInfo = info.summary;
  for (key in summaryInfo) {
    $el.find('.summary .' + key).text(summaryInfo[key]);
  }
  $el.find('.summary .thumbnail').attr('src', summaryInfo.image);
  return $el;
};
