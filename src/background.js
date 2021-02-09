chrome.app.runtime.onLaunched.addListener(function() {
 var options = {
   'id': 'Test File Producer App',
   'bounds': {
     'width': 1024,
     'height': 768
   }
 };
 chrome.app.window.create('main.html', (options));
});
