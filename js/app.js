jQuery(function($) {
  window.Timeliner = new Timeliner({
    el: $('.recline-app')
  })
});

var Timeliner = Backbone.View.extend({
  events: {
    'submit form.js-load-url': '_onLoadURL'
  },

  initialize: function() {
    this.el = $(this.el);
    this.timeline = null;
    this.explorerDiv = $('.data-views');
    _.bindAll(this, 'viewExplorer', 'viewHome');

    this.router = new Backbone.Router();
    this.router.route('', 'home', this.viewHome);
    this.router.route(/explorer/, 'explorer', this.viewExplorer);
    Backbone.history.start();

    var state = recline.View.parseQueryString(decodeURIComponent(window.location.search));
    if (state) {
      _.each(state, function(value, key) {
        try {
          value = JSON.parse(value);
        } catch(e) {}
        state[key] = value;
      });
    }
    var dataset = null;
    if (state.dataset || state.url) {
      dataset = recline.Model.Dataset.restore(state);
    }
    if (dataset) {
      this.createExplorer(dataset);
    }
  },

  viewHome: function() {
    this.switchView('home');
  },

  viewExplorer: function() {
    this.router.navigate('explorer');
    this.switchView('explorer');
  },

  switchView: function(path) {
    $('.backbone-page').hide(); 
    var cssClass = path.replace('/', '-');
    $('.page-' + cssClass).show();
  },

  // make Explorer creation / initialization in a function so we can call it
  // again and again
  createExplorer: function(dataset) {
    var self = this;
    // remove existing data explorer view
    var reload = false;
    if (this.timeline) {
      this.timeline.remove();
      reload = true;
    }
    this.timeline = null;
    var $el = $('.data-views .timeline');
    // explicitly set width as otherwise Timeline does extends a bit too far (seems to use window width rather than width of actual div)
    // $el.width((this.el.width() - 45)/2.0);
    this.timeline = new recline.View.Timeline({
      model: dataset,
      el: $el
    });
    this.timeline.render();
    this.timeline.convertRecord = function(record, fields) {
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

    this.map = new recline.View.Map({
      model: dataset
    });
    this.explorerDiv.append(this.map.el);
    this.map.render();

    // show the view
    this.viewExplorer();
    // load the data
    dataset.fetch();
  },

  _onLoadURL: function(e) {
    e.preventDefault();
    var $form = $(e.target);
    var source = $form.find('input[name="source"]').val();
    window.location.search = '?backend=gdocs&url=' + source;
//    var datasetInfo = {
//      id: 'my-dataset',
//      url: source
//    };
//    var dataset = new recline.Model.Dataset(datasetInfo, 'gdocs');
//    this.createExplorer(dataset);
  }
});

