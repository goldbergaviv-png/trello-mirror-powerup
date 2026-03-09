window.TrelloPowerUp.initialize({

  'board-buttons': function (t) {
    return [{
      icon: 'https://cdn-icons-png.flaticon.com/512/1828/1828919.png',
      text: 'Mirror Settings',
      callback: function (t) {
        return t.popup({
          title: 'Mirror Configuration',
          url: './settings.html',
          height: 500
        });
      }
    }];
  }

});
