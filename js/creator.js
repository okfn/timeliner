jQuery(function($) {
  var theList = new ItemList();
  theList.fetch();
  var listView = new ItemListView({
    collection: theList
  });

  $('.wp-search').typeahead({
    source: function(query, process) {
      queryWPTitles(query, process);
    },
    updater: function(item) {
      $('.loading').show();
      WIKIPEDIA.getData(item, function(data) {
        $('.loading').hide();
        theList.addFromWP(data);
      });

      return item;
    },
    minLength: 3
  });

  $('.js-remove-all').on('click', function(e) {
    e.preventDefault();
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

var Item = Backbone.Model.extend({
});

var ItemList = Backbone.Collection.extend({
  model: Item,
  localStorage: new Backbone.LocalStorage('TimelinerCreator'),

  addFromWP: function(item) {
    delete item.raw;
    this.create(item);
  }
});

var ItemListView = Backbone.View.extend({
  initialize: function() {
    var that = this;
    this.collection.bind('add', function(e) {
      that.onChange();
    });
    this.collection.bind('change', function(e) {
      that.onChange();
    });
    that.onChange();
  },

  onChange: function() {
    this.render();
    this.setDownloadData();
  },

  render: function() {
    var that = this;
    $('.selected').empty();
    this.collection.each(function(item) {
      var $el = that.renderItem(item.toJSON());
      $('.selected').append($el);
    });

    return this;
  },

  templateItem: ' \
    <div class="results"> \
      <div class="summary well"> \
        <img src="" class="thumbnail" style="float: right;" /> \
        <h4> \
          <span class="title"></span> \
        </h4> \
        <p> \
          Type: <span class="type"></span> \
          <br /> \
          Location: <span class="place"></span> \
          <br /> \
          Dates: <span class="start"></span> &mdash; <span class="end"></span> \
        </p> \
        <p class="summary"></p> \
        <div style="clear: both;"></div> \
      </div> \
    </div> \
  ',

  renderItem: function(info) {
    var $el = $(this.templateItem);

    var summaryInfo = info.summary;
    for (key in summaryInfo) {
      $el.find('.summary .' + key).text(summaryInfo[key]);
    }
    $el.find('.summary .thumbnail').attr('src', summaryInfo.image);
    return $el;
  },

  setDownloadData: function() {
    var fields = [ 'Title', 'Start', 'End', 'Image', 'Place', 'Location', 'Description'];
    var out = [];
    out.push(fields);
    this.collection.each(function(item) {
      item = item.toJSON();
      var row = $.map(fields, function(field) {
        if (field == 'Description') {
          field = 'summary';
        }
        if (field == 'Location') {
          // TODO: sort this out
          return '';
        } else {
          var out = item.summary[field.toLowerCase()];
          return out ? out : '';
        }
      });
      out.push(row);
    });
    var csv = recline.Backend.CSV.serializeCSV(out);
    csv = encodeURIComponent(csv);
    $('.js-download-all').attr('href', 'data:text/csv;charset=utf8,' + csv);
  }

});


