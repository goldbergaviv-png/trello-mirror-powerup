window.TrelloPowerUp.initialize({
  'board-buttons': function(t, opts) {
    return [{
      text: 'Mirror Settings',
      callback: function(t) {
        return t.popup({
          title: 'Mirror Configuration',
          url: './settings.html',
          height: 560
        });
      }
    }];
  }
});
