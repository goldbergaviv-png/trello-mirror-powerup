window.TrelloPowerUp.initialize({
  'board-buttons': function(t) {
    return [{
      text: 'Mirror Settings',
      callback: function(t) {
        return t.popup({
          title: 'Mirror Configuration',
          url: './settings.html',
          height: 760
        });
      }
    }];
  },
  'show-settings': function(t) {
    return t.popup({
      title: 'Mirror Configuration',
      url: './settings.html',
      height: 760
    });
  }
});
