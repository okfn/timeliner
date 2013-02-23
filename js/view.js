jQuery(function($) {
  var state = recline.View.parseQueryString(decodeURIComponent(window.location.search));
  if (state) {
    _.each(state, function(value, key) {
      try {
        value = JSON.parse(value);
      } catch(e) {}
      state[key] = value;
    });
  }
  state.backend = 'gdocs';
  if (state.embed!=undefined) {
    $('body').addClass('embed');
  }
  var dataset = new recline.Model.Dataset(state);
  var timeliner = new TimelinerView({
    model: dataset,
    el: $('.data-views')
  });
  timeliner.render();

  $('.js-embed').on('click', function(e) {
    e.preventDefault();
    var url = window.location.href + '&embed=1';
    var val = '<iframe src="' + url + '" frameborder="0" style="border: none;" width="100%" height="780;"></iframe>';
    $('.embed-modal textarea').val(val);
    $('.embed-modal').modal();  
  });
});

var TimelinerView = Backbone.View.extend({
  events: {
    'click .controls .js-show-toolbox': '_onShowToolbox',
    'submit .toolbox form': '_onSearch'
  },

  _onShowToolbox: function(e) {
    e.preventDefault();
    if (this.$el.find('.toolbox').hasClass('hideme')) {
      this.$el.find('.toolbox').removeClass('hideme');
    } else {
      this.$el.find('.toolbox').addClass('hideme');
    }
  },

  _onSearch: function(e) {
    e.preventDefault();
    var query = this.$el.find('.text-query input').val();
    this.model.query({q: query});
  },

  render: function() {
    var self = this;
    // explicitly set width as otherwise Timeline does extends a bit too far (seems to use window width rather than width of actual div)
    // $el.width((this.el.width() - 45)/2.0);
    this.timeline = new recline.View.Timeline({
      model: this.model,
      el: this.$el.find('.timeline')
    });
    this.timeline.convertRecord = function(record, fields) {
      if (record.attributes.start[0] == "'") {
        record.attributes.start = record.attributes.start.slice(1);
      }
      if (record.attributes.end[0] == "'") {
        record.attributes.end = record.attributes.end.slice(1);
      }
      try {
        var out = this._convertRecord(record, fields);
      } catch (e) {
        out = null;
      }
      if (!out) {
        alert('Failed to extract date from: ' + JSON.stringify(record.toJSON()));
        return null;
      }
      if (record.get('image')) {
        out.asset = {
          media: record.get('image'),
	  thumbnail: record.get('icon')
        };
      }
      out.text = record.get('description');
      if (record.get('source')) {
        var s = record.get('source');
        if (record.get('sourceurl')) {
          s = '<a href="' + record.get('sourceurl') + '">' + s + '</a>';
        }
        out.text += '<p class="source">Source: ' + s + '</p>';
      }
      // hacky but it will work ...
      // do not want time part of the dates
      out.startDate = String(out.startDate.getFullYear()) + ',' + String(out.startDate.getMonth()+1) + ',' + String(out.startDate.getDate());
      return out;
    }
    this.timeline.render();

    this.map = new recline.View.Map({
      model: this.model
    });
    this.$el.find('.map').append(this.map.el);

    // customize with icon column
    this.map.infobox = function(record) {
      if (record.icon!== undefined) {
        return '<img src="' + record.get('icon') + '" width="100px"> ' +record.get('title');
      }
      return record.get('title');
    };

    this.map.geoJsonLayerOptions.pointToLayer = function(feature, latlng) {
      var marker = new L.Marker(latlng);
      var record = this.model.records.getByCid(feature.properties.cid).toJSON();
      marker.bindLabel(record.title);

      // customize with icon column
      if (record.icon!== undefined) {
	var eventIcon = L.icon({
	    iconUrl: record.icon,
	    iconSize:     [100, 20], // size of the icon
	    iconAnchor:   [22, 94], // point of the icon which will correspond to marker's location
	    shadowAnchor: [4, 62],  // the same for the shadow
	    popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
	});
        marker.setIcon(eventIcon);
      }

      
      // this is for cluster case
      this.markers.addLayer(marker);
      return marker;
    };
    this.map.render();

    // load the data
    this.model.fetch()
      .done(function() {
        var title = self.model.get('spreadsheetTitle');
        $('.navbar .brand').text(title);
        document.title = title + ' - Timeliner';

        // set up twitter share button
        // do this here rather than in page so it picks up title correctly
        !function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0];if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src="//platform.twitter.com/widgets.js";fjs.parentNode.insertBefore(js,fjs);}}(document,"script","twitter-wjs");
      });
  }
});
