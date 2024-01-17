function setActive () {
  chrome.storage.sync.get(['isActive'], function(item){
    if (item !== undefined && item !== null && item.isActive === true){
      chrome.action.setBadgeText({ text: '' });
      chrome.storage.sync.set({ isActive: false });
    }
    else{
      chrome.action.setBadgeText({ text: 'ON' });
      chrome.storage.sync.set({ isActive: true });
    }
    window.close();
  });
}

window.onload = () => {
  document.getElementById('activate').addEventListener('click', setActive);
    chrome.storage.sync.get(['isActive'], function(item){
	console.log(item);
    if (item === undefined || item === null || item.isActive === undefined || item.isActive === null || item.isActive === false){
	  document.getElementById('activate').innerHTML  = 'ON'
    }
    else{
	  document.getElementById('activate').innerHTML  = 'OFF'
    }
  });
}