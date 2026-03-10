window.TrelloPowerUp.initialize({
  'board-buttons': function(t) {
    return [{
      text: 'Mirror Settings',
      callback: function(t) {
        return t.popup({
          title: 'Mirror Configuration',
          url: './settings.html?v=8',
          height: 820
        });
      }
    }];
  },
  'show-settings': function(t) {
    return t.popup({
      title: 'Mirror Configuration',
      url: './settings.html?v=8',
      height: 820
    });
  }
});
