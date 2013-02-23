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
    item.summary.source = 'Wikipedia';
    item.summary.source_url = 'http://en.wikipedia.org/wiki/' + item.dbpediaUrl.split('/')[5];
    this.create(item.summary);
  }
});

var ItemListView = Backbone.View.extend({
  initialize: function() {
    var that = this;
    this.collection.bind('all', function(e) {
      that.onChange();
    });
    that.onChange();

    $('.js-remove-all').on('click', function(e) {
      e.preventDefault();
      that.collection.each(function(item) {
        item.destroy();
      });
      that.collection.reset([]);
    });
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
    });

    return this;
  },

  templateItem: ' \
    <div class="results"> \
      <div class="summary well"> \
        <img src="" class="thumbnail" style="float: right;" /> \
        <div class="map"></div> \
        <h4> \
          <span class="title"></span> \
        </h4> \
        <p> \
          Type: <span class="type"></span> \
          <br /> \
          Place: <span class="place"></span> \
          <br /> \
          Geolocation: <span class="geolocation"></span> <a href="#" class="js-edit-location" style="display: none;">Edit</a>  \
          <br /> \
          Dates: <span class="start"></span> &mdash; <span class="end"></span> \
        </p> \
        <p class="summary"></p> \
        <div style="clear: both;"></div> \
        <button class="delete btn btn-danger">Delete</button> \
      </div> \
    </div> \
  ',

  renderItem: function(info) {
    var that = this;
    var $el = $(this.templateItem);
    $('.selected').prepend($el);

    var deleteButton = $el.find('.delete');
    deleteButton.data('item-id', info['id']);
    deleteButton.click(function(e) {
      var itemId = $(this).data('item-id');
      var item = that.collection.get(itemId);
      item.destroy();
    });

    for (key in info) {
      $el.find('.summary .' + key).text(info[key]);
    }
    $el.find('.summary .thumbnail').attr('src', info.image);
    $el.find('.geolocation').html('Unknown');
    if (info.location && info.location.lat) {
      var latlng = [info.location.lat, info.location.lon];
      $el.find('.geolocation').html(JSON.stringify(latlng));
      var $map = $el.find('.map')[0];
      var map = L.map($map).setView(latlng, 9);

      var mapUrl = "http://otile{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png";
      var bg = new L.TileLayer(mapUrl, {maxZoom: 18, subdomains: '1234'});
      map.addLayer(bg);

      L.marker(latlng).addTo(map);
    }
    return $el;
  },

  setDownloadData: function() {
    var fields = [ 'Title', 'Start', 'End', 'Image', 'Place', 'Location', 'Description', 'Source', 'Source_URL'];
    var out = [];
    out.push(fields);
    this.collection.each(function(item) {
      item = item.toJSON();
      var row = $.map(fields, function(field) {
        if (field == 'Description') {
          field = 'summary';
        }
        if (field == 'Location') {
          if (item.location.lat) {
            return '' + item.location.lat + ',' + item.location.lon;
          } else {
            return ''
          }
        } else {
          var out = item[field.toLowerCase()];
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


