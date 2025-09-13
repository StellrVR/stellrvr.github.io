// onionring.js is made up of four files - onionring-widget.js, onionring-index.js, onionring-variables.js (this one!), and onionring.css
// it's licensed under the cooperative non-violent license (CNPL) v4+ (https://thufie.lain.haus/NPL.html)
// it was originally made by joey + mord of allium (è’œ) house, last updated 2020-11-24

// === ONIONRING-VARIABLES ===
//this file contains the stuff you edit to set up your specific webring

//the full URLs of all the sites in the ring
var sites = [
    'https://july.lol',
    'https://kasperspace.nekoweb.org',
    'https://lessthanthree.online',
    'https://thecozy.cat/',
    'https://astralily.nekoweb.org/',
    'https://mlg.2000.hu',
    'https://sclptures.neocities.org',
    'https://ninepsi.nekoweb.org/',
    'https://webemez.neocities.org/',
    'https://andromeda-galaxy.ch/',
    'https://viktorious-diem.neocities.org/',
    'https://wolfsbane.nekoweb.org',
    'https://cossechan.nekoweb.org'
    ];
    
    //the name of the ring
    var ringName = 'VRRing';
    
    /* the unique ID of the widget. two things to note:
     1) make sure there are no spaces in it - use dashes or underscores if you must
     2) remember to change 'webringid' in the widget code you give out and all instances of '#webringid' in the css file to match this value!*/
    var ringID = 'vrring';
    
    //should the widget include a link to an index page?
    var useIndex = false;
    //the full URL of the index page. if you're not using one, you don't have to specify anything here
    var indexPage = 'https://july.lol/vrring/home.html';
    
    //should the widget include a random button?
    var useRandom = true;
    