var FILES = 10;

function log(message) {
   // document.getElementById('log').textContent += message + '\n';
   console.log(message);
}

function file_content(filename, content) {
   document.getElementById('file-contents').textContent += filename + ' => ' + content + '\n';
}

function show_archive_folder() {
   get_folderid(function(folder_id) {
      if (folder_id) {
         document.getElementById('archive-folder').textContent = folder_id;
      } else {
         document.getElementById('archive-folder').textContent = "not set";
      }});
}

function get_folderid(callback) {
   chrome.storage.local.get(['folder'], function(result) {
      log('folder_id: ' +result.folder);
      callback(result.folder);
   });
}

function restore_to_local_storage(entry, fs) {
   get_folderid(function(folder_id){
      chrome.fileSystem.restoreEntry(folder_id, function(folder) {
         log('copying ' +entry.name+' ==> ' + fs.root.name +'/'+entry.name);
         entry.copyTo(fs.root, entry.name,
            function(entry) {
               log('copied ' +entry.name+' ==> ' + fs.root.name +'/'+entry.name);
            }, function(e) {
               log('Failed copying: '+e);
            });
      });
   });
}

function restore_archive(fs) {
   let entries = [];
   get_folderid(function (folder_id) {
      chrome.fileSystem.restoreEntry(folder_id, function(folder) {
         let dirReader = folder.createReader();

         let getEntries = function() {
         dirReader.readEntries(function(entries) {
            entries.forEach(function(entry) {
               if (entry.name.match(/^test[0-9][0-9]?.txt$/)) {
                  log("found entry " + entry.fullPath);
                  restore_to_local_storage(entry, fs);
               }
            });
         }, function(error) {
            log("Error reading dir " + error);
         });
         };

         getEntries();
      });
   });
}

function read_file(entry, contentsCallback) {
   entry.file(function (file) {
      let reader = new FileReader();
      reader.onload = function() {
         contentsCallback(entry.name, reader.result);
      };
      reader.onerror = function() {
         log('Error reading file' + entry.name + ' ' + reader.error);
      };
      reader.readAsText(file);
   }, function(e) {
      log('Could not read file ' + entry.name + ' error ' +e);
   });
}

function read_files(filesystem, contentsCallback) {
   let dirReader = filesystem.root.createReader();

   let getEntries = function() {
      dirReader.readEntries(function(entries) {
         entries.forEach(function(entry) {
            log("found entry " + entry.fullPath);
            read_file(entry, contentsCallback);
         });
      }, function(error) {
         log("Error reading dir " + error);
      });
   };

   getEntries();
}

window.onload = function() {
   show_archive_folder();

   document.getElementById('read-files').onclick = function() {
      window.webkitRequestFileSystem(
         PERSISTENT,
         FILES*10,
         function(fs) {
            log('Filesystem: ' + fs);
            read_files(fs, file_content);
         },
         function(e) { log('Filesystem error' + e);}
      );
   }

   document.getElementById('restore-files').onclick = function() {
      navigator.webkitPersistentStorage.requestQuota(
         FILES * 10,
         function(grantedBytes) { log('Granted quota ' + grantedBytes) },
         function(e) { log('Granted quota error : ' + e); });
      window.webkitRequestFileSystem(
         PERSISTENT,
         FILES * 10,
         function(fs) {
            log('Filesystem: ' + fs);
            restore_archive(fs);
         },
         function(e) { log('Filesystem error' + e);}
      );
   };

   document.getElementById('choose-folder').onclick = function() {
      log('choose folder..');
      chrome.fileSystem.chooseEntry({ type: "openDirectory" }, function(entry) {
         chrome.storage.local.set({ folder: chrome.fileSystem.retainEntry(entry) }, function() {
           log('Folder '+entry.name+' is saved.');
           show_archive_folder();
         });
      });
   };

   // to allow a kiosk app to close
   if (document.querySelector('#reset')) {
     document.querySelector('#reset').onclick = function() {
        window.close();
      };
   }
}


