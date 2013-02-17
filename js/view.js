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
          media: record.get('image')
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
